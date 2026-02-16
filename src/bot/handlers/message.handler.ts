import { InputFile } from 'grammy';
import type { BotContext } from '../telegram.js';
import { mastra } from '../../mastra/index.js';
import { generatePieChart } from '../../utils/chart.js';
import { toTelegramMarkdown } from '../../utils/telegram-format.js';

const logger = mastra.getLogger();

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
        logger.error('Tool error', { error: result.error });

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

interface SummaryChartData {
  periodLabel: string;
  categoryBreakdown: Array<{ category: string; total: number; count: number }>;
}

/**
 * Extract summary chart data from tool results (if spending-summary was called).
 */
function extractSummaryChartData(steps: Array<{ toolResults?: unknown[] }>): SummaryChartData | null {
  for (const step of steps) {
    if (!step.toolResults) continue;
    for (const tr of step.toolResults as Array<{ payload?: { toolName?: string; result?: Record<string, unknown> } }>) {
      const { toolName, result } = tr.payload || {};
      if (toolName === 'spending-summary' && result?.success && result?.categoryBreakdown) {
        return {
          periodLabel: result.periodLabel as string,
          categoryBreakdown: result.categoryBreakdown as SummaryChartData['categoryBreakdown'],
        };
      }
    }
  }
  return null;
}

/**
 * Clean up Ollama responses that leak raw JSON tool call arguments.
 * Strips ```json ... ``` blocks that look like tool parameters.
 */
function cleanResponse(text: string): string {
  // Remove ```json blocks containing tool-like objects (userId, amount, vendor, etc.)
  const cleaned = text.replace(/```(?:json)?\s*\{[\s\S]*?\}\s*```/g, '').trim();
  // Remove trailing "```" or "``" left over from incomplete code blocks
  return cleaned.replace(/`{2,3}\s*$/, '').trim();
}

/**
 * Handle text messages
 * The agent parses, categorizes, and stores transactions via tools.
 */
export const handleTextMessage = async (ctx: BotContext): Promise<void> => {
  const message = ctx.message?.text;
  logger.debug('Received text message', { message, userId: ctx.userId });

  if (!message || !ctx.userId) {
    logger.debug('Skipping — missing message or userId');
    return;
  }

  try {
    await ctx.replyWithChatAction('typing');

    const agent = mastra.getAgent('financeAgent');

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
    logger.info('Agent responded', {
      userId: ctx.userId,
      elapsed,
      steps: response.steps?.length || 0,
      text: response.text?.substring(0, 100) || '(empty)',
    });

    let reply: string | null = response.text ? cleanResponse(response.text) || null : null;

    // Fallback: some Ollama models stop after tool calls without generating text
    if (!reply && response.steps?.length) {
      reply = extractToolReply(response.steps as Array<{ toolResults?: unknown[] }>);
      if (reply) {
        logger.debug('Using fallback reply from tool results');
      }
    }

    // Retry once if model returned empty — include explicit instruction
    if (!reply) {
      logger.warn('Empty response, retrying with explicit prompt', { userId: ctx.userId, message });
      const retry = await agent.generate([
        { role: 'user', content: `The user said: "${message}". Please respond helpfully based on conversation history.\n\nContext: userId="${ctx.userId}", today="${today}"` },
      ], {
        maxSteps: 5,
        memory: {
          thread: ctx.userId,
          resource: ctx.userId,
        },
      });
      reply = retry.text ? cleanResponse(retry.text) || null : null;
      if (!reply && retry.steps?.length) {
        reply = extractToolReply(retry.steps as Array<{ toolResults?: unknown[] }>);
      }
      if (reply) {
        logger.debug('Retry succeeded');
      }
    }

    if (reply) {
      await ctx.reply(toTelegramMarkdown(reply), { parse_mode: 'MarkdownV2' });

      // If a spending summary was generated, send a chart image
      const allSteps = [...(response.steps || [])];
      const chartData = extractSummaryChartData(allSteps as Array<{ toolResults?: unknown[] }>);
      if (chartData && chartData.categoryBreakdown.length > 0) {
        try {
          await ctx.replyWithChatAction('upload_photo');
          const chartBuffer = await generatePieChart(chartData.categoryBreakdown, chartData.periodLabel);
          await ctx.replyWithPhoto(new InputFile(chartBuffer, 'spending-summary.png'));
        } catch (chartErr) {
          logger.error('Chart generation failed', { error: chartErr });
        }
      }
    } else {
      logger.warn('Agent returned empty response', { userId: ctx.userId, message });
      await ctx.reply('Hmm, I couldn\'t process that. Could you try again?');
    }
  } catch (error) {
    logger.error('Message handler error', { error, userId: ctx.userId });
    await ctx.reply('Sorry, something went wrong processing your transaction. Please try again.');
  }
};
