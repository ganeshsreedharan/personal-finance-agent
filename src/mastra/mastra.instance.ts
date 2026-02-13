import { Mastra } from '@mastra/core';
import { financeAgent } from './agents/index.js';

/**
 * Mastra instance
 * Registers agents and provides access to them throughout the application
 */
export const mastra = new Mastra({
  agents: {
    financeAgent,
  },
});

/**
 * Get the finance agent instance
 * Use this instead of importing financeAgent directly to get access to
 * Mastra's configuration (logger, telemetry, storage, etc.)
 */
export const getFinanceAgent = () => mastra.getAgent('financeAgent');
