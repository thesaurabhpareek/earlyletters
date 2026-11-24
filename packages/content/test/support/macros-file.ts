/**
 * Reads `docs/support/macros.md`: each macro's words (a fenced block with the info string `macro <key>`), its notes
 * (the `- Label: text` lines under its heading) and the "Who receives what" table. Shared by support-macros.test.ts
 * and trust-and-safety-gate.test.ts (BL-1335, BL-2104).
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const MACROS_PATH = fileURLToPath(new URL('../../../../docs/support/macros.md', import.meta.url));

export type Macro = { key: string; heading: string; notes: Record<string, string>; body: string };
export type Send = { situation: string; recipient: string; key: string | null };

export function readMacrosFile(): string {
  return readFileSync(MACROS_PATH, 'utf8');
}

/** Every macro in the file, by key. Throws if a key appears in two blocks, so a reader can never pick the wrong one. */
export function parseMacros(md: string): Map<string, Macro> {
  const out = new Map<string, Macro>();
  const sections = md.split(/^## /m).slice(1);
  for (const section of sections) {
    const heading = section.split('\n', 1)[0].trim();
    const notes: Record<string, string> = {};
    for (const m of section.matchAll(/^- ([A-Z][A-Za-z ]*): (.+)$/gm)) notes[m[1]] = m[2];
    for (const m of section.matchAll(/^```macro ([\w.]+)\n([\s\S]*?)^```$/gm)) {
      if (out.has(m[1])) throw new Error(`macro key ${m[1]} appears twice in docs/support/macros.md`);
      out.set(m[1], { key: m[1], heading, notes, body: m[2] });
    }
  }
  return out;
}

/** The "Who receives what" table: one row per send. A key of "none ..." means nothing is sent. */
export function parseSends(md: string): Send[] {
  const section = md.split(/^## /m).find((s) => s.startsWith('Who receives what'));
  if (!section) throw new Error('docs/support/macros.md has no "Who receives what" section');
  const rows = section.split('\n').filter((l) => l.startsWith('|') && !/^\|\s*-/.test(l)).slice(1);
  return rows.map((row) => {
    const [situation, recipient, cell] = row.split('|').slice(1, -1).map((c) => c.trim());
    const key = /^`([\w.]+)`$/.exec(cell)?.[1] ?? null;
    return { situation, recipient, key };
  });
}

/** The sentences of a body with the greeting and sign-off removed. */
export function bodyText(body: string): string {
  return body.replace(/^Hi,$/m, '').replace(/^Warmly,$/m, '').replace(/\$\{brand\.name\}/g, '{app}').trim();
}

/**
 * Lines that ask the person for something we must never ask for: an attachment, a picture, a link, proof of age, an
 * ID or a birth date. Used for the abuse-material acknowledgement (FR-POL-02) and the under-18 reply (FR-POL-07).
 */
export const ASKS_FOR_MATERIAL: readonly RegExp[] = [
  /\b(send|attach|forward|upload|share|reply with|include)\b[^.]*\b(file|files|picture|pictures|photo|photos|image|images|video|videos|screenshot|screenshots|attachment|attachments|link|links|copy|evidence|proof|id|birth)\b/i,
  /\b(proof of age|date of birth|birth date|passport|driver'?s licen[cs]e|government id)\b/i,
];

/** Words that would say an account exists, or what happened to one (FR-POL-07). */
export const NAMES_AN_ACCOUNT: readonly RegExp[] = [
  /\b(the|their|this|that|his|her|your)\s+account\b/i,
  /\baccount\s+(exists|was|is|has been|will be)\b/i,
  /\b(closed|deleted|removed|suspended|found)\b/i,
];
