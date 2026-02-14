import type { BotContext, MediaFile } from '../telegram.js';
import { env, LLM_PROVIDER } from '../../config/index.js';

/**
 * Media middleware — runs before media handlers.
 * 1. Checks if the current model supports multimodal input (short-circuits for Ollama)
 * 2. Downloads the file from Telegram and attaches it to ctx.mediaFile
 */
export const mediaMiddleware = async (ctx: BotContext, next: () => Promise<void>): Promise<void> => {
  const msg = ctx.message;
  const hasMedia = msg?.photo || msg?.voice || msg?.audio || msg?.document;

  if (!hasMedia) {
    await next();
    return;
  }

  // Local models don't support multimodal input — respond immediately
  if (LLM_PROVIDER.DEFAULT === 'ollama') {
    await ctx.reply(
      'Media processing is not supported with the local model.\n\n' +
        'Please send your transaction as text instead (e.g., "Groceries 45€ at REWE").'
    );
    return;
  }

  // Determine file ID, mime type, and media type
  let fileId: string;
  let mimeType: string;
  let type: MediaFile['type'];
  let fileName: string | undefined;

  if (msg.photo?.length) {
    const photo = msg.photo[msg.photo.length - 1];
    fileId = photo.file_id;
    mimeType = 'image/jpeg';
    type = 'photo';
  } else if (msg.voice) {
    fileId = msg.voice.file_id;
    mimeType = msg.voice.mime_type || 'audio/ogg';
    type = 'voice';
  } else if (msg.audio) {
    fileId = msg.audio.file_id;
    mimeType = msg.audio.mime_type || 'audio/mpeg';
    type = 'audio';
  } else if (msg.document) {
    fileId = msg.document.file_id;
    mimeType = msg.document.mime_type || 'application/octet-stream';
    type = 'document';
    fileName = msg.document.file_name;
  } else {
    await next();
    return;
  }

  // Download the file from Telegram
  const file = await ctx.api.getFile(fileId);
  const fileUrl = `https://api.telegram.org/file/bot${env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;
  const response = await fetch(fileUrl);
  const buffer = Buffer.from(await response.arrayBuffer());

  ctx.mediaFile = { buffer, mimeType, type, fileName };
  await next();
};
