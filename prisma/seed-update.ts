import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding database with specific IDs...')

    // Cleanup old attempts (optional, but good for consistency if IDs changed)
    // await prisma.orderItem.deleteMany({})
    // await prisma.product.deleteMany({}) 

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
            id: 'chapa-ps', // Assuming this for PS based on pattern
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
    ]

    for (const p of products) {
        await prisma.product.upsert({
            where: { id: p.id },
            update: {
                // Update pricing config if it exists already
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
        })
    }

    console.log('Seeding finished.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
