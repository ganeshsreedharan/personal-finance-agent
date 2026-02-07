import { z } from 'zod';
import { transactionRepository } from '../../database/index.js';
import type { Currency } from '../../config/index.js';
import { RECURRING_STATUS } from '../../config/index.js';

/**
 * Transaction Storage Output Schema
 */
export const TransactionStorageOutputSchema = z.object({
  success: z.boolean(),
  transactionId: z.string().optional(),
  error: z.string().optional(),
});

export type TransactionStorageOutput = z.infer<typeof TransactionStorageOutputSchema>;

/**
 * Store transaction in database
 */
export const storeTransaction = async (params: {
  userId: string;
  date: string;
  amount: number;
  currency: Currency;
  vendor: string;
  category: string;
  recurring: 'yes' | 'no' | 'unknown';
  notes?: string;
  confidenceScore: number;
  source?: 'text' | 'photo' | 'pdf';
}): Promise<TransactionStorageOutput> => {
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
      source = 'text',
    } = params;

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
      source,
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
};
