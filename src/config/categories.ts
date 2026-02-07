/**
 * Fixed expense categories (v1 locked)
 * These categories are immutable for consistency across the system
 */

export const CATEGORIES = {
  // Structural expenses (fixed/recurring)
  HOUSING_RENT: 'Housing-Rent',
  UTILITIES_ELECTRICITY: 'Utilities-Electricity',
  UTILITIES_INTERNET: 'Utilities-Internet',
  CHILDCARE_KITA: 'Childcare-Kita',
  TRANSPORT: 'Transport',
  INVESTMENTS_SCALABLE: 'Investments-Scalable Capital',

  // Daily expenses (variable)
  GROCERIES: 'Groceries',
  EATING_OUT: 'Eating Out',
  SUBSCRIPTIONS: 'Subscriptions',
  HEALTH: 'Health',
  SHOPPING: 'Shopping',
  TRAVEL: 'Travel',
  MISC: 'Misc',
} as const;

export const CATEGORY_LIST = Object.values(CATEGORIES);

export type Category = (typeof CATEGORIES)[keyof typeof CATEGORIES];

/**
 * Category metadata for better UX and analytics
 */
export const CATEGORY_METADATA: Record<
  Category,
  {
    type: 'structural' | 'daily';
    recurring: boolean;
    excludeFromSummary?: boolean;
  }
> = {
  [CATEGORIES.HOUSING_RENT]: { type: 'structural', recurring: true },
  [CATEGORIES.UTILITIES_ELECTRICITY]: { type: 'structural', recurring: true },
  [CATEGORIES.UTILITIES_INTERNET]: { type: 'structural', recurring: true },
  [CATEGORIES.CHILDCARE_KITA]: { type: 'structural', recurring: true },
  [CATEGORIES.TRANSPORT]: { type: 'structural', recurring: false },
  [CATEGORIES.INVESTMENTS_SCALABLE]: {
    type: 'structural',
    recurring: true,
    excludeFromSummary: true,
  },
  [CATEGORIES.GROCERIES]: { type: 'daily', recurring: false },
  [CATEGORIES.EATING_OUT]: { type: 'daily', recurring: false },
  [CATEGORIES.SUBSCRIPTIONS]: { type: 'daily', recurring: true },
  [CATEGORIES.HEALTH]: { type: 'daily', recurring: false },
  [CATEGORIES.SHOPPING]: { type: 'daily', recurring: false },
  [CATEGORIES.TRAVEL]: { type: 'daily', recurring: false },
  [CATEGORIES.MISC]: { type: 'daily', recurring: false },
};

/**
 * Default category when uncertain
 */
export const DEFAULT_CATEGORY = CATEGORIES.MISC;
