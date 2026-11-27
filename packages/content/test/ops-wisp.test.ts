/**
 * The WISP short form and the security risk register (BL-241, LEGAL-REQ-028). Both point to the documents that hold
 * the detail instead of restating them, so a link that no longer resolves makes the programme claim a safeguard that
 * nobody can find. Both stay marked as drafts until the exec team's CISO read records a review, and every risk row
 * carries the fields the register promises. If this fails, fix the doc, not the test.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const REPO = join(__dirname, '..', '..', '..');
const FILES = ['docs/ops/WISP.md', 'docs/ops/RISK_REGISTER.md'];
const read = (p: string) => readFileSync(join(REPO, p), 'utf8');

/** Relative markdown link targets in `text`, without any #fragment. External and anchor-only links are skipped. */
export function relativeLinks(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(/\]\(([^)\s]+)\)/g)) {
    const target = m[1];
    if (/^[a-z]+:/i.test(target) || target.startsWith('#')) continue;
    out.push(target.split('#')[0]);
  }
  return out;
}

describe('the WISP and the risk register (BL-241)', () => {
  it('[LEGAL-REQ-028] finds relative links and skips external ones', () => {
    expect(relativeLinks('[a](SECURITY.md) [b](https://example.com) [c](#x) [d](../legal/X.md#s)')).toEqual([
      'SECURITY.md',
      '../legal/X.md',
    ]);
  });

  for (const file of FILES) {
    const text = read(file);

    it(`[LEGAL-REQ-028] every relative link in ${file} resolves`, () => {
      const links = relativeLinks(text);
      expect(links.length).toBeGreaterThan(5);
      const missing = links.filter((l) => !existsSync(resolve(join(REPO, dirname(file)), l)));
      expect(missing).toEqual([]);
    });

    it(`[BL-241] ${file} is marked a draft for the CISO read, not approved`, () => {
      expect(text).toMatch(/DRAFT for the exec team's CISO read\. Not approved\./);
    });

    it(`[BL-241] ${file} is plain ASCII (no dashes, curly quotes, ellipsis or emoji)`, () => {
      expect(text).toMatch(/^[\x00-\x7F]*$/);
    });
  }

  it('[LEGAL-REQ-028] every risk has a source, controls, an owner, a next action and a review date', () => {
    const text = read('docs/ops/RISK_REGISTER.md');
    const rows = text.split(/^### /m).slice(1).filter((r) => /^R-\d\d /.test(r));
    expect(rows.length).toBeGreaterThan(10);
    for (const row of rows) {
      const id = row.slice(0, 4);
      for (const field of ['**What:**', '**Source:**', '**Controls:**', '**Owner:**', '**Next:**', '**Review by:**']) {
        expect(row, `${id} ${field}`).toContain(field);
      }
      expect(text, `${id} in the summary`).toMatch(new RegExp(`^\\| ${id} \\|.*\\| [1-5] \\| [1-5] \\| \\d+ \\|`, 'm'));
    }
  });

  it('[LEGAL-REQ-028] every summary score is likelihood times impact', () => {
    const text = read('docs/ops/RISK_REGISTER.md');
    const scored = [...text.matchAll(/^\| (R-\d\d) \|.*\| ([1-5]) \| ([1-5]) \| (\d+) \|/gm)];
    expect(scored.length).toBeGreaterThan(10);
    for (const [, id, l, i, score] of scored) {
      expect(Number(score), `${id} score`).toBe(Number(l) * Number(i));
    }
  });
});
