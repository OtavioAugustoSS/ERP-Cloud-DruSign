'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';

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

export function AnimatedCount({ value }: { value: number }) {
    const current = useCountUp(value, 1500);
    return <>{Math.round(current)}</>;
}

export function AnimatedMaterialItem({ mat, index }: { mat: { name: string; pct: number }; index: number }) {
    const currentPct = useCountUp(mat.pct, 1500);

    return (
        <div>
            <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-slate-300 truncate max-w-[75%]">{mat.name}</span>
                <span className="text-xs text-slate-500 font-mono tabular-nums">{Math.round(currentPct)}%</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${mat.pct}%` }}
                    transition={{ duration: 1.5, ease: 'easeOut', delay: index * 0.1 }}
                />
            </div>
        </div>
    );
}
