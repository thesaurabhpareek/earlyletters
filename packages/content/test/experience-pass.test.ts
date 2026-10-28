/**
 * Experience pass, October 2026: package P0 and P7, the key lists (docs/design/EXPERIENCE_PASS_2026-10.md, section 6).
 *
 * What this file pins: which keys the pass retired and deleted, which it holds for a later package, and the
 * registered disclosure and claims text (docs/legal/in-app-disclosures.md), which is pinned word for word and
 * changes only through counsel. No string touched by the pass is pinned word for word apart from those.
 *
 * The content rules over the touched keys (the sanctioned "we", the glossary words, button length, error titles,
 * twins, option B, US spelling, plan names, `story.private.v2`, the promise sample) and over each feature's copy
 * file now live in rules.test.ts, which reads their data from test/support/copy-surfaces.ts. If one fails, fix the
 * copy, not the test.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { en, features } from '../src';
import { ADDED, at, CHANGED, TOUCHED } from './support/copy-surfaces';

type Text = string | readonly string[];

// ---------------------------------------------------------------------------
// Keys, never words. `en.*` is strings.en.ts; `features.*` the feature files (features.speech is
// speechSettingsCopy, features.speechConsent is speechConsentCopy).
// ---------------------------------------------------------------------------

/**
 * Section 4 CHG keys that keep their old words for now, and who switches them. Screen holds: today's screen would
 * show the new words wrongly, so the package that changes the screen switches the words with it. Registered holds:
 * billingCopy.plan.* is registered text (in-app-disclosures.md section 3), so its new words wait for counsel.
 */
const HELD: Record<string, string> = {
  'features.billing.plan.monthly': 'P6, after counsel', // shown beside plan.yearly; registered group
  'features.billing.plan.payment': 'counsel, then P6',
  'features.billing.plan.grace': 'counsel, then P6',
  'features.billing.plan.retry': 'counsel, then P6',
  'features.billing.plan.restoreFailed': 'counsel, then P6',
};

/** RET: no longer shown once the screen package lands; the key stays until P7. */
const RETIRED = [
  'en.book.chapterNotes',
  'en.book.chapterNoteOne',
  'en.book.chapterMixed',
  'features.billing.plan.off',
  'features.billing.plan.yearly',
];

/**
 * Deleted by P7 (39 RET-tracked keys, plus 2 approved unmarked ones that had no reader). RETIRED above is a keep-list,
 * so nothing else would notice if a deleted word came back: this list does. Never reuse their words (strings.en.ts header).
 */
const DELETED = [
  // RET, no reader on develop (P7)
  'en.ageGate.body',
  'en.ageGate.stopBody',
  'en.ageGate.stopNote',
  'en.onboarding.promise.body',
  'en.onboarding.promise.recordingTitle',
  'en.onboarding.promise.mishearTitle',
  'en.onboarding.signsAs.body',
  'en.onboarding.dictionary.languagesBody',
  'features.speechConsent.note',
  'features.speechConsent.footnote',
  'en.tonight.subtitle',
  'en.listen.ready.title',
  'en.listen.ready.body',
  'en.listen.ready.startButton',
  'en.errors.storageLow.title',
  'en.errors.storageLow.body',
  'en.review.subtitle',
  'en.review.trustLine',
  'en.review.destination.privateHelp',
  'en.book.empty.chapterTitle',
  'en.book.empty.chapterBody',
  'en.book.chapterSubtitle',
  'en.reader.deletedBody',
  'en.readTogether.endOfMonthAlt',
  'en.familyTab.inviteNeedsSignIn',
  // RET, freed by P6a, P6b and P8b (P7)
  'en.onboarding.child.nameHelp',
  'en.onboarding.child.birthdayHelp',
  'en.children.add.body',
  'en.childrenExtra.edit.born.offer',
  'en.reader.preview',
  'features.reminders.settings.eveningsHelp',
  'features.reminders.settings.eveningHelp',
  'en.settings.recordings.keepHelp',
  'en.settings.export.body',
  'features.export.screen.tooBigBody',
  'en.settings.reminders.pauseLabel',
  'en.familyTab.emptyTitle',
  'en.familyTab.emptyBody',
  // RET, deleted once the one test that read it said "Paused" itself (P7-5)
  'features.reminders.settings.pausedSummary',
  // dead and unmarked, deleted with the coordinator's yes (P7)
  'features.reminders.settings.pausedHelp',
  'en.family.subtitle',
];

