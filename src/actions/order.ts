'use server'

import prisma from '@/lib/db';
import { Order, OrderInput, OrderStatus } from '@/types';

export const submitOrder = async (orderData: OrderInput): Promise<{ success: boolean; order?: Order; error?: string }> => {
    try {
        const hasItems = orderData.items && orderData.items.length > 0;
        const hasFlat = !!orderData.productId;

        if (!hasItems && !hasFlat) {
            return { success: false, error: "Pedido sem produtos." };
        }

        const orderItemsData = hasItems ? orderData.items : [{
            productId: orderData.productId!,
            width: orderData.width!,
            height: orderData.height!,
            quantity: orderData.quantity!,
            serviceType: orderData.serviceType,
            finishing: orderData.finishing,
            instructions: orderData.instructions
        }];

        // Basic validation for items (optional)
        if (orderItemsData?.some(i => !i.productId)) {
            return { success: false, error: "Produto inválido em um dos itens." };
        }

        const newOrder = await prisma.order.create({
            data: {
                clientName: orderData.clientName,
                clientDocument: orderData.clientDocument,
                clientPhone: orderData.clientPhone,
                filePaths: orderData.filePaths || [],
                clientId: orderData.clientDocument ? undefined : undefined,
                status: 'PENDING',
                totalPrice: orderData.totalPrice,
                // Nested create for OrderItem
                items: {
                    create: orderItemsData!.map(item => ({
                        productId: item.productId,
                        width: item.width,
                        height: item.height,
                        quantity: item.quantity,
                        serviceType: item.serviceType,
                        finishing: item.finishing,
                        instructions: item.instructions
                    }))
                }
            },
            include: {
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });

        const mappedOrder: Order = {
            id: newOrder.id,
            // Map flat fields from the first item
            productId: newOrder.items[0]?.productId || "",
            productName: newOrder.items[0]?.product?.name || "",
            width: newOrder.items[0]?.width || 0,
            height: newOrder.items[0]?.height || 0,
            quantity: newOrder.items[0]?.quantity || 1,
            serviceType: newOrder.items[0]?.serviceType || undefined,
            finishing: newOrder.items[0]?.finishing || undefined,
            instructions: newOrder.items[0]?.instructions || "",

            clientName: newOrder.clientName || "",
            totalPrice: newOrder.totalPrice,
            status: newOrder.status as OrderStatus,
            createdAt: newOrder.createdAt
        };

        return { success: true, order: mappedOrder };

    } catch (error: any) {
        console.error("Error creating order:", error);
        return { success: false, error: "Erro ao criar pedido." };
    }
};

export const getPendingOrders = async (): Promise<Order[]> => {
    try {
        const orders = await prisma.order.findMany({
            where: {
                status: {
                    in: ['PENDING', 'IN_PRODUCTION', 'READY_FOR_SHIPPING']
                }
            },
            orderBy: { createdAt: 'desc' },
            include: {
                items: {
                    include: { product: true }
                }
            }
        });

        return orders.map((o: any) => {
            const item = o.items[0]; // Assuming single item per order for now
            return {
                id: o.id,
                clientName: o.clientName || "Cliente",
                clientDocument: o.clientDocument,
                clientPhone: o.clientPhone,
                filePaths: (o.filePaths as string[]) || [], // Map JSON to string array
                status: o.status as OrderStatus,
                createdAt: o.createdAt,
                totalPrice: o.totalPrice,
                // Fields from first item
                productId: item?.productId || "",
                productName: item?.product?.name || "Produto Desconhecido",
                width: item?.width || 0,
                height: item?.height || 0,
                quantity: item?.quantity || 1,
                instructions: item?.instructions || "",
                serviceType: item?.serviceType || undefined,
                finishing: item?.finishing || undefined
            };
        });
    } catch (error) {
        console.error("Error getting pending orders:", error);
        return [];
    }
};

export const getHistoryOrders = async (): Promise<Order[]> => {
    try {
        const orders = await prisma.order.findMany({
            where: {
                status: {
                    in: ['COMPLETED', 'CANCELLED'] // Assuming cancelled is handled or just use completed for history
                }
            },
            orderBy: { createdAt: 'desc' },
            include: {
                items: {
                    include: { product: true }
                }
            }
        });

        return orders.map((o: any) => {
            const item = o.items[0];
            return {
                id: o.id,
                clientName: o.clientName || "Cliente",
                clientDocument: o.clientDocument,
                clientPhone: o.clientPhone,
                filePaths: (o.filePaths as string[]) || [], // Map JSON to string array
                status: o.status as OrderStatus,
                createdAt: o.createdAt,
                totalPrice: o.totalPrice,
                productId: item?.productId || "",
                productName: item?.product?.name || "",
                width: item?.width || 0,
                height: item?.height || 0,
                quantity: item?.quantity || 1,
                instructions: item?.instructions || "",
                serviceType: item?.serviceType || undefined,
                finishing: item?.finishing || undefined
            };
        });
    } catch (error) {
        console.error("Error getting history orders:", error);
        return [];
    }
};

import { createNotification } from './notification';

export const updateOrderStatus = async (id: string, status: OrderStatus): Promise<{ success: boolean }> => {
    try {
        const order = await prisma.order.update({
            where: { id },
            data: { status },
            include: { items: { include: { product: true } } }
        });

        const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        if (status === 'IN_PRODUCTION') {
            await createNotification(
                'employee',
                `Novo serviço em produção (${time}): Pedido #${id.slice(0, 8)} - Cliente: ${order.clientName || 'N/A'}`,
                id
            );
        } else if (status === 'READY_FOR_SHIPPING') {
            await createNotification(
                'admin',
                `Serviço concluído (${time}): Pedido #${id.slice(0, 8)} - Cliente: ${order.clientName || 'N/A'} está pronto para envio.`,
                id
            );
        }

        return { success: true };
    } catch (error) {
        console.error("Error updating order status:", error);
        return { success: false };
    }
};

export const updateOrderDetails = async (id: string, data: Partial<OrderInput>): Promise<{ success: boolean; error?: string }> => {
    try {
        await prisma.order.update({
            where: { id },
            data: {
                clientName: data.clientName,
                clientDocument: data.clientDocument,
                clientPhone: data.clientPhone,
                items: {
                    updateMany: {
                        where: { orderId: id },
                        data: {
                            instructions: data.instructions,
                            finishing: data.finishing
                        }
                    }
                }
            }
        });
        return { success: true };
    } catch (error) {
        console.error("Error updating order details:", error);
        return { success: false, error: "Erro ao atualizar detalhes do pedido." };
    }
};
