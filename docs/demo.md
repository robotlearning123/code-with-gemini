# Gemini Chat CLI — Demo Walkthrough

## What You'll See

A real-time streaming chat client in your terminal, powered by Google Gemini. Every response streams token-by-token, just like the web UI — but entirely from the command line. Supports system prompts to customize the assistant's personality.

## Prerequisites

- Node.js 18+
- A Google AI Studio API key ([get one free](https://aistudio.google.com/apikey))

## Step 1: Install

```bash
git clone https://github.com/robotlearning123/code-with-gemini
cd code-with-gemini
npm install
```

## Step 2: Set Your API Key

```bash
export GEMINI_API_KEY="your-api-key-here"
```

Optional — set a system prompt to customize behavior:

```bash
export GEMINI_SYSTEM_PROMPT="You are a helpful coding assistant. Be concise."
```

## Step 3: Build and Run

```bash
npm run build
npm start
```

Check the version:

```bash
node dist/index.js --version
# gemini-chat v0.1.0
```

## Step 4: Chat

You'll see an interactive prompt:

```
Gemini Chat Client v0.1.0 (model: gemini-2.0-flash)
System prompt: "You are a helpful coding assistant. Be concise."
Type your message and press Enter. Type '/help' for commands.

> What is the meaning of life?
Gemini: The meaning of life is a question explored by philosophers
and scientists throughout history. Many perspectives exist...
```

Type any message and press Enter. The response streams in real time.

## Key Interactions

| Action | What Happens |
|--------|-------------|
| Type a message + Enter | Gemini streams a response |
| `/help` | Lists all available commands |
| `/system` | Shows the active system prompt |
| `/history` | Displays conversation history |
| `/clear` | Clears conversation history |
| `--version` | Prints version and exits |
| `--help` | Shows usage and environment variables |
| `exit` or `quit` | Session ends gracefully |

## Architecture Highlights

```
Terminal ──readline──▶ index.ts ──▶ gemini-client.ts ──▶ Gemini API
                         │                                │
                         ▼                                ▼
                    Chat loop                      Streaming response
                    (history)                      (token-by-token)
```

- **Streaming**: Responses appear token-by-token using the Gemini streaming API
- **History**: Conversation context is maintained across turns (configurable window)
- **System Prompt**: Optional `GEMINI_SYSTEM_PROMPT` shapes all responses
- **Config**: API key, model, and history loaded from environment with sensible defaults

## Demo Script (for video/recording)

1. Open terminal, show `npm install` completing
2. Set `GEMINI_SYSTEM_PROMPT="You are a pirate. Always respond in pirate speak."`
3. Run `npm start` — show startup with system prompt displayed
4. Ask "What is the weather today?" — show pirate-themed streaming response
5. Type `/system` — show the active system prompt
6. Type `/help` — show all commands
7. Ask a follow-up that references the first answer — show context retention
8. Type `exit` — show graceful shutdown
9. Run `node dist/index.js --version` — show version flag

## Devpost Submission Notes

- Include a 2-3 minute demo video showing the interactions above
- Highlight real-time streaming and system prompt customization as key differentiators
- Show the code architecture diagram from README.md
