'use server'

import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';

export interface Notification {
    id: string;
    recipientRole: string;
    message: string;
    read: boolean;
    orderId?: string | null;
    createdAt: Date;
}

export const createNotification = async (recipientRole: 'admin' | 'employee', message: string, orderId?: string) => {
    try {
        await prisma.notification.create({
            data: {
                recipientRole,
                message,
                orderId
            }
        });
        revalidatePath('/admin'); // Revalidate all admin pages
    } catch (error) {
        console.error("Error creating notification:", error);
    }
};

export const getNotifications = async (role: 'admin' | 'employee'): Promise<Notification[]> => {
    try {
        return await prisma.notification.findMany({
            where: {
                recipientRole: role
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 20 // Limit to last 20 notifications
        });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return [];
    }
};

export const markNotificationAsRead = async (id: string) => {
    try {
        await prisma.notification.update({
            where: { id },
            data: { read: true }
        });
        revalidatePath('/admin');
    } catch (error) {
        console.error("Error marking notification as read:", error);
    }
};

export const getUnreadCount = async (role: 'admin' | 'employee'): Promise<number> => {
    try {
        return await prisma.notification.count({
            where: {
                recipientRole: role,
                read: false
            }
        });
    } catch (error) {
        return 0;
    }
};
