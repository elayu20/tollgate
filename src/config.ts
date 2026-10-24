import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: required("DATABASE_URL"),
  mockProviderUrl: process.env.MOCK_PROVIDER_URL ?? "http://localhost:4000",
  providerTimeoutMs: Number(process.env.PROVIDER_TIMEOUT_MS ?? 30000),
};