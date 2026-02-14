/**
 * Personal Finance AI Agent - Entry Point
 * Phase 2: Core Agent - Full agentic pattern
 */

import { createBot, startBot, handleTextMessage, handleMedia, mediaMiddleware } from './bot/index.js';
import { dbClient } from './database/index.js';
import { env } from './config/index.js';

/**
 * Initialize and start the application
 */
const main = async (): Promise<void> => {
  try {
    console.log('🚀 Starting Personal Finance AI Agent...');
    console.log(`Environment: ${env.NODE_ENV}`);
    console.log(`Log Level: ${env.LOG_LEVEL}`);

    // Connect to MongoDB
    console.log('📦 Connecting to MongoDB...');
    await dbClient.connect();
    console.log('✅ MongoDB connected');

    // Create bot instance
    console.log('🤖 Initializing Telegram bot...');
    const bot = createBot();

    // Media middleware: provider check + file download for all media types
    bot.use(mediaMiddleware);

    // Register message handlers - Agent handles EVERYTHING
    bot.on('message:text', handleTextMessage);
    bot.on('message:photo', handleMedia);
    bot.on('message:document', handleMedia);
    bot.on('message:voice', handleMedia);
    bot.on('message:audio', handleMedia);

    // Start bot
    await startBot(bot);
  } catch (error) {
    console.error('❌ Failed to start application:', error);
    process.exit(1);
  }
};

// Handle unhandled errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', error => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start application
main();
