# 🖨️ DruSign - Plataforma de E-commerce Web-to-Print

![Status do Projeto](https://img.shields.io/badge/Status-Em_Desenvolvimento-yellow)
![Next.js](https://img.shields.io/badge/Next.js-14.2-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Prisma](https://img.shields.io/badge/Prisma-ORM-teal)
![MySQL](https://img.shields.io/badge/Database-MySQL-orange)

## 📖 Sobre o Projeto

O **DruSign** é uma solução completa de E-commerce e ERP focada no nicho de **Comunicação Visual e Gráficas**. Diferente de lojas virtuais comuns, este sistema implementa a lógica de **Web-to-Print**, permitindo vendas baseadas em medidas personalizadas (metro quadrado), uploads de arquivos pesados e fluxos de produção complexos.

O sistema é dividido em três módulos principais:
1.  **Painel Administrativo:** Gestão total de produtos, preços dinâmicos, verificação de arquivos (pre-flight) e controle financeiro.
2.  **Portal de Produção (Funcionários):** Interface simplificada para a equipe operacional visualizar a fila de impressão, acabamento e atualizar status dos pedidos.
3.  **E-commerce (Cliente Final):** Loja virtual onde o cliente personaliza medidas (Lona, Adesivo, ACM), envia a arte e realiza o pagamento.

---

## 🚀 Funcionalidades Principais

### 🔧 Módulo Administrativo (Foco Atual)
* **Dashboard Industrial:** Interface Dark Mode focada em produtividade.
* **Gestão de Preços Dinâmica:** Configuração de preço por m² e por espessura (ex: Acrílico 2mm vs 3mm).
* **Verificação de Arquivos:** Pré-visualização de PDFs enviados pelos clientes, checagem de tamanho e aprovação/rejeição de arte.
* **Fluxo de Pedidos:** Pipeline visual de status (Pendente -> Produção -> Acabamento -> Pronto).
* **Histórico Completo:** Registro de todos os serviços executados.

### 🏭 Módulo de Produção (Em Breve)
* Fila de tarefas por setor (Impressão, Corte, Serralheria).
* Baixa de pedidos via QR Code ou Interface Tátil.

### 🛒 Módulo E-commerce (Em Breve)
* Calculadora em tempo real (Largura x Altura x Material).
* Upload de arquivos (PDF/TIFF) integrado ao carrinho.
* Checkout transparente.

---

## 🛠️ Tech Stack

O projeto foi construído utilizando as tecnologias mais modernas do ecossistema React:

* **Frontend:** [Next.js 14](https://nextjs.org/) (App Router), React, Tailwind CSS.
* **Backend:** Next.js Server Actions (API Routes).
* **Banco de Dados:** MySQL.
* **ORM:** [Prisma](https://www.prisma.io/) (Gerenciamento de Schema e Tipagem segura).
* **Estado Global:** Zustand (Carrinho e Configurações).
* **UI Components:** Lucide React (Ícones), Shadcn/UI patterns.

---

## 📦 Como Rodar o Projeto

Siga os passos abaixo para executar a aplicação em ambiente de desenvolvimento:

### Pré-requisitos
* Node.js (v18 ou superior)
* MySQL rodando localmente ou em container Docker

### 1. Clone o repositório
```bash
git clone [https://github.com/seu-usuario/e-commerce-drusign.git](https://github.com/seu-usuario/e-commerce-drusign.git)
cd e-commerce-drusign