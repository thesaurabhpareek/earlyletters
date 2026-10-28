/**
 * The data behind the content rules that rules.test.ts runs over one feature's copy.
 *
 * Two kinds of surface, one set of rules:
 *  - the keys the experience pass (docs/design/EXPERIENCE_PASS_2026-10.md) touched in strings.en.ts and the feature
 *    files: `CHANGED` and `ADDED` (P0, with the keys P2 to P6 switched since). Their scope stays these two lists:
 *    widening "no we" or "no on-device-only" to every string would fail on registered text, which only counsel may
 *    change;
 *  - whole copy files written by one package: `SURFACES` (P8a sign-in and Account, P8b Family, P8c Delete account).
 *    A new feature copy file joins by adding one row here, and gets every rule below.
 *
 * experience-pass.test.ts keeps the key lists (retired, deleted, held) and the registered text. Nothing in this file
 * is a test, so vitest does not run it on its own.
 */
import { brand } from '@scribe/brand';
import { accountDeletionCopy, authCopy, en, familyCopy, features, permissions } from '../../src';

export type Leaf = { path: string; text: string };

export function leaves(value: unknown, path = ''): Leaf[] {
  if (typeof value === 'string') return [{ path, text: value }];
  if (Array.isArray(value)) return value.flatMap((v, i) => leaves(v, `${path}[${i}]`));
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k));
  return [];
}

/** The value at a dotted path under `root`. */
export function get(root: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((node, key) => (node && typeof node === 'object' ? (node as Record<string, unknown>)[key] : undefined), root);
}

const ROOT = { en, features, permissions } as const;

/** The value at a dotted path such as "en.review.noChanges" or "features.billing.plan.annual". */
export function at(path: string): unknown {
  return get(ROOT, path);
}

// ---------------------------------------------------------------------------
// The keys the experience pass touched. `en.*` is strings.en.ts; `features.*` the feature files (features.speech is
// speechSettingsCopy, features.speechConsent is speechConsentCopy).
// ---------------------------------------------------------------------------

