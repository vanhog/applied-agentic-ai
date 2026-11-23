// Dein persönlicher Assistent · Woche 02 · Übung 08: Quelle statt Meinung
// Datei: src/mastra/workflows/reflexion.ts ? ersetzt die Fassung aus der vorigen Übung.

import { Agent } from '@mastra/core/agent';
import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';

// Was der Schreiber über das Projekt und den Ton des Studios weiß.
const projektstand = `Projekt: Relaunch Krume (neue Website mit Vorbestellung)
Kundin: Marta Krume, Inhaberin der Bäckerei Krume
Stand am 26.10.:
- Startseite, Sortiment und Vorbestellung sind fertig und getestet.
- Die Produktfotos aus dem Shooting kommen erst am Montag, 16.11.
- Einbau und Test der Fotos brauchen drei Arbeitstage.
Go-live: geplant Freitag, 13.11. ? neu Freitag, 20.11.
Nächster Schritt: Kundin über die Verschiebung informieren.`;
const studioTon = `So schreibt das Studio:
- Wir siezen Kund:innen und sprechen sie mit Namen an.
- Kurze Sätze, freundlich und konkret. Kein Werbedeutsch, keine Floskeln.
- Schlechte Nachrichten sagen wir früh und offen ? mit Grund und nächstem Schritt.
- Interna aus dem Team gehören nie in eine Kundenmail.
- Unterschrift: ?Viele Grüße, Lea vom Studio?`;

// Der Schreiber entwirft und überarbeitet.
const schreiber = new Agent({
  id: 'schreiber',
  name: 'Schreiber',
  instructions: `Du bist der persönliche Assistent von Lea und Tom. Die beiden führen ein kleines Webdesign-Studio.\n\n${studioTon}\n\n## Projektstand\n\n${projektstand}`,
  model: 'openai/gpt-6-luna',
});

// Der Prüfer kennt nur die Quelle. Was dort nicht steht, gilt als nicht belegt.
const pruefer = new Agent({
  id: 'pruefer',
  name: 'Prüfer',
  instructions:
    'Du prüfst Behauptungen gegen eine Quelle. Was nicht in der Quelle steht, gilt als nicht belegt. Nenne die Stelle als Beleg.',
  model: 'openai/gpt-6-luna',
});

// Die Mail, zerlegt in einzelne Behauptungen ? und ob sie sich an Projektdaten prüfen lassen.
const behauptungenSchema = z.object({
  behauptungen: z.array(z.object({ text: z.string(), pruefbar: z.boolean() })),
});
const befund = z.object({ stimmt: z.boolean(), beleg: z.string() });
const befundeSchema = z.array(
  z.object({ behauptung: z.string(), stimmt: z.boolean(), beleg: z.string() }),
);

// 2. Entwurf
const entwurf = createStep({
  id: 'entwurf',
  inputSchema: z.object({ auftrag: z.string() }),
  outputSchema: z.object({ mail: z.string() }),
  execute: async ({ inputData }) => {
    const antwort = await schreiber.generate(inputData.auftrag);
    return { mail: antwort.text };
  },
});

// 3. Behauptungen finden
const behauptungenFinden = createStep({
  id: 'behauptungen-finden',
  inputSchema: z.object({ mail: z.string() }),
  outputSchema: z.object({
    mail: z.string(),
    behauptungen: behauptungenSchema.shape.behauptungen,
  }),
  execute: async ({ inputData }) => {
    const antwort = await pruefer.generate(
      `Zerlege diese Mail in einzelne Behauptungen. Markiere, ob sich eine Behauptung an Projektdaten prüfen lässt (Termine, Zahlen, Stand) oder nicht (Zusagen, Ton).\n\n<mail>\n${inputData.mail}\n</mail>`,
      {
        structuredOutput: { schema: behauptungenSchema },
      },
    );
    return { mail: inputData.mail, behauptungen: antwort.object.behauptungen };
  },
});

// 4. Prüfen ? jede Behauptung einzeln und gegen die Quelle, ohne die Mail zu sehen
const pruefen = createStep({
  id: 'pruefen',
  inputSchema: z.object({
    mail: z.string(),
    behauptungen: behauptungenSchema.shape.behauptungen,
  }),
  outputSchema: z.object({ mail: z.string(), befunde: befundeSchema }),
  execute: async ({ inputData }) => {
    const pruefbar = inputData.behauptungen.filter((item) => item.pruefbar);
    const befunde = await Promise.all(
      pruefbar.map(async (item) => {
        const antwort = await pruefer.generate(
          `<quelle>\n${projektstand}\n</quelle>\n\nStimmt diese Behauptung laut Quelle?\n\n<behauptung>${item.text}</behauptung>`,
          { structuredOutput: { schema: befund } },
        );
        return { behauptung: item.text, ...antwort.object };
      }),
    );
    return { mail: inputData.mail, befunde };
  },
});

// 4. Überarbeitung ? nur die Punkte, die nicht erfüllt sind
const ueberarbeitung = createStep({
  id: 'ueberarbeitung',
  inputSchema: z.object({ mail: z.string(), befunde: befundeSchema }),
  outputSchema: z.object({ mail: z.string() }),
  execute: async ({ inputData }) => {
    const fehler = inputData.befunde.filter((item) => !item.stimmt);
    if (fehler.length === 0) return { mail: inputData.mail };
    const liste = fehler
      .map((item) => `- ${item.behauptung} ? ${item.beleg}`)
      .join('\n');
    const antwort = await schreiber.generate(
      `Korrigiere diese Fehler anhand der Belege und lass alles andere stehen:\n${liste}\n\n<mail>\n${inputData.mail}\n</mail>`,
    );
    return { mail: antwort.text };
  },
});

// Die Schritte nacheinander ? Mastra Studio zeigt sie als Graph.
export const reflexion = createWorkflow({
  id: 'feedback-von-aussen',
  inputSchema: z.object({ auftrag: z.string() }),
  outputSchema: z.object({ mail: z.string() }),
})
  .then(entwurf)
  .then(behauptungenFinden)
  .then(pruefen)
  .then(ueberarbeitung)
  .commit();

// In Mastra Studio: ?Workflows? öffnen, den Workflow wählen, einen Auftrag eintragen und starten.
// Klick danach auf die einzelnen Schritte: Dort siehst du, was jeder bekommen und geliefert hat.
