/**
 * Personal Finance AI Agent - Entry Point
 * Phase 1: Foundation - Basic bot with text echo
 */

import {
  createBot,
  startBot,
  handleTextMessage,
  handleStartCommand,
  handleHelpCommand,
  handleSummaryCommand,
  handleMonthlyCommand,
  handlePhoto,
  handleDocument,
} from './bot/index.js';
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

    // Register command handlers
    bot.command('start', handleStartCommand);
    bot.command('help', handleHelpCommand);
    bot.command('summary', handleSummaryCommand);
    bot.command('monthly', handleMonthlyCommand);

    // Register message handlers
    bot.on('message:text', handleTextMessage);
    bot.on('message:photo', handlePhoto);
    bot.on('message:document', handleDocument);

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
