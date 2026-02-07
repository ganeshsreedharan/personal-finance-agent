import { parseTransactionText } from '../tools/text-parser.tool.js';
import { categorizeTransaction } from '../tools/categorizer.tool.js';
import { storeTransaction } from '../tools/transaction-storage.tool.js';

/**
 * Transaction Processing Workflow
 * Orchestrates: Parse → Categorize → Store → Respond
 */

export interface ProcessTransactionInput {
  userId: string;
  text: string;
}

export interface ProcessTransactionOutput {
  success: boolean;
  message: string;
  transactionId?: string;
  error?: string;
}

/**
 * Process a text transaction message
 */
export const processTextTransaction = async (
  input: ProcessTransactionInput
): Promise<ProcessTransactionOutput> => {
  try {
    const { userId, text } = input;

    // Step 1: Parse text to extract transaction details
    const parseResult = await parseTransactionText(text);

    if (!parseResult.amount || !parseResult.vendor) {
      return {
        success: false,
        message: "Couldn't extract transaction details. Could you try again with amount and vendor?",
        error: 'Missing amount or vendor',
      };
    }

    // Step 2: Categorize transaction
    const categoryResult = await categorizeTransaction({
      vendor: parseResult.vendor,
      amount: parseResult.amount,
      notes: parseResult.notes || undefined,
    });

    // Step 3: Store transaction
    const storageResult = await storeTransaction({
      userId,
      date: parseResult.date || new Date().toISOString().split('T')[0],
      amount: parseResult.amount,
      currency: parseResult.currency || 'EUR',
      vendor: parseResult.vendor,
      category: categoryResult.category,
      recurring: categoryResult.recurring,
      notes: parseResult.notes || undefined,
      confidenceScore: categoryResult.confidenceScore,
      source: 'text',
    });

    if (!storageResult.success) {
      return {
        success: false,
        message: 'Failed to save transaction. Please try again.',
        error: storageResult.error,
      };
    }

    // Step 4: Format response
    const currencySymbol =
      parseResult.currency === 'USD' ? '$' : parseResult.currency === 'GBP' ? '£' : '€';
    const formattedDate = parseResult.date || new Date().toISOString().split('T')[0];

    let message = `Logged: ${currencySymbol}${parseResult.amount} — ${categoryResult.category} — ${formattedDate} ✅`;

    // Add uncertainty note if confidence is low
    if (categoryResult.confidenceScore < 0.5) {
      message += '\n(Not sure about category, you can update it)';
    }

    return {
      success: true,
      message,
      transactionId: storageResult.transactionId,
    };
  } catch (error) {
    console.error('Transaction processing workflow error:', error);
    return {
      success: false,
      message: 'Something went wrong processing your transaction. Please try again.',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
