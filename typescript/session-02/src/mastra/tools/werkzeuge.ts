// Die Tools deines Assistenten · Woche 03 · Übung 02: Dateien durchsuchen
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

// Höchstens 20 Treffer ? gibt es mehr, sagt ein Hinweis, wie das Modell genauer suchen kann.
export const dateienDurchsuchen = createTool({
  id: 'dateien_durchsuchen',
  description:
    'Durchsucht alle Textdateien der Ablage und gibt jeden Treffer als Datei:Zeile: Textstelle zurück.',
  inputSchema: z.object({
    suchbegriff: z
      .string()
      .describe('Wort oder Satzteil, nach dem gesucht wird'),
  }),
  execute: async ({ suchbegriff }) => {
    const hits: string[] = [];
    for (const file of existsSync(FOLDER) ? await allFiles(FOLDER) : []) {
      if (!/\.(md|txt|csv|json)$/i.test(file)) continue;
      const lines = (await readFile(file, 'utf8')).split('\n');
      lines.forEach((line, index) => {
        if (line.toLowerCase().includes(suchbegriff.toLowerCase()))
          hits.push(`${relative(FOLDER, file)}:${index + 1}: ${line.trim()}`);
      });
    }
    if (hits.length === 0)
      return `Keine Treffer für ?${suchbegriff}?. Versuch ein anderes Wort.`;
    const shown = hits.slice(0, 20).join('\n');
    return hits.length > 20
      ? `${shown}\n${hits.length - 20} weitere Treffer. Such genauer, etwa mit einem zweiten Begriff.`
      : shown;
  },
});
