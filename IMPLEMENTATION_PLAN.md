# Personal Finance AI Agent - Implementation Plan

## 🎯 Project Overview

Build a TypeScript AI agent that tracks expenses, bills, and invoices via **Telegram**. The agent processes text messages, photos, and PDFs using **Claude AI** with vision capabilities, stores transactions in **MongoDB**, and provides weekly/monthly summaries.

**Core Principle**: Never block logging. Capture first, clarify later.

---

## 📚 Technology Stack

| Component | Technology | Why |
|-----------|-----------|-----|
| **Framework** | Mastra | TypeScript-native AI agent framework with tools, workflows, and memory |
| **Telegram Bot** | grammY | Best TypeScript support, latest Telegram Bot API |
| **LLM** | Anthropic Claude Sonnet 4.5 | Vision capabilities + structured outputs (guaranteed JSON) |
| **Database** | MongoDB | Flexible schema, built-in GridFS for file storage |
| **Document Processing** | Claude Vision + pdf-parse | OCR for receipts/invoices with fallback strategies |
| **Deployment** | Railway/Render | Start local, easy cloud deployment |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│      Telegram User                  │
│  (text / photo / PDF)               │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      grammY Bot Layer               │
│  • Message routing                  │
│  • File downloads                   │
│  • Response formatting              │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Mastra Finance Agent              │
│   (Claude Sonnet 4.5)               │
│                                     │
│  ┌──────────────┬────────────────┐ │
│  │   Tools      │   Workflows    │ │
│  │ • Parser     │ • Transaction  │ │
│  │ • Vision     │   Processing   │ │
│  │ • Categorize │ • Summaries    │ │
│  │ • Storage    │ • Duplicates   │ │
│  └──────────────┴────────────────┘ │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   MongoDB + GridFS                  │
│  • Transactions                     │
│  • Users                            │
│  • File attachments                 │
└─────────────────────────────────────┘
```

---

## 📁 Project Structure

```
personal-assistant/
├── src/
│   ├── index.ts                              # Application entry point
│   │
│   ├── config/
│   │   ├── environment.ts                    # Environment variables (Zod validation)
│   │   ├── categories.ts                     # Fixed category system (v1)
│   │   └── constants.ts                      # App constants
│   │
│   ├── bot/                                  # Telegram Bot Layer
│   │   ├── telegram.ts                       # grammY bot setup
│   │   ├── handlers/
│   │   │   ├── message.handler.ts            # Text messages
│   │   │   ├── photo.handler.ts              # Receipt photos
│   │   │   ├── document.handler.ts           # PDF invoices
│   │   │   └── command.handler.ts            # /start, /summary commands
│   │   └── middleware/
│   │       ├── error.middleware.ts           # Error handling (never crash)
│   │       └── logging.middleware.ts         # Request logging
│   │
│   ├── mastra/                               # AI Agent Layer
│   │   ├── index.ts                          # Mastra instance
│   │   │
│   │   ├── agents/
│   │   │   ├── finance.agent.ts              # 🔑 Main agent (Claude)
│   │   │   └── prompts/
│   │   │       └── system-prompt.ts          # From prompt-contract.md
│   │   │
│   │   ├── tools/                            # 8 Tools
│   │   │   ├── text-parser.tool.ts           # Parse "Rent 1250€"
│   │   │   ├── vision-extractor.tool.ts      # Claude vision for receipts
│   │   │   ├── pdf-parser.tool.ts            # PDF extraction
│   │   │   ├── categorizer.tool.ts           # Assign category
│   │   │   ├── duplicate-detector.tool.ts    # Find duplicates
│   │   │   ├── transaction-storage.tool.ts   # CRUD operations
│   │   │   ├── summary-generator.tool.ts     # Weekly/monthly reports
│   │   │   └── recurring-tracker.tool.ts     # Track bills
│   │   │
│   │   └── workflows/                        # Multi-step processes
│   │       ├── transaction-processing.workflow.ts
│   │       ├── weekly-summary.workflow.ts
│   │       ├── monthly-summary.workflow.ts
│   │       └── duplicate-resolution.workflow.ts
│   │
│   ├── database/                             # Data Layer
│   │   ├── client.ts                         # MongoDB connection
│   │   ├── models/
│   │   │   ├── transaction.model.ts          # 🔑 Transaction schema
│   │   │   ├── user.model.ts                 # User profile
│   │   │   └── attachment.model.ts           # File metadata
│   │   └── repositories/
│   │       ├── transaction.repository.ts     # Data access methods
│   │       └── user.repository.ts
│   │
│   ├── services/                             # Business Services
│   │   ├── file-storage.service.ts           # GridFS file handling
│   │   ├── claude.service.ts                 # 🔑 Claude API wrapper
│   │   └── scheduler.service.ts              # Cron jobs (summaries)
│   │
│   ├── types/                                # TypeScript Types
│   │   ├── transaction.types.ts
│   │   ├── category.types.ts
│   │   └── common.types.ts
│   │
│   └── utils/                                # Utilities
│       ├── validators.ts                     # Input validation
│       ├── formatters.ts                     # Response formatting
│       └── date-helpers.ts                   # Date utilities
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .env.example                              # Environment template
├── .env.development                          # Local dev config
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

