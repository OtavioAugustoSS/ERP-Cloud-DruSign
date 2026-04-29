import { getClients } from '@/actions/client';
import ClientList from '@/components/admin/ClientList';

export const dynamic = 'force-dynamic';

export default async function ClientsPage() {
    const clients = await getClients();
    return <ClientList initialClients={clients} />;
}
