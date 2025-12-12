import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const prisma = new PrismaClient({
    // @ts-ignore
    datasourceUrl: process.env.DATABASE_URL,
})

async function main() {
    console.log('Seeding database...')

    const banner = await prisma.product.upsert({
        where: { id: 'banner-440' },
        update: {},
        create: {
            id: 'banner-440',
            name: 'Lona 440g (Banner)',
            description: 'Lona resistente ideal para fachadas e banners promocionais.',
            pricePerSqMeter: 35.00,
            minPrice: 20.00,
            isFixedPrice: false,
            image: '/placeholder-banner.jpg',
        },
    })

    const sticker = await prisma.product.upsert({
        where: { id: 'adesivo-vinil' },
        update: {},
        create: {
            id: 'adesivo-vinil',
            name: 'Adesivo Vinil Brilho',
            description: 'Adesivo de alta durabilidade para vitrines e superfícies lisas.',
            pricePerSqMeter: 45.00,
            minPrice: 15.00,
            isFixedPrice: false,
            image: '/placeholder-sticker.jpg',
        },
    })

    const businessCard = await prisma.product.upsert({
        where: { id: 'cartao-visita' },
        update: {},
        create: {
            id: 'cartao-visita',
            name: 'Cartão de Visita (1000 un)',
            description: 'Papel couché 300g, verniz total frente.',
            pricePerSqMeter: 0, // Fixed price doesn't use sq meter logic usually, but required by schema
            minPrice: 89.90, // Acts as the fixed price
            isFixedPrice: true,
            image: '/placeholder-card.jpg',
        },
    })

    console.log({ banner, sticker, businessCard })
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
