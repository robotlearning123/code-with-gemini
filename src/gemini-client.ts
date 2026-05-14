import {
  GoogleGenerativeAI,
  Content,
  Part,
  GenerateContentResult,
  GenerateContentStreamResult,
} from "@google/generative-ai";
import { AppConfig } from "./config.js";
import { withRetry } from "./retry.js";

export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export interface ChatResponse {
  text: string;
  finishReason?: string;
  usage?: TokenUsage;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface StreamChunk {
  text: string;
  done: boolean;
}

export class GeminiClient {
  private genAI: GoogleGenerativeAI;
  private model: string;
  private maxHistoryTurns: number;
  private systemInstruction?: string;
  private history: ChatMessage[] = [];
  private totalUsage: TokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

  constructor(config: AppConfig) {
    this.genAI = new GoogleGenerativeAI(config.apiKey);
    this.model = config.model;
    this.maxHistoryTurns = config.maxHistoryTurns;
    this.systemInstruction = config.systemInstruction;
  }

  getHistory(): ChatMessage[] {
    return [...this.history];
  }

  getModel(): string {
    return this.model;
  }

  setModel(model: string): void {
    this.model = model;
  }

  clearHistory(): void {
    this.history = [];
  }

  loadHistory(messages: ChatMessage[]): void {
    this.history = messages.slice();
    this.trimHistory();
  }

  getUsage(): TokenUsage {
    return { ...this.totalUsage };
  }

  resetUsage(): void {
    this.totalUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  }

  private accumulateUsage(usage: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number } | undefined): void {
    if (!usage) return;
    this.totalUsage.promptTokens += usage.promptTokenCount ?? 0;
    this.totalUsage.completionTokens += usage.candidatesTokenCount ?? 0;
    this.totalUsage.totalTokens += usage.totalTokenCount ?? 0;
  }

  private trimHistory(): void {
    const maxMessages = this.maxHistoryTurns * 2;
    if (this.history.length > maxMessages) {
      this.history = this.history.slice(-maxMessages);
    }
  }

  private toGeminiHistory(): Content[] {
    return this.history.map((msg) => ({
      role: msg.role === "model" ? "model" : "user",
      parts: [{ text: msg.text }] as Part[],
    }));
  }

  private getModelParams(): { model: string; systemInstruction?: string } {
    return {
      model: this.model,
      ...(this.systemInstruction ? { systemInstruction: this.systemInstruction } : {}),
    };
  }

  async sendMessage(prompt: string): Promise<ChatResponse> {
    return withRetry(async () => {
      const generativeModel = this.genAI.getGenerativeModel(this.getModelParams());
      const chat = generativeModel.startChat({
        history: this.toGeminiHistory(),
      });

      const result: GenerateContentResult = await chat.sendMessage(prompt);
      const response = result.response;
      const text = response.text();

      this.history.push({ role: "user", text: prompt });
      this.history.push({ role: "model", text });
      this.trimHistory();

      this.accumulateUsage(response.usageMetadata);

      return {
        text,
        finishReason: response.candidates?.[0]?.finishReason,
        usage: response.usageMetadata
          ? {
              promptTokens: response.usageMetadata.promptTokenCount ?? 0,
              completionTokens: response.usageMetadata.candidatesTokenCount ?? 0,
              totalTokens: response.usageMetadata.totalTokenCount ?? 0,
            }
          : undefined,
      };
    });
  }

  async *streamMessage(prompt: string): AsyncGenerator<StreamChunk> {
    const generativeModel = this.genAI.getGenerativeModel(this.getModelParams());
    const chat = generativeModel.startChat({
      history: this.toGeminiHistory(),
    });

    const stream: GenerateContentStreamResult = await withRetry(() =>
      chat.sendMessageStream(prompt)
    );

    let fullText = "";
    for await (const chunk of stream.stream) {
      const chunkText = chunk.text();
      fullText += chunkText;
      yield { text: chunkText, done: false };
    }

    this.accumulateUsage((await stream.response).usageMetadata);

    this.history.push({ role: "user", text: prompt });
    this.history.push({ role: "model", text: fullText });
    this.trimHistory();

    yield { text: "", done: true };
  }
}

export function formatMessage(msg: ChatMessage): string {
  const tag = msg.role === "user" ? "You" : "Gemini";
  return `[${tag}]: ${msg.text}`;
}
