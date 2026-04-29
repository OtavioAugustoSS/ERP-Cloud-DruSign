import { Check, X } from 'lucide-react';
import type { OrderStatus } from '@/types';

const STEPS: { status: OrderStatus; label: string }[] = [
    { status: 'PENDING',            label: 'Pendente' },
    { status: 'IN_PRODUCTION',      label: 'Em Produção' },
    { status: 'FINISHING',          label: 'Acabamento' },
    { status: 'READY_FOR_SHIPPING', label: 'Pronto p/ Envio' },
    { status: 'COMPLETED',          label: 'Concluído' },
];

const STATUS_ORDER: Record<OrderStatus, number> = {
    PENDING: 0,
    IN_PRODUCTION: 1,
    FINISHING: 2,
    READY_FOR_SHIPPING: 3,
    COMPLETED: 4,
    CANCELLED: -1,
};

interface ProductionPipelineProps {
    currentStatus?: OrderStatus;
}

export default function ProductionPipeline({ currentStatus = 'PENDING' }: ProductionPipelineProps) {
    const currentIndex = STATUS_ORDER[currentStatus] ?? 0;
    const isCancelled = currentStatus === 'CANCELLED';

    if (isCancelled) {
        return (
            <div className="w-full py-6 flex justify-center">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                    <X size={12} strokeWidth={3} />
                    Pedido Cancelado
                </span>
            </div>
        );
    }

    return (
        <div className="w-full py-6 px-4">
            <div className="flex items-start w-full">
                {STEPS.map((step, idx) => {
                    const isCompleted = idx < currentIndex;
                    const isCurrent   = idx === currentIndex;
                    const isPending   = idx > currentIndex;
                    const isLast      = idx === STEPS.length - 1;

                    return (
                        <div key={step.status} className={`flex items-start ${isLast ? '' : 'flex-1'}`}>
                            {/* Step */}
                            <div className="flex flex-col items-center shrink-0">
                                {/* Dot */}
                                <div className={`
                                    relative w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-500
                                    ${isCompleted
                                        ? 'bg-primary border-primary shadow-[0_0_12px_rgba(19,164,236,0.5)]'
                                        : isCurrent
                                            ? 'bg-background-dark border-primary shadow-[0_0_18px_rgba(19,164,236,0.7)]'
                                            : 'bg-white/[0.03] border-white/10'}
                                `}>
                                    {isCompleted ? (
                                        <Check size={14} strokeWidth={3} className="text-white" />
                                    ) : isCurrent ? (
                                        <>
                                            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                                            {/* Anel pulsante externo */}
                                            <span className="absolute inset-0 rounded-full border border-primary/40 animate-ping" />
                                        </>
                                    ) : (
                                        <div className="w-2 h-2 rounded-full bg-white/15" />
                                    )}
                                </div>

                                {/* Label */}
                                <span className={`
                                    mt-2.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap text-center
                                    ${isCurrent   ? 'text-white'      : ''}
                                    ${isCompleted ? 'text-primary'    : ''}
                                    ${isPending   ? 'text-slate-600'  : ''}
                                `}>
                                    {step.label}
                                </span>
                            </div>

                            {/* Connector line (except after last step) */}
                            {!isLast && (
                                <div className="flex-1 mt-[17px] mx-1.5 h-[2px] rounded-full overflow-hidden bg-white/[0.06]">
                                    <div className={`
                                        h-full rounded-full transition-all duration-700 ease-out
                                        ${isCompleted
                                            ? 'w-full bg-primary shadow-[0_0_6px_rgba(19,164,236,0.4)]'
                                            : 'w-0'}
                                    `} />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
