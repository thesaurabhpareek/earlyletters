/**
 * Experience pass, October 2026: package P0, copy only (docs/design/EXPERIENCE_PASS_2026-10.md, section 6).
 *
 * Pins every CHG and NEW string of section 4 word for word, keeps every retired (RET) key, leaves registered
 * disclosure and claims text untouched, and holds the pass's own rules on every string it touched: no "we"
 * outside the sanctioned promises, no glossary-banned words, buttons of 22 characters or fewer with the Asha
 * fixtures, the App Store plan names, and US spelling. If a test here fails, fix the copy, not the test.
 *
 * Where the shipped words differ from section 4, DEVIATIONS says why. Two reasons only: the unchanged rules test
 * (its placeholder list and button budget), or the founder's option B (D-100: sign-in, sync between two phones,
 * co-parent sharing and encrypted recording backup ship in v1.0, so no string may say or imply that letters never
 * leave the phone, that there are no accounts, or that nothing is shared). Each option B line goes to counsel's
 * claims review, listed in the P0 pull request.
 */
import { describe, expect, it } from 'vitest';
import { brand } from '@scribe/brand';
import { faithfulClean, finalText, withoutEdit } from '@scribe/core';
import { en, features, onboardingStories, permissions, STORY_VISUALS } from '../src';
import { alternateStories } from '../src/stories.en';

type Text = string | readonly string[];
type Leaf = { path: string; text: string };

const ROOT = { en, features } as const;

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

const texts = (t: Text): string[] => (typeof t === 'string' ? [t] : [...t]);

// ---------------------------------------------------------------------------
// Section 4, word for word. Keys are where the strings live: `en.*` is strings.en.ts, `features.*` the feature
// files (features.speech is speechSettingsCopy, features.speechConsent is speechConsentCopy).
// ---------------------------------------------------------------------------

