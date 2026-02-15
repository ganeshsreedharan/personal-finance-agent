import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { SUPPORTED_CURRENCIES, RECURRING_STATUS, ATTACHMENT_SOURCE } from '../config/index.js';

// ── Transaction ──

export const TransactionSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  userId: z.string().min(1, 'User ID is required'),
  date: z.date(),
  amount: z.number().positive('Amount must be positive'),
  currency: z.enum(SUPPORTED_CURRENCIES),
  vendor: z.string().min(1, 'Vendor is required'),
  category: z.string().min(1, 'Category is required'),
  recurring: z.enum([RECURRING_STATUS.YES, RECURRING_STATUS.NO, RECURRING_STATUS.UNKNOWN]),
  notes: z.string().nullish(),
  attachmentId: z.instanceof(ObjectId).optional(),
  confidenceScore: z.number().min(0).max(1).default(0.5),
  source: z.enum(['text', 'photo', 'pdf']).default('text'),
  isDuplicate: z.boolean().default(false),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type Transaction = z.infer<typeof TransactionSchema>;

const CreateTransactionSchema = TransactionSchema.omit({ _id: true, createdAt: true, updatedAt: true });
export type CreateTransaction = z.input<typeof CreateTransactionSchema>;
export type UpdateTransaction = Partial<Omit<Transaction, '_id' | 'userId' | 'createdAt'>>;

// ── User ──

export const UserSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  telegramId: z.number().positive('Telegram ID must be positive'),
  firstName: z.string().nullish(),
  lastName: z.string().nullish(),
  username: z.string().nullish(),
  defaultCurrency: z.enum(SUPPORTED_CURRENCIES).default('EUR'),
  timezone: z.string().default('Europe/Berlin'),
  recurringBills: z
    .array(
      z.object({
        vendor: z.string(),
        category: z.string(),
        expectedAmount: z.number().positive(),
        expectedDay: z.number().min(1).max(31),
      })
    )
    .default([]),
  vendorCategoryMap: z.record(z.string(), z.string()).default({}),
  createdAt: z.date().default(() => new Date()),
  lastActive: z.date().default(() => new Date()),
});

export type User = z.infer<typeof UserSchema>;

const CreateUserSchema = UserSchema.omit({ _id: true, createdAt: true, lastActive: true });
export type CreateUser = z.input<typeof CreateUserSchema>;
export type UpdateUser = Partial<Omit<User, '_id' | 'telegramId' | 'createdAt'>>;

// ── Attachment ──

export const AttachmentSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  userId: z.string().min(1, 'User ID is required'),
  transactionId: z.instanceof(ObjectId).optional(),
  filename: z.string().min(1, 'Filename is required'),
  mimeType: z.string().min(1, 'MIME type is required'),
  size: z.number().positive('Size must be positive'),
  gridFsId: z.instanceof(ObjectId),
  uploadedAt: z.date().default(() => new Date()),
  source: z.enum([ATTACHMENT_SOURCE.PHOTO, ATTACHMENT_SOURCE.PDF, ATTACHMENT_SOURCE.DOCUMENT]),
});

export type Attachment = z.infer<typeof AttachmentSchema>;

const CreateAttachmentSchema = AttachmentSchema.omit({ _id: true, uploadedAt: true });
export type CreateAttachment = z.input<typeof CreateAttachmentSchema>;

// ── Tool Schemas (shared across Mastra tools) ──

/** Common tool input: userId is always required */
export const ToolUserIdSchema = z.object({
  userId: z.string().describe('User ID from MongoDB'),
});

/** Serialized transaction returned by query/update tools */
export const TransactionResultSchema = z.object({
  id: z.string(),
  date: z.string(),
  amount: z.number(),
  currency: z.string(),
  vendor: z.string(),
  category: z.string(),
  recurring: z.string(),
  notes: z.string().nullish(),
});

/** Serialize a Transaction document for tool output */
export const serializeTransaction = (t: Transaction) => ({
  id: t._id!.toString(),
  date: t.date.toISOString().split('T')[0],
  amount: t.amount,
  currency: t.currency,
  vendor: t.vendor,
  category: t.category,
  recurring: t.recurring,
  notes: t.notes ?? undefined,
});

