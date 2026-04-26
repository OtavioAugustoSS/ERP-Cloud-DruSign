# Setup do banco de dados — DruSign

Fluxo único, gerenciado por Prisma migrations.

## Pré-requisitos

- Node 20+
- MySQL 8+ (local, container ou remoto)
- Variáveis preenchidas em `.env` (ver `.env.example`):
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `SEED_ADMIN_EMAIL` (email do admin inicial)
  - `SEED_ADMIN_PASSWORD` (mínimo 8 caracteres; será hasheada com bcrypt)

## Primeira vez

```bash
# 1. instale dependências
npm install

# 2. crie o database vazio no MySQL
#    (no client MySQL: `CREATE DATABASE drusign;` — ajuste o nome se mudar
#     o DATABASE_URL)

# 3. aplique todas as migrations
npm run db:migrate

# 4. popule com admin + catálogo de produtos
npm run db:seed
```

Depois disso, `npm run dev` sobe a aplicação em <http://localhost:4000>.
Faça login com o `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` que você definiu.

## Mudou o `schema.prisma`?

Sempre que editar `prisma/schema.prisma`:

```bash
npm run db:migrate -- --name <descricao_curta_em_snake_case>
```

Isso gera uma nova pasta em `prisma/migrations/` e aplica no banco local.
**Não use `prisma db push` neste projeto** — ele pula migrations e quebra
o histórico.

## Reset completo (perde dados)

```bash
# pelo Prisma — drop, recreate, aplica migrations e roda seed
npx prisma migrate reset
```

## Visualizar dados

```bash
npx prisma studio
```

Abre uma UI em <http://localhost:5555>.

## Troubleshooting

- Erro `P1001` (can't reach database): cheque o MySQL e o `DATABASE_URL`.
- Erro `P3014` ao migrar: rode `npx prisma migrate resolve --applied <name>`
  ou, em dev, `npx prisma migrate reset` para zerar.
- Erro do seed `Variável obrigatória ... não definida`: preencha
  `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` em `.env`.
