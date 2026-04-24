# PLANO DE REFORMA — DruSign ERP

> Plano sequencial, 8 fases, para eliminar os 18 problemas catalogados em [`DIAGNOSTICO.md`](DIAGNOSTICO.md).
> Nenhuma fase foi executada ainda. Este documento é referência de trabalho — atualize à medida que cada fase fechar.

---

## Como rodar o projeto

Pré-requisitos: **Node 20+** (o projeto usa `--env-file` nativo), **MySQL 8+** local ou em container, **Git**.

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# editar .env com DATABASE_URL e JWT_SECRET reais
# (.env.example é criado na FASE 0)

# 3. Aplicar schema ao banco
#    Enquanto não existir prisma/migrations/ (pré-FASE 2):
npx prisma db push
#    A partir da FASE 2, passa a ser:
npx prisma migrate dev

# 4. Popular banco
npx prisma db seed

# 5. Rodar app (porta 4000)
npm run dev
```

Acesse <http://localhost:4000>.

---

## Convenção de commits

Uma fase por commit/PR. Prefixo `fase-N:` obrigatório no título:

```
fase-0: limpa raiz, cria .env.example, branch de reforma
fase-1: remove auth backdoor e adiciona requireAuth em todas as actions
fase-2: consolida schema, gera migration inicial, admin seed hasheado
fase-3: zera any em domínio e tipa PricingConfig
fase-4: unifica preços via Product (remove getMaterialSettings)
fase-5: CRM funcional — CRUD de clientes + autocomplete
fase-6: máquina de status + logs de auditoria reais
fase-7: upload seguro e PDF real da OS
fase-8: polimento visual, toasts, a11y, dedup de componentes
```

**Regras**:

- Uma fase por PR. Não misturar fases no mesmo commit.
- PR só é aprovado se o **Critério de pronto** da fase estiver objetivamente satisfeito.
- Não pular fases: cada uma depende das anteriores (ver seção **Dependências** em cada bloco).
- Mudou o schema Prisma? Sempre gere migration (`prisma migrate dev --name <nome>`). Nunca mais `db push` depois da FASE 2.
- Build + lint devem passar ao fim de cada fase (`npm run build && npm run lint`).

---

# FASE 0 — Preparação

### Objetivo
Deixar o repositório pronto para a reforma: branch dedicada, documentação mínima de env, limpeza dos arquivos-lixo da raiz, garantia de que o `npm run dev` sobe antes de qualquer mudança funcional.

### Arquivos envolvidos
- `.env.example` (criar)
- `.gitignore` (ajustar se preciso)
- `package.json` (adicionar `engines`, scripts `typecheck`, `db:seed`, `db:migrate`)
- Raiz — remover: `check_380.tsx`, `check_inputs.tsx`, `temp_dashboard.tsx`, `check_data.ts`, `verify_db.js`, `verify_db.ts`, `prisma.config.ts.disabled`
- `public/uploads/` — remover conteúdo rastreado, adicionar `.gitkeep`, adicionar `public/uploads/*` ao `.gitignore`
- `README.md` — remover §"🔑 Acesso Administrativo (Ambiente de Desenvolvimento)" (linhas 20-27), atualizar versão do Next (16, não 14)

### Passos
1. Criar branch: `git checkout -b reforma/fase-0-prep`.
2. Deletar os 7 arquivos de lixo da raiz (`check_*`, `temp_*`, `verify_*`, `prisma.config.ts.disabled`).
3. Criar `.env.example` com:
   ```
   DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/drusign"
   JWT_SECRET="gere-com: openssl rand -base64 32"
   NODE_ENV="development"
   ```
4. Rotacionar o `JWT_SECRET` e a senha do MySQL locais (ambos fracos hoje). Atualizar `.env` pessoal; o arquivo continua no `.gitignore`.
5. Em `package.json`, adicionar:
   ```json
   "engines": { "node": ">=20.0.0" },
   "scripts": {
     "dev": "next dev -p 4000",
     "build": "next build",
     "start": "next start",
     "lint": "eslint",
     "typecheck": "tsc --noEmit",
     "db:migrate": "prisma migrate dev",
     "db:seed": "prisma db seed"
   }
   ```
6. Remover do README.md as linhas 20-27 (§"🔑 Acesso Administrativo"). Corrigir badge "Next.js-14.2" para "16".
7. Em `.gitignore`, adicionar `/public/uploads/*` e `!public/uploads/.gitkeep`. Remover do índice git o que já foi commitado: `git rm -r --cached public/uploads` e criar `public/uploads/.gitkeep`.
8. Rodar `npm install && npm run dev` e abrir <http://localhost:4000> — login e dashboard devem carregar como antes.
9. Commit: `fase-0: limpa raiz, cria .env.example, branch de reforma`.

### Critério de pronto
- ✅ `git status` limpo depois do commit; branch `reforma/fase-0-prep` pushed.
- ✅ `ls` na raiz não mostra mais `check_*`, `temp_*`, `verify_*`, `.disabled`.
- ✅ `.env.example` existe e documenta as 2 vars obrigatórias.
- ✅ `package.json` tem `engines.node >= 20` e scripts `typecheck`, `db:migrate`, `db:seed`.
- ✅ README não expõe mais credenciais.
- ✅ `npm run dev` sobe em localhost:4000 e login funciona.
- ✅ `npm run typecheck` e `npm run lint` passam (mesmo que com warnings — anotar para fases futuras).

### Dependências
Nenhuma.

---

# FASE 1 — Segurança crítica

### Objetivo
Fechar todas as 4 falhas 🔴 de segurança: remover backdoor, obrigar sessão em toda Server Action, proteger `/admin/*` por middleware, eliminar fallback público de `JWT_SECRET` e ter um `logout` real no servidor.

### Arquivos envolvidos
- [`src/actions/auth.ts`](src/actions/auth.ts) — remover backdoor (linhas 24-39); endurecer `JWT_SECRET` (linha 9); adicionar `logout()`.
- **Criar** `src/lib/auth/session.ts` — helpers `getSession()`, `requireUser()`, `requireAdmin()`, `getJwtSecret()`.
- **Criar** `src/middleware.ts` — protege `/admin/*` e redireciona para `/` se sem cookie `session` válido.
- Todas as 8 actions em [`src/actions/`](src/actions/) — primeira linha de cada função (exceto `login`) chama `requireUser()` ou `requireAdmin()`:
  - `order.ts` — 5 funções (`submitOrder`, `getPendingOrders`, `getHistoryOrders`, `updateOrderStatus`, `updateOrderDetails`)
  - `product.ts` — 3 admin (`updateProductPricing`, `createProduct`, `deleteProduct`) + 1 user (`getAllProducts`)
  - `user.ts` — 4 admin (todas)
  - `notification.ts` — 4 user
  - `settings.ts`, `system.ts` — leitura user; `updateSystemSettings` admin
  - `upload.ts` — user
- [`src/context/AuthContext.tsx`](src/context/AuthContext.tsx) — parar de armazenar user em `localStorage`; fonte da verdade passa a ser o cookie. Adicionar ação de `logout`.
- [`src/components/admin/AdminHeader.tsx`](src/components/admin/AdminHeader.tsx) — wire do botão de logout à nova action.

### Passos
1. Branch `reforma/fase-1-auth`.
2. Em `src/actions/auth.ts`:
   - Apagar bloco linhas 24-39 (backdoor).
   - Substituir linha 9 por `const JWT_SECRET = getJwtSecret()` onde `getJwtSecret()` lança erro se `process.env.JWT_SECRET` for vazio.
   - Remover `console.log` da linha 45.
   - Adicionar `export async function logout()` que faz `(await cookies()).delete('session')`.
3. Criar `src/lib/auth/session.ts`:
   - `getSession()`: lê cookie `session`, verifica JWT com `jose.jwtVerify`, retorna `{ id, email, role } | null`.
   - `requireUser()`: wraps `getSession()`, throw `new Error('UNAUTHORIZED')` se null.
   - `requireAdmin()`: wraps `requireUser()`, throw se `role !== 'admin'`.
   - `getJwtSecret()`: lê `process.env.JWT_SECRET`; lança se ausente.
4. Criar `src/middleware.ts`:
   ```ts
   export const config = { matcher: ['/admin/:path*'] };
   ```
   Verifica cookie `session` com `jose.jwtVerify`; redireciona para `/` se ausente/inválido.
5. Percorrer cada function exportada em `src/actions/*.ts` e adicionar **primeira linha útil**: `const session = await requireUser()` (ou `requireAdmin()` para escritas administrativas). As exceções são `login` e `logout`.
6. Ajustar `AuthContext` para:
   - Remover leituras/escritas de `localStorage`.
   - Estado inicial vem de uma action `getCurrentUser()` nova (wraps `getSession()`).
   - `logout` chama a action `logout()` e limpa estado.
7. Testar manualmente:
   - Login válido → `/admin` carrega.
   - Tentar `admin@drusign.com/123456` → **falha** (backdoor removido).
   - Desativar o cookie manualmente no devtools → `/admin/*` redireciona para `/`.
   - Em navegador anônimo, tentar chamar via console uma server action exportada (ex: `fetch` ao endpoint interno) → resposta de erro `UNAUTHORIZED`.
8. Commit: `fase-1: remove auth backdoor e adiciona requireAuth em todas as actions`.

### Critério de pronto
- ✅ `grep -n "123456" src/` → nada. `grep -n "admin@drusign.com" src/` → nada.
- ✅ `grep -rn "default-secret-key" src/` → nada.
- ✅ `grep -rn "use server" src/actions/` e inspecionar cada arquivo: toda função (exceto `login`, `logout`) chama `requireUser()` ou `requireAdmin()` na 1ª linha.
- ✅ `src/middleware.ts` existe e protege `/admin/:path*`.
- ✅ README.md não referencia mais as credenciais de backdoor.
- ✅ Login/logout funcionam no browser; rota `/admin` inacessível sem cookie.
- ✅ `npm run typecheck` passa.

### Dependências
FASE 0.

---

# FASE 2 — Schema único

### Objetivo
Uma única fonte da verdade do schema: `prisma/schema.prisma` + `prisma/migrations/` + `prisma/seed.ts`. Elimina os 4 SQLs conflitantes, o cliente Prisma morto e o `@ts-nocheck`. Introduz enums reais para `OrderStatus` e `UserRole`.

### Arquivos envolvidos
- Deletar: `seed.sql`, `seed_order_test.sql`, `tables.sql` (raiz); `prisma/full_database.sql`, `prisma/seed.sql`, `prisma/seed-update.sql`, `prisma/seed-update.js`.
- Deletar: [`src/lib/prisma.ts`](src/lib/prisma.ts) (código morto).
- [`src/lib/db.ts`](src/lib/db.ts) — remover `// @ts-nocheck`, tipar globalThis corretamente.
- [`prisma/schema.prisma`](prisma/schema.prisma) — adicionar enums `OrderStatus`, `UserRole`; trocar `status String` e `role String` pelos enums; revisar se `minPrice`/`isFixedPrice` devem entrar ou ficar fora (decisão: ficam fora; eram lixo).
- `prisma/migrations/` — criar via `prisma migrate dev --name init`.
- [`prisma/seed.ts`](prisma/seed.ts) — único seed oficial: cria admin com senha **hasheada via bcrypt** (lê de env `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`, ou falha), insere catálogo mínimo de produtos.
- `.env.example` — documentar `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD`.
- `SETUP_DATABASE.md` — reescrever referenciando só o fluxo `prisma migrate` + `prisma db seed`.

### Passos
1. Branch `reforma/fase-2-schema`.
2. Backup (dump) do banco local se tiver dados úteis: `mysqldump drusign > backup.sql`.
3. Deletar os 7 arquivos SQL/JS listados acima.
4. Deletar `src/lib/prisma.ts`. Confirmar com `grep -r "from '@/lib/prisma'" src/` → nada.
5. Em `src/lib/db.ts`: remover `@ts-nocheck`; declarar `globalThis` com `declare global { var prisma: PrismaClient | undefined }`; tipar retorno do singleton; manter export default.
6. Editar `prisma/schema.prisma`:
   - Adicionar:
     ```prisma
     enum UserRole { admin employee }
     enum OrderStatus { PENDING IN_PRODUCTION FINISHING READY_FOR_PICKUP DELIVERED CANCELLED }
     ```
   - `User.role`: `UserRole @default(employee)`.
   - `Order.status`: `OrderStatus @default(PENDING)`.
   - Revisar se quer remover os 10 campos de snapshot do Order já (recomendado: **mantenha por enquanto**, será resolvido na FASE 5 junto com o backfill).
7. Dropar banco local: `DROP DATABASE drusign; CREATE DATABASE drusign;`.
8. `npx prisma migrate dev --name init` — gera `prisma/migrations/<timestamp>_init/`.
9. Reescrever `prisma/seed.ts`:
   - Lê `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` de `process.env` (obrigatórios; falha se vazios).
   - `bcrypt.hash(password, 10)` antes de inserir.
   - Insere ~5 produtos (lona, adesivo, acm, pvc, acrílico) com `pricePerM2` realista.
10. Atualizar `.env.example` e `.env` local com `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`.
11. `npx prisma db seed` e verificar `SELECT id, email, role FROM User;` no MySQL.
12. Rodar app: login com o novo admin real funciona.
13. Reescrever `SETUP_DATABASE.md` com o fluxo novo (3 comandos).
14. Commit: `fase-2: consolida schema, gera migration inicial, admin seed hasheado`.

### Critério de pronto
- ✅ `find . -name "*.sql" -not -path "*/node_modules/*" -not -path "*/prisma/migrations/*"` → nada.
- ✅ `ls src/lib/` → só `db.ts` e `utils/`.
- ✅ `grep -n "@ts-nocheck" src/` → nada.
- ✅ `prisma/migrations/` existe com pelo menos um diretório `*_init`.
- ✅ `schema.prisma` tem `enum OrderStatus` e `enum UserRole`.
- ✅ `npx prisma db seed` cria admin com senha hasheada (verificar: `password` começa com `$2b$`).
- ✅ Login com `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` funciona.
- ✅ `npm run build` passa.

### Dependências
FASE 0, FASE 1 (enums só fazem sentido depois que o auth está estável).

---

# FASE 3 — Tipos TypeScript sólidos

### Objetivo
Zerar os 21 usos de `any` em código de domínio. Tipos gerados pelo Prisma viram a fonte da verdade; DTOs de entrada (ex.: `CreateOrderInput`) ficam separados dos modelos do banco.

### Arquivos envolvidos
- [`src/types/types.ts`](src/types/types.ts) — refatorar: `pricingConfig` vira um discriminated union tipado; `Order`, `OrderItem`, `Product` passam a usar `Prisma.XxxGetPayload<...>` com `include` quando necessário. Criar seção DTOs.
- [`src/types/auth.ts`](src/types/auth.ts) — manter, mas trocar `role: string` por `UserRole` importado.
- [`src/actions/order.ts`](src/actions/order.ts) — linhas 128, 170, 196, 234, 260: substituir `(i: any) =>` por `(i: OrderItem) =>`. Importar tipos do Prisma.
- [`src/actions/product.ts`](src/actions/product.ts) — linhas 12, 22: `(p: Product)`, `pricingConfig?: PricingConfig`.
- [`src/actions/user.ts`](src/actions/user.ts) — linhas 7, 65, 85: criar DTOs `RegisterUserInput`, `UpdateUserInput`, `UpdateUserData`.
- [`src/context/AuthContext.tsx`](src/context/AuthContext.tsx) — linhas 10, 36: `Promise<LoginResult>` tipado (`{ user: SessionUser } | { error: string }`).
- Componentes com `any[]`: [`OrderListClient.tsx:9`](src/components/admin/OrderListClient.tsx), [`OrderTable.tsx:7`](src/components/admin/OrderTable.tsx), [`CreateOrderModal.tsx:14,185`](src/components/admin/CreateOrderModal.tsx), [`OrderSpecsCard.tsx:45,254`](src/components/admin/OrderSpecsCard.tsx), [`OrderDetailsModal.tsx:190`](src/components/admin/OrderDetailsModal.tsx), [`History.tsx:131`](src/components/admin/History.tsx).

### Passos
1. Branch `reforma/fase-3-types`.
2. Criar `src/types/pricing.ts`:
   ```ts
   export type PricingConfig =
     | { kind: 'perM2'; minM2?: number }
     | { kind: 'perUnit'; unit: 'unidade' | 'cento' | 'milheiro'; step?: number }
     | { kind: 'fixed'; fixedPrice: number };
   ```
   Adicionar `@@map` ou validar via zod/discriminada em runtime ao ler do banco.
3. Em `src/types/types.ts`, trocar `pricingConfig?: any` por `pricingConfig?: PricingConfig`. Importar `Prisma` e criar tipos `OrderWithItems`, `OrderItemWithProduct`.
4. Criar `src/types/dtos.ts` com DTOs de entrada: `OrderInput`, `RegisterUserInput`, `UpdateUserInput`, `CreateProductInput`.
5. Percorrer cada `any` listado no §3.7 do diagnóstico e substituir pelo tipo certo.
6. Ajustar componentes que recebem `any[]` para `OrderWithItems[]` (ou similar).
7. Rodar `npm run typecheck`. Corrigir um-a-um.
8. `grep -rn ": any" src/ | grep -v "globalThis" | grep -v "catch"` → deve listar apenas as 8 ocorrências aceitáveis (Prisma singleton, catches, `icon: any`).
9. Testar no browser: login, listar pedidos, criar pedido, editar.
10. Commit: `fase-3: zera any em domínio e tipa PricingConfig`.

### Critério de pronto
- ✅ `grep -rn ": any" src/ | grep -v "globalThis as any" | grep -v "catch (error: any)" | grep -v "icon: any"` → **0 ocorrências**.
- ✅ `tsconfig.json` pode ativar `"noExplicitAny": "error"` no eslint e passar.
- ✅ `npm run typecheck` passa limpo.
- ✅ Fluxo completo (login → criar pedido → listar → editar) funciona no browser.

### Dependências
FASE 2 (enums já existem; tipos gerados estão atualizados).

---

# FASE 4 — Unificar preços

### Objetivo
Uma única fonte para preços: a tabela `Product`. Remove `getMaterialSettings` hardcoded. O modal de criação de pedido passa a buscar `Product[]` reais e `OrderItem.productId` vira **obrigatório** (não-nulo).

### Arquivos envolvidos
- **Deletar** [`src/actions/settings.ts`](src/actions/settings.ts) inteiro.
- [`src/components/admin/CreateOrderModal.tsx`](src/components/admin/CreateOrderModal.tsx) — hoje recebe `products?: any[]` ou lê do settings hardcoded. Passa a receber `products: Product[]` via server component pai, com `getAllProducts()`.
- [`src/app/admin/orders/page.tsx`](src/app/admin/orders/page.tsx) (e `/admin/orders/[id]/page.tsx`) — carrega `products` no server e passa via props.
- [`src/components/admin/OrderSpecsCard.tsx`](src/components/admin/OrderSpecsCard.tsx) (494 linhas) — mesma coisa. Usa `pricePerM2` vindo do Product selecionado.
- [`src/lib/utils/price.ts`](src/lib/utils/price.ts) — função `calculatePrice` passa a receber `PricingConfig` tipado.
- [`prisma/schema.prisma`](prisma/schema.prisma) — `OrderItem.productId: String` (remover `?`) e criar migration. Decidir o que fazer com `OrderItem` órfão — backfill ou descartar (ver passo 5).
- [`src/actions/order.ts`](src/actions/order.ts) — validar `productId` presente em `submitOrder` e `updateOrderDetails`.

### Passos
1. Branch `reforma/fase-4-unified-pricing`.
2. Levantar lista de onde `getMaterialSettings` é chamado: `grep -rn "getMaterialSettings" src/`. Remover cada import/chamada.
3. Refatorar `CreateOrderModal` e `OrderSpecsCard`:
   - Remover dados mockados de materiais internos.
   - Receber `products: Product[]` via props.
   - Select de produto preenche `productId`, `pricePerM2` sai dele.
4. Em `src/app/admin/orders/page.tsx` (e em `/admin/orders/[id]/page.tsx` se for manter — ver FASE 6), carregar `const products = await getAllProducts()` e passar para o modal.
5. Backfill (SQL de migração):
   - Listar `SELECT id FROM OrderItem WHERE productId IS NULL;`. Se ≤ 10 registros, apagar na mão ou vincular manualmente.
   - Se muitos, criar um Product "legacy" e fazer `UPDATE OrderItem SET productId = 'legacy' WHERE productId IS NULL;`.
6. Editar `schema.prisma`: `productId String` (sem `?`), idem para `product Product`. Gerar migration: `npx prisma migrate dev --name order_item_product_required`.
7. Em `submitOrder`/`updateOrderDetails`, validar com zod que cada item tem `productId` não vazio antes do `prisma.orderItem.create`.
8. Deletar `src/actions/settings.ts`.
9. Testar no browser: criar pedido novo selecionando Produto X com 2x3m, preço bate com `pricePerM2 * 6`.
10. Commit: `fase-4: unifica preços via Product (remove getMaterialSettings)`.

### Critério de pronto
- ✅ `src/actions/settings.ts` não existe mais.
- ✅ `grep -rn "getMaterialSettings" src/` → nada.
- ✅ Schema: `OrderItem.productId` obrigatório; migration aplicada.
- ✅ `SELECT COUNT(*) FROM OrderItem WHERE productId IS NULL` → 0.
- ✅ `CreateOrderModal` não tem mais array hardcoded de materiais.
- ✅ Criar pedido no browser: o select mostra produtos reais; preço calculado confere.

### Dependências
FASE 2, FASE 3.

---

# FASE 5 — CRUD de Clientes

### Objetivo
Fazer o model `Client` virar de fato útil: criar página `/admin/clients`, trocar o input livre de cliente do modal por autocomplete sobre `Client[]`, migrar as 10 colunas de snapshot do `Order` para referências à tabela real, habilitar "histórico de compras por cliente".

### Arquivos envolvidos
- **Criar** `src/actions/client.ts` com `listClients`, `searchClients(query)`, `getClientById`, `createClient`, `updateClient`, `deleteClient`, `getClientOrderHistory`.
- **Criar** `src/app/admin/clients/page.tsx` (listagem) e `src/app/admin/clients/[id]/page.tsx` (detalhes + histórico).
- **Criar** `src/components/admin/ClientList.tsx`, `src/components/admin/ClientForm.tsx`, `src/components/admin/ClientAutocomplete.tsx`.
- [`src/components/admin/AdminSidebar.tsx`](src/components/admin/AdminSidebar.tsx) — adicionar item "Clientes".
- [`src/components/admin/CreateOrderModal.tsx`](src/components/admin/CreateOrderModal.tsx) — trocar inputs `clientName/Document/...` por `ClientAutocomplete` (seleciona existente OU cria novo inline).
- [`prisma/schema.prisma`](prisma/schema.prisma) — remover os 10 campos de snapshot do `Order`; deixar só `clientId: String` (obrigatório) + `client Client @relation(...)`. Migration.
- [`src/actions/order.ts`](src/actions/order.ts) — `submitOrder`/`updateOrderDetails`: aceitam `clientId` + (opcional) DTO para criar Client novo; retornam `Order` com `include: { client: true, items: true }`.
- [`src/components/admin/Orders.tsx`](src/components/admin/Orders.tsx), `OrderRow.tsx`, `OrderDetailsModal.tsx` — ler `order.client.name` em vez de `order.clientName`.

### Passos
1. Branch `reforma/fase-5-clients`.
2. Criar `src/actions/client.ts` com as 7 funções. Todas com `requireUser()`/`requireAdmin()` apropriado.
3. Criar `ClientList`, `ClientForm`, `ClientAutocomplete`. Autocomplete usa debounce + `searchClients`.
4. Criar páginas `/admin/clients` (lista + botão "Novo cliente") e `/admin/clients/[id]` (dados + tabela de pedidos via `getClientOrderHistory`).
5. Adicionar item "Clientes" no `AdminSidebar`.
6. **Backfill** dos snapshots para `Client`:
   - Migration SQL customizada: para cada `Order` com `clientId NULL`, criar `Client` baseado em `clientName+clientDocument` (dedup por document se existir; senão por name+phone).
   - `UPDATE Order SET clientId = <novo-id> WHERE clientId IS NULL;`.
   - Validar: `SELECT COUNT(*) FROM Order WHERE clientId IS NULL` → 0.
7. Editar schema: remover os 10 campos snapshot do Order; `clientId: String` (obrigatório); gerar migration `drop_order_client_snapshot`.
8. Atualizar `submitOrder`/`updateOrderDetails` para trabalhar com `clientId` + inclusão de `client` no retorno.
9. Atualizar componentes que liam `order.clientName` etc. para ler `order.client.name` etc.
10. Testar:
    - Criar cliente novo via `/admin/clients` → aparece na lista.
    - Criar pedido usando autocomplete de cliente existente → pedido lista `client.name` corretamente.
    - Abrir `/admin/clients/[id]` → tabela de pedidos populada.
11. Commit: `fase-5: CRM funcional — CRUD de clientes + autocomplete`.

### Critério de pronto
- ✅ `/admin/clients` lista, cria, edita, deleta clientes.
- ✅ `/admin/clients/[id]` mostra histórico real via `Order.clientId`.
- ✅ Schema: `Order.clientId` obrigatório; 10 campos de snapshot removidos.
- ✅ `grep -rn "clientName\|clientDocument\|clientIe\|clientPhone\|clientZip\|clientStreet\|clientNumber\|clientNeighborhood\|clientCity\|clientState" src/ prisma/schema.prisma` → 0 ocorrências (só nomes de campos em `Client`).
- ✅ `SELECT COUNT(*) FROM \`Order\` WHERE clientId IS NULL` → 0.
- ✅ Modal de pedido usa autocomplete; não aceita mais cliente "solto".

### Dependências
FASE 4 (pois a estrutura de Order estabiliza antes do snapshot ser removido).

---

# FASE 6 — Fluxo de Pedidos robusto

### Objetivo
O Order vira uma máquina de estados de verdade: `canTransition(from, to)` validada no servidor; `Log` passa a ser gravado em toda transição e edição; cancelamento exige motivo; decide-se o destino de `/admin/orders/[id]` (hoje existe mas não está claro se é usado).

### Arquivos envolvidos
- **Criar** `src/lib/order/transitions.ts` — `canTransition(from: OrderStatus, to: OrderStatus): boolean`, `nextAllowed(from)`, mapa:
  ```
  PENDING          → IN_PRODUCTION, CANCELLED
  IN_PRODUCTION    → FINISHING, CANCELLED
  FINISHING        → READY_FOR_PICKUP, CANCELLED
  READY_FOR_PICKUP → DELIVERED, CANCELLED
  DELIVERED        → (terminal)
  CANCELLED        → (terminal)
  ```
- [`src/actions/order.ts`](src/actions/order.ts) — `updateOrderStatus` valida com `canTransition` antes de gravar; grava `Log` após sucesso. `updateOrderDetails` grava `Log` para cada campo alterado (diff).
- **Criar** `src/lib/audit/log.ts` — `logAction({ userId, action, targetType, targetId, meta? })`.
- [`prisma/schema.prisma`](prisma/schema.prisma) — `Log` passa a ter `targetType`, `targetId`, `meta Json?`. `Order` ganha `cancellationReason String?`. Migration.
- [`src/components/admin/OrderDetailsModal.tsx`](src/components/admin/OrderDetailsModal.tsx) — seção "Histórico" que lista `Log[]` do pedido. Cancelamento abre prompt de motivo.
- [`src/app/admin/orders/[id]/page.tsx`](src/app/admin/orders/[id]/page.tsx) — **decisão**: virar a página oficial de detalhe (substituindo o modal em casos complexos) OU ser deletada. Recomendação: **virar página oficial** (imprimir, PDF, chat, tudo cabe em página; modal fica para edição rápida).

### Passos
1. Branch `reforma/fase-6-order-flow`.
2. Criar `src/lib/order/transitions.ts` com o mapa acima. Export `canTransition`, `nextAllowed`.
3. Alterar `schema.prisma`:
   - `Log`: campos `targetType String`, `targetId String`, `meta Json?`.
   - `Order`: `cancellationReason String?`.
   - Migration: `order_state_machine`.
4. Criar `src/lib/audit/log.ts` com `logAction(...)`. Usa `requireUser()` internamente para pegar `userId`.
5. Editar `updateOrderStatus` em `src/actions/order.ts`:
   - Ler order atual.
   - Validar `canTransition(order.status, newStatus)`. Se falso, retornar `{ error: 'Transição inválida' }`.
   - Se `newStatus === 'CANCELLED'`, exigir `reason: string` não vazio; gravar em `cancellationReason`.
   - Atualizar; chamar `logAction`.
6. Editar `updateOrderDetails`:
   - Computar diff (campos alterados).
   - Para cada campo: `logAction` com `meta: { field, from, to }`.
7. Decidir destino de `/admin/orders/[id]/page.tsx`:
   - **Recomendado**: virar página de detalhe completa — ProductionPipeline visível, Log em tabela, ações (avançar status, cancelar com motivo, editar).
   - Alternativa: deletar se o modal cobrir tudo.
8. Em `OrderDetailsModal`, adicionar seção "Histórico (auditoria)" populada de `Log` do pedido (query: `log.findMany({ where: { targetType: 'Order', targetId } })`).
9. Botão "Cancelar" abre modal menor com textarea obrigatória de motivo.
10. Testar:
    - Tentar pular de PENDING → READY_FOR_PICKUP → deve ser rejeitado.
    - PENDING → IN_PRODUCTION → FINISHING → READY_FOR_PICKUP → DELIVERED funciona; aparece 4 linhas no histórico.
    - Cancelar sem motivo → barrado; com motivo → OK, motivo exibido.
11. Commit: `fase-6: máquina de status + logs de auditoria reais`.

### Critério de pronto
- ✅ `src/lib/order/transitions.ts` exporta `canTransition`.
- ✅ Transições inválidas retornam erro e não persistem.
- ✅ `SELECT COUNT(*) FROM Log` cresce conforme pedidos são editados.
- ✅ `Order.cancellationReason` não-nulo sempre que `status = 'CANCELLED'`.
- ✅ OrderDetailsModal mostra aba/seção de histórico.
- ✅ `/admin/orders/[id]` resolvida (página ativa OU arquivo deletado + rota limpa).

### Dependências
FASE 2 (enum OrderStatus), FASE 3 (tipos), FASE 5 (cliente já é relação).

---

# FASE 7 — Upload seguro + PDF

### Objetivo
Torna o upload de arquivos produção-ready: auth, validação de MIME e tamanho, storage fora de `/public` com acesso via rota autenticada. Substitui o "PDF" atual (placeholder HTML) por PDF real da Ordem de Serviço gerado server-side.

### Arquivos envolvidos
- [`src/actions/upload.ts`](src/actions/upload.ts) — reescrita com `requireUser()`, whitelist de MIME, limite de size (ex.: 25 MB), storage em `./private/uploads/` (fora de public), retorna `fileId`.
- **Criar** `src/app/api/uploads/[fileId]/route.ts` — GET autenticado que serve o arquivo via stream; checa owner/permissão antes.
- **Criar** `src/lib/upload/validate.ts` — lista MIMEs permitidos, utilitário de validação.
- [`src/components/admin/FileHandlerCard.tsx`](src/components/admin/FileHandlerCard.tsx), [`FileInspectionCard.tsx`](src/components/admin/FileInspectionCard.tsx), [`CreateOrderModal.tsx`](src/components/admin/CreateOrderModal.tsx) — passar a de fato chamar `uploadFiles` e guardar o `fileId` retornado.
- [`prisma/schema.prisma`](prisma/schema.prisma) — opcional: model `UploadedFile { id, orderItemId, path, mimeType, size, uploadedBy, createdAt }` para rastrear. Migration.
- **Instalar** `@react-pdf/renderer` ou `pdfkit` (preferir `@react-pdf/renderer` por compor via JSX).
- **Criar** `src/lib/pdf/order-os.tsx` — gera PDF da OS.
- **Criar** `src/app/api/orders/[id]/pdf/route.ts` — GET autenticado retorna PDF da OS com `Content-Type: application/pdf`.
- Substituir qualquer botão "Gerar OS" que hoje abre HTML por link para essa rota.
- `.gitignore` — adicionar `/private/`.

### Passos
1. Branch `reforma/fase-7-upload-pdf`.
2. Criar `src/lib/upload/validate.ts`:
   - `ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png', 'image/tiff', 'application/postscript']`
   - `MAX_SIZE_BYTES = 25 * 1024 * 1024`.
3. Reescrever `src/actions/upload.ts`:
   - `requireUser()` na primeira linha.
   - Valida cada `file.type` e `file.size` contra o whitelist.
   - Salva em `./private/uploads/<uuid>-<safeName>`.
   - Grava row em `UploadedFile` (se o model for criado no passo 6).
   - Retorna `{ id, path }`; **não retorna URL pública**.
4. Criar `src/app/api/uploads/[fileId]/route.ts`:
   - `requireUser()`.
   - Busca `UploadedFile` (ou valida path). Confere permissão (ex: usuário é admin OU é dono do pedido).
   - Stream do arquivo como resposta.
5. Ajustar `FileHandlerCard`/`CreateOrderModal` para chamar `uploadFiles()` e armazenar o `fileId` (não mais string de URL).
6. (Opcional mas recomendado) Criar model `UploadedFile`; migration `add_uploaded_file_tracking`.
7. Deletar `public/uploads/` do repo: `git rm -r public/uploads && mkdir -p private/uploads && echo "/private/" >> .gitignore`.
8. Instalar PDF lib: `npm i @react-pdf/renderer`.
9. Criar `src/lib/pdf/order-os.tsx` — componente React PDF com cabeçalho (logo, CNPJ), dados do cliente, tabela de itens, total, QR (opcional).
10. Criar `src/app/api/orders/[id]/pdf/route.ts`:
    - `requireUser()`, carrega order com items+client+product.
    - Renderiza com `renderToStream` e retorna `new Response(stream, { headers: { 'Content-Type': 'application/pdf' }})`.
11. No `OrderActionsCard`, trocar botão "Gerar OS" por `<a href={`/api/orders/${id}/pdf`} target="_blank">`.
12. Testar:
    - Upload de JPG de 2MB → OK; .exe → rejeitado; PDF de 40MB → rejeitado.
    - Anônimo acessando `/api/uploads/<id>` → 401.
    - Clicar "Gerar OS" → baixa PDF real com dados do pedido.
13. Commit: `fase-7: upload seguro e PDF real da OS`.

### Critério de pronto
- ✅ `uploadFiles` valida MIME, tamanho, exige sessão.
- ✅ Arquivos persistem em `./private/uploads/`, nunca em `public/`.
- ✅ `.gitignore` inclui `/private/`.
- ✅ `/api/uploads/<id>` exige sessão e checa permissão.
- ✅ `/api/orders/<id>/pdf` retorna PDF válido (`file output.pdf` mostra `PDF document`).
- ✅ UI consegue enviar arquivo, o pedido referencia o fileId, e o download autenticado funciona.

### Dependências
FASE 1 (requireUser), FASE 5 (Order.client está estável para constar no PDF).

---

# FASE 8 — Polimento

### Objetivo
Qualidade final: trocar `alert()` por toast, adicionar estados de loading, checar responsividade e acessibilidade, deletar componentes duplicados (`OrderListClient` × `OrderTable`) e partir arquivos gigantes (>400 linhas) em peças menores.

### Arquivos envolvidos
- **Instalar** `sonner` (ou `react-hot-toast`). Adicionar `<Toaster />` no `src/app/layout.tsx`.
- [`src/components/admin/AdminSidebar.tsx`](src/components/admin/AdminSidebar.tsx), Header, modais — substituir `alert(...)` por `toast.success/error/info`.
- [`src/components/admin/OrderListClient.tsx`](src/components/admin/OrderListClient.tsx) **ou** [`OrderTable.tsx`](src/components/admin/OrderTable.tsx) — **decisão**: manter **um**. Recomendação: manter `OrderTable` (denso, é um ERP), deletar `OrderListClient`. Atualizar [`src/app/admin/orders/page.tsx`](src/app/admin/orders/page.tsx) para usar o único componente.
- Dividir arquivos >400 linhas (lista em §6.9 do diagnóstico):
  - [`CreateOrderModal.tsx`](src/components/admin/CreateOrderModal.tsx) → quebrar em `ClientStep`, `ItemsStep`, `ReviewStep`.
  - [`OrderSpecsCard.tsx`](src/components/admin/OrderSpecsCard.tsx) → `ItemRow`, `ItemForm`, `PricingBreakdown`.
  - [`OrderDetailsModal.tsx`](src/components/admin/OrderDetailsModal.tsx) → abas: Dados/Itens/Histórico.
  - [`Settings.tsx`](src/components/admin/Settings.tsx) → seções por tab.
- Loading states: usar `loading.tsx` nos segmentos Next (`/admin/orders`, `/admin/clients`, etc.). `Suspense` em boundaries de fetch.
- Acessibilidade: passada com axe/Lighthouse — `aria-label` em ícones-botão, `role="dialog"` + focus trap nos modais, contraste dos tons cyan x slate.
- Responsividade: testar breakpoints sm/md/lg nas páginas principais (list, modal, detalhe). Ajustar classes Tailwind.
- Model `Log` revisitado (já usado em fase 6): garantir que a UI de auditoria está OK.
- `zustand`: decidir se vira store de UI (ex.: notificações) ou é removido; se for removido, `npm uninstall zustand`.
- README.md: atualizar features implementadas/ausentes, screenshots reais no lugar do placeholder da linha 82.

### Passos
1. Branch `reforma/fase-8-polish`.
2. `npm i sonner`. Registrar `<Toaster position="top-right" richColors />` no layout raiz.
3. `grep -rn "alert(" src/` → substituir cada uma por `toast.*`.
4. Escolher o componente de listagem canônico (`OrderTable`). `grep -rn "OrderListClient" src/` → migrar callers para `OrderTable`. Deletar `OrderListClient.tsx`.
5. Quebrar os 4 arquivos >400 linhas em subcomponentes. Objetivo: nenhum arquivo `.tsx` de domínio >300 linhas.
6. Adicionar `loading.tsx` em cada segmento `/admin/*`.
7. Rodar Lighthouse a11y em `/admin` e `/admin/orders/[id]`. Score ≥ 90.
8. Passada de responsividade: DevTools em 375px (mobile), 768px (tablet). Corrigir overflows mais gritantes.
9. Decidir `zustand`: se não vai usar no curto prazo, `npm uninstall zustand`.
10. Atualizar README:
    - Lista de features reflete o que **existe** depois da reforma.
    - Remover mention a Shadcn se não foi adotado.
    - Tirar placeholder da linha 82 (colocar screenshots ou remover a seção).
11. Rodar `npm run build && npm run lint && npm run typecheck` — tudo passando.
12. Commit: `fase-8: polimento visual, toasts, a11y, dedup de componentes`.

### Critério de pronto
- ✅ `grep -rn "alert(" src/` → 0 ocorrências.
- ✅ `OrderListClient.tsx` **ou** `OrderTable.tsx` existe, não os dois.
- ✅ Nenhum `.tsx` em `src/components/admin/` com mais de 300 linhas.
- ✅ `loading.tsx` presente em cada `/admin/*` (exceto rotas triviais).
- ✅ Lighthouse a11y ≥ 90 nas páginas principais.
- ✅ README atualizado com features reais.
- ✅ `npm run build && npm run typecheck && npm run lint` sem erros.
- ✅ Fluxo end-to-end (login → criar cliente → criar pedido → avançar status → baixar PDF) funciona sem erros de console.

### Dependências
Todas as fases anteriores (é o fechamento).

---

## Matriz de severidade × fase

| Problema (de DIAGNOSTICO.md §7) | Severidade | Resolvido na fase |
|---|---|---|
| Backdoor admin@drusign.com / 123456 | 🔴 | 1 |
| 21 actions sem validação de sessão | 🔴 | 1 |
| Upload público sem auth/mime/size | 🔴 | 7 (primeiros passos em 1) |
| Fallback hardcoded de JWT_SECRET | 🔴 | 1 |
| SQL solto vs schema.prisma | 🟠 | 2 |
| Sem prisma/migrations/ | 🟠 | 2 |
| Dois clientes Prisma + @ts-nocheck | 🟠 | 2 |
| 21 usos de `any` em domínio | 🟠 | 3 |
| Sessão em localStorage sem validação server | 🟠 | 1 |
| PDF viewer / checklist / approval / chat ausentes | 🟡 | 7 (PDF); chat/checklist ficam pós-reforma |
| Order com 10 campos de snapshot | 🟡 | 5 |
| 3 seeds SQL conflitantes + seed.ts | 🟡 | 2 |
| Arquivos temporários na raiz | 🟡 | 0 |
| Pipeline 5 etapas vs 4 status | 🟡 | 2 + 6 |
| Componentes >400 linhas | 🟢 | 8 |
| Sem .env.example / engines / typecheck / testes | 🟢 | 0 (testes ficam pós-reforma) |
| Log definido e não usado | 🟢 | 6 |
| zustand sem uso aparente | 🟢 | 8 |

---

## Fora do escopo desta reforma

Ficam para um "PLANO_FASE_2" (pós-reforma), porque não cabem nas 8 fases sem explodir:

- Chat interno por pedido (model novo + WebSocket/Pusher).
- Checklist automático de pré-produção.
- Fluxo formal de aprovação/reprovação de arte (model + estado).
- Integração NF-e / fiscal.
- Suite de testes (vitest/playwright).
- Observabilidade (logger estruturado, Sentry).
- Dashboard com métricas em tempo real.
