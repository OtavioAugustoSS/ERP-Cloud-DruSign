'use client';

import { Printer } from 'lucide-react';
import { getSystemSettings } from '@/actions/system';
import type { Order } from '@/types';

interface PrintOrderButtonProps {
    order: Order;
}

export default function PrintOrderButton({ order }: PrintOrderButtonProps) {
    async function handlePrint() {
        const settings = await getSystemSettings();
        const printWindow = window.open('', '_blank');
        if (!printWindow) return alert('Habilite popups para imprimir.');

        const itemsHtml = (order.items || []).map(item => `
            <tr style="border-bottom:1px solid #ddd;">
                <td style="padding:8px;">${item.productName ?? '-'} ${item.finishing ? `(${item.finishing})` : ''}</td>
                <td style="padding:8px;text-align:center;">${(item.width ?? 0) > 0 ? `${item.width}x${item.height}` : '-'}</td>
                <td style="padding:8px;text-align:center;">${item.quantity}</td>
                <td style="padding:8px;text-align:center;">${item.observations || '-'}</td>
            </tr>
        `).join('');

        const html = `
            <html><head>
            <title>OS #${order.id.slice(0, 8)}</title>
            <style>
                body{font-family:monospace,sans-serif;font-size:12px;max-width:800px;margin:0 auto;padding:20px;}
                .header{display:flex;justify-content:space-between;margin-bottom:20px;border-bottom:2px solid #000;padding-bottom:10px;}
                .company-info h1{margin:0;font-size:18px;}
                .os-info{text-align:right;}
                .os-title{font-size:24px;font-weight:bold;}
                .section-title{font-weight:bold;background:#eee;padding:5px;margin-top:15px;border:1px solid #000;}
                .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:5px;}
                table{width:100%;border-collapse:collapse;margin-top:10px;font-size:11px;}
                th{border:1px solid #000;padding:5px;background:#eee;}
                td{border:1px solid #ccc;padding:5px;}
                .signatures{display:flex;justify-content:space-between;margin-top:50px;}
                .sign-box{border-top:1px solid #000;width:40%;text-align:center;padding-top:5px;}
                @media print{body{-webkit-print-color-adjust:exact;}}
            </style>
            </head><body>
            <div class="header">
                <div class="company-info">
                    <h1>${settings.companyName}</h1>
                    <div>${settings.companyAddress || ''}</div>
                    <div>CNPJ: ${settings.companyCnpj || ''}</div>
                    <div>Contato: ${settings.companyPhone || ''} | ${settings.companyEmail || ''}</div>
                </div>
                <div class="os-info">
                    <div class="os-title">OS #${order.id.slice(0, 8)}</div>
                    <div>Data: ${new Date(order.createdAt).toLocaleDateString('pt-BR')}</div>
                    <div>Entrega: <strong>${order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('pt-BR') : 'A Combinar'}</strong></div>
                </div>
            </div>
            <div class="section-title">DADOS DO CLIENTE</div>
            <div class="info-grid">
                <div><strong>Cliente:</strong> ${order.clientName}</div>
                <div><strong>Documento:</strong> ${order.clientDocument || '-'}</div>
                <div><strong>Telefone:</strong> ${order.clientPhone || '-'}</div>
                <div><strong>Pagamento:</strong> ${order.paymentTerms || 'À vista'}</div>
            </div>
            <div class="section-title">ITENS DO PEDIDO</div>
            <table>
                <thead><tr>
                    <th>Produto / Acabamento</th>
                    <th style="width:80px;">Medidas (cm)</th>
                    <th style="width:50px;">Qtd</th>
                    <th>Observações Técnicas</th>
                </tr></thead>
                <tbody>${itemsHtml}</tbody>
            </table>
            ${order.notes ? `
                <div class="section-title">OBSERVAÇÕES GERAIS</div>
                <div style="border:1px solid #ccc;padding:10px;min-height:40px;">${order.notes}</div>
            ` : ''}
            <div class="signatures">
                <div class="sign-box">Assinatura do Cliente</div>
                <div class="sign-box">${settings.companyName}</div>
            </div>
            <script>window.print();</script>
            </body></html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
    }

    return (
        <button
            onClick={handlePrint}
            className="flex items-center gap-2 h-9 px-4 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg border border-zinc-700 transition-colors"
        >
            <Printer size={15} />
            Imprimir OS
        </button>
    );
}
