import { Settings, X, ChevronDown, Layers, Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import { updateProductPricing } from '@/actions/product';

// Updated Material Types
export type MaterialType = 'LONA' | 'ADESIVO' | 'ACM' | 'PVC' | 'PS' | 'ACRÍLICO';

// Map Tabs to Database IDs
const TAB_TO_ID: Record<MaterialType, string> = {
    'LONA': 'banner-440',
    'ADESIVO': 'adesivo-vinil',
    'ACM': 'chapa-acm',
    'PVC': 'chapa-pvc',
    'PS': 'chapa-ps',
    'ACRÍLICO': 'chapa-acrilico'
};

interface MaterialDef {
    id?: string; // DB ID
    label: string;
    pricePerM2: number;
    finishings?: string[];
    types?: string[];
    hasThickness?: boolean;
    thicknessOptions?: string[];
    pricesByThickness?: Record<string, number>;
}

interface OrderSpecsCardProps {
    width: number;
    height: number;
    quantity: number;
    activeTab: MaterialType;
    serviceType: string;
    finishing: string;
    thickness: string;
    onPriceChange: (val: number) => void;
    onWidthChange: (val: number) => void;
    onHeightChange: (val: number) => void;
    onQuantityChange: (val: number) => void;
    onTabChange: (tab: MaterialType) => void;
    onServiceTypeChange: (val: string) => void;
    onFinishingChange: (val: string) => void;
    onThicknessChange?: (val: string) => void;
    products?: any[]; // Prop for fetched products
}

export default function OrderSpecsCard({
    width,
    height,
    quantity,
    activeTab,
    serviceType,
    finishing,
    thickness,
    onPriceChange,
    onWidthChange,
    onHeightChange,
    onQuantityChange,
    onTabChange,
    onServiceTypeChange,
    onFinishingChange,
    onThicknessChange,
    products
}: OrderSpecsCardProps) {
    // Initial Config (fallback until data loads)
    // Initial Config (fallback until data loads)
    const INITIAL_CONFIG: Record<MaterialType, MaterialDef> = {
        LONA: {
            id: TAB_TO_ID['LONA'],
            label: 'LONA',
            pricePerM2: 50,
            types: ['Banner Promocional', 'Grandes Formatos'],
            finishings: ['Bainha e Ilhós', 'Bastão e Corda', 'Sem Acabamento']
        },
        ADESIVO: {
            id: TAB_TO_ID['ADESIVO'],
            label: 'ADESIVO',
            pricePerM2: 65,
            types: ['Fosco', 'Brilhoso', 'Transparente'],
        },
        ACM: {
            id: TAB_TO_ID['ACM'],
            label: 'ACM',
            pricePerM2: 120,
        },
        PVC: {
            id: TAB_TO_ID['PVC'],
            label: 'PVC',
            pricePerM2: 120,
        },
        PS: {
            id: TAB_TO_ID['PS'],
            label: 'PS (Chapa)',
            pricePerM2: 150,
        },
        ACRÍLICO: {
            id: TAB_TO_ID['ACRÍLICO'],
            label: 'ACRÍLICO',
            pricePerM2: 350,
            hasThickness: true,
            thicknessOptions: ['1mm', '2mm', '3mm', '4mm', '5mm', '6mm', '8mm'],
            pricesByThickness: {
                '1mm': 280, '2mm': 350, '3mm': 500, '4mm': 650, '5mm': 800, '6mm': 950, '8mm': 1200
            }
        }
    };

    const [configs, setConfigs] = useState(INITIAL_CONFIG);
    const [showSettings, setShowSettings] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Map DB products to Configs
    useEffect(() => {
        if (products && products.length > 0) {
            setConfigs(prev => {
                const next = { ...prev };

                products.forEach(p => {
                    // Reverse mapping: Find which tab maps to this DB ID
                    (Object.keys(TAB_TO_ID) as MaterialType[]).forEach(tabKey => {
                        if (TAB_TO_ID[tabKey] === p.id) {
                            if (next[tabKey]) {
                                next[tabKey] = {
                                    ...next[tabKey],
                                    id: p.id,
                                    pricePerM2: p.pricePerM2,
                                    ...(p.pricingConfig as object)
                                };
                            }
                        }
                    });
                });
                return next;
            });
        }
    }, [products]);

    // Local state for inputs
    const [localWidth, setLocalWidth] = useState(width.toString());
    const [localHeight, setLocalHeight] = useState(height.toString());
    const [localQuantity, setLocalQuantity] = useState(quantity.toString());

    useEffect(() => {
        if (Number(localWidth) !== width) setLocalWidth(width.toString());
    }, [width]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (Number(localHeight) !== height) setLocalHeight(height.toString());
    }, [height]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (Number(localQuantity) !== quantity) setLocalQuantity(quantity.toString());
    }, [quantity]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleInputChange = (
        value: string,
        setLocal: (val: string) => void,
        onChangeProp: (val: number) => void
    ) => {
        if (value === '' || /^\d*$/.test(value)) {
            setLocal(value);
            if (value !== '') {
                onChangeProp(Number(value));
            }
        }
    };

    // Update parent price when activeTab/configs/thickness changes
    useEffect(() => {
        const config = configs[activeTab];
        let currentPrice = config.pricePerM2;

        if (config.hasThickness && config.pricesByThickness && thickness) {
            if (config.pricesByThickness[thickness]) {
                currentPrice = config.pricesByThickness[thickness];
            }
        }

        onPriceChange(currentPrice);
    }, [activeTab, configs, onPriceChange, thickness]);

    const handleTabClick = (newTab: MaterialType) => {
        onTabChange(newTab);
        const config = configs[newTab];

        if (config.finishings && config.finishings.length > 0) {
            onFinishingChange(config.finishings[0]);
        } else {
            onFinishingChange('');
        }

        if (config.types) {
            onServiceTypeChange(config.types[0]);
        } else {
            onServiceTypeChange('');
        }

        if (config.hasThickness && config.thicknessOptions && onThicknessChange) {
            const defaultThickness = config.thicknessOptions.includes('2mm') ? '2mm' : config.thicknessOptions[0];
            onThicknessChange(defaultThickness);
        }
    };

    const handlePriceUpdate = (newPrice: number, thicknessKey?: string) => {
        setConfigs(prev => {
            const newConfig = { ...prev[activeTab] };

            if (thicknessKey && newConfig.pricesByThickness) {
                newConfig.pricesByThickness = {
                    ...newConfig.pricesByThickness,
                    [thicknessKey]: newPrice
                };
            } else {
                newConfig.pricePerM2 = newPrice;
            }

            return {
                ...prev,
                [activeTab]: newConfig
            };
        });
    };

    const handleSavePricing = async () => {
        const config = configs[activeTab];
        if (!config.id) {
            alert('Erro: Produto não vinculado ao banco de dados (ID ausente).');
            return;
        }

        setIsSaving(true);
        try {
            // Prepare payload
            // We save pricePerM2 (base) and pricingConfig (json)
            const pricingConfigPayload = {
                hasThickness: config.hasThickness,
                thicknessOptions: config.thicknessOptions,
                pricesByThickness: config.pricesByThickness,
                finishings: config.finishings,
                types: config.types
            };

            const result = await updateProductPricing(
                config.id,
                config.pricePerM2,
                pricingConfigPayload
            );

            if (result.success) {
                alert('Preço salvo com sucesso!');
                setShowSettings(false);
            } else {
                alert('Erro ao salvar: ' + (result as any).message); // Fix potential 'message' missing on result type
            }
        } catch (error: any) {
            console.error(error);
            alert(`Erro inesperado ao salvar: ${error?.message || error}`);
        } finally {
            setIsSaving(false);
        }
    };

    const tabs: MaterialType[] = ['LONA', 'ADESIVO', 'ACM', 'PVC', 'PS', 'ACRÍLICO'];
    const currentConfig = configs[activeTab];
    const hasFinishings = currentConfig.finishings && currentConfig.finishings.length > 0;
    const hasTypes = currentConfig.types && currentConfig.types.length > 0;
    const hasThickness = currentConfig.hasThickness;
    const typeLabel = activeTab === 'LONA' ? 'Tipo de Serviço' : 'Tipo de Material';

    return (
        <div className="bg-zinc-900 rounded-xl border border-zinc-700/50 shadow-xl overflow-visible flex flex-col relative h-fit">
            {/* Header */}
            <div className="px-5 py-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                <h2 className="text-sm font-bold text-white tracking-wide">Especificações do Produto</h2>
                <button
                    onClick={() => setShowSettings(true)}
                    className="text-blue-500 hover:text-blue-400 p-1.5 rounded hover:bg-blue-500/10 transition-colors"
                    title="Configurar Preços"
                >
                    <Settings size={16} />
                </button>
            </div>

            {/* Settings Modal */}
            {showSettings && (
                <div className="absolute top-3 right-3 z-50 w-80 bg-zinc-950 border border-zinc-700 rounded-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[500px]">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/50 rounded-t-lg shrink-0">
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Config: {currentConfig.label}</h3>
                        <button
                            onClick={() => setShowSettings(false)}
                            className="text-zinc-400 hover:text-white transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <div className="p-4 overflow-y-auto flex-1">
                        {currentConfig.hasThickness && currentConfig.pricesByThickness ? (
                            <div className="grid grid-cols-2 gap-3">
                                {Object.keys(currentConfig.pricesByThickness).map((tKey) => (
                                    <div className="space-y-1.5" key={tKey}>
                                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                                            {tKey} (R$/m²)
                                        </label>
                                        <input
                                            type="number"
                                            value={currentConfig.pricesByThickness![tKey]}
                                            onChange={(e) => handlePriceUpdate(Number(e.target.value), tKey)}
                                            className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                                    Preço por m² (R$)
                                </label>
                                <input
                                    type="number"
                                    value={currentConfig.pricePerM2}
                                    onChange={(e) => handlePriceUpdate(Number(e.target.value))}
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                                />
                            </div>
                        )}
                    </div>

                    {/* Footer with Save Button */}
                    <div className="p-4 border-t border-zinc-800 bg-zinc-900/30 rounded-b-lg shrink-0">
                        <button
                            onClick={handleSavePricing}
                            disabled={isSaving}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? 'Salvando...' : (
                                <>
                                    <Save size={14} />
                                    Salvar Alterações
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Tabs (Rest of the component remains same) */}
            <div className="px-5 pt-3 border-b border-zinc-800 overflow-x-auto">
                <div className="flex gap-6 min-w-max pb-3">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => handleTabClick(tab)}
                            className={`
                                text-xs font-bold tracking-wider relative transition-colors uppercase whitespace-nowrap
                                ${activeTab === tab ? 'text-blue-400' : 'text-zinc-500 hover:text-zinc-300'}
                            `}
                        >
                            {tab}
                            {activeTab === tab && (
                                <span className="absolute -bottom-3 left-0 w-full h-[2px] bg-blue-500 shadow-[0_0_8px_#3b82f6]"></span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Form */}
            <div className="p-5 space-y-5">
                {/* Dynamic Type Selector */}
                {hasTypes && (
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{typeLabel}</label>
                        <div className="flex bg-zinc-950 p-1 rounded border border-zinc-800">
                            {currentConfig.types?.map((type) => (
                                <button
                                    key={type}
                                    onClick={() => onServiceTypeChange(type)}
                                    className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all
                                        ${serviceType === type ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300'}
                                    `}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Thickness Selector */}
                {hasThickness && currentConfig.thicknessOptions && (
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Layers size={12} />
                            Espessura
                        </label>
                        <div className="grid grid-cols-4 sm:grid-cols-7 gap-1 bg-zinc-950 p-1 rounded border border-zinc-800">
                            {currentConfig.thicknessOptions.map((opt) => (
                                <button
                                    key={opt}
                                    onClick={() => onThicknessChange && onThicknessChange(opt)}
                                    className={`py-1.5 px-1 text-[10px] font-bold uppercase tracking-wider rounded transition-all
                                        ${thickness === opt ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300'}
                                    `}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Dimensions (Height/Width) */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Altura (cm)</label>
                        <input
                            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2.5 text-white text-base focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono placeholder-zinc-600"
                            type="text"
                            inputMode="numeric"
                            value={localHeight}
                            onChange={(e) => handleInputChange(e.target.value, setLocalHeight, onHeightChange)}
                            onBlur={() => {
                                if (localHeight === '') {
                                    setLocalHeight('0');
                                    onHeightChange(0);
                                }
                            }}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Largura (cm)</label>
                        <input
                            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2.5 text-white text-base focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono placeholder-zinc-600"
                            type="text"
                            inputMode="numeric"
                            value={localWidth}
                            onChange={(e) => handleInputChange(e.target.value, setLocalWidth, onWidthChange)}
                            onBlur={() => {
                                if (localWidth === '') {
                                    setLocalWidth('0');
                                    onWidthChange(0);
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Row 2: Finishing & Qty */}
                <div className="grid grid-cols-2 gap-4">
                    {hasFinishings ? (
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Acabamento</label>
                            <div className="relative">
                                <select
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none cursor-pointer"
                                    value={finishing}
                                    onChange={(e) => onFinishingChange(e.target.value)}
                                >
                                    {currentConfig.finishings?.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
                                    <ChevronDown size={16} />
                                </div>
                            </div>
                        </div>
                    ) : (
                        null
                    )}

                    <div className={`space-y-1.5 ${!hasFinishings ? 'col-span-2' : ''}`}>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Quantidade</label>
                        <input
                            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2.5 text-white text-base focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono placeholder-zinc-600"
                            type="text"
                            inputMode="numeric"
                            value={localQuantity}
                            onChange={(e) => handleInputChange(e.target.value, setLocalQuantity, onQuantityChange)}
                            onBlur={() => {
                                if (localQuantity === '') {
                                    setLocalQuantity('1');
                                    onQuantityChange(1);
                                }
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
