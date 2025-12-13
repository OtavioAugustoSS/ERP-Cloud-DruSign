import { Send, Trash2 } from 'lucide-react';

interface OrderActionsCardProps {
    onSendToProduction: () => void;
    isSubmitting?: boolean;
}

export default function OrderActionsCard({ onSendToProduction, isSubmitting = false }: OrderActionsCardProps) {
    return (
        <div className="bg-card-dark rounded-xl border border-white/5 shadow-xl p-6">
            <h3 className="text-white font-medium mb-4">Ações do Administrador</h3>
            <div className="space-y-3">
                <button
                    onClick={onSendToProduction}
                    disabled={isSubmitting}
                    className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-3 px-4 rounded-lg shadow-[0_0_20px_rgba(19,164,236,0.2)] hover:shadow-[0_0_25px_rgba(19,164,236,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Send size={18} />
                    {isSubmitting ? 'Enviando...' : 'Enviar para Produção'}
                </button>

                <button className="w-full text-red-400 hover:text-red-300 hover:bg-red-400/10 font-medium py-2 px-4 rounded-lg transition-colors text-sm mt-2 flex items-center justify-center gap-2">
                    <Trash2 size={16} />
                    Cancelar Pedido
                </button>
            </div>
        </div>
    );
}
