/**
 * Script de importação: CLIENTES.prn → banco de dados DruSign
 *
 * Uso: node -r ts-node/register --env-file=.env prisma/import-clients.ts
 *
 * O que faz:
 * 1. Lê o arquivo PRN (largura fixa, Windows-1252)
 * 2. Combina as 3 seções (dados básicos, endereço, documentos)
 * 3. Limpa e formata todos os campos
 * 4. Insere no banco via Prisma (cria novos, pula existentes por documento)
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

// ─── Constantes de posição das colunas ───
// Seção 1 (linhas 1–1219): COD, LIBERADO, RESTRITO, BLOQUEAR, NOM, EST, TEL1, RUA, BAI
const S1 = {
    COD: [0, 5],
    NOM: [38, 50],     // 38..87
    EST: [88, 38],     // 88..125 (apelido/fantasia)
    TEL1: [126, 14],   // 126..139
    RUA: [140, 64],    // 140..203
    BAI: [204, 30],    // 204..end
} as const;

// Seção 2 (linhas 1221–2439): CID, UF, CPL, CEP, TEL2, CEL, CTO, EMAIL
const S2 = {
    CID: [0, 24],
    UF: [24, 2],
    CEP: [56, 9],
    TEL2: [73, 14],
    CEL: [115, 14],
    CTO: [129, 30],
    EMAIL: [159, 70],
} as const;

// Seção 3 (linhas 2441–3659): HOME, MSN, CGC, CPF, RG, ORGAO, IE, IM
const S3 = {
    CGC: [120, 18],
    CPF: [138, 14],
    IE: [173, 15],
} as const;

// Seção 4 (linhas 3661–4879): OBS1, OBS2
const S4 = {
    OBS1: [0, 100],
    OBS2: [100, 100],
} as const;

// ─── Helpers ───

function safeSubstr(line: string, start: number, len: number): string {
    if (line.length <= start) return '';
    return line.substring(start, Math.min(start + len, line.length)).trim();
}

/** Fix Windows-1252 encoding artifacts */
function fixEncoding(s: string): string {
    return s
        .replace(/\?/g, 'Ã')  // Common corruption for Ã
        .replace(/�/g, 'Ç')    // Common corruption for Ç
        .replace(/\u0000/g, '') // Null bytes
        .trim();
}

/** Format CNPJ: 12345678000199 → 12.345.678/0001-99 */
function formatCNPJ(raw: string): string | null {
    const digits = raw.replace(/\D/g, '');
    if (digits.length !== 14) return null;
    return digits.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
        '$1.$2.$3/$4-$5'
    );
}

/** Format CPF: 12345678901 → 123.456.789-01 */
function formatCPF(raw: string): string | null {
    const digits = raw.replace(/\D/g, '');
    if (digits.length !== 11) return null;
    return digits.replace(
        /^(\d{3})(\d{3})(\d{3})(\d{2})$/,
        '$1.$2.$3-$4'
    );
}

/** Clean phone: filter out empty patterns like "(  )    -" */
function cleanPhone(raw: string): string | null {
    const cleaned = raw.trim();
    if (!cleaned) return null;
    if (/^\(\s*\)\s*-?\s*$/.test(cleaned)) return null;
    if (cleaned.length < 8) return null;
    return cleaned;
}

/** Separate street name from number: "RUA JOSE LUCIANO N 66" → { street, number } */
function separateStreetNumber(raw: string): { street: string; number: string } {
    const cleaned = raw.trim();
    if (!cleaned) return { street: '', number: '' };

    // Match patterns like "N 66", "Nº 1091", "N° 750", "S/N", ", 327"
    const match = cleaned.match(/\s+(?:N[°º]?\s*|,\s*)(\d+[A-Z]?)\s*$/i);
    if (match) {
        const number = match[1];
        const street = cleaned.substring(0, match.index!).trim();
        return { street, number };
    }

    // "S/N" = sem número
    if (/S\/N\s*$/i.test(cleaned)) {
        return { street: cleaned.replace(/,?\s*S\/N\s*$/i, '').trim(), number: 'S/N' };
    }

    return { street: cleaned, number: '' };
}

