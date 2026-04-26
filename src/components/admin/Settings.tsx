'use client';

import React, { useEffect, useState } from 'react';
import { Icons } from './Icons';
import { getAllProducts, updateProductPricing, createProduct, deleteProduct } from '../../actions/product';
import { getSystemSettings, updateSystemSettings } from '../../actions/system';
import { Product, SystemSettings, FlexPricingConfig } from '../../types';
import { maskCNPJ, maskPhone } from '../../lib/utils/masks';

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
    const [modalMode, setModalMode] = useState<'new-product' | 'add-variant'>('new-product');
    const [newProductName, setNewProductName] = useState('');
    const [newProductCategory, setNewProductCategory] = useState('');
    const [newProductPrice, setNewProductPrice] = useState('');
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [isSavingNew, setIsSavingNew] = useState(false);

    // Add Variant Modal State
    const [variantProductId, setVariantProductId] = useState('');
    const [variantType, setVariantType] = useState<'thickness' | 'subtype'>('thickness');
    const [variantName, setVariantName] = useState('');
    const [variantPrice, setVariantPrice] = useState('');

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

    const openAddVariant = (productId: string, type: 'thickness' | 'subtype') => {
        setModalMode('add-variant');
        setVariantProductId(productId);
        setVariantType(type);
        setVariantName('');
        setVariantPrice('');
        setIsAddModalOpen(true);
    };

    const handleAddVariant = async () => {
        if (!variantProductId || !variantName.trim() || !variantPrice) return;
        setIsSavingNew(true);
        const price = parseFloat(variantPrice.replace(',', '.'));
        if (isNaN(price)) { setIsSavingNew(false); return; }
        const product = products.find(p => p.id === variantProductId);
        if (!product) { setIsSavingNew(false); return; }
        const newConfig = { ...(product.pricingConfig ?? {}) } as FlexPricingConfig;
        if (variantType === 'thickness') {
            if (!newConfig.thicknessOptions?.includes(variantName)) {
                newConfig.thicknessOptions = [...(newConfig.thicknessOptions ?? []), variantName];
            }
            newConfig.pricesByThickness = { ...(newConfig.pricesByThickness ?? {}), [variantName]: price };
        } else {
            newConfig.pricesByType = { ...(newConfig.pricesByType ?? {}), [variantName]: price };
        }
        const result = await updateProductPricing(product.id, product.pricePerM2, newConfig);
        if (result.success && result.product) {
            setProducts(prev => prev.map(p => p.id === product.id ? result.product! : p));
            setIsAddModalOpen(false);
            setVariantProductId(''); setVariantName(''); setVariantPrice('');
        }
        setIsSavingNew(false);
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
                                    onChange={e => handleSettingChange('companyCnpj', maskCNPJ(e.target.value))}
                                    placeholder="00.000.000/0000-00"
                                    inputMode="numeric"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs uppercase font-bold text-slate-500">Telefone / WhatsApp</label>
                                <input
                                    className="w-full bg-black/40 border border-white/10 rounded-lg h-10 px-3 text-white text-sm outline-none focus:border-primary"
                                    value={settings.companyPhone || ''}
                                    onChange={e => handleSettingChange('companyPhone', maskPhone(e.target.value))}
                                    placeholder="(00) 00000-0000"
                                    inputMode="tel"
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
                            onClick={() => { setModalMode('new-product'); setIsAddModalOpen(true); }}
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
                                                            {/* Header row for products with variants */}
                                                            {hasVariants && (
                                                                <tr className="bg-black/10">
                                                                    <td colSpan={2} className="px-6 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">{product.name}</td>
                                                                    <td className="py-2 pr-4 text-center">
                                                                        <button onClick={() => handleDeleteProduct(product.id)} className="text-slate-700 hover:text-red-500 transition-colors" title="Excluir produto"><Icons.Trash size={14} /></button>
                                                                    </td>
                                                                </tr>
                                                            )}

                                                            {/* Base price row (no variants) */}
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
                                                                    <td className="p-4 w-16 text-center">
                                                                        <div className="flex items-center justify-center gap-2">
                                                                            <button onClick={() => openAddVariant(product.id, 'thickness')} className="text-slate-600 hover:text-primary transition-colors" title="Adicionar variação"><Icons.Plus size={15} /></button>
                                                                            <button onClick={() => handleDeleteProduct(product.id)} className="text-slate-600 hover:text-red-500 transition-colors"><Icons.Trash size={15} /></button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )}

                                                            {/* Thickness variant rows */}
                                                            {hasThickness && cfg.thicknessOptions!.map((t: string) => {
                                                                const key = `${product.id}:thickness:${t}`;
                                                                const price = cfg.pricesByThickness?.[t] ?? product.pricePerM2;
                                                                return (
                                                                    <tr key={key} className="hover:bg-white/[0.02] group">
                                                                        <td className="p-4 pl-10 text-slate-300 flex items-center gap-2">
                                                                            <span className="text-slate-600 text-xs">┗</span>{t}
                                                                        </td>
                                                                        <td className="p-4 text-right">
                                                                            <input className={`w-24 bg-black/40 border rounded py-1 px-2 text-right text-white font-mono text-sm outline-none focus:border-primary ${editingValues[key] !== undefined ? 'border-primary' : 'border-white/10'}`}
                                                                                value={editingValues[key] ?? price.toFixed(2)}
                                                                                onChange={e => handlePriceChange(product.id, key, e.target.value)}
                                                                                onBlur={() => handlePriceBlur(product, 'thickness', t)}
                                                                            />
                                                                        </td>
                                                                        <td className="p-4 w-10 text-center"><button onClick={() => handleDeleteVariant(product, 'thickness', t)} className="text-slate-600 hover:text-red-500 transition-colors"><Icons.Trash size={15} /></button></td>
                                                                    </tr>
                                                                );
                                                            })}
                                                            {hasThickness && (
                                                                <tr>
                                                                    <td colSpan={3} className="px-10 py-2 border-t border-white/5">
                                                                        <button onClick={() => openAddVariant(product.id, 'thickness')} className="text-xs text-slate-600 hover:text-primary flex items-center gap-1 transition-colors">
                                                                            <Icons.Plus size={12} /> Adicionar espessura
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            )}

                                                            {/* Subtype variant rows */}
                                                            {hasTypes && Object.keys(cfg.pricesByType!).map((t: string) => {
                                                                const key = `${product.id}:subtype:${t}`;
                                                                const price = cfg.pricesByType![t];
                                                                return (
                                                                    <tr key={key} className="hover:bg-white/[0.02] group">
                                                                        <td className="p-4 pl-10 text-slate-300 flex items-center gap-2">
                                                                            <span className="text-slate-600 text-xs">┗</span>{t}
                                                                        </td>
                                                                        <td className="p-4 text-right">
                                                                            <input className={`w-24 bg-black/40 border rounded py-1 px-2 text-right text-white font-mono text-sm outline-none focus:border-primary ${editingValues[key] !== undefined ? 'border-primary' : 'border-white/10'}`}
                                                                                value={editingValues[key] ?? price.toFixed(2)}
                                                                                onChange={e => handlePriceChange(product.id, key, e.target.value)}
                                                                                onBlur={() => handlePriceBlur(product, 'subtype', t)}
                                                                            />
                                                                        </td>
                                                                        <td className="p-4 w-10 text-center"><button onClick={() => handleDeleteVariant(product, 'subtype', t)} className="text-slate-600 hover:text-red-500 transition-colors"><Icons.Trash size={15} /></button></td>
                                                                    </tr>
                                                                );
                                                            })}
                                                            {hasTypes && (
                                                                <tr>
                                                                    <td colSpan={3} className="px-10 py-2 border-t border-white/5">
                                                                        <button onClick={() => openAddVariant(product.id, 'subtype')} className="text-xs text-slate-600 hover:text-primary flex items-center gap-1 transition-colors">
                                                                            <Icons.Plus size={12} /> Adicionar subtipo
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            )}
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

            {/* Add / Variant Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-surface-dark border border-white/10 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-5">

                        {/* Tab selector */}
                        <div>
                            <h3 className="text-white font-bold text-lg mb-3">Gerenciar Materiais</h3>
                            <div className="flex rounded-xl border border-white/10 overflow-hidden text-sm">
                                <button
                                    onClick={() => setModalMode('new-product')}
                                    className={`flex-1 py-2 font-bold transition-colors ${modalMode === 'new-product' ? 'bg-primary text-black' : 'text-slate-400 hover:text-white'}`}
                                >
                                    Novo Produto
                                </button>
                                <button
                                    onClick={() => setModalMode('add-variant')}
                                    className={`flex-1 py-2 font-bold transition-colors ${modalMode === 'add-variant' ? 'bg-primary text-black' : 'text-slate-400 hover:text-white'}`}
                                >
                                    Adicionar Variação
                                </button>
                            </div>
                        </div>

                        {modalMode === 'new-product' ? (
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <label className="text-xs uppercase font-bold text-slate-500">Nome do Produto</label>
                                    <input value={newProductName} onChange={e => setNewProductName(e.target.value)} placeholder="Ex: Lona 500g" className="w-full bg-black/40 border border-white/10 rounded-lg h-10 px-3 text-white text-sm outline-none focus:border-primary" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs uppercase font-bold text-slate-500">Categoria</label>
                                    {!isCreatingCategory ? (
                                        <div className="flex gap-2">
                                            <select value={newProductCategory} onChange={e => setNewProductCategory(e.target.value)} className="flex-1 bg-black/40 border border-white/10 rounded-lg h-10 px-3 text-white text-sm">
                                                <option value="">Selecione...</option>
                                                {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                            <button onClick={() => setIsCreatingCategory(true)} className="bg-white/10 px-3 rounded-lg text-white" title="Nova categoria"><Icons.Plus size={18} /></button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <input value={newProductCategory} onChange={e => setNewProductCategory(e.target.value)} placeholder="Nova Categoria" className="flex-1 bg-black/40 border border-white/10 rounded-lg h-10 px-3 text-white text-sm" />
                                            <button onClick={() => setIsCreatingCategory(false)} className="bg-white/10 px-3 rounded-lg text-white"><Icons.Close size={18} /></button>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs uppercase font-bold text-slate-500">Preço Base / m²</label>
                                    <input type="number" value={newProductPrice} onChange={e => setNewProductPrice(e.target.value)} placeholder="Ex: 150.00" className="w-full bg-black/40 border border-white/10 rounded-lg h-10 px-3 text-white text-sm outline-none focus:border-primary" />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <label className="text-xs uppercase font-bold text-slate-500">Produto</label>
                                    <select value={variantProductId} onChange={e => setVariantProductId(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg h-10 px-3 text-white text-sm outline-none focus:border-primary">
                                        <option value="">Selecione o produto...</option>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.name} — {p.category}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs uppercase font-bold text-slate-500">Tipo de variação</label>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setVariantType('thickness')}
                                            className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-colors ${variantType === 'thickness' ? 'bg-primary/20 border-primary text-primary' : 'bg-black/20 border-white/10 text-slate-400 hover:text-white'}`}
                                        >
                                            Espessura
                                        </button>
                                        <button
                                            onClick={() => setVariantType('subtype')}
                                            className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-colors ${variantType === 'subtype' ? 'bg-primary/20 border-primary text-primary' : 'bg-black/20 border-white/10 text-slate-400 hover:text-white'}`}
                                        >
                                            Subtipo
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs uppercase font-bold text-slate-500">
                                        {variantType === 'thickness' ? 'Espessura' : 'Nome do subtipo'}
                                    </label>
                                    <input
                                        value={variantName}
                                        onChange={e => setVariantName(e.target.value)}
                                        placeholder={variantType === 'thickness' ? '12mm' : 'Fosco'}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg h-10 px-3 text-white text-sm outline-none focus:border-primary"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs uppercase font-bold text-slate-500">Preço / m²</label>
                                    <input
                                        type="number"
                                        value={variantPrice}
                                        onChange={e => setVariantPrice(e.target.value)}
                                        placeholder="Ex: 500.00"
                                        className="w-full bg-black/40 border border-white/10 rounded-lg h-10 px-3 text-white text-sm outline-none focus:border-primary"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-1">
                            <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white text-sm transition-colors">Cancelar</button>
                            <button
                                onClick={modalMode === 'new-product' ? handleCreateProduct : handleAddVariant}
                                disabled={isSavingNew}
                                className="px-5 py-2 bg-primary text-black font-bold rounded-lg text-sm disabled:opacity-50"
                            >
                                {isSavingNew ? '...' : 'Salvar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
