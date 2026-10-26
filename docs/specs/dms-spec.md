# Especificação - Document Management System

## 1. Objetivo

Entregar uma aplicação web que permita enviar, listar e baixar documentos, mantendo os arquivos no filesystem local e seus metadados em memória, sem autenticação nesta primeira fase.

## 2. Escopo

### Dentro do escopo

- Enviar um arquivo por requisição HTTP.
- Listar todos os documentos registrados durante a execução atual do backend.
- Baixar o arquivo associado a um identificador de documento.
- Registrar metadados básicos e um identificador simples de proprietário (`owner`).
- Gravar arquivos localmente com Multer e `diskStorage`, sob `backend/storage` por padrão.
- Expor as rotas previstas pelo backend e consumi-las pelo prefixo `/api` no frontend.

### Fora do escopo

- Autenticação, cadastro de usuários, autorização e isolamento de documentos por usuário.
- Armazenamento externo, em nuvem ou em banco de dados.
- Versionamento, edição, renomeação ou exclusão de documentos pela aplicação.
- Pesquisa, filtros, ordenação configurável e paginação.
- Allowlist funcional de extensões ou tipos MIME.
- Recuperação dos metadados após reinício do backend.

## 3. Requisitos funcionais

| ID | Requisito | Critérios de aceite |
| --- | --- | --- |
| RF-01 | O usuário pode enviar um documento. | A API aceita um arquivo no campo multipart `file`, gera um identificador e registra os metadados. O arquivo é gravado no armazenamento local com nome interno gerado pelo sistema. A resposta não expõe caminho físico nem nome interno. |
| RF-02 | O usuário pode listar os documentos enviados. | A API retorna todos os metadados registrados em memória na execução atual. A resposta não inclui caminhos locais nem dados internos de armazenamento. Uma lista sem documentos é válida e retorna uma coleção vazia. |
| RF-03 | O usuário pode baixar um documento pelo identificador. | Para um identificador existente com arquivo disponível, a API retorna o conteúdo binário como anexo e usa o nome original como nome de download. Um identificador inexistente ou arquivo indisponível retorna erro JSON apropriado. |
| RF-04 | O sistema registra o proprietário associado a cada documento. | Como não há autenticação no MVP, o servidor atribui o mesmo identificador configurado em `DEFAULT_DOCUMENT_OWNER`, com valor padrão `anonymous`. O cliente não define `owner` no upload. Esse campo não implica isolamento ou controle de acesso. |
| RF-05 | O sistema preserva a disponibilidade do endpoint de saúde existente. | `GET /health` continua retornando HTTP 200 e `{ "status": "ok" }`, independente das rotas de documentos. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos enviados são gravados no filesystem local da aplicação usando Multer com `diskStorage`; armazenamento externo não é permitido. O diretório padrão é `backend/storage`. |
| RNF-02 | Os metadados ficam em memória no backend. Eles não são duráveis: após reinício, a listagem começa vazia, embora arquivos físicos possam permanecer no diretório. Arquivos sem metadados não são listados nem baixáveis pela API. |
| RNF-03 | Configurações operacionais devem vir de variáveis de ambiente, seguindo 12-Factor. O processo não deve depender de caminho relativo ao diretório de trabalho para localizar o diretório padrão de armazenamento. |
| RNF-04 | O limite técnico padrão por arquivo é 10 MiB e deve ser configurável por `MAX_UPLOAD_BYTES`. O limite não é uma restrição de tipo de documento; não há allowlist de MIME ou extensão. Upload acima do limite retorna HTTP 413. |
| RNF-05 | O nome original do arquivo é somente metadado. O nome usado no filesystem deve ser opaco, único e gerado pelo servidor; nunca se deve usar o nome enviado pelo cliente para compor um caminho. |
| RNF-06 | Erros da API são retornados como JSON consistente, sem stack trace, caminhos físicos ou detalhes internos de filesystem. |
| RNF-07 | O backend usa Node.js e Express em CommonJS, JavaScript sem TypeScript, e os testes de backend usam o runner nativo `node:test`. O frontend usa React e Vite. |
| RNF-08 | O backend deve seguir a dependência `routes → controllers → services → repositories`. Camadas internas não conhecem Express nem detalhes de transporte HTTP. |
| RNF-09 | Chamadas do frontend usam `fetch` com prefixo `/api`. No desenvolvimento, o proxy Vite remove esse prefixo e encaminha as chamadas ao backend; um ambiente integrado deve oferecer encaminhamento equivalente. |

