/**
 * The English word tables, in one leaf module with no imports.
 *
 * These are the exact sets the engine has used since version 3. text.ts,
 * meaning.ts and repeats.ts re-export them under their old names, and the
 * bundled English text-rules pack (english.ts) is built from them, so the
 * legacy functions and the pack-driven engine read the same data.
 *
 * Kept import-free on purpose: the language engine imports this file, and
 * the older modules import the engine, so anything here that imported back
 * would create a cycle. (frozen.ts is a leaf too.)
 */
import { frozenSet } from '../frozen';

/**
 * Words a grammar repair may insert without adding meaning.
 * Deliberately short. Anything not here (or in the dictionary) that a
 * replacement introduces is treated as a new content word and rejected.
 */
export const FUNCTION_WORDS = frozenSet([
  'a', 'an', 'the',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'am',
  'has', 'have', 'had', 'having',
  'do', 'does', 'did',
  'will', 'would', 'can', 'could', 'shall', 'should', 'may', 'might', 'must',
  'to', 'of', 'in', 'on', 'at', 'for', 'with', 'by', 'from', 'into', 'onto', 'up',
  'and', 'or', 'but', 'so', 'if', 'that', 'than', 'then', 'as',
  'i', 'me', 'my', 'we', 'us', 'our', 'you', 'your',
  'he', 'him', 'his', 'she', 'her', 'it', 'its', 'they', 'them', 'their',
  'this', 'these', 'those',
  "it's", "i'm", "she's", "he's", "we're", "they're", "you're",
  "don't", "doesn't", "didn't", "isn't", "wasn't", "aren't", "weren't",
]);

/**
 * Removed only as standalone disfluencies. "like" and "you know" are
 * excluded on purpose: they are often meaningful, and part of how people talk.
 */
export const FILLERS = frozenSet(['um', 'umm', 'ummm', 'uh', 'uhh', 'uhm', 'erm', 'er', 'hmm', 'hmmm']);

/**
 * Offered in Review, never removed by the engine: "mm" is often a spoken yes
 * ("Did she sleep? Mm. She did."), and a removed answer is lost meaning
 * (D-112, 23 Oct 2026; F06-REQ-010's "equals today's FILLERS" line follows).
 */
export const FILLERS_OFFERED = frozenSet(['mm']);

/** Words that negate on their own. Hindi/Hinglish forms included; "na" is excluded (also a tag particle). */
export const NEGATIONS: ReadonlySet<string> = frozenSet([
  'not', 'no', 'never', 'cannot', 'nobody', 'nothing', 'none', 'nowhere', 'neither', 'nor', 'nope', 'nah',
  'nahi', 'nahin',
  // Devanagari (CORE-01). Roman "na" is excluded (a tag particle: "go na"), but in
  // Devanagari ना and न are counted: refusing an edit near a tag particle costs one
  // untidy word, while losing a real "no" reverses meaning.
  'नहीं', 'नही', 'मत', 'ना', 'न',
].map((w) => w.normalize('NFC')));

/** Modal verbs and their contracted forms. Swapping one for another changes meaning. */
export const MODALS: ReadonlySet<string> = frozenSet([
  'can', 'could', 'will', 'would', 'shall', 'should', 'may', 'might', 'must', 'ought',
  "can't", "couldn't", "won't", "wouldn't", "shan't", "shouldn't", "mightn't", "mustn't",
]);

/** Number words. Digits are handled by `numbersOf` directly. */
export const NUMBER_WORDS: ReadonlySet<string> = frozenSet([
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
  'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty', 'thirty', 'forty',
  'fifty', 'sixty', 'seventy', 'eighty', 'ninety', 'hundred', 'thousand', 'million', 'half', 'once', 'twice',
  'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'dozen',
]);

/**
 * Kinship and relationship words. A model may never turn one of these into a
 * dictionary name by similarity ("Daddy" -> "Asha"); a parent can still teach
 * the mapping explicitly through `heardAs` ("mama" -> "Mumma").
 */
