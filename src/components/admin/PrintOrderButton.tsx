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
            <tr style="background:${idx % 2 === 0 ? '#ffffff' : '#f5f5f5'}">
                <td style="text-align:center;padding:5px 8px;border-bottom:1px solid #e0e0e0;vertical-align:top">${item.quantity}</td>
                <td style="padding:5px 8px;border-bottom:1px solid #e0e0e0;vertical-align:top">
                    <strong>${item.productName ?? item.material ?? '—'}</strong>
                    ${extras ? `<br><span style="font-size:9px;color:#666">${extras}</span>` : ''}
                    ${item.serviceType ? `<br><span style="font-size:9px;color:#666">Tipo: ${item.serviceType}</span>` : ''}
                </td>
                <td style="text-align:center;padding:5px 8px;border-bottom:1px solid #e0e0e0;vertical-align:top;white-space:nowrap">${dims}</td>
                <td style="text-align:right;padding:5px 8px;border-bottom:1px solid #e0e0e0;vertical-align:top;white-space:nowrap">${fmtBRL(item.unitPrice)}</td>
                <td style="text-align:right;padding:5px 8px;border-bottom:1px solid #e0e0e0;vertical-align:top;font-weight:700;white-space:nowrap">${fmtBRL(item.totalPrice)}</td>
            </tr>`;
        }).join('');

        const finRows = [
            { label: 'Subtotal produtos',      value: subtotal,      show: true              },
            { label: 'Mão de obra / Serviços', value: serviceValue,  show: serviceValue > 0  },
            { label: 'Frete / Deslocamento',   value: shipping,      show: shipping > 0      },
            { label: 'Desconto',               value: -discount,     show: discount > 0      },
        ].filter(r => r.show).map(r => `
            <tr>
                <td style="padding:3px 4px;font-size:9.5px;color:#555">${r.label}</td>
                <td style="padding:3px 4px;font-size:10px;text-align:right;font-family:'Courier New',monospace">${r.value < 0 ? '(−) ' : ''}${fmtBRL(Math.abs(r.value))}</td>
            </tr>`).join('');

        const addressLine = order.clientStreet
            ? [order.clientStreet, order.clientNumber, order.clientNeighborhood].filter(Boolean).join(', ')
              + (order.clientZip ? ` — CEP ${order.clientZip}` : '')
            : '';

        const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<title>OS Nº ${osNum} — ${order.clientName}</title>
<style>
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

  @page {
    size: A4 portrait;
    margin: 12mm 14mm;
  }

  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 11px;
    color: #111;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* Evita corte no meio de blocos entre páginas */
  .no-break { page-break-inside: avoid; break-inside: avoid; }

  /* ── Cabeçalho ── */
  .header {
    width: 100%;
    border-collapse: collapse;
    border-bottom: 2.5px solid #000;
    margin-bottom: 8px;
  }
  .header td { padding-bottom: 8px; vertical-align: top; }
  .company-name {
    font-size: 20px;
    font-weight: 900;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    line-height: 1.1;
  }
  .company-tagline {
    font-size: 9px;
    letter-spacing: 1px;
    color: #666;
    margin-top: 2px;
    text-transform: uppercase;
  }
  .company-info { font-size: 10px; line-height: 1.7; margin-top: 5px; color: #444; }
  .header-phone { font-size: 14px; font-weight: 800; letter-spacing: 0.5px; text-align: right; }
  .header-cnpj  { font-size: 10px; color: #666; margin-top: 3px; text-align: right; }

  /* ── Barra OS ── */
  .os-bar {
    width: 100%;
    border-collapse: collapse;
    background: #111;
    color: #fff;
    margin-bottom: 8px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .os-bar td { padding: 7px 12px; }
  .os-title { font-size: 13px; font-weight: 900; letter-spacing: 0.8px; }
  .os-meta  { font-size: 10px; opacity: 0.85; text-align: right; line-height: 1.7; }

  /* ── Rótulo de seção ── */
  .section-label {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #666;
    padding-bottom: 3px;
    border-bottom: 1px solid #ccc;
    margin-bottom: 6px;
  }

  /* ── Tabela de cliente ── */
  .client-table {
    width: 100%;
    border-collapse: collapse;
    border: 1px solid #bbb;
    margin-bottom: 10px;
    font-size: 10.5px;
  }
  .client-table td {
    padding: 5px 9px;
    border: 1px solid #ddd;
    vertical-align: top;
    line-height: 1.5;
  }
  .cell-label {
    font-size: 8.5px;
    color: #888;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    display: block;
    margin-bottom: 1px;
  }
  .cell-value { font-weight: 600; color: #111; }

  /* ── Tabela de itens ── */
  .items-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 8px;
    font-size: 10.5px;
  }
  .items-table thead td {
    background: #222;
    color: #fff;
    padding: 6px 8px;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.7px;
    text-transform: uppercase;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .items-table tfoot td {
    border-top: 2px solid #000;
    padding: 4px 8px;
    font-size: 9px;
    color: #777;
    font-style: italic;
  }

  /* ── Notas ── */
  .notes-box {
    border: 1px dashed #bbb;
    padding: 6px 10px;
    font-size: 10px;
    color: #444;
    margin-bottom: 10px;
    line-height: 1.6;
  }

  /* ── Garantia ── */
  .guarantee {
    text-align: center;
    font-size: 9.5px;
    color: #666;
    font-style: italic;
    border-top: 1px dashed #bbb;
    border-bottom: 1px dashed #bbb;
    padding: 4px 0;
    margin-bottom: 10px;
  }

  /* ── Rodapé (tabela para compatibilidade de impressão) ── */
  .footer-table {
    width: 100%;
    border-collapse: collapse;
    border: 1px solid #bbb;
    margin-bottom: 8px;
    font-size: 10.5px;
  }
  .footer-table td { padding: 7px 10px; vertical-align: top; }
  .footer-table .footer-left { border-right: 1px solid #ddd; line-height: 2.0; width: 60%; }
  .footer-cell-label { font-size: 9px; color: #888; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; }

  /* Tabela financeira */
  .fin-table { width: 100%; border-collapse: collapse; }
  .fin-table td { padding: 3px 2px; }
  .fin-section-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #666; padding-bottom: 3px; border-bottom: 1px solid #ccc; margin-bottom: 4px; display: block; }
  .fin-total-row td { border-top: 2px solid #000; padding-top: 5px; font-weight: 900; font-size: 12px; }
  .fin-total-row .fin-val { font-size: 13px; }
  .fin-sep td { border-top: 1px solid #ddd; padding: 1px 0; }

  /* ── Barra inferior ── */
  .bottom-table {
    width: 100%;
    border-collapse: collapse;
    border-top: 1px solid #333;
    padding-top: 6px;
    font-size: 9px;
    color: #666;
    margin-top: 2px;
  }
  .bottom-table td { padding-top: 6px; vertical-align: bottom; }
  .signature { text-align: center; font-size: 10px; }
  .signature-line { border-top: 1px solid #000; width: 160px; margin: 24px auto 3px; }
</style>
</head>
<body>

<!-- ── CABEÇALHO ── -->
<table class="header no-break">
  <tr>
    <td>
      <div class="company-name">${settings.companyName || 'DruSign'}</div>
      <div class="company-tagline">Comunicação Visual &amp; Serviços Gráficos</div>
      <div class="company-info">
        ${settings.companyAddress ? `${settings.companyAddress}<br>` : ''}
        ${[settings.companyEmail, settings.companyPhone].filter(Boolean).join('  ·  ')}
      </div>
    </td>
    <td style="text-align:right;width:220px">
      <div class="header-phone">${settings.companyPhone || ''}</div>
      ${settings.companyCnpj ? `<div class="header-cnpj">CNPJ: ${settings.companyCnpj}</div>` : ''}
    </td>
  </tr>
</table>

<!-- ── BARRA OS ── -->
<table class="os-bar no-break">
  <tr>
    <td class="os-title">ORDEM DE SERVIÇO Nº ${osNum}</td>
    <td class="os-meta">Data: ${date}&nbsp; | &nbsp;Hora: ${hour}</td>
  </tr>
</table>

<!-- ── CLIENTE ── -->
<div class="section-label no-break">Dados do Cliente</div>
<table class="client-table no-break">
  <tr>
    <td colspan="2">
      <span class="cell-label">Razão Social / Nome</span>
      <span class="cell-value" style="font-size:12px">${order.clientName}</span>
    </td>
  </tr>
  <tr>
    <td>
      <span class="cell-label">CPF / CNPJ</span>
      <span class="cell-value">${order.clientDocument || '—'}</span>
    </td>
    <td>
      <span class="cell-label">Inscrição Estadual</span>
      <span class="cell-value">${order.clientIe || '—'}</span>
    </td>
  </tr>
  <tr>
    <td>
      <span class="cell-label">Telefone</span>
      <span class="cell-value">${order.clientPhone || '—'}</span>
    </td>
    <td>
      <span class="cell-label">Cidade / UF</span>
      <span class="cell-value">${[order.clientCity, order.clientState].filter(Boolean).join(' / ') || '—'}</span>
    </td>
  </tr>
  ${addressLine ? `
  <tr>
    <td colspan="2">
      <span class="cell-label">Endereço de Entrega</span>
      <span class="cell-value">${addressLine}</span>
    </td>
  </tr>` : ''}
</table>

<!-- ── ITENS ── -->
<div class="section-label">Itens da Ordem de Serviço</div>
<table class="items-table">
  <thead>
    <tr>
      <td style="width:42px;text-align:center">Qtd</td>
      <td>Produto / Descrição</td>
      <td style="width:100px;text-align:center">Dimensões</td>
      <td style="width:90px;text-align:right">Valor Unit.</td>
      <td style="width:95px;text-align:right">Total</td>
    </tr>
  </thead>
  <tbody>
    ${itemsRows || `<tr><td colspan="5" style="text-align:center;padding:16px;color:#aaa">Nenhum item cadastrado</td></tr>`}
  </tbody>
  ${order.items && order.items.length > 0 ? `
  <tfoot>
    <tr><td colspan="5">Confira todos os itens antes de assinar o recebimento.</td></tr>
  </tfoot>` : ''}
</table>

<!-- ── OBSERVAÇÕES ── -->
${order.notes ? `
<div class="notes-box no-break">
  <div style="font-weight:700;font-size:9px;text-transform:uppercase;color:#888;margin-bottom:2px">Observações</div>
  ${order.notes}
