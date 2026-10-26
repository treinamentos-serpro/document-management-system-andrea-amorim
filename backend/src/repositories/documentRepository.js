const { access, unlink } = require('node:fs/promises');
const path = require('node:path');
const { storageDirectory } = require('../config/documentStorage');

const documentsById = new Map();

function toPublicDocument(document) {
  return {
    id: document.id,
    originalName: document.originalName,
    size: document.size,
    uploadedAt: document.uploadedAt,
    owner: document.owner,
  };
}

async function create(document, storageFilename) {
  const record = { ...document, storageFilename };
  try {
    const publicDocument = toPublicDocument(record);
    documentsById.set(record.id, record);
    return publicDocument;
  } catch (error) {
    documentsById.delete(record.id);
    try {
      await unlink(path.join(storageDirectory, storageFilename));
    } catch (cleanupError) {
      throw new AggregateError(
        [error, cleanupError],
        'Não foi possível registrar o documento nem remover o arquivo.',
      );
    }
    throw error;
  }
}

function findAll() {
  return Array.from(documentsById.values(), toPublicDocument);
}

function findById(id) {
  const record = documentsById.get(id);
  if (!record) {
    return null;
  }

  return {
    document: toPublicDocument(record),
    storageFilename: record.storageFilename,
  };
}

async function getFilePath(storageFilename) {
  const filePath = path.join(storageDirectory, storageFilename);
  await access(filePath);
  return filePath;
}

module.exports = {
  create,
  findAll,
  findById,
  getFilePath,
};