/** CHG: same key, new words. */
const CHG: Record<string, Text> = {
  // S01, S02
  'en.ageGate.stopTitle': '{app} is currently for adults 18 and over.',
  // S05
  'en.onboarding.child.nameLabel': 'Name',
  'en.onboarding.child.expectingHelp': 'Letters written before the birthday go in Before You.',
  'en.onboarding.child.addAnotherHelp': 'Twins or more? Each child gets their own book.',
  'en.childrenExtra.edit.birthdayFuture': 'Choose today or an earlier day.', // shared with S46
  // S06
  'en.onboarding.signsAs.examples': ['Mama', 'Papa', 'Amma', 'Appa', 'Mommy', 'Daddy', 'Ma', 'Baba'],
  // S07
  'features.language.picker.searchPlaceholder': 'Find a language',
  'features.language.picker.none': 'No match. Letters can be spoken in these seven languages for now.',
  // S08
  'features.speechConsent.body': 'Spoken letters are written down on this phone. One download of {size}, on Wi-Fi.',
  'features.speechConsent.chosenLater': 'Your voice is kept either way.',
  // S09
  'en.tonight.draftWaiting.title': 'A recording is ready to read back.',
  // S13
  'en.errors.micDenied.title': 'The microphone is off',
  'en.errors.micDenied.body': 'Turn it on in Settings, or type this one.',
  // S14
  'features.words.pack.stoppedInBackground': 'The recording stopped when you left the app. Everything before that is kept.',
  // S15
  'en.review.waiting.body': 'The words follow once this phone is ready.',
  'features.words.pack.mobileDataButton': 'Use cellular data {size}',
  // S16
  'en.errors.transcriptionFailed.title': 'No words yet for this one',
  'en.errors.transcriptionFailed.body': 'The recording is kept.',
  'features.words.noSpeech.title': 'No words in this one',
  'features.words.noSpeech.body': 'The recording is kept just as it is.',
  // S17
  'en.review.noChanges': 'No fixes. This is exactly what you said.',
  'en.review.noChangesAfterUndo': 'Every fix put back. This is exactly what you said.',
  'en.review.edits.filler.explain': 'An um or an uh, taken out.',
  'en.review.edits.falseStart.explain': 'A sentence begun twice. The second try is kept.',
  'en.review.edits.repeat.explain': 'A word said twice in a row. One is kept.',
  'en.review.edits.misheardName.explain': 'A misheard name, spelled your way.',
  'en.review.edits.punctuation.explain': 'Commas and periods, where you paused.',
  'en.review.edits.grammarSlip.explain': 'A slip of the tongue, like "a apple". Only that word changed.',
  'en.review.edits.paragraph.explain': 'A long pause. A new paragraph starts here.',
  'en.review.edits.script.explain': 'The same word, in the script you chose.',
  // S22
  'features.billing.keepGate.body': 'Your first two letters are kept for good. Plus lets you keep adding letters.',
  'features.billing.keepGate.heldNote': 'This one waits on Tonight, exactly as it is.',
  'features.billing.keepGate.lapsedBody': 'Plus has ended. Every letter you kept is still yours to read, play and export.',
  'features.billing.keepGate.offline': 'Plus needs a connection to start. This one waits on Tonight.',
  // S24
  'en.book.empty.bookBody': 'Tell {child} one thing about today.',
  // S26
  'en.book.quietDay.removedToast': 'Mark removed.',
  // S27
  'features.player.cannotPlay': 'This recording will not play here. Export keeps the file.',
  // S30
  'en.readTogether.nowReading': 'Month {month} · From {signsAs}',
  'en.readTogether.autoplayLabel': 'Keep playing',
  // S31
  'en.readTogether.endOfMonth': 'That was Month {month}.',
  'en.readTogether.endOfMonthAlt': 'That was Month {month}.',
  // S33
  'en.notMuch.savedToast': 'A quiet day, kept.',
  // S34
  'features.reminders.settings.monthNotesLabel': 'Month and birthday messages',
  'features.reminders.settings.monthNotesHelp': 'A short message on the day a new month begins in each book, and on birthdays.',
  'features.reminders.settings.lateNightClamp': 'Late nights stay quiet.',
  'features.reminders.settings.deniedTitle': 'Notifications are off',
  'features.reminders.settings.deniedBody': 'Turn them on in Settings to get these reminders.',
  // S35
  'en.settings.delete.entryBody': 'It waits in Recently deleted for 30 days.',
  // S37
  'en.reader.notFoundTitle': 'This letter is not in the book.',
  // S38
  'en.settings.delete.shelfEmpty': 'No deleted letters.',
  'en.settings.delete.erasesOn': 'Kept here until {date}',
  'en.settings.delete.restoredToast': "Back in {child}'s book.",
  // S39
  'en.settings.delete.eraseNowBody': 'The letter and its recording are erased from this phone right away.',
  // S40
  'en.settingsHome.planHelp': 'Your first two letters are free. Plus lets you keep adding letters.',
  'en.settingsHome.licencesLabel': 'Licenses',
  'features.licences.title': 'Licenses',
  'features.licences.rowLabel': 'Licenses',
  // S41
  'features.billing.plan.payment': 'Apple takes the payment. Card details stay with Apple.',
  'features.billing.plan.monthly': 'Plus Monthly',
  'features.billing.plan.grace': 'Apple could not take the last payment. Plus stays on while Apple tries again.',
  'features.billing.plan.retry': 'Plus is paused until a payment goes through. Every letter you kept is still here.',
  'features.billing.plan.restoreFailed': 'The App Store did not answer. Try again in a moment.',
  'features.billing.store.subtitle': 'Two letters free. Then Plus.',
  // S42
  'features.speech.footer': 'Removing a language frees space. Recordings and letters stay, and new recordings wait for their words until it is added again.',
  'en.settings.tidyHelp': 'Small fixes are marked in each letter and can be put back. Exactly as said keeps every um and false start. Either way, we never rewrite your words.',
  'features.packs.cellularTitle': 'Use cellular data',
  'features.language.status.downloadNow': 'Download now on cellular data',
  // S43
  'features.export.screen.offlineNote': 'Nothing is sent anywhere.',
  'features.export.screen.includesLetters': 'Every letter, as text',
  'features.export.screen.lowSpaceBody': 'This phone needs more free space first.',
  'features.export.screen.cancelled': 'Export stopped.',
  // S44
  'en.settings.privacy.analyticsOffNote': 'Turning this off stops sharing right away. Nothing else changes.',
  // S46
  'en.children.settings.remindersHelp': 'Month and birthday messages for {child} follow this switch.',
  'en.children.settings.hideBody': "Hiding {child}'s book quiets every reminder and message about {child}. Nothing is deleted.",
  'en.childrenExtra.edit.born.offerBody': 'Add it when you are ready.',
  'en.childrenExtra.edit.signsAsNewOnly': 'Letters already written keep their signature.',
  'en.childrenExtra.edit.nameTooLong': 'Up to {n} characters.',
  'en.childrenExtra.edit.signsAsTooLong': 'Up to {n} characters.',
  // S49
  'en.errors.notFoundPage.title': 'Nothing at this link.',
  'en.errors.notFoundPage.body': 'Your book is right where you left it.',
  // S50
  'en.errors.crash.title': 'This screen could not be shown.',
  'en.errors.crash.body': 'Your letters and recordings are safe on this phone.',
  // S51
  'en.errors.launch.title': 'The book could not open.',
  'en.errors.launch.body': 'Your letters and recordings are safe on this phone. Nothing has been removed.',
  'en.errors.launch.hint': 'Try again, or restart the phone.',
  'en.errors.launch.exportNothing': 'No recordings or files to export were found on this phone.',
  'en.errors.launch.exportFailed': 'The export could not be made, and nothing was changed. Your files are still on this phone.',
};

