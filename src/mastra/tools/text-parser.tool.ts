import { z } from 'zod';
import { geminiService } from '../../services/index.js';
import { SUPPORTED_CURRENCIES } from '../../config/index.js';

/**
 * Text Parser Output Schema
 */
export const TextParserOutputSchema = z.object({
  amount: z.number().nullable(),
  vendor: z.string().nullable(),
  date: z.string().nullable(),
  currency: z.enum(SUPPORTED_CURRENCIES).nullable(),
  notes: z.string().nullable(),
});

export type TextParserOutput = z.infer<typeof TextParserOutputSchema>;

/**
 * Parse transaction from natural language text
 */
export const parseTransactionText = async (text: string): Promise<TextParserOutput> => {
  const schema = {
    type: 'object',
    properties: {
      amount: {
        type: 'number',
        description: 'Transaction amount as a number',
        nullable: true,
      },
      vendor: {
        type: 'string',
        description: 'Vendor or merchant name',
        nullable: true,
      },
      date: {
        type: 'string',
        description: 'Transaction date in ISO format (YYYY-MM-DD)',
        nullable: true,
      },
      currency: {
        type: 'string',
        enum: ['EUR', 'USD', 'GBP'],
        description: 'Currency code',
        nullable: true,
      },
      notes: {
        type: 'string',
        description: 'Additional notes or context',
        nullable: true,
      },
    },
    required: ['amount', 'vendor', 'date', 'currency', 'notes'],
  };

  const prompt = `Extract transaction details from this message: "${text}"

Rules:
- If no date is mentioned, use today's date
- If no currency symbol, assume EUR
- Extract vendor name (e.g., "REWE", "Starbucks", "Rent")
- Return null for fields that cannot be determined
- Common currency symbols: € (EUR), $ (USD), £ (GBP)

Return JSON with: amount, vendor, date (ISO format), currency, notes`;

  try {
    const result = await geminiService.generateJSON<TextParserOutput>(prompt, schema);

    // Default to today if no date provided
    if (!result.date) {
      result.date = new Date().toISOString().split('T')[0];
    }

    // Default to EUR if no currency provided
    if (!result.currency) {
      result.currency = 'EUR';
    }

    return result;
  } catch (error) {
    console.error('Text parser error:', error);
    throw new Error('Failed to parse transaction text');
  }
};
