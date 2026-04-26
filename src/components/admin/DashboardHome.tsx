import type { ReactNode } from 'react';
import Link from 'next/link';
import {
    Plus, TrendingUp, Users, FileStack, Wallet,
    Clock, List, AlertTriangle, CheckCircle,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/price';
import type { DashboardStats } from '@/actions/dashboard';

const STATUS_CFG: Record<string, { label: string; bg: string; text: string; border: string; dot: string }> = {
    PENDING:            { label: 'Aguardando',      bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20', dot: 'bg-yellow-400' },
    IN_PRODUCTION:      { label: 'Em Produção',     bg: 'bg-blue-500/10',   text: 'text-blue-400',   border: 'border-blue-500/20',   dot: 'bg-blue-400'   },
    FINISHING:          { label: 'Acabamento',      bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', dot: 'bg-purple-400' },
    READY_FOR_SHIPPING: { label: 'Pronto p/ Envio', bg: 'bg-cyan-500/10',   text: 'text-cyan-400',   border: 'border-cyan-500/20',   dot: 'bg-cyan-400'   },
    COMPLETED:          { label: 'Concluído',       bg: 'bg-green-500/10',  text: 'text-green-400',  border: 'border-green-500/20',  dot: 'bg-green-400'  },
    CANCELLED:          { label: 'Cancelado',       bg: 'bg-red-500/10',    text: 'text-red-400',    border: 'border-red-500/20',    dot: 'bg-red-400'    },
};

function timeAgo(iso: string): string {
    const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
    if (h < 1) return 'agora';
    if (h < 24) return `há ${h}h`;
    const d = Math.floor(h / 24);
    return d === 1 ? 'ontem' : `há ${d} dias`;
}

function fmtDate(iso: string): string {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export default function DashboardHome({ stats }: { stats: DashboardStats }) {
    const now = new Date();
    const monthLabel = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-background-dark">

            {/* ── Header ── */}
            <header className="flex-none px-8 py-6 border-b border-white/5 bg-background-dark/80 backdrop-blur-md z-10">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h2 className="text-white text-3xl font-bold leading-tight tracking-tight">Dashboard</h2>
                        <p className="text-slate-400 text-sm mt-0.5 capitalize">{monthLabel} · Visão geral</p>
                    </div>
                    <Link
                        href="/admin/orcamento"
                        className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-background-dark font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-primary/20 text-sm"
                    >
                        <Plus size={16} />
                        Novo Pedido
                    </Link>
                </div>
            </header>

            {/* ── Scroll ── */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6">

                {/* ── KPIs ── métricas do mês, nenhuma repetida nos blocos abaixo */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

                    {/* Receita do mês */}
                    <KpiCard
                        label="Receita do Mês"
                        icon={<Wallet size={16} />}
                        color="green"
                        sub="pedidos concluídos"
                    >
                        <span className="text-xl font-bold font-mono text-white leading-tight">
                            {formatCurrency(stats.monthRevenue)}
                        </span>
                    </KpiCard>

                    {/* Pedidos criados no mês */}
                    <KpiCard
                        label="Pedidos no Mês"
                        icon={<FileStack size={16} />}
                        color="blue"
                        sub="todos os status"
                    >
                        <span className="text-4xl font-bold font-mono text-white">{stats.ordersThisMonth}</span>
                    </KpiCard>

                    {/* Ticket médio do mês */}
                    <KpiCard
                        label="Ticket Médio"
                        icon={<TrendingUp size={16} />}
                        color="purple"
                        sub="pedidos deste mês"
                    >
                        <span className="text-xl font-bold font-mono text-white leading-tight">
                            {stats.avgTicketMonth > 0 ? formatCurrency(stats.avgTicketMonth) : '—'}
                        </span>
                    </KpiCard>

                    {/* Total de clientes cadastrados */}
                    <KpiCard
                        label="Clientes Cadastrados"
                        icon={<Users size={16} />}
                        color="cyan"
                        sub="base total"
                    >
                        <span className="text-4xl font-bold font-mono text-white">{stats.totalClients}</span>
                    </KpiCard>
                </div>

                {/* ── Status + Pedidos Recentes ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Status de Produção */}
                    <div className="lg:col-span-5 bg-surface-dark/50 border border-white/5 rounded-2xl p-6">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-5 flex items-center gap-2">
                            <Clock size={13} /> Status de Produção
                        </h3>
                        <div className="space-y-3">
                            {(
                                [
                                    ['PENDING',            stats.byStatus.PENDING],
                                    ['IN_PRODUCTION',      stats.byStatus.IN_PRODUCTION],
                                    ['FINISHING',          stats.byStatus.FINISHING],
                                    ['READY_FOR_SHIPPING', stats.byStatus.READY_FOR_SHIPPING],
                                ] as [string, number][]
                            ).map(([status, count]) => {
                                const s = STATUS_CFG[status];
                                return (
                                    <div key={status} className={`flex items-center justify-between px-4 py-3.5 rounded-xl border ${s.bg} ${s.border}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${s.dot}`} />
                                            <span className={`text-sm font-medium ${s.text}`}>{s.label}</span>
                                        </div>
                                        <span className={`text-2xl font-bold font-mono ${s.text}`}>{count}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Pedidos Recentes */}
                    <div className="lg:col-span-7 bg-surface-dark/50 border border-white/5 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <List size={13} /> Pedidos Recentes
                            </h3>
                            <Link href="/admin/orders" className="text-xs text-primary hover:underline">
                                ver todos →
                            </Link>
                        </div>

                        {stats.recentOrders.length === 0 ? (
                            <p className="text-slate-500 text-sm text-center py-6">Nenhum pedido ainda.</p>
                        ) : (
                            <div className="space-y-1">
                                {stats.recentOrders.map(order => {
                                    const s = STATUS_CFG[order.status] ?? STATUS_CFG.PENDING;
                                    const initials = (order.clientName ?? 'NA')
                                        .split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
                                    return (
                                        <Link
                                            key={order.id}
                                            href={`/admin/orders/${order.id}`}
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors"
                                        >
                                            <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
                                                {initials}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-white font-medium truncate">
                                                    {order.clientName ?? 'Cliente'}
                                                </p>
                                                <p className="text-[11px] text-slate-500 font-mono">
                                                    #{order.id.slice(0, 8)} · {timeAgo(order.createdAt)}
                                                </p>
                                            </div>
                                            <div className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${s.bg} ${s.text} ${s.border}`}>
                                                {s.label}
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Top Materiais + Prazo ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Top Materiais */}
                    <div className="lg:col-span-4 bg-surface-dark/50 border border-white/5 rounded-2xl p-6">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-5">
                            Top Materiais em Produção
                        </h3>
                        {stats.topMaterials.length === 0 ? (
                            <p className="text-slate-500 text-sm text-center py-6">Nenhum item em produção.</p>
                        ) : (
                            <div className="space-y-4">
                                {stats.topMaterials.map(mat => (
                                    <div key={mat.name}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-sm text-slate-300 truncate max-w-[75%]">{mat.name}</span>
                                            <span className="text-xs text-slate-500 font-mono tabular-nums">{mat.pct}%</span>
                                        </div>
                                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-primary rounded-full" style={{ width: `${mat.pct}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Entregas com prazo */}
                    <div className="lg:col-span-8 bg-surface-dark/50 border border-white/5 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-5">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <AlertTriangle size={13} className="text-amber-400" />
                                Entregas com Prazo Próximo
                            </h3>
                            {stats.alertOrders.length > 0 && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                    {stats.alertOrders.length}
                                </span>
                            )}
                        </div>

                        {stats.alertOrders.length === 0 ? (
                            <div className="flex items-center justify-center gap-3 py-8">
                                <CheckCircle size={18} className="text-green-400" />
                                <p className="text-slate-400 text-sm">Nenhuma entrega vencendo hoje.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {stats.alertOrders.map(o => {
                                    const s = STATUS_CFG[o.status] ?? STATUS_CFG.PENDING;
                                    const isOverdue = new Date(o.deliveryDate) < now;
                                    return (
                                        <Link
                                            key={o.id}
                                            href={`/admin/orders/${o.id}`}
                                            className="flex items-center justify-between px-4 py-3 rounded-xl bg-amber-500/5 border border-amber-500/10 hover:bg-amber-500/10 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <AlertTriangle size={14} className={isOverdue ? 'text-red-400' : 'text-amber-400'} />
                                                <div>
                                                    <p className="text-sm text-white font-medium">{o.clientName ?? 'Cliente'}</p>
                                                    <p className="text-[11px] text-slate-500 font-mono">#{o.id.slice(0, 8)}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${s.bg} ${s.text} ${s.border}`}>
                                                    {s.label}
                                                </span>
                                                <span className={`text-xs font-mono font-bold tabular-nums ${isOverdue ? 'text-red-400' : 'text-amber-400'}`}>
                                                    {isOverdue ? 'VENCIDO' : fmtDate(o.deliveryDate)}
                                                </span>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function KpiCard({ label, icon, color, sub, children }: {
    label: string;
    icon: ReactNode;
    color: 'blue' | 'purple' | 'cyan' | 'green';
    sub?: string;
    children: ReactNode;
}) {
    const iconClass = {
        blue:   'bg-blue-500/10 text-blue-400 border-blue-500/20',
        purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        cyan:   'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
        green:  'bg-green-500/10 text-green-400 border-green-500/20',
    }[color];

    return (
        <div className="bg-surface-dark/50 border border-white/5 rounded-2xl p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
                <div className={`p-2 rounded-lg border ${iconClass}`}>{icon}</div>
            </div>
            {children}
            {sub && <p className="text-[11px] text-slate-600 leading-tight">{sub}</p>}
        </div>
    );
}