/** NEW: new keys. */
const NEW: Record<string, Text> = {
  // S04
  'en.onboarding.promise.sampleLabel': 'Sample',
  'en.onboarding.promise.sampleRaw': 'Today, um, you you held the spoon all by yourself.',
  'en.onboarding.promise.sampleHint': 'Word for word marks every small fix. Tap one to put it back.',
  // S05
  'en.onboarding.child.nameLabelMore': 'Another name',
  // S06
  'en.onboarding.signsAs.needSignsAsMany': 'Add what {child} call you to continue.',
  // S09
  'en.tonight.draft.held': 'Waiting to be kept.',
  'en.tonight.draft.swept': 'Kept when the app closed.',
  'en.tonight.draft.typedA11y': 'A letter you started, {date}.',
  'en.tonight.draft.pickUpButton': 'Pick it up',
  'en.tonight.draft.openButton': 'Open',
  'en.tonight.draft.keepButton': 'Keep it',
  'en.tonight.resurfaced.kicker': 'A month ago',
  'en.tonight.resurfaced.a11y': 'A letter from {date}. Opens the letter.',
  // S12
  'en.listen.ready.hint': 'Tap the red circle and talk.',
  'en.listen.ready.startA11y': 'Start recording',
  // S13
  'en.errors.micBusy.title': 'The microphone is in use',
  'en.errors.micBusy.body': 'A call or another app has it right now.',
  'en.errors.phoneFull.title': 'This phone is full',
  'en.errors.phoneFull.body': 'Free some space to record, or type this one.',
  // S14
  'en.review.waitingLong': 'A long recording takes a little longer.',
  'en.review.laterButton': 'Read it back later',
  'features.words.pack.stoppedInterruption': 'The recording stopped for a call or an alert. Everything before that is kept.',
  'features.words.pack.stoppedClosed': 'The recording stopped when the app closed. Everything before that is kept.',
  // S16
  'en.review.missingFile.title': 'The recording did not save',
  'en.review.emptyTake.title': 'Nothing was recorded',
  'en.review.emptyTake.body': 'The take ended before any sound came in.',
  // S17
  'en.review.headerTo': 'To {child} · Month {month}',
  'en.review.headerToNewborn': 'To {child} · The first weeks',
  'en.review.headerToBefore': 'To {child} · Before You',
  'en.review.destination.addButtonShort': 'Add to the book',
  'en.review.saveFailed': 'That did not save.',
  // S19
  'en.write.notSaved': 'Not saved yet',
  // S21
  'en.review.destination.filedChip': 'Filed in Month {month}',
  'en.review.destination.filedChipNewborn': 'Filed in the first weeks',
  'en.review.destination.filedChipBefore': 'Filed in Before You',
  // S22
  'features.billing.keepGate.heldChip': 'Waiting',
  // S23
  'en.review.noDraft.title': 'Nothing to read back here.',
  'en.review.noDraft.button': 'Go to the book',
  // S26
  'en.book.monthKicker': 'Month',
  'en.book.monthRange': '{start} to {end}',
  'en.book.waitingReady': 'Ready to read back',
  // S30
  'en.readTogether.nowReadingNewborn': 'The first weeks · From {signsAs}',
  'en.readTogether.nowReadingBefore': 'Before You · From {signsAs}',
  'en.readTogether.positionA11y': 'Letter {n} of {count}',
  // S34
  'features.reminders.settings.onToast': 'Reminders are on.',
  // S37
  'en.reader.notFoundDeleted': 'It is in Recently deleted.',
  'en.reader.openShelfButton': 'Open Recently deleted',
  // S38
  'en.settings.delete.openButton': 'Open',
  'en.settings.delete.erasedToast': 'Erased from this phone.',
  // S41 (`restoring` already held these words on develop)
  'features.billing.plan.annual': 'Plus Annual',
  'features.billing.plan.restoring': 'Checking with the App Store',
  'features.billing.plan.restoreNone': 'No Plus found for this Apple Account.',
  // S42
  'features.speech.downloadButton': 'Download',
  // S43
  'features.export.screen.emptyNote': 'Export opens once the book has a letter.',
  'features.export.screen.tooBigTitle': 'This book is too big for one file',
  // S45
  'en.reader.previewEmpty': 'Aa',
  // S46
  'en.childrenExtra.edit.born.title': "{child}'s birthday",
  'en.childrenExtra.edit.born.hideButton': 'Hide',
  // S47
  'en.children.add.ctaShort': 'Add this book',
};

