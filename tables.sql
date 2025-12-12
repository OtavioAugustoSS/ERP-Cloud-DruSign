-- Criação das Tabelas do DruSign
-- Execute este script ANTES do seed.sql

USE drusign;

-- Tabela de Produtos
CREATE TABLE IF NOT EXISTS Product (
    id VARCHAR(191) NOT NULL,
    name VARCHAR(191) NOT NULL,
    description TEXT,
    pricePerSqMeter DOUBLE NOT NULL,
    minPrice DOUBLE NOT NULL,
    isFixedPrice BOOLEAN NOT NULL DEFAULT false,
    image VARCHAR(191),
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL,
    PRIMARY KEY (id)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tabela de Itens do Pedido
CREATE TABLE IF NOT EXISTS OrderItem (
    id VARCHAR(191) NOT NULL,
    productId VARCHAR(191) NOT NULL,
    width DOUBLE,
    height DOUBLE,
    fileUrl VARCHAR(191),
    finalPrice DOUBLE NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    INDEX OrderItem_productId_idx (productId),
    CONSTRAINT OrderItem_productId_fkey FOREIGN KEY (productId) REFERENCES Product(id) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
