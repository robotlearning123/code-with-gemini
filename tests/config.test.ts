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

describe("generation config", () => {
  it("parses GEMINI_TEMPERATURE", () => {
    const config = loadConfig({ GEMINI_API_KEY: "key", GEMINI_TEMPERATURE: "0.7" });
    expect(config.generationConfig).toBeDefined();
    expect(config.generationConfig!.temperature).toBe(0.7);
  });

  it("parses GEMINI_TOP_P", () => {
    const config = loadConfig({ GEMINI_API_KEY: "key", GEMINI_TOP_P: "0.9" });
    expect(config.generationConfig!.topP).toBe(0.9);
  });

  it("parses GEMINI_TOP_K", () => {
    const config = loadConfig({ GEMINI_API_KEY: "key", GEMINI_TOP_K: "40" });
    expect(config.generationConfig!.topK).toBe(40);
  });

  it("parses GEMINI_MAX_OUTPUT_TOKENS", () => {
    const config = loadConfig({ GEMINI_API_KEY: "key", GEMINI_MAX_OUTPUT_TOKENS: "1024" });
    expect(config.generationConfig!.maxOutputTokens).toBe(1024);
  });

  it("parses multiple generation config env vars together", () => {
    const config = loadConfig({
      GEMINI_API_KEY: "key",
      GEMINI_TEMPERATURE: "1.2",
      GEMINI_TOP_P: "0.5",
      GEMINI_TOP_K: "20",
    });
    expect(config.generationConfig).toEqual({
      temperature: 1.2,
      topP: 0.5,
      topK: 20,
    });
  });

  it("omits generationConfig when no env vars are set", () => {
    const config = loadConfig({ GEMINI_API_KEY: "key" });
    expect(config.generationConfig).toBeUndefined();
  });

  it("ignores non-numeric GEMINI_TEMPERATURE", () => {
    const config = loadConfig({ GEMINI_API_KEY: "key", GEMINI_TEMPERATURE: "hot" });
    expect(config.generationConfig).toBeUndefined();
  });

  it("throws for temperature below 0", () => {
    expect(() =>
      loadConfig({ GEMINI_API_KEY: "key", GEMINI_TEMPERATURE: "-0.1" })
    ).toThrow("temperature must be between 0 and 2");
  });

  it("throws for temperature above 2", () => {
    expect(() =>
      loadConfig({ GEMINI_API_KEY: "key", GEMINI_TEMPERATURE: "2.5" })
    ).toThrow("temperature must be between 0 and 2");
  });

  it("accepts temperature at boundaries (0 and 2)", () => {
    const c0 = loadConfig({ GEMINI_API_KEY: "key", GEMINI_TEMPERATURE: "0" });
    expect(c0.generationConfig!.temperature).toBe(0);
    const c2 = loadConfig({ GEMINI_API_KEY: "key", GEMINI_TEMPERATURE: "2" });
    expect(c2.generationConfig!.temperature).toBe(2);
  });

  it("throws for topP below 0", () => {
    expect(() =>
      loadConfig({ GEMINI_API_KEY: "key", GEMINI_TOP_P: "-0.1" })
    ).toThrow("topP must be between 0 and 1");
  });

  it("throws for topP above 1", () => {
    expect(() =>
      loadConfig({ GEMINI_API_KEY: "key", GEMINI_TOP_P: "1.5" })
    ).toThrow("topP must be between 0 and 1");
  });

  it("throws for topK below 1", () => {
    expect(() =>
      loadConfig({ GEMINI_API_KEY: "key", GEMINI_TOP_K: "0" })
    ).toThrow("topK must be >= 1");
  });

  it("throws for maxOutputTokens below 1", () => {
    expect(() =>
      loadConfig({ GEMINI_API_KEY: "key", GEMINI_MAX_OUTPUT_TOKENS: "0" })
    ).toThrow("maxOutputTokens must be >= 1");
  });
});
