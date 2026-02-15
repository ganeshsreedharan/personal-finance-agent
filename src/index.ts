import { createBot, startBot, handleTextMessage, handleMedia, mediaMiddleware } from './bot/index.js';
import { dbClient } from './database/index.js';
import { env } from './config/index.js';
import { mastra } from './mastra/index.js';

const main = async (): Promise<void> => {
  const logger = mastra.getLogger();

  try {
    logger.info('Starting Personal Finance AI Agent...');
    logger.info(`Environment: ${env.NODE_ENV}`);

    // Connect to MongoDB
    logger.info('Connecting to MongoDB...');
    await dbClient.connect();
    logger.info('MongoDB connected');

    // Create bot instance
    logger.info('Initializing Telegram bot...');
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
    logger.error('Failed to start application', { error });
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

main();
