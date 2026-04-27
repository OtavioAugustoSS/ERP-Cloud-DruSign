'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
    Loader2, Search, UserRound, Plus, Minus, Trash2, FileText, Check,
    X, Ruler, Sparkles, Truck, Wrench, Calendar, AlertCircle,
} from 'lucide-react';
import { submitOrder } from '@/actions/order';
import { formatCurrency } from '@/lib/utils/price';
import { maskCEP, maskDocument, maskPhone } from '@/lib/utils/masks';
import { fetchAddressByCEP } from '@/lib/utils/viaCEP';
import type { Product, Client } from '@/types';
import type { FlexPricingConfig } from '@/types/pricing';

interface CreateOrderModalProps {
    isOpen: boolean;
    mode?: 'page' | 'modal';
    onClose: () => void;
    onSuccess: () => void;
    products: Product[];
    clients: Client[];
}

interface OrderItemRow {
    productId: string;
    productName: string;
    width: number;
    height: number;
    quantity: number;
    unitPrice: number;
    total: number;
    observations: string;
    finishing: string;
    thickness?: string;
    vinylType?: string;
    fileUrl?: string;
}

const FINISHING_BY_CATEGORY: Record<string, string[]> = {
    'LONA':     ['Sem acabamento', 'Bainha + Ilhós', 'Bainha simples', 'Ilhós', 'Madeira (vara)', 'Solda'],
    'ACM':      ['Sem acabamento', 'Refile', 'Aplicação'],
    'ACRÍLICO': ['Sem acabamento', 'Refile'],
    'ADESIVO':  ['Sem acabamento', 'Aplicação', 'Refile'],
    'PVC':      ['Sem acabamento', 'Refile'],
    'PS':       ['Sem acabamento', 'Refile'],
};
const DEFAULT_FINISHINGS = ['Sem acabamento'];

const VINYL_TYPES = ['Fosco', 'Brilhoso', 'Transparente'];