/** What ships instead of the section 4 words, and why. Nothing else may differ. */
const DEVIATIONS: Record<string, { shipped: string; why: 'rules test' | 'option B'; reason: string }> = {
  'features.words.pack.mobileDataButton': {
    shipped: 'Use cellular, {size}',
    why: 'rules test',
    reason: 'The spec text is 24 characters; rules.test.ts caps button labels at 22. The size follows a comma, as in speechSettingsCopy.',
  },
  'en.book.monthRange': {
    shipped: '{a} to {b}',
    why: 'rules test',
    reason: 'rules.test.ts allows a fixed set of placeholders and {start} and {end} are not in it; {a} to {b} is the pattern review.rowChange already uses.',
  },
  'en.settings.delete.eraseNowBody': {
    shipped: 'The letter and its recording are erased for good.',
    why: 'option B',
    reason: 'A synced letter is not only on this phone, so the erase line names no place.',
  },
  'en.settings.delete.erasedToast': {
    shipped: 'Letter erased.',
    why: 'option B',
    reason: 'Same reason; it also pairs with "Letter deleted.".',
  },
  'features.export.screen.offlineNote': {
    shipped: 'The export is made on this phone. It goes only where you send it.',
    why: 'option B',
    reason: 'Without the old "Works without a connection." framing, "Nothing is sent anywhere." reads as a claim that nothing leaves the phone, which sync makes untrue. Scoped to the export.',
  },
};

const shipped = (key: string): Text => DEVIATIONS[key]?.shipped ?? CHG[key] ?? NEW[key];
const TOUCHED: Leaf[] = [...Object.keys(CHG), ...Object.keys(NEW)].flatMap((key) =>
  texts(shipped(key)).map((text) => ({ path: key, text })),
);

/** RET: no longer shown once the screen package lands; the key stays until P7. */
const RET = [
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
  'features.billing.plan.off',
  'features.billing.plan.yearly',
  'en.settings.recordings.keepHelp',
  'en.settings.export.body',
  'features.export.screen.tooBigBody',
  'en.childrenExtra.edit.born.offer',
  'en.children.add.body',
];