/**
 * Registered disclosure and claims text, word for word, as it stood on develop (P0 rule 3): every key that
 * docs/legal/in-app-disclosures.md quotes and that lives in packages/content. Sections 1 and 2, section 3
 * (billingCopy.store.*, every billingCopy.plan.* key, plus.legal.*), 3a (sign-in) and 3b (trust lines and the
 * microphone string). Section 4 (store listing) names no keys. Change these only with counsel and a version bump of
 * in-app-disclosures.md, in the same pull request as this map.
 */
const REGISTERED: Record<string, Text> = {
  // Section 1
  'en.settings.about.beta.label': 'Early version',
  'en.settings.about.beta.body': '{app} is an early version, and it can make mistakes. Some things may change. Export a copy of your letters now and then.',
  'en.settings.about.beta.exportCta': 'Export a copy',
  // Section 2
  'en.review.firstNote.title': 'Please have a read',
  'en.review.firstNote.body':
    'We take out small slips, like an um or a repeat, and mark each one. Tap a mark to see it and put it back. We can mishear a name, so please read it before you save.',
  'en.review.firstNote.dismissButton': 'Got it',
  'en.settings.help.mistakesTitle': 'How transcription works',
  'en.settings.help.mistakes': 'Your words are kept as you said them. We can mishear, so read each letter and fix anything we got wrong.',
  // Section 3: above Apple's plans
  'features.billing.store.features': ['Keep adding letters to every book, as many as you like.'],
  'features.billing.store.promise': 'Your first two letters are free. Every letter you keep stays yours to read, play and export, with or without Plus.',
  'features.billing.store.renewal':
    'Plans renew automatically until you cancel. To avoid the next charge, cancel at least 24 hours before a free trial or period ends.',
  'features.billing.store.cancel': 'Cancel any time in Settings, Plan, Manage subscription, or in your Apple Account subscriptions.',
  'features.billing.store.family': 'Plus can be shared with your family through Apple Family Sharing.',
  // Section 3: Settings, Plan (the billingCopy.plan.* row, Terms 14.6). Every key that existed on develop.
  'features.billing.plan.title': 'Plan',
  'features.billing.plan.statusTitle': 'Plus',
  'features.billing.plan.off': 'Your first two letters are free. Plus lets you keep adding.',
  'features.billing.plan.on': 'Plus is on.',
  'features.billing.plan.trial': 'Plus is on, free until {date}.',
  'features.billing.plan.trialCancelBy': 'Cancel by {cancelBy} and you pay nothing.',
  'features.billing.plan.renews': 'Plus renews on {date}.',
  'features.billing.plan.ends': 'Plus stays on until {date}. It will not renew.',
  'features.billing.plan.grace': 'There is a problem with the payment for Plus. Your letters are fine, and Plus stays on while Apple tries again.',
  'features.billing.plan.retry': 'Apple could not take the payment for Plus, so Plus is paused. Every letter you have kept is safe.',
  'features.billing.plan.shared': 'Shared with you through Apple Family Sharing.',
  'features.billing.plan.monthly': 'Monthly',
  'features.billing.plan.yearly': 'Yearly',
  'features.billing.plan.seePlans': 'See what Plus adds',
  'features.billing.plan.redeem': 'Redeem a code',
  'features.billing.plan.redeemHelp': "Opens Apple's sheet for an offer code.",
  'features.billing.plan.redeemUnavailable': 'Redeeming a code needs a newer version of the app on iPhone.',
  'features.billing.plan.manage': 'Manage subscription',
  'features.billing.plan.manageHelp': "Change or cancel in Apple's subscriptions screen.",
  'features.billing.plan.restore': 'Restore purchases',
  'features.billing.plan.restoreHelp': 'Finds Plus bought with this Apple Account.',
  'features.billing.plan.restoring': 'Checking with the App Store',
  'features.billing.plan.restored': 'Plus is on.',
  'features.billing.plan.restoreNothing': 'No Plus was found for this Apple Account.',
  'features.billing.plan.restoreFailed': 'The App Store could not be reached. Please try again in a moment.',
  'features.billing.plan.refund': 'Request a refund',
  'features.billing.plan.refundHelp': 'Apple decides refunds. Your letters, recordings and books never change.',
  'features.billing.plan.refundSent': 'Apple has your request and will email you.',
  'features.billing.plan.payment': 'Apple handles payment for Plus. We never see your card details.',
  'features.billing.plan.needsNewerIos': 'Plus can be added on iOS 17 or later.',
  'features.billing.plan.unavailable': 'Plus is not available on this device yet.',
  'features.billing.plan.saveCopy': 'Save a copy of the terms',
  'features.billing.plan.saveCopyHelp': 'Your plan, dates and how to cancel, to keep in Mail, Notes or Files.',
  'features.billing.plan.notificationsOff':
    'Notifications are off for {app}, so this iPhone cannot send its reminders before Plus renews. The dates are always here in Settings, Plan.',
  'features.billing.plan.turnOnNotifications': 'Allow notifications',
  // Section 3: our own Plus sheet
  'en.plus.legal.renewAnnual': 'Free for 2 months, then {price} a year. Renews automatically until you cancel, at least 24 hours before it renews.',
  'en.plus.legal.renewMonthly': 'Free for 1 month, then {price} a month. Renews automatically until you cancel, at least 24 hours before it renews.',
  'en.plus.legal.renewNoTrialAnnual': '{price} a year, charged now. Renews automatically until you cancel, at least 24 hours before it renews.',
  'en.plus.legal.renewNoTrialMonthly': '{price} a month, charged now. Renews automatically until you cancel, at least 24 hours before it renews.',
  'en.plus.legal.cancel': 'Cancel any time in Settings, Plan, Manage subscription, or in your Apple Account subscriptions.',
  'en.plus.legal.termsLink': 'Terms of Service',
  'en.plus.legal.privacyLink': 'Privacy Policy',
  'en.plus.legal.subscriptionTermsLink': 'Subscription terms',
  'en.plus.legal.restoreLink': 'Restore',
  'en.plus.legal.agree': 'By continuing, you agree to the Subscription terms and Terms of Service.',
  // Section 3a: sign-in acceptance
  'features.auth.consent.terms.agreeLine': 'By continuing, you confirm you are 18 or older and agree to the Terms of Service and Privacy Policy.',
  'en.trust.signIn.privacy': 'Only you and the people you invite can read your letters. We never sell them or use them for ads.',
  'en.trust.signIn.email': 'We use your email only to sign you in and to write to you about your account.',
  // Section 3b: trust lines and the microphone string
  'en.trust.promise':
    'Your letters and recordings are private. We never sell them, never use them for ads and never use them to train machine learning models.',
  'en.trust.short': 'Private by default. Never sold, never used for ads.',
  'en.trust.voice': 'We never imitate your voice. Your original recording is always kept exactly as you made it.',
  'en.trust.signIn.why': 'An account keeps your book safe when you change phones.',
  'en.trust.firstRecording.title': 'Your voice stays here',
  'en.trust.firstRecording.body':
    'Your words are written down on this phone, and the recording stays with your letter. We never imitate your voice or use it to train machine learning models.',
  'en.trust.firstRecording.dismissButton': 'Good to know',
  'en.trust.settings.title': 'Our promise',
  'en.trust.settings.body':
    'Your letters and recordings are private. We never sell them, never use them for ads and never use them to train machine learning models.',
  'en.trust.settings.voice': 'We never imitate your voice. Your original recording is always kept exactly as you made it.',
  'permissions.microphone': '{app} uses the microphone to record the letters you speak to your child. Your recordings stay on this phone.',
  // Also registered (P0 rule 3): the sensitive-data consent (consumer-health-data-notice.md HN-4; counsel approves).
  'en.sensitiveConsent.title': 'Before your book syncs',
  'en.sensitiveConsent.body':
    'Letters can hold private things, like health details about you or {child}. To sync your book and share it with the family you choose, we store what you write on our servers.',
  'en.sensitiveConsent.use': 'We use it only to keep and show your book. We never sell it, use it for ads or use it to train machine learning models.',
  'en.sensitiveConsent.changeLater': 'You can change this any time in Settings, Privacy.',
  'en.sensitiveConsent.declineHelp': 'If you keep it on this phone, syncing and sharing stay off.',
  'en.sensitiveConsent.agreeButton': 'Agree and sync',
  'en.sensitiveConsent.declineButton': 'Keep on this phone',
};

