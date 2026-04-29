'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import {
    Bell, BellOff, CheckCheck, Wrench, PackageCheck, Scissors,
    CheckCircle2, X, Clock, AlertTriangle, ChevronRight,
    RefreshCw, Loader2, Package, ArrowRight, Calendar,
} from 'lucide-react';
import { updateOrderStatus } from '@/actions/order';
import { getPendingOrders } from '@/actions/order';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/actions/notification';
import type { Order } from '@/types';
import type { Notification } from '@/actions/notification';

// ─── Tipos locais ───────────────────────────────────────────────────────────

type EmployeeStatus = 'IN_PRODUCTION' | 'FINISHING' | 'READY_FOR_SHIPPING';

const STATUS_CONFIG: Record<EmployeeStatus, {
    label: string; next: EmployeeStatus | null; nextLabel: string | null;
    bg: string; border: string; text: string; glow: string; dot: string;
}> = {
    IN_PRODUCTION: {
        label: 'Em Produção', next: 'FINISHING', nextLabel: 'Mover para Acabamento',
        bg: 'bg-blue-500/10', border: 'border-blue-500/25', text: 'text-blue-400',
        glow: 'shadow-blue-500/10', dot: 'bg-blue-400',
    },
    FINISHING: {
        label: 'Acabamento', next: 'READY_FOR_SHIPPING', nextLabel: 'Pronto para Envio',
        bg: 'bg-purple-500/10', border: 'border-purple-500/25', text: 'text-purple-400',
        glow: 'shadow-purple-500/10', dot: 'bg-purple-400',
    },
    READY_FOR_SHIPPING: {
        label: 'Pronto p/ Envio', next: null, nextLabel: null,
        bg: 'bg-cyan-500/10', border: 'border-cyan-500/25', text: 'text-cyan-400',
        glow: 'shadow-cyan-500/10', dot: 'bg-cyan-400',
    },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function greeting(name: string): string {
    const h = new Date().getHours();
    const part = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
    const first = name.split(' ')[0];
    return `${part}, ${first}!`;
}

function formatDate(d: Date) {
    return new Date(d).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
}

function deadlineInfo(date: Date | string | null | undefined): {
    label: string; color: string; urgent: boolean;
} {
    if (!date) return { label: 'Sem prazo', color: 'text-slate-600', urgent: false };
    const diff = Math.floor((new Date(date).setHours(23, 59, 59) - Date.now()) / 86_400_000);
    if (diff < 0)  return { label: `Atrasado ${Math.abs(diff)}d`, color: 'text-red-400',    urgent: true  };
    if (diff === 0) return { label: 'Prazo: hoje',               color: 'text-amber-400',   urgent: true  };
    if (diff === 1) return { label: 'Prazo: amanhã',             color: 'text-yellow-400',  urgent: false };
    if (diff <= 3)  return { label: `Prazo: ${diff} dias`,       color: 'text-slate-400',   urgent: false };
    return              { label: `Prazo: ${diff} dias`,          color: 'text-slate-600',   urgent: false };
}

function timeAgo(date: Date | string): string {
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 60_000);
    if (diff < 1)  return 'agora mesmo';
    if (diff < 60) return `há ${diff} min`;
    const h = Math.floor(diff / 60);
    if (h < 24)    return `há ${h}h`;
    const d = Math.floor(h / 24);
    return d === 1 ? 'ontem' : `há ${d} dias`;
}

function notifStyle(message: string) {
    const m = message.toLowerCase();
    if (m.includes('cancelado') || m.includes('cancelada'))
        return { icon: <X size={12} />, bg: 'bg-red-500/10', border: 'border-red-500/20', iconBg: 'bg-red-500/15', iconColor: 'text-red-400', accent: 'bg-red-400' };
    if (m.includes('concluído') || m.includes('entregue'))
        return { icon: <CheckCircle2 size={12} />, bg: 'bg-green-500/5', border: 'border-green-500/20', iconBg: 'bg-green-500/15', iconColor: 'text-green-400', accent: 'bg-green-400' };
    if (m.includes('pronto') || m.includes('envio'))
        return { icon: <PackageCheck size={12} />, bg: 'bg-cyan-500/5', border: 'border-cyan-500/20', iconBg: 'bg-cyan-500/15', iconColor: 'text-cyan-400', accent: 'bg-primary' };
    if (m.includes('acabamento'))
        return { icon: <Scissors size={12} />, bg: 'bg-purple-500/5', border: 'border-purple-500/20', iconBg: 'bg-purple-500/15', iconColor: 'text-purple-400', accent: 'bg-purple-400' };
    if (m.includes('produção'))
        return { icon: <Wrench size={12} />, bg: 'bg-blue-500/5', border: 'border-blue-500/20', iconBg: 'bg-blue-500/15', iconColor: 'text-blue-400', accent: 'bg-blue-400' };
    return { icon: <Bell size={12} />, bg: 'bg-primary/5', border: 'border-primary/20', iconBg: 'bg-primary/15', iconColor: 'text-primary', accent: 'bg-primary' };
}

