'use server'

import prisma from '@/lib/db';
import { Product } from '@/types';

import { revalidatePath } from 'next/cache';

export const getAllProducts = async (): Promise<Product[]> => {
    try {
        const products = await prisma.product.findMany();
        // Force-refresh cache mechanism (optional, depending on Next.js config)
        return products.map((p: any) => ({
            ...p,
            pricingConfig: p.pricingConfig || {}
        }));
    } catch (error) {
        console.error("Error fetching products:", error);
        return [];
    }
};

export const updateProductPricing = async (id: string, newPrice: number, pricingConfig?: any): Promise<{ success: boolean; product?: Product; message?: string }> => {
    try {
        const updated = await prisma.product.update({
            where: { id },
            data: {
                pricePerM2: newPrice,
                pricingConfig: pricingConfig
            }
        });

        revalidatePath('/admin/settings');
        revalidatePath('/admin/dashboard');

        return {
            success: true,
            product: {
                id: updated.id,
                name: updated.name,
                category: updated.category,
                pricePerM2: updated.pricePerM2,
                pricingConfig: updated.pricingConfig
            }
        };
    } catch (error: any) {
        console.error("Error updating product:", error);
        return { success: false, message: error?.message || 'Erro ao atualizar' };
    }
};

export const createProduct = async (data: Omit<Product, 'id'>): Promise<{ success: boolean; product?: Product }> => {
    try {
        const newProduct = await prisma.product.create({
            data: {
                name: data.name,
                category: data.category,
                pricePerM2: data.pricePerM2,
                pricingConfig: data.pricingConfig,
                description: data.description,
                image: data.image
            }
        });
        revalidatePath('/admin/settings');
        revalidatePath('/admin/dashboard');
        return {
            success: true,
            product: {
                id: newProduct.id,
                name: newProduct.name,
                category: newProduct.category,
                pricePerM2: newProduct.pricePerM2,
                pricingConfig: newProduct.pricingConfig
            }
        };
    } catch (error) {
        console.error("Error creating product:", error);
        return { success: false };
    }
};

export const deleteProduct = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
        await prisma.product.delete({
            where: { id }
        });
        revalidatePath('/admin/settings');
        revalidatePath('/admin/dashboard');
        return { success: true };
    } catch (error) {
        console.error("Error deleting product:", error);
        return { success: false, error: 'Erro ao deletar produto' };
    }
};
