// Restrição do projeto: uploads são gravados no filesystem local da aplicação
// usando multer com diskStorage. Não utilize provedores externos.

const express = require('express');
const multer = require('multer');
const documentRoutes = require('./routes/documentRoutes');
const { DocumentServiceError } = require('./services/documentServiceError');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(documentRoutes);

const serviceErrorResponses = {
  FILE_REQUIRED: [400, 'Envie um arquivo no campo "file".'],
  DOCUMENT_NOT_FOUND: [404, 'Documento não encontrado.'],
  FILE_NOT_FOUND: [404, 'Arquivo do documento não encontrado.'],
  UPLOAD_FAILED: [500, 'Não foi possível armazenar o documento.'],
  DOCUMENT_LIST_FAILED: [500, 'Não foi possível listar os documentos.'],
  DOWNLOAD_FAILED: [500, 'Não foi possível baixar o documento.'],
};

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  let status = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'Erro interno do servidor.';

  if (error instanceof multer.MulterError) {
    status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    code = error.code === 'LIMIT_FILE_SIZE' ? 'FILE_TOO_LARGE' : 'INVALID_UPLOAD';
    message = status === 413
      ? 'O arquivo excede o tamanho máximo permitido.'
      : 'A requisição de upload é inválida.';
  } else if (error.invalidUpload) {
    status = 400;
    code = 'INVALID_UPLOAD';
    message = 'A requisição de upload é inválida.';
  } else if (error.uploadStorageFailure) {
    code = 'UPLOAD_FAILED';
    message = 'Não foi possível armazenar o documento.';
  } else if (error instanceof DocumentServiceError) {
    const response = serviceErrorResponses[error.code];
    if (response) {
      [status, message] = response;
      code = error.code;
    }
  }

  if (status >= 500) {
    console.error(error);
  }

  res.status(status).json({ error: { code, message } });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

module.exports = app;