**🔑 = Critical files to implement first**

---

## 🧩 Core Components

### 1. Finance Agent

**File**: `src/mastra/agents/finance.agent.ts`

The brain of the system. Orchestrates all transaction processing.

```typescript
import { Agent } from '@mastra/core';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

const TransactionSchema = z.object({
  date: z.string().datetime(),
  amount: z.number().positive(),
  currency: z.enum(['EUR', 'USD', 'GBP']),
  vendor: z.string(),
  category: z.enum([
    'Housing-Rent',
    'Utilities-Electricity',
    'Utilities-Internet',
    'Childcare-Kita',
    'Transport',
    'Investments-Scalable Capital',
    'Groceries',
    'Eating Out',
    'Subscriptions',
    'Health',
    'Shopping',
    'Travel',
    'Misc'
  ]),
  recurring: z.enum(['yes', 'no', 'unknown']),
  notes: z.string().optional(),
  attachmentId: z.string().optional(),
  confidenceScore: z.number().min(0).max(1),
});

export const financeAgent = new Agent({
  name: 'Personal Finance Agent',
  instructions: SYSTEM_PROMPT, // From prompt-contract.md
  model: anthropic('claude-sonnet-4-5-20250929'),
  tools: {
    textParser,
    visionExtractor,
    pdfParser,
    categorizer,
    duplicateDetector,
    transactionStorage,
    summaryGenerator,
    recurringTracker
  },
  enableMemory: true,
  outputSchema: TransactionSchema,
});
```

**Categories (Locked v1)**:
- **Structural/Recurring**: Housing–Rent, Utilities–Electricity, Utilities–Internet, Childcare–Kita, Transport, Investments–Scalable Capital
- **Daily Life**: Groceries, Eating Out, Subscriptions, Health, Shopping, Travel, Misc

**Special Rules**:
- Investments excluded from spending totals
- Default to "Misc" if uncertain
- Never block logging

### 2. Telegram Bot

**File**: `src/bot/telegram.ts`

Handles all user interactions via Telegram.

```typescript
import { Bot } from 'grammy';

export function createBot(token: string) {
  const bot = new Bot(token);

  // Middleware
  bot.use(loggingMiddleware);
  bot.use(errorMiddleware);

  // Commands
  bot.command('start', handleStart);
  bot.command('summary', handleSummary);
  bot.command('weekly', handleWeekly);
  bot.command('monthly', handleMonthly);

  // Messages
  bot.on('message:text', handleTextMessage);
  bot.on('message:photo', handlePhoto);
  bot.on('message:document', handleDocument);

  return bot;
}
```

**Message Flow**:
1. User sends message
2. Bot routes to appropriate handler
3. Handler invokes Mastra agent
4. Agent returns structured Transaction
5. Bot sends confirmation: `Logged: €45.60 — Groceries — 01 Feb 2026 ✅`

### 3. Tools (8 Total)

#### a. Text Parser
- Parses natural language: "Rent 1250€ paid"
- Extracts: amount, vendor, date
- Uses Claude for understanding context

#### b. Vision Extractor
- Processes receipt photos via Claude vision
- Extracts: amount, vendor, date, line items
- Returns confidence score
- Warns for bank screenshots

#### c. PDF Parser
- Text extraction (pdf-parse) first
- Falls back to Claude vision for scanned PDFs
- Extracts: invoice date, amount, vendor

#### d. Categorizer
- Assigns category based on vendor + context
- Learns from user corrections
- Caches vendor → category mappings
- Defaults to "Misc" when uncertain

#### e. Duplicate Detector
- Checks last 48 hours
- Matches: same vendor + similar amount (±5%) + same date
- Returns matches, never auto-merges
- User decides: merge or keep both

#### f. Transaction Storage
- CRUD operations on MongoDB
- Links attachments
- Maintains indexes for fast queries

#### g. Summary Generator
- Aggregates transactions by period
- Groups by category
- Excludes investments from spending
- Generates "one notable insight" via Claude
- Formats for 30-second readability

