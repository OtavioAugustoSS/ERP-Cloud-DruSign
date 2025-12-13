'use client';

import { useState } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import OrderSpecsCard, { MaterialType } from '@/components/admin/OrderSpecsCard';
import FileHandlerCard from '@/components/admin/FileHandlerCard';
import OrderSummaryCard from '@/components/admin/OrderSummaryCard';
import OrderActionsCard from '@/components/admin/OrderActionsCard';
import ProductionPipeline from '@/components/admin/ProductionPipeline';
import EditableClientName from '@/components/admin/EditableClientName';
import { Printer } from 'lucide-react';
import { use } from 'react';

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params);

    // State for specs
    const [width, setWidth] = useState(250);
    const [height, setHeight] = useState(150);
    const [quantity, setQuantity] = useState(2);
    const [pricePerM2, setPricePerM2] = useState(50); // This is updated by the child

    // Lifted selection state
    const [activeTab, setActiveTab] = useState<MaterialType>('LONA');
    const [serviceType, setServiceType] = useState<string>('Banner Promocional');
    const [finishing, setFinishing] = useState<string>('Bainha e Ilhós');

    // Price Calculation Logic
    const areaInMeters = (width / 100) * (height / 100);
    const unitPrice = areaInMeters * pricePerM2;
    const totalPrice = unitPrice * quantity;

    const handleUpdateClientName = (newName: string) => {
        // Logic to update client name via API would go here
        console.log('Updating client name to:', newName);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Page Title Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-white tracking-tight">Gerenciar Pedido #{unwrappedParams.id || '12345'}</h1>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                            Produção Pendente
                        </span>
                    </div>
                    <div className="pl-1">
                        <EditableClientName
                            initialName="Empresa XYZ Ltda."
                            onSave={handleUpdateClientName}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="px-4 py-2 bg-card-dark hover:bg-white/10 text-white text-sm font-medium rounded-md border border-white/10 transition-colors flex items-center gap-2">
                        <Printer size={18} />
                        Ficha de Produção
                    </button>
                </div>
            </div>

            {/* Pipeline Stepper */}
            <ProductionPipeline />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Product Config & Files */}
                <div className="lg:col-span-2 space-y-6">
                    <OrderSpecsCard
                        width={width}
                        height={height}
                        quantity={quantity}
                        activeTab={activeTab}
                        serviceType={serviceType}
                        finishing={finishing}
                        onPriceChange={setPricePerM2}
                        onWidthChange={setWidth}
                        onHeightChange={setHeight}
                        onQuantityChange={setQuantity}
                        onTabChange={setActiveTab}
                        onServiceTypeChange={setServiceType}
                        onFinishingChange={setFinishing}
                    />
                    <FileHandlerCard />
                </div>

                {/* Right Column: Summary & Actions */}
                <div className="space-y-6">
                    <OrderSummaryCard
                        width={width}
                        height={height}
                        quantity={quantity}
                        totalPrice={totalPrice}
                        activeTab={activeTab}
                        serviceType={serviceType}
                        finishing={finishing}
                    />
                    <OrderActionsCard />
                </div>
            </div>

            {/* Bottom spacing */}
            <div className="h-12"></div>
        </div>
    );
}
