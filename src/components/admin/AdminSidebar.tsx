import Link from 'next/link';
import {
    LayoutDashboard,
    ShoppingCart,
    Settings,
    Users,
    LogOut
} from 'lucide-react';

export default function AdminSidebar() {
    return (
        <aside className="w-64 bg-surface-dark border-r border-white/5 flex flex-col shrink-0 transition-all duration-300 z-20 h-screen">
            <div className="h-16 flex items-center px-6 border-b border-white/5">
                <span className="text-white text-xl font-bold tracking-tight">
                    Dru<span className="text-primary">Sign</span>
                </span>
                <span className="ml-2 text-[10px] bg-white/10 text-text-secondary px-1.5 py-0.5 rounded uppercase tracking-wider">
                    Admin
                </span>
            </div>

            <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                <Link
                    href="/admin"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors bg-primary/10 text-primary border-l-[3px] border-primary"
                >
                    <LayoutDashboard size={20} />
                    Início
                </Link>

                <Link
                    href="/admin/orders"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-secondary hover:text-white hover:bg-white/5 text-sm font-medium transition-colors border-l-[3px] border-transparent"
                >
                    <ShoppingCart size={20} />
                    Pedidos
                </Link>

                <div className="pt-4 pb-2">
                    <p className="px-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        Sistema
                    </p>
                </div>

                <Link
                    href="/admin/settings"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-secondary hover:text-white hover:bg-white/5 text-sm font-medium transition-colors border-l-[3px] border-transparent"
                >
                    <Settings size={20} />
                    Configurações
                </Link>

                <Link
                    href="/admin/users"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-secondary hover:text-white hover:bg-white/5 text-sm font-medium transition-colors border-l-[3px] border-transparent"
                >
                    <Users size={20} />
                    Usuários
                </Link>
            </nav>

            <div className="p-4 border-t border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-blue-600 flex items-center justify-center text-xs font-bold text-white shadow-lg">
                        AD
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">Admin User</span>
                        <span className="text-xs text-text-secondary">admin@drusign.com</span>
                    </div>
                </div>
            </div>
        </aside>
    );
}
