import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@prisma/client';

export interface CartItem {
    id: string; // Unique ID for the cart item (since same product can have different dims)
    productId: string;
    productName: string; // redundant but useful for UI to avoid fetching
    pricePerSqMeter: number;
    minPrice: number;
    width: number;
    height: number;
    area: number;
    finalPrice: number;
    fileUrl?: string; // Placeholder for uploaded file
    quantity: number;
}

interface CartState {
    items: CartItem[];
    addItem: (item: Omit<CartItem, 'id'>) => void;
    removeItem: (id: string) => void;
    clearCart: () => void;
    updateQuantity: (id: string, quantity: number) => void;
    totalPrice: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            addItem: (item) =>
                set((state) => ({
                    items: [...state.items, { ...item, id: Math.random().toString(36).substring(7) }],
                })),
            removeItem: (id) =>
                set((state) => ({
                    items: state.items.filter((item) => item.id !== id),
                })),
            clearCart: () => set({ items: [] }),
            updateQuantity: (id, quantity) =>
                set((state) => ({
                    items: state.items.map((item) =>
                        item.id === id ? { ...item, quantity } : item
                    ),
                })),
            totalPrice: () => {
                return get().items.reduce((total, item) => total + item.finalPrice * item.quantity, 0);
            },
        }),
        {
            name: 'drusign-cart',
        }
    )
);
