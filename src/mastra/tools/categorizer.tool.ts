import { z } from 'zod';
import { geminiService } from '../../services/index.js';
import { CATEGORY_LIST, DEFAULT_CATEGORY, RECURRING_STATUS, type Category } from '../../config/index.js';

/**
 * Categorizer Output Schema
 */
export const CategorizerOutputSchema = z.object({
  category: z.string(),
  recurring: z.enum(['yes', 'no', 'unknown']),
  confidenceScore: z.number().min(0).max(1),
});

export type CategorizerOutput = z.infer<typeof CategorizerOutputSchema>;

/**
 * Categorize transaction using AI
 */
export const categorizeTransaction = async (params: {
  vendor: string;
  amount: number;
  notes?: string;
}): Promise<CategorizerOutput> => {
  const { vendor, amount, notes } = params;

  const schema = {
    type: 'object',
    properties: {
      category: {
        type: 'string',
        enum: CATEGORY_LIST,
        description: 'Most appropriate category for this transaction',
      },
      recurring: {
        type: 'string',
        enum: [RECURRING_STATUS.YES, RECURRING_STATUS.NO, RECURRING_STATUS.UNKNOWN],
        description: 'Whether this is a recurring expense (yes/no/unknown)',
      },
      confidenceScore: {
        type: 'number',
        minimum: 0,
        maximum: 1,
        description: 'Confidence level in the categorization (0-1)',
      },
    },
    required: ['category', 'recurring', 'confidenceScore'],
  };

  const prompt = `Categorize this transaction into ONE of these categories:

**Fixed Categories (v1 locked):**
${CATEGORY_LIST.join(', ')}

**Transaction Details:**
- Vendor: ${vendor}
- Amount: ${amount}
${notes ? `- Notes: ${notes}` : ''}

**Rules:**
1. Choose the MOST appropriate category
2. If uncertain, use "${DEFAULT_CATEGORY}"
3. Determine if this is a recurring expense (monthly bills, subscriptions, etc.)
4. Provide confidence score (0-1)
5. NEVER block the user - always return a category

**Category Guidelines:**
- Housing-Rent: Monthly rent payments
- Utilities-Electricity, Utilities-Internet: Utility bills
- Childcare-Kita: Childcare/kindergarten fees
- Transport: Public transport, gas, parking
- Investments-Scalable Capital: Investment platform transactions
- Groceries: Supermarkets (REWE, EDEKA, etc.)
- Eating Out: Restaurants, cafes, fast food
- Subscriptions: Netflix, Spotify, gym memberships
- Health: Doctor, pharmacy, insurance
- Shopping: Clothing, electronics, general shopping
- Travel: Hotels, flights, vacation expenses
- Misc: Everything else

Return JSON with: category, recurring, confidenceScore`;

  try {
    const result = await geminiService.generateJSON<CategorizerOutput>(prompt, schema);

    // Validate category is in the list
    if (!CATEGORY_LIST.includes(result.category as Category)) {
      console.warn(`Invalid category "${result.category}" returned, using default`);
      result.category = DEFAULT_CATEGORY;
      result.confidenceScore = 0.3;
    }

    return result;
  } catch (error) {
    console.error('Categorizer error:', error);
    // Fallback to default category - NEVER block the user
    return {
      category: DEFAULT_CATEGORY,
      recurring: RECURRING_STATUS.UNKNOWN,
      confidenceScore: 0.1,
    };
  }
};