</div>` : ''}

<!-- ── GARANTIA ── -->
<div class="guarantee no-break">
  ★ &nbsp; Guarde este documento como comprovante do seu serviço &nbsp; ★
</div>

<!-- ── RODAPÉ ── -->
<table class="footer-table no-break">
  <tr>
    <td class="footer-left">
      <div><span class="footer-cell-label">Forma de Entrega:</span>&nbsp; ${order.deliveryMethod || '—'}</div>
      <div><span class="footer-cell-label">Cond. de Pagamento:</span>&nbsp; ${order.paymentTerms || '—'}</div>
      <div><span class="footer-cell-label">Data Aprovação:</span>&nbsp; ${fmtDate(order.approvalDate)}</div>
      <div><span class="footer-cell-label">Prazo de Entrega:</span>&nbsp; ${fmtDate(order.deliveryDate)}</div>
    </td>
    <td style="width:40%">
      <span class="fin-section-label">Resumo Financeiro</span>
      <table class="fin-table">
        ${finRows}
        <tr class="fin-sep"><td colspan="2">&nbsp;</td></tr>
        <tr class="fin-total-row">
          <td>TOTAL</td>
          <td class="fin-val" style="text-align:right;font-family:'Courier New',monospace">${fmtBRL(total)}</td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- ── ASSINATURA ── -->
<table class="bottom-table no-break">
  <tr>
    <td>
      <div>Impressão em 1ª via &nbsp;·&nbsp; Obrigado pela preferência!</div>
      <div style="margin-top:2px;font-size:8px;color:#aaa">OS #${osNum} &nbsp;|&nbsp; Gerado em ${date} às ${hour}</div>
    </td>
    <td style="text-align:right">
      <div class="signature">
        <div class="signature-line"></div>
        <div>Assinatura do Cliente</div>
      </div>
    </td>
  </tr>
</table>

</body>
</html>`;

        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const blobUrl = URL.createObjectURL(blob);
        printWindow.location.href = blobUrl;

        // Aguarda o carregamento e então abre o diálogo de impressão
        printWindow.onload = () => {
            printWindow.focus();
            printWindow.print();
            setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000);
        };
        // Fallback se onload não disparar (alguns navegadores)
        setTimeout(() => {
            try {
                if (!printWindow.closed) {
                    printWindow.focus();
                    printWindow.print();
                }
            } catch { /* janela já fechada */ }
            URL.revokeObjectURL(blobUrl);
        }, 2_500);
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
