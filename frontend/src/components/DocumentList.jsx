import DownloadButton from './DownloadButton.jsx';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
});
const sizeFormatter = new Intl.NumberFormat('pt-BR');

export default function DocumentList({ documents, loading, error, onRefresh }) {
  return (
    <section aria-labelledby="documents-heading" aria-busy={loading}>
      <h2 id="documents-heading">Documentos</h2>
      <button type="button" onClick={onRefresh} disabled={loading}>
        Atualizar lista
      </button>
      {loading && <p role="status">Carregando documentos...</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && documents.length === 0 && (
        <p>Nenhum documento enviado.</p>
      )}
      {!loading && !error && documents.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', textAlign: 'left' }}>
            <caption>Documentos disponíveis para download</caption>
            <thead>
              <tr>
                <th scope="col">Nome</th>
                <th scope="col">Tamanho</th>
                <th scope="col">Data de envio</th>
                <th scope="col">Dono</th>
                <th scope="col">Ações</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((document) => (
                <tr key={document.id}>
                  <td>{document.originalName}</td>
                  <td>{sizeFormatter.format(document.size)} bytes</td>
                  <td>{dateFormatter.format(new Date(document.uploadedAt))}</td>
                  <td>{document.owner}</td>
                  <td><DownloadButton document={document} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
