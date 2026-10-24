import { config } from "../config";
import { type ChatRequest, type ChatResponse, type Provider, ProviderError } from "./types";

interface MockApiResponse {
  model: string;
  content: string;
  usage: { input_tokens: number; output_tokens: number };
}

export const mockProvider: Provider = {
  name: "mock",

  async complete(req: ChatRequest): Promise<ChatResponse> {
    let res: Response;
    try {
      res = await fetch(`${config.mockProviderUrl}/v1/messages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model: req.model,
          messages: req.messages,
          max_tokens: req.maxTokens,
        }),
        signal: AbortSignal.timeout(config.providerTimeoutMs),
      });
    } catch (err) {
      // Never got a response: connection refused, DNS failure, or timeout
      throw new ProviderError("mock", 0, String(err));
    }

    if (!res.ok) {
      throw new ProviderError("mock", res.status, await res.text());
    }

    const data = (await res.json()) as MockApiResponse;

    return {
      provider: "mock",
      model: data.model,
      content: data.content,
      usage: {
        inputTokens: data.usage.input_tokens,
        outputTokens: data.usage.output_tokens,
      },
    };
  },
};