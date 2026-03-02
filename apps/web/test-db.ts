import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgresql://postgres:bobo0422!%40@db.nndvrtqcvrdwpsedoljz.supabase.co:5432/postgres",
        },
    },
});

async function testConnection() {
    try {
        const count = await prisma.campaign.count();
        console.log("Success! count=", count);
    } catch (e) {
        console.error("Failed:", e);
    }
}
testConnection();
