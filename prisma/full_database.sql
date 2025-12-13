-- 1. CRIAÇÃO DO BANCO DE DADOS
CREATE DATABASE IF NOT EXISTS DruSign;
USE DruSign;

-- 2. ESTRUTURA ATUALIZADA (Baseada no Prisma)

-- Tabela de Produtos
CREATE TABLE IF NOT EXISTS Product (
    id VARCHAR(191) NOT NULL,
    name VARCHAR(191) NOT NULL,
    description TEXT,
    pricePerSqMeter DOUBLE NOT NULL,
    minPrice DOUBLE NOT NULL,
    isFixedPrice BOOLEAN NOT NULL DEFAULT false,
    image VARCHAR(191),
    pricingConfig JSON, -- Campo Novo: Suporta preços por espessura/acabamento
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

-- 3. DADOS INICIAIS (Seed Atualizado)

-- Limpar tabela antes de inserir (opcional)
-- DELETE FROM OrderItem;
-- DELETE FROM Product;

INSERT INTO Product (id, name, description, pricePerSqMeter, minPrice, isFixedPrice, pricingConfig, createdAt, updatedAt)
VALUES 
('banner-440', 'Lona', 'Lona 440g para banners e faixas.', 50.00, 20.00, false, '{}', NOW(), NOW()),
('adesivo-vinil', 'Adesivo', 'Adesivo Vinil para diversas aplicações.', 65.00, 15.00, false, '{}', NOW(), NOW()),
('chapa-acm', 'ACM', 'Placa de Alumínio Composto.', 120.00, 50.00, false, '{}', NOW(), NOW()),
('chapa-pvc', 'PVC', 'Placa de PVC.', 120.00, 30.00, false, '{}', NOW(), NOW()),
('chapa-ps', 'PS (Chapa)', 'Poliestireno.', 150.00, 80.00, false, '{}', NOW(), NOW()),
('chapa-acrilico', 'Acrílico', 'Chapa de Acrílico.', 350.00, 100.00, false, '{"hasThickness": true, "thicknessOptions": ["1mm", "2mm", "3mm", "4mm", "5mm", "6mm", "8mm"], "pricesByThickness": {"1mm": 280, "2mm": 350, "3mm": 500, "4mm": 650, "5mm": 800, "6mm": 950, "8mm": 1200}}', NOW(), NOW())
ON DUPLICATE KEY UPDATE 
pricePerSqMeter=VALUES(pricePerSqMeter), 
pricingConfig=VALUES(pricingConfig),
updatedAt=NOW();

-- 4. COMO VER OS DADOS
-- Opção A: Executar este script no seu cliente MySQL (Workbench, DBeaver).
-- Opção B (Mais fácil): Rodar `npx prisma studio` no terminal do projeto.

SELECT * FROM Product;
