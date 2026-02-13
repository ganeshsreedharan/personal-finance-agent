# Architectural Context & Agentic Pattern

**Purpose**: This document defines the core architectural principles and agentic patterns used in this project. It serves as a reference to prevent deviation from proper agent implementation.

---

## 🎯 Core Principle: Proper Agentic Pattern

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

## 🏗️ Architecture Overview

### Current Implementation (Phase 2 - Core Agent)

```typescript
┌─────────────────────────────────────────────────────────────┐
│                         User (Telegram)                      │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ "Rent 1250€"
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Telegram Bot (grammY)                     │
│                  message.handler.ts                          │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ agent.generate()
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   Finance Agent (Mastra)                     │
│                   finance.agent.ts                           │
│                                                              │
│  REASONING (in single LLM call):                            │
│  ├─ Parse: amount=1250, currency=EUR, vendor="Rent"        │
│  ├─ Categorize: category="Housing-Rent", recurring="yes"   │
│  ├─ Extract: userId from context                            │
│  └─ Decision: Call store-transaction tool                   │
│                                                              │
│  MODEL: google/gemini-flash-latest                          │
│  TOOLS: { 'store-transaction': transactionStorageTool }    │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ tool.execute({ userId, date, amount, ... })
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              store-transaction Tool (Simple)                 │
│            transaction-storage.tool.ts                       │
│                                                              │
│  SIMPLE OPERATION:                                          │
│  └─ transactionRepository.create({ ...input })              │
│                                                              │
│  NO LLM CALLS ✅                                            │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ MongoDB Write
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      MongoDB Atlas                           │
│                    transactions collection                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 What the Agent Does (LLM Reasoning)

The agent (powered by Gemini) performs ALL cognitive tasks in a single LLM call:

### 1. Natural Language Understanding
```
Input: "Rent 1250€ paid today"
Agent extracts:
  - amount: 1250
  - currency: EUR (from € symbol)
  - vendor: "Rent"
  - date: today's date in ISO format
  - notes: "paid today"
```

### 2. Categorization
```
Agent reasons:
  - "Rent" keyword → Housing-Rent category
  - Housing costs → recurring: "yes"
  - High confidence → confidenceScore: 0.95
```

### 3. Context Extraction
```
Agent finds:
  - userId from message context: "Context: userId=\"abc123\""
```

### 4. Tool Selection & Orchestration
```
Agent decides:
  - This is a transaction → use store-transaction tool
  - All data extracted → call tool with parameters
  - No other tools needed
```

### 5. Response Generation
```
Agent creates friendly response:
  - "Logged: €1250 — Housing-Rent — 2024-02-07 ✅ (Rent paid! One less thing to worry about)"
```

**Key Point**: ALL of the above happens in ONE Gemini API call via agent instructions.

---

## 🔧 What Tools Do (Simple Operations)

Tools perform ONLY simple, deterministic operations. **NO LLM calls allowed in tools.**

### Current Tool: `store-transaction`

```typescript
// ✅ CORRECT: Simple database operation
export const transactionStorageTool = createTool({
  id: 'store-transaction',
  description: 'Stores a transaction in MongoDB',
  inputSchema: z.object({
    userId: z.string(),
    date: z.string(),
    amount: z.number(),
    // ... other fields
  }),
  execute: async (input) => {
    // Simple operation: Just save to database
    const transaction = await transactionRepository.create(input);
    return { success: true, transactionId: transaction._id };
  }
});
```

### Examples of Valid Tool Operations

✅ **Database operations**: CRUD operations on MongoDB
✅ **API calls**: External service integrations (future: bank APIs)
✅ **File operations**: Save/read files (GridFS for receipts)
✅ **Calculations**: Simple math (currency conversion)
✅ **Formatting**: Date/number formatting

### Examples of INVALID Tool Operations

❌ **LLM calls**: Calling Gemini/GPT within a tool
❌ **Parsing natural language**: Text extraction from user input
❌ **Categorization**: Deciding categories or tags
❌ **Reasoning**: Any decision-making logic
❌ **Multi-step workflows**: Orchestrating other tools

---

## 🚫 Anti-Patterns to Avoid

### Anti-Pattern 1: Tools Calling LLMs

```typescript
// ❌ WRONG: Tool calls LLM
export const textParserTool = createTool({
  execute: async (input) => {
    // This is WRONG - tool shouldn't call LLM
    const result = await geminiService.generateJSON(prompt, schema);
    return result;
  }
});

