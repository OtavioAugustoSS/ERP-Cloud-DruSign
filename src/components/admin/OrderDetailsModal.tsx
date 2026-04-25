'use client';

import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import { Order, OrderStatus } from '../../types';
import { formatCurrency } from '../../lib/utils/price';
import { useAuth } from '../../context/AuthContext';
import { updateOrderDetails, updateOrderStatus } from '../../actions/order';
import { getSystemSettings } from '../../actions/system'; // Import settings

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
    // ... (rest of state items are fine, not modifying them here)
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        clientName: '',
        clientDocument: '',
        clientPhone: '',

        // OS Fields
        deliveryDate: '',
        deliveryMethod: '',
        paymentTerms: '',
        shippingCost: 0,
        discount: 0,
        notes: '',
    });

    useEffect(() => {
        setOrder(initialOrder);
        if (initialOrder) {
            setFormData({
                clientName: initialOrder.clientName || '',
                clientDocument: initialOrder.clientDocument || '',
                clientPhone: initialOrder.clientPhone || '',

                deliveryDate: initialOrder.deliveryDate ? new Date(initialOrder.deliveryDate).toISOString().split('T')[0] : '',
                deliveryMethod: initialOrder.deliveryMethod || '',
                paymentTerms: initialOrder.paymentTerms || '',
                shippingCost: initialOrder.shippingCost || 0,
                discount: initialOrder.discount || 0,
                notes: initialOrder.notes || ''
            });
        }
        setIsEditing(false);
    }, [initialOrder, isOpen]);

    if (!isOpen || !order) return null;

    const handlePrint = async () => {
        const settings = await getSystemSettings();

        const printWindow = window.open('', '_blank');
        if (!printWindow) return alert("Habilite popups para imprimir.");

        const itemsHtml = (order.items || []).map(item => `
            <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 8px;">${item.productName} ${item.finishing ? `(${item.finishing})` : ''}</td>
                <td style="padding: 8px; text-align: center;">${(item.width ?? 0) > 0 ? `${item.width}x${item.height}` : '-'}</td>
                <td style="padding: 8px; text-align: center;">${item.quantity}</td>
                <td style="padding: 8px; text-align: center;">${item.observations || '-'}</td>
            </tr>
        `).join('');

        const html = `
            <html>
            <head>
                <title>OS #${order.id.slice(0, 8)}</title>
                <style>
                    body { font-family: monospace, sans-serif; font-size: 12px; max-width: 800px; margin: 0 auto; padding: 20px; }
                    .header { display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
                    .company-info h1 { margin: 0; font-size: 18px; }
                    .os-info { text-align: right; }
                    .os-title { font-size: 24px; font-weight: bold; }
                    .section-title { font-weight: bold; background: #eee; padding: 5px; margin-top: 15px; border: 1px solid #000; }
                    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 5px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
                    th { border: 1px solid #000; padding: 5px; background: #eee; }
                    td { border: 1px solid #ccc; padding: 5px; }
                    .signatures { display: flex; justify-content: space-between; margin-top: 50px; }
                    .sign-box { border-top: 1px solid #000; width: 40%; text-align: center; padding-top: 5px; }
                    @media print {
                        body { -webkit-print-color-adjust: exact; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="company-info">
                        <h1>${settings.companyName}</h1>
                        <div>${settings.companyAddress || ''}</div>
                        <div>CNPJ: ${settings.companyCnpj || ''}</div>
                        <div>Contato: ${settings.companyPhone || ''} | ${settings.companyEmail || ''}</div>
                    </div>
                    <div class="os-info">
                        <div class="os-title">OS #${order.id.slice(0, 8)}</div>
                        <div>Data: ${new Date(order.createdAt).toLocaleDateString('pt-BR')}</div>
                        <div>Entrega: <strong>${order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('pt-BR') : 'A Combinar'}</strong></div>
                    </div>
                </div>

                <div class="section-title">DADOS DO CLIENTE</div>
                <div class="info-grid">
                    <div><strong>Cliente:</strong> ${order.clientName}</div>
                    <div><strong>Documento:</strong> ${order.clientDocument || '-'}</div>
                    <div><strong>Telefone:</strong> ${order.clientPhone || '-'}</div>
                    <div><strong>Pagamento:</strong> ${formData.paymentTerms || order.paymentTerms || 'A vista'}</div>
                </div>

                <div class="section-title">ITENS DO PEDIDO</div>
                <table>
                    <thead>
                        <tr>
                            <th>Produto / Acabamento</th>
                            <th style="width: 80px;">Medidas (cm)</th>
                            <th style="width: 50px;">Qtd</th>
                            <th>Observações Técnicas</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>

                ${order.notes ? `
                <div class="section-title">OBSERVAÇÕES GERAIS</div>
                <div style="border: 1px solid #ccc; padding: 10px; min-height: 40px;">
                    ${order.notes}
                </div>
                ` : ''}

                <div class="signatures">
                    <div class="sign-box">
                        Assinatura do Cliente
                    </div>
                    <div class="sign-box">
                        ${settings.companyName}
                    </div>
                </div>

                <script>
                    window.print();
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
    };


    const handleCancel = async () => {
        // ... (rest of logic same)
        if (!confirm("Tem certeza que deseja CANCELAR este pedido? Ele será movido para o histórico.")) return;
        setIsSaving(true);
        const res = await updateOrderStatus(order.id, OrderStatus.CANCELLED);
        setIsSaving(false);
        if (res.success) { if (onUpdate) onUpdate(); onClose(); } else { alert("Erro ao cancelar."); }
    };

    const handleSave = async () => {
        setIsSaving(true);
        const res = await updateOrderDetails(order.id, {
            clientName: formData.clientName,
            clientDocument: formData.clientDocument,
            clientPhone: formData.clientPhone,
            deliveryDate: formData.deliveryDate ? new Date(formData.deliveryDate) : undefined,
            deliveryMethod: formData.deliveryMethod,
            paymentTerms: formData.paymentTerms,
            shippingCost: formData.shippingCost,
            discount: formData.discount,
            notes: formData.notes,
        });
        if (res.success) {
            if (onUpdate) onUpdate();
            setIsEditing(false);
            setOrder(prev => prev ? ({ ...prev, ...formData, deliveryDate: formData.deliveryDate ? new Date(formData.deliveryDate) : undefined } as any) : null)
        } else { alert("Erro ao salvar alterações"); }
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

    const items = order.items || [];
    const subtotal = items.reduce((acc, item) => acc + ((item.unitPrice || 0) * item.quantity), 0);
    const safeSubtotal = subtotal > 0 ? subtotal : (order.totalPrice - (order.shippingCost || 0) + (order.discount || 0));
    const currentTotal = safeSubtotal + formData.shippingCost - formData.discount;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`bg-surface-dark border ${isEditing ? 'border-primary/50 shadow-[0_0_50px_rgba(34,211,238,0.2)]' : 'border-white/10'} rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all`}>

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                            <h3 className="text-xl font-bold text-white">Detalhes do Pedido / OS</h3>
                            {isEditing && <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full uppercase font-bold tracking-wider">Modo Edição</span>}
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <span className="font-mono text-cyan-400">OS #{order.id.slice(0, 8)}</span>
                            <span className="text-slate-500">•</span>
                            <span className="text-slate-400">{new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {!isEmployee && !isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white font-medium border border-white/10 transition-colors text-xs uppercase"
                                title="Editar Dados da OS"
                            >
                                <Icons.Edit size={16} className="inline mr-2" />
                                Editar / Gerar OS
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                            <Icons.Close size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* 1. Status & Basic Info */}
                    <div className="flex items-center justify-between bg-black/20 p-4 rounded-xl border border-white/5">
                        <span className="text-sm text-slate-400 font-medium uppercase tracking-wider">Situação Atual</span>
                        <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold capitalize ${order.status === OrderStatus.IN_PRODUCTION ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20' :
                            order.status === OrderStatus.PENDING ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/20' :
                                'bg-white/5 text-slate-300'
                            }`}>
                            {formatStatus(order.status)}
                        </span>
                    </div>

                    {/* 2. OS Data: Client & Delivery (Editable) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Client */}
                        <div className={`p-5 rounded-xl border transition-colors ${isEditing ? 'bg-primary/5 border-primary/30' : 'bg-white/5 border-white/10'}`}>
                            <label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-4 block flex items-center gap-2">
                                <Icons.User size={14} /> Dados do Cliente
                            </label>
                            {isEditing ? (
                                <div className="space-y-3">
                                    <input value={formData.clientName} onChange={e => setFormData({ ...formData, clientName: e.target.value })} placeholder="Nome do Cliente" className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white font-bold outline-none focus:border-primary/50" />
                                    <div className="grid grid-cols-2 gap-2">
                                        <input value={formData.clientDocument} onChange={e => setFormData({ ...formData, clientDocument: e.target.value })} placeholder="CPF/CNPJ" className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-primary/50" />
                                        <input value={formData.clientPhone} onChange={e => setFormData({ ...formData, clientPhone: e.target.value })} placeholder="Telefone" className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-primary/50" />
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className="text-xl text-white font-bold mb-1">{order.clientName}</div>
                                    <div className="text-sm text-slate-400 fa-mono">{order.clientPhone}</div>
                                </div>
                            )}
                        </div>

                        {/* OS / Delivery */}
                        <div className={`p-5 rounded-xl border transition-colors ${isEditing ? 'bg-primary/5 border-primary/30' : 'bg-white/5 border-white/10'}`}>
                            <label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-4 block flex items-center gap-2">
                                <Icons.Calendar size={14} /> Dados da Entrega
                            </label>
                            {isEditing ? (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className='flex flex-col gap-1'>
                                            <label className="text-[10px] text-slate-400 uppercase">Previsão</label>
                                            <input type="date" value={formData.deliveryDate} onChange={e => setFormData({ ...formData, deliveryDate: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-primary/50" />
                                        </div>
                                        <div className='flex flex-col gap-1'>
                                            <label className="text-[10px] text-slate-400 uppercase">Método</label>
                                            <select value={formData.deliveryMethod} onChange={e => setFormData({ ...formData, deliveryMethod: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-primary/50">
                                                <option value="">Selecione...</option>
                                                <option value="Retirada Balcão">Retirada Balcão</option>
                                                <option value="Entrega Motoboy">Entrega Motoboy</option>
                                                <option value="Instalação">Instalação</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-[10px] text-slate-500 uppercase">Previsão</div>
                                        <div className="text-white font-medium">{order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('pt-BR') : 'Não agendado'}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-slate-500 uppercase">Método</div>
                                        <div className="text-white font-medium">{order.deliveryMethod || 'Não definido'}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 3. Items List */}
                    <div className="bg-black/20 rounded-xl border border-white/5 overflow-hidden">
                        <div className="p-4 bg-white/5 border-b border-white/5 flex justify-between items-center">
                            <label className="text-xs text-slate-500 font-bold uppercase tracking-wider flex items-center gap-2">
                                <Icons.Layers size={14} /> Itens do Pedido ({items.length})
                            </label>
                        </div>
                        <table className="w-full text-left text-sm text-slate-300">
                            <thead className="bg-black/20 text-slate-500 font-bold text-xs uppercase">
                                <tr>
                                    <th className="p-4 w-16 text-center">Qtd</th>
                                    <th className="p-4">Produto / Descrição</th>
                                    <th className="p-4 w-24">Medidas</th>
                                    <th className="p-4 w-24 text-right">Unitário</th>
                                    <th className="p-4 w-24 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {items.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-white/5">
                                        <td className="p-4 text-center font-bold text-white">{item.quantity}</td>
                                        <td className="p-4">
                                            <div className="text-white font-medium">{item.productName}</div>
                                            {item.finishing && <span className="text-xs bg-primary/10 text-primary px-1 rounded mr-2">{item.finishing}</span>}
                                            {item.observations && (
                                                <span className="text-xs text-slate-500">{item.observations}</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-xs font-mono">{item.width}x{item.height}</td>
                                        <td className="p-4 text-right font-mono text-slate-400">{formatCurrency(item.unitPrice || 0)}</td>
                                        <td className="p-4 text-right font-mono text-white font-bold">{formatCurrency((item.totalPrice) || ((item.unitPrice || 0) * item.quantity))}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* 4. Financials & Notes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <label className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Observações Gerais</label>
                            {isEditing ? (
                                <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="w-full h-32 bg-black/40 border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-primary/50 resize-none" placeholder="Observações..." />
                            ) : (
                                <div className="p-3 bg-white/5 rounded-lg text-sm text-slate-300 min-h-[80px] border border-white/5">
                                    {order.notes || "Nenhuma observação."}
                                </div>
                            )}
                        </div>

                        <div className="bg-black/40 p-6 rounded-xl border border-white/10 space-y-3">
                            {isEditing && (
                                <div className="mb-4">
                                    <label className="text-[10px] text-slate-500 uppercase mb-1 block">Condição de Pagamento</label>
                                    <input value={formData.paymentTerms} onChange={e => setFormData({ ...formData, paymentTerms: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none" placeholder="Ex: Pix Entrada + 30 dias" />
                                </div>
                            )}
                            {!isEditing && order.paymentTerms && (
                                <div className="mb-4 flex justify-between items-center text-sm border-b border-white/10 pb-2">
                                    <span className="text-slate-400">Condição:</span>
                                    <span className="text-white">{order.paymentTerms}</span>
                                </div>
                            )}

                            <div className="flex justify-between text-sm text-slate-400">
                                <span>Subtotal Itens</span>
                                <span>{formatCurrency(safeSubtotal)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm text-slate-400">
                                <span>Deslocamento (+)</span>
                                {isEditing ? (
                                    <input type="number" value={formData.shippingCost} onChange={e => setFormData({ ...formData, shippingCost: parseFloat(e.target.value) || 0 })} className="w-20 bg-transparent text-right border-b border-white/10 focus:border-blue-500 outline-none text-white p-0" />
                                ) : (
                                    <span>{formatCurrency(order.shippingCost || 0)}</span>
                                )}
                            </div>
                            <div className="flex justify-between items-center text-sm text-slate-400">
                                <span>Desconto (-)</span>
                                {isEditing ? (
                                    <input type="number" value={formData.discount} onChange={e => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })} className="w-20 bg-transparent text-right border-b border-white/10 focus:border-green-500 outline-none text-white p-0" />
                                ) : (
                                    <span>{formatCurrency(order.discount || 0)}</span>
                                )}
                            </div>
                            <div className="pt-4 mt-2 border-t border-white/10 flex justify-between items-end">
                                <span className="text-lg font-bold text-white">TOTAL</span>
                                <span className="text-2xl font-bold text-primary">{formatCurrency(currentTotal || order.totalPrice)}</span>
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
                                {isSaving ? "Salvando..." : "Salvar Dados OS"}
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
                                <button onClick={handlePrint} className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-background-dark font-bold shadow-lg shadow-primary/20 transition-all flex items-center gap-2">
                                    <Icons.Print size={18} />
                                    Imprimir OS
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default React.memo(OrderDetailsModal);
