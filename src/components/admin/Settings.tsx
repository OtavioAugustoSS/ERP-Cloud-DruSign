'use client';

import React, { useEffect, useState } from 'react';
import { Icons } from './Icons';
import { getAllProducts, updateProductPricing } from '../../actions/product';
import { Product } from '../../types';
import { formatCurrency } from '../../lib/utils/price';

export default function Settings() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingValues, setEditingValues] = useState<{ [key: string]: string }>({});
    const [savingId, setSavingId] = useState<string | null>(null);

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        setLoading(true);
        const data = await getAllProducts();
        setProducts(data);
        setLoading(false);
    };

    const handlePriceChange = (id: string, value: string) => {
        setEditingValues(prev => ({
            ...prev,
            [id]: value
        }));
    };

    const handlePriceBlur = async (id: string) => {
        const valueStr = editingValues[id];
        if (valueStr === undefined) return; // No change

        // Parse value (handling commas for decimals if user types like PT-BR)
        const normalizedValue = valueStr.replace(',', '.');
        const newPrice = parseFloat(normalizedValue);

        if (isNaN(newPrice)) {
            // Revert if invalid
            setEditingValues(prev => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
            return;
        }

        setSavingId(id);
        const result = await updateProductPricing(id, newPrice);

        if (result.success && result.product) {
            // Update local state to reflect confirmed save
            setProducts(prev => prev.map(p => p.id === id ? result.product! : p));

            // Clear editing state so it shows the formatted value again
            setEditingValues(prev => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
        }
        setSavingId(null);
    };

    const getProductIcon = (category: string) => {
        switch (category) {
            case 'Lona': return <Icons.Texture className="text-white/50" size={18} />;
            case 'Vinil':
            case 'Adesivo': return <Icons.Layers className="text-white/50" size={18} />;
            case 'Tecido': return <Icons.Grid className="text-white/50" size={18} />;
            case 'Papel': return <Icons.Scanner className="text-white/50" size={18} />;
            case 'ACM':
            case 'Rígido':
            case 'PS':
            case 'PVC':
            case 'Acrílico': return <Icons.Panel className="text-white/50" size={18} />;
            default: return <Icons.Texture className="text-white/50" size={18} />;
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-background-dark">
            <header className="flex-none px-8 py-6 border-b border-white/5 bg-background-dark/50 backdrop-blur-sm z-10">
                <div className="flex flex-wrap justify-between items-end gap-4">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-white text-3xl font-bold leading-tight tracking-tight">Tabela de Preços</h2>
                        <p className="text-slate-400 text-sm font-normal">Gerencie os valores base de materiais por metro quadrado.</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="flex items-center justify-center gap-2 rounded-full h-10 px-6 bg-white/5 hover:bg-white/10 text-white text-sm font-bold tracking-wide transition-all border border-white/10">
                            <Icons.History size={20} />
                            <span>Log de Alterações</span>
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-auto p-8 pt-6">
                <div className="max-w-6xl mx-auto flex flex-col gap-6">
                    <div className="w-full rounded-2xl border border-white/5 bg-surface-dark/50 overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
                            <h3 className="text-white text-lg font-bold">Preço por m²</h3>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400 mr-2">Última atualização: Hoje, 10:42</span>
                                <button className="size-8 rounded-full hover:bg-white/5 flex items-center justify-center text-slate-400 transition-colors">
                                    <Icons.Plus size={18} />
                                </button>
                            </div>
                        </div>
                        {loading ? (
                            <div className="p-12 text-center text-slate-400">Carregando tabela de preços...</div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/10 bg-black/20 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                                        <th className="p-4 pl-6">Material</th>
                                        <th className="p-4">Tipo</th>
                                        <th className="p-4 text-right w-40">Preço Venda (m²)</th>
                                        <th className="p-4 pr-6 w-16"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-sm text-slate-300">
                                    {products.map((product) => (
                                        <tr key={product.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="p-4 pl-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-8 rounded bg-white/5 flex items-center justify-center border border-white/10">
                                                        {getProductIcon(product.category)}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-white font-medium">{product.name}</span>
                                                        <span className="text-xs text-slate-500">{product.category}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4"><span className="px-2 py-1 rounded-md bg-white/10 text-xs text-slate-400">{product.category}</span></td>
                                            <td className="p-4 text-right">
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">R$</span>
                                                    <input
                                                        className={`w-full bg-black/40 border rounded-lg py-1.5 pl-8 pr-2 text-right text-white font-mono text-sm focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all outline-none ${savingId === product.id ? 'opacity-50' : ''} ${editingValues[product.id] !== undefined ? 'border-primary/50' : 'border-white/10'}`}
                                                        type="text" // using text to allow comma typing
                                                        value={editingValues[product.id] !== undefined ? editingValues[product.id] : product.pricePerM2.toFixed(2)}
                                                        onChange={(e) => handlePriceChange(product.id, e.target.value)}
                                                        onBlur={() => handlePriceBlur(product.id)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.currentTarget.blur();
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </td>
                                            <td className="p-4 pr-6 text-center">
                                                <button className="text-slate-500 hover:text-red-400 transition-colors">
                                                    <Icons.Trash size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 flex gap-4 items-center">
                        <Icons.Alert className="text-yellow-500 flex-none" size={20} />
                        <div>
                            <p className="text-slate-400 text-sm">Alterações salvas aqui impactarão imediatamente o calculador de preços no site. Pedidos em rascunho serão recalculados automaticamente.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
