import { createTool } from '@mastra/core/tools';
import { transactionRepository } from '../../database/index.js';
import { QueryTransactionInputSchema, QueryTransactionOutputSchema, serializeTransaction } from '../../database/schema.js';

/** Parse "YYYY-MM-DD" as local date (avoids UTC midnight timezone issues) */
function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Transaction Query Tool
 * Fetches transactions by date range, recent count, or specific date.
 */
export const transactionQueryTool = createTool({
  id: 'query-transactions',
  description:
    'Fetches transactions from the database. Supports: recent N transactions, specific date, or date range. Returns a list of transactions with id, date, amount, currency, vendor, category.',
  inputSchema: QueryTransactionInputSchema,
  outputSchema: QueryTransactionOutputSchema,
  execute: async (input, { mastra }) => {
    const logger = mastra?.getLogger();
    const t0 = Date.now();
    try {
      const { userId, queryType, limit, date, startDate, endDate } = input;
      let transactions;

      switch (queryType) {
        case 'recent':
          transactions = await transactionRepository.findByUserId(userId, {
            limit: limit || 100,
            sortBy: 'createdAt',
            sortOrder: 'desc',
          });
          break;

        case 'date': {
          if (!date) {
            return { success: false, transactions: [], count: 0, error: 'date is required for "date" query type' };
          }
          const dayStart = parseLocalDate(date);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = parseLocalDate(date);
          dayEnd.setHours(23, 59, 59, 999);
          transactions = await transactionRepository.findByDateRange(userId, dayStart, dayEnd);
          break;
        }

        case 'range': {
          if (!startDate || !endDate) {
            return { success: false, transactions: [], count: 0, error: 'startDate and endDate are required for "range" query type' };
          }
          const rangeStart = parseLocalDate(startDate);
          rangeStart.setHours(0, 0, 0, 0);
          const rangeEnd = parseLocalDate(endDate);
          rangeEnd.setHours(23, 59, 59, 999);
          transactions = await transactionRepository.findByDateRange(userId, rangeStart, rangeEnd);
          break;
        }
      }

      logger?.info('[TIMING] query-transactions', { elapsed: `${Date.now() - t0}ms`, queryType, count: transactions.length });

      return {
        success: true,
        transactions: transactions.map(serializeTransaction),
        count: transactions.length,
      };
    } catch (error) {
      logger?.error('query-transactions error', { error, elapsed: `${Date.now() - t0}ms` });
      return {
        success: false,
        transactions: [],
        count: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});
