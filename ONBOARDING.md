# 🚀 Onboarding Guide - Personal Finance AI Agent

Welcome! This guide will get you up and running in **15-20 minutes**.

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Project Structure](#project-structure)
5. [Key Concepts](#key-concepts)
6. [Development Workflow](#development-workflow)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)
9. [Next Steps](#next-steps)

---

## 🎯 Project Overview

**What is this?**
A Telegram bot that tracks personal finances using AI. Users send expenses via text, photos, or PDF invoices, and the bot automatically categorizes and stores them.

**Tech Stack**:
- **Language**: TypeScript
- **Bot**: grammY (Telegram)
- **AI**: Google Gemini 1.5 Flash (vision + text)
- **Framework**: Mastra (agent orchestration)
- **Database**: MongoDB + GridFS
- **Deployment**: Railway ($5/month)

**Core Principle**:
> Never block the user from logging a transaction. If uncertain, default to "Misc" category.

---

## ✅ Prerequisites

### Required

- **Node.js 20-21** (v24 might work but unsupported by Mastra)
- **npm** 9+
- **Git**
- **MongoDB** (Docker or Atlas account)

### Accounts Needed

- **Telegram** account (to create bot)
- **Google** account (for Gemini API)
- **MongoDB Atlas** account (optional, for cloud DB)

### Check Your Setup

```bash
node --version    # Should be v20.x or v21.x
npm --version     # Should be 9.x or higher
git --version     # Any recent version
docker --version  # Optional, for local MongoDB
```

---

## 🚀 Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd personal-assistant

# Install dependencies
npm install
```

### 2. Get Credentials

You need **three credentials**:

#### A. Gemini API Key
1. Go to: https://aistudio.google.com/app/apikey
2. Click "Create API key in new project"
3. Copy the key (looks like `AIzaSy...`)

#### B. Telegram Bot Token
1. Open Telegram, search for `@BotFather`
2. Send: `/newbot`
3. Follow prompts, copy token (looks like `1234567890:ABC...`)

#### C. MongoDB
**Option 1 - Docker (Local)**:
```bash
docker run -d \
  --name finance-mongo \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password123 \
  mongo:latest
```

**Option 2 - Atlas (Cloud)**:
1. Go to: https://www.mongodb.com/cloud/atlas/register
2. Create free M0 cluster
3. Create database user
4. Get connection string

### 3. Configure Environment

```bash
# Copy template
cp .env.example .env.development

# Edit with your credentials
nano .env.development
```

```bash
# .env.development
TELEGRAM_BOT_TOKEN=your_telegram_token
GOOGLE_API_KEY=your_gemini_key
MONGODB_URI=your_mongodb_connection_string
```

### 4. Start Development Server

```bash
npm run dev
```

You should see:
```
Bot started: @your_bot_name
MongoDB connected
```

### 5. Test Your Bot

1. Open Telegram
2. Find your bot
3. Send: `Rent 1250€ paid`
4. Bot should respond: `Logged: €1250 — Housing-Rent — [date] ✅`

---

## 📁 Project Structure

```
personal-assistant/
├── src/
│   ├── index.ts                    # Application entry point
│   │
│   ├── config/                     # Configuration
│   │   ├── environment.ts          # Env validation (Zod)
│   │   ├── categories.ts           # Fixed categories
│   │   └── constants.ts
│   │
│   ├── bot/                        # Telegram Bot
│   │   ├── telegram.ts             # Bot initialization
│   │   ├── handlers/               # Message handlers
│   │   │   ├── message.handler.ts  # Text messages
│   │   │   ├── photo.handler.ts    # Receipt photos
│   │   │   ├── document.handler.ts # PDF invoices
│   │   │   └── command.handler.ts  # Bot commands
│   │   └── middleware/
│   │       ├── error.middleware.ts # Error handling
│   │       └── logging.middleware.ts
│   │
│   ├── mastra/                     # AI Agent Layer
│   │   ├── index.ts                # Mastra instance
│   │   ├── agents/
│   │   │   ├── finance.agent.ts    # Main AI agent
│   │   │   └── prompts/
│   │   │       └── system-prompt.ts
│   │   ├── tools/                  # 8 Mastra tools
│   │   │   ├── text-parser.tool.ts
│   │   │   ├── vision-extractor.tool.ts
│   │   │   ├── pdf-parser.tool.ts
│   │   │   ├── categorizer.tool.ts
│   │   │   ├── duplicate-detector.tool.ts
│   │   │   ├── transaction-storage.tool.ts
│   │   │   ├── summary-generator.tool.ts
│   │   │   └── recurring-tracker.tool.ts
│   │   └── workflows/              # Multi-step flows
│   │       ├── transaction-processing.workflow.ts
│   │       ├── weekly-summary.workflow.ts
│   │       ├── monthly-summary.workflow.ts
│   │       └── duplicate-resolution.workflow.ts
│   │
│   ├── database/                   # Database Layer
│   │   ├── client.ts               # MongoDB connection
│   │   ├── models/                 # Schemas
│   │   │   ├── transaction.model.ts
│   │   │   ├── user.model.ts
│   │   │   └── attachment.model.ts
│   │   └── repositories/           # Data access
│   │       ├── transaction.repository.ts
│   │       └── user.repository.ts
│   │
│   ├── services/                   # Business Services
│   │   ├── file-storage.service.ts # GridFS operations
│   │   ├── gemini.service.ts       # Gemini API wrapper
│   │   └── scheduler.service.ts    # Cron jobs
│   │
│   ├── types/                      # TypeScript Types
│   │   ├── transaction.types.ts
│   │   ├── category.types.ts
│   │   └── common.types.ts
│   │
│   └── utils/                      # Utilities
│       ├── validators.ts
│       ├── formatters.ts
│       └── date-helpers.ts
│
├── tests/                          # Test files
├── .env.development                # Local config (gitignored)
├── .env.example                    # Template
├── package.json
├── tsconfig.json
├── claude.md                       # Project docs
├── IMPLEMENTATION_PLAN.md          # Full roadmap
├── TYPESCRIPT_GUIDE.md             # TS best practices
└── ONBOARDING.md                   # This file
```

---

## 🧩 Key Concepts

### 1. Transaction Object

Everything centers around the **Transaction**:

```typescript
interface Transaction {
  date: Date;
  amount: number;
  currency: 'EUR' | 'USD' | 'GBP';
  vendor: string;
  category: string; // From fixed list
  recurring: 'yes' | 'no' | 'unknown';
  notes?: string;
  attachmentId?: string;
  confidenceScore: number; // 0-1
}
```

### 2. Fixed Categories (v1)

**Structural/Recurring**:
- Housing–Rent
- Utilities–Electricity
- Utilities–Internet
- Childcare–Kita
- Transport
- Investments–Scalable Capital

**Daily Life**:
- Groceries
- Eating Out
- Subscriptions
- Health
- Shopping
- Travel
- Misc (default when uncertain)

### 3. Message Flow

```
User sends message (text/photo/PDF)
    ↓
Telegram Handler receives it
    ↓
Mastra Agent processes with appropriate tool
    ↓
Transaction normalized and validated
    ↓
Stored in MongoDB
    ↓
Confirmation sent back to user
```

### 4. Mastra Tools

**8 tools that the AI agent can use**:

1. **text-parser** - Parse "Rent 1250€ paid"
2. **vision-extractor** - Extract from receipt photos
3. **pdf-parser** - Extract from invoices
4. **categorizer** - Assign category
5. **duplicate-detector** - Find similar transactions
6. **transaction-storage** - Save to DB
7. **summary-generator** - Create reports
8. **recurring-tracker** - Track expected bills

### 5. Workflows

**Multi-step processes**:

- **Transaction Processing**: Receive → Extract → Categorize → Check duplicates → Store → Respond
- **Weekly Summary**: Query last 7 days → Calculate totals → Format → Send
- **Monthly Summary**: Query month → Compare to previous → Generate insights → Send

---

## 🛠️ Development Workflow

### Daily Development

```bash
# Start dev server (hot reload)
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Making Changes

**1. Create a branch**:
```bash
git checkout -b feature/add-new-category
```

**2. Make your changes**:
- Follow [TYPESCRIPT_GUIDE.md](TYPESCRIPT_GUIDE.md)
- Write tests for new features
- Update documentation

**3. Test locally**:
```bash
npm run lint
npm test
npm run build
```

**4. Commit**:
```bash
git add .
git commit -m "feat: add new expense category"
```

**5. Push and PR**:
```bash
git push origin feature/add-new-category
# Then create pull request
```

### Debugging

**Enable debug logging**:
```bash
# In .env.development
LOG_LEVEL=debug
```

**Check MongoDB**:
```bash
# If using Docker
docker exec -it finance-mongo mongosh

# In mongosh
use finance-agent
db.transactions.find()
```

**Test Telegram Bot**:
```bash
# Check bot status
curl https://api.telegram.org/bot<YOUR_TOKEN>/getMe

# Get updates
curl https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates
```

---

## 🧪 Testing

### Run Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### Test Structure

```typescript
// src/services/gemini.service.test.ts
import { describe, it, expect } from 'vitest';
import { GeminiService } from './gemini.service';

describe('GeminiService', () => {
  describe('extractFromImage', () => {
    it('should extract transaction from receipt', async () => {
      const service = new GeminiService(process.env.GOOGLE_API_KEY!);
      const result = await service.extractFromImage({
        imageBase64: testImage,
        schema: TransactionSchema,
      });

      expect(result.amount).toBeGreaterThan(0);
      expect(result.vendor).toBeDefined();
    });
  });
});
```

### Manual Testing

**Test text input**:
```
Send to bot: "Groceries 45.60€ at REWE"
Expected: "Logged: €45.60 — Groceries — [date] ✅"
```

**Test photo input**:
```
Send receipt photo
Expected: Extracted amount, vendor, date
```

**Test commands**:
```
/start  → Welcome message
/weekly → Last 7 days summary
```

---

## 🐛 Troubleshooting

### Bot Not Responding

**Check if bot is running**:
```bash
# Should see "Bot started"
npm run dev
```

**Verify token**:
```bash
curl https://api.telegram.org/bot<TOKEN>/getMe
```

**Check logs**:
```bash
# Enable debug logging
LOG_LEVEL=debug npm run dev
```

---

### MongoDB Connection Failed

**Docker not running**:
```bash
docker ps
# If empty, start MongoDB:
docker start finance-mongo
```

**Atlas connection issues**:
- Check IP whitelist (should include current IP or 0.0.0.0/0)
- Verify username/password are correct
- Check connection string format

---

### Gemini API Errors

**Rate limit exceeded**:
- Free tier: 15 req/min, 1,500/day
- Wait a minute and retry
- Check usage at: https://aistudio.google.com

**Invalid API key**:
- Verify key in .env.development
- Regenerate key if needed

---

### TypeScript Errors

**Module not found**:
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

**Type errors**:
```bash
# Check TypeScript version
npx tsc --version

# Rebuild
npm run build
```

---

## 📚 Important Documents

| Document | Purpose |
|----------|---------|
| **[claude.md](claude.md)** | Project overview for Claude Code |
| **[IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)** | Complete implementation guide |
| **[TYPESCRIPT_GUIDE.md](TYPESCRIPT_GUIDE.md)** | TypeScript best practices |
| **[spec.md](spec.md)** | Product specifications |
| **[prompt-contract.md](prompt-contract.md)** | AI agent behavioral rules |
| **[README.md](README.md)** | Quick reference |

---

## 🎯 Next Steps

### For New Developers

1. **Read**:
   - [spec.md](spec.md) - Understand the product
   - [prompt-contract.md](prompt-contract.md) - Understand agent behavior
   - [TYPESCRIPT_GUIDE.md](TYPESCRIPT_GUIDE.md) - Learn our coding style

2. **Explore**:
   - Run the bot locally
   - Send test transactions
   - Check MongoDB to see data
   - Read through [claude.md](claude.md)

3. **First Task**:
   - Pick a Phase 1 task from [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)
   - Implement with tests
   - Create a pull request

### Phase Implementation Order

1. **Phase 1**: Foundation (environment, DB, basic bot)
2. **Phase 2**: Core agent (Mastra + Gemini + text processing)
3. **Phase 3**: File processing (photos + PDFs)
4. **Phase 4**: Advanced (duplicates + summaries)
5. **Phase 5**: Automation (scheduler + commands)
6. **Phase 6**: Deployment (Railway + production config)

---

## 💬 Getting Help

### Resources

- **Documentation**: See docs folder
- **Logs**: Check console output with `LOG_LEVEL=debug`
- **Mastra Docs**: https://mastra.ai/docs
- **grammY Docs**: https://grammy.dev/
- **Gemini API**: https://ai.google.dev/gemini-api/docs

### Common Questions

**Q: Why Gemini instead of GPT-4?**
A: Cheaper ($0.10/month vs $3/month), native PDF support, good accuracy.

**Q: Why MongoDB instead of PostgreSQL?**
A: Flexible schema for evolving requirements, built-in GridFS for files.

**Q: Can I use NestJS?**
A: Yes, but we're keeping it simple for now. Can refactor later if needed.

**Q: How do I add a new category?**
A: Categories are locked in v1. For v2, update `categories.ts` and migration script.

---

## 🎉 Welcome Aboard!

You're all set! Start with:

```bash
npm run dev
```

And send your first transaction to the bot! 🚀

**Happy coding!** 💻✨
