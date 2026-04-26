'use client';

import { Printer } from 'lucide-react';
import { getSystemSettings } from '@/actions/system';
import type { Order } from '@/types';

interface PrintOrderButtonProps {
    order: Order;
}

function fmtBRL(val: number): string {
    return val.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function osNumber(id: string): string {
    const digits = id.replace(/-/g, '').replace(/[a-f]/gi, '');
    return digits.slice(0, 6).padStart(6, '0');
}

export default function PrintOrderButton({ order }: PrintOrderButtonProps) {
    async function handlePrint() {
        const settings = await getSystemSettings();
        const printWindow = window.open('', '_blank');
        if (!printWindow) return alert('Habilite popups para imprimir.');

        const now = new Date(order.createdAt);
        const hour = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const date = now.toLocaleDateString('pt-BR');
        const osNum = osNumber(order.id);

        const subtotal = (order.items || []).reduce((s, i) => s + i.totalPrice, 0);
        const serviceValue = order.serviceValue ?? 0;
        const shipping = order.shippingCost ?? 0;
        const discount = order.discount ?? 0;
        const total = Math.max(0, subtotal + serviceValue + shipping - discount);

        const itemsHtml = (order.items || []).map(item => {
            const qty = String(item.quantity).padStart(2, '0');
            const dims = (item.width ?? 0) > 0 ? ` ${item.width} x ${item.height} cm` : '';
            const details = [item.customDetails, item.finishing]
                .filter(Boolean).join(' | ');
            const detailStr = details ? ` — ${details}` : '';
            const unitStr = fmtBRL(item.unitPrice);
            const totalStr = fmtBRL(item.totalPrice);
            const cdPart = item.quantity > 1 ? ` cd ${totalStr}` : '';
            return `<div class="item-line">. ${qty} ${item.productName ?? item.material ?? '—'}${detailStr}${dims}  ${unitStr}${cdPart}</div>`;
        }).join('');

        const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<title>OS Nº ${osNum}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 11px;
    max-width: 820px;
    margin: 0 auto;
    padding: 14px 22px;
    color: #000;
    background: #fff;
  }

  /* ── Header ── */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 8px;
    border-bottom: 2px solid #000;
    gap: 16px;
  }
  .company-name {
    font-size: 20px;
    font-weight: bold;
    letter-spacing: 1px;
    text-transform: uppercase;
  }
  .company-detail { font-size: 10px; line-height: 1.6; margin-top: 2px; }
  .header-right { text-align: right; font-size: 10px; line-height: 1.8; }
  .header-phone { font-size: 13px; font-weight: bold; }

  /* ── OS Title bar ── */
  .os-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: 2px solid #000;
    margin: 7px 0;
    padding: 5px 12px;
  }
  .os-title { font-size: 15px; font-weight: bold; letter-spacing: 0.5px; }
  .os-dt { font-size: 11px; }

  /* ── Client section ── */
  .client-box {
    border: 1px solid #888;
    padding: 6px 12px;
    line-height: 1.85;
    margin-bottom: 8px;
  }

  /* ── Items ── */
  .items-label {
    font-weight: bold;
    margin: 6px 0 3px;
    text-decoration: underline;
  }
  .items-body {
    min-height: 110px;
    padding-bottom: 6px;
    border-bottom: 1px solid #aaa;
    margin-bottom: 6px;
  }
  .item-line { line-height: 1.75; font-size: 11px; }
  .notes-box { font-size: 10px; margin-top: 6px; font-style: italic; }

  /* ── Guarantee ── */
  .guarantee {
    text-align: center;
    font-size: 10px;
    font-style: italic;
    border-top: 1px dashed #888;
    border-bottom: 1px dashed #888;
    padding: 3px 0;
    margin-bottom: 6px;
  }

  /* ── Footer ── */
  .footer {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border: 1px solid #888;
    padding: 8px 12px;
    gap: 20px;
  }
  .footer-left { flex: 1; line-height: 2; font-size: 11px; }
  .footer-right { width: 260px; flex-shrink: 0; }
  .fin-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #ddd;
    padding: 2px 0;
    line-height: 1.7;
  }
  .fin-row:last-child { border-bottom: none; border-top: 2px solid #000; margin-top: 2px; font-weight: bold; }
  .fin-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.3px; }
  .fin-currency { font-size: 10px; margin: 0 4px; }
  .fin-value { font-family: 'Courier New', monospace; font-size: 11px; min-width: 60px; text-align: right; }

  /* ── Bottom bar ── */
  .bottom-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 8px;
    border-top: 1px solid #000;
    padding-top: 5px;
    font-size: 9px;
  }
  .visto { font-size: 10px; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    @page { margin: 10mm 15mm; }
  }
