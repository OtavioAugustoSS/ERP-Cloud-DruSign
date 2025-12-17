'use client';

import React, { useEffect, useState } from 'react';
import { Icons } from './Icons';
import { getAllProducts, updateProductPricing, createProduct, deleteProduct } from '../../actions/product';
import { Product } from '../../types';
import { formatCurrency } from '../../lib/utils/price';

export default function Settings() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingValues, setEditingValues] = useState<{ [key: string]: string }>({});
    const [savingId, setSavingId] = useState<string | null>(null);

    // Add Product Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newProductName, setNewProductName] = useState('');
    const [newProductCategory, setNewProductCategory] = useState('');
    const [newProductPrice, setNewProductPrice] = useState('');
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [isSavingNew, setIsSavingNew] = useState(false);

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

    const handleCreateProduct = async () => {
        if (!newProductName || !newProductCategory || !newProductPrice) return;

        setIsSavingNew(true);
        const price = parseFloat(newProductPrice.replace(',', '.'));

        if (isNaN(price)) {
            setIsSavingNew(false);
            return;
        }

        const result = await createProduct({
            name: newProductName,
            category: newProductCategory,
            pricePerM2: price
        });

        if (result.success && result.product) {
            setProducts(prev => [...prev, result.product!]);
            setIsAddModalOpen(false);
            setNewProductName('');
            setNewProductCategory('');
            setNewProductPrice('');
            setIsCreatingCategory(false);
        }
        setIsSavingNew(false);
    };

    const handleDeleteProduct = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja excluir questo produto?')) return;

        const result = await deleteProduct(id);
        if (result.success) {
            setProducts(prev => prev.filter(p => p.id !== id));
        }
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

    const uniqueCategories = Array.from(new Set(products.map(p => p.category)));

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-background-dark">
            <header className="flex-none px-8 py-6 border-b border-white/5 bg-background-dark/50 backdrop-blur-sm z-10">
                <div className="flex flex-wrap justify-between items-end gap-4">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-white text-3xl font-bold leading-tight tracking-tight">Tabela de Preços</h2>
                        <p className="text-slate-400 text-sm font-normal">Gerencie os valores base de materiais por metro quadrado.</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="flex gap-3">
                            {/* Button removed as per request */}
                        </div>
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
                                <button
                                    onClick={() => setIsAddModalOpen(true)}
                                    className="size-8 rounded-full hover:bg-white/5 flex items-center justify-center text-slate-400 hover:text-primary transition-colors"
                                    title="Adicionar Novo Material"
                                >
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
                                                <button
                                                    onClick={() => handleDeleteProduct(product.id)}
                                                    className="text-slate-500 hover:text-red-400 transition-colors"
                                                >
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

            {/* Add Product Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-surface-dark border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-white/5 bg-white/5 flex justify-between items-center">
                            <h3 className="text-white text-lg font-bold">Adicionar Novo Material</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                                <Icons.Close size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Nome do Material</label>
                                <input
                                    type="text"
                                    value={newProductName}
                                    onChange={(e) => setNewProductName(e.target.value)}
                                    placeholder="Ex: Adesivo Holográfico"
                                    className="w-full h-12 rounded-xl bg-black/40 border border-white/10 focus:border-primary text-white text-sm px-4 focus:ring-1 focus:ring-primary transition-all outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Categoria</label>
                                {!isCreatingCategory ? (
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <select
                                                value={newProductCategory}
                                                onChange={(e) => setNewProductCategory(e.target.value)}
                                                className="w-full h-12 rounded-xl bg-black/40 border border-white/10 focus:border-primary text-white text-sm px-4 focus:ring-1 focus:ring-primary transition-all outline-none appearance-none cursor-pointer"
                                            >
                                                <option value="" disabled className="bg-slate-900">Selecione uma categoria...</option>
                                                {uniqueCategories.map(cat => (
                                                    <option key={cat} value={cat} className="bg-slate-900 text-white">{cat}</option>
                                                ))}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                                                <Icons.ChevronDown size={18} />
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => { setIsCreatingCategory(true); setNewProductCategory(''); }}
                                            className="px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors"
                                            title="Nova Categoria"
                                        >
                                            <Icons.Plus size={18} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newProductCategory}
                                            onChange={(e) => setNewProductCategory(e.target.value)}
                                            placeholder="Nome da Nova Categoria"
                                            className="flex-1 h-12 rounded-xl bg-black/40 border border-white/10 focus:border-primary text-white text-sm px-4 focus:ring-1 focus:ring-primary transition-all outline-none"
                                            autoFocus
                                        />
                                        <button
                                            onClick={() => setIsCreatingCategory(false)}
                                            className="px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors"
                                            title="Cancelar Nova Categoria"
                                        >
                                            <Icons.Close size={18} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Preço por m² (R$)</label>
                                <input
                                    type="number"
                                    value={newProductPrice}
                                    onChange={(e) => setNewProductPrice(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full h-12 rounded-xl bg-black/40 border border-white/10 focus:border-primary text-white text-sm px-4 focus:ring-1 focus:ring-primary transition-all outline-none"
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-white/5 bg-white/5 flex justify-end gap-3">
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="px-4 py-2 rounded-lg hover:bg-white/10 text-white font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreateProduct}
                                disabled={!newProductName || !newProductCategory || !newProductPrice || isSavingNew}
                                className="px-6 py-2 rounded-lg bg-primary hover:bg-primary/90 text-background-dark font-bold shadow-lg shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSavingNew ? 'Salvando...' : 'Adicionar Item'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
