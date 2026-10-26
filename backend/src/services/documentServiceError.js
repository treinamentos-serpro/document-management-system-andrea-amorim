class DocumentServiceError extends Error {
  constructor(code, cause) {
    super(code, cause ? { cause } : undefined);
    this.name = 'DocumentServiceError';
    this.code = code;
  }
}

async function executeDocumentOperation(operation, errorCode, errorCodeByCause = {}) {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof DocumentServiceError) {
      throw error;
    }

    const mappedCode = Object.hasOwn(errorCodeByCause, error.code)
      ? errorCodeByCause[error.code]
      : errorCode;
    throw new DocumentServiceError(mappedCode, error);
  }
}

module.exports = {
  DocumentServiceError,
  executeDocumentOperation,
};
