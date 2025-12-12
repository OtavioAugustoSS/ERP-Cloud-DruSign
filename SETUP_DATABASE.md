# Configuração do Banco de Dados MySQL

Como você não tem o MySQL ou Docker instalados na máquina, você precisará instalar o servidor MySQL. Siga os passos abaixo:

## 1. Instalar o MySQL Server

1. Baixe o **MySQL Installer for Windows** no site oficial:
   [https://dev.mysql.com/downloads/installer/](https://dev.mysql.com/downloads/installer/)
   (Escolha a versão **mysql-installer-community**).
2. Execute o instalador.
3. Na seleção de tipo (Setup Type), escolha **"Server only"** ou **"Developer Default"**.
4. Siga os passos. **IMPORTANTE**:
   - Defina uma senha para o usuário `root` (ex: `root` ou `admin123`) e **ANOTE ELA**.
   - Mantenha a porta padrão `3306`.
5. Finalize a instalação e certifique-se de que o MySQL Service está rodando.

## 2. Configurar o Projeto

1. Abra o arquivo `.env` na raiz do projeto.
2. Atualize a variável `DATABASE_URL` com a senha que você definiu:

```env
# Substitua 'SUA_SENHA' pela senha que você criou na instalação.
# Se a porta for diferente de 3306, ajuste também.
DATABASE_URL="mysql://root:SUA_SENHA@localhost:3306/drusign"
```

## 3. Criar o Banco de Dados

Após instalar e configurar o `.env`, volte ao terminal (VS Code) e rode:

```bash
# Isso cria o banco de dados 'drusign' e as tabelas automaticamente
npx prisma db push
```

## 4. Visualizar e Gerenciar Dados

Para ver o banco de dados funcionando e adicionar dados manualmente:

```bash
npx prisma studio
```

Isso abrirá uma interface web onde você pode ver suas tabelas (`Product`, `OrderItem`) e adicionar produtos para testar.
