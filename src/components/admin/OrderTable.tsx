'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle, Clock, Package } from 'lucide-react';

interface OrderTableProps {
    orders: any[];
    variant: 'pending' | 'history';
}

export default function OrderTable({ orders, variant }: OrderTableProps) {
    if (orders.length === 0) {
        return (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center text-zinc-500">
                <Package className="mx-auto mb-4 opacity-20" size={48} />
                <p>Nenhum pedido encontrado nesta seção.</p>
            </div>
        );
    }

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-950/50 text-zinc-400 uppercase tracking-wider text-xs font-bold border-b border-zinc-800">
                        <tr>
                            <th className="px-6 py-4">ID</th>
                            <th className="px-6 py-4">Cliente</th>
                            <th className="px-6 py-4">Data</th>
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-6 py-4 text-right">Total</th>
                            <th className="px-6 py-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                        {orders.map((order) => (
                            <tr key={order.id} className="hover:bg-white/5 transition-colors group">
                                <td className="px-6 py-4 font-mono text-zinc-500">
                                    #{order.id.slice(-6)}
                                </td>
                                <td className="px-6 py-4 font-medium text-white">
                                    {order.clientName}
                                    <span className="block text-xs text-zinc-500 font-normal mt-0.5">
                                        {order.items.length} item(s)
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-zinc-400">
                                    {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <StatusBadge status={order.status} />
                                </td>
                                <td className="px-6 py-4 text-right font-medium text-white">
                                    R$ {order.totalPrice.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Link
                                        href={`/admin/orders/${order.id}`}
                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-hover transition-colors px-3 py-1.5 rounded bg-primary/10 hover:bg-primary/20"
                                    >
                                        Ver Detalhes
                                        <ArrowRight size={12} />
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    if (status === 'COMPLETED') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-500/10 text-green-500 border border-green-500/20">
                <CheckCircle size={12} />
                Concluído
            </span>
        );
    }
    if (status === 'IN_PRODUCTION') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Clock size={12} />
                Em Produção
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
            <Clock size={12} />
            Pendente
        </span>
    );
}
