'use server';

import prisma from '@/lib/db';
import { SystemSettings } from '@/types';
import { requireAdmin, requireUser } from '@/lib/auth/session';

export const getSystemSettings = async (): Promise<SystemSettings> => {
    await requireUser();
    try {
        // findFirst + graceful fallback avoids race on first create
        let settings = await prisma.systemsettings.findFirst();
        if (!settings) {
            try {
                settings = await prisma.systemsettings.create({
                    data: {
                        companyName: 'Minha Gráfica',
                        companyAddress: '',
                        companyCnpj: '',
                        companyEmail: '',
                        companyPhone: '',
                    },
                });
            } catch {
                // Concurrent request already created it
                settings = await prisma.systemsettings.findFirst();
            }
        }
        if (!settings) throw new Error('Could not load settings');
        return settings;
    } catch (error) {
        console.error('Error fetching system settings:', error);
        return {
            id: 'error',
            companyName: 'Minha Gráfica',
            companyCnpj: null,
            companyPhone: null,
            companyEmail: null,
            companyAddress: null,
            priceSettings: null,
            updatedAt: new Date(),
        };
    }
};

export const updateSystemSettings = async (data: Partial<SystemSettings>): Promise<{ success: boolean; error?: string }> => {
    await requireAdmin();
    try {
        const current = await prisma.systemsettings.findFirst();
        if (current) {
            await prisma.systemsettings.update({
                where: { id: current.id },
                data: {
                    companyName: data.companyName,
                    companyCnpj: data.companyCnpj,
                    companyPhone: data.companyPhone,
                    companyEmail: data.companyEmail,
                    companyAddress: data.companyAddress,
                },
            });
        } else {
            await prisma.systemsettings.create({
                data: {
                    companyName: data.companyName || 'Minha Gráfica',
                    companyCnpj: data.companyCnpj,
                    companyPhone: data.companyPhone,
                    companyEmail: data.companyEmail,
                    companyAddress: data.companyAddress,
                },
            });
        }
        return { success: true };
    } catch (error) {
        console.error('Error updating system settings:', error);
        return { success: false, error: 'Erro ao salvar configurações.' };
    }
};
