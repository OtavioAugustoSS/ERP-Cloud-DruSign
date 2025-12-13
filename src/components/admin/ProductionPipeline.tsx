import { Check } from 'lucide-react';

const steps = [
    { id: 'start', label: 'Início', status: 'completed' },
    { id: 'check', label: 'Verificação', status: 'current' },
    { id: 'ready', label: 'Pronto', status: 'pending' },
];

export default function ProductionPipeline() {
    return (
        <div className="w-full py-6 flex justify-center">
            <div className="relative flex items-center gap-16">
                {/* Pulsing Connecting Line */}
                <div className="absolute left-0 top-[15px] w-full h-[3px] bg-blue-900/50 -z-10 rounded-full">
                    <div className="absolute inset-0 bg-primary shadow-[0_0_15px_#13a4ec] animate-pulse rounded-full opacity-80"></div>
                </div>

                {steps.map((step) => {
                    const isCompleted = step.status === 'completed';
                    const isCurrent = step.status === 'current';

                    return (
                        <div key={step.id} className="flex flex-col items-center gap-3 relative z-10">
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
                                {isCompleted ? <Check size={14} strokeWidth={3} /> : <div className={`w-2.5 h-2.5 rounded-full ${isCurrent ? 'bg-primary shadow-[0_0_10px_#13a4ec]' : 'bg-white/20'}`} />}
                            </div>
                            <span className={`text-xs font-bold uppercase tracking-wider ${isCurrent ? 'text-white' : isCompleted ? 'text-primary' : 'text-text-secondary'}`}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
