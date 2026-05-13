import { describe, it, expect } from "vitest";
import { loadConfig, validateConfig, ConfigError } from "../src/config.js";

describe("loadConfig", () => {
  it("throws ConfigError when GEMINI_API_KEY is missing", () => {
    expect(() => loadConfig({})).toThrow(ConfigError);
    expect(() => loadConfig({})).toThrow("GEMINI_API_KEY is required");
  });

  it("throws ConfigError when GEMINI_API_KEY is whitespace-only", () => {
    expect(() => loadConfig({ GEMINI_API_KEY: "   " })).toThrow(ConfigError);
  });

  it("returns valid config with defaults when API key is provided", () => {
    const config = loadConfig({ GEMINI_API_KEY: "test-key-123" });
    expect(config.apiKey).toBe("test-key-123");
    expect(config.model).toBe("gemini-2.0-flash");
    expect(config.maxHistoryTurns).toBe(20);
  });

  it("respects GEMINI_MODEL env override", () => {
    const config = loadConfig({
      GEMINI_API_KEY: "test-key",
      GEMINI_MODEL: "gemini-1.5-pro",
    });
    expect(config.model).toBe("gemini-1.5-pro");
  });

  it("respects GEMINI_MAX_HISTORY env override", () => {
    const config = loadConfig({
      GEMINI_API_KEY: "test-key",
      GEMINI_MAX_HISTORY: "5",
    });
    expect(config.maxHistoryTurns).toBe(5);
  });

  it("includes systemInstruction when GEMINI_SYSTEM_PROMPT is set", () => {
    const config = loadConfig({
      GEMINI_API_KEY: "test-key",
      GEMINI_SYSTEM_PROMPT: "You are a concise coding assistant.",
    });
    expect(config.systemInstruction).toBe("You are a concise coding assistant.");
  });

  it("omits systemInstruction when GEMINI_SYSTEM_PROMPT is not set", () => {
    const config = loadConfig({ GEMINI_API_KEY: "test-key" });
    expect(config.systemInstruction).toBeUndefined();
  });

  it("omits systemInstruction when GEMINI_SYSTEM_PROMPT is whitespace-only", () => {
    const config = loadConfig({
      GEMINI_API_KEY: "test-key",
      GEMINI_SYSTEM_PROMPT: "   ",
    });
    expect(config.systemInstruction).toBeUndefined();
  });
});

describe("validateConfig", () => {
  it("passes for valid config", () => {
    expect(() =>
      validateConfig({ apiKey: "valid", model: "gemini-2.0-flash", maxHistoryTurns: 10 })
    ).not.toThrow();
  });

  it("throws for empty apiKey", () => {
    expect(() =>
      validateConfig({ apiKey: "", model: "gemini-2.0-flash", maxHistoryTurns: 10 })
    ).toThrow(ConfigError);
  });

  it("throws for zero maxHistoryTurns", () => {
    expect(() =>
      validateConfig({ apiKey: "valid", model: "gemini-2.0-flash", maxHistoryTurns: 0 })
    ).toThrow(ConfigError);
  });

  it("throws for NaN maxHistoryTurns", () => {
    expect(() =>
      validateConfig({ apiKey: "valid", model: "gemini-2.0-flash", maxHistoryTurns: NaN })
    ).toThrow("must be a valid number");
  });
});

describe("loadConfig validation", () => {
  it("throws ConfigError for non-numeric GEMINI_MAX_HISTORY", () => {
    expect(() =>
      loadConfig({ GEMINI_API_KEY: "test-key", GEMINI_MAX_HISTORY: "abc" })
    ).toThrow(ConfigError);
  });

  it("throws ConfigError for GEMINI_MAX_HISTORY of zero", () => {
    expect(() =>
      loadConfig({ GEMINI_API_KEY: "test-key", GEMINI_MAX_HISTORY: "0" })
    ).toThrow(ConfigError);
  });
});
