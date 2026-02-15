import { Memory } from '@mastra/memory';
import { mastraStore } from './storage.js';

/**
 * Agent Memory Configuration
 *
 * Uses shared MongoDBStore (single connection) with optimized settings:
 * - lastMessages: 5 — enough context for expense logging conversations
 * - semanticRecall: false — no vector search overhead (not needed for finance bot)
 */
export const agentMemory = new Memory({
  storage: mastraStore,
  options: {
    lastMessages: 5,
    semanticRecall: false,
  },
});
