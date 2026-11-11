/**
 * The Memory Library claims ledger, as test data (NX-39 v2 R1, R44, R55; BL-863).
 *
 * Source: docs/design/specs/MEMORY-LIBRARY-WORDS-10nov.md section 12 (PR #752, head d1ed0eb4). Each row maps one trust
 * sentence to the capability that makes it true and the earliest phase that can say it. claims-capabilities.test.ts
 * turns every row with a `pattern` into a rule: a string on a surface people see that matches the pattern is a
 * claim, and the claim fails until a capability in `needs` is on in the production profile. All six capabilities are
 * off, so every row with a pattern fails on any surface that says it. No sentence is ported into packages/content by
 * this file: the sentences below are the ledger's candidate wording, kept only so a failure can name its row, and the
 * patterns are deliberately loose key phrases, not copies. A row's wording is not chosen until counsel reads it.
 *
 * A row whose `needs` is null is true of every build (a rule of the product, not a switch); it has no pattern and is
 * here so the ledger stays complete and a missing row number fails the shape test.
 *
 * Fixtures: nothing here is a real family. The only name is the placeholder {app}.
 */

/** The six phase switches in apps/mobile/src/lib/capabilities.ts (NX-39 section 3), none yet on in any profile. */
export type MediaCapability = 'photos' | 'mediaMetadata' | 'mediaLibrary' | 'moments' | 'mediaBackground' | 'occasions';

export const MEDIA_CAPABILITIES: readonly MediaCapability[] = ['photos', 'mediaMetadata', 'mediaLibrary', 'moments', 'mediaBackground', 'occasions'];

export type Phase = 'P0' | 'P1' | 'P2a' | 'P2b' | 'P2c' | 'P3' | 'P4a';

export type LedgerRow = {
  /** Row number in section 12 of the words file. */
  n: number;
  /** The candidate sentence, from the ledger. Not content: never shipped from here. */
  sentence: string;
  /** The sentence in the context where it is said, when the ledger row is a continuation of the row before. Defaults to `sentence`. */
  inContext?: string;
  /** Any one of these on makes the sentence true. null: true of every build (no rule is made). */
  needs: readonly MediaCapability[] | null;
  /** The earliest phase that can say it. */
  phase: Phase;
  /** The proof the ledger names (requirement ids, spikes, decisions). */
  proof: string;
  counselRead: boolean;
  /** Key phrases of the sentence, loose on purpose. null when `needs` is null. */
  pattern: RegExp | null;
};

