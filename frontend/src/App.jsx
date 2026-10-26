import { useEffect, useState } from 'react';
import DocumentList from './components/DocumentList.jsx';
import UploadComponent from './components/UploadComponent.jsx';
import { listDocuments } from './services/documentApi.js';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');

    async function loadDocuments() {
      try {
        const result = await listDocuments({ signal: controller.signal });
        if (!controller.signal.aborted) {
          setDocuments(result);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(error.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadDocuments();
    return () => controller.abort();
  }, [refreshKey]);

  function refreshDocuments() {
    setRefreshKey((key) => key + 1);
  }

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', maxWidth: '60rem', margin: 'auto' }}>
      <h1>Gestão de documentos</h1>
      <UploadComponent onUploaded={refreshDocuments} />
      <DocumentList
        documents={documents}
        loading={loading}
        error={error}
        onRefresh={refreshDocuments}
      />
    </main>
  );
}
