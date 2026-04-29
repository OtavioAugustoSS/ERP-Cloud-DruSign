/**
 * Apaga dados de teste mantendo: user, systemsettings, product
 * Execute com: npx ts-node --project tsconfig.json prisma/reset-test-data.ts
 * Ou via tsx:  npx tsx prisma/reset-test-data.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Iniciando limpeza do banco de dados...\n');

    const [items, orders, notifications, logs, clients] = await Promise.all([
        prisma.orderitem.count(),
        prisma.order.count(),
        prisma.notification.count(),
        prisma.log.count(),
        prisma.client.count(),
    ]);

    console.log('Registros encontrados:');
    console.log(`  orderitem:    ${items}`);
    console.log(`  order:        ${orders}`);
    console.log(`  notification: ${notifications}`);
    console.log(`  log:          ${logs}`);
    console.log(`  client:       ${clients}`);
    console.log();

    // Deleção em ordem respeitando FK: filhos antes dos pais
    const r1 = await prisma.orderitem.deleteMany();
    console.log(`✓ orderitem deletados:    ${r1.count}`);

    const r2 = await prisma.order.deleteMany();
    console.log(`✓ order deletados:        ${r2.count}`);

    const r3 = await prisma.notification.deleteMany();
    console.log(`✓ notification deletados: ${r3.count}`);

    const r4 = await prisma.log.deleteMany();
    console.log(`✓ log deletados:          ${r4.count}`);

    const r5 = await prisma.client.deleteMany();
    console.log(`✓ client deletados:       ${r5.count}`);

    const [users, settings, products] = await Promise.all([
        prisma.user.count(),
        prisma.systemsettings.count(),
        prisma.product.count(),
    ]);

    console.log('\nRegistros preservados:');
    console.log(`  user:           ${users}`);
    console.log(`  systemsettings: ${settings}`);
    console.log(`  product:        ${products}`);
    console.log('\nLimpeza concluída com sucesso.');
}

main()
    .catch((e) => { console.error('Erro:', e); process.exit(1); })
    .finally(() => prisma.$disconnect());
