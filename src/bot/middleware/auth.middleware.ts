import type { BotContext } from '../telegram.js';
import { env } from '../../config/index.js';

/**
 * Authorization middleware to restrict bot access to whitelisted users
 */
export const authMiddleware = async (ctx: BotContext, next: () => Promise<void>): Promise<void> => {
  const userId = ctx.from?.id;

  if (!userId) {
    return;
  }

  // If ALLOWED_USER_IDS is empty, allow all users
  if (!env.ALLOWED_USER_IDS || env.ALLOWED_USER_IDS.length === 0) {
    await next();
    return;
  }

  // Check if user is in whitelist
  if (env.ALLOWED_USER_IDS.includes(userId)) {
    await next();
    return;
  }

  // User not authorized
  console.warn(`Unauthorized access attempt from user ID: ${userId}`);
  await ctx.reply(
    '🚫 **Access Denied**\n\n' +
      'This bot is private and only available to authorized users.\n\n' +
      `Your Telegram ID: \`${userId}\`\n\n` +
      'Please contact the bot owner to request access.'
  );
};
