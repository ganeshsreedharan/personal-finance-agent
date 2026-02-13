import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { SUPPORTED_CURRENCIES } from '../../config/index.js';

/**
 * User Zod schema for validation
 */
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

/**
 * TypeScript type inferred from schema
 */
export type User = z.infer<typeof UserSchema>;

/**
 * Input schema for creating users
 */
export const CreateUserSchema = UserSchema.omit({
  _id: true,
  createdAt: true,
  lastActive: true,
}).partial({
  defaultCurrency: true,
  timezone: true,
  recurringBills: true,
  vendorCategoryMap: true,
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;

/**
 * Partial schema for updating users
 */
export const UpdateUserSchema = UserSchema.partial().omit({
  _id: true,
  telegramId: true,
  createdAt: true,
});

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;

/**
 * User document interface for MongoDB
 */
export interface UserDocument {
  _id?: ObjectId;
  telegramId: number;
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  defaultCurrency: string;
  timezone: string;
  recurringBills: Array<{
    vendor: string;
    category: string;
    expectedAmount: number;
    expectedDay: number;
  }>;
  vendorCategoryMap: Record<string, string>;
  createdAt: Date;
  lastActive: Date;
}

/**
 * Helper to convert User to MongoDB document
 */
export const toUserDocument = (user: User): UserDocument => ({
  ...user,
  lastActive: new Date(),
});

/**
 * Helper to parse MongoDB document to User
 */
export const fromUserDocument = (doc: UserDocument): User => UserSchema.parse(doc);
