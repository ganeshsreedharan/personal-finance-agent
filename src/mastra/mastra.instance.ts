import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { mastraStore } from './storage.js';
import { financeAgent } from './agents/finance.agent.js';
import { spendingSummaryWorkflow } from './workflows/index.js';

export const mastra = new Mastra({
  agents: { financeAgent },
  workflows: { spendingSummaryWorkflow },
  storage: mastraStore,
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
