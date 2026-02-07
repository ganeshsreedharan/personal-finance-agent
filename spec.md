# 🧾 Personal Finance Agent

A personal AI agent for effortless expense, bill, and invoice tracking — focused on **awareness, not restriction**.

---

## 1. Purpose

A personal AI agent that captures expenses, bills, and invoices in any format and produces **clear weekly and monthly financial summaries**, with minimal friction and **no budgeting pressure**.

**Primary goal:** Awareness, not restriction.

---

## 2. Inputs (What the User Sends)

The agent must accept and log **any** of the following inputs.

### Text messages
Examples:
- `Rent 1250€ paid`
- `Groceries 34.60 at REWE`
- `Scalable Capital 300€ invested`

### Photos / Screenshots
- Receipt photos
- Bank app confirmations
- Payment screenshots

### PDF Invoices
- Utilities
- Internet
- Insurance
- Kita
- Subscriptions

**Rule:**  
Never reject input. If uncertain → **log first, clarify later**.

---

## 3. Core Data Object: Transaction

Every input is normalized into a **Transaction** with:

- Date (transaction or invoice date)
- Amount + currency
- Vendor / merchant
- Category (see Section 4)
- Recurring: `yes | no | unknown`
- Notes (optional)
- Attachment (optional)
- Confidence score (internal)

---

## 4. Category System (Locked v1)

### Structural / Recurring
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

### Categorization Rules
- Home food → **Groceries**
- Prepared food → **Eating Out**
- Repeating service → **Subscriptions**
- Unclear → **Misc** (never block logging)

---

## 5. Special Handling Rules

### Investments (Scalable Capital)
- Tracked separately
- Excluded from spending totals
- Reported as **“Investments”** in summaries

### Recurring Bills
- Rent, electricity, internet, and Kita are auto-flagged as recurring
- Track:
  - Usual amount (or range)
  - Due-date window
- Detect:
  - Missing bills
  - Abnormal increases

### Transport
- High-frequency, low-value transactions
- Weekly summary shows **total + notable items**
- No sub-splitting in v1

---

## 6. Agent Response Behavior

### On Every Input
Respond with a **one-line confirmation**:

