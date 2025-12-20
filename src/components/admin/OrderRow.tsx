import React from 'react';
import { Icons } from './Icons';
import { Order, OrderStatus } from '../../types';

interface OrderRowProps {
    order: Order;
    onOpenDetails: (order: Order) => void;
    onStatusUpdate: (id: string, newStatus: OrderStatus) => void;
    updatingId: string | null;
}

const OrderRow = ({ order, onOpenDetails, onStatusUpdate, updatingId }: OrderRowProps) => {
    const isUpdating = updatingId === order.id;

    const renderStatusBadge = (status: OrderStatus) => {
        switch (status) {
            case OrderStatus.PENDING:
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mr-2 animate-pulse"></span>
                        Pendente
                    </span>
                );
            case OrderStatus.IN_PRODUCTION:
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-2"></span>
                        Em Produção
                    </span>
                );
            case OrderStatus.READY_FOR_SHIPPING:
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary mr-2"></span>
                        Pronto p/ Envio
                    </span>
                );
            case OrderStatus.COMPLETED:
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-500 border border-green-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2"></span>
                        Concluído
                    </span>
                );
            default:
                return null;
        }
    };

    const renderActions = () => {
        if (isUpdating) {
            return <div className="text-slate-500 text-xs">Atualizando...</div>
        }

        if (order.status === OrderStatus.PENDING) {
            return (
                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onStatusUpdate(order.id, OrderStatus.IN_PRODUCTION);
                        }}
                        className="flex items-center gap-2 h-9 px-4 rounded-full bg-primary/10 hover:bg-primary hover:text-background-dark text-primary font-bold text-xs transition-all shadow-[0_0_10px_rgba(34,211,238,0.1)] hover:shadow-[0_0_15px_rgba(34,211,238,0.4)]"
                        title="Enviar para Produção"
                    >
                        <span>Enviar p/ Produção</span>
                        <Icons.Play size={14} />
                    </button>
                </div>
            );
        }

        if (order.status === OrderStatus.IN_PRODUCTION) {
            return (
                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onStatusUpdate(order.id, OrderStatus.READY_FOR_SHIPPING);
                        }}
                        className="flex items-center gap-2 h-9 px-4 rounded-full bg-blue-500/10 hover:bg-blue-500 hover:text-white text-blue-400 border border-blue-500/20 font-bold text-xs transition-all"
                        title="Marcar como Pronto"
                    >
                        <span>Pronto p/ Envio</span>
                        <Icons.PackageCheck size={14} />
                    </button>
                </div>
            );
        }

        if (order.status === OrderStatus.READY_FOR_SHIPPING) {
            return (
                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onStatusUpdate(order.id, OrderStatus.COMPLETED);
                        }}
                        className="flex items-center gap-2 h-9 px-4 rounded-full bg-primary hover:bg-primary/90 text-background-dark font-bold text-xs transition-all shadow-lg shadow-primary/20"
                        title="Concluir / Entregue"
                    >
                        <span>Entregar/Concluir</span>
                        <Icons.CheckCircle size={14} />
                    </button>
                </div>
            );
        }

        return null;
    };

    return (
        <tr className="hover:bg-white/[0.02] transition-colors group">
            <td className="p-4 pl-6 font-mono text-white">#{order.id.slice(0, 8)}</td>
            <td className="p-4">
                <div className="flex flex-col">
                    <span className="text-white font-medium">{order.clientName}</span>
                    <span className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>
            </td>
            <td className="p-4">
                <div className="flex flex-col gap-1">
                    <span className="text-white font-bold text-sm tracking-wide">{order.productName || "Produto Personalizado"}</span>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>{order.width}x{order.height}cm</span>
                        <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                        <span>{order.quantity}un</span>
                    </div>
                    {order.instructions && (
                        <div className="mt-1 text-xs text-cyan-400/80 italic max-w-xs truncate">
                            "{order.instructions}"
                        </div>
                    )}
                </div>
            </td>
            <td className="p-4 text-center">
                {renderStatusBadge(order.status)}
            </td>
            <td className="p-4 pr-6 text-right">
                <div className="flex items-center justify-end gap-3">
                    <button
                        onClick={() => onOpenDetails(order)}
                        className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                        title="Ver Detalhes Completo"
                    >
                        <Icons.Visibility size={18} />
                    </button>
                    {renderActions()}
                </div>
            </td>
        </tr>
    );
};

export default React.memo(OrderRow);
