# DIAGNÓSTICO — DruSign ERP

> Snapshot factual do estado do projeto antes da reforma.
> Gerado em: 2026-04-24. Somente leitura — nenhum arquivo de código foi alterado.

---

## 1. Estrutura atual

### 1.1 Raiz do projeto (arquivos-chave)

```
ERP-Cloud-DruSign/
├── package.json
├── tsconfig.json
├── next.config.ts                 (vazio — sem customizações)
├── tailwind.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
├── .env                           (credenciais em claro — ver §2)
├── .gitignore                     (ignora .env* — OK)
├── README.md                      (expõe backdoor — ver §2)
├── SETUP_DATABASE.md
├── prisma.config.ts.disabled      (arquivo desabilitado, pendurado)
├── seed.sql                       (SQL solto fora de prisma/)
├── seed_order_test.sql            (SQL solto fora de prisma/)
├── tables.sql                     (SQL solto fora de prisma/)
├── check_380.tsx                  (arquivo exploratório — lixo)
├── check_inputs.tsx               (arquivo exploratório — lixo)
├── temp_dashboard.tsx             (arquivo exploratório — lixo)
├── check_data.ts                  (script de verificação — lixo)
├── verify_db.js                   (script de verificação — lixo)
├── verify_db.ts                   (script de verificação — lixo)
├── prisma/
├── public/
└── src/
```

Sem `middleware.ts`. Sem `next.config.js` (apenas `.ts`, vazio).

### 1.2 `src/`

```
src/
├── actions/                       (8 arquivos, ~841 linhas)
│   ├── auth.ts                    (71)
│   ├── notification.ts            (70)
│   ├── order.ts                   (348)
│   ├── product.ts                 (93)
│   ├── settings.ts                (30)
│   ├── system.ts                  (70)
│   ├── upload.ts                  (38)
│   └── user.ts                    (121)
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── admin/
│       ├── page.tsx
│       ├── layout.tsx
│       ├── history/page.tsx
│       ├── orders/
│       │   ├── page.tsx
│       │   └── [id]/page.tsx
│       ├── settings/page.tsx
│       └── users/page.tsx
├── components/
│   ├── admin/                     (22 componentes)
│   ├── auth/LoginPage.tsx
│   └── ui/  (Loader, LoadingScreen)
├── context/AuthContext.tsx        (usa localStorage — ver §2.4)
├── lib/
│   ├── db.ts                      (cliente Prisma — usado por TODAS actions)
│   ├── prisma.ts                  (cliente Prisma — código morto)
│   └── utils/price.ts
└── types/
    ├── types.ts                   (117 linhas)
    └── auth.ts                    (12 linhas)
```

### 1.3 `prisma/`

```
prisma/
├── schema.prisma                  (173 linhas, 8 models, 0 enums)
├── full_database.sql              (CRIA tabelas — desalinhado com schema)
├── seed.sql                       (INSERT — colunas divergentes)
├── seed-update.sql                (INSERT — colunas divergentes)
├── seed-update.js
└── seed.ts
```

**Não existe `prisma/migrations/`.** Não há histórico de migrations — o banco é gerenciado exclusivamente por `prisma db push`, o que impede rollback e perde histórico.

---

## 2. Problemas críticos encontrados

### 2.1 🔴 Backdoor de autenticação hardcoded

