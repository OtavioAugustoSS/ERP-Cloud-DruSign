'use server';

import db from '@/lib/db';
import { requireUser } from '@/lib/auth/session';

export interface DashboardStats {
    // Métricas do mês (KPIs do topo)
    monthRevenue: number;
    ordersThisMonth: number;
    avgTicketMonth: number;
    totalClients: number;
    // Status dos pedidos ativos (bloco de produção)
    totalActive: number;
    overdueCount: number;
    byStatus: {
        PENDING: number;
        IN_PRODUCTION: number;
        FINISHING: number;
        READY_FOR_SHIPPING: number;
    };
    isAdmin: boolean;
    recentOrders: Array<{
        id: string;
        clientName: string | null;
        status: string;
        totalPrice: number;
        createdAt: string;
        deliveryDate: string | null;
    }>;
    topMaterials: Array<{
        name: string;
        qty: number;
        pct: number;
    }>;
    alertOrders: Array<{
        id: string;
        clientName: string | null;
        deliveryDate: string;
        status: string;
    }>;
}

export async function getDashboardData(): Promise<DashboardStats> {
    const session = await requireUser();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const [activeOrders, completedThisMonth, ordersThisMonthData, recentOrders, totalClients, allItems] = await Promise.all([
        db.order.findMany({
            where: { status: { in: ['PENDING', 'IN_PRODUCTION', 'FINISHING', 'READY_FOR_SHIPPING'] } },
            include: { items: true },
            orderBy: { createdAt: 'desc' },
        }),
        // Receita: apenas pedidos COMPLETED criados este mês
        db.order.findMany({
            where: { status: 'COMPLETED', updatedAt: { gte: startOfMonth } },
            select: { totalPrice: true },
        }),
        // Todos os pedidos criados este mês (para count e ticket médio)
        db.order.findMany({
            where: { createdAt: { gte: startOfMonth } },
            select: { totalPrice: true },
        }),
        db.order.findMany({
            orderBy: { createdAt: 'desc' },
            take: 8,
            select: { id: true, clientName: true, status: true, totalPrice: true, createdAt: true, deliveryDate: true },
        }),
        db.client.count(),
        db.order.findMany({
            select: {
                items: {
                    select: {
                        quantity: true,
                        material: true,
                        customDetails: true,
                        product: { select: { name: true } },
                    },
                },
            },
        }),
    ]);

    const byStatus = {
        PENDING: activeOrders.filter(o => o.status === 'PENDING').length,
        IN_PRODUCTION: activeOrders.filter(o => o.status === 'IN_PRODUCTION').length,
        FINISHING: activeOrders.filter(o => o.status === 'FINISHING').length,
        READY_FOR_SHIPPING: activeOrders.filter(o => o.status === 'READY_FOR_SHIPPING').length,
    };

    const monthRevenue = completedThisMonth.reduce((s, o) => s + o.totalPrice, 0);
    const ordersThisMonth = ordersThisMonthData.length;
    const avgTicketMonth = ordersThisMonth > 0
        ? ordersThisMonthData.reduce((s, o) => s + o.totalPrice, 0) / ordersThisMonth
        : 0;

    const alertOrders = activeOrders
        .filter(o => o.deliveryDate && new Date(o.deliveryDate) <= endOfToday)
        .map(o => ({
            id: o.id,
            clientName: o.clientName,
            deliveryDate: o.deliveryDate!.toISOString(),
            status: o.status,
        }));

    const materialCounts: Record<string, number> = {};
    for (const order of allItems) {
        for (const item of order.items) {
            const base = item.product?.name ?? item.material ?? 'Outros';
            const variant = (item.customDetails ?? '')
                .split(' | ')
                .map(p => p.split(': ').slice(1).join(': '))
                .filter(Boolean)
                .join(' · ');
            const key = variant ? `${base} ${variant}` : base;
            materialCounts[key] = (materialCounts[key] || 0) + item.quantity;
        }
    }
    const totalQty = Object.values(materialCounts).reduce((a, b) => a + b, 0);
    const topMaterials = Object.entries(materialCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, qty]) => ({
            name,
            qty,
            pct: totalQty > 0 ? Math.round((qty / totalQty) * 100) : 0,
        }));

    return {
        monthRevenue,
        ordersThisMonth,
        avgTicketMonth,
        totalClients,
        totalActive: activeOrders.length,
        overdueCount: alertOrders.length,
        byStatus,
        isAdmin: session.role === 'admin',
        recentOrders: recentOrders.map(o => ({
            id: o.id,
            clientName: o.clientName,
            status: o.status,
            totalPrice: o.totalPrice,
            createdAt: o.createdAt.toISOString(),
            deliveryDate: o.deliveryDate?.toISOString() ?? null,
        })),
        topMaterials,
        alertOrders,
    };
}
