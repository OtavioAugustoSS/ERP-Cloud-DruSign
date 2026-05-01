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
    Factory,
    MoreHorizontal,
    type LucideIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from './NotificationBell';

export default function AdminSidebar() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { user, logout } = useAuth();

    const [locked, setLocked]                   = useState(false);
    const [confirmingLogout, setConfirmingLogout] = useState(false);
    const [showMoreMenu, setShowMoreMenu]         = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('drusign-sidebar-locked');
        if (stored === 'true') setLocked(true);
    }, []);

    // Auto-dismiss da confirmação de logout após 4s sem ação
    useEffect(() => {
        if (!confirmingLogout) return;
        const t = setTimeout(() => setConfirmingLogout(false), 4000);
        return () => clearTimeout(t);
    }, [confirmingLogout]);

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

    const isAdmin      = user.role === 'admin';
    const initials     = user.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
    const ordersActive = !isFromHistory && (pathname === '/admin/orders' || isInOrderDetail);

    const labelCls = locked
        ? 'opacity-0'
        : 'opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-[80ms]';

    const expandCls = locked ? '' : 'hover:w-56';

    return (
        <>
            {/* ── Sidebar (desktop lg+) ──────────────────────────────────────── */}
            <aside className="relative hidden lg:block w-16 shrink-0 z-30 h-screen">
                <div className={`group/sidebar absolute left-0 top-0 bottom-0 w-16 ${expandCls} bg-surface-dark border-r border-white/5 flex flex-col overflow-hidden shadow-2xl shadow-black/30 transition-[width] duration-300 ease-in-out`}>

                    {/* Logo */}
                    <div className="h-16 flex items-center shrink-0 px-[14px] border-b border-white/5 relative">
                        <span className={`whitespace-nowrap font-extrabold text-lg tracking-tight leading-none transition-opacity duration-150 ${locked ? '' : 'group-hover/sidebar:opacity-0'}`}>
                            <span className="text-white">D</span><span className="text-primary">S</span>
                        </span>
                        <span className={`absolute left-[14px] whitespace-nowrap font-extrabold text-lg tracking-tight leading-none pointer-events-none ${labelCls}`}>
                            <span className="text-white">Dru</span><span className="text-primary">Sign</span>
                        </span>
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

                    {/* Nav */}
                    <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 flex flex-col gap-1 px-3">
                        {isAdmin ? (
                            <>
                                <NavItem href="/admin"           icon={LayoutDashboard} label="Dashboard"      active={pathname === '/admin'}                          labelCls={labelCls} />
                                <NavItem href="/admin/orcamento" icon={ClipboardList}   label="Orçamento | OS" active={pathname === '/admin/orcamento'}                 labelCls={labelCls} />
                                <NavItem href="/admin/orders"    icon={ShoppingCart}    label="Pedidos"        active={ordersActive}                                   labelCls={labelCls} />
                                <NavItem href="/admin/history"   icon={History}         label="Histórico"      active={pathname === '/admin/history' || isFromHistory}  labelCls={labelCls} />
                                <NavItem href="/admin/clients"   icon={UserRound}       label="Clientes"       active={pathname === '/admin/clients'}                   labelCls={labelCls} />
                                <div className="mx-1 h-px bg-white/5 my-2" />
                                <NavItem href="/admin/settings"  icon={Settings}        label="Configurações"  active={pathname === '/admin/settings'}                  labelCls={labelCls} />
                                <NavItem href="/admin/users"     icon={Users}           label="Usuários"       active={pathname === '/admin/users'}                     labelCls={labelCls} />
                            </>
                        ) : (
                            <>
                                <NavItem href="/admin/producao" icon={Factory}      label="Produção" active={pathname === '/admin/producao'} labelCls={labelCls} />
                                <NavItem href="/admin/orders"   icon={ShoppingCart} label="Pedidos"  active={ordersActive}                   labelCls={labelCls} />
                            </>
                        )}
                    </nav>

                    {/* Notificações (admin only) */}
                    {isAdmin && (
                        <div className="px-3 pb-1 shrink-0">
                            <NotificationBell sidebarMode={true} sidebarLocked={locked} />
                        </div>
                    )}

                    {/* Usuário + logout */}
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

            {/* ── Menu "Mais" (admin mobile) ─────────────────────────────────── */}
            {showMoreMenu && (
                <>
                    <div
                        className="lg:hidden fixed inset-0 z-[60] bg-black/40"
                        onClick={() => setShowMoreMenu(false)}
                    />
                    <div className="lg:hidden fixed bottom-[4.5rem] left-4 right-4 z-[70] bg-zinc-900 border border-white/10 rounded-2xl p-4 shadow-2xl shadow-black/60 animate-fade-in-up">
                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3 px-1">Mais páginas</p>
                        <div className="grid grid-cols-2 gap-2">
                            {([
                                { href: '/admin/clients',  icon: UserRound,       label: 'Clientes'      },
                                { href: '/admin/history',  icon: History,         label: 'Histórico'     },
                                { href: '/admin/settings', icon: Settings,        label: 'Configurações' },
                                { href: '/admin/users',    icon: Users,           label: 'Usuários'      },
                            ] as const).map(({ href, icon: Icon, label }) => (
                                <Link
                                    key={href}
                                    href={href}
                                    onClick={() => setShowMoreMenu(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
                                        pathname === href
                                            ? 'bg-primary/15 border-primary/25 text-primary'
                                            : 'bg-white/[0.04] border-white/8 text-slate-300 hover:bg-white/8 hover:text-white'
                                    }`}
                                >
                                    <Icon size={18} className="shrink-0" />
                                    <span className="text-sm font-semibold">{label}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* ── Bottom nav (mobile, < lg) ──────────────────────────────────── */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0e0e0e]/95 backdrop-blur-md border-t border-white/[0.07] h-16 flex items-stretch">
                {isAdmin ? (
                    <>
                        <BottomNavItem href="/admin"           icon={LayoutDashboard} label="Início"  active={pathname === '/admin'} />
                        <BottomNavItem href="/admin/orcamento" icon={ClipboardList}   label="OS"      active={pathname === '/admin/orcamento'} />
                        <BottomNavItem href="/admin/orders"    icon={ShoppingCart}    label="Pedidos" active={ordersActive} />
                        <NotificationBell bottomNavMode={true} />
                        <button
                            onClick={() => setShowMoreMenu(v => !v)}
                            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-colors ${
                                showMoreMenu
                                || ['/admin/clients','/admin/history','/admin/settings','/admin/users'].includes(pathname)
                                    ? 'text-primary'
                                    : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            <MoreHorizontal size={20} />
                            <span className="text-[10px] font-medium">Mais</span>
                        </button>
                    </>
                ) : (
                    <>
                        <BottomNavItem href="/admin/producao" icon={Factory}      label="Produção" active={pathname === '/admin/producao'} />
                        <BottomNavItem href="/admin/orders"   icon={ShoppingCart} label="Pedidos"  active={ordersActive} />
                        <button
                            onClick={() => setConfirmingLogout(true)}
                            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-colors ${
                                confirmingLogout ? 'text-red-400' : 'text-slate-500 hover:text-red-400'
                            }`}
                        >
                            <LogOut size={20} />
                            <span className="text-[10px] font-medium">Sair</span>
                        </button>
                    </>
                )}
            </nav>

            {/* ── Painel de confirmação de logout — flutua acima da bottom nav ── */}
            {confirmingLogout && (
                <>
                    {/* Backdrop: toque fora cancela */}
                    <div
                        className="lg:hidden fixed inset-0 z-[60] bg-black/40"
                        onClick={() => setConfirmingLogout(false)}
                    />
                    <div className="lg:hidden fixed bottom-[4.5rem] left-4 right-4 z-[70] bg-zinc-900 border border-red-500/25 rounded-2xl p-5 shadow-2xl shadow-black/60 animate-fade-in-up">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-10 w-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                                <LogOut size={18} className="text-red-400" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white">Sair do sistema?</p>
                                <p className="text-xs text-slate-500 mt-0.5">Você precisará fazer login novamente.</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmingLogout(false)}
                                className="flex-1 h-12 rounded-xl border border-white/15 text-slate-300 font-semibold text-sm hover:bg-white/5 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={logout}
                                className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-colors"
                            >
                                Sair
                            </button>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}

// ── Componentes auxiliares ────────────────────────────────────────────────────

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

function BottomNavItem({
    href, icon: Icon, label, active
}: {
    href: string;
    icon: LucideIcon;
    label: string;
    active?: boolean;
}) {
    return (
        <Link
            href={href}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-colors ${
                active ? 'text-primary' : 'text-slate-500 hover:text-slate-300'
            }`}
        >
            <Icon size={20} />
            <span className="text-[10px] font-medium">{label}</span>
        </Link>
    );
}
