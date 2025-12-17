import { Order, OrderInput, OrderStatus } from '../types';

// Mock Database State
let MOCK_ORDERS: Order[] = [
    // Orders cleared for manual testing
];

export const submitOrder = async (orderData: OrderInput): Promise<{ success: boolean; order?: Order; error?: string }> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    if (!orderData.productId) {
        return { success: false, error: "Produto inválido." };
    }

    const newOrder: Order = {
        ...orderData,
        id: Math.floor(Math.random() * 9000 + 1000).toString(), // Simple 4 digit ID
        status: OrderStatus.PENDING,
        createdAt: new Date(),
        previewUrl: orderData.previewUrl || undefined // Use provided URL or undefined
    };

    MOCK_ORDERS.unshift(newOrder); // Add to beginning
    console.log("Order submitted:", newOrder);

    return { success: true, order: newOrder };
};

export const getPendingOrders = async (): Promise<Order[]> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    return MOCK_ORDERS.filter(o =>
        [OrderStatus.PENDING, OrderStatus.IN_PRODUCTION, OrderStatus.READY_FOR_SHIPPING].includes(o.status)
    );
};

export const getHistoryOrders = async (): Promise<Order[]> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    return MOCK_ORDERS.filter(o =>
        [OrderStatus.COMPLETED, OrderStatus.CANCELLED].includes(o.status)
    );
};

export const updateOrderStatus = async (id: string, status: OrderStatus): Promise<{ success: boolean }> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    const index = MOCK_ORDERS.findIndex(o => o.id === id);
    if (index !== -1) {
        MOCK_ORDERS[index].status = status;
        // Force re-render if using real DB, here we modify reference
        return { success: true };
    }
    return { success: false };
};