/** Format CEP: ensure XXXXX-XXX */
function cleanCEP(raw: string): string | null {
    const digits = raw.replace(/\D/g, '');
    if (digits.length !== 8) return null;
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

/** Title case: "JOAO DA SILVA" → "Joao da Silva" */
function titleCase(s: string): string {
    const minor = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'a', 'o', 'p/', 's/n']);
    return s
        .toLowerCase()
        .split(/\s+/)
        .map((w, i) => (i === 0 || !minor.has(w)) ? w.charAt(0).toUpperCase() + w.slice(1) : w)
        .join(' ');
}

/** Clean email */
function cleanEmail(raw: string): string | null {
    const cleaned = raw.trim().toLowerCase();
    if (!cleaned) return null;
    if (!cleaned.includes('@') || !cleaned.includes('.')) return null;
    return cleaned;
}

// ─── Tipo do cliente parseado ───

interface ParsedClient {
    legacyCode: number;
    name: string;
    nickname: string;
    phone: string | null;
    phone2: string | null;
    cellphone: string | null;
    email: string | null;
    document: string | null;
    documentType: 'CNPJ' | 'CPF' | null;
    ie: string | null;
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zip: string | null;
    contact: string;
    notes: string;
}

// ─── Main ───

async function main() {
    const filePath = path.resolve(__dirname, '..', 'CLIENTES.prn');

    if (!fs.existsSync(filePath)) {
        console.error(`❌ Arquivo não encontrado: ${filePath}`);
        process.exit(1);
    }

    console.log('📂 Lendo CLIENTES.prn...');
    const raw = fs.readFileSync(filePath, 'latin1'); // Windows-1252
    const lines = raw.split(/\r?\n/);

    console.log(`   ${lines.length} linhas totais`);

    // Each section has 1 header + 1219 data lines (indices 1..1219)
    // Section 1: lines[1]..lines[1219]
    // Section 2: lines[1221]..lines[2439]
    // Section 3: lines[2441]..lines[3659]
    // Section 4: lines[3661]..lines[4879]

    const SECTION_SIZE = 1219; // data lines per section
    const S1_START = 1;
    const S2_START = 1221;
    const S3_START = 2441;
    const S4_START = 3661;

    const clients: ParsedClient[] = [];
    let skippedNoName = 0;
    let skippedBlocked = 0;

    for (let i = 0; i < SECTION_SIZE; i++) {
        const line1 = lines[S1_START + i] || '';
        const line2 = lines[S2_START + i] || '';
        const line3 = lines[S3_START + i] || '';
        const line4 = lines[S4_START + i] || '';

        // Check if blocked
        const bloquear = safeSubstr(line1, 27, 10);
        if (bloquear === 'VERDADEIRO') {
            skippedBlocked++;
            continue;
        }

        // Parse fields
        const codStr = safeSubstr(line1, S1.COD[0], S1.COD[1]);
        const code = parseInt(codStr, 10) || 0;

        const rawName = fixEncoding(safeSubstr(line1, S1.NOM[0], S1.NOM[1]));
        if (!rawName || rawName.length < 2) {
            skippedNoName++;
            continue;
        }

        const nickname = fixEncoding(safeSubstr(line1, S1.EST[0], S1.EST[1]));
        const tel1 = cleanPhone(safeSubstr(line1, S1.TEL1[0], S1.TEL1[1]));
        const rawRua = fixEncoding(safeSubstr(line1, S1.RUA[0], S1.RUA[1]));
        const bairro = fixEncoding(safeSubstr(line1, S1.BAI[0], S1.BAI[1]));

        const { street, number } = separateStreetNumber(rawRua);

        const cidade = fixEncoding(safeSubstr(line2, S2.CID[0], S2.CID[1]));
        const uf = safeSubstr(line2, S2.UF[0], S2.UF[1]).toUpperCase();
        const cep = cleanCEP(safeSubstr(line2, S2.CEP[0], S2.CEP[1]));
        const tel2 = cleanPhone(safeSubstr(line2, S2.TEL2[0], S2.TEL2[1]));
        const cel = cleanPhone(safeSubstr(line2, S2.CEL[0], S2.CEL[1]));
        const contato = fixEncoding(safeSubstr(line2, S2.CTO[0], S2.CTO[1]));
        const email = cleanEmail(safeSubstr(line2, S2.EMAIL[0], S2.EMAIL[1]));

        const rawCnpj = safeSubstr(line3, S3.CGC[0], S3.CGC[1]);
        const rawCpf = safeSubstr(line3, S3.CPF[0], S3.CPF[1]);
        const ie = safeSubstr(line3, S3.IE[0], S3.IE[1]) || null;

        let document: string | null = null;
        let documentType: 'CNPJ' | 'CPF' | null = null;

        const cnpj = formatCNPJ(rawCnpj);
        if (cnpj) {
            document = cnpj;
            documentType = 'CNPJ';
        } else {
            const cpf = formatCPF(rawCpf);
            if (cpf) {
                document = cpf;
                documentType = 'CPF';
            }
        }

        // Use the best phone available
        const phone = tel1 || cel || tel2 || null;
        const phone2 = tel1 ? (cel || tel2 || null) : (tel2 || null);

        // OBS
        const obs1 = fixEncoding(safeSubstr(line4, S4.OBS1[0], S4.OBS1[1]));
        const obs2 = fixEncoding(safeSubstr(line4, S4.OBS2[0], S4.OBS2[1]));
        const notes = [obs1, obs2].filter(Boolean).join(' | ');

        clients.push({
            legacyCode: code,
            name: rawName,
            nickname,
            phone,
            phone2,
            cellphone: cel,
            email,
            document,
            documentType,
            ie,
            street: street ? titleCase(street) : '',
            number,
            neighborhood: bairro ? titleCase(bairro) : '',
            city: cidade ? titleCase(cidade) : '',
            state: uf,
            zip: cep,
            contact: contato,
            notes: notes || '',
        });
    }

    console.log(`\n📊 Resultado do parsing:`);
    console.log(`   ✅ Clientes válidos: ${clients.length}`);
    console.log(`   ⏭️  Pulados sem nome: ${skippedNoName}`);
    console.log(`   🚫 Pulados bloqueados: ${skippedBlocked}`);

    // Stats
    const withDoc = clients.filter(c => c.document).length;
    const withPhone = clients.filter(c => c.phone).length;
    const withEmail = clients.filter(c => c.email).length;
    const withAddress = clients.filter(c => c.street).length;
    const withCity = clients.filter(c => c.city).length;

    console.log(`\n📈 Dados preenchidos:`);
    console.log(`   Nome:      ${clients.length} (100%)`);
    console.log(`   Documento: ${withDoc} (${Math.round(withDoc / clients.length * 100)}%)`);
    console.log(`   Telefone:  ${withPhone} (${Math.round(withPhone / clients.length * 100)}%)`);
    console.log(`   E-mail:    ${withEmail} (${Math.round(withEmail / clients.length * 100)}%)`);
    console.log(`   Endereço:  ${withAddress} (${Math.round(withAddress / clients.length * 100)}%)`);
    console.log(`   Cidade:    ${withCity} (${Math.round(withCity / clients.length * 100)}%)`);

    // Check for duplicate emails
    const emailCounts = new Map<string, number>();
    for (const c of clients) {
        if (c.email) {
            emailCounts.set(c.email, (emailCounts.get(c.email) || 0) + 1);
        }
    }
    const dupEmails = [...emailCounts.entries()].filter(([, count]) => count > 1);
    if (dupEmails.length > 0) {
        console.log(`\n⚠️  E-mails duplicados (${dupEmails.length}):`);
        for (const [email, count] of dupEmails) {
            console.log(`   ${email} → ${count}x`);
        }
        // Clear duplicated emails (keep only first occurrence)
        const seen = new Set<string>();
        for (const c of clients) {
            if (c.email) {
                if (seen.has(c.email)) {
                    c.email = null;
                } else {
                    seen.add(c.email);
                }
            }
        }
        console.log(`   → Duplicatas limpas (mantido apenas a primeira ocorrência)`);
    }

    // Check for duplicate documents
    const docCounts = new Map<string, number>();
    for (const c of clients) {
        if (c.document) {
            docCounts.set(c.document, (docCounts.get(c.document) || 0) + 1);
        }
    }
    const dupDocs = [...docCounts.entries()].filter(([, count]) => count > 1);
    if (dupDocs.length > 0) {
        console.log(`\n⚠️  Documentos duplicados (${dupDocs.length}):`);
        for (const [doc, count] of dupDocs.slice(0, 10)) {
            console.log(`   ${doc} → ${count}x`);
        }
    }

    // ─── INSERT INTO DATABASE ───
    console.log(`\n💾 Inserindo ${clients.length} clientes no banco...`);

    let created = 0;
    let skippedExisting = 0;
    let errors = 0;

    // Check existing clients by document to avoid duplicates
    const existingDocs = new Set<string>();
    const existingEmails = new Set<string>();
    const existingClients = await prisma.client.findMany({
        select: { document: true, email: true },
    });
    for (const ec of existingClients) {
        if (ec.document) existingDocs.add(ec.document);
        if (ec.email) existingEmails.add(ec.email);
    }
    console.log(`   Clientes já no banco: ${existingClients.length}`);

    // Batch insert
    const BATCH_SIZE = 50;
    const batches = [];
    for (let i = 0; i < clients.length; i += BATCH_SIZE) {
        batches.push(clients.slice(i, i + BATCH_SIZE));
    }

    for (let bIdx = 0; bIdx < batches.length; bIdx++) {
        const batch = batches[bIdx];
        const toCreate = [];

        for (const c of batch) {
            // Skip if document already exists
            if (c.document && existingDocs.has(c.document)) {
                skippedExisting++;
                continue;
            }
            // Skip if email already exists in DB
            if (c.email && existingEmails.has(c.email)) {
                c.email = null; // Clear email but still create the client
            }

            const noteParts = [];
            if (c.nickname) noteParts.push(`Fantasia: ${c.nickname}`);
            if (c.contact) noteParts.push(`Contato: ${c.contact}`);
            if (c.phone2) noteParts.push(`Tel2: ${c.phone2}`);
            if (c.notes) noteParts.push(c.notes);
            noteParts.push(`[Importado do sistema legado — COD: ${c.legacyCode}]`);

            toCreate.push({
                name: c.name,
                email: c.email,
                phone: c.phone,
                document: c.document,
                ie: c.ie,
                zip: c.zip,
                street: c.street || null,
                number: c.number || null,
                neighborhood: c.neighborhood || null,
                city: c.city || null,
                state: c.state || null,
                notes: noteParts.join(' | '),
            });

            // Track to avoid duplicates within import
            if (c.document) existingDocs.add(c.document);
            if (c.email) existingEmails.add(c.email);
        }

        if (toCreate.length === 0) continue;

        try {
            const result = await prisma.client.createMany({
                data: toCreate,
                skipDuplicates: true,
            });
            created += result.count;
        } catch (err) {
            // Fallback: insert one by one
            for (const data of toCreate) {
                try {
                    await prisma.client.create({ data });
                    created++;
                } catch (e: unknown) {
                    errors++;
                    const msg = e instanceof Error ? e.message : String(e);
                    if (!msg.includes('Unique constraint')) {
                        console.error(`   ❌ Erro ao inserir "${data.name}": ${msg.slice(0, 100)}`);
                    } else {
                        skippedExisting++;
                    }
                }
            }
        }

        // Progress
        const pct = Math.round(((bIdx + 1) / batches.length) * 100);
        process.stdout.write(`\r   Progresso: ${pct}% (${created} criados)`);
    }

    console.log(`\n\n✅ Importação concluída!`);
    console.log(`   📥 Criados:      ${created}`);
    console.log(`   ⏭️  Já existiam:  ${skippedExisting}`);
    if (errors > 0) console.log(`   ❌ Erros:        ${errors}`);

    // Final count
    const totalClients = await prisma.client.count();
    console.log(`\n📊 Total de clientes no banco: ${totalClients}`);
}

main()
    .catch((e) => {
        console.error('❌ Erro fatal:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
