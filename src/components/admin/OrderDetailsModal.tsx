'use client';

import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import { Order, OrderStatus } from '../../types';
import { formatCurrency } from '../../lib/utils/price';
import { useAuth } from '../../context/AuthContext';
import { updateOrderDetails, updateOrderStatus } from '../../actions/order';

interface OrderDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order | null;
    onUpdate?: () => void;
}

function OrderDetailsModal({ isOpen, onClose, order: initialOrder, onUpdate }: OrderDetailsModalProps) {
    const { user } = useAuth();
    const isEmployee = user?.role === 'employee';
    const [order, setOrder] = useState<Order | null>(initialOrder);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        clientName: '',
        clientDocument: '',
        clientPhone: '',
        instructions: '',
        finishing: ''
    });

    useEffect(() => {
        setOrder(initialOrder);
        if (initialOrder) {
            setFormData({
                clientName: initialOrder.clientName || '',
                clientDocument: initialOrder.clientDocument || '',
                clientPhone: initialOrder.clientPhone || '',
                instructions: initialOrder.instructions || '',
                finishing: initialOrder.finishing || ''
            });
        }
        setIsEditing(false);
    }, [initialOrder, isOpen]);

    if (!isOpen || !order) return null;

    const handleCancel = async () => {
        if (!confirm("Tem certeza que deseja CANCELAR este pedido? Ele será movido para o histórico.")) {
            return;
        }

        setIsSaving(true);
        const res = await updateOrderStatus(order.id, OrderStatus.CANCELLED);
        setIsSaving(false);

        if (res.success) {
            if (onUpdate) onUpdate();
            onClose();
        } else {
            alert("Erro ao cancelar o pedido.");
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        const res = await updateOrderDetails(order.id, {
            clientName: formData.clientName,
            clientDocument: formData.clientDocument,
            clientPhone: formData.clientPhone,
            instructions: formData.instructions,
            finishing: formData.finishing
        });

        if (res.success) {
            setOrder({
                ...order,
                clientName: formData.clientName,
                clientDocument: formData.clientDocument,
                clientPhone: formData.clientPhone,
                instructions: formData.instructions,
                finishing: formData.finishing
            });
            setIsEditing(false);
            if (onUpdate) onUpdate();
        } else {
            alert("Erro ao salvar alterações");
        }
        setIsSaving(false);
    };

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
            <div className={`bg-surface-dark border ${isEditing ? 'border-primary/50 shadow-[0_0_50px_rgba(34,211,238,0.2)]' : 'border-white/10'} rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all`}>

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                            <h3 className="text-xl font-bold text-white">Detalhes do Pedido</h3>
                            {isEditing && <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full uppercase font-bold tracking-wider">Modo Edição</span>}
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <span className="font-mono text-cyan-400">#{order.id}</span>
                            <span className="text-slate-500">•</span>
                            <span className="text-slate-400">{new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {!isEmployee && !isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                                title="Editar Pedido"
                            >
                                <Icons.Edit size={20} />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                        >
                            <Icons.Close size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

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

                    {/* 1. Client Info (Editable) */}
                    <div className={`bg-white/5 border ${isEditing ? 'border-primary/30 bg-primary/5' : 'border-white/10'} rounded-xl p-5 transition-colors`}>
                        <div className="flex items-start justify-between">
                            <div className="w-full">
                                <label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2 block flex items-center gap-2">
                                    {isEditing && <Icons.Edit size={12} className="text-primary" />} Cliente
                                </label>

                                {isEditing ? (
                                    <div className="space-y-3">
                                        <div>
                                            <input
                                                value={formData.clientName}
                                                onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                                                placeholder="Nome do Cliente"
                                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary/50 text-lg font-bold"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <input
                                                value={formData.clientDocument}
                                                onChange={e => setFormData({ ...formData, clientDocument: e.target.value })}
                                                placeholder="CPF/CNPJ"
                                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary/50"
                                            />
                                            <input
                                                value={formData.clientPhone}
                                                onChange={e => setFormData({ ...formData, clientPhone: e.target.value })}
                                                placeholder="Telefone"
                                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary/50"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="text-2xl text-white font-bold mb-3">{order.clientName}</div>
                                        <div className="flex flex-col gap-2">
                                            {order.clientDocument && (
                                                <div className="flex items-center gap-2 text-sm text-slate-300">
                                                    <Icons.IdCard size={16} className="text-cyan-400" />
                                                    <span>CPF/CNPJ: {order.clientDocument}</span>
                                                </div>
                                            )}
                                            {order.clientPhone && (
                                                <div className="flex items-center gap-2 text-sm text-slate-300">
                                                    <Icons.Phone size={16} className="text-cyan-400" />
                                                    <span>{order.clientPhone}</span>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 2. Main Grid: Product & Financial */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Column 1: Product Details */}
                        <div className="space-y-6">
                            <div className="bg-black/20 p-5 rounded-xl border border-white/5 h-full">
                                <label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-4 block flex items-center gap-2">
                                    <Icons.Layers size={14} /> Produto / Serviço
                                </label>
                                <div className="space-y-4">
                                    <div>
                                        <div className="text-lg text-white font-bold leading-tight">{order.productName || "Produto Personalizado"}</div>
                                        <div className="text-sm text-cyan-400 font-medium mt-1 uppercase">{order.serviceType?.replace(/_/g, ' ')}</div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        <div className="bg-white/5 px-3 py-2 rounded-lg">
                                            <div className="text-[10px] text-slate-400 uppercase">Dimensões</div>
                                            <div className="text-white font-mono text-sm">{order.width} x {order.height} cm</div>
                                        </div>
                                        <div className="bg-white/5 px-3 py-2 rounded-lg">
                                            <div className="text-[10px] text-slate-400 uppercase">Quantidade</div>
                                            <div className="text-white font-mono text-sm">{order.quantity} un</div>
                                        </div>
                                    </div>

                                    {/* Files */}
                                    {order.filePaths && order.filePaths.length > 0 && (
                                        <div>
                                            <label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2 block">Arquivos Anexados</label>
                                            <div className="space-y-2">
                                                {order.filePaths.map((path, index) => (
                                                    <a
                                                        key={index}
                                                        href={path}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors group"
                                                    >
                                                        <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400 group-hover:scale-110 transition-transform">
                                                            <Icons.FileText size={18} />
                                                        </div>
                                                        <div className="flex-1 overflow-hidden">
                                                            <div className="text-sm text-white font-medium truncate">
                                                                Arquivo {index + 1}
                                                            </div>
                                                            <div className="text-xs text-slate-400 truncate">
                                                                {path.split('/').pop()}
                                                            </div>
                                                        </div>
                                                        <Icons.Download size={16} className="text-slate-500 group-hover:text-white transition-colors" />
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Finishing (Editable) */}
                                    <div>
                                        <div className="text-[10px] text-slate-400 uppercase mb-1">Acabamento / Detalhes</div>
                                        {isEditing ? (
                                            <input
                                                value={formData.finishing}
                                                onChange={e => setFormData({ ...formData, finishing: e.target.value })}
                                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-primary/50"
                                            />
                                        ) : (
                                            <div className="text-white text-sm bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg inline-block">
                                                {order.finishing?.replace(/_/g, ' ') || 'Padrão'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Column 2: Financial & Instructions */}
                        <div className="space-y-6">
                            {/* Financial */}
                            <div className="bg-black/40 p-5 rounded-xl border border-white/10">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-slate-400 text-sm font-medium">Valor Total</span>
                                    <span className="text-2xl text-white font-bold tracking-tight">{formatCurrency(order.totalPrice)}</span>
                                </div>
                                <div className="text-xs text-slate-500 text-right">Calculado automaticamente</div>
                            </div>

                            {/* Instructions (Editable) */}
                            <div>
                                <label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2 block">
                                    {isEditing && <Icons.Edit size={12} className="inline mr-1" />} Instruções de Produção
                                </label>
                                <div className={`bg-yellow-500/5 border ${isEditing ? 'border-primary/30' : 'border-yellow-500/10'} p-4 rounded-xl min-h-[80px]`}>
                                    {isEditing ? (
                                        <textarea
                                            value={formData.instructions}
                                            onChange={e => setFormData({ ...formData, instructions: e.target.value })}
                                            className="w-full bg-transparent border-none text-yellow-100/90 text-sm leading-relaxed focus:outline-none resize-none h-[120px]"
                                            placeholder="Instruções de produção..."
                                        />
                                    ) : (
                                        order.instructions ? (
                                            <p className="text-yellow-100/90 text-sm leading-relaxed whitespace-pre-wrap">
                                                "{order.instructions.replace(/\[Arquivos Anexados:.*?\]/, '').trim()}"
                                            </p>
                                        ) : (
                                            <p className="text-slate-500 text-sm italic">Nenhuma instrução adicional.</p>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 bg-white/5 flex justify-end gap-3">
                    {isEditing ? (
                        <>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-6 py-2.5 rounded-xl hover:bg-white/10 text-slate-400 font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-6 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold shadow-lg shadow-green-500/20 transition-all flex items-center gap-2"
                            >
                                <Icons.Save size={18} />
                                {isSaving ? "Salvando..." : "Salvar Alterações"}
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={onClose}
                                className="px-6 py-2.5 rounded-xl hover:bg-white/10 text-white font-medium transition-colors"
                            >
                                Fechar
                            </button>
                            {!isEmployee && (
                                <>
                                    {order.status !== OrderStatus.CANCELLED && order.status !== OrderStatus.COMPLETED && (
                                        <button
                                            onClick={handleCancel}
                                            className="px-6 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold border border-red-500/20 hover:border-red-500/40 transition-all flex items-center gap-2 mr-auto"
                                            title="Cancelar Pedido (Enviar para histórico)"
                                        >
                                            <Icons.Ban size={18} />
                                            Cancelar
                                        </button>
                                    )}
                                    <button className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-background-dark font-bold shadow-lg shadow-primary/20 transition-all flex items-center gap-2">
                                        <Icons.Print size={18} />
                                        Imprimir Ordem
                                    </button>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// Wrap with React.memo to prevent unnecessary re-renders
export default React.memo(OrderDetailsModal);
