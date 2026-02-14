import { Collection, ObjectId } from 'mongodb';
import { dbClient } from '../client.js';
import { UserSchema, type User, type CreateUser, type UpdateUser } from '../schema.js';

export class UserRepository {
  private get collection(): Collection<User> {
    return dbClient.getDb().collection<User>('users');
  }

  async create(input: CreateUser): Promise<User> {
    const user = UserSchema.parse({
      ...input,
      createdAt: new Date(),
      lastActive: new Date(),
    });

    const result = await this.collection.insertOne(user);

    return {
      ...user,
      _id: result.insertedId,
    };
  }

  async findByTelegramId(telegramId: number): Promise<User | null> {
    const document = await this.collection.findOne({ telegramId });
    if (!document) return null;
    return UserSchema.parse(document);
  }

  async findById(id: string | ObjectId): Promise<User | null> {
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const document = await this.collection.findOne({ _id: objectId });
    if (!document) return null;
    return UserSchema.parse(document);
  }

  async findOrCreate(telegramUser: {
    id: number;
    first_name?: string;
    last_name?: string;
    username?: string;
  }): Promise<User> {
    const existingUser = await this.findByTelegramId(telegramUser.id);

    if (existingUser) {
      await this.updateLastActive(telegramUser.id);
      return existingUser;
    }

    return this.create({
      telegramId: telegramUser.id,
      firstName: telegramUser.first_name,
      lastName: telegramUser.last_name,
      username: telegramUser.username,
    });
  }

  async update(telegramId: number, input: UpdateUser): Promise<User | null> {
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

    if (!result) return null;
    return UserSchema.parse(result);
  }

  async updateLastActive(telegramId: number): Promise<void> {
    await this.collection.updateOne({ telegramId }, { $set: { lastActive: new Date() } });
  }

  async addVendorCategoryMapping(telegramId: number, vendor: string, category: string): Promise<void> {
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

  async addRecurringBill(
    telegramId: number,
    bill: { vendor: string; category: string; expectedAmount: number; expectedDay: number }
  ): Promise<void> {
    await this.collection.updateOne(
      { telegramId },
      {
        $push: { recurringBills: bill } as never,
        $set: { lastActive: new Date() },
      }
    );
  }

  async removeRecurringBill(telegramId: number, vendor: string): Promise<void> {
    await this.collection.updateOne(
      { telegramId },
      {
        $pull: { recurringBills: { vendor } } as never,
        $set: { lastActive: new Date() },
      }
    );
  }

  async delete(telegramId: number): Promise<boolean> {
    const result = await this.collection.deleteOne({ telegramId });
    return result.deletedCount > 0;
  }

  async count(): Promise<number> {
    return this.collection.countDocuments();
  }
}

export const userRepository = new UserRepository();
