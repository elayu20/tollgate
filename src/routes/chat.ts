import { authenticate } from "../auth/authenticate";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { mockProvider } from "../providers/mock";
import { type ChatMessage, ProviderError } from "../providers/types";
import { recordUsage, type UsageEntry } from "../usage";

interface ChatBody {
  model?: string;
  messages: ChatMessage[];
  max_tokens?: number;
}

const chatBodySchema = {
  type: "object",
  required: ["messages"],
  properties: {
    model: { type: "string" },
    max_tokens: { type: "integer", minimum: 1, maximum: 4096 },
    messages: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        required: ["role", "content"],
        properties: {
          role: { type: "string", enum: ["user", "assistant"] },
          content: { type: "string", minLength: 1 },
        },
      },
    },
  },
} as const;

// Don't make the user wait for the log write, and don't fail their request if it breaks
function recordInBackground(request: FastifyRequest, entry: UsageEntry) {
  recordUsage(entry).catch((err) => request.log.error({ err }, "failed to record usage"));
}

export async function chatRoutes(app: FastifyInstance) {
  app.decorateRequest("apiKey", null);
  app.addHook("onRequest", authenticate);

  app.post<{ Body: ChatBody }>("/v1/chat", { schema: { body: chatBodySchema } }, async (request) => {
    const { model = "mock-1", messages, max_tokens = 512 } = request.body;
    const apiKeyId = request.apiKey!.id; // the onRequest hook guarantees a key by now
    const start = performance.now();

    try {
      const response = await mockProvider.complete({ model, messages, maxTokens: max_tokens });

      recordInBackground(request, {
        apiKeyId,
        provider: response.provider,
        model: response.model,
        inputTokens: response.usage.inputTokens,
        outputTokens: response.usage.outputTokens,
        latencyMs: Math.round(performance.now() - start),
        status: 200,
      });

      return response;
    } catch (err) {
      recordInBackground(request, {
        apiKeyId,
        provider: mockProvider.name,
        model,
        inputTokens: 0,
        outputTokens: 0,
        latencyMs: Math.round(performance.now() - start),
        status: err instanceof ProviderError ? 502 : 500,
      });

      throw err;
    }
  });
}