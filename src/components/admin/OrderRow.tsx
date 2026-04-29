'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Icons } from './Icons';
import { Order, OrderStatus } from '../../types';
import { formatCurrency } from '@/lib/utils/price';

interface OrderRowProps {
    order: Order;
    onStatusUpdate: (id: string, newStatus: OrderStatus) => void;
    updatingId: string | null;
    isAdmin: boolean;
}

// ── Badge de status ──────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string; pulse?: boolean }> = {
    PENDING:            { label: 'Pendente',       dot: 'bg-yellow-400', badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', pulse: true  },
    IN_PRODUCTION:      { label: 'Em Produção',    dot: 'bg-blue-400',   badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20'                    },
    FINISHING:          { label: 'Acabamento',     dot: 'bg-purple-400', badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20', pulse: true  },
    READY_FOR_SHIPPING: { label: 'Pronto p/ Envio',dot: 'bg-primary',    badge: 'bg-primary/10 text-primary border-primary/20'                       },
    COMPLETED:          { label: 'Concluído',      dot: 'bg-green-500',  badge: 'bg-green-500/10 text-green-500 border-green-500/20'                  },
    CANCELLED:          { label: 'Cancelado',      dot: 'bg-red-500',    badge: 'bg-red-500/10 text-red-400 border-red-500/20'                        },
};

function StatusBadge({ status }: { status: OrderStatus }) {
    const cfg = STATUS_CONFIG[status];
    if (!cfg) return null;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${cfg.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot} ${cfg.pulse ? 'animate-pulse' : ''}`} />
            {cfg.label}
        </span>
    );
}

// ── Badge de prazo com urgência ───────────────────────────────────────────────
function DeliveryBadge({ date }: { date: Date | string | null | undefined }) {
    if (!date) return <span className="text-slate-600 text-xs font-mono">—</span>;
    const d = new Date(date);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((d.getTime() - now.getTime()) / 86_400_000);
    const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

    if (diffDays < 0) return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/25">
            <span className="w-1 h-1 rounded-full bg-red-400 animate-pulse" />
            VENCIDO · {label}
        </span>
    );
    if (diffDays === 0) return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/25 animate-pulse">
            HOJE
        </span>
    );
    if (diffDays === 1) return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            AMANHÃ
        </span>
    );
    return <span className="text-xs font-mono text-slate-400 tabular-nums">{label}</span>;
}

// ── Accent de status na borda esquerda ───────────────────────────────────────
const STATUS_ROW_ACCENT: Record<string, string> = {
    PENDING:            'border-l-yellow-500/50',
    IN_PRODUCTION:      'border-l-blue-500/50',
    FINISHING:          'border-l-purple-500/50',
    READY_FOR_SHIPPING: 'border-l-primary/50',
    COMPLETED:          'border-l-green-500/30',
    CANCELLED:          'border-l-red-500/20',
};

// ── Linha principal ───────────────────────────────────────────────────────────
const OrderRow = ({ order, onStatusUpdate, updatingId, isAdmin }: OrderRowProps) => {
    const router = useRouter();
    const [confirmingCancel, setConfirmingCancel] = useState(false);
    const isUpdating = updatingId === order.id;
    const isCancelled = order.status === OrderStatus.CANCELLED;
    const isCompleted = order.status === OrderStatus.COMPLETED;
    const detailHref = `/admin/orders/${order.id}`;
    const accentClass = STATUS_ROW_ACCENT[order.status] ?? 'border-l-transparent';

    const renderActions = () => {
        if (isUpdating) return (
            <span className="text-slate-500 text-xs animate-pulse">Atualizando...</span>
        );
        if (isCancelled || isCompleted) return null;

        // Modo confirmação inline de cancelamento
        if (confirmingCancel) {
            return (
                <div className="flex items-center justify-end gap-1.5 animate-fade-in">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setConfirmingCancel(false);
                            onStatusUpdate(order.id, OrderStatus.CANCELLED);
                        }}
                        className="text-xs px-2.5 py-1 bg-red-500/15 text-red-400 border border-red-500/25 rounded-lg hover:bg-red-500/25 transition-colors font-medium"
                    >
                        Cancelar pedido
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); setConfirmingCancel(false); }}
                        className="text-slate-500 hover:text-white transition-colors p-1"
                        title="Voltar"
                    >
                        <Icons.X size={13} />
                    </button>
                </div>
            );
        }

        return (
            <div className="flex items-center justify-end gap-2">
                {/* Botão de avanço de status */}
                {order.status === OrderStatus.PENDING && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onStatusUpdate(order.id, OrderStatus.IN_PRODUCTION); }}
                        className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-primary/10 hover:bg-primary hover:text-background-dark text-primary font-bold text-xs transition-all shadow-[0_0_10px_rgba(34,211,238,0.1)] hover:shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                    >
                        <Icons.Play size={13} /> Iniciar
                    </button>
                )}
                {order.status === OrderStatus.IN_PRODUCTION && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onStatusUpdate(order.id, OrderStatus.FINISHING); }}
                        className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-purple-500/10 hover:bg-purple-500 hover:text-white text-purple-400 border border-purple-500/20 font-bold text-xs transition-all"
                    >
                        <Icons.PackageCheck size={13} /> Acabamento
                    </button>
                )}
                {order.status === OrderStatus.FINISHING && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onStatusUpdate(order.id, OrderStatus.READY_FOR_SHIPPING); }}
                        className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-primary/10 hover:bg-primary hover:text-background-dark text-primary border border-primary/20 font-bold text-xs transition-all"
                    >
                        <Icons.PackageCheck size={13} /> Envio
                    </button>
                )}
                {order.status === OrderStatus.READY_FOR_SHIPPING && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onStatusUpdate(order.id, OrderStatus.COMPLETED); }}
                        className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-primary hover:bg-primary/90 text-background-dark font-bold text-xs transition-all shadow-lg shadow-primary/20"
                    >
                        <Icons.CheckCircle size={13} /> Entregar
                    </button>
                )}

                {/* Cancelar — admin, apenas em estados não terminais */}
                {isAdmin && (
                    <button
                        onClick={(e) => { e.stopPropagation(); setConfirmingCancel(true); }}
                        className="h-8 w-8 flex items-center justify-center rounded-full text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Cancelar pedido"
                    >
                        <Icons.X size={14} />
                    </button>
                )}
            </div>
        );
    };

    return (
        <tr
            onClick={() => router.push(detailHref)}
            className={`transition-all group cursor-pointer border-l-2 ${accentClass} ${isCancelled ? 'opacity-40' : 'hover:bg-white/[0.04]'}`}
        >
            {/* OS # */}
            <td className="p-3 pl-6 w-32">
                <span className="inline-flex items-center h-6 px-2 rounded-lg bg-white/[0.04] border border-white/[0.07] font-mono text-[10px] text-slate-400 tracking-wide select-all">
                    #{order.id.slice(0, 8)}
                </span>
            </td>

            {/* Cliente + data */}
            <td className="p-3">
                <p className="text-white font-medium text-sm leading-tight">{order.clientName}</p>
                <p className="text-[10px] text-slate-600 mt-0.5 font-mono">
                    {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                </p>
            </td>

            {/* Material / Detalhes */}
            <td className="p-3 max-w-[260px]">
                {order.items && order.items.length > 1 ? (
                    <>
                        <div className="flex items-center gap-2">
                            <p className="text-white font-semibold text-sm">{order.items.length} itens</p>
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
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            {(order.width && order.height) ? (
                                <span className="text-[10px] text-slate-600 font-mono">{order.width}×{order.height}cm</span>
                            ) : null}
                            {order.quantity ? (
                                <span className="text-[10px] text-slate-600">· {order.quantity} un</span>
                            ) : null}
                            {order.instructions && (
                                <span className="text-[10px] text-primary/60 italic truncate max-w-[140px]">"{order.instructions}"</span>
                            )}
                        </div>
                    </>
                )}
            </td>

            {/* Prazo */}
            <td className="p-3 w-36">
                <DeliveryBadge date={order.deliveryDate} />
            </td>

            {/* Status */}
            <td className="p-3 w-40 text-center">
                <StatusBadge status={order.status} />
            </td>

            {/* Valor */}
            <td className="p-3 w-32 text-right">
                <span className="text-sm font-mono font-bold text-emerald-400 tabular-nums">
                    {formatCurrency(order.totalPrice)}
                </span>
            </td>

            {/* Ações */}
            <td className="p-3 pr-6 w-48 text-right">
                <div className="flex items-center justify-end gap-2">
                    <Link
                        href={detailHref}
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-full hover:bg-white/10 text-slate-500 hover:text-white transition-colors"
                        title="Ver detalhes"
                    >
                        <Icons.Visibility size={16} />
                    </Link>
                    {renderActions()}
                </div>
            </td>
        </tr>
    );
};

export default React.memo(OrderRow);