</style>
</head>
<body>

<!-- ── HEADER ── -->
<div class="header">
  <div>
    <div class="company-name">${settings.companyName || 'DruSign'}</div>
    <div class="company-detail">
      ${settings.companyAddress ? `${settings.companyAddress}<br>` : ''}
      ${settings.companyEmail ? `${settings.companyEmail}` : ''}
      ${settings.companyPhone && settings.companyEmail ? ' &nbsp;|&nbsp; ' : ''}
      ${settings.companyPhone ? `${settings.companyPhone}` : ''}
    </div>
  </div>
  <div class="header-right">
    <div class="header-phone">${settings.companyPhone || ''}</div>
    ${settings.companyCnpj ? `<div>CNPJ ${settings.companyCnpj}</div>` : ''}
  </div>
</div>

<!-- ── OS TITLE BAR ── -->
<div class="os-bar">
  <div class="os-title">ORDEM DE SERVIÇO Nº ${osNum}</div>
  <div class="os-dt">Hora: ${hour} &nbsp;&nbsp; Data: ${date}</div>
</div>

<!-- ── CLIENT ── -->
<div class="client-box">
  <div>
    Cliente .: <strong>${order.clientName}</strong>
    ${order.clientPhone ? `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Contato .: ${order.clientPhone}` : ''}
  </div>
  ${order.clientStreet ? `
  <div>
    Endereço: ${order.clientStreet}${order.clientNumber ? ` ${order.clientNumber}` : ''}
    ${order.clientNeighborhood ? `&nbsp;&nbsp;&nbsp;&nbsp;Bairro: ${order.clientNeighborhood}` : ''}
  </div>` : ''}
  <div>
    CPF/CNPJ: ${order.clientDocument || '—'}
    &nbsp;&nbsp; IE: ${order.clientIe || '—'}
    &nbsp;&nbsp; Cidade: ${order.clientCity || '—'}
    &nbsp;&nbsp; UF: ${order.clientState || '—'}
    &nbsp;&nbsp; CEP: ${order.clientZip || '—'}
  </div>
</div>

<!-- ── ITEMS ── -->
<div class="items-label">Dados da Ordem de Serviço</div>
<div class="items-body">
  ${itemsHtml || '<div class="item-line">.</div>'}
  ${order.notes ? `<div class="notes-box">Obs.: ${order.notes}</div>` : ''}
</div>

<div class="guarantee">Sempre guarde esse comprovante como sua garantia de entrega!</div>

<!-- ── FOOTER ── -->
<div class="footer">
  <div class="footer-left">
    <div>Responsável: ${settings.companyName || ''}</div>
    <div>Situação Atual: ${order.deliveryMethod || '—'}</div>
    <div>Data Aprovação: ${order.approvalDate ? new Date(order.approvalDate).toLocaleDateString('pt-BR') : '__/__/____'} &nbsp;&nbsp; Data Entrega: ${order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('pt-BR') : '__/__/____'}</div>
    <div>Condições de Pagamento: ${order.paymentTerms || ''}</div>
  </div>
  <div class="footer-right">
    <div class="fin-row">
      <span class="fin-label">Valor Produtos</span>
      <span class="fin-currency">R$</span>
      <span class="fin-value">${fmtBRL(subtotal)}</span>
    </div>
    <div class="fin-row">
      <span class="fin-label">Valor Serviços</span>
      <span class="fin-currency">R$</span>
      <span class="fin-value">${serviceValue > 0 ? fmtBRL(serviceValue) : ''}</span>
    </div>
    <div class="fin-row">
      <span class="fin-label">Deslocamento</span>
      <span class="fin-currency">R$</span>
      <span class="fin-value">${shipping > 0 ? fmtBRL(shipping) : ''}</span>
    </div>
    <div class="fin-row">
      <span class="fin-label">Desconto</span>
      <span class="fin-currency">R$</span>
      <span class="fin-value">${discount > 0 ? fmtBRL(discount) : ''}</span>
    </div>
    <div class="fin-row">
      <span class="fin-label">Valor Total</span>
      <span class="fin-currency">R$</span>
      <span class="fin-value">${fmtBRL(total)}</span>
    </div>
  </div>
</div>

<!-- ── BOTTOM BAR ── -->
<div class="bottom-bar">
  <span>Impressão em 1 via — 1a VIA (X) — *** Obrigado pela Preferência ***</span>
  <span class="visto">Visto ____________________</span>
</div>

<script>window.print();</script>
</body>
</html>`;

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
