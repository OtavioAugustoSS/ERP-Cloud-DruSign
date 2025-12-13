import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen overflow-hidden bg-background-dark text-white font-display antialiased selection:bg-primary selection:text-white">
            <AdminSidebar />
            <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-background-dark">
                <AdminHeader />
                <div className="flex-1 overflow-y-auto p-8 bg-background-dark">
                    {children}
                </div>
            </main>
        </div>
    );
}
