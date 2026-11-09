import { prisma } from "./db";
import { estimateCost } from "./pricing";

export interface UsageEntry {
  apiKeyId: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  status: number;
  cached?: boolean;
}

export async function recordUsage(entry: UsageEntry): Promise<void> {
  await prisma.usageLog.create({
    data: {
      ...entry,
      // A cache hit never reached the AI, so it cost nothing
      costUsd: entry.cached ? 0 : estimateCost(entry.model, entry.inputTokens, entry.outputTokens),
    },
  });
}
