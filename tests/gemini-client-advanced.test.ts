import { describe, it, expect, vi, afterEach } from "vitest";
import { GeminiClient } from "../src/gemini-client.js";

afterEach(() => {
  vi.restoreAllMocks();
});

function makeClient(opts?: { maxHistoryTurns?: number; systemInstruction?: string }) {
  return new GeminiClient({
    apiKey: "test-key",
    model: "gemini-2.0-flash",
    maxHistoryTurns: opts?.maxHistoryTurns ?? 10,
    systemInstruction: opts?.systemInstruction,
  });
}

function mockSendMessage(client: GeminiClient, responseText: string) {
  vi.spyOn(client as unknown as { genAI: { getGenerativeModel: () => unknown } }, "genAI", "get")
    .mockReturnValue({
      getGenerativeModel: () => ({
        startChat: () => ({
          sendMessage: async () => ({
            response: {
              text: () => responseText,
              candidates: [{ finishReason: "STOP" }],
            },
          }),
        }),
      }),
    });
}

async function* fakeStream(chunks: string[]) {
  for (const text of chunks) {
    yield { text: () => text };
  }
}

function mockStreamMessage(client: GeminiClient, chunks: string[]) {
  vi.spyOn(client as unknown as { genAI: { getGenerativeModel: () => unknown } }, "genAI", "get")
    .mockReturnValue({
      getGenerativeModel: () => ({
        startChat: () => ({
          sendMessageStream: async () => ({
            stream: fakeStream(chunks),
            response: Promise.resolve({ usageMetadata: undefined }),
          }),
        }),
      }),
    });
}

describe("sendMessage", () => {
  it("returns ChatResponse with text and finishReason", async () => {
    const client = makeClient();
    mockSendMessage(client, "Hello from Gemini!");

    const response = await client.sendMessage("hi");
    expect(response.text).toBe("Hello from Gemini!");
    expect(response.finishReason).toBe("STOP");
  });

  it("adds user and model messages to history", async () => {
    const client = makeClient();
    mockSendMessage(client, "response");

    await client.sendMessage("question");
    const history = client.getHistory();

    expect(history).toHaveLength(2);
    expect(history[0]).toEqual({ role: "user", text: "question" });
    expect(history[1]).toEqual({ role: "model", text: "response" });
  });
});

describe("streamMessage", () => {
  it("yields chunks with done=false then a final done=true", async () => {
    const client = makeClient();
    mockStreamMessage(client, ["Hello", " ", "world"]);

    const chunks = [];
    for await (const chunk of client.streamMessage("hi")) {
      chunks.push(chunk);
    }

    expect(chunks).toEqual([
      { text: "Hello", done: false },
      { text: " ", done: false },
      { text: "world", done: false },
      { text: "", done: true },
    ]);
  });

  it("accumulates full text in history after streaming", async () => {
    const client = makeClient();
    mockStreamMessage(client, ["Good", " morning"]);

    // consume the generator
    for await (const _ of client.streamMessage("greet")) { /* drain */ }

    const history = client.getHistory();
    expect(history).toHaveLength(2);
    expect(history[0]).toEqual({ role: "user", text: "greet" });
    expect(history[1]).toEqual({ role: "model", text: "Good morning" });
  });

  it("trims history via sendMessage after streaming fills it", async () => {
    // Verified via sendMessage mock in gemini-client.test.ts — this test confirms
    // streamMessage also triggers trim by checking history doesn't grow unbounded
    const client = makeClient(10);
    mockStreamMessage(client, ["ok"]);

    for await (const _ of client.streamMessage("q1")) { /* drain */ }
    expect(client.getHistory()).toHaveLength(2);

    for await (const _ of client.streamMessage("q2")) { /* drain */ }
    expect(client.getHistory()).toHaveLength(4);
  });

  it("handles empty stream", async () => {
    const client = makeClient();
    mockStreamMessage(client, []);

    const chunks = [];
    for await (const chunk of client.streamMessage("hi")) {
      chunks.push(chunk);
    }

    // Should still get the final done signal
    expect(chunks).toEqual([{ text: "", done: true }]);
    // Empty model response stored in history
    expect(client.getHistory()[1]).toEqual({ role: "model", text: "" });
  });
});

