import { Collection, ObjectId } from 'mongodb';
import { dbClient } from '../client.js';
import type {
  User,
  CreateUserInput,
  UpdateUserInput,
  UserDocument,
} from '../models/user.model.js';
import { UserSchema, toUserDocument, fromUserDocument } from '../models/user.model.js';

/**
 * User repository for database operations
 */
export class UserRepository {
  private get collection(): Collection<UserDocument> {
    return dbClient.getDb().collection<UserDocument>('users');
  }

  /**
   * Create a new user
   */
  async create(input: CreateUserInput): Promise<User> {
    const user = UserSchema.parse({
      ...input,
      createdAt: new Date(),
      lastActive: new Date(),
    });

    const document = toUserDocument(user);
    const result = await this.collection.insertOne(document);

    return {
      ...user,
      _id: result.insertedId,
    };
  }

  /**
   * Find user by Telegram ID
   */
  async findByTelegramId(telegramId: number): Promise<User | null> {
    const document = await this.collection.findOne({ telegramId });

    if (!document) {
      return null;
    }

    return fromUserDocument(document);
  }

  /**
   * Find user by ID
   */
  async findById(id: string | ObjectId): Promise<User | null> {
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const document = await this.collection.findOne({ _id: objectId });

    if (!document) {
      return null;
    }

    return fromUserDocument(document);
  }

  /**
   * Find or create user by Telegram data
   */
  async findOrCreate(telegramUser: {
    id: number;
    first_name?: string;
    last_name?: string;
    username?: string;
  }): Promise<User> {
    const existingUser = await this.findByTelegramId(telegramUser.id);

    if (existingUser) {
      // Update last active
      await this.updateLastActive(telegramUser.id);
      return existingUser;
    }

    // Create new user
    return this.create({
      telegramId: telegramUser.id,
      firstName: telegramUser.first_name,
      lastName: telegramUser.last_name,
      username: telegramUser.username,
    });
  }

  /**
   * Update user
   */
  async update(telegramId: number, input: UpdateUserInput): Promise<User | null> {
    const result = await this.collection.findOneAndUpdate(
      { telegramId },
      {
        $set: {
          ...input,
          lastActive: new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      return null;
    }

    return fromUserDocument(result);
  }

  /**
   * Update last active timestamp
   */
  async updateLastActive(telegramId: number): Promise<void> {
    await this.collection.updateOne({ telegramId }, { $set: { lastActive: new Date() } });
  }

  /**
   * Add vendor-category mapping
   */
  async addVendorCategoryMapping(
    telegramId: number,
    vendor: string,
    category: string
  ): Promise<void> {
    await this.collection.updateOne(
      { telegramId },
      {
        $set: {
          [`vendorCategoryMap.${vendor}`]: category,
          lastActive: new Date(),
        },
      }
    );
  }

  /**
   * Add recurring bill
   */
  async addRecurringBill(
    telegramId: number,
    bill: {
      vendor: string;
      category: string;
      expectedAmount: number;
      expectedDay: number;
    }
  ): Promise<void> {
    await this.collection.updateOne(
      { telegramId },
      {
        $push: { recurringBills: bill },
        $set: { lastActive: new Date() },
      }
    );
  }

  /**
   * Remove recurring bill
   */
  async removeRecurringBill(telegramId: number, vendor: string): Promise<void> {
    await this.collection.updateOne(
      { telegramId },
      {
        $pull: { recurringBills: { vendor } },
        $set: { lastActive: new Date() },
      }
    );
  }

  /**
   * Delete user
   */
  async delete(telegramId: number): Promise<boolean> {
    const result = await this.collection.deleteOne({ telegramId });
    return result.deletedCount > 0;
  }

  /**
   * Get total user count
   */
  async count(): Promise<number> {
    return this.collection.countDocuments();
  }
}

// Export singleton instance
export const userRepository = new UserRepository();
