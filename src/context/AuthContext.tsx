'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '../types/auth';
import {
    login as loginAction,
    logout as logoutAction,
    getCurrentUser,
} from '../actions/auth';

export type LoginResult = { user: User } | { error: string };

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<LoginResult>;
    logout: () => Promise<void>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        let alive = true;
        getCurrentUser()
            .then((u) => {
                if (alive) setUser(u);
            })
            .catch(() => {
                if (alive) setUser(null);
            })
            .finally(() => {
                if (alive) setIsLoading(false);
            });
        return () => {
            alive = false;
        };
    }, []);

    const login = async (email: string, password: string): Promise<LoginResult> => {
        setIsLoading(true);
        try {
            const result = await loginAction(email, password);
            if ('user' in result) setUser(result.user);
            return result;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            await logoutAction();
        } finally {
            setUser(null);
            router.push('/');
            router.refresh();
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
