# Gemini Chat CLI — Demo Walkthrough

## What You'll See

A real-time streaming chat client in your terminal, powered by Google Gemini. Every response streams token-by-token, just like the web UI — but entirely from the command line.

## Prerequisites

- Node.js 18+
- A Google AI Studio API key ([get one free](https://aistudio.google.com/apikey))

## Step 1: Install

```bash
git clone <repo-url>
cd wanman-h-29517
npm install
```

## Step 2: Set Your API Key

```bash
export GEMINI_API_KEY="your-api-key-here"
```

## Step 3: Build and Run

```bash
npm run build
npm start
```

## Step 4: Chat

You'll see an interactive prompt:

```
Gemini Chat CLI (type 'exit' to quit)
─────────────────────────────────────
You> What is the meaning of life?
Gemini> The meaning of life is a question that has been explored by
philosophers, scientists, and thinkers throughout history. There are
many perspectives...
```

Type any message and press Enter. The response streams in real time.

Type `exit` or `quit` to end the session.

## Key Interactions

| Action | What Happens |
|--------|-------------|
| Type a message + Enter | Gemini streams a response |
| Multi-line input (optional) | Paste multi-line text, submit with empty line |
| `exit` or `quit` | Session ends gracefully |
| `Ctrl+C` | Interrupts current stream, stays in chat |
| Missing API key | Clear error message with setup link |

## Architecture Highlights

```
Terminal ──readline──▶ index.ts ──▶ gemini-client.ts ──▶ Gemini API
                         │                                │
                         ▼                                ▼
                    Chat loop                      Streaming response
                    (history)                      (token-by-token)
```

- **Streaming**: Responses appear token-by-token using the Gemini streaming API
- **History**: Conversation context is maintained across turns
- **Config**: API key loaded from environment with sensible defaults

## Demo Script (for video/recording)

1. Open terminal, show `npm install` completing
2. Run `npm start`
3. Ask "Explain quantum computing in one paragraph" — show streaming
4. Ask a follow-up that references the first answer — show context retention
5. Ask "Write a haiku about programming" — show creative output
6. Type `exit` — show graceful shutdown

## Devpost Submission Notes

- Include a 2-3 minute demo video showing the interactions above
- Highlight real-time streaming as the key technical differentiator
- Show the code architecture diagram from README.md
