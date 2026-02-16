import { Bot, Context } from 'grammy';
import { env } from '../config/index.js';
import { userRepository } from '../database/index.js';
import { mastra } from '../mastra/index.js';
import { authMiddleware } from './middleware/index.js';

/**
 * Media file extracted by media middleware
 */
export interface MediaFile {
  buffer: Buffer;
  mimeType: string;
  type: 'photo' | 'voice' | 'audio' | 'document';
  fileName?: string;
}

/**
 * Extended context with user data and media
 */
export interface BotContext extends Context {
  userId?: string;
  mediaFile?: MediaFile;
}

/**
 * Create and configure Telegram bot
 */
export const createBot = (): Bot<BotContext> => {
  const bot = new Bot<BotContext>(env.TELEGRAM_BOT_TOKEN);
  const logger = mastra.getLogger();

  // Middleware 1: Authorization (check if user is whitelisted)
  bot.use(authMiddleware);

  // Middleware 2: Ensure user exists in database
  bot.use(async (ctx, next) => {
    if (!ctx.from) {
      return;
    }

    const start = Date.now();
    try {
      const user = await userRepository.findOrCreate({
        id: ctx.from.id,
        first_name: ctx.from.first_name,
        last_name: ctx.from.last_name,
        username: ctx.from.username,
      });

      ctx.userId = user._id?.toString();
      logger.debug(`User lookup took ${Date.now() - start}ms`);
      await next();
    } catch (error) {
      logger.error('Error in user middleware', { error });
      await ctx.reply('Sorry, something went wrong. Please try again.');
    }
  });

  // Error handler
  bot.catch(error => {
    logger.error('Bot error', { error });
  });

  return bot;
};

/**
 * Start bot with graceful shutdown
 */
export const startBot = async (bot: Bot<BotContext>): Promise<void> => {
  const logger = mastra.getLogger();
  const botInfo = await bot.api.getMe();
  logger.info(`Bot started: @${botInfo.username}`);

  await bot.start({
    onStart: () => {
      logger.info('Bot is running and listening for messages...');
    },
  });

  const shutdown = async () => {
    logger.info('Shutting down bot...');
    await bot.stop();
    process.exit(0);
  };

  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
};
