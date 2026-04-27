'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CreateOrderModal from './CreateOrderModal';
import GlobalLoader from '../ui/GlobalLoader';
import { getAllProducts } from '../../actions/product';
import { getClients } from '../../actions/client';
import type { Product, Client } from '../../types';

export default function Dashboard() {
    const [products, setProducts] = useState<Product[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        Promise.all([
            getAllProducts().then(data => { if (data) setProducts(data); }),
            getClients().then(data => setClients(data)),
        ]).finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-background-dark">
                <GlobalLoader />
            </div>
        );
    }

    return (
        <CreateOrderModal
            isOpen={true}
            mode="page"
            onClose={() => router.push('/admin')}
            onSuccess={() => router.push('/admin/orders')}
            products={products}
            clients={clients}
        />
    );
}