/** Section 4 CHG keys that ship new words in P0 (87 in the spec, less the 13 held in P0), and the held keys switched since. */
export const CHANGED = [
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
export const ADDED = [
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
export const P0_WE_ALLOWED = new Set([
  'en.settings.recordings.backedUpBody', // D-102, C7: no screen shows it until counsel approves it
  'en.settings.recordings.onPhoneBodyBackupOff', // D-102, C7: no screen shows it until counsel approves it
]);

/** The current words of every key the pass touched (held keys keep old words, so they are left out). */
export const TOUCHED: Leaf[] = [...CHANGED, ...ADDED].flatMap((key) => leaves(at(key), key));

// ---------------------------------------------------------------------------
// Whole copy files, one package each
// ---------------------------------------------------------------------------

/** One rule that bans a pattern in a surface's copy, with the exceptions the surface is allowed. */
export type Banned = {
  /** What the rule says, for the test title. */
  name: string;
  re: RegExp;
  /** Check only these leaves (default: every leaf). Each must exist. */
  only?: readonly string[];
  /** Leaves that may match: held disclosure text, the parents' own words, a screen that is true to say it. Each must exist. */
  allowed?: readonly string[];
  /** Leaves under these prefixes may match (the kill path, `soon.`). Each prefix must name a leaf. */
  allowedPrefixes?: readonly string[];
  /** The pattern must match in exactly these leaves: a claim that is true in one place only. */
  exactly?: readonly string[];
};

export type Surface = {
  /** The copy file, for the test title. */
  name: string;
  copy: unknown;
  /** The Asha fixtures that fill a placeholder (CLAUDE.md: tests use the fictional family "Asha"). */
  vars: Record<string, string>;
  /** Every string the screens put on a button (the keys do not end in "Button", so they are listed). */
  buttons: readonly string[];
  /** The placeholders this file may use. */
  placeholders: readonly string[];
  /** A placeholder that may appear only in these leaves. */
  placeholderOnly?: Record<string, readonly string[]>;
  /** Leaves in which the Asha fixtures must fill every placeholder. */
  filled?: readonly string[];
  /** "we", "our" and "us" only in the sanctioned places (principle 2). Family's pattern leaves "us" alone. */
  we: { re: RegExp; allowed?: readonly string[]; allowedPrefixes?: readonly string[] };
  banned: readonly Banned[];
  /** US storefront spelling (D-087): no leaf matches. */
  uk: RegExp;
};

const WE = /\b(?:we|our|us)\b/i;
const PHOTOS = { name: 'photos', re: /\bphotos?\b/i } as const;
const E2E_OR_FAMILY_KEYS = { name: '"end-to-end" and "only your family\'s keys"', re: /\bonly your family'?s keys\b|\bend[- ]to[- ]end\b/i } as const;
const ONLY_YOU = { name: '"only you"', re: /\bonly you\b/i } as const;
const STAYS_ON_PHONE = { name: 'letters stay on this phone', re: /\bstays? on (?:this|your|the) phone\b/i } as const;

/**
 * UK spellings and phrasings the US storefront never shows (D-087). Sign-in is held to the longer list; Family and
 * Delete account to the shorter one, which leaves "cancelled" alone (a pinned S64 line says it).
 */
const UK_LONG =
  /\b(?:colour|favour|behaviour|honour|organis|recognis|realis|apologis|authoris|centre|licence|cancelled|travelling|programme|catalogue|whilst|amongst|learnt|spelt|enrol|mobile data|straight away|full stops?)/i;
const UK_SHORT = /\blicences?\b|\bmobile data\b|\bfull stops?\b|\bstraight away\b|\bmummy\b|\bcolour|\bfavourite|\borganis|\brecognis/i;

/** Every string these screens put on a button (the file names its keys by meaning, not by a Button suffix). */
const AUTH_BUTTONS = [
  'sheet.google',
  'sheet.email',
  'sheet.passkey',
  'sheet.later',
  'email.send',
  'code.verify',
  'code.openMail',
  'code.resend',
  'code.differentEmail',
  'verify.typeCode',
  'verify.newEmail',
  'verify.close',
  'claim.keep',
  'claim.notMine',
  'consent.terms.agree',
  'consent.terms.notNow',
  'consent.age.yes',
  'consent.age.no',
  'consent.noBook.tryAnother',
  'consent.noBook.startBook',
  'account.signIn',
  'account.signOut',
  'account.cancel',
  'account.removePasskey',
  // Shown inside a busy button.
  'sheet.busy',
];

/** Every label P8b's screens put on a button (the keys do not end in "Button", so they are listed). */
const FAMILY_BUTTONS = [
  'card.button',
  'pending.shareAgain',
  'pending.cancel',
  'pending.keep',
  'create.share',
  'accept.continue',
  'accept.join',
  'accept.notNow',
  'accept.signIn',
  'accept.open',
  'accept.close',
  'accept.tryAgain',
  'accept.pasteAnother',
  'leave.confirm',
  'leave.cancel',
  'soon.notify.button',
  'soon.close',
];

const DELETION_BUTTONS = [
  'exportFirst.button',
  'subscription.button',
  'continueButton',
  'confirm.button',
  'confirm.back',
  'scheduled.cancelButton',
  'scheduled.doneButton',
  'signedOut.button',
];

/** The disclosure keys chapter 7 keeps verbatim, the only ones in authCopy that may say "we" (S52 `sheet.privacy`, S55 `consent.terms.*`). */
export const AUTH_WE_ALLOWED = ['sheet.privacy', 'sheet.emailUse', 'consent.terms.body'] as const;


/** P8b: the invitee's lines before the join returns (BL-322, D-113): paste, signed out, peeking, ask, account, joining and the errors. */
const FAMILY_BEFORE_JOIN = [
  ...['title', 'pasteLabel', 'pasteHelp', 'pastePlaceholder', 'continue', 'notRecognised', 'invitedTitle', 'signInBody', 'signIn', 'peeking', 'askTitle', 'invitedBy', 'invitedByUnknown', 'askBody', 'join', 'notNow', 'needsSync', 'joining', 'tryAgain', 'pasteAnother', 'tryLater'].map((k) => `accept.${k}`),
  // not_parent and last_parent are the inviter's and the leaver's lines, never shown to an invitee.
  ...Object.keys(familyCopy.errors).filter((k) => k !== 'not_parent' && k !== 'last_parent').map((k) => `errors.${k}`),
];

export const SURFACES: readonly Surface[] = [
  {
    name: 'authCopy (P8a, S52 to S56)',
    copy: authCopy,
    vars: { app: brand.name, child: 'Asha', email: 'mama@example.invalid' },
    buttons: AUTH_BUTTONS,
    placeholders: ['child', 'app', 'email'],
    // {email} only where an address is shown: the code screen and the claim screen (a masked address).
    placeholderOnly: { email: ['claim.body', 'code.sentToEmail'] },
    we: { re: WE, allowed: AUTH_WE_ALLOWED },
    banned: [
      PHOTOS,
      E2E_OR_FAMILY_KEYS,
      { ...ONLY_YOU, allowed: ['sheet.privacy'] },
      // Signing out leaves the letters in place, so this is the one place it is true.
      { ...STAYS_ON_PHONE, exactly: ['account.signOutBody'] },
      { name: '"in this build" and chat-bot voice', re: /in this build|let's|that's a lot|something went wrong|please\b/i },
    ],
    uk: UK_LONG,
  },
  {
    name: 'familyCopy (P8b, S57 to S60)',
    copy: familyCopy,
    vars: { app: brand.name, child: 'Asha', signsAs: 'Papa', inviter: 'Mama', coParent: 'Papa', date: 'October 23' },
    buttons: FAMILY_BUTTONS,
    placeholders: ['child', 'signsAs', 'inviter', 'coParent', 'date'],
    // The share message is the parent's own voice, which they see and can change in the share sheet before they send
    // it (S58 KEEP, D-113 item 3): its "we" is the two parents, never the app. `soon.*` is the kill path (S48, S57).
    we: { re: /\b(?:we|our)\b/i, allowed: ['create.shareMessage', 'create.shareMessageNamed'], allowedPrefixes: ['soon.'] },
    banned: [
      PHOTOS,
      E2E_OR_FAMILY_KEYS,
      ONLY_YOU,
      // The three keys where it is true are in the auth and backup files, not here (option B, D-100).
      { ...STAYS_ON_PHONE, allowedPrefixes: ['soon.'] },
      { name: 'the child named before joining', re: /\{child\}/, only: FAMILY_BEFORE_JOIN },
    ],
    uk: UK_SHORT,
  },
  {
    name: 'accountDeletionCopy (P8c, S64)',
    copy: accountDeletionCopy,
    vars: { child: 'Asha', coParent: 'Papa', count: '12', date: 'November 27, 2026' },
    buttons: DELETION_BUTTONS,
    placeholders: ['child', 'coParent', 'count', 'date'],
    filled: ['confirm.body'],
    // The held deletion disclosure (counsel C8) and `what.deletedFamily` (KEEP; never shown in v1.0: family
    // contributors come in v1.1, D-055).
    we: { re: WE, allowed: ['what.intro', 'what.introProposed', 'what.deletedFamily'] },
    banned: [
      // Held for counsel (C8): today's intro still says photos until counsel clears S64's words.
      { ...PHOTOS, allowed: ['what.intro'] },
      E2E_OR_FAMILY_KEYS,
      ONLY_YOU,
      { ...STAYS_ON_PHONE, allowed: ['notConfigured'] },
      { name: 'a receipt', re: /\breceipt\b|\bwe sent\b/i },
      { name: 'the app named in words, not through brand', re: new RegExp(brand.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) },
    ],
    uk: UK_SHORT,
  },
];
