import { createHash, randomBytes } from "node:crypto";

const KEY_PREFIX = "tg_live_";

export function generateApiKey(): string {
    return KEY_PREFIX + randomBytes(24).toString("base64url");
}

export function hashApiKey(rawKey: string): string {
    return createHash("sha256").update(rawKey).digest("hex");
}

export function keyPrefix(rawKey: string): string {
    return rawKey.slice(0, KEY_PREFIX.length + 4);
}