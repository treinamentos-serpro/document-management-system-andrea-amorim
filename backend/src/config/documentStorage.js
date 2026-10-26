const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '../../..');
const defaultStorageDirectory = path.resolve(__dirname, '../../storage');
const configuredStorageDirectory = process.env.STORAGE_DIR;
const storageDirectory = configuredStorageDirectory
  ? path.resolve(projectRoot, configuredStorageDirectory)
  : defaultStorageDirectory;

function parsePositiveInteger(value, fallback, variableName) {
  if (value === undefined || value === '') {
    return fallback;
  }

  const parsedValue = Number(value);
  if (!Number.isSafeInteger(parsedValue) || parsedValue <= 0) {
    throw new Error(`${variableName} deve ser um inteiro positivo.`);
  }

  return parsedValue;
}

const maxUploadBytes = parsePositiveInteger(
  process.env.MAX_UPLOAD_BYTES,
  10 * 1024 * 1024,
  'MAX_UPLOAD_BYTES',
);
const defaultDocumentOwner = process.env.DEFAULT_DOCUMENT_OWNER || 'anonymous';

fs.mkdirSync(storageDirectory, { recursive: true });

module.exports = {
  defaultDocumentOwner,
  maxUploadBytes,
  storageDirectory,
};