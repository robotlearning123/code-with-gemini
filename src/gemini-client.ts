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

      return {
        text,
        finishReason: response.candidates?.[0]?.finishReason,
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
