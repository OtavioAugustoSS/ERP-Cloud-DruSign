import { notFound } from 'next/navigation';
import { getOrderById } from '@/actions/order';
import { getSession } from '@/lib/auth/session';
import { formatCurrency } from '@/lib/utils/price';
import ProductionPipeline from '@/components/admin/ProductionPipeline';
import OrderDetailActions from '@/components/admin/OrderDetailActions';
import PrintOrderButton from '@/components/admin/PrintOrderButton';
import { ArrowLeft, User, MapPin, FileText, Package } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<string, string> = {
    PENDING: 'Pendente',
    IN_PRODUCTION: 'Em Produção',
    FINISHING: 'Acabamento',
    READY_FOR_SHIPPING: 'Pronto p/ Envio',
    COMPLETED: 'Concluído',
    CANCELLED: 'Cancelado',
};

const STATUS_COLOR: Record<string, string> = {
    PENDING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    IN_PRODUCTION: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    FINISHING: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    READY_FOR_SHIPPING: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    COMPLETED: 'bg-green-500/10 text-green-400 border-green-500/20',
    CANCELLED: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default async function OrderDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ from?: string }> }) {
    const [{ id }, { from }] = await Promise.all([params, searchParams]);
    const [order, session] = await Promise.all([getOrderById(id), getSession()]);

    if (!order) notFound();

    const isAdmin = session?.role === 'admin';
    const isTerminal = order.status === 'COMPLETED' || order.status === 'CANCELLED';

    const subtotal = order.items.reduce((acc, i) => acc + i.totalPrice, 0);
    const shipping = order.shippingCost ?? 0;
    const discount = order.discount ?? 0;
    const serviceValue = order.serviceValue ?? 0;

    return (
        <div className="h-full overflow-y-auto">
        <div className="p-6 max-w-6xl mx-auto space-y-6">

            {/* Cabeçalho */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link
                        href={from === 'history' ? '/admin/history' : '/admin/orders'}
                        className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors text-sm font-medium"
                    >
                        <ArrowLeft size={16} />
                        {from === 'history' ? 'Histórico' : 'Pedidos'}
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-bold text-white tracking-tight">
                                Pedido #{order.id.slice(0, 8).toUpperCase()}
                            </h1>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${STATUS_COLOR[order.status]}`}>
                                {STATUS_LABEL[order.status]}
                            </span>
                        </div>
                        <p className="text-sm text-zinc-500 mt-0.5">
                            Criado em {new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                </div>
                <PrintOrderButton order={order} />
            </div>

            {/* Pipeline */}
            {!isTerminal && (
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl px-4">
                    <ProductionPipeline currentStatus={order.status} />
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Coluna Esquerda */}
                <div className="lg:col-span-2 space-y-5">

                    {/* Itens */}
                    <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden">
                        <div className="flex items-center gap-2 px-5 py-4 border-b border-zinc-800">
                            <Package size={15} className="text-zinc-400" />
                            <h2 className="text-sm font-semibold text-zinc-300">Itens do Pedido</h2>
                            <span className="ml-auto text-xs text-zinc-600">{order.items.length} {order.items.length === 1 ? 'item' : 'itens'}</span>
                        </div>
                        <table className="w-full text-sm">
                            <thead className="bg-black/20 text-[10px] uppercase text-zinc-500 font-bold tracking-wider">
                                <tr>
                                    <th className="px-5 py-2.5 text-left">Produto</th>
                                    <th className="px-4 py-2.5 text-center">Dimensões</th>
                                    <th className="px-4 py-2.5 text-center">Qtd</th>
                                    <th className="px-4 py-2.5 text-right">Unitário</th>
                                    <th className="px-5 py-2.5 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/50">
                                {order.items.map(item => (
                                    <tr key={item.id} className="hover:bg-zinc-800/20">
                                        <td className="px-5 py-3">
                                            <p className="font-medium text-white">{item.productName ?? item.material ?? '—'}</p>
                                            {item.customDetails && <p className="text-xs text-zinc-400 mt-0.5">{item.customDetails}</p>}
                                            {item.finishing && <p className="text-xs text-zinc-500">Acabamento: {item.finishing}</p>}
                                            {item.fileUrl && <p className="text-xs text-blue-400 mt-0.5">Arquivo: {item.fileUrl}</p>}
                                            {item.observations && <p className="text-xs text-zinc-600 italic mt-0.5">{item.observations}</p>}
                                        </td>
                                        <td className="px-4 py-3 text-center font-mono text-zinc-400 text-xs">
                                            {(item.width ?? 0) > 0 ? `${item.width}×${item.height} cm` : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-center text-white font-semibold">{item.quantity}</td>
                                        <td className="px-4 py-3 text-right font-mono text-zinc-400">{formatCurrency(item.unitPrice)}</td>
                                        <td className="px-5 py-3 text-right font-mono text-green-400 font-semibold">{formatCurrency(item.totalPrice)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>

                    {/* Cliente */}
                    <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 space-y-4">
                        <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
                            <User size={15} className="text-zinc-400" />
                            <h2 className="text-sm font-semibold text-zinc-300">Dados do Cliente</h2>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm">
                            <Field label="Nome" value={order.clientName} />
                            <Field label="CPF / CNPJ" value={order.clientDocument} />
                            <Field label="Telefone" value={order.clientPhone} />
                            <Field label="IE" value={order.clientIe} />
                        </div>
                        {order.clientStreet && (
                            <>
                                <div className="flex items-center gap-2 border-t border-zinc-800 pt-3">
                                    <MapPin size={13} className="text-zinc-500" />
                                    <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Endereço</span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm">
                                    <Field label="CEP" value={order.clientZip} />
                                    <Field label="Rua" value={order.clientStreet} className="sm:col-span-2" />
                                    <Field label="Número" value={order.clientNumber} />
                                    <Field label="Bairro" value={order.clientNeighborhood} />
                                    <Field label="Cidade / UF" value={order.clientCity ? `${order.clientCity} / ${order.clientState ?? ''}` : undefined} />
                                </div>
                            </>
                        )}
                    </section>

                    {/* Observações */}
                    {order.notes && (
                        <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <FileText size={15} className="text-zinc-400" />
                                <h2 className="text-sm font-semibold text-zinc-300">Observações Gerais</h2>
                            </div>
                            <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">{order.notes}</p>
                        </section>
                    )}
                </div>

                {/* Coluna Direita */}
                <div className="space-y-5">

                    {/* Resumo Financeiro */}
                    <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 space-y-3">
                        <h2 className="text-sm font-semibold text-zinc-300 border-b border-zinc-800 pb-3">Resumo Financeiro</h2>
                        <div className="space-y-2 text-sm">
                            <Row label="Subtotal itens" value={formatCurrency(subtotal)} />
                            {serviceValue > 0 && <Row label="Mão de obra" value={formatCurrency(serviceValue)} />}
                            {shipping > 0 && <Row label="Frete / Entrega" value={formatCurrency(shipping)} />}
                            {discount > 0 && <Row label="Desconto" value={`-${formatCurrency(discount)}`} valueClass="text-red-400" />}
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-zinc-800">
                            <span className="text-sm font-bold text-white">Total</span>
                            <span className="text-xl font-bold text-green-400 font-mono">{formatCurrency(order.totalPrice)}</span>
                        </div>
                    </section>

                    {/* Logística */}
                    <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 space-y-3">
                        <h2 className="text-sm font-semibold text-zinc-300 border-b border-zinc-800 pb-3">Logística e Prazos</h2>
                        <div className="space-y-2 text-sm">
                            <Field label="Prazo de Entrega" value={order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('pt-BR') : undefined} />
                            <Field label="Forma de Entrega" value={order.deliveryMethod} />
                            <Field label="Condições de Pagamento" value={order.paymentTerms} />
                        </div>
                    </section>

                    {/* Ações */}
                    {!isTerminal && (
                        <OrderDetailActions
                            orderId={order.id}
                            currentStatus={order.status}
                            isAdmin={isAdmin}
                        />
                    )}
                </div>
            </div>
        </div>
        </div>
    );
}

function Field({ label, value, className = '' }: { label: string; value?: string | null; className?: string }) {
    return (
        <div className={className}>
            <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-wider mb-0.5">{label}</p>
            <p className="text-white">{value || <span className="text-zinc-600">—</span>}</p>
        </div>
    );
}

function Row({ label, value, valueClass = 'text-zinc-300' }: { label: string; value: string; valueClass?: string }) {
    return (
        <div className="flex justify-between">
            <span className="text-zinc-500">{label}</span>
            <span className={`font-mono ${valueClass}`}>{value}</span>
        </div>
    );
}
