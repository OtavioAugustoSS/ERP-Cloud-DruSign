
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding database...')

    // Cleanup existing products to avoid conflicts or duplicates on re-seed
    // Note: This might fail if there are foreign key constraints (Orders), so we use upsert or delete if safe.
    // For now, we'll try to upsert or create. Use upsert to be safe.

    const products = [
        {
            id: 'banner-380',
            name: 'Lona 380g',
            category: 'LONA',
            pricePerM2: 40.00,
            description: 'Lona econômica para promoções.',
            pricingConfig: {
                types: ['Banner Promocional'],
                finishings: ['Bainha e Ilhós', 'Sem Acabamento']
            }
        },
        {
            id: 'banner-440',
            name: 'Lona 440g',
            category: 'LONA',
            pricePerM2: 50.00,
            description: 'Lona resistente para banners e fachadas.',
            pricingConfig: {
                types: ['Banner Promocional', 'Grandes Formatos'],
                finishings: ['Bainha e Ilhós', 'Bastão e Corda', 'Sem Acabamento']
            }
        },
        {
            id: 'adesivo-vinil',
            name: 'Adesivo Vinil',
            category: 'ADESIVO',
            pricePerM2: 65.00,
            description: 'Adesivo vinil de alta qualidade.',
            pricingConfig: {
                types: ['Fosco', 'Brilhoso', 'Transparente'],
                pricesByType: {
                    'Fosco': 65.00,
                    'Brilhoso': 65.00,
                    'Transparente': 65.00
                }
            }
        },
        {
            id: 'chapa-acm',
            name: 'ACM',
            category: 'ACM',
            pricePerM2: 120.00,
            description: 'Alumínio Composto para fachadas e placas.',
            pricingConfig: {}
        },
        {
            id: 'chapa-pvc',
            name: 'PVC Expandido',
            category: 'PVC',
            pricePerM2: 120.00,
            description: 'Placas de PVC para sinalização.',
            pricingConfig: {}
        },
        {
            id: 'chapa-ps',
            name: 'PS (Poliestireno)',
            category: 'PS',
            pricePerM2: 150.00,
            description: 'Material rígido e econômico.',
            pricingConfig: {}
        },
        {
            id: 'chapa-acrilico',
            name: 'Acrílico',
            category: 'ACRÍLICO',
            pricePerM2: 350.00,
            description: 'Material nobre com alto brilho.',
            pricingConfig: {
                hasThickness: true,
                thicknessOptions: ['1mm', '2mm', '3mm', '4mm', '5mm', '6mm', '8mm', '10mm', '12mm'],
                pricesByThickness: {
                    '1mm': 280, '2mm': 350, '3mm': 500, '4mm': 650, '5mm': 800, '6mm': 950, '8mm': 1200, '10mm': 1400, '12mm': 1600
                }
            }
        }
    ];

    for (const p of products) {
        await prisma.product.upsert({
            where: { id: p.id },
            update: {
                name: p.name,
                category: p.category,
                pricePerM2: p.pricePerM2,
                description: p.description,
                // Cast to any to avoid strict JSON typing issues in seed
                pricingConfig: p.pricingConfig as any
            },
            create: {
                id: p.id,
                name: p.name,
                category: p.category,
                pricePerM2: p.pricePerM2,
                description: p.description,
                pricingConfig: p.pricingConfig as any
            }
        });
    }

    console.log('Database seeded successfully.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
