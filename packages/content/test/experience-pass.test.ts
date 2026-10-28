/**
 * Experience pass, October 2026: package P0, copy only (docs/design/EXPERIENCE_PASS_2026-10.md, section 6).
 *
 * Rule checks only. The words themselves are in section 4 of the spec and in the copy files, and a later copy
 * fix may change them freely as long as these rules hold; no string touched by the pass is pinned word for word.
 * What is pinned word for word is registered disclosure and claims text (docs/legal/in-app-disclosures.md), which
 * changes only through counsel. At P7, with the RET keys gone, fold the rule checks into rules.test.ts.
 *
 * The rules, on every string the pass touched: no "we" outside the sanctioned promises, no glossary-banned words,
 * buttons of 22 characters or fewer with the Asha fixtures, error titles without a full stop, plural agreement for
 * twins, US spelling in in-app copy, the App Store plan names, and option B (D-100: sign-in, sync between two
 * phones, co-parent sharing and encrypted backup ship in v1.0, so nothing may say or imply that letters never leave
 * the phone, that there are no accounts, or that nothing is shared).
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { brand } from '@scribe/brand';
import { faithfulClean, finalText, withoutEdit } from '@scribe/core';
import { en, features, onboardingStories, permissions, STORY_VISUALS } from '../src';
import { alternateStories } from '../src/stories.en';

type Text = string | readonly string[];
type Leaf = { path: string; text: string };

const ROOT = { en, features, permissions } as const;

/** The value at a dotted path such as "en.review.noChanges" or "features.billing.plan.annual". */
function at(path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>((node, key) => (node && typeof node === 'object' ? (node as Record<string, unknown>)[key] : undefined), ROOT);
}

function leaves(value: unknown, path = ''): Leaf[] {
  if (typeof value === 'string') return [{ path, text: value }];
  if (Array.isArray(value)) return value.flatMap((v, i) => leaves(v, `${path}[${i}]`));
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k));
  return [];
}

// ---------------------------------------------------------------------------
// Keys, never words. `en.*` is strings.en.ts; `features.*` the feature files (features.speech is
// speechSettingsCopy, features.speechConsent is speechConsentCopy).
// ---------------------------------------------------------------------------

