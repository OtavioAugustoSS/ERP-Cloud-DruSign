'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

interface SubmitOrderData {
    clientName: string;
    totalPrice: number;
    items: {
        productId: string;
        width: number;
        height: number;
        quantity: number;
        fileUrl?: string;
        finalPrice: number;
    }[];
}

export async function submitOrder(data: SubmitOrderData) {
    console.log('--- Server Action submitOrder STARTED ---');
    console.log('Data:', data);

    let newOrderId = '';

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create the Order
            const order = await tx.order.create({
                data: {
                    clientName: data.clientName,
                    status: 'PENDING',
                    totalPrice: data.totalPrice,
                }
            });

            newOrderId = order.id;

            // 2. Create OrderItems linked to the Order
            for (const item of data.items) {
                await tx.orderItem.create({
                    data: {
                        orderId: order.id,
                        productId: item.productId,
                        width: item.width,
                        height: item.height,
                        quantity: item.quantity,
                        fileUrl: item.fileUrl,
                        finalPrice: item.finalPrice
                    }
                });
            }

            return order;
        });

        console.log('Order created successfully:', result.id);
    } catch (error) {
        console.error('Error submitting order:', error);
        return { success: false, message: `Erro ao enviar pedido: ${(error as Error).message}` };
    }

    // Redirect needs to happen outside try/catch if strictly using Next.js redirect behavior 
    // (though in server actions it throws an error that is caught by Next.js to handle redirect)
    // Safest pattern is to revalidate then return success, or redirect.
    // The requirement says "Redirect the user to the 'Pedidos' list".

    revalidatePath('/admin/orders');
    redirect('/admin/orders');
}

export async function getPendingOrders() {
    try {
        return await prisma.order.findMany({
            where: {
                status: {
                    in: ['PENDING', 'IN_PRODUCTION']
                }
            },
            include: {
                items: {
                    include: {
                        product: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    } catch (error) {
        console.error('Error fetching pending orders:', error);
        return [];
    }
}

export async function getHistoryOrders() {
    try {
        return await prisma.order.findMany({
            where: {
                status: 'COMPLETED'
            },
            include: {
                items: {
                    include: {
                        product: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    } catch (error) {
        console.error('Error fetching history orders:', error);
        return [];
    }
}

export async function updateOrderStatus(orderId: string, status: 'PENDING' | 'IN_PRODUCTION' | 'COMPLETED') {
    try {
        await prisma.order.update({
            where: { id: orderId },
            data: { status }
        });
        revalidatePath('/admin/orders');
        revalidatePath('/admin/history');
        return { success: true };
    } catch (error) {
        console.error('Error updating status:', error);
        return { success: false, message: 'Erro ao atualizar status' };
    }
}
