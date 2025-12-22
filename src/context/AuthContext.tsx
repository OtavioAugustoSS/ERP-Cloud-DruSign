'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/auth';
import { useRouter } from 'next/navigation';
import { login as loginAction } from '../actions/auth';

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<any>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Check local storage on mount
        const storedUser = localStorage.getItem('drusign_user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Failed to parse user from local storage");
                localStorage.removeItem('drusign_user');
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string): Promise<any> => {
        setIsLoading(true);
        try {
            // Call Server Action
            const result = await loginAction(email, password);

            if (result?.user) {
                setUser(result.user);
                // We keep localStorage for client-side persistence of USER DETAILS only.
                // The actual session is handled by the HttpOnly cookie set by the server action.
                localStorage.setItem('drusign_user', JSON.stringify(result.user));
                return result;
            }

            return result; // contains error
        } catch (error) {
            console.error("AuthContext Login Error:", error);
            return { error: "Erro inesperado ao fazer login." };
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('drusign_user');
        // Force clear cookie client-side if possible (mostly for dev/ui feedback)
        // The server should handle this on a real logout route
        document.cookie = "session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
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
