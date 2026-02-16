import { createTool } from '@mastra/core/tools';
import { transactionRepository } from '../../database/index.js';
import { StoreTransactionInputSchema, StoreTransactionOutputSchema } from '../../database/schema.js';
import { RECURRING_STATUS } from '../../config/index.js';

/**
 * Transaction Storage Tool
 * Stores transaction data in MongoDB
 */
export const transactionStorageTool = createTool({
  id: 'store-transaction',
  description:
    'Stores a transaction in the database. Takes transaction details (userId, date, amount, currency, vendor, category, recurring status, notes, confidence score) and saves it to MongoDB. Returns success status and transaction ID.',
  inputSchema: StoreTransactionInputSchema,
  outputSchema: StoreTransactionOutputSchema,
  execute: async (input, { mastra }) => {
    const logger = mastra?.getLogger();
    try {
      const { userId, amount, currency, vendor, category, recurring, notes, confidenceScore } = input;
      const dateStr = input.date || new Date().toISOString().split('T')[0];
      // Parse as local noon to avoid timezone boundary issues
      // "2026-02-16" → 2026-02-16T12:00:00 local time (not midnight UTC)
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day, 12, 0, 0);

      const validRecurring =
        recurring === RECURRING_STATUS.YES ||
        recurring === RECURRING_STATUS.NO ||
        recurring === RECURRING_STATUS.UNKNOWN
          ? recurring
          : RECURRING_STATUS.UNKNOWN;

      const transaction = await transactionRepository.create({
        userId,
        date: new Date(date),
        amount,
        currency,
        vendor,
        category,
        recurring: validRecurring,
        notes: notes || undefined,
        confidenceScore,
        source: 'text',
        isDuplicate: false,
      });

      return {
        success: true,
        transactionId: transaction._id?.toString(),
      };
    } catch (error) {
      logger?.error('Transaction storage error', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});
