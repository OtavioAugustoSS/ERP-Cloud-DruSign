export type UserRole = 'admin' | 'employee';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    phone?: string;
    image?: string | null;
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
}

export interface SessionUser {
    id: string;
    email: string;
    role: UserRole;
}
