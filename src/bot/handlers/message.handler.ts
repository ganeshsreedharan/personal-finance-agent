import type { BotContext } from '../telegram.js';
import { mastra } from '../../mastra/index.js';

/**
 * Extract a fallback reply from tool results when the LLM doesn't generate text.
 * This happens with some Ollama models that stop after tool calls.
 */
function extractToolReply(steps: Array<{ toolResults?: unknown[] }>): string | null {
  for (const step of steps) {
    if (!step.toolResults) continue;
    for (const tr of step.toolResults as Array<{ payload?: { toolName?: string; result?: Record<string, unknown> } }>) {
      const { toolName, result } = tr.payload || {};
      if (!result) continue;

      if (toolName === 'store-transaction' && result.success) {
        return `Logged your expense ✅`;
      }
      if (toolName === 'query-transactions' && result.success) {
        const txns = result.transactions as Array<{ amount: number; currency: string; vendor: string; category: string; date: string }>;
        if (!txns?.length) return 'No transactions found.';
        const lines = txns.map((t, i) => `${i + 1}. €${t.amount} — ${t.vendor} — ${t.category} — ${t.date}`);
        return lines.join('\n');
      }
      if (toolName === 'update-transaction' && result.success) {
        return 'Transaction updated ✏️';
      }
      if (toolName === 'delete-transaction' && result.success) {
        return 'Transaction deleted 🗑️';
      }
      if (result.error) {
        console.error(`[Handler] Tool error:`, result.error);

        // Handle Zod validation errors (array of issues)
        const errors = Array.isArray(result.error) ? result.error : null;
        if (errors) {
          const fields = errors.map((e: { path?: string[]; message?: string }) =>
            `**${e.path?.join('.') || 'field'}**: ${e.message || 'invalid'}`
          );
          return `I'm missing some info:\n${fields.join('\n')}\nPlease provide the details and try again.`;
        }

        // Plain string error
        if (typeof result.error === 'string') {
          return `Something went wrong: ${result.error}`;
        }

        return 'Something went wrong while saving. Please try again with all details.';
      }
    }
  }
  return null;
}

/**
 * Handle text messages
 * The agent parses, categorizes, and stores transactions via tools.
 */
export const handleTextMessage = async (ctx: BotContext): Promise<void> => {
  const message = ctx.message?.text;
  console.log(`[Handler] Received text message: "${message}" from userId: ${ctx.userId}`);

  if (!message || !ctx.userId) {
    console.log(`[Handler] Skipping — missing message or userId`);
    return;
  }

  try {
    await ctx.replyWithChatAction('typing');
    console.log(`[Handler] Calling agent.generate()...`);

    const agent = mastra.getAgent('financeAgent');
    const logger = mastra.getLogger();

    const today = new Date().toISOString().split('T')[0];
    const userContent = `${message}\n\nContext: userId="${ctx.userId}", today="${today}"`;

    const llmStart = Date.now();
    const response = await agent.generate([
      { role: 'user', content: userContent },
    ], {
      maxSteps: 5,
      memory: {
        thread: ctx.userId,
        resource: ctx.userId,
      },
    });
    const elapsed = Date.now() - llmStart;
    console.log(`[Handler] Agent responded in ${elapsed}ms`);
    console.log(`[Handler] Steps: ${response.steps?.length || 0}, text: "${response.text?.substring(0, 100) || '(empty)'}"`);

    let reply: string | null = response.text?.trim() || null;

    // Fallback: some Ollama models stop after tool calls without generating text
    if (!reply && response.steps?.length) {
      reply = extractToolReply(response.steps as Array<{ toolResults?: unknown[] }>);
      if (reply) {
        console.log(`[Handler] Using fallback reply from tool results`);
      }
    }

    // Retry once if model returned empty — include explicit instruction
    if (!reply) {
      console.log(`[Handler] Empty response, retrying with explicit prompt...`);
      const retry = await agent.generate([
        { role: 'user', content: `The user said: "${message}". Please respond helpfully based on conversation history.\n\nContext: userId="${ctx.userId}", today="${today}"` },
      ], {
        maxSteps: 5,
        memory: {
          thread: ctx.userId,
          resource: ctx.userId,
        },
      });
      reply = retry.text?.trim() || null;
      if (!reply && retry.steps?.length) {
        reply = extractToolReply(retry.steps as Array<{ toolResults?: unknown[] }>);
      }
      if (reply) {
        console.log(`[Handler] Retry succeeded`);
      }
    }

    if (reply) {
      await ctx.reply(reply);
    } else {
      logger.warn(`Agent returned empty response`, { userId: ctx.userId, message });
      await ctx.reply('Hmm, I couldn\'t process that. Could you try again?');
    }

    logger.info(`Agent processed message`, {
      userId: ctx.userId,
      message,
      steps: response.steps?.length || 0,
    });
  } catch (error) {
    console.error(`[Handler] ERROR:`, error);
    await ctx.reply('Sorry, something went wrong processing your transaction. Please try again.');
  }
};
