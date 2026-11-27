// Dein persönlicher Assistent · Woche 03 · Übung 01: Dateien lesen und schreiben
// Datei: src/mastra/agents/persoenlicher-assistent.ts ? ersetzt die Fassung aus der vorigen Übung.

import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";

import {
  dateiLesen,
  dateiSchreiben,
  dateienAuflisten,
} from "../tools/werkzeuge";

export const persoenlicherAssistent = new Agent({
  id: "persoenlicher-assistent",
  name: "Persönlicher Assistent",
  instructions: `Du bist der persönliche Assistent von Lea und Tom. Die beiden führen ein kleines Webdesign-Studio. Antworte kurz, freundlich und auf Deutsch.

Du hast Werkzeuge. Nutze sie, wenn eine Frage es braucht, und sag dazu, woher deine Antwort stammt.`,
  model: "openai/gpt-6-luna",
  // Das Gedächtnis aus Woche 2: der Verlauf und Leas Merkzettel.
  memory: new Memory({
    options: {
      lastMessages: 20,
      workingMemory: {
        enabled: true,
        template: `# Merkzettel
- Projekte und Termine:
- Offene Punkte:
`,
      },
    },
  }),
  // Die Tools ? das Modell sieht ihre Namen und Beschreibungen und bittet um einen Aufruf, Mastra führt ihn aus.
  tools: {
    datei_lesen: dateiLesen,
    datei_schreiben: dateiSchreiben,
    dateien_auflisten: dateienAuflisten,
  },
});
