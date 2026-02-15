import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { mastraStore } from './storage.js';
import { financeAgent } from './agents/finance.agent.js';

export const mastra = new Mastra({
  agents: { financeAgent },
  storage: mastraStore,
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
