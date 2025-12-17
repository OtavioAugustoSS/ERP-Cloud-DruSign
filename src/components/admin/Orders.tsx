'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Icons } from './Icons';
import { useAuth } from '../../context/AuthContext';
import OrderDetailsModal from './OrderDetailsModal';
import { getPendingOrders, updateOrderStatus } from '../../actions/order';
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

    const handleOpenDetails = (order: Order) => {
        setSelectedOrder(order);
        setIsDetailsOpen(true);
    };

    const handleStatusUpdate = async (id: string, newStatus: OrderStatus) => {
        setUpdatingId(id);
        const result = await updateOrderStatus(id, newStatus);
        if (result.success) {
            await refreshOrders();
        }
        setUpdatingId(null);
    };

    const renderStatusBadge = (status: OrderStatus) => {
        switch (status) {
            case OrderStatus.PENDING:
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mr-2 animate-pulse"></span>
                        Pendente
                    </span>
                );
            case OrderStatus.IN_PRODUCTION:
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-2"></span>
                        Em Produção
                    </span>
                );
            case OrderStatus.READY_FOR_SHIPPING:
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary mr-2"></span>
                        Pronto p/ Envio
                    </span>
                );
            default:
                return null;
        }
    };

    const renderActions = (order: Order) => {
        const isUpdating = updatingId === order.id;

        if (isUpdating) {
            return <div className="text-slate-500 text-xs">Atualizando...</div>
        }

        if (order.status === OrderStatus.PENDING) {
            return (
                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={() => handleStatusUpdate(order.id, OrderStatus.IN_PRODUCTION)}
                        className="flex items-center gap-2 h-9 px-4 rounded-full bg-primary/10 hover:bg-primary hover:text-background-dark text-primary font-bold text-xs transition-all shadow-[0_0_10px_rgba(34,211,238,0.1)] hover:shadow-[0_0_15px_rgba(34,211,238,0.4)]"
                        title="Enviar para Produção"
                    >
                        <span>Enviar p/ Produção</span>
                        <Icons.Play size={14} />
                    </button>
                </div>
            );
        }

        if (order.status === OrderStatus.IN_PRODUCTION) {
            return (
                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={() => handleStatusUpdate(order.id, OrderStatus.READY_FOR_SHIPPING)}
                        className="flex items-center gap-2 h-9 px-4 rounded-full bg-blue-500/10 hover:bg-blue-500 hover:text-white text-blue-400 border border-blue-500/20 font-bold text-xs transition-all"
                        title="Marcar como Pronto"
                    >
                        <span>Pronto p/ Envio</span>
                        <Icons.PackageCheck size={14} />
                    </button>
                </div>
            );
        }

        if (order.status === OrderStatus.READY_FOR_SHIPPING) {
            return (
                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={() => handleStatusUpdate(order.id, OrderStatus.COMPLETED)}
                        className="flex items-center gap-2 h-9 px-4 rounded-full bg-primary hover:bg-primary/90 text-background-dark font-bold text-xs transition-all shadow-lg shadow-primary/20"
                        title="Concluir / Entregue"
                    >
                        <span>Entregar/Concluir</span>
                        <Icons.CheckCircle size={14} />
                    </button>
                </div>
            );
        }
    };

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
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/5 border border-yellow-500/10 text-xs text-yellow-500">
                            <span className="size-2 rounded-full bg-yellow-500 animate-pulse"></span>
                            {orders.filter(o => o.status === OrderStatus.PENDING).length} Pendentes
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/5 border border-blue-500/10 text-xs text-blue-500">
                            <span className="size-2 rounded-full bg-blue-500"></span>
                            {orders.filter(o => o.status === OrderStatus.IN_PRODUCTION).length} Em Prod.
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
                        <div className="p-12 text-center text-slate-400">Carregando fila de produção...</div>
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
                                    <tr key={order.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="p-4 pl-6 font-mono text-white">#{order.id}</td>
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="text-white font-medium">{order.clientName}</span>
                                                <span className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString('pt-BR')}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-white font-bold text-sm tracking-wide">{order.productName || "Produto Personalizado"}</span>
                                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                                    <span>{order.width}x{order.height}cm</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                                                    <span>{order.quantity}un</span>
                                                </div>
                                                {order.instructions && (
                                                    <div className="mt-1 text-xs text-cyan-400/80 italic max-w-xs truncate">
                                                        "{order.instructions}"
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            {renderStatusBadge(order.status)}
                                        </td>
                                        <td className="p-4 pr-6 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <button
                                                    onClick={() => handleOpenDetails(order)}
                                                    className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                                                    title="Ver Detalhes Completo"
                                                >
                                                    <Icons.Visibility size={18} />
                                                </button>
                                                {renderActions(order)}
                                            </div>
                                        </td>
                                    </tr>
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
            />
        </div>
    );
}
