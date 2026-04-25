import { Check } from 'lucide-react';
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
                <span className="px-4 py-2 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                    Pedido Cancelado
                </span>
            </div>
        );
    }

    return (
        <div className="w-full py-6 flex justify-center">
            <div className="relative flex items-center gap-12">
                {/* Linha de fundo */}
                <div className="absolute left-0 top-[15px] w-full h-[3px] bg-white/5 -z-10 rounded-full" />

                {STEPS.map((step, idx) => {
                    const isCompleted = idx < currentIndex;
                    const isCurrent  = idx === currentIndex;

                    return (
                        <div key={step.status} className="flex flex-col items-center gap-3 relative z-10">
                            <div
                                className={`
                                    w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all shadow-xl
                                    ${isCompleted
                                        ? 'bg-primary border-primary text-white shadow-[0_0_15px_rgba(19,164,236,0.6)]'
                                        : isCurrent
                                            ? 'bg-background-dark border-primary text-primary shadow-[0_0_20px_rgba(19,164,236,0.8)] scale-125'
                                            : 'bg-background-dark border-white/20 text-white/20'}
                                `}
                            >
                                {isCompleted
                                    ? <Check size={14} strokeWidth={3} />
                                    : <div className={`w-2.5 h-2.5 rounded-full ${isCurrent ? 'bg-primary shadow-[0_0_10px_#13a4ec] animate-pulse' : 'bg-white/20'}`} />
                                }
                            </div>
                            <span className={`text-xs font-bold uppercase tracking-wider whitespace-nowrap ${isCurrent ? 'text-white' : isCompleted ? 'text-primary' : 'text-slate-500'}`}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
