// @ts-nocheck
import { PrismaClient } from "@prisma/client";

declare global {
    var prisma: PrismaClient | undefined;
}

const prismaClientSingleton = () => {
    return new PrismaClient();
};

const prisma = (globalThis as any).prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") {
    (globalThis as any).prisma = prisma;
}
