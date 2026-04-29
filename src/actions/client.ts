'use server'

import prisma from '@/lib/db';
import { requireUser, requireAdmin } from '@/lib/auth/session';
import { audit } from '@/lib/auth/audit';
import type { Client, CreateClientInput, UpdateClientInput } from '@/types';

// Tipo interno que inclui campos novos + _count (Prisma ainda não os tipou — remover após prisma generate)
type RawClient = {
    id: string; name: string; email: string | null; phone: string | null;
    document: string | null; createdAt: Date; updatedAt: Date;
    ie?: string | null; zip?: string | null; street?: string | null;
    number?: string | null; neighborhood?: string | null;
    city?: string | null; state?: string | null; notes?: string | null;
    _count?: { order?: number; orders?: number };
};

function toClient(c: RawClient): Client {
    return {
        id:           c.id,
        name:         c.name,
        email:        c.email,
        phone:        c.phone,
        document:     c.document,
        ie:           c.ie ?? null,
        zip:          c.zip ?? null,
        street:       c.street ?? null,
        number:       c.number ?? null,
        neighborhood: c.neighborhood ?? null,
        city:         c.city ?? null,
        state:        c.state ?? null,
        notes:        c.notes ?? null,
        orderCount:   c._count?.order ?? c._count?.orders ?? 0,
        createdAt:    c.createdAt,
        updatedAt:    c.updatedAt,
    };
}

const db = prisma;

export async function getClients(): Promise<Client[]> {
    await requireUser();
    const rows: RawClient[] = await db.client.findMany({
        orderBy: { name: 'asc' },
        include: { _count: { select: { order: true } } },
    });
    return rows.map(toClient);
}

export async function createClient(
    input: CreateClientInput
): Promise<{ success: boolean; client?: Client; error?: string }> {
    await requireUser();
    if (!input.name?.trim()) return { success: false, error: 'Nome é obrigatório.' };
    try {
        const row: RawClient = await db.client.create({
            data: {
                id:           crypto.randomUUID(),
                name:         input.name.trim(),
                email:        input.email?.trim()        || null,
                phone:        input.phone?.trim()        || null,
                document:     input.document?.trim()     || null,
                ie:           input.ie?.trim()           || null,
                zip:          input.zip?.trim()          || null,
                street:       input.street?.trim()       || null,
                number:       input.number?.trim()       || null,
                neighborhood: input.neighborhood?.trim() || null,
                city:         input.city?.trim()         || null,
                state:        input.state?.trim()        || null,
                notes:        input.notes?.trim()        || null,
                updatedAt:    new Date(),
            },
        });
        await audit({ action: 'CLIENT_CREATED', targetId: row.id, details: { name: row.name } });
        return { success: true, client: toClient(row) };
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : '';
        if (msg.includes('Unique constraint') && msg.includes('email'))
            return { success: false, error: 'E-mail já cadastrado.' };
        console.error('createClient error:', err);
        return { success: false, error: 'Erro ao criar cliente.' };
    }
}

export async function updateClient(
    id: string,
    input: UpdateClientInput
): Promise<{ success: boolean; error?: string }> {
    await requireAdmin();
    try {
        await db.client.update({
            where: { id },
            data: {
                ...(input.name         !== undefined && { name:         input.name.trim()             }),
                ...(input.email        !== undefined && { email:        input.email.trim()        || null }),
                ...(input.phone        !== undefined && { phone:        input.phone.trim()        || null }),
                ...(input.document     !== undefined && { document:     input.document.trim()     || null }),
                ...(input.ie           !== undefined && { ie:           input.ie.trim()           || null }),
                ...(input.zip          !== undefined && { zip:          input.zip.trim()          || null }),
                ...(input.street       !== undefined && { street:       input.street.trim()       || null }),
                ...(input.number       !== undefined && { number:       input.number.trim()       || null }),
                ...(input.neighborhood !== undefined && { neighborhood: input.neighborhood.trim() || null }),
                ...(input.city         !== undefined && { city:         input.city.trim()         || null }),
                ...(input.state        !== undefined && { state:        input.state.trim()        || null }),
                ...(input.notes        !== undefined && { notes:        input.notes.trim()        || null }),
                updatedAt: new Date(),
            },
        });
        await audit({
            action: 'CLIENT_UPDATED',
            targetId: id,
            details: { fields: Object.keys(input) },
        });
        return { success: true };
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : '';
        if (msg.includes('Unique constraint') && msg.includes('email'))
            return { success: false, error: 'E-mail já cadastrado.' };
        console.error('updateClient error:', err);
        return { success: false, error: 'Erro ao atualizar cliente.' };
    }
}

export async function deleteClient(
    id: string
): Promise<{ success: boolean; error?: string }> {
    await requireAdmin();
    try {
        await prisma.client.delete({ where: { id } });
        await audit({ action: 'CLIENT_DELETED', targetId: id });
        return { success: true };
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : '';
        if (msg.includes('Foreign key constraint'))
            return { success: false, error: 'Cliente possui pedidos e não pode ser excluído.' };
        console.error('deleteClient error:', err);
        return { success: false, error: 'Erro ao excluir cliente.' };
    }
}
