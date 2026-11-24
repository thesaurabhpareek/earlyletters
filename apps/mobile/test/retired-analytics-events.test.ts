/// <reference types="node" />
/**
 * BL-2175 (wire-names step 2a, CR-213, CR-225): the events the exec team dropped or merged have no call site, and
 * the string `letter_deleted` is nowhere under src. Screens do not load in Node, so this reads the source.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(__dirname, '..', 'src');
const files: string[] = [];
const walk = (dir: string) => {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(n) && !/\.test\.tsx?$/.test(n)) files.push(p);
  }
};
walk(SRC);

/** The 18 dropped keys, and the 4 merged ones (their signal is now a screen view or a perf metric). */
const RETIRED = [
  'app_backgrounded', 'auth_method_selected', 'auth_email_sent', 'local_merge_choice', 'child_setting_changed', 'make_it_yours_card', 'goals_set',
  'dictionary_term_added', 'family_letter_reviewed', 'member_removed', 'member_left', 'reminder_sent', 'moment_shown', 'resurface_shown',
  'resurface_opened', 'export_shared', 'account_deletion', 'letter_deleted', 'app_cold_start', 'auth_sheet_shown', 'book_opened', 'letter_opened',
];

describe('[BL-2175] retired analytics events', () => {
  it('reads some source, so the scan cannot pass on an empty list', () => {
    expect(files.length).toBeGreaterThan(200);
  });

  it('no file under apps/mobile/src fires a retired event: no track call names one', () => {
    const call = new RegExp(`\\btrack\\(\\s*['"\`](${RETIRED.join('|')})['"\`]`);
    for (const f of files) expect(readFileSync(f, 'utf8'), f).not.toMatch(call);
  });

  it('the string letter_deleted appears nowhere under apps/mobile/src (CR-225)', () => {
    for (const f of files) expect(readFileSync(f, 'utf8'), f).not.toContain('letter_deleted');
  });
});
