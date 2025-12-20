
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const adesivo = await prisma.product.findUnique({ where: { id: 'adesivo-vinil' } });
    console.log('Adesivo Config:', JSON.stringify(adesivo?.pricingConfig, null, 2));

    const acrilico = await prisma.product.findUnique({ where: { id: 'chapa-acrilico' } });
    console.log('Acrilico Config:', JSON.stringify(acrilico?.pricingConfig, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
