# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

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

### Changed
- README updated to document CLI flags, system prompt, and global install
- `index.ts` module-level `main().catch()` moved to `cli.ts` bin entry
- CI workflow now includes coverage report and smoke test steps
- `package.json` added `bin`, `types`, and `files` fields
- `prepublishOnly` script added for safe npm publishes
