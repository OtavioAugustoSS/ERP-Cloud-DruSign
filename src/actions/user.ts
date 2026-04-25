'use server'

import prisma from '@/lib/db'
import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/session'
import { RegisterUserInput, UpdateUserInput } from '@/types'

export async function registerUser(data: RegisterUserInput) {
    await requireAdmin();
    try {
        const { name, email, password, role, phone, image } = data;

        if (!name || !email || !password || !role) {
            return { error: "Preencha todos os campos obrigatórios." };
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return { error: "Email já cadastrado." };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.create({
            data: { name, email, password: hashedPassword, role, phone, image }
        });

        revalidatePath('/admin/users');
        return { success: "Usuário criado com sucesso!" };
    } catch (error) {
        console.error("Erro ao registrar usuário:", error);
        return { error: "Erro ao criar usuário." };
    }
}

export async function getUsers() {
    await requireAdmin();
    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                phone: true,
                image: true,
                createdAt: true
            }
        });
        return { users };
    } catch (error) {
        console.error("Erro ao buscar usuários:", error);
        return { error: "Erro ao buscar usuários." };
    }
}

export async function updateUser(id: string, data: UpdateUserInput) {
    await requireAdmin();
    try {
        const { name, email, role, phone, image, password } = data;

        if (email) {
            const existingUser = await prisma.user.findFirst({
                where: { email, NOT: { id } }
            });
            if (existingUser) {
                return { error: "Este email já está em uso por outro usuário." };
            }
        }

        const updateData: {
            name?: string;
            email?: string;
            role?: 'admin' | 'employee';
            phone?: string;
            image?: string;
            password?: string;
        } = { name, email, role, phone, image };

        if (password && password.trim() !== '') {
            updateData.password = await bcrypt.hash(password, 10);
        }

        await prisma.user.update({ where: { id }, data: updateData });

        revalidatePath('/admin/users');
        return { success: "Usuário atualizado!" };
    } catch (error) {
        console.error("Erro ao atualizar usuário:", error);
        return { error: "Erro ao atualizar usuário." };
    }
}

export async function deleteUser(id: string) {
    await requireAdmin();
    try {
        await prisma.user.delete({ where: { id } });
        revalidatePath('/admin/users');
        return { success: "Usuário removido." };
    } catch (error) {
        console.error("Erro ao remover usuário:", error);
        return { error: "Erro ao remover usuário." };
    }
}
