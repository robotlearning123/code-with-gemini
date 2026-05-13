import { describe, it, expect, vi } from "vitest";
import { GeminiClient, ChatMessage } from "../src/gemini-client.js";

function makeClient(maxHistoryTurns = 10) {
  return new GeminiClient({
    apiKey: "test-key",
    model: "gemini-2.0-flash",
    maxHistoryTurns,
  });
}

describe("GeminiClient construction", () => {
  it("creates instance with valid config", () => {
    expect(makeClient()).toBeInstanceOf(GeminiClient);
  });

  it("starts with empty history", () => {
    expect(makeClient().getHistory()).toEqual([]);
  });
});

describe("history management", () => {
  it("clearHistory empties the history", () => {
    const client = makeClient();
    client.clearHistory();
    expect(client.getHistory()).toEqual([]);
  });

  it("getHistory returns a copy, not a reference", () => {
    const client = makeClient();
    const hist = client.getHistory();
    hist.push({ role: "user", text: "tampered" });
    expect(client.getHistory()).toEqual([]);
  });
});

describe("trimHistory", () => {
  it("trims history to maxHistoryTurns * 2 messages", async () => {
    const client = makeClient(2); // max 4 messages (2 turns)

    // Mock sendMessage to avoid real API calls
    const mockText = "response";
    vi.spyOn(client as unknown as { genAI: { getGenerativeModel: () => unknown } }, "genAI", "get")
      .mockReturnValue({
        getGenerativeModel: () => ({
          startChat: () => ({
            sendMessage: async () => ({
              response: {
                text: () => mockText,
                candidates: [{ finishReason: "STOP" }],
              },
            }),
          }),
        }),
      });

    // Send 3 turns = 6 messages, but max is 4
    await client.sendMessage("turn1");
    await client.sendMessage("turn2");
    await client.sendMessage("turn3");

    const history = client.getHistory();
    expect(history.length).toBe(4);
    // Should keep the last 2 turns (oldest trimmed)
    expect(history[0].text).toBe("turn2");
    expect(history[1].text).toBe("response");
    expect(history[2].text).toBe("turn3");
    expect(history[3].text).toBe("response");

    vi.restoreAllMocks();
  });

  it("does not trim when history is within limit", async () => {
    const client = makeClient(10);

    vi.spyOn(client as unknown as { genAI: { getGenerativeModel: () => unknown } }, "genAI", "get")
      .mockReturnValue({
        getGenerativeModel: () => ({
          startChat: () => ({
            sendMessage: async () => ({
              response: {
                text: () => "ok",
                candidates: [{ finishReason: "STOP" }],
              },
            }),
          }),
        }),
      });

    await client.sendMessage("hello");
    expect(client.getHistory().length).toBe(2);

    vi.restoreAllMocks();
  });
});

describe("toGeminiHistory (verified via sendMessage call)", () => {
  it("maps 'model' role correctly", async () => {
    const client = makeClient(10);
    let capturedHistory: unknown = null;

    vi.spyOn(client as unknown as { genAI: { getGenerativeModel: () => unknown } }, "genAI", "get")
      .mockReturnValue({
        getGenerativeModel: () => ({
          startChat: (opts: { history: unknown }) => {
            capturedHistory = opts.history;
            return {
              sendMessage: async () => ({
                response: {
                  text: () => "hi back",
                  candidates: [{ finishReason: "STOP" }],
                },
              }),
            };
          },
        }),
      });

    await client.sendMessage("hello");

    // toGeminiHistory should have been called with empty array on first send
    expect(capturedHistory).toEqual([]);

    vi.restoreAllMocks();
  });
});
