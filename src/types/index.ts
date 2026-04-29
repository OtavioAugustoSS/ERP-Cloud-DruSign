export type { User, UserRole, SessionUser, AuthState } from './auth';

import type {
    PricingConfig,
    BannerPricingConfig,
    TypedPricingConfig,
    ThicknessPricingConfig,
    FlexPricingConfig,
} from './pricing';
export type { PricingConfig, BannerPricingConfig, TypedPricingConfig, ThicknessPricingConfig, FlexPricingConfig };

// ----- OrderStatus -----
// Const provides enum-style access (OrderStatus.PENDING); type provides the union.
export const OrderStatus = {
    PENDING: 'PENDING',
    IN_PRODUCTION: 'IN_PRODUCTION',
    FINISHING: 'FINISHING',
    READY_FOR_SHIPPING: 'READY_FOR_SHIPPING',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
} as const;

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

// ----- Product -----
export interface Product {
    id: string;
    name: string;
    category: string;
    pricePerM2: number;
    description?: string | null;
    image?: string | null;
    pricingConfig?: PricingConfig | null;
}

// ----- Order Items -----
export interface OrderItem {
    id: string;
    productId?: string | null;
    productName?: string;
    width?: number | null;
    height?: number | null;
    quantity: number;
    serviceType?: string | null;
    finishing?: string | null;
    instructions?: string | null;
    customDetails?: string | null;
    observations?: string | null;
    unitPrice: number;
    totalPrice: number;
    material?: string | null;
    fileUrl?: string | null;
}

export interface OrderItemInput {
    productId?: string;
    width?: number;
    height?: number;
    quantity: number;
    serviceType?: string;
    finishing?: string;
    instructions?: string;
    customDetails?: string;
    observations?: string;
    unitPrice?: number;
    totalPrice?: number;
    material?: string;
    fileUrl?: string;
}

// ----- Order -----
export interface Order {
    id: string;
    clientName: string;
    clientDocument?: string | null;
    clientPhone?: string | null;
    clientIe?: string | null;
    clientZip?: string | null;
    clientStreet?: string | null;
    clientNumber?: string | null;
    clientNeighborhood?: string | null;
    clientCity?: string | null;
    clientState?: string | null;
    serviceValue?: number | null;
    totalPrice: number;
    shippingCost: number;
    discount: number;
    deliveryDate?: Date | null;
    approvalDate?: Date | null;
    paymentTerms?: string | null;
    deliveryMethod?: string | null;
    notes?: string | null;
    status: OrderStatus;
    createdAt: Date;
    filePaths: string[];
    // Legacy flat-item fields (first item fallbacks)
    productId?: string | null;
    productName?: string;
    width?: number;
    height?: number;
    quantity?: number;
    instructions?: string | null;
    items: OrderItem[];
}

export interface OrderInput {
    clientId?: string;
    clientName?: string;
    clientDocument?: string;
    clientIe?: string;
    clientPhone?: string;
    clientZip?: string;
    clientStreet?: string;
    clientNumber?: string;
    clientNeighborhood?: string;
    clientCity?: string;
    clientState?: string;
    serviceValue?: number;
    totalPrice: number;
    shippingCost?: number;
    discount?: number;
    deliveryDate?: Date;
    approvalDate?: Date;
    paymentTerms?: string;
    deliveryMethod?: string;
    notes?: string;
    filePaths?: string[];
    items: OrderItemInput[];
    // Legacy flat-item fields (used when items array is not provided)
    productId?: string;
    width?: number;
    height?: number;
    quantity?: number;
    serviceType?: string;
    finishing?: string;
    instructions?: string;
}

// ----- Client -----
export interface Client {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    document?: string | null;
    ie?: string | null;
    zip?: string | null;
    street?: string | null;
    number?: string | null;
    neighborhood?: string | null;
    city?: string | null;
    state?: string | null;
    nickname?: string | null;
    contact?: string | null;
    phone2?: string | null;
    notes?: string | null;
    orderCount?: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateClientInput {
    name: string;
    email?: string;
    phone?: string;
    document?: string;
    ie?: string;
    zip?: string;
    street?: string;
    number?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    nickname?: string;
    contact?: string;
    phone2?: string;
    notes?: string;
}

export interface UpdateClientInput {
    name?: string;
    email?: string;
    phone?: string;
    document?: string;
    ie?: string;
    zip?: string;
    street?: string;
    number?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    nickname?: string;
    contact?: string;
    phone2?: string;
    notes?: string;
}

// ----- System Settings -----
// Fields match Prisma's nullable (string | null) return values exactly.
export interface SystemSettings {
    id: string;
    companyName: string;
    companyCnpj: string | null;
    companyPhone: string | null;
    companyEmail: string | null;
    companyAddress: string | null;
    priceSettings: string | null;
    updatedAt: Date;
}

// ----- User DTOs -----
export interface RegisterUserInput {
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'employee';
    phone?: string;
    image?: string;
}

export interface UpdateUserInput {
    name?: string;
    email?: string;
    role?: 'admin' | 'employee';
    phone?: string;
    image?: string;
    password?: string;
}

// ----- Product DTOs -----
export interface CreateProductInput {
    name: string;
    category: string;
    pricePerM2: number;
    description?: string;
    image?: string;
    pricingConfig?: PricingConfig;
}
