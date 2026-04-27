'use server'

import prisma from '@/lib/db'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { SignJWT } from 'jose'
import { getJwtSecret, getSession } from '@/lib/auth/session'
import type { SessionUser, User, UserRole } from '@/types/auth'

// In-memory rate limiter: max 5 attempts per email per 15 min
const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

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

export async function login(email: string, password: string): Promise<{ user: User } | { error: string }> {
    if (!email || !password) {
        return { error: 'Email e senha são obrigatórios' }
    }

    const key = email.toLowerCase().trim();
    if (!checkRateLimit(key)) {
        return { error: 'Muitas tentativas. Aguarde 15 minutos e tente novamente.' }
    }

    try {
        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) return { error: 'Credenciais inválidas' }

        const isValid = await bcrypt.compare(password, user.password)
        if (!isValid) return { error: 'Credenciais inválidas' }

        // Clear attempts on success
        loginAttempts.delete(key);

        const token = await new SignJWT({
            id: user.id,
            email: user.email,
            role: user.role,
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('24h')
            .sign(getJwtSecret())

        ;(await cookies()).set('session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24,
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
