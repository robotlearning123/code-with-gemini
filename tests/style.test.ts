import { describe, it, expect, vi, afterEach } from "vitest";
import { bold, green, cyan, yellow, red, dim } from "../src/style.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("style functions", () => {
  it("returns colored text when stdout is a TTY", () => {
    Object.defineProperty(process.stdout, "isTTY", { value: true, configurable: true });
    expect(green("hello")).toBe("\x1b[32mhello\x1b[0m");
    expect(bold("text")).toBe("\x1b[1mtext\x1b[0m");
    expect(cyan("c")).toBe("\x1b[36mc\x1b[0m");
    expect(yellow("y")).toBe("\x1b[33my\x1b[0m");
    expect(red("r")).toBe("\x1b[31mr\x1b[0m");
    expect(dim("d")).toBe("\x1b[2md\x1b[0m");
  });

  it("returns plain text when stdout is not a TTY", () => {
    Object.defineProperty(process.stdout, "isTTY", { value: false, configurable: true });
    expect(green("hello")).toBe("hello");
    expect(bold("text")).toBe("text");
    expect(cyan("c")).toBe("c");
    expect(yellow("y")).toBe("y");
    expect(red("r")).toBe("r");
    expect(dim("d")).toBe("d");
  });

  it("returns plain text when isTTY is undefined", () => {
    Object.defineProperty(process.stdout, "isTTY", { value: undefined, configurable: true });
    expect(green("hello")).toBe("hello");
  });
});
