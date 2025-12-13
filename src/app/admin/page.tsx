import Link from 'next/link';

export default function AdminDashboardPage() {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <h1 className="text-2xl font-bold text-white">Bem-vindo ao Painel Administrativo</h1>
            <p className="text-text-secondary">Selecione uma opção no menu lateral para começar.</p>
            <Link href="/admin/orders/12345" className="text-primary hover:underline">
                Ver Exemplo de Pedido
            </Link>
        </div>
    );
}
