# Bytebank API

Sistema de gerenciamento financeiro desenvolvido em **Python 3.10+** com **FastAPI**, **Pydantic** e persistência nativa via **asyncpg** no estilo **SQLc**, estruturado rigorosamente sob os princípios de **Clean Architecture** e gerenciado via **uv** workspaces.

## Arquitetura do Monorepo

```text
.
├── foundations/
│   ├── user/          # Domínio e regras de negócio de Usuários
│   ├── account/       # Domínio e regras de negócio de Contas
│   └── transaction/   # Domínio e regras de negócio de Transações
├── infrastructure/
│   ├── database/      # asyncpg puro + estilo SQLc (Schema DDL, Queries SQL, Querier tipado)
│   └── api/           # FastAPI, Routers REST, JWT Auth, Schemas Pydantic
├── frontend/          # Front-end Angular 22 (Material, NgRx SignalStore) — ver seção Front-end
├── public/            # Arquivos estáticos
├── src/
│   └── bytebank/      # Entrypoint da aplicação
├── Dockerfile         # Imagem Docker da API
├── docker-compose.yml # Orquestração completa (PostgreSQL 16 + API + front nginx)
└── pyproject.toml     # Configuração de workspace uv
```

## Como Executar

### 1. Pré-requisitos
- [uv](https://docs.astral.sh/uv/) instalado.
- [Docker](https://www.docker.com/) para o banco PostgreSQL.

### 2. Subir o Banco de Dados PostgreSQL
```bash
docker compose up -d db
```

### 3. Executando Localmente
```bash
# Sincroniza as dependências do workspace
uv sync

# Executa o servidor da API
uv run bytebank
```
A API estará disponível em `http://localhost:8000` e a documentação interativa Swagger em `http://localhost:8000/docs`.

### 4. Executando os Testes Automatizados
```bash
uv run pytest -v
```

### 5. Executando via Docker Compose (API + PostgreSQL + Front-end)
```bash
docker compose up --build
```
- Front-end: http://localhost:8080 (nginx; `/api/*` é encaminhado para a API)
- API / Swagger: http://localhost:8000/docs

## Fluxo de Autenticação

1. **Geração do Token (`/user/auth`)**:
   - **Método de entrada:** HTTP Basic Auth (usuário/e-mail e senha).
   - **Resultado:** Bearer Token (JWT).
   - O payload do JWT transporta as informações de identificação do usuário (`sub`, `id`, `user_id`, `email`, `username`).
2. **Acesso aos Endpoints Protegidos (`/account`, etc.)**:
   - Requerem estritamente o **Bearer Token** no header `Authorization: Bearer <token>`.
   - O identificador do usuário é extraído diretamente do token validado.
3. **No OpenAPI / Swagger UI (`/docs`)**:
   - O botão **Authorize** usa o fluxo OAuth2 *password* (`OAuth2PasswordBearer`): informe usuário/e-mail e senha (deixe `client_id`/`client_secret` em branco) e o Swagger faz um POST em `/user/auth`, recebe o `access_token` e passa a enviar `Authorization: Bearer <token>` nas rotas protegidas.
   - Os esquemas `HTTPBasic`/`HTTPBearer` do Swagger não fazem requisição ao clicar em Authorize (só guardam o valor no navegador); por isso o fluxo OAuth2 é usado para gerar o token pelo `/docs`.
   - Fora do Swagger, `/user/auth` continua aceitando HTTP Basic Auth (além de form e JSON).
4. **No front-end (cookie httpOnly)**:
   - O `POST /user/auth` também grava o JWT no cookie `access_token` (`HttpOnly`, `SameSite=Strict`, `Path=/`, `Secure` quando `COOKIE_SECURE=true`). O JavaScript nunca lê o token, o que mitiga roubo de sessão por XSS.
   - As rotas protegidas aceitam o header Bearer **ou** esse cookie (o header tem precedência).
   - `POST /user/logout` remove o cookie.
   - CSRF: o front é servido na mesma origem da API (proxy `/api`), e o `SameSite=Strict` impede que outros sites enviem o cookie.

## Contratos de API

### Módulo de Usuários (Público)
- `GET /user`: Retorna lista de usuários cadastrados `[{id, name, email}]`.
- `POST /user`: Cria usuário `{username, email, password, name?}` e gera automaticamente uma conta padrão com saldo inicial.
- `POST /user/auth` e `GET /user/auth`: Autentica via **Basic Auth** (`Authorization: Basic ...`) e retorna `{token: string, access_token: string, token_type: "bearer"}`. O POST também grava o cookie httpOnly da sessão.
- `POST /user/logout`: Remove o cookie de sessão.
- `GET /user/me` *(protegido)*: Dados do usuário autenticado.
- `PUT /user/me` *(protegido)*: Atualiza `{name?, email?, password?}` (409 se o e-mail já pertence a outro usuário).

### Módulo de Contas e Transações (Protegido - Bearer Token)
- `GET /account`: Lista as contas bancárias pertencentes ao usuário autenticado pelo token.
- `POST /account/transaction`: Cria transação financeira vinculada à conta:
  ```json
  {
    "accountId": "uuid-da-conta",
    "value": 150.00,
    "type": "Debit",
    "from": "Carlos",
    "to": "Supermercado",
    "anexo": "comprovante.png",
    "urlAnexo": "https://..."
  }
  ```
- `PUT /account/transaction/{id}`: Atualiza detalhes da transação e ajusta o saldo proporcionalmente.
- `DELETE /account/transaction/{id}`: Remove a transação e estorna o impacto no saldo da conta.
- `GET /account/{accountId}/statement?limit=&offset=`: Retorna o extrato com os dados da conta, o saldo atual e as transações (mais recentes primeiro).
  - Paginação opcional: `limit` (1–100) e `offset` (≥ 0). A resposta inclui `total`, `limit`, `offset` e `hasMore`.
  - Sem `limit`, devolve o extrato completo (compatível com o comportamento anterior).

## Front-end (`frontend/`)

Angular 22 (standalone, zoneless, signals) com **Angular Material** (tema M3) e **NgRx SignalStore**.

### Executar em desenvolvimento
```bash
uv run bytebank            # API em :8000
cd frontend && npm install
npx ng serve               # http://localhost:4200 (proxy /api -> :8000, ver proxy.conf.json)
npx ng test --watch=false  # testes unitários (Vitest)
```

### Arquitetura (Clean Architecture por feature)
```text
src/app/
├── core/                      # transversal (carregado no boot)
│   ├── auth/                  # domain (User, AuthRepository) · infrastructure (HTTP) · application (SessionStore) · guards
│   ├── cache/ http/           # cache HTTP com TTL + interceptors (cache, 401 -> sessão expirada)
│   ├── security/              # SecureStorage: AES-GCM com chave não exportável (IndexedDB)
│   ├── routing/               # SmartPreloadingStrategy + diretiva bbPrefetch
│   └── layout/                # Shell responsivo (sidenav / abas / menu hambúrguer)
├── shared/ui/                 # componentes reutilizáveis (confirm-dialog)
└── features/                  # cada uma é um chunk lazy
    ├── auth/                  # login e cadastro
    ├── account/               # domain (regras puras) · application (AccountStore, use cases) · infrastructure (HTTP + mappers) · presentation
    ├── profile/               # Minha conta (PUT /user/me)
    └── coming-soon/           # Investimentos / Outros serviços
```
- **Regra de dependência:** `presentation → application → domain ← infrastructure`. O domínio não conhece Angular nem HTTP; os repositórios são classes abstratas (portas) ligadas à implementação HTTP nos `providers` da rota de cada feature (composition root).
- **Mappers** na infraestrutura traduzem o contrato da API (`accountId`, `Credit/Debit`, `createdAt`) para o domínio (`kind: 'deposit' | 'transfer'`, `Date`).

### Estado (NgRx SignalStore)
- `SessionStore` (root): usuário e status da sessão; restaura no boot (`GET /user/me`), login, cadastro e logout.
- `AccountStore` (por feature): `withEntities` para o extrato, estado derivado (`balance`, extrato agrupado por mês), `rxMethod` com `switchMap` nas leituras e fila `concatMap` nas escritas, e **exclusão otimista com rollback**.
- `ProfileStore`: salva "Minha conta" e propaga para a sessão.

### Performance
- **Lazy loading** por feature e `@defer (on viewport)` no extrato.
- **Extrato paginado com rolagem infinita:** busca 10 transações por vez (`limit`/`offset`), e um `IntersectionObserver` no fim da lista pede a próxima página. O botão "Carregar mais" é a alternativa acessível. O `exhaustMap` ignora pedidos repetidos, o offset conta o que já está na tela (incluindo o que foi criado ou excluído localmente) e o `setEntities` deduplica por id. No desktop, a coluna do extrato é fixa e tem rolagem própria.
- **Pré-carregamento:** o chunk da conta é baixado em idle; os demais quando o usuário passa o mouse ou foca no link do menu (`bbPrefetch`).
- **Prefetch de dados:** após o login, as contas e o extrato já são buscados e o dashboard abre com dados.
- **Cache de requisições:** os GETs ficam 30s em memória, com dedupe das requisições em voo; qualquer POST/PUT/DELETE invalida o recurso.
- **Stale-while-revalidate:** o perfil e o último extrato ficam salvos **cifrados** e aparecem na hora, enquanto a API revalida.

### Segurança
- O JWT fica só no cookie httpOnly. O front não guarda token.
- `SecureStorage`: AES-GCM 256 com IV aleatório por gravação e chave `CryptoKey` não exportável no IndexedDB. O `localStorage` só contém ciphertext, e o logout apaga dados e chave.
- 401 em rota protegida leva a sessão expirada e redireciona ao login com `returnUrl` (validado contra open redirect).
- nginx com CSP (`script-src 'self'`), `X-Frame-Options`, `nosniff` e `Referrer-Policy`.


## Processo de desenvolvimento e uso de IA

Este projeto foi desenvolvido com o apoio do **Claude Code** (assistente de programação com IA da Anthropic), usado como par de programação. O autor definiu os requisitos, tomou as decisões de arquitetura e de produto, revisou as propostas e validou o resultado. A IA analisou o código, propôs o plano, implementou as etapas e executou os testes.

### Planejamento

O front-end começou num **modo de planejamento**, antes de qualquer código:

1. **Levantamento:** leitura dos contratos da API (rotas, schemas, banco) e das telas de referência (desktop, tablet e mobile).
2. **Lacunas encontradas:** as telas pediam funcionalidades que a API não tinha, como os dados do usuário logado e a edição de "Minha conta".
3. **Plano escrito:** arquitetura, estado, performance, segurança, telas, execução e uma estratégia de verificação.
4. **Aprovação:** o autor revisou e aprovou o plano antes da implementação.
5. **Entregas incrementais:** backend, core e autenticação, dashboard, perfil, otimizações, Docker e testes. Cada etapa deixava o sistema funcionando.

### Decisões e alternativas consideradas

| Tema | Opções avaliadas | Decisão | Motivo |
|---|---|---|---|
| Gerenciamento de estado | NgRx SignalStore × NgRx Store clássico (Redux) | **SignalStore** | Padrão moderno do Angular (signals), com menos código repetitivo e os mesmos recursos avançados (entidades, estado derivado, efeitos reativos) |
| Autenticação no front | Cookie httpOnly × token cifrado no navegador | **Cookie httpOnly** | O JavaScript nunca acessa o token, o que mitiga roubo de sessão por XSS. Exigiu mudanças na API |
| Lacunas da API | Novos endpoints × telas só de leitura | **`GET/PUT /user/me`**, login e cadastro | Necessários para o cabeçalho, a saudação e a tela "Minha conta" |
| Investimentos | Dados simulados × "Em breve" | **"Em breve"** | Não existe backend de investimentos |
| Hospedagem do front | nginx próprio × servido pela API | **nginx no docker-compose** | Mesma origem via proxy `/api`, necessária para o cookie `SameSite=Strict` e para não precisar de CORS |
| Paginação do extrato | Rolagem infinita × páginas numeradas | **Rolagem infinita** | Combina com o agrupamento por mês e é o padrão de apps bancários |
| Visual | Replicar as telas × Angular Material | **Angular Material** | As telas serviram só de referência de layout |

### Verificação

- **Testes automatizados:** 21 no backend (pytest) e 23 no front-end (Vitest).
- **Teste no navegador:** Chromium headless com o fluxo completo (cadastro, login, transações, rolagem do extrato, perfil, logout), checagem de erros no console e screenshots em 1366px, 768px e 390px.
- **Correções encontradas por esse teste:** página em branco na rota `/`, loop de redirecionamento para usuários logados e ajustes visuais.
- **Instalação limpa:** `docker compose up --build` a partir do pacote final do projeto.

### Limitações conhecidas

- O filtro da tela de Transferências se aplica apenas às transações já carregadas.
- O campo de valor não tem máscara de moeda.
- Os testes do backend usam o mesmo banco do ambiente de desenvolvimento e o limpam (`TRUNCATE`) a cada execução.
