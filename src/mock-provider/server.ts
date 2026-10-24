import "dotenv/config";
import Fastify from "fastify";

const PORT = Number(process.env.MOCK_PORT ?? 4000);
const LATENCY_MS = Number(process.env.MOCK_LATENCY_MS ?? 1000);
const FAILURE_RATE = Number(process.env.MOCK_FAILURE_RATE ?? 0);

const CANNED_ANSWERS = [
  "A mutex is a lock that lets only one thread into a critical section at a time.",
  "Redis is an in-memory key-value store, often used for caching and rate limiting.",
  "A token bucket refills at a steady rate, and each request spends one token.",
  "Exponential backoff waits longer after each failed retry: 100ms, 200ms, 400ms.",
];

interface MockBody {
  model?: string;
  messages: { role: string; content: string }[];
}

// Rough estimate: about 4 characters per token for English text
const estimateTokens = (text: string) => Math.ceil(text.length / 4);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const app = Fastify();

app.post<{ Body: MockBody }>("/v1/messages", async (request, reply) => {
  await sleep(LATENCY_MS);

  if (Math.random() < FAILURE_RATE) {
    return reply.code(503).send({ error: "mock provider overloaded" });
  }

  const prompt = request.body.messages.map((m) => m.content).join("\n");
  const answer = CANNED_ANSWERS[prompt.length % CANNED_ANSWERS.length]!;

  return {
    id: `mock_${Date.now()}`,
    model: request.body.model ?? "mock-1",
    content: answer,
    usage: {
      input_tokens: estimateTokens(prompt),
      output_tokens: estimateTokens(answer),
    },
  };
});

app.listen({ port: PORT, host: "0.0.0.0" }).then(() => {
  console.log(`Mock provider on :${PORT} (latency ${LATENCY_MS}ms, failure rate ${FAILURE_RATE})`);
});