import 'server-only';

import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import type { SessionUser, UserRole } from '@/types/auth';

export class UnauthorizedError extends Error {
    constructor(message = 'UNAUTHORIZED') {
        super(message);
        this.name = 'UnauthorizedError';
    }
}

export class ForbiddenError extends Error {
    constructor(message = 'FORBIDDEN') {
        super(message);
        this.name = 'ForbiddenError';
    }
}

export function getJwtSecret(): Uint8Array {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32) {
        throw new Error(
            'JWT_SECRET não configurado (ou com menos de 32 caracteres). Gere com `openssl rand -base64 32` e defina em .env.'
        );
    }
    return new TextEncoder().encode(secret);
}

const DEFAULT_SESSION_TTL_SECONDS = 60 * 60 * 24; // 24h
const MIN_SESSION_TTL_SECONDS = 60 * 15;          // 15min — abaixo disso é UX ruim
const MAX_SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 dias — acima disso vira risco

export function getSessionTtlSeconds(): number {
    const raw = process.env.JWT_EXPIRES_IN_SECONDS;
    if (!raw) return DEFAULT_SESSION_TTL_SECONDS;
    const n = Number(raw);
    if (!Number.isFinite(n) || n < MIN_SESSION_TTL_SECONDS || n > MAX_SESSION_TTL_SECONDS) {
        return DEFAULT_SESSION_TTL_SECONDS;
    }
    return Math.floor(n);
}

export async function getSession(): Promise<SessionUser | null> {
    const token = (await cookies()).get('session')?.value;
    if (!token) return null;

    try {
        const { payload } = await jwtVerify(token, getJwtSecret());
        if (typeof payload.id !== 'string' || typeof payload.email !== 'string') return null;
        const role = payload.role;
        if (role !== 'admin' && role !== 'employee') return null;
        return { id: payload.id, email: payload.email, role: role as UserRole };
    } catch {
        return null;
    }
}

export async function requireUser(): Promise<SessionUser> {
    const session = await getSession();
    if (!session) throw new UnauthorizedError();
    return session;
}

export async function requireAdmin(): Promise<SessionUser> {
    const session = await requireUser();
    if (session.role !== 'admin') throw new ForbiddenError();
    return session;
}
