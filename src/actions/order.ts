'use server'

import prisma from '@/lib/db';
import { Order, OrderInput, OrderStatus } from '@/types';
import { requireUser, requireAdmin } from '@/lib/auth/session';
import { audit } from '@/lib/auth/audit';
import { createNotification } from './notification';

const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

// ── Mapeador de orderitem → OrderItem ────────────────────────────────────────
function mapItem(i: {
    id: string; productId: string | null; width: number | null; height: number | null;
    quantity: number; serviceType: string | null; finishing: string | null;
    instructions: string | null; customDetails: string | null; observations: string | null;
    unitPrice: number; totalPrice: number; material: string | null; fileUrl: string | null;
    product: { name: string } | null;
}) {
    return {
        id:           i.id,
        productId:    i.productId    ?? undefined,
        productName:  i.product?.name ?? undefined,
        width:        i.width        ?? 0,
        height:       i.height       ?? 0,
        quantity:     i.quantity,
        serviceType:  i.serviceType  ?? undefined,
        finishing:    i.finishing    ?? undefined,
        instructions: i.instructions ?? undefined,
        customDetails:i.customDetails ?? undefined,
        observations: i.observations  ?? undefined,
        unitPrice:    i.unitPrice,
        totalPrice:   i.totalPrice,
        material:     i.material     ?? undefined,
        fileUrl:      i.fileUrl      ?? undefined,
    };
}

// ── Include padrão ────────────────────────────────────────────────────────────
const INCLUDE_ITEMS = { orderitem: { include: { product: true } } } as const;

// ── submitOrder ───────────────────────────────────────────────────────────────
export const submitOrder = async (orderData: OrderInput): Promise<{ success: boolean; order?: Order; error?: string }> => {
    await requireUser();
    try {
        const hasItems = orderData.items && orderData.items.length > 0;
        const hasFlat  = !!orderData.productId;
        if (!hasItems && !hasFlat) return { success: false, error: 'Pedido sem produtos.' };

        const orderItemsData = hasItems ? orderData.items : [{
            productId:    orderData.productId!,
            width:        orderData.width!,
            height:       orderData.height!,
            quantity:     orderData.quantity!,
            serviceType:  orderData.serviceType,
            finishing:    orderData.finishing,
            customDetails: undefined,
            observations:  undefined,
            unitPrice:    0,
            totalPrice:   orderData.totalPrice,
        }];

        if (orderItemsData?.some(i => !i.productId))
            return { success: false, error: 'Produto inválido em um dos itens.' };

        const newOrder = await prisma.order.create({
            data: {
                clientId:           orderData.clientId || null,
                clientName:         orderData.clientName,
                clientDocument:     orderData.clientDocument,
                clientIe:           orderData.clientIe,
                clientPhone:        orderData.clientPhone,
                clientZip:          orderData.clientZip,
                clientStreet:       orderData.clientStreet,
                clientNumber:       orderData.clientNumber,
                clientNeighborhood: orderData.clientNeighborhood,
                clientCity:         orderData.clientCity,
                clientState:        orderData.clientState,
                filePaths:          orderData.filePaths || [],
                status:             'PENDING',
                serviceValue:       orderData.serviceValue  || 0,
                totalPrice:         orderData.totalPrice,
                shippingCost:       orderData.shippingCost  || 0,
                discount:           orderData.discount      || 0,
                deliveryDate:       orderData.deliveryDate,
                approvalDate:       orderData.approvalDate,
                paymentTerms:       orderData.paymentTerms,
                deliveryMethod:     orderData.deliveryMethod,
                notes:              orderData.notes,
                orderitem: {
                    create: orderItemsData!.map(item => ({
                        productId:    (item.productId && isUuid(item.productId)) ? item.productId : undefined,
                        width:        item.width    || 0,
                        height:       item.height   || 0,
                        quantity:     item.quantity,
                        serviceType:  item.serviceType,
                        finishing:    item.finishing,
                        instructions: item.instructions,
                        customDetails:item.customDetails,
                        observations: item.observations,
                        unitPrice:    item.unitPrice  || 0,
                        totalPrice:   item.totalPrice || 0,
                        material:     item.material,
                        fileUrl:      item.fileUrl,
                    }))
                },
            },
            include: INCLUDE_ITEMS,
        });

        await audit({
            action: 'ORDER_CREATED',
            targetId: newOrder.id,
            details: {
                totalPrice: newOrder.totalPrice,
                clientName: newOrder.clientName,
                itemCount: newOrder.orderitem.length,
            },
        });

        await createNotification(
            'admin',
            `Novo pedido criado: ${newOrder.clientName || 'Cliente'} — OS #${newOrder.id.slice(0, 8).toUpperCase()}`,
            newOrder.id
        );

        const row = newOrder.orderitem;
        return {
            success: true,
            order: {
                id:                 newOrder.id,
                clientName:         newOrder.clientName         || '',
                clientDocument:     newOrder.clientDocument      ?? undefined,
                clientPhone:        newOrder.clientPhone         ?? undefined,
                clientIe:           newOrder.clientIe            ?? undefined,
                clientZip:          newOrder.clientZip           ?? undefined,
                clientStreet:       newOrder.clientStreet        ?? undefined,
                clientNumber:       newOrder.clientNumber        ?? undefined,
                clientNeighborhood: newOrder.clientNeighborhood  ?? undefined,
                clientCity:         newOrder.clientCity          ?? undefined,
                clientState:        newOrder.clientState         ?? undefined,
                serviceValue:       newOrder.serviceValue        ?? 0,
                totalPrice:         newOrder.totalPrice,
                shippingCost:       newOrder.shippingCost,
                discount:           newOrder.discount,
                deliveryDate:       newOrder.deliveryDate        ?? undefined,
                approvalDate:       newOrder.approvalDate        ?? undefined,
                paymentTerms:       newOrder.paymentTerms        ?? undefined,
                deliveryMethod:     newOrder.deliveryMethod      ?? undefined,
                notes:              newOrder.notes               ?? undefined,
                status:             newOrder.status as OrderStatus,
                createdAt:          newOrder.createdAt,
                filePaths:          (newOrder.filePaths as string[]) || [],
                productId:          row[0]?.productId            || '',
                productName:        row[0]?.product?.name        || '',
                width:              row[0]?.width                || 0,
                height:             row[0]?.height               || 0,
                quantity:           row[0]?.quantity             || 1,
                items:              row.map(mapItem),
            },
        };
    } catch (error) {
        console.error('submitOrder error:', error);
        return { success: false, error: 'Erro ao criar pedido.' };
    }
};

