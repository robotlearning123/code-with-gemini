import * as readline from "node:readline";
import { loadConfig, ConfigError } from "./config.js";
import { GeminiClient, formatMessage } from "./gemini-client.js";

const VERSION = "0.1.0";

function printHelp(): void {
  console.log("Available commands:");
  console.log("  /system  — Show current system prompt");
  console.log("  /clear   — Clear conversation history");
  console.log("  /history — Show conversation history");
  console.log("  /help    — Show this help message");
  console.log("  exit     — Exit the chat session");
  console.log("  quit     — Exit the chat session");
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

    if (!input) {
      rl.prompt();
      continue;
    }

    try {
      process.stdout.write("Gemini: ");
      for await (const chunk of client.streamMessage(input)) {
        if (!chunk.done) {
          process.stdout.write(chunk.text);
        }
      }
      console.log("\n");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`\nError: ${message}\n`);
    }

    rl.prompt();
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
