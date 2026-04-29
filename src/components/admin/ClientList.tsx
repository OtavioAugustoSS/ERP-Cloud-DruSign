'use client';

import React, { useState, useTransition, useMemo, useCallback } from 'react';
import {
    Loader2, Pencil, Trash2, Plus, UserRound, MapPin,
    Phone, Mail, FileText, X, StickyNote, Check, AlertTriangle,
} from 'lucide-react';
import { createClient, updateClient, deleteClient } from '@/actions/client';
import { maskDocument, maskPhone, maskCEP } from '@/lib/utils/masks';
import { fetchAddressByCEP } from '@/lib/utils/viaCEP';
import { Icons } from './Icons';
import type { Client } from '@/types';

interface ClientListProps {
    initialClients: Client[];
}

type ToastState = { type: 'success' | 'error'; message: string } | null;

interface FormState {
    name: string; email: string; phone: string; document: string; ie: string;
    zip: string; street: string; number: string; neighborhood: string; city: string; state: string;
    notes: string;
}

const emptyForm: FormState = {
    name: '', email: '', phone: '', document: '', ie: '',
    zip: '', street: '', number: '', neighborhood: '', city: '', state: '', notes: '',
};

// ── Avatar ───────────────────────────────────────────────────────────────────
const AVATAR_GRADIENTS = [
    'from-primary to-cyan-600',
    'from-purple-500 to-purple-700',
    'from-amber-500 to-orange-600',
    'from-green-500 to-emerald-700',
    'from-rose-500 to-red-700',
    'from-blue-500 to-blue-700',
    'from-pink-500 to-pink-700',
];

function avatarGradient(name: string) {
    return AVATAR_GRADIENTS[name.charCodeAt(0) % AVATAR_GRADIENTS.length];
}

function initials(name: string) {
    return name.trim().split(/\s+/).map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('');
}

