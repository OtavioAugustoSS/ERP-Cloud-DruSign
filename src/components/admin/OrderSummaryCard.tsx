import { ZoomIn } from 'lucide-react';

interface OrderSummaryCardProps {
    width: number;
    height: number;
    quantity: number;
    totalPrice: number;
    activeTab: string;
    serviceType: string;
    finishing: string;
}

export default function OrderSummaryCard({
    width,
    height,
    quantity,
    totalPrice,
    activeTab,
    serviceType,
    finishing
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
        if (activeTab === 'ADESIVO') return 'Adesivo Vinil';
        if (activeTab === 'ACM') return 'Placa em ACM';
        return activeTab;
    };

    return (
        <div className="bg-card-dark rounded-xl border border-white/5 shadow-xl overflow-hidden flex flex-col h-fit">
            <div className="relative h-48 bg-input-bg flex items-center justify-center group overflow-hidden">
                {/* Abstract grid pattern */}
                <div
                    className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)',
                        backgroundSize: '20px 20px'
                    }}
                />
                {/* Replaced img with div for now to avoid lint warning, or keep img but acknowledge warning */}
                <div className="text-white/20 text-xs">Preview Area</div>

                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="bg-black/70 backdrop-blur-md text-white p-2 rounded-lg hover:bg-primary transition-colors">
                        <ZoomIn size={20} />
                    </button>
                </div>
            </div>

            <div className="p-6 border-t border-white/5">
                <h3 className="text-white font-medium mb-4">Resumo do Pedido</h3>
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                        <span className="text-text-secondary">Item</span>
                        <span className="text-white font-medium">{getItemName()}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-text-secondary">Dimensões</span>
                        <span className="text-white font-mono">{width}x{height}cm</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-text-secondary">Acabamento</span>
                        <span className="text-white font-mono text-right max-w-[50%] leading-tight">{finishing}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-text-secondary">Qtd.</span>
                        <span className="text-white font-mono">{quantity}</span>
                    </div>
                    <div className="h-px bg-white/10 my-2"></div>
                    <div className="flex justify-between items-center pt-1">
                        <span className="text-text-secondary">Total</span>
                        <span className="text-xl font-bold text-primary">{formatCurrency(totalPrice)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
