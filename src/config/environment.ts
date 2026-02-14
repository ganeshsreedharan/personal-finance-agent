import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load environment-specific .env file
const nodeEnv = process.env.NODE_ENV || 'development';
const envFile = `.env.${nodeEnv}`;
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

// Environment variable schema with validation
const envSchema = z.object({
  // Telegram
  TELEGRAM_BOT_TOKEN: z.string().min(1, 'Telegram bot token is required'),
  ALLOWED_USER_IDS: z
    .string()
    .optional()
    .default('')
    .transform(val => {
      if (!val || val.trim() === '') {
        return [];
      }
      return val.split(',').map(id => parseInt(id.trim(), 10));
    }),

  // Google Gemini AI (@ai-sdk/google reads this automatically)
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1, 'Google Generative AI API key is required'),

  // MongoDB
  MONGODB_URI: z.url('MongoDB URI must be a valid URL'),
  MONGODB_DATABASE: z.string().default('finance-agent'),

  // Storage
  STORAGE_TYPE: z.enum(['gridfs', 'local']).default('gridfs'),

  // Scheduler
  ENABLE_SCHEDULER: z
    .string()
    .default('false')
    .transform(val => val === 'true'),
  WEEKLY_SUMMARY_CRON: z.string().default('0 9 * * 1'),
  MONTHLY_SUMMARY_CRON: z.string().default('0 9 1 * *'),

  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// Parse and validate environment variables
const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map((err: z.core.$ZodIssue) => `${err.path.join('.')}: ${err.message}`);
      throw new Error(
        `Environment validation failed:\n${missingVars.join('\n')}\n\nPlease check your ${envFile} file.`
      );
    }
    throw error;
  }
};

// Export validated environment variables
export const env = parseEnv();

// Type-safe environment access
export type Environment = z.infer<typeof envSchema>;
