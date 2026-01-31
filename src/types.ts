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
    material?: string; // New
    width?: number; // Optional
    height?: number; // Optional
    quantity: number;
    serviceType?: string;
    finishing?: string;
    instructions?: string;
    customDetails?: string;
    observations?: string;
    unitPrice: number;
    totalPrice: number;
    fileUrl?: string;
}

export interface OrderInput {
    // Client Fields - Manual Snapshot
    clientName: string;
    clientPhone?: string;
    clientDocument?: string;
    clientIe?: string;
    clientZip?: string;
    clientStreet?: string;
    clientNumber?: string;
    clientNeighborhood?: string;
    clientCity?: string;
    clientState?: string;

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

    // Finances
    serviceValue?: number; // Valor Mão de Obra
    totalPrice: number;
    shippingCost?: number;
    discount?: number;

    filePaths?: string[];
    items?: OrderItemInput[];

    // Dates & Terms
    deliveryDate?: Date;
    approvalDate?: Date;
    paymentTerms?: string;
    deliveryMethod?: string;
    notes?: string;
}


// ------------------------------
// System Settings
// ------------------------------
export interface SystemSettings {
    id: string;
    companyName: string;
    companyCnpj?: string;
    companyPhone?: string;
    companyEmail?: string;
    companyAddress?: string;
}

export interface OrderItem {
    id: string;
    productId: string;
    productName: string; // Mapped
    material?: string; // New
    width: number;
    height: number;
    quantity: number;
    serviceType?: string;
    finishing?: string;
    instructions?: string;
    customDetails?: string;
    observations?: string;
    unitPrice: number;
    totalPrice: number;
}


export interface Order extends OrderInput {
    id: string;
    status: OrderStatus;
    createdAt: Date;
    // Explicit overrides or additional fields returned by backend
    items: OrderItem[];
}

