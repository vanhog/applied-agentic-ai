// Dein persönlicher Assistent · Woche 02 · Übung 05: Merkzettel statt Verlauf
// Datei: src/mastra/agents/persoenlicher-assistent.ts ? ersetzt die Fassung aus der vorigen Übung.

import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { z } from 'zod';

// Merkzettel als Schema: einzelne Einträge, jeder mit Quelle.
// Der Assistent schickt nur, was sich ändert ? Mastra führt es mit dem Rest zusammen.
// null entfernt einen Eintrag. Gleiche Schlüssel (etwa ?golive?) ändern denselben Eintrag.
const eintrag = z
  .object({
    text: z.string(),
    quelle: z
      .string()
      .describe('Wer, in welcher Nachricht ? etwa ?Tom, Nr. 10?'),
  })
  .nullable();
const eintraege = z.record(z.string(), eintrag).optional();
const merkzettel = z.object({
  ziel: z.string().optional(),
  entscheidungen: eintraege,
  fakten: eintraege,
  offen: eintraege,
});

export const persoenlicherAssistent = new Agent({
  id: 'persoenlicher-assistent',
  name: 'Persönlicher Assistent',
  instructions: `Du bist der persönliche Assistent von Lea und Tom im Projekt-Chat zum Relaunch Krume. Antworte kurz und konkret.

Führ den Merkzettel:
- Trag nur ein, was für das Projekt zählt: Ziel, Entscheidungen, Fakten, offene Punkte. Smalltalk bleibt draußen.
- Ändere nur die Einträge, die sich ändern, und nenne zu jedem die Quelle: wer, in welcher Nachricht.
- Ändert sich das Ziel, frag nach, bevor du es änderst. Bis dahin gilt der bisherige Plan.`,
  model: 'openai/gpt-6-luna',
  memory: new Memory({
    options: {
      // Statt des ganzen Verlaufs: nur die letzten zwei Runden (vier Nachrichten) im Wortlaut.
      lastMessages: 4,
      // Working Memory pro Chat (scope: thread). Mit Schema werden Änderungen zusammengeführt.
      workingMemory: {
        enabled: true,
        scope: 'thread',
        schema: merkzettel,
      },
    },
  }),
});

// In Mastra Studio: Schreib ein paar Nachrichten zum Projekt und öffne links unten ?Memory?.
// Unter ?Working Memory? siehst du, wie sich der Merkzettel nach jeder Nachricht ändert.
