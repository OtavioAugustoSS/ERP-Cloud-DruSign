'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    ClipboardList,
    ShoppingCart,
    Settings,
    Users,
    LogOut,
    History,
    UserRound,
    type LucideIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminSidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    if (!user) return null;

    const isAdmin = user.role === 'admin';
    const initials = user.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

    return (
        /* Ocupa 64px no layout — a sidebar visual cresce em overlay */
        <aside className="relative w-16 shrink-0 z-30 h-screen">
            <div className="group/sidebar absolute left-0 top-0 bottom-0 w-16 hover:w-56 bg-surface-dark border-r border-white/5 flex flex-col overflow-hidden shadow-2xl shadow-black/30 transition-[width] duration-300 ease-in-out">

                {/* Logo: cross-fade entre "DS" (recolhida) e "DruSign" (expandida) */}
                <div className="h-16 flex items-center shrink-0 px-[14px] border-b border-white/5 relative">
                    {/* DS — some no hover */}
                    <span className="whitespace-nowrap font-extrabold text-lg tracking-tight leading-none group-hover/sidebar:opacity-0 transition-opacity duration-150">
                        <span className="text-white">D</span><span className="text-primary">S</span>
                    </span>
                    {/* DruSign — aparece no hover (absolute para não empurrar layout) */}
                    <span className="absolute left-[14px] whitespace-nowrap font-extrabold text-lg tracking-tight leading-none opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-[80ms] pointer-events-none">
                        <span className="text-white">Dru</span><span className="text-primary">Sign</span>
                    </span>
                </div>

                {/* Nav — overflow-x-hidden evita scrollbar horizontal dos labels invisíveis */}
                <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 flex flex-col gap-1 px-3">
                    <NavItem href="/admin" icon={LayoutDashboard} label="Dashboard" active={pathname === '/admin'} />
                    <NavItem href="/admin/orcamento" icon={ClipboardList} label="Orçamento | OS" active={pathname === '/admin/orcamento'} />
                    <NavItem href="/admin/orders" icon={ShoppingCart} label="Pedidos" active={pathname === '/admin/orders' || pathname.startsWith('/admin/orders/')} />
                    <NavItem href="/admin/clients" icon={UserRound} label="Clientes" active={pathname === '/admin/clients'} />
                    {isAdmin && (
                        <NavItem href="/admin/history" icon={History} label="Histórico" active={pathname === '/admin/history'} />
                    )}
                    {isAdmin && (
                        <>
                            <div className="mx-1 h-px bg-white/5 my-2" />
                            <NavItem href="/admin/settings" icon={Settings} label="Configurações" active={pathname === '/admin/settings'} />
                            <NavItem href="/admin/users" icon={Users} label="Usuários" active={pathname === '/admin/users'} />
                        </>
                    )}
                </nav>

                {/* Usuário + logout */}
                <div className="py-4 px-3 border-t border-white/5 flex flex-col gap-1 shrink-0">
                    <div className="flex items-center gap-3 px-1 py-1.5">
                        <div
                            title={user.name}
                            className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-blue-600 flex items-center justify-center text-xs font-bold text-white uppercase shrink-0 select-none"
                        >
                            {initials}
                        </div>
                        <div className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-[80ms] min-w-0 flex-1 overflow-hidden">
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
                        <span className="text-sm font-medium whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-[80ms]">
                            Sair do Sistema
                        </span>
                    </button>
                </div>
            </div>
        </aside>
    );
}

function NavItem({ href, icon: Icon, label, active }: { href: string; icon: LucideIcon; label: string; active?: boolean }) {
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
            <span className="text-sm font-medium whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-[80ms]">
                {label}
            </span>
        </Link>
    );
}
