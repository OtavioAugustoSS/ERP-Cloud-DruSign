'use client';

import React, { useState, useCallback } from 'react';
import { Icons } from './Icons';
import { registerUser, deleteUser, updateUser } from '../../actions/user';
import { maskPhone } from '../../lib/utils/masks';
import { PASSWORD_RULES_TEXT } from '../../lib/auth/password';
import { useRouter } from 'next/navigation';
import { Users, ShieldCheck, UserCheck } from 'lucide-react';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'employee';
    phone?: string | null;
    image?: string | null;
    createdAt?: Date | string;
}

interface UserListProps {
    initialUsers: User[];
}

type ToastState = { type: 'success' | 'error'; message: string } | null;

function getAvatarGradient(str: string): string {
    const gradients = [
        'from-cyan-500 to-blue-600',
        'from-violet-500 to-purple-600',
        'from-emerald-400 to-teal-600',
        'from-orange-400 to-red-500',
        'from-pink-500 to-rose-600',
        'from-amber-400 to-orange-500',
        'from-indigo-500 to-violet-600',
        'from-teal-400 to-emerald-600',
    ];
    const hash = str.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return gradients[hash % gradients.length];
}

function formatMemberSince(date?: Date | string): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
}

function Spinner({ size = 14 }: { size?: number }) {
    return (
        <div
            className="rounded-full border-2 border-current border-t-transparent animate-spin opacity-70"
            style={{ width: size, height: size }}
        />
    );
}

