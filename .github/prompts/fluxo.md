---
description: Faz uma revisão completa do código-fonte do backend para sugerir refatoração.
name: revisar-backend
argument-hint: backend
agent: agent
---

# Revisão do backend

Faça uma revisão completa do backend seguindo a Clean Architecture simples do projeto.

Gere um plano detalhado de refatoração em `docs/plan`

Requisitos:

- Respeite o fluxo `routes -> controllers -> services -> repositories`.
- Uploads gravados no filesystem local via multer com diskStorage.
- Metadados em memória nesta fase.
- Avalie tratamento de erros nos limites do sistema.
