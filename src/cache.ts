import { createHash } from "node:crypto";
import { config } from "./config";
import { redis } from "./redis";
import type { ChatMessage, ChatResponse } from "./providers/types";

// Only fields that change the answer go in the key, so different users share cache hits
export function cacheKey(model: string, messages: ChatMessage[], maxTokens: number): string {
  const input = JSON.stringify({ model, messages, maxTokens });
  const hash = createHash("sha256").update(input).digest("hex");
  return `cache:${hash}`;
}

export async function getCached(key: string): Promise<ChatResponse | null> {
  const value = await redis.get(key);
  return value ? (JSON.parse(value) as ChatResponse) : null;
}

// "EX" makes Redis delete the entry on its own after the TTL, so memory stays bounded
// and answers can't go stale forever
export async function setCached(key: string, response: ChatResponse): Promise<void> {
  await redis.set(key, JSON.stringify(response), "EX", config.cacheTtlSeconds);
}
