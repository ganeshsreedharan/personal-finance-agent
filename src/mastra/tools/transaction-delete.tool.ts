import { createTool } from '@mastra/core/tools';
import { transactionRepository } from '../../database/index.js';
import { DeleteTransactionInputSchema, DeleteTransactionOutputSchema } from '../../database/schema.js';

/**
 * Transaction Delete Tool
 * Deletes a transaction by ID.
 */
export const transactionDeleteTool = createTool({
  id: 'delete-transaction',
  description:
    'Deletes a transaction by its ID. Use query-transactions first to find and confirm the transaction before deleting.',
  inputSchema: DeleteTransactionInputSchema,
  outputSchema: DeleteTransactionOutputSchema,
  execute: async (input) => {
    try {
      const deleted = await transactionRepository.delete(input.transactionId);

      if (!deleted) {
        return { success: false, error: 'Transaction not found' };
      }

      return { success: true };
    } catch (error) {
      console.error('Transaction delete error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});
