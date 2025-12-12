-- Inserir Produtos Iniciais no DruSign
USE drusign;

INSERT INTO Product (id, name, description, pricePerSqMeter, minPrice, isFixedPrice, image, createdAt, updatedAt)
VALUES 
('banner-440', 'Lona 440g (Banner)', 'Lona resistente ideal para fachadas e banners promocionais.', 35.00, 20.00, false, '/placeholder-banner.jpg', NOW(), NOW()),
('adesivo-vinil', 'Adesivo Vinil Brilho', 'Adesivo de alta durabilidade para vitrines e superfícies lisas.', 45.00, 15.00, false, '/placeholder-sticker.jpg', NOW(), NOW()),
('cartao-visita', 'Cartão de Visita (1000 un)', 'Papel couché 300g, verniz total frente.', 0, 89.90, true, '/placeholder-card.jpg', NOW(), NOW())
ON DUPLICATE KEY UPDATE name=VALUES(name);

SELECT * FROM Product;
