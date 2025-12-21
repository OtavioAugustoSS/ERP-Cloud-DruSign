'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Icons } from './Icons';
import { useAuth } from '../../context/AuthContext';
import { getNotifications, markNotificationAsRead, Notification } from '../../actions/notification';

export default function NotificationBell() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = async () => {
        if (!user) return;
        const role = user.role === 'admin' ? 'admin' : 'employee';
        console.log(`[NotificationBell] Fetching for role: ${role}`, user);
        const data = await getNotifications(role);
        console.log(`[NotificationBell] Data received:`, data);
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
    };

    useEffect(() => {
        // Initial fetch
        fetchNotifications();

        // Poll every 10 seconds
        const interval = setInterval(fetchNotifications, 10000);

        // Click outside to close
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            clearInterval(interval);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [user]);

    const handleMarkAsRead = async (id: string) => {
        await markNotificationAsRead(id);
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => {
                    setIsOpen(!isOpen);
                }}
                className="relative p-2 text-text-secondary hover:text-white transition-colors outline-none"
            >
                <Icons.Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background-dark animate-pulse"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-surface-dark border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-4 border-b border-white/5 bg-black/20 flex justify-between items-center">
                        <h4 className="text-white font-bold text-sm">Notificações</h4>
                        <span className="text-xs text-slate-500">{unreadCount} não lidas</span>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 text-sm">
                                Nenhuma notificação.
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {notifications.map(notification => (
                                    <div
                                        key={notification.id}
                                        className={`p-4 hover:bg-white/5 transition-colors cursor-pointer ${!notification.read ? 'bg-white/[0.02]' : ''}`}
                                        onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                                    >
                                        <div className="flex gap-3">
                                            <div className={`mt-1 size-2 rounded-full flex-none ${!notification.read ? 'bg-primary' : 'bg-transparent'}`} />
                                            <div>
                                                <p className={`text-sm mb-1 ${!notification.read ? 'text-white font-medium' : 'text-slate-400'}`}>
                                                    {notification.message}
                                                </p>
                                                <span className="text-xs text-slate-600">
                                                    {new Date(notification.createdAt).toLocaleString('pt-BR', {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        day: '2-digit',
                                                        month: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
