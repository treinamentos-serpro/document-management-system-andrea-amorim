const { randomUUID } = require('node:crypto');
const multer = require('multer');
const express = require('express');
const { maxUploadBytes, storageDirectory } = require('../config/documentStorage');
const documentController = require('../controllers/documentController');

const router = express.Router();
const multipartLimits = {
  fileSize: maxUploadBytes,
  files: 1,
  fields: 10,
  fieldNameSize: 100,
  fieldSize: 1024,
  parts: 11,
};
const upload = multer({
  storage: multer.diskStorage({
    destination: storageDirectory,
    filename: (req, file, callback) => callback(null, randomUUID()),
  }),
  limits: multipartLimits,
});

function parseSingleFile(req, res, next) {
  if (!req.is('multipart/form-data')) {
    const error = new Error('A requisição deve usar multipart/form-data.');
    error.invalidUpload = true;
    return next(error);
  }

  upload.single('file')(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError) {
      return next(error);
    }

    if (error.code?.startsWith('E')) {
      error.uploadStorageFailure = true;
    } else {
      error.invalidUpload = true;
    }
    next(error);
  });
}

router.post('/upload', parseSingleFile, documentController.upload);
router.get('/documents', documentController.list);
router.get('/documents/:id/download', documentController.download);

module.exports = router;