/** Section 4 CHG keys that ship new words in P0 (87 in the spec, less the 13 held in P0), and the held keys switched since. */
const CHANGED = [
  // Switched by P2 with the stop screen that shows it alone (S02).
  'en.ageGate.stopTitle',
  // Switched by P4 with Listen telling off, in use and full apart (S13).
  'en.errors.micDenied.title',
  'en.errors.micDenied.body',
  'en.onboarding.child.nameLabel',
  'en.onboarding.child.expectingHelp',
  'en.onboarding.child.addAnotherHelp',
  'en.childrenExtra.edit.birthdayFuture',
  'en.onboarding.signsAs.examples',
  'features.language.picker.searchPlaceholder',
  'features.language.picker.none',
  'features.speechConsent.body',
  'features.speechConsent.chosenLater',
  // Changed after P2 landed (#220 review R5, spec v1.3): the promise body is the sanctioned promise word for word (S04).
  'en.onboarding.promise.body2',
  'features.words.pack.stoppedInBackground',
  'en.review.waiting.body',
  'features.words.pack.mobileDataButton',
  'en.errors.transcriptionFailed.title',
  'en.errors.transcriptionFailed.body',
  'features.words.noSpeech.title',
  'features.words.noSpeech.body',
  'en.review.noChanges',
  'en.review.noChangesAfterUndo',
  'en.review.edits.filler.explain',
  'en.review.edits.falseStart.explain',
  'en.review.edits.repeat.explain',
  'en.review.edits.misheardName.explain',
  'en.review.edits.punctuation.explain',
  'en.review.edits.grammarSlip.explain',
  'en.review.edits.paragraph.explain',
  'en.review.edits.script.explain',
  'features.billing.keepGate.body',
  'features.billing.keepGate.lapsedBody',
  'en.book.empty.bookBody',
  'en.book.quietDay.removedToast',
  'features.player.cannotPlay',
  'en.readTogether.autoplayLabel',
  'en.readTogether.endOfMonth',
  'en.readTogether.endOfMonthAlt',
  'en.notMuch.savedToast',
  'features.reminders.settings.monthNotesLabel',
  'features.reminders.settings.monthNotesHelp',
  'features.reminders.settings.lateNightClamp',
  'features.reminders.settings.deniedTitle',
  'features.reminders.settings.deniedBody',
  'en.settings.delete.entryBody',
  'en.reader.notFoundTitle',
  'en.settings.delete.shelfEmpty',
  'en.settings.delete.erasesOn',
  'en.settings.delete.eraseNowBody',
  'en.settingsHome.planHelp',
  'en.settingsHome.licencesLabel',
  'features.licences.title',
  'features.licences.rowLabel',
  'features.billing.store.subtitle',
  'features.speech.footer',
  'en.settings.tidyHelp',
  'features.packs.cellularTitle',
  'features.language.status.downloadNow',
  'features.export.screen.offlineNote',
  'features.export.screen.includesLetters',
  'features.export.screen.lowSpaceBody',
  'features.export.screen.cancelled',
  'en.settings.privacy.analyticsOffNote',
  'en.children.settings.remindersHelp',
  'en.children.settings.hideBody',
  'en.childrenExtra.edit.born.offerBody',
  'en.childrenExtra.edit.signsAsNewOnly',
  'en.childrenExtra.edit.nameTooLong',
  'en.childrenExtra.edit.signsAsTooLong',
  'en.errors.notFoundPage.title',
  'en.errors.notFoundPage.body',
  'en.errors.crash.title',
  'en.errors.crash.body',
  'en.errors.launch.title',
  'en.errors.launch.body',
  'en.errors.launch.hint',
  'en.errors.launch.exportNothing',
  'en.errors.launch.exportFailed',
  // Not in section 4: changed in review on #181 (the old line named four licences; #175 lists every one).
  'features.licences.libraries',
  // Held in #181, switched by P5 with the screens that build all three datelines and fill {child} (spec section 6).
  'en.readTogether.nowReading',
  'en.settings.delete.restoredToast',
  // Switched by P3 with Tonight's card for every draft (section 6, P3 switches; counsel C10 for the keepGate lines).
  'en.tonight.draftWaiting.title',
  'features.billing.keepGate.heldNote',
  'features.billing.keepGate.offline',
];

