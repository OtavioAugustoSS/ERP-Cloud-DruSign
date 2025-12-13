import { getPendingOrders } from '@/actions/order';
import AdminHeader from '@/components/admin/AdminHeader';
import OrderTable from '@/components/admin/OrderTable';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export default async function OrdersPage() {
    const orders = await getPendingOrders();

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <AdminHeader title="Pedidos em Aberto" />
                <Link
                    href="/admin/orders/new"
                    className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors shadow-lg shadow-blue-500/20"
                >
                    <Plus size={18} />
                    Novo Pedido
                </Link>
            </div>

            <OrderTable
                orders={orders}
                variant="pending"
            />
        </div>
    );
}
