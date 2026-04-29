'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
    LayoutDashboard,
    ClipboardList,
    ShoppingCart,
    Settings,
    Users,
    LogOut,
    History,
    UserRound,
    Lock,
    Unlock,
    type LucideIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from './NotificationBell';

export default function AdminSidebar() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { user, logout } = useAuth();

    // Locked = sidebar stays compact even on hover (persisted via localStorage)
    const [locked, setLocked] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('drusign-sidebar-locked');
        if (stored === 'true') setLocked(true);
    }, []);

    const toggleLocked = () => {
        setLocked(v => {
            const next = !v;
            localStorage.setItem('drusign-sidebar-locked', String(next));
            return next;
        });
    };

    const isInOrderDetail = pathname.startsWith('/admin/orders/');
    const isFromHistory   = isInOrderDetail && searchParams.get('from') === 'history';

    if (!user) return null;

    const isAdmin  = user.role === 'admin';
    const initials = user.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

    // Classe aplicada a todos os labels: respeita o estado de lock
    const labelCls = locked
        ? 'opacity-0'
        : 'opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-[80ms]';

    // Classe da barra: expande no hover apenas quando desbloqueada
    const expandCls = locked ? '' : 'hover:w-56';

    return (
        <aside className="relative w-16 shrink-0 z-30 h-screen">
            <div className={`group/sidebar absolute left-0 top-0 bottom-0 w-16 ${expandCls} bg-surface-dark border-r border-white/5 flex flex-col overflow-hidden shadow-2xl shadow-black/30 transition-[width] duration-300 ease-in-out`}>

                {/* ── Logo ── */}
                <div className="h-16 flex items-center shrink-0 px-[14px] border-b border-white/5 relative">
                    {/* "DS" — some ao expandir */}
                    <span className={`whitespace-nowrap font-extrabold text-lg tracking-tight leading-none transition-opacity duration-150 ${locked ? '' : 'group-hover/sidebar:opacity-0'}`}>
                        <span className="text-white">D</span><span className="text-primary">S</span>
                    </span>
                    {/* "DruSign" — aparece ao expandir */}
                    <span className={`absolute left-[14px] whitespace-nowrap font-extrabold text-lg tracking-tight leading-none pointer-events-none ${labelCls}`}>
                        <span className="text-white">Dru</span><span className="text-primary">Sign</span>
                    </span>

                    {/* Botão lock/unlock */}
                    <button
                        onClick={toggleLocked}
                        title={locked ? 'Permitir expansão ao passar o mouse' : 'Fixar barra compacta'}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center size-6 rounded-lg transition-all ${
                            locked
                                ? 'text-primary/80 bg-primary/10 hover:bg-primary/20 opacity-100'
                                : 'text-slate-600 hover:text-slate-300 hover:bg-white/10 opacity-0 group-hover/sidebar:opacity-100'
                        }`}
                    >
                        {locked ? <Lock size={12} /> : <Unlock size={12} />}
                    </button>
                </div>

                {/* ── Nav ── */}
                <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 flex flex-col gap-1 px-3">
                    <NavItem href="/admin"           icon={LayoutDashboard} label="Dashboard"      active={pathname === '/admin'}                                             labelCls={labelCls} />
                    <NavItem href="/admin/orcamento" icon={ClipboardList}   label="Orçamento | OS" active={pathname === '/admin/orcamento'}                                   labelCls={labelCls} />
                    <NavItem href="/admin/orders"    icon={ShoppingCart}    label="Pedidos"         active={!isFromHistory && (pathname === '/admin/orders' || isInOrderDetail)} labelCls={labelCls} />
                    {isAdmin && (
                        <NavItem href="/admin/history" icon={History} label="Histórico" active={pathname === '/admin/history' || isFromHistory} labelCls={labelCls} />
                    )}
                    <NavItem href="/admin/clients" icon={UserRound} label="Clientes" active={pathname === '/admin/clients'} labelCls={labelCls} />
                    {isAdmin && (
                        <>
                            <div className="mx-1 h-px bg-white/5 my-2" />
                            <NavItem href="/admin/settings" icon={Settings} label="Configurações" active={pathname === '/admin/settings'} labelCls={labelCls} />
                            <NavItem href="/admin/users"    icon={Users}    label="Usuários"       active={pathname === '/admin/users'}    labelCls={labelCls} />
                        </>
                    )}
                </nav>

                {/* ── Notificações ── */}
                <div className="px-3 pb-1 shrink-0">
                    <NotificationBell sidebarMode={true} sidebarLocked={locked} />
                </div>

                {/* ── Usuário + logout ── */}
                <div className="py-3 px-3 border-t border-white/5 flex flex-col gap-1 shrink-0">
                    <div className="flex items-center gap-3 pl-[2px] pr-2 py-1.5">
                        <div
                            title={user.name}
                            className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-blue-600 flex items-center justify-center text-xs font-bold text-white uppercase shrink-0 select-none"
                        >
                            {initials}
                        </div>
                        <div className={`min-w-0 flex-1 overflow-hidden ${labelCls}`}>
                            <p className="text-sm text-white font-medium truncate leading-tight">{user.name}</p>
                            <p className="text-[11px] text-slate-400 truncate leading-tight">{user.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        title="Sair do sistema"
                        className="flex items-center gap-3 px-2 py-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all w-full"
                    >
                        <LogOut size={18} className="shrink-0" />
                        <span className={`text-sm font-medium whitespace-nowrap ${labelCls}`}>
                            Sair do Sistema
                        </span>
                    </button>
                </div>

            </div>
        </aside>
    );
}

function NavItem({
    href, icon: Icon, label, active, labelCls
}: {
    href: string;
    icon: LucideIcon;
    label: string;
    active?: boolean;
    labelCls: string;
}) {
    return (
        <Link
            href={href}
            title={label}
            className={`
                flex items-center gap-3 px-2 py-2.5 rounded-xl transition-all duration-150
                ${active
                    ? 'bg-primary/20 text-primary shadow-[inset_0_0_0_1px_rgba(34,211,238,0.12)]'
                    : 'text-slate-500 hover:text-white hover:bg-white/10'}
            `}
        >
            <Icon size={20} className="shrink-0" />
            <span className={`text-sm font-medium whitespace-nowrap ${labelCls}`}>
                {label}
            </span>
        </Link>
    );
}
