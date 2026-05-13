import { describe, it, expect, vi, beforeEach } from "vitest";
import { main } from "../src/index.js";

describe("CLI --version flag", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("prints version and exits without error when --version is passed", async () => {
    await main(["--version"]);
    expect(console.log).toHaveBeenCalledWith("gemini-chat v0.1.0");
  });

  it("prints version and exits with -v shorthand", async () => {
    await main(["-v"]);
    expect(console.log).toHaveBeenCalledWith("gemini-chat v0.1.0");
  });
});

describe("CLI --help flag", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("prints help text and exits when --help is passed", async () => {
    await main(["--help"]);
    expect(console.log).toHaveBeenCalledWith("gemini-chat v0.1.0 — Interactive Gemini chat client");
  });

  it("prints help text with -h shorthand", async () => {
    await main(["-h"]);
    expect(console.log).toHaveBeenCalledWith("gemini-chat v0.1.0 — Interactive Gemini chat client");
  });

  it("lists environment variables in help output", async () => {
    await main(["--help"]);
    expect(console.log).toHaveBeenCalledWith(
      "  GEMINI_API_KEY       Required. Your Google AI API key"
    );
  });
});
