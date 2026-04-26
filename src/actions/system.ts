'use server';

import prisma from '@/lib/db';
import { SystemSettings } from '@/types';
import { requireAdmin, requireUser } from '@/lib/auth/session';

// Get Settings (singleton-like behavior: get first or create default)
export const getSystemSettings = async (): Promise<SystemSettings> => {
    await requireUser();
    try {
        const settings = await prisma.systemSettings.findFirst();

        if (!settings) {
            // Create default if not exists
            const newSettings = await prisma.systemSettings.create({
                data: {
                    companyName: "Minha Gráfica",
                    companyAddress: "Endereço da Empresa",
                    companyCnpj: "",
                    companyEmail: "",
                    companyPhone: ""
                }
            });
            return newSettings;
        }

        return settings;
    } catch (error) {
        console.error("Error fetching system settings:", error);
        return {
            id: 'error',
            companyName: 'Minha Gráfica (Erro)',
            companyCnpj: null,
            companyPhone: null,
            companyEmail: null,
            companyAddress: null,
            priceSettings: null,
            updatedAt: new Date(),
        };
    }
};

// Update Settings
export const updateSystemSettings = async (data: Partial<SystemSettings>): Promise<{ success: boolean; error?: string }> => {
    await requireAdmin();
    try {
        const current = await prisma.systemSettings.findFirst();

        if (current) {
            await prisma.systemSettings.update({
                where: { id: current.id },
                data: {
                    companyName: data.companyName,
                    companyCnpj: data.companyCnpj,
                    companyPhone: data.companyPhone,
                    companyEmail: data.companyEmail,
                    companyAddress: data.companyAddress
                }
            });
        } else {
            // Should not happen if get was called, but safety create
            await prisma.systemSettings.create({
                data: {
                    companyName: data.companyName || "Minha Gráfica",
                    companyCnpj: data.companyCnpj,
                    companyPhone: data.companyPhone,
                    companyEmail: data.companyEmail,
                    companyAddress: data.companyAddress
                }
            });
        }

        return { success: true };
    } catch (error) {
        console.error("Error updating system settings:", error);
        return { success: false, error: "Erro ao salvar configurações." };
    }
};
