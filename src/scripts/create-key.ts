import { prisma } from "../db";
import { generateApiKey, hashApiKey, keyPrefix } from "../auth/keys";

async function main() {
    const name = process.argv[2] ?? "dev";
    const rawKey = generateApiKey();

    const apiKey = await prisma.apiKey.create({
        data: {
            name,
            keyHash: hashApiKey(rawKey),
            prefix: keyPrefix(rawKey),
        },
    });

    console.log(`Created API key "${apiKey.name}" (id: ${apiKey.id})`);
    console.log(`\n ${rawKey}\n`);
    console.log("Save this now. It is not stored and cannot be shown again.");
}

main()
    .catch((err) => {
        console.error(err);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());