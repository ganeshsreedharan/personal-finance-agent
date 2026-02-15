import { createTool } from '@mastra/core/tools';
import { transactionRepository } from '../../database/index.js';
import { CheckDuplicatesInputSchema, CheckDuplicatesOutputSchema, serializeTransaction } from '../../database/schema.js';

/**
 * Transaction Duplicate Check Tool
 * Checks for potential duplicate transactions before storing.
 */
export const transactionDuplicateCheckTool = createTool({
  id: 'check-duplicates',
  description:
    'Checks if a similar transaction already exists (same vendor, similar amount ±5%, within 7 days). Call this BEFORE store-transaction to avoid duplicates.',
  inputSchema: CheckDuplicatesInputSchema,
  outputSchema: CheckDuplicatesOutputSchema,
  execute: async (input) => {
    try {
      const duplicates = await transactionRepository.findPotentialDuplicates(
        input.userId,
        input.vendor,
        input.amount,
        new Date(input.date),
      );

      return {
        hasDuplicates: duplicates.length > 0,
        duplicates: duplicates.map(serializeTransaction),
        count: duplicates.length,
      };
    } catch (error) {
      console.error('Duplicate check error:', error);
      return {
        hasDuplicates: false,
        duplicates: [],
        count: 0,
      };
    }
  },
});
