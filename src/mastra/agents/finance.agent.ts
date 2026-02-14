import { Agent } from '@mastra/core/agent';
import { google } from '@ai-sdk/google';
import { createOllama } from 'ollama-ai-provider-v2';
import { transactionStorageTool } from '../tools/index.js';
import { GEMINI_CONFIG, OLLAMA_CONFIG, LLM_PROVIDER, CATEGORY_LIST } from '../../config/index.js';

/**
 * Personal Finance AI Agent
 *
 * This agent uses its native LLM reasoning to:
 * 1. Parse transaction details from natural language
 * 2. Categorize transactions intelligently
 * 3. Call the store-transaction tool to save to MongoDB
 *
 * This is the proper agentic pattern: Agent does the thinking, tools do simple operations.
 *
 * Supports both (via direct AI SDK providers):
 * - Gemini (@ai-sdk/google) - cloud, ultra-cheap, fast
 * - Ollama (ollama-ai-provider) - local, private, offline
 */

// Determine which LLM to use based on environment variable
const getModelConfig = () => {
  if (LLM_PROVIDER.DEFAULT === 'ollama') {
    console.log(`🏠 Using Local LLM: ${OLLAMA_CONFIG.MODEL_NAME} via Ollama (${OLLAMA_CONFIG.BASE_URL})`);
    const ollama = createOllama({ baseURL: `${OLLAMA_CONFIG.BASE_URL}/api` });
    return ollama(OLLAMA_CONFIG.MODEL_NAME);
  } else {
    console.log(`☁️ Using Cloud LLM: ${GEMINI_CONFIG.MODEL_NAME} via Google Gemini`);
    return google(GEMINI_CONFIG.MODEL_NAME);
  }
};

export const financeAgent = new Agent({
  id: 'finance-agent',
  name: 'Personal Finance Agent',
  instructions: `You are a friendly personal finance tracker bot. Be concise, warm, and use occasional emojis.

For greetings/help: respond naturally. Do NOT call any tools.

For expenses: extract amount, vendor, category, and call the store-transaction tool. Get userId from "Context: userId=..." in the message.
- Default currency: EUR. Detect from symbols (€/$/ £).
- Default date: today (ISO format).
- If unsure about category, use "Misc".
- Set recurring: "yes" for rent/utilities/subscriptions, "no" for groceries/eating out, "unknown" if unsure.
- Set confidenceScore: 0.0-1.0 based on your certainty.

Categories: ${CATEGORY_LIST.join(', ')}

IMPORTANT — After the tool call succeeds, you MUST reply in this exact format:
"Logged: €{amount} — {category} — {date} ✅ ({fun one-liner about the expense})"
Example: "Logged: €1250 — Housing-Rent — 2026-02-14 ✅ (Rent paid! One less thing to worry about 🏠)"
Never reply with just "stored" or "done". Always use the format above.`,

  model: getModelConfig(),

  tools: {
    'store-transaction': transactionStorageTool,
  },

  // Allow up to 3 tool calls (store + potential retries)
  defaultOptions: {
    maxSteps: 3,
  },
});
