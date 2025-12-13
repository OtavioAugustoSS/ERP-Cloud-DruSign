const { PrismaClient } = require('@prisma/client');

// Use the singleton-like options pattern to be safe, though direct instantiation works in scripts usually
const prisma = new PrismaClient({
    log: ['info', 'warn', 'error'],
});

async function main() {
    console.log('Seeding database with specific IDs via JS...');

    // Mapping requested by user
    const products = [
        {
            id: 'banner-440',
            name: 'Lona 440g',
            description: 'Lona resistente para banners.',
            pricePerSqMeter: 50.00,
            pricingConfig: {},
        },
        {
            id: 'adesivo-vinil',
            name: 'Adesivo Vinil',
            description: 'Adesivo vinil padrão.',
            pricePerSqMeter: 65.00,
            pricingConfig: {},
        },
        {
            id: 'chapa-acm',
            name: 'Chapa ACM',
            description: 'Alumínio Composto.',
            pricePerSqMeter: 120.00,
            pricingConfig: {},
        },
        {
            id: 'chapa-pvc',
            name: 'Chapa PVC',
            description: 'Placa de PVC.',
            pricePerSqMeter: 120.00,
            pricingConfig: {},
        },
        {
            id: 'chapa-ps',
            name: 'Chapa PS',
            description: 'Poliestireno.',
            pricePerSqMeter: 150.00,
            pricingConfig: {},
        },
        {
            id: 'chapa-acrilico',
            name: 'Chapa Acrílico',
            description: 'Acrílico cast.',
            pricePerSqMeter: 350.00,
            pricingConfig: {
                hasThickness: true,
                thicknessOptions: ['1mm', '2mm', '3mm', '4mm', '5mm', '6mm', '8mm'],
                pricesByThickness: {
                    '1mm': 280, '2mm': 350, '3mm': 500, '4mm': 650,
                    '5mm': 800, '6mm': 950, '8mm': 1200
                }
            },
        }
    ];

    for (const p of products) {
        console.log(`Upserting ${p.id}...`);
        await prisma.product.upsert({
            where: { id: p.id },
            update: {
                pricePerSqMeter: p.pricePerSqMeter,
                pricingConfig: p.pricingConfig,
            },
            create: {
                id: p.id,
                name: p.name,
                description: p.description,
                pricePerSqMeter: p.pricePerSqMeter,
                minPrice: 0,
                isFixedPrice: false,
                pricingConfig: p.pricingConfig,
            }
        });
    }

    console.log('Seeding finished.');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
