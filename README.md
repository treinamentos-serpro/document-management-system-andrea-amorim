# Document Management System com GitHub Copilot

<img src="https://octodex.github.com/images/Professortocat_v2.png" align="right" height="200px" />

Hey andrea-amorim!

Mona here. I'm done preparing your exercise. Hope you enjoy! 💚

Remember, it's self-paced so feel free to take a break! ☕️

[![](https://img.shields.io/badge/Go%20to%20Exercise-%E2%86%92-1f883d?style=for-the-badge&logo=github&labelColor=197935)](https://github.com/treinamentos-serpro/document-management-system-andrea-amorim/issues/1)

---

## Executar a aplicação

Em um terminal, execute `npm ci` e `npm start` em [backend](./backend).
Em outro terminal, execute `npm ci` e `npm run dev` em [frontend](./frontend).
Acesse `http://localhost:5173`.

A interface permite selecionar e enviar um arquivo, listar os documentos e
baixá-los pelo nome original. A lista é atualizada após cada envio e também pode
ser atualizada manualmente. Erros são apresentados na própria interface.

O [cliente de API](./frontend/src/services/documentApi.js) usa `fetch` com o
prefixo `/api`. Durante o desenvolvimento, o proxy do Vite encaminha essas
requisições para `http://localhost:3000`. Em produção, configure o servidor web
para encaminhar `/api` ao backend, removendo esse prefixo.
Os arquivos permanecem no armazenamento local do backend; os metadados em
memória são perdidos ao reiniciá-lo.

Para validar o frontend, execute `npm run build` e `node --test` em
[frontend](./frontend). Para validar o backend, execute `npm test` em
[backend](./backend).

&copy; 2025 GitHub &bull; [Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/code_of_conduct.md) &bull; [MIT License](https://gh.io/mit)
