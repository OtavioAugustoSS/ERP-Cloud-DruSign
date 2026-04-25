import { getClients } from '@/actions/client';
import ClientList from '@/components/admin/ClientList';
import { UserRound } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ClientsPage() {
    const clients = await getClients();

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center">
                    <UserRound size={20} />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-white">Clientes</h1>
                    <p className="text-xs text-zinc-500">{clients.length} cliente{clients.length !== 1 ? 's' : ''} cadastrado{clients.length !== 1 ? 's' : ''}</p>
                </div>
            </div>

            <ClientList initialClients={clients} />
        </div>
    );
}
