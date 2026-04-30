import { notFound } from 'next/navigation';
import { getOrderById } from '@/actions/order';
import { getSession } from '@/lib/auth/session';
import { formatCurrency } from '@/lib/utils/price';
import ProductionPipeline from '@/components/admin/ProductionPipeline';
import OrderDetailActions from '@/components/admin/OrderDetailActions';
import PrintOrderButton from '@/components/admin/PrintOrderButton';
import { ArrowLeft, User, MapPin, FileText, Package, Calendar, Truck, CreditCard } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<string, string> = {
    PENDING:            'Pendente',
    IN_PRODUCTION:      'Em Produção',
    FINISHING:          'Acabamento',
    READY_FOR_SHIPPING: 'Pronto p/ Envio',
    COMPLETED:          'Concluído',
    CANCELLED:          'Cancelado',
};

const STATUS_COLOR: Record<string, string> = {
    PENDING:            'bg-yellow-500/10 text-yellow-400 border-yellow-500/25',
    IN_PRODUCTION:      'bg-blue-500/10 text-blue-400 border-blue-500/25',
    FINISHING:          'bg-purple-500/10 text-purple-400 border-purple-500/25',
    READY_FOR_SHIPPING: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25',
    COMPLETED:          'bg-green-500/10 text-green-400 border-green-500/25',
    CANCELLED:          'bg-red-500/10 text-red-400 border-red-500/25',
};

const STATUS_GLOW: Record<string, string> = {
    PENDING:            'shadow-yellow-500/10',
    IN_PRODUCTION:      'shadow-blue-500/10',
    FINISHING:          'shadow-purple-500/10',
    READY_FOR_SHIPPING: 'shadow-cyan-500/10',
    COMPLETED:          'shadow-green-500/15',
    CANCELLED:          'shadow-red-500/10',
};

