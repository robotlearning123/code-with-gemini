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
});
