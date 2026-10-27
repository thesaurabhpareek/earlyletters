// The recovery key emails the escrow function sends (supabase/functions/escrow/email/templates.ts)
// are exactly what this package renders from packages/content (PRD V2 F08 6.5 C3 and C7).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildEscrowTemplates, escrowTemplatesFile, ESCROW_PLACEHOLDERS } from '../scripts/export-escrow';

describe('escrow function emails (supabase/functions/escrow/email)', () => {
  it('match the committed file (run: npm run export:escrow -w @scribe/emails)', async () => {
    expect(readFileSync(escrowTemplatesFile, 'utf8')).toBe(await buildEscrowTemplates());
  });

  it('load nothing from a server, carry no tracking, and leave only the placeholders the function fills', async () => {
    const file = await buildEscrowTemplates();
    expect(file).not.toMatch(/<img|cid:|@font-face|url\(|<link\s|@import|utm_/i);
    const tokens = new Set([...file.matchAll(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g)].map((m) => m[1]));
    for (const t of tokens) expect(ESCROW_PLACEHOLDERS as readonly string[]).toContain(t);
    for (const id of ['backup-restore-requested', 'backup-key-used', 'backup-key-rotated']) expect(file).toContain(`"${id}"`);
  });

  it('has no em or en dashes, curly quotes, ellipsis characters or emoji', async () => {
    const file = await buildEscrowTemplates();
    expect(file).not.toMatch(/[\u2013\u2014\u2018\u2019\u201C\u201D\u2026]/);
    expect(file).not.toMatch(/\p{Extended_Pictographic}/u);
  });
});