// ── getPendingOrders ──────────────────────────────────────────────────────────
export const getPendingOrders = async (take = 100, skip = 0): Promise<Order[]> => {
    await requireUser();
    try {
        const orders = await prisma.order.findMany({
            where: { status: { in: ['PENDING', 'IN_PRODUCTION', 'FINISHING', 'READY_FOR_SHIPPING'] } },
            orderBy: { createdAt: 'desc' },
            take, skip,
            include: INCLUDE_ITEMS,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return orders.map((o: any) => {
            const row = o.orderitem;
            return {
                id:             o.id,
                clientName:     o.clientName         || 'Cliente',
                clientDocument: o.clientDocument      ?? undefined,
                clientPhone:    o.clientPhone         ?? undefined,
                filePaths:      (o.filePaths as string[]) || [],
                status:         o.status as OrderStatus,
                createdAt:      o.createdAt,
                totalPrice:     o.totalPrice,
                deliveryDate:   o.deliveryDate        ?? undefined,
                paymentTerms:   o.paymentTerms        ?? undefined,
                deliveryMethod: o.deliveryMethod      ?? undefined,
                shippingCost:   o.shippingCost,
                discount:       o.discount,
                notes:          o.notes               ?? undefined,
                productId:      row[0]?.productId     || '',
                productName:    row[0]?.product?.name || 'Vários Itens',
                width:          row[0]?.width         || 0,
                height:         row[0]?.height        || 0,
                quantity:       row[0]?.quantity      || 1,
                instructions:   row[0]?.instructions  || '',
                items:          row.map(mapItem),
            };
        });
    } catch (error) {
        console.error('getPendingOrders error:', error);
        return [];
    }
};

// ── getHistoryOrders ──────────────────────────────────────────────────────────
export const getHistoryOrders = async (take = 200, skip = 0): Promise<Order[]> => {
    await requireUser();
    try {
        const orders = await prisma.order.findMany({
            where: { status: { in: ['COMPLETED', 'CANCELLED'] } },
            orderBy: { createdAt: 'desc' },
            take, skip,
            include: INCLUDE_ITEMS,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return orders.map((o: any) => {
            const row = o.orderitem;
            return {
                id:             o.id,
                clientName:     o.clientName         || 'Cliente',
                clientDocument: o.clientDocument      ?? undefined,
                clientPhone:    o.clientPhone         ?? undefined,
                filePaths:      (o.filePaths as string[]) || [],
                status:         o.status as OrderStatus,
                createdAt:      o.createdAt,
                totalPrice:     o.totalPrice,
                deliveryDate:   o.deliveryDate        ?? undefined,
                paymentTerms:   o.paymentTerms        ?? undefined,
                deliveryMethod: o.deliveryMethod      ?? undefined,
                shippingCost:   o.shippingCost,
                discount:       o.discount,
                notes:          o.notes               ?? undefined,
                productId:      row[0]?.productId     || '',
                productName:    row[0]?.product?.name || 'Vários Itens',
                width:          row[0]?.width         || 0,
                height:         row[0]?.height        || 0,
                quantity:       row[0]?.quantity      || 1,
                instructions:   row[0]?.instructions  || '',
                items:          row.map(mapItem),
            };
        });
    } catch (error) {
        console.error('getHistoryOrders error:', error);
        return [];
    }
};

// ── updateOrderStatus ─────────────────────────────────────────────────────────
export const updateOrderStatus = async (id: string, status: OrderStatus): Promise<{ success: boolean }> => {
    await requireUser();
    try {
        const previous = await prisma.order.findUnique({ where: { id }, select: { status: true } });
        const order = await prisma.order.update({
            where: { id },
            data: { status },
        });

        await audit({
            action: status === 'CANCELLED' ? 'ORDER_CANCELLED' : 'ORDER_STATUS_CHANGED',
            targetId: id,
            details: { from: previous?.status, to: status },
        });

        const client = order.clientName || 'Cliente';
        const shortId = id.slice(0, 8).toUpperCase();

        // Admin inicia ou conclui/cancela → avisa funcionário
        // Funcionário avança produção → avisa admin
        if (status === 'IN_PRODUCTION')
            await createNotification('employee', `Nova OS em produção: ${client} — #${shortId}`, id);
        else if (status === 'FINISHING')
            await createNotification('admin', `Em acabamento: ${client} — #${shortId}`, id);
        else if (status === 'READY_FOR_SHIPPING')
            await createNotification('admin', `Pronto para envio: ${client} — #${shortId}`, id);
        else if (status === 'COMPLETED')
            await createNotification('employee', `Pedido concluído: ${client} — #${shortId}`, id);
        else if (status === 'CANCELLED')
            await createNotification('employee', `Pedido cancelado: ${client} — #${shortId}`, id);

        return { success: true };
    } catch (error) {
        console.error('updateOrderStatus error:', error);
        return { success: false };
    }
};

// ── updateOrderDetails ────────────────────────────────────────────────────────
export const updateOrderDetails = async (id: string, data: Partial<OrderInput>): Promise<{ success: boolean; error?: string }> => {
    await requireAdmin();
    try {
        await prisma.order.update({
            where: { id },
            data: {
                clientName:     data.clientName,
                clientDocument: data.clientDocument,
                clientPhone:    data.clientPhone,
                deliveryDate:   data.deliveryDate,
                deliveryMethod: data.deliveryMethod,
                paymentTerms:   data.paymentTerms,
                shippingCost:   data.shippingCost,
                discount:       data.discount,
                notes:          data.notes,
                orderitem: {
                    updateMany: {
                        where: { orderId: id },
                        data: { instructions: data.instructions, finishing: data.finishing },
                    },
                },
            },
        });
        await audit({ action: 'ORDER_UPDATED', targetId: id, details: { fields: Object.keys(data) } });
        return { success: true };
    } catch (error) {
        console.error('updateOrderDetails error:', error);
        return { success: false, error: 'Erro ao atualizar detalhes do pedido.' };
    }
};

// ── getOrderById ──────────────────────────────────────────────────────────────
export const getOrderById = async (id: string): Promise<Order | null> => {
    await requireUser();
    try {
        const o = await prisma.order.findUnique({
            where: { id },
            include: INCLUDE_ITEMS,
        });
        if (!o) return null;

        const row = o.orderitem;
        return {
            id:                 o.id,
            clientName:         o.clientName         || '',
            clientDocument:     o.clientDocument      ?? undefined,
            clientPhone:        o.clientPhone         ?? undefined,
            clientIe:           o.clientIe            ?? undefined,
            clientZip:          o.clientZip           ?? undefined,
            clientStreet:       o.clientStreet        ?? undefined,
            clientNumber:       o.clientNumber        ?? undefined,
            clientNeighborhood: o.clientNeighborhood  ?? undefined,
            clientCity:         o.clientCity          ?? undefined,
            clientState:        o.clientState         ?? undefined,
            serviceValue:       o.serviceValue        ?? undefined,
            totalPrice:         o.totalPrice,
            shippingCost:       o.shippingCost,
            discount:           o.discount,
            deliveryDate:       o.deliveryDate        ?? undefined,
            approvalDate:       o.approvalDate        ?? undefined,
            paymentTerms:       o.paymentTerms        ?? undefined,
            deliveryMethod:     o.deliveryMethod      ?? undefined,
            notes:              o.notes               ?? undefined,
            status:             o.status as OrderStatus,
            createdAt:          o.createdAt,
            filePaths:          (o.filePaths as string[]) || [],
            productId:          row[0]?.productId     || '',
            productName:        row[0]?.product?.name || '',
            width:              row[0]?.width         || 0,
            height:             row[0]?.height        || 0,
            quantity:           row[0]?.quantity      || 1,
            items:              row.map(mapItem),
        };
    } catch (error) {
        console.error('getOrderById error:', error);
        return null;
    }
};