export default function UserList({ initialUsers }: UserListProps) {
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const [toast, setToast] = useState<ToastState>(null);
    const router = useRouter();

    const [formData, setFormData] = useState<{
        name: string; email: string; password: string;
        phone: string; role: 'admin' | 'employee'; image: string;
    }>({ name: '', email: '', password: '', phone: '', role: 'employee', image: '' });

    const showToast = useCallback((type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3500);
    }, []);

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
            password: '',
            phone: maskPhone(user.phone || ''),
            role: user.role,
            image: user.image || ''
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const result = editingUser
            ? await updateUser(editingUser.id, formData)
            : await registerUser(formData);

        if (result.success) {
            setIsModalOpen(false);
            resetForm();
            router.refresh();
        } else {
            showToast('error', result.error || 'Ocorreu um erro. Tente novamente.');
        }
        setIsLoading(false);
    };

    const handleDelete = async (id: string) => {
        setConfirmDelete(null);
        const result = await deleteUser(id);
        if (result.success) {
            setUsers(users.filter(u => u.id !== id));
            router.refresh();
        } else {
            showToast('error', result.error || 'Erro ao excluir usuário.');
        }
    };

    const admins     = users.filter(u => u.role === 'admin').length;
    const employees  = users.filter(u => u.role === 'employee').length;

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-background-dark">

            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-[60] flex items-center gap-3 px-5 py-3 rounded-xl border shadow-2xl animate-fade-in-up backdrop-blur-md ${
                    toast.type === 'success'
                        ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-400'
                        : 'bg-red-950/80 border-red-500/30 text-red-400'
                }`}>
                    {toast.type === 'success' ? <Icons.Check size={15} /> : <Icons.X size={15} />}
                    <span className="text-sm font-medium">{toast.message}</span>
                </div>
            )}

            {/* Header */}
            <header className="flex-none px-4 sm:px-8 py-4 sm:py-6 border-b border-white/5 bg-background-dark/50 backdrop-blur-sm z-10">
                <div className="flex items-center justify-between gap-3 animate-fade-in-up">
                    <div>
                        <div className="flex items-center gap-2 sm:gap-3">
                            <h2 className="text-white text-xl sm:text-3xl font-bold leading-tight tracking-tight">Usuários</h2>
                            <span className="inline-flex items-center justify-center h-5 sm:h-6 min-w-[1.25rem] sm:min-w-[1.5rem] px-1.5 sm:px-2 rounded-full bg-white/5 border border-white/10 text-slate-400 text-xs font-bold tabular-nums">
                                {users.length}
                            </span>
                        </div>
                        <p className="text-slate-400 text-xs sm:text-sm font-normal mt-0.5 hidden sm:block">Gerencie os acessos e colaboradores do sistema.</p>
                    </div>
                    <button
                        onClick={handleOpenModal}
                        className="relative overflow-hidden group flex items-center gap-2 h-9 sm:h-10 px-3 sm:pl-4 sm:pr-5 rounded-xl bg-primary/10 border border-primary/20 text-primary font-semibold text-sm transition-all hover:border-primary/40 shadow-[0_0_12px_rgba(19,164,236,0.06)] hover:shadow-[0_0_20px_rgba(19,164,236,0.15)]"
                    >
                        <span className="absolute inset-0 bg-primary -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out rounded-xl" />
                        <Icons.Plus size={16} className="relative z-10 group-hover:text-black transition-colors duration-300" />
                        <span className="relative z-10 group-hover:text-black transition-colors duration-300 text-xs font-bold hidden sm:inline">Novo Usuário</span>
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-auto p-4 sm:p-8 pt-4 sm:pt-6 space-y-4 sm:space-y-6">

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 animate-fade-in-up animate-delay-100">
                    <div className="bg-surface-dark/50 border border-white/5 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
                        <div className="size-8 sm:size-9 rounded-lg sm:rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                            <Users size={15} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xl sm:text-2xl font-bold text-white leading-none">{users.length}</p>
                            <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">Total</p>
                        </div>
                    </div>
                    <div className="bg-surface-dark/50 border border-white/5 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
                        <div className="size-8 sm:size-9 rounded-lg sm:rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                            <ShieldCheck size={15} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xl sm:text-2xl font-bold text-white leading-none">{admins}</p>
                            <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">Admin</p>
                        </div>
                    </div>
                    <div className="bg-surface-dark/50 border border-white/5 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
                        <div className="size-8 sm:size-9 rounded-lg sm:rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                            <UserCheck size={15} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xl sm:text-2xl font-bold text-white leading-none">{employees}</p>
                            <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">Funcionários</p>
                        </div>
                    </div>
                </div>

                {/* Tabela / Cards */}
                <div className="rounded-2xl border border-white/5 bg-surface-dark/50 overflow-hidden shadow-xl animate-fade-in-up animate-delay-200">

                    {users.length === 0 ? (
                        <div className="py-16 flex flex-col items-center gap-3 text-slate-600">
                            <Icons.User size={32} className="opacity-30" />
                            <p className="text-sm">Nenhum usuário cadastrado.</p>
                        </div>
                    ) : (
                        <>
                            {/* Mobile: lista de cards */}
                            <div className="sm:hidden divide-y divide-white/[0.04]">
                                {users.map((user) => {
                                    const inits = user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                                    const gradient = getAvatarGradient(user.id || user.name);
                                    const isConfirming = confirmDelete === user.id;
                                    return (
                                        <div key={user.id} className="flex items-center gap-3 px-4 py-3">
                                            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center border border-white/10 shrink-0`}>
                                                {user.image
                                                    ? <img src={user.image} alt={user.name} className="w-full h-full object-cover rounded-full" />
                                                    : <span className="text-xs font-bold text-white select-none">{inits}</span>
                                                }
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-white font-medium text-sm truncate">{user.name}</span>
                                                    <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                                        user.role === 'admin'
                                                            ? 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                                                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                    }`}>
                                                        {user.role === 'admin' ? 'Admin' : 'Func.'}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-slate-500 mt-0.5 truncate">{user.email}</p>
                                            </div>
                                            <div className="shrink-0 flex items-center gap-1">
                                                {isConfirming ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleDelete(user.id)}
                                                            className="text-[11px] px-2.5 py-1.5 bg-red-500/15 text-red-400 border border-red-500/25 rounded-lg hover:bg-red-500/25 transition-colors font-medium"
                                                        >
                                                            Excluir
                                                        </button>
                                                        <button onClick={() => setConfirmDelete(null)} className="text-slate-500 p-1">
                                                            <Icons.X size={14} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => handleEdit(user)}
                                                            className="size-8 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white flex items-center justify-center transition-all"
                                                        >
                                                            <Icons.Edit size={15} />
                                                        </button>
                                                        <button
                                                            onClick={() => setConfirmDelete(user.id)}
                                                            className="size-8 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 flex items-center justify-center transition-all"
                                                        >
                                                            <Icons.Trash size={15} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Desktop: tabela */}
                            <table className="hidden sm:table w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/[0.06] bg-black/20 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                                        <th className="p-4 pl-6">Usuário</th>
                                        <th className="p-4">Contato</th>
                                        <th className="p-4 text-center">Cargo</th>
                                        <th className="p-4 text-center">Membro desde</th>
                                        <th className="p-4 pr-6 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.04] text-sm text-slate-300">
                                    {users.map((user) => {
                                        const inits = user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                                        const gradient = getAvatarGradient(user.id || user.name);
                                        const isConfirming = confirmDelete === user.id;
                                        return (
                                            <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="p-4 pl-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center border border-white/10 shrink-0`}>
                                                            {user.image
                                                                ? <img src={user.image} alt={user.name} className="w-full h-full object-cover rounded-full" />
                                                                : <span className="text-xs font-bold text-white select-none">{inits}</span>
                                                            }
                                                        </div>
                                                        <div>
                                                            <div className="text-white font-medium leading-tight">{user.name}</div>
                                                            <div className="text-xs text-slate-500 mt-0.5">{user.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-slate-400 text-sm">
                                                    {user.phone || <span className="text-slate-700">—</span>}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                                        user.role === 'admin'
                                                            ? 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                                                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                    }`}>
                                                        {user.role === 'admin'
                                                            ? <><ShieldCheck size={11} /> Admin</>
                                                            : <><UserCheck size={11} /> Funcionário</>
                                                        }
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center text-slate-500 text-xs">
                                                    {formatMemberSince(user.createdAt)}
                                                </td>
                                                <td className="p-4 pr-6 text-right">
                                                    {isConfirming ? (
                                                        <div className="flex items-center justify-end gap-2 animate-fade-in">
                                                            <button
                                                                onClick={() => handleDelete(user.id)}
                                                                className="text-xs px-3 py-1.5 bg-red-500/15 text-red-400 border border-red-500/25 rounded-lg hover:bg-red-500/25 transition-colors font-medium"
                                                            >
                                                                Confirmar exclusão
                                                            </button>
                                                            <button
                                                                onClick={() => setConfirmDelete(null)}
                                                                className="text-slate-500 hover:text-white transition-colors p-1"
                                                            >
                                                                <Icons.X size={14} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-end gap-1">
                                                            <button
                                                                onClick={() => handleEdit(user)}
                                                                className="size-8 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white flex items-center justify-center transition-all"
                                                                title="Editar usuário"
                                                            >
                                                                <Icons.Edit size={15} />
                                                            </button>
                                                            <button
                                                                onClick={() => setConfirmDelete(user.id)}
                                                                className="size-8 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 flex items-center justify-center transition-all"
                                                                title="Excluir usuário"
                                                            >
                                                                <Icons.Trash size={15} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </>
                    )}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
                    <div className="bg-surface-dark border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in-up">

                        {/* Cabeçalho */}
                        <div className="px-6 py-5 border-b border-white/[0.06] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="size-8 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center text-primary">
                                    <Icons.User size={16} />
                                </div>
                                <h3 className="text-white font-bold text-base">
                                    {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                                </h3>
                            </div>
                            <button
                                onClick={() => { setIsModalOpen(false); resetForm(); }}
                                className="text-slate-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
                            >
                                <Icons.X size={18} />
                            </button>
                        </div>

                        {/* Formulário */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Nome Completo</label>
                                <input
                                    name="name"
                                    required
                                    onChange={handleInputChange}
                                    value={formData.name}
                                    placeholder="Ex: João da Silva"
                                    className="w-full bg-black/40 border border-white/10 rounded-lg h-10 px-3 text-white text-sm outline-none focus:border-primary transition-colors placeholder:text-slate-600"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Email</label>
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    onChange={handleInputChange}
                                    value={formData.email}
                                    placeholder="joao@drusign.com"
                                    className="w-full bg-black/40 border border-white/10 rounded-lg h-10 px-3 text-white text-sm outline-none focus:border-primary transition-colors placeholder:text-slate-600"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Telefone</label>
                                    <input
                                        name="phone"
                                        inputMode="tel"
                                        onChange={e => setFormData(f => ({ ...f, phone: maskPhone(e.target.value) }))}
                                        value={formData.phone}
                                        placeholder="(00) 00000-0000"
                                        className="w-full bg-black/40 border border-white/10 rounded-lg h-10 px-3 text-white text-sm outline-none focus:border-primary transition-colors placeholder:text-slate-600"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Cargo</label>
                                    <select
                                        name="role"
                                        onChange={handleInputChange}
                                        value={formData.role}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg h-10 px-3 text-white text-sm outline-none focus:border-primary transition-colors appearance-none"
                                    >
                                        <option value="employee" className="bg-zinc-900">Funcionário</option>
                                        <option value="admin" className="bg-zinc-900">Administrador</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">
                                    {editingUser ? 'Nova Senha (opcional)' : 'Senha Inicial'}
                                </label>
                                <input
                                    name="password"
                                    type="password"
                                    required={!editingUser}
                                    onChange={handleInputChange}
                                    value={formData.password}
                                    placeholder={editingUser ? 'Deixe em branco para manter' : '••••••'}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg h-10 px-3 text-white text-sm outline-none focus:border-primary transition-colors placeholder:text-slate-600"
                                />
                                <p className="text-[11px] text-slate-500 leading-snug pt-0.5">
                                    {PASSWORD_RULES_TEXT}
                                </p>
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.06]">
                                <button
                                    type="button"
                                    onClick={() => { setIsModalOpen(false); resetForm(); }}
                                    className="px-4 py-2 text-slate-400 hover:text-white text-sm transition-colors rounded-lg hover:bg-white/5"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="relative overflow-hidden group px-6 py-2 bg-primary text-black font-bold rounded-lg text-sm disabled:opacity-50"
                                >
                                    <span className="absolute inset-0 bg-primary-hover translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 rounded-lg" />
                                    <span className="relative flex items-center gap-2">
                                        {isLoading
                                            ? <><Spinner size={13} /> Salvando...</>
                                            : editingUser ? 'Atualizar' : 'Criar Usuário'
                                        }
                                    </span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
