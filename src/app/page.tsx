'use client';

import ProductCalculator from '@/components/ProductCalculator';
import CartSummary from '@/components/CartSummary';
import { useCartStore } from '@/store/cartStore';

// Mock Product Data (In real app, fetch from DB or pass from Server Component wrapper)
const DEMO_PRODUCT = {
  id: 'prod_123',
  name: 'Custom Banner (440g)',
  description: 'High quality vinyl banner printing. Weather resistant and durable.',
  pricePerSqMeter: 25.00, // $25 per m2
  minPrice: 15.00,       // Minimum $15
  isFixedPrice: false,
};

export default function Home() {
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = (item: any) => {
    addItem({
      productId: item.productId,
      productName: DEMO_PRODUCT.name,
      pricePerSqMeter: DEMO_PRODUCT.pricePerSqMeter,
      minPrice: DEMO_PRODUCT.minPrice,
      width: item.width,
      height: item.height,
      area: item.width * item.height,
      finalPrice: item.finalPrice,
      quantity: 1,
    });
    // Optional: simple alert for feedback since we don't have toast
    alert('Added to cart!');
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-blue-900 mb-2">DruSign</h1>
          <p className="text-gray-600">Web-to-Print E-Commerce Demo</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Product Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">{DEMO_PRODUCT.name}</h2>
                <p className="text-gray-500 mt-2">{DEMO_PRODUCT.description}</p>
                <div className="mt-4 inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                  ${DEMO_PRODUCT.pricePerSqMeter}/m² (Min ${DEMO_PRODUCT.minPrice})
                </div>
              </div>

              <ProductCalculator
                product={DEMO_PRODUCT}
                onAddToCart={handleAddToCart}
              />
            </div>
          </div>

          {/* Cart Section */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <CartSummary />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
