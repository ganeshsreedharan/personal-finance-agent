import { createTool } from '@mastra/core/tools';
import { SpendingSummaryInputSchema, SpendingSummaryOutputSchema } from '../../database/schema.js';

/**
 * Spending Summary Tool
 *
 * Runs the spending-summary workflow and returns the agent-generated
 * summary text along with category breakdown data (used by the handler
 * to generate charts).
 */
export const spendingSummaryTool = createTool({
  id: 'spending-summary',
  description:
    'Generate a spending summary report for a given period. Call this when the user asks for a summary, report, overview, or breakdown of their spending. Returns a formatted summary and category data.',
  inputSchema: SpendingSummaryInputSchema,
  outputSchema: SpendingSummaryOutputSchema,
  execute: async (input, { mastra }) => {
    try {
      const { userId, period } = input;

      const workflow = mastra!.getWorkflow('spendingSummaryWorkflow');
      const run = await workflow.createRun();

      const result = await run.start({
        inputData: { userId, period },
      });

      if (result.status === 'success' && result.result) {
        return {
          success: true,
          summary: result.result.summary,
          periodLabel: result.result.periodLabel,
          categoryBreakdown: result.result.categoryBreakdown,
        };
      }

      return {
        success: false,
        error: result.status === 'failed' ? 'Workflow failed' : `Unexpected status: ${result.status}`,
      };
    } catch (error) {
      mastra?.getLogger()?.error('Spending summary tool error', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});