export default function CreateOrderModal({ isOpen, mode = 'modal', onClose, onSuccess, products, clients }: CreateOrderModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [itemError, setItemError] = useState('');

    // ───── Cliente ─────
    const [clientName, setClientName] = useState('');
    const [clientDocument, setClientDocument] = useState('');
    const [clientIe, setClientIe] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [clientZip, setClientZip] = useState('');
    const [clientStreet, setClientStreet] = useState('');
    const [clientNumber, setClientNumber] = useState('');
    const [clientNeighborhood, setClientNeighborhood] = useState('');
    const [clientCity, setClientCity] = useState('');
    const [clientState, setClientState] = useState('');

    const [isLoadingCEP, setIsLoadingCEP] = useState(false);

    // ───── Autocomplete cliente ─────
    const [clientSearch, setClientSearch] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);

    // ───── Carrinho ─────
    const [items, setItems] = useState<OrderItemRow[]>([]);

    // ───── Form item ─────
    const [currentProductId, setCurrentProductId] = useState('');
    const [currentFileUrl, setCurrentFileUrl] = useState('');
    const [currentWidth, setCurrentWidth] = useState<number | ''>('');
    const [currentHeight, setCurrentHeight] = useState<number | ''>('');
    const [currentQty, setCurrentQty] = useState(1);
    const [currentUnitPrice, setCurrentUnitPrice] = useState<number | ''>('');
    const [currentObs, setCurrentObs] = useState('');
    const [currentFinishing, setCurrentFinishing] = useState('Sem acabamento');
    const [currentThickness, setCurrentThickness] = useState('');
    const [currentVinylType, setCurrentVinylType] = useState('');
    const [unitPriceTouched, setUnitPriceTouched] = useState(false);

    // ───── Financeiro ─────
    const [serviceValue, setServiceValue] = useState<number | ''>('');
    const [shippingCost, setShippingCost] = useState<number | ''>('');
    const [discount, setDiscount] = useState<number | ''>('');
    const [paymentTerms, setPaymentTerms] = useState('');
    const [deliveryDate, setDeliveryDate] = useState('');
    const [notes, setNotes] = useState('');

    const widthInputRef = useRef<HTMLInputElement>(null);

    const selectedProduct = useMemo(
        () => products.find(p => p.id === currentProductId) ?? null,
        [products, currentProductId]
    );

    const categorizedProducts = useMemo(() => {
        const map = new Map<string, Product[]>();
        for (const p of products) {
            if (!map.has(p.category)) map.set(p.category, []);
            map.get(p.category)!.push(p);
        }
        return map;
    }, [products]);

    const suggestions = useMemo(() => {
        const q = clientSearch.toLowerCase().trim();
        if (!q || q.length < 2) return [];
        return clients.filter(c =>
            c.name.toLowerCase().includes(q) ||
            c.document?.includes(q) ||
            c.phone?.includes(q)
        ).slice(0, 6);
    }, [clients, clientSearch]);

    // ───── Cálculo de área e preço ao vivo ─────
    const area = useMemo(() => {
        const w = Number(currentWidth) || 0;
        const h = Number(currentHeight) || 0;
        return (w / 100) * (h / 100);
    }, [currentWidth, currentHeight]);

    const acrylicThicknessOptions = useMemo(() => {
        if (!selectedProduct) return [];
        const cfg = selectedProduct.pricingConfig as FlexPricingConfig | null;
        return cfg?.thicknessOptions ?? [];
    }, [selectedProduct]);

    const effectivePricePerM2 = useMemo(() => {
        if (!selectedProduct) return 0;
        if (currentThickness) {
            const cfg = selectedProduct.pricingConfig as FlexPricingConfig | null;
            const byThickness = cfg?.pricesByThickness?.[currentThickness];
            if (byThickness) return byThickness;
        }
        return selectedProduct.pricePerM2;
    }, [selectedProduct, currentThickness]);

    const computedUnitPrice = useMemo(() => {
        if (!selectedProduct) return 0;
        if (area <= 0) return effectivePricePerM2;
        const calc = area * effectivePricePerM2;
        return calc < 10 ? 10 : Math.round(calc * 100) / 100;
    }, [selectedProduct, area, effectivePricePerM2]);

    const relevantFinishings = useMemo(() => {
        if (!selectedProduct) return DEFAULT_FINISHINGS;
        return FINISHING_BY_CATEGORY[selectedProduct.category] ?? DEFAULT_FINISHINGS;
    }, [selectedProduct]);

    useEffect(() => {
        if (!selectedProduct) return;
        const finishings = FINISHING_BY_CATEGORY[selectedProduct.category] ?? DEFAULT_FINISHINGS;
        setCurrentFinishing(finishings[0]);
        setCurrentThickness('');
        setCurrentVinylType('');
    }, [selectedProduct]);

    useEffect(() => {
        if (selectedProduct && !unitPriceTouched) {
            setCurrentUnitPrice(computedUnitPrice);
        }
    }, [computedUnitPrice, selectedProduct, unitPriceTouched]);

    const currentItemSubtotal = useMemo(() => {
        const unit = Number(currentUnitPrice) || 0;
        const qty = Math.max(1, currentQty);
        return unit * qty;
    }, [currentUnitPrice, currentQty]);

    // ───── Totais ─────
    const itemsSubtotal = useMemo(
        () => items.reduce((acc, c) => acc + c.total, 0),
        [items]
    );
    const finalTotal = useMemo(() => {
        const svc = Number(serviceValue) || 0;
        const ship = Number(shippingCost) || 0;
        const disc = Number(discount) || 0;
        return Math.max(0, itemsSubtotal + svc + ship - disc);
    }, [itemsSubtotal, serviceValue, shippingCost, discount]);

    // ───── Indicadores de progresso ─────
    const clientReady = clientName.trim().length > 0;
    const itemsReady = items.length > 0;

    const hasUnsavedData = useMemo(
        () => clientReady || itemsReady ||
            currentProductId !== '' || currentWidth !== '' || currentHeight !== '',
        [clientReady, itemsReady, currentProductId, currentWidth, currentHeight]
    );

    // ───── Ações ─────
    function applyClient(c: Client) {
        setClientName(c.name);
        setClientDocument(maskDocument(c.document ?? ''));
        setClientPhone(maskPhone(c.phone ?? ''));
        setClientSearch('');
        setShowSuggestions(false);
    }

    async function handleCEPChange(raw: string) {
        const masked = maskCEP(raw);
        setClientZip(masked);
        const digits = raw.replace(/\D/g, '');
        if (digits.length !== 8) return;
        setIsLoadingCEP(true);
        const addr = await fetchAddressByCEP(digits);
        setIsLoadingCEP(false);
        if (!addr) return;
        setClientStreet(addr.logradouro);
        setClientNeighborhood(addr.bairro);
        setClientCity(addr.localidade);
        setClientState(addr.uf);
    }

    function resetItemForm() {
        setCurrentProductId('');
        setCurrentWidth('');
        setCurrentHeight('');
        setCurrentQty(1);
        setCurrentUnitPrice('');
        setCurrentObs('');
        setCurrentFileUrl('');
        setCurrentFinishing('Sem acabamento');
        setCurrentThickness('');
        setCurrentVinylType('');
        setUnitPriceTouched(false);
        setItemError('');
    }

    const handleAddItem = useCallback(() => {
        if (!selectedProduct) {
            setItemError('Selecione um produto antes de adicionar.');
            return;
        }
        if (currentQty <= 0) {
            setItemError('A quantidade precisa ser maior que zero.');
            return;
        }
        const price = Number(currentUnitPrice) || 0;
        if (price <= 0) {
            setItemError('O valor unitário precisa ser maior que zero.');
            return;
        }
        if (selectedProduct.category === 'ACRÍLICO' && acrylicThicknessOptions.length > 0 && !currentThickness) {
            setItemError('Selecione a espessura do acrílico antes de adicionar.');
            return;
        }
        if (selectedProduct.category === 'ADESIVO' && !currentVinylType) {
            setItemError('Selecione o tipo de vinil (fosco/brilhoso/transparente) antes de adicionar.');
            return;
        }

        const total = price * currentQty;

        setItems(prev => [
            ...prev,
            {
                productId: selectedProduct.id,
                productName: selectedProduct.name,
                width: Number(currentWidth) || 0,
                height: Number(currentHeight) || 0,
                quantity: currentQty,
                unitPrice: price,
                total,
                observations: currentObs,
                finishing: currentFinishing,
                thickness: currentThickness || undefined,
                vinylType: currentVinylType || undefined,
                fileUrl: currentFileUrl || undefined,
            },
        ]);
        resetItemForm();
    }, [selectedProduct, acrylicThicknessOptions, currentQty, currentUnitPrice, currentWidth, currentHeight, currentObs, currentFinishing, currentThickness, currentVinylType, currentFileUrl]);

    const handleRemoveItem = (index: number) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpdateItemQty = (index: number, delta: number) => {
        setItems(prev => prev.map((it, i) => {
            if (i !== index) return it;
            const newQty = Math.max(1, it.quantity + delta);
            return { ...it, quantity: newQty, total: it.unitPrice * newQty };
        }));
    };

    const handleSubmit = async () => {
        setSubmitError('');
        if (!clientName.trim()) {
            setSubmitError('Informe o nome do cliente.');
            return;
        }
        if (items.length === 0) {
            setSubmitError('Adicione pelo menos um item ao pedido.');
            return;
        }

        setIsLoading(true);

        const result = await submitOrder({
            clientName: clientName.trim(),
            clientDocument,
            clientIe,
            clientPhone,
            clientZip,
            clientStreet,
            clientNumber,
            clientNeighborhood,
            clientCity,
            clientState,
            items: items.map(i => ({
                productId: i.productId,
                width: i.width,
                height: i.height,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                totalPrice: i.total,
                observations: i.observations,
                finishing: i.finishing,
                customDetails: [
                    i.thickness ? `Espessura: ${i.thickness}` : '',
                    i.vinylType ? `Tipo: ${i.vinylType}` : '',
                ].filter(Boolean).join(' | ') || undefined,
                material: i.productName,
                fileUrl: i.fileUrl,
            })),
            serviceValue: Number(serviceValue) || 0,
            shippingCost: Number(shippingCost) || 0,
            discount: Number(discount) || 0,
            totalPrice: finalTotal,
            paymentTerms,
            deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
            notes,
        });

        setIsLoading(false);

        if (result.success) {
            onSuccess();
            onClose();
        } else {
            setSubmitError(result.error ?? 'Erro ao criar pedido.');
        }
    };

    const handleCloseAttempt = useCallback(() => {
        if (hasUnsavedData) {
            if (!confirm('Há dados não salvos. Deseja realmente fechar?')) return;
        }
        onClose();
    }, [hasUnsavedData, onClose]);

    // ───── Atalhos de teclado ─────
    useEffect(() => {
        if (mode !== 'page' && !isOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                handleCloseAttempt();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
        // mode é prop estática — não muda em runtime, não entra nas deps
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, handleCloseAttempt]);

    useEffect(() => {
        if (selectedProduct) widthInputRef.current?.focus();
    }, [selectedProduct]);

    if (mode !== 'page' && !isOpen) return null;

    const isPageMode = mode === 'page';

    return (
        <div className={isPageMode
            ? 'flex-1 flex flex-col h-full overflow-hidden bg-background-dark'
            : 'fixed inset-0 z-[100] bg-background-dark flex flex-col animate-in fade-in duration-200'
        }>
            <div className="w-full h-full flex flex-col mx-auto max-w-[1920px]">

                {/* ─────────────── HEADER ─────────────── */}
                <header className="flex-none h-16 px-6 border-b border-white/5 flex items-center justify-between bg-background-dark/80 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary to-cyan-600 text-background-dark flex items-center justify-center shadow-lg shadow-primary/20">
                            <Plus size={22} className="stroke-[2.5]" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white tracking-tight leading-tight">Novo Pedido</h2>
                            <p className="text-xs text-slate-500">Monte o orçamento e envie para produção</p>
                        </div>

                        {/* Indicadores de progresso */}
                        <div className="hidden md:flex items-center gap-2 ml-6 pl-6 border-l border-white/5">
                            <ProgressDot label="Cliente" done={clientReady} />
                            <span className="text-slate-700">→</span>
                            <ProgressDot label={`Itens (${items.length})`} done={itemsReady} />
                            <span className="text-slate-700">→</span>
                            <ProgressDot label="Concluir" done={false} active={clientReady && itemsReady} />
                        </div>
                    </div>

                    <div className="flex items-center gap-5">
                        <div className="text-right hidden lg:block">
                            <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Total Estimado</p>
                            <p className="text-2xl font-bold text-emerald-400 tracking-tight font-mono leading-tight">
                                {formatCurrency(finalTotal)}
                            </p>
                        </div>
                        <button
                            onClick={handleCloseAttempt}
                            className="h-10 w-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                            title="Fechar (Esc)"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </header>

                {/* ─────────────── BODY ─────────────── */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="max-w-[1500px] mx-auto p-5 space-y-4">

                        {/* ───── 1. CLIENTE ───── */}
                        <Section
                            number={1}
                            title="Dados do Cliente"
                            color="blue"
                            done={clientReady}
                            extra={
                                <div className="relative w-72">
                                    <div className="flex items-center gap-2 bg-background-dark border border-white/10 rounded-xl h-9 px-3 focus-within:border-primary transition-colors">
                                        <Search size={13} className="text-slate-500 shrink-0" />
                                        <input
                                            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                                            placeholder="Buscar cliente cadastrado..."
                                            value={clientSearch}
                                            onChange={e => { setClientSearch(e.target.value); setShowSuggestions(true); }}
                                            onFocus={() => setShowSuggestions(true)}
                                            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                                        />
                                    </div>
                                    {showSuggestions && suggestions.length > 0 && (
                                        <ul className="absolute top-full mt-1 left-0 right-0 z-50 bg-surface-dark border border-white/10 rounded-xl shadow-xl overflow-hidden">
                                            {suggestions.map(c => (
                                                <li key={c.id}>
                                                    <button
                                                        type="button"
                                                        onMouseDown={() => applyClient(c)}
                                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/5 transition-colors"
                                                    >
                                                        <UserRound size={14} className="text-primary shrink-0" />
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-sm text-white truncate">{c.name}</p>
                                                            <div className="flex gap-2 mt-0.5">
                                                                {c.document && <p className="text-[10px] text-slate-500 font-mono">{c.document}</p>}
                                                                {c.phone && <p className="text-[10px] text-slate-500">{c.phone}</p>}
                                                            </div>
                                                        </div>
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            }
                        >
                            <div className="grid grid-cols-12 gap-4">
                                <Field label="Nome / Razão Social" required className="col-span-12 md:col-span-6">
                                    <input value={clientName} onChange={e => setClientName(e.target.value)}
                                        placeholder="Nome do cliente ou empresa" className={inputBase} autoFocus />
                                </Field>
                                <Field label="CPF / CNPJ" className="col-span-6 md:col-span-3">
                                    <input value={clientDocument} onChange={e => setClientDocument(maskDocument(e.target.value))}
                                        placeholder="000.000.000-00" className={inputBase} inputMode="numeric" />
                                </Field>
                                <Field label="Insc. Estadual" className="col-span-6 md:col-span-3">
                                    <input value={clientIe} onChange={e => setClientIe(e.target.value)}
                                        placeholder="Isento ou número" className={inputBase} />
                                </Field>

                                <Field label="Telefone / WhatsApp" className="col-span-12 md:col-span-3">
                                    <input value={clientPhone} onChange={e => setClientPhone(maskPhone(e.target.value))}
                                        placeholder="(00) 00000-0000" className={inputBase} inputMode="tel" />
                                </Field>
                                <Field label="CEP" className="col-span-6 md:col-span-2">
                                    <div className="relative">
                                        <input value={clientZip} onChange={e => handleCEPChange(e.target.value)}
                                            placeholder="00000-000" className={inputBase} inputMode="numeric" />
                                        {isLoadingCEP && (
                                            <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400 pointer-events-none" />
                                        )}
                                    </div>
                                </Field>
                                <Field label="Rua" className="col-span-12 md:col-span-5">
                                    <input value={clientStreet} onChange={e => setClientStreet(e.target.value)}
                                        placeholder="Logradouro" className={inputBase} />
                                </Field>
                                <Field label="Número" className="col-span-6 md:col-span-2">
                                    <input value={clientNumber} onChange={e => setClientNumber(e.target.value)}
                                        placeholder="Nº" className={inputBase} />
                                </Field>

                                <Field label="Bairro" className="col-span-12 md:col-span-4">
                                    <input value={clientNeighborhood} onChange={e => setClientNeighborhood(e.target.value)}
                                        placeholder="Bairro" className={inputBase} />
                                </Field>
                                <Field label="Cidade" className="col-span-8 md:col-span-6">
                                    <input value={clientCity} onChange={e => setClientCity(e.target.value)}
                                        placeholder="Cidade" className={inputBase} />
                                </Field>
                                <Field label="UF" className="col-span-4 md:col-span-2">
                                    <input value={clientState} onChange={e => setClientState(e.target.value.toUpperCase().slice(0, 2))}
                                        placeholder="UF" maxLength={2} className={`${inputBase} text-center font-mono uppercase`} />
                                </Field>
                            </div>
                        </Section>

                        {/* ───── 2. ADICIONAR ITEM ───── */}
                        <Section number={2} title="Adicionar Item ao Pedido" color="emerald">
                            <div className="grid grid-cols-12 gap-5">
                                {/* Produto */}
                                <Field label="Produto / Material" className="col-span-12 md:col-span-4">
                                    <select
                                        value={currentProductId}
                                        onChange={e => { setCurrentProductId(e.target.value); setUnitPriceTouched(false); }}
                                        className={`${inputBase} cursor-pointer`}
                                    >
                                        <option value="">Selecione um produto...</option>
                                        {Array.from(categorizedProducts.entries()).map(([cat, prods]) => (
                                            <optgroup key={cat} label={cat}>
                                                {prods.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                    {selectedProduct && (
                                        <p className="mt-1.5 text-[11px] text-emerald-400 font-mono flex items-center gap-1.5">
                                            <Sparkles size={10} />
                                            {currentThickness
                                                ? <>{currentThickness}: {formatCurrency(effectivePricePerM2)} / m²</>
                                                : <>Base: {formatCurrency(selectedProduct.pricePerM2)} / m²</>
                                            }
                                        </p>
                                    )}
                                    {selectedProduct?.category === 'ADESIVO' && (
                                        <div className="mt-3 pt-3 border-t border-white/5">
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">
                                                Tipo de Vinil{!currentVinylType && <span className="text-amber-400 ml-1">*</span>}
                                            </p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {VINYL_TYPES.map(t => (
                                                    <button
                                                        key={t}
                                                        type="button"
                                                        onClick={() => setCurrentVinylType(t)}
                                                        className={`px-3 h-7 rounded-full text-[11px] font-medium transition-colors border ${
                                                            currentVinylType === t
                                                                ? 'bg-violet-500/20 text-violet-300 border-violet-500/40'
                                                                : 'bg-surface-dark text-slate-400 border-white/5 hover:border-white/10 hover:text-slate-300'
                                                        }`}
                                                    >
                                                        {t}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {selectedProduct?.category === 'ACRÍLICO' && acrylicThicknessOptions.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-white/5">
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">
                                                Espessura{!currentThickness && <span className="text-amber-400 ml-1">*</span>}
                                            </p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {acrylicThicknessOptions.map(t => (
                                                    <button
                                                        key={t}
                                                        type="button"
                                                        onClick={() => { setCurrentThickness(t); setUnitPriceTouched(false); }}
                                                        className={`px-3 h-7 rounded-full text-[11px] font-medium transition-colors border ${
                                                            currentThickness === t
                                                                ? 'bg-primary/20 text-primary border-primary/30'
                                                                : 'bg-surface-dark text-slate-400 border-white/5 hover:border-white/10 hover:text-slate-300'
                                                        }`}
                                                    >
                                                        {t}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </Field>

                                {/* Arquivo */}
                                <Field label="Nome do Arquivo / Arte" className="col-span-12 md:col-span-8">
                                    <div className="relative">
                                        <FileText size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                                        <input value={currentFileUrl} onChange={e => setCurrentFileUrl(e.target.value)}
                                            placeholder="Ex: placa_fachada_vfinal.pdf"
                                            className={`${inputBase} pl-9`} />
                                    </div>
                                </Field>

                                {/* Dimensões */}
                                <div className="col-span-12 md:col-span-7">
                                    <div className="bg-black/20 border border-white/5 rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Ruler size={13} className="text-slate-500" />
                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Dimensões e Quantidade</span>
                                            {area > 0 && (
                                                <span className="ml-auto text-[11px] text-emerald-400 font-mono">
                                                    {area.toFixed(2)} m² por unidade
                                                </span>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            <Field label="Largura (cm)" small>
                                                <input
                                                    ref={widthInputRef}
                                                    type="number" min="0" inputMode="decimal"
                                                    value={currentWidth}
                                                    onChange={e => setCurrentWidth(parseFloat(e.target.value) || '')}
                                                    placeholder="0" className={`${inputBase} text-center font-mono`}
                                                />
                                            </Field>
                                            <Field label="Altura (cm)" small>
                                                <input
                                                    type="number" min="0" inputMode="decimal"
                                                    value={currentHeight}
                                                    onChange={e => setCurrentHeight(parseFloat(e.target.value) || '')}
                                                    placeholder="0" className={`${inputBase} text-center font-mono`}
                                                />
                                            </Field>
                                            <Field label="Quantidade" small>
                                                <div className="flex items-stretch h-11 bg-background-dark border border-white/10 rounded-xl overflow-hidden focus-within:border-primary">
                                                    <button type="button" onClick={() => setCurrentQty(q => Math.max(1, q - 1))}
                                                        className="w-9 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                                                        <Minus size={14} />
                                                    </button>
                                                    <input
                                                        type="number" min="1" inputMode="numeric"
                                                        value={currentQty}
                                                        onChange={e => setCurrentQty(Math.max(1, parseInt(e.target.value) || 1))}
                                                        className="flex-1 bg-transparent text-center text-sm text-white outline-none font-mono font-bold"
                                                    />
                                                    <button type="button" onClick={() => setCurrentQty(q => q + 1)}
                                                        className="w-9 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                            </Field>
                                        </div>

                                        {/* Acabamento - chips */}
                                        <div className="mt-4 pt-4 border-t border-white/5">
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                <Wrench size={10} /> Acabamento
                                            </p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {relevantFinishings.map((f: string) => (
                                                    <button
                                                        key={f}
                                                        type="button"
                                                        onClick={() => setCurrentFinishing(f)}
                                                        className={`px-3 h-7 rounded-full text-[11px] font-medium transition-colors border ${
                                                            currentFinishing === f
                                                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                                                : 'bg-surface-dark text-slate-400 border-white/5 hover:border-white/10 hover:text-slate-300'
                                                        }`}
                                                    >
                                                        {f}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Observações */}
                                        <div className="mt-4 pt-4 border-t border-white/5">
                                            <input
                                                value={currentObs}
                                                onChange={e => setCurrentObs(e.target.value)}
                                                placeholder="Observação técnica (ex: ilhós duplo, cantoneira, instalação inclusa)..."
                                                className="w-full bg-transparent text-xs text-slate-300 outline-none placeholder:text-slate-600"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Painel direito: Preço unitário + Subtotal item + Adicionar */}
                                <div className="col-span-12 md:col-span-5">
                                    <div className="bg-surface-dark/50 border border-white/5 rounded-xl p-5 h-full flex flex-col">
                                        <Field label="Valor Unitário (R$)" small>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">R$</span>
                                                <input
                                                    type="number" min="0" step="0.01" inputMode="decimal"
                                                    value={currentUnitPrice}
                                                    onChange={e => { setCurrentUnitPrice(parseFloat(e.target.value) || ''); setUnitPriceTouched(true); }}
                                                    placeholder="0.00"
                                                    className={`${inputBase} pl-10 text-right text-base font-mono font-bold text-emerald-400`}
                                                />
                                            </div>
                                            {selectedProduct && unitPriceTouched && (
                                                <button
                                                    type="button"
                                                    onClick={() => { setCurrentUnitPrice(computedUnitPrice); setUnitPriceTouched(false); }}
                                                    className="mt-1 text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
                                                >
                                                    ↺ Recalcular automaticamente
                                                </button>
                                            )}
                                        </Field>

                                        {/* SUBTOTAL DO ITEM ATUAL */}
                                        <div className="mt-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                                            <p className="text-[10px] text-emerald-300/70 font-bold uppercase tracking-wider mb-1">
                                                Subtotal deste item
                                            </p>
                                            <div className="flex items-baseline justify-between">
                                                <span className="text-xs text-slate-500 font-mono">
                                                    {currentQty} × {formatCurrency(Number(currentUnitPrice) || 0)}
                                                </span>
                                                <span className="text-2xl font-bold text-emerald-400 font-mono tracking-tight">
                                                    {formatCurrency(currentItemSubtotal)}
                                                </span>
                                            </div>
                                        </div>

                                        {itemError && (
                                            <div className="mt-3 flex items-start gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                                                <AlertCircle size={13} className="mt-0.5 shrink-0" />
                                                <span>{itemError}</span>
                                            </div>
                                        )}

                                        <div className="mt-auto pt-4 grid grid-cols-3 gap-2">
                                            {/* Limpar — slide fill */}
                                            <button
                                                type="button"
                                                onClick={resetItemForm}
                                                className="group/clearbtn col-span-1 h-11 relative overflow-hidden rounded-xl border border-white/10 text-xs font-semibold flex items-center justify-center"
                                            >
                                                <span className="absolute inset-0 bg-white/10 -translate-x-full group-hover/clearbtn:translate-x-0 transition-transform duration-[250ms] ease-in-out rounded-xl" />
                                                <span className="relative z-10 text-slate-400 group-hover/clearbtn:text-white transition-colors duration-[250ms]">Limpar</span>
                                            </button>
                                            {/* Adicionar — slide fill */}
                                            <button
                                                type="button"
                                                onClick={handleAddItem}
                                                className="group/addbtn col-span-2 h-11 relative overflow-hidden rounded-xl border border-primary font-bold text-sm shadow-lg shadow-primary/20 active:scale-[0.98] flex items-center justify-center gap-2"
                                            >
                                                <span className="absolute inset-0 bg-primary -translate-x-full group-hover/addbtn:translate-x-0 transition-transform duration-[250ms] ease-in-out rounded-xl" />
                                                <span className="relative z-10 flex items-center gap-2 text-primary group-hover/addbtn:text-background-dark transition-colors duration-[250ms]">
                                                    <Plus size={15} /> Adicionar ao pedido
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Section>

                        {/* ───── 3. CARRINHO ───── */}
                        <Section
                            number={3}
                            title={`Itens no Pedido (${items.length})`}
                            color="amber"
                            done={itemsReady}
                            noPadding
                        >
                            <table className="w-full text-sm text-left">
                                <thead className="bg-black/20 text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                                    <tr>
                                        <th className="p-4 pl-6">Produto / Detalhes</th>
                                        <th className="p-4 text-center w-32">Dimensões</th>
                                        <th className="p-4 text-center w-32">Qtd</th>
                                        <th className="p-4 text-right w-28">Unitário</th>
                                        <th className="p-4 text-right pr-6 w-32">Subtotal</th>
                                        <th className="p-4 w-32"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {items.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-white/5 transition-colors group">
                                            <td className="p-4 pl-6">
                                                <p className="font-semibold text-white">{item.productName}</p>
                                                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                                    {item.thickness && (
                                                        <span className="text-[10px] text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                                                            {item.thickness}
                                                        </span>
                                                    )}
                                                    {item.vinylType && (
                                                        <span className="text-[10px] text-violet-300 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full">
                                                            {item.vinylType}
                                                        </span>
                                                    )}
                                                    {item.finishing && item.finishing !== 'Sem acabamento' && (
                                                        <span className="text-[10px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                                                            {item.finishing}
                                                        </span>
                                                    )}
                                                    {item.fileUrl && (
                                                        <span className="text-[10px] text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                            <FileText size={9} /> {item.fileUrl}
                                                        </span>
                                                    )}
                                                    {item.observations && (
                                                        <span className="text-[10px] text-slate-500 italic">"{item.observations}"</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 text-center font-mono text-xs text-slate-400">
                                                {item.width > 0 ? `${item.width}×${item.height} cm` : <span className="text-slate-600">—</span>}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button onClick={() => handleUpdateItemQty(idx, -1)}
                                                        className="h-7 w-7 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 flex items-center justify-center transition-colors">
                                                        <Minus size={12} />
                                                    </button>
                                                    <span className="w-8 text-center font-bold text-white">{item.quantity}</span>
                                                    <button onClick={() => handleUpdateItemQty(idx, 1)}
                                                        className="h-7 w-7 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 flex items-center justify-center transition-colors">
                                                        <Plus size={12} />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right font-mono text-slate-400">{formatCurrency(item.unitPrice)}</td>
                                            <td className="p-4 text-right font-mono text-emerald-400 font-bold pr-6">{formatCurrency(item.total)}</td>
                                            <td className="p-2 text-center">
                                                <div className="flex justify-center">
                                                    {/* Trash — fiel ao Uiverse: pill vermelho, texto de cima, ícone cai */}
                                                    <button
                                                        onClick={() => handleRemoveItem(idx)}
                                                        className="group/delbtn relative flex items-center justify-center h-8 w-8 hover:w-28 rounded-full overflow-hidden bg-slate-800 hover:bg-red-500 transition-all duration-300 opacity-0 group-hover:opacity-100 shrink-0"
                                                    >
                                                        {/* Texto: começa acima do botão (top:-16px, font 2px), entra na hover */}
                                                        <span className="absolute -top-4 left-0 right-0 text-center text-white font-semibold text-[2px] group-hover/delbtn:text-[11px] group-hover/delbtn:translate-y-[22px] pointer-events-none whitespace-nowrap transition-all duration-300">
                                                            Remover
                                                        </span>
                                                        {/* Ícone: pequeno → grande, cai 60% da própria altura (como no original) */}
                                                        <Trash2 className="shrink-0 text-white w-3 h-3 group-hover/delbtn:w-7 group-hover/delbtn:h-7 group-hover/delbtn:translate-y-[60%] transition-all duration-300" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {items.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="p-12 text-center text-slate-600">
                                                Nenhum item adicionado ainda.<br />
                                                <span className="text-xs">Use o painel acima para incluir produtos no pedido.</span>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                {items.length > 0 && (
                                    <tfoot>
                                        <tr className="border-t-2 border-white/5 bg-black/20">
                                            <td colSpan={4} className="p-4 pl-6 text-right text-xs text-slate-500 uppercase font-bold tracking-wider">
                                                Subtotal dos itens
                                            </td>
                                            <td className="p-4 text-right font-mono text-emerald-400 font-bold pr-6">
                                                {formatCurrency(itemsSubtotal)}
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </Section>

                        {/* ───── 4. LOGÍSTICA / EXTRAS ───── */}
                        <Section number={4} title="Logística e Observações" color="cyan">
                            <div className="grid grid-cols-12 gap-4">
                                <Field label="Forma de pagamento" className="col-span-12 md:col-span-4">
                                    <input value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)}
                                        placeholder="Ex: 50% entrada + 50% entrega" className={inputBase} />
                                </Field>
                                <Field label="Data de entrega" className="col-span-6 md:col-span-3">
                                    <div className="relative">
                                        <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                                        <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)}
                                            className={`${inputBase} pl-9`} />
                                    </div>
                                </Field>
                                <Field label="Observações gerais" className="col-span-12 md:col-span-5">
                                    <input value={notes} onChange={e => setNotes(e.target.value)}
                                        placeholder="Instruções especiais, pontos de atenção..." className={inputBase} />
                                </Field>
                            </div>
                        </Section>

                    </div>
                </div>

                {/* ─────────────── FOOTER ─────────────── */}
                <footer className="flex-none bg-background-dark border-t border-white/5 px-6 py-3 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20">
                    <div className="max-w-[1500px] mx-auto grid grid-cols-12 gap-4 items-end">

                        {/* Financeiro compacto */}
                        <div className="col-span-12 md:col-span-7 grid grid-cols-3 gap-3">
                            <FooterMoneyInput
                                label="Frete / Entrega" icon={<Truck size={11} />}
                                value={shippingCost} onChange={setShippingCost}
                            />
                            <FooterMoneyInput
                                label="Mão de obra" icon={<Wrench size={11} />}
                                value={serviceValue} onChange={setServiceValue}
                            />
                            <FooterMoneyInput
                                label="Desconto" negative
                                value={discount} onChange={setDiscount}
                            />
                        </div>

                        {/* Total + Concluir */}
                        <div className="col-span-12 md:col-span-5 flex items-center justify-end gap-5">
                            <div className="text-right">
                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Valor Final</p>
                                <p className="text-3xl font-bold text-emerald-400 tracking-tight font-mono leading-none mt-1">
                                    {formatCurrency(finalTotal)}
                                </p>
                                {itemsSubtotal > 0 && itemsSubtotal !== finalTotal && (
                                    <p className="text-[10px] text-slate-600 mt-1 font-mono">
                                        Itens {formatCurrency(itemsSubtotal)} {Number(serviceValue) ? `+ MO ${formatCurrency(Number(serviceValue))}` : ''} {Number(shippingCost) ? `+ Frete ${formatCurrency(Number(shippingCost))}` : ''} {Number(discount) ? `− Desc ${formatCurrency(Number(discount))}` : ''}
                                    </p>
                                )}
                            </div>
                            {/* Concluir Pedido — slide fill */}
                            <button
                                onClick={handleSubmit}
                                disabled={isLoading || items.length === 0 || !clientReady}
                                className="group/submitbtn relative h-14 px-7 overflow-hidden rounded-xl border border-emerald-500 font-bold shadow-lg shadow-emerald-900/40 active:scale-[0.98] transition-[transform,opacity] flex items-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale disabled:pointer-events-none"
                            >
                                <span className="absolute inset-0 bg-emerald-600 -translate-x-full group-hover/submitbtn:translate-x-0 transition-transform duration-[250ms] ease-in-out rounded-xl" />
                                <span className="relative z-10 flex items-center gap-3 text-emerald-400 group-hover/submitbtn:text-white transition-colors duration-[250ms]">
                                    {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} className="stroke-[2.5]" />}
                                    <span>Concluir Pedido</span>
                                </span>
                            </button>
                        </div>

                        {submitError && (
                            <div className="col-span-12 flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
                                <AlertCircle size={14} />
                                <span>{submitError}</span>
                            </div>
                        )}
                    </div>
                </footer>
            </div>
        </div>
    );
}

// ─────────────── helpers ───────────────

const inputBase = 'w-full bg-background-dark border border-white/5 hover:border-white/10 focus:border-primary rounded-xl h-11 px-3 text-sm text-white outline-none transition-colors placeholder:text-slate-700';

function Section({
    number, title, color, children, extra, done, noPadding,
}: {
    number: number;
    title: string;
    color: 'blue' | 'emerald' | 'amber' | 'cyan';
    children: React.ReactNode;
    extra?: React.ReactNode;
    done?: boolean;
    noPadding?: boolean;
}) {
    const colorMap = {
        blue: 'bg-primary',
        emerald: 'bg-emerald-500',
        amber: 'bg-amber-500',
        cyan: 'bg-primary',
    };
    return (
        <section className="bg-surface-dark/50 border border-white/5 rounded-2xl overflow-hidden">
            <header className="flex items-center justify-between gap-4 px-6 py-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold text-background-dark ${colorMap[color]}`}>
                        {done ? <Check size={14} className="stroke-[3]" /> : number}
                    </div>
                    <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">{title}</h3>
                </div>
                {extra}
            </header>
            <div className={noPadding ? '' : 'p-6'}>
                {children}
            </div>
        </section>
    );
}

function Field({ label, children, className = '', required, small }: {
    label: string;
    children: React.ReactNode;
    className?: string;
    required?: boolean;
    small?: boolean;
}) {
    return (
        <div className={className}>
            <label className={`${small ? 'text-[9px]' : 'text-[10px]'} text-slate-500 font-bold uppercase tracking-wider mb-1.5 block`}>
                {label}{required && <span className="text-red-400 ml-0.5">*</span>}
            </label>
            {children}
        </div>
    );
}

function ProgressDot({ label, done, active }: { label: string; done: boolean; active?: boolean }) {
    return (
        <div className="flex items-center gap-1.5">
            <div className={`h-2 w-2 rounded-full ${done ? 'bg-emerald-400' : active ? 'bg-primary animate-pulse' : 'bg-slate-700'}`} />
            <span className={`text-[11px] font-medium ${done ? 'text-emerald-400' : active ? 'text-primary' : 'text-slate-500'}`}>
                {label}
            </span>
        </div>
    );
}

function FooterMoneyInput({ label, value, onChange, icon, negative }: {
    label: string;
    value: number | '';
    onChange: (v: number | '') => void;
    icon?: React.ReactNode;
    negative?: boolean;
}) {
    return (
        <div>
            <label className={`text-[10px] uppercase font-bold tracking-wider mb-1 flex items-center gap-1 ${negative ? 'text-red-400' : 'text-slate-500'}`}>
                {icon}{label}
            </label>
            <div className="relative">
                <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold ${negative ? 'text-red-500/60' : 'text-slate-500'}`}>
                    {negative ? '−' : 'R$'}
                </span>
                <input
                    type="number" min="0" step="0.01" inputMode="decimal"
                    value={value}
                    onChange={e => onChange(parseFloat(e.target.value) || '')}
                    placeholder="0.00"
                    className={`w-full bg-surface-dark border rounded-xl h-10 pl-9 pr-3 text-sm outline-none transition-colors font-mono text-right ${
                        negative
                            ? 'border-red-900/40 text-red-300 focus:border-red-500'
                            : 'border-white/5 text-white focus:border-primary'
                    }`}
                />
            </div>
        </div>
    );
}
