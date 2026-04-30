'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Send, Ban, CheckCircle, Scissors, PackageCheck, AlertTriangle } from 'lucide-react';
import { updateOrderStatus } from '@/actions/order';
import type { OrderStatus } from '@/types';

interface OrderDetailActionsProps {
    orderId: string;
    currentStatus: OrderStatus;
    isAdmin: boolean;
}

const NEXT_STATUS: Partial<Record<OrderStatus, {
    status: OrderStatus;
    label: string;
    icon: React.ReactNode;
    base: string;
    fill: string;
}>> = {
    PENDING: {
        status: 'IN_PRODUCTION',
        label: 'Enviar para Produção',
        icon: <Send size={15} />,
        base: 'bg-blue-600 text-white shadow-lg shadow-blue-900/30',
        fill: 'bg-blue-500',
    },
    IN_PRODUCTION: {
        status: 'FINISHING',
        label: 'Iniciar Acabamento',
        icon: <Scissors size={15} />,
        base: 'bg-purple-600 text-white shadow-lg shadow-purple-900/30',
        fill: 'bg-purple-500',
    },
    FINISHING: {
        status: 'READY_FOR_SHIPPING',
        label: 'Marcar Pronto p/ Envio',
        icon: <PackageCheck size={15} />,
        base: 'bg-primary text-background-dark shadow-lg shadow-primary/20',
        fill: 'bg-primary-hover',
    },
    READY_FOR_SHIPPING: {
        status: 'COMPLETED',
        label: 'Confirmar Entrega',
        icon: <CheckCircle size={15} />,
        base: 'bg-green-600 text-white shadow-lg shadow-green-900/30',
        fill: 'bg-green-500',
    },
};

export default function OrderDetailActions({ orderId, currentStatus, isAdmin }: OrderDetailActionsProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [confirmCancel, setConfirmCancel] = useState(false);

    const next = NEXT_STATUS[currentStatus];

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

    return (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 sm:p-5 space-y-3">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Ações</h3>

            {next && (
                <button
                    onClick={advance}
                    disabled={isPending}
                    className={`relative w-full h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2
                        overflow-hidden group transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed
                        ${next.base}`}
                >
                    {/* slide-fill hover */}
                    <span className={`absolute inset-0 -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out ${next.fill} opacity-60`} />
                    <span className="relative z-10 flex items-center gap-2">
                        {isPending ? <Loader2 size={15} className="animate-spin" /> : next.icon}
                        {next.label}
                    </span>
                </button>
            )}

            {isAdmin && !confirmCancel && (
                <button
                    onClick={() => setConfirmCancel(true)}
                    disabled={isPending}
                    className="w-full h-9 rounded-xl text-sm text-red-400/70 hover:text-red-400 hover:bg-red-400/8 flex items-center justify-center gap-2 transition-all duration-150 disabled:opacity-50"
                >
                    <Ban size={13} />
                    Cancelar Pedido
                </button>
            )}

            {isAdmin && confirmCancel && (
                <div className="border border-red-500/25 rounded-xl p-3.5 space-y-3 bg-red-500/5 animate-fade-in">
                    <div className="flex items-center gap-2 justify-center">
                        <AlertTriangle size={13} className="text-red-400" />
                        <p className="text-xs text-red-400 font-medium">Confirmar cancelamento?</p>
                    </div>
                    <p className="text-[11px] text-zinc-600 text-center">Esta ação não pode ser desfeita.</p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setConfirmCancel(false)}
                            className="flex-1 h-8 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
                        >
                            Voltar
                        </button>
                        <button
                            onClick={cancel}
                            disabled={isPending}
                            className="relative flex-1 h-8 rounded-lg text-xs bg-red-600 hover:bg-red-500 text-white font-semibold flex items-center justify-center gap-1.5 overflow-hidden group transition-all disabled:opacity-50"
                        >
                            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out bg-white/10" />
                            <span className="relative z-10 flex items-center gap-1.5">
                                {isPending ? <Loader2 size={12} className="animate-spin" /> : <Ban size={12} />}
                                Cancelar
                            </span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
