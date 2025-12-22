'use server'

import prisma from '@/lib/db'
import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'

export async function registerUser(data: any) {
    try {
        const { name, email, password, role, phone, image } = data;

        if (!name || !email || !password || !role) {
            return { error: "Preencha todos os campos obrigatórios." };
        }

        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return { error: "Email já cadastrado." };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role,
                phone,
                image
            }
        });

        revalidatePath('/admin/users');
        return { success: "Usuário criado com sucesso!" };
    } catch (error) {
        console.error("Erro ao registrar usuário:", error);
        return { error: "Erro ao criar usuário." };
    }
}

export async function getUsers() {
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

export async function updateUser(id: string, data: any) {
    try {
        const { name, email, role, phone, image, password } = data;

        // Check if email is being changed and if it's taken by another user
        if (email) {
            const existingUser = await prisma.user.findFirst({
                where: {
                    email: email,
                    NOT: {
                        id: id
                    }
                }
            });

            if (existingUser) {
                return { error: "Este email já está em uso por outro usuário." };
            }
        }

        const updateData: any = {
            name,
            email,
            role,
            phone,
            image
        };

        if (password && password.trim() !== '') {
            updateData.password = await bcrypt.hash(password, 10);
        }

        await prisma.user.update({
            where: { id },
            data: updateData
        });

        revalidatePath('/admin/users');
        return { success: "Usuário atualizado!" };
    } catch (error) {
        console.error("Erro ao atualizar usuário:", error);
        return { error: "Erro ao atualizar usuário." };
    }
}

export async function deleteUser(id: string) {
    try {
        await prisma.user.delete({
            where: { id }
        });
        revalidatePath('/admin/users');
        return { success: "Usuário removido." };
    } catch (error) {
        console.error("Erro ao remover usuário:", error);
        return { error: "Erro ao remover usuário." };
    }
}
