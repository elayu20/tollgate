import type { FastifyInstance } from "fastify";
import { mockProvider } from "../providers/mock";
import type { ChatMessage } from "../providers/types";

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

export async function chatRoutes(app: FastifyInstance) {
  app.post<{ Body: ChatBody }>("/v1/chat", { schema: { body: chatBodySchema } }, async (request) => {
    const { model = "mock-1", messages, max_tokens = 512 } = request.body;

    const response = await mockProvider.complete({ model, messages, maxTokens: max_tokens });

    return response;
  });
}