/** Registered disclosure and claims text (P0 rule 3; in-app-disclosures.md), exactly as it stood on develop. */
const REGISTERED: Record<string, Text> = {
  'en.review.firstNote.title': 'Please have a read',
  'en.review.firstNote.body':
    'We take out small slips, like an um or a repeat, and mark each one. Tap a mark to see it and put it back. We can mishear a name, so please read it before you save.',
  'en.review.firstNote.dismissButton': 'Got it',
  'en.settings.help.mistakesTitle': 'How transcription works',
  'en.settings.help.mistakes': 'Your words are kept as you said them. We can mishear, so read each letter and fix anything we got wrong.',
  'en.settings.about.beta.label': 'Early version',
  'en.settings.about.beta.body': '{app} is an early version, and it can make mistakes. Some things may change. Export a copy of your letters now and then.',
  'en.settings.about.beta.exportCta': 'Export a copy',
  'en.trust.promise':
    'Your letters and recordings are private. We never sell them, never use them for ads and never use them to train machine learning models.',
  'en.trust.short': 'Private by default. Never sold, never used for ads.',
  'en.trust.voice': 'We never imitate your voice. Your original recording is always kept exactly as you made it.',
  'en.trust.signIn.why': 'An account keeps your book safe when you change phones.',
  'en.trust.signIn.privacy': 'Only you and the people you invite can read your letters. We never sell them or use them for ads.',
  'en.trust.signIn.email': 'We use your email only to sign you in and to write to you about your account.',
  'en.trust.firstRecording.title': 'Your voice stays here',
  'en.trust.firstRecording.body':
    'Your words are written down on this phone, and the recording stays with your letter. We never imitate your voice or use it to train machine learning models.',
  'en.trust.firstRecording.dismissButton': 'Good to know',
  'en.trust.settings.title': 'Our promise',
  'en.trust.settings.body':
    'Your letters and recordings are private. We never sell them, never use them for ads and never use them to train machine learning models.',
  'en.trust.settings.voice': 'We never imitate your voice. Your original recording is always kept exactly as you made it.',
  'features.billing.store.features': ['Keep adding letters to every book, as many as you like.'],
  'features.billing.store.promise': 'Your first two letters are free. Every letter you keep stays yours to read, play and export, with or without Plus.',
  'features.billing.store.renewal':
    'Plans renew automatically until you cancel. To avoid the next charge, cancel at least 24 hours before a free trial or period ends.',
  'features.billing.store.cancel': 'Cancel any time in Settings, Plan, Manage subscription, or in your Apple Account subscriptions.',
  'features.billing.store.family': 'Plus can be shared with your family through Apple Family Sharing.',
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
};

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

describe('[EXPERIENCE_PASS_2026-10 P0] section 4, word for word', () => {
  it('lists 87 CHG and 59 NEW strings, none of them twice', () => {
    expect(Object.keys(CHG)).toHaveLength(87);
    expect(Object.keys(NEW)).toHaveLength(59);
    expect(Object.keys(CHG).filter((k) => k in NEW)).toEqual([]);
  });

  it('applies every CHG string', () => {
    for (const key of Object.keys(CHG)) expect(at(key), key).toEqual(shipped(key));
  });

  it('adds every NEW key', () => {
    for (const key of Object.keys(NEW)) expect(at(key), key).toEqual(shipped(key));
  });

  it('differs from section 4 only where the rules test or option B requires it', () => {
    expect(Object.keys(DEVIATIONS).sort()).toEqual([
      'en.book.monthRange',
      'en.settings.delete.eraseNowBody',
      'en.settings.delete.erasedToast',
      'features.export.screen.offlineNote',
      'features.words.pack.mobileDataButton',
    ]);
    for (const [key, d] of Object.entries(DEVIATIONS)) {
      expect(key in CHG || key in NEW, key).toBe(true);
      expect(d.shipped, key).not.toEqual(CHG[key] ?? NEW[key]);
      expect(d.reason.length, key).toBeGreaterThan(20);
      // An option B line replaces words that say or imply the letters live only on this phone, and says none itself.
      if (d.why === 'option B') {
        expect(CHG[key] ?? NEW[key], key).toMatch(ON_DEVICE_ONLY);
        expect(d.shipped, key).not.toMatch(ON_DEVICE_ONLY);
      }
    }
  });

  it('keeps every retired key, so screen code that still reads it compiles', () => {
    expect(RET).toHaveLength(38);
    for (const key of RET) {
      const v = at(key);
      expect(typeof v, key).toBe('string');
      expect((v as string).length, key).toBeGreaterThan(0);
    }
    // billingCopy.plan.annual sits beside plan.yearly until P7 (P0 rule 2).
    expect(at('features.billing.plan.yearly')).toBe('Yearly');
  });

  it('leaves registered disclosure and claims text untouched (P0 rule 3)', () => {
    for (const [key, value] of Object.entries(REGISTERED)) expect(at(key), key).toEqual(value);
    expect(Object.keys(REGISTERED).filter((k) => k in CHG || k in NEW)).toEqual([]);
  });
});

