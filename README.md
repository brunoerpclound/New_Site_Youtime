# Youtime — desenvolvimento no Replit

Cópia fiel do site Codex. Preserve o visual, conteúdo, CMS e APIs. Replit é o ambiente principal e GitHub guarda o código.

## Início

Importe o repositório privado em https://replit.com/import conectando a conta GitHub autorizada. Use Node.js 22.12+, execute `npm ci` e `npm run dev`. Preview: porta 5173; painel: /admin. O domínio REPLIT_DEV_DOMAIN é autorizado explicitamente pelo Vite.

| Variável | Uso |
| --- | --- |
| ADMIN_PASSWORD | Secret: senha forte de acesso ao CMS |
| SESSION_SECRET | Secret: ao menos 32 caracteres aleatórios, estável entre reinícios |
| DATABASE_URL | Secret: conexão PostgreSQL obrigatória em produção |
| NODE_ENV | production no deployment; desenvolvimento sem esse valor |
| PORT | Porta fornecida pelo ambiente; produção aceita porta personalizada |

Não versione Secrets nem use prefixo VITE_ para credenciais. Localmente, copie .env.example para .env. Gere SESSION_SECRET com `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`.

## Publicação

Use Autoscale Node.js, build `npm run build`, execução `npm start`, NODE_ENV=production. .replit já configura esses comandos. Configure os Secrets também no deployment e adicione PostgreSQL. Hospedagem estática não executa as APIs ou o CMS.

Use bancos separados para desenvolvimento e produção. O servidor cria a tabela youtime_publication automaticamente e insere src/content.json somente em armazenamento vazio. Builds não sobrescrevem publicações. Sem DATABASE_URL, apenas desenvolvimento pode usar data/content.json.

## Arquitetura e CMS

src/ contém React, estilos, CMS e SEO; public/ contém imagens; scripts/ contém servidor Node, persistência, pré-renderização e testes. O build gera dist/ e .ssr/, necessários ao npm start. Não versione esses diretórios.

Em /admin, entre com a senha e salve para publicar imediatamente. Exportar JSON guarda rascunho; importar exige salvar. Em conflito de revisão, exporte o rascunho, recarregue e concilie. O histórico conserva 50 metadados de publicação, não versões completas restauráveis. Overrides antigos do navegador só são recuperados como rascunho.

## Checklist do agente

- Execute `npm test` e `npm run build`; confira `npm start` com PORT personalizado.
- Confira /, /admin, login, publicação e persistência após reinício.
- Confira desktop e celular: cabeçalhos, fundos, imagens, menu e navegação.
- Confira /api/content, /robots.txt, /sitemap.xml, /llms.txt, /index.md, /web2agent.json e /.well-known/web2agent.json. Feeds desativados retornam 404.
- Confira domínio e canonical pelo CMS, inicialmente https://www.youtime.com.br. Não altere DNS nesta transferência.
- Teste PostgreSQL apenas em banco exclusivo de testes via TEST_DATABASE_URL.

## Fluxo Git

Antes de trabalhar, confira git status e execute `git pull --ff-only origin main` com árvore limpa. Revise git diff, valide, faça commit e push ao concluir. Concilie divergências sem push forçado. O original do Codex permanece separado.

## Diagnóstico e limites

Preview bloqueado: confira REPLIT_DEV_DOMAIN e reinicie Vite. Não desabilite a proteção de hosts. Porta ocupada: encerre o processo anterior. Falha de login: confira Secrets. Falha em produção: confira banco, conectividade, permissões de criação de tabela e Secrets do deployment. Falha de build: confira Node e reinstale com npm ci.

Spline depende de internet/WebGL. Métricas e dados ilustrativos não são analytics reais. SEO/GEO não garante posição em buscas. npm run preview não substitui o servidor de produção. A implantação real e o DNS cabem ao agente responsável.

Referências: https://docs.replit.com/build/import-from-providers e https://docs.replit.com/features/publishing/deployment-types.