// ✅ CORRECT: Agent does parsing in its instructions
// No separate tool needed!
```

### Anti-Pattern 2: Tool Chains That Could Be Agent Reasoning

```typescript
// ❌ WRONG: Multiple tools for cognitive tasks
tools: {
  'parse-text': parseTextTool,      // LLM call
  'categorize': categorizeTool,     // LLM call
  'store': storageTool,             // DB operation
}

// ✅ CORRECT: Agent does thinking, one tool for action
tools: {
  'store-transaction': storageTool  // Only DB operation
}
```

### Anti-Pattern 3: Workflows Instead of Agent Reasoning

```typescript
// ❌ WRONG: Hardcoded workflow
const workflow = new Workflow({
  steps: [
    { tool: 'parse', next: 'categorize' },
    { tool: 'categorize', next: 'store' },
    { tool: 'store', next: 'end' }
  ]
});

// ✅ CORRECT: Agent decides flow dynamically
// Agent instructions handle the logic
```

---

## 💡 Why This Pattern Matters

### 1. Cost Efficiency
```
Old pattern (3 tools with LLM calls):
  - Agent: 1 LLM call
  - parse-text tool: 1 LLM call
  - categorize tool: 1 LLM call
  Total: 3 LLM calls per transaction

New pattern (agent reasoning + 1 simple tool):
  - Agent: 1 LLM call (does parsing + categorizing)
  - store-transaction tool: 0 LLM calls (just DB)
  Total: 1 LLM call per transaction

Cost savings: 66% reduction (3x → 1x)
```

### 2. Latency
```
Old: 3 sequential LLM calls = ~3-6 seconds
New: 1 LLM call = ~1-2 seconds
Latency reduction: 50-75%
```

### 3. Complexity
```
Old: 3 tools to maintain, coordinate, debug
New: 1 tool to maintain (simple DB operation)
Maintenance reduction: 66%
```

### 4. Reliability
```
Old: 3 points of failure (each LLM call can fail)
New: 1 point of failure
Error rate reduction: 66%
```

---

## 📖 Implementation Guidelines

### Adding New Features

#### Scenario 1: Receipt Photo Processing (Phase 3)

```typescript
// ❌ WRONG: Create tool that calls vision API
export const photoParserTool = createTool({
  execute: async (input) => {
    const result = await geminiService.extractFromPhoto(input.photo);
    return result; // LLM call in tool - WRONG!
  }
});

// ✅ CORRECT: Agent handles vision, tool stores file
export const fileStorageTool = createTool({
  execute: async (input) => {
    // Simple operation: Save to GridFS
    const fileId = await gridFS.upload(input.file);
    return { fileId };
  }
});

// Agent instructions handle vision:
// "When you receive a photo, use your vision capabilities to extract
//  transaction details (amount, vendor, date). Then call store-transaction
//  with the extracted data, and file-storage to save the receipt."
```

#### Scenario 2: Duplicate Detection (Phase 4)

```typescript
// ❌ WRONG: AI-powered duplicate detection in tool
export const duplicateDetectorTool = createTool({
  execute: async (input) => {
    const similar = await findSimilar(input);
    const isDup = await geminiService.compareSimilarity(input, similar);
    return isDup; // LLM call in tool - WRONG!
  }
});

// ✅ CORRECT: Simple rule-based duplicate check
export const checkDuplicatesTool = createTool({
  execute: async (input) => {
    // Simple operation: Query DB for similar transactions
    const similar = await transactionRepository.findSimilar({
      userId: input.userId,
      vendor: input.vendor,
      amountRange: [input.amount * 0.95, input.amount * 1.05],
      dateRange: [input.date - 1day, input.date + 1day]
    });
    return { duplicates: similar }; // Just return data
  }
});

