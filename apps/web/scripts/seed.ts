import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PLATFORMS = [
    { name: "Revu", base_url: "https://www.revu.net" },
    { name: "Reviewnote", base_url: "https://www.reviewnote.co.kr" },
    { name: "DinnerQueen", base_url: "https://dinnerqueen.net" },
    { name: "ReviewPlace", base_url: "https://www.reviewplace.co.kr" },
    { name: "Seouloppa", base_url: "https://seouloppa.net" },
    { name: "MrBlog", base_url: "https://mrblog.net" },
    { name: "GangnamFood", base_url: "https://gangnamfood.net" },
];

async function main() {
    console.log("Seeding platforms...");
    for (const plat of PLATFORMS) {
        await prisma.platform.upsert({
            where: { name: plat.name },
            update: {},
            create: plat,
        });
    }
    console.log("Seeding complete.");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
