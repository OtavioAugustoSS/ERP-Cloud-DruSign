'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { formatCurrency } from '@/lib/utils/price';
import type { DashboardStats } from '@/actions/dashboard';
import { GlowingEffect } from '@/components/ui/glowing-effect';

type Color = 'green' | 'blue' | 'purple' | 'cyan';

const COLORS: Record<Color, { dot: string; blob: string; glow: string; border: string }> = {
    green:  { dot: 'bg-green-400',  blob: 'bg-green-500',  glow: 'rgba(74,222,128,0.10)',  border: 'rgba(74,222,128,0.22)'  },
    blue:   { dot: 'bg-blue-400',   blob: 'bg-blue-500',   glow: 'rgba(96,165,250,0.10)',  border: 'rgba(96,165,250,0.22)'  },
    purple: { dot: 'bg-purple-400', blob: 'bg-purple-500', glow: 'rgba(192,132,252,0.10)', border: 'rgba(192,132,252,0.22)' },
    cyan:   { dot: 'bg-cyan-400',   blob: 'bg-cyan-500',   glow: 'rgba(34,211,238,0.10)',  border: 'rgba(34,211,238,0.22)'  },
};

const container = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.10 } },
};

const card = {
    hidden: { opacity: 0, y: 22 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.42, ease: 'easeOut' as const } },
};

function useCountUp(target: number, duration = 1400) {
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        if (target === 0) { setCurrent(0); return; }
        let startTime: number | null = null;

        function easeOutQuart(x: number) { return 1 - Math.pow(1 - x, 4); }

        function step(ts: number) {
            if (!startTime) startTime = ts;
            const progress = Math.min((ts - startTime) / duration, 1);
            setCurrent(target * easeOutQuart(progress));
            if (progress < 1) requestAnimationFrame(step);
        }

        const id = requestAnimationFrame(step);
        return () => cancelAnimationFrame(id);
    }, [target, duration]);

    return current;
}

function AnimatedCurrency({ value }: { value: number }) {
    const v = useCountUp(value);
    return <>{formatCurrency(v)}</>;
}

function AnimatedInt({ value }: { value: number }) {
    const v = useCountUp(value);
    return <>{Math.round(v)}</>;
}

function KpiCard({
    label, color, sub, children, pulseDelay,
}: {
    label: string;
    color: Color;
    sub?: string;
    children: React.ReactNode;
    pulseDelay: number;
}) {
    const c = COLORS[color];

    return (
        <motion.div
            variants={card}
            whileHover={{
                y: -5,
                transition: { duration: 0.2, ease: 'easeOut' },
            }}
            className="relative bg-surface-dark/50 border border-white/5 rounded-2xl p-5 flex flex-col gap-2.5 cursor-default group"
        >
            <GlowingEffect 
                spread={80}
                glow={true}
                disabled={false}
                proximity={120}
                inactiveZone={0.01}
                borderWidth={2}
            />

            {/* Blob decorativo no canto com seu próprio overflow-hidden para não cortar a borda brilhante do card */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                <div className={`absolute -bottom-6 -right-6 w-32 h-32 rounded-full blur-3xl opacity-[0.07] ${c.blob}`} />
            </div>

            {/* Label com dot pulsante */}
            <div className="flex items-center gap-2 relative z-10">
                <motion.div
                    className={`w-2 h-2 rounded-full shrink-0 ${c.dot}`}
                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0.6, 1] }}
                    transition={{ duration: 1.8, repeat: Infinity, repeatDelay: pulseDelay, ease: 'easeInOut' }}
                />
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
            </div>

            {/* Valor */}
            <div className="relative z-10">{children}</div>

            {/* Sub */}
            {sub && <p className="text-[11px] text-slate-600 leading-tight relative z-10">{sub}</p>}
        </motion.div>
    );
}

export default function KpiCards({ stats }: { stats: DashboardStats }) {
    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
            <KpiCard label="Receita do Mês" color="green" sub="pedidos concluídos" pulseDelay={3}>
                <span className="text-xl font-bold font-mono text-white leading-tight">
                    <AnimatedCurrency value={stats.monthRevenue} />
                </span>
            </KpiCard>

            <KpiCard label="Pedidos no Mês" color="blue" sub="todos os status" pulseDelay={4}>
                <span className="text-4xl font-bold font-mono text-white">
                    <AnimatedInt value={stats.ordersThisMonth} />
                </span>
            </KpiCard>

            <KpiCard label="Ticket Médio" color="purple" sub="pedidos deste mês" pulseDelay={5}>
                <span className="text-xl font-bold font-mono text-white leading-tight">
                    {stats.avgTicketMonth > 0
                        ? <AnimatedCurrency value={stats.avgTicketMonth} />
                        : <span className="text-slate-500">—</span>}
                </span>
            </KpiCard>

            <KpiCard label="Clientes Cadastrados" color="cyan" sub="base total" pulseDelay={6}>
                <span className="text-4xl font-bold font-mono text-white">
                    <AnimatedInt value={stats.totalClients} />
                </span>
            </KpiCard>
        </motion.div>
    );
}
