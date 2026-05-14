import { describe, it, expect, vi, afterEach } from "vitest";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("readStdin", () => {
  it("reads all chunks from stdin and resolves on end", async () => {
    // Dynamic import to get the module with readStdin
    const { readStdin } = await import("../src/index.js");

    const chunks = ["Hello ", "from ", "stdin"];
    let dataIdx = 0;
    const handlers: Record<string, (...args: unknown[]) => void> = {};

    vi.spyOn(process.stdin, "on").mockImplementation((event: string, handler: (...args: unknown[]) => void) => {
      handlers[event] = handler;
      return process.stdin;
    });
    vi.spyOn(process.stdin, "setEncoding").mockImplementation(() => process.stdin);

    // Trigger data events and end
    const promise = readStdin();
    for (const chunk of chunks) {
      handlers["data"](chunk);
    }
    handlers["end"]();

    const result = await promise;
    expect(result).toBe("Hello from stdin");
  });

  it("resolves with empty string when no data is written", async () => {
    const { readStdin } = await import("../src/index.js");

    const handlers: Record<string, (...args: unknown[]) => void> = {};

    vi.spyOn(process.stdin, "on").mockImplementation((event: string, handler: (...args: unknown[]) => void) => {
      handlers[event] = handler;
      return process.stdin;
    });
    vi.spyOn(process.stdin, "setEncoding").mockImplementation(() => process.stdin);

    const promise = readStdin();
    handlers["end"]();

    const result = await promise;
    expect(result).toBe("");
  });
});
