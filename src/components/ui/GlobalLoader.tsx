import React from 'react';

export default function GlobalLoader({ text = "CARREGANDO..." }: { text?: string }) {
    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[250px] w-full">
            {/* O CSS desta classe .loader está no globals.css */}
            <span className="loader mb-12"></span>
            
            <p className="font-sans font-black text-xl tracking-[0.3em] text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] animate-pulse">
                {text}
            </p>
        </div>
    );
}
