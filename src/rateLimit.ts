import type { FastifyReply, FastifyRequest } from "fastify";
import { redis } from "./redis";

const WINDOW_SECONDS = 60;

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetInSeconds: number;
}

// Fixed window: one counter per key per minute, deleted by Redis when the minute is up.
export async function checkRateLimit(apiKeyId: string, limit: number): Promise<RateLimitResult> {
  const window = Math.floor(Date.now() / 1000 / WINDOW_SECONDS);
  const counterKey = `ratelimit:${apiKeyId}:${window}`;

  const count = await redis.incr(counterKey);
  if (count === 1) {
    await redis.expire(counterKey, WINDOW_SECONDS);
  }

  const resetInSeconds = WINDOW_SECONDS - (Math.floor(Date.now() / 1000) % WINDOW_SECONDS);

  return {
    allowed: count <= limit,
    limit,
    remaining: Math.max(0, limit - count),
    resetInSeconds,
  };
}

// Runs after authenticate, so request.apiKey is always set here
export async function enforceRateLimit(request: FastifyRequest, reply: FastifyReply) {
  const apiKey = request.apiKey!;
  const result = await checkRateLimit(apiKey.id, apiKey.rateLimitRpm);

  reply.header("x-ratelimit-limit", result.limit);
  reply.header("x-ratelimit-remaining", result.remaining);
  reply.header("x-ratelimit-reset", result.resetInSeconds);

  if (!result.allowed) {
    reply.header("retry-after", result.resetInSeconds);
    return reply.code(429).send({ error: "rate limit exceeded" });
  }
}
