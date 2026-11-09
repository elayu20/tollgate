import type { FastifyReply, FastifyRequest } from "fastify";
import { redis } from "./redis";

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetInSeconds: number; // until the bucket is full again
  retryAfterSeconds: number; // until the next token, 0 if allowed
}

// Token bucket, run inside Redis as one Lua script so two requests at the same
// moment can't both read the same token count and both spend the last token.
// The bucket is a hash: { tokens, updatedAt (ms) }.
const TOKEN_BUCKET_SCRIPT = `
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refillPerMs = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

local bucket = redis.call("HMGET", key, "tokens", "updatedAt")
local tokens = tonumber(bucket[1]) or capacity
local updatedAt = tonumber(bucket[2]) or now

tokens = math.min(capacity, tokens + (now - updatedAt) * refillPerMs)

local allowed = 0
if tokens >= 1 then
  tokens = tokens - 1
  allowed = 1
end

redis.call("HSET", key, "tokens", tokens, "updatedAt", now)
redis.call("PEXPIRE", key, math.ceil(capacity / refillPerMs))

return { allowed, tostring(tokens) }
`;

export async function checkRateLimit(apiKeyId: string, limit: number): Promise<RateLimitResult> {
  const refillPerMs = limit / 60_000; // limit is per minute

  const [allowed, tokensLeft] = (await redis.eval(
    TOKEN_BUCKET_SCRIPT,
    1,
    `ratelimit:${apiKeyId}`,
    limit,
    refillPerMs,
    Date.now(), // the gateway's clock; Docker Desktop's VM clock (Redis TIME) drifts on Windows
  )) as [number, string];

  const tokens = Number(tokensLeft);
  const msPerToken = 1 / refillPerMs;

  return {
    allowed: allowed === 1,
    limit,
    remaining: Math.floor(tokens),
    resetInSeconds: Math.ceil(((limit - tokens) * msPerToken) / 1000),
    retryAfterSeconds: allowed === 1 ? 0 : Math.ceil(((1 - tokens) * msPerToken) / 1000),
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
    reply.header("retry-after", result.retryAfterSeconds);
    return reply.code(429).send({ error: "rate limit exceeded" });
  }
}
