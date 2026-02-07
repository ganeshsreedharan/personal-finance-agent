import { Collection, ObjectId } from 'mongodb';
import { dbClient } from '../client.js';
import type {
  Transaction,
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionDocument,
} from '../models/transaction.model.js';
import {
  TransactionSchema,
  toTransactionDocument,
  fromTransactionDocument,
} from '../models/transaction.model.js';

/**
 * Transaction repository for database operations
 */
export class TransactionRepository {
  private get collection(): Collection<TransactionDocument> {
    return dbClient.getDb().collection<TransactionDocument>('transactions');
  }

  /**
   * Create a new transaction
   */
  async create(input: CreateTransactionInput): Promise<Transaction> {
    const transaction = TransactionSchema.parse({
      ...input,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const document = toTransactionDocument(transaction);
    const result = await this.collection.insertOne(document);

    return {
      ...transaction,
      _id: result.insertedId,
    };
  }

  /**
   * Find transaction by ID
   */
  async findById(id: string | ObjectId): Promise<Transaction | null> {
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const document = await this.collection.findOne({ _id: objectId });

    if (!document) {
      return null;
    }

    return fromTransactionDocument(document);
  }

  /**
   * Find transactions by user ID
   */
  async findByUserId(
    userId: string,
    options?: {
      limit?: number;
      skip?: number;
      sortBy?: 'date' | 'createdAt';
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<Transaction[]> {
    const {
      limit = 50,
      skip = 0,
      sortBy = 'date',
      sortOrder = 'desc',
    } = options || {};

    const documents = await this.collection
      .find({ userId })
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return documents.map(fromTransactionDocument);
  }

  /**
   * Find transactions by date range
   */
  async findByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Transaction[]> {
    const documents = await this.collection
      .find({
        userId,
        date: {
          $gte: startDate,
          $lte: endDate,
        },
      })
      .sort({ date: -1 })
      .toArray();

    return documents.map(fromTransactionDocument);
  }

  /**
   * Find transactions by category
   */
  async findByCategory(userId: string, category: string): Promise<Transaction[]> {
    const documents = await this.collection
      .find({ userId, category })
      .sort({ date: -1 })
      .toArray();

    return documents.map(fromTransactionDocument);
  }

  /**
   * Find potential duplicates
   * Checks for transactions with similar amount (±5%), same vendor, and within 7 days
   */
  async findPotentialDuplicates(
    userId: string,
    vendor: string,
    amount: number,
    date: Date,
    tolerancePercent: number = 5,
    daysWindow: number = 7
  ): Promise<Transaction[]> {
    const amountLower = amount * (1 - tolerancePercent / 100);
    const amountUpper = amount * (1 + tolerancePercent / 100);

    const startDate = new Date(date);
    startDate.setDate(startDate.getDate() - daysWindow);

    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + daysWindow);

    const documents = await this.collection
      .find({
        userId,
        vendor,
        amount: { $gte: amountLower, $lte: amountUpper },
        date: { $gte: startDate, $lte: endDate },
      })
      .sort({ date: -1 })
      .toArray();

    return documents.map(fromTransactionDocument);
  }

  /**
   * Update transaction
   */
  async update(id: string | ObjectId, input: UpdateTransactionInput): Promise<Transaction | null> {
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;

    const result = await this.collection.findOneAndUpdate(
      { _id: objectId },
      {
        $set: {
          ...input,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      return null;
    }

    return fromTransactionDocument(result);
  }

  /**
   * Delete transaction
   */
  async delete(id: string | ObjectId): Promise<boolean> {
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const result = await this.collection.deleteOne({ _id: objectId });

    return result.deletedCount > 0;
  }

  /**
   * Get transaction count by user
   */
  async countByUserId(userId: string): Promise<number> {
    return this.collection.countDocuments({ userId });
  }

  /**
   * Get total spending by category for a date range
   */
  async getTotalByCategory(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ category: string; total: number; count: number }>> {
    const result = await this.collection
      .aggregate([
        {
          $match: {
            userId,
            date: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: '$category',
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            category: '$_id',
            total: 1,
            count: 1,
          },
        },
        {
          $sort: { total: -1 },
        },
      ])
      .toArray();

    return result as Array<{ category: string; total: number; count: number }>;
  }
}

// Export singleton instance
export const transactionRepository = new TransactionRepository();
