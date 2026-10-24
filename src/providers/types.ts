export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  maxTokens: number;
}

export interface ChatResponse {
  provider: string;
  model: string;
  content: string;
  usage: { inputTokens: number; outputTokens: number };
}

export interface Provider {
  name: string;
  complete(req: ChatRequest): Promise<ChatResponse>;
}

export class ProviderError extends Error {
  constructor(
    public provider: string,
    public status: number, // HTTP status from the provider, or 0 if it never answered
    message: string,
  ) {
    super(message);
  }
}