export const KINSHIP: ReadonlySet<string> = frozenSet([
  'mom', 'mommy', 'mum', 'mummy', 'mumma', 'mama', 'mamma', 'ma', 'mother', 'amma', 'ammi', 'maa',
  'dad', 'daddy', 'papa', 'pappa', 'pa', 'father', 'baba', 'abba', 'appa',
  'nani', 'nana', 'dadi', 'dada', 'nanu', 'grandma', 'grandpa', 'granny', 'gran', 'grandad', 'granddad', 'grandmother',
  'grandfather', 'nanima', 'dadima', 'ajji', 'ajja', 'thatha', 'paati',
  'bua', 'chacha', 'chachi', 'mausi', 'masi', 'mausa', 'mami', 'mamu', 'tau', 'tai', 'taiji', 'fufa', 'phupho',
  'bhaiya', 'bhai', 'didi', 'dida', 'behen', 'aunty', 'auntie', 'aunt', 'uncle', 'sister', 'brother', 'sis', 'bro',
  'baby', 'son', 'daughter', 'husband', 'wife', 'cousin', 'nanny', 'teacher',
]);

/**
 * Everyday English words that are also given names or family nicknames
 * (F06-REQ-008 nameWords, F07 7.2 rule 4 commonWords). A dictionary term
 * spelled like one of these gets no automatic case-only fix: with a child
 * named Hope, "I hope you sleep" stays as said, and with a nickname Bean,
 * "she ate a bean" does too. Modals, function words, pronouns, kinship,
 * negations and numbers are guarded by their own tables ("will", "may").
 * Seed list for engine 6; a native reviewer extends it (WP-F07-02).
 */
export const COMMON_WORDS: ReadonlySet<string> = frozenSet([
  // F06-REQ-008 seeds
  'hope', 'will', 'joy', 'grace', 'rose', 'june', 'faith',
  // virtues and words used as names
  'mercy', 'patience', 'charity', 'harmony', 'melody', 'liberty', 'justice', 'destiny', 'journey', 'blessing', 'miracle',
  'haven', 'heaven', 'honor', 'honour', 'true', 'noble', 'royal', 'king', 'prince', 'princess', 'duke', 'earl', 'major',
  // months, seasons, weather, nature
  'april', 'august', 'summer', 'autumn', 'winter', 'dawn', 'eve', 'sky', 'star', 'rain', 'storm', 'sunny', 'river',
  'brook', 'lake', 'ocean', 'forest', 'stone', 'clay', 'glen', 'dale', 'cliff', 'reed', 'sage', 'willow',
  // flowers, gems, colours
  'lily', 'daisy', 'poppy', 'holly', 'ivy', 'hazel', 'olive', 'violet', 'iris', 'heather', 'ruby', 'pearl', 'amber',
  'jade', 'coral', 'crystal', 'blue', 'gray', 'grey', 'ginger',
  // names that are everyday words
  // Not listed (D-112, 23 Oct 2026): mason, carter, cooper, hunter, rowan are rarely meant as the everyday word,
  // so a child with one of these names keeps the recogniser's capital.
  'bill', 'mark', 'pat', 'rob', 'frank', 'drew', 'chase', 'page', 'grant',
  'ray', 'rich', 'miles', 'jack', 'max', 'penny', 'sandy', 'rusty', 'misty', 'carol', 'ace', 'cash',
  // family nicknames that are everyday words
  'honey', 'angel', 'bear', 'cub', 'bean', 'peanut', 'pumpkin', 'button', 'bug', 'buddy', 'bunny', 'monkey', 'chick',
  'duck', 'ducky', 'kitty', 'cookie', 'muffin', 'pickle', 'cherry', 'berry', 'candy', 'sunshine', 'champ', 'kiddo',
  'munchkin', 'sweetie', 'darling', 'love', 'dear', 'sugar', 'peach', 'pip', 'bubba', 'bub', 'tiger', 'lamb', 'mouse',
]);

/** Pronouns beyond the function-word list. */
export const PRONOUNS: ReadonlySet<string> = frozenSet([
  'hers', 'mine', 'yours', 'theirs', 'ours', 'myself', 'yourself', 'himself', 'herself', 'itself', 'ourselves',
  'themselves', 'yourselves', "i'll", "i've", "i'd", "you'll", "she'll", "he'll", "we'll", "they'll",
  'who', 'whom', 'whose', 'someone', 'somebody', 'everyone', 'everybody', 'anyone', 'anybody',
]);

