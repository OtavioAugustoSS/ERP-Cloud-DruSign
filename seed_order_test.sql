-- Opcional: Inserir um Item de Pedido para teste
-- Isso simula o que aconteceria se alguém comprasse um Banner de 2m x 1m

USE drusign;

INSERT INTO OrderItem (id, productId, width, height, fileUrl, finalPrice, quantity, createdAt)
VALUES 
('item-test-01', 'banner-440', 2.0, 1.0, 'http://exemplo.com/arte.pdf', 70.00, 1, NOW());

-- Explicação do cálculo: 
-- Banner custa R$ 35/m².
-- 2 metros x 1 metro = 2m².
-- 2 * 35 = R$ 70,00.

SELECT * FROM OrderItem;
