const API_PREFIX = '/api';

async function request(path, options) {
  let response;
  try {
    response = await fetch(`${API_PREFIX}${path}`, options);
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error;
    }
    throw new Error('Não foi possível conectar ao servidor. Tente novamente.', { cause: error });
  }

  if (!response.ok) {
    let message = `Não foi possível concluir a operação (HTTP ${response.status}).`;
    if (response.headers.get('content-type')?.includes('application/json')) {
      const body = await response.json();
      if (typeof body.error?.message === 'string') {
        message = body.error.message;
      }
    }
    throw new Error(message);
  }

  return response;
}

export async function listDocuments({ signal } = {}) {
  const response = await request('/documents', { signal });
  const { documents } = await response.json();
  return documents;
}

export async function uploadDocument(file) {
  const body = new FormData();
  body.append('file', file);
  const response = await request('/upload', { method: 'POST', body });
  const { document } = await response.json();
  return document;
}

export async function downloadDocument(id) {
  const response = await request(`/documents/${encodeURIComponent(id)}/download`);
  return response.blob();
}
