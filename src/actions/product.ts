'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updateProductPricing(productId: string, pricePerSqMeter: number, pricingConfig?: any) {
    console.log('--- Server Action updateProductPricing STARTED ---');
    console.log(`Params: productId=${productId}, price=${pricePerSqMeter}`);
    try {
        console.log(`Updating product ${productId} - Base: ${pricePerSqMeter}, Config:`, pricingConfig);

        await prisma.product.update({
            where: { id: productId },
            data: {
                pricePerSqMeter,
                pricingConfig: pricingConfig || undefined
            }
        });

        revalidatePath('/admin/orders/[id]');
        return { success: true, message: 'Preço atualizado com sucesso!' };
    } catch (error) {
        console.error('Error updating product pricing:', error);
        return { success: false, message: `Erro ao atualizar preço: ${(error as Error).message}` };
    }
}

export async function getAllProducts() {
    try {
        const products = await prisma.product.findMany();
        return products;
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
}
