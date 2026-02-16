import { InputFile } from 'grammy';
import type { BotContext } from '../telegram.js';
import { mastra } from '../../mastra/index.js';
import { generatePieChart, generateBarChart } from '../../utils/chart.js';
import { toTelegramMarkdown } from '../../utils/telegram-format.js';

/**
 * Handle /summary command
 *
 * Usage:
 *   /summary         — current month summary with pie chart
 *   /summary week    — last 7 days
 *   /summary month   — current month (default)
 *   /summary bar     — use bar chart instead of pie
 */
const logger = mastra.getLogger();

export const handleSummary = async (ctx: BotContext): Promise<void> => {

  if (!ctx.userId) {
    await ctx.reply('Please start with /start first.');
    return;
  }

  try {
    await ctx.replyWithChatAction('typing');

    // Parse arguments: /summary [week|month] [pie|bar]
    const text = ctx.message?.text || '';
    const args = text.split(/\s+/).slice(1).map(a => a.toLowerCase());

    const period: 'week' | 'month' = args.includes('week') ? 'week' : 'month';
    const chartType: 'pie' | 'bar' = args.includes('bar') ? 'bar' : 'pie';

    const workflow = mastra.getWorkflow('spendingSummaryWorkflow');
    const run = await workflow.createRun();

    const result = await run.start({
      inputData: {
        userId: ctx.userId,
        period,
      },
    });

    if (result.status === 'success' && result.result) {
      const { summary, periodLabel, categoryBreakdown } = result.result;

      // Send text summary first
      await ctx.reply(toTelegramMarkdown(summary), { parse_mode: 'MarkdownV2' });

      // Generate and send chart if there's data
      if (categoryBreakdown.length > 0) {
        await ctx.replyWithChatAction('upload_photo');

        const chartBuffer = chartType === 'bar'
          ? await generateBarChart(categoryBreakdown, periodLabel)
          : await generatePieChart(categoryBreakdown, periodLabel);

        await ctx.replyWithPhoto(new InputFile(chartBuffer, 'spending-summary.png'));
      }
    } else if (result.status === 'failed') {
      logger.error('Summary workflow failed', { error: result.error });
      await ctx.reply('Sorry, I couldn\'t generate the summary. Please try again.');
    } else {
      await ctx.reply('Sorry, something went wrong generating your summary.');
    }

    logger.info('Summary workflow completed', {
      userId: ctx.userId,
      period,
      chartType,
      status: result.status,
    });
  } catch (error) {
    logger.error('Summary handler error', { error, userId: ctx.userId });
    await ctx.reply('Sorry, something went wrong generating your summary. Please try again.');
  }
};