/** Same verb (or article), different number or person. Tense never changes inside a group. */
export const AGREEMENT_GROUPS: ReadonlyArray<ReadonlyArray<string>> = [
  ['is', 'are', 'am'],
  ['was', 'were'],
  ['has', 'have'],
  ['do', 'does'],
  ['go', 'goes'],
  ["isn't", "aren't"],
  ["wasn't", "weren't"],
  ["hasn't", "haven't"],
  ["doesn't", "don't"],
  ['a', 'an'],
];

/** Groups that span tenses. A move inside one of these is a tense change. */
export const TENSE_GROUPS: ReadonlyArray<ReadonlyArray<string>> = [
  ['is', 'are', 'am', 'was', 'were', 'be', 'been', 'being'],
  ['has', 'have', 'had', 'having'],
  ['do', 'does', 'did', 'done', 'doing'],
  ['go', 'goes', 'went', 'gone', 'going'],
  ["isn't", "aren't", "wasn't", "weren't"],
  ["hasn't", "haven't", "hadn't"],
  ["doesn't", "don't", "didn't"],
];

/* ---------- repeats (see repeats.ts for how they are used) ---------- */

/** Doubles of these are never grammatical side by side: always removed. */
export const REPEAT_ALWAYS = frozenSet([
  'the', 'a', 'an', 'i', 'and', 'to', 'it', 'she', 'he', 'we', 'they', 'of', 'but',
]);

/**
 * Doubles that are sometimes grammatical or emphatic ("so so happy", "my my",
 * "come in in the morning"). Offered to the parent, never removed by default.
 * "had had", "that that" and "her her" are deliberately absent: they are
 * usually grammatical, so even a suggestion would be noise.
 */
export const REPEAT_SUGGEST_ONLY = frozenSet([
  'you', 'so', 'is', 'in', 'on', 'at', 'for', 'with', 'from',
  'my', 'your', 'our', 'their', 'his', 'me', 'them', 'us', 'this',
]);

/** Before a doubled "you", these mark the start of a clause (subject position). */
export const SUBJECT_LEAD = frozenSet([
  'and', 'but', 'so', 'then', 'because', 'cause', 'when', 'while', 'if', 'now', 'today', 'tonight', 'yesterday',
  'also', 'oh', 'okay', 'ok',
]);

/**
 * Verbs that take "you" as an object and then often a clause starting with
 * "you": "I told you you were brave". Not even suggested after these.
 */
export const OBJECT_VERBS = frozenSet([
  'tell', 'tells', 'told', 'telling', 'promise', 'promised', 'show', 'showed', 'remind', 'reminded', 'ask', 'asked',
  'bet', 'assure', 'assured', 'warn', 'warned', 'teach', 'taught', 'wish', 'let', 'make', 'made', 'thank', 'thanked',
  'give', 'gave', 'love', 'loved', 'see', 'saw', 'hear', 'heard', 'want', 'wanted', 'help', 'helped', 'watch',
  'watched', 'know', 'knew', 'miss', 'missed', 'call', 'called', 'mean', 'meant',
]);

/** "you know", "you see", "you mean" after a doubled "you" are discourse markers. */
export const DISCOURSE_AFTER_YOU = frozenSet(['know', 'see', 'mean']);

/** Words that open a pseudo-cleft: "What it was was magic", "All I know is is". */
export const CLEFT_OPENERS = frozenSet([
  'what', 'all', 'thing', 'things', 'problem', 'point', 'truth', 'reason', 'question', 'why', 'how', 'where', 'who',
]);

/**
 * A phrase that ends with one of these cannot be complete, so an immediate
 * repeat of it is a restart: "like a like a little hiccup", "and the and the
 * dog", "I went to I went to the park". Particles that can end a phrase
 * ("come on", "pick up", "her") are deliberately absent.
 */
export const DANGLING = frozenSet([
  'a', 'an', 'the', 'my', 'your', 'our', 'their', 'his', 'its', 'to', 'of', 'with', 'for', 'from', 'at', 'and', 'but',
  'or', 'because', 'into', 'onto',
]);
