import type { BotContext } from '../telegram.js';
import { getFinanceAgent } from '../../mastra/index.js';

/**
 * Handle text messages
 * Phase 2: Process transactions with Mastra Agent + Gemini AI
 *
 * The agent uses tools to:
 * 1. Parse transaction from natural language
 * 2. Categorize the transaction
 * 3. Store in MongoDB
 */
export const handleTextMessage = async (ctx: BotContext): Promise<void> => {
  const message = ctx.message?.text;

  if (!message || !ctx.userId) {
    return;
  }

  try {
    // Show "typing..." indicator while agent thinks
    // This provides immediate feedback to the user (lasts 5 seconds)
    await ctx.replyWithChatAction('typing');

    // Get the finance agent
    const agent = getFinanceAgent();

    // Agent decides which tools to use and in what order
    // We pass both the user message and the userId in the context
    const llmStart = Date.now();
    const response = await agent.generate([
      {
        role: 'user',
        content: `${message}\n\nContext: userId="${ctx.userId}"`,
      },
    ]);
    console.log(`[LLM] Agent response took ${Date.now() - llmStart}ms`);

    // Send agent's response to user
    const reply = response.text?.trim();
    if (reply) {
      await ctx.reply(reply);
    } else {
      console.warn(`[User ${ctx.userId}] Agent returned empty response for: "${message}"`);
      await ctx.reply('Done! Your transaction has been recorded. ✅');
    }

    // Log agent execution
    console.log(`[User ${ctx.userId}] Agent processed: "${message}"`);
    console.log(`[User ${ctx.userId}] Tool calls: ${response.steps?.length || 0} steps`);

  } catch (error) {
    console.error('Error with finance agent:', error);
    await ctx.reply('Sorry, something went wrong processing your transaction. Please try again.');
  }
};