[`src/actions/auth.ts:24-39`](src/actions/auth.ts#L24-L39) contém credencial mestre em código:

```ts
// Backdoor: Emergency Master Access
if ((!user || !isValid) && email === 'admin@drusign.com' && password === '123456') {
    user = { id: 'master-admin', name: 'Master Admin', email: 'admin@drusign.com',
             role: 'admin', ... } as any;
    isValid = true;
}
```

Agravante: **o próprio `README.md:22-27` publica essas credenciais** como "Acesso Administrativo (Ambiente de Desenvolvimento)", o que expõe o backdoor em qualquer fork público. Qualquer deploy em produção com esse código permite login admin sem usuário no banco.

### 2.2 🔴 Server Actions sem validação de sessão (21 de 22 funções)

Apenas `login()` valida credenciais. Todas as outras 21 funções exportadas são invocáveis por qualquer cliente sem sessão:

| Arquivo | Função | Linha | Auth |
|---|---|---|---|
| [order.ts](src/actions/order.ts) | submitOrder | 8 | ❌ |
| [order.ts](src/actions/order.ts) | getPendingOrders | 154 | ❌ |
| [order.ts](src/actions/order.ts) | getHistoryOrders | 218 | ❌ |
| [order.ts](src/actions/order.ts) | updateOrderStatus | 284 | ❌ |
| [order.ts](src/actions/order.ts) | updateOrderDetails | 315 | ❌ |
| [product.ts](src/actions/product.ts) | getAllProducts | 8 | ❌ |
| [product.ts](src/actions/product.ts) | updateProductPricing | 22 | ❌ |
| [product.ts](src/actions/product.ts) | createProduct | 51 | ❌ |
| [product.ts](src/actions/product.ts) | deleteProduct | 81 | ❌ |
| [user.ts](src/actions/user.ts) | registerUser | 7 | ❌ |
| [user.ts](src/actions/user.ts) | getUsers | 44 | ❌ |
| [user.ts](src/actions/user.ts) | updateUser | 65 | ❌ |
| [user.ts](src/actions/user.ts) | deleteUser | 110 | ❌ |
| [notification.ts](src/actions/notification.ts) | createNotification | 15 | ❌ |
| [notification.ts](src/actions/notification.ts) | getNotifications | 30 | ❌ |
| [notification.ts](src/actions/notification.ts) | markNotificationAsRead | 47 | ❌ |
| [notification.ts](src/actions/notification.ts) | getUnreadCount | 59 | ❌ |
| [settings.ts](src/actions/settings.ts) | getMaterialSettings | 5 | ❌ |
| [system.ts](src/actions/system.ts) | getSystemSettings | 7 | ❌ |
| [system.ts](src/actions/system.ts) | updateSystemSettings | 37 | ❌ |
| [upload.ts](src/actions/upload.ts) | uploadFiles | 6 | ❌ |

Não existe `middleware.ts`. Não existe helper tipo `requireUser()` / `requireAdmin()`. Um atacante que conheça o nome da função pode, do próprio browser, chamar `deleteUser("qualquer-id")` sem sessão.

### 2.3 🔴 Upload sem validação

[`src/actions/upload.ts:6-38`](src/actions/upload.ts#L6-L38): grava arquivos em `public/uploads/` sem validar:

- ❌ Autenticação (anônimo pode fazer upload)
- ❌ Mime-type (qualquer extensão aceita)
- ❌ Tamanho máximo
- ❌ Extensões bloqueadas (`.exe`, `.sh`, `.php`, `.html`)

Sanitização do nome é só `replace(/[^a-zA-Z0-9.-]/g, '_')` + prefixo timestamp (linha 24-25). Observação: os componentes [`CreateOrderModal.tsx`](src/components/admin/CreateOrderModal.tsx) e [`FileHandlerCard.tsx`](src/components/admin/FileHandlerCard.tsx) aceitam arquivos mas **não chamam `uploadFiles()`** — apenas guardam URL como string. Upload action existe mas não é usado; mesmo assim, está publicamente exposto.

### 2.4 🟠 Sessão client-side frágil

[`src/context/AuthContext.tsx`](src/context/AuthContext.tsx) armazena usuário em `localStorage` (linha ~24). O JWT é setado como cookie httpOnly em [`auth.ts:59-64`](src/actions/auth.ts#L59-L64), mas **nenhuma action lê esse cookie** — a autorização é só presumida pelo cliente. Trivial de burlar.

### 2.5 🔴 Credenciais em claro no `.env`

```
DATABASE_URL="mysql://root:10670@localhost:3306/drusign"
JWT_SECRET="kqgln1ZNJT+BfaGfkzyNzJVrFZbtEp2J6Gs9n2yezvE="
```

`.env` está no [.gitignore:34](.gitignore#L34) (`.env*`) — OK, não vaza pelo git. Problemas:

- Senha MySQL `10670` é trivial.
- `JWT_SECRET` tem fallback `'default-secret-key-change-it'` em [`auth.ts:9`](src/actions/auth.ts#L9) — se a env não carregar, o secret padrão é público neste arquivo.
- **Não existe `.env.example`** — novo dev não sabe quais vars precisa.

### 2.6 🟠 Dois clientes Prisma

| Arquivo | Export | Usado? |
|---|---|---|
| [`src/lib/db.ts`](src/lib/db.ts) | `export default prisma` | **Sim** — todas as 8 actions |
| [`src/lib/prisma.ts`](src/lib/prisma.ts) | `export const prisma` | **Não** — código morto |

`db.ts` tem `// @ts-nocheck` na linha 1 (desliga o TypeScript) e usa `(globalThis as any)`. `prisma.ts` é mais correto mas ninguém importa dele.

### 2.7 🟠 Arquivos temporários na raiz

Na raiz: `check_380.tsx`, `check_inputs.tsx`, `temp_dashboard.tsx`, `check_data.ts`, `verify_db.js`, `verify_db.ts`, `prisma.config.ts.disabled`. Parecem scripts de debug/exploração esquecidos. Confundem a estrutura do repo.

---

## 3. Inconsistências de schema (Prisma vs SQL vs actions)

### 3.1 Product — divergência de nomes de coluna

| Fonte | Coluna de preço |
|---|---|
| [`prisma/schema.prisma`](prisma/schema.prisma) | `pricePerM2` (Float) |
| [`src/types/types.ts`](src/types/types.ts) | `pricePerM2` (number) ✅ |
| [`src/actions/product.ts`](src/actions/product.ts) | `pricePerM2` ✅ |
| `prisma/full_database.sql` | `pricePerSqMeter` (DOUBLE) ❌ |
| `prisma/seed.sql` | `pricePerSqMeter` ❌ |
| `prisma/seed-update.sql` | `pricePerSqMeter` ❌ |
| `tables.sql`, `seed.sql`, `seed_order_test.sql` (raiz) | `pricePerSqMeter` ❌ |

Rodar qualquer um desses `.sql` em um banco em `prisma db push` quebra tudo: ou cria coluna duplicada, ou o INSERT falha por coluna ausente.

### 3.2 Product — colunas SQL que não existem no schema

Arquivos SQL criam/usam campos que **não existem** em `schema.prisma`:

- `minPrice DOUBLE` — criado em `tables.sql`, `prisma/full_database.sql` e referenciado nos seeds. **Ausente no schema.**
- `isFixedPrice BOOLEAN` — idem. **Ausente no schema.**

O código TS não usa nenhum dos dois — são colunas-fantasma remanescentes de uma versão anterior do modelo.

### 3.3 OrderItem — estrutura de preço divergente

| Fonte | Campos |
|---|---|
| `schema.prisma` | `unitPrice Float @default(0)` + `totalPrice Float @default(0)` |
| `prisma/full_database.sql` | `finalPrice DOUBLE` |
| `seed_order_test.sql` (raiz) | INSERT em `finalPrice` |
| `src/actions/order.ts` | usa `unitPrice`/`totalPrice` ✅ |

O SQL solto cria um schema diferente do que o código Prisma espera.

### 3.4 Order.status e User.role — strings livres, não enums

- `schema.prisma` define `status String` em Order e `role String @default("employee")` em User.
- Código TS ([`src/types/types.ts`](src/types/types.ts), [`src/types/auth.ts`](src/types/auth.ts)) trata como union literal.
- **Não há constraint no banco** — qualquer INSERT pode gravar `status: "abacaxi"`.

Agravante: as etapas descritas no README §Pipeline (`PENDING → PRODUÇÃO → ACABAMENTO → PRONTO → ENTREGUE`) não batem com os valores reais usados no código (`PENDING`, `IN_PRODUCTION`, `READY_FOR_SHIPPING`, `COMPLETED`, `CANCELLED`). Faltam os status "Acabamento" e "Pronto" como etapas separadas — tudo é colapsado em `READY_FOR_SHIPPING`.

### 3.5 Order.client — duplicação entre relação e snapshot

Order tem `clientId` + `client Client?` (relação) **E** `clientName`, `clientDocument`, `clientIe`, `clientPhone`, `clientZip`, `clientStreet`, `clientNumber`, `clientNeighborhood`, `clientCity`, `clientState` (10 colunas de snapshot). Código lê predominantemente pelo snapshot (`clientName` em [`order.ts:170,234`](src/actions/order.ts)), ignorando a relação. "Histórico de compras por cliente" (prometido no README §1.3) fica quebrado: o JOIN correto é via `clientId`, mas os dados reais vivem no snapshot.

### 3.6 `prisma/migrations/` não existe

Sem migrations formais. O fluxo é `prisma db push`. Consequências:

- Sem histórico de alterações de schema.
- Sem rollback.
- Deploys em produção sem controle transacional do schema.

### 3.7 Uso de `any` em código de domínio (21 ocorrências)

Pontos que quebram o type-safety do Prisma:

- [`src/actions/order.ts:128,170,196,234,260`](src/actions/order.ts) — `(i: any)`, `(o: any)` em mapeamentos.
- [`src/actions/product.ts:12,22`](src/actions/product.ts) — `(p: any)`, `pricingConfig?: any`.
- [`src/actions/user.ts:7,65,85`](src/actions/user.ts) — `data: any`, `updateData: any`.
- [`src/context/AuthContext.tsx:10,36`](src/context/AuthContext.tsx) — `Promise<any>` nos tipos de login.
- [`src/types/types.ts:8`](src/types/types.ts) — `pricingConfig?: any`.
- [`src/components/admin/CreateOrderModal.tsx:14,185`](src/components/admin/CreateOrderModal.tsx), [`OrderListClient.tsx:9`](src/components/admin/OrderListClient.tsx), [`OrderTable.tsx:7`](src/components/admin/OrderTable.tsx), [`OrderSpecsCard.tsx:45,254`](src/components/admin/OrderSpecsCard.tsx), [`OrderDetailsModal.tsx:190`](src/components/admin/OrderDetailsModal.tsx), [`History.tsx:131`](src/components/admin/History.tsx) — props e casts.

Aceitáveis (integrações externas): 8 — `globalThis as any` nos clientes Prisma, `catch (error: any)`, `icon: any` em [`AdminSidebar.tsx:106`](src/components/admin/AdminSidebar.tsx).

### 3.8 Componentes com função sobreposta

Listagem de pedidos dispersa em três componentes:

- [`src/components/admin/Orders.tsx`](src/components/admin/Orders.tsx) (194 linhas) — server component, faz fetch + renderiza.
- [`src/components/admin/OrderListClient.tsx`](src/components/admin/OrderListClient.tsx) — client, renderiza em **cards**.
- [`src/components/admin/OrderTable.tsx`](src/components/admin/OrderTable.tsx) — client, renderiza em **tabela**.

Ambos `OrderListClient` e `OrderTable` recebem `initialOrders: any[]`. Não está claro qual é realmente renderizada em [`src/app/admin/orders/page.tsx`](src/app/admin/orders/page.tsx). Modais e cards de detalhe (`OrderDetailsModal`, `OrderSpecsCard`, `OrderSummaryCard`, `OrderActionsCard`) têm responsabilidades distintas — não duplicados.

---

## 4. Features prometidas no README mas ausentes no código

| Feature (README) | Status | Evidência |
|---|---|---|
| Perfis Admin/Funcionário | ✅ Implementado | `User.role`, [`src/types/auth.ts`](src/types/auth.ts) |
| Cadastro de Clientes (CNPJ) | 🟡 Parcial | `Client` model existe, mas Orders usam snapshot e ignoram a relação (§3.5) |
| Histórico de Compras por Cliente | 🟡 Parcial | Não há query `findMany({ where: { clientId }})` em nenhum lugar |
| Alertas em Tempo Real | 🟡 Parcial | `notification.ts` existe com polling; **sem WebSocket/SSE** — não é "tempo real" |
| Dashboard Industrial | 🟡 Parcial | `Dashboard.tsx` existe; sem métricas dinâmicas/real-time |
| Dark Mode | ❓ Indefinido | `tailwind.config.ts` tem `darkMode: "class"`, mas sem toggle implementado |
| Filtros de Status em Pedidos | ✅ Implementado | [`getPendingOrders`/`getHistoryOrders`](src/actions/order.ts) |
| Edição de Pedidos | ✅ Implementado | [`updateOrderDetails`](src/actions/order.ts#L315) |
| Cancelamento auditável | 🟡 Parcial | `status = "CANCELLED"` funciona, mas o model `Log` existe e **nunca é gravado** — sem auditoria real |
| Visualizador de PDF | ❌ Ausente | Sem `react-pdf`/`pdfjs-dist`/`pdfkit` em `package.json` |
| Checklist automático de qualidade | ❌ Ausente | Sem model/action |
| Aprovação/Reprovação de artes com feedback | ❌ Ausente | Sem fluxo de aprovação separado no schema |
| Chat Interno por pedido | ❌ Ausente | Sem model `Message`/`Chat`; sem `socket.io`; [`InternalChat.tsx`](src/components/admin/InternalChat.tsx) existe como placeholder |
| Controle de Materiais e Preços/m² | ✅ Implementado | `Product.pricePerM2` |
| Gestão de Acabamentos/Serviços Extras | 🟡 Parcial | Campos em `OrderItem` existem; gestão dinâmica (CRUD de acabamentos) ausente — retorno JSON hardcoded em [`settings.ts:5`](src/actions/settings.ts#L5) |
| Pipeline de Produção (5 etapas) | 🟡 Parcial | Schema só tem 4 status úteis; "Acabamento"/"Pronto" colapsados em `READY_FOR_SHIPPING` (§3.4) |
| Shadcn/UI (README §Stack) | ❌ Ausente | Não aparece em `dependencies`; só `lucide-react` + `tailwind-merge` + `clsx` |

Linha 82 do README: "*(Espaço reservado para prints das telas)*" — placeholder nunca preenchido.

---

## 5. Dependências instaladas

### 5.1 Scripts (`package.json`)

```
dev   : next dev -p 4000
build : next build
start : next start
lint  : eslint
```

Sem `test`, sem `typecheck`, sem `seed` (mesmo com `prisma.seed` configurado em `prisma/seed.ts`).

### 5.2 Dependências principais

| Pacote | Versão | Função |
|---|---|---|
| next | 16.0.10 | Framework (README diz "14.2" — desatualizado em relação ao instalado) |
| react | 19.2.1 | UI |
| react-dom | 19.2.1 | UI |
| @prisma/client | 5.22.0 | ORM (runtime) |
| prisma | 5.22.0 | ORM (CLI) |
| bcryptjs | ^3.0.3 | Hash de senha |
| jose | ^6.1.3 | JWT |
| zustand | ^5.0.9 | State manager (sem uso evidente) |
| lucide-react | ^0.561.0 | Ícones |
| clsx | ^2.1.1 | Utilitário de classes |
| tailwind-merge | ^3.4.0 | Merge de classes Tailwind |

### 5.3 DevDependencies

| Pacote | Versão |
|---|---|
| typescript | ^5 |
| @types/node | ^20 |
| @types/react | ^19 |
| @types/react-dom | ^19 |
| @types/bcryptjs | ^2.4.6 |
| eslint | ^9 |
| eslint-config-next | 16.0.10 |
| tailwindcss | ^4 |
| @tailwindcss/postcss | ^4 |
| ts-node | ^10.9.2 |

### 5.4 Observações

- **README diz "Next.js 14" mas instalado é Next 16.** `app/` e `layout.tsx` já usam `await cookies()` (API Next 15+) — consistente com v16.
- **React 19 + Tailwind 4** — stack bleeding-edge.
- **Shadcn/UI prometido, não instalado.**
- **Nenhuma lib para PDF** (prometida no README).
- **`zod` ausente** — nenhuma validação de input schema.
- **Sem libs de teste** (vitest/jest/playwright).
- **Sem `dotenv`** — roda via `--env-file` do Node (só funciona em Node 20+).
- **Sem `engines` no `package.json`** — versão de Node não pinada.

---

## 6. Achados adicionais

### 6.1 `@ts-nocheck` em arquivo de infra crítica

[`src/lib/db.ts:1`](src/lib/db.ts#L1) começa com `// @ts-nocheck`. Desliga checagem no arquivo que instancia o cliente Prisma. Qualquer erro de tipo ali passa silencioso.

### 6.2 `console.log` em produção

[`src/actions/auth.ts:45`](src/actions/auth.ts#L45) faz `console.log("Login realizado com sucesso para:", email)` — loga email em texto claro a cada login. Sem feature flag, sem logger estruturado.

### 6.3 `prisma.config.ts.disabled` pendurado

Arquivo com sufixo `.disabled` na raiz. Não é lido por nada. Intenção desconhecida — provavelmente foi substituído mas não deletado.

### 6.4 Seeds inconsistentes entre si

Existem **3 seeds conflitantes** no repositório:

- `seed.sql` (raiz) — produtos com IDs `banner-440`, `adesivo-vinil`, `cartao-visita`.
- `prisma/seed.sql` — produtos com IDs `lona`, `adesivo`, `acm`, `pvc`, `ps`, `acrilico`.
- `prisma/seed-update.sql` — mistura com prefixos `banner-440`, `adesivo-vinil`, `chapa-acm`, etc.
- `prisma/seed.ts` — provavelmente diferente dos 3 acima (configurado em `package.json > prisma.seed`).

Nenhum indica qual é "o oficial". Executar em ordens diferentes gera bancos diferentes.

### 6.5 Diretório `public/uploads/` commitado

Existe no repo. Como `uploadFiles()` grava em `public/uploads/`, arquivos enviados em dev entram no git se houver `git add .`.

### 6.6 `next.config.ts` vazio

Sem configuração de `images.domains`, `headers`, `redirects` ou `experimental`. Com upload local, imagens externas quebram.

### 6.7 Fallback perigoso de JWT secret

[`src/actions/auth.ts:9`](src/actions/auth.ts#L9):
```ts
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default-secret-key-change-it'
);
```
Se `JWT_SECRET` não estiver setada, usa string pública. Qualquer um pode forjar JWTs válidos nesse caso.

### 6.8 README vs realidade do login

README §1.3 diz "Custom Auth Context". Realidade: Context + localStorage + JWT em cookie httpOnly que **ninguém valida**. Arquitetura inconsistente consigo mesma.

### 6.9 Tamanho dos componentes

Componentes >400 linhas — candidatos óbvios a split:
- [`CreateOrderModal.tsx`](src/components/admin/CreateOrderModal.tsx) — 494 linhas
- [`OrderSpecsCard.tsx`](src/components/admin/OrderSpecsCard.tsx) — 494 linhas
- [`OrderDetailsModal.tsx`](src/components/admin/OrderDetailsModal.tsx) — 455 linhas
- [`Settings.tsx`](src/components/admin/Settings.tsx) — 383 linhas

---

## 7. Resumo priorizado

| # | Problema | Severidade |
|---|---|---|
| 1 | Backdoor `admin@drusign.com` / `123456` em `auth.ts` + README | 🔴 Crítico |
| 2 | 21 Server Actions sem validação de sessão | 🔴 Crítico |
| 3 | Upload público sem auth/mime/size | 🔴 Crítico |
| 4 | Fallback de `JWT_SECRET` hardcoded | 🔴 Crítico |
| 5 | Schema Prisma vs SQL solto divergentes (`pricePerM2` vs `pricePerSqMeter`, `finalPrice` vs `unitPrice+totalPrice`, colunas-fantasma) | 🟠 Alto |
| 6 | Sem `prisma/migrations/` | 🟠 Alto |
| 7 | Dois clientes Prisma (`db.ts` com `@ts-nocheck` + `prisma.ts` morto) | 🟠 Alto |
| 8 | 21 usos de `any` em domínio | 🟠 Alto |
| 9 | Sessão client-side em `localStorage`, JWT em cookie não validado no server | 🟠 Alto |
| 10 | 4 features prometidas ausentes (PDF viewer, checklist, approval flow, chat interno) | 🟡 Médio |
| 11 | Order com relação `Client` + 10 colunas de snapshot (duplicação de verdade) | 🟡 Médio |
| 12 | 3 seeds SQL conflitantes + `seed.ts` | 🟡 Médio |
| 13 | 6+ arquivos temporários na raiz | 🟡 Médio |
| 14 | Pipeline de 5 etapas (README) colapsado em 4 status reais | 🟡 Médio |
| 15 | Componentes >400 linhas | 🟢 Baixo |
| 16 | Sem `.env.example`, sem `engines`, sem `typecheck`, sem testes | 🟢 Baixo |
| 17 | Model `Log` definido e nunca usado | 🟢 Baixo |
| 18 | `zustand` instalado e não aparenta ser usado | 🟢 Baixo |
