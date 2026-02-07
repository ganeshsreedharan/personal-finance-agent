import { Bot, Context } from 'grammy';
import { env } from '../config/index.js';
import { userRepository } from '../database/index.js';
import { authMiddleware } from './middleware/index.js';

/**
 * Extended context with user data
 */
export interface BotContext extends Context {
  userId?: string;
}

/**
 * Create and configure Telegram bot
 */
export const createBot = (): Bot<BotContext> => {
  const bot = new Bot<BotContext>(env.TELEGRAM_BOT_TOKEN);

  // Middleware 1: Authorization (check if user is whitelisted)
  bot.use(authMiddleware);

  // Middleware 2: Ensure user exists in database
  bot.use(async (ctx, next) => {
    if (!ctx.from) {
      return;
    }

    try {
      const user = await userRepository.findOrCreate({
        id: ctx.from.id,
        first_name: ctx.from.first_name,
        last_name: ctx.from.last_name,
        username: ctx.from.username,
      });

      // Attach user ID to context
      ctx.userId = user._id?.toString();
    } catch (error) {
      console.error('Error in user middleware:', error);
    }

    await next();
  });

  // Error handler
  bot.catch(error => {
    console.error('Bot error:', error);
  });

  return bot;
};

/**
 * Start bot with graceful shutdown
 */
export const startBot = async (bot: Bot<BotContext>): Promise<void> => {
  // Get bot info
  const botInfo = await bot.api.getMe();
  console.log(`Bot started: @${botInfo.username}`);

  // Start bot with long polling
  await bot.start({
    onStart: () => {
      console.log('Bot is running and listening for messages...');
    },
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('Shutting down bot...');
    await bot.stop();
    process.exit(0);
  };

  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
};
