import telegramifyMarkdown from 'telegramify-markdown';

/**
 * Convert LLM Markdown output to Telegram MarkdownV2 format.
 * Uses telegramify-markdown for proper escaping and conversion.
 */
export function toTelegramMarkdown(text: string): string {
  return telegramifyMarkdown(text, 'escape');
}
