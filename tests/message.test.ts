import { describe, it, expect } from "vitest";
import { formatMessage, ChatMessage } from "../src/gemini-client.js";

describe("formatMessage", () => {
  it("formats user messages with 'You' tag", () => {
    const msg: ChatMessage = { role: "user", text: "Hello Gemini" };
    expect(formatMessage(msg)).toBe("[You]: Hello Gemini");
  });

  it("formats model messages with 'Gemini' tag", () => {
    const msg: ChatMessage = { role: "model", text: "Hello! How can I help?" };
    expect(formatMessage(msg)).toBe("[Gemini]: Hello! How can I help?");
  });

  it("handles empty text", () => {
    const msg: ChatMessage = { role: "user", text: "" };
    expect(formatMessage(msg)).toBe("[You]: ");
  });
});
