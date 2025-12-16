import { Product } from '../types';

// Simulated database (Mutable for the session)
let MOCK_PRODUCTS: Product[] = [
    // Lona
    { id: '1', name: 'Lona 440g', category: 'Lona', pricePerM2: 45.00 },

    // Adesivos
    { id: '3', name: 'Adesivo Vinil Brilho', category: 'Adesivo', pricePerM2: 60.00 },
    { id: '4', name: 'Adesivo Vinil Fosco', category: 'Adesivo', pricePerM2: 60.00 },
    { id: '9', name: 'Adesivo Transparente', category: 'Adesivo', pricePerM2: 75.00 },

    // Rígidos
    { id: '5', name: 'ACM 3mm', category: 'ACM', pricePerM2: 250.00 },
    { id: '6', name: 'PVC Expandido', category: 'PVC', pricePerM2: 120.00 },
    { id: '7', name: 'Chapa PS', category: 'PS', pricePerM2: 80.00 },

    // Acrílicos (Individual products for granular pricing)
    { id: 'ac-1', name: 'Acrílico 1mm', category: 'Acrílico', pricePerM2: 180.00 },
    { id: 'ac-2', name: 'Acrílico 2mm', category: 'Acrílico', pricePerM2: 250.00 },
    { id: 'ac-3', name: 'Acrílico 3mm', category: 'Acrílico', pricePerM2: 350.00 },
    { id: 'ac-4', name: 'Acrílico 4mm', category: 'Acrílico', pricePerM2: 450.00 },
    { id: 'ac-5', name: 'Acrílico 5mm', category: 'Acrílico', pricePerM2: 550.00 },
    { id: 'ac-6', name: 'Acrílico 6mm', category: 'Acrílico', pricePerM2: 650.00 },
    { id: 'ac-8', name: 'Acrílico 8mm', category: 'Acrílico', pricePerM2: 850.00 },
    { id: 'ac-10', name: 'Acrílico 10mm', category: 'Acrílico', pricePerM2: 1050.00 },
];

export const getAllProducts = async (): Promise<Product[]> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return [...MOCK_PRODUCTS]; // Return copy to avoid direct mutation issues
};

export const updateProductPricing = async (id: string, newPrice: number): Promise<{ success: boolean; product?: Product }> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    const index = MOCK_PRODUCTS.findIndex(p => p.id === id);
    if (index !== -1) {
        MOCK_PRODUCTS[index] = { ...MOCK_PRODUCTS[index], pricePerM2: newPrice };
        console.log(`Updated product ${id} price to ${newPrice}`);
        return { success: true, product: MOCK_PRODUCTS[index] };
    }

    return { success: false };
};
