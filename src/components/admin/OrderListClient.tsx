'use client';

import { updateOrderStatus } from '@/actions/order';
import { Package, Clock, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { OrderStatus } from '@/types';

interface OrderListClientProps {
    initialOrders: any[];
    isHistory: boolean;
}

export default function OrderListClient({ initialOrders, isHistory }: OrderListClientProps) {

    const handleStatusMove = async (orderId: string, newStatus: OrderStatus) => {
        if (confirm('Tem certeza que deseja alterar o status deste pedido?')) {
            await updateOrderStatus(orderId, newStatus);
        }
    };

    if (initialOrders.length === 0) {
        return (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center text-zinc-500">
                <Package className="mx-auto mb-4 opacity-20" size={48} />
                <p>Nenhum pedido encontrado nesta seção.</p>
            </div>
        );
    }

    return (
        <div className="grid gap-4">
            {initialOrders.map(order => (
                <div key={order.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-zinc-700 transition-colors">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <span className="text-zinc-500 font-mono text-sm">#{order.id.slice(-6)}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider
                                ${order.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500' : ''}
                                ${order.status === 'IN_PRODUCTION' ? 'bg-blue-500/10 text-blue-500' : ''}
                                ${order.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500' : ''}
                            `}>
                                {order.status === 'PENDING' && 'Pendente'}
                                {order.status === 'IN_PRODUCTION' && 'Em Produção'}
                                {order.status === 'COMPLETED' && 'Concluído'}
                            </span>
                        </div>
                        <h3 className="text-white font-bold text-lg">{order.clientName}</h3>
                        <p className="text-zinc-400 text-sm">Total: R$ {order.totalPrice.toFixed(2)}</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right hidden md:block">
                            <span className="text-zinc-500 text-xs block">{new Date(order.createdAt).toLocaleDateString()}</span>
                            <span className="text-zinc-500 text-xs block">{order.items.length} item(s)</span>
                        </div>

                        {!isHistory ? (
                            <div className="flex gap-2">
                                {order.status === OrderStatus.PENDING && (
                                    <button
                                        onClick={() => handleStatusMove(order.id, OrderStatus.IN_PRODUCTION)}
                                        className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors"
                                    >
                                        Iniciar Produção <ArrowRight size={14} />
                                    </button>
                                )}
                                {order.status === OrderStatus.IN_PRODUCTION && (
                                    <button
                                        onClick={() => handleStatusMove(order.id, OrderStatus.COMPLETED)}
                                        className="bg-green-600/20 hover:bg-green-600/30 text-green-400 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors"
                                    >
                                        Concluir <CheckCircle size={14} />
                                    </button>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={() => handleStatusMove(order.id, OrderStatus.PENDING)}
                                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors"
                            >
                                <ArrowLeft size={14} /> Reabrir
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
