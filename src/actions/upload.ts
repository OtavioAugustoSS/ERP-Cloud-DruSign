'use server'

import { writeFile, mkdir } from 'fs/promises';
import { join, extname } from 'path';
import { requireUser } from '@/lib/auth/session';
import { audit } from '@/lib/auth/audit';

// Whitelist MIME → extensões aceitas. Defesa em profundidade:
// validamos tanto o tipo declarado pelo browser quanto a extensão do arquivo.
const ALLOWED: Record<string, string[]> = {
    'image/jpeg':       ['.jpg', '.jpeg'],
    'image/jpg':        ['.jpg', '.jpeg'],
    'image/png':        ['.png'],
    'image/webp':       ['.webp'],
    'image/gif':        ['.gif'],
    'application/pdf':  ['.pdf'],
};

// Limites configuráveis por env (com defaults seguros)
const MAX_FILE_SIZE_MB = Number(process.env.UPLOAD_MAX_FILE_MB) || 10;
const MAX_FILES_PER_UPLOAD = Number(process.env.UPLOAD_MAX_FILES) || 20;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

export async function uploadFiles(formData: FormData): Promise<{ success: boolean; filePaths?: string[]; error?: string }> {
    await requireUser();
    try {
        const files = formData.getAll('files') as File[];

        if (!files || files.length === 0) {
            return { success: true, filePaths: [] };
        }

        if (files.length > MAX_FILES_PER_UPLOAD) {
            return { success: false, error: `Limite de ${MAX_FILES_PER_UPLOAD} arquivos por envio.` };
        }

        // Valida TODOS antes de escrever qualquer um (atomicidade prática)
        for (const file of files) {
            if (!(file instanceof File) || !file.name) {
                return { success: false, error: 'Arquivo inválido recebido.' };
            }
            const allowedExts = ALLOWED[file.type];
            if (!allowedExts) {
                return { success: false, error: `Tipo de arquivo não permitido: "${file.name}". Use JPG, PNG, WEBP, GIF ou PDF.` };
            }
            const ext = extname(file.name).toLowerCase();
            if (!allowedExts.includes(ext)) {
                return { success: false, error: `Extensão "${ext}" não bate com o tipo do arquivo "${file.name}".` };
            }
            if (file.size === 0) {
                return { success: false, error: `Arquivo vazio: "${file.name}".` };
            }
            if (file.size > MAX_FILE_SIZE) {
                return { success: false, error: `Arquivo muito grande: "${file.name}". Tamanho máximo: ${MAX_FILE_SIZE_MB} MB.` };
            }
        }

        const uploadDir = join(process.cwd(), 'public', 'uploads');
        await mkdir(uploadDir, { recursive: true });

        const savedPaths: string[] = [];

        for (const file of files) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const ext = extname(file.name).toLowerCase();
            // Nome seguro: remove tudo que não é [a-zA-Z0-9.-_], trava traversal
            const baseName = file.name
                .replace(ext, '')
                .replace(/[^a-zA-Z0-9_-]/g, '_')
                .replace(/_{2,}/g, '_')
                .slice(0, 60) || 'file';
            const uniqueName = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${baseName}${ext}`;
            await writeFile(join(uploadDir, uniqueName), buffer);
            savedPaths.push(`/uploads/${uniqueName}`);
        }

        await audit({
            action: 'ORDER_UPDATED',
            details: { kind: 'upload', files: savedPaths.length, totalBytes: files.reduce((s, f) => s + f.size, 0) },
        });

        return { success: true, filePaths: savedPaths };

    } catch (error) {
        console.error('Upload error:', error);
        return { success: false, error: 'Falha no upload de arquivos.' };
    }
}
