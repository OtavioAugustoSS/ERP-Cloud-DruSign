'use client';

import React, { useEffect, useState } from 'react';
import { Icons } from './Icons';
import { getAllProducts, updateProductPricing, createProduct, deleteProduct } from '../../actions/product';
import { getSystemSettings, updateSystemSettings } from '../../actions/system';
import { Product, SystemSettings, FlexPricingConfig } from '../../types';

export default function Settings() {
    // --- PRODUCT STATE ---
    const [products, setProducts] = useState<Product[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [editingValues, setEditingValues] = useState<{ [key: string]: string }>({});
    const [savingId, setSavingId] = useState<string | null>(null);

    // --- SETTINGS STATE ---
    const [settings, setSettings] = useState<SystemSettings | null>(null);
    const [loadingSettings, setLoadingSettings] = useState(true);
    const [savingSettings, setSavingSettings] = useState(false);

    // Add Product Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newProductName, setNewProductName] = useState('');
    const [newProductCategory, setNewProductCategory] = useState('');
    const [newProductPrice, setNewProductPrice] = useState('');
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [isSavingNew, setIsSavingNew] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoadingProducts(true);
        setLoadingSettings(true);

        const [pData, sData] = await Promise.all([
            getAllProducts(),
            getSystemSettings()
        ]);

        setProducts(pData);
        setSettings(sData);

        setLoadingProducts(false);
        setLoadingSettings(false);
    };

    // --- SETTINGS HANDLERS ---
    const handleSaveSettings = async () => {
        if (!settings) return;
        setSavingSettings(true);

        const result = await updateSystemSettings(settings);

        if (result.success) {
            // Optional: Show toast
            // alert('Configurações salvas!');
        } else {
            alert('Erro ao salvar.');
        }
        setSavingSettings(false);
    };

    const handleSettingChange = (field: keyof SystemSettings, value: string) => {
        if (!settings) return;
        setSettings({ ...settings, [field]: value });
    };

    // --- PRODUCT HANDLERS ---
    const handlePriceChange = (id: string, key: string, value: string) => {
        setEditingValues(prev => ({ ...prev, [key]: value }));
    };

    const handlePriceBlur = async (product: Product, priceType: 'base' | 'thickness' | 'subtype', variantKey?: string) => {
        const key = variantKey ? `${product.id}:${priceType}:${variantKey}` : product.id;
        const valueStr = editingValues[key];
        if (valueStr === undefined) return;

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
            result = await updateProductPricing(product.id, newPrice, product.pricingConfig ?? undefined);
        } else {
            const newConfig = { ...(product.pricingConfig ?? {}) } as FlexPricingConfig;
            if (priceType === 'thickness') {
                newConfig.pricesByThickness = { ...(newConfig.pricesByThickness ?? {}), [variantKey!]: newPrice };
            } else if (priceType === 'subtype') {
                newConfig.pricesByType = { ...(newConfig.pricesByType ?? {}), [variantKey!]: newPrice };
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
        if (isNaN(price)) { setIsSavingNew(false); return; }

        const result = await createProduct({
            name: newProductName,
            category: newProductCategory,
            pricePerM2: price
        });

        if (result.success && result.product) {
            setProducts(prev => [...prev, result.product!]);
            setIsAddModalOpen(false);
            setNewProductName(''); setNewProductCategory(''); setNewProductPrice('');
            setIsCreatingCategory(false);
        }
        setIsSavingNew(false);
    };

    const handleDeleteProduct = async (id: string) => {
        if (!window.confirm('Excluir produto?')) return;
        const result = await deleteProduct(id);
        if (result.success) setProducts(prev => prev.filter(p => p.id !== id));
    };

    const handleDeleteVariant = async (product: Product, type: 'thickness' | 'subtype', variantKey: string) => {
        if (!window.confirm(`Excluir variação "${variantKey}"?`)) return;
        const newConfig = { ...(product.pricingConfig ?? {}) } as FlexPricingConfig;
        if (type === 'thickness') {
            if (newConfig.pricesByThickness) { const { [variantKey]: _, ...rest } = newConfig.pricesByThickness; newConfig.pricesByThickness = rest; }
            if (newConfig.thicknessOptions) newConfig.thicknessOptions = newConfig.thicknessOptions.filter((t: string) => t !== variantKey);
        } else if (type === 'subtype') {
            if (newConfig.pricesByType) { const { [variantKey]: _, ...rest } = newConfig.pricesByType; newConfig.pricesByType = rest; }
        }
        const result = await updateProductPricing(product.id, product.pricePerM2, newConfig);
        if (result.success && result.product) setProducts(prev => prev.map(p => p.id === product.id ? result.product! : p));
    };

    const getProductIcon = (category: string) => {
        switch (category) {
            case 'Lona': return <Icons.Texture className="text-white/50" size={18} />;
            case 'Vinil': case 'Adesivo': return <Icons.Layers className="text-white/50" size={18} />;
            case 'Tecido': return <Icons.Grid className="text-white/50" size={18} />;
            case 'Papel': return <Icons.Scanner className="text-white/50" size={18} />;
            case 'ACM': case 'Rígido': case 'PS': case 'PVC': case 'Acrílico': return <Icons.Panel className="text-white/50" size={18} />;
            default: return <Icons.Texture className="text-white/50" size={18} />;
        }
    };

    const uniqueCategories = Array.from(new Set(products.map(p => p.category)));

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-background-dark">
            <header className="flex-none px-8 py-6 border-b border-white/5 bg-background-dark/50 backdrop-blur-sm z-10">
                <div className="flex flex-col gap-1">
                    <h2 className="text-white text-3xl font-bold leading-tight tracking-tight">Configurações</h2>
                    <p className="text-slate-400 text-sm font-normal">Gerencie os dados da empresa e tabela de preços.</p>
                </div>
            </header>

            <div className="flex-1 overflow-auto p-8 pt-6 space-y-8">

                {/* 1. DADOS DA EMPRESA */}
                <div className="max-w-6xl mx-auto bg-surface-dark/50 border border-white/5 rounded-2xl p-6 shadow-xl">
                    <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/20 p-2 rounded-lg text-primary"><Icons.Settings size={20} /></div>
                            <div>
                                <h3 className="text-white font-bold text-lg">Dados da Empresa</h3>
                                <p className="text-slate-400 text-xs">Informações impressas nas Ordens de Serviço.</p>
                            </div>
                        </div>
                        <button
                            onClick={handleSaveSettings}
                            disabled={savingSettings || loadingSettings}
                            className="bg-primary hover:bg-primary-hover text-black font-bold px-4 py-2 rounded-lg text-sm shadow-lg shadow-primary/20 transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            {savingSettings ? 'Salvando...' : <><Icons.Check size={16} /> Salvar Dados</>}
                        </button>
                    </div>

                    {loadingSettings ? (
                        <div className="text-slate-500 text-sm">Carregando dados...</div>
                    ) : settings && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-xs uppercase font-bold text-slate-500">Nome da Empresa</label>
                                <input
                                    className="w-full bg-black/40 border border-white/10 rounded-lg h-10 px-3 text-white text-sm outline-none focus:border-primary"
                                    value={settings.companyName}
                                    onChange={e => handleSettingChange('companyName', e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs uppercase font-bold text-slate-500">CNPJ</label>
                                <input
                                    className="w-full bg-black/40 border border-white/10 rounded-lg h-10 px-3 text-white text-sm outline-none focus:border-primary"
                                    value={settings.companyCnpj || ''}
                                    onChange={e => handleSettingChange('companyCnpj', e.target.value)}
                                    placeholder="00.000.000/0000-00"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs uppercase font-bold text-slate-500">Telefone / WhatsApp</label>
                                <input
                                    className="w-full bg-black/40 border border-white/10 rounded-lg h-10 px-3 text-white text-sm outline-none focus:border-primary"
                                    value={settings.companyPhone || ''}
                                    onChange={e => handleSettingChange('companyPhone', e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs uppercase font-bold text-slate-500">Email</label>
                                <input
                                    className="w-full bg-black/40 border border-white/10 rounded-lg h-10 px-3 text-white text-sm outline-none focus:border-primary"
                                    value={settings.companyEmail || ''}
                                    onChange={e => handleSettingChange('companyEmail', e.target.value)}
                                />
                            </div>
                            <div className="md:col-span-2 space-y-1">
                                <label className="text-xs uppercase font-bold text-slate-500">Endereço Completo</label>
                                <input
                                    className="w-full bg-black/40 border border-white/10 rounded-lg h-10 px-3 text-white text-sm outline-none focus:border-primary"
                                    value={settings.companyAddress || ''}
                                    onChange={e => handleSettingChange('companyAddress', e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* 2. TABELA DE PREÇOS (EXISTENTE) */}
                <div className="max-w-6xl mx-auto flex flex-col gap-8 pb-12">
                    <div className="flex justify-between items-center bg-surface-dark/50 p-6 rounded-2xl border border-white/5 shadow-xl">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/5 p-2 rounded-lg text-white"><Icons.DollarSign size={20} /></div>
                            <div>
                                <h3 className="text-white text-lg font-bold">Gerenciamento de Materiais e Preços</h3>
                                <p className="text-slate-400 text-sm mt-1">Preços base p/ Calculadora.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="h-10 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold transition-all flex items-center gap-2 group"
                        >
                            <Icons.Plus size={18} /> Novo Material
                        </button>
                    </div>

                    {loadingProducts ? (
                        <div className="text-center text-slate-400">Carregando materias...</div>
                    ) : (
                        <div className="space-y-6">
                            {uniqueCategories.sort().map(category => {
                                const categoryProducts = products.filter(p => p.category === category);
                                if (categoryProducts.length === 0) return null;
                                return (
                                    <div key={category} className="rounded-2xl border border-white/5 bg-surface-dark/50 overflow-hidden shadow-lg">
                                        <div className="p-4 border-b border-white/5 bg-black/20 flex items-center gap-3">
                                            <div className="size-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 text-primary">
                                                {getProductIcon(category)}
                                            </div>
                                            <h4 className="text-white font-bold">{category}</h4>
                                        </div>
                                        <table className="w-full text-left border-collapse">
                                            <tbody className="divide-y divide-white/5 text-sm text-slate-300">
                                                {categoryProducts.map((product) => {
                                                    const cfg = (product.pricingConfig ?? {}) as FlexPricingConfig;
                                                    const hasThickness = (cfg.thicknessOptions?.length ?? 0) > 0;
                                                    const hasTypes = Object.keys(cfg.pricesByType ?? {}).length > 0;
                                                    const hasVariants = hasThickness || hasTypes;

                                                    return (
                                                        <React.Fragment key={product.id}>
                                                            {!hasVariants && (
                                                                <tr className="hover:bg-white/[0.02] group">
                                                                    <td className="p-4 pl-6 text-white font-medium">{product.name}</td>
                                                                    <td className="p-4 text-right">
                                                                        <input
                                                                            className={`w-24 bg-black/40 border rounded py-1 px-2 text-right text-white font-mono text-sm outline-none focus:border-primary ${editingValues[product.id] !== undefined ? 'border-primary' : 'border-white/10'}`}
                                                                            value={editingValues[product.id] ?? product.pricePerM2.toFixed(2)}
                                                                            onChange={e => handlePriceChange(product.id, product.id, e.target.value)}
                                                                            onBlur={() => handlePriceBlur(product, 'base')}
                                                                        />
                                                                    </td>
                                                                    <td className="p-4 w-10 text-center"><button onClick={() => handleDeleteProduct(product.id)} className="text-slate-600 hover:text-red-500"><Icons.Trash size={16} /></button></td>
                                                                </tr>
                                                            )}
                                                            {hasThickness && cfg.thicknessOptions!.map((t: string) => {
                                                                const key = `${product.id}:thickness:${t}`;
                                                                const price = cfg.pricesByThickness?.[t] ?? product.pricePerM2;
                                                                return (
                                                                    <tr key={key} className="hover:bg-white/[0.02] group">
                                                                        <td className="p-4 pl-6 text-white font-medium">{product.name} {t}</td>
                                                                        <td className="p-4 text-right">
                                                                            <input className={`w-24 bg-black/40 border rounded py-1 px-2 text-right text-white font-mono text-sm outline-none focus:border-primary ${editingValues[key] !== undefined ? 'border-primary' : 'border-white/10'}`}
                                                                                value={editingValues[key] ?? price.toFixed(2)}
                                                                                onChange={e => handlePriceChange(product.id, key, e.target.value)}
                                                                                onBlur={() => handlePriceBlur(product, 'thickness', t)}
                                                                            />
                                                                        </td>
                                                                        <td className="p-4 w-10 text-center"><button onClick={() => handleDeleteVariant(product, 'thickness', t)} className="text-slate-600 hover:text-red-500"><Icons.Trash size={16} /></button></td>
                                                                    </tr>
                                                                )
                                                            })}
                                                            {hasTypes && Object.keys(cfg.pricesByType!).map((t: string) => {
                                                                const key = `${product.id}:subtype:${t}`;
                                                                const price = cfg.pricesByType![t];
                                                                return (
                                                                    <tr key={key} className="hover:bg-white/[0.02] group">
                                                                        <td className="p-4 pl-6 text-white font-medium">{product.name} {t}</td>
                                                                        <td className="p-4 text-right">
                                                                            <input className={`w-24 bg-black/40 border rounded py-1 px-2 text-right text-white font-mono text-sm outline-none focus:border-primary ${editingValues[key] !== undefined ? 'border-primary' : 'border-white/10'}`}
                                                                                value={editingValues[key] ?? price.toFixed(2)}
                                                                                onChange={e => handlePriceChange(product.id, key, e.target.value)}
                                                                                onBlur={() => handlePriceBlur(product, 'subtype', t)}
                                                                            />
                                                                        </td>
                                                                        <td className="p-4 w-10 text-center"><button onClick={() => handleDeleteVariant(product, 'subtype', t)} className="text-slate-600 hover:text-red-500"><Icons.Trash size={16} /></button></td>
                                                                    </tr>
                                                                )
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

            {/* Add Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-surface-dark border border-white/10 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
                        <h3 className="text-white font-bold text-lg">Novo Material</h3>
                        <input value={newProductName} onChange={e => setNewProductName(e.target.value)} placeholder="Nome" className="w-full bg-black/40 border border-white/10 rounded-lg h-10 px-3 text-white" />
                        {!isCreatingCategory ? (
                            <div className="flex gap-2">
                                <select value={newProductCategory} onChange={e => setNewProductCategory(e.target.value)} className="flex-1 bg-black/40 border border-white/10 rounded-lg h-10 px-3 text-white">
                                    <option value="">Categoria...</option>
                                    {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <button onClick={() => setIsCreatingCategory(true)} className="bg-white/10 px-3 rounded-lg text-white"><Icons.Plus size={18} /></button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <input value={newProductCategory} onChange={e => setNewProductCategory(e.target.value)} placeholder="Nova Categoria" className="flex-1 bg-black/40 border border-white/10 rounded-lg h-10 px-3 text-white" />
                                <button onClick={() => setIsCreatingCategory(false)} className="bg-white/10 px-3 rounded-lg text-white"><Icons.Close size={18} /></button>
                            </div>
                        )}
                        <input type="number" value={newProductPrice} onChange={e => setNewProductPrice(e.target.value)} placeholder="Preço/m²" className="w-full bg-black/40 border border-white/10 rounded-lg h-10 px-3 text-white" />
                        <div className="flex justify-end gap-2 pt-2">
                            <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-white">Cancelar</button>
                            <button onClick={handleCreateProduct} className="px-4 py-2 bg-primary text-black font-bold rounded-lg">{isSavingNew ? '...' : 'Salvar'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
