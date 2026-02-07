import type { BotContext } from '../telegram.js';

/**
 * Handle photo messages (receipts)
 * Phase 3: Will integrate with Gemini vision for OCR
 */
export const handlePhoto = async (ctx: BotContext): Promise<void> => {
  try {
    await ctx.reply(
      '📸 Photo received!\n\n' +
        '**Status:** Phase 3 feature\n' +
        '**Coming soon:** Automatic receipt extraction with Gemini Vision\n\n' +
        'For now, please send transactions as text.'
    );

    console.log(`[User ${ctx.userId}] Received photo - Phase 3 feature`);
  } catch (error) {
    console.error('Error handling photo:', error);
    await ctx.reply('Sorry, something went wrong processing the photo.');
  }
};