// ── Store Transaction ──

export const StoreTransactionInputSchema = ToolUserIdSchema.extend({
  date: z.string().describe('Transaction date in ISO format (YYYY-MM-DD)'),
  amount: z.number().positive().describe('Transaction amount'),
  currency: z.enum(SUPPORTED_CURRENCIES).describe('Currency code'),
  vendor: z.string().min(1, 'Vendor is required').describe('Vendor or merchant name'),
  category: z.string().describe('Transaction category'),
  recurring: z.enum(['yes', 'no', 'unknown']).describe('Recurring status'),
  notes: z.string().optional().describe('Additional notes'),
  confidenceScore: z.number().min(0).max(1).describe('Confidence score'),
});

export const StoreTransactionOutputSchema = z.object({
  success: z.boolean().describe('Whether storage was successful'),
  transactionId: z.string().optional().describe('ID of saved transaction'),
  error: z.string().optional().describe('Error message if failed'),
});

// ── Query Transactions ──

export const QueryTransactionInputSchema = ToolUserIdSchema.extend({
  queryType: z.enum(['recent', 'date', 'range']).describe(
    'Query type: "recent" for last N transactions, "date" for a specific day, "range" for a date range'
  ),
  limit: z.number().optional().default(5).describe('Number of recent transactions to fetch (for "recent" type)'),
  date: z.string().optional().describe('Specific date in ISO format YYYY-MM-DD (for "date" type)'),
  startDate: z.string().optional().describe('Start date in ISO format YYYY-MM-DD (for "range" type)'),
  endDate: z.string().optional().describe('End date in ISO format YYYY-MM-DD (for "range" type)'),
});

export const QueryTransactionOutputSchema = z.object({
  success: z.boolean(),
  transactions: z.array(TransactionResultSchema),
  count: z.number(),
  error: z.string().optional(),
});

// ── Update Transaction ──

export const UpdateTransactionInputSchema = z.object({
  transactionId: z.string().describe('Transaction ID to update (from query-transactions results)'),
  date: z.string().optional().describe('New date in ISO format YYYY-MM-DD'),
  amount: z.number().positive().optional().describe('New amount'),
  currency: z.enum(SUPPORTED_CURRENCIES).optional().describe('New currency code'),
  vendor: z.string().optional().describe('New vendor name'),
  category: z.string().optional().describe('New category'),
  recurring: z.enum(['yes', 'no', 'unknown']).optional().describe('New recurring status'),
  notes: z.string().optional().describe('New notes'),
});

export const UpdateTransactionOutputSchema = z.object({
  success: z.boolean(),
  updated: TransactionResultSchema.optional(),
  error: z.string().optional(),
});

// ── Delete Transaction ──

export const DeleteTransactionInputSchema = z.object({
  transactionId: z.string().describe('Transaction ID to delete (from query-transactions results)'),
});

export const DeleteTransactionOutputSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
});

// ── Check Duplicates ──

export const CheckDuplicatesInputSchema = ToolUserIdSchema.extend({
  vendor: z.string().describe('Vendor name to check'),
  amount: z.number().positive().describe('Amount to check'),
  date: z.string().describe('Date in ISO format YYYY-MM-DD'),
});

export const CheckDuplicatesOutputSchema = z.object({
  hasDuplicates: z.boolean(),
  duplicates: z.array(TransactionResultSchema),
  count: z.number(),
});

// ── Spending Summary ──

export const SpendingSummaryInputSchema = ToolUserIdSchema.extend({
  period: z.enum(['week', 'month']).describe('Summary period: "week" for last 7 days, "month" for current month'),
});

export const SpendingSummaryOutputSchema = z.object({
  success: z.boolean(),
  summary: z.string().optional().describe('Human-friendly spending summary'),
  periodLabel: z.string().optional(),
  categoryBreakdown: z.array(z.object({
    category: z.string(),
    total: z.number(),
    count: z.number(),
  })).optional(),
  error: z.string().optional(),
});
