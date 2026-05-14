import { describe, it, expect, vi, afterEach } from "vitest";
import { main, classifyError } from "../src/index.js";

afterEach(() => {
  vi.restoreAllMocks();
});

// Capture console output
function captureConsole() {
  const logs: string[] = [];
  const errors: string[] = [];
  const origLog = console.log;
  const origError = console.error;
  console.log = (...args: unknown[]) => logs.push(args.map(String).join(" "));
  console.error = (...args: unknown[]) => errors.push(args.map(String).join(" "));
  return {
    logs,
    errors,
    restore() {
      console.log = origLog;
      console.error = origError;
    },
  };
}

describe("main --version", () => {
  it("prints version and exits with --version", async () => {
    const cap = captureConsole();
    await main(["--version"]);
    cap.restore();
    expect(cap.logs.join("\n")).toContain("gemini-chat v");
  });

  it("prints version and exits with -v", async () => {
    const cap = captureConsole();
    await main(["-v"]);
    cap.restore();
    expect(cap.logs.join("\n")).toContain("gemini-chat v");
  });
});

describe("main --help", () => {
  it("prints help text with --help", async () => {
    const cap = captureConsole();
    await main(["--help"]);
    cap.restore();
    const output = cap.logs.join("\n");
    expect(output).toContain("Interactive Gemini chat client");
    expect(output).toContain("GEMINI_API_KEY");
    expect(output).toContain("--version");
  });

  it("prints help text with -h", async () => {
    const cap = captureConsole();
    await main(["-h"]);
    cap.restore();
    expect(cap.logs.join("\n")).toContain("Usage");
  });
});

describe("main missing API key", () => {
  it("prints error and exits when GEMINI_API_KEY is not set", async () => {
    const original = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    const cap = captureConsole();
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });

    await expect(main([])).rejects.toThrow("process.exit called");
    cap.restore();

    expect(cap.errors.join("\n")).toContain("GEMINI_API_KEY is required");
    expect(exitSpy).toHaveBeenCalledWith(1);

    if (original) process.env.GEMINI_API_KEY = original;
    exitSpy.mockRestore();
  });
});

describe("classifyError", () => {
  it("classifies API key errors", () => {
    expect(classifyError("invalid api key provided")).toContain("Invalid API key");
  });

  it("classifies rate limit errors", () => {
    expect(classifyError("API rate limit exceeded")).toContain("rate limit or quota");
  });

  it("classifies quota errors", () => {
    expect(classifyError("Resource exhausted: quota")).toContain("rate limit or quota");
  });

  it("classifies 429 errors", () => {
    expect(classifyError("Request failed with 429")).toContain("rate limit or quota");
  });

  it("classifies permission errors", () => {
    expect(classifyError("403 Forbidden")).toContain("access denied");
  });

  it("classifies model not found errors", () => {
    expect(classifyError("Model not found: gemini-xxx")).toContain("Model not found");
  });

  it("classifies network errors", () => {
    expect(classifyError("ECONNREFUSED network error")).toContain("Network error");
  });

  it("classifies safety filter errors", () => {
    expect(classifyError("Response blocked by safety")).toContain("safety filters");
  });

  it("passes through unknown errors unchanged", () => {
    expect(classifyError("Something unexpected happened")).toBe("Something unexpected happened");
  });
});