describe('[EXPERIENCE_PASS_2026-10 P0] the pass rules, on every string it touched', () => {
  it('says "we" only inside the sanctioned promises (principle 2)', () => {
    const SANCTIONED = [/we never rewrite your words\.?/gi, en.trust.promise, en.trust.voice];
    const bad = TOUCHED.filter((l) => {
      const rest = SANCTIONED.reduce<string>((t, s) => t.replace(s, ''), l.text);
      return /\bwe\b/i.test(rest);
    });
    expect(bad.map((l) => `${l.path}: ${l.text}`)).toEqual([]);
  });

  it('never says tidy, clean, correct, edit or improve (BRAND.md glossary)', () => {
    const BANNED = /\btid(?:y|ied|ies|ying|ier)\b|\bclean\w*|\bcorrect\w*|\bedit\w*|\bimprov\w*/i;
    expect(TOUCHED.filter((l) => BANNED.test(l.text)).map((l) => `${l.path}: ${l.text}`)).toEqual([]);
  });

  it('keeps every touched button label to 22 characters, as written and with the Asha fixtures', () => {
    const buttons = TOUCHED.filter((l) => /(?:button|cta|action)(?:short)?$/i.test(l.path.split('.').pop()!));
    expect(buttons.length).toBeGreaterThan(10);
    for (const b of buttons) {
      expect(b.text.length, b.path).toBeLessThanOrEqual(22);
      expect(fill(b.text).length, b.path).toBeLessThanOrEqual(22);
    }
  });

  it('agrees in number for twins (S06)', () => {
    const twins = { ...ASHA, child: 'Asha and Nila' };
    expect(fill(en.onboarding.signsAs.titleMany, twins)).toBe('What do Asha and Nila call you?');
    expect(fill(en.onboarding.signsAs.needSignsAsMany, twins)).toBe('Add what Asha and Nila call you to continue.');
  });

  it('names the plans as App Store Connect does (D-077)', () => {
    expect(features.billing.plan.monthly).toBe('Plus Monthly');
    expect(features.billing.plan.annual).toBe('Plus Annual');
  });

  it('spells for the US storefront in in-app copy (D-087)', () => {
    const IN_APP = [
      ...leaves(en, 'en'),
      ...leaves(permissions, 'permissions'),
      ...leaves(features, 'features'),
      ...leaves([...onboardingStories, ...alternateStories], 'stories'),
    ];
    // The spec's list. "Licences" is the screen title and row; the lowercase noun in `licences.libraries` is not
    // in section 4 and is left for the content owner.
    const UK = [/\bLicences\b/, /\bmobile data\b/i, /\bfull stops?\b/i, /\bstraight away\b/i, /\bmummy\b/i];
    expect(IN_APP.filter((l) => UK.some((re) => re.test(l.text))).map((l) => `${l.path}: ${l.text}`)).toEqual([]);
  });

  it('never says or implies that letters stay on the phone, that there are no accounts, or no sharing (option B, D-100)', () => {
    expect(TOUCHED.filter((l) => ON_DEVICE_ONLY.test(l.text)).map((l) => `${l.path}: ${l.text}`)).toEqual([]);
  });
});

describe('[EXPERIENCE_PASS_2026-10 P0] story.private.v2 (P0 rule 4, option B)', () => {
  const v1 = onboardingStories.find((c) => c.id === 'story.private.v1');
  const v2 = alternateStories.find((c) => c.id === 'story.private.v2');

  it('adds v2 with the founder wording, beside v1, and keeps v1 in the packaged deck', () => {
    expect(v2).toBeDefined();
    expect(v2!.headline).toBe('Private by default.');
    expect(v2!.line).toBe('Shared only with the one other parent you invite. Never sold, never used for ads.');
    expect(v1).toBeDefined();
    expect(v1!.line).toBe('Only you and the people you invite can read these letters. We never sell them or use them for ads.');
    // Same slot, same picture; the deck still shows one card per slot.
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

  it('makes no claim about where letters are kept or who can read them', () => {
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
