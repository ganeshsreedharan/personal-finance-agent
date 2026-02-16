import { createWorkflow, createStep } from '@mastra/core/workflows';
import { transactionRepository } from '../../database/index.js';
import {
  SpendingSummaryInputSchema,
  SpendingSummaryOutputSchema,
  FetchTransactionDataInputSchema,
  FetchTransactionDataOutputSchema,
  GenerateSummaryInputSchema,
  GenerateSummaryOutputSchema,
} from './schema.js';

/**
 * Step 1: Fetch transaction data for the requested period
 *
 * Queries MongoDB for transactions in the date range and aggregates by category.
 * Pure data step — no LLM calls.
 */
const fetchTransactionData = createStep({
  id: 'fetch-transaction-data',
  description: 'Fetch transactions and aggregate spending by category for a date range',
  inputSchema: FetchTransactionDataInputSchema,
  outputSchema: FetchTransactionDataOutputSchema,
  execute: async ({ inputData }) => {
    const { userId, period } = inputData;
    const now = new Date();

    let start: Date;
    let end: Date;
    let periodLabel: string;

    if (period === 'custom' && inputData.startDate && inputData.endDate) {
      start = new Date(inputData.startDate);
      end = new Date(inputData.endDate);
      periodLabel = `${inputData.startDate} to ${inputData.endDate}`;
    } else if (period === 'week') {
      start = new Date(now);
      start.setDate(start.getDate() - 7);
      end = now;
      periodLabel = 'Last 7 days';
    } else {
      // month (default)
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = now;
      periodLabel = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    }

    const [categoryBreakdown, transactions] = await Promise.all([
      transactionRepository.getTotalByCategory(userId, start, end),
      transactionRepository.findByDateRange(userId, start, end),
    ]);

    const totalSpent = categoryBreakdown.reduce((sum, c) => sum + c.total, 0);
    const transactionCount = transactions.length;

    // Top 5 largest transactions
    const topTransactions = transactions
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map(t => ({
        amount: t.amount,
        vendor: t.vendor,
        category: t.category,
        date: t.date instanceof Date ? t.date.toISOString().split('T')[0] : String(t.date),
      }));

    return {
      userId,
      periodLabel,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      totalSpent: Math.round(totalSpent * 100) / 100,
      transactionCount,
      categoryBreakdown,
      topTransactions,
    };
  },
});

/**
 * Step 2: Format summary as human-friendly text
 *
 * Deterministic template — no LLM call needed since data is fully structured.
 */
const formatSummary = createStep({
  id: 'format-summary',
  description: 'Format aggregated spending data into a human-friendly summary',
  inputSchema: GenerateSummaryInputSchema,
  outputSchema: GenerateSummaryOutputSchema,
  execute: async ({ inputData }) => {
    const { periodLabel, totalSpent, transactionCount, categoryBreakdown, topTransactions } = inputData;

    if (transactionCount === 0) {
      return {
        summary: `No transactions found for ${periodLabel}. Start logging your expenses! 📝`,
        periodLabel,
        categoryBreakdown,
      };
    }

    const categoryLines = categoryBreakdown
      .map(c => `• ${c.category}: €${c.total.toFixed(2)} (${c.count} txns)`)
      .join('\n');

    const topLines = topTransactions
      .map((t, i) => `${i + 1}. €${t.amount} at ${t.vendor} (${t.category}, ${t.date})`)
      .join('\n');

    const summary = `📊 Spending Summary — ${periodLabel}

💰 Total: €${totalSpent.toFixed(2)} across ${transactionCount} transactions

📋 By Category:
${categoryLines}

🔝 Top Expenses:
${topLines}`;

    return {
      summary,
      periodLabel,
      categoryBreakdown,
    };
  },
});

/**
 * Spending Summary Workflow
 *
 * Step 1: fetchTransactionData — queries DB, aggregates by category
 * Step 2: formatSummary — deterministic template (no LLM call)
 */
export const spendingSummaryWorkflow = createWorkflow({
  id: 'spending-summary',
  inputSchema: SpendingSummaryInputSchema,
  outputSchema: SpendingSummaryOutputSchema,
})
  .then(fetchTransactionData)
  .then(formatSummary)
  .commit();
