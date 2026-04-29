'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
    Bell, BellOff, CheckCheck, X, Wrench, PackageCheck,
    CheckCircle2, Scissors,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    Notification,
} from '../../actions/notification';

// ── Tempo relativo ────────────────────────────────────────────────────────────
function timeAgo(date: Date | string): string {
    const d = new Date(date);
    const diffMin = Math.floor((Date.now() - d.getTime()) / 60_000);
    if (diffMin < 1)  return 'agora mesmo';
    if (diffMin < 60) return `há ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24)   return `há ${diffH}h`;
    const diffD = Math.floor(diffH / 24);
    if (diffD === 1)  return 'ontem';
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

// ── Mapeamento de tipo por conteúdo da mensagem ───────────────────────────────
interface NotifMeta {
    icon: React.ReactNode;
    accentBg:   string;
    cardBg:     string;
    cardBorder: string;
    iconBg:     string;
    iconColor:  string;
}

function notifMeta(message: string): NotifMeta {
    const m = message.toLowerCase();
    if (m.includes('cancelado') || m.includes('cancelada'))
        return { icon: <X size={13} />,            accentBg: 'bg-red-500',    cardBg: 'bg-red-500/5',    cardBorder: 'border-red-500/20',    iconBg: 'bg-red-500/10',    iconColor: 'text-red-400'    };
    if (m.includes('concluído') || m.includes('entregue'))
        return { icon: <CheckCircle2 size={13} />, accentBg: 'bg-green-500',  cardBg: 'bg-green-500/5',  cardBorder: 'border-green-500/20',  iconBg: 'bg-green-500/10',  iconColor: 'text-green-400'  };
    if (m.includes('envio') || m.includes('pronto'))
        return { icon: <PackageCheck size={13} />, accentBg: 'bg-primary',    cardBg: 'bg-primary/5',    cardBorder: 'border-primary/20',    iconBg: 'bg-primary/10',    iconColor: 'text-primary'    };
    if (m.includes('acabamento'))
        return { icon: <Scissors size={13} />,     accentBg: 'bg-purple-400', cardBg: 'bg-purple-500/5', cardBorder: 'border-purple-500/20', iconBg: 'bg-purple-500/10', iconColor: 'text-purple-400' };
    if (m.includes('produção'))
        return { icon: <Wrench size={13} />,       accentBg: 'bg-blue-400',   cardBg: 'bg-blue-500/5',   cardBorder: 'border-blue-500/20',   iconBg: 'bg-blue-500/10',   iconColor: 'text-blue-400'   };
    return     { icon: <Bell size={13} />,         accentBg: 'bg-primary',    cardBg: 'bg-primary/5',    cardBorder: 'border-primary/20',    iconBg: 'bg-primary/10',    iconColor: 'text-primary'    };
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface NotificationBellProps {
    /** Renderiza como item de nav dentro da sidebar (portal + full-width). */
    sidebarMode?: boolean;
    /** Quando true, os labels da sidebar ficam ocultos (sidebar travada). */
    sidebarLocked?: boolean;
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function NotificationBell({
    sidebarMode   = false,
    sidebarLocked = false,
}: NotificationBellProps) {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount]     = useState(0);
    const [isOpen, setIsOpen]               = useState(false);
    const [markingAll, setMarkingAll]       = useState(false);
    const [mounted, setMounted]             = useState(false);

    const buttonRef = useRef<HTMLButtonElement>(null);
    const panelRef  = useRef<HTMLDivElement>(null);
    const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});

    useEffect(() => { setMounted(true); }, []);

    const fetchNotifications = async () => {
        if (!user) return;
        const role = user.role === 'admin' ? 'admin' : 'employee';
        const data = await getNotifications(role);
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 10_000);
        return () => clearInterval(interval);
    }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

    // Click-outside — funciona para painel inline e portal
    useEffect(() => {
        if (!isOpen) return;
        const onClickOutside = (e: MouseEvent) => {
            const t = e.target as Node;
            if (!buttonRef.current?.contains(t) && !panelRef.current?.contains(t))
                setIsOpen(false);
        };
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, [isOpen]);

    const handleToggle = () => {
        if (!isOpen && sidebarMode && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const panelH = 480;
            let top = rect.top + rect.height / 2 - panelH / 2;
            top = Math.max(8, Math.min(top, window.innerHeight - panelH - 8));
            setPanelStyle({ top, left: rect.right + 10 });
        }
        setIsOpen(v => !v);
    };

    const handleMarkAsRead = async (id: string) => {
        await markNotificationAsRead(id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const handleMarkAll = async () => {
        if (!user || markingAll || unreadCount === 0) return;
        setMarkingAll(true);
        const role = user.role === 'admin' ? 'admin' : 'employee';
        await markAllNotificationsAsRead(role);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
        setMarkingAll(false);
    };

    // ── Painel (JSX reutilizado entre inline e portal) ────────────────────────
    const panel = (
        <div
            ref={panelRef}
            className="w-[22rem] rounded-2xl border border-white/10 bg-[#141414] shadow-2xl shadow-black/60 overflow-hidden"
            style={
                sidebarMode
                    ? { position: 'fixed', zIndex: 9999, ...panelStyle }
                    : { position: 'absolute', right: 0, top: 'calc(100% + 12px)', zIndex: 50 }
            }
        >
            {/* Cabeçalho */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">Notificações</span>
                    {unreadCount > 0 && (
                        <span className="inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold border border-primary/25 tabular-nums">
                            {unreadCount}
                        </span>
                    )}
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={handleMarkAll}
                        disabled={markingAll}
                        className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-primary transition-colors disabled:opacity-40"
                    >
                        <CheckCheck size={12} />
                        Marcar todas como lidas
                    </button>
                )}
            </div>

            {/* Lista */}
            <div className="max-h-[420px] overflow-y-auto p-3 flex flex-col gap-2">
                {notifications.length === 0 ? (
                    <div className="py-10 flex flex-col items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-white/[0.04] border border-white/5 flex items-center justify-center">
                            <BellOff size={18} className="text-slate-600" />
                        </div>
                        <p className="text-xs text-slate-600">Nenhuma notificação por aqui</p>
                    </div>
                ) : (
                    notifications.map(n => {
                        const meta    = notifMeta(n.message);
                        const isUnread = !n.read;
                        return (
                            <div
                                key={n.id}
                                onClick={() => isUnread && handleMarkAsRead(n.id)}
                                className={`
                                    relative flex items-start gap-3 px-3 py-2.5 rounded-xl border
                                    transition-all duration-200 select-none
                                    ${meta.cardBg} ${meta.cardBorder}
                                    ${isUnread ? 'cursor-pointer hover:brightness-125' : 'opacity-[0.55] cursor-default hover:opacity-75'}
                                `}
                            >
                                {isUnread && (
                                    <div className={`absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-full ${meta.accentBg}`} />
                                )}
                                <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${meta.iconBg} ${meta.cardBorder} ${meta.iconColor}`}>
                                    {meta.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-xs leading-relaxed ${isUnread ? 'text-white font-medium' : 'text-slate-300'}`}>
                                        {n.message}
                                    </p>
                                    <p className="text-[10px] text-slate-600 mt-1 font-mono tracking-tight">
                                        {timeAgo(n.createdAt)}
                                    </p>
                                </div>
                                {isUnread && (
                                    <div className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${meta.accentBg}`} />
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Rodapé */}
            {notifications.length > 0 && (
                <div className="px-4 py-2.5 border-t border-white/[0.06] text-center">
                    <span className="text-[10px] text-slate-700 font-mono">
                        {notifications.length} notificação{notifications.length !== 1 ? 'ões' : ''} · últimos 30 dias
                    </span>
                </div>
            )}
        </div>
    );

    // ── Modo sidebar: linha inteira clicável, alinhada com os NavItems ────────
    if (sidebarMode) {
        // Classe do label idêntica à lógica da sidebar (respeita sidebarLocked)
        const labelCls = sidebarLocked
            ? 'opacity-0'
            : 'opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-[80ms]';

        return (
            <>
                <button
                    ref={buttonRef}
                    onClick={handleToggle}
                    title="Notificações"
                    className={`
                        flex items-center gap-3 w-full px-2 py-2.5 rounded-xl transition-all duration-150
                        ${isOpen ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white hover:bg-white/10'}
                    `}
                >
                    {/* Ícone alinhado ao mesmo tamanho dos ícones de nav (20 px) */}
                    <div className="relative shrink-0 flex items-center justify-center w-5 h-5">
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                            </span>
                        )}
                    </div>

                    {/* Label + badge de contagem */}
                    <span className={`text-sm font-medium whitespace-nowrap flex items-center gap-2 ${labelCls}`}>
                        Notificações
                        {unreadCount > 0 && (
                            <span className="inline-flex items-center justify-center h-4 min-w-[1rem] px-1 rounded-full bg-primary/15 text-primary text-[9px] font-bold border border-primary/25 tabular-nums">
                                {unreadCount}
                            </span>
                        )}
                    </span>
                </button>

                {/* Painel via portal — escapa do overflow-hidden da sidebar */}
                {isOpen && mounted && createPortal(panel, document.body)}
            </>
        );
    }

    // ── Modo inline (headers das páginas) ─────────────────────────────────────
    return (
        <div className="relative">
            <button
                ref={buttonRef}
                onClick={handleToggle}
                className={`relative flex items-center justify-center h-9 w-9 rounded-full transition-colors outline-none
                    ${isOpen ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary border-2 border-background-dark" />
                    </span>
                )}
            </button>

            {isOpen && panel}
        </div>
    );
}
