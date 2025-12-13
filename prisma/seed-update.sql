-- Clean up old products to avoid confusion (optional, but cleaner)
DELETE FROM `OrderItem`;
DELETE FROM `Product`;

-- Insert Products with specific IDs requested by user
INSERT INTO `Product` (`id`, `name`, `description`, `pricePerSqMeter`, `minPrice`, `isFixedPrice`, `pricingConfig`, `createdAt`, `updatedAt`, `image`) VALUES
('banner-440', 'Lona 440g', 'Lona resistente para banners.', 50.00, 20.00, 0, NULL, NOW(), NOW(), '/placeholder.jpg'),
('adesivo-vinil', 'Adesivo Vinil', 'Adesivo vinil padrão.', 65.00, 15.00, 0, NULL, NOW(), NOW(), '/placeholder.jpg'),
('chapa-acm', 'Chapa ACM', 'Alumínio Composto.', 120.00, 50.00, 0, NULL, NOW(), NOW(), '/placeholder.jpg'),
('chapa-pvc', 'Chapa PVC', 'Placa de PVC.', 120.00, 30.00, 0, NULL, NOW(), NOW(), '/placeholder.jpg'),
('chapa-ps', 'Chapa PS', 'Poliestireno.', 150.00, 30.00, 0, NULL, NOW(), NOW(), '/placeholder.jpg'),
('chapa-acrilico', 'Chapa Acrílico', 'Acrílico cast.', 350.00, 50.00, 0, '{\"hasThickness\": true, \"thicknessOptions\": [\"1mm\", \"2mm\", \"3mm\", \"4mm\", \"5mm\", \"6mm\", \"8mm\"], \"pricesByThickness\": {\"1mm\": 280, \"2mm\": 350, \"3mm\": 500, \"4mm\": 650, \"5mm\": 800, \"6mm\": 950, \"8mm\": 1200}}', NOW(), NOW(), '/placeholder.jpg');
