import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Buscando clientes com dados nas observações...');
    const clients = await prisma.client.findMany({
        where: {
            notes: { contains: '[Importado do sistema legado' }
        }
    });

    console.log(`Encontrados ${clients.length} clientes para migração.`);

    let updated = 0;

    for (const client of clients) {
        if (!client.notes) continue;

        let nickname = client.nickname;
        let contact = client.contact;
        let phone2 = client.phone2;
        let notes = client.notes;

        // Extrai Fantasia
        const fantasiaMatch = notes.match(/Fantasia:\s*([^|]+)/);
        if (fantasiaMatch && !nickname) {
            nickname = fantasiaMatch[1].trim();
            notes = notes.replace(/Fantasia:\s*[^|]+\|?\s*/, '');
        }

        // Extrai Contato
        const contatoMatch = notes.match(/Contato:\s*([^|]+)/);
        if (contatoMatch && !contact) {
            contact = contatoMatch[1].trim();
            notes = notes.replace(/Contato:\s*[^|]+\|?\s*/, '');
        }

        // Extrai Tel2
        const tel2Match = notes.match(/Tel2:\s*([^|]+)/);
        if (tel2Match && !phone2) {
            phone2 = tel2Match[1].trim();
            notes = notes.replace(/Tel2:\s*[^|]+\|?\s*/, '');
        }

        // Limpa o marcador de importação também, se quiser
        // notes = notes.replace(/\[Importado do sistema legado — COD: \d+\]\|?\s*/, '');

        notes = notes.trim();
        // Remove trailing or leading pipe
        if (notes.startsWith('|')) notes = notes.substring(1).trim();
        if (notes.endsWith('|')) notes = notes.substring(0, notes.length - 1).trim();

        let notesToSave: string | null = notes;
        if (notesToSave === '') notesToSave = null;

        if (
            nickname !== client.nickname ||
            contact !== client.contact ||
            phone2 !== client.phone2 ||
            notesToSave !== client.notes
        ) {
            await prisma.client.update({
                where: { id: client.id },
                data: {
                    nickname,
                    contact,
                    phone2,
                    notes: notesToSave
                }
            });
            updated++;
        }
    }

    console.log(`✅ Migração concluída! ${updated} clientes atualizados.`);
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
