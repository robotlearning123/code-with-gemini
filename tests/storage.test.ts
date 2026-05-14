import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  saveConversation,
  loadConversation,
  listConversations,
  StorageError,
} from "../src/storage.js";
import type { ChatMessage } from "../src/gemini-client.js";

const TEST_DIR = path.join(process.cwd(), ".test-storage");

beforeEach(() => {
  if (!fs.existsSync(TEST_DIR)) {
    fs.mkdirSync(TEST_DIR, { recursive: true });
  }
});

afterEach(() => {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
});

function makeMessages(count: number): ChatMessage[] {
  const msgs: ChatMessage[] = [];
  for (let i = 0; i < count; i++) {
    msgs.push({ role: i % 2 === 0 ? "user" : "model", text: `Message ${i}` });
  }
  return msgs;
}

describe("saveConversation", () => {
  it("saves a conversation to a JSON file", () => {
    const msgs = makeMessages(4);
    const filePath = saveConversation(msgs, "test-chat", "gemini-2.0-flash", TEST_DIR);

    expect(fs.existsSync(filePath)).toBe(true);
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    expect(data.version).toBe(1);
    expect(data.model).toBe("gemini-2.0-flash");
    expect(data.messages).toHaveLength(4);
    expect(data.messages[0]).toEqual({ role: "user", text: "Message 0" });
  });

  it("creates the .gemini-chat directory if it does not exist", () => {
    const deepDir = path.join(TEST_DIR, "nested", "dir");
    const msgs = makeMessages(2);
    const filePath = saveConversation(msgs, "deep-test", "gemini-2.0-flash", deepDir);

    expect(fs.existsSync(filePath)).toBe(true);
  });

  it("sanitizes special characters in the name", () => {
    const msgs = makeMessages(2);
    const filePath = saveConversation(msgs, "my chat/file", "gemini-2.0-flash", TEST_DIR);

    expect(filePath).toContain("my_chat_file.json");
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it("throws StorageError for empty name", () => {
    expect(() => saveConversation([], "", "gemini-2.0-flash", TEST_DIR)).toThrow(StorageError);
  });

  it("throws StorageError for whitespace-only name", () => {
    expect(() => saveConversation([], "   ", "gemini-2.0-flash", TEST_DIR)).toThrow(StorageError);
  });

  it("overwrites an existing conversation with the same name", () => {
    const msgs1 = makeMessages(2);
    const msgs2 = makeMessages(6);
    saveConversation(msgs1, "overwrite-test", "gemini-2.0-flash", TEST_DIR);
    saveConversation(msgs2, "overwrite-test", "gemini-2.0-flash", TEST_DIR);

    const data = loadConversation("overwrite-test", TEST_DIR);
    expect(data.messages).toHaveLength(6);
  });

  it("includes a valid ISO timestamp in savedAt", () => {
    const msgs = makeMessages(2);
    saveConversation(msgs, "timestamp-test", "gemini-2.0-flash", TEST_DIR);
    const data = loadConversation("timestamp-test", TEST_DIR);
    expect(new Date(data.savedAt).toISOString()).toBe(data.savedAt);
  });
});

describe("loadConversation", () => {
  it("loads a previously saved conversation", () => {
    const msgs = makeMessages(4);
    saveConversation(msgs, "load-test", "gemini-2.0-flash", TEST_DIR);

    const data = loadConversation("load-test", TEST_DIR);
    expect(data.messages).toHaveLength(4);
    expect(data.model).toBe("gemini-2.0-flash");
  });

  it("throws StorageError when conversation does not exist", () => {
    expect(() => loadConversation("nonexistent", TEST_DIR)).toThrow(StorageError);
    expect(() => loadConversation("nonexistent", TEST_DIR)).toThrow(/not found/);
  });

  it("throws StorageError for corrupted file (missing version)", () => {
    const dir = path.join(TEST_DIR, ".gemini-chat");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "corrupt.json"), JSON.stringify({ messages: [] }));

    expect(() => loadConversation("corrupt", TEST_DIR)).toThrow(StorageError);
    expect(() => loadConversation("corrupt", TEST_DIR)).toThrow(/corrupted/);
  });

  it("throws StorageError for corrupted file (missing messages)", () => {
    const dir = path.join(TEST_DIR, ".gemini-chat");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "corrupt2.json"), JSON.stringify({ version: 1 }));

    expect(() => loadConversation("corrupt2", TEST_DIR)).toThrow(StorageError);
  });

  it("throws StorageError for empty name", () => {
    expect(() => loadConversation("", TEST_DIR)).toThrow(StorageError);
  });
});

describe("listConversations", () => {
  it("returns empty array when no conversations exist", () => {
    expect(listConversations(TEST_DIR)).toEqual([]);
  });

  it("returns names of saved conversations", () => {
    saveConversation(makeMessages(2), "chat-a", "gemini-2.0-flash", TEST_DIR);
    saveConversation(makeMessages(2), "chat-b", "gemini-2.0-flash", TEST_DIR);

    const names = listConversations(TEST_DIR);
    expect(names).toContain("chat-a");
    expect(names).toContain("chat-b");
    expect(names).toHaveLength(2);
  });

  it("ignores non-JSON files in the directory", () => {
    const dir = path.join(TEST_DIR, ".gemini-chat");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "readme.txt"), "not a conversation");
    fs.writeFileSync(path.join(dir, "real.json"), '{"version":1,"messages":[]}');

    const names = listConversations(TEST_DIR);
    expect(names).toEqual(["real"]);
  });
});
