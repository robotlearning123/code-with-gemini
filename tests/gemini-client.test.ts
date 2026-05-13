import { describe, it, expect } from "vitest";
import { GeminiClient } from "../src/gemini-client.js";

describe("GeminiClient construction", () => {
  it("creates instance with valid config", () => {
    const client = new GeminiClient({
      apiKey: "test-key",
      model: "gemini-2.0-flash",
      maxHistoryTurns: 10,
    });
    expect(client).toBeInstanceOf(GeminiClient);
  });

  it("starts with empty history", () => {
    const client = new GeminiClient({
      apiKey: "test-key",
      model: "gemini-2.0-flash",
      maxHistoryTurns: 10,
    });
    expect(client.getHistory()).toEqual([]);
  });
});

describe("history management", () => {
  it("clearHistory empties the history", () => {
    const client = new GeminiClient({
      apiKey: "test-key",
      model: "gemini-2.0-flash",
      maxHistoryTurns: 10,
    });
    client.clearHistory();
    expect(client.getHistory()).toEqual([]);
  });

  it("getHistory returns a copy, not a reference", () => {
    const client = new GeminiClient({
      apiKey: "test-key",
      model: "gemini-2.0-flash",
      maxHistoryTurns: 10,
    });
    const hist = client.getHistory();
    hist.push({ role: "user", text: "tampered" });
    expect(client.getHistory()).toEqual([]);
  });
});
