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

    const handlePriceChange = (id: string, key: string, value: string) => {
        // key is unique identifier for the field (e.g., productID for base, or productID:subtype:Fosco)
        setEditingValues(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handlePriceBlur = async (product: Product, priceType: 'base' | 'thickness' | 'subtype', variantKey?: string) => {
        const key = variantKey ? `${product.id}:${priceType}:${variantKey}` : product.id;
        const valueStr = editingValues[key];

        if (valueStr === undefined) return; // No change

        const normalizedValue = valueStr.replace(',', '.');
        const newPrice = parseFloat(normalizedValue);

        if (isNaN(newPrice)) {
            setEditingValues(prev => {
                const next = { ...prev };
                delete next[key];
                return next;
            });
            return;
        }

        setSavingId(key);

        let result;
        if (priceType === 'base') {
            result = await updateProductPricing(product.id, newPrice, product.pricingConfig);
        } else {
            // Update nested config
            const newConfig = { ...product.pricingConfig };

            if (priceType === 'thickness') {
                newConfig.pricesByThickness = {
                    ...(newConfig.pricesByThickness || {}),
                    [variantKey!]: newPrice
                };
            } else if (priceType === 'subtype') {
                newConfig.pricesByType = {
                    ...(newConfig.pricesByType || {}),
                    [variantKey!]: newPrice
                };
            }

            result = await updateProductPricing(product.id, product.pricePerM2, newConfig);
        }

        if (result.success && result.product) {
            setProducts(prev => prev.map(p => p.id === product.id ? result.product! : p));
            setEditingValues(prev => {
                const next = { ...prev };
                delete next[key];
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
                <div className="max-w-6xl mx-auto flex flex-col gap-8">

                    {/* Header Info */}
                    <div className="flex justify-between items-center bg-surface-dark/50 p-6 rounded-2xl border border-white/5 shadow-2xl">
                        <div>
                            <h3 className="text-white text-lg font-bold">Gerenciamento de Materiais</h3>
                            <p className="text-slate-400 text-sm mt-1">
                                Adicione, remova ou atualize os preços de venda.
                                <br />
                                <span className="text-xs opacity-70">Alterações refletem imediatamente na calculadora.</span>
                            </p>
                        </div>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="h-12 px-6 rounded-xl bg-primary hover:bg-primary/90 text-background-dark font-bold shadow-lg shadow-primary/20 transition-all flex items-center gap-2 group"
                        >
                            <Icons.Plus size={20} className="group-hover:rotate-90 transition-transform" />
                            Adicionar Novo Material
                        </button>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center text-slate-400">Carregando tabela de preços...</div>
                    ) : (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {uniqueCategories.sort().map(category => {
                                const categoryProducts = products.filter(p => p.category === category);
                                if (categoryProducts.length === 0) return null;

                                const itemCount = categoryProducts.reduce((acc, product) => {
                                    const hasThickness = product.pricingConfig?.thicknessOptions && product.pricingConfig.thicknessOptions.length > 0;
                                    const hasTypes = product.pricingConfig?.pricesByType && Object.keys(product.pricingConfig.pricesByType).length > 0;

                                    if (hasThickness) return acc + product.pricingConfig!.thicknessOptions!.length;
                                    if (hasTypes) return acc + Object.keys(product.pricingConfig!.pricesByType!).length;
                                    return acc + 1;
                                }, 0);

                                return (
                                    <div key={category} className="rounded-2xl border border-white/5 bg-surface-dark/50 overflow-hidden shadow-xl">
                                        <div className="p-4 border-b border-white/5 bg-black/20 flex items-center gap-3">
                                            <div className="size-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 text-primary">
                                                {getProductIcon(category)}
                                            </div>
                                            <h4 className="text-white font-bold text-lg">{category}</h4>
                                            <span className="px-2 py-0.5 rounded-full bg-white/5 text-xs text-slate-400 font-mono">
                                                {itemCount} itens
                                            </span>
                                        </div>

                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-white/10 bg-black/10 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                                                    <th className="p-4 pl-6 w-1/2">Material (Subtipo)</th>
                                                    <th className="p-4 text-right w-40">Preço Venda (m²)</th>
                                                    <th className="p-4 pr-6 w-16"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5 text-sm text-slate-300">
                                                {categoryProducts.map((product) => {
                                                    const hasThickness = product.pricingConfig?.thicknessOptions && product.pricingConfig.thicknessOptions.length > 0;
                                                    const hasTypes = product.pricingConfig?.pricesByType && Object.keys(product.pricingConfig.pricesByType).length > 0;
                                                    const hasVariants = hasThickness || hasTypes;

                                                    return (
                                                        <React.Fragment key={product.id}>
                                                            {/* Base Product Row - Only show if NO variants */}
                                                            {!hasVariants && (
                                                                <tr className="hover:bg-white/[0.02] transition-colors group">
                                                                    <td className="p-4 pl-6">
                                                                        <div className="flex items-center gap-3">
                                                                            <span className="text-white font-medium">{product.name}</span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-4 text-right">
                                                                        <div className="relative">
                                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">R$</span>
                                                                            <input
                                                                                className={`w-full bg-black/40 border rounded-lg py-1.5 pl-8 pr-2 text-right text-white font-mono text-sm focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all outline-none 
                                                                                ${savingId === product.id ? 'opacity-50' : ''} 
                                                                                ${editingValues[product.id] !== undefined ? 'border-primary/50' : 'border-white/10'}`}
                                                                                type="text"
                                                                                value={editingValues[product.id] !== undefined ? editingValues[product.id] : product.pricePerM2.toFixed(2)}
                                                                                onChange={(e) => handlePriceChange(product.id, product.id, e.target.value)}
                                                                                onBlur={() => handlePriceBlur(product, 'base')}
                                                                                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                                                                            />
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-4 pr-6 text-center">
                                                                        <button
                                                                            onClick={() => handleDeleteProduct(product.id)}
                                                                            className="text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                                            title="Excluir Material"
                                                                        >
                                                                            <Icons.Trash size={18} />
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            )}

                                                            {/* Variants: Thickness (Acrylic) */}
                                                            {hasThickness && product.pricingConfig.thicknessOptions.map((thickness: string) => {
                                                                const key = `${product.id}:thickness:${thickness}`;
                                                                const price = product.pricingConfig.pricesByThickness?.[thickness] || product.pricePerM2;
                                                                return (
                                                                    <tr key={key} className="hover:bg-white/[0.02] transition-colors group">
                                                                        <td className="p-4 pl-6">
                                                                            <div className="flex items-center gap-2">
                                                                                {/* Flattened display: Product Name + Thickness */}
                                                                                <span className="text-white font-medium">{product.name} {thickness}</span>
                                                                            </div>
                                                                        </td>
                                                                        <td className="p-4 text-right">
                                                                            <div className="relative">
                                                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">R$</span>
                                                                                <input
                                                                                    className={`w-full bg-black/40 border rounded-lg py-1.5 pl-8 pr-2 text-right text-white font-mono text-sm focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all outline-none
                                                                                    ${savingId === key ? 'opacity-50' : ''}
                                                                                    ${editingValues[key] !== undefined ? 'border-primary/50' : 'border-white/10'}`}
                                                                                    type="text"
                                                                                    value={editingValues[key] !== undefined ? editingValues[key] : price.toFixed(2)}
                                                                                    onChange={(e) => handlePriceChange(product.id, key, e.target.value)}
                                                                                    onBlur={() => handlePriceBlur(product, 'thickness', thickness)}
                                                                                    onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                                                                                />
                                                                            </div>
                                                                        </td>
                                                                        <td className="p-4 pr-6 text-center">
                                                                            {/* Optional: Add delete context for variants or keep empty */}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}

                                                            {/* Variants: Types (Adesivo) */}
                                                            {hasTypes && Object.keys(product.pricingConfig.pricesByType).map((type: string) => {
                                                                const key = `${product.id}:subtype:${type}`;
                                                                const price = product.pricingConfig.pricesByType[type];
                                                                return (
                                                                    <tr key={key} className="hover:bg-white/[0.02] transition-colors group">
                                                                        <td className="p-4 pl-6">
                                                                            <div className="flex items-center gap-2">
                                                                                {/* Flattened display: Product Name + Type */}
                                                                                <span className="text-white font-medium">{product.name} {type}</span>
                                                                            </div>
                                                                        </td>
                                                                        <td className="p-4 text-right">
                                                                            <div className="relative">
                                                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">R$</span>
                                                                                <input
                                                                                    className={`w-full bg-black/40 border rounded-lg py-1.5 pl-8 pr-2 text-right text-white font-mono text-sm focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all outline-none
                                                                                    ${savingId === key ? 'opacity-50' : ''}
                                                                                    ${editingValues[key] !== undefined ? 'border-primary/50' : 'border-white/10'}`}
                                                                                    type="text"
                                                                                    value={editingValues[key] !== undefined ? editingValues[key] : price.toFixed(2)}
                                                                                    onChange={(e) => handlePriceChange(product.id, key, e.target.value)}
                                                                                    onBlur={() => handlePriceBlur(product, 'subtype', type)}
                                                                                    onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                                                                                />
                                                                            </div>
                                                                        </td>
                                                                        <td className="p-4 pr-6 text-center">
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                );
                            })}
                        </div>
                    )}
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
