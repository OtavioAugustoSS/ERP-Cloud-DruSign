import { Settings, X, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';

export type MaterialType = 'LONA' | 'ADESIVO' | 'ACM';

interface MaterialDef {
    label: string;
    pricePerM2: number;
    finishings: string[];
    types?: string[];
}

interface OrderSpecsCardProps {
    width: number;
    height: number;
    quantity: number;
    activeTab: MaterialType;
    serviceType: string;
    finishing: string;
    onPriceChange: (val: number) => void;
    onWidthChange: (val: number) => void;
    onHeightChange: (val: number) => void;
    onQuantityChange: (val: number) => void;
    onTabChange: (tab: MaterialType) => void;
    onServiceTypeChange: (val: string) => void;
    onFinishingChange: (val: string) => void;
}

export default function OrderSpecsCard({
    width,
    height,
    quantity,
    activeTab,
    serviceType,
    finishing,
    onPriceChange,
    onWidthChange,
    onHeightChange,
    onQuantityChange,
    onTabChange,
    onServiceTypeChange,
    onFinishingChange
}: OrderSpecsCardProps) {
    // Configuration Data
    const INITIAL_CONFIG: Record<MaterialType, MaterialDef> = {
        LONA: {
            label: 'LONA',
            pricePerM2: 50,
            types: ['Banner Promocional', 'Grandes Formatos'],
            finishings: ['Bainha e Ilhós', 'Bastão e Corda', 'Sem Acabamento']
        },
        ADESIVO: {
            label: 'ADESIVO',
            pricePerM2: 65,
            finishings: ['Corte Reto', 'Recorte Especial (Plotter)', 'Laminação Fosca', 'Laminação Brilho']
        },
        ACM: {
            label: 'ACM',
            pricePerM2: 120,
            finishings: ['Furos nos cantos', 'Fita Dupla Face VHB', 'Estrutura de Metal']
        },
    };

    const [configs, setConfigs] = useState(INITIAL_CONFIG);
    const [showSettings, setShowSettings] = useState(false);

    // Local state for inputs to allow string manipulation (fixing leading zero/empty bug)
    const [localWidth, setLocalWidth] = useState(width.toString());
    const [localHeight, setLocalHeight] = useState(height.toString());
    const [localQuantity, setLocalQuantity] = useState(quantity.toString());

    // Sync local state when props change externally (only if different from parsed local to avoid cursor jumping)
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
        // Allow empty string or numbers only
        if (value === '' || /^\d*$/.test(value)) {
            setLocal(value);
            // Only update parent if it's a valid number, or let parent handle 0?
            // The constraint is usually "don't let it be 0 if cleared".
            // If empty, we can choose not to update parent OR update with 0. 
            // Updating with 0 causes the "0" to appear if we rebroadcast the prop back to local (sync effect).
            // So we update parent only if value is non-empty.
            if (value !== '') {
                onChangeProp(Number(value));
            }
        }
    };

    // When activeTab changes from parent, or configs change, update price
    useEffect(() => {
        const currentPrice = configs[activeTab].pricePerM2;
        onPriceChange(currentPrice);
    }, [activeTab, configs, onPriceChange]);

    const handleTabClick = (newTab: MaterialType) => {
        onTabChange(newTab);
        const config = configs[newTab];
        // Reset defaults for the new tab
        onFinishingChange(config.finishings[0]);
        if (config.types) {
            onServiceTypeChange(config.types[0]);
        } else {
            onServiceTypeChange('');
        }
    };

    const handlePriceUpdate = (newPrice: number) => {
        setConfigs(prev => ({
            ...prev,
            [activeTab]: {
                ...prev[activeTab],
                pricePerM2: newPrice
            }
        }));
    };

    const tabs: MaterialType[] = ['LONA', 'ADESIVO', 'ACM'];
    const currentConfig = configs[activeTab];

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
                <div className="absolute top-3 right-3 z-50 w-64 bg-zinc-950 border border-zinc-700 rounded-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/50 rounded-t-lg">
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Config: {currentConfig.label}</h3>
                        <button
                            onClick={() => setShowSettings(false)}
                            className="text-zinc-400 hover:text-white transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                    <div className="p-4 space-y-3">
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
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="px-5 pt-3 border-b border-zinc-800">
                <div className="flex gap-6">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => handleTabClick(tab)}
                            className={`
                pb-3 text-xs font-bold tracking-wider relative transition-colors uppercase
                ${activeTab === tab ? 'text-blue-400' : 'text-zinc-500 hover:text-zinc-300'}
              `}
                        >
                            {tab}
                            {activeTab === tab && (
                                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-500 shadow-[0_0_8px_#3b82f6]"></span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Form */}
            <div className="p-5 space-y-5">
                {/* Service Type Selector (LONA only) */}
                {currentConfig.types && (
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Tipo de Serviço</label>
                        <div className="flex bg-zinc-950 p-1 rounded border border-zinc-800">
                            {currentConfig.types.map((type) => (
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

                {/* Row 1: Dimensions */}
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
                                // On blur, if empty, reset to 0 or valid default?
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
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Acabamento</label>
                        <div className="relative">
                            <select
                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none cursor-pointer"
                                value={finishing}
                                onChange={(e) => onFinishingChange(e.target.value)}
                            >
                                {currentConfig.finishings.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
                                <ChevronDown size={16} />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-1.5">
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
