-- Clean up old data
DELETE FROM `OrderItem`;
DELETE FROM `Product`;

-- Insert Products
INSERT INTO `Product` (`id`, `name`, `description`, `pricePerSqMeter`, `minPrice`, `isFixedPrice`, `pricingConfig`, `createdAt`, `updatedAt`, `image`) VALUES
('lona', 'Lona', 'Lona para banners e faixas.', 50.00, 20.00, 0, NULL, NOW(), NOW(), '/placeholder.jpg'),
('adesivo', 'Adesivo', 'Adesivo vinil para diversas aplicações.', 65.00, 15.00, 0, NULL, NOW(), NOW(), '/placeholder.jpg'),
('acm', 'ACM', 'Placa de Alumínio Composto.', 120.00, 50.00, 0, NULL, NOW(), NOW(), '/placeholder.jpg'),
('pvc', 'PVC', 'Placa de PVC.', 120.00, 30.00, 0, NULL, NOW(), NOW(), '/placeholder.jpg'),
('ps', 'PS (Chapa)', 'Poliestireno.', 150.00, 30.00, 0, NULL, NOW(), NOW(), '/placeholder.jpg'),
('acrilico', 'Acrílico', 'Chapa de Acrílico.', 350.00, 50.00, 0, '{\"hasThickness\": true, \"thicknessOptions\": [\"1mm\", \"2mm\", \"3mm\", \"4mm\", \"5mm\", \"6mm\", \"8mm\"], \"pricesByThickness\": {\"1mm\": 280, \"2mm\": 350, \"3mm\": 500, \"4mm\": 650, \"5mm\": 800, \"6mm\": 950, \"8mm\": 1200}}', NOW(), NOW(), '/placeholder.jpg');
