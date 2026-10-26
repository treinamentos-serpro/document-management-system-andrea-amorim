import assert from 'node:assert/strict';
import { afterEach, mock, test } from 'node:test';
import { downloadDocument, listDocuments, uploadDocument } from '../src/services/documentApi.js';

afterEach(() => mock.restoreAll());

test('lista documentos pelo prefixo /api e encaminha o sinal de cancelamento', async () => {
  const documents = [{ id: '1', originalName: 'relatorio.txt' }];
  const signal = new AbortController().signal;
  const fetchMock = mock.method(globalThis, 'fetch', async () => Response.json({ documents }));

  assert.deepEqual(await listDocuments({ signal }), documents);
  assert.deepEqual(fetchMock.mock.calls[0].arguments, ['/api/documents', { signal }]);
});

test('envia o arquivo no campo file sem definir manualmente Content-Type', async () => {
  const document = { id: '1', originalName: 'relatorio.txt' };
  const fetchMock = mock.method(globalThis, 'fetch', async () => Response.json({ document }, { status: 201 }));
  const file = new File(['conteudo'], document.originalName);

  assert.deepEqual(await uploadDocument(file), document);
  const [url, options] = fetchMock.mock.calls[0].arguments;
  assert.equal(url, '/api/upload');
  assert.equal(options.method, 'POST');
  assert.equal(options.headers, undefined);
  assert.deepEqual([...options.body.keys()], ['file']);
  assert.equal(options.body.get('file').name, file.name);
  assert.equal(await options.body.get('file').text(), 'conteudo');
});

test('baixa o conteúdo binário e codifica o identificador na URL', async () => {
  const bytes = new Uint8Array([0, 128, 255]);
  const fetchMock = mock.method(globalThis, 'fetch', async () => new Response(bytes));

  const blob = await downloadDocument('a/b ?');
  assert.equal(fetchMock.mock.calls[0].arguments[0], '/api/documents/a%2Fb%20%3F/download');
  assert.deepEqual(new Uint8Array(await blob.arrayBuffer()), bytes);
});

test('propaga a mensagem de erro do backend em todas as operações', async () => {
  mock.method(globalThis, 'fetch', async () => Response.json({
    error: { code: 'TEST_ERROR', message: 'Operação não permitida.' },
  }, { status: 400 }));

  for (const operation of [
    () => listDocuments(),
    () => uploadDocument(new File(['x'], 'arquivo.txt')),
    () => downloadDocument('1'),
  ]) {
    await assert.rejects(operation, { message: 'Operação não permitida.' });
  }
});

test('informa o status HTTP quando a resposta de erro não é JSON', async () => {
  mock.method(globalThis, 'fetch', async () => new Response('Bad Gateway', { status: 502 }));
  await assert.rejects(listDocuments, /HTTP 502/);
});

test('apresenta mensagem em português para falhas de conexão', async () => {
  mock.method(globalThis, 'fetch', async () => { throw new TypeError('fetch failed'); });
  await assert.rejects(listDocuments, /Não foi possível conectar ao servidor/);
});

test('preserva erros de cancelamento', async () => {
  const error = new DOMException('Cancelado', 'AbortError');
  mock.method(globalThis, 'fetch', async () => { throw error; });
  await assert.rejects(listDocuments, (received) => received === error);
});