### Configuração

| Variável | Padrão | Uso |
| --- | --- | --- |
| `PORT` | `3000` | Porta HTTP do backend. |
| `STORAGE_DIR` | `backend/storage` | Diretório local de arquivos, resolvido a partir da raiz do projeto, não do diretório de trabalho do processo. |
| `MAX_UPLOAD_BYTES` | `10485760` | Tamanho máximo de um arquivo, em bytes (10 MiB). |
| `DEFAULT_DOCUMENT_OWNER` | `anonymous` | Valor atribuído ao campo `owner` enquanto não houver identidade autenticada. |

## 5. Modelo de dados

### Metadados públicos do documento

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id` | string (UUID) | Sim | Identificador único, gerado pelo servidor e usado nas rotas de download. |
| `originalName` | string | Sim | Nome informado pelo cliente no upload; preservado para exibição e download, nunca usado como caminho físico. |
| `size` | number (inteiro) | Sim | Tamanho do arquivo em bytes. |
| `uploadedAt` | string (ISO 8601 UTC) | Sim | Data e hora em que o upload foi concluído e os metadados registrados. |
| `owner` | string | Sim | Identificador definido pelo servidor via `DEFAULT_DOCUMENT_OWNER`; no padrão, `anonymous`. |

Exemplo de representação pública:

```json
{
  "id": "7f1c9c25-5fa5-4a6e-8fb6-45ec303ad422",
  "originalName": "relatorio.pdf",
  "size": 24576,
  "uploadedAt": "2026-10-26T12:00:00.000Z",
  "owner": "anonymous"
}
```

### Referência interna de armazenamento

O repositório mantém, em memória, a associação entre `id` e o nome/caminho seguro gerado para o arquivo no diretório configurado. Essa referência é interna: não aparece nas respostas da API. O identificador interno do arquivo deve ser distinto do nome original e não pode conter segmentos de caminho recebidos do cliente.

A entidade e o índice de metadados existem apenas na memória do processo. Se o registro não puder ser criado após a gravação do arquivo, o sistema deve tentar remover o arquivo recém-gravado para evitar órfãos. Não há garantia de recuperação ou limpeza automática de arquivos órfãos preexistentes após uma reinicialização.

## 6. Contratos de API

As rotas abaixo são relativas à origem do backend. No frontend, as URLs correspondentes usam `/api` como prefixo (por exemplo, `/api/documents`). O proxy de desenvolvimento remove `/api` antes de encaminhar a chamada.

### Formato de erro

Erros HTTP da API usam `Content-Type: application/json` e o formato:

```json
{
  "error": {
    "code": "DOCUMENT_NOT_FOUND",
    "message": "Documento não encontrado."
  }
}
```

`code` é estável para consumo pelo cliente; `message` é uma mensagem legível em português. Respostas de erro não incluem stack trace nem caminhos locais.

### POST /upload

Envia um único arquivo usando `multipart/form-data`.

- Campo obrigatório: `file` (um arquivo).
- Campos adicionais não são usados para definir `owner` ou caminho de armazenamento.
- Nenhum filtro de tipo MIME ou extensão é aplicado nesta fase.
- O tamanho máximo é definido por `MAX_UPLOAD_BYTES`.

**Sucesso:** HTTP `201 Created`, `Content-Type: application/json`.

```json
{
  "document": {
    "id": "7f1c9c25-5fa5-4a6e-8fb6-45ec303ad422",
    "originalName": "relatorio.pdf",
    "size": 24576,
    "uploadedAt": "2026-10-26T12:00:00.000Z",
    "owner": "anonymous"
  }
}
```

**Erros previstos:**

| HTTP | `code` | Quando |
| --- | --- | --- |
| 400 | `FILE_REQUIRED` | Campo `file` ausente ou nenhum arquivo enviado. |
| 400 | `INVALID_UPLOAD` | Requisição multipart inválida ou mais de um arquivo enviado. |
| 413 | `FILE_TOO_LARGE` | Arquivo excede `MAX_UPLOAD_BYTES`. |
| 500 | `UPLOAD_FAILED` | Falha ao gravar o arquivo ou registrar seus metadados. |

### GET /documents

Lista todos os documentos cujo metadado está registrado na memória do backend. Não recebe filtros nesta fase.

**Sucesso:** HTTP `200 OK`, `Content-Type: application/json`.

```json
{
  "documents": [
    {
      "id": "7f1c9c25-5fa5-4a6e-8fb6-45ec303ad422",
      "originalName": "relatorio.pdf",
      "size": 24576,
      "uploadedAt": "2026-10-26T12:00:00.000Z",
      "owner": "anonymous"
    }
  ]
}
```

Sem documentos, responde `{ "documents": [] }`. Uma falha inesperada ao consultar o repositório retorna HTTP `500` com `DOCUMENT_LIST_FAILED`.

### GET /documents/:id/download

Transfere o arquivo binário associado ao identificador. O cliente deve tratar a resposta como conteúdo binário, não como JSON.

**Sucesso:** HTTP `200 OK`, com `Content-Disposition: attachment` usando `originalName`, `Content-Length` correspondente ao tamanho registrado e `Content-Type: application/octet-stream`. O nome do anexo deve ser codificado/sanitizado para cabeçalhos HTTP.

**Erros previstos:**

| HTTP | `code` | Quando |
| --- | --- | --- |
| 404 | `DOCUMENT_NOT_FOUND` | Não há metadados registrados para o `id`. |
| 404 | `FILE_NOT_FOUND` | Há metadados, mas o arquivo local associado não está disponível. |
| 500 | `DOWNLOAD_FAILED` | Ocorre outra falha ao acessar ou transmitir o arquivo. |

## 7. Decisões arquiteturais

- **Backend:** Express em CommonJS; separar responsabilidades em `routes/`, `controllers/`, `services/` e `repositories/`, com fluxo `routes → controllers → services → repositories`.
- **Upload:** Multer com `diskStorage` grava no filesystem local. A configuração de upload valida o campo e o limite técnico; o serviço coordena o registro dos metadados; o repositório mantém metadados em memória e a associação com o arquivo.
- **Download:** controller traduz o resultado do serviço para cabeçalhos e resposta binária. O caminho é obtido exclusivamente da referência interna associada ao `id`, nunca de um caminho fornecido pelo cliente.
- **Frontend:** React com componentes funcionais e hooks, organizado em componentes, páginas e serviços. A comunicação com o backend usa `fetch` via `/api`.
- **Persistência:** arquivos no filesystem local; metadados em memória. Não introduzir banco de dados ou armazenamento externo nesta fase.
- **Identidade:** sem autenticação. `owner` é um valor configurado pelo servidor e não deve ser tratado como mecanismo de autorização.
- **Compatibilidade:** manter `GET /health` e as rotas de documentos previstas sem prefixo no servidor.

## 8. Plano de execução

As etapas abaixo descrevem entregas futuras do produto, em nível funcional. Este documento não autoriza nem inclui a execução de alterações nos arquivos de backend ou frontend.

1. **Contratos e configuração:** definir e validar configuração operacional, limite técnico do upload, formato de erros e critérios de aceite para os endpoints.
2. **Upload e registro:** receber um arquivo multipart, gravá-lo localmente com nome gerado pelo sistema e registrar seus metadados em memória; tratar falhas sem deixar arquivo recém-criado quando for possível removê-lo.
3. **Consulta e download:** listar os metadados da execução atual e transferir o arquivo correspondente a um identificador, com cabeçalhos de anexo e tratamento de ausência.
4. **Fluxo de interface:** permitir selecionar e enviar um arquivo, exibir a lista atualizada e iniciar o download, apresentando estados de carregamento e erros retornados pela API.
5. **Integração e verificação:** validar o fluxo completo pelo proxy `/api`, testar cenários de sucesso e falha com `node:test` e confirmar que arquivos são escritos somente no armazenamento local configurado.

## 9. Critérios de conclusão do MVP

- Upload válido retorna HTTP 201 e metadados sem referência ao caminho local.
- Upload ausente, inválido ou acima do limite retorna erro no status e formato definidos.
- A listagem inclui somente metadados da execução atual e retorna coleção vazia quando apropriado.
- Download de documento existente entrega bytes do arquivo com nome original como anexo; IDs desconhecidos ou arquivos ausentes retornam 404 em JSON.
- Os arquivos ficam no filesystem local via Multer `diskStorage`; nenhum provedor externo é usado.
- `owner` é atribuído pelo servidor e não é apresentado como autenticação ou isolamento.
- `GET /health` permanece funcional.
- O frontend consegue acessar os endpoints pelo prefixo `/api` no ambiente integrado.
