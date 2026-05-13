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

### Changed
- README updated to document CLI flags and system prompt features

### Infrastructure
- GitHub Actions CI on push to master and pull requests
- Vitest test framework with SDK mocking
