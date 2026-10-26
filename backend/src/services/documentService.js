const { randomUUID } = require('node:crypto');
const { access, unlink } = require('node:fs/promises');
const path = require('node:path');
const documentRepository = require('../repositories/documentRepository');
const {
  defaultDocumentOwner,
  storageDirectory,
} = require('../config/documentStorage');

class DocumentServiceError extends Error {
  constructor(code) {
    super(code);
    this.name = 'DocumentServiceError';
    this.code = code;
  }
}

async function createDocument(uploadedFile) {
  if (!uploadedFile) {
    throw new DocumentServiceError('FILE_REQUIRED');
  }

  const document = {
    id: randomUUID(),
    originalName: uploadedFile.originalname,
    size: uploadedFile.size,
    uploadedAt: new Date().toISOString(),
    owner: defaultDocumentOwner,
  };

  try {
    return documentRepository.create(document, uploadedFile.filename);
  } catch (error) {
    await unlink(path.join(storageDirectory, uploadedFile.filename)).catch(() => {});
    throw error;
  }
}

function listDocuments() {
  return documentRepository.findAll();
}

async function getDocumentForDownload(id) {
  const storedDocument = documentRepository.findById(id);
  if (!storedDocument) {
    throw new DocumentServiceError('DOCUMENT_NOT_FOUND');
  }

  const filePath = path.join(storageDirectory, storedDocument.storageFilename);
  try {
    await access(filePath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new DocumentServiceError('FILE_NOT_FOUND');
    }
    throw new DocumentServiceError('DOWNLOAD_FAILED');
  }

  return {
    document: storedDocument.document,
    filePath,
  };
}

module.exports = {
  DocumentServiceError,
  createDocument,
  getDocumentForDownload,
  listDocuments,
};