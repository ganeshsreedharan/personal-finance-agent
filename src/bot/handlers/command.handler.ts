import type { BotContext } from '../telegram.js';

/**
 * Handle /start command
 */
export const handleStartCommand = async (ctx: BotContext): Promise<void> => {
  const firstName = ctx.from?.first_name || 'there';
  const telegramId = ctx.from?.id;

  const welcomeMessage = `👋 Welcome ${firstName}!

I'm your Personal Finance AI Agent. I help you track expenses automatically.

**How to use:**
• Send me a text message: "Rent 1250€ paid"
• Send a receipt photo
• Send an invoice PDF

I'll automatically extract, categorize, and store your transactions.

**Commands:**
/help - Show this help message
/summary - Get weekly summary (coming soon)
/monthly - Get monthly summary (coming soon)

**Current Phase:** Phase 1 - Foundation
**Status:** Text messages working ✅

${telegramId ? `**Your Telegram ID:** \`${telegramId}\`\n` : ''}Let's start tracking! Send me your first expense.`;

  await ctx.reply(welcomeMessage);
};

/**
 * Handle /help command
 */
export const handleHelpCommand = async (ctx: BotContext): Promise<void> => {
  const helpMessage = `📚 **Help & Commands**

**Basic Usage:**
Just send me any expense message:
• "Groceries 45.50€ at REWE"
• "Rent 1250€ paid"
• "Coffee 3.80"

**Commands:**
/start - Welcome message
/help - This help message
/summary - Weekly summary (Phase 4)
/monthly - Monthly summary (Phase 4)

**File Support (Phase 3):**
• 📸 Photos - Receipt images
• 📄 PDFs - Invoice documents

**Categories:**
Housing-Rent, Utilities-Electricity, Utilities-Internet, Childcare-Kita, Transport, Investments-Scalable Capital, Groceries, Eating Out, Subscriptions, Health, Shopping, Travel, Misc

**Need help?** Just ask!`;

  await ctx.reply(helpMessage);
};

/**
 * Handle /summary command (placeholder)
 */
export const handleSummaryCommand = async (ctx: BotContext): Promise<void> => {
  await ctx.reply('📊 Weekly summaries coming in Phase 4! Stay tuned.');
};

/**
 * Handle /monthly command (placeholder)
 */
export const handleMonthlyCommand = async (ctx: BotContext): Promise<void> => {
  await ctx.reply('📊 Monthly summaries coming in Phase 4! Stay tuned.');
};
