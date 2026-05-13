# Gemini Chat CLI

An interactive command-line chat client powered by the Google Gemini API. Stream responses in real time from your terminal.

Built for the [Code With Gemini](https://code-with-gemini.devpost.com/) hackathon.

## Architecture

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Terminal UI │────▶│  gemini-client   │────▶│  Gemini API     │
│  (index.ts)  │◀────│  (gemini-client) │◀────│  (GenerativeAI) │
└──────────────┘     └──────────────────┘     └─────────────────┘
        │                     │
        ▼                     ▼
┌──────────────┐     ┌──────────────────┐
│   readline   │     │     config.ts    │
│   (stdio)    │     │  (env + defaults)│
└──────────────┘     └──────────────────┘
```

## Prerequisites

- Node.js 18+
- A Google AI Studio API key ([get one here](https://aistudio.google.com/apikey))

## Setup

```bash
npm install
```

Set your Gemini API key:

```bash
export GEMINI_API_KEY="your-api-key-here"
```

## Usage

Build and run:

```bash
npm run build
npm start
```

Or install globally:

```bash
npm install -g .
gemini-chat
```

Command-line flags:

```bash
gemini-chat --version    # Print version
gemini-chat --help       # Show usage and env vars
```

### Interactive Commands

Once in the chat loop, type any message to get a streamed response from Gemini.

| Command | Description |
|---------|-------------|
| `/help` | List available commands |
| `/system` | Show the active system prompt |
| `/clear` | Clear conversation history |
| `/history` | Show conversation history |
| `exit` or `quit` | End the session |

### System Prompt

Set a system instruction to shape Gemini's behavior across all turns:

```bash
export GEMINI_SYSTEM_PROMPT="You are a concise coding assistant."
npm start
```

## Configuration

All configuration is via environment variables:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GEMINI_API_KEY` | Yes | — | Your Google AI API key |
| `GEMINI_MODEL` | No | `gemini-2.0-flash` | Model to use |
| `GEMINI_MAX_HISTORY` | No | `20` | Max conversation turns to keep |
| `GEMINI_SYSTEM_PROMPT` | No | — | System instruction for the model |

## Project Structure

```
.
├── src/
│   ├── cli.ts            # CLI bin entry (shebang)
│   ├── index.ts          # Chat loop, CLI flags
│   ├── gemini-client.ts  # Gemini API wrapper (streaming + history)
│   └── config.ts         # Environment configuration
├── tests/                # Vitest unit tests
├── CHANGELOG.md          # Release history
├── docs/
│   ├── demo.md           # Demo script / walkthrough
│   └── submission.md     # Devpost submission writeup
├── .github/workflows/    # CI: Node 18/20/22 matrix
├── HACKATHON.md          # Hackathon requirements reference
├── package.json
└── README.md
```

## Built With

- **TypeScript** — type-safe runtime
- **@google/generative-ai** — Google Gemini API SDK
- **Node.js** — server-side JavaScript runtime
- **Vitest** — unit testing

## License

MIT
