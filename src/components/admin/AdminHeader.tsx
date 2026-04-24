'use client';

import NotificationBell from './NotificationBell';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';

export default function AdminHeader() {
    const { logout } = useAuth();
    const [pending, setPending] = useState(false);

    const handleLogout = async () => {
        if (pending) return;
        setPending(true);
        try {
            await logout();
        } finally {
            setPending(false);
        }
    };

    return (
        <header className="h-16 bg-background-dark/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-8 sticky top-0 z-10 w-full">
            <div>
                <nav className="flex text-sm text-text-secondary mb-1">
                    <ol className="flex items-center space-x-2">
                        <li>
                            <a href="#" className="hover:text-primary transition-colors">
                                Pedidos
                            </a>
                        </li>
                        <li>
                            <span className="text-white/20">/</span>
                        </li>
                        <li className="text-white font-medium">#12345</li>
                    </ol>
                </nav>
            </div>

            <div className="flex items-center gap-4">
                <NotificationBell />
                <div className="h-6 w-px bg-white/10"></div>
                <button
                    type="button"
                    onClick={handleLogout}
                    disabled={pending}
                    className="text-sm font-medium text-text-secondary hover:text-white transition-colors disabled:opacity-50"
                >
                    {pending ? 'Saindo...' : 'Sair'}
                </button>
            </div>
        </header>
    );
}
