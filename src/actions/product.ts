'use server'

import { Prisma } from '@prisma/client';
import prisma from '@/lib/db';
import { Product, PricingConfig } from '@/types';

import { revalidatePath } from 'next/cache';
import { requireAdmin, requireUser } from '@/lib/auth/session';

export const getAllProducts = async (): Promise<Product[]> => {
    await requireUser();
    try {
        const products = await prisma.product.findMany();
        return products.map((p) => ({
            id: p.id,
            name: p.name,
            category: p.category,
            pricePerM2: p.pricePerM2,
            description: p.description,
            image: p.image,
            pricingConfig: (p.pricingConfig ?? {}) as PricingConfig,
        }));
    } catch (error) {
        console.error("Error fetching products:", error);
        return [];
    }
};

export const updateProductPricing = async (
    id: string,
    newPrice: number,
    pricingConfig?: PricingConfig | Record<string, unknown>,
): Promise<{ success: boolean; product?: Product; message?: string }> => {
    await requireAdmin();
    try {
        const updated = await prisma.product.update({
            where: { id },
            data: {
                pricePerM2: newPrice,
                pricingConfig: pricingConfig as Prisma.InputJsonValue | undefined,
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
                pricingConfig: (updated.pricingConfig ?? {}) as PricingConfig,
            }
        };
    } catch (error) {
        console.error("Error updating product:", error);
        return { success: false, message: error instanceof Error ? error.message : 'Erro ao atualizar' };
    }
};

export const createProduct = async (
    data: Omit<Product, 'id'>,
): Promise<{ success: boolean; product?: Product }> => {
    await requireAdmin();
    try {
        const newProduct = await prisma.product.create({
            data: {
                name: data.name,
                category: data.category,
                pricePerM2: data.pricePerM2,
                pricingConfig: data.pricingConfig as Prisma.InputJsonValue | undefined,
                description: data.description,
                image: data.image,
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
                description: newProduct.description,
                image: newProduct.image,
                pricingConfig: (newProduct.pricingConfig ?? {}) as PricingConfig,
            }
        };
    } catch (error) {
        console.error("Error creating product:", error);
        return { success: false };
    }
};

export const deleteProduct = async (id: string): Promise<{ success: boolean; error?: string }> => {
    await requireAdmin();
    try {
        await prisma.product.delete({ where: { id } });
        revalidatePath('/admin/settings');
        revalidatePath('/admin/dashboard');
        return { success: true };
    } catch (error) {
        console.error("Error deleting product:", error);
        return { success: false, error: 'Erro ao deletar produto' };
    }
};
