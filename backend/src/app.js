// Seed do servidor backend do Document Management System.
//
// Este arquivo é apenas um ponto de partida mínimo. Ao longo do workshop você
// vai usar o Agent Mode do GitHub Copilot para construir as camadas:
//   - routes/       (definição das rotas)
//   - controllers/  (entrada HTTP e validação)
//   - services/     (regras de negócio)
//   - repositories/ (persistência: arquivos locais + metadados em memória)
//
// Restrição do projeto: uploads são gravados no filesystem local da aplicação
// usando multer com diskStorage. Não utilize provedores externos.

const express = require('express');
const multer = require('multer');
const documentRoutes = require('./routes/documentRoutes');
const { DocumentServiceError } = require('./services/documentService');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Endpoint de verificação de saúde. As demais rotas (/upload, /documents,
// /documents/:id/download) serão implementadas durante o Passo 2.
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(documentRoutes);

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
  } else if (error instanceof DocumentServiceError) {
    code = error.code;
    if (code === 'FILE_REQUIRED') {
      status = 400;
      message = 'Envie um arquivo no campo "file".';
    } else if (code === 'DOCUMENT_NOT_FOUND' || code === 'FILE_NOT_FOUND') {
      status = 404;
      message = code === 'DOCUMENT_NOT_FOUND'
        ? 'Documento não encontrado.'
        : 'Arquivo do documento não encontrado.';
    } else {
      code = 'DOWNLOAD_FAILED';
      message = 'Não foi possível baixar o documento.';
    }
  } else if (req.method === 'POST' && req.path === '/upload') {
    code = 'UPLOAD_FAILED';
    message = 'Não foi possível armazenar o documento.';
  } else if (req.method === 'GET' && req.path === '/documents') {
    code = 'DOCUMENT_LIST_FAILED';
    message = 'Não foi possível listar os documentos.';
  } else if (req.method === 'GET' && req.path.endsWith('/download')) {
    code = 'DOWNLOAD_FAILED';
    message = 'Não foi possível baixar o documento.';
  }

  res.status(status).json({ error: { code, message } });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

module.exports = app;
