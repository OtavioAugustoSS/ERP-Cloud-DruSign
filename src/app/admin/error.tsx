'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

export default function AdminError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Admin route error:', error);
    }, [error]);

    return (
        <div className="flex-1 flex items-center justify-center p-8 bg-background-dark">
            <div className="max-w-md w-full bg-surface-dark/50 border border-red-500/20 rounded-2xl p-8 text-center animate-fade-in-up shadow-2xl">
                <div className="size-14 mx-auto rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-5">
                    <AlertTriangle size={26} />
                </div>
                <h2 className="text-white text-xl font-bold mb-2">Algo deu errado</h2>
                <p className="text-slate-400 text-sm mb-1">
                    Ocorreu um erro ao carregar esta página.
                </p>
                <p className="text-slate-600 text-xs mb-6">
                    Se o problema persistir, contate o suporte.
                </p>

                {error.digest && (
                    <p className="text-[10px] text-slate-700 font-mono mb-6 px-3 py-2 bg-black/40 border border-white/5 rounded-lg">
                        Código: {error.digest}
                    </p>
                )}

                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={reset}
                        className="relative overflow-hidden group flex items-center gap-2 px-4 py-2.5 bg-primary text-black font-bold rounded-lg text-sm shadow-lg shadow-primary/20"
                    >
                        <span className="absolute inset-0 bg-primary-hover translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 rounded-lg" />
                        <span className="relative flex items-center gap-2">
                            <RefreshCcw size={14} />
                            Tentar novamente
                        </span>
                    </button>
                    <Link
                        href="/admin"
                        className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-sm font-medium rounded-lg transition-colors"
                    >
                        <Home size={14} />
                        Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
