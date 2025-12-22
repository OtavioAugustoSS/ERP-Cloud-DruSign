import React from 'react';
import UserList from '@/components/admin/UserList';
import { getUsers } from '@/actions/user';
import { Icons } from '@/components/admin/Icons';

export default async function UsersPage() {
    const { users, error } = await getUsers();

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-background-dark">
            <header className="flex-none px-8 py-6 border-b border-white/5 bg-background-dark/50 backdrop-blur-sm z-10">
                <div className="flex flex-wrap justify-between items-end gap-4">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-white text-3xl font-bold leading-tight tracking-tight">Gestão de Usuários</h2>
                        <p className="text-slate-400 text-sm font-normal">Administre os acessos e colaboradores do sistema.</p>
                    </div>
                </div>

                {/* Filters could go here if needed, keeping it clean for now */}
                <div className="mt-6 h-1 w-full"></div>
            </header>

            <UserList initialUsers={users || []} />
        </div>
    );
}
