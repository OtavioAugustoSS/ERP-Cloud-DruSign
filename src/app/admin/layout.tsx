'use client';

import AdminSidebar from '@/components/admin/AdminSidebar';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import GlobalLoader from '@/components/ui/GlobalLoader';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/');
        }
    }, [user, isLoading, router]);

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center bg-background-dark text-white"><GlobalLoader /></div>;
    }

    if (!user) return null;

    return (
        <div className="flex h-screen overflow-hidden bg-background-dark text-white font-display antialiased selection:bg-primary selection:text-white">
            <AdminSidebar />
            <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-background-dark pb-16 lg:pb-0">
                {children}
            </main>
        </div>
    );
}
