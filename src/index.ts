import * as readline from "node:readline";
import { loadConfig, ConfigError } from "./config.js";
import { GeminiClient, formatMessage } from "./gemini-client.js";

export async function main(): Promise<void> {
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

  console.log(`Gemini Chat Client (model: ${config.model})`);
  console.log("Type your message and press Enter. Type 'exit' or 'quit' to stop.\n");

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

    if (input === "clear") {
      client.clearHistory();
      console.log("History cleared.\n");
      rl.prompt();
      continue;
    }

    if (input === "history") {
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
