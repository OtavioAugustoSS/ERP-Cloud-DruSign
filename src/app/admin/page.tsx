import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { getDashboardData } from '@/actions/dashboard';
import DashboardHome from '@/components/admin/DashboardHome';

export default async function AdminPage() {
    const session = await getSession();
    if (session?.role === 'employee') redirect('/admin/producao');
    const stats = await getDashboardData();
    return <DashboardHome stats={stats} />;
}
