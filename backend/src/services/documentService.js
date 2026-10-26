const { randomUUID } = require('node:crypto');
const documentRepository = require('../repositories/documentRepository');
const { defaultDocumentOwner } = require('../config/documentStorage');
const {
  DocumentServiceError,
  executeDocumentOperation,
} = require('./documentServiceError');

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

  return executeDocumentOperation(
    () => documentRepository.create(document, uploadedFile.filename),
    'UPLOAD_FAILED',
  );
}

async function listDocuments() {
  return executeDocumentOperation(
    () => documentRepository.findAll(),
    'DOCUMENT_LIST_FAILED',
  );
}

async function getDocumentForDownload(id) {
  const storedDocument = await executeDocumentOperation(
    () => documentRepository.findById(id),
    'DOWNLOAD_FAILED',
  );
  if (!storedDocument) {
    throw new DocumentServiceError('DOCUMENT_NOT_FOUND');
  }

  const filePath = await executeDocumentOperation(
    () => documentRepository.getFilePath(storedDocument.storageFilename),
    'DOWNLOAD_FAILED',
    { ENOENT: 'FILE_NOT_FOUND' },
  );

  return {
    document: storedDocument.document,
    filePath,
  };
}

module.exports = {
  createDocument,
  getDocumentForDownload,
  listDocuments,
};