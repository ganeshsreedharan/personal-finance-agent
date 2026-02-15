# Personal Finance AI Agent

A Telegram bot that tracks personal finances using AI. Send expenses as text, photos, voice messages, or documents — the bot extracts, categorizes, and stores transactions automatically.

**Core Principle**: Never block logging. If uncertain, default to "Misc" category.

---

## Quick Start

### Prerequisites

- Node.js 20+
- MongoDB (local or Atlas)
- Telegram Bot Token (from @BotFather)
- Google Gemini API Key (from [Google AI Studio](https://aistudio.google.com/app/apikey))
- Optional: Ollama (for local LLM)

### Setup

```bash
npm install

cp .env.example .env.development
# Edit .env.development with your credentials:
#   TELEGRAM_BOT_TOKEN=...
#   GOOGLE_API_KEY=...
#   MONGODB_URI=...
#   LLM_PROVIDER=gemini  (or "ollama" for local)

npm run dev
```

### Test It

1. Open Telegram, find your bot
2. Send: `Rent 1250€ paid`
3. Bot replies: `Logged: €1250 — Housing-Rent — 2026-02-16 ✅`

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Agent Framework | [Mastra](https://mastra.ai) (@mastra/core) |
| Cloud LLM | Google Gemini via @ai-sdk/google |
| Local LLM | Ollama via ollama-ai-provider-v2 |
| Telegram Bot | grammY |
| Database | MongoDB |
| Schema Validation | Zod |
| Charts | chartjs-node-canvas |
| Language | TypeScript (strict mode) |

---

## What It Does

### Log Expenses
Send text, photos, voice, or documents. The agent extracts amount, vendor, category, and date.

```
Groceries 34.60 at REWE
→ Logged: €34.60 — Groceries — 2026-02-16 ✅
```

### Query Transactions
```
Show me last 5 transactions
What did I spend yesterday?
```

### Edit & Delete
```
Change the REWE amount to 40€
Delete the last transaction
```

### Spending Summaries
Natural language or `/summary` command. Returns text report + pie/bar chart.

```
How much did I spend this month?
/summary week
/summary bar
```

### Media Processing
- Photos: receipt/invoice extraction via agent vision
- Voice: spoken expense extraction
- Documents/PDFs: invoice data extraction

---

## Commands

| Command | Action |
|---------|--------|
| `/start` | Register and get welcome message |
| `/summary` | Current month summary + pie chart |
| `/summary week` | Last 7 days summary |
| `/summary bar` | Summary with bar chart |

---

## Categories (v1)

**Structural**: Housing-Rent, Utilities-Electricity, Utilities-Internet, Childcare-Kita, Transport, Investments-Scalable Capital

**Daily**: Groceries, Eating Out, Subscriptions, Health, Shopping, Travel, Misc

---

## Architecture

```
User (Telegram) → grammY Bot → Mastra Agent (1 LLM call) → Tools (DB only) → MongoDB
```

- **Agent does ALL reasoning** — parse, categorize, decide — in a single LLM call
- **Tools are simple** — DB operations only, no LLM calls, <50 lines each
- **6 tools**: store, query, update, delete, check-duplicates, spending-summary
- **1 workflow**: spending summary (fetch data → agent generates report → chart)

See [CONTEXT.md](CONTEXT.md) for detailed architecture docs.

---

## Project Structure

```
src/
├── bot/              # Telegram bot
│   ├── handlers/     # message, media, summary handlers
│   └── middleware/    # auth, media processing
├── mastra/           # AI agent layer
│   ├── agents/       # Finance agent (instructions + model)
│   ├── tools/        # 6 tools (DB operations only)
│   └── workflows/    # Spending summary workflow
├── database/         # MongoDB client, repositories, schemas
├── config/           # Environment, categories, constants
└── utils/            # Chart generation
```

---

## Development

```bash
npm run dev          # Start with hot reload (tsx)
npm run build        # Build for production
npm run lint         # Check code style
```

### LLM Provider

Switch between cloud and local LLM via `LLM_PROVIDER` in `.env.development`:

- `gemini` — Google Gemini Flash (default, free tier: 15 req/min)
- `ollama` — Local model via Ollama (e.g., qwen2.5:14b-instruct) — see [LOCAL_LLM_SETUP.md](LOCAL_LLM_SETUP.md)

---

## Documentation

| File | Purpose |
|------|---------|
| [CLAUDE.md](claude.md) | Project rules for Claude Code |
| [CONTEXT.md](CONTEXT.md) | Architecture, patterns, guidelines |
| [spec.md](spec.md) | Product specification |
| [LOCAL_LLM_SETUP.md](LOCAL_LLM_SETUP.md) | Ollama setup guide |

---

## License

MIT