/** Section 4 NEW keys, all added in P0. Nothing on screen reads them until their package lands. */
const ADDED = [
  'en.onboarding.promise.sampleLabel',
  'en.onboarding.promise.sampleRaw',
  'en.onboarding.promise.sampleHint',
  'en.onboarding.child.nameLabelMore',
  'en.onboarding.signsAs.needSignsAsMany',
  'en.tonight.draft.held',
  'en.tonight.draft.swept',
  'en.tonight.draft.typedA11y',
  'en.tonight.draft.pickUpButton',
  'en.tonight.draft.openButton',
  'en.tonight.draft.keepButton',
  'en.tonight.resurfaced.kicker',
  'en.tonight.resurfaced.a11y',
  'en.listen.ready.hint',
  'en.listen.ready.startA11y',
  'en.errors.micBusy.title',
  'en.errors.micBusy.body',
  'en.errors.phoneFull.title',
  'en.errors.phoneFull.body',
  'en.review.waitingLong',
  'en.review.laterButton',
  'features.words.pack.stoppedInterruption',
  'features.words.pack.stoppedClosed',
  'en.review.missingFile.title',
  'en.review.emptyTake.title',
  'en.review.emptyTake.body',
  'en.review.headerTo',
  'en.review.headerToNewborn',
  'en.review.headerToBefore',
  'en.review.destination.addButtonShort',
  'en.review.saveFailed',
  'en.write.notSaved',
  'en.review.destination.filedChip',
  'en.review.destination.filedChipNewborn',
  'en.review.destination.filedChipBefore',
  'features.billing.keepGate.heldChip',
  'en.review.noDraft.title',
  'en.review.noDraft.button',
  'en.book.monthKicker',
  'en.book.monthRange',
  'en.book.waitingReady',
  'en.readTogether.nowReadingNewborn',
  'en.readTogether.nowReadingBefore',
  'en.readTogether.positionA11y',
  'features.reminders.settings.onToast',
  'en.reader.notFoundDeleted',
  'en.reader.openShelfButton',
  'en.settings.delete.openButton',
  'en.settings.delete.erasedToast',
  'features.billing.plan.annual',
  'features.billing.plan.restoring',
  'features.billing.plan.restoreNone',
  'features.speech.downloadButton',
  'features.export.screen.emptyNote',
  'features.export.screen.tooBigTitle',
  'en.reader.previewEmpty',
  'en.childrenExtra.edit.born.title',
  'en.childrenExtra.edit.born.hideButton',
  'en.children.add.ctaShort',
  // Experience pass v1.1 (spec section 6, P0 table): option B and the tab titles.
  'en.book.fromTwo',
  'en.book.recordingBackedUp',
  'en.settings.recordings.onPhoneBodyBackupOff',
  'en.settings.recordings.backedUpTitle',
  'en.settings.recordings.backedUpBody',
  'en.settings.recordings.exportFooter',
  'en.children.settings.hideShared',
  'en.tabs.tonight',
  'en.tabs.book',
  'en.tabs.family',
  // P3 (section 6): the signed-in held-letter line P6's Keep sheet shows; counsel C10.
  'features.billing.keepGate.heldNoteSynced',
];

/**
 * Touched keys whose "we" or "our" is allowed although they are not one of the sanctioned promises. Disclosure text
 * only, about our encrypted backup and the recovery key we hold (D-102, counsel item C7). Counsel must approve each
 * one before any screen shows it; until then it is not registered and may still change.
 */
const WE_ALLOWED = new Set([
  'en.settings.recordings.backedUpBody', // D-102, C7: no screen shows it until counsel approves it
  'en.settings.recordings.onPhoneBodyBackupOff', // D-102, C7: no screen shows it until counsel approves it
]);

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
  'en.ageGate.body',
  'en.ageGate.stopBody',
  'en.ageGate.stopNote',
  'en.onboarding.promise.body',
  'en.onboarding.promise.recordingTitle',
  'en.onboarding.promise.mishearTitle',
  'en.onboarding.child.nameHelp',
  'en.onboarding.child.birthdayHelp',
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
  'en.book.chapterNotes',
  'en.book.chapterNoteOne',
  'en.book.chapterMixed',
  'en.reader.deletedBody',
  'en.reader.preview',
  'features.reminders.settings.eveningsHelp',
  'features.reminders.settings.eveningHelp',
  // P6 (S34): the master switch keeps every choice when off, so the Pause row went.
  'en.settings.reminders.pauseLabel',
  'features.reminders.settings.pausedSummary',
  'features.billing.plan.off',
  'features.billing.plan.yearly',
  'en.settings.recordings.keepHelp',
  'en.settings.export.body',
  'features.export.screen.tooBigBody',
  'en.childrenExtra.edit.born.offer',
  'en.children.add.body',
  'en.readTogether.endOfMonthAlt',
  // Experience pass v1.1 (S57): the Family tab's coming-soon words.
  'en.familyTab.emptyTitle',
  'en.familyTab.emptyBody',
  'en.familyTab.inviteNeedsSignIn',
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

/** The current words of every key the pass touched (held keys keep old words, so they are left out). */
const TOUCHED: Leaf[] = [...CHANGED, ...ADDED].flatMap((key) => leaves(at(key), key));

