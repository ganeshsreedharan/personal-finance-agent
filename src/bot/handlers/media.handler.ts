import type { BotContext } from '../telegram.js';
import { mastra } from '../../mastra/index.js';
import { toTelegramMarkdown } from '../../utils/telegram-format.js';

const logger = mastra.getLogger();

/**
 * Handle all media messages (photos, voice, audio, documents).
 * Expects ctx.mediaFile to be populated by media middleware.
 */
export const handleMedia = async (ctx: BotContext): Promise<void> => {
  const media = ctx.mediaFile;
  if (!media || !ctx.userId) return;

  try {
    await ctx.replyWithChatAction('typing');

    const filePart =
      media.type === 'photo'
        ? { type: 'image' as const, image: media.buffer }
        : { type: 'file' as const, data: media.buffer, mimeType: media.mimeType };

    const prompts: Record<string, string> = {
      photo: 'Extract the transaction details from this receipt/invoice photo.',
      voice: 'Listen to this audio message and extract any transaction details mentioned.',
      audio: 'Listen to this audio and extract any transaction details mentioned.',
      document: `Extract transaction details from this document (${media.fileName || 'unknown'}).`,
    };

    const agent = mastra.getAgent('financeAgent');
    const today = new Date().toISOString().split('T')[0];
    const result = await agent.generate([
      {
        role: 'user',
        content: [
          filePart,
          {
            type: 'text',
            text: `${prompts[media.type]}\n\nContext: userId="${ctx.userId}", today="${today}"`,
          },
        ],
      },
    ], {
      memory: {
        thread: ctx.userId,
        resource: ctx.userId,
      },
    });

    const replyText = result.text || 'Processed but no details could be extracted. Try sending as text instead.';
    await ctx.reply(toTelegramMarkdown(replyText), { parse_mode: 'MarkdownV2' });
    logger.info(`Agent processed ${media.type}`, { userId: ctx.userId, mimeType: media.mimeType });
  } catch (error) {
    logger.error(`Error processing ${media.type}`, { error });
    await ctx.reply(
      `Sorry, I couldn't process this ${media.type}. The model may not support this input type.\n\n` +
        'Please send your transaction as text instead (e.g., "Groceries 45€ at REWE").'
    );
  }
};
