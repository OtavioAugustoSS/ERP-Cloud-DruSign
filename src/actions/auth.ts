'use server'

import prisma from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function login(email: string, password: string) {
    if (!email || !password) {
        return { error: "Email e senha são obrigatórios" }
    }

    try {
        const user = await prisma.user.findUnique({ where: { email } })

        if (!user) return { error: "Usuário não encontrado" }

        const isValid = await bcrypt.compare(password, user.password)
        if (!isValid) return { error: "Senha incorreta" }

        return { user: { id: user.id, name: user.name, role: user.role } }
    } catch (error) {
        console.error("Login Error:", error)
        return { error: "Erro interno no servidor" }
    }
}
