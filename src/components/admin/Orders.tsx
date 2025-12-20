'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Icons } from './Icons';
import { useAuth } from '../../context/AuthContext';
import OrderDetailsModal from './OrderDetailsModal';
import { getPendingOrders, updateOrderStatus } from '../../actions/order';
import LoadingScreen from '../../components/ui/LoadingScreen';
import OrderRow from './OrderRow';
import { Order, OrderStatus } from '../../types';
import { formatCurrency } from '../../lib/utils/price';

export default function Orders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    // Search & Filter
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    // Filter States
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    const refreshOrders = async () => {
        setLoading(true);
        // getPendingOrders already filters for PENDING, IN_PRODUCTION, READY_FOR_SHIPPING
        const data = await getPendingOrders();
        setOrders(data);
        setLoading(false);
    };

    useEffect(() => {
        refreshOrders();
    }, []);

    const { user } = useAuth();
    const isEmployee = user?.role === 'employee';

    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            // Employee Security Filter: Only show "IN_PRODUCTION"
            if (isEmployee && order.status !== OrderStatus.IN_PRODUCTION) {
                return false;
            }

            const matchesSearch =
                order.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.id.includes(searchTerm) ||
                (order.productName && order.productName.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;

            // If Employee, we ignore statusFilter dropdown effectively because we enforce IN_PRODUCTION
            // But if they filtered for 'PENDING', they see nothing (correct).
            return matchesSearch && matchesStatus;
        });
    }, [orders, searchTerm, statusFilter, isEmployee]);

    const handleOpenDetails = React.useCallback((order: Order) => {
        setSelectedOrder(order);
        setIsDetailsOpen(true);
    }, []);

    const handleStatusUpdate = React.useCallback(async (id: string, newStatus: OrderStatus) => {
        setUpdatingId(id);
        const result = await updateOrderStatus(id, newStatus);
        if (result.success) {
            await refreshOrders();
        }
        setUpdatingId(null);
    }, []);

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-background-dark">
            {/* TOP BAR / HEADER */}
            <header className="flex-none px-8 py-6 border-b border-white/5 bg-background-dark/50 backdrop-blur-sm z-10">
                <div className="flex flex-wrap justify-between items-end gap-4">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-white text-3xl font-bold leading-tight tracking-tight">Fila de Produção</h2>
                        <p className="text-slate-400 text-sm font-normal">Acompanhe e gerencie o fluxo de pedidos ativos.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {!isEmployee && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/5 border border-yellow-500/10 text-xs text-yellow-500">
                                <span className="size-2 rounded-full bg-yellow-500 animate-pulse"></span>
                                {orders.filter(o => o.status === OrderStatus.PENDING).length} Pendentes
                            </div>
                        )}
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/5 border border-blue-500/10 text-xs text-blue-500">
                            <span className="size-2 rounded-full bg-blue-500"></span>
                            {orders.filter(o => o.status === OrderStatus.IN_PRODUCTION).length} Em Prod.
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/5 border border-green-500/10 text-xs text-green-500">
                            <span className="size-2 rounded-full bg-green-500"></span>
                            {orders.filter(o => o.status === OrderStatus.READY_FOR_SHIPPING).length} Pronto p/ Envio
                        </div>
                    </div>
                </div>

                {/* FILTERS TOOLBAR */}
                <div className="mt-8 flex flex-col xl:flex-row gap-4">
                    <div className="flex-1 min-w-[300px]">
                        <div className="flex w-full items-center rounded-full h-12 bg-white/5 border border-white/10 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 transition-all overflow-hidden">
                            <div className="pl-4 text-slate-500">
                                <Icons.Search size={20} />
                            </div>
                            <input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-transparent border-none text-white placeholder-slate-600 px-3 focus:ring-0 h-full text-sm font-medium outline-none"
                                placeholder="Buscar por ID, Cliente ou Nome..."
                            />
                        </div>
                    </div>

                    {!isEmployee && (
                        <div className="relative min-w-[200px]">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="appearance-none w-full h-12 rounded-full bg-white/5 border border-white/10 text-white pl-4 pr-10 text-sm font-medium focus:ring-1 focus:ring-primary/50 focus:border-primary/50 cursor-pointer outline-none"
                            >
                                <option value="ALL" className="bg-slate-900 text-white">Todos os Status</option>
                                <option value={OrderStatus.PENDING} className="bg-slate-900 text-white">Pendente</option>
                                <option value={OrderStatus.IN_PRODUCTION} className="bg-slate-900 text-white">Em Produção</option>
                                <option value={OrderStatus.READY_FOR_SHIPPING} className="bg-slate-900 text-white">Pronto p/ Envio</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                                <Icons.ChevronDown size={20} />
                            </div>
                        </div>
                    )}
                    <div className="flex gap-3 overflow-x-auto pb-1 xl:pb-0">
                        <button
                            onClick={refreshOrders}
                            className="flex items-center justify-center size-12 rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors"
                            title="Atualizar"
                        >
                            <Icons.History size={20} />
                        </button>
                    </div>
                </div>
            </header>

            {/* TABLE CONTENT */}
            <div className="flex-1 overflow-auto p-8 pt-4">
                <div className="w-full rounded-2xl border border-white/5 bg-surface-dark/50 overflow-hidden shadow-2xl">
                    {loading ? (
                        <div className="p-12 flex justify-center">
                            <LoadingScreen />
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="p-12 text-center text-slate-400">Nenhum pedido encontrado.</div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 bg-black/20 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                                    <th className="p-4 pl-6 w-24">ID</th>
                                    <th className="p-4">Cliente</th>
                                    <th className="p-4">Material / Detalhes</th>
                                    <th className="p-4 text-center">Status Atual</th>
                                    <th className="p-4 pr-6 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm text-slate-300">
                                {filteredOrders.map((order) => (
                                    <OrderRow
                                        key={order.id}
                                        order={order}
                                        onOpenDetails={handleOpenDetails}
                                        onStatusUpdate={handleStatusUpdate}
                                        updatingId={updatingId}
                                    />
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <OrderDetailsModal
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
                order={selectedOrder}
                onUpdate={refreshOrders}
            />
        </div>
    );
}
