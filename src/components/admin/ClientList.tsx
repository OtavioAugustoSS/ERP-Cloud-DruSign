'use client';

import React, { useState, useTransition } from 'react';
import { Loader2, Pencil, Trash2, Plus, Search, UserRound } from 'lucide-react';
import { createClient, updateClient, deleteClient } from '@/actions/client';
import { maskDocument, maskPhone } from '@/lib/utils/masks';
import type { Client } from '@/types';

interface ClientListProps {
    initialClients: Client[];
}

interface FormState {
    name: string;
    email: string;
    phone: string;
    document: string;
}

const emptyForm: FormState = { name: '', email: '', phone: '', document: '' };

export default function ClientList({ initialClients }: ClientListProps) {
    const [clients, setClients] = useState<Client[]>(initialClients);
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Client | null>(null);
    const [form, setForm] = useState<FormState>(emptyForm);
    const [error, setError] = useState('');
    const [isPending, startTransition] = useTransition();

    const filtered = clients.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.document?.includes(search) ||
        c.phone?.includes(search)
    );

    function openCreate() {
        setEditing(null);
        setForm(emptyForm);
        setError('');
        setModalOpen(true);
    }

    function openEdit(client: Client) {
        setEditing(client);
        setForm({
            name: client.name,
            email: client.email ?? '',
            phone: maskPhone(client.phone ?? ''),
            document: maskDocument(client.document ?? ''),
        });
        setError('');
        setModalOpen(true);
    }

    function closeModal() {
        setModalOpen(false);
        setEditing(null);
        setForm(emptyForm);
        setError('');
    }

    function handleSave() {
        if (!form.name.trim()) { setError('Nome é obrigatório.'); return; }
        setError('');
        startTransition(async () => {
            if (editing) {
                const res = await updateClient(editing.id, form);
                if (!res.success) { setError(res.error ?? 'Erro ao salvar.'); return; }
                setClients(prev => prev.map(c =>
                    c.id === editing.id ? { ...c, ...form, updatedAt: new Date() } : c
                ));
            } else {
                const res = await createClient(form);
                if (!res.success || !res.client) { setError(res.error ?? 'Erro ao criar.'); return; }
                setClients(prev => [...prev, res.client!].sort((a, b) => a.name.localeCompare(b.name)));
            }
            closeModal();
        });
    }

    function handleDelete(client: Client) {
        if (!confirm(`Excluir cliente "${client.name}"?`)) return;
        startTransition(async () => {
            const res = await deleteClient(client.id);
            if (!res.success) { alert(res.error ?? 'Erro ao excluir.'); return; }
            setClients(prev => prev.filter(c => c.id !== client.id));
        });
    }

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg h-10 pl-9 pr-3 text-sm text-white outline-none focus:border-blue-500 placeholder:text-zinc-600"
                        placeholder="Buscar por nome, documento ou telefone..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 h-10 px-4 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                    <Plus size={16} /> Novo Cliente
                </button>
            </div>

            {/* Table */}
            <div className="border border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-zinc-900 text-[10px] uppercase text-zinc-500 font-bold tracking-wider">
                        <tr>
                            <th className="px-5 py-3">Nome</th>
                            <th className="px-5 py-3">Documento</th>
                            <th className="px-5 py-3">Telefone</th>
                            <th className="px-5 py-3">E-mail</th>
                            <th className="px-5 py-3 w-20 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                        {filtered.map(c => (
                            <tr key={c.id} className="hover:bg-zinc-900/40 transition-colors group">
                                <td className="px-5 py-3 font-medium text-white">{c.name}</td>
                                <td className="px-5 py-3 text-zinc-400 font-mono text-xs">{c.document ?? '—'}</td>
                                <td className="px-5 py-3 text-zinc-400">{c.phone ?? '—'}</td>
                                <td className="px-5 py-3 text-zinc-400">{c.email ?? '—'}</td>
                                <td className="px-5 py-3 text-right">
                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openEdit(c)} className="h-7 w-7 flex items-center justify-center rounded text-zinc-400 hover:text-blue-400 hover:bg-blue-400/10 transition-colors">
                                            <Pencil size={13} />
                                        </button>
                                        <button onClick={() => handleDelete(c)} className="h-7 w-7 flex items-center justify-center rounded text-zinc-400 hover:text-red-400 hover:bg-red-400/10 transition-colors">
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-5 py-12 text-center text-zinc-600 italic">
                                    {search ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado ainda.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md shadow-2xl">
                        <div className="flex items-center gap-3 p-6 border-b border-zinc-800">
                            <div className="h-9 w-9 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center">
                                <UserRound size={18} />
                            </div>
                            <h2 className="text-base font-bold text-white">
                                {editing ? 'Editar Cliente' : 'Novo Cliente'}
                            </h2>
                        </div>

                        <div className="p-6 space-y-4">
                            {error && (
                                <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                                    {error}
                                </p>
                            )}

                            <Field label="Nome *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Nome ou razão social" autoFocus />
                            <Field label="Documento (CPF/CNPJ)" value={form.document} onChange={v => setForm(f => ({ ...f, document: maskDocument(v) }))} placeholder="000.000.000-00" inputMode="numeric" />
                            <Field label="Telefone / WhatsApp" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: maskPhone(v) }))} placeholder="(00) 00000-0000" inputMode="tel" />
                            <Field label="E-mail" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} placeholder="cliente@email.com" type="email" />
                        </div>

                        <div className="flex justify-end gap-3 px-6 pb-6">
                            <button onClick={closeModal} className="px-4 h-10 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
                                Cancelar
                            </button>
                            <button onClick={handleSave} disabled={isPending}
                                className="px-5 h-10 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50">
                                {isPending && <Loader2 size={14} className="animate-spin" />}
                                {editing ? 'Salvar Alterações' : 'Criar Cliente'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function Field({ label, value, onChange, placeholder, type = 'text', autoFocus, inputMode }: {
    label: string; value: string; onChange: (v: string) => void;
    placeholder?: string; type?: string; autoFocus?: boolean; inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
}) {
    return (
        <div>
            <label className="text-[10px] text-zinc-500 font-bold uppercase mb-1.5 block">{label}</label>
            <input
                type={type}
                autoFocus={autoFocus}
                inputMode={inputMode}
                className="w-full bg-black/40 border border-zinc-800 hover:border-zinc-700 focus:border-blue-500 rounded-lg h-10 px-3 text-sm text-white outline-none transition-all placeholder:text-zinc-700"
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
            />
        </div>
    );
}
