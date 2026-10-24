import Fastify from "fastify";
import { config } from "./config";
import { chatRoutes } from "./routes/chat";
import { ProviderError } from "./providers/types";

const app = Fastify({
  logger: { transport: { target: "pino-pretty" } },
});

app.get("/health", async () => {
  return { status: "ok" };
});

app.register(chatRoutes);

app.setErrorHandler((error, request, reply) => {
  if (error instanceof ProviderError) {
    request.log.warn({ provider: error.provider, status: error.status }, "provider error");
    return reply.code(502).send({ error: "upstream provider failed", provider: error.provider });
  }
  reply.send(error);
});

app.listen({ port: config.port, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});