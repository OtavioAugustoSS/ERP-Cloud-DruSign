import Link from 'next/link';
import { Plus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/price';
import type { DashboardStats } from '@/actions/dashboard';
import DashboardClock from './DashboardClock';
import KpiCards from './KpiCards';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { AnimatedCount, AnimatedMaterialItem } from './DashboardAnimations';

const STATUS_CFG: Record<string, { label: string; dot: string; text: string; badge: string }> = {
    PENDING:            { label: 'Aguardando',      dot: 'bg-yellow-400', text: 'text-yellow-400', badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
    IN_PRODUCTION:      { label: 'Em Produção',     dot: 'bg-blue-400',   text: 'text-blue-400',   badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20'     },
    FINISHING:          { label: 'Acabamento',      dot: 'bg-purple-400', text: 'text-purple-400', badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20'},
    READY_FOR_SHIPPING: { label: 'Pronto p/ Envio', dot: 'bg-cyan-400',   text: 'text-cyan-400',   badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'     },
    COMPLETED:          { label: 'Concluído',       dot: 'bg-green-400',  text: 'text-green-400',  badge: 'bg-green-500/10 text-green-400 border-green-500/20'  },
    CANCELLED:          { label: 'Cancelado',       dot: 'bg-red-400',    text: 'text-red-400',    badge: 'bg-red-500/10 text-red-400 border-red-500/20'        },
};

function fmtDate(iso: string): string {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export default function DashboardHome({ stats }: { stats: DashboardStats }) {
    const now = new Date();
    const monthLabel = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-background-dark">

            {/* ── Header ── */}
            <header className="flex-none px-4 sm:px-8 py-3 sm:py-4 border-b border-white/5 bg-background-dark/80 backdrop-blur-md z-10 shrink-0">
                <div className="flex items-center justify-between gap-3">
                    {/* Esquerda: logo (desktop) + título */}
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <div className="hidden sm:flex items-center gap-3 shrink-0">
                            <span className="text-white text-xl font-extrabold tracking-tight leading-none">
                                Dru<span className="text-primary">Sign</span>
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-primary/20 text-primary uppercase tracking-wider font-bold">
                                Admin
                            </span>
                            <div className="w-px h-5 bg-white/10" />
                        </div>
                        <div>
                            <h2 className="text-white text-base font-bold leading-tight">Dashboard</h2>
                            <p className="text-slate-500 text-[11px] capitalize leading-tight hidden sm:block">{monthLabel} · Visão geral</p>
                        </div>
                    </div>
                    {/* Direita: relógio (desktop) + botão */}
                    <div className="flex items-center gap-2 sm:gap-5 shrink-0">
                        <div className="hidden sm:block"><DashboardClock /></div>
                        <Link
                            href="/admin/orcamento"
                            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-background-dark font-bold px-3 sm:px-4 py-2 rounded-xl transition-all shadow-lg shadow-primary/20 text-sm"
                        >
                            <Plus size={15} />
                            <span className="hidden sm:inline">Novo Pedido</span>
                        </Link>
                    </div>
                </div>
                {/* Linha 2 — apenas mobile: data + relógio */}
                <div className="flex items-center justify-between mt-1.5 sm:hidden">
                    <p className="text-slate-500 text-[11px] capitalize">{monthLabel} · Visão geral</p>
                    <DashboardClock />
                </div>
            </header>

            {/* ── Scroll area ── */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-4 sm:space-y-6">

                {/* ── KPIs animados (client component) ── */}
                <KpiCards stats={stats} />

                {/* ── Status + Pedidos Recentes ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Status de Produção */}
                    <div className="lg:col-span-5 bg-surface-dark/50 border border-white/5 rounded-2xl p-4 sm:p-6 flex flex-col relative group">
                        <GlowingEffect spread={80} glow={true} disabled={false} proximity={120} inactiveZone={0.01} borderWidth={2} />
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4 shrink-0 relative z-10">
                            Status de Produção
                        </h3>
                        <div className="flex-1 flex flex-col justify-evenly relative z-10">
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
                                    <div key={status} className="flex items-center justify-between py-2">
                                        <div className="flex items-center gap-3">
                                            <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${s.dot}`} />
                                            <span className="text-sm text-slate-300">{s.label}</span>
                                        </div>
                                        <span className={`text-3xl font-bold font-mono ${s.text}`}>
                                            <AnimatedCount value={count} />
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Pedidos Recentes */}
                    <div className="lg:col-span-7 bg-surface-dark/50 border border-white/5 rounded-2xl p-4 sm:p-6 relative group">
                        <GlowingEffect spread={80} glow={true} disabled={false} proximity={120} inactiveZone={0.01} borderWidth={2} />
                        <div className="flex items-center justify-between mb-4 sm:mb-5 relative z-10">
                            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Pedidos Recentes
                            </h3>
                            <Link href="/admin/orders" className="text-xs text-primary hover:underline">
                                ver todos →
                            </Link>
                        </div>

                        {stats.recentOrders.length === 0 ? (
                            <p className="text-slate-500 text-sm text-center py-6 relative z-10">Nenhum pedido ainda.</p>
                        ) : (
                            <div className="relative z-10">
                                {/* Mobile: layout de lista compacto */}
                                <div className="sm:hidden divide-y divide-white/5">
                                    {stats.recentOrders.map(order => {
                                        const s = STATUS_CFG[order.status] ?? STATUS_CFG.PENDING;
                                        return (
                                            <Link
                                                key={order.id}
                                                href={`/admin/orders/${order.id}`}
                                                className="flex items-center justify-between py-3 hover:bg-white/5 transition-colors rounded-lg px-1 gap-3"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm text-white font-medium truncate">{order.clientName ?? 'Cliente'}</p>
                                                    <p className="text-[10px] text-slate-600 font-mono mt-0.5">#{order.id.slice(0, 8)}</p>
                                                </div>
                                                <div className="flex flex-col items-end gap-1 shrink-0">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${s.badge}`}>
                                                        {s.label}
                                                    </span>
                                                    <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                                                        {formatCurrency(order.totalPrice)}
                                                    </span>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                                {/* Desktop: grid com colunas fixas */}
                                <div className="hidden sm:block">
                                    <div className="grid grid-cols-[7rem_1fr_auto_5rem] gap-3 pb-2 border-b border-white/5 mb-1">
                                        {['OS#', 'Cliente', 'Status', 'Valor'].map(h => (
                                            <span key={h} className="text-[10px] font-bold text-slate-500 uppercase tracking-wider last:text-right">
                                                {h}
                                            </span>
                                        ))}
                                    </div>
                                    {stats.recentOrders.map(order => {
                                        const s = STATUS_CFG[order.status] ?? STATUS_CFG.PENDING;
                                        return (
                                            <Link
                                                key={order.id}
                                                href={`/admin/orders/${order.id}`}
                                                className="grid grid-cols-[7rem_1fr_auto_5rem] gap-3 items-center py-2.5 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors rounded-lg px-1"
                                            >
                                                <span className="text-[11px] font-mono text-slate-400 truncate">
                                                    #{order.id.slice(0, 8)}
                                                </span>
                                                <span className="text-sm text-white font-medium truncate">
                                                    {order.clientName ?? 'Cliente'}
                                                </span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${s.badge}`}>
                                                    {s.label}
                                                </span>
                                                <span className="text-[11px] font-mono text-slate-400 text-right tabular-nums">
                                                    {formatCurrency(order.totalPrice)}
                                                </span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Top Materiais + Entregas ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Top Materiais */}
                    <div className="lg:col-span-4 bg-surface-dark/50 border border-white/5 rounded-2xl p-4 sm:p-6 relative group">
                        <GlowingEffect spread={80} glow={true} disabled={false} proximity={120} inactiveZone={0.01} borderWidth={2} />
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-5 relative z-10">
                            Top Materiais em Produção
                        </h3>
                        {stats.topMaterials.length === 0 ? (
                            <p className="text-slate-500 text-sm text-center py-6 relative z-10">Nenhum item em produção.</p>
                        ) : (
                            <div className="space-y-4 relative z-10">
                                {stats.topMaterials.map((mat, i) => (
                                    <AnimatedMaterialItem key={mat.name} mat={mat} index={i} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Entregas com Prazo Próximo */}
                    <div className="lg:col-span-8 bg-surface-dark/50 border border-white/5 rounded-2xl p-4 sm:p-6 relative group">
                        <GlowingEffect spread={80} glow={true} disabled={false} proximity={120} inactiveZone={0.01} borderWidth={2} />
                        <div className="flex items-center justify-between mb-5 relative z-10">
                            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Entregas com Prazo Próximo
                            </h3>
                            {stats.alertOrders.length > 0 && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                    {stats.alertOrders.length} alerta{stats.alertOrders.length > 1 ? 's' : ''}
                                </span>
                            )}
                        </div>

                        {stats.alertOrders.length === 0 ? (
                            <p className="text-slate-500 text-sm text-center py-8 relative z-10">Nenhuma entrega vencendo hoje.</p>
                        ) : (
                            <div className="space-y-2 relative z-10">
                                {stats.alertOrders.map(o => {
                                    const s = STATUS_CFG[o.status] ?? STATUS_CFG.PENDING;
                                    const isOverdue = new Date(o.deliveryDate) < now;
                                    return (
                                        <Link
                                            key={o.id}
                                            href={`/admin/orders/${o.id}`}
                                            className={`flex items-center justify-between px-4 py-3 rounded-r-xl border-l-4 hover:bg-white/5 transition-colors ${isOverdue ? 'border-red-500 bg-red-500/5' : 'border-amber-500 bg-amber-500/5'}`}
                                        >
                                            <div>
                                                <p className="text-sm text-white font-medium">{o.clientName ?? 'Cliente'}</p>
                                                <p className="text-[11px] text-slate-500 font-mono">#{o.id.slice(0, 8)}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.badge}`}>
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
