import { getHistoryOrders } from '@/actions/order';
import AdminHeader from '@/components/admin/AdminHeader';
import OrderTable from '@/components/admin/OrderTable';

export default async function HistoryPage() {
    const orders = await getHistoryOrders();

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <AdminHeader title="Histórico de Pedidos" />

            <OrderTable
                orders={orders}
                variant="history"
            />
        </div>
    );
}
