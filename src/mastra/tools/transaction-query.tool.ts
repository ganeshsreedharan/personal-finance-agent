import { createTool } from '@mastra/core/tools';
import { transactionRepository } from '../../database/index.js';
import { QueryTransactionInputSchema, QueryTransactionOutputSchema, serializeTransaction } from '../../database/schema.js';

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
  execute: async (input) => {
    try {
      const { userId, queryType, limit, date, startDate, endDate } = input;
      let transactions;

      switch (queryType) {
        case 'recent':
          transactions = await transactionRepository.findByUserId(userId, {
            limit: limit || 5,
            sortBy: 'date',
            sortOrder: 'desc',
          });
          break;

        case 'date': {
          if (!date) {
            return { success: false, transactions: [], count: 0, error: 'date is required for "date" query type' };
          }
          const targetDate = new Date(date);
          const dayStart = new Date(targetDate);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(targetDate);
          dayEnd.setHours(23, 59, 59, 999);
          transactions = await transactionRepository.findByDateRange(userId, dayStart, dayEnd);
          break;
        }

        case 'range': {
          if (!startDate || !endDate) {
            return { success: false, transactions: [], count: 0, error: 'startDate and endDate are required for "range" query type' };
          }
          const rangeStart = new Date(startDate);
          rangeStart.setHours(0, 0, 0, 0);
          const rangeEnd = new Date(endDate);
          rangeEnd.setHours(23, 59, 59, 999);
          transactions = await transactionRepository.findByDateRange(userId, rangeStart, rangeEnd);
          break;
        }
      }

      return {
        success: true,
        transactions: transactions.map(serializeTransaction),
        count: transactions.length,
      };
    } catch (error) {
      console.error('Transaction query error:', error);
      return {
        success: false,
        transactions: [],
        count: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});
