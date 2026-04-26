import { PrismaClient, type Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function readRequiredEnv(name: string): string {
    const v = process.env[name];
    if (!v || !v.trim()) {
        throw new Error(
            `Variável obrigatória ${name} não definida no .env. ` +
                `Defina antes de rodar "npm run db:seed".`
        );
    }
    return v.trim();
}

async function seedAdmin() {
    const email = readRequiredEnv('SEED_ADMIN_EMAIL');
    const password = readRequiredEnv('SEED_ADMIN_PASSWORD');

    if (password.length < 8) {
        throw new Error('SEED_ADMIN_PASSWORD precisa ter pelo menos 8 caracteres.');
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.upsert({
        where: { email },
        update: { password: hashed, role: 'admin', name: 'Administrador' },
        create: {
            email,
            password: hashed,
            role: 'admin',
            name: 'Administrador',
        },
    });

    console.log(`✓ Admin '${user.email}' (${user.id}) pronto.`);
}

const productCatalog: Array<{
    id: string;
    name: string;
    category: string;
    pricePerM2: number;
    description: string;
    pricingConfig: Prisma.InputJsonValue;
}> = [
    {
        id: 'banner-380',
        name: 'Lona 380g',
        category: 'LONA',
        pricePerM2: 40.0,
        description: 'Lona econômica para promoções.',
        pricingConfig: {
            types: ['Banner Promocional'],
            finishings: ['Bainha e Ilhós', 'Sem Acabamento'],
        },
    },
    {
        id: 'banner-440',
        name: 'Lona 440g',
        category: 'LONA',
        pricePerM2: 50.0,
        description: 'Lona resistente para banners e fachadas.',
        pricingConfig: {
            types: ['Banner Promocional', 'Grandes Formatos'],
            finishings: ['Bainha e Ilhós', 'Bastão e Corda', 'Sem Acabamento'],
        },
    },
    {
        id: 'adesivo-vinil',
        name: 'Adesivo Vinil',
        category: 'ADESIVO',
        pricePerM2: 65.0,
        description: 'Adesivo vinil de alta qualidade.',
        pricingConfig: {
            types: ['Fosco', 'Brilhoso', 'Transparente'],
            pricesByType: { Fosco: 65.0, Brilhoso: 65.0, Transparente: 65.0 },
        },
    },
    {
        id: 'chapa-acm',
        name: 'ACM',
        category: 'ACM',
        pricePerM2: 120.0,
        description: 'Alumínio Composto para fachadas e placas.',
        pricingConfig: {},
    },
    {
        id: 'chapa-pvc',
        name: 'PVC Expandido',
        category: 'PVC',
        pricePerM2: 120.0,
        description: 'Placas de PVC para sinalização.',
        pricingConfig: {},
    },
    {
        id: 'chapa-ps',
        name: 'PS (Poliestireno)',
        category: 'PS',
        pricePerM2: 150.0,
        description: 'Material rígido e econômico.',
        pricingConfig: {},
    },
    {
        id: 'chapa-acrilico',
        name: 'Acrílico',
        category: 'ACRÍLICO',
        pricePerM2: 350.0,
        description: 'Material nobre com alto brilho.',
        pricingConfig: {
            hasThickness: true,
            thicknessOptions: ['1mm', '2mm', '3mm', '4mm', '5mm', '6mm', '8mm', '10mm', '12mm'],
            pricesByThickness: {
                '1mm': 280,
                '2mm': 350,
                '3mm': 500,
                '4mm': 650,
                '5mm': 800,
                '6mm': 950,
                '8mm': 1200,
                '10mm': 1400,
                '12mm': 1600,
            },
        },
    },
];

async function seedProducts() {
    for (const p of productCatalog) {
        await prisma.product.upsert({
            where: { id: p.id },
            update: {
                name: p.name,
                category: p.category,
                pricePerM2: p.pricePerM2,
                description: p.description,
                pricingConfig: p.pricingConfig,
            },
            create: p,
        });
    }
    console.log(`✓ ${productCatalog.length} produtos no catálogo.`);
}

async function main() {
    console.log('Seeding database...');
    await seedAdmin();
    await seedProducts();
    console.log('Database seeded successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