export default async function OrderDetailPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ from?: string }>;
}) {
    const [{ id }, { from }] = await Promise.all([params, searchParams]);
    const [order, session] = await Promise.all([getOrderById(id), getSession()]);

    if (!order) notFound();

    const isAdmin = session?.role === 'admin';
    const isTerminal = order.status === 'COMPLETED' || order.status === 'CANCELLED';

    const subtotal      = order.items.reduce((acc, i) => acc + i.totalPrice, 0);
    const shipping      = order.shippingCost  ?? 0;
    const discount      = order.discount      ?? 0;
    const serviceValue  = order.serviceValue  ?? 0;

    const backHref  = from === 'history' ? '/admin/history' : '/admin/orders';
    const backLabel = from === 'history' ? 'Histórico'     : 'Pedidos';

    return (
        <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-4 sm:space-y-5">

                {/* ── Cabeçalho ── */}
                <div className="flex flex-col gap-3 animate-fade-in-up">
                    {/* Linha 1: botão voltar + imprimir */}
                    <div className="flex items-center justify-between">
                        <Link
                            href={backHref}
                            className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-all text-sm font-medium border border-transparent hover:border-white/[0.08]"
                        >
                            <ArrowLeft size={15} />
                            <span className="hidden sm:inline">{backLabel}</span>
                        </Link>
                        <PrintOrderButton order={order} />
                    </div>
                    {/* Linha 2: título + status */}
                    <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight font-mono">
                                OS #{order.id.slice(0, 8).toUpperCase()}
                            </h1>
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${STATUS_COLOR[order.status]}`}>
                                {STATUS_LABEL[order.status]}
                            </span>
                        </div>
                        <p className="text-xs text-zinc-600 mt-0.5">
                            Criado em {new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                </div>

                {/* ── Pipeline ── */}
                {!isTerminal && (
                    <div className={`bg-zinc-900/50 border border-zinc-800/80 rounded-2xl shadow-lg ${STATUS_GLOW[order.status]} animate-fade-in-up animate-delay-50`}>
                        <ProductionPipeline currentStatus={order.status} />
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                    {/* ── Coluna Esquerda ── */}
                    <div className="lg:col-span-2 space-y-4">

                        {/* Itens */}
                        <section className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl overflow-hidden animate-fade-in-up animate-delay-100">
                            <div className="flex items-center gap-2.5 px-4 sm:px-5 py-3.5 border-b border-zinc-800/80">
                                <Package size={14} className="text-zinc-500" />
                                <h2 className="text-sm font-semibold text-zinc-300">Itens do Pedido</h2>
                                <span className="ml-auto text-[11px] text-zinc-600 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.06]">
                                    {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
                                </span>
                            </div>

                            {/* Mobile: cards por item */}
                            <div className="sm:hidden divide-y divide-zinc-800/40">
                                {order.items.map(item => (
                                    <div key={item.id} className="px-4 py-3.5 space-y-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="font-semibold text-white text-sm leading-tight">{item.productName ?? item.material ?? '—'}</p>
                                            <span className="shrink-0 font-mono text-sm text-green-400 font-semibold">{formatCurrency(item.totalPrice)}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                                            <span>Qtd: <span className="text-white font-bold">{item.quantity}</span></span>
                                            <span>Unit: <span className="font-mono text-zinc-400">{formatCurrency(item.unitPrice)}</span></span>
                                            {(item.width ?? 0) > 0 && (
                                                <span className="font-mono text-zinc-400 bg-white/[0.04] px-1.5 py-0.5 rounded">{item.width}×{item.height} cm</span>
                                            )}
                                        </div>
                                        {(item.serviceType || item.finishing || item.customDetails || item.observations) && (
                                            <div className="text-xs text-zinc-600 space-y-0.5">
                                                {item.serviceType  && <p>Tipo: {item.serviceType}</p>}
                                                {item.finishing    && <p>Acabamento: {item.finishing}</p>}
                                                {item.customDetails && <p>{item.customDetails}</p>}
                                                {item.observations && <p className="italic">{item.observations}</p>}
                                            </div>
                                        )}
                                        {item.fileUrl && <p className="text-xs text-primary">Arquivo: {item.fileUrl}</p>}
                                    </div>
                                ))}
                            </div>

                            {/* Desktop: tabela */}
                            <div className="hidden sm:block overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-black/20 text-[10px] uppercase text-zinc-600 font-bold tracking-wider">
                                            <th className="px-5 py-2.5 text-left">Produto</th>
                                            <th className="px-4 py-2.5 text-center">Dimensões</th>
                                            <th className="px-4 py-2.5 text-center">Qtd</th>
                                            <th className="px-4 py-2.5 text-right">Unitário</th>
                                            <th className="px-5 py-2.5 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-800/40">
                                        {order.items.map(item => (
                                            <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="px-5 py-3.5">
                                                    <p className="font-semibold text-white text-sm">{item.productName ?? item.material ?? '—'}</p>
                                                    {item.serviceType && <p className="text-xs text-zinc-500 mt-0.5">Tipo: {item.serviceType}</p>}
                                                    {item.finishing   && <p className="text-xs text-zinc-500">Acabamento: {item.finishing}</p>}
                                                    {item.customDetails && <p className="text-xs text-zinc-600 mt-0.5">{item.customDetails}</p>}
                                                    {item.fileUrl && <p className="text-xs text-primary mt-1">Arquivo: {item.fileUrl}</p>}
                                                    {item.observations && <p className="text-xs text-zinc-600 italic mt-0.5">{item.observations}</p>}
                                                </td>
                                                <td className="px-4 py-3.5 text-center">
                                                    {(item.width ?? 0) > 0
                                                        ? <span className="font-mono text-xs text-zinc-400 bg-white/[0.04] px-2 py-0.5 rounded">{item.width}×{item.height} cm</span>
                                                        : <span className="text-zinc-700">—</span>
                                                    }
                                                </td>
                                                <td className="px-4 py-3.5 text-center">
                                                    <span className="text-white font-bold text-sm">{item.quantity}</span>
                                                </td>
                                                <td className="px-4 py-3.5 text-right font-mono text-xs text-zinc-500">
                                                    {formatCurrency(item.unitPrice)}
                                                </td>
                                                <td className="px-5 py-3.5 text-right font-mono text-sm text-green-400 font-semibold">
                                                    {formatCurrency(item.totalPrice)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        {/* Cliente */}
                        <section className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 space-y-4 animate-fade-in-up animate-delay-150">
                            <div className="flex items-center gap-2 pb-3 border-b border-zinc-800/80">
                                <User size={14} className="text-zinc-500" />
                                <h2 className="text-sm font-semibold text-zinc-300">Dados do Cliente</h2>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                                <Field label="Nome"      value={order.clientName} />
                                <Field label="CPF / CNPJ" value={order.clientDocument} />
                                <Field label="Telefone"  value={order.clientPhone} />
                                <Field label="IE"        value={order.clientIe} />
                            </div>
                            {order.clientStreet && (
                                <>
                                    <div className="flex items-center gap-2 pt-1 border-t border-zinc-800/60">
                                        <MapPin size={12} className="text-zinc-600" />
                                        <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">Endereço</span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                                        <Field label="CEP"       value={order.clientZip} />
                                        <Field label="Rua"       value={order.clientStreet} className="sm:col-span-2" />
                                        <Field label="Número"    value={order.clientNumber} />
                                        <Field label="Bairro"    value={order.clientNeighborhood} />
                                        <Field label="Cidade / UF" value={order.clientCity ? `${order.clientCity} / ${order.clientState ?? ''}` : undefined} />
                                    </div>
                                </>
                            )}
                        </section>

                        {/* Observações */}
                        {order.notes && (
                            <section className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5 animate-fade-in-up animate-delay-200">
                                <div className="flex items-center gap-2 mb-3">
                                    <FileText size={14} className="text-zinc-500" />
                                    <h2 className="text-sm font-semibold text-zinc-300">Observações Gerais</h2>
                                </div>
                                <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">{order.notes}</p>
                            </section>
                        )}
                    </div>

                    {/* ── Coluna Direita ── */}
                    <div className="space-y-4">

                        {/* Resumo Financeiro */}
                        <section className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 space-y-3 animate-fade-in-up animate-delay-100">
                            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider pb-3 border-b border-zinc-800/80">
                                Resumo Financeiro
                            </h2>
                            <div className="space-y-2.5">
                                <FinRow label="Subtotal itens" value={formatCurrency(subtotal)} />
                                {serviceValue > 0 && <FinRow label="Mão de obra"     value={formatCurrency(serviceValue)} />}
                                {shipping     > 0 && <FinRow label="Frete / Entrega"  value={formatCurrency(shipping)} />}
                                {discount     > 0 && <FinRow label="Desconto"         value={`−${formatCurrency(discount)}`} valueClass="text-red-400" />}
                            </div>
                            <div className="flex justify-between items-center pt-3 border-t border-zinc-800/80">
                                <span className="text-sm font-bold text-white">Total</span>
                                <span className="text-2xl font-bold text-green-400 font-mono tracking-tight">
                                    {formatCurrency(order.totalPrice)}
                                </span>
                            </div>
                        </section>

                        {/* Logística */}
                        <section className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 space-y-3 animate-fade-in-up animate-delay-150">
                            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider pb-3 border-b border-zinc-800/80">
                                Logística e Prazos
                            </h2>
                            <div className="space-y-3">
                                <LogisticField
                                    icon={<Calendar size={13} className="text-zinc-600" />}
                                    label="Prazo de Entrega"
                                    value={order.deliveryDate
                                        ? new Date(order.deliveryDate).toLocaleDateString('pt-BR')
                                        : undefined}
                                />
                                <LogisticField
                                    icon={<Truck size={13} className="text-zinc-600" />}
                                    label="Forma de Entrega"
                                    value={order.deliveryMethod}
                                />
                                <LogisticField
                                    icon={<CreditCard size={13} className="text-zinc-600" />}
                                    label="Cond. de Pagamento"
                                    value={order.paymentTerms}
                                />
                            </div>
                        </section>

                        {/* Ações */}
                        {!isTerminal && (
                            <div className="animate-fade-in-up animate-delay-200">
                                <OrderDetailActions
                                    orderId={order.id}
                                    currentStatus={order.status}
                                    isAdmin={isAdmin}
                                />
                            </div>
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
            <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-wider mb-1">{label}</p>
            <p className="text-sm text-white">{value || <span className="text-zinc-700">—</span>}</p>
        </div>
    );
}

function FinRow({ label, value, valueClass = 'text-zinc-400' }: { label: string; value: string; valueClass?: string }) {
    return (
        <div className="flex justify-between items-center text-sm">
            <span className="text-zinc-600">{label}</span>
            <span className={`font-mono text-xs ${valueClass}`}>{value}</span>
        </div>
    );
}

function LogisticField({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
    return (
        <div className="flex items-start gap-2.5">
            <div className="mt-0.5 shrink-0">{icon}</div>
            <div>
                <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-wider">{label}</p>
                <p className="text-sm text-white mt-0.5">{value || <span className="text-zinc-700">—</span>}</p>
            </div>
        </div>
    );
}