#### h. Recurring Tracker
- Tracks expected bills (rent, utilities, kita)
- Detects missing payments
- Alerts on >15% increases

### 4. Workflows

#### Transaction Processing Workflow

```
1. Determine input type (text/photo/PDF)
   ↓
2. Extract data (route to appropriate tool)
   ↓
3. Categorize (categorizer tool)
   ↓
4. Check duplicates (duplicate detector)
   ↓
5. Resolve duplicates (suspend if needed, await user input)
   ↓
6. Store transaction (storage tool)
   ↓
7. Format confirmation response
```

#### Weekly Summary Workflow

```
1. Calculate dates (last 7 days)
   ↓
2. Generate summary (parallel):
   - Query transactions
   - Check recurring bills
   ↓
3. Format and send via Telegram
```

### 5. Database Schemas

#### Transactions Collection

```typescript
{
  _id: ObjectId,
  userId: string,
  date: Date,
  amount: number,
  currency: 'EUR' | 'USD' | 'GBP',
  vendor: string,
  category: string,
  recurring: 'yes' | 'no' | 'unknown',
  notes?: string,
  attachmentId?: string,
  confidenceScore: number,
  source: 'text' | 'photo' | 'pdf',
  isDuplicate: boolean,
  originalTransactionId?: string,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `{ userId: 1, date: -1 }` - date range queries
- `{ userId: 1, vendor: 1, date: -1 }` - duplicate detection
- `{ userId: 1, category: 1, date: -1 }` - category summaries

#### Users Collection

```typescript
{
  _id: ObjectId,
  telegramId: string (unique),
  telegramUsername?: string,
  defaultCurrency: 'EUR' | 'USD' | 'GBP',
  timezone: string,
  recurringBills: [{
    category: string,
    expectedAmount: number,
    dueDay: number,
    lastPaid?: Date
  }],
  vendorCategoryMap: Record<string, string>,
  createdAt: Date,
  lastActive: Date
}
```

#### Attachments Collection (GridFS)

```typescript
{
  _id: ObjectId,
  userId: string,
  transactionId?: string,
  filename: string,
  mimeType: string,
  size: number,
  gridFsId: string,
  uploadedAt: Date,
  source: 'telegram_photo' | 'telegram_document'
}
```

---

## ⚙️ Environment Setup

### Prerequisites

1. **Telegram Bot Token**
   ```
   - Open Telegram, message @BotFather
   - Send: /newbot
   - Follow prompts, save token
   ```

2. **Anthropic API Key**
   ```
   - Sign up: https://console.anthropic.com
   - Create API key
   ```

3. **MongoDB**
   ```bash
   # Local development
   docker run -d -p 27017:27017 --name finance-mongo mongo:latest

   # Or use MongoDB Atlas (free tier)
   ```

### Environment Variables

Create `.env.development`:

```bash
# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather

# Claude AI
ANTHROPIC_API_KEY=your_anthropic_api_key

# MongoDB
MONGODB_URI=mongodb://localhost:27017/finance-agent
MONGODB_DATABASE=finance-agent

# Storage
STORAGE_TYPE=gridfs

# Scheduler (for automated summaries)
ENABLE_SCHEDULER=true
WEEKLY_SUMMARY_CRON=0 9 * * 1        # Monday 9 AM
MONTHLY_SUMMARY_CRON=0 9 1 * *       # 1st of month 9 AM

