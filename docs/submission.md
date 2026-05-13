# Devpost Submission Writeup — Gemini Chat CLI

## Project Tagline

Interactive Gemini chat client with real-time streaming in your terminal.

## Inspiration

As developers, we spend most of our time in the terminal. We wanted to bring the power of Gemini's conversational AI directly into the command line — no browser tabs, no context switching. The terminal is fast, lightweight, and distraction-free. We saw an opportunity to make AI-assisted workflows as natural as typing a shell command.

## What It Does

Gemini Chat CLI is a lightweight command-line interface that connects to Google's Gemini API for interactive, streamed conversations. Users type messages in their terminal and receive real-time streaming responses from Gemini 2.0 Flash. The client maintains conversation history across turns (configurable limit), supports commands like `/help`, `/clear`, `/history`, and `/system`, and includes a configurable system prompt via the `GEMINI_SYSTEM_PROMPT` environment variable. Standard CLI flags (`--version`, `--help`) are supported out of the box. Only an API key is required to get started.

## How We Built It

- **TypeScript** for type-safe development with ES2022/Node16 module resolution
- **@google/generative-ai SDK** for Gemini API integration with streaming support
- **Node.js readline** for the interactive terminal interface
- **Vitest** for unit testing — 40 tests covering config validation, streaming, systemInstruction wiring, error handling, and CLI flags
- **GitHub Actions CI** with Node 18/20/22 matrix, coverage reporting, and smoke tests
- **npm-ready package** with global `gemini-chat` bin entry, TypeScript declarations, and `files` whitelist
- Environment-based configuration (GEMINI_API_KEY, GEMINI_MODEL, GEMINI_MAX_HISTORY, GEMINI_SYSTEM_PROMPT)

## Challenges We Ran Into

- Designing a clean streaming abstraction that handles partial chunks, error recovery, and history management simultaneously
- Managing chat history windowing (trimming oldest turns while preserving conversation coherence)
- Building a testable architecture around an external API without requiring live API calls in unit tests

## Accomplishments That We're Proud Of

- Clean separation of concerns: config, API client, and CLI entry point are fully decoupled
- Streaming responses render character-by-character in the terminal for a natural feel
- Full test coverage of core modules with SDK mocking — 40 tests, zero live API calls needed
- CI pipeline with 3-node matrix, coverage reporting, and automated smoke test
- Zero external runtime dependencies beyond the official Google AI SDK

## What We Learned

- The Gemini streaming API returns chunks that need careful concatenation for full response history
- TypeScript's strict mode with Node16 module resolution requires explicit `.js` extensions in imports
- Environment-based configuration is the simplest path for hackathon tools — no config files to manage

## What's Next

- **Markdown rendering**: Format code blocks and lists in terminal output using chalk or terminal-markdown
- **Multi-turn file context**: Allow users to pipe files into the conversation (`cat error.log | gemini-chat`) for debugging assistance
- **Conversation export**: Save and restore chat sessions to JSON for continuity across sessions
- **Model switching at runtime**: `/model gemini-1.5-pro` command to switch models mid-conversation
- **Plugin system**: Allow custom commands and response post-processors via a plugin API

## Built With

- [x] TypeScript
- [x] Google Gemini API
- [x] Node.js
- [x] @google/generative-ai SDK
- [x] Vitest

## Links

- **Source code**: https://github.com/robotlearning123/code-with-gemini
- **Hackathon**: [Code With Gemini on Devpost](https://code-with-gemini.devpost.com/)
