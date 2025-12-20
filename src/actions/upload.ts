'use server'

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function uploadFiles(formData: FormData): Promise<{ success: boolean; filePaths?: string[]; error?: string }> {
    try {
        const files = formData.getAll('files') as File[];

        if (!files || files.length === 0) {
            return { success: true, filePaths: [] };
        }

        const uploadDir = join(process.cwd(), 'public', 'uploads');

        // Ensure directory exists
        await mkdir(uploadDir, { recursive: true });

        const savedPaths: string[] = [];

        for (const file of files) {
            const buffer = Buffer.from(await file.arrayBuffer());
            // Sanitize filename to prevent issues (basic)
            const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const uniqueName = `${Date.now()}-${safeName}`;
            const filePath = join(uploadDir, uniqueName);

            await writeFile(filePath, buffer);
            savedPaths.push(`/uploads/${uniqueName}`);
        }

        return { success: true, filePaths: savedPaths };

    } catch (error) {
        console.error("Upload error:", error);
        return { success: false, error: "Falha no upload de arquivos" };
    }
}
