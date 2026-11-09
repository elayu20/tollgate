import { createHash } from "node:crypto";
import type { ChatMessage } from "./providers/types";

// Only fields that change the answer go in the key, so different users share cache hits
export function cacheKey(model: string, messages: ChatMessage[], maxTokens: number): string {
  const input = JSON.stringify({ model, messages, maxTokens });
  const hash = createHash("sha256").update(input).digest("hex");
  return `cache:${hash}`;
}
