/**
 * Application constants
 */

export const SUPPORTED_CURRENCIES = ['EUR', 'USD', 'GBP'] as const;
export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

export const DEFAULT_CURRENCY: Currency = 'EUR';

export const RECURRING_STATUS = {
  YES: 'yes',
  NO: 'no',
  UNKNOWN: 'unknown',
} as const;

export type RecurringStatus = (typeof RECURRING_STATUS)[keyof typeof RECURRING_STATUS];

export const ATTACHMENT_SOURCE = {
  PHOTO: 'photo',
  PDF: 'pdf',
  DOCUMENT: 'document',
} as const;

export type AttachmentSource = (typeof ATTACHMENT_SOURCE)[keyof typeof ATTACHMENT_SOURCE];

/**
 * Confidence score thresholds for categorization
 */
export const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.8,
  MEDIUM: 0.5,
  LOW: 0.3,
} as const;

/**
 * Duplicate detection thresholds
 */
export const DUPLICATE_DETECTION = {
  AMOUNT_TOLERANCE_PERCENT: 5, // ±5% for amount comparison
  DATE_WINDOW_DAYS: 7, // Look for duplicates within 7 days
} as const;

/**
 * File size limits (in bytes)
 */
export const FILE_LIMITS = {
  MAX_PHOTO_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_PDF_SIZE: 20 * 1024 * 1024, // 20MB
} as const;

/**
 * LLM Provider Configuration
 */
export const LLM_PROVIDER = {
  // Choose: 'gemini' or 'ollama'
  DEFAULT: (process.env.LLM_PROVIDER || 'gemini') as 'gemini' | 'ollama',
} as const;

/**
 * Gemini AI configuration (Cloud)
 */
export const GEMINI_CONFIG = {
  MODEL_NAME: 'gemini-flash-latest',
  REQUESTS_PER_MINUTE: 15,
  REQUESTS_PER_DAY: 1500,
} as const;

/**
 * Ollama configuration (Local LLM)
 */
export const OLLAMA_CONFIG = {
  BASE_URL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  MODEL_NAME: process.env.OLLAMA_MODEL || 'qwen2.5:14b-instruct', // Your current model
  // Recommended models:
  // - qwen2.5:14b-instruct (excellent quality for finance)
  // - qwen2.5:7b (good balance)
  // - llama3.2:3b (fast, good for finance)
  // - gemma2:2b (lightweight, 1.5GB RAM)
} as const;
