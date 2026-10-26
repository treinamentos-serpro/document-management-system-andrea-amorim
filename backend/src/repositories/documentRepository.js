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

function create(document, storageFilename) {
  const record = { ...document, storageFilename };
  documentsById.set(record.id, record);
  return toPublicDocument(record);
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

module.exports = {
  create,
  findAll,
  findById,
};