/** The Asha fixtures (CLAUDE.md: tests use the fictional family "Asha"). */
const ASHA: Record<string, string> = {
  app: brand.name,
  child: 'Asha',
  signsAs: 'Mama',
  month: '7',
  n: '60',
  count: '5',
  date: 'October 13',
  size: '575 MB',
  a: 'September 13',
  b: 'October 12',
};
const fill = (text: string, vars: Record<string, string> = ASHA) => text.replace(/\{(\w+)\}/g, (m, k: string) => vars[k] ?? m);

/** Words that say letters never leave the phone, that there are no accounts, or that nothing is shared. */
const ON_DEVICE_ONLY =
  /\b(?:stays? on (?:this|your|the) phone|stays? on it|never leaves?|only on (?:this|your) phone|from this phone|no accounts?|without an account|only you can read|no one else|nobody else)\b|\bnothing is sent anywhere\b/i;

const IN_APP: Leaf[] = [
  ...leaves(en, 'en'),
  ...leaves(permissions, 'permissions'),
  ...leaves(features, 'features'),
  ...leaves([...onboardingStories, ...alternateStories], 'stories'),
];

describe('[EXPERIENCE_PASS_2026-10 P0] keys', () => {
  it('has every changed and added key, each in one list only', () => {
    // A changed key may also be retired (endOfMonthAlt now equals endOfMonth); the other lists never overlap.
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

describe('[EXPERIENCE_PASS_2026-10 P0] rules on every string the pass touched', () => {
  it('says "we" or "our" only inside the sanctioned promises (principle 2)', () => {
    const SANCTIONED = [/we never rewrite your words\.?/gi, en.trust.promise, en.trust.voice];
    const bad = TOUCHED.filter(
      (l) => !WE_ALLOWED.has(l.path) && /\b(?:we|our)\b/i.test(SANCTIONED.reduce<string>((t, s) => t.replace(s, ''), l.text)),
    );
    expect(bad.map((l) => `${l.path}: ${l.text}`)).toEqual([]);
    // Every allowed key is a touched key, so the list cannot hide a stale exception.
    for (const key of WE_ALLOWED) expect(ADDED.includes(key) || CHANGED.includes(key), key).toBe(true);
  });

  it('never says tidy, clean, correct, edit or improve (BRAND.md glossary)', () => {
    const BANNED = /\btid(?:y|ied|ies|ying|ier)\b|\bclean\w*|\bcorrect\w*|\bedit\w*|\bimprov\w*/i;
    expect(TOUCHED.filter((l) => BANNED.test(l.text)).map((l) => `${l.path}: ${l.text}`)).toEqual([]);
  });

  it('keeps every button label to 22 characters, as written and with the Asha fixtures', () => {
    const buttons = TOUCHED.filter((l) => /(?:button|cta|action)(?:short)?$/i.test(l.path.split('.').pop()!));
    expect(buttons.length).toBeGreaterThan(10);
    for (const b of buttons) {
      expect(b.text.length, b.path).toBeLessThanOrEqual(22);
      expect(fill(b.text).length, b.path).toBeLessThanOrEqual(22);
    }
  });

  it('writes error and state titles without a full stop', () => {
    const titles = [
      ...leaves(en.errors, 'en.errors').filter((l) => l.path.endsWith('.title')),
      ...TOUCHED.filter((l) => /^en\.review\.(missingFile|emptyTake|noDraft)\.title$|^en\.reader\.notFoundTitle$/.test(l.path)),
    ];
    expect(titles.length).toBeGreaterThan(10);
    expect(titles.filter((l) => /\.\s*$/.test(l.text)).map((l) => `${l.path}: ${l.text}`)).toEqual([]);
  });

  it('agrees in number for twins: the plural keys use the plural verb (S06)', () => {
    expect(en.onboarding.signsAs.titleMany).toMatch(/\{child\} call\b/);
    expect(en.onboarding.signsAs.needSignsAsMany).toMatch(/\{child\} call\b/);
    expect(en.onboarding.signsAs.needSignsAs).toMatch(/\{child\} calls\b/);
  });

  it('never says or implies that letters stay on the phone, that there are no accounts, or no sharing (option B, D-100)', () => {
    expect(TOUCHED.filter((l) => ON_DEVICE_ONLY.test(l.text)).map((l) => `${l.path}: ${l.text}`)).toEqual([]);
  });
});

describe('[EXPERIENCE_PASS_2026-10 P0] rules across in-app copy', () => {
  it('spells for the US storefront (D-087)', () => {
    // The spec's list, plus the lowercase noun since `licences.libraries` changed (code names keep "licences").
    const UK = [/\blicences?\b/i, /\bmobile data\b/i, /\bfull stops?\b/i, /\bstraight away\b/i, /\bmummy\b/i];
    expect(IN_APP.filter((l) => UK.some((re) => re.test(l.text))).map((l) => `${l.path}: ${l.text}`)).toEqual([]);
  });

  it('names the plans Plus Monthly and Plus Annual, as App Store Connect does (D-077)', () => {
    expect(features.billing.plan.annual).toBe('Plus Annual');
    expect(features.billing.confirmation.planMonthly).toBe('Plus Monthly');
    expect(features.billing.confirmation.planAnnual).toBe('Plus Annual');
    const named = IN_APP.flatMap((l) => [...l.text.matchAll(/\bPlus (?:Monthly|Annual|Yearly|Year|Month)\w*/g)].map((m) => `${l.path}: ${m[0]}`));
    expect(named.filter((n) => !/: Plus (?:Monthly|Annual)$/.test(n))).toEqual([]);
  });
});

describe('[EXPERIENCE_PASS_2026-10 P0] story.private.v2 (P0 rule 4, option B)', () => {
  const v1 = onboardingStories.find((c) => c.id === 'story.private.v1');
  const v2 = alternateStories.find((c) => c.id === 'story.private.v2');

  it('sits beside v1 in the same slot, and the packaged deck still serves v1', () => {
    expect(v1).toBeDefined();
    expect(v2).toBeDefined();
    expect(v2!.order).toBe(v1!.order);
    expect(v2!.visual).toBe(v1!.visual);
    expect(onboardingStories.map((c) => c.id)).not.toContain('story.private.v2');
  });

  it('follows the story card and reassurance rules', () => {
    const ids = [...onboardingStories, ...alternateStories].map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const c of alternateStories) {
      expect(c.type).toBe('story');
      expect(c.id).toMatch(/^story\.[a-z-]+\.v\d+$/);
      expect(c.headline.length, c.id).toBeLessThanOrEqual(80);
      expect(c.line.length, c.id).toBeLessThanOrEqual(160);
      expect((c.line.match(/[.!?](\s|$)/g) ?? []).length, c.id).toBeLessThanOrEqual(2);
      expect(STORY_VISUALS).toContain(c.visual);
      for (const m of `${c.headline} ${c.line}`.matchAll(/\{(\w+)\}/g)) expect(['child', 'app', 'signsAs']).toContain(m[1]);
      expect(`${c.headline} ${c.line}`).not.toMatch(/\b(grandparents?|nani|dadi|aunts?|uncles?|no app needed|from the web|web page)\b/i);
    }
  });

  it('makes no claim about where letters are kept or who can read them, and has no "we"', () => {
    const text = `${v2!.headline} ${v2!.line}`;
    expect(text).not.toMatch(ON_DEVICE_ONLY);
    expect(text).not.toMatch(/\bcan read\b|\bwe\b/i);
  });
});

describe('[EXPERIENCE_PASS_2026-10 P0] the promise sample (S04)', () => {
  it('gets exactly one filler and one repeat from the real engine, and puts back to the raw words', () => {
    const raw = en.onboarding.promise.sampleRaw;
    expect(raw).not.toMatch(/\{\w+\}/);
    const out = faithfulClean(raw, { level: 'clean', dictionary: [] });
    expect(out.rejected).toEqual([]);
    expect(out.applied.map((e) => e.type).sort()).toEqual(['filler', 'repeat']);
    let applied = out.applied;
    while (applied.length) applied = withoutEdit(raw, applied, 0).applied;
    expect(finalText(raw, applied)).toBe(raw);
  });
});
