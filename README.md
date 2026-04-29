# 🖨️ DruSign — ERP para Gráficas e Comunicação Visual

![Status](https://img.shields.io/badge/Status-Pronto_para_Produção-success?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-ORM-teal?style=for-the-badge&logo=prisma)
![MySQL](https://img.shields.io/badge/MySQL-Database-orange?style=for-the-badge&logo=mysql)
![TailwindCSS](https://img.shields.io/badge/Tailwind-v4-38B2AC?style=for-the-badge&logo=tailwind-css)

> **Sistema de gestão para gráficas e empresas de comunicação visual.** Controle de pedidos, clientes, materiais, preços e produção em um único lugar.

---

## 📖 Sobre

DruSign é um ERP interno desenvolvido sob medida para o fluxo de gráficas:
vendas por metro quadrado, materiais com variantes (espessura/subtipo),
acabamentos específicos, fluxo de produção em etapas
(impressão → acabamento → envio) e impressão de Ordem de Serviço.

---

## 🚀 Funcionalidades

### 🔐 Autenticação e Segurança
- Login com JWT (sessão de 24h, cookie `httpOnly` + `secure`)
- Hash de senha com bcrypt (salt 10)
- Rate limiting no login (5 tentativas / 15 min)
- Middleware protege todas as rotas `/admin/*`
- Controle de papel: **Administrador** vs **Funcionário**
- Headers de segurança: HSTS, X-Frame-Options, Permissions-Policy

### 📊 Dashboard
- Receita do mês, pedidos do mês, ticket médio, total de clientes
- Status de produção em tempo real (Pendente, Produção, Acabamento, Pronto)
- Top materiais consumidos
- Alertas de entregas vencendo / vencidas
- Pedidos recentes
- Relógio dinâmico

### 📋 Gestão de Pedidos
- Lista filtrada por status, busca por cliente/produto/OS
- Workflow: Pendente → Em Produção → Acabamento → Pronto p/ Envio → Concluído
- Cancelamento com confirmação inline
- Histórico de pedidos finalizados/cancelados (filtros: período, busca, status)
- Página de detalhe do pedido com pipeline visual animado

### 👥 Clientes (CRM)
- Cadastro completo: identificação fiscal, endereço (com auto-fill via ViaCEP),
  observações internas
- Avatar com gradiente determinístico
- Contagem de pedidos por cliente
- Bloqueio de exclusão se houver pedidos vinculados

### 🏭 Materiais e Preços
- Catálogo por categoria (Lona, Vinil, ACM, etc.)
- Variantes por **espessura** ou **subtipo** com preços independentes
- Edição de preços inline (auto-save no blur)
- Impressão de OS no formato gráfica

### 👤 Usuários (admin only)
- CRUD de usuários do sistema
- Definição de papel (Admin ou Funcionário)
- Cards de estatística: total, admins, funcionários

### ⚙️ Configurações (admin only)
- Dados da empresa (nome, CNPJ, telefone, email, endereço)
  — usados na impressão da OS
- Catálogo de materiais e preços

### 🔔 Notificações
- Sino persistente na sidebar (acesso de qualquer página)
- Notificações automáticas entre setores
  (Vendas → Produção → Acabamento → Envio)
- Auto-prune de notificações > 30 dias
- Marcação individual ou em massa como lidas

### 🎨 Interface
- Sidebar colapsável com **lock/unlock** persistido em localStorage
- Animações de entrada em cascata
- Confirmações inline (sem `window.confirm`)
- Toast de feedback para ações
- 100% em português brasileiro
- Tema dark com ciano como cor primária

---

## 🛠️ Stack

- **Framework:** Next.js 16 (App Router, Server Components, Server Actions)
- **UI:** React 19, TailwindCSS v4, lucide-react
- **Banco:** MySQL via Prisma ORM 5
- **Autenticação:** JWT com `jose` + bcrypt
- **Animações:** Framer Motion + keyframes CSS
- **TypeScript:** strict mode

---

## 📦 Instalação

### Pré-requisitos
- Node.js 20+
- MySQL 8+

### 1. Clone e instale
```bash
git clone <repo-url>
cd ERP-Cloud-DruSign
npm install
```

### 2. Configure variáveis de ambiente
Copie `.env.example` para `.env` e preencha:

```env
DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/drusign"
JWT_SECRET="<gerar com: openssl rand -base64 32>"
NODE_ENV="development"
SEED_ADMIN_EMAIL="admin@empresa.com"
SEED_ADMIN_PASSWORD="<senha forte com 8+ caracteres>"
```

### 3. Configure o banco
```bash
npx prisma migrate deploy   # aplica todas as migrations
npx prisma generate         # gera o client tipado
npm run db:seed             # cria admin inicial + catálogo de materiais
```

### 4. Inicie em desenvolvimento
```bash
npm run dev
```

Acesse http://localhost:4000.

### 5. Build de produção
```bash
npm run build
npm run start
```

---

## 🚀 Deploy em produção

O sistema é otimizado para hospedagem com **filesystem persistente**
(VPS, Docker, hospedagem dedicada — não Vercel/serverless por causa
do upload local em `/public/uploads`).

### Checklist de produção
- [ ] `JWT_SECRET` com 32+ caracteres gerado via `openssl rand -base64 32`
- [ ] Banco MySQL hospedado e acessível
- [ ] Variáveis de ambiente configuradas no servidor
- [ ] `npx prisma migrate deploy` rodado no banco de produção
- [ ] `npm run db:seed` rodado UMA vez (admin inicial)
- [ ] HTTPS configurado (HSTS está ativo nos headers)
- [ ] Backup automático do banco MySQL agendado
- [ ] Pasta `public/uploads/` com permissão de escrita pelo Node

---

## 📁 Estrutura

```
src/
├── app/                 # App Router (rotas)
│   ├── admin/          # Painel administrativo
│   ├── layout.tsx      # Layout raiz com AuthProvider
│   └── page.tsx        # Login
├── actions/            # Server Actions (auth, order, client, etc.)
├── components/
│   ├── admin/          # Componentes do painel
│   ├── auth/           # LoginPage
│   └── ui/             # Componentes reutilizáveis
├── context/            # React Contexts (AuthContext)
├── lib/
│   ├── auth/           # Sessão JWT + guards
│   ├── utils/          # Máscaras, ViaCEP, preço
│   └── db.ts           # Cliente Prisma singleton
├── middleware.ts       # Proteção de rotas /admin/*
└── types/              # Tipos TypeScript

prisma/
├── schema.prisma       # Schema do banco
├── migrations/         # Migrations versionadas
└── seed.ts             # Seed inicial
```

---

## 🤝 Contribuição

Issues e PRs são bem-vindos. Para mudanças grandes,
abra uma issue antes para discussão.

---

## 📝 Licença

Projeto interno — uso restrito.
