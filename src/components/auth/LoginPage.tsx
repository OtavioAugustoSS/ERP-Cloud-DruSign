'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { Icons } from '../admin/Icons';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { login } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const success = await login(email);
            if (success) {
                router.push('/');
            } else {
                setError('Email não encontrado. Tente admin@drusign.com ou equipe@drusign.com');
            }
        } catch (err) {
            setError('Ocorreu um erro ao fazer login');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background-dark flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo / Header */}
                <div className="text-center mb-8">
                    <div className="w-48 h-48 mx-auto mb-6 relative rounded-full overflow-hidden border-4 border-primary/20 shadow-[0_0_30px_rgba(34,211,238,0.3)]">
                        <img
                            src="/logo.png"
                            alt="DruSign Logo"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>

                {/* Login Card */}
                <div className="bg-surface-dark border border-white/5 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-sm">
                    <div className="p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-3">
                                    <Icons.Alert className="text-red-500 shrink-0 mt-0.5" size={16} />
                                    <p className="text-red-400 text-sm">{error}</p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block ml-1">Email</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                                        <Icons.Description size={18} />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="seu@email.com"
                                        className="w-full h-12 rounded-xl bg-black/40 border border-white/10 focus:border-primary text-white text-sm pl-11 pr-4 focus:ring-1 focus:ring-primary transition-all outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block ml-1">Senha</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                                        <Icons.Check size={18} />
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full h-12 rounded-xl bg-black/40 border border-white/10 focus:border-primary text-white text-sm pl-11 pr-4 focus:ring-1 focus:ring-primary transition-all outline-none"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting} // Corrected
                                className="w-full h-12 bg-primary hover:bg-primary/90 text-background-dark font-bold rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-background-dark/30 border-t-background-dark rounded-full animate-spin" />
                                        <span>Entrando...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Entrar</span>
                                        <Icons.ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>


            </div>
        </div>
    );
}
