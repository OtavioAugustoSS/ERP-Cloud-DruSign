'use client';

import { useState, useEffect } from 'react';

export default function DashboardClock() {
    const [time, setTime] = useState('');

    useEffect(() => {
        function tick() {
            setTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);

    if (!time) return null;

    return (
        <span className="text-sm font-mono text-slate-400 tabular-nums tracking-tight">{time}</span>
    );
}
