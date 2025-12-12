'use client';

import { useState, useEffect } from 'react';
import { calculatePrice } from '@/lib/utils/price';
// Type import might fail if Prisma client is not generated yet, but we will mock/use partial type or infer
// import { Product } from '@prisma/client'; 

// Temporary interface until we have full client generation or for props
interface ProductData {
    id: string;
    name: string;
    pricePerSqMeter: number;
    minPrice: number;
    isFixedPrice: boolean;
}

interface ProductCalculatorProps {
    product: ProductData;
    onAddToCart?: (item: any) => void;
}

export default function ProductCalculator({ product, onAddToCart }: ProductCalculatorProps) {
    const [width, setWidth] = useState<number>(1); // default 1m
    const [height, setHeight] = useState<number>(1); // default 1m
    const [price, setPrice] = useState<number>(0);

    useEffect(() => {
        const newPrice = calculatePrice(width, height, product);
        setPrice(newPrice);
    }, [width, height, product]);

    const handleAddToCart = () => {
        if (onAddToCart) {
            onAddToCart({
                productId: product.id,
                width,
                height,
                finalPrice: price,
            });
        } else {
            alert(`Added to cart: ${width}x${height}m - $${price}`);
        }
    };

    return (
        <div className="p-6 bg-white rounded-xl shadow-md space-y-4 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800">Calculate Price</h3>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Width (m)</label>
                    <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={width}
                        onChange={(e) => setWidth(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Height (m)</label>
                    <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={height}
                        onChange={(e) => setHeight(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                    />
                </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-gray-500">Total Price:</span>
                <span className="text-2xl font-bold text-blue-600">${price.toFixed(2)}</span>
            </div>

            <div className="pt-2">
                {/* Placeholder for File Upload */}
                <label className="block text-sm font-medium text-gray-600 mb-2">Upload Artwork</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors cursor-pointer">
                    <span>Click to upload file</span>
                </div>
            </div>

            <button
                onClick={handleAddToCart}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all transform active:scale-95"
            >
                Add to Cart
            </button>
        </div>
    );
}
