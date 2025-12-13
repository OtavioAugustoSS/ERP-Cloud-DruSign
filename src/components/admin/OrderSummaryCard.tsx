import { ZoomIn, Package } from 'lucide-react';

interface OrderSummaryCardProps {
    width: number;
    height: number;
    quantity: number;
    totalPrice: number;
    activeTab: string;
    serviceType: string;
    finishing: string;
    thickness?: string; // New prop
}

export default function OrderSummaryCard({
    width,
    height,
    quantity,
    totalPrice,
    activeTab,
    serviceType,
    finishing,
    thickness
}: OrderSummaryCardProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const getItemName = () => {
        if (activeTab === 'LONA') {
            if (serviceType === 'Banner Promocional') return 'Banner em Lona';
            if (serviceType === 'Grandes Formatos') return 'Lona Grande Formato';
            return 'Lona';
        }
        if (activeTab === 'ADESIVO') {
            // If serviceType is Fosco/Brilhoso/Transparente, display nicely
            if (['Fosco', 'Brilhoso', 'Transparente'].includes(serviceType)) {
                return `Adesivo ${serviceType}`;
            }
            return 'Adesivo Vinil';
        }
        if (activeTab === 'ACM') return 'Placa em ACM';
        if (activeTab === 'PVC') return 'Placa em PVC';
        if (activeTab === 'PS') return 'Placa em PS';

        // Updated Acrylic Logic
        if (activeTab === 'ACRÍLICO') {
            return `Chapa de Acrílico ${thickness ? `(${thickness})` : ''}`;
        }

        return activeTab;
    };

    return (
        <div className="bg-card-dark rounded-xl border border-white/5 shadow-xl overflow-hidden flex flex-col h-fit">
            <div className="p-6 space-y-5">
                <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                    <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                        <Package size={20} />
                    </div>
                    <h3 className="text-white font-medium">Resumo do Pedido</h3>
                </div>

                <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-baseline">
                        <span className="text-text-secondary">Item</span>
                        <span className="text-white font-medium font-mono text-right">{getItemName()}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                        <span className="text-text-secondary">Dimensões</span>
                        <span className="text-white font-mono text-right">{width}x{height}cm</span>
                    </div>

                    {/* Conditionally show Finishing if it exists (not empty string) */}
                    {finishing && (
                        <div className="flex justify-between items-baseline">
                            <span className="text-text-secondary">Acabamento</span>
                            <span className="text-white font-mono text-right max-w-[50%] leading-tight">{finishing}</span>
                        </div>
                    )}

                    <div className="flex justify-between items-baseline">
                        <span className="text-text-secondary">Qtd.</span>
                        <span className="text-white font-mono text-right">{quantity}</span>
                    </div>
                </div>

                <div className="h-px bg-white/10"></div>

                <div className="flex justify-between items-center pt-1">
                    <span className="text-text-secondary">Total Estimado</span>
                    <span className="text-2xl font-bold text-primary tracking-tight">{formatCurrency(totalPrice)}</span>
                </div>
            </div>
            {/* Subtle pattern to keep some texture at bottom without taking space */}
            <div
                className="h-2 w-full opacity-10"
                style={{
                    backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)',
                    backgroundSize: '8px 8px'
                }}
            />
        </div>
    );
}
