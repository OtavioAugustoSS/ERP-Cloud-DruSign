'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/auth';
import { useRouter } from 'next/navigation';

interface AuthContextType {
    user: User | null;
    login: (email: string) => Promise<boolean>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock Users
const MOCK_USERS: User[] = [
    {
        id: 'user-admin',
        name: 'Administrador',
        email: 'admin@drusign.com',
        role: 'admin',
        phone: '11999999999'
    },
    {
        id: 'user-employee',
        name: 'Equipe de Vendas',
        email: 'equipe@drusign.com',
        role: 'employee',
        phone: '11888888888'
    }
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Check local storage on mount
        const storedUser = localStorage.getItem('drusign_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string): Promise<boolean> => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));

        const foundUser = MOCK_USERS.find(u => u.email === email);

        if (foundUser) {
            setUser(foundUser);
            localStorage.setItem('drusign_user', JSON.stringify(foundUser));
            return true;
        }

        return false;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('drusign_user');
        router.push('/login');
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
