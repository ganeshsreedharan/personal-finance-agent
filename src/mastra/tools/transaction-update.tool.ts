import { createTool } from '@mastra/core/tools';
import { transactionRepository } from '../../database/index.js';
import { UpdateTransactionInputSchema, UpdateTransactionOutputSchema, serializeTransaction } from '../../database/schema.js';

/**
 * Transaction Update Tool
 * Updates an existing transaction by ID. Only provided fields are updated.
 */
export const transactionUpdateTool = createTool({
  id: 'update-transaction',
  description:
    'Updates an existing transaction by its ID. Only the fields provided will be changed. Use query-transactions first to get the transaction ID.',
  inputSchema: UpdateTransactionInputSchema,
  outputSchema: UpdateTransactionOutputSchema,
  execute: async (input) => {
    try {
      const { transactionId, date, amount, currency, vendor, category, recurring, notes } = input;

      const updateFields: Record<string, unknown> = {};
      if (date !== undefined) updateFields.date = new Date(date);
      if (amount !== undefined) updateFields.amount = amount;
      if (currency !== undefined) updateFields.currency = currency;
      if (vendor !== undefined) updateFields.vendor = vendor;
      if (category !== undefined) updateFields.category = category;
      if (recurring !== undefined) updateFields.recurring = recurring;
      if (notes !== undefined) updateFields.notes = notes;

      if (Object.keys(updateFields).length === 0) {
        return { success: false, error: 'No fields to update' };
      }

      const updated = await transactionRepository.update(transactionId, updateFields);

      if (!updated) {
        return { success: false, error: 'Transaction not found' };
      }

      return {
        success: true,
        updated: serializeTransaction(updated),
      };
    } catch (error) {
      console.error('Transaction update error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});
