# Personal Finance AI Agent

## Workflow Rules

**Git Commit/Push:**
1. NEVER commit or push without explicit user confirmation
2. After changes: show what changed → ask "Should I commit and push?" → WAIT
3. Exception: only push without asking if user says "commit and push" or "push it now"

## What This Is

Telegram bot that tracks personal finances using AI. Users send expenses as text ("Rent 1250€"), photos (receipts), or PDFs (invoices). The bot extracts, categorizes, and stores transactions.

**Core Principle:** Never block the user from logging. If uncertain → default to "Misc" category.

## Tech Stack

| Component | Package | Version |
|-----------|---------|---------|
| Agent Framework | @mastra/core | 1.4.0 |
| Cloud LLM | @ai-sdk/google (Gemini) | 3.x |
| Local LLM | ollama-ai-provider-v2 (Ollama) | 3.x |
| Schema | zod | 4.x |
| Bot | grammy | latest |
| Database | MongoDB + GridFS | - |

## Architecture: Proper Agentic Pattern

**Agent does ALL thinking. Tools do ONLY simple operations.**

```
User → Telegram → grammY Bot → Mastra Agent (1 LLM call) → store-transaction tool (DB only) → MongoDB
```

- Agent parses, categorizes, and reasons in a single LLM call
- Tools are <50 lines, no LLM calls, no branching logic
- See `CONTEXT.md` for detailed guidelines and anti-patterns

## Key Files

| File | Purpose |
|------|---------|
| `src/mastra/agents/finance.agent.ts` | Main agent (instructions + model config) |
| `src/mastra/tools/transaction-storage.tool.ts` | Only tool — simple DB write |
| `src/bot/handlers/message.handler.ts` | Telegram message handling + typing indicator |
| `src/config/constants.ts` | LLM provider config, categories, thresholds |
| `src/config/environment.ts` | Env validation with zod |
| `CONTEXT.md` | Architectural guidelines and anti-patterns |

## LLM Providers

Both use direct AI SDK providers (not Mastra model router strings):

```typescript
import { google } from '@ai-sdk/google';           // Cloud
import { createOllama } from 'ollama-ai-provider-v2'; // Local
```

Switch via `LLM_PROVIDER=gemini` or `LLM_PROVIDER=ollama` in `.env.development`.

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
