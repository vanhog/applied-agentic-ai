// Die Tools deines Assistenten · Woche 03 · Übung 01: Dateien lesen und schreiben
// Datei: src/mastra/tools/werkzeuge.ts ? ersetzt die Fassung aus der vorigen Übung.

import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// Die Tools arbeiten nur im Ordner ablage in deinem Projektordner. Mastra Studio läuft in einem Unterordner ? npm merkt sich in INIT_CWD, wo du npm run dev gestartet hast.
const FOLDER = resolve(process.env.INIT_CWD ?? process.cwd(), 'ablage');

// Ein Pfad in der Ablage ? oder null, wenn er aus der Ablage hinausführt.
function inFolder(path: string): string | null {
  const target = resolve(FOLDER, path);
  return target === FOLDER || target.startsWith(FOLDER + sep) ? target : null;
}

async function allFiles(folder: string): Promise<string[]> {
  const entries = await readdir(folder, {
    withFileTypes: true,
    recursive: true,
  });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name))
    .sort();
}

export const dateiLesen = createTool({
  id: 'datei_lesen',
  description:
    'Liest eine Textdatei aus der Ablage und gibt ihren Inhalt zurück.',
  inputSchema: z.object({
    pfad: z
      .string()
      .describe(
        'Pfad relativ zum Ordner ablage, etwa notizen/kickoff-krume.md',
      ),
  }),
  execute: async ({ pfad }) => {
    const target = inFolder(pfad);
    if (!target)
      return `Fehler: ${pfad} liegt außerhalb der Ablage. Erlaubt sind nur Dateien im Ordner ablage.`;
    if (!existsSync(target))
      return `Fehler: ${pfad} gibt es nicht. Mit dateien_auflisten siehst du, was in der Ablage liegt.`;
    return await readFile(target, 'utf8');
  },
});

// Überschreiben nur nach Freigabe: Gibt es die Datei schon, fragt Mastra Studio Lea, bevor das Tool läuft.
export const dateiSchreiben = createTool({
  id: 'datei_schreiben',
  description:
    'Schreibt eine Textdatei in die Ablage. Gibt es die Datei schon, fragt die Anwendung Lea vorher.',
  inputSchema: z.object({
    pfad: z
      .string()
      .describe(
        'Pfad relativ zum Ordner ablage, etwa notizen/kickoff-krume.md',
      ),
    inhalt: z.string().describe('Der vollständige neue Text der Datei'),
  }),
  requireApproval: async ({ pfad }) => {
    const target = inFolder(pfad);
    return target !== null && existsSync(target);
  },
  execute: async ({ pfad, inhalt }) => {
    const target = inFolder(pfad);
    if (!target)
      return `Fehler: ${pfad} liegt außerhalb der Ablage. Erlaubt sind nur Dateien im Ordner ablage.`;
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, inhalt, 'utf8');
    return `Gespeichert: ${pfad}`;
  },
});

export const dateienAuflisten = createTool({
  id: 'dateien_auflisten',
  description: 'Listet die Dateien in der Ablage auf, auch in Unterordnern.',
  inputSchema: z.object({
    ordner: z
      .string()
      .optional()
      .describe('Unterordner der Ablage, leer für alle Dateien'),
  }),
  execute: async ({ ordner }) => {
    const start = inFolder(ordner ?? '.');
    if (!start)
      return `Fehler: ${ordner} liegt außerhalb der Ablage. Erlaubt sind nur Dateien im Ordner ablage.`;
    if (!existsSync(start)) return 'Die Ablage ist leer.';
    const files = await allFiles(start);
    return files.length
      ? files.map((file) => relative(FOLDER, file)).join('\n')
      : 'Die Ablage ist leer.';
  },
});
