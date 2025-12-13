const { PrismaClient } = require('@prisma/client')

console.log('Seed process started.')
console.log('DB URL Env Status:', process.env.DATABASE_URL ? 'FOUND' : 'MISSING')

// Pass explicit log options to satisfy "non-empty config" requirement if v7 enforces it,
// and rely on process.env.DATABASE_URL for connection.
const prisma = new PrismaClient({
    log: ['info', 'warn', 'error']
})

async function main() {
    console.log('Connecting to database via seed.js...')

    // Cleanup
    try {
        await prisma.orderItem.deleteMany({})
        await prisma.product.deleteMany({})
        console.log('Cleaned up old data.')
    } catch (e) { console.log('Cleanup skip/error:', e.message) }

    // LONA
    await prisma.product.create({
        data: {
            id: 'banner-440',
            name: 'Lona',
            description: 'Lona 440g para banners e faixas.',
            pricePerSqMeter: 50.00,
            minPrice: 20.00,
            isFixedPrice: false,
            pricingConfig: {},
        },
    })

    // ADESIVO
    await prisma.product.create({
        data: {
            id: 'adesivo-vinil',
            name: 'Adesivo',
            description: 'Adesivo Vinil para diversas aplicações.',
            pricePerSqMeter: 65.00,
            minPrice: 15.00,
            isFixedPrice: false,
            pricingConfig: {},
        },
    })

    // ACM
    await prisma.product.create({
        data: {
            id: 'chapa-acm',
            name: 'ACM',
            description: 'Placa de Alumínio Composto.',
            pricePerSqMeter: 120.00,
            minPrice: 50.00,
            isFixedPrice: false,
            pricingConfig: {},
        },
    })

    // PVC
    await prisma.product.create({
        data: {
            id: 'chapa-pvc',
            name: 'PVC',
            description: 'Placa de PVC.',
            pricePerSqMeter: 120.00,
            minPrice: 30.00,
            isFixedPrice: false,
            pricingConfig: {},
        },
    })

    // PS
    await prisma.product.create({
        data: {
            id: 'chapa-ps',
            name: 'PS (Chapa)',
            description: 'Poliestireno.',
            pricePerSqMeter: 150.00,
            minPrice: 80.00,
            isFixedPrice: false,
            pricingConfig: {},
        },
    })

    // ACRÍLICO
    await prisma.product.create({
        data: {
            id: 'chapa-acrilico',
            name: 'Acrílico',
            description: 'Chapa de Acrílico.',
            pricePerSqMeter: 350.00,
            minPrice: 100.00,
            isFixedPrice: false,
            pricingConfig: {
                hasThickness: true,
                thicknessOptions: ['1mm', '2mm', '3mm', '4mm', '5mm', '6mm', '8mm'],
                pricesByThickness: {
                    '1mm': 280,
                    '2mm': 350,
                    '3mm': 500,
                    '4mm': 650,
                    '5mm': 800,
                    '6mm': 950,
                    '8mm': 1200
                }
            },
        },
    })

    console.log('Seeding finished successfully.')
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
