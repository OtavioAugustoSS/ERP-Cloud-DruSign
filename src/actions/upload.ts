'use server'

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { requireUser } from '@/lib/auth/session';

const ALLOWED_TYPES = new Set([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function uploadFiles(formData: FormData): Promise<{ success: boolean; filePaths?: string[]; error?: string }> {
    await requireUser();
    try {
        const files = formData.getAll('files') as File[];

        if (!files || files.length === 0) {
            return { success: true, filePaths: [] };
        }

        // Validate all files before writing any
        for (const file of files) {
            if (!ALLOWED_TYPES.has(file.type)) {
                return { success: false, error: `Tipo de arquivo não permitido: "${file.name}". Use JPG, PNG, WEBP, GIF ou PDF.` };
            }
            if (file.size > MAX_FILE_SIZE) {
                return { success: false, error: `Arquivo muito grande: "${file.name}". Tamanho máximo: 10 MB.` };
            }
        }

        const uploadDir = join(process.cwd(), 'public', 'uploads');
        await mkdir(uploadDir, { recursive: true });

        const savedPaths: string[] = [];

        for (const file of files) {
            const buffer = Buffer.from(await file.arrayBuffer());
            // Keep only alphanumeric, dots, dashes — strip path separators
            const safeName = file.name.replace(/[^a-zA-Z0-9.\-]/g, '_').replace(/\.{2,}/g, '_');
            const uniqueName = `${Date.now()}-${safeName}`;
            await writeFile(join(uploadDir, uniqueName), buffer);
            savedPaths.push(`/uploads/${uniqueName}`);
        }

        return { success: true, filePaths: savedPaths };

    } catch (error) {
        console.error('Upload error:', error);
        return { success: false, error: 'Falha no upload de arquivos.' };
    }
}
