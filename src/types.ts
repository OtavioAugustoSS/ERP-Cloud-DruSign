export interface Product {
    id: string;
    name: string;
    pricePerM2: number;
    category: string;
}

export enum OrderStatus {
    PENDING = 'PENDING',
    IN_PRODUCTION = 'IN_PRODUCTION',
    READY_FOR_SHIPPING = 'READY_FOR_SHIPPING',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED'
}

export interface OrderInput {
    clientName: string;
    productName: string;
    width: number;
    height: number;
    quantity: number;
    productId: string;
    totalPrice: number;
    serviceType?: string;
    finishing?: string;
    instructions: string;
    previewUrl?: string;
}

export interface Order extends OrderInput {
    id: string;
    status: OrderStatus;
    createdAt: Date;
    previewUrl?: string; // Optional for the mock UI
}