// Agent decides if it's a duplicate:
// "If check-duplicates returns results, analyze them and decide
//  if this is truly a duplicate. Ask user for confirmation."
```

#### Scenario 3: Summary Generation (Phase 4)

```typescript
// ❌ WRONG: LLM generates summary in tool
export const summaryGeneratorTool = createTool({
  execute: async (input) => {
    const data = await fetchTransactions(input);
    const summary = await geminiService.generateSummary(data);
    return summary; // LLM call in tool - WRONG!
  }
});

// ✅ CORRECT: Tool fetches data, agent generates summary
export const fetchTransactionsTool = createTool({
  execute: async (input) => {
    // Simple operation: Query DB
    const transactions = await transactionRepository.find({
      userId: input.userId,
      dateRange: input.dateRange
    });
    return { transactions }; // Just return data
  }
});

// Agent generates summary:
// "When user asks for summary, use fetch-transactions tool to get data,
//  then analyze it and create a friendly, insightful summary."
```

---

## 🔍 Code Review Checklist

Before implementing any new feature, check:

- [ ] **Does this tool call an LLM?** → If yes, move logic to agent instructions
- [ ] **Does this tool make decisions?** → If yes, move logic to agent instructions
- [ ] **Does this tool parse natural language?** → If yes, move to agent instructions
- [ ] **Is this tool doing something deterministic?** → If yes, tool is OK
- [ ] **Can the agent do this with its native reasoning?** → If yes, no tool needed
- [ ] **Is this just a database/API/file operation?** → If yes, tool is OK

---

## 🎓 Learning Resources

### Mastra Agentic Patterns
- Agents decide tool usage dynamically
- Tools are stateless, simple operations
- Agent instructions guide behavior

### Key Mastra Concepts
```typescript
import { Agent } from '@mastra/core/agent';
import { createTool } from '@mastra/core/tools';

// Agent = Brain (LLM reasoning)
const agent = new Agent({
  instructions: "Your cognitive abilities and decision-making logic",
  model: "google/gemini-flash-latest",
  tools: { /* Simple operation tools only */ }
});

// Tool = Hands (Simple actions)
const tool = createTool({
  execute: async (input) => {
    // Only simple, deterministic operations
    return result;
  }
});
```

---

## 📊 Current Status (Phase 2 Complete)

### Implemented ✅
- ✅ Proper agentic pattern with single-tool approach
- ✅ Agent does all parsing and categorization
- ✅ Simple store-transaction tool (DB only)
- ✅ 1 LLM call per transaction (cost-efficient)
- ✅ Friendly, conversational agent personality

### Removed ❌
- ❌ parse-transaction-text tool (redundant LLM call)
- ❌ categorize-transaction tool (redundant LLM call)
- ❌ transaction-processing workflow (unnecessary)

### Next Phases
- **Phase 3**: Photo processing (vision → file-storage tool)
- **Phase 4**: Duplicate detection (query tool → agent decides)
- **Phase 5**: Summaries (fetch tool → agent generates)

---

## 🚀 Success Metrics

Track these to ensure pattern compliance:

1. **LLM calls per transaction**: Should be 1
2. **Tool complexity**: Tools should be <50 lines, no branching logic
3. **Agent instruction length**: Can be long (detailed reasoning)
4. **Cost per 100 transactions**: Should be ~$0.10 or less
5. **Response time**: Should be 1-2 seconds (not 3-6 seconds)

---

## 💬 Questions to Ask Before Adding Code

1. **"Am I about to call an LLM in a tool?"** → Move to agent instructions
2. **"Could the agent figure this out on its own?"** → Don't create a tool
3. **"Is this tool making decisions?"** → Move logic to agent
4. **"Would this tool be the same if I used a different LLM?"** → If no, it's an anti-pattern

---

**Remember**: The agent is smart. Tools are dumb. Keep it that way.

**Last Updated**: 2024-02-07 (Phase 2 - Core Agent Complete)
