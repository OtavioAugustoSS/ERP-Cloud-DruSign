'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Icons } from './Icons';
import OrderDetailsModal from './OrderDetailsModal';
import { getHistoryOrders } from '../../actions/order';
import { Order, OrderStatus } from '../../types';
import { formatCurrency } from '../../lib/utils/price';

export default function History() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    // Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            const data = await getHistoryOrders();
            setOrders(data);
            setLoading(false);
        };
        fetchHistory();
    }, []);

    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            const matchesSearch =
                order.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.id.includes(searchTerm) ||
                (order.productName && order.productName.toLowerCase().includes(searchTerm.toLowerCase()));

            return matchesSearch;
        });
    }, [orders, searchTerm]);

    const renderStatus = (order: Order) => {
        if (order.status === OrderStatus.CANCELLED) {
            return (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                    <Icons.Block size={14} className="mr-1" />
                    Cancelado
                </span>
            );
        }
        return (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                <Icons.Check size={14} className="mr-1" />
                Concluído
            </span>
        );
    };

    const handleOpenDetails = (order: Order) => {
        setSelectedOrder(order);
        setIsDetailsOpen(true);
    };

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-background-dark">
            {/* ... header ... */}
            <header className="flex-none px-8 py-6 border-b border-white/5 bg-background-dark/50 backdrop-blur-sm z-10">
                {/* ... existing header content ... */}
                <div className="flex flex-wrap justify-between items-end gap-4">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-white text-3xl font-bold leading-tight tracking-tight">Histórico de Pedidos</h2>
                        <p className="text-slate-400 text-sm font-normal">Consulte pedidos finalizados e relatórios de vendas passadas.</p>
                    </div>
                </div>

                {/* Filters Toolbar */}
                <div className="mt-6">
                    <div className="w-full max-w-md">
                        <div className="flex w-full items-center rounded-full h-12 bg-white/5 border border-white/10 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 transition-all overflow-hidden">
                            <div className="pl-4 text-slate-500">
                                <Icons.Search size={20} />
                            </div>
                            <input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-transparent border-none text-white placeholder-slate-600 px-3 focus:ring-0 h-full text-sm font-medium outline-none"
                                placeholder="Buscar por Cliente ou ID..."
                            />
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-auto p-8 pt-4">
                <div className="w-full rounded-2xl border border-white/5 bg-surface-dark/50 overflow-hidden shadow-2xl">
                    {loading ? (
                        <div className="p-12 text-center text-slate-400">Carregando histórico...</div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
                            <Icons.History size={48} className="text-slate-600 mb-2" />
                            <p>Nenhum registro encontrado no histórico.</p>
                            {searchTerm && <p className="text-sm">Tente ajustar seus filtros de busca.</p>}
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 bg-black/20 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                                    <th className="p-4 pl-6 w-32">ID</th>
                                    <th className="p-4">Cliente</th>
                                    <th className="p-4">Detalhes do Pedido</th>
                                    <th className="p-4 text-right">Valor Final</th>
                                    <th className="p-4 text-center">Status</th>
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
                                                <span className="text-xs text-slate-500">
                                                    {new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-white font-bold text-sm tracking-wide">{order.productName || (order as any).serviceType?.replace('_', ' ') || "Produto Personalizado"}</span>
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
                                        <td className={`p-4 text-right font-mono ${order.status === OrderStatus.CANCELLED ? 'text-slate-400 line-through' : 'text-white'}`}>
                                            {formatCurrency(order.totalPrice)}
                                        </td>
                                        <td className="p-4 text-center">
                                            {renderStatus(order)}
                                        </td>
                                        <td className="p-4 pr-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {order.status === OrderStatus.CANCELLED ? (
                                                    <button className="size-9 rounded-full bg-transparent hover:bg-white/5 text-slate-400 hover:text-white flex items-center justify-center transition-all" title="Ver Motivo">
                                                        <Icons.Info size={18} />
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => handleOpenDetails(order)}
                                                            className="size-9 rounded-full bg-transparent hover:bg-white/5 text-slate-400 hover:text-white flex items-center justify-center transition-all"
                                                            title="Ver Detalhes"
                                                        >
                                                            <Icons.Visibility size={18} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer Info */}
                {!loading && filteredOrders.length > 0 && (
                    <div className="flex items-center justify-between mt-6 px-2">
                        <p className="text-xs text-slate-400">
                            Mostrando {filteredOrders.length} de {orders.length} registros
                        </p>
                        <div className="flex gap-2">
                            <button className="px-4 py-2 rounded-full border border-white/10 text-white text-xs font-bold hover:bg-white/5 transition-colors disabled:opacity-50" disabled>Anterior</button>
                            <button className="px-4 py-2 rounded-full border border-white/10 text-white text-xs font-bold hover:bg-white/5 transition-colors" disabled>Próximo</button>
                        </div>
                    </div>
                )}
            </div>

            <OrderDetailsModal
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
                order={selectedOrder}
            />
        </div>
    );
}
