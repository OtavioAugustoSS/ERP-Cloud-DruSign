'use client';

import React, { useState } from 'react';
import { Icons } from './Icons';
import { registerUser, deleteUser, updateUser } from '../../actions/user';
import { useRouter } from 'next/navigation';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    phone?: string | null;
    image?: string | null;
}

interface UserListProps {
    initialUsers: User[];
}

export default function UserList({ initialUsers }: UserListProps) {
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const router = useRouter();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        role: 'employee',
        image: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const resetForm = () => {
        setFormData({ name: '', email: '', password: '', phone: '', role: 'employee', image: '' });
        setEditingUser(null);
    };

    const handleOpenModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            password: '', // Password empty on edit unless changing
            phone: user.phone || '',
            role: user.role,
            image: user.image || ''
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        let result;
        if (editingUser) {
            // Update
            result = await updateUser(editingUser.id, formData);
        } else {
            // Create
            result = await registerUser(formData);
        }

        if (result.success) {
            setIsModalOpen(false);
            resetForm();
            router.refresh();
        } else {
            alert(result.error);
        }
        setIsLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir este usuário?')) {
            const result = await deleteUser(id);
            if (result.success) {
                setUsers(users.filter(u => u.id !== id));
                router.refresh();
            } else {
                alert(result.error);
            }
        }
    };

    return (
        <div className="flex-1 overflow-auto p-8 pt-4">
            {/* Header Actions */}
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl text-white font-bold">Equipe</h3>
                <button
                    onClick={handleOpenModal}
                    className="flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 px-4 py-2 rounded-full hover:bg-primary/20 transition-all font-medium text-sm"
                >
                    <Icons.Plus size={18} />
                    Novo Usuário
                </button>
            </div>

            <div className="w-full rounded-2xl border border-white/5 bg-surface-dark/50 overflow-hidden shadow-2xl">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/10 bg-black/20 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                            <th className="p-4 pl-6">Usuário</th>
                            <th className="p-4">Contato</th>
                            <th className="p-4 text-center">Cargo</th>
                            <th className="p-4 pr-6 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm text-slate-300">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                                <td className="p-4 pl-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center border border-white/10">
                                            {user.image ? (
                                                <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-xs font-bold text-slate-400">{user.name.substring(0, 2).toUpperCase()}</span>
                                            )}
                                        </div>
                                        <div>
                                            <div className="text-white font-medium">{user.name}</div>
                                            <div className="text-xs text-slate-500">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 text-slate-400">
                                    {user.phone || '-'}
                                </td>
                                <td className="p-4 text-center">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${user.role === 'admin'
                                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                        : 'bg-slate-700/30 text-slate-400 border-slate-600/30'
                                        }`}>
                                        {user.role === 'admin' ? 'Admin' : 'Funcionário'}
                                    </span>
                                </td>
                                <td className="p-4 pr-6 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => handleEdit(user)}
                                            className="size-8 rounded-full hover:bg-white/5 text-slate-400 hover:text-white flex items-center justify-center transition-all"
                                        >
                                            <Icons.Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            className="size-8 rounded-full hover:bg-red-500/10 text-slate-400 hover:text-red-400 flex items-center justify-center transition-all"
                                        >
                                            <Icons.Trash size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {users.length === 0 && (
                    <div className="p-12 text-center text-slate-500">
                        Nenhum usuário cadastrado.
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-white">{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                                <Icons.X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Nome Completo</label>
                                <input name="name" required onChange={handleInputChange} value={formData.name} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-primary/50 outline-none transition-all" placeholder="Ex: João da Silva" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Email</label>
                                <input name="email" type="email" required onChange={handleInputChange} value={formData.email} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-primary/50 outline-none transition-all" placeholder="joao@drusign.com" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Telefone</label>
                                    <input name="phone" onChange={handleInputChange} value={formData.phone} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-primary/50 outline-none transition-all" placeholder="(00) 00000-0000" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Cargo</label>
                                    <select name="role" onChange={handleInputChange} value={formData.role} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-primary/50 outline-none transition-all appearance-none">
                                        <option value="employee" className="bg-zinc-900">Funcionário</option>
                                        <option value="admin" className="bg-zinc-900">Administrador</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">
                                    {editingUser ? 'Nova Senha (opcional)' : 'Senha Inicial'}
                                </label>
                                <input
                                    name="password"
                                    type="password"
                                    required={!editingUser}
                                    onChange={handleInputChange}
                                    value={formData.password}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-primary/50 outline-none transition-all"
                                    placeholder={editingUser ? "Deixe em branco para manter" : "******"}
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors">Cancelar</button>
                                <button type="submit" disabled={isLoading} className="px-6 py-2 rounded-lg text-sm font-bold bg-primary text-black hover:bg-primary/90 transition-colors disabled:opacity-50">
                                    {isLoading ? 'Salvando...' : (editingUser ? 'Atualizar' : 'Criar Usuário')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
