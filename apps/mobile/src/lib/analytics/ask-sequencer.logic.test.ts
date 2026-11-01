/**
 * The analytics consent ask sequencer (PRD-REQ-001, K-01, TRACKING_PLAN section 9):
 * what the phone knows turned into `analyticsConsentDue` input. Only after the first
 * letter, never in the session it was saved, one ask per session, only on a calm tab,
 * at most two unanswered showings.
 */
import { describe, expect, it } from 'vitest';
import { MAX_ANALYTICS_CONSENT_OFFERS } from '@scribe/analytics';
import { askAgainLater, consentAskVerdict, firstLetterThisSession, isCalmSurface, type SessionAskFacts } from './ask-sequencer.logic';

const SESSION = Date.UTC(2026, 9, 3, 19, 0, 0);
const DAY = 864e5;

/** A later session, three letters on the phone, the first a week ago, resting on Tonight. */
const due = (over: Partial<SessionAskFacts> = {}): SessionAskFacts => ({
  consent: 'unknown',
  offersSoFar: 0,
  lettersNow: 3,
  lettersAtSessionStart: 3,
  firstLetterCapturedAt: SESSION - 7 * DAY,
  sessionStartedAt: SESSION,
  askShownInSession: null,
  segments: ['(tabs)'],
  ...over,
});

describe('isCalmSurface', () => {
  it('allows the tab roots: Tonight, Book, Family', () => {
    expect(isCalmSurface(['(tabs)'])).toBe(true);
    expect(isCalmSurface(['(tabs)', 'book'])).toBe(true);
    expect(isCalmSurface(['(tabs)', 'family'])).toBe(true);
  });

  it('blocks recording, review, writing, export, sign-in, onboarding, letters and invites', () => {
    for (const segs of [['listen'], ['review'], ['write'], ['settings', 'export'], ['settings'], ['(auth)', 'sign-in'], ['onboarding'], ['letter', '[id]'], ['invite'], ['read-together'], []]) {
      expect(isCalmSurface(segs)).toBe(false);
    }
  });
});

describe('firstLetterThisSession', () => {
  it('false with no letters', () => {
    expect(firstLetterThisSession({ lettersNow: 0, lettersAtSessionStart: 0, firstLetterCapturedAt: null, sessionStartedAt: SESSION })).toBe(false);
  });

  it('true when the session began with none and now has one', () => {
    expect(firstLetterThisSession({ lettersNow: 1, lettersAtSessionStart: 0, firstLetterCapturedAt: SESSION - DAY, sessionStartedAt: SESSION })).toBe(true);
  });

  it('true when the earliest letter was captured after the session began (count not sampled yet)', () => {
    expect(firstLetterThisSession({ lettersNow: 1, lettersAtSessionStart: null, firstLetterCapturedAt: SESSION + 60_000, sessionStartedAt: SESSION })).toBe(true);
  });

  it('false in a later session', () => {
    expect(firstLetterThisSession({ lettersNow: 2, lettersAtSessionStart: 1, firstLetterCapturedAt: SESSION - DAY, sessionStartedAt: SESSION })).toBe(false);
  });
});

describe('consentAskVerdict', () => {
  it('is due in a later session, after the first letter, on a calm tab', () => {
    expect(consentAskVerdict(due())).toEqual({ due: true });
    expect(consentAskVerdict(due({ segments: ['(tabs)', 'book'] }))).toEqual({ due: true });
  });

  it('never once the person has answered, either way', () => {
    expect(consentAskVerdict(due({ consent: 'granted' }))).toEqual({ due: false, reason: 'decided' });
    expect(consentAskVerdict(due({ consent: 'denied' }))).toEqual({ due: false, reason: 'decided' });
  });

  it('never before the first letter', () => {
    expect(consentAskVerdict(due({ lettersNow: 0, lettersAtSessionStart: 0, firstLetterCapturedAt: null }))).toEqual({ due: false, reason: 'no_letter_yet' });
  });

  it('never in the session in which the first letter was saved', () => {
    expect(consentAskVerdict(due({ lettersNow: 1, lettersAtSessionStart: 0 }))).toEqual({ due: false, reason: 'same_session_as_first_letter' });
  });

  it('at most one ask per session: not again once an ask was shown in this session', () => {
    expect(consentAskVerdict(due({ askShownInSession: SESSION }))).toEqual({ due: false, reason: 'ask_already_this_session' });
  });

  it('an ask shown in an earlier session does not block this one', () => {
    expect(consentAskVerdict(due({ askShownInSession: SESSION - 2 * DAY }))).toEqual({ due: true });
  });

  it('never during a task: recording, review, writing or export', () => {
    for (const segments of [['listen'], ['review'], ['write'], ['settings', 'export']]) {
      expect(consentAskVerdict(due({ segments }))).toEqual({ due: false, reason: 'blocking_surface' });
    }
  });

  it('stops after two unanswered showings', () => {
    expect(consentAskVerdict(due({ offersSoFar: MAX_ANALYTICS_CONSENT_OFFERS - 1 }))).toEqual({ due: true });
    expect(consentAskVerdict(due({ offersSoFar: MAX_ANALYTICS_CONSENT_OFFERS }))).toEqual({ due: false, reason: 'offered_enough' });
  });

  it('checks the answer first, so a decided person is never counted or re-asked', () => {
    expect(consentAskVerdict(due({ consent: 'denied', segments: ['listen'], offersSoFar: 9 }))).toEqual({ due: false, reason: 'decided' });
  });

  it('a whole run: first-letter session no, next session yes, shown once, then not again that session', () => {
    // Session 1: first letter saved while the app was open.
    const s1 = due({ lettersNow: 1, lettersAtSessionStart: 0, firstLetterCapturedAt: SESSION + 1000 });
    expect(consentAskVerdict(s1).due).toBe(false);
    // Session 2 (back after 30 minutes or a cold start): due on Tonight, not on Review.
    const s2Start = SESSION + DAY;
    const s2 = due({ lettersNow: 1, lettersAtSessionStart: 1, firstLetterCapturedAt: SESSION + 1000, sessionStartedAt: s2Start });
    expect(consentAskVerdict({ ...s2, segments: ['review'] }).due).toBe(false);
    expect(consentAskVerdict(s2).due).toBe(true);
    // Shown and closed without a choice: counted, and not again in session 2.
    const afterShow = { ...s2, offersSoFar: 1, askShownInSession: s2Start };
    expect(consentAskVerdict(afterShow)).toEqual({ due: false, reason: 'ask_already_this_session' });
    // Session 3: one more chance, then never.
    const s3Start = s2Start + DAY;
    expect(consentAskVerdict({ ...afterShow, sessionStartedAt: s3Start }).due).toBe(true);
    expect(consentAskVerdict({ ...afterShow, sessionStartedAt: s3Start + DAY, offersSoFar: 2 })).toEqual({ due: false, reason: 'offered_enough' });
  });
});

describe('askAgainLater', () => {
  it('a yes or a no ends the asking', () => {
    expect(askAgainLater('granted', 1, MAX_ANALYTICS_CONSENT_OFFERS)).toBe(false);
    expect(askAgainLater('declined', 1, MAX_ANALYTICS_CONSENT_OFFERS)).toBe(false);
  });

  it('closing without a choice may ask once more, never a third time', () => {
    expect(askAgainLater('dismissed', 1, MAX_ANALYTICS_CONSENT_OFFERS)).toBe(true);
    expect(askAgainLater('dismissed', 2, MAX_ANALYTICS_CONSENT_OFFERS)).toBe(false);
  });
});