# Logging
LOG_LEVEL=info
NODE_ENV=development
```

### Dependencies

```json
{
  "dependencies": {
    "@mastra/core": "^0.1.0",
    "@ai-sdk/anthropic": "^1.0.0",
    "@anthropic-ai/sdk": "^0.32.0",
    "grammy": "^1.30.0",
    "mongodb": "^6.12.0",
    "zod": "^3.24.1",
    "dotenv": "^16.4.7",
    "pdf-parse": "^2.4.5",
    "date-fns": "^4.1.0",
    "node-cron": "^3.0.3",
    "pino": "^9.6.0"
  },
  "devDependencies": {
    "@types/node": "^22.10.5",
    "@types/pdf-parse": "^1.1.4",
    "typescript": "^5.7.2",
    "tsx": "^4.19.2",
    "vitest": "^2.1.8"
  }
}
```

---

## 🚀 Implementation Sequence

### Phase 1: Foundation (Week 1)

**Goal**: Basic project setup and simple text processing

- [ ] Initialize TypeScript project with folder structure
- [ ] Setup MongoDB connection and basic schemas
- [ ] Create environment configuration with Zod validation
- [ ] Implement basic Telegram bot (text messages only)
- [ ] Create simple text parser (direct, without full agent)

**Deliverable**: Bot receives "Rent 1250€" and responds with echo

### Phase 2: Core Agent (Week 2)

**Goal**: Mastra agent with text processing end-to-end

- [ ] Configure Mastra instance
- [ ] Implement finance agent with system prompt
- [ ] Create text-parser tool
- [ ] Create categorizer tool
- [ ] Create transaction-storage tool
- [ ] Wire up: text message → agent → storage → response

**Deliverable**: "Rent 1250€" → stored in MongoDB → "Logged: €1250 — Housing-Rent — 01 Feb 2026 ✅"

### Phase 3: File Processing (Week 3)

**Goal**: Photo and PDF support

- [ ] Implement file-storage service (GridFS)
- [ ] Create photo handler in Telegram bot
- [ ] Implement vision-extractor tool (Claude vision)
- [ ] Create PDF handler
- [ ] Implement pdf-parser tool (pdf-parse + Claude fallback)

**Deliverable**: Receipt photo → extracted data → stored transaction

### Phase 4: Advanced Features (Week 4)

**Goal**: Duplicates and summaries

- [ ] Implement duplicate-detector tool
- [ ] Create duplicate-resolution workflow
- [ ] Implement summary-generator tool
- [ ] Create weekly-summary workflow
- [ ] Create monthly-summary workflow
- [ ] Implement recurring-tracker tool

**Deliverable**: Duplicate detection works, summaries generate correctly

### Phase 5: Automation & Polish (Week 5)

**Goal**: Automated summaries and robustness

- [ ] Implement scheduler service (node-cron)
- [ ] Add command handlers (/summary, /weekly, /monthly)
- [ ] Enhance error handling (never crash, always log)
- [ ] Add comprehensive logging (pino)
- [ ] Write unit tests (Vitest)
- [ ] Write integration tests

**Deliverable**: Automated weekly/monthly summaries, robust error handling

### Phase 6: Deployment (Week 6)

**Goal**: Production deployment

- [ ] Create Dockerfile
- [ ] Setup MongoDB Atlas (cloud)
- [ ] Deploy to Railway or Render
- [ ] Configure production environment variables
- [ ] Setup monitoring and logging
- [ ] User acceptance testing

**Deliverable**: 24/7 production deployment

---

## 🔑 Critical Files (Implement First)

These 5 files form the foundation:

### 1. `src/mastra/agents/finance.agent.ts`
- Core agent orchestrating all processing
- Embeds prompt-contract.md as system instructions
- Defines Transaction output schema
- Registers all 8 tools

### 2. `src/bot/telegram.ts`
- grammY bot initialization
- Message routing (text/photo/PDF)
- Command registration (/start, /summary)
- Bot lifecycle management

### 3. `src/mastra/workflows/transaction-processing.workflow.ts`
- Main business logic flow
- Extract → Categorize → Check duplicates → Store → Respond
- Handles all input types

### 4. `src/database/models/transaction.model.ts`
- Canonical Transaction schema (Zod)
- MongoDB model definition
- Repository methods (create, find, update, delete)

### 5. `src/services/claude.service.ts`
- Claude API wrapper
- Vision extraction with structured outputs
- PDF processing
- Categorization and insight generation

---

## ✅ Verification Plan

### Manual Testing Checklist

**Text Input**:
- [ ] "Rent 1250€ paid" → Housing-Rent
- [ ] "Groceries 34.60 at REWE" → Groceries
- [ ] "Random thing 20€" → Misc (uncertain)
- [ ] "Scalable Capital 300€" → Investments

**Photo Input**:
- [ ] Receipt photo → extracts vendor, amount, date
- [ ] Bank screenshot → extracts + warns
- [ ] Low quality photo → still logs (never blocks)

**PDF Input**:
- [ ] Text PDF invoice → extracts correctly
- [ ] Scanned PDF → falls back to vision

**Duplicate Detection**:
- [ ] Same transaction twice → asks user
- [ ] Similar but different → doesn't flag

**Summaries**:
- [ ] Weekly excludes investments from spending
- [ ] Monthly shows category changes
- [ ] One insight included (factual, neutral)

**Commands**:
- [ ] `/start` → welcome message
- [ ] `/summary` → current summary
- [ ] `/weekly` → last 7 days
- [ ] `/monthly` → current month

### Integration Tests

```typescript
describe('Transaction Processing', () => {
  test('text message → transaction stored');
  test('receipt photo → transaction stored');
  test('PDF invoice → transaction stored');
  test('duplicate detected → user prompted');
  test('uncertain category → defaults to Misc');
});

