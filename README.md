# 🧾 Personal Finance AI Agent

A TypeScript-based AI agent that tracks expenses, bills, and invoices via Telegram. Uses Gemini AI for vision-based receipt/invoice extraction with natural language understanding.

**Core Principle**: Never block logging. Capture first, clarify later.

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- MongoDB (local or Atlas)
- Telegram Bot Token
- Google Gemini API Key

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env.development

# Edit .env.development with your credentials
# - TELEGRAM_BOT_TOKEN (from @BotFather)
# - GOOGLE_API_KEY (from Google AI Studio)
# - MONGODB_URI (local or Atlas)

# Start MongoDB (if using Docker)
docker run -d -p 27017:27017 --name finance-mongo mongo:latest

# Run development server
npm run dev
```

### Test Your Bot

1. Open Telegram
2. Find your bot (username you created with BotFather)
3. Send: `Rent 1250€ paid`
4. Bot should respond: `Logged: €1250 — Housing-Rent — [date] ✅`

---

## 📚 Documentation

- **[claude.md](claude.md)** - Full project documentation for Claude Code
- **[IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)** - Detailed implementation guide
- **[spec.md](spec.md)** - Product specifications
- **[prompt-contract.md](prompt-contract.md)** - Agent behavioral contract

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | Mastra (AI agent orchestration) |
| Telegram Bot | grammY |
| LLM | Google Gemini 1.5 Flash |
| Database | MongoDB + GridFS |
| Language | TypeScript |
| Deployment | Railway |

---

## 💰 Cost

**Personal Use (500 transactions/month)**:
- Gemini API: FREE (within limits)
- MongoDB Atlas: FREE (512MB tier)
- Railway Hosting: $5/month
- **Total: ~$5/month**

---

## 📖 Usage

### Send Transactions

**Text**:
```
Rent 1250€ paid
Groceries 34.60 at REWE
Scalable Capital 300€ invested
```

**Photo**:
- Send receipt photo
- Bot extracts amount, vendor, date

**PDF**:
- Send invoice PDF
- Bot extracts invoice details

### Commands

```
/start    - Welcome message
/summary  - Current summary
/weekly   - Last 7 days
/monthly  - Current month
```

---

## 🗂️ Categories

### Structural/Recurring
- Housing – Rent
- Utilities – Electricity
- Utilities – Internet
- Childcare – Kita
- Transport
- Investments – Scalable Capital

### Daily Life
- Groceries
- Eating Out
- Subscriptions
- Health
- Shopping
- Travel
- Misc

---

## 🧪 Development

### Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm start         # Run production build
npm test          # Run tests
npm run lint      # Lint code
```

### Project Structure

```
src/
├── bot/          # Telegram bot handlers
├── mastra/       # AI agent, tools, workflows
├── database/     # MongoDB models & repositories
├── services/     # Gemini, file storage, scheduler
└── utils/        # Helpers and formatters
```

---

## 🚢 Deployment

### Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

See [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) for detailed deployment instructions.

---

## 🧩 Features

- ✅ Natural language processing
- ✅ Receipt photo OCR (Gemini Vision)
- ✅ Native PDF invoice parsing
- ✅ Automatic categorization
- ✅ Duplicate detection
- ✅ Weekly/monthly summaries
- ✅ Recurring bill tracking
- ✅ Investment tracking (separate from spending)
- ✅ GridFS file storage
- ✅ Automated summaries via cron

---

## 📝 License

MIT

---

## 🤝 Contributing

This is a personal project, but suggestions are welcome via issues!

---

## 📞 Support

For issues or questions, see [claude.md](claude.md) for troubleshooting guide.
