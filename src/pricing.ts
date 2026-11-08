import { Prisma } from "@prisma/client";

// Prices in USD per million tokens
interface ModelPrice {
  input: number;
  output: number;
}

const PRICES: Record<string, ModelPrice> = {
  "mock-1": { input: 3, output: 15 },
};

const DEFAULT_MODEL = "mock-1";

export function estimateCost(model: string, inputTokens: number, outputTokens: number): Prisma.Decimal {
  const price = PRICES[model] ?? PRICES[DEFAULT_MODEL]!;

  const inputCost = new Prisma.Decimal(inputTokens).times(price.input);
  const outputCost = new Prisma.Decimal(outputTokens).times(price.output);

  return inputCost.plus(outputCost).dividedBy(1_000_000);
}
