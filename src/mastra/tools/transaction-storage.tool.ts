import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { transactionRepository } from '../../database/index.js';
import { SUPPORTED_CURRENCIES, RECURRING_STATUS } from '../../config/index.js';

/**
 * Transaction Storage Tool
 * Stores transaction data in MongoDB
 */
export const transactionStorageTool = createTool({
  id: 'store-transaction',
  description:
    'Stores a transaction in the database. Takes transaction details (userId, date, amount, currency, vendor, category, recurring status, notes, confidence score) and saves it to MongoDB. Returns success status and transaction ID.',
  inputSchema: z.object({
    userId: z.string().describe('User ID from MongoDB'),
    date: z.string().describe('Transaction date in ISO format (YYYY-MM-DD)'),
    amount: z.number().positive().describe('Transaction amount'),
    currency: z.enum(SUPPORTED_CURRENCIES).describe('Currency code'),
    vendor: z.string().describe('Vendor or merchant name'),
    category: z.string().describe('Transaction category'),
    recurring: z.enum(['yes', 'no', 'unknown']).describe('Recurring status'),
    notes: z.string().optional().describe('Additional notes'),
    confidenceScore: z.number().min(0).max(1).describe('Confidence score'),
  }),
  outputSchema: z.object({
    success: z.boolean().describe('Whether storage was successful'),
    transactionId: z.string().optional().describe('ID of saved transaction'),
    error: z.string().optional().describe('Error message if failed'),
  }),
  execute: async (input) => {
    try {
      const {
        userId,
        date,
        amount,
        currency,
        vendor,
        category,
        recurring,
        notes,
        confidenceScore,
      } = input;

      // Validate recurring status
      const validRecurring =
        recurring === RECURRING_STATUS.YES ||
        recurring === RECURRING_STATUS.NO ||
        recurring === RECURRING_STATUS.UNKNOWN
          ? recurring
          : RECURRING_STATUS.UNKNOWN;

      // Create transaction
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
      console.error('Transaction storage error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});
