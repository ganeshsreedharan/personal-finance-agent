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
│  ├─ Retry logic for empty Ollama responses                  │
│  ├─ Tool result fallback (extractToolReply)                 │
│  ├─ Chart generation for spending summaries                 │
│  └─ Structured logging via Mastra PinoLogger                │
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
│  ├─ Duplicate check before storing                          │
│  ├─ Query/update/delete existing transactions               │
│  ├─ Trigger spending summary workflow                       │
│  └─ Generate friendly response                              │
│                                                              │
│  MODEL: Gemini (cloud) or Ollama (local)                    │
│  MEMORY: Last 5 messages per thread (MongoDB)               │
│  TOOLS: 7 tools (see below)                                 │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ tool.execute()
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                         Tools (Simple)                        │
│                                                              │
│  store-transaction      → DB write                          │
│  query-transactions     → DB read                           │
│  update-transaction     → DB update                         │
│  delete-transaction     → DB delete                         │
│  check-duplicates       → DB query (similar txns)           │
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
memory.ts (Memory config: lastMessages=5, semanticRecall=false)
  ↑
finance.agent.ts (uses agentMemory)
  ↑
mastra.instance.ts (uses shared store + agent)
```

Key design decisions:
- **Single MongoDBStore** shared between Mastra instance and agent Memory (1 connection, not 2)
- **lastMessages: 5** — enough context for expense conversations without overhead
- **semanticRecall: false** — no vector search needed for a finance bot
- **TTL indexes: 90 days** — auto-cleanup old threads/messages in Mastra DB

---

## Schema Organization

Schemas are kept in dedicated files, not inline in tools/workflows:

| Schema file | Contains |
|-------------|----------|
| `src/database/schema.ts` | Transaction, User, Attachment schemas + all tool I/O schemas |
| `src/mastra/workflows/schema.ts` | Workflow step I/O schemas + shared sub-schemas |

This keeps tool and workflow files focused on pure logic.

---

## Ollama-Specific Workarounds

The Ollama models (qwen2.5, etc.) have known issues that require workarounds:

1. **Empty responses after tool calls**: `extractToolReply()` constructs replies from tool results
2. **Retry logic**: If model returns empty, handler retries with explicit prompt
3. **Language mixing**: Agent instructions enforce "MUST ALWAYS respond in English"
4. **Wrong year**: Today's date injected via context string
5. **Vendor missing on follow-ups**: Schema enforces `min(1)` on vendor field

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

## LLM Provider Configuration

Both providers use direct AI SDK packages — NOT Mastra's model router strings.

```typescript
import { google } from '@ai-sdk/google';           // Cloud
import { createOllama } from 'ollama-ai-provider-v2'; // Local

const getModelConfig = () => {
  if (LLM_PROVIDER.DEFAULT === 'ollama') {
    const ollama = createOllama({ baseURL: `${OLLAMA_CONFIG.BASE_URL}/api` });
    return ollama(OLLAMA_CONFIG.MODEL_NAME);
  }
  return google(GEMINI_CONFIG.MODEL_NAME);
};
```

**Why direct providers**: Full control, native Ollama API, no env variable hacks.

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
- ✅ 7 tools: store, query, update, delete, duplicates, spending-summary
- ✅ Spending summary workflow with chart visualisation (pie/bar)
- ✅ Conversation memory (last 5 messages, shared MongoDBStore)
- ✅ Photo/voice/document handling via agent vision
- ✅ Duplicate detection before storing
- ✅ Retry logic for Ollama empty responses
- ✅ Structured logging via Mastra PinoLogger
- ✅ TTL indexes for 90-day memory auto-cleanup
- ✅ /summary command with chart types

### Architecture Decisions
- Single MongoDBStore (not separate connections)
- No observability overhead (removed @mastra/observability)
- Schemas in dedicated files (database/schema.ts, workflows/schema.ts)
- Module-level logger instances (not per-call)

---

**Remember**: The agent is smart. Tools are dumb. Keep it that way.

---

**Last Updated**: 2026-02-16
