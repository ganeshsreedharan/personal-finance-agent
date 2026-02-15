import { MongoClient, Db, GridFSBucket } from 'mongodb';
import { env } from '../config/index.js';

/**
 * MongoDB client singleton
 */
class DatabaseClient {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private gridFSBucket: GridFSBucket | null = null;

  /**
   * Connect to MongoDB
   */
  async connect(): Promise<void> {
    try {
      if (this.client) {
        console.warn('MongoDB client already connected');
        return;
      }

      this.client = new MongoClient(env.MONGODB_URI);
      await this.client.connect();

      this.db = this.client.db(env.MONGODB_DATABASE);
      this.gridFSBucket = new GridFSBucket(this.db, {
        bucketName: 'attachments',
      });

      console.log(`Connected to MongoDB: ${env.MONGODB_DATABASE}`);

      // Create indexes on connection
      await this.createIndexes();
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      throw new Error('Database connection failed');
    }
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      this.gridFSBucket = null;
      console.log('Disconnected from MongoDB');
    }
  }

  /**
   * Get database instance
   */
  getDb(): Db {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }

  /**
   * Get GridFS bucket for file storage
   */
  getGridFSBucket(): GridFSBucket {
    if (!this.gridFSBucket) {
      throw new Error('GridFS bucket not initialized. Call connect() first.');
    }
    return this.gridFSBucket;
  }

  /**
   * Create database indexes for performance
   */
  private async createIndexes(): Promise<void> {
    if (!this.db) {
      return;
    }

    const transactionsCollection = this.db.collection('transactions');
    const usersCollection = this.db.collection('users');
    const attachmentsCollection = this.db.collection('attachments');

    // Transactions indexes
    await transactionsCollection.createIndex({ userId: 1, date: -1 });
    await transactionsCollection.createIndex({ userId: 1, vendor: 1, date: -1 });
    await transactionsCollection.createIndex({ userId: 1, category: 1, date: -1 });
    await transactionsCollection.createIndex({ createdAt: 1 });

    // Users indexes
    await usersCollection.createIndex({ telegramId: 1 }, { unique: true });

    // Attachments indexes
    await attachmentsCollection.createIndex({ userId: 1, transactionId: 1 });
    await attachmentsCollection.createIndex({ gridFsId: 1 });

    // Mastra memory TTL indexes — auto-delete old threads/messages after 90 days
    // createIndex auto-creates the collection if it doesn't exist yet
    const mastraDb = this.client!.db(env.MASTRA_DATABASE);

    await mastraDb.collection('messages').createIndex(
      { createdAt: 1 },
      { expireAfterSeconds: 90 * 24 * 60 * 60 }
    );
    await mastraDb.collection('threads').createIndex(
      { createdAt: 1 },
      { expireAfterSeconds: 90 * 24 * 60 * 60 }
    );

    console.log('Database indexes created successfully');
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.client) {
        return false;
      }
      await this.client.db('admin').command({ ping: 1 });
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const dbClient = new DatabaseClient();
