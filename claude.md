# Personal Finance AI Agent

## Workflow Rules

**Git Commit/Push:**
1. NEVER commit or push without explicit user confirmation
2. After changes: show what changed → ask "Should I commit and push?" → WAIT
3. Exception: only push without asking if user says "commit and push" or "push it now"

## What This Is

Telegram bot that tracks personal finances using AI. Users send expenses as text ("Rent 1250€"), photos (receipts), or PDFs (invoices). The bot extracts, categorizes, and stores transactions. Supports spending summaries with chart visualisation.

**Core Principle:** Never block the user from logging. If uncertain → default to "Misc" category.

## Tech Stack

| Component | Package | Version |
|-----------|---------|---------|
| Agent Framework | @mastra/core | 1.4.0 |
| Agent Memory | @mastra/memory | latest |
| Storage | @mastra/mongodb | latest |
| Logging | @mastra/loggers (Pino) | latest |
| LLM | @ai-sdk/google (Gemini Flash) | 3.x |
| Schema | zod | 4.x |
| Bot | grammy | latest |
| Charts | chartjs-node-canvas + chart.js | latest |
| Database | MongoDB + GridFS | - |

## Architecture

**Agent does ALL thinking. Tools do ONLY simple operations.**

```
User → Telegram → grammY Bot → Mastra Agent → Tools (DB/workflow) → MongoDB
                                    ↕
                              Memory (MongoDB)
```

- Agent parses, categorizes, and reasons in a single LLM call
- Tools are simple operations (DB reads/writes, workflow triggers)
- Workflows handle multi-step processes (summary = fetch data + agent report)
- Memory provides conversation context (last 3 messages per user)
- All logging via Mastra PinoLogger (structured JSON)
- thinkingBudget: 0 disables Gemini reasoning tokens for fast responses (~3s)

## Key Files

| File | Purpose |
|------|---------|
| **Mastra Core** | |
| `src/mastra/mastra.instance.ts` | Mastra instance (agents, workflows, storage, logger) |
| `src/mastra/agents/finance.agent.ts` | Finance agent (instructions, model config, 5 tools) |
| `src/mastra/memory.ts` | Agent memory config (lastMessages: 3, no semantic recall) |
| `src/mastra/storage.ts` | Shared MongoDBStore (single connection for Mastra + Memory) |
| **Tools** | |
| `src/mastra/tools/transaction-storage.tool.ts` | Store transaction (with built-in duplicate check) |
| `src/mastra/tools/transaction-query.tool.ts` | Query transactions |
| `src/mastra/tools/transaction-update.tool.ts` | Update transaction |
| `src/mastra/tools/transaction-delete.tool.ts` | Delete transaction |
| `src/mastra/tools/spending-summary.tool.ts` | Run summary workflow (agent-callable) |
| **Workflows** | |
| `src/mastra/workflows/spending-summary.workflow.ts` | 2-step: fetch data → agent summary |
| `src/mastra/workflows/schema.ts` | Workflow step schemas |
| **Bot** | |
| `src/bot/handlers/message.handler.ts` | Text messages + retry logic + chart sending |
| `src/bot/handlers/media.handler.ts` | Photo/voice/document handling |
| `src/bot/handlers/summary.handler.ts` | /summary command handler |
| **Data** | |
| `src/database/schema.ts` | All schemas (transactions, tools, users, attachments) |
| `src/database/repositories/transaction.repository.ts` | MongoDB queries + aggregations |
| `src/database/client.ts` | MongoDB client + indexes + TTL cleanup |
| **Config** | |
| `src/config/constants.ts` | Gemini config, categories, thresholds |
| `src/config/environment.ts` | Env validation with zod |
| **Utils** | |
| `src/utils/chart.ts` | Server-side pie/bar chart generation (chartjs-node-canvas) |
| **Deploy** | |
| `Dockerfile` | Multi-stage Docker build for Railway |

## LLM Provider

Uses Google Gemini Flash via direct AI SDK provider:

```typescript
import { google } from '@ai-sdk/google';
model: google('gemini-flash-latest')
```

Performance: thinkingBudget: 0 applied at `agent.generate()` level to disable Gemini's built-in reasoning tokens. Response time: ~3s.

## Telegram Commands

| Command | Description |
|---------|-------------|
| `/summary` | Monthly spending summary + pie chart |
| `/summary week` | Last 7 days summary |
| `/summary bar` | Monthly summary with bar chart |
| Text messages | Agent handles logging, queries, edits, deletes |
| Photos/docs | Receipt/invoice extraction via agent vision |

## Commands

```bash
npm run dev          # Start with hot reload
npm run build        # Build for production
npm test             # Run tests
npm run lint         # Check code style
```

## Code Style

- TypeScript strict mode, no `any`
- `const` by default, async/await everywhere
- Functional programming preferred
- Validate external input with zod
- Never log API keys or tokens
- Use `mastra.getLogger()` — never `console.log`
- Schemas in dedicated schema files, not inline in tools/workflows
