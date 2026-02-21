# Personal Finance Agent — Product Spec

A personal AI agent for effortless expense, bill, and invoice tracking — focused on **awareness, not restriction**.

---

## 1. Purpose

Capture expenses, bills, and invoices in any format and produce **clear spending summaries with visualizations**, with minimal friction and **no budgeting pressure**.

**Primary goal:** Awareness, not restriction.

---

## 2. Inputs (What the User Sends)

### Text messages
- `Rent 1250€ paid`
- `Groceries 34.60 at REWE`
- `Scalable Capital 300€ invested`
- `Show me last 5 transactions`
- `Delete the REWE one`
- `Give me a summary of this month`

### Photos / Screenshots
- Receipt photos
- Bank app confirmations
- Payment screenshots

### Voice messages
- Spoken expense descriptions

### Documents / PDFs
- Utility invoices, insurance, subscriptions

**Rule:** Never reject input. If uncertain → **log with "Misc" category, clarify later**.

---

## 3. Core Data Object: Transaction

Every input is normalized into a **Transaction**:

| Field | Type | Notes |
|-------|------|-------|
| date | Date | Transaction or invoice date |
| amount | number | Always positive |
| currency | EUR / USD / GBP | Default: EUR |
| vendor | string | Merchant name (required) |
| category | string | See Section 4 |
| recurring | yes / no / unknown | Auto-detected (default: unknown) |
| notes | string? | Optional |
| confidenceScore | 0.0–1.0 | Agent's certainty (default: 0.5) |

---

## 4. Category System (Locked v1)

### Structural / Recurring
- Housing-Rent
- Utilities-Electricity
- Utilities-Internet
- Childcare-Kita
- Transport
- Investments-Scalable Capital (excluded from spending totals)

### Daily Life
- Groceries
- Eating Out
- Subscriptions
- Health
- Shopping
- Travel
- Misc (default when uncertain)

### Categorization Rules
- Home food → **Groceries**
- Prepared food / restaurants → **Eating Out**
- Repeating service → **Subscriptions**
- Unclear → **Misc** (never block logging)

---

## 5. Agent Capabilities

### Log expenses
1. Call store-transaction (auto-checks for duplicates: same vendor, amount ±5%, ±7 days)
2. If duplicate found → show matches, ask user to confirm
3. If confirmed → re-call with force=true to store anyway
4. Reply: `Logged: €{amount} — {category} — {date} ✅`

### Query transactions
- Recent N transactions
- By specific date or date range
- Display as numbered list

### Edit transactions
- Find → confirm which one → update fields
- Reply: `Updated: €{amount} — {category} — {date} ✏️`

### Delete transactions
- Find → confirm which one → delete
- Reply: `Deleted: €{amount} — {vendor} — {date} 🗑️`

### Spending summaries
- Triggered via natural language ("show me a summary") or `/summary` command
- Options: `week` (last 7 days) or `month` (current month)
- Returns: text summary + pie chart (or bar chart with `/summary bar`)
- Uses workflow: fetch data → agent generates report

### Media processing
- Photos: receipt/invoice extraction via agent vision
- Voice: transcription + expense extraction
- Documents/PDFs: invoice data extraction

---

## 6. Special Handling Rules

### Investments (Scalable Capital)
- Tracked separately
- Excluded from spending totals
- Reported as "Investments" in summaries

### Recurring Bills
- Rent, electricity, internet, Kita auto-flagged as `recurring: "yes"`
- Subscriptions flagged as recurring

### Duplicate Detection
- Built into store-transaction tool
- ±5% amount tolerance
- 7-day date window
- Ask before storing if match found

---

## 7. Telegram Interface

### Commands
| Command | Action |
|---------|--------|
| `/start` | Register user |
| `/summary` | Current month summary + pie chart |
| `/summary week` | Last 7 days summary |
| `/summary bar` | Summary with bar chart |

### Response Style
- Concise, warm, occasional emojis
- Always in English
- One-line confirmations for logged expenses
- Numbered lists for query results

---

## 8. Implementation Status

### Implemented
- Text expense logging with built-in duplicate detection
- Full CRUD (create, query, update, delete transactions)
- Spending summary workflow with chart visualization (pie/bar)
- Photo/voice/document processing via agent vision
- Conversation memory (last 3 messages per user)
- `/summary` command with period and chart type options
- Structured logging (Mastra PinoLogger)
- Performance optimized (~3s response with Gemini Flash + thinkingBudget: 0)
- Dockerized for Railway deployment

### Not Yet Implemented
- Recurring bill tracking (detect missing bills, abnormal increases)
- Budget alerts / spending insights
- CSV/PDF export
- Multi-currency conversion

---

**Last Updated**: 2026-02-21
