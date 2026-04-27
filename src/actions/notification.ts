'use server'

import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth/session';

export interface Notification {
    id: string;
    recipientRole: string;
    message: string;
    read: boolean;
    orderId?: string | null;
    createdAt: Date;
}

const NOTIFICATION_RETENTION_DAYS = 30;

async function pruneOldNotifications() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - NOTIFICATION_RETENTION_DAYS);
    await prisma.notification.deleteMany({ where: { createdAt: { lt: cutoff } } });
}

export const createNotification = async (recipientRole: 'admin' | 'employee', message: string, orderId?: string) => {
    await requireUser();
    try {
        await prisma.notification.create({ data: { recipientRole, message, orderId } });
        // Clean up old notifications on each new one (lightweight housekeeping)
        await pruneOldNotifications();
        revalidatePath('/admin');
    } catch (error) {
        console.error('Error creating notification:', error);
    }
};

export const getNotifications = async (role: 'admin' | 'employee'): Promise<Notification[]> => {
    await requireUser();
    try {
        return await prisma.notification.findMany({
            where: { recipientRole: role },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }
};

export const markNotificationAsRead = async (id: string) => {
    await requireUser();
    try {
        await prisma.notification.update({ where: { id }, data: { read: true } });
        revalidatePath('/admin');
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
};

export const markAllNotificationsAsRead = async (role: 'admin' | 'employee') => {
    await requireUser();
    try {
        await prisma.notification.updateMany({
            where: { recipientRole: role, read: false },
            data: { read: true },
        });
        revalidatePath('/admin');
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
    }
};

export const getUnreadCount = async (role: 'admin' | 'employee'): Promise<number> => {
    await requireUser();
    try {
        return await prisma.notification.count({
            where: { recipientRole: role, read: false },
        });
    } catch {
        return 0;
    }
};
