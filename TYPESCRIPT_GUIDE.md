# TypeScript Guidelines & Best Practices

**Project**: Personal Finance AI Agent
**Language**: TypeScript 5.7+
**Node Version**: 20-21 (officially), 24 (experimental)

---

## 📋 Table of Contents

1. [Code Style](#code-style)
2. [Naming Conventions](#naming-conventions)
3. [Type Safety](#type-safety)
4. [File Organization](#file-organization)
5. [Error Handling](#error-handling)
6. [Async/Await](#asyncawait)
7. [Testing](#testing)
8. [Documentation](#documentation)

---

## 🎨 Code Style

### Use Functional Programming

**Preferred**:
```typescript
// ✅ Pure function
export function calculateTotal(transactions: Transaction[]): number {
  return transactions.reduce((sum, t) => sum + t.amount, 0);
}

// ✅ Composition
const processTransaction = compose(
  validate,
  categorize,
  store
);
```

**Avoid**:
```typescript
// ❌ Mutating global state
let total = 0;
function addToTotal(amount: number) {
  total += amount;
}
```

---

### Use Descriptive Variable Names

**Good**:
```typescript
const userTransactions = await transactionRepository.findByUserId(userId);
const weeklySpendingTotal = calculateTotalSpending(userTransactions);
const isWithinBudget = weeklySpendingTotal <= weeklyBudgetLimit;
```

**Bad**:
```typescript
const t = await repo.find(id);
const x = calc(t);
const flag = x <= limit;
```

---

### Prefer `const` over `let`

```typescript
// ✅ Good
const bot = new Bot(token);
const transactions = await getTransactions();

// ❌ Avoid
let bot = new Bot(token);
let transactions = await getTransactions();
```

---

### Use Template Literals

```typescript
// ✅ Good
const message = `Logged: €${amount} — ${category} — ${date} ✅`;

// ❌ Avoid
const message = 'Logged: €' + amount + ' — ' + category + ' — ' + date + ' ✅';
```

---

## 📝 Naming Conventions

### Files

```typescript
// ✅ kebab-case for files
transaction.model.ts
telegram.handler.ts
gemini.service.ts
duplicate-detector.tool.ts

// ❌ Avoid
TransactionModel.ts
TelegramHandler.ts
```

### Classes & Interfaces

```typescript
// ✅ PascalCase
export class TransactionRepository {}
export interface Transaction {}
export type CategoryEnum = 'Groceries' | 'Rent';
```

### Functions & Variables

```typescript
// ✅ camelCase
const userId = ctx.from.id;
async function processMessage(text: string) {}
const isValidTransaction = validate(data);
```

### Constants

```typescript
// ✅ UPPER_SNAKE_CASE for true constants
const MAX_RETRIES = 3;
const DEFAULT_CURRENCY = 'EUR';
const API_TIMEOUT_MS = 5000;

// ✅ camelCase for config objects
const config = {
  apiKey: process.env.GEMINI_API_KEY,
  maxTokens: 2048,
};
```

### Enums

```typescript
// ✅ PascalCase for enum, UPPER_SNAKE_CASE for values
export enum TransactionSource {
  TEXT = 'TEXT',
  PHOTO = 'PHOTO',
  PDF = 'PDF',
}

// Usage
const source = TransactionSource.TEXT;
```

---

## 🔒 Type Safety

### Always Define Types

**Good**:
```typescript
// ✅ Explicit types
interface Transaction {
  id: string;
  amount: number;
  currency: string;
  date: Date;
}

async function getTransaction(id: string): Promise<Transaction> {
  return await db.findById(id);
}
```

**Bad**:
```typescript
// ❌ Implicit any
async function getTransaction(id) {
  return await db.findById(id);
}
```

---

### Use Zod for Runtime Validation

```typescript
import { z } from 'zod';

// ✅ Define schema
export const TransactionSchema = z.object({
  date: z.string().datetime(),
  amount: z.number().positive(),
  currency: z.enum(['EUR', 'USD', 'GBP']),
  vendor: z.string().min(1),
  category: z.string(),
});

// Infer TypeScript type from Zod schema
export type Transaction = z.infer<typeof TransactionSchema>;

// Validate at runtime
const result = TransactionSchema.safeParse(data);
if (!result.success) {
  console.error(result.error);
}
```

---

### Avoid `any`

```typescript
// ❌ Bad
function process(data: any) {
  return data.value;
}

// ✅ Good - Use unknown and type guard
function process(data: unknown) {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return (data as { value: string }).value;
  }
  throw new Error('Invalid data');
}

// ✅ Better - Use proper type
interface DataWithValue {
  value: string;
}

function process(data: DataWithValue) {
  return data.value;
}
```

---

### Use Union Types

```typescript
// ✅ Good
type TransactionStatus = 'pending' | 'completed' | 'failed';
type Currency = 'EUR' | 'USD' | 'GBP';

function processTransaction(status: TransactionStatus) {
  // TypeScript knows only these 3 values are valid
}
```

---

### Optional vs Required

```typescript
// ✅ Be explicit about optional properties
interface Transaction {
  id: string;              // Required
  amount: number;          // Required
  notes?: string;          // Optional
  attachmentId?: string;   // Optional
}

// ✅ Use undefined, not null
let userId: string | undefined;

// ❌ Avoid null
let userId: string | null;
```

---

## 📂 File Organization

### One Export Per File

```typescript
// ✅ transaction.model.ts
export interface Transaction {
  // ...
}

// ✅ transaction.repository.ts
export class TransactionRepository {
  // ...
}
```

### Barrel Exports

```typescript
// ✅ src/types/index.ts
export * from './transaction.types';
export * from './category.types';
export * from './common.types';

// Usage
import { Transaction, Category } from '@/types';
```

### Organize by Feature

```
src/
├── bot/               # Telegram bot feature
│   ├── telegram.ts
│   └── handlers/
├── mastra/            # AI agent feature
│   ├── agents/
│   ├── tools/
│   └── workflows/
└── database/          # Database feature
    ├── models/
    └── repositories/
```

---

## 🚨 Error Handling

### Use Custom Errors

```typescript
// ✅ Define custom error classes
export class TransactionNotFoundError extends Error {
  constructor(transactionId: string) {
    super(`Transaction ${transactionId} not found`);
    this.name = 'TransactionNotFoundError';
  }
}

export class InvalidCategoryError extends Error {
  constructor(category: string) {
    super(`Invalid category: ${category}`);
    this.name = 'InvalidCategoryError';
  }
}
```

### Try-Catch at Boundaries

```typescript
// ✅ Catch at handler level
export async function handleMessage(ctx: Context) {
  try {
    const transaction = await processMessage(ctx.message.text);
    await ctx.reply(formatConfirmation(transaction));
  } catch (error) {
    if (error instanceof InvalidCategoryError) {
      await ctx.reply('Invalid category. Defaulting to "Misc".');
    } else {
      logger.error('Failed to process message', { error });
      await ctx.reply('Sorry, something went wrong. Please try again.');
    }
  }
}

// ✅ Let errors bubble up from lower levels
async function processMessage(text: string): Promise<Transaction> {
  // Don't catch here - let caller handle
  const transaction = await parser.parse(text);
  return transaction;
}
```

### Never Swallow Errors

```typescript
// ❌ Bad
try {
  await saveTransaction(data);
} catch (error) {
  // Silent failure - very bad!
}

// ✅ Good
try {
  await saveTransaction(data);
} catch (error) {
  logger.error('Failed to save transaction', { error, data });
  throw error; // Re-throw or handle appropriately
}
```

---

## ⚡ Async/Await

### Always Use Async/Await

```typescript
// ✅ Good
async function getTransaction(id: string): Promise<Transaction> {
  const transaction = await db.findById(id);
  return transaction;
}

// ❌ Avoid promises directly
function getTransaction(id: string): Promise<Transaction> {
  return db.findById(id).then(transaction => {
    return transaction;
  });
}
```

### Parallel Operations

```typescript
// ✅ Good - parallel
const [user, transactions, summary] = await Promise.all([
  getUserById(userId),
  getTransactions(userId),
  getSummary(userId),
]);

// ❌ Bad - sequential (3x slower)
const user = await getUserById(userId);
const transactions = await getTransactions(userId);
const summary = await getSummary(userId);
```

### Handle Promise Rejections

```typescript
// ✅ Top-level error handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', { reason, promise });
  process.exit(1);
});
```

---

## 🧪 Testing

### Test File Naming

```typescript
// ✅ Co-locate tests
src/
├── services/
│   ├── gemini.service.ts
│   └── gemini.service.test.ts
```

### Use Descriptive Test Names

```typescript
// ✅ Good
describe('TransactionRepository', () => {
  describe('findByUserId', () => {
    it('should return transactions for valid user ID', async () => {
      // ...
    });

    it('should return empty array for user with no transactions', async () => {
      // ...
    });

    it('should throw error for invalid user ID', async () => {
      // ...
    });
  });
});
```

### Test Structure (AAA Pattern)

```typescript
// ✅ Arrange, Act, Assert
it('should calculate total spending excluding investments', () => {
  // Arrange
  const transactions = [
    { category: 'Groceries', amount: 50 },
    { category: 'Investments-Scalable Capital', amount: 300 },
    { category: 'Eating Out', amount: 30 },
  ];

  // Act
  const total = calculateTotalSpending(transactions);

  // Assert
  expect(total).toBe(80); // Excludes investment
});
```

---

## 📚 Documentation

### JSDoc for Public APIs

```typescript
/**
 * Processes a transaction from text input
 * @param text - Natural language text (e.g., "Rent 1250€ paid")
 * @param userId - Telegram user ID
 * @returns Parsed and categorized transaction
 * @throws {InvalidFormatError} If text cannot be parsed
 */
export async function processTextTransaction(
  text: string,
  userId: string
): Promise<Transaction> {
  // ...
}
```

### Inline Comments for Complex Logic

```typescript
// ✅ Good - explains WHY, not WHAT
// We check duplicates within 24 hours because bank transactions
// can appear multiple times in different formats
const isDuplicate = await checkDuplicates(transaction, {
  timeWindowHours: 24,
  amountTolerance: 0.05, // 5% tolerance for currency conversion
});

// ❌ Bad - explains obvious code
// Check if amount is greater than zero
if (amount > 0) {
  // ...
}
```

---

## 🔧 TypeScript Config

### Use Strict Mode

```json
{
  "compilerOptions": {
    "strict": true,                          // Enable all strict checks
    "noUnusedLocals": true,                  // Error on unused variables
    "noUnusedParameters": true,              // Error on unused params
    "noImplicitReturns": true,               // Ensure all code paths return
    "noFallthroughCasesInSwitch": true,     // Prevent switch fallthrough
    "esModuleInterop": true,                 // Better ES module compat
    "skipLibCheck": true,                    // Skip type checking of .d.ts files
    "forceConsistentCasingInFileNames": true // Ensure consistent casing
  }
}
```

---

## 🚀 Performance Tips

### Avoid Premature Optimization

```typescript
// ✅ Start simple and readable
function findTransactionsByCategory(
  transactions: Transaction[],
  category: string
): Transaction[] {
  return transactions.filter(t => t.category === category);
}

// Only optimize if profiling shows it's a bottleneck
```

### Use Memoization for Expensive Operations

```typescript
// ✅ Cache expensive calculations
const categoryCache = new Map<string, string>();

async function categorizeTransaction(vendor: string): Promise<string> {
  if (categoryCache.has(vendor)) {
    return categoryCache.get(vendor)!;
  }

  const category = await expensiveAICall(vendor);
  categoryCache.set(vendor, category);
  return category;
}
```

---

## 📦 Dependencies

### Keep Dependencies Minimal

```typescript
// ✅ Use built-in features when possible
const sorted = items.sort((a, b) => a.date.getTime() - b.date.getTime());

// ❌ Don't add lodash just for this
import { sortBy } from 'lodash';
const sorted = sortBy(items, 'date');
```

### Version Pinning

```json
{
  "dependencies": {
    "grammy": "^1.30.0",     // ✅ Allow minor updates
    "@mastra/core": "0.1.26"  // ✅ Pin exact version for stability
  }
}
```

---

## 🔐 Security

### Never Log Secrets

```typescript
// ❌ Bad
logger.info('Starting bot', { token: process.env.TELEGRAM_BOT_TOKEN });

// ✅ Good
logger.info('Starting bot', { tokenPresent: !!process.env.TELEGRAM_BOT_TOKEN });
```

### Validate All External Input

```typescript
// ✅ Good
export async function handleMessage(ctx: Context) {
  const text = ctx.message?.text;

  if (!text || text.length > 1000) {
    await ctx.reply('Invalid message');
    return;
  }

  // Process validated input
  await processMessage(text, ctx.from.id.toString());
}
```

---

## 📋 Code Review Checklist

Before committing, check:

- [ ] All types are explicit (no implicit `any`)
- [ ] Error handling is present
- [ ] No hardcoded secrets
- [ ] Tests pass
- [ ] Linter passes
- [ ] Functions are small and focused
- [ ] Names are descriptive
- [ ] Comments explain WHY, not WHAT
- [ ] No console.log (use logger)
- [ ] Async operations are awaited
- [ ] No unused imports

---

## 🎯 Quick Reference

### DO ✅

- Use `const` by default
- Use `async/await` for promises
- Use Zod for validation
- Use descriptive names
- Handle errors explicitly
- Test your code
- Use type inference when obvious
- Keep functions small (<50 lines)
- Use functional programming patterns

### DON'T ❌

- Use `any` type
- Ignore TypeScript errors
- Swallow errors silently
- Mutate function parameters
- Use `var` (use `const` or `let`)
- Mix callbacks and promises
- Leave console.logs
- Hardcode secrets
- Skip error handling
- Create God classes/functions

---

## 📖 Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
- [Zod Documentation](https://zod.dev/)
- [Effective TypeScript Book](https://effectivetypescript.com/)

---

**Remember**: Code is read more than it's written. Prioritize clarity over cleverness!
