'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Send, Ban, CheckCircle, Scissors, PackageCheck } from 'lucide-react';
import { updateOrderStatus } from '@/actions/order';
import type { OrderStatus } from '@/types';

interface OrderDetailActionsProps {
    orderId: string;
    currentStatus: OrderStatus;
    isAdmin: boolean;
}

const NEXT_STATUS: Partial<Record<OrderStatus, { status: OrderStatus; label: string; icon: React.ReactNode; className: string }>> = {
    PENDING: {
        status: 'IN_PRODUCTION',
        label: 'Enviar para Produção',
        icon: <Send size={16} />,
        className: 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/30',
    },
    IN_PRODUCTION: {
        status: 'FINISHING',
        label: 'Iniciar Acabamento',
        icon: <Scissors size={16} />,
        className: 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/30',
    },
    FINISHING: {
        status: 'READY_FOR_SHIPPING',
        label: 'Marcar Pronto p/ Envio',
        icon: <PackageCheck size={16} />,
        className: 'bg-primary hover:bg-primary/90 text-background-dark shadow-lg shadow-primary/20',
    },
    READY_FOR_SHIPPING: {
        status: 'COMPLETED',
        label: 'Confirmar Entrega',
        icon: <CheckCircle size={16} />,
        className: 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/30',
    },
};

export default function OrderDetailActions({ orderId, currentStatus, isAdmin }: OrderDetailActionsProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [confirmCancel, setConfirmCancel] = useState(false);

    const next = NEXT_STATUS[currentStatus];
    const isTerminal = currentStatus === 'COMPLETED' || currentStatus === 'CANCELLED';

    function advance() {
        if (!next) return;
        startTransition(async () => {
            await updateOrderStatus(orderId, next.status);
            router.refresh();
        });
    }

    function cancel() {
        startTransition(async () => {
            await updateOrderStatus(orderId, 'CANCELLED');
            setConfirmCancel(false);
            router.refresh();
        });
    }

    if (isTerminal) return null;

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-zinc-300">Ações</h3>

            {next && (
                <button
                    onClick={advance}
                    disabled={isPending}
                    className={`w-full h-11 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${next.className}`}
                >
                    {isPending ? <Loader2 size={16} className="animate-spin" /> : next.icon}
                    {next.label}
                </button>
            )}

            {isAdmin && !confirmCancel && (
                <button
                    onClick={() => setConfirmCancel(true)}
                    disabled={isPending}
                    className="w-full h-9 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                    <Ban size={14} />
                    Cancelar Pedido
                </button>
            )}

            {isAdmin && confirmCancel && (
                <div className="border border-red-500/30 rounded-lg p-3 space-y-2 bg-red-500/5">
                    <p className="text-xs text-red-400 text-center">Confirmar cancelamento?</p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setConfirmCancel(false)}
                            className="flex-1 h-8 rounded text-xs text-zinc-400 hover:bg-zinc-800 transition-colors"
                        >
                            Voltar
                        </button>
                        <button
                            onClick={cancel}
                            disabled={isPending}
                            className="flex-1 h-8 rounded text-xs bg-red-600 hover:bg-red-500 text-white font-semibold flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                            {isPending ? <Loader2 size={12} className="animate-spin" /> : null}
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
