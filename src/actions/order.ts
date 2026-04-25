'use server'

import prisma from '@/lib/db';
import { Order, OrderInput, OrderStatus } from '@/types';
import { requireUser } from '@/lib/auth/session';

const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export const submitOrder = async (orderData: OrderInput): Promise<{ success: boolean; order?: Order; error?: string }> => {
    await requireUser();
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
            customDetails: undefined,
            observations: undefined,
            unitPrice: 0,
            totalPrice: orderData.totalPrice
        }];

        // Basic validation for items (optional)
        if (orderItemsData?.some(i => !i.productId)) {
            return { success: false, error: "Produto inválido em um dos itens." };
        }

        const newOrder = await prisma.order.create({
            data: {
                // Client Data - Manual Snapshot
                clientName: orderData.clientName,
                clientDocument: orderData.clientDocument,
                clientIe: orderData.clientIe,
                clientPhone: orderData.clientPhone,
                clientZip: orderData.clientZip,
                clientStreet: orderData.clientStreet,
                clientNumber: orderData.clientNumber,
                clientNeighborhood: orderData.clientNeighborhood,
                clientCity: orderData.clientCity,
                clientState: orderData.clientState,

                filePaths: orderData.filePaths || [],
                status: 'PENDING',

                // Finances
                serviceValue: orderData.serviceValue || 0,
                totalPrice: orderData.totalPrice,
                shippingCost: orderData.shippingCost || 0,
                discount: orderData.discount || 0,

                // Dates & Terms
                deliveryDate: orderData.deliveryDate,
                approvalDate: orderData.approvalDate,
                paymentTerms: orderData.paymentTerms,
                deliveryMethod: orderData.deliveryMethod,
                notes: orderData.notes,

                // Nested create for OrderItem
                items: {
                    create: orderItemsData!.map(item => ({
                        productId: (item.productId && isUuid(item.productId)) ? item.productId : undefined,
                        width: item.width || 0,
                        height: item.height || 0,
                        quantity: item.quantity,
                        serviceType: item.serviceType,
                        finishing: item.finishing,
                        instructions: item.instructions,
                        customDetails: item.customDetails,
                        observations: item.observations,
                        unitPrice: item.unitPrice || 0,
                        totalPrice: item.totalPrice || 0,
                        material: item.material,
                        fileUrl: item.fileUrl // New Field added
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
            clientName: newOrder.clientName || "",
            clientDocument: newOrder.clientDocument || undefined,
            clientPhone: newOrder.clientPhone || undefined,
            clientIe: newOrder.clientIe || undefined,
            clientZip: newOrder.clientZip || undefined,
            clientStreet: newOrder.clientStreet || undefined,
            clientNumber: newOrder.clientNumber || undefined,
            clientNeighborhood: newOrder.clientNeighborhood || undefined,
            clientCity: newOrder.clientCity || undefined,
            clientState: newOrder.clientState || undefined,

            serviceValue: newOrder.serviceValue || 0,
            totalPrice: newOrder.totalPrice,
            shippingCost: newOrder.shippingCost,
            discount: newOrder.discount,

            deliveryDate: newOrder.deliveryDate || undefined,
            approvalDate: newOrder.approvalDate || undefined,
            paymentTerms: newOrder.paymentTerms || undefined,
            deliveryMethod: newOrder.deliveryMethod || undefined,
            notes: newOrder.notes || undefined,

            status: newOrder.status as OrderStatus,
            createdAt: newOrder.createdAt,
            filePaths: (newOrder.filePaths as string[]) || [],
            // Legacy/First item fallbacks (optional but kept for compatibility if needed)
            productId: newOrder.items[0]?.productId || "",
            productName: newOrder.items[0]?.product?.name || "",
            width: newOrder.items[0]?.width || 0,
            height: newOrder.items[0]?.height || 0,
            quantity: newOrder.items[0]?.quantity || 1,

            // New Items Array
            items: newOrder.items.map((i) => ({
                id: i.id,
                productId: i.productId ?? undefined,
                productName: i.product?.name ?? undefined,
                width: i.width ?? 0,
                height: i.height ?? 0,
                quantity: i.quantity,
                serviceType: i.serviceType ?? undefined,
                finishing: i.finishing ?? undefined,
                instructions: i.instructions ?? undefined,
                customDetails: i.customDetails ?? undefined,
                observations: i.observations ?? undefined,
                unitPrice: i.unitPrice,
                totalPrice: i.totalPrice,
                material: i.material ?? undefined,
            }))
        };

        return { success: true, order: mappedOrder };

    } catch (error: any) {
        console.error("Error creating order:", error);
        return { success: false, error: "Erro ao criar pedido." };
    }
};

export const getPendingOrders = async (): Promise<Order[]> => {
    await requireUser();
    try {
        const orders = await prisma.order.findMany({
            where: {
                status: {
                    in: ['PENDING', 'IN_PRODUCTION', 'FINISHING', 'READY_FOR_SHIPPING']
                }
            },
            orderBy: { createdAt: 'desc' },
            include: {
                items: {
                    include: { product: true }
                }
            }
        });

        return orders.map((o) => ({
            id: o.id,
            clientName: o.clientName || "Cliente",
            clientDocument: o.clientDocument,
            clientPhone: o.clientPhone,
            filePaths: (o.filePaths as string[]) || [],
            status: o.status as OrderStatus,
            createdAt: o.createdAt,
            totalPrice: o.totalPrice,

            // Delivery/Financial
            deliveryDate: o.deliveryDate,
            paymentTerms: o.paymentTerms,
            deliveryMethod: o.deliveryMethod,
            shippingCost: o.shippingCost,
            discount: o.discount,
            notes: o.notes,

            // Legacy fallbacks
            productId: o.items[0]?.productId || "",
            productName: o.items[0]?.product?.name || "Vários Itens",
            width: o.items[0]?.width || 0,
            height: o.items[0]?.height || 0,
            quantity: o.items[0]?.quantity || 1,
            instructions: o.items[0]?.instructions || "",

            items: o.items.map((i) => ({
                id: i.id,
                productId: i.productId ?? undefined,
                productName: i.product?.name ?? "Produto",
                width: i.width ?? 0,
                height: i.height ?? 0,
                quantity: i.quantity,
                serviceType: i.serviceType ?? undefined,
                finishing: i.finishing ?? undefined,
                instructions: i.instructions ?? undefined,
                customDetails: i.customDetails ?? undefined,
                unitPrice: i.unitPrice,
                totalPrice: i.totalPrice,
            }))
        }));
    } catch (error) {
        console.error("Error getting pending orders:", error);
        return [];
    }
};

export const getHistoryOrders = async (): Promise<Order[]> => {
    await requireUser();
    try {
        const orders = await prisma.order.findMany({
            where: {
                status: {
                    in: ['COMPLETED', 'CANCELLED']
                }
            },
            orderBy: { createdAt: 'desc' },
            include: {
                items: {
                    include: { product: true }
                }
            }
        });

        return orders.map((o) => ({
            id: o.id,
            clientName: o.clientName || "Cliente",
            clientDocument: o.clientDocument,
            clientPhone: o.clientPhone,
            filePaths: (o.filePaths as string[]) || [],
            status: o.status as OrderStatus,
            createdAt: o.createdAt,
            totalPrice: o.totalPrice,

            // Delivery/Financial
            deliveryDate: o.deliveryDate,
            paymentTerms: o.paymentTerms,
            deliveryMethod: o.deliveryMethod,
            shippingCost: o.shippingCost,
            discount: o.discount,
            notes: o.notes,

            // Legacy fallbacks
            productId: o.items[0]?.productId || "",
            productName: o.items[0]?.product?.name || "Vários Itens",
            width: o.items[0]?.width || 0,
            height: o.items[0]?.height || 0,
            quantity: o.items[0]?.quantity || 1,
            instructions: o.items[0]?.instructions || "",

            items: o.items.map((i) => ({
                id: i.id,
                productId: i.productId ?? undefined,
                productName: i.product?.name ?? "Produto",
                width: i.width ?? 0,
                height: i.height ?? 0,
                quantity: i.quantity,
                serviceType: i.serviceType ?? undefined,
                finishing: i.finishing ?? undefined,
                instructions: i.instructions ?? undefined,
                customDetails: i.customDetails ?? undefined,
                unitPrice: i.unitPrice,
                totalPrice: i.totalPrice,
            }))
        }));
    } catch (error) {
        console.error("Error getting history orders:", error);
        return [];
    }
};

import { createNotification } from './notification';

export const updateOrderStatus = async (id: string, status: OrderStatus): Promise<{ success: boolean }> => {
    await requireUser();
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
        } else if (status === 'FINISHING') {
            await createNotification(
                'employee',
                `Pedido em acabamento (${time}): Pedido #${id.slice(0, 8)} - Cliente: ${order.clientName || 'N/A'}`,
                id
            );
        } else if (status === 'READY_FOR_SHIPPING') {
            await createNotification(
                'admin',
                `Pedido pronto para envio (${time}): Pedido #${id.slice(0, 8)} - Cliente: ${order.clientName || 'N/A'}`,
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
    await requireUser();
    try {
        await prisma.order.update({
            where: { id },
            data: {
                clientName: data.clientName,
                clientDocument: data.clientDocument,
                clientPhone: data.clientPhone,

                // OS Fields
                deliveryDate: data.deliveryDate,
                deliveryMethod: data.deliveryMethod,
                paymentTerms: data.paymentTerms,
                shippingCost: data.shippingCost,
                discount: data.discount,
                notes: data.notes,

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
