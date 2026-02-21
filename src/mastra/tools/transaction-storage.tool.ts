import { createTool } from '@mastra/core/tools';
import { transactionRepository } from '../../database/index.js';
import { StoreTransactionInputSchema, StoreTransactionOutputSchema, serializeTransaction } from '../../database/schema.js';
import { RECURRING_STATUS } from '../../config/index.js';

/**
 * Transaction Storage Tool
 * Checks for duplicates internally, then stores transaction in MongoDB.
 * Combines what was previously two separate tools (check-duplicates + store-transaction)
 * into a single tool call to reduce LLM roundtrips.
 */
export const transactionStorageTool = createTool({
  id: 'store-transaction',
  description:
    'Stores a transaction in the database. Automatically checks for duplicates first (same vendor, similar amount ±5%, within 7 days). If duplicates found, returns them with hasDuplicates=true instead of storing — the user must confirm before re-calling with force=true.',
  inputSchema: StoreTransactionInputSchema,
  outputSchema: StoreTransactionOutputSchema,
  execute: async (input, { mastra }) => {
    const logger = mastra?.getLogger();
    const t0 = Date.now();
    try {
      const { userId, amount, currency, vendor, category, recurring, notes, confidenceScore, force } = input;
      const dateStr = input.date || new Date().toISOString().split('T')[0];
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day, 12, 0, 0);

      // Check for duplicates unless force=true (user confirmed)
      if (!force) {
        const dupStart = Date.now();
        const duplicates = await transactionRepository.findPotentialDuplicates(
          userId, vendor, amount, date,
        );
        logger?.info('[TIMING] store-transaction: dup check', { elapsed: `${Date.now() - dupStart}ms`, found: duplicates.length });
        if (duplicates.length > 0) {
          return {
            success: false,
            hasDuplicates: true,
            duplicates: duplicates.map(serializeTransaction),
            duplicateCount: duplicates.length,
          };
        }
      }

      const validRecurring =
        recurring === RECURRING_STATUS.YES ||
        recurring === RECURRING_STATUS.NO ||
        recurring === RECURRING_STATUS.UNKNOWN
          ? recurring
          : RECURRING_STATUS.UNKNOWN;

      const insertStart = Date.now();
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
        isDuplicate: !!force,
      });
      logger?.info('[TIMING] store-transaction: insert', { elapsed: `${Date.now() - insertStart}ms` });
      logger?.info('[TIMING] store-transaction: total', { elapsed: `${Date.now() - t0}ms` });

      return {
        success: true,
        transactionId: transaction._id?.toString(),
      };
    } catch (error) {
      logger?.error('Transaction storage error', { error, elapsed: `${Date.now() - t0}ms` });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});
