'use server'

import prisma from '@/lib/db';
import { requireUser, requireAdmin } from '@/lib/auth/session';
import type { Client, CreateClientInput, UpdateClientInput } from '@/types';

export async function getClients(): Promise<Client[]> {
    await requireUser();
    const clients = await prisma.client.findMany({
        orderBy: { name: 'asc' },
    });
    return clients.map(c => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        document: c.document,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
    }));
}

export async function createClient(
    input: CreateClientInput
): Promise<{ success: boolean; client?: Client; error?: string }> {
    await requireUser();
    if (!input.name?.trim()) return { success: false, error: 'Nome é obrigatório.' };

    try {
        const client = await prisma.client.create({
            data: {
                name: input.name.trim(),
                email: input.email?.trim() || null,
                phone: input.phone?.trim() || null,
                document: input.document?.trim() || null,
            },
        });
        return {
            success: true,
            client: {
                id: client.id,
                name: client.name,
                email: client.email,
                phone: client.phone,
                document: client.document,
                createdAt: client.createdAt,
                updatedAt: client.updatedAt,
            },
        };
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : '';
        if (msg.includes('Unique constraint') && msg.includes('email')) {
            return { success: false, error: 'E-mail já cadastrado.' };
        }
        console.error('createClient error:', err);
        return { success: false, error: 'Erro ao criar cliente.' };
    }
}

// Admin only — editing client data is sensitive
export async function updateClient(
    id: string,
    input: UpdateClientInput
): Promise<{ success: boolean; error?: string }> {
    await requireAdmin();
    try {
        await prisma.client.update({
            where: { id },
            data: {
                ...(input.name !== undefined && { name: input.name.trim() }),
                ...(input.email !== undefined && { email: input.email.trim() || null }),
                ...(input.phone !== undefined && { phone: input.phone.trim() || null }),
                ...(input.document !== undefined && { document: input.document.trim() || null }),
            },
        });
        return { success: true };
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : '';
        if (msg.includes('Unique constraint') && msg.includes('email')) {
            return { success: false, error: 'E-mail já cadastrado.' };
        }
        console.error('updateClient error:', err);
        return { success: false, error: 'Erro ao atualizar cliente.' };
    }
}

// Admin only — irreversible operation
export async function deleteClient(
    id: string
): Promise<{ success: boolean; error?: string }> {
    await requireAdmin();
    try {
        await prisma.client.delete({ where: { id } });
        return { success: true };
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : '';
        if (msg.includes('Foreign key constraint')) {
            return { success: false, error: 'Cliente possui pedidos e não pode ser excluído.' };
        }
        console.error('deleteClient error:', err);
        return { success: false, error: 'Erro ao excluir cliente.' };
    }
}
