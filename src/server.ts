import Fastify from "fastify";

const app = Fastify({
  logger: { transport: { target: "pino-pretty" } },
});

app.get("/health", async () => {
  return { status: "ok" };
});

const PORT = 3000;

app.listen({ port: PORT, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});