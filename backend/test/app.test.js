const { after, test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const fs = require('node:fs/promises');
const { mkdtempSync, rmSync } = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const storageDirectory = mkdtempSync(path.join(os.tmpdir(), 'dms-backend-test-'));
process.env.STORAGE_DIR = storageDirectory;
process.env.DEFAULT_DOCUMENT_OWNER = 'test-owner';
process.env.MAX_UPLOAD_BYTES = '32';

const app = require('../src/app');

after(async () => {
  await fs.rm(storageDirectory, { recursive: true, force: true });
});

test('faz upload, lista e baixa documentos, tratando erros esperados', async (context) => {
  const server = app.listen(0);
  await once(server, 'listening');
  context.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));

  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const healthResponse = await fetch(`${baseUrl}/health`);
  assert.equal(healthResponse.status, 200);
  assert.deepEqual(await healthResponse.json(), { status: 'ok' });

  const emptyListResponse = await fetch(`${baseUrl}/documents`);
  assert.deepEqual(await emptyListResponse.json(), { documents: [] });

  const missingFileResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: new FormData(),
  });
  assert.equal(missingFileResponse.status, 400);
  assert.equal((await missingFileResponse.json()).error.code, 'FILE_REQUIRED');

  const invalidUploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file: 'not multipart' }),
  });
  assert.equal(invalidUploadResponse.status, 400);
  assert.equal((await invalidUploadResponse.json()).error.code, 'INVALID_UPLOAD');

  const excessiveFieldsForm = new FormData();
  for (let index = 0; index < 11; index += 1) {
    excessiveFieldsForm.append(`field-${index}`, 'ignored');
  }
  excessiveFieldsForm.append('file', new Blob(['content']), 'excessive-fields.txt');
  const excessiveFieldsResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: excessiveFieldsForm,
  });
  assert.equal(excessiveFieldsResponse.status, 400);
  assert.equal((await excessiveFieldsResponse.json()).error.code, 'INVALID_UPLOAD');

  const oversizedForm = new FormData();
  oversizedForm.append('file', new Blob(['x'.repeat(33)]), 'large.txt');
  const oversizedResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: oversizedForm,
  });
  assert.equal(oversizedResponse.status, 413);
  assert.equal((await oversizedResponse.json()).error.code, 'FILE_TOO_LARGE');

  const content = 'document content';
  const uploadForm = new FormData();
  uploadForm.append('file', new Blob([content]), 'report.txt');
  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: uploadForm,
  });
  assert.equal(uploadResponse.status, 201);

  const { document } = await uploadResponse.json();
  assert.equal(document.originalName, 'report.txt');
  assert.equal(document.size, Buffer.byteLength(content));
  assert.equal(document.owner, 'test-owner');
  assert.match(document.id, /^[0-9a-f-]{36}$/i);
  const [storedFilename] = await fs.readdir(storageDirectory);
  assert.match(storedFilename, /^[0-9a-f-]{36}$/i);
  assert.notEqual(storedFilename, document.originalName);

  const listResponse = await fetch(`${baseUrl}/documents`);
  assert.deepEqual((await listResponse.json()).documents, [document]);

  const downloadResponse = await fetch(
    `${baseUrl}/documents/${document.id}/download`,
  );
  assert.equal(downloadResponse.status, 200);
  assert.equal(downloadResponse.headers.get('content-type'), 'application/octet-stream');
  assert.match(downloadResponse.headers.get('content-disposition'), /report\.txt/);
  assert.equal(await downloadResponse.text(), content);

  const unknownDocumentResponse = await fetch(
    `${baseUrl}/documents/unknown/download`,
  );
  assert.equal(unknownDocumentResponse.status, 404);
  assert.equal(
    (await unknownDocumentResponse.json()).error.code,
    'DOCUMENT_NOT_FOUND',
  );

  await fs.unlink(path.join(storageDirectory, storedFilename));
  const missingStoredFileResponse = await fetch(
    `${baseUrl}/documents/${document.id}/download`,
  );
  assert.equal(missingStoredFileResponse.status, 404);
  assert.equal(
    (await missingStoredFileResponse.json()).error.code,
    'FILE_NOT_FOUND',
  );
});
