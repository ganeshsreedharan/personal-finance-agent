import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { CATEGORY_LIST, SUPPORTED_CURRENCIES, RECURRING_STATUS } from '../../config/index.js';

/**
 * Transaction Zod schema for validation
 */
export const TransactionSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  userId: z.string().min(1, 'User ID is required'),
  date: z.date(),
  amount: z.number().positive('Amount must be positive'),
  currency: z.enum(SUPPORTED_CURRENCIES),
  vendor: z.string().min(1, 'Vendor is required'),
  category: z.enum(CATEGORY_LIST as [string, ...string[]]),
  recurring: z.enum([RECURRING_STATUS.YES, RECURRING_STATUS.NO, RECURRING_STATUS.UNKNOWN]),
  notes: z.string().optional(),
  attachmentId: z.instanceof(ObjectId).optional(),
  confidenceScore: z.number().min(0).max(1).default(0.5),
  source: z.enum(['text', 'photo', 'pdf']).default('text'),
  isDuplicate: z.boolean().default(false),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

/**
 * TypeScript type inferred from schema
 */
export type Transaction = z.infer<typeof TransactionSchema>;

/**
 * Input schema for creating transactions (without auto-generated fields)
 */
export const CreateTransactionSchema = TransactionSchema.omit({
  _id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;

/**
 * Partial schema for updating transactions
 */
export const UpdateTransactionSchema = TransactionSchema.partial().omit({
  _id: true,
  userId: true,
  createdAt: true,
});

export type UpdateTransactionInput = z.infer<typeof UpdateTransactionSchema>;

/**
 * Transaction document interface for MongoDB
 */
export interface TransactionDocument {
  _id?: ObjectId;
  userId: string;
  date: Date;
  amount: number;
  currency: string;
  vendor: string;
  category: string;
  recurring: string;
  notes?: string;
  attachmentId?: ObjectId;
  confidenceScore: number;
  source: string;
  isDuplicate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Helper to convert Transaction to MongoDB document
 */
export const toTransactionDocument = (transaction: Transaction): TransactionDocument => ({
  ...transaction,
  updatedAt: new Date(),
});

/**
 * Helper to parse MongoDB document to Transaction
 */
export const fromTransactionDocument = (doc: TransactionDocument): Transaction =>
  TransactionSchema.parse(doc);
