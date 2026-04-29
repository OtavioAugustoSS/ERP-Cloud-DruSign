'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Icons } from './Icons';
import { useAuth } from '../../context/AuthContext';
import { getPendingOrders, updateOrderStatus } from '../../actions/order';
import GlobalLoader from '../ui/GlobalLoader';
import OrderRow from './OrderRow';
import { Order, OrderStatus } from '../../types';
import { formatCurrency } from '@/lib/utils/price';

export default function Orders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    const { user } = useAuth();
    const isEmployee = user?.role === 'employee';
    const isAdmin = !isEmployee;

    const refreshOrders = async () => {
        setLoading(true);
        const data = await getPendingOrders();
        setOrders(data);
        setLoading(false);
    };

    useEffect(() => {
        refreshOrders();
    }, []);

    const counts = useMemo(() => ({
        pending:  orders.filter(o => o.status === OrderStatus.PENDING).length,
        prod:     orders.filter(o => o.status === OrderStatus.IN_PRODUCTION).length,
        finish:   orders.filter(o => o.status === OrderStatus.FINISHING).length,
        ready:    orders.filter(o => o.status === OrderStatus.READY_FOR_SHIPPING).length,
    }), [orders]);

    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            if (isEmployee && order.status !== OrderStatus.IN_PRODUCTION && order.status !== OrderStatus.FINISHING) {
                return false;
            }
            const matchesSearch =
                order.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.id.includes(searchTerm) ||
                (order.productName && order.productName.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [orders, searchTerm, statusFilter, isEmployee]);

    const handleStatusUpdate = React.useCallback(async (id: string, newStatus: OrderStatus) => {
        setUpdatingId(id);
        const result = await updateOrderStatus(id, newStatus);
        if (result.success) await refreshOrders();
        setUpdatingId(null);
    }, []);

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-background-dark">

            {/* ── HEADER ── */}
            <header className="flex-none px-8 py-5 border-b border-white/5 bg-background-dark/50 backdrop-blur-sm z-10">

                {/* Linha 1 — Título + ações */}
                <div className="flex items-center justify-between gap-4 animate-fade-in-up">
                    <div>
                        <h2 className="text-white text-2xl font-bold leading-tight tracking-tight">Fila de Produção</h2>
                        <p className="text-slate-500 text-xs mt-0.5">Acompanhe e gerencie o fluxo de pedidos ativos.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {isAdmin && (
                            <Link
                                href="/admin/orcamento"
                                className="group/newbtn relative flex items-center gap-2 h-9 pl-3.5 pr-4 rounded-full bg-primary/10 border border-primary/20 text-primary font-semibold text-sm overflow-hidden hover:border-primary/40 transition-colors shadow-[0_0_12px_rgba(34,211,238,0.06)] hover:shadow-[0_0_20px_rgba(34,211,238,0.2)]"
                            >
                                <span className="absolute inset-0 bg-primary -translate-x-full group-hover/newbtn:translate-x-0 transition-transform duration-300 ease-out rounded-full" />
                                <Plus size={15} className="relative z-10 group-hover/newbtn:text-background-dark transition-colors duration-300" />
                                <span className="relative z-10 group-hover/newbtn:text-background-dark transition-colors duration-300 text-xs">Novo Pedido</span>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Linha 2 — Badges de contagem */}
                <div className="flex items-center gap-2 mt-4 flex-wrap animate-fade-in-up animate-delay-100">
                    {isAdmin && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-500/5 border border-yellow-500/10 text-[11px] text-yellow-500 font-medium">
                            <span className="size-1.5 rounded-full bg-yellow-500 animate-pulse" />
                            {counts.pending} Pendentes
                        </div>
                    )}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/5 border border-blue-500/10 text-[11px] text-blue-400 font-medium">
                        <span className="size-1.5 rounded-full bg-blue-400" />
                        {counts.prod} Em Produção
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/5 border border-purple-500/10 text-[11px] text-purple-400 font-medium">
                        <span className="size-1.5 rounded-full bg-purple-400 animate-pulse" />
                        {counts.finish} Acabamento
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/5 border border-cyan-500/10 text-[11px] text-cyan-400 font-medium">
                        <span className="size-1.5 rounded-full bg-cyan-400" />
                        {counts.ready} Pronto p/ Envio
                    </div>
                </div>

                {/* ── FILTROS ── */}
                <div className="mt-6 flex flex-col xl:flex-row gap-3 animate-fade-in-up animate-delay-150">

                    {/* Busca */}
                    <div className="flex-1 min-w-[280px]">
                        <div className="flex w-full items-center rounded-full h-11 bg-white/5 border border-white/10 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all overflow-hidden">
                            <div className="pl-4 text-slate-500">
                                <Icons.Search size={18} />
                            </div>
                            <input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-transparent border-none text-white placeholder-slate-600 px-3 focus:ring-0 h-full text-sm outline-none"
                                placeholder="Buscar por ID, cliente ou produto..."
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="pr-4 text-slate-500 hover:text-white transition-colors"
                                    title="Limpar busca"
                                >
                                    <Icons.X size={16} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Filtro de status */}
                    {isAdmin && (
                        <div className="relative min-w-[210px]">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="appearance-none w-full h-11 rounded-full bg-white/5 border border-white/10 text-white pl-4 pr-10 text-sm font-medium focus:ring-1 focus:ring-primary/50 focus:border-primary/50 cursor-pointer outline-none"
                            >
                                <option value="ALL"                              className="bg-[#1a1a1a] text-white">Todos os Status</option>
                                <option value={OrderStatus.PENDING}              className="bg-[#1a1a1a] text-white">Pendente</option>
                                <option value={OrderStatus.IN_PRODUCTION}        className="bg-[#1a1a1a] text-white">Em Produção</option>
                                <option value={OrderStatus.FINISHING}            className="bg-[#1a1a1a] text-white">Acabamento</option>
                                <option value={OrderStatus.READY_FOR_SHIPPING}   className="bg-[#1a1a1a] text-white">Pronto p/ Envio</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                                <Icons.ChevronDown size={18} />
                            </div>
                        </div>
                    )}

                    {/* Atualizar */}
                    <button
                        onClick={refreshOrders}
                        className="flex items-center justify-center size-11 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-colors shrink-0"
                        title="Atualizar lista"
                    >
                        <Icons.History size={18} />
                    </button>
                </div>
            </header>

            {/* ── TABELA ── */}
            <div className="flex-1 overflow-auto p-6 pt-4">
                <div className="w-full rounded-2xl border border-white/10 bg-surface-dark/50 overflow-hidden shadow-2xl animate-fade-in-up animate-delay-200">
                    {loading ? (
                        <div className="p-12 flex justify-center">
                            <GlobalLoader text="CARREGANDO PEDIDOS..." />
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="py-16 flex flex-col items-center gap-3 text-slate-500">
                            <Icons.Search size={32} className="opacity-30" />
                            <p className="text-sm">Nenhum pedido encontrado.</p>
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="text-xs text-primary/70 hover:text-primary transition-colors underline underline-offset-2"
                                >
                                    Limpar busca
                                </button>
                            )}
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 bg-black/20 text-slate-500 text-[11px] uppercase tracking-widest font-semibold">
                                    <th className="p-4 pl-6 w-32">OS #</th>
                                    <th className="p-4">Cliente</th>
                                    <th className="p-4">Material / Detalhes</th>
                                    <th className="p-4 w-36">Prazo</th>
                                    <th className="p-4 w-40 text-center">Status</th>
                                    <th className="p-4 w-32 text-right">Valor</th>
                                    <th className="p-4 pr-6 w-48 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04] text-sm">
                                {filteredOrders.map((order) => (
                                    <OrderRow
                                        key={order.id}
                                        order={order}
                                        onStatusUpdate={handleStatusUpdate}
                                        updatingId={updatingId}
                                        isAdmin={isAdmin}
                                    />
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Rodapé de contagem + total */}
                {!loading && filteredOrders.length > 0 && (
                    <div className="flex items-center justify-between mt-3 px-1 animate-fade-in-up animate-delay-250">
                        <p className="text-[11px] text-slate-600 font-mono">
                            {filteredOrders.length === orders.length
                                ? `${orders.length} pedido${orders.length !== 1 ? 's' : ''} no total`
                                : `${filteredOrders.length} de ${orders.length} pedido${orders.length !== 1 ? 's' : ''} exibido${filteredOrders.length !== 1 ? 's' : ''}`
                            }
                        </p>
                        <p className="text-[11px] font-mono font-bold text-emerald-500/70">
                            {formatCurrency(filteredOrders.reduce((sum, o) => sum + (o.totalPrice ?? 0), 0))}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