describe('Summaries', () => {
  test('weekly summary excludes investments');
  test('monthly summary includes insights');
});
```

### End-to-End Test

1. Start bot
2. Send "Rent 1250€"
3. Verify response: "Logged: €1250 — Housing-Rent — [date] ✅"
4. Send receipt photo
5. Verify extraction and storage
6. Send duplicate → verify warning
7. Request `/weekly` → verify format
8. Check MongoDB → verify data

---

## 🚢 Deployment

### Local Development

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env.development
# Edit with your tokens

# Start MongoDB
docker run -d -p 27017:27017 --name finance-mongo mongo:latest

# Run dev server
npm run dev

# Test in Telegram
# Message your bot: "Groceries 45€"
```

### Production (Railway)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize
railway init

# Add environment variables
railway variables set TELEGRAM_BOT_TOKEN=xxx
railway variables set ANTHROPIC_API_KEY=xxx
railway variables set MONGODB_URI=xxx

# Deploy
railway up
```

### Docker

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .
RUN npm run build

CMD ["node", "dist/index.js"]
```

---

## 💰 Cost Estimates

**Monthly costs (personal use)**:

- **Claude API**: $10-30 (depends on photo/PDF volume)
  - Text parsing: ~$0.003 per request
  - Vision extraction: ~$0.015 per image
  - Haiku for categorization: ~$0.0003 per request

- **MongoDB Atlas**: Free tier (512MB sufficient for personal use)

- **Hosting (Railway/Render)**: $5-10

**Total**: ~$15-40/month

**Cost optimization tips**:
- Cache vendor → category mappings
- Use Claude Haiku for simple tasks (95% cheaper)
- Use pdf-parse before expensive vision calls
- Batch summary generation

---

## 🎯 Key Design Principles

### 1. Never Block Logging
- Default to "Misc" category if uncertain
- Store first, clarify later
- Log confidence scores, allow corrections

### 2. User Authority
- Never auto-merge duplicates (always ask)
- Allow category corrections
- Learn from user feedback

### 3. Structured Outputs
- Use Claude's JSON schema feature
- Zero parsing errors
- Type-safe throughout

### 4. Neutral Tone
- No judgment on spending
- No advice
- Factual insights only

### 5. Incremental Implementation
- Each phase has testable deliverable
- Can deploy after Phase 2 (basic functionality)
- Add features incrementally

---

## 🔮 Future Enhancements (v2+)

**Potential features**:
- Multi-currency with auto-conversion
- Optional budget tracking (opt-in)
- Receipt search (full-text)
- CSV/PDF export for taxes
- Web dashboard
- Shared expenses (split bills)
- Voice message support
- Bank integration (PSD2 APIs)
- Custom categories (with migration)
- Anomaly detection (unusual spending patterns)

---

## 📚 Resources

- [Mastra Documentation](https://mastra.ai/docs)
- [Mastra Personal Assistant Example](https://github.com/mastra-ai/personal-assistant-example)
- [grammY Documentation](https://grammy.dev/)
- [Claude Structured Outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)
- [MongoDB Schema Design](https://www.mongodb.com/developer/products/mongodb/mongodb-schema-design-best-practices/)

---

## 🎓 Getting Started

### Quick Start (5 steps)

1. **Clone and setup**
   ```bash
   mkdir personal-assistant && cd personal-assistant
   npm init -y
   npm install [dependencies from package.json]
   ```

2. **Get credentials**
   - Create Telegram bot (message @BotFather)
   - Get Anthropic API key (console.anthropic.com)
   - Setup MongoDB (local or Atlas)

3. **Configure**
   ```bash
   cp .env.example .env.development
   # Add your tokens
   ```

4. **Implement Phase 1**
   - Follow implementation sequence
   - Start with basic text processing

5. **Test**
   ```bash
   npm run dev
   # Message your bot in Telegram
   ```

---

## 📝 Summary

This plan provides a complete roadmap for building a personal finance AI agent in TypeScript. The architecture leverages:

- **Mastra** for agent orchestration and workflows
- **grammY** for robust Telegram integration
- **Claude Vision** with structured outputs for reliable extraction
- **MongoDB** for flexible data storage

**Timeline**: 6 weeks from setup to production

**Success Factors**:
1. Never block user logging (core principle)
2. Structured outputs prevent errors
3. Tool composition keeps code modular
4. User authority on all decisions
5. Incremental, testable implementation

**Ready to start?** Begin with Phase 1 and build incrementally!
