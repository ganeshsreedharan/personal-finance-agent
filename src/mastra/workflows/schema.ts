import { z } from 'zod';

// ── Shared sub-schemas ──

export const CategoryBreakdownSchema = z.array(z.object({
  category: z.string(),
  total: z.number(),
  count: z.number(),
}));

export const TopTransactionSchema = z.array(z.object({
  amount: z.number(),
  vendor: z.string(),
  category: z.string(),
  date: z.string(),
}));

// ── Spending Summary Workflow ──

export const SpendingSummaryInputSchema = z.object({
  userId: z.string(),
  period: z.enum(['week', 'month', 'custom']).describe('Summary period'),
  startDate: z.string().optional().describe('Custom start date (ISO format)'),
  endDate: z.string().optional().describe('Custom end date (ISO format)'),
});

export const SpendingSummaryOutputSchema = z.object({
  summary: z.string(),
  periodLabel: z.string(),
  categoryBreakdown: CategoryBreakdownSchema,
});

// ── Step 1: Fetch Transaction Data ──

export const FetchTransactionDataInputSchema = SpendingSummaryInputSchema;

export const FetchTransactionDataOutputSchema = z.object({
  userId: z.string(),
  periodLabel: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  totalSpent: z.number(),
  transactionCount: z.number(),
  categoryBreakdown: CategoryBreakdownSchema,
  topTransactions: TopTransactionSchema,
});

// ── Step 2: Generate Summary ──

export const GenerateSummaryInputSchema = FetchTransactionDataOutputSchema;

export const GenerateSummaryOutputSchema = SpendingSummaryOutputSchema;
