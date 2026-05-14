# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.5.0] - 2026-05-14

### Added
- Colorized terminal output: startup banner (cyan), Gemini prefix (green), errors (red), goodbye (yellow)
- `src/style.ts` — zero-dependency ANSI color module with auto-disable for non-TTY output
- 3 new tests (126 total)

## [0.4.0] - 2026-05-14

### Added
- `/delete <name>` command to remove saved conversations
- `deleteConversation()` in storage module
- `--prompt`/`-p` CLI flag for one-shot non-interactive queries
- 3 new tests (123 total)

## [0.3.1] - 2026-05-14

### Added
- Stdin pipe mode: non-interactive usage when stdin is not a TTY
- `cat error.log | gemini-chat` and `echo "explain" | gemini-chat` patterns
- `readStdin()` exported helper for testability
- 2 new tests (120 total)

## [0.3.0] - 2026-05-14

### Added
- Generation config: `temperature`, `topP`, `topK`, `maxOutputTokens` via environment variables
- `GenerationConfig` interface in `AppConfig` with range validation
- `/config` REPL command to display active generation settings
- New env vars: `GEMINI_TEMPERATURE`, `GEMINI_TOP_P`, `GEMINI_TOP_K`, `GEMINI_MAX_OUTPUT_TOKENS`
- Generation config wired through `GeminiClient.getModelParams()` to the Gemini SDK
- 17 new tests for generation config (118 total)

## [0.2.1] - 2026-05-14

### Added
- Token usage tracking: `GeminiClient.getUsage()` and `resetUsage()` for session-level accumulation
- `/usage` REPL command showing prompt, completion, and total tokens
- Per-call `usage` field in `ChatResponse` from `sendMessage`
- Token accumulation from both `sendMessage` and `streamMessage` via `usageMetadata`
- 9 new tests for token usage (101 total)

## [0.2.0] - 2026-05-14

### Added
- Conversation persistence: `/save <name>`, `/load <name>`, `/list` commands
- `src/storage.ts` — save/load conversations as JSON in `.gemini-chat/` directory
- `GeminiClient.loadHistory()` for injecting saved messages
- Name sanitization to prevent path traversal in conversation files
- Exponential backoff with jitter for transient API failures (`src/retry.ts`)
- `withRetry()` wraps `sendMessage` and `streamMessage` with automatic retry
- Retryable errors: 429, 500, 503, rate limit, quota, network, timeout
- Non-retryable errors (403, 404, auth) fail immediately without retry
- `/model` and `/model <name>` commands to switch models mid-session
- `GeminiClient.getModel()` and `setModel()` for runtime model switching
- Coverage thresholds in vitest config (80% statements/functions/lines, 75% branches)
- `.env.example` template for new user onboarding

### Changed
- Test suite expanded from 49 to 92 tests
- Version assertion tests now version-agnostic (checks for `v` prefix)

## [0.1.0] - 2025-05-13

### Added
- Interactive Gemini chat client with streaming responses
- `GeminiClient` class with sendMessage and streamMessage methods
- Conversation history management with configurable max turns
- System prompt support via `GEMINI_SYSTEM_PROMPT` env var
- CLI flags: `--version` (`-v`), `--help` (`-h`)
- Interactive commands: `/help`, `/system`, `/clear`, `/history`
- Configurable model via `GEMINI_MODEL` env var (default: gemini-2.0-flash)
- Configurable history limit via `GEMINI_MAX_HISTORY` env var (default: 20)
- Unit test suite with Vitest (15 tests)
- GitHub Actions CI workflow (Node 18/20/22 matrix)
- TypeScript strict mode with ES2022 target
- README with architecture diagram and usage guide
- Devpost submission writeup (docs/submission.md)
- Demo walkthrough (docs/demo.md)
- Global CLI bin entry (`gemini-chat`) via `dist/cli.js`
- Test suite expanded to 38 tests covering streaming, systemInstruction, error handling, and CLI flags
- MIT LICENSE
- `.npmignore` and `files` field for clean npm publishes
- `@vitest/coverage-v8` for CI coverage reports
- `.editorconfig` for consistent formatting
- Smoke test (`npm run test:smoke`) for CLI --version
- `validateConfig()` wired into `loadConfig()` for NaN and range protection
- Graceful SIGINT handling: Ctrl+C during streaming prints `[interrupted]` and returns to prompt
- `classifyError()` for user-friendly API error messages (rate limit, invalid key, quota, safety filter, network, 404, 403)
- Version synced from `package.json` via `createRequire()` instead of hardcoded constant
- Test suite expanded to 49 tests (9 new for error classification)
- Conversation persistence: `/save <name>`, `/load <name>`, `/list` commands
- `src/storage.ts` — save/load conversations as JSON in `.gemini-chat/` directory
- `GeminiClient.loadHistory()` for injecting saved messages
- Name sanitization to prevent path traversal in conversation files
- Test suite expanded to 64 tests (15 new for storage)
- Exponential backoff with jitter for transient API failures (`src/retry.ts`)
- `withRetry()` wraps `sendMessage` and `streamMessage` with automatic retry
- Retryable errors: 429, 500, 503, rate limit, quota, network, timeout
- Non-retryable errors (403, 404, auth) fail immediately without retry
- Default retry config: 3 attempts, 1s base delay, 10s max, exponential + jitter
- Test suite expanded to 88 tests (24 new for retry logic)

### Changed
- README updated to document CLI flags, system prompt, and global install
- `index.ts` module-level `main().catch()` moved to `cli.ts` bin entry
- CI workflow now includes coverage report and smoke test steps
- `package.json` added `bin`, `types`, and `files` fields
- `prepublishOnly` script added for safe npm publishes
