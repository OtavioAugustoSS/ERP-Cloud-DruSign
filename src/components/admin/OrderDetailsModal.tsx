'use client';

import React from 'react';
import { Icons } from './Icons';
import { Order, OrderStatus } from '../../types';
import { formatCurrency } from '../../lib/utils/price';
import { useAuth } from '../../context/AuthContext';

interface OrderDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order | null;
}

export default function OrderDetailsModal({ isOpen, onClose, order }: OrderDetailsModalProps) {
    const { user } = useAuth();
    const isEmployee = user?.role === 'employee';

    if (!isOpen || !order) return null;

    const formatStatus = (status: OrderStatus) => {
        switch (status) {
            case OrderStatus.PENDING: return 'Pendente';
            case OrderStatus.IN_PRODUCTION: return 'Em Produção';
            case OrderStatus.READY_FOR_SHIPPING: return 'Pronto para Envio';
            case OrderStatus.COMPLETED: return 'Concluído';
            case OrderStatus.CANCELLED: return 'Cancelado';
            default: return status;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-surface-dark border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
                    <div className="flex flex-col gap-1">
                        <h3 className="text-xl font-bold text-white">Detalhes do Pedido</h3>
                        <div className="flex items-center gap-3 text-sm">
                            <span className="font-mono text-cyan-400">#{order.id}</span>
                            <span className="text-slate-500">•</span>
                            <span className="text-slate-400">{new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    >
                        <Icons.Close size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">

                    {/* Status Section */}
                    <div className="flex items-center justify-between bg-black/20 p-4 rounded-xl border border-white/5">
                        <span className="text-sm text-slate-400 font-medium uppercase tracking-wider">Status Atual</span>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold capitalize
                            ${order.status === OrderStatus.PENDING ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : ''}
                            ${order.status === OrderStatus.IN_PRODUCTION ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : ''}
                            ${order.status === OrderStatus.READY_FOR_SHIPPING ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' : ''}
                            ${order.status === OrderStatus.COMPLETED ? 'bg-green-500/10 text-green-500 border border-green-500/20' : ''}
                            ${order.status === OrderStatus.CANCELLED ? 'bg-red-500/10 text-red-500 border border-red-500/20' : ''}
                        `}>
                            {formatStatus(order.status)}
                        </span>
                    </div>

                    {/* Main Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                        {/* Column 1: Client & Product */}
                        <div className="space-y-6">
                            <div>
                                <label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2 block">Cliente</label>
                                <div className="text-lg text-white font-medium">{order.clientName}</div>
                                {order.clientPhone && (
                                    <div className="flex items-center gap-2 text-sm text-cyan-400 mt-1">
                                        <Icons.Phone size={14} />
                                        <span>{order.clientPhone}</span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2 block">Produto / Serviço</label>
                                <div className="text-lg text-white font-bold">{order.productName || "Produto Personalizado"}</div>
                                <div className="text-sm text-cyan-400 font-medium mt-1 uppercase">{order.serviceType?.replace(/_/g, ' ')}</div>
                            </div>

                            <div>
                                <label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2 block">Dimensões e Quantidade</label>
                                <div className="flex flex-wrap gap-4">
                                    <div className="bg-white/5 px-4 py-3 rounded-lg border border-white/5">
                                        <div className="text-xs text-slate-400 mb-1">Largura</div>
                                        <div className="text-white font-mono">{order.width} cm</div>
                                    </div>
                                    <div className="bg-white/5 px-4 py-3 rounded-lg border border-white/5">
                                        <div className="text-xs text-slate-400 mb-1">Altura</div>
                                        <div className="text-white font-mono">{order.height} cm</div>
                                    </div>
                                    <div className="bg-white/5 px-4 py-3 rounded-lg border border-white/5">
                                        <div className="text-xs text-slate-400 mb-1">Quantidade</div>
                                        <div className="text-white font-mono">{order.quantity} un</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Column 2: Financial & Instructions */}
                        <div className="space-y-6">
                            <div>
                                <label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2 block">Financeiro</label>
                                <div className="bg-black/40 p-5 rounded-xl border border-white/10">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-slate-400 text-sm">Valor Total</span>
                                        <span className="text-2xl text-white font-bold tracking-tight">{formatCurrency(order.totalPrice)}</span>
                                    </div>
                                    <div className="text-xs text-slate-500 text-right">Calculado automaticamente</div>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2 block">Instruções de Produção</label>
                                <div className="bg-yellow-500/5 border border-yellow-500/10 p-4 rounded-xl min-h-[100px]">
                                    {order.instructions ? (
                                        <p className="text-yellow-100/90 text-sm leading-relaxed whitespace-pre-wrap">"{order.instructions}"</p>
                                    ) : (
                                        <p className="text-slate-500 text-sm italic">Nenhuma instrução adicional.</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2 block">Acabamento</label>
                                <div className="text-white text-sm capitalize bg-white/5 px-3 py-2 rounded-lg inline-block border border-white/10">
                                    {order.finishing?.replace(/_/g, ' ') || 'Padrão'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Preview Link (if available) */}
                    {order.previewUrl && (
                        <div className="pt-4 border-t border-white/5">
                            <label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-3 block">Arquivos / Preview</label>
                            <a
                                href={order.previewUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 border border-cyan-500/20 transition-all text-sm font-bold shadow-[0_0_15px_rgba(34,211,238,0.1)] hover:shadow-[0_0_20px_rgba(34,211,238,0.2)]"
                            >
                                <Icons.Link size={18} />
                                Abrir Arquivo / Visualizar PDF
                            </a>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 bg-white/5 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl hover:bg-white/10 text-white font-medium transition-colors"
                    >
                        Fechar
                    </button>
                    {!isEmployee && (
                        <button className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-background-dark font-bold shadow-lg shadow-primary/20 transition-all flex items-center gap-2">
                            <Icons.Print size={18} />
                            Imprimir Ordem
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
