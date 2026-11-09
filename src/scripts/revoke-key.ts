import { prisma } from "../db";

async function main() {
    const id = process.argv[2];
    if (!id) {
        console.error("Usage: npm run revoke-key -- <key id>");
        process.exitCode = 1;
        return;
    }

    const existing = await prisma.apiKey.findUnique({ where: { id } });
    if (!existing) {
        console.error(`No API key with id ${id}`);
        process.exitCode = 1;
        return;
    }
    if (existing.revokedAt) {
        console.log(`Key "${existing.name}" was already revoked at ${existing.revokedAt.toISOString()}`);
        return;
    }

    const apiKey = await prisma.apiKey.update({
        where: { id },
        data: { revokedAt: new Date() },
    });

    console.log(`Revoked API key "${apiKey.name}" (${apiKey.prefix}...)`);
}

main()
    .catch((err) => {
        console.error(err);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