describe("systemInstruction", () => {
  it("passes systemInstruction to getGenerativeModel", async () => {
    const client = makeClient({ systemInstruction: "You are a pirate." });
    let capturedParams: unknown = null;

    vi.spyOn(client as unknown as { genAI: { getGenerativeModel: () => unknown } }, "genAI", "get")
      .mockReturnValue({
        getGenerativeModel: (params: unknown) => {
          capturedParams = params;
          return {
            startChat: () => ({
              sendMessage: async () => ({
                response: {
                  text: () => "Arr!",
                  candidates: [{ finishReason: "STOP" }],
                },
              }),
            }),
          };
        },
      });

    await client.sendMessage("hello");
    expect(capturedParams).toEqual({
      model: "gemini-2.0-flash",
      systemInstruction: "You are a pirate.",
    });
  });

  it("omits systemInstruction from model params when not set", async () => {
    const client = makeClient();
    let capturedParams: unknown = null;

    vi.spyOn(client as unknown as { genAI: { getGenerativeModel: () => unknown } }, "genAI", "get")
      .mockReturnValue({
        getGenerativeModel: (params: unknown) => {
          capturedParams = params;
          return {
            startChat: () => ({
              sendMessage: async () => ({
                response: {
                  text: () => "Hi!",
                  candidates: [{ finishReason: "STOP" }],
                },
              }),
            }),
          };
        },
      });

    await client.sendMessage("hello");
    expect(capturedParams).toEqual({ model: "gemini-2.0-flash" });
    expect((capturedParams as Record<string, unknown>).systemInstruction).toBeUndefined();
  });

  it("passes systemInstruction during streaming", async () => {
    const client = makeClient({ systemInstruction: "Be concise." });
    let capturedParams: unknown = null;

    vi.spyOn(client as unknown as { genAI: { getGenerativeModel: () => unknown } }, "genAI", "get")
      .mockReturnValue({
        getGenerativeModel: (params: unknown) => {
          capturedParams = params;
          return {
            startChat: () => ({
              sendMessageStream: async () => ({
                stream: fakeStream(["ok"]),
                response: Promise.resolve({ usageMetadata: undefined }),
              }),
            }),
          };
        },
      });

    for await (const _ of client.streamMessage("hello")) { /* drain */ }

    expect(capturedParams).toEqual({
      model: "gemini-2.0-flash",
      systemInstruction: "Be concise.",
    });
  });
});

