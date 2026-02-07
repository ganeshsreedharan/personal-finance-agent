# 🚀 Personal Finance AI Agent - Complete Project Guide

**Welcome!** This is your comprehensive guide to understanding, developing, and deploying the Personal Finance AI Agent.

> **Quick Links**: [Setup](#-quick-setup) | [Architecture](#-architecture) | [Development](#-development) | [Deployment](#-deployment)

---

## 📖 What Is This Project?

A **Telegram bot** that tracks personal finances using **AI**. Users send expenses via:
- 💬 Text: `"Rent 1250€ paid"`
- 📸 Photos: Receipt images
- 📄 PDFs: Invoice documents

The bot **automatically** extracts, categorizes, stores, and summarizes transactions.

**Core Principle**: 🚫 Never block the user from logging. If uncertain → default to "Misc" category.

---

## 🛠️ Tech Stack at a Glance

| Component | Technology | Why? |
|-----------|-----------|------|
| **Language** | TypeScript | Type safety, modern features |
| **Bot Framework** | grammY | Best TypeScript support for Telegram |
| **AI/LLM** | Google Gemini 1.5 Flash | Vision + native PDF, ultra-cheap ($0.10/month) |
| **Agent Framework** | Mastra | Tool orchestration, workflows, memory |
| **Database** | MongoDB + GridFS | Flexible schema, built-in file storage |
| **Deployment** | Railway | $5/month, simple deployment |

**Monthly Cost**: ~$5-10 for 500 transactions

---

## ⚡ Quick Setup

### Prerequisites
- Node.js 20-21 (check: `node --version`)
- npm 9+ (check: `npm --version`)
- MongoDB (Docker or Atlas)

### 1️⃣ Install Dependencies
```bash
npm install
```

### 2️⃣ Get Credentials

**A. Gemini API Key** (2 min)
```
1. Go to: https://aistudio.google.com/app/apikey
2. Click "Create API key in new project"
3. Copy key (looks like AIzaSy...)
```

**B. Telegram Bot Token** (3 min)
```
1. Open Telegram → Search @BotFather
2. Send: /newbot
3. Follow prompts → Copy token (1234567890:ABC...)
```

**C. MongoDB** (5 min)
```bash
# Option 1: Docker (local)
docker run -d --name finance-mongo -p 27017:27017 mongo:latest

# Option 2: MongoDB Atlas (cloud - free tier)
# Go to: https://www.mongodb.com/cloud/atlas/register
# Create free M0 cluster → Get connection string
```

### 3️⃣ Configure Environment
```bash
cp .env.example .env.development
# Edit .env.development with your credentials
```

### 4️⃣ Start Dev Server
```bash
npm run dev
```

### 5️⃣ Test Your Bot
```
1. Open Telegram
2. Find your bot
3. Send: "Rent 1250€ paid"
4. Bot responds: "Logged: €1250 — Housing-Rent — [date] ✅"
```

**✅ Done! You're ready to code.**

---

## 🏗️ Architecture

### High-Level Flow

```
User → Telegram → grammY Bot → Mastra Agent → MongoDB
                                     ↓
                            8 Tools + 4 Workflows
                                     ↓
                              Gemini AI (Vision)
```

### Project Structure

```
src/
├── index.ts                    # App entry point
├── config/                     # Environment & constants
├── bot/                        # Telegram layer
│   ├── telegram.ts            # Bot initialization
│   └── handlers/              # Message handlers (text/photo/PDF)
├── mastra/                    # AI agent layer
│   ├── agents/                # Finance agent
│   ├── tools/                 # 8 tools (parser, vision, storage, etc.)
│   └── workflows/             # 4 workflows (processing, summaries)
├── database/                  # MongoDB layer
│   ├── models/                # Schemas (Transaction, User, Attachment)
│   └── repositories/          # Data access
├── services/                  # Business services
│   ├── gemini.service.ts      # Gemini API wrapper
│   ├── file-storage.service.ts # GridFS operations
│   └── scheduler.service.ts   # Cron jobs
├── types/                     # TypeScript types
└── utils/                     # Helpers & formatters
```

### Core Data Model

**Transaction** (everything centers around this):
```typescript
{
  date: Date;
  amount: number;
  currency: 'EUR' | 'USD' | 'GBP';
  vendor: string;
  category: string;  // From fixed list
  recurring: 'yes' | 'no' | 'unknown';
  notes?: string;
  attachmentId?: string;
  confidenceScore: number;  // 0-1
}
```

**Categories (Fixed v1)**:
- Structural: Housing–Rent, Utilities–Electricity, Utilities–Internet, Childcare–Kita, Transport, Investments–Scalable Capital
- Daily: Groceries, Eating Out, Subscriptions, Health, Shopping, Travel, Misc

---

## 🔧 Development

### Daily Commands

```bash
npm run dev          # Start with hot reload
npm test             # Run tests
npm run lint         # Check code style
npm run format       # Auto-format with Prettier
npm run build        # Build for production
```

### Code Style

We use **ESLint + Prettier** (configs in root):
- `.eslintrc.config.js` - Linting rules
- `.prettierrc.json` - Formatting rules
- `TYPESCRIPT_GUIDE.md` - Full style guide

**Key rules**:
- ✅ Use `const` by default
- ✅ No `any` types
- ✅ Explicit function return types
- ✅ Always handle errors
- ✅ Use async/await (no raw promises)
- ✅ Functional programming preferred

### Development Phases

**Phase 1: Foundation** (Week 1)
- ✅ Environment validation
- ✅ MongoDB connection
- ✅ Basic bot (text only)

**Phase 2: Core Agent** (Week 2)
- Mastra agent setup
- Gemini integration
- Text processing end-to-end

**Phase 3: File Processing** (Week 3)
- Photo handling (Gemini vision)
- PDF parsing (native support)
- File storage (GridFS)

**Phase 4: Advanced** (Week 4)
- Duplicate detection
- Summary generation
- Workflows

**Phase 5: Automation** (Week 5)
- Scheduled summaries
- Commands (/weekly, /monthly)
- Error handling & tests

**Phase 6: Deployment** (Week 6)
- Railway deployment
- Production config
- Monitoring

---

## 🧪 Testing

### Run Tests
```bash
npm test              # All tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

### Test Structure
```typescript
describe('TransactionRepository', () => {
  it('should store transaction correctly', async () => {
    const transaction = createMockTransaction();
    const result = await repository.create(transaction);
    expect(result.id).toBeDefined();
  });
});
```

### Manual Testing Checklist
- [ ] Text: "Rent 1250€" → Housing-Rent
- [ ] Photo: Receipt → extracts amount
- [ ] PDF: Invoice → parses correctly
- [ ] Duplicate: Same transaction → warns
- [ ] Command: /weekly → shows summary

---

## 🚀 Deployment

### Railway (Recommended)

**Setup** (5 minutes):
```bash
# Install CLI
npm install -g @railway/cli

# Login
railway login

# Initialize
railway init

# Set environment variables
railway variables set TELEGRAM_BOT_TOKEN=xxx
railway variables set GOOGLE_API_KEY=xxx
railway variables set MONGODB_URI=xxx

# Deploy
railway up
```

**Cost**: $5/month (Hobby plan)

### Alternative: Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
CMD ["node", "dist/index.js"]
```

```bash
docker build -t finance-bot .
docker run -d --env-file .env.production finance-bot
```

---

## 🐛 Troubleshooting

### Bot Not Responding
```bash
# Check if running
npm run dev
# Look for: "Bot started: @your_bot_name"

# Verify token
curl https://api.telegram.org/bot<TOKEN>/getMe
```

### MongoDB Connection Failed
```bash
# Docker: Check if running
docker ps

# Atlas: Verify IP whitelist + credentials
```

### Gemini API Errors
- Check free tier limits: 15 req/min, 1,500/day
- Verify API key in .env.development
- Check usage: https://aistudio.google.com

### TypeScript Errors
```bash
# Reinstall dependencies
rm -rf node_modules && npm install

# Check TS version
npx tsc --version
```

---

## 📚 Documentation

| File | Purpose |
|------|---------|
| **ONBOARDING.md** | Complete onboarding guide for new developers |
| **TYPESCRIPT_GUIDE.md** | TypeScript best practices & code style |
| **IMPLEMENTATION_PLAN.md** | Detailed implementation roadmap (6 phases) |
| **spec.md** | Product requirements & specifications |
| **prompt-contract.md** | AI agent behavioral contract |
| **README.md** | Quick reference & commands |

---

## 💡 Key Concepts

### Mastra Tools (8 Total)

1. **text-parser** - Extract from "Rent 1250€ paid"
2. **vision-extractor** - OCR receipts with Gemini
3. **pdf-parser** - Parse invoices (native PDF support)
4. **categorizer** - Assign category with AI + caching
5. **duplicate-detector** - Find similar transactions (±5%, same vendor, same date)
6. **transaction-storage** - CRUD operations on MongoDB
7. **summary-generator** - Weekly/monthly reports
8. **recurring-tracker** - Track expected bills, detect anomalies

### Workflows (4 Total)

1. **Transaction Processing**: Receive → Extract → Categorize → Check duplicates → Store → Respond
2. **Weekly Summary**: Query last 7 days → Calculate → Format → Send
3. **Monthly Summary**: Query month → Compare to previous → Generate insights
4. **Duplicate Resolution**: User decides → Merge or keep both

---

## 🎯 Working with Claude Code

### Best Practices

```bash
# Reference specific files
"Update the Telegram handler in bot/telegram.ts"

# Use phase language
"Let's implement Phase 2: Core Agent"

# Ask for incremental changes
"Add error handling to the message handler"
```

### Helpful Commands

```bash
# Development
npm run dev
npm test
npm run lint

# Database
docker exec -it finance-mongo mongosh
use finance-agent
db.transactions.find()

# Deployment
railway logs
railway status
```

---

## 🔐 Security Notes

- ✅ All `.env*` files are gitignored
- ✅ Never log API keys or tokens
- ✅ Validate all external input (Zod)
- ✅ MongoDB connection uses auth
- ✅ Rate limiting on Gemini API

---

## 💰 Cost Breakdown

**Personal Use** (500 transactions/month):
- Gemini API: **FREE** (within 1M req/month limit)
- MongoDB Atlas: **FREE** (512MB tier)
- Railway Hosting: **$5/month**
- **Total: ~$5/month** 🎉

**Heavy Use** (2,000 transactions/month):
- Gemini API: **$0.50/month**
- MongoDB: **FREE** or $9 if storage exceeds 512MB
- Railway: **$5-10/month**
- **Total: ~$5.50-20/month**

---

## 🚦 Project Status

**Current Phase**: Phase 1 - Foundation Setup
**Next Steps**: Implement environment validation, MongoDB connection, basic bot

**Progress**:
- ✅ Project structure created
- ✅ Dependencies installed
- ✅ Credentials configured
- ⏳ Ready to start Phase 1 implementation

---

## 🤝 Contributing

1. Read [TYPESCRIPT_GUIDE.md](TYPESCRIPT_GUIDE.md)
2. Follow code style (ESLint + Prettier)
3. Write tests for new features
4. Create PR with clear description

---

## 📖 External Resources

- [Mastra Docs](https://mastra.ai/docs)
- [grammY Guide](https://grammy.dev/)
- [Gemini API](https://ai.google.dev/gemini-api/docs)
- [MongoDB Manual](https://www.mongodb.com/docs/manual/)
- [Railway Docs](https://docs.railway.app/)

---

## 🎉 Ready to Build!

Everything is set up. Start coding with:

```bash
npm run dev
```

Then send a message to your bot in Telegram! 🚀

**Questions?** Check [ONBOARDING.md](ONBOARDING.md) or [TROUBLESHOOTING](#-troubleshooting) section.

**Happy coding!** 💻✨