/**
 * The consentCopy never-lines (P0 rule 3) live in apps/mobile, not here. packages/content does not depend on the app,
 * so the test does not import it: it reads the file's string literals with the TypeScript parser, as rules.test.ts
 * does for every app copy file.
 */
const CONSENT_COPY_FILE = join(__dirname, '..', '..', '..', 'apps', 'mobile', 'src', 'components', 'consent', 'copy.ts');
const CONSENT_NEVER = {
  neverTitle: 'What we never do',
  never: [
    'We never show ads, and your letters are never used for advertising.',
    'We never sell your data.',
    'We never use your words, recordings or photos to train machine learning models.',
  ],
};

function consentNeverLines(): { neverTitle?: string; never?: string[] } {
  const source = ts.createSourceFile(CONSENT_COPY_FILE, readFileSync(CONSENT_COPY_FILE, 'utf8'), ts.ScriptTarget.Latest, true);
  const out: { neverTitle?: string; never?: string[] } = {};
  const visit = (node: ts.Node): void => {
    if (ts.isPropertyAssignment(node) && ts.isIdentifier(node.name)) {
      if (node.name.text === 'neverTitle' && ts.isStringLiteral(node.initializer)) out.neverTitle = node.initializer.text;
      if (node.name.text === 'never' && ts.isArrayLiteralExpression(node.initializer)) {
        out.never = node.initializer.elements.filter(ts.isStringLiteral).map((e) => e.text);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return out;
}

describe('[EXPERIENCE_PASS_2026-10 P0] keys', () => {
  it('has every changed and added key, each in one list only', () => {
    // A changed key may also be retired; the other lists never overlap.
    const all = [...CHANGED, ...ADDED, ...Object.keys(HELD)];
    expect(all.length).toBe(new Set(all).size);
    expect(RETIRED.filter((k) => ADDED.includes(k) || k in HELD)).toEqual([]);
    // An array key (signsAs.examples) yields one leaf per item: "key[0]", "key[1]" and so on.
    const present = (key: string) => TOUCHED.some((l) => (l.path === key || l.path.startsWith(`${key}[`)) && l.text.length > 0);
    for (const key of [...CHANGED, ...ADDED]) expect(present(key), key).toBe(true);
  });

  it('keeps every retired and every held key, so screen code that reads it still compiles', () => {
    for (const key of [...RETIRED, ...Object.keys(HELD)]) {
      const v = at(key);
      expect(typeof v, key).toBe('string');
      expect((v as string).length, key).toBeGreaterThan(0);
    }
    // billingCopy.plan.annual sits beside plan.yearly until P7 (P0 rule 2).
    expect(typeof at('features.billing.plan.yearly')).toBe('string');
  });

  it('keeps the 41 keys P7 deleted deleted: a re-added leaf fails here', () => {
    expect(DELETED).toHaveLength(41);
    expect(new Set(DELETED).size).toBe(DELETED.length);
    // A deleted key is in no keep-list, so the lists cannot disagree.
    const kept = new Set([...RETIRED, ...CHANGED, ...ADDED, ...Object.keys(HELD), ...Object.keys(REGISTERED)]);
    expect(DELETED.filter((k) => kept.has(k))).toEqual([]);
    // errors.storageLow went as a whole block, so its parent is errors.
    const WHOLE_BLOCK = 'en.errors.storageLow';
    for (const key of DELETED) {
      expect(at(key), key).toBeUndefined();
      // The parent still exists, so a mistyped path cannot pass for a deleted one.
      const parent = key.startsWith(`${WHOLE_BLOCK}.`) ? 'en.errors' : key.slice(0, key.lastIndexOf('.'));
      expect(typeof at(parent), `${parent} for ${key}`).toBe('object');
    }
    expect(at(WHOLE_BLOCK)).toBeUndefined();
  });

  it('names who switches every held key', () => {
    for (const [key, who] of Object.entries(HELD)) expect(who, key).toMatch(/\bP[2-6]\b|counsel/);
  });

  it('leaves registered disclosure and claims text untouched (P0 rule 3, in-app-disclosures.md)', () => {
    for (const [key, value] of Object.entries(REGISTERED)) expect(at(key), key).toEqual(value);
    // A touched key is never a registered key, and every billingCopy.plan.* key from develop is in the map.
    expect([...CHANGED, ...ADDED].filter((k) => k in REGISTERED && k !== 'features.billing.plan.restoring')).toEqual([]);
    const plan = Object.keys(features.billing.plan).map((k) => `features.billing.plan.${k}`);
    const added = new Set(ADDED);
    expect(plan.filter((k) => !(k in REGISTERED) && !added.has(k))).toEqual([]);
    // Every sensitiveConsent key is pinned, so a new one cannot slip in unregistered.
    const consent = Object.keys(en.sensitiveConsent).map((k) => `en.sensitiveConsent.${k}`);
    expect(consent).toHaveLength(7);
    expect(consent.filter((k) => !(k in REGISTERED))).toEqual([]);
  });

  it('leaves the consentCopy never-lines in apps/mobile untouched (P0 rule 3), read without importing the app', () => {
    expect(existsSync(CONSENT_COPY_FILE), CONSENT_COPY_FILE).toBe(true);
    expect(consentNeverLines()).toEqual(CONSENT_NEVER);
  });
});
