import * as readline from "node:readline";
import { createRequire } from "node:module";
import { loadConfig, ConfigError } from "./config.js";
import { GeminiClient, formatMessage } from "./gemini-client.js";
import { saveConversation, loadConversation, listConversations, StorageError } from "./storage.js";

const require = createRequire(import.meta.url);
const VERSION: string = require("../package.json").version;

export function classifyError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("api key") || lower.includes("api_key") || lower.includes("invalid api")) {
    return "Invalid API key. Check your GEMINI_API_KEY environment variable.";
  }
  if (lower.includes("quota") || lower.includes("rate limit") || lower.includes("429")) {
    return "API rate limit or quota exceeded. Wait a moment and try again.";
  }
  if (lower.includes("permission") || lower.includes("forbidden") || lower.includes("403")) {
    return "API access denied. Your key may not have access to this model.";
  }
  if (lower.includes("not found") || lower.includes("404")) {
    return "Model not found. Check your GEMINI_MODEL setting.";
  }
  if (lower.includes("network") || lower.includes("econnrefused") || lower.includes("timeout")) {
    return "Network error. Check your internet connection and try again.";
  }
  if (lower.includes("safety") || lower.includes("blocked")) {
    return "Response blocked by safety filters. Try rephrasing your message.";
  }
  return message;
}

function printHelp(): void {
  console.log("Available commands:");
  console.log("  /system        — Show current system prompt");
  console.log("  /clear         — Clear conversation history");
  console.log("  /history       — Show conversation history");
  console.log("  /save <name>   — Save conversation to file");
  console.log("  /load <name>   — Load a saved conversation");
  console.log("  /list          — List saved conversations");
  console.log("  /model         — Show current model");
  console.log("  /model <name>  — Switch to a different model");
  console.log("  /help          — Show this help message");
  console.log("  exit           — Exit the chat session");
  console.log("  quit           — Exit the chat session");
  console.log();
}

export async function main(args: string[] = process.argv.slice(2)): Promise<void> {
  if (args.includes("--version") || args.includes("-v")) {
    console.log(`gemini-chat v${VERSION}`);
    return;
  }

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`gemini-chat v${VERSION} — Interactive Gemini chat client`);
    console.log();
    console.log("Usage: gemini-chat [options]");
    console.log();
    console.log("Options:");
    console.log("  -v, --version  Print version and exit");
    console.log("  -h, --help     Print this help message and exit");
    console.log();
    console.log("Environment variables:");
    console.log("  GEMINI_API_KEY        Required. Your Google AI API key");
    console.log("  GEMINI_MODEL          Model to use (default: gemini-2.0-flash)");
    console.log("  GEMINI_MAX_HISTORY    Max conversation turns to keep (default: 20)");
    console.log("  GEMINI_SYSTEM_PROMPT  Optional system instruction for the model");
    return;
  }

  let config;
  try {
    config = loadConfig();
  } catch (err) {
    if (err instanceof ConfigError) {
      console.error(`Configuration error: ${err.message}`);
      process.exit(1);
    }
    throw err;
  }

  console.log(`Gemini Chat Client v${VERSION} (model: ${config.model})`);
  if (config.systemInstruction) {
    console.log(`System prompt: "${config.systemInstruction}"`);
  }
  console.log("Type your message and press Enter. Type '/help' for commands.\n");

  const client = new GeminiClient(config);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "> ",
  });

  let streaming = false;

  rl.on("SIGINT", () => {
    if (streaming) {
      streaming = false;
      console.log("\n[interrupted]");
      rl.prompt();
    } else {
      console.log("\nGoodbye!");
      rl.close();
      process.exit(0);
    }
  });

  rl.prompt();

  for await (const line of rl) {
    const input = line.trim();

    if (input === "exit" || input === "quit") {
      console.log("Goodbye!");
      rl.close();
      break;
    }

    if (input === "/help") {
      printHelp();
      rl.prompt();
      continue;
    }

    if (input === "/system") {
      if (config.systemInstruction) {
        console.log(`System prompt: "${config.systemInstruction}"\n`);
      } else {
        console.log("No system prompt set. Use GEMINI_SYSTEM_PROMPT env var.\n");
      }
      rl.prompt();
      continue;
    }

    if (input === "/clear" || input === "clear") {
      client.clearHistory();
      console.log("History cleared.\n");
      rl.prompt();
      continue;
    }

    if (input === "/history" || input === "history") {
      const history = client.getHistory();
      if (history.length === 0) {
        console.log("No history.\n");
      } else {
        for (const msg of history) {
          console.log(formatMessage(msg));
        }
        console.log();
      }
      rl.prompt();
      continue;
    }

    if (input.startsWith("/save")) {
      const name = input.slice(5).trim();
      if (!name) {
        console.log("Usage: /save <name>\n");
      } else {
        try {
          const filePath = saveConversation(client.getHistory(), name, config.model);
          console.log(`Conversation saved to ${filePath}\n`);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.error(`Save failed: ${message}\n`);
        }
      }
      rl.prompt();
      continue;
    }

    if (input.startsWith("/load")) {
      const name = input.slice(6).trim();
      if (!name) {
        console.log("Usage: /load <name>\n");
      } else {
        try {
          const data = loadConversation(name);
          client.loadHistory(data.messages);
          console.log(`Loaded ${data.messages.length} messages from "${name}" (saved ${data.savedAt}).\n`);
        } catch (err) {
          if (err instanceof StorageError) {
            console.error(`${err.message}\n`);
          } else {
            console.error(`Load failed: ${err instanceof Error ? err.message : String(err)}\n`);
          }
        }
      }
      rl.prompt();
      continue;
    }

    if (input === "/list") {
      const conversations = listConversations();
      if (conversations.length === 0) {
        console.log("No saved conversations.\n");
      } else {
        console.log("Saved conversations:");
        for (const c of conversations) {
          console.log(`  ${c}`);
        }
        console.log();
      }
      rl.prompt();
      continue;
    }

    if (input === "/model") {
      console.log(`Current model: ${client.getModel()}\n`);
      rl.prompt();
      continue;
    }

    if (input.startsWith("/model ")) {
      const newModel = input.slice(7).trim();
      if (!newModel) {
        console.log("Usage: /model <model-name>\n");
      } else {
        client.setModel(newModel);
        console.log(`Switched to model: ${newModel}\n`);
      }
      rl.prompt();
      continue;
    }

    if (!input) {
      rl.prompt();
      continue;
    }

    try {
      streaming = true;
      process.stdout.write("Gemini: ");
      for await (const chunk of client.streamMessage(input)) {
        if (!streaming) break;
        if (!chunk.done) {
          process.stdout.write(chunk.text);
        }
      }
      if (streaming) console.log("\n");
      streaming = false;
    } catch (err) {
      streaming = false;
      const message = err instanceof Error ? err.message : String(err);
      console.error(`\nError: ${classifyError(message)}\n`);
    }

    rl.prompt();
  }
}
