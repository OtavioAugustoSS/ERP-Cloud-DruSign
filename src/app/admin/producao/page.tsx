import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { getPendingOrders } from '@/actions/order';
import { getNotifications } from '@/actions/notification';
import EmployeeDashboard from '@/components/admin/EmployeeDashboard';

export const dynamic = 'force-dynamic';

export default async function ProducaoPage() {
    const session = await getSession();
    if (!session) redirect('/login');

    const [orders, notifications] = await Promise.all([
        getPendingOrders(),
        getNotifications('employee'),
    ]);

    const activeOrders = orders.filter(o =>
        o.status === 'IN_PRODUCTION' || o.status === 'FINISHING' || o.status === 'READY_FOR_SHIPPING'
    );

    return (
        <EmployeeDashboard
            initialOrders={activeOrders}
            initialNotifications={notifications}
            userName={session.name}
        />
    );
}
