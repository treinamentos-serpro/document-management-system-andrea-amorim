import { useRef, useState } from 'react';
import { uploadDocument } from '../services/documentApi.js';

export default function UploadComponent({ onUploaded }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!file) {
      setError('Selecione um arquivo para enviar.');
      return;
    }

    setUploading(true);
    try {
      await uploadDocument(file);
      setFile(null);
      inputRef.current.value = '';
      setMessage('Documento enviado com sucesso.');
      onUploaded();
    } catch (error) {
      setError(error.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <section aria-labelledby="upload-heading">
      <h2 id="upload-heading">Enviar documento</h2>
      <form onSubmit={handleSubmit} aria-busy={uploading}>
        <label htmlFor="document-file">Arquivo </label>
        <input
          ref={inputRef}
          id="document-file"
          name="file"
          type="file"
          disabled={uploading}
          onChange={(event) => {
            setFile(event.target.files[0] ?? null);
            setError('');
            setMessage('');
          }}
        />
        <button type="submit" disabled={uploading || !file}>
          {uploading ? 'Enviando...' : 'Enviar'}
        </button>
      </form>
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
    </section>
  );
}
