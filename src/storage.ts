import * as fs from "node:fs";
import * as path from "node:path";
import type { ChatMessage } from "./gemini-client.js";

export interface ConversationFile {
  version: 1;
  model: string;
  savedAt: string;
  messages: ChatMessage[];
}

export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageError";
  }
}

const DEFAULT_DIR = ".gemini-chat";
const FILE_EXTENSION = ".json";

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function saveConversation(
  messages: ChatMessage[],
  name: string,
  model: string,
  baseDir: string = process.cwd()
): string {
  if (!name || !name.trim()) {
    throw new StorageError("Conversation name must be a non-empty string");
  }

  const sanitized = name.trim().replace(/[^a-zA-Z0-9_-]/g, "_");
  if (!sanitized) {
    throw new StorageError("Conversation name contains no valid characters");
  }

  const dir = path.join(baseDir, DEFAULT_DIR);
  ensureDir(dir);

  const filePath = path.join(dir, sanitized + FILE_EXTENSION);

  const data: ConversationFile = {
    version: 1,
    model,
    savedAt: new Date().toISOString(),
    messages,
  };

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  return filePath;
}

export function loadConversation(
  name: string,
  baseDir: string = process.cwd()
): ConversationFile {
  if (!name || !name.trim()) {
    throw new StorageError("Conversation name must be a non-empty string");
  }

  const sanitized = name.trim().replace(/[^a-zA-Z0-9_-]/g, "_");
  const filePath = path.join(baseDir, DEFAULT_DIR, sanitized + FILE_EXTENSION);

  if (!fs.existsSync(filePath)) {
    throw new StorageError(
      `Conversation "${name}" not found. Use /save to create one.`
    );
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw) as ConversationFile;

  if (!data.version || !Array.isArray(data.messages)) {
    throw new StorageError(
      `Conversation file "${name}" is corrupted or has an invalid format.`
    );
  }

  return data;
}

export function listConversations(baseDir: string = process.cwd()): string[] {
  const dir = path.join(baseDir, DEFAULT_DIR);
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(FILE_EXTENSION))
    .map((f) => path.basename(f, FILE_EXTENSION));
}
