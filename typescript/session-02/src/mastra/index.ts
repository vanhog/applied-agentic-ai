import { Mastra } from '@mastra/core/mastra';
import { LibSQLStore } from '@mastra/libsql';
import { MastraStorageExporter, Observability } from '@mastra/observability';

import { persoenlicherAssistent } from './agents/persoenlicher-assistent.ts';

export const mastra = new Mastra({
  agents: { persoenlicherAssistent },
  storage: new LibSQLStore({ id: 'studio', url: 'file:./studio.db' }),
  observability: new Observability({
    configs: {
      default: {
        serviceName: 'persoenlicher-assistent',
        exporters: [new MastraStorageExporter()],
      },
    },
  }),
});
