import AdminSidebar from '@/components/admin/AdminSidebar';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen overflow-hidden bg-background-dark text-white font-display antialiased selection:bg-primary selection:text-white">
            <AdminSidebar />
            <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-background-dark">
                {children}
            </main>
        </div>
    );
}
