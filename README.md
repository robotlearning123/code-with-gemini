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

<!-- Architecture diagram placeholder: replace with Mermaid or image for Devpost submission -->

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

Development mode (watch + auto-rebuild):

```bash
npm run dev
```

The client opens an interactive chat loop. Type your message and press Enter to receive a streamed response from Gemini. Type `exit` or `quit` to end the session.

## Project Structure

```
.
├── src/
│   ├── index.ts          # Entry point, interactive chat loop
│   ├── gemini-client.ts  # Gemini API wrapper (streaming)
│   └── config.ts         # Environment configuration
├── tests/                # Test suite (≥5 passing tests)
├── docs/
│   ├── demo.md           # Demo script / walkthrough
│   └── submission.md     # Devpost submission writeup
├── HACKATHON.md          # Hackathon requirements reference
├── package.json
└── README.md
```

## Built With

- **TypeScript** — type-safe runtime
- **@google/generative-ai** — Google Gemini API SDK
- **Node.js** — server-side JavaScript runtime

## License

MIT
