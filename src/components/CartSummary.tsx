'use client';

import { useCartStore } from '@/store/cartStore';

export default function CartSummary() {
    const items = useCartStore((state) => state.items);
    const totalPrice = useCartStore((state) => state.totalPrice());
    const removeItem = useCartStore((state) => state.removeItem);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    if (items.length === 0) {
        return (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-500 text-center">Seu carrinho está vazio.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="font-semibold text-lg mb-3">Carrinho de Compras</h3>
            <div className="space-y-4">
                {items.map((item) => (
                    <div key={item.id} className="flex justify-between items-start border-b border-gray-100 pb-2 bg-gray-50/50 p-2 rounded">
                        <div>
                            <p className="font-medium">{item.productName}</p>
                            <p className="text-xs text-gray-500">
                                {item.width}m x {item.height}m ({item.area.toFixed(2)} m²)
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-blue-600">{formatCurrency(item.finalPrice)}</p>
                            <button
                                onClick={() => removeItem(item.id)}
                                className="text-xs text-red-500 hover:text-red-700 underline mt-1"
                            >
                                Remover
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center">
                <span className="font-semibold">Total:</span>
                <span className="text-xl font-bold">{formatCurrency(totalPrice)}</span>
            </div>
            <button className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition-colors shadow">
                Finalizar Compra
            </button>
        </div>
    );
}