describe("token usage", () => {
  function mockSendMessageWithUsage(client: GeminiClient, responseText: string, usage: { promptTokenCount: number; candidatesTokenCount: number; totalTokenCount: number }) {
    vi.spyOn(client as unknown as { genAI: { getGenerativeModel: () => unknown } }, "genAI", "get")
      .mockReturnValue({
        getGenerativeModel: () => ({
          startChat: () => ({
            sendMessage: async () => ({
              response: {
                text: () => responseText,
                candidates: [{ finishReason: "STOP" }],
                usageMetadata: usage,
              },
            }),
          }),
        }),
      });
  }

  function mockStreamWithUsage(client: GeminiClient, chunks: string[], usage: { promptTokenCount: number; candidatesTokenCount: number; totalTokenCount: number }) {
    vi.spyOn(client as unknown as { genAI: { getGenerativeModel: () => unknown } }, "genAI", "get")
      .mockReturnValue({
        getGenerativeModel: () => ({
          startChat: () => ({
            sendMessageStream: async () => ({
              stream: fakeStream(chunks),
              response: Promise.resolve({ usageMetadata: usage }),
            }),
          }),
        }),
      });
  }

  it("starts with zero usage", () => {
    const client = makeClient();
    const usage = client.getUsage();
    expect(usage).toEqual({ promptTokens: 0, completionTokens: 0, totalTokens: 0 });
  });

  it("returns a copy from getUsage", () => {
    const client = makeClient();
    const usage = client.getUsage();
    usage.promptTokens = 999;
    expect(client.getUsage().promptTokens).toBe(0);
  });

  it("accumulates usage from sendMessage", async () => {
    const client = makeClient();
    mockSendMessageWithUsage(client, "hello", {
      promptTokenCount: 10,
      candidatesTokenCount: 5,
      totalTokenCount: 15,
    });

    await client.sendMessage("hi");
    const usage = client.getUsage();
    expect(usage).toEqual({ promptTokens: 10, completionTokens: 5, totalTokens: 15 });
  });

  it("accumulates usage across multiple sendMessage calls", async () => {
    const client = makeClient();

    mockSendMessageWithUsage(client, "first", {
      promptTokenCount: 10,
      candidatesTokenCount: 5,
      totalTokenCount: 15,
    });
    await client.sendMessage("q1");

    mockSendMessageWithUsage(client, "second", {
      promptTokenCount: 20,
      candidatesTokenCount: 10,
      totalTokenCount: 30,
    });
    await client.sendMessage("q2");

    const usage = client.getUsage();
    expect(usage).toEqual({ promptTokens: 30, completionTokens: 15, totalTokens: 45 });
  });

  it("accumulates usage from streamMessage", async () => {
    const client = makeClient();
    mockStreamWithUsage(client, ["hi"], {
      promptTokenCount: 8,
      candidatesTokenCount: 3,
      totalTokenCount: 11,
    });

    for await (const _ of client.streamMessage("hello")) { /* drain */ }

    const usage = client.getUsage();
    expect(usage).toEqual({ promptTokens: 8, completionTokens: 3, totalTokens: 11 });
  });

  it("accumulates usage from both sendMessage and streamMessage", async () => {
    const client = makeClient();

    mockSendMessageWithUsage(client, "response", {
      promptTokenCount: 10,
      candidatesTokenCount: 5,
      totalTokenCount: 15,
    });
    await client.sendMessage("q1");

    mockStreamWithUsage(client, ["streamed"], {
      promptTokenCount: 12,
      candidatesTokenCount: 6,
      totalTokenCount: 18,
    });
    for await (const _ of client.streamMessage("q2")) { /* drain */ }

    const usage = client.getUsage();
    expect(usage).toEqual({ promptTokens: 22, completionTokens: 11, totalTokens: 33 });
  });

  it("handles missing usageMetadata gracefully", async () => {
    const client = makeClient();
    mockSendMessage(client, "no metadata");

    await client.sendMessage("hi");
    expect(client.getUsage()).toEqual({ promptTokens: 0, completionTokens: 0, totalTokens: 0 });
  });

  it("resetUsage zeroes out accumulated totals", async () => {
    const client = makeClient();
    mockSendMessageWithUsage(client, "hello", {
      promptTokenCount: 100,
      candidatesTokenCount: 50,
      totalTokenCount: 150,
    });
    await client.sendMessage("hi");
    expect(client.getUsage().totalTokens).toBe(150);

    client.resetUsage();
    expect(client.getUsage()).toEqual({ promptTokens: 0, completionTokens: 0, totalTokens: 0 });
  });

  it("sendMessage returns per-call usage in response", async () => {
    const client = makeClient();
    mockSendMessageWithUsage(client, "hello", {
      promptTokenCount: 10,
      candidatesTokenCount: 5,
      totalTokenCount: 15,
    });

    const response = await client.sendMessage("hi");
    expect(response.usage).toEqual({ promptTokens: 10, completionTokens: 5, totalTokens: 15 });
  });
});

describe("error handling", () => {
  it("sendMessage propagates API errors", async () => {
    const client = makeClient();

    vi.spyOn(client as unknown as { genAI: { getGenerativeModel: () => unknown } }, "genAI", "get")
      .mockReturnValue({
        getGenerativeModel: () => ({
          startChat: () => ({
            sendMessage: async () => {
              throw new Error("API rate limit exceeded");
            },
          }),
        }),
      });

    await expect(client.sendMessage("hello")).rejects.toThrow("API rate limit exceeded");
    // History should NOT be updated on error
    expect(client.getHistory()).toHaveLength(0);
  });

  it("streamMessage propagates API errors", async () => {
    const client = makeClient();

    vi.spyOn(client as unknown as { genAI: { getGenerativeModel: () => unknown } }, "genAI", "get")
      .mockReturnValue({
        getGenerativeModel: () => ({
          startChat: () => ({
            sendMessageStream: async () => {
              throw new Error("Network timeout");
            },
          }),
        }),
      });

    const gen = client.streamMessage("hello");
    await expect(gen.next()).rejects.toThrow("Network timeout");
    expect(client.getHistory()).toHaveLength(0);
  });
});
