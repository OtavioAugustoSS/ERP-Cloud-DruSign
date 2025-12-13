import { Send, MessageSquare } from 'lucide-react';

export default function InternalChat() {
    return (
        <div className="bg-card-dark rounded-xl border border-white/5 shadow-xl flex flex-col h-[400px]">
            <div className="p-4 border-b border-white/5 flex items-center gap-2">
                <MessageSquare size={18} className="text-primary" />
                <h3 className="text-white font-medium text-sm">Chat Interno</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Messages */}
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">João (Design)</span>
                        <span className="text-[10px] text-text-secondary">10:30</span>
                    </div>
                    <p className="bg-white/5 text-text-secondary text-sm p-3 rounded-lg rounded-tl-none">
                        A sangria está incorreta neste arquivo. Precisa de 5mm.
                    </p>
                </div>

                <div className="flex flex-col gap-1 items-end">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-text-secondary">10:35</span>
                        <span className="text-xs font-bold text-primary">Você</span>
                    </div>
                    <p className="bg-primary/10 text-white text-sm p-3 rounded-lg rounded-tr-none border border-primary/20">
                        Vou solicitar uma nova versão ao cliente.
                    </p>
                </div>
            </div>

            <div className="p-4 border-t border-white/5">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Digite uma mensagem..."
                        className="w-full bg-input-bg border border-white/10 rounded-lg pl-4 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    />
                    <button className="absolute right-2 top-1/2 -translate-y-1/2 text-primary hover:text-white transition-colors p-1">
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
