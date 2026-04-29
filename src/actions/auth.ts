'use server'

import prisma from '@/lib/db'
import bcrypt from 'bcryptjs'
import { cookies, headers } from 'next/headers'
import { SignJWT } from 'jose'
import { getJwtSecret, getSession, getSessionTtlSeconds } from '@/lib/auth/session'
import { audit } from '@/lib/auth/audit'
import type { SessionUser, User, UserRole } from '@/types/auth'

// Rate limiter in-memory.
// Chave dupla (email + IP) para impedir tanto enumeração de senha quanto botnet.
// Em produção com múltiplas instâncias, migrar para Redis/Upstash.
const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();
const MAX_ATTEMPTS = Number(process.env.LOGIN_MAX_ATTEMPTS) || 5;
const WINDOW_MS = (Number(process.env.LOGIN_WINDOW_MINUTES) || 15) * 60 * 1000;

function checkRateLimit(key: string): boolean {
    const now = Date.now();
    const rec = loginAttempts.get(key);
    if (!rec || now - rec.firstAttempt > WINDOW_MS) {
        loginAttempts.set(key, { count: 1, firstAttempt: now });
        return true;
    }
    if (rec.count >= MAX_ATTEMPTS) return false;
    rec.count++;
    return true;
}

async function getClientIp(): Promise<string> {
    const h = await headers();
    // Ordem comum em proxies reversos (Caddy, nginx, Cloudflare)
    const forwarded = h.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0].trim();
    return h.get('x-real-ip') || h.get('cf-connecting-ip') || 'unknown';
}

export async function login(email: string, password: string): Promise<{ user: User } | { error: string }> {
    if (!email || !password) {
        return { error: 'Email e senha são obrigatórios' }
    }

    const emailKey = `email:${email.toLowerCase().trim()}`;
    const ipKey = `ip:${await getClientIp()}`;
    if (!checkRateLimit(emailKey) || !checkRateLimit(ipKey)) {
        const minutes = Number(process.env.LOGIN_WINDOW_MINUTES) || 15;
        return { error: `Muitas tentativas. Aguarde ${minutes} minutos e tente novamente.` }
    }

    try {
        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) {
            await audit({ action: 'LOGIN_FAILURE', details: { email, reason: 'user_not_found' } });
            return { error: 'Credenciais inválidas' }
        }

        const isValid = await bcrypt.compare(password, user.password)
        if (!isValid) {
            await audit({ action: 'LOGIN_FAILURE', userId: user.id, details: { email, reason: 'wrong_password' } });
            return { error: 'Credenciais inválidas' }
        }

        // Clear attempts on success
        loginAttempts.delete(emailKey);
        loginAttempts.delete(ipKey);
        await audit({ action: 'LOGIN_SUCCESS', userId: user.id });

        const ttlSeconds = getSessionTtlSeconds();
        const token = await new SignJWT({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime(`${ttlSeconds}s`)
            .sign(getJwtSecret())

        ;(await cookies()).set('session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: ttlSeconds,
            path: '/',
        })

        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role as UserRole,
                image: user.image,
                phone: user.phone ?? undefined,
            },
        }
    } catch (error) {
        console.error('Login error:', error)
        return { error: 'Erro interno no servidor' }
    }
}

export async function logout(): Promise<{ success: true }> {
    await audit({ action: 'LOGOUT' });
    ;(await cookies()).delete('session')
    return { success: true }
}

export async function getCurrentUser(): Promise<User | null> {
    const session: SessionUser | null = await getSession()
    if (!session) return null

    const user = await prisma.user.findUnique({ where: { id: session.id } })
    if (!user) return null

    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as UserRole,
        image: user.image,
        phone: user.phone ?? undefined,
    }
}
