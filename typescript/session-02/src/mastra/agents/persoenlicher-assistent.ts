// Dein pers�nlicher Assistent � Woche 02 � �bung 01: Das Modell merkt sich nichts
// Datei: src/mastra/agents/persoenlicher-assistent.ts ? ersetzt die Fassung aus der vorigen �bung.

import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';

export const persoenlicherAssistent = new Agent({
  id: 'persoenlicher-assistent',
  name: 'Persönlicher Assistent',
  instructions:
    'Du bist der persönliche Assistent von Lea und Tom. Die beiden führen ein kleines Webdesign-Studio. Antworte kurz, freundlich und auf Deutsch.',
  model: 'openai/gpt-6-luna',
  // Memory speichert jeden Chat (Thread) und schickt bei jedem Aufruf
  // die letzten 20 Nachrichten dieses Chats mit. Ein neuer Chat beginnt leer.
  memory: new Memory({
    options: {
      lastMessages: 20,
      // Merkzettel (Working Memory): eine Notiz in Markdown, die der Agent selbst pflegt.
      // Sie geh�rt zu einer Person und geht in jeden ihrer neuen Chats mit.
      workingMemory: {
        enabled: true,
        template: `# Merkzettel
- Projekte und Termine:
- Offene Punkte:
`,
      },
    },
  }),
});
