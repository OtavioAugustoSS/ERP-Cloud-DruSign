'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import {
    Bell, BellOff, CheckCheck, Wrench, PackageCheck, Scissors,
    CheckCircle2, X, Clock, AlertTriangle, ChevronRight,
    RefreshCw, Loader2, Package, Calendar, Check,
    Factory, Layers,
} from 'lucide-react';
import { updateOrderStatus, getPendingOrders } from '@/actions/order';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/actions/notification';
import type { Order } from '@/types';
import type { Notification } from '@/actions/notification';

// ─── Tipos ──────────────────────────────────────────────────────────────────

type EmployeeStatus = 'IN_PRODUCTION' | 'FINISHING' | 'READY_FOR_SHIPPING';
type MobileTab = 'servicos' | 'notificacoes';

// ─── Config de status ────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<EmployeeStatus, {
    label: string;
    next: EmployeeStatus | null;
    nextLabel: string | null;
    bg: string; border: string; text: string; glow: string; dot: string; bar: string;
    NextIcon: React.ElementType | null;
}> = {
    IN_PRODUCTION: {
        label: 'Em Produção',
        next: 'FINISHING', nextLabel: 'Mover para Acabamento',
        bg: 'bg-blue-500/10', border: 'border-blue-500/25', text: 'text-blue-400',
        glow: 'shadow-blue-500/10', dot: 'bg-blue-400', bar: 'bg-blue-500',
        NextIcon: Scissors,
    },
    FINISHING: {
        label: 'Acabamento',
        next: 'READY_FOR_SHIPPING', nextLabel: 'Marcar como Pronto',
        bg: 'bg-purple-500/10', border: 'border-purple-500/25', text: 'text-purple-400',
        glow: 'shadow-purple-500/10', dot: 'bg-purple-400', bar: 'bg-purple-500',
        NextIcon: PackageCheck,
    },
    READY_FOR_SHIPPING: {
        label: 'Pronto p/ Envio',
        next: null, nextLabel: null,
        bg: 'bg-cyan-500/10', border: 'border-cyan-500/25', text: 'text-cyan-400',
        glow: 'shadow-cyan-500/10', dot: 'bg-cyan-400', bar: 'bg-cyan-500',
        NextIcon: null,
    },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function greeting(name: string): string {
    const h = new Date().getHours();
    const part = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
    return `${part}, ${name.split(' ')[0]}!`;
}

function formatDate(d: Date) {
    return new Date(d).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
}

function deadlineInfo(date: Date | string | null | undefined) {
    if (!date) return { label: 'Sem prazo', color: 'text-slate-600', urgent: false };
    const diff = Math.floor((new Date(date).setHours(23, 59, 59) - Date.now()) / 86_400_000);
    if (diff < 0)   return { label: `Atrasado ${Math.abs(diff)}d`, color: 'text-red-400',   urgent: true  };
    if (diff === 0) return { label: 'Prazo: hoje',                 color: 'text-amber-400', urgent: true  };
    if (diff === 1) return { label: 'Prazo: amanhã',               color: 'text-yellow-400',urgent: false };
    if (diff <= 3)  return { label: `Prazo: ${diff} dias`,         color: 'text-slate-400', urgent: false };
    return               { label: `Prazo: ${diff} dias`,          color: 'text-slate-600', urgent: false };
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

function notifMeta(message: string): { Icon: React.ElementType; color: string; accent: string } {
    const m = message.toLowerCase();
    if (m.includes('cancelado') || m.includes('cancelada'))
        return { Icon: X,            color: 'text-red-400',    accent: 'bg-red-400'    };
    if (m.includes('concluído') || m.includes('entregue'))
        return { Icon: CheckCircle2, color: 'text-green-400',  accent: 'bg-green-400'  };
    if (m.includes('pronto') || m.includes('envio'))
        return { Icon: PackageCheck, color: 'text-cyan-400',   accent: 'bg-cyan-400'   };
    if (m.includes('acabamento'))
        return { Icon: Scissors,     color: 'text-purple-400', accent: 'bg-purple-400' };
    if (m.includes('produção'))
        return { Icon: Wrench,       color: 'text-blue-400',   accent: 'bg-blue-400'   };
    return         { Icon: Bell,     color: 'text-primary',    accent: 'bg-primary'    };
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface Props {
    initialOrders: Order[];
    initialNotifications: Notification[];
    userName: string;
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function EmployeeDashboard({ initialOrders, initialNotifications, userName }: Props) {
    const [orders, setOrders]               = useState<Order[]>(initialOrders);
    const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
    const [statusFilter, setStatusFilter]   = useState<'ALL' | EmployeeStatus>('ALL');
    const [updatingId, setUpdatingId]       = useState<string | null>(null);
    const [confirmingId, setConfirmingId]   = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing]   = useState(false);
    const [mobileTab, setMobileTab]         = useState<MobileTab>('servicos');
    const [now, setNow]                     = useState(new Date());

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

    const handleAdvanceRequest = useCallback((orderId: string) => {
        setConfirmingId(orderId);
    }, []);

    const handleAdvanceConfirm = useCallback(async (order: Order) => {
        const cfg = STATUS_CONFIG[order.status as EmployeeStatus];
        if (!cfg?.next) return;
        setConfirmingId(null);
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
        <div className="flex-1 min-h-0 overflow-y-auto bg-background-dark">
            <div className="max-w-[1400px] mx-auto p-4 sm:p-5 space-y-4 sm:space-y-5">

                {/* ── Header ── */}
                <div className="flex items-start sm:items-center justify-between gap-3 animate-fade-in-up">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-tight">
                            {greeting(userName)}
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-0.5 capitalize">
                            {formatDate(now)}
                            <span className="mx-2 text-slate-700">·</span>
                            {now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Badges de resumo — desktop */}
                        <div className="hidden sm:flex items-center gap-2">
                            {orders.length > 0 ? (
                                <span className="text-xs font-bold text-white bg-primary/15 border border-primary/25 px-3 py-1.5 rounded-full">
                                    {orders.length} {orders.length === 1 ? 'serviço' : 'serviços'}
                                </span>
                            ) : null}
                            {unread > 0 && (
                                <span className="text-xs font-bold text-amber-300 bg-amber-500/15 border border-amber-500/25 px-3 py-1.5 rounded-full">
                                    {unread} nova{unread !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={refresh}
                            disabled={isRefreshing}
                            title="Atualizar"
                            className="h-10 w-10 flex items-center justify-center rounded-xl border border-white/10 text-slate-500 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-40"
                        >
                            <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {/* ── Filtros de status ── */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden animate-fade-in-up animate-delay-50">
                    {([
                        { key: 'ALL',              label: 'Todos',          count: orders.length,  Icon: Layers   },
                        { key: 'IN_PRODUCTION',    label: 'Em Produção',    count: counts.prod,    Icon: Factory  },
                        { key: 'FINISHING',        label: 'Acabamento',     count: counts.finish,  Icon: Scissors },
                        { key: 'READY_FOR_SHIPPING', label: 'Prontos',      count: counts.ready,   Icon: PackageCheck },
                    ] as const).map(({ key, label, count, Icon }) => (
                        <button
                            key={key}
                            onClick={() => setStatusFilter(key)}
                            className={`shrink-0 h-10 sm:h-8 px-3.5 sm:px-3 rounded-full text-sm sm:text-xs font-semibold transition-all border flex items-center gap-1.5 ${
                                statusFilter === key
                                    ? 'bg-primary/20 text-primary border-primary/30'
                                    : 'bg-white/5 text-slate-400 border-white/5 hover:border-white/10 hover:text-slate-200'
                            }`}
                        >
                            <Icon size={12} />
                            {label}
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                statusFilter === key ? 'bg-primary/30 text-primary' : 'bg-white/10 text-slate-500'
                            }`}>
                                {count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* ── Tabs mobile ── */}
                <div className="flex lg:hidden border-b border-white/5 animate-fade-in-up animate-delay-100">
                    <button
                        onClick={() => setMobileTab('servicos')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                            mobileTab === 'servicos'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        <Factory size={15} />
                        Serviços
                        {orders.length > 0 && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                mobileTab === 'servicos' ? 'bg-primary/20 text-primary' : 'bg-white/10 text-slate-500'
                            }`}>
                                {filtered.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setMobileTab('notificacoes')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                            mobileTab === 'notificacoes'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        <Bell size={15} />
                        Notificações
                        {unread > 0 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                                {unread}
                            </span>
                        )}
                    </button>
                </div>

                {/* ── Layout principal ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                    {/* ── Coluna de serviços (2/3) ── */}
                    <div className={`lg:col-span-2 space-y-3 ${mobileTab === 'notificacoes' ? 'hidden lg:block' : ''}`}>

                        {filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
                                <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center mb-4">
                                    <Package size={24} className="text-slate-600" />
                                </div>
                                <p className="text-slate-400 font-medium text-sm">Nenhum serviço nesta etapa</p>
                                <p className="text-slate-600 text-xs mt-1">
                                    {statusFilter === 'ALL' ? 'Tudo em dia!' : 'Tente outro filtro acima'}
                                </p>
                            </div>
                        ) : filtered.map((order, idx) => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                updatingId={updatingId}
                                confirmingId={confirmingId}
                                onAdvanceRequest={handleAdvanceRequest}
                                onAdvanceConfirm={handleAdvanceConfirm}
                                onCancelConfirm={() => setConfirmingId(null)}
                                delay={idx * 40}
                            />
                        ))}
                    </div>

                    {/* ── Painel de notificações (1/3) ── */}
                    <div className={`lg:col-span-1 ${mobileTab === 'servicos' ? 'hidden lg:block' : ''}`}>
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

// ─── Card de serviço ──────────────────────────────────────────────────────────

function OrderCard({ order, updatingId, confirmingId, onAdvanceRequest, onAdvanceConfirm, onCancelConfirm, delay }: {
    order: Order;
    updatingId: string | null;
    confirmingId: string | null;
    onAdvanceRequest: (id: string) => void;
    onAdvanceConfirm: (order: Order) => void;
    onCancelConfirm: () => void;
    delay: number;
}) {
    const cfg       = STATUS_CONFIG[order.status as EmployeeStatus];
    if (!cfg) return null;

    const dl        = deadlineInfo(order.deliveryDate ?? null);
    const isUpdating    = updatingId  === order.id;
    const isConfirming  = confirmingId === order.id;
    const shortId   = order.id.slice(0, 8).toUpperCase();
    const { NextIcon } = cfg;

    return (
        <article
            className={`animate-fade-in-up rounded-2xl overflow-hidden border border-white/8 bg-zinc-900/40 shadow-lg transition-shadow hover:shadow-xl ${cfg.glow}`}
            style={{ animationDelay: `${delay}ms` }}
        >
            {/* Barra de status colorida no topo */}
            <div className={`h-[3px] w-full ${cfg.bar}`} />

            <div className="p-4 sm:p-5">
                {/* Cabeçalho */}
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border ${cfg.bg} ${cfg.border} ${cfg.text}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot} animate-pulse`} />
                                {cfg.label}
                            </span>
                            <span className="text-[10px] text-slate-600 font-mono">OS #{shortId}</span>
                        </div>
                        <h2 className="text-base font-bold text-white leading-tight truncate">
                            {order.clientName}
                        </h2>
                        {order.notes && (
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 italic">{order.notes}</p>
                        )}
                    </div>

                    {/* Prazo */}
                    <div className={`shrink-0 flex items-center gap-1 text-[11px] font-semibold ${dl.color}`}>
                        {dl.urgent
                            ? <AlertTriangle size={12} className="shrink-0" />
                            : <Calendar size={11} className="shrink-0" />
                        }
                        <span className="whitespace-nowrap">{dl.label}</span>
                    </div>
                </div>

                {/* Itens */}
                {order.items && order.items.length > 0 && (
                    <div className="bg-black/25 border border-white/[0.05] rounded-xl p-3 mb-4 space-y-1.5">
                        <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mb-2">
                            {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
                        </p>
                        {order.items.slice(0, 4).map((item, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs">
                                <span className="h-1 w-1 rounded-full bg-slate-700 shrink-0" />
                                <span className="font-medium text-slate-200 truncate flex-1 min-w-0">
                                    {item.material ?? item.productName ?? '—'}
                                </span>
                                {(item.width ?? 0) > 0 && (
                                    <span className="text-slate-500 font-mono text-[10px] shrink-0">
                                        {item.width}×{item.height}cm
                                    </span>
                                )}
                                <span className="text-slate-600 text-[10px] shrink-0">×{item.quantity}</span>
                                {item.finishing && item.finishing !== 'Sem acabamento' && (
                                    <span className="text-slate-600 text-[10px] shrink-0 truncate hidden sm:block">· {item.finishing}</span>
                                )}
                            </div>
                        ))}
                        {order.items.length > 4 && (
                            <p className="text-[10px] text-slate-600 pl-3">
                                +{order.items.length - 4} item(ns) a mais
                            </p>
                        )}
                    </div>
                )}

                {/* Ações */}
                <div className="flex flex-col sm:flex-row gap-2">
                    <Link
                        href={`/admin/orders/${order.id}`}
                        className="h-10 px-4 flex items-center justify-center gap-1.5 rounded-xl border border-white/10 text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        Ver detalhes
                        <ChevronRight size={12} className="opacity-60" />
                    </Link>

                    {cfg.next && !isConfirming && (
                        <button
                            onClick={() => onAdvanceRequest(order.id)}
                            disabled={isUpdating || !!updatingId}
                            className={`h-10 flex-1 flex items-center justify-center gap-2 rounded-xl font-bold text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed border ${cfg.border} ${cfg.text} ${cfg.bg} hover:brightness-125`}
                        >
                            {isUpdating
                                ? <Loader2 size={13} className="animate-spin" />
                                : NextIcon && <NextIcon size={13} />
                            }
                            {cfg.nextLabel}
                        </button>
                    )}

                    {/* Confirmação inline — evita avanço acidental */}
                    {cfg.next && isConfirming && (
                        <div className="flex-1 flex items-center gap-2 p-1.5 rounded-xl border border-amber-500/30 bg-amber-500/8 animate-fade-in">
                            <span className="text-[11px] text-amber-300/80 font-medium px-2 flex-1">
                                Confirmar avanço?
                            </span>
                            <button
                                onClick={() => onAdvanceConfirm(order)}
                                disabled={isUpdating}
                                className="h-7 px-3 flex items-center gap-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                            >
                                <Check size={12} />
                                Sim
                            </button>
                            <button
                                onClick={onCancelConfirm}
                                className="h-7 w-7 flex items-center justify-center rounded-lg border border-white/10 text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    )}

                    {!cfg.next && (
                        <div className="h-10 flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-cyan-500/20 bg-cyan-500/8 text-xs font-bold text-cyan-400">
                            <CheckCircle2 size={13} />
                            Aguardando retirada
                        </div>
                    )}
                </div>
            </div>
        </article>
    );
}

// ─── Painel de notificações ───────────────────────────────────────────────────

function NotificationsPanel({ notifications, unread, onMarkRead, onMarkAllRead }: {
    notifications: Notification[];
    unread: number;
    onMarkRead: (id: string) => void;
    onMarkAllRead: () => void;
}) {
    const unreadList = notifications.filter(n => !n.read);
    const readList   = notifications.filter(n =>  n.read);

    return (
        <div className="lg:sticky lg:top-5 rounded-2xl overflow-hidden border border-white/8 bg-surface-dark/60 animate-fade-in-up animate-delay-100">

            {/* Header */}
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-white leading-tight">Notificações</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                        {unread > 0 ? `${unread} não lida${unread !== 1 ? 's' : ''}` : 'Todas lidas'}
                    </p>
                </div>
                {unread > 0 && (
                    <button
                        onClick={onMarkAllRead}
                        className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-white/10 text-[11px] text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        <CheckCheck size={12} />
                        Marcar lidas
                    </button>
                )}
            </div>

            {/* Feed */}
            <div className="max-h-[calc(100vh-260px)] lg:max-h-[calc(100vh-240px)] overflow-y-auto custom-scrollbar">

                {notifications.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
                        <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center mb-3">
                            <BellOff size={20} className="text-slate-600" />
                        </div>
                        <p className="text-sm text-slate-500 font-medium">Nenhuma notificação</p>
                        <p className="text-xs text-slate-700 mt-1">Você está em dia!</p>
                    </div>
                )}

                {/* Não lidas */}
                {unreadList.length > 0 && (
                    <div>
                        <div className="px-5 pt-4 pb-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                Não lidas · {unreadList.length}
                            </span>
                        </div>
                        <div className="space-y-px">
                            {unreadList.map(n => (
                                <NotifItem key={n.id} n={n} onMarkRead={onMarkRead} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Lidas */}
                {readList.length > 0 && (
                    <div className={unreadList.length > 0 ? 'mt-2 border-t border-white/[0.04]' : ''}>
                        {unreadList.length > 0 && (
                            <div className="px-5 pt-4 pb-2">
                                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">
                                    Lidas
                                </span>
                            </div>
                        )}
                        <div className="space-y-px">
                            {readList.slice(0, 15).map(n => (
                                <NotifItem key={n.id} n={n} onMarkRead={onMarkRead} />
                            ))}
                            {readList.length > 15 && (
                                <p className="text-[10px] text-slate-700 text-center py-3">
                                    +{readList.length - 15} notificações mais antigas
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-white/[0.04]">
                <p className="text-[10px] text-slate-700">Últimos 30 dias</p>
            </div>
        </div>
    );
}

// ─── Item de notificação ──────────────────────────────────────────────────────

function NotifItem({ n, onMarkRead }: { n: Notification; onMarkRead: (id: string) => void }) {
    const meta = notifMeta(n.message);
    const { Icon } = meta;

    return (
        <div className={`relative flex items-start gap-3 px-5 py-3.5 transition-colors ${
            n.read ? 'opacity-45 hover:opacity-60' : 'hover:bg-white/[0.025]'
        }`}>
            {/* Linha lateral colorida — apenas não lidas */}
            {!n.read && (
                <div className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full ${meta.accent}`} />
            )}

            {/* Ícone */}
            <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                n.read ? 'bg-white/5 text-slate-600' : `bg-white/8 ${meta.color}`
            }`}>
                <Icon size={13} />
            </div>

            {/* Conteúdo */}
            <div className="flex-1 min-w-0">
                <p className={`text-xs leading-snug ${n.read ? 'text-slate-600' : 'text-slate-200 font-medium'}`}>
                    {n.message}
                </p>
                <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
                    <span className={`text-[10px] flex items-center gap-1 ${n.read ? 'text-slate-700' : 'text-slate-600'}`}>
                        <Clock size={9} />
                        {timeAgo(n.createdAt)}
                    </span>
                    {n.orderId && (
                        <Link
                            href={`/admin/orders/${n.orderId}`}
                            className="text-[10px] text-primary/50 hover:text-primary transition-colors underline underline-offset-2"
                        >
                            ver pedido
                        </Link>
                    )}
                </div>
            </div>

            {/* Marcar como lida */}
            {!n.read && (
                <button
                    onClick={() => onMarkRead(n.id)}
                    title="Marcar como lida"
                    className="shrink-0 h-7 w-7 flex items-center justify-center rounded-lg border border-white/[0.08] text-slate-600 hover:text-white hover:bg-white/8 transition-colors mt-0.5"
                >
                    <X size={11} />
                </button>
            )}
        </div>
    );
}