// ── Input estilizado ──────────────────────────────────────────────────────────
const inputCls = 'w-full bg-background-dark border border-white/5 hover:border-white/10 focus:border-primary rounded-xl h-10 px-3 text-sm text-white outline-none transition-colors placeholder:text-slate-700';
const labelCls = 'text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 block';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className={labelCls}>{label}</label>
            {children}
        </div>
    );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function ClientList({ initialClients }: ClientListProps) {
    const [clients, setClients] = useState<Client[]>(initialClients);
    const [search, setSearch]   = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing]     = useState<Client | null>(null);
    const [form, setForm]           = useState<FormState>(emptyForm);
    const [error, setError]         = useState('');
    const [isLoadingCEP, setIsLoadingCEP] = useState(false);
    const [isPending, startTransition]    = useTransition();
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const [toast, setToast] = useState<ToastState>(null);

    const showToast = useCallback((type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3500);
    }, []);

    const filtered = useMemo(() => clients.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.document?.includes(search) ||
        c.phone?.includes(search) ||
        c.email?.toLowerCase().includes(search.toLowerCase()) ||
        c.city?.toLowerCase().includes(search.toLowerCase())
    ), [clients, search]);

    // Estatísticas
    const stats = useMemo(() => ({
        total:      clients.length,
        withOrders: clients.filter(c => (c.orderCount ?? 0) > 0).length,
    }), [clients]);

    function set(field: keyof FormState) {
        return (v: string) => setForm(f => ({ ...f, [field]: v }));
    }

    async function handleCEP(raw: string) {
        const masked = maskCEP(raw);
        setForm(f => ({ ...f, zip: masked }));
        const digits = raw.replace(/\D/g, '');
        if (digits.length !== 8) return;
        setIsLoadingCEP(true);
        try {
            const addr = await fetchAddressByCEP(digits);
            if (addr) setForm(f => ({
                ...f,
                street:       addr.logradouro || f.street,
                neighborhood: addr.bairro     || f.neighborhood,
                city:         addr.localidade || f.city,
                state:        addr.uf         || f.state,
            }));
        } finally { setIsLoadingCEP(false); }
    }

    function openCreate() {
        setEditing(null); setForm(emptyForm); setError(''); setModalOpen(true);
    }

    function openEdit(c: Client) {
        setEditing(c);
        setForm({
            name:         c.name,
            email:        c.email        ?? '',
            phone:        maskPhone(c.phone        ?? ''),
            document:     maskDocument(c.document  ?? ''),
            ie:           c.ie           ?? '',
            zip:          maskCEP(c.zip  ?? ''),
            street:       c.street       ?? '',
            number:       c.number       ?? '',
            neighborhood: c.neighborhood ?? '',
            city:         c.city         ?? '',
            state:        c.state        ?? '',
            notes:        c.notes        ?? '',
        });
        setError(''); setModalOpen(true);
    }

    function closeModal() {
        setModalOpen(false); setEditing(null); setForm(emptyForm); setError('');
    }

    const handleSave = useCallback(() => {
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
    }, [form, editing]); // eslint-disable-line react-hooks/exhaustive-deps

    function handleDelete(c: Client) {
        setConfirmDelete(null);
        startTransition(async () => {
            const res = await deleteClient(c.id);
            if (!res.success) {
                showToast('error', res.error ?? 'Erro ao excluir cliente.');
                return;
            }
            setClients(prev => prev.filter(x => x.id !== c.id));
            showToast('success', `Cliente "${c.name}" excluído.`);
        });
    }

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-background-dark">

            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-[200] flex items-center gap-3 px-5 py-3 rounded-xl border shadow-2xl animate-fade-in-up backdrop-blur-md ${
                    toast.type === 'success'
                        ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-400'
                        : 'bg-red-950/80 border-red-500/30 text-red-400'
                }`}>
                    {toast.type === 'success' ? <Check size={15} /> : <AlertTriangle size={15} />}
                    <span className="text-sm font-medium">{toast.message}</span>
                </div>
            )}

            {/* ── HEADER ── */}
            <header className="flex-none px-8 py-5 border-b border-white/5 bg-background-dark/50 backdrop-blur-sm z-10">

                {/* Linha 1 */}
                <div className="flex items-center justify-between gap-4 animate-fade-in-up">
                    <div>
                        <h2 className="text-white text-2xl font-bold leading-tight tracking-tight">Clientes</h2>
                        <p className="text-slate-500 text-xs mt-0.5">Cadastro de clientes e suas informações.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={openCreate}
                            className="group/newbtn relative flex items-center gap-2 h-9 pl-3.5 pr-4 rounded-full bg-primary/10 border border-primary/20 text-primary font-semibold text-xs overflow-hidden hover:border-primary/40 transition-colors shadow-[0_0_12px_rgba(34,211,238,0.06)] hover:shadow-[0_0_20px_rgba(34,211,238,0.2)]"
                        >
                            <span className="absolute inset-0 bg-primary -translate-x-full group-hover/newbtn:translate-x-0 transition-transform duration-300 ease-out rounded-full" />
                            <Plus size={15} className="relative z-10 group-hover/newbtn:text-background-dark transition-colors duration-300" />
                            <span className="relative z-10 group-hover/newbtn:text-background-dark transition-colors duration-300">Novo Cliente</span>
                        </button>
                    </div>
                </div>

                {/* Linha 2 — Stats */}
                <div className="flex items-center gap-2 mt-4 flex-wrap animate-fade-in-up animate-delay-100">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/5 border border-primary/10 text-[11px] text-primary font-medium">
                        <UserRound size={11} />
                        {stats.total} cadastrado{stats.total !== 1 ? 's' : ''}
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/5 border border-green-500/10 text-[11px] text-green-400 font-medium">
                        <FileText size={11} />
                        {stats.withOrders} com pedidos
                    </div>
                </div>

                {/* Linha 3 — Busca */}
                <div className="mt-4 animate-fade-in-up animate-delay-150">
                    <div className="flex w-full items-center rounded-full h-11 bg-white/5 border border-white/10 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all overflow-hidden">
                        <div className="pl-4 text-slate-500"><Icons.Search size={18} /></div>
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full bg-transparent border-none text-white placeholder-slate-600 px-3 focus:ring-0 h-full text-sm outline-none"
                            placeholder="Buscar por nome, documento, telefone, e-mail ou cidade..."
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="pr-4 text-slate-500 hover:text-white transition-colors">
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* ── TABELA ── */}
            <div className="flex-1 overflow-auto p-6 pt-4">
                <div className="w-full rounded-2xl border border-white/10 bg-surface-dark/50 overflow-hidden shadow-2xl animate-fade-in-up animate-delay-200">
                    {filtered.length === 0 ? (
                        <div className="py-16 flex flex-col items-center gap-3 text-slate-500">
                            <UserRound size={32} className="opacity-30" />
                            <p className="text-sm">{search ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado ainda.'}</p>
                            {search && (
                                <button onClick={() => setSearch('')} className="text-xs text-primary/70 hover:text-primary transition-colors underline underline-offset-2">
                                    Limpar busca
                                </button>
                            )}
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 bg-black/20 text-slate-500 text-[11px] uppercase tracking-widest font-semibold">
                                    <th className="p-3 pl-6">Cliente</th>
                                    <th className="p-3">Contato</th>
                                    <th className="p-3">Localização</th>
                                    <th className="p-3 w-28 text-center">Pedidos</th>
                                    <th className="p-3 w-28">Cadastro</th>
                                    <th className="p-3 pr-6 w-24 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04] text-sm">
                                {filtered.map(c => {
                                    const hasOrders = (c.orderCount ?? 0) > 0;
                                    const location = [c.city, c.state].filter(Boolean).join(' · ');
                                    return (
                                        <tr key={c.id} className="group hover:bg-white/[0.04] transition-all cursor-default border-l-2 border-l-transparent hover:border-l-primary/30">

                                            {/* Avatar + Nome + Documento */}
                                            <td className="p-3 pl-6">
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-9 w-9 rounded-full bg-gradient-to-br ${avatarGradient(c.name)} flex items-center justify-center text-xs font-bold text-white shrink-0 select-none`}>
                                                        {initials(c.name)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-white font-medium text-sm leading-tight truncate">{c.name}</p>
                                                        {c.document && (
                                                            <p className="text-[10px] text-slate-600 font-mono mt-0.5">{c.document}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Contato */}
                                            <td className="p-3">
                                                <div className="flex flex-col gap-0.5">
                                                    {c.phone ? (
                                                        <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
                                                            <Phone size={10} className="text-slate-600 shrink-0" />
                                                            {c.phone}
                                                        </span>
                                                    ) : null}
                                                    {c.email ? (
                                                        <span className="flex items-center gap-1.5 text-[11px] text-slate-400 truncate max-w-[220px]">
                                                            <Mail size={10} className="text-slate-600 shrink-0" />
                                                            {c.email}
                                                        </span>
                                                    ) : null}
                                                    {!c.phone && !c.email && (
                                                        <span className="text-[10px] text-slate-700 font-mono">—</span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Localização */}
                                            <td className="p-3">
                                                {location ? (
                                                    <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
                                                        <MapPin size={10} className="text-slate-600 shrink-0" />
                                                        {location}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-slate-700 font-mono">—</span>
                                                )}
                                            </td>

                                            {/* Pedidos */}
                                            <td className="p-3 text-center">
                                                {hasOrders ? (
                                                    <span className="inline-flex items-center justify-center h-6 min-w-[1.5rem] px-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold tabular-nums">
                                                        {c.orderCount}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-slate-700 font-mono">—</span>
                                                )}
                                            </td>

                                            {/* Cadastro */}
                                            <td className="p-3">
                                                <span className="text-[10px] text-slate-600 font-mono">
                                                    {new Date(c.createdAt).toLocaleDateString('pt-BR')}
                                                </span>
                                            </td>

                                            {/* Ações */}
                                            <td className="p-3 pr-6 text-right">
                                                {confirmDelete === c.id ? (
                                                    <div className="flex items-center justify-end gap-1.5 animate-fade-in">
                                                        <button
                                                            onClick={() => handleDelete(c)}
                                                            disabled={isPending}
                                                            className="text-xs px-2.5 py-1 bg-red-500/15 text-red-400 border border-red-500/25 rounded-lg hover:bg-red-500/25 transition-colors font-medium disabled:opacity-50"
                                                        >
                                                            {hasOrders ? `Excluir (${c.orderCount} pedido${(c.orderCount ?? 0) > 1 ? 's' : ''})` : 'Confirmar'}
                                                        </button>
                                                        <button
                                                            onClick={() => setConfirmDelete(null)}
                                                            className="text-slate-500 hover:text-white transition-colors p-1"
                                                            title="Cancelar"
                                                        >
                                                            <X size={13} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => openEdit(c)}
                                                            className="h-7 w-7 flex items-center justify-center rounded-full text-slate-500 hover:text-primary hover:bg-primary/10 transition-colors"
                                                            title="Editar cliente"
                                                        >
                                                            <Pencil size={13} />
                                                        </button>
                                                        <button
                                                            onClick={() => setConfirmDelete(c.id)}
                                                            className="h-7 w-7 flex items-center justify-center rounded-full text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                                                            title="Excluir cliente"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Rodapé */}
                {filtered.length > 0 && (
                    <p className="text-[11px] text-slate-600 mt-3 px-1 font-mono animate-fade-in-up animate-delay-250">
                        {filtered.length === clients.length
                            ? `${clients.length} cliente${clients.length !== 1 ? 's' : ''} no total`
                            : `${filtered.length} de ${clients.length} cliente${clients.length !== 1 ? 's' : ''} exibido${filtered.length !== 1 ? 's' : ''}`
                        }
                    </p>
                )}
            </div>

            {/* ── MODAL CRIAR / EDITAR ── */}
            {modalOpen && (
                <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-surface-dark border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl shadow-black/60 flex flex-col max-h-[90vh] animate-fade-in-up">

                        {/* Cabeçalho */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
                                    <UserRound size={18} />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-white">{editing ? 'Editar Cliente' : 'Novo Cliente'}</h2>
                                    <p className="text-[11px] text-slate-500">{editing ? editing.name : 'Preencha os dados do cliente'}</p>
                                </div>
                            </div>
                            <button onClick={closeModal} className="h-8 w-8 rounded-full flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-colors">
                                <X size={16} />
                            </button>
                        </div>

                        {/* Corpo com scroll */}
                        <div className="overflow-y-auto flex-1 p-6 space-y-5">
                            {error && (
                                <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2.5">
                                    {error}
                                </p>
                            )}

                            {/* Seção 1 — Identificação */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <UserRound size={13} className="text-slate-500" />
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Identificação</span>
                                    <div className="flex-1 h-px bg-white/[0.05]" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="col-span-2">
                                        <Field label="Nome / Razão Social *">
                                            <input autoFocus value={form.name} onChange={e => set('name')(e.target.value)} placeholder="Nome do cliente ou empresa" className={inputCls} />
                                        </Field>
                                    </div>
                                    <Field label="CPF / CNPJ">
                                        <input value={form.document} onChange={e => set('document')(maskDocument(e.target.value))} placeholder="000.000.000-00" inputMode="numeric" className={inputCls} />
                                    </Field>
                                    <Field label="Inscrição Estadual">
                                        <input value={form.ie} onChange={e => set('ie')(e.target.value)} placeholder="IE (se aplicável)" className={inputCls} />
                                    </Field>
                                    <Field label="Telefone / WhatsApp">
                                        <input value={form.phone} onChange={e => set('phone')(maskPhone(e.target.value))} placeholder="(00) 00000-0000" inputMode="tel" className={inputCls} />
                                    </Field>
                                    <Field label="E-mail">
                                        <input type="email" value={form.email} onChange={e => set('email')(e.target.value)} placeholder="cliente@email.com" className={inputCls} />
                                    </Field>
                                </div>
                            </div>

                            {/* Seção 2 — Endereço */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <MapPin size={13} className="text-slate-500" />
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Endereço</span>
                                    <div className="flex-1 h-px bg-white/[0.05]" />
                                </div>
                                <div className="grid grid-cols-6 gap-3">
                                    <div className="col-span-2 relative">
                                        <Field label="CEP">
                                            <input
                                                value={form.zip}
                                                onChange={e => handleCEP(e.target.value)}
                                                placeholder="00000-000"
                                                inputMode="numeric"
                                                className={inputCls}
                                            />
                                        </Field>
                                        {isLoadingCEP && (
                                            <Loader2 size={12} className="absolute right-3 top-[2.15rem] animate-spin text-primary" />
                                        )}
                                    </div>
                                    <div className="col-span-3">
                                        <Field label="Rua / Logradouro">
                                            <input value={form.street} onChange={e => set('street')(e.target.value)} placeholder="Nome da rua" className={inputCls} />
                                        </Field>
                                    </div>
                                    <div className="col-span-1">
                                        <Field label="Número">
                                            <input value={form.number} onChange={e => set('number')(e.target.value)} placeholder="Nº" className={inputCls} />
                                        </Field>
                                    </div>
                                    <div className="col-span-2">
                                        <Field label="Bairro">
                                            <input value={form.neighborhood} onChange={e => set('neighborhood')(e.target.value)} placeholder="Bairro" className={inputCls} />
                                        </Field>
                                    </div>
                                    <div className="col-span-3">
                                        <Field label="Cidade">
                                            <input value={form.city} onChange={e => set('city')(e.target.value)} placeholder="Cidade" className={inputCls} />
                                        </Field>
                                    </div>
                                    <div className="col-span-1">
                                        <Field label="UF">
                                            <input value={form.state} onChange={e => set('state')(e.target.value.toUpperCase().slice(0, 2))} placeholder="SP" className={inputCls} />
                                        </Field>
                                    </div>
                                </div>
                            </div>

                            {/* Seção 3 — Observações */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <StickyNote size={13} className="text-slate-500" />
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Observações Internas</span>
                                    <div className="flex-1 h-px bg-white/[0.05]" />
                                </div>
                                <textarea
                                    value={form.notes}
                                    onChange={e => set('notes')(e.target.value)}
                                    placeholder="Anotações internas sobre o cliente (não visível para o cliente)..."
                                    rows={3}
                                    className="w-full bg-background-dark border border-white/5 hover:border-white/10 focus:border-primary rounded-xl px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-slate-700 resize-none"
                                />
                            </div>
                        </div>

                        {/* Rodapé */}
                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.06] shrink-0">
                            <button onClick={closeModal} className="h-9 px-4 rounded-full text-sm text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isPending}
                                className="group/savebtn relative flex items-center gap-2 h-9 pl-4 pr-5 rounded-full bg-primary/10 border border-primary/20 text-primary font-semibold text-sm overflow-hidden hover:border-primary/40 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                            >
                                <span className="absolute inset-0 bg-primary -translate-x-full group-hover/savebtn:translate-x-0 transition-transform duration-300 ease-out rounded-full" />
                                {isPending
                                    ? <Loader2 size={14} className="relative z-10 animate-spin" />
                                    : null
                                }
                                <span className="relative z-10 group-hover/savebtn:text-background-dark transition-colors duration-300">
                                    {editing ? 'Salvar Alterações' : 'Criar Cliente'}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
