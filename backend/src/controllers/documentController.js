const fs = require('node:fs');
const documentService = require('../services/documentService');

async function upload(req, res) {
  const document = await documentService.createDocument(req.file);
  res.status(201).json({ document });
}

async function list(req, res) {
  const documents = await documentService.listDocuments();
  res.status(200).json({ documents });
}

function encodeFilename(filename) {
  return encodeURIComponent(filename).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

async function download(req, res, next) {
  const { document, filePath } = await documentService.getDocumentForDownload(
    req.params.id,
  );

  res.status(200);
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Length', String(document.size));
  res.setHeader(
    'Content-Disposition',
    `attachment; filename*=UTF-8''${encodeFilename(document.originalName)}`,
  );

  const fileStream = fs.createReadStream(filePath);
  fileStream.on('error', (error) => {
    if (!res.headersSent) {
      res.removeHeader('Content-Length');
      res.removeHeader('Content-Disposition');
      return next(error);
    }
    res.destroy(error);
  });
  fileStream.pipe(res);
}

module.exports = {
  download,
  list,
  upload,
};