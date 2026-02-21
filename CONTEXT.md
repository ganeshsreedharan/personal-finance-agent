# Architectural Context & Agentic Pattern

**Purpose**: This document defines the core architectural principles and agentic patterns used in this project. It serves as a reference to prevent deviation from proper agent implementation.

---

## Core Principle: Proper Agentic Pattern

**The Agent does ALL thinking. Tools do ONLY simple operations.**

```
❌ WRONG (Anti-pattern):
User Message → Agent (LLM call) → Tool 1 (LLM call) → Tool 2 (LLM call) → Tool 3 (DB)
Result: 3 LLM calls, high cost, high latency

✅ CORRECT (Proper agentic pattern):
User Message → Agent (LLM call with reasoning) → Tool (DB operation only)
Result: 1 LLM call, low cost, low latency
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         User (Telegram)                      │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ Text / Photo / Voice / Document
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Telegram Bot (grammY)                      │
│         message.handler / media.handler / summary.handler    │
│                                                              │
│  Features:                                                   │
│  ├─ Typing indicator while agent thinks                     │
│  ├─ Tool result fallback (extractToolReply)                 │
│  ├─ Chart generation for spending summaries                 │
│  ├─ Structured logging via Mastra PinoLogger                │
│  └─ thinkingBudget: 0 to disable Gemini reasoning tokens   │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ agent.generate() with memory
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   Finance Agent (Mastra)                      │
│                   finance.agent.ts                            │
│                                                              │
│  REASONING (in single LLM call):                            │
│  ├─ Parse: amount, currency, vendor, date                   │
│  ├─ Categorize: category, recurring status                  │
│  ├─ Store with built-in duplicate check                     │
│  ├─ Query/update/delete existing transactions               │
│  ├─ Trigger spending summary workflow                       │
│  └─ Generate friendly response                              │
│                                                              │
│  MODEL: Google Gemini Flash (gemini-flash-latest)            │
│  MEMORY: Last 3 messages per thread (MongoDB)               │
│  TOOLS: 5 tools (see below)                                 │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ tool.execute()
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                         Tools (Simple)                        │
│                                                              │
│  store-transaction      → DB write (with duplicate check)   │
│  query-transactions     → DB read                           │
│  update-transaction     → DB update                         │
│  delete-transaction     → DB delete                         │
│  spending-summary       → Runs workflow (fetch + summarize) │
│                                                              │
│  ALL tools: NO LLM calls, <50 lines, simple operations     │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                        MongoDB                               │
│                                                              │
│  App DB:    transactions, users, attachments                │
│  Mastra DB: messages, threads (90-day TTL auto-cleanup)     │
│                                                              │
│  Connection: Shared MongoDBStore (single connection)         │
│  Indexes: userId+date, userId+vendor, TTL on memory         │
└─────────────────────────────────────────────────────────────┘
```

---

## Workflows

Workflows are used for multi-step processes where data flows through defined stages.
The agent can trigger workflows via tools.

### Spending Summary Workflow

```
Step 1: fetch-transaction-data (pure data — no LLM)
  → Queries MongoDB for date range
  → Aggregates by category
  → Picks top 5 largest transactions

Step 2: generate-summary (agent-powered)
  → Uses finance agent to create natural-language report
  → Returns summary text + category breakdown

Trigger: Agent calls spending-summary tool, or user sends /summary command
Output: Text summary + pie/bar chart image sent to Telegram
```

**When to use workflows vs agent reasoning:**
- **Workflow**: Multi-step data pipeline with defined stages (fetch → transform → generate)
- **Agent reasoning**: Single-step cognitive tasks (parse, categorize, decide)

---

## Tool Design Rules

### Valid Tool Operations
✅ Database operations: CRUD on MongoDB
✅ Workflow triggers: Running registered workflows
✅ API calls: External service integrations
✅ File operations: GridFS for receipts
✅ Calculations: Simple math (currency conversion)

### Invalid Tool Operations
❌ LLM calls inside tools
❌ Natural language parsing
❌ Categorization or decision-making
❌ Complex branching logic

---

## Memory & Storage Architecture

```
storage.ts (shared MongoDBStore — single connection)
  ↑
memory.ts (Memory config: lastMessages=3, semanticRecall=false)
  ↑
finance.agent.ts (uses agentMemory)
  ↑
mastra.instance.ts (uses shared store + agent)
```

Key design decisions:
- **Single MongoDBStore** shared between Mastra instance and agent Memory (1 connection, not 2)
- **lastMessages: 3** — minimal context for expense conversations without overhead
- **semanticRecall: false** — no vector search needed for a finance bot
- **TTL indexes: 90 days** — auto-cleanup old threads/messages in Mastra DB

---

## Performance Optimizations

Key optimizations applied to reduce response time from ~66s to ~3s:

1. **thinkingBudget: 0** — Disables Gemini 2.5 Flash's built-in reasoning tokens (was consuming ~18s per call). Applied via `providerOptions` in `agent.generate()`.
2. **Merged duplicate check into store tool** — Eliminated 1 LLM roundtrip per expense (3 steps → 2 steps). The store-transaction tool now internally checks for duplicates.
3. **Reduced memory to 3 messages** — Less context to process per request.
4. **Compact agent instructions** — ~60% shorter instructions, fewer tokens per call.

---

## Schema Organization

Schemas are kept in dedicated files, not inline in tools/workflows:

| Schema file | Contains |
|-------------|----------|
| `src/database/schema.ts` | Transaction, User, Attachment schemas + all tool I/O schemas |
| `src/mastra/workflows/schema.ts` | Workflow step I/O schemas + shared sub-schemas |

This keeps tool and workflow files focused on pure logic.

---

## LLM Configuration

Uses Google Gemini Flash via the AI SDK provider:

```typescript
import { google } from '@ai-sdk/google';

model: google('gemini-flash-latest')
```

**Why direct provider**: Full control over model config, native Google AI SDK integration, no wrapper overhead.

**thinkingBudget: 0**: Gemini 2.5 Flash has built-in "thinking" mode enabled by default. This adds ~18s of hidden reasoning per call. Disabled via `providerOptions` at the `agent.generate()` level.

---

## Logging

All handlers use Mastra PinoLogger (structured JSON). No `console.log` in handlers.

```typescript
const logger = mastra.getLogger();
logger.info('Agent responded', { userId, elapsed, steps });
logger.warn('Empty response, retrying', { userId, message });
logger.error('Tool error', { error });
```

---

## Code Review Checklist

Before implementing any new feature:

- [ ] Does this tool call an LLM? → Move logic to agent instructions
- [ ] Does this tool make decisions? → Move logic to agent instructions
- [ ] Is this a multi-step data pipeline? → Consider a workflow
- [ ] Are schemas inline in tool/workflow files? → Move to schema file
- [ ] Using console.log? → Use mastra.getLogger() instead
- [ ] Is the tool <50 lines with no branching? → Good
- [ ] Can the agent do this with its native reasoning? → Don't create a tool

---

## Current Status

### Implemented
- ✅ Proper agentic pattern — agent does all reasoning
- ✅ 5 tools: store (with duplicate check), query, update, delete, spending-summary
- ✅ Spending summary workflow with chart visualisation (pie/bar)
- ✅ Conversation memory (last 3 messages, shared MongoDBStore)
- ✅ Photo/voice/document handling via agent vision
- ✅ Duplicate detection built into store tool
- ✅ Structured logging via Mastra PinoLogger
- ✅ TTL indexes for 90-day memory auto-cleanup
- ✅ /summary command with chart types
- ✅ Performance optimized (~3s response time with thinkingBudget: 0)
- ✅ Dockerfile for Railway deployment

### Architecture Decisions
- Single MongoDBStore (not separate connections)
- Schemas in dedicated files (database/schema.ts, workflows/schema.ts)
- Module-level logger instances (not per-call)
- Gemini-only (no local LLM provider)

---

**Remember**: The agent is smart. Tools are dumb. Keep it that way.

---

**Last Updated**: 2026-02-21
