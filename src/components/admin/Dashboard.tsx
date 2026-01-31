'use client';

import React, { useState } from 'react';
import { Icons } from './Icons';
import NotificationBell from './NotificationBell';
import { useAuth } from '../../context/AuthContext';
import CreateOrderModal from './CreateOrderModal';

export default function Dashboard() {
    const { user } = useAuth();
    const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-background-dark bg-grid-subtle">

            {/* Header */}
            <header className="flex-none px-8 py-6 border-b border-white/5 bg-background-dark/80 backdrop-blur-md z-10">
                <div className="flex flex-wrap justify-between items-center gap-4">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-white text-3xl font-bold leading-tight tracking-tight">Dashboard</h2>
                        <p className="text-slate-400 text-sm font-normal">Bem-vindo ao painel de controle.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs text-primary uppercase tracking-wider font-semibold">Data de Hoje</p>
                            <p className="text-white font-mono">{new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                        </div>
                        <NotificationBell />
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-6xl mx-auto space-y-8">

                    {/* Welcome / Action Card */}
                    <div className="bg-gradient-to-br from-surface-dark to-black/40 border border-white/10 rounded-3xl p-8 md:p-12 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="relative z-10 max-w-2xl">
                            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">Iniciar Novo Atendimento</h3>
                            <p className="text-slate-400 text-lg">
                                Crie pedidos completos com múltiplos itens, selecione acabamentos e gere a Ordem de Serviço automaticamente.
                            </p>
                        </div>
                        <div className="relative z-10">
                            <button
                                onClick={() => setIsCreateOrderOpen(true)}
                                className="group/btn relative flex items-center gap-3 bg-primary hover:bg-primary-hover text-background-dark px-8 py-4 rounded-2xl font-bold text-lg shadow-[0_0_30px_rgba(34,211,238,0.3)] hover:shadow-[0_0_50px_rgba(34,211,238,0.5)] transition-all transform hover:-translate-y-1"
                            >
                                <div className="bg-black/20 p-2 rounded-xl group-hover/btn:bg-black/10 transition-colors">
                                    <Icons.Plus size={24} />
                                </div>
                                Novo Pedido
                            </button>
                        </div>
                    </div>

                    {/* Quick Stats or Shortcuts could go here */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Placeholder for future stats */}
                    </div>

                </div>
            </div>

            {/* Modal */}
            <CreateOrderModal
                isOpen={isCreateOrderOpen}
                onClose={() => setIsCreateOrderOpen(false)}
                onSuccess={() => {
                    // Optional: refresh dashboard stats if we had any
                }}
                currentUser={user}
            />
        </div>
    );
}
