'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, XCircle, TrendingUp } from 'lucide-react';
import { Icons } from './Icons';
import { getHistoryOrders } from '../../actions/order';
import GlobalLoader from '../ui/GlobalLoader';
import { Order, OrderStatus } from '../../types';
import { formatCurrency } from '../../lib/utils/price';

// ── Status badges — apenas COMPLETED e CANCELLED ─────────────────────────────
const STATUS_CFG = {
    [OrderStatus.COMPLETED]: { label: 'Concluído', dot: 'bg-green-500', badge: 'bg-green-500/10 text-green-400 border-green-500/20' },
    [OrderStatus.CANCELLED]: { label: 'Cancelado', dot: 'bg-red-500',   badge: 'bg-red-500/10 text-red-400 border-red-500/20'       },
} as const;

function StatusBadge({ status }: { status: OrderStatus }) {
    const cfg = STATUS_CFG[status as keyof typeof STATUS_CFG];
    if (!cfg) return null;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${cfg.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
}

// ── Filtro de período ─────────────────────────────────────────────────────────
function withinPeriod(date: Date | string, period: string): boolean {
    if (period === 'ALL') return true;
    const d = new Date(date);
    const now = new Date();
    if (period === '30d')  return d >= new Date(now.getTime() - 30 * 86_400_000);
    if (period === '90d')  return d >= new Date(now.getTime() - 90 * 86_400_000);
    if (period === 'year') return d.getFullYear() === now.getFullYear();
    return true;
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function History() {
    const router = useRouter();
    const [orders, setOrders]           = useState<Order[]>([]);
    const [loading, setLoading]         = useState(true);
    const [searchTerm, setSearchTerm]   = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [periodFilter, setPeriodFilter] = useState<string>('ALL');

    useEffect(() => {
        (async () => {
            setLoading(true);
            const data = await getHistoryOrders();
            setOrders(data);
            setLoading(false);
        })();
    }, []);

    // Estatísticas globais (ignoram filtros — refletem o total real)
    const stats = useMemo(() => ({
        completed: orders.filter(o => o.status === OrderStatus.COMPLETED).length,
        cancelled: orders.filter(o => o.status === OrderStatus.CANCELLED).length,
        revenue:   orders
            .filter(o => o.status === OrderStatus.COMPLETED)
            .reduce((s, o) => s + (o.totalPrice ?? 0), 0),
    }), [orders]);

    const filteredOrders = useMemo(() => orders.filter(o => {
        const matchesSearch =
            o.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.id.includes(searchTerm) ||
            (o.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
        const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
        const matchesPeriod = withinPeriod(o.createdAt, periodFilter);
        return matchesSearch && matchesStatus && matchesPeriod;
    }), [orders, searchTerm, statusFilter, periodFilter]);

    // Receita dos pedidos filtrados (apenas COMPLETED)
    const filteredRevenue = useMemo(() =>
        filteredOrders
            .filter(o => o.status === OrderStatus.COMPLETED)
            .reduce((s, o) => s + (o.totalPrice ?? 0), 0),
    [filteredOrders]);

    const hasFilters = searchTerm || statusFilter !== 'ALL' || periodFilter !== 'ALL';

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-background-dark">

            {/* ── HEADER ── */}
            <header className="flex-none px-8 py-5 border-b border-white/5 bg-background-dark/50 backdrop-blur-sm z-10">

                {/* Linha 1 — Título + NotificationBell */}
                <div className="flex items-center justify-between gap-4 animate-fade-in-up">
                    <div>
                        <h2 className="text-white text-2xl font-bold leading-tight tracking-tight">Histórico de Pedidos</h2>
                        <p className="text-slate-500 text-xs mt-0.5">Pedidos finalizados e cancelados do sistema.</p>
                    </div>
                </div>

                {/* Linha 2 — Badges de estatísticas */}
                <div className="flex items-center gap-2 mt-4 flex-wrap animate-fade-in-up animate-delay-100">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/5 border border-green-500/10 text-[11px] text-green-400 font-medium">
                        <CheckCircle2 size={11} />
                        {stats.completed} Concluído{stats.completed !== 1 ? 's' : ''}
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/5 border border-red-500/10 text-[11px] text-red-400 font-medium">
                        <XCircle size={11} />
                        {stats.cancelled} Cancelado{stats.cancelled !== 1 ? 's' : ''}
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/5 border border-emerald-500/15 text-[11px] text-emerald-400 font-medium">
                        <TrendingUp size={11} />
                        Receita total: {formatCurrency(stats.revenue)}
                    </div>
                </div>

                {/* ── FILTROS ── */}
                <div className="mt-4 flex flex-col xl:flex-row gap-3 animate-fade-in-up animate-delay-150">

                    {/* Busca */}
                    <div className="flex-1 min-w-[280px]">
                        <div className="flex w-full items-center rounded-full h-11 bg-white/5 border border-white/10 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all overflow-hidden">
                            <div className="pl-4 text-slate-500"><Icons.Search size={18} /></div>
                            <input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-transparent border-none text-white placeholder-slate-600 px-3 focus:ring-0 h-full text-sm outline-none"
                                placeholder="Buscar por ID, cliente ou produto..."
                            />
                            {searchTerm && (
                                <button onClick={() => setSearchTerm('')} className="pr-4 text-slate-500 hover:text-white transition-colors" title="Limpar busca">
                                    <Icons.X size={16} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Filtro de status */}
                    <div className="relative min-w-[175px]">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="appearance-none w-full h-11 rounded-full bg-white/5 border border-white/10 text-white pl-4 pr-10 text-sm font-medium focus:ring-1 focus:ring-primary/50 focus:border-primary/50 cursor-pointer outline-none"
                        >
                            <option value="ALL"                  className="bg-[#1a1a1a] text-white">Todos os Status</option>
                            <option value={OrderStatus.COMPLETED} className="bg-[#1a1a1a] text-white">Concluído</option>
                            <option value={OrderStatus.CANCELLED} className="bg-[#1a1a1a] text-white">Cancelado</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                            <Icons.ChevronDown size={18} />
                        </div>
                    </div>

                    {/* Filtro de período */}
                    <div className="relative min-w-[185px]">
                        <select
                            value={periodFilter}
                            onChange={(e) => setPeriodFilter(e.target.value)}
                            className="appearance-none w-full h-11 rounded-full bg-white/5 border border-white/10 text-white pl-4 pr-10 text-sm font-medium focus:ring-1 focus:ring-primary/50 focus:border-primary/50 cursor-pointer outline-none"
                        >
                            <option value="ALL"  className="bg-[#1a1a1a] text-white">Todos os períodos</option>
                            <option value="30d"  className="bg-[#1a1a1a] text-white">Últimos 30 dias</option>
                            <option value="90d"  className="bg-[#1a1a1a] text-white">Últimos 3 meses</option>
                            <option value="year" className="bg-[#1a1a1a] text-white">Este ano</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                            <Icons.ChevronDown size={18} />
                        </div>
                    </div>
                </div>
            </header>

            {/* ── TABELA ── */}
            <div className="flex-1 overflow-auto p-6 pt-4">
                <div className="w-full rounded-2xl border border-white/10 bg-surface-dark/50 overflow-hidden shadow-2xl animate-fade-in-up animate-delay-200">
                    {loading ? (
                        <div className="p-12 flex justify-center">
                            <GlobalLoader text="CARREGANDO HISTÓRICO..." />
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="py-16 flex flex-col items-center gap-3 text-slate-500">
                            <Icons.History size={32} className="opacity-30" />
                            <p className="text-sm">Nenhum registro encontrado.</p>
                            {hasFilters && (
                                <button
                                    onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); setPeriodFilter('ALL'); }}
                                    className="text-xs text-primary/70 hover:text-primary transition-colors underline underline-offset-2"
                                >
                                    Limpar filtros
                                </button>
                            )}
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 bg-black/20 text-slate-500 text-[11px] uppercase tracking-widest font-semibold">
                                    <th className="p-3 pl-6 w-32">OS #</th>
                                    <th className="p-3">Cliente</th>
                                    <th className="p-3">Material / Detalhes</th>
                                    <th className="p-3 w-36">Prazo</th>
                                    <th className="p-3 w-36 text-center">Status</th>
                                    <th className="p-3 w-36 text-right">Valor</th>
                                    <th className="p-3 pr-6 w-20 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04] text-sm">
                                {filteredOrders.map(order => {
                                    const isCancelled = order.status === OrderStatus.CANCELLED;
                                    const itemCount = order.items?.length ?? 0;
                                    const accentClass = isCancelled ? 'border-l-red-500/20' : 'border-l-green-500/40';
                                    return (
                                        <tr
                                            key={order.id}
                                            onClick={() => router.push(`/admin/orders/${order.id}?from=history`)}
                                            className={`transition-all group cursor-pointer border-l-2 ${accentClass} ${isCancelled ? 'opacity-40' : 'hover:bg-white/[0.04]'}`}
                                        >
                                            {/* OS # */}
                                            <td className="p-3 pl-6">
                                                <span className="inline-flex items-center h-6 px-2 rounded-lg bg-white/[0.04] border border-white/[0.07] font-mono text-[10px] text-slate-400 tracking-wide select-all">
                                                    #{order.id.slice(0, 8)}
                                                </span>
                                            </td>

                                            {/* Cliente */}
                                            <td className="p-3">
                                                <p className="text-white font-medium text-sm leading-tight">{order.clientName}</p>
                                                <p className="text-[10px] text-slate-600 mt-0.5 font-mono">
                                                    {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                                                </p>
                                            </td>

                                            {/* Material / Detalhes */}
                                            <td className="p-3 max-w-[280px]">
                                                {itemCount > 1 ? (
                                                    <>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-white font-semibold text-sm">{itemCount} itens</p>
                                                            <span className="inline-flex items-center h-4 px-1.5 rounded bg-white/[0.06] text-[9px] font-bold text-slate-500 uppercase tracking-wide">multi</span>
                                                        </div>
                                                        <p className="text-[10px] text-slate-600 truncate mt-0.5">
                                                            {order.items.map(i => i.productName ?? i.material ?? '—').join(' · ')}
                                                        </p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <p className="text-white font-semibold text-sm truncate">
                                                            {order.productName ?? order.items?.[0]?.productName ?? order.items?.[0]?.material ?? 'Produto Personalizado'}
                                                        </p>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            {order.width && order.height && (
                                                                <span className="text-[10px] text-slate-600 font-mono">{order.width}×{order.height}cm</span>
                                                            )}
                                                            {order.quantity && (
                                                                <span className="text-[10px] text-slate-600">· {order.quantity} un</span>
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                            </td>

                                            {/* Prazo */}
                                            <td className="p-3">
                                                {order.deliveryDate ? (
                                                    <span className="text-xs font-mono text-slate-400 tabular-nums">
                                                        {new Date(order.deliveryDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-700 text-xs font-mono">—</span>
                                                )}
                                            </td>

                                            {/* Status */}
                                            <td className="p-3 text-center">
                                                <StatusBadge status={order.status} />
                                            </td>

                                            {/* Valor */}
                                            <td className="p-3 text-right">
                                                <span className={`text-sm font-mono font-bold tabular-nums ${isCancelled ? 'line-through text-slate-600' : 'text-emerald-400'}`}>
                                                    {formatCurrency(order.totalPrice)}
                                                </span>
                                            </td>

                                            {/* Ações */}
                                            <td className="p-3 pr-6 text-right">
                                                <Link
                                                    href={`/admin/orders/${order.id}?from=history`}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="inline-flex p-1.5 rounded-full hover:bg-white/10 text-slate-500 hover:text-white transition-colors"
                                                    title="Ver detalhes"
                                                >
                                                    <Icons.Visibility size={16} />
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Rodapé — contagem + receita filtrada */}
                {!loading && filteredOrders.length > 0 && (
                    <div className="flex items-center justify-between mt-3 px-1 animate-fade-in-up animate-delay-250">
                        <p className="text-[11px] text-slate-600 font-mono">
                            {filteredOrders.length === orders.length
                                ? `${orders.length} registro${orders.length !== 1 ? 's' : ''} no total`
                                : `${filteredOrders.length} de ${orders.length} registro${orders.length !== 1 ? 's' : ''} exibido${filteredOrders.length !== 1 ? 's' : ''}`
                            }
                        </p>
                        {filteredRevenue > 0 && (
                            <p className="text-[11px] font-mono font-bold text-emerald-500/70">
                                Receita: {formatCurrency(filteredRevenue)}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
