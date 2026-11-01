/**
 * Enum value sets that mirror packages/core types. A compile error here (run by
 * `npm run typecheck -w @scribe/analytics`, and by vitest's type-aware import)
 * means core changed and the catalogue must follow (TRACKING_PLAN 6.5).
 */
import { describe, expect, it } from 'vitest';
import type { EditSource, EditType, OfferTrigger, PromptKind, RejectReason } from '@scribe/core';
import { EDIT_SOURCE, EDIT_TYPE, PLUS_TRIGGER, PROMPT_KIND, REJECT_REASON } from '../src';

type Equal<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
const assert = <T extends true>(v: T) => v;

describe('catalogue enums equal packages/core types', () => {
  it('edit types, sources, verifier reasons, offer triggers and prompt kinds', () => {
    assert<Equal<(typeof EDIT_TYPE.values)[number], EditType>>(true);
    assert<Equal<(typeof EDIT_SOURCE.values)[number], EditSource>>(true);
    assert<Equal<(typeof REJECT_REASON.values)[number], RejectReason>>(true);
    assert<Equal<(typeof PLUS_TRIGGER.values)[number], OfferTrigger>>(true);
    assert<Equal<Exclude<(typeof PROMPT_KIND.values)[number], 'none'>, PromptKind>>(true);
    expect(REJECT_REASON.values).toContain('not_vetted_for_language');
    expect(new Set(REJECT_REASON.values).size).toBe(REJECT_REASON.values.length);
  });
});
