# 🖨️ DruSign - ERP Web-to-Print Inteligente

![Status do Projeto](https://img.shields.io/badge/Status-Em_Desenvolvimento-yellow?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-ORM-teal?style=for-the-badge&logo=prisma)
![MySQL](https://img.shields.io/badge/Database-MySQL-orange?style=for-the-badge&logo=mysql)
![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)

> **Uma solução completa de E-commerce e Gestão Industrial para Comunicação Visual e Gráficas.**

---

## 📖 Sobre o Projeto

O **DruSign** revoluciona a gestão de gráficas e empresas de comunicação visual ao integrar o fluxo de vendas online (Web-to-Print) com o controle total da produção industrial. 

Diferente de sistemas genéricos, o DruSign entende a complexidade do nicho: vendas por metro quadrado, arquivos pesados (TIFF/PDF), acabamentos específicos (ilhós, bainha) e etapas de produção (Impressão, Corte, Serralheria).

## 🔑 Acesso Administrativo (Ambiente de Desenvolvimento)

Para acessar o painel administrativo com permissões totais ("Master Admin"):

*   **Email:** `admin@drusign.com`
*   **Senha:** `123456`

> **Nota:** Em produção, essas credenciais devem ser removidas ou alteradas.

## 🚀 Funcionalidades Atuais

O sistema oferece soluções completas para a gestão do negócio:

### 👥 Gestão de Usuários e Clientes (CRM)
*   **Controle de Acesso:** Perfis de Administrador e Funcionário.
*   **Cadastro de Clientes:** Armazenamento de dados fiscais (CPF/CNPJ) e contatos.
*   **Histórico de Compras:** Visualização rápida de pedidos anteriores por cliente.

### 🔔 Sistema de Notificações
*   **Alertas em Tempo Real:** Notificações visuais para novas atualizações.
*   **Comunicação Integrada:** Avisos automáticos entre setores (Vendas ➔ Produção).

### 🔧 Painel Administrativo (Admin)
*   **📊 Dashboard Industrial:** Visão geral em tempo real com métricas críticas e design Dark Mode focado em produtividade.
*   **📋 Gestão de Pedidos Avançada:**
    *   Listagem completa com filtros de status.
    *   **Edição de Pedidos:** Altere instruções, dados do cliente e acabamentos sem sair da tela.
    *   **Cancelamento Seguro:** Fluxo de cancelamento com histórico auditável.
*   **🔍 Verificação de Arquivos (Pre-flight):**
    *   Visualizador de PDF integrado.
    *   Checklist automático de qualidade.
    *   Aprovação e Reprovação de artes com feedback direto.
*   **💬 Chat Interno:** Comunicação contextual vinculada a cada pedido para alinhar detalhes entre vendas e produção.
*   **⚙️ Configurações Dinâmicas:**
    *   Controle de Materiais e Preços por m².
    *   Gestão de Acabamentos e Serviços Extras.

### 🏭 Pipeline de Produção Detalhado
1.  **Pendente:** Pedido recebido, aguardando aprovação financeira/arte.
2.  **Produção:** Arquivos liberados para impressão/confecção.
3.  **Acabamento:** Etapa de corte, solda, ilhós, envernizamento.
4.  **Pronto:** Finalizado e aguardando retirada ou envio.
5.  **Entregue:** Ciclo completo encerrado.

---

## 🛠️ Stack Tecnológica

O projeto utiliza o que há de mais moderno no ecossistema React para garantir performance, segurança e escalabilidade:

*   **Frontend:** [Next.js 14](https://nextjs.org/) (App Router), React Server Components.
*   **Estilização:** Tailwind CSS + Shadcn/UI + Lucide Icons.
*   **Backend:** Next.js Server Actions (API Routes focadas em performance).
*   **Banco de Dados:** MySQL.
*   **ORM:** [Prisma](https://www.prisma.io/) (Type-safe database access).
*   **Gerenciamento de Estado:** Zustand.
*   **Autenticação:** Custom Auth Context.

---

## 📸 Screenshots

*(Espaço reservado para prints das telas: Dashboard, Detalhes do Pedido, Modal de Edição)*

---

## 📦 Como Rodar Localmente

Siga os passos abaixo para configurar o ambiente de desenvolvimento:

### Pré-requisitos
*   Node.js (v18+)
*   MySQL (Local ou Docker)

### 1. Clone o Repositório
```bash
git clone https://github.com/seu-usuario/e-commerce-drusign.git
cd e-commerce-drusign
```

### 2. Configure as Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto com as credenciais do banco:

```properties
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE"
# Outras chaves necessárias...
```

### 3. Instale as Dependências
```bash
npm install
# ou
yarn install
```

### 4. Configure o Banco de Dados
```bash
# Gera o cliente Prisma
npx prisma generate

# Envia o schema para o banco (cria as tabelas)
npx prisma db push

# (Opcional) Popula o banco com dados iniciais
npm run seed
```

### 5. Inicie o Servidor
```bash
npm run dev
```

Acesse [http://localhost:4000](http://localhost:4000) no seu navegador.

---

## 🤝 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir Issues ou Pull Requests para melhorias.