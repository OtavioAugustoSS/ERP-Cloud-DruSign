'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Icons } from './Icons';
import { getAllProducts } from '../../actions/product';
import { formatCurrency } from '../../lib/utils/price';
import { submitOrder } from '../../actions/order';
import { uploadFiles } from '@/actions/upload';
import { Product, OrderInput } from '../../types';
import { useAuth } from '../../context/AuthContext';

export default function Dashboard() {
    // State
    const { user } = useAuth();
    const isEmployee = user?.role === 'employee';

    const [products, setProducts] = useState<Product[]>([]);
    const [activeCategory, setActiveCategory] = useState<string>('Adesivo');
    const [selectedProductId, setSelectedProductId] = useState<string>('');

    // Order Details
    const [clientName, setClientName] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [clientDocument, setClientDocument] = useState('');

    // Dimensions & Quantity
    const [width, setWidth] = useState<number>(0);
    const [height, setHeight] = useState<number>(0);
    const [quantity, setQuantity] = useState<number>(1);

    // Specific Fields
    const [selectedServiceType, setSelectedServiceType] = useState('Banner Promocional');
    const [lonaFinishing, setLonaFinishing] = useState('Bainha e Ilhós');
    const [acrylicThickness, setAcrylicThickness] = useState('3mm');

    const [instructions, setInstructions] = useState('');

    // File Upload State
    const [files, setFiles] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    // Load Products on Mount
    useEffect(() => {
        const fetchProducts = async () => {
            const data = await getAllProducts();
            setProducts(data);

            // Ensure we have a selection on load if data exists
            if (data.length > 0) {
                // Try to keep current category if possible, else default to first
                // For initial load, we perform this logic
                const initialCategoryProducts = data.filter(p => p.category === 'Adesivo');
                if (initialCategoryProducts.length > 0) {
                    setSelectedProductId(initialCategoryProducts[0].id);
                    setActiveCategory('Adesivo');
                } else {
                    setActiveCategory(data[0].category);
                    setSelectedProductId(data[0].id);
                }
            }
        };
        fetchProducts();
    }, []);

    // Derived Categories
    const categoryTabs = useMemo(() => {
        const categories = Array.from(new Set(products.map(p => p.category)));
        // Optional: define a preferred order or sort alphabetically
        // We can force specific ones to start if they exist
        const preferredOrder = ['Adesivo', 'ADESIVO', 'Lona', 'LONA', 'ACM', 'Acrílico', 'ACRÍLICO', 'PS', 'PVC'];

        return categories.sort((a, b) => {
            const indexA = preferredOrder.indexOf(a);
            const indexB = preferredOrder.indexOf(b);

            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.localeCompare(b);
        }).map(cat => ({
            label: cat.toUpperCase(),
            dataKey: cat
        }));
    }, [products]);

    // Filter products based on active category
    const categoryProducts = useMemo(() => {
        return products.filter(p => p.category === activeCategory);
    }, [products, activeCategory]);

    // Effect to sync Acrylic Thickness selection with the actual Product ID
    useEffect(() => {
        if (activeCategory === 'Acrílico') {
            const targetName = `Acrílico ${acrylicThickness}`;
            const matchingProduct = products.find(p => p.name === targetName);
            if (matchingProduct) {
                setSelectedProductId(matchingProduct.id);
            }
        }
    }, [activeCategory, acrylicThickness, products]);

    // Derived State
    const selectedProduct = useMemo(() =>
        products.find(p => p.id === selectedProductId) || null
        , [products, selectedProductId]);

    // Calculate Effective Price per M2
    const effectivePricePerM2 = useMemo(() => {
        if (!selectedProduct) return 0;

        // Handle Acrylic Pricing by Thickness
        if ((activeCategory === 'Acrílico' || activeCategory === 'ACRÍLICO') &&
            selectedProduct.pricingConfig?.pricesByThickness &&
            selectedProduct.pricingConfig?.pricesByThickness[acrylicThickness]) {
            return selectedProduct.pricingConfig.pricesByThickness[acrylicThickness];
        }

        // Handle Generic Subtype Pricing (e.g. Adesivo types)
        if (selectedProduct.pricingConfig?.pricesByType &&
            selectedServiceType &&
            selectedProduct.pricingConfig.pricesByType[selectedServiceType]) {
            return selectedProduct.pricingConfig.pricesByType[selectedServiceType];
        }

        return selectedProduct.pricePerM2;
    }, [selectedProduct, activeCategory, acrylicThickness]);

    const totalPrice = useMemo(() => {
        if (width <= 0 || height <= 0 || quantity <= 0) return 0;
        const areaM2 = (width * height) / 10000;
        return areaM2 * effectivePricePerM2 * quantity;
    }, [width, height, quantity, effectivePricePerM2]);

    // Handlers
    const handleCategoryChange = (dataKey: string) => {
        setActiveCategory(dataKey);
        // Auto-select first product in new category
        // For Acrylic, we default to finding the one matching current thickness state or defaulting to 3mm
        if (dataKey === 'Acrílico') {
            // The useEffect above will handle setting the ID based on acrylicThickness
        } else {
            const firstInCat = products.find(p => p.category === dataKey);
            if (firstInCat) {
                setSelectedProductId(firstInCat.id);
            }
        }

        // Reset specific fields to defaults
        setSelectedServiceType(''); // Reset generic type, will be populated by effect or user input
        setLonaFinishing('Bainha e Ilhós'); // Default default handling

        // Find if new category has subtypes and select first one
        if (dataKey !== 'Acrílico') {
            const productsInCat = products.filter(p => p.category === dataKey);
            if (productsInCat.length > 0 && productsInCat[0].pricingConfig?.types?.length > 0) {
                setSelectedServiceType(productsInCat[0].pricingConfig.types[0]);
            } else if (dataKey === 'Lona' || dataKey === 'LONA') {
                setSelectedServiceType('Banner Promocional');
            }
        }
        setLonaFinishing('Bainha e Ilhós');
        if (dataKey !== 'Acrílico') {
            // Only reset thickness if we aren't switching TO acrylic, 
            // though strictly we could reset it. 
            setAcrylicThickness('3mm');
        }
    };

    const handleQuantityChange = (delta: number) => {
        setQuantity(prev => Math.max(1, prev + delta));
    };

    // --- File Upload Handlers ---
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const droppedFiles = Array.from(e.dataTransfer.files).filter(
            (file: File) => file.type === 'application/pdf'
        );

        if (droppedFiles.length > 0) {
            setFiles(prev => [...prev, ...droppedFiles]);
        } else {
            // Optional: Notify user that only PDFs are allowed
            if (e.dataTransfer.files.length > 0) {
                setNotification({ message: "Apenas arquivos PDF são permitidos.", type: 'error' });
                setTimeout(() => setNotification(null), 3000);
            }
        }
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, ''); // Remove non-numbers
        if (value.length > 11) value = value.slice(0, 11); // Limit to 11 digits

        // Apply Mask
        if (value.length > 10) {
            // (XX) XXXXX-XXXX
            value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
        } else if (value.length > 6) {
            // (XX) XXXX-XXXX (Partial)
            value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
        } else if (value.length > 2) {
            // (XX) XXXX (Partial)
            value = value.replace(/^(\d{2})(\d{0,5}).*/, '($1) $2');
        } else if (value.length > 0) {
            // (XX (Partial)
            value = value.replace(/^(\d{0,2})/, '($1');
        }

        setClientPhone(value);
    };

    const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 14) value = value.slice(0, 14);

        // CPF (11) or CNPJ (14) Mask
        if (value.length > 11) {
            // CNPJ: 00.000.000/0000-00
            value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2}).*/, '$1.$2.$3/$4-$5');
        } else if (value.length > 9) {
            // CPF: 000.000.000-00
            value = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{2}).*/, '$1.$2.$3-$4');
        } else if (value.length > 6) {
            value = value.replace(/^(\d{3})(\d{3})(\d{0,3}).*/, '$1.$2.$3');
        } else if (value.length > 3) {
            value = value.replace(/^(\d{3})(\d{0,3}).*/, '$1.$2');
        }

        setClientDocument(value);
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files).filter(
                (file: File) => file.type === 'application/pdf'
            );
            setFiles(prev => [...prev, ...selectedFiles]);
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    // --- Submit Handler ---
    const handleCreateOrder = async () => {
        if (!selectedProduct) return;

        setIsSubmitting(true);

        // Prepare data based on conditional logic
        // Prepare data based on conditional logic
        let finalServiceType: string | undefined = undefined;
        let finalFinishing: string | undefined = undefined;
        let finalInstructions = instructions;

        if (activeCategory === 'Lona' || activeCategory === 'LONA') {
            finalServiceType = selectedServiceType;
            finalFinishing = lonaFinishing;
        } else if (activeCategory === 'Acrílico' || activeCategory === 'ACRÍLICO') {
            finalServiceType = 'Corte Router/Laser';
            // Save thickness in finishing field instead of instructions
            finalFinishing = `Espessura: ${acrylicThickness}`;
            finalInstructions = instructions;
        } else if (selectedServiceType) {
            // For others like Adesivo
            finalServiceType = selectedServiceType;
        }
        // For Adesivo, PS, CM, we rely on the Product Name itself, no extra service type needed unless specified.


        // Handle File Uploads
        let uploadedPaths: string[] = [];
        if (files.length > 0) {
            const formData = new FormData();
            files.forEach(file => formData.append('files', file));

            setNotification({ message: "Enviando arquivos...", type: 'success' });
            const uploadResult = await uploadFiles(formData);

            if (uploadResult.success && uploadResult.filePaths) {
                uploadedPaths = uploadResult.filePaths;
            } else {
                setNotification({ message: "Erro ao enviar arquivos", type: 'error' });
                setIsSubmitting(false);
                return;
            }
        }


        // Generate a session-based preview URL if a file is present
        const previewUrl = files.length > 0 ? URL.createObjectURL(files[0]) : undefined;

        try {
            const orderData: OrderInput = {
                clientName: isEmployee ? 'Cliente Balcão' : (clientName || 'Cliente'), // Explicit default if empty
                clientPhone: isEmployee ? undefined : clientPhone,
                clientDocument: isEmployee ? undefined : clientDocument,
                filePaths: uploadedPaths,
                productName: selectedProduct?.name || 'Produto Personalizado',
                width,
                height,
                quantity,
                productId: selectedProduct.id,
                totalPrice,
                serviceType: finalServiceType,
                finishing: finalFinishing,
                instructions: finalInstructions,
                previewUrl: previewUrl
            };

            const result = await submitOrder(orderData);

            if (result.success) {
                setNotification({ message: `Pedido #${result.order?.id} enviado para produção!`, type: 'success' });
                setInstructions(''); // Clear instructions
                setFiles([]); // Clear files
                setClientName(''); // Clear client name
                setClientPhone('');
                setClientDocument('');
                // Reset dimensions for next order
                setWidth(0);
                setHeight(0);
                setQuantity(1);
            } else {
                setNotification({ message: result.error || "Erro ao gerar pedido", type: 'error' });
            }
        } catch (error) {
            setNotification({ message: "Erro de conexão", type: 'error' });
        } finally {
            setIsSubmitting(false);
            setTimeout(() => setNotification(null), 3000);
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-background-dark bg-grid-subtle">

            {/* Header */}
            <header className="flex-none px-8 py-6 border-b border-white/5 bg-background-dark/80 backdrop-blur-md z-10">
                <div className="flex flex-wrap justify-between items-center gap-4">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-white text-3xl font-bold leading-tight tracking-tight">Novo Orçamento</h2>
                        <p className="text-slate-400 text-sm font-normal">Configure os detalhes do produto para gerar o pedido.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs text-primary uppercase tracking-wider font-semibold">Data de Hoje</p>
                            <p className="text-white font-mono">{new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                        </div>
                        <button className="size-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors relative">
                            <Icons.Bell size={20} />
                            <span className="absolute top-2 right-2 size-2 bg-primary rounded-full"></span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 pt-6">
                <div className="max-w-[1600px] mx-auto">

                    {/* Notification Toast */}
                    {notification && (
                        <div className={`fixed top-24 right-8 z-50 px-6 py-4 rounded-xl shadow-2xl border backdrop-blur-md transition-all animate-bounce ${notification.type === 'success'
                            ? 'bg-green-900/80 border-green-500/50 text-white'
                            : 'bg-red-900/80 border-red-500/50 text-white'
                            }`}>
                            <div className="flex items-center gap-3">
                                {notification.type === 'success' ? <Icons.CheckCircle size={20} /> : <Icons.Alert size={20} />}
                                <p className="font-bold">{notification.message}</p>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col xl:flex-row gap-6 lg:gap-8">

                        {/* Left Column: Form */}
                        <div className="flex-1 flex flex-col gap-6">

                            {/* Product Specs Card */}
                            <div className="rounded-3xl border border-white/10 bg-surface-dark shadow-xl overflow-hidden">
                                <div className="p-5 border-b border-white/5 bg-black/20 flex justify-between items-center">
                                    <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                                        <Icons.Tune className="text-primary" size={24} />
                                        Especificações do Material
                                    </h3>
                                </div>

                                <div className="p-5 md:p-8 space-y-8">
                                    {/* Client Name & Phone Input (Admin Only) */}
                                    {!isEmployee && (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="flex-1">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Nome do Cliente</label>
                                                <input
                                                    type="text"
                                                    value={clientName}
                                                    onChange={(e) => setClientName(e.target.value)}
                                                    placeholder="Digite o nome..."
                                                    className="w-full h-12 rounded-xl bg-black/40 border border-white/10 focus:border-primary text-white text-sm px-4 focus:ring-1 focus:ring-primary transition-all outline-none placeholder-slate-600"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Telefone</label>
                                                <input
                                                    type="text"
                                                    value={clientPhone}
                                                    onChange={handlePhoneChange}
                                                    placeholder="(00) 00000-0000"
                                                    maxLength={15}
                                                    className="w-full h-12 rounded-xl bg-black/40 border border-white/10 focus:border-primary text-white text-sm px-4 focus:ring-1 focus:ring-primary transition-all outline-none placeholder-slate-600"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">CPF / CNPJ</label>
                                                <input
                                                    type="text"
                                                    value={clientDocument}
                                                    onChange={handleDocumentChange}
                                                    placeholder="000.000.000-00"
                                                    className="w-full h-12 rounded-xl bg-black/40 border border-white/10 focus:border-primary text-white text-sm px-4 focus:ring-1 focus:ring-primary transition-all outline-none placeholder-slate-600"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Material Selection Tabs */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Selecione o Material</label>
                                        <div className="flex flex-wrap gap-2">
                                            <div className="flex flex-wrap gap-2">
                                                {categoryTabs.map(tab => (
                                                    <button
                                                        key={tab.dataKey}
                                                        onClick={() => handleCategoryChange(tab.dataKey)}
                                                        className={`px-5 py-2.5 rounded-full text-sm font-bold tracking-wide uppercase transition-all shadow-lg ${activeCategory === tab.dataKey
                                                            ? 'bg-primary text-background-dark shadow-[0_0_15px_rgba(34,211,238,0.4)] scale-105'
                                                            : 'bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10 hover:text-white'
                                                            }`}
                                                    >
                                                        {tab.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6 pt-4 border-t border-dashed border-white/10">

                                        {/* --- DYNAMIC FIELDS AREA --- */}

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                            {/* 1. Unified Material Selection (Product + Type) - EXCLUDING LONA */}
                                            {!['Acrílico', 'ACRÍLICO', 'ACM', 'PS', 'PVC', 'Lona', 'LONA'].includes(activeCategory) && (
                                                <div className="flex flex-col gap-2">
                                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tipo de Material</label>
                                                    <div className="relative">
                                                        <select
                                                            value={
                                                                selectedServiceType && selectedProduct?.pricingConfig?.types?.includes(selectedServiceType)
                                                                    ? `${selectedProductId}:${selectedServiceType}`
                                                                    : selectedProductId
                                                            }
                                                            onChange={(e) => {
                                                                const [newProdId, newType] = e.target.value.split(':');
                                                                setSelectedProductId(newProdId);
                                                                if (newType) {
                                                                    setSelectedServiceType(newType);
                                                                } else {
                                                                    if (activeCategory !== 'Lona' && activeCategory !== 'LONA') {
                                                                        setSelectedServiceType('');
                                                                    }
                                                                }
                                                            }}
                                                            className="w-full h-12 rounded-lg bg-black/40 border border-white/10 focus:border-primary text-white text-sm px-4 focus:ring-1 focus:ring-primary transition-all outline-none appearance-none cursor-pointer"
                                                        >
                                                            {categoryProducts.flatMap(p => {
                                                                if (p.pricingConfig?.types && p.pricingConfig.types.length > 0) {
                                                                    return p.pricingConfig.types.map(type => (
                                                                        <option key={`${p.id}:${type}`} value={`${p.id}:${type}`} className="bg-slate-900 text-white">
                                                                            {p.name} {type}
                                                                        </option>
                                                                    ));
                                                                }
                                                                return (
                                                                    <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                                                                        {p.name}
                                                                    </option>
                                                                );
                                                            })}
                                                            {categoryProducts.length === 0 && <option disabled className="bg-slate-900 text-white">Sem produtos nesta categoria</option>}
                                                        </select>
                                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                                            <Icons.ChevronDown size={18} />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* 1.1 LONA Material Selection (Product Only) */}
                                            {(activeCategory === 'Lona' || activeCategory === 'LONA') && (
                                                <div className="flex flex-col gap-2">
                                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Material</label>
                                                    <div className="relative">
                                                        <select
                                                            value={selectedProductId}
                                                            onChange={(e) => setSelectedProductId(e.target.value)}
                                                            className="w-full h-12 rounded-lg bg-black/40 border border-white/10 focus:border-primary text-white text-sm px-4 focus:ring-1 focus:ring-primary transition-all outline-none appearance-none cursor-pointer"
                                                        >
                                                            {categoryProducts.map(p => (
                                                                <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                                                                    {p.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                                            <Icons.ChevronDown size={18} />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* 2. Specific Fields based on Category */}

                                            {/* CASE: LONA */}
                                            {(activeCategory === 'Lona' || activeCategory === 'LONA') && (
                                                <>
                                                    <div className="flex flex-col gap-2">
                                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tipo de Serviço</label>
                                                        <div className="relative">
                                                            <select
                                                                value={selectedServiceType}
                                                                onChange={(e) => setSelectedServiceType(e.target.value)}
                                                                className="w-full h-12 rounded-lg bg-black/40 border border-white/10 focus:border-primary text-white text-sm px-4 focus:ring-1 focus:ring-primary transition-all outline-none appearance-none cursor-pointer"
                                                            >
                                                                {(['Banner', 'Grandes Formatos']).map((type: string) => (
                                                                    <option key={type} value={type} className="bg-slate-900 text-white">{type}</option>
                                                                ))}
                                                            </select>
                                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                                                <Icons.ChevronDown size={18} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Acabamento</label>
                                                        <div className="relative">
                                                            <select
                                                                value={lonaFinishing}
                                                                onChange={(e) => setLonaFinishing(e.target.value)}
                                                                className="w-full h-12 rounded-lg bg-black/40 border border-white/10 focus:border-primary text-white text-sm px-4 focus:ring-1 focus:ring-primary transition-all outline-none appearance-none cursor-pointer"
                                                            >
                                                                {(['Bainha e Ilhós', 'Bastão e Corda', 'Sem Acabamento']).map((opt: string) => (
                                                                    <option key={opt} value={opt} className="bg-slate-900 text-white">{opt}</option>
                                                                ))}
                                                            </select>
                                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                                                <Icons.ChevronDown size={18} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </>
                                            )}

                                            {/* CASE: ACRÍLICO */}
                                            {/* CASE: ACRÍLICO */}
                                            {(activeCategory === 'Acrílico' || activeCategory === 'ACRÍLICO') && (
                                                <div className="md:col-span-2 flex flex-col gap-2">
                                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Espessura</label>
                                                    <div className="relative">
                                                        <select
                                                            value={acrylicThickness}
                                                            onChange={(e) => setAcrylicThickness(e.target.value)}
                                                            className="w-full h-12 rounded-lg bg-black/40 border border-white/10 focus:border-primary text-white text-sm px-4 focus:ring-1 focus:ring-primary transition-all outline-none appearance-none cursor-pointer"
                                                        >
                                                            {(selectedProduct?.pricingConfig?.thicknessOptions || []).map((thickness: string) => (
                                                                <option key={thickness} value={thickness} className="bg-slate-900 text-white">
                                                                    {thickness}
                                                                </option>
                                                            ))}
                                                            {(!selectedProduct?.pricingConfig?.thicknessOptions || selectedProduct.pricingConfig.thicknessOptions.length === 0) && (
                                                                <option disabled className="bg-slate-900 text-white">Sem espessuras disponíveis</option>
                                                            )}
                                                        </select>
                                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                                            <Icons.ChevronDown size={18} />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                        </div>

                                        {/* --- END DYNAMIC FIELDS AREA --- */}

                                        {/* Row 3: Universal Dimensions & Quantity */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                                            <div className="flex flex-col gap-2">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Largura (cm)</label>
                                                <input
                                                    type="number"
                                                    value={width || ''} // Handle leading zero: show empty string if 0
                                                    onChange={(e) => setWidth(Number(e.target.value))}
                                                    placeholder="0"
                                                    className="w-full h-12 rounded-xl bg-black/40 border border-white/10 focus:border-primary text-white text-lg font-mono px-4 focus:ring-1 focus:ring-primary transition-all outline-none placeholder-slate-700"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Altura (cm)</label>
                                                <input
                                                    type="number"
                                                    value={height || ''} // Handle leading zero: show empty string if 0
                                                    onChange={(e) => setHeight(Number(e.target.value))}
                                                    placeholder="0"
                                                    className="w-full h-12 rounded-xl bg-black/40 border border-white/10 focus:border-primary text-white text-lg font-mono px-4 focus:ring-1 focus:ring-primary transition-all outline-none placeholder-slate-700"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quantidade</label>
                                                <div className="relative flex items-center">
                                                    <button
                                                        onClick={() => handleQuantityChange(-1)}
                                                        className="absolute left-2 size-8 rounded-lg bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-colors"
                                                    >
                                                        <Icons.Minus size={16} />
                                                    </button>
                                                    <input
                                                        type="number"
                                                        value={quantity}
                                                        onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                                                        className="w-full h-12 rounded-xl bg-black/40 border border-white/10 focus:border-primary text-white text-lg font-mono text-center px-12 focus:ring-1 focus:ring-primary transition-all outline-none"
                                                    />
                                                    <button
                                                        onClick={() => handleQuantityChange(1)}
                                                        className="absolute right-2 size-8 rounded-lg bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-colors"
                                                    >
                                                        <Icons.Plus size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Upload & Instructions Card */}
                            {/* Upload & Instructions Card - HIDDEN FOR EMPLOYEES */}
                            {!isEmployee && (
                                <div className="rounded-3xl border border-white/10 bg-surface-dark shadow-xl overflow-hidden">
                                    <div className="p-5 border-b border-white/5 bg-black/20">
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            <Icons.Upload className="text-primary" size={24} />
                                            Arquivos de Impressão & Instruções
                                        </h3>
                                    </div>
                                    <div className="p-5 md:p-8 space-y-6">
                                        {/* Drag and Drop Area */}
                                        <div className="flex flex-col gap-4">
                                            <div
                                                onDragOver={handleDragOver}
                                                onDragLeave={handleDragLeave}
                                                onDrop={handleDrop}
                                                className={`w-full rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer group relative overflow-hidden ${isDragging
                                                    ? 'border-primary bg-primary/10 h-40 scale-[1.02]'
                                                    : 'border-white/10 bg-black/40 hover:bg-black/60 hover:border-primary/50 h-40'
                                                    }`}
                                            >
                                                <div className={`absolute inset-0 bg-primary/5 transition-opacity pointer-events-none ${isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}></div>
                                                <div className={`size-14 rounded-full bg-white/5 flex items-center justify-center mb-3 transition-transform duration-300 z-10 ${isDragging ? 'scale-110 text-primary' : 'group-hover:scale-110'}`}>
                                                    <Icons.Upload className={`${isDragging ? 'text-primary' : 'text-slate-400 group-hover:text-primary'} transition-colors`} size={28} />
                                                </div>
                                                <p className={`font-medium z-10 text-sm transition-colors ${isDragging ? 'text-primary' : 'text-white'}`}>
                                                    {isDragging ? 'Solte para anexar os arquivos PDF' : 'Arraste seus arquivos PDF aqui'}
                                                </p>
                                                <p className="text-slate-500 text-xs z-10">ou clique para selecionar</p>
                                                <input
                                                    type="file"
                                                    accept="application/pdf"
                                                    multiple
                                                    onChange={handleFileInput}
                                                    className="absolute inset-0 opacity-0 cursor-pointer z-20"
                                                />
                                            </div>

                                            {/* File List */}
                                            {files.length > 0 && (
                                                <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
                                                    {files.map((file, idx) => (
                                                        <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 group hover:border-white/20 transition-all">
                                                            <div className="flex items-center gap-3 overflow-hidden">
                                                                <div className="size-10 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center flex-none border border-red-500/10">
                                                                    <Icons.Description size={20} />
                                                                </div>
                                                                <div className="flex flex-col overflow-hidden">
                                                                    <span className="text-sm text-white truncate font-medium">{file.name}</span>
                                                                    <span className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB • PDF</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    onClick={() => window.open(URL.createObjectURL(file), '_blank')}
                                                                    className="size-8 rounded-full hover:bg-white/10 text-slate-500 hover:text-primary flex items-center justify-center transition-colors"
                                                                    title="Visualizar arquivo"
                                                                >
                                                                    <Icons.Eye size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => removeFile(idx)}
                                                                    className="size-8 rounded-full hover:bg-red-500/20 text-slate-500 hover:text-red-500 flex items-center justify-center transition-colors"
                                                                    title="Remover arquivo"
                                                                >
                                                                    <Icons.Trash size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Instruções para Produção</label>
                                            <textarea
                                                value={instructions}
                                                onChange={(e) => setInstructions(e.target.value)}
                                                className="w-full h-24 rounded-xl bg-black/40 border border-white/10 focus:border-primary text-white text-sm p-4 focus:ring-1 focus:ring-primary transition-all outline-none resize-none placeholder-slate-600"
                                                placeholder="Adicione observações para a equipe de produção, ex: refilar rente à imagem, atenção com pantone..."
                                            ></textarea>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Column: Order Summary (Sticky) */}
                        <div className="xl:w-96 flex-none flex flex-col gap-6 w-full lg:w-[360px]">
                            <div className="rounded-3xl bg-surface-dark/90 border border-white/5 p-6 relative overflow-hidden sticky top-4 shadow-2xl backdrop-blur-md">
                                <div
                                    className="absolute inset-0 opacity-20 pointer-events-none"
                                    style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/dark-matter.png")' }}
                                ></div>

                                <div className="relative z-10 flex flex-col">
                                    <div className="flex items-center gap-3 mb-5 pb-5 border-b border-white/10">
                                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                            <Icons.Receipt size={24} />
                                        </div>
                                        <h4 className="text-white text-lg font-bold">Resumo do Pedido</h4>
                                    </div>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex justify-between items-start text-sm group">
                                            <span className="text-slate-400">Material</span>
                                            <span className="text-white font-medium text-right group-hover:text-primary transition-colors">
                                                {selectedProduct
                                                    ? `${selectedProduct.name} ${selectedServiceType && activeCategory !== 'Lona' && activeCategory !== 'LONA' ? selectedServiceType : ''}`
                                                    : 'Selecione...'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-start text-sm">
                                            <span className="text-slate-400">Dimensões</span>
                                            <span className="text-white font-mono text-right">{width}x{height}cm</span>
                                        </div>

                                        {/* Dynamic Summary Fields */}
                                        {/* Dynamic Finishing/Type Display in Summary */}
                                        {(activeCategory === 'Lona' || activeCategory === 'LONA') && selectedServiceType && (
                                            <div className="flex justify-between items-start text-sm">
                                                <span className="text-slate-400">Tipo</span>
                                                <span className="text-white text-right text-xs max-w-[150px]">{selectedServiceType}</span>
                                            </div>
                                        )}
                                        {((activeCategory === 'Lona' || activeCategory === 'LONA') && lonaFinishing) && (
                                            <div className="flex justify-between items-start text-sm">
                                                <span className="text-slate-400">Acabamento</span>
                                                <span className="text-white text-right text-xs max-w-[150px]">{lonaFinishing}</span>
                                            </div>
                                        )}
                                        {((activeCategory === 'Acrílico' || activeCategory === 'ACRÍLICO') && acrylicThickness) && (
                                            <div className="flex justify-between items-start text-sm">
                                                <span className="text-slate-400">Espessura</span>
                                                <span className="text-white text-right font-mono">{acrylicThickness}</span>
                                            </div>
                                        )}

                                        <div className="flex justify-between items-start text-sm">
                                            <span className="text-slate-400">Qtd.</span>
                                            <span className="text-white font-mono text-right">{quantity}</span>
                                        </div>

                                        {files.length > 0 && (
                                            <div className="flex justify-between items-start text-sm pt-2 border-t border-white/5">
                                                <span className="text-slate-400">Arquivos</span>
                                                <span className="text-white font-mono text-right">{files.length} anexo(s)</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-black/20 rounded-2xl p-5 border border-primary/20 text-center mb-5 shadow-[0_0_30px_rgba(34,211,238,0.05)] relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-2 opacity-10">
                                            <span className="text-6xl text-primary font-serif">$</span>
                                        </div>
                                        <p className="text-slate-400 text-xs font-bold uppercase mb-1 relative z-10">Total Estimado</p>
                                        <p className="text-4xl font-mono font-bold text-white tracking-tighter relative z-10">
                                            {formatCurrency(totalPrice)}
                                        </p>
                                    </div>

                                    {!isEmployee ? (
                                        <button
                                            onClick={handleCreateOrder}
                                            disabled={isSubmitting || !selectedProduct}
                                            className={`w-full py-4 rounded-2xl font-bold text-lg shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all transform flex items-center justify-center gap-3 group ${isSubmitting || !selectedProduct
                                                ? 'bg-gray-600 text-gray-300 cursor-not-allowed opacity-50'
                                                : 'bg-primary hover:bg-primary-hover text-background-dark hover:shadow-[0_0_40px_rgba(34,211,238,0.6)] hover:-translate-y-1 active:translate-y-0'
                                                }`}
                                        >
                                            {isSubmitting ? (
                                                <span>Processando...</span>
                                            ) : (
                                                <>
                                                    <span>Gerar Pedido</span>
                                                    <Icons.Send className="group-hover:translate-x-1 transition-transform font-bold" size={20} />
                                                </>
                                            )}
                                        </button>
                                    ) : (
                                        <div className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                                            <p className="text-slate-400 text-sm font-medium">Modo Calculadora (Sem permissão de criar pedidos)</p>
                                        </div>
                                    )}

                                    <div className="mt-4 flex items-center justify-center gap-2">
                                        <span className="size-2 rounded-full bg-green-500 animate-pulse"></span>
                                        <p className="text-center text-xs text-slate-500">Valor atualizado em tempo real</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="h-12"></div>
                </div>
            </div>
        </div>
    );
}
