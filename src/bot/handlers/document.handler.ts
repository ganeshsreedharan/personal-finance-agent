import type { BotContext } from '../telegram.js';

/**
 * Handle document messages (PDFs, invoices)
 * Phase 3: Will integrate with Gemini native PDF support
 */
export const handleDocument = async (ctx: BotContext): Promise<void> => {
  const document = ctx.message?.document;

  if (!document) {
    return;
  }

  try {
    const isPDF = document.mime_type === 'application/pdf';
    const fileSize = (document.file_size || 0) / 1024 / 1024; // MB

    if (isPDF) {
      await ctx.reply(
        '📄 PDF received!\n\n' +
          `**File:** ${document.file_name}\n` +
          `**Size:** ${fileSize.toFixed(2)} MB\n\n` +
          '**Status:** Phase 3 feature\n' +
          '**Coming soon:** Automatic invoice extraction with Gemini native PDF support\n\n' +
          'For now, please send transactions as text.'
      );
    } else {
      await ctx.reply(
        `Unsupported document type: ${document.mime_type}\n\n` +
          'Please send PDF invoices or receipt photos.'
      );
    }

    console.log(
      `[User ${ctx.userId}] Received document: ${document.file_name} (${document.mime_type})`
    );
  } catch (error) {
    console.error('Error handling document:', error);
    await ctx.reply('Sorry, something went wrong processing the document.');
  }
};
