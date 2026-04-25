'use client';

import { useState, useEffect, useMemo } from 'react';
import { Icons } from './Icons';
import { submitOrder } from '../../actions/order';
import { formatCurrency } from '@/lib/utils/price';
import { Loader2 } from 'lucide-react';
import type { Product } from '../../types';

interface CreateOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    products: Product[];
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
    finishing?: string;
    fileUrl?: string;
}

export default function CreateOrderModal({ isOpen, onClose, onSuccess, products }: CreateOrderModalProps) {
    const [isLoading, setIsLoading] = useState(false);

    // --- SEÇÃO A: DADOS DO CLIENTE (MANUAL) ---
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

    // --- SEÇÃO B: CARRINHO DE ITENS ---
    const [items, setItems] = useState<OrderItemRow[]>([]);

    // Form Item
    const [currentProductId, setCurrentProductId] = useState('');
    const [currentFileUrl, setCurrentFileUrl] = useState('');
    const [currentWidth, setCurrentWidth] = useState<number | ''>('');
    const [currentHeight, setCurrentHeight] = useState<number | ''>('');
    const [currentQty, setCurrentQty] = useState(1);
    const [currentUnitPrice, setCurrentUnitPrice] = useState<number | ''>('');
    const [currentObs, setCurrentObs] = useState('');
    const [currentFinishing, setCurrentFinishing] = useState('');

    // --- SEÇÃO C: FINANCEIRO ---
    const [serviceValue, setServiceValue] = useState<number | ''>('');
    const [shippingCost, setShippingCost] = useState<number | ''>('');
    const [discount, setDiscount] = useState<number | ''>('');
    const [paymentTerms, setPaymentTerms] = useState('');
    const [deliveryDate, setDeliveryDate] = useState('');
    const [notes, setNotes] = useState('');

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

    // Auto-Calculate Unit Price from pricePerM2
    useEffect(() => {
        if (selectedProduct && currentWidth && currentHeight) {
            const widthM = Number(currentWidth) / 100;
            const heightM = Number(currentHeight) / 100;
            const area = widthM * heightM;
            const calcPrice = area * selectedProduct.pricePerM2;
            const finalPrice = calcPrice < 10 ? 10 : calcPrice;
            setCurrentUnitPrice(parseFloat(finalPrice.toFixed(2)));
        }
    }, [selectedProduct, currentWidth, currentHeight]);

    // Add Item
    const handleAddItem = () => {
        if (!selectedProduct) return alert("Selecione um produto.");
        if (Number(currentQty) <= 0) return alert("Quantidade inválida.");

        const price = Number(currentUnitPrice) || 0;
        const total = price * Number(currentQty);

        const newItem: OrderItemRow = {
            productId: selectedProduct.id,
            productName: selectedProduct.name,
            width: Number(currentWidth) || 0,
            height: Number(currentHeight) || 0,
            quantity: Number(currentQty),
            unitPrice: price,
            total,
            observations: currentObs,
            finishing: currentFinishing,
            fileUrl: currentFileUrl
        };

        setItems([...items, newItem]);

        // Reset
        setCurrentProductId('');
        setCurrentWidth('');
        setCurrentHeight('');
        setCurrentQty(1);
        setCurrentUnitPrice('');
        setCurrentObs('');
        setCurrentFileUrl('');
    };

    const handleRemoveItem = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    // Totais
    const itemsSubtotal = useMemo(() => items.reduce((acc, curr) => acc + curr.total, 0), [items]);
    const finalTotal = useMemo(() => {
        const svc = Number(serviceValue) || 0;
        const ship = Number(shippingCost) || 0;
        const disc = Number(discount) || 0;
        return itemsSubtotal + svc + ship - disc;
    }, [itemsSubtotal, serviceValue, shippingCost, discount]);

    const handleSubmit = async () => {
        if (!clientName) return alert('O nome do cliente é obrigatório.');
        if (items.length === 0) return alert('Adicione pelo menos um item.');

        setIsLoading(true);

        const orderData = {
            clientName,
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
                material: i.productName,
                customDetails: i.observations,
                fileUrl: i.fileUrl
            })),

            serviceValue: Number(serviceValue) || 0,
            shippingCost: Number(shippingCost) || 0,
            discount: Number(discount) || 0,
            totalPrice: finalTotal,
            paymentTerms,
            deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
            notes
        };

        const result = await submitOrder(orderData);
        setIsLoading(false);

        if (result.success) {
            onSuccess();
            onClose();
        } else {
            alert(result.error || "Erro ao criar pedido");
        }
    };

    if (!isOpen) return null;

    return (
        // FULL SCREEN CONTAINER (Centered)
        <div className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col animate-in fade-in duration-300">

            {/* CENTERALIZED WRAPPER */}
            <div className="w-full h-full flex flex-col mx-auto max-w-[1920px] shadow-2xl">

                {/* HEADER */}
                <div className="flex-none h-20 px-8 border-b border-zinc-900 flex items-center justify-between bg-zinc-950">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center">
                            <Icons.Plus size={20} className="stroke-[3]" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight">Criar Novo Pedido</h2>
                            <p className="text-xs text-zinc-400">Monte o orçamento completo abaixo</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right hidden xl:block">
                            <p className="text-[10px] uppercase text-zinc-500 font-bold">Total Estimado</p>
                            <p className="text-xl font-mono text-green-400 font-bold">{formatCurrency(finalTotal)}</p>
                        </div>
                        <div className="h-8 w-px bg-zinc-800 mx-2 hidden xl:block"></div>
                        <button onClick={onClose} className="group flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
                            <span className="text-xs font-medium uppercase tracking-wider group-hover:underline">Fechar Escritório</span>
                            <div className="h-8 w-8 rounded-full bg-zinc-800 group-hover:bg-red-500/20 flex items-center justify-center transition-colors">
                                <Icons.X size={18} />
                            </div>
                        </button>
                    </div>
                </div>

                {/* BODY (SCROLLABLE) */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="max-w-[1600px] mx-auto space-y-8">

                        {/* 1. SECTION: CLIENTE */}
                        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="h-6 w-1 bg-blue-500 rounded-full"></div>
                                <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">1. Dados do Cliente</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                {/* Linha 1 */}
                                <div className="md:col-span-5">
                                    <label className="text-[10px] text-zinc-500 font-bold uppercase mb-1.5 block">Nome do Cliente / Empresa</label>
                                    <input className="w-full bg-black/40 border border-zinc-800 hover:border-zinc-700 focus:border-blue-500 rounded-lg h-11 px-4 text-sm text-white outline-none transition-all placeholder:text-zinc-700"
                                        value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Digite o nome do cliente..." autoFocus />
                                </div>
                                <div className="md:col-span-3">
                                    <label className="text-[10px] text-zinc-500 font-bold uppercase mb-1.5 block">CPF / CNPJ</label>
                                    <input className="w-full bg-black/40 border border-zinc-800 hover:border-zinc-700 focus:border-blue-500 rounded-lg h-11 px-4 text-sm text-white outline-none transition-all placeholder:text-zinc-700"
                                        value={clientDocument} onChange={e => setClientDocument(e.target.value)} placeholder="Documento..." />
                                </div>
                                <div className="md:col-span-3">
                                    <label className="text-[10px] text-zinc-500 font-bold uppercase mb-1.5 block">Telefone / WhatsApp</label>
                                    <input className="w-full bg-black/40 border border-zinc-800 hover:border-zinc-700 focus:border-blue-500 rounded-lg h-11 px-4 text-sm text-white outline-none transition-all placeholder:text-zinc-700"
                                        value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="(00) 00000-0000" />
                                </div>

                                {/* Linha 2 - Endereço Simplificado */}
                                <div className="md:col-span-2">
                                    <label className="text-[10px] text-zinc-500 font-bold uppercase mb-1.5 block">CEP</label>
                                    <input className="w-full bg-black/40 border border-zinc-800 hover:border-zinc-700 focus:border-blue-500 rounded-lg h-11 px-4 text-sm text-white outline-none transition-all placeholder:text-zinc-700"
                                        value={clientZip} onChange={e => setClientZip(e.target.value)} placeholder="00000-000" />
                                </div>
                                <div className="md:col-span-5">
                                    <label className="text-[10px] text-zinc-500 font-bold uppercase mb-1.5 block">Endereço Completo</label>
                                    <input className="w-full bg-black/40 border border-zinc-800 hover:border-zinc-700 focus:border-blue-500 rounded-lg h-11 px-4 text-sm text-white outline-none transition-all placeholder:text-zinc-700"
                                        value={clientStreet} onChange={e => setClientStreet(e.target.value)} placeholder="Rua, Bairro..." />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-[10px] text-zinc-500 font-bold uppercase mb-1.5 block">Número</label>
                                    <input className="w-full bg-black/40 border border-zinc-800 hover:border-zinc-700 focus:border-blue-500 rounded-lg h-11 px-4 text-sm text-white outline-none transition-all placeholder:text-zinc-700"
                                        value={clientNumber} onChange={e => setClientNumber(e.target.value)} placeholder="Nº" />
                                </div>
                            </div>
                        </div>

                        {/* 2. SECTION: ADD ITEM (HIGHLIGHTED) */}
                        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 shadow-xl shadow-black/40 relative overflow-hidden group">
                            {/* DecorativeGlow */}
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 blur-3xl rounded-full pointer-events-none group-hover:bg-blue-500/20 transition-all"></div>

                            <div className="flex items-center justify-between mb-6 relative z-10">
                                <div className="flex items-center gap-2">
                                    <div className="h-6 w-1 bg-green-500 rounded-full"></div>
                                    <h3 className="text-sm font-bold text-white uppercase tracking-wider text-shadow-sm">2. Adicionar Item</h3>
                                </div>
                                <div className="text-[10px] text-zinc-500 bg-zinc-950 px-2 py-1 rounded border border-zinc-800">
                                    Preencha os dados abaixo para inserir no carrinho
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 relative z-10">
                                {/* Col 1: Produto */}
                                <div className="md:col-span-3 space-y-4 border-r border-zinc-800/50 pr-4">
                                    <div>
                                        <label className="text-[10px] text-blue-400 font-bold uppercase mb-1.5 block">Produto / Material</label>
                                        <select className="w-full bg-zinc-950 border border-zinc-700 rounded-lg h-11 px-3 text-sm text-white focus:border-blue-500 outline-none cursor-pointer"
                                            value={currentProductId} onChange={e => setCurrentProductId(e.target.value)}>
                                            <option value="">Selecione...</option>
                                            {Array.from(categorizedProducts.entries()).map(([cat, prods]) => (
                                                <optgroup key={cat} label={cat}>
                                                    {prods.map(p => (
                                                        <option key={p.id} value={p.id}>{p.name}</option>
                                                    ))}
                                                </optgroup>
                                            ))}
                                        </select>
                                        <div className="text-right mt-1 h-4">
                                            {selectedProduct && (
                                                <span className="text-[10px] text-green-400 font-mono">
                                                    Base: {formatCurrency(selectedProduct.pricePerM2)}/m²
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Col 2: Infos do Arquivo e Medidas */}
                                <div className="md:col-span-7 grid grid-cols-2 gap-5 px-2">
                                    <div className="col-span-2">
                                        <label className="text-[10px] text-zinc-400 font-bold uppercase mb-1.5 block">Nome do Arquivo / Link da Arte</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                                                <Icons.FileText size={14} />
                                            </div>
                                            <input className="w-full bg-zinc-950 border border-zinc-700 rounded-lg h-11 pl-9 pr-3 text-sm text-white focus:border-blue-500 outline-none placeholder:text-zinc-700"
                                                value={currentFileUrl} onChange={e => setCurrentFileUrl(e.target.value)} placeholder="Ex: placa_fachada_vfinal.pdf" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3 col-span-2">
                                        <div>
                                            <label className="text-[10px] text-zinc-400 font-bold uppercase mb-1.5 block text-center">Largura (cm)</label>
                                            <input type="number" className="w-full bg-zinc-950 border border-zinc-700 rounded-lg h-11 text-center text-sm text-white focus:border-blue-500 outline-none placeholder:text-zinc-800 font-mono"
                                                value={currentWidth} onChange={e => setCurrentWidth(parseFloat(e.target.value) || '')} placeholder="0" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-zinc-400 font-bold uppercase mb-1.5 block text-center">Altura (cm)</label>
                                            <input type="number" className="w-full bg-zinc-950 border border-zinc-700 rounded-lg h-11 text-center text-sm text-white focus:border-blue-500 outline-none placeholder:text-zinc-800 font-mono"
                                                value={currentHeight} onChange={e => setCurrentHeight(parseFloat(e.target.value) || '')} placeholder="0" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-zinc-400 font-bold uppercase mb-1.5 block text-center">Quantidade</label>
                                            <input type="number" className="w-full bg-zinc-950 border border-zinc-700 rounded-lg h-11 text-center text-sm text-white focus:border-blue-500 outline-none placeholder:text-zinc-800 font-mono"
                                                value={currentQty} onChange={e => setCurrentQty(parseInt(e.target.value) || 1)} placeholder="1" />
                                        </div>
                                    </div>

                                    <div className="col-span-2">
                                        <input className="w-full bg-transparent border-b border-zinc-700 h-8 text-xs text-zinc-300 focus:border-zinc-500 outline-none placeholder:text-zinc-600 transition-colors"
                                            value={currentObs} onChange={e => setCurrentObs(e.target.value)} placeholder="Alguma observação técnica (ilhós, refile, emenda)..." />
                                    </div>
                                </div>

                                {/* Col 3: Preço e Botão Add */}
                                <div className="md:col-span-2 flex flex-col justify-end gap-3 border-l border-zinc-800/50 pl-4">
                                    <div>
                                        <label className="text-[10px] text-zinc-400 font-bold uppercase mb-1.5 block text-right">Valor Unit. (R$)</label>
                                        <input type="number" className="w-full bg-zinc-950 border border-zinc-700 rounded-lg h-11 px-3 text-right text-sm text-green-400 font-bold focus:border-green-500 outline-none font-mono"
                                            value={currentUnitPrice} onChange={e => setCurrentUnitPrice(parseFloat(e.target.value) || '')} placeholder="0.00" />
                                    </div>
                                    <button onClick={handleAddItem} className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase text-xs tracking-wider rounded-lg shadow-lg shadow-blue-900/50 flex items-center justify-center gap-2 transition-transform active:scale-95">
                                        <Icons.Plus size={16} /> Adicionar
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 3. SECTION: CARRINHO (TABLE) */}
                        <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-900/30">
                            <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-6 w-1 bg-yellow-500 rounded-full"></div>
                                    <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Itens no Pedido ({items.length})</h3>
                                </div>
                            </div>

                            <table className="w-full text-left text-sm text-zinc-300">
                                <thead className="bg-black/30 text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                                    <tr>
                                        <th className="p-4 pl-6">Produto / Detalhes</th>
                                        <th className="p-4 text-center">Dimensões</th>
                                        <th className="p-4 text-center">Qtd</th>
                                        <th className="p-4 text-right">Unitário</th>
                                        <th className="p-4 text-right pr-6">Subtotal</th>
                                        <th className="p-4 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/50">
                                    {items.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-zinc-800/30 transition-colors group">
                                            <td className="p-4 pl-6">
                                                <div className="font-bold text-white mb-1 relative inline-block">
                                                    {item.productName}
                                                    {/* Decorative Dot */}
                                                    <span className="absolute -left-3 top-1.5 h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                                                </div>
                                                <div className="flex flex-col gap-0.5 mt-1">
                                                    {item.fileUrl && (
                                                        <div className="flex items-center gap-1.5 text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded w-fit">
                                                            <Icons.FileText size={10} /> {item.fileUrl}
                                                        </div>
                                                    )}
                                                    {item.observations && <div className="text-xs text-zinc-500 italic">Obs: {item.observations}</div>}
                                                </div>
                                            </td>
                                            <td className="p-4 text-center font-mono text-zinc-400  bg-black/10">
                                                {item.width} x {item.height} <span className="text-zinc-600 text-[10px]">cm</span>
                                            </td>
                                            <td className="p-4 text-center font-bold text-white">{item.quantity}</td>
                                            <td className="p-4 text-right font-mono text-zinc-400">{formatCurrency(item.unitPrice)}</td>
                                            <td className="p-4 text-right font-mono text-green-400 font-bold pr-6">{formatCurrency(item.total)}</td>
                                            <td className="p-4 text-center">
                                                <button onClick={() => handleRemoveItem(idx)} className="h-8 w-8 rounded flex items-center justify-center text-zinc-600 hover:text-red-400 hover:bg-red-400/10 transition-colors opacity-0 group-hover:opacity-100">
                                                    <Icons.Trash size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {items.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="p-12 text-center text-zinc-600 italic">
                                                Nenhum item adicionado ainda.<br />
                                                <span className="text-xs">Utilize o painel acima para adicionar.</span>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                    </div>
                </div>

                {/* FOOTER (FIXED) */}
                <div className="flex-none bg-zinc-950 border-t border-zinc-800 p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20">
                    <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 items-center">

                        {/* Esquerda: Inputs Financeiros */}
                        <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] text-zinc-500 uppercase font-bold">Frete / Entr.</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-zinc-500 text-xs">R$</span>
                                    <input type="number" className="w-full bg-zinc-900 border border-zinc-800 rounded h-9 pl-8 pr-3 text-sm text-white focus:border-white/20 outline-none"
                                        value={shippingCost} onChange={e => setShippingCost(parseFloat(e.target.value) || '')} placeholder="0.00" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] text-zinc-500 uppercase font-bold">Mão de Obra</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-zinc-500 text-xs">R$</span>
                                    <input type="number" className="w-full bg-zinc-900 border border-zinc-800 rounded h-9 pl-8 pr-3 text-sm text-white focus:border-white/20 outline-none"
                                        value={serviceValue} onChange={e => setServiceValue(parseFloat(e.target.value) || '')} placeholder="0.00" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] text-zinc-500 uppercase font-bold text-red-400">Desconto (-)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-red-900 text-xs">R$</span>
                                    <input type="number" className="w-full bg-zinc-900 border border-red-900/30 rounded h-9 pl-8 pr-3 text-sm text-red-300 focus:border-red-500 outline-none"
                                        value={discount} onChange={e => setDiscount(parseFloat(e.target.value) || '')} placeholder="0.00" />
                                </div>
                            </div>
                        </div>

                        {/* Direita: Total e Ação */}
                        <div className="md:col-span-4 flex items-center justify-end gap-6">
                            <div className="text-right">
                                <p className="text-xs text-zinc-500 font-bold uppercase">Valor Final</p>
                                <p className="text-3xl font-bold text-green-400 tracking-tighter">{formatCurrency(finalTotal)}</p>
                            </div>
                            <div className="h-10 w-px bg-zinc-800"></div>
                            <button onClick={handleSubmit} disabled={isLoading || items.length === 0}
                                className="h-14 px-8 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold shadow-lg shadow-green-600/20 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50 disabled:grayscale">
                                {isLoading ? <Loader2 size={24} className="animate-spin" /> : <Icons.Check size={24} />}
                                <span>CONCLUIR PEDIDO</span>
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
