'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Icons } from './Icons';
import { getAllProducts, updateProductPricing, createProduct, deleteProduct } from '../../actions/product';
import { getSystemSettings, updateSystemSettings } from '../../actions/system';
import GlobalLoader from '../ui/GlobalLoader';
import { Product, SystemSettings, FlexPricingConfig } from '../../types';
import { maskCNPJ, maskPhone } from '../../lib/utils/masks';

type ToastState = { type: 'success' | 'error'; message: string } | null;

function Spinner({ size = 14 }: { size?: number }) {
    return (
        <div
            className="rounded-full border-2 border-current border-t-transparent animate-spin opacity-70"
            style={{ width: size, height: size }}
        />
    );
}

export default function Settings() {
    // --- PRODUCT STATE ---
    const [products, setProducts] = useState<Product[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [editingValues, setEditingValues] = useState<{ [key: string]: string }>({});
    const [savingId, setSavingId] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

    // --- SETTINGS STATE ---
    const [settings, setSettings] = useState<SystemSettings | null>(null);
    const [loadingSettings, setLoadingSettings] = useState(true);
    const [savingSettings, setSavingSettings] = useState(false);
    const [toast, setToast] = useState<ToastState>(null);

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

    const showToast = useCallback((type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3000);
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
            showToast('success', 'Dados da empresa salvos com sucesso!');
        } else {
            showToast('error', 'Erro ao salvar dados da empresa.');
        }
        setSavingSettings(false);
    };

    const handleSettingChange = (field: keyof SystemSettings, value: string) => {
        if (!settings) return;
        setSettings({ ...settings, [field]: value });
    };

    // --- PRODUCT HANDLERS ---
    const handlePriceChange = (_id: string, key: string, value: string) => {
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
        setConfirmDelete(null);
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
        setConfirmDelete(null);
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

            {/* Header */}
            <header className="flex-none px-8 py-6 border-b border-white/5 bg-background-dark/50 backdrop-blur-sm z-10">
                <div className="flex flex-col gap-1 animate-fade-in-up">
                    <h2 className="text-white text-3xl font-bold leading-tight tracking-tight">Configurações</h2>
                    <p className="text-slate-400 text-sm font-normal">Gerencie os dados da empresa e tabela de preços.</p>
                </div>
            </header>

            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-[60] flex items-center gap-3 px-5 py-3 rounded-xl border shadow-2xl animate-fade-in-up ${
                    toast.type === 'success'
                        ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-400'
                        : 'bg-red-950/80 border-red-500/30 text-red-400'
                } backdrop-blur-md`}>
                    {toast.type === 'success'
                        ? <Icons.Check size={15} />
                        : <Icons.X size={15} />
                    }
                    <span className="text-sm font-medium">{toast.message}</span>
                </div>
            )}

            <div className="flex-1 overflow-auto p-8 pt-6 space-y-8">

                {/* ── 1. DADOS DA EMPRESA ── */}
                <div className="max-w-6xl mx-auto bg-surface-dark/50 border border-white/5 rounded-2xl p-6 shadow-xl animate-fade-in-up animate-delay-100">
                    <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/15 p-2 rounded-lg text-primary">
                                <Icons.Settings size={20} />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-lg">Dados da Empresa</h3>
                                <p className="text-slate-500 text-xs">Informações impressas nas Ordens de Serviço.</p>
                            </div>
                        </div>

                        <button
                            onClick={handleSaveSettings}
                            disabled={savingSettings || loadingSettings}
                            className="relative overflow-hidden group bg-primary text-black font-bold px-4 py-2 rounded-lg text-sm shadow-lg shadow-primary/20 transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            <span className="absolute inset-0 bg-primary-hover translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 rounded-lg" />
                            <span className="relative flex items-center gap-2">
                                {savingSettings ? (
                                    <><Spinner size={13} /> Salvando...</>
                                ) : (
                                    <><Icons.Check size={15} /> Salvar Dados</>
                                )}
                            </span>
                        </button>
                    </div>

                    {loadingSettings ? (
                        <div className="flex justify-center py-8">
                            <GlobalLoader text="CARREGANDO DADOS..." />
                        </div>
                    ) : settings && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Nome da Empresa</label>
                                <input
                                    className="w-full bg-black/40 border border-white/10 rounded-lg h-10 px-3 text-white text-sm outline-none focus:border-primary transition-colors placeholder:text-slate-600"
                                    value={settings.companyName}
                                    onChange={e => handleSettingChange('companyName', e.target.value)}
                                    placeholder="Ex: DruSign Gráfica"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">CNPJ</label>
                                <input
                                    className="w-full bg-black/40 border border-white/10 rounded-lg h-10 px-3 text-white text-sm outline-none focus:border-primary transition-colors placeholder:text-slate-600"
                                    value={settings.companyCnpj || ''}
                                    onChange={e => handleSettingChange('companyCnpj', maskCNPJ(e.target.value))}
                                    placeholder="00.000.000/0000-00"
                                    inputMode="numeric"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Telefone / WhatsApp</label>
                                <input
                                    className="w-full bg-black/40 border border-white/10 rounded-lg h-10 px-3 text-white text-sm outline-none focus:border-primary transition-colors placeholder:text-slate-600"
                                    value={settings.companyPhone || ''}
                                    onChange={e => handleSettingChange('companyPhone', maskPhone(e.target.value))}
                                    placeholder="(00) 00000-0000"
                                    inputMode="tel"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Email</label>
                                <input
                                    className="w-full bg-black/40 border border-white/10 rounded-lg h-10 px-3 text-white text-sm outline-none focus:border-primary transition-colors placeholder:text-slate-600"
                                    value={settings.companyEmail || ''}
                                    onChange={e => handleSettingChange('companyEmail', e.target.value)}
                                    placeholder="contato@empresa.com"
                                />
                            </div>
                            <div className="md:col-span-2 space-y-1.5">
                                <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Endereço Completo</label>
                                <input
                                    className="w-full bg-black/40 border border-white/10 rounded-lg h-10 px-3 text-white text-sm outline-none focus:border-primary transition-colors placeholder:text-slate-600"
                                    value={settings.companyAddress || ''}
                                    onChange={e => handleSettingChange('companyAddress', e.target.value)}
                                    placeholder="Rua, número, bairro, cidade — UF"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* ── 2. TABELA DE PREÇOS ── */}
                <div className="max-w-6xl mx-auto flex flex-col gap-6 pb-12 animate-fade-in-up animate-delay-200">

                    {/* Cabeçalho da seção */}
                    <div className="flex justify-between items-center bg-surface-dark/50 p-6 rounded-2xl border border-white/5 shadow-xl">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/5 p-2 rounded-lg text-slate-400">
                                <Icons.DollarSign size={20} />
                            </div>
                            <div>
                                <h3 className="text-white text-lg font-bold">Materiais e Preços</h3>
                                <p className="text-slate-500 text-sm">Preços base utilizados na Calculadora de OS.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => { setModalMode('new-product'); setIsAddModalOpen(true); }}
                            className="relative overflow-hidden group h-10 px-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold transition-all flex items-center gap-2"
                        >
                            <span className="absolute inset-0 bg-white/[0.08] translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 rounded-xl" />
                            <span className="relative flex items-center gap-2 text-sm">
                                <Icons.Plus size={16} /> Novo Material
                            </span>
                        </button>
                    </div>

                    {loadingProducts ? (
                        <div className="flex justify-center py-12">
                            <GlobalLoader text="CARREGANDO MATERIAIS..." />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {uniqueCategories.sort().map(category => {
                                const categoryProducts = products.filter(p => p.category === category);
                                if (categoryProducts.length === 0) return null;

                                return (
                                    <div key={category} className="rounded-2xl border border-white/5 bg-surface-dark/50 overflow-hidden shadow-lg">
                                        {/* Cabeçalho da categoria */}
                                        <div className="px-5 py-3 border-b border-white/5 bg-black/20 flex items-center gap-3">
                                            <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
                                                {getProductIcon(category)}
                                            </div>
                                            <h4 className="text-white font-semibold text-sm">{category}</h4>
                                        </div>

                                        <table className="w-full text-left border-collapse">
                                            <tbody className="divide-y divide-white/[0.04] text-sm text-slate-300">
                                                {categoryProducts.map((product) => {
                                                    const cfg = (product.pricingConfig ?? {}) as FlexPricingConfig;
                                                    const hasThickness = (cfg.thicknessOptions?.length ?? 0) > 0;
                                                    const hasTypes = Object.keys(cfg.pricesByType ?? {}).length > 0;
                                                    const hasVariants = hasThickness || hasTypes;
                                                    const productDeleteKey = `product:${product.id}`;
                                                    const confirmingProductDelete = confirmDelete === productDeleteKey;

                                                    return (
                                                        <React.Fragment key={product.id}>

                                                            {/* Linha-header para produtos com variantes */}
                                                            {hasVariants && (
                                                                <tr className="bg-black/10">
                                                                    <td colSpan={2} className="px-6 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                                        {product.name}
                                                                    </td>
                                                                    <td className="py-2 pr-5 text-right">
                                                                        {confirmingProductDelete ? (
                                                                            <div className="flex items-center justify-end gap-1.5 animate-fade-in">
                                                                                <button
                                                                                    onClick={() => handleDeleteProduct(product.id)}
                                                                                    className="text-xs px-2.5 py-1 bg-red-500/15 text-red-400 border border-red-500/25 rounded-lg hover:bg-red-500/25 transition-colors font-medium"
                                                                                >
                                                                                    Confirmar
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => setConfirmDelete(null)}
                                                                                    className="text-xs px-2 py-1 bg-white/5 text-slate-400 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                                                                                >
                                                                                    <Icons.X size={12} />
                                                                                </button>
                                                                            </div>
                                                                        ) : (
                                                                            <button
                                                                                onClick={() => setConfirmDelete(productDeleteKey)}
                                                                                className="text-slate-700 hover:text-red-500 transition-colors p-1"
                                                                                title="Excluir produto"
                                                                            >
                                                                                <Icons.Trash size={14} />
                                                                            </button>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            )}

                                                            {/* Linha de preço base (sem variantes) */}
                                                            {!hasVariants && (
                                                                <tr className="hover:bg-white/[0.02] transition-colors">
                                                                    <td className="p-4 pl-6 text-white font-medium">{product.name}</td>
                                                                    <td className="p-4 text-right">
                                                                        <div className="flex items-center justify-end gap-2">
                                                                            {savingId === product.id && <Spinner size={12} />}
                                                                            <input
                                                                                className={`w-24 bg-black/40 border rounded-lg py-1 px-2 text-right text-white font-mono text-sm outline-none transition-colors focus:border-primary ${editingValues[product.id] !== undefined ? 'border-primary' : 'border-white/10'}`}
                                                                                value={editingValues[product.id] ?? product.pricePerM2.toFixed(2)}
                                                                                onChange={e => handlePriceChange(product.id, product.id, e.target.value)}
                                                                                onBlur={() => handlePriceBlur(product, 'base')}
                                                                            />
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-4 pr-5 w-24 text-right">
                                                                        {confirmingProductDelete ? (
                                                                            <div className="flex items-center justify-end gap-1.5 animate-fade-in">
                                                                                <button
                                                                                    onClick={() => handleDeleteProduct(product.id)}
                                                                                    className="text-xs px-2.5 py-1 bg-red-500/15 text-red-400 border border-red-500/25 rounded-lg hover:bg-red-500/25 transition-colors font-medium"
                                                                                >
                                                                                    Confirmar
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => setConfirmDelete(null)}
                                                                                    className="text-slate-600 hover:text-slate-400 transition-colors"
                                                                                >
                                                                                    <Icons.X size={13} />
                                                                                </button>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="flex items-center justify-end gap-2">
                                                                                <button
                                                                                    onClick={() => openAddVariant(product.id, 'thickness')}
                                                                                    className="text-slate-600 hover:text-primary transition-colors p-0.5"
                                                                                    title="Adicionar variação"
                                                                                >
                                                                                    <Icons.Plus size={15} />
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => setConfirmDelete(productDeleteKey)}
                                                                                    className="text-slate-600 hover:text-red-500 transition-colors p-0.5"
                                                                                >
                                                                                    <Icons.Trash size={15} />
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            )}

                                                            {/* Linhas de espessura */}
                                                            {hasThickness && cfg.thicknessOptions!.map((t: string) => {
                                                                const key = `${product.id}:thickness:${t}`;
                                                                const variantDeleteKey = `thickness:${product.id}:${t}`;
                                                                const confirmingVariantDelete = confirmDelete === variantDeleteKey;
                                                                const price = cfg.pricesByThickness?.[t] ?? product.pricePerM2;
                                                                return (
                                                                    <tr key={key} className="hover:bg-white/[0.02] transition-colors">
                                                                        <td className="p-4 pl-10 text-slate-400 flex items-center gap-2">
                                                                            <span className="text-slate-700 text-xs">┗</span>
                                                                            <span>{t}</span>
                                                                        </td>
                                                                        <td className="p-4 text-right">
                                                                            <div className="flex items-center justify-end gap-2">
                                                                                {savingId === key && <Spinner size={12} />}
                                                                                <input
                                                                                    className={`w-24 bg-black/40 border rounded-lg py-1 px-2 text-right text-white font-mono text-sm outline-none transition-colors focus:border-primary ${editingValues[key] !== undefined ? 'border-primary' : 'border-white/10'}`}
                                                                                    value={editingValues[key] ?? price.toFixed(2)}
                                                                                    onChange={e => handlePriceChange(product.id, key, e.target.value)}
                                                                                    onBlur={() => handlePriceBlur(product, 'thickness', t)}
                                                                                />
                                                                            </div>
                                                                        </td>
                                                                        <td className="p-4 pr-5 w-24 text-right">
                                                                            {confirmingVariantDelete ? (
                                                                                <div className="flex items-center justify-end gap-1.5 animate-fade-in">
                                                                                    <button
                                                                                        onClick={() => handleDeleteVariant(product, 'thickness', t)}
                                                                                        className="text-xs px-2.5 py-1 bg-red-500/15 text-red-400 border border-red-500/25 rounded-lg hover:bg-red-500/25 transition-colors font-medium"
                                                                                    >
                                                                                        Confirmar
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => setConfirmDelete(null)}
                                                                                        className="text-slate-600 hover:text-slate-400 transition-colors"
                                                                                    >
                                                                                        <Icons.X size={13} />
                                                                                    </button>
                                                                                </div>
                                                                            ) : (
                                                                                <button
                                                                                    onClick={() => setConfirmDelete(variantDeleteKey)}
                                                                                    className="text-slate-600 hover:text-red-500 transition-colors p-0.5"
                                                                                >
                                                                                    <Icons.Trash size={14} />
                                                                                </button>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                            {hasThickness && (
                                                                <tr>
                                                                    <td colSpan={3} className="px-10 py-2 border-t border-white/[0.04]">
                                                                        <button
                                                                            onClick={() => openAddVariant(product.id, 'thickness')}
                                                                            className="text-xs text-slate-600 hover:text-primary flex items-center gap-1 transition-colors"
                                                                        >
                                                                            <Icons.Plus size={11} /> Adicionar espessura
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            )}

                                                            {/* Linhas de subtipo */}
                                                            {hasTypes && Object.keys(cfg.pricesByType!).map((t: string) => {
                                                                const key = `${product.id}:subtype:${t}`;
                                                                const variantDeleteKey = `subtype:${product.id}:${t}`;
                                                                const confirmingVariantDelete = confirmDelete === variantDeleteKey;
                                                                const price = cfg.pricesByType![t];
                                                                return (
                                                                    <tr key={key} className="hover:bg-white/[0.02] transition-colors">
                                                                        <td className="p-4 pl-10 text-slate-400 flex items-center gap-2">
                                                                            <span className="text-slate-700 text-xs">┗</span>
                                                                            <span>{t}</span>
                                                                        </td>
                                                                        <td className="p-4 text-right">
                                                                            <div className="flex items-center justify-end gap-2">
                                                                                {savingId === key && <Spinner size={12} />}
                                                                                <input
                                                                                    className={`w-24 bg-black/40 border rounded-lg py-1 px-2 text-right text-white font-mono text-sm outline-none transition-colors focus:border-primary ${editingValues[key] !== undefined ? 'border-primary' : 'border-white/10'}`}
                                                                                    value={editingValues[key] ?? price.toFixed(2)}
                                                                                    onChange={e => handlePriceChange(product.id, key, e.target.value)}
                                                                                    onBlur={() => handlePriceBlur(product, 'subtype', t)}
                                                                                />
                                                                            </div>
                                                                        </td>
                                                                        <td className="p-4 pr-5 w-24 text-right">
                                                                            {confirmingVariantDelete ? (
                                                                                <div className="flex items-center justify-end gap-1.5 animate-fade-in">
                                                                                    <button
                                                                                        onClick={() => handleDeleteVariant(product, 'subtype', t)}
                                                                                        className="text-xs px-2.5 py-1 bg-red-500/15 text-red-400 border border-red-500/25 rounded-lg hover:bg-red-500/25 transition-colors font-medium"
                                                                                    >
                                                                                        Confirmar
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => setConfirmDelete(null)}
                                                                                        className="text-slate-600 hover:text-slate-400 transition-colors"
                                                                                    >
                                                                                        <Icons.X size={13} />
                                                                                    </button>
                                                                                </div>
                                                                            ) : (
                                                                                <button
                                                                                    onClick={() => setConfirmDelete(variantDeleteKey)}
                                                                                    className="text-slate-600 hover:text-red-500 transition-colors p-0.5"
                                                                                >
                                                                                    <Icons.Trash size={14} />
                                                                                </button>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                            {hasTypes && (
                                                                <tr>
                                                                    <td colSpan={3} className="px-10 py-2 border-t border-white/[0.04]">
                                                                        <button
                                                                            onClick={() => openAddVariant(product.id, 'subtype')}
                                                                            className="text-xs text-slate-600 hover:text-primary flex items-center gap-1 transition-colors"
                                                                        >
                                                                            <Icons.Plus size={11} /> Adicionar subtipo
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

                            {!loadingProducts && uniqueCategories.length === 0 && (
                                <div className="text-center py-16 text-slate-600">
                                    <Icons.DollarSign size={32} className="mx-auto mb-3 opacity-30" />
                                    <p className="text-sm">Nenhum material cadastrado.</p>
                                    <p className="text-xs mt-1">Clique em &ldquo;Novo Material&rdquo; para começar.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Modal de Adicionar / Variação ── */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
                    <div className="bg-surface-dark border border-white/10 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-5 animate-fade-in-up">

                        {/* Cabeçalho + Tabs */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-white font-bold text-lg">Gerenciar Materiais</h3>
                                <button
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="text-slate-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
                                >
                                    <Icons.X size={18} />
                                </button>
                            </div>
                            <div className="flex rounded-xl border border-white/10 overflow-hidden text-sm bg-black/20">
                                <button
                                    onClick={() => setModalMode('new-product')}
                                    className={`flex-1 py-2.5 font-bold transition-colors ${modalMode === 'new-product' ? 'bg-primary text-black' : 'text-slate-400 hover:text-white'}`}
                                >
                                    Novo Produto
                                </button>
                                <button
                                    onClick={() => setModalMode('add-variant')}
                                    className={`flex-1 py-2.5 font-bold transition-colors ${modalMode === 'add-variant' ? 'bg-primary text-black' : 'text-slate-400 hover:text-white'}`}
                                >
                                    Adicionar Variação
                                </button>
                            </div>
                        </div>

                        {/* Campos do modo Novo Produto */}
                        {modalMode === 'new-product' ? (
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Nome do Produto</label>
                                    <input
                                        value={newProductName}
                                        onChange={e => setNewProductName(e.target.value)}
                                        placeholder="Ex: Lona 500g"
                                        className="w-full bg-black/40 border border-white/10 rounded-lg h-10 px-3 text-white text-sm outline-none focus:border-primary transition-colors placeholder:text-slate-600"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Categoria</label>
                                    {!isCreatingCategory ? (
                                        <div className="flex gap-2">
                                            <select
                                                value={newProductCategory}
                                                onChange={e => setNewProductCategory(e.target.value)}
                                                className="flex-1 bg-black/40 border border-white/10 rounded-lg h-10 px-3 text-white text-sm outline-none focus:border-primary transition-colors"
                                            >
                                                <option value="">Selecione...</option>
                                                {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                            <button
                                                onClick={() => setIsCreatingCategory(true)}
                                                className="bg-white/5 hover:bg-white/10 border border-white/10 px-3 rounded-lg text-white transition-colors"
                                                title="Nova categoria"
                                            >
                                                <Icons.Plus size={17} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <input
                                                value={newProductCategory}
                                                onChange={e => setNewProductCategory(e.target.value)}
                                                placeholder="Nova Categoria"
                                                className="flex-1 bg-black/40 border border-white/10 rounded-lg h-10 px-3 text-white text-sm outline-none focus:border-primary transition-colors"
                                            />
                                            <button
                                                onClick={() => setIsCreatingCategory(false)}
                                                className="bg-white/5 hover:bg-white/10 border border-white/10 px-3 rounded-lg text-white transition-colors"
                                            >
                                                <Icons.Close size={17} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Preço Base / m²</label>
                                    <input
                                        type="number"
                                        value={newProductPrice}
                                        onChange={e => setNewProductPrice(e.target.value)}
                                        placeholder="Ex: 150.00"
                                        className="w-full bg-black/40 border border-white/10 rounded-lg h-10 px-3 text-white text-sm outline-none focus:border-primary transition-colors placeholder:text-slate-600"
                                    />
                                </div>
                            </div>
                        ) : (
                            /* Campos do modo Adicionar Variação */
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Produto</label>
                                    <select
                                        value={variantProductId}
                                        onChange={e => setVariantProductId(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg h-10 px-3 text-white text-sm outline-none focus:border-primary transition-colors"
                                    >
                                        <option value="">Selecione o produto...</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} — {p.category}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Tipo de variação</label>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setVariantType('thickness')}
                                            className={`flex-1 py-2.5 rounded-lg text-sm font-bold border transition-colors ${variantType === 'thickness' ? 'bg-primary/15 border-primary/50 text-primary' : 'bg-black/20 border-white/10 text-slate-400 hover:text-white hover:bg-white/5'}`}
                                        >
                                            Espessura
                                        </button>
                                        <button
                                            onClick={() => setVariantType('subtype')}
                                            className={`flex-1 py-2.5 rounded-lg text-sm font-bold border transition-colors ${variantType === 'subtype' ? 'bg-primary/15 border-primary/50 text-primary' : 'bg-black/20 border-white/10 text-slate-400 hover:text-white hover:bg-white/5'}`}
                                        >
                                            Subtipo
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">
                                        {variantType === 'thickness' ? 'Espessura' : 'Nome do subtipo'}
                                    </label>
                                    <input
                                        value={variantName}
                                        onChange={e => setVariantName(e.target.value)}
                                        placeholder={variantType === 'thickness' ? '12mm' : 'Fosco'}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg h-10 px-3 text-white text-sm outline-none focus:border-primary transition-colors placeholder:text-slate-600"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Preço / m²</label>
                                    <input
                                        type="number"
                                        value={variantPrice}
                                        onChange={e => setVariantPrice(e.target.value)}
                                        placeholder="Ex: 500.00"
                                        className="w-full bg-black/40 border border-white/10 rounded-lg h-10 px-3 text-white text-sm outline-none focus:border-primary transition-colors placeholder:text-slate-600"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Rodapé do modal */}
                        <div className="flex justify-end gap-2 pt-1 border-t border-white/5">
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="px-4 py-2 text-slate-400 hover:text-white text-sm transition-colors rounded-lg hover:bg-white/5"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={modalMode === 'new-product' ? handleCreateProduct : handleAddVariant}
                                disabled={isSavingNew}
                                className="relative overflow-hidden group px-5 py-2 bg-primary text-black font-bold rounded-lg text-sm disabled:opacity-50"
                            >
                                <span className="absolute inset-0 bg-primary-hover translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 rounded-lg" />
                                <span className="relative flex items-center gap-2">
                                    {isSavingNew ? <><Spinner size={12} /> Salvando...</> : 'Salvar'}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
