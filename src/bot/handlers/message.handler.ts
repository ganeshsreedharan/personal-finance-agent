import type { BotContext } from '../telegram.js';
import { processTextTransaction } from '../../mastra/index.js';

/**
 * Handle text messages
 * Phase 2: Process transactions with Mastra agent + Gemini
 */
export const handleTextMessage = async (ctx: BotContext): Promise<void> => {
  const message = ctx.message?.text;

  if (!message || !ctx.userId) {
    return;
  }

  try {
    // Process transaction using workflow
    const result = await processTextTransaction({
      userId: ctx.userId,
      text: message,
    });

    // Reply with result
    await ctx.reply(result.message);

    // Log for debugging
    if (result.success) {
      console.log(`[User ${ctx.userId}] Transaction logged: ${result.transactionId}`);
    } else {
      console.warn(`[User ${ctx.userId}] Transaction failed: ${result.error}`);
    }
  } catch (error) {
    console.error('Error handling text message:', error);
    await ctx.reply('Sorry, something went wrong processing your transaction. Please try again.');
  }
};
