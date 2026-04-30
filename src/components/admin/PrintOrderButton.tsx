'use client';

import { Printer } from 'lucide-react';
import { getSystemSettings } from '@/actions/system';
import type { Order } from '@/types';

interface PrintOrderButtonProps {
    order: Order;
}

function fmtBRL(val: number): string {
    return 'R$ ' + val.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function osNumber(id: string): string {
    const hex = id.replace(/-/g, '');
    const num = parseInt(hex.slice(0, 8), 16) % 1_000_000;
    return String(num).padStart(6, '0');
}

function fmtDate(d: Date | string | null | undefined): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('pt-BR');
}

export default function PrintOrderButton({ order }: PrintOrderButtonProps) {
    async function handlePrint() {
        const settings = await getSystemSettings();
        const printWindow = window.open('', '_blank');
        if (!printWindow) return alert('Habilite popups para imprimir.');

        const createdAt = new Date(order.createdAt);
        const hour = createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const date = createdAt.toLocaleDateString('pt-BR');
        const osNum = osNumber(order.id);

        const subtotal     = (order.items || []).reduce((s, i) => s + i.totalPrice, 0);
        const serviceValue = order.serviceValue ?? 0;
        const shipping     = order.shippingCost ?? 0;
        const discount     = order.discount     ?? 0;
        const total        = Math.max(0, subtotal + serviceValue + shipping - discount);

        const itemsRows = (order.items || []).map((item, idx) => {
            const dims = (item.width ?? 0) > 0
                ? `${item.width} × ${item.height} cm`
                : '—';
            const extras = [item.finishing, item.customDetails, item.observations]
                .filter(v => v && v !== 'Sem acabamento')
                .join(' · ');

            return `
            <tr class="${idx % 2 === 0 ? 'row-even' : 'row-odd'}">
                <td class="col-qty">${item.quantity}</td>
                <td class="col-desc">
                    <strong>${item.productName ?? item.material ?? '—'}</strong>
                    ${extras ? `<br><span class="item-extra">${extras}</span>` : ''}
                    ${item.serviceType ? `<br><span class="item-extra">Tipo: ${item.serviceType}</span>` : ''}
                </td>
                <td class="col-dims">${dims}</td>
                <td class="col-unit">${fmtBRL(item.unitPrice)}</td>
                <td class="col-total">${fmtBRL(item.totalPrice)}</td>
            </tr>`;
        }).join('');

        const finRows = [
            { label: 'Subtotal produtos', value: subtotal,     show: true         },
            { label: 'Mão de obra / Serviços', value: serviceValue, show: serviceValue > 0 },
            { label: 'Frete / Deslocamento',   value: shipping,     show: shipping     > 0 },
            { label: 'Desconto',               value: -discount,    show: discount     > 0 },
        ].filter(r => r.show).map(r => `
            <tr>
                <td class="fin-label">${r.label}</td>
                <td class="fin-value">${fmtBRL(Math.abs(r.value))}${r.value < 0 ? ' (−)' : ''}</td>
            </tr>`).join('');

        const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<title>OS Nº ${osNum} — ${order.clientName}</title>
<style>
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 11px;
    color: #111;
    background: #fff;
    max-width: 860px;
    margin: 0 auto;
    padding: 16px 24px 24px;
  }

  /* ── Cabeçalho ── */
  .header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding-bottom: 10px;
    border-bottom: 2.5px solid #000;
    gap: 16px;
  }
  .company-name {
    font-size: 22px;
    font-weight: 900;
    letter-spacing: 2px;
    text-transform: uppercase;
    line-height: 1.1;
  }
  .company-tagline {
    font-size: 9px;
    letter-spacing: 1px;
    color: #555;
    margin-top: 2px;
    text-transform: uppercase;
  }
  .company-info {
    font-size: 10px;
    line-height: 1.75;
    margin-top: 6px;
    color: #333;
  }
  .header-right {
    text-align: right;
    flex-shrink: 0;
  }
  .header-phone {
    font-size: 15px;
    font-weight: 800;
    letter-spacing: 0.5px;
  }
  .header-cnpj {
    font-size: 10px;
    color: #555;
    margin-top: 3px;
  }

  /* ── Título OS ── */
  .os-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #000;
    color: #fff;
    padding: 7px 14px;
    margin: 10px 0 8px;
    border-radius: 3px;
  }
  .os-title {
    font-size: 14px;
    font-weight: 900;
    letter-spacing: 0.8px;
  }
  .os-meta {
    font-size: 10px;
    opacity: 0.8;
    text-align: right;
    line-height: 1.7;
  }

  /* ── Cliente ── */
  .section-label {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    color: #555;
    margin-bottom: 5px;
    padding-bottom: 3px;
    border-bottom: 1px solid #ddd;
  }
  .client-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
    border: 1px solid #bbb;
    border-radius: 3px;
    margin-bottom: 10px;
    font-size: 10.5px;
  }
  .client-cell {
    padding: 5px 10px;
    border-right: 1px solid #ddd;
    border-bottom: 1px solid #ddd;
    line-height: 1.6;
  }
  .client-cell:nth-child(even) { border-right: none; }
  .client-cell:nth-last-child(-n+2) { border-bottom: none; }
  .client-cell.full { grid-column: 1 / -1; border-right: none; }
  .cell-label { font-size: 9px; color: #888; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 1px; }
  .cell-value { font-weight: 600; color: #111; }

  /* ── Itens ── */
  .items-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 8px;
    font-size: 10.5px;
  }
  .items-table thead tr {
    background: #222;
    color: #fff;
  }
  .items-table thead th {
    padding: 6px 8px;
    text-align: left;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.8px;
    text-transform: uppercase;
  }
  .col-qty   { width: 42px;  text-align: center; }
  .col-dims  { width: 100px; text-align: center; }
  .col-unit  { width: 90px;  text-align: right;  }
  .col-total { width: 90px;  text-align: right;  font-weight: 700; }
  .col-desc  { }

  .items-table tbody td {
    padding: 6px 8px;
    vertical-align: top;
    border-bottom: 1px solid #e8e8e8;
  }
  .row-even td { background: #fff; }
  .row-odd  td { background: #f8f8f8; }
  .item-extra { font-size: 9.5px; color: #666; font-weight: 400; }

  .items-table tfoot td {
    border-top: 2px solid #000;
    padding: 4px 8px;
    font-size: 9px;
    color: #666;
    font-style: italic;
  }

  /* ── Notas ── */
  .notes-box {
    border: 1px dashed #ccc;
    border-radius: 3px;
    padding: 6px 10px;
    font-size: 10px;
    color: #444;
    margin-bottom: 10px;
    line-height: 1.6;
  }
  .notes-box .notes-label { font-weight: 700; font-size: 9px; text-transform: uppercase; color: #888; margin-bottom: 2px; }

  /* ── Garantia ── */
  .guarantee {
    text-align: center;
    font-size: 9.5px;
    color: #555;
    font-style: italic;
    border-top: 1px dashed #ccc;
    border-bottom: 1px dashed #ccc;
    padding: 4px 0;
    margin-bottom: 10px;
  }

  /* ── Footer ── */
  .footer-grid {
    display: grid;
    grid-template-columns: 1fr 240px;
    gap: 12px;
    border: 1px solid #bbb;
    border-radius: 3px;
    padding: 10px 12px;
    margin-bottom: 8px;
    font-size: 10.5px;
  }
  .footer-left { line-height: 2.0; }
  .footer-cell-label { font-size: 9px; color: #888; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }

  /* Tabela financeira */
  .fin-table { width: 100%; border-collapse: collapse; }
  .fin-table td { padding: 3px 4px; font-size: 10px; vertical-align: middle; }
  .fin-label { color: #555; font-size: 9.5px; }
  .fin-value { text-align: right; font-family: 'Courier New', monospace; font-size: 10.5px; }
  .fin-total td {
    border-top: 2px solid #000 !important;
    padding-top: 5px !important;
    font-weight: 900;
    font-size: 12px;
  }
  .fin-total .fin-value { font-size: 13px; }
  .fin-sep td { border-top: 1px solid #ddd; }

  /* ── Bottom bar ── */
  .bottom-bar {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    border-top: 1px solid #000;
    padding-top: 6px;
    font-size: 9px;
    color: #555;
  }
  .signature {
    text-align: center;
    font-size: 10px;
  }
  .signature-line { border-top: 1px solid #000; width: 160px; margin: 20px auto 3px; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    @page { margin: 10mm 14mm; }
  }
</style>
</head>
<body>

<!-- ── CABEÇALHO ── -->
<div class="header">
  <div>
    <div class="company-name">${settings.companyName || 'DruSign'}</div>
    <div class="company-tagline">Comunicação Visual &amp; Serviços Gráficos</div>
    <div class="company-info">
      ${settings.companyAddress ? `${settings.companyAddress}<br>` : ''}
      ${[settings.companyEmail, settings.companyPhone].filter(Boolean).join('  ·  ')}
    </div>
  </div>
  <div class="header-right">
    <div class="header-phone">${settings.companyPhone || ''}</div>
    ${settings.companyCnpj ? `<div class="header-cnpj">CNPJ: ${settings.companyCnpj}</div>` : ''}
  </div>
</div>

<!-- ── TÍTULO OS ── -->
<div class="os-bar">
  <div class="os-title">ORDEM DE SERVIÇO Nº ${osNum}</div>
  <div class="os-meta">
    Data: ${date} &nbsp;|&nbsp; Hora: ${hour}
  </div>
</div>

<!-- ── CLIENTE ── -->
<div class="section-label">Dados do Cliente</div>
<div class="client-grid">
  <div class="client-cell full">
    <span class="cell-label">Razão Social / Nome</span>
    <span class="cell-value" style="font-size:12px">${order.clientName}</span>
  </div>
  <div class="client-cell">
    <span class="cell-label">CPF / CNPJ</span>
    <span class="cell-value">${order.clientDocument || '—'}</span>
  </div>
  <div class="client-cell">
    <span class="cell-label">Inscrição Estadual</span>
    <span class="cell-value">${order.clientIe || '—'}</span>
  </div>
  <div class="client-cell">
    <span class="cell-label">Telefone</span>
    <span class="cell-value">${order.clientPhone || '—'}</span>
  </div>
  <div class="client-cell">
    <span class="cell-label">Cidade / UF</span>
    <span class="cell-value">${[order.clientCity, order.clientState].filter(Boolean).join(' / ') || '—'}</span>
  </div>
  ${order.clientStreet ? `
  <div class="client-cell full">
    <span class="cell-label">Endereço de Entrega</span>
    <span class="cell-value">${order.clientStreet}${order.clientNumber ? ', ' + order.clientNumber : ''}${order.clientNeighborhood ? ' — ' + order.clientNeighborhood : ''}${order.clientZip ? ' — CEP ' + order.clientZip : ''}</span>
  </div>` : ''}
</div>

<!-- ── ITENS ── -->
<div class="section-label">Itens da Ordem de Serviço</div>
<table class="items-table">
  <thead>
    <tr>
      <th class="col-qty">Qtd</th>
      <th class="col-desc">Produto / Descrição</th>
      <th class="col-dims">Dimensões</th>
      <th class="col-unit">Valor Unit.</th>
      <th class="col-total">Total</th>
    </tr>
  </thead>
  <tbody>
    ${itemsRows || `<tr class="row-even"><td colspan="5" style="text-align:center;padding:16px;color:#aaa;">Nenhum item</td></tr>`}
  </tbody>
  ${order.items && order.items.length > 0 ? `
  <tfoot>
    <tr><td colspan="5">Confira todos os itens antes de assinar o recebimento.</td></tr>
  </tfoot>` : ''}
</table>

<!-- ── OBSERVAÇÕES ── -->
${order.notes ? `
<div class="notes-box">
  <div class="notes-label">Observações</div>
  ${order.notes}
</div>` : ''}

<!-- ── GARANTIA ── -->
<div class="guarantee">
  ★ &nbsp; Guarde este documento como comprovante do seu serviço &nbsp; ★
</div>

<!-- ── FOOTER ── -->
<div class="footer-grid">
  <div class="footer-left">
    <div><span class="footer-cell-label">Forma de Entrega:</span>&nbsp; ${order.deliveryMethod || '—'}</div>
    <div><span class="footer-cell-label">Cond. de Pagamento:</span>&nbsp; ${order.paymentTerms || '—'}</div>
    <div><span class="footer-cell-label">Data Aprovação:</span>&nbsp; ${fmtDate(order.approvalDate)}</div>
    <div><span class="footer-cell-label">Prazo de Entrega:</span>&nbsp; ${fmtDate(order.deliveryDate)}</div>
  </div>
  <div>
    <div class="section-label" style="margin-bottom:6px">Resumo Financeiro</div>
    <table class="fin-table">
      ${finRows}
      <tr class="fin-sep"><td colspan="2"></td></tr>
      <tr class="fin-total">
        <td class="fin-label">TOTAL</td>
        <td class="fin-value">${fmtBRL(total)}</td>
      </tr>
    </table>
  </div>
</div>

<!-- ── ASSINATURA ── -->
<div class="bottom-bar">
  <div>
    <div>Impressão em 1ª via &nbsp;·&nbsp; Obrigado pela preferência!</div>
    <div style="margin-top:2px; font-size:8px; color:#aaa;">OS #${osNum} &nbsp;|&nbsp; Gerado em ${date} às ${hour}</div>
  </div>
  <div class="signature">
    <div class="signature-line"></div>
    <div>Assinatura do Cliente</div>
  </div>
</div>

<script>window.print();</script>
</body>
</html>`;

        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const blobUrl = URL.createObjectURL(blob);
        printWindow.location.href = blobUrl;
        setTimeout(() => URL.revokeObjectURL(blobUrl), 15_000);
    }

    return (
        <button
            onClick={handlePrint}
            className="flex items-center gap-2 h-9 px-4 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-xl border border-zinc-700 transition-colors"
        >
            <Printer size={15} />
            Imprimir OS
        </button>
    );
}
