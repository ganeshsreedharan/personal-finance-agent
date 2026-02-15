import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { MongoDBStore } from '@mastra/mongodb';
import { Observability, DefaultExporter, SensitiveDataFilter } from '@mastra/observability';
import { financeAgent } from './agents/finance.agent.js';
import { env } from '../config/index.js';

export const mastra = new Mastra({
  agents: { financeAgent },
  storage: new MongoDBStore({
    id: 'mastra-storage',
    uri: env.MONGODB_URI,
    dbName: env.MASTRA_DATABASE,
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
  observability: new Observability({
    configs: {
      default: {
        serviceName: 'personal-finance-agent',
        exporters: [new DefaultExporter()],
        spanOutputProcessors: [new SensitiveDataFilter()],
      },
    },
  }),
});
