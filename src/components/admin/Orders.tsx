'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Plus, RefreshCw, Search, X, ChevronDown, Play,
    Scissors, PackageCheck, CheckCircle2, AlertTriangle,
    ChevronRight, Layers,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getPendingOrders, updateOrderStatus } from '../../actions/order';
import GlobalLoader from '../ui/GlobalLoader';
import OrderRow from './OrderRow';
import { Order, OrderStatus } from '../../types';
import { formatCurrency } from '@/lib/utils/price';

// ─── Config de status (mobile cards) ────────────────────────────────────────

const STATUS_CFG: Record<string, {
    label: string; bar: string; badge: string; dot: string; pulse?: boolean;
}> = {
    PENDING:            { label: 'Pendente',       bar: 'bg-yellow-500', badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', dot: 'bg-yellow-400', pulse: true  },
    IN_PRODUCTION:      { label: 'Em Produção',    bar: 'bg-blue-500',   badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',       dot: 'bg-blue-400'                },
    FINISHING:          { label: 'Acabamento',     bar: 'bg-purple-500', badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20', dot: 'bg-purple-400', pulse: true },
    READY_FOR_SHIPPING: { label: 'Pronto p/ Envio',bar: 'bg-primary',    badge: 'bg-primary/10 text-primary border-primary/20',          dot: 'bg-primary'                 },
    COMPLETED:          { label: 'Concluído',      bar: 'bg-green-500',  badge: 'bg-green-500/10 text-green-500 border-green-500/20',    dot: 'bg-green-500'               },
    CANCELLED:          { label: 'Cancelado',      bar: 'bg-red-500',    badge: 'bg-red-500/10 text-red-400 border-red-500/20',          dot: 'bg-red-400'                 },
};

function deadlineMeta(date?: Date | string | null) {
    if (!date) return null;
    const d = new Date(date); d.setHours(0, 0, 0, 0);
    const n = new Date();     n.setHours(0, 0, 0, 0);
    const diff = Math.ceil((d.getTime() - n.getTime()) / 86_400_000);
    const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    if (diff < 0)   return { label: `Atrasado · ${label}`, color: 'text-red-400',   urgent: true  };
    if (diff === 0) return { label: `Hoje · ${label}`,     color: 'text-amber-400', urgent: true  };
    if (diff === 1) return { label: `Amanhã · ${label}`,   color: 'text-yellow-400',urgent: false };
    return               { label,                           color: 'text-slate-500', urgent: false };
}

// ─── Card mobile de pedido ────────────────────────────────────────────────────

function MobileOrderCard({
    order, onStatusUpdate, updatingId, isAdmin,
}: {
    order: Order;
    onStatusUpdate: (id: string, s: OrderStatus) => void;
    updatingId: string | null;
    isAdmin: boolean;
}) {
    const router = useRouter();
    const [confirmCancel, setConfirmCancel] = useState(false);
    const cfg     = STATUS_CFG[order.status];
    const dl      = deadlineMeta(order.deliveryDate);
    const isUpd   = updatingId === order.id;
    const shortId = order.id.slice(0, 8).toUpperCase();
    const detailHref = `/admin/orders/${order.id}`;
    const isTerminal = order.status === 'COMPLETED' || order.status === 'CANCELLED';

    const productLabel = order.items && order.items.length > 1
        ? `${order.items.length} itens`
        : order.productName ?? order.items?.[0]?.productName ?? order.items?.[0]?.material ?? 'Personalizado';

    return (
        <article
            className={`rounded-2xl border border-white/8 bg-zinc-900/40 overflow-hidden ${order.status === 'CANCELLED' ? 'opacity-50' : ''}`}
            onClick={() => router.push(detailHref)}
        >
            {/* Barra de cor */}
            <div className={`h-[3px] w-full ${cfg?.bar ?? 'bg-slate-700'}`} />

            <div className="p-4 space-y-3">
                {/* Header: OS# + badge + prazo */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono text-slate-500 bg-white/[0.04] border border-white/[0.07] px-2 py-0.5 rounded-md">
                            #{shortId}
                        </span>
                        {cfg && (
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.badge}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${cfg.pulse ? 'animate-pulse' : ''}`} />
                                {cfg.label}
                            </span>
                        )}
                    </div>
                    {dl && (
                        <span className={`shrink-0 flex items-center gap-1 text-[11px] font-semibold ${dl.color}`}>
                            {dl.urgent && <AlertTriangle size={11} />}
                            {dl.label}
                        </span>
                    )}
                </div>

                {/* Cliente + produto */}
                <div>
                    <p className="text-white font-bold text-sm leading-tight">{order.clientName}</p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{productLabel}</p>
                    <p className="text-[10px] text-slate-700 font-mono mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                </div>

                {/* Valor + ações */}
                <div
                    className="flex items-center justify-between gap-3 pt-1 border-t border-white/[0.05]"
                    onClick={e => e.stopPropagation()}
                >
                    <span className="text-sm font-bold text-emerald-400 font-mono tabular-nums">
                        {formatCurrency(order.totalPrice)}
                    </span>

                    <div className="flex items-center gap-2">
                        <Link
                            href={detailHref}
                            onClick={e => e.stopPropagation()}
                            className="h-9 px-3 flex items-center gap-1 rounded-xl border border-white/10 text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            Detalhes <ChevronRight size={12} />
                        </Link>

                        {!isTerminal && !isUpd && !confirmCancel && (
                            <>
                                {order.status === 'PENDING' && (
                                    <button
                                        onClick={() => onStatusUpdate(order.id, OrderStatus.IN_PRODUCTION)}
                                        className="h-9 px-3 rounded-xl bg-primary/15 border border-primary/30 text-primary text-xs font-bold flex items-center gap-1.5 hover:bg-primary/25 transition-colors"
                                    >
                                        <Play size={12} /> Iniciar
                                    </button>
                                )}
                                {order.status === 'IN_PRODUCTION' && (
                                    <button
                                        onClick={() => onStatusUpdate(order.id, OrderStatus.FINISHING)}
                                        className="h-9 px-3 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-bold flex items-center gap-1.5 hover:bg-purple-500/25 transition-colors"
                                    >
                                        <Scissors size={12} /> Acabamento
                                    </button>
                                )}
                                {order.status === 'FINISHING' && (
                                    <button
                                        onClick={() => onStatusUpdate(order.id, OrderStatus.READY_FOR_SHIPPING)}
                                        className="h-9 px-3 rounded-xl bg-primary/15 border border-primary/30 text-primary text-xs font-bold flex items-center gap-1.5 hover:bg-primary/25 transition-colors"
                                    >
                                        <PackageCheck size={12} /> Envio
                                    </button>
                                )}
                                {order.status === 'READY_FOR_SHIPPING' && isAdmin && (
                                    <button
                                        onClick={() => onStatusUpdate(order.id, OrderStatus.COMPLETED)}
                                        className="h-9 px-3 rounded-xl bg-green-500/15 border border-green-500/30 text-green-400 text-xs font-bold flex items-center gap-1.5 hover:bg-green-500/25 transition-colors"
                                    >
                                        <CheckCircle2 size={12} /> Entregar
                                    </button>
                                )}
                                {isAdmin && (
                                    <button
                                        onClick={() => setConfirmCancel(true)}
                                        className="h-9 w-9 flex items-center justify-center rounded-xl border border-white/8 text-slate-600 hover:text-red-400 hover:border-red-500/20 hover:bg-red-500/10 transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </>
                        )}

                        {isUpd && (
                            <span className="text-xs text-slate-500 animate-pulse px-2">Atualizando...</span>
                        )}

                        {confirmCancel && (
                            <div className="flex items-center gap-1.5 animate-fade-in">
                                <button
                                    onClick={() => { setConfirmCancel(false); onStatusUpdate(order.id, OrderStatus.CANCELLED); }}
                                    className="h-9 px-3 rounded-xl bg-red-500/15 border border-red-500/25 text-red-400 text-xs font-bold hover:bg-red-500/25 transition-colors"
                                >
                                    Confirmar
                                </button>
                                <button
                                    onClick={() => setConfirmCancel(false)}
                                    className="h-9 w-9 flex items-center justify-center rounded-xl border border-white/8 text-slate-500 hover:text-white transition-colors"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </article>
    );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Orders() {
    const [orders, setOrders]       = useState<Order[]>([]);
    const [loading, setLoading]     = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    const { user } = useAuth();
    const isEmployee = user?.role === 'employee';
    const isAdmin    = !isEmployee;

    const refreshOrders = async () => {
        setLoading(true);
        setOrders(await getPendingOrders());
        setLoading(false);
    };

    useEffect(() => { refreshOrders(); }, []);

    const counts = useMemo(() => ({
        pending: orders.filter(o => o.status === OrderStatus.PENDING).length,
        prod:    orders.filter(o => o.status === OrderStatus.IN_PRODUCTION).length,
        finish:  orders.filter(o => o.status === OrderStatus.FINISHING).length,
        ready:   orders.filter(o => o.status === OrderStatus.READY_FOR_SHIPPING).length,
    }), [orders]);

    const filteredOrders = useMemo(() => orders.filter(order => {
        if (isEmployee && order.status !== OrderStatus.IN_PRODUCTION && order.status !== OrderStatus.FINISHING) return false;
        const matchesSearch =
            order.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.id.includes(searchTerm) ||
            (order.productName && order.productName.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    }), [orders, searchTerm, statusFilter, isEmployee]);

    const handleStatusUpdate = React.useCallback(async (id: string, newStatus: OrderStatus) => {
        setUpdatingId(id);
        const result = await updateOrderStatus(id, newStatus);
        if (result.success) await refreshOrders();
        setUpdatingId(null);
    }, []);

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-background-dark">

            {/* ── HEADER ── */}
            <header className="flex-none px-4 sm:px-8 py-4 sm:py-5 border-b border-white/5 bg-background-dark/50 backdrop-blur-sm z-10">

                {/* Linha 1 — Título + ações */}
                <div className="flex items-center justify-between gap-3 animate-fade-in-up">
                    <div>
                        <h2 className="text-white text-xl sm:text-2xl font-bold leading-tight tracking-tight">Fila de Produção</h2>
                        <p className="text-slate-500 text-xs mt-0.5 hidden sm:block">Acompanhe e gerencie o fluxo de pedidos ativos.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {isAdmin && (
                            <Link
                                href="/admin/orcamento"
                                className="group/newbtn relative flex items-center gap-1.5 sm:gap-2 h-9 pl-3 pr-3.5 sm:pl-3.5 sm:pr-4 rounded-full bg-primary/10 border border-primary/20 text-primary font-semibold overflow-hidden hover:border-primary/40 transition-colors"
                            >
                                <span className="absolute inset-0 bg-primary -translate-x-full group-hover/newbtn:translate-x-0 transition-transform duration-300 ease-out rounded-full" />
                                <Plus size={14} className="relative z-10 group-hover/newbtn:text-background-dark transition-colors duration-300" />
                                <span className="relative z-10 group-hover/newbtn:text-background-dark transition-colors duration-300 text-xs whitespace-nowrap">Novo Pedido</span>
                            </Link>
                        )}
                        <button
                            onClick={refreshOrders}
                            className="flex items-center justify-center h-9 w-9 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-colors shrink-0"
                            title="Atualizar lista"
                        >
                            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {/* Linha 2 — Badges de contagem */}
                <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden animate-fade-in-up animate-delay-100">
                    {isAdmin && (
                        <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-500/5 border border-yellow-500/10 text-[11px] text-yellow-500 font-medium">
                            <span className="size-1.5 rounded-full bg-yellow-500 animate-pulse" />{counts.pending} Pendentes
                        </div>
                    )}
                    <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/5 border border-blue-500/10 text-[11px] text-blue-400 font-medium">
                        <span className="size-1.5 rounded-full bg-blue-400" />{counts.prod} Em Produção
                    </div>
                    <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/5 border border-purple-500/10 text-[11px] text-purple-400 font-medium">
                        <span className="size-1.5 rounded-full bg-purple-400 animate-pulse" />{counts.finish} Acabamento
                    </div>
                    <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/5 border border-cyan-500/10 text-[11px] text-cyan-400 font-medium">
                        <span className="size-1.5 rounded-full bg-cyan-400" />{counts.ready} Prontos
                    </div>
                </div>

                {/* Linha 3 — Filtros */}
                <div className="mt-3 flex gap-2 animate-fade-in-up animate-delay-150">
                    <div className="flex-1 flex items-center rounded-full h-10 bg-white/5 border border-white/10 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all overflow-hidden">
                        <div className="pl-3.5 text-slate-500"><Search size={15} /></div>
                        <input
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-transparent border-none text-white placeholder-slate-600 px-2.5 focus:ring-0 h-full text-sm outline-none"
                            placeholder="Buscar por ID, cliente ou produto..."
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="pr-3.5 text-slate-500 hover:text-white transition-colors">
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {isAdmin && (
                        <div className="relative shrink-0">
                            <select
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                                className="appearance-none h-10 rounded-full bg-white/5 border border-white/10 text-white pl-3.5 pr-9 text-xs font-medium focus:ring-1 focus:ring-primary/50 focus:border-primary/50 cursor-pointer outline-none"
                            >
                                <option value="ALL"                              className="bg-[#1a1a1a]">Todos</option>
                                <option value={OrderStatus.PENDING}              className="bg-[#1a1a1a]">Pendente</option>
                                <option value={OrderStatus.IN_PRODUCTION}        className="bg-[#1a1a1a]">Em Produção</option>
                                <option value={OrderStatus.FINISHING}            className="bg-[#1a1a1a]">Acabamento</option>
                                <option value={OrderStatus.READY_FOR_SHIPPING}   className="bg-[#1a1a1a]">Pronto p/ Envio</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
                                <ChevronDown size={14} />
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* ── CONTEÚDO ── */}
            <div className="flex-1 overflow-auto p-4 sm:p-6 sm:pt-4">
                {loading ? (
                    <div className="p-12 flex justify-center">
                        <GlobalLoader text="CARREGANDO PEDIDOS..." />
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="py-16 flex flex-col items-center gap-3 text-slate-500">
                        <Layers size={32} className="opacity-30" />
                        <p className="text-sm">Nenhum pedido encontrado.</p>
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="text-xs text-primary/70 hover:text-primary transition-colors underline underline-offset-2">
                                Limpar busca
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* ── MOBILE — Cards ── */}
                        <div className="lg:hidden space-y-3 animate-fade-in-up animate-delay-200">
                            {filteredOrders.map(order => (
                                <MobileOrderCard
                                    key={order.id}
                                    order={order}
                                    onStatusUpdate={handleStatusUpdate}
                                    updatingId={updatingId}
                                    isAdmin={isAdmin}
                                />
                            ))}
                        </div>

                        {/* ── DESKTOP — Tabela ── */}
                        <div className="hidden lg:block w-full rounded-2xl border border-white/10 bg-surface-dark/50 overflow-hidden shadow-2xl animate-fade-in-up animate-delay-200">
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
                                    {filteredOrders.map(order => (
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
                        </div>
                    </>
                )}

                {/* Rodapé de contagem + total */}
                {!loading && filteredOrders.length > 0 && (
                    <div className="flex items-center justify-between mt-3 px-1 animate-fade-in-up animate-delay-250">
                        <p className="text-[11px] text-slate-600 font-mono">
                            {filteredOrders.length === orders.length
                                ? `${orders.length} pedido${orders.length !== 1 ? 's' : ''} no total`
                                : `${filteredOrders.length} de ${orders.length} exibido${filteredOrders.length !== 1 ? 's' : ''}`
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