// ─── Props ──────────────────────────────────────────────────────────────────

interface Props {
    initialOrders: Order[];
    initialNotifications: Notification[];
    userName: string;
}

// ─── Componente principal ────────────────────────────────────────────────────

export default function EmployeeDashboard({ initialOrders, initialNotifications, userName }: Props) {
    const [orders, setOrders] = useState<Order[]>(initialOrders);
    const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
    const [statusFilter, setStatusFilter] = useState<'ALL' | EmployeeStatus>('ALL');
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [now, setNow] = useState(new Date());

    // Relógio em tempo real
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 60_000);
        return () => clearInterval(t);
    }, []);

    const refresh = useCallback(async () => {
        setIsRefreshing(true);
        const [fresh, freshNotifs] = await Promise.all([
            getPendingOrders(),
            getNotifications('employee'),
        ]);
        setOrders(fresh.filter(o =>
            o.status === 'IN_PRODUCTION' || o.status === 'FINISHING' || o.status === 'READY_FOR_SHIPPING'
        ));
        setNotifications(freshNotifs);
        setIsRefreshing(false);
    }, []);

    const handleAdvanceStatus = useCallback(async (order: Order) => {
        const cfg = STATUS_CONFIG[order.status as EmployeeStatus];
        if (!cfg?.next) return;
        setUpdatingId(order.id);
        await updateOrderStatus(order.id, cfg.next as never);
        await refresh();
        setUpdatingId(null);
    }, [refresh]);

    const handleMarkRead = useCallback(async (id: string) => {
        await markNotificationAsRead(id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }, []);

    const handleMarkAllRead = useCallback(async () => {
        await markAllNotificationsAsRead('employee');
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, []);

    const filtered = useMemo(() =>
        statusFilter === 'ALL' ? orders : orders.filter(o => o.status === statusFilter),
        [orders, statusFilter]
    );

    const counts = useMemo(() => ({
        prod:   orders.filter(o => o.status === 'IN_PRODUCTION').length,
        finish: orders.filter(o => o.status === 'FINISHING').length,
        ready:  orders.filter(o => o.status === 'READY_FOR_SHIPPING').length,
    }), [orders]);

    const unread = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

    return (
        <div className="h-full overflow-y-auto bg-background-dark">
            <div className="max-w-[1400px] mx-auto p-5 space-y-5">

                {/* ── Header ── */}
                <div className="animate-fade-in-up flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                            {greeting(userName)}
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-0.5 capitalize">
                            {formatDate(now)}
                            <span className="mx-2 text-slate-700">·</span>
                            {now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Resumo rápido */}
                        <div className="flex items-center gap-2">
                            {orders.length > 0 ? (
                                <span className="text-xs font-bold text-white bg-primary/15 border border-primary/25 px-3 py-1.5 rounded-full">
                                    {orders.length} {orders.length === 1 ? 'serviço ativo' : 'serviços ativos'}
                                </span>
                            ) : (
                                <span className="text-xs text-slate-500 bg-white/5 border border-white/5 px-3 py-1.5 rounded-full">
                                    Nenhum serviço pendente
                                </span>
                            )}
                            {unread > 0 && (
                                <span className="text-xs font-bold text-amber-300 bg-amber-500/15 border border-amber-500/25 px-3 py-1.5 rounded-full">
                                    {unread} {unread === 1 ? 'nova notificação' : 'novas notificações'}
                                </span>
                            )}
                        </div>
                        {/* Atualizar */}
                        <button
                            onClick={refresh}
                            disabled={isRefreshing}
                            title="Atualizar"
                            className="h-12 w-12 sm:h-9 sm:w-9 shrink-0 flex items-center justify-center rounded-xl border border-white/10 text-slate-500 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-40"
                        >
                            <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {/* ── Filtros de status ── */}
                <div className="animate-fade-in-up animate-delay-50 flex items-center gap-2 overflow-x-auto sm:flex-wrap pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {([
                        { key: 'ALL', label: 'Todos', count: orders.length },
                        { key: 'IN_PRODUCTION', label: 'Em Produção', count: counts.prod },
                        { key: 'FINISHING', label: 'Acabamento', count: counts.finish },
                        { key: 'READY_FOR_SHIPPING', label: 'Pronto p/ Envio', count: counts.ready },
                    ] as const).map(({ key, label, count }) => (
                        <button
                            key={key}
                            onClick={() => setStatusFilter(key)}
                            className={`shrink-0 min-h-[48px] sm:min-h-0 sm:h-8 px-4 sm:px-3 rounded-full text-sm sm:text-xs font-semibold transition-all border flex items-center gap-1.5 ${
                                statusFilter === key
                                    ? 'bg-primary/20 text-primary border-primary/30'
                                    : 'bg-white/5 text-slate-400 border-white/5 hover:border-white/10 hover:text-slate-200'
                            }`}
                        >
                            {label}
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                statusFilter === key ? 'bg-primary/30 text-primary' : 'bg-white/10 text-slate-500'
                            }`}>
                                {count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* ── Layout principal ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                    {/* ── Coluna de serviços (2/3) ── */}
                    <div className="lg:col-span-2 space-y-4">

                        {filtered.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
                                <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center mb-4">
                                    <Package size={28} className="text-slate-600" />
                                </div>
                                <p className="text-slate-400 font-medium">Nenhum serviço nesta etapa</p>
                                <p className="text-slate-600 text-sm mt-1">
                                    {statusFilter === 'ALL' ? 'Tudo em dia!' : 'Tente outra etapa no filtro acima'}
                                </p>
                            </div>
                        )}

                        {filtered.map((order, idx) => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                updatingId={updatingId}
                                onAdvance={handleAdvanceStatus}
                                delay={idx * 50}
                            />
                        ))}
                    </div>

                    {/* ── Coluna de notificações (1/3) ── */}
                    <div className="lg:col-span-1">
                        <NotificationsPanel
                            notifications={notifications}
                            unread={unread}
                            onMarkRead={handleMarkRead}
                            onMarkAllRead={handleMarkAllRead}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Card de serviço ────────────────────────────────────────────────────────

function OrderCard({ order, updatingId, onAdvance, delay }: {
    order: Order;
    updatingId: string | null;
    onAdvance: (order: Order) => void;
    delay: number;
}) {
    const cfg = STATUS_CONFIG[order.status as EmployeeStatus];
    if (!cfg) return null;

    const dl = deadlineInfo(order.deliveryDate ?? null);
    const isUpdating = updatingId === order.id;
    const shortId = order.id.slice(0, 8).toUpperCase();

    return (
        <article
            className={`animate-fade-in-up bg-zinc-900/50 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-lg ${cfg.glow} transition-shadow hover:shadow-xl`}
            style={{ animationDelay: `${delay}ms` }}
        >
            {/* Barra de status lateral */}
            <div className={`h-1 w-full ${cfg.dot}`} />

            <div className="p-5 space-y-4">
                {/* Cabeçalho do card */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${cfg.bg} ${cfg.border} ${cfg.text}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot} animate-pulse`} />
                                {cfg.label}
                            </span>
                            <span className="text-[10px] text-slate-600 font-mono">OS #{shortId}</span>
                        </div>
                        <h2 className="text-base font-bold text-white mt-2 leading-tight truncate">
                            {order.clientName}
                        </h2>
                        {order.notes && (
                            <p className="text-xs text-slate-500 mt-0.5 truncate italic">{order.notes}</p>
                        )}
                    </div>

                    {/* Prazo */}
                    <div className={`shrink-0 flex items-center gap-1.5 text-[11px] font-semibold ${dl.color}`}>
                        {dl.urgent
                            ? <AlertTriangle size={13} className="shrink-0" />
                            : <Calendar size={12} className="shrink-0" />
                        }
                        {dl.label}
                    </div>
                </div>

                {/* Itens do serviço */}
                {order.items && order.items.length > 0 && (
                    <div className="bg-black/20 border border-white/5 rounded-xl p-3 space-y-2">
                        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">
                            {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
                        </p>
                        <ul className="space-y-1.5">
                            {order.items.slice(0, 4).map((item, i) => (
                                <li key={i} className="flex items-center gap-2 text-xs text-slate-300">
                                    <span className="h-1 w-1 rounded-full bg-slate-600 shrink-0" />
                                    <span className="font-medium text-white truncate">{item.material ?? item.productName ?? '—'}</span>
                                    {(item.width ?? 0) > 0 && (
                                        <span className="text-slate-500 font-mono shrink-0">
                                            {item.width}×{item.height}cm
                                        </span>
                                    )}
                                    <span className="text-slate-600 shrink-0">× {item.quantity}</span>
                                    {item.finishing && item.finishing !== 'Sem acabamento' && (
                                        <span className="text-slate-500 shrink-0 truncate">· {item.finishing}</span>
                                    )}
                                </li>
                            ))}
                            {order.items.length > 4 && (
                                <li className="text-[10px] text-slate-600 pl-3">
                                    + {order.items.length - 4} item(ns) — ver detalhes
                                </li>
                            )}
                        </ul>
                    </div>
                )}

                {/* Ações */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1">
                    <Link
                        href={`/admin/orders/${order.id}`}
                        className="group/view min-h-[48px] sm:min-h-0 sm:h-9 px-4 flex items-center justify-center gap-1.5 rounded-xl border border-white/10 text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        Ver detalhes
                        <ChevronRight size={13} className="group-hover/view:translate-x-0.5 transition-transform" />
                    </Link>

                    {cfg.next && (
                        <button
                            onClick={() => onAdvance(order)}
                            disabled={isUpdating}
                            className={`group/adv relative min-h-[48px] sm:min-h-0 sm:h-9 px-4 flex-1 overflow-hidden rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${cfg.border} ${cfg.text}`}
                        >
                            <span className={`absolute inset-0 ${cfg.bg} opacity-0 group-hover/adv:opacity-100 transition-opacity`} />
                            <span className="relative z-10 flex items-center gap-1.5">
                                {isUpdating
                                    ? <Loader2 size={13} className="animate-spin" />
                                    : <ArrowRight size={13} />
                                }
                                {cfg.nextLabel}
                            </span>
                        </button>
                    )}

                    {!cfg.next && (
                        <div className="flex-1 min-h-[48px] sm:min-h-0 sm:h-9 flex items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/5 text-xs font-bold text-cyan-400 gap-1.5">
                            <CheckCircle2 size={13} />
                            Aguardando retirada
                        </div>
                    )}
                </div>
            </div>
        </article>
    );
}

// ─── Painel de notificações ─────────────────────────────────────────────────

function NotificationsPanel({ notifications, unread, onMarkRead, onMarkAllRead }: {
    notifications: Notification[];
    unread: number;
    onMarkRead: (id: string) => void;
    onMarkAllRead: () => void;
}) {
    return (
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl overflow-hidden animate-fade-in-up animate-delay-100 sticky top-5">
            {/* Header do painel */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                    {unread > 0
                        ? <Bell size={15} className="text-primary" />
                        : <BellOff size={15} className="text-slate-600" />
                    }
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Notificações</span>
                    {unread > 0 && (
                        <span className="text-[10px] font-bold text-primary bg-primary/15 border border-primary/25 px-1.5 py-0.5 rounded-full">
                            {unread}
                        </span>
                    )}
                </div>
                {unread > 0 && (
                    <button
                        onClick={onMarkAllRead}
                        className="min-h-[48px] sm:min-h-0 text-xs sm:text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors px-2 sm:px-0"
                    >
                        <CheckCheck size={11} /> Marcar todas
                    </button>
                )}
            </div>

            {/* Lista */}
            <div className="max-h-[calc(100vh-280px)] overflow-y-auto custom-scrollbar divide-y divide-white/[0.03]">
                {notifications.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                        <BellOff size={24} className="text-slate-700 mb-3" />
                        <p className="text-sm text-slate-600">Nenhuma notificação</p>
                    </div>
                )}

                {notifications.map(n => {
                    const s = notifStyle(n.message);
                    return (
                        <div
                            key={n.id}
                            className={`relative flex items-start gap-3 px-4 py-3 transition-opacity ${n.read ? 'opacity-50' : ''}`}
                        >
                            {/* Accent strip de não-lida */}
                            {!n.read && (
                                <div className={`absolute left-0 top-3 bottom-3 w-0.5 rounded-full ${s.accent}`} />
                            )}
                            {/* Ícone */}
                            <div className={`h-7 w-7 rounded-lg ${s.iconBg} ${s.iconColor} flex items-center justify-center shrink-0 mt-0.5`}>
                                {s.icon}
                            </div>
                            {/* Texto */}
                            <div className="flex-1 min-w-0">
                                <p className={`text-xs leading-snug ${n.read ? 'text-slate-500' : 'text-slate-200'}`}>
                                    {n.message}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    <Clock size={10} className="text-slate-700" />
                                    <span className="text-[10px] text-slate-600">{timeAgo(n.createdAt)}</span>
                                    {n.orderId && (
                                        <Link
                                            href={`/admin/orders/${n.orderId}`}
                                            className="text-[10px] text-primary/60 hover:text-primary transition-colors"
                                        >
                                            ver pedido →
                                        </Link>
                                    )}
                                </div>
                            </div>
                            {/* Botão marcar lida */}
                            {!n.read && (
                                <button
                                    onClick={() => onMarkRead(n.id)}
                                    className="shrink-0 h-10 w-10 sm:h-5 sm:w-5 flex items-center justify-center rounded-full border border-white/10 text-slate-600 hover:text-slate-300 hover:bg-white/5 transition-colors sm:mt-0.5"
                                    title="Marcar como lida"
                                >
                                    <X size={14} className="sm:hidden" />
                                    <X size={10} className="hidden sm:block" />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-white/5">
                <p className="text-[10px] text-slate-700 text-center">
                    Notificações dos últimos 30 dias
                </p>
            </div>
        </div>
    );
}
