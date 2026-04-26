import { getDashboardData } from '@/actions/dashboard';
import DashboardHome from '@/components/admin/DashboardHome';

export default async function AdminPage() {
    const stats = await getDashboardData();
    return <DashboardHome stats={stats} />;
}
