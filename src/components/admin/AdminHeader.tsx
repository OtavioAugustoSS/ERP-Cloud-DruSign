import { Bell } from 'lucide-react';
import NotificationBell from './NotificationBell';

export default function AdminHeader() {
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
                <button className="text-sm font-medium text-text-secondary hover:text-white transition-colors">
                    Sair
                </button>
            </div>
        </header>
    );
}
