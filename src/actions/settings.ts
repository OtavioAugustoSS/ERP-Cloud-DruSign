'use server';

import prisma from '@/lib/db';
import { requireUser } from '@/lib/auth/session';

export async function getMaterialSettings() {
    await requireUser();
    try {
        const settings = await prisma.systemSettings.findFirst();

        if (settings?.priceSettings) {
            try {
                return JSON.parse(settings.priceSettings);
            } catch (e) {
                console.error("Failed to parse priceSettings JSON", e);
            }
        }

        // Default Fallback (if DB is empty)
        return {
            'Adesivo': { 'Brilhoso': 65, 'Fosco': 70, 'Transparente': 75, 'Jateado': 90, 'Perfurado': 95 },
            'Lona': { '440g Promocional': 80, 'Brilho Front': 90, 'Fosca': 95, 'Backlight': 120 },
            'Placa Rígida': { 'PS 1mm': 150, 'PS 2mm': 180, 'ACM 3mm': 250, 'Acrílico 2mm': 350, 'PVC Expandido': 190 },
            'Tecido': { 'Oxford': 55, 'Microfibra': 60, 'Canvas': 150 },
            'Papel': { 'Sulfite 90g': 15, 'Couché 150g': 25, 'Fotográfico': 80 }
        };

    } catch (error) {
        console.error("Error getting material settings:", error);
        return {};
    }
}
