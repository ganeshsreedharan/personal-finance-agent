import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { CATEGORY_LIST, SUPPORTED_CURRENCIES, RECURRING_STATUS, ATTACHMENT_SOURCE } from '../config/index.js';

// ── Transaction ──

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