export const CLAIMS_LEDGER: readonly LedgerRow[] = [
  { n: 1, sentence: "Add a photo from Apple's own sheet. {app} asks for no access to do it", needs: ['photos'], phase: 'P0', proof: 'R2', counselRead: false, pattern: /\bapple'?s own sheet\b|\basks? for no (?:photo |library )?access\b/i },
  { n: 2, sentence: 'The photo is copied into your book', needs: ['photos'], phase: 'P0', proof: 'NX-33', counselRead: false, pattern: /\bcopied into your book\b/i },
  { n: 3, sentence: "...on this phone and in your iPhone's own backup if you use one", inContext: "The photo is copied into your book, on this phone and in your iPhone's own backup if you use one.", needs: ['photos'], phase: 'P0', proof: 'F9 decision; R43 flags', counselRead: true, pattern: /\b(?:photos?|pictures?|videos?)\b[^.]{0,80}\bbackup\b/i },
  { n: 4, sentence: '{app} shows the date the photo was taken', needs: ['mediaMetadata'], phase: 'P1', proof: 'BL-843 spike, R5', counselRead: true, pattern: /\b(?:shows?|show) the date (?:the |each |a )?(?:photo|picture|video)s? (?:was|were) taken\b/i },
  { n: 5, sentence: 'A town name from a list kept in the app', needs: ['mediaMetadata'], phase: 'P1', proof: 'BL-844, R7', counselRead: true, pattern: /\b(?:town|city) name from a list\b/i },
  { n: 6, sentence: 'You choose what {app} can see', needs: ['mediaLibrary'], phase: 'P2a', proof: 'R3, R11', counselRead: true, pattern: /\byou choose what [^.]{0,30}\bcan see\b/i },
  { n: 7, sentence: 'It reads the date each photo was taken', needs: ['mediaMetadata', 'mediaLibrary'], phase: 'P1', proof: 'R9', counselRead: true, pattern: /\breads? the date (?:each |every |the )?(?:photo|picture|video)(?: and (?:photo|picture|video))?s? (?:was|were) taken\b/i },
  { n: 8, sentence: 'It never looks at what is in a photo or who is in it', needs: ['mediaLibrary'], phase: 'P2a', proof: 'R9 running with positive controls', counselRead: true, pattern: /\bnever looks? at what is in a (?:photo|picture)\b|\bwho is in it\b/i },
  { n: 9, sentence: 'It never writes anything for you', needs: null, phase: 'P0', proof: 'R19; the constitution', counselRead: false, pattern: null },
  { n: 10, sentence: 'It reads when you open {app}', needs: ['moments'], phase: 'P2b', proof: 'R45', counselRead: true, pattern: /\breads? when you open\b/i },
  { n: 11, sentence: 'It may also check while {app} is closed, when your iPhone allows', needs: ['mediaBackground'], phase: 'P2c', proof: 'R46, BL-871, BL-872, counsel ruling, founder ruling on S6', counselRead: true, pattern: /\b(?:check|checks|look|looks|read|reads)\b[^.]{0,30}\bwhile [^.]{0,30}\bis closed\b/i },
  { n: 12, sentence: 'Your iPhone decides when, and it may not check at all', needs: ['mediaBackground'], phase: 'P2c', proof: 'Apple sources; design spec section 11', counselRead: true, pattern: /\byour iphone decides when\b/i },
  { n: 13, sentence: 'The list of days is kept on this phone', needs: ['moments'], phase: 'P2b', proof: 'R40, R43', counselRead: true, pattern: /\blist of days is kept on this phone\b/i },
  { n: 14, sentence: '{app} does not receive the list (or your photos, or when and where)', needs: ['moments'], phase: 'P2b', proof: 'R30 canary, R33, R54', counselRead: true, pattern: /\bdoes not receive the list\b/i },
  { n: 15, sentence: 'Off in one tap. Nothing is read when it is off', needs: ['moments'], phase: 'P2b', proof: 'R18, R49', counselRead: true, pattern: /\bnothing is read when it is off\b/i },
  { n: 16, sentence: 'Forget removes the list; your photos, letters and hidden choices are not touched', needs: ['moments'], phase: 'P2b', proof: 'R41, R49', counselRead: true, pattern: /\bforget removes the list\b/i },
  { n: 17, sentence: 'Erase everything also clears the list, hidden choices and reminder days', needs: ['moments', 'occasions'], phase: 'P2b', proof: 'R31', counselRead: true, pattern: /\berase everything also clears the list\b/i },
  { n: 18, sentence: 'A reminder never contains anything from your photos', needs: ['moments', 'occasions'], phase: 'P2b', proof: 'R26, R27', counselRead: true, pattern: /\breminder never contains anything from your photos\b/i },
  { n: 19, sentence: 'Reminders stay quiet from 9:30 PM to 7 AM', needs: null, phase: 'P4a', proof: 'the existing tested quiet window', counselRead: false, pattern: null },
  { n: 20, sentence: '{app} adds no days for you', needs: ['occasions'], phase: 'P4a', proof: 'R25', counselRead: true, pattern: /\badds no days for you\b/i },
  { n: 21, sentence: 'The name stays in the app; the lock screen shows it only if you turn that on', needs: ['occasions'], phase: 'P4a', proof: 'R26', counselRead: true, pattern: /\bthe lock screen shows it only if you turn that on\b/i },
  { n: 22, sentence: 'Your photos stay in your Photos app', needs: ['mediaLibrary'], phase: 'P2a', proof: 'R14', counselRead: true, pattern: /\bphotos stay in your photos app\b/i },
  { n: 23, sentence: 'Photos in your export have no location', needs: ['photos'], phase: 'P0', proof: 'R32, BL-868 (the export fix)', counselRead: true, pattern: /\b(?:photos|pictures) in your export have no location\b/i },
  { n: 24, sentence: 'Extension of the existing promise to photos and videos', needs: ['photos'], phase: 'P0', proof: 'privacy analysis row 16', counselRead: true, pattern: null },
];

/**
 * Sentences "that must never be said" (ledger, end of section 12), as the patterns the claims test applies in every
 * profile or while the capability that falsifies them is on. Each has its own rule in claims-capabilities.test.ts.
 */
export const DENIAL_CLAIMS = {
  /** "never read a photo's location", "no location": false once the build reads a date or place from a photo. */
  metadata: [
    /\b(?:never|not|don'?t|doesn'?t|do not|does not)\s+(?:read|reads|look at|looks at|use|uses|touch|touches|take|takes)\s+(?:a |any |the |your )?(?:photo|picture|video)'?s?\s+(?:location|date|place|metadata)\b/i,
    /\bnever\s+(?:reads?|looks? at|uses?)\s+(?:the )?(?:location|place|date)s? (?:of|in|from) (?:a |any |your )?(?:photo|picture|video)s?\b/i,
    /\bno location (?:is |are )?(?:read|kept|stored|taken)\b/i,
  ],
  /** "we do not look at your library", "the rest of your library is not read": false once the build can read the library. */
  library: [
    /\b(?:we|it|the app|\{app\})\s+(?:do|does)(?: not|n'?t)\s+(?:look at|read|touch|open|use)\s+your\s+(?:photo\s+)?library\b/i,
    /\bnever\s+(?:reads?|looks? at|touch(?:es)?|opens?)\s+your\s+(?:photo\s+)?library\b/i,
    /\bthe rest of your library is not read\b/i,
    /\bnot (?:read|looked at)\b[^.]{0,20}\brest of your (?:photo )?library\b/i,
  ],
  /** "never read in the background": false once P2c exists. */
  background: [
    /\b(?:never|not)\s+(?:read|reads|checked?|checks|looks?|runs?)\b[^.]{0,40}\bin the background\b/i,
    /\bnothing runs in the background\b/i,
    /\b(?:no|never)\b[^.]{0,20}\bbackground (?:reads?|checks?|activity)\b/i,
  ],
} as const;

/**
 * Frequency and freshness: no string may state or imply how often the app looks (R44, CPO-9). A hard violation in
 * every profile, whatever is on: iOS decides when a background task runs, so there is no number to promise.
 */
export const FREQUENCY_CLAIMS: readonly RegExp[] = [
  /\b(?:two|three|four|2|3|4|a few|several|a couple of)\s+(?:or\s+(?:two|three|four|2|3|4)\s+)?times (?:a|per|each) (?:day|hour)\b/i,
  /\b(?:2|two) to (?:3|three) times\b/i,
  /\btwice a day\b|\bhourly\b/i,
  /\bevery (?:day|hour)\b/i,
  /\bup[- ]to[- ]date\b/i,
];

/**
 * Where-it-stays claims (R1): fail on every surface unless the claims registry has the line with a counsel version.
 * They are false of backup, iCloud download and export (ledger, last paragraph).
 */
export const STAYS_ON_PHONE_CLAIMS: readonly RegExp[] = [
  /\bstays? on (?:your|this) (?:iphone|phone)\b/i,
  /\bnothing is sent to us\b/i,
  /\bnothing leaves your (?:iphone|phone)\b/i,
];

/** "found", "noticed", "knows": the app never says it (R17, R55). */
export const SURFACING_VERBS: readonly RegExp[] = [
  /\b(?:found|noticed|spotted|detected)\s+(?:\d+\s+|some\s+|a few\s+|your\s+|these\s+|those\s+)?(?:photos?|pictures?|videos?|moments?|trips?|days)\b/i,
  /\b(?:knows|know)\b[^.]{0,30}\b(?:photos?|library|where you (?:were|went))\b/i,
];

/** Content paths that do not exist yet and that a Memory Library change will add; read as soon as they resolve (R55). */
export const MEMORY_LIBRARY_PATHS_WHEN_PRESENT = [
  'en.memoryLibrary',
  'en.notifications.occasion',
  'en.occasions',
  'features.memoryLibrary',
  'permissions.photoLibrary',
] as const;
