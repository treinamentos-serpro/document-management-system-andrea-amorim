import { useState } from 'react';
import { downloadDocument } from '../services/documentApi.js';

export default function DownloadButton({ document: documentMetadata }) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  async function handleDownload() {
    setDownloading(true);
    setError('');
    try {
      const blob = await downloadDocument(documentMetadata.id);
      const url = URL.createObjectURL(blob);
      try {
        const link = document.createElement('a');
        link.href = url;
        link.download = documentMetadata.originalName;
        document.body.appendChild(link);
        try {
          link.click();
        } finally {
          link.remove();
        }
      } finally {
        // Aguarda o navegador iniciar o download antes de liberar o recurso.
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleDownload}
        disabled={downloading}
        aria-label={`Baixar ${documentMetadata.originalName}`}
      >
        {downloading ? 'Baixando...' : 'Baixar'}
      </button>
      {error && <p role="alert">{error}</p>}
    </>
  );
}
