import { MongoDBStore } from '@mastra/mongodb';
import { env } from '../config/index.js';

/** Shared storage — single MongoDB connection for Mastra instance and agent Memory */
export const mastraStore = new MongoDBStore({
  id: 'mastra-storage',
  uri: env.MONGODB_URI,
  dbName: env.MASTRA_DATABASE,
});
