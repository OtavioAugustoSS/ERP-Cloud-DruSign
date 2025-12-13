import { Send } from 'lucide-react';

export default function OrderActionsCard() {
    return (
        <div className="bg-card-dark rounded-xl border border-white/5 shadow-xl p-6">
            <h3 className="text-white font-medium mb-4">Ações do Administrador</h3>
            <div className="space-y-3">
                <button className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-3 px-4 rounded-lg shadow-[0_0_20px_rgba(19,164,236,0.2)] hover:shadow-[0_0_25px_rgba(19,164,236,0.4)] transition-all flex items-center justify-center gap-2">
                    <Send size={18} />
                    Enviar para Produção
                </button>
                <button className="w-full bg-white/5 hover:bg-white/10 text-white font-medium py-3 px-4 rounded-lg border border-white/10 transition-colors">
                    Salvar como Rascunho
                </button>
                <button className="w-full text-red-400 hover:text-red-300 hover:bg-red-400/10 font-medium py-2 px-4 rounded-lg transition-colors text-sm mt-2">
                    Cancelar Pedido
                </button>
            </div>
        </div>
    );
}
