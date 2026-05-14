export interface GenerationConfig {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
}

export interface AppConfig {
  apiKey: string;
  model: string;
  maxHistoryTurns: number;
  systemInstruction?: string;
  generationConfig?: GenerationConfig;
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

  const systemInstruction = env.GEMINI_SYSTEM_PROMPT?.trim();

  const generationConfig: GenerationConfig = {};
  if (env.GEMINI_TEMPERATURE) {
    const temp = parseFloat(env.GEMINI_TEMPERATURE);
    if (!Number.isNaN(temp)) generationConfig.temperature = temp;
  }
  if (env.GEMINI_TOP_P) {
    const topP = parseFloat(env.GEMINI_TOP_P);
    if (!Number.isNaN(topP)) generationConfig.topP = topP;
  }
  if (env.GEMINI_TOP_K) {
    const topK = parseInt(env.GEMINI_TOP_K, 10);
    if (!Number.isNaN(topK)) generationConfig.topK = topK;
  }
  if (env.GEMINI_MAX_OUTPUT_TOKENS) {
    const maxTokens = parseInt(env.GEMINI_MAX_OUTPUT_TOKENS, 10);
    if (!Number.isNaN(maxTokens)) generationConfig.maxOutputTokens = maxTokens;
  }

  const config: AppConfig = {
    apiKey,
    model: env.GEMINI_MODEL?.trim() || DEFAULT_MODEL,
    maxHistoryTurns: parseInt(env.GEMINI_MAX_HISTORY || String(DEFAULT_MAX_HISTORY), 10),
    ...(systemInstruction ? { systemInstruction } : {}),
    ...(Object.keys(generationConfig).length > 0 ? { generationConfig } : {}),
  };

  validateConfig(config);
  return config;
}

export function validateConfig(config: Partial<AppConfig>): asserts config is AppConfig {
  if (!config.apiKey || config.apiKey.trim().length === 0) {
    throw new ConfigError("apiKey must be a non-empty string");
  }
  if (config.maxHistoryTurns !== undefined) {
    if (Number.isNaN(config.maxHistoryTurns)) {
      throw new ConfigError("maxHistoryTurns must be a valid number");
    }
    if (config.maxHistoryTurns < 1) {
      throw new ConfigError("maxHistoryTurns must be >= 1");
    }
  }
  if (config.generationConfig?.temperature !== undefined) {
    const t = config.generationConfig.temperature;
    if (t < 0 || t > 2) {
      throw new ConfigError("temperature must be between 0 and 2");
    }
  }
  if (config.generationConfig?.topP !== undefined) {
    const p = config.generationConfig.topP;
    if (p < 0 || p > 1) {
      throw new ConfigError("topP must be between 0 and 1");
    }
  }
  if (config.generationConfig?.topK !== undefined) {
    const k = config.generationConfig.topK;
    if (k < 1) {
      throw new ConfigError("topK must be >= 1");
    }
  }
  if (config.generationConfig?.maxOutputTokens !== undefined) {
    const m = config.generationConfig.maxOutputTokens;
    if (m < 1) {
      throw new ConfigError("maxOutputTokens must be >= 1");
    }
  }
}
