export interface AppConfig {
  apiKey: string;
  model: string;
  maxHistoryTurns: number;
}

const DEFAULT_MODEL = "gemini-2.0-flash";
const DEFAULT_MAX_HISTORY = 20;

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export function loadConfig(env: Record<string, string | undefined> = process.env): AppConfig {
  const apiKey = env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new ConfigError(
      "GEMINI_API_KEY is required. Set it in your environment:\n" +
        "  export GEMINI_API_KEY=your-key-here"
    );
  }

  return {
    apiKey,
    model: env.GEMINI_MODEL?.trim() || DEFAULT_MODEL,
    maxHistoryTurns: parseInt(env.GEMINI_MAX_HISTORY || String(DEFAULT_MAX_HISTORY), 10),
  };
}

export function validateConfig(config: Partial<AppConfig>): asserts config is AppConfig {
  if (!config.apiKey || config.apiKey.trim().length === 0) {
    throw new ConfigError("apiKey must be a non-empty string");
  }
  if (config.maxHistoryTurns !== undefined && config.maxHistoryTurns < 1) {
    throw new ConfigError("maxHistoryTurns must be >= 1");
  }
}
