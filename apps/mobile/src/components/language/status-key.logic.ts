/**
 * The pack state a Spoken language row carries in its E2E id
 * (`language.row.<code>.status.<state>`, apps/mobile/e2e/TESTID_REQUESTS.md), so flows
 * read state without reading words. Pure and tested (status-key.logic.test.ts).
 */
import type { TextRulesStatus } from '@/lib/language/packs';

export function statusKey(status: TextRulesStatus | undefined): string {
  if (!status) return 'unknown';
  return status.state === 'waiting' ? `waiting-${status.reason}` : status.state;
}
