export interface Product {
    id: string;
    name: string;
    pricePerM2: number;
    category: string;
    description?: string | null;
    image?: string | null;
    pricingConfig?: any; // JSON config for thickness, finishing, etc.
    createdAt?: Date;
    updatedAt?: Date;
}

export enum OrderStatus {
    PENDING = 'PENDING',
    IN_PRODUCTION = 'IN_PRODUCTION',
    READY_FOR_SHIPPING = 'READY_FOR_SHIPPING',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED'
}

export interface OrderItemInput {
    productId: string;
    width: number;
    height: number;
    quantity: number;
    serviceType?: string;
    finishing?: string;
    instructions?: string;
    fileUrl?: string; // Add fileUrl
    finalPrice?: number; // Add finalPrice
}

export interface OrderInput {
    clientName: string;
    clientPhone?: string;
    clientDocument?: string;

    // Legacy/Flat support (Optional)
    productName?: string;
    width?: number;
    height?: number;
    quantity?: number;
    productId?: string;
    serviceType?: string;
    finishing?: string;
    instructions?: string;
    previewUrl?: string;
    previewUrls?: string[];

    totalPrice: number;
    filePaths?: string[];
    items?: OrderItemInput[];
}

export interface Order extends OrderInput {
    id: string;
    status: OrderStatus;
    createdAt: Date;
    clientDocument?: string;
    clientPhone?: string;
    filePaths?: string[];
    previewUrl?: string; // Optional for the mock UI
    previewUrls?: string[];
}
