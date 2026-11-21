import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  LABEL_MAX, MOMENT_REASONS, MOMENT_VERBS, MOMENTS_RULES_VERSION, REASON_PRECEDENCE, RULES,
  isMomentReason, isMomentVerb, isValidDayLabel, pickReason,
} from '../../src/moments';
import { MOMENT_KINDS } from '../../src/domain';

describe('NS-53 moments core, PR 1', () => {
  it('[NS-53-R42] the reason list is the closed 15; RSN-SUGGEST and RSN-ALBUM are absent', () => {
    expect(MOMENT_REASONS).toHaveLength(15);
    expect(isMomentReason('RSN-SUGGEST')).toBe(false);
    expect(isMomentReason('RSN-ALBUM')).toBe(false);
    expect(MOMENT_KINDS).not.toContain('suggestion');
  });

  it('[NS-53-R203] precedence is marked, first, birthday, month day, holiday, kept, place, heart, video, day', () => {
    expect(REASON_PRECEDENCE.map((r) => r.slice(4))).toEqual(
      ['MARKED', 'FIRST', 'BIRTHDAY', 'MONTHDAY', 'HOLIDAY', 'KEPT', 'PLACE', 'HEART', 'VIDEO', 'DAY']);
    for (const r of REASON_PRECEDENCE) expect(MOMENT_REASONS).toContain(r);
    expect(pickReason(['RSN-DAY', 'RSN-HEART', 'RSN-VIDEO'])).toBe('RSN-HEART');
    expect(pickReason(new Set(['RSN-DAY', 'RSN-MARKED']))).toBe('RSN-MARKED');
    expect(pickReason([])).toBeUndefined();
  });

  it('[NS-53-R54] the verbs are the closed five, with no leave-out or album verb', () => {
    expect([...MOMENT_VERBS]).toEqual(['name_day', 'not_now', 'not_this_one', 'hide_day', 'keep_close']);
    expect(isMomentVerb('leave_out_picture')).toBe(false);
    expect(isMomentVerb('use_album')).toBe(false);
  });

  it('[NS-53-R55] a day name is 1 to 60 characters', () => {
    expect(LABEL_MAX).toBe(60);
    expect(isValidDayLabel('Asha first swim')).toBe(true);
    expect(isValidDayLabel('a'.repeat(60))).toBe(true);
    expect(isValidDayLabel('a'.repeat(61))).toBe(false);
    expect(isValidDayLabel('   ')).toBe(false);
  });

  it('[NS-53-R281] the PROPOSED values of spec 7.2a are carried under a version', () => {
    expect(MOMENTS_RULES_VERSION).toBe(1);
    expect(RULES).toMatchObject({
      BUSY_DAY: 5, MIN_SPAN_HOURS: 2, NEAR_SECONDS: 10, NEAR_GROUP_MAX_SECONDS: 60,
      PLACE_RARE_SHARE: 0.15, JUNK_MAX_BEFORE_VERB: 3, JUNK_MAX_AFTER_VERB: 2, QUALIFY_PREDICATE: 'span',
    });
    expect(Object.isFrozen(RULES)).toBe(true);
  });

  it('[NS-53-R267] OPEN rows are switches, default off', () => {
    expect(RULES.LEAVE_OUT_ENABLED).toBe(false);
    expect(RULES.ALBUMS_ENABLED).toBe(false);
    expect(RULES.PLACE_ON_EVERY_CARD).toBe(false);
  });

  it('import graph: no react-native, expo, fs or node import under moments', () => {
    const dir = join(__dirname, '../../src/moments');
    for (const f of readdirSync(dir)) {
      const src = readFileSync(join(dir, f), 'utf8');
      const specs = [...src.matchAll(/(?:from|import\()\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
      for (const s of specs) {
        expect(s, `${f} imports ${s}`).toMatch(/^\.\.?\//);
        expect(s).not.toMatch(/react-native|expo|^fs|^node:/);
      }
    }
  });
});
