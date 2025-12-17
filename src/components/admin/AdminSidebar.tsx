'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    ShoppingCart,
    Settings,
    Users,
    LogOut,
    History
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminSidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    if (!user) return null; // Or skeleton

    const isAdmin = user.role === 'admin';

    return (
        <aside className="w-64 bg-surface-dark border-r border-white/5 flex flex-col shrink-0 transition-all duration-300 z-20 h-screen">
            <div className="h-16 flex items-center px-6 border-b border-white/5">
                <span className="text-white text-xl font-bold tracking-tight">
                    Dru<span className="text-primary">Sign</span>
                </span>
                <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider ${isAdmin ? 'bg-primary/20 text-primary' : 'bg-white/10 text-slate-400'}`}>
                    {isAdmin ? 'Admin' : 'Equipe'}
                </span>
            </div>

            <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                <NavItem
                    href="/admin"
                    icon={LayoutDashboard}
                    label="Novo Pedido"
                    active={pathname === '/admin'}
                />

                <NavItem
                    href="/admin/orders"
                    icon={ShoppingCart}
                    label="Pedidos"
                    active={pathname === '/admin/orders' || pathname.startsWith('/admin/orders/')}
                />

                {isAdmin && (
                    <NavItem
                        href="/admin/history"
                        icon={History}
                        label="Histórico"
                        active={pathname === '/admin/history'}
                    />
                )}

                {isAdmin && (
                    <>
                        <div className="pt-4 pb-2">
                            <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                Sistema
                            </p>
                        </div>

                        <NavItem
                            href="/admin/settings"
                            icon={Settings}
                            label="Configurações"
                            active={pathname === '/admin/settings'}
                        />

                        <NavItem
                            href="/admin/users"
                            icon={Users}
                            label="Usuários"
                            active={pathname === '/admin/users'}
                        />
                    </>
                )}
            </nav>

            <div className="p-4 border-t border-white/5">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-blue-600 flex items-center justify-center text-xs font-bold text-white shadow-lg uppercase">
                        {user.name.substring(0, 2)}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-medium text-white truncate">{user.name}</span>
                        <span className="text-xs text-slate-400 truncate">{user.email}</span>
                    </div>
                </div>

                <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors text-sm font-medium"
                >
                    <LogOut size={18} />
                    Sair do Sistema
                </button>
            </div>
        </aside>
    );
}

function NavItem({ href, icon: Icon, label, active, exact }: { href: string; icon: any; label: string; active?: boolean; exact?: boolean }) {
    return (
        <Link
            href={href}
            className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors border-l-[3px]
                ${active
                    ? 'bg-primary/10 text-primary border-primary'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border-transparent'}
            `}
        >
            <Icon size={20} />
            {label}
        </Link>
    );
}
