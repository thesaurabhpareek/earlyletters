# Early Letters brand guide

The name, store name, category, tagline and print title live in `packages/brand/index.ts`. Copy in `packages/content/src` never types the name: it uses `${brand.name}` (D-076; the rules test fails otherwise). This guide may name the product, because it is documentation.

## Positioning statement

For parents of young children who would rather talk than write, Early Letters keeps letters to your child, in your own words and voice. You talk for a minute, or type, and each letter goes into your child's book with the recording beside it. Unlike fill-in-the-blank baby books, photo apps or journals that write for you, it never rewrites a word: every small fix is marked and can be undone. It stays in your words, so your child can read and hear them for years. (From v1.1: and for the family who love them.)

Positioning A, founder decision D-139 (1 Nov 2026). It replaces the descriptor "the baby memory book you fill by talking" and the store name "Early Letters: Memory Book".

## Naming system

- **Early Letters** is the brand. Never alone on first mention to a new audience.
- **Early Letters + the descriptor** is how we introduce ourselves, with one descriptor only: "Early Letters: letters to your child, in your own words and voice." Use at any first contact: App Store description's first line, homepage, link previews, ads, the app's one-line description (`en.app.oneLine`). Where the name is already on screen (a logo, a title), the line stands alone: "Letters to your child, in your own words and voice."
- **Early Letters: Baby Journal** is the App Store name only, with the subtitle "For parents who'd rather talk" (`packages/brand`). "Journal" is there for search; it never names the product in prose.
- **Early Letters** alone is fine once context is set: after the hero, in email to existing users, in the app.
- **Early Letters: Year One**, **Year Two**, and so on, name the printed books. No other book-line names.
- **Notes** and **letters** are the two things people make. A note is quick. A letter is longer. Both live in the memory book.
- **Read together** names the listening experience. Always two words.
- **Word for word** names the edit feature. Its changes are **small fixes**, shown as marks the person can undo.
- **Plus** is the subscription. Plans are **Plus Monthly** and **Plus Annual**, exactly as in App Store Connect.

## Messaging pillars

### 1. It stays in your words
Your words, never ours.
- On-device transcription only fixes small slips, like an um, a repeat or a misheard word, and marks each one.
- Word for word: every small fix is marked, and you can undo it.
- We never rewrite your words. Every sentence is one the person actually said.
- Every language stays as spoken: seven languages at v1.0, each in its own script, never translated. Hindi and English in one sentence arrives in v1.1.

### 2. A voice to come back to
Read it, and hear it.
- The original recording is kept with each letter, on your phone by default, with optional encrypted backup that only you can restore or play (D-073). It is never altered; a cleaner listening copy may sit beside it (D-058). Hearing each other's recordings across phones arrives in v1.1.
- Read together plays your letters in your own voice at bedtime. The moving word highlight arrives in v1.1.
- Free PDF export any time. Printed books, starting with Early Letters: Year One, come later.

### 3. Made by the whole family, at your pace
Love from everyone, pressure from no one.
- At v1.0 the book is shared with your co-parent, each letter signed, like "From Papa". Grandparents and close family join in a later update.
- Private by default. Never sold, never used for ads, never used to train models (D-061).
- "Not much today" in one tap. No counters or badges, ever.
- Organised by month of age.

## Contrast lines

**Versus fill-in-the-blank baby books:** "No blanks to fill. Just talk, and the page is yours."
"Not 'First word: ____'. The whole story of the first word, told by the person who heard it."

**Versus photo apps:** "Photos show what {child} looked like. Letters tell {child} what it felt like."
"Your camera roll keeps the picture. Early Letters keeps your voice."

**Versus journals that write for you:** "We never rewrite your words. Every sentence is one you actually said."
"Not a summary of your day. Your day, in your words."

## Mark and app icon

**The mark: Heart fold.** An envelope whose top folds into a soft heart. The flap above the fold line is the heart; the pocket below is the envelope. A letter sent with love, in one silhouette.

Three original concepts were drawn (`packages/brand/logo/concepts/`):

| Concept | Idea | Verdict |
| --- | --- | --- |
| A. Open letter | An opened envelope; the page inside carries one soft wave, a voice becoming writing. | Clear, but at small sizes it reads as a generic mail icon. Kept for illustration. |
| B. Heart fold | An envelope whose flap is a heart. | **Chosen.** |
| C. Voice line | One continuous line: a short spoken wave that folds into an envelope. | Reads as "send mail" and loses the wave below 60 px. Kept as an illustration motif (CREATIVE section 3). |

Why B:
- **One idea, one shape.** Like the best calm apps (a single dot, a single bookmark), it is one silhouette and one cut. It survives 40 px, the tinted and themed variants, and a one-colour print.
- **Ownable.** The heart shoulders separate it from every mail icon on a home screen; no letters of the alphabet, no blocks, no baby imagery, no wax seal.
- **True to the product.** A letter, written with love, kept. The heart is in the fold, so it is felt before it is noticed.
- **Warm palette.** Paper `#FBF8F3` on accent brown `#8A5A3B` for the icon; accent on paper for the splash; `#D9A47E` for dark. All from `packages/brand` colours. Terracotta was tried and rejected: it reads as another mail brand and, in our system, terracotta means "recording".

Files: geometry in `scripts/brand/mark.mjs` (the single source); `node scripts/brand/icons.mjs` writes the app icons (iOS light, dark, tinted; Android adaptive and themed) and splash marks to `apps/mobile/assets/brand/`, and `mark.svg` and `app-icon.svg` to `packages/brand/logo/`. Never edit the PNGs by hand.

## Proof discipline

Only claim what the product does today. No user counts, rankings or testimonials until real and verifiable. The website shows the price (D-075, Brief decision 3): "$4.99 a month or $49.99 a year", with a 1-month free trial on monthly and a 2-month free trial on annual. In the app, prices come from the App Store, localized. The v1.0 scope is in docs/DECISIONS.md (3 Oct 2026); `packages/content/test/rules.test.ts` blocks the known overclaims in store and website copy.

## Glossary

One term per concept. Banned words must not appear in user-facing copy (app, website, store, email, legal summaries). Internal docs and code (keys, types) may keep their own names. Decisions: founder, Oct 3 2026, and `docs/agents/BRIEF-2026-10-03.md`. Source: `docs/brand/CONSISTENCY_AUDIT.md` section 2. Several rows are enforced by `test/rules.test.ts`.

| Concept | Use | Banned in copy | Notes |
|---|---|---|---|
| The product | Early Letters (from `brand.name`) | EL, the app (as a name), Scribe, Lumira, Letters (alone) | Never typed in `packages/content/src`. |
| Descriptor | "letters to your child, in your own words and voice" (after the name: "Early Letters: letters to your child, in your own words and voice.") | "the baby memory book you fill by talking" and its variants (retired by D-139), other variants of the line | One descriptor everywhere. Enforced by `test/rules.test.ts`. |
| App Store name and subtitle | "Early Letters: Baby Journal"; "For parents who'd rather talk" | "Early Letters: Memory Book" (retired by D-139) | From `brand.storeName` and `brand.subtitle` only. |
| What the product makes | memory book; "the book" or "{child}'s book" after first mention | journal, diary, baby book (except about paper competitors), album, scrapbook | "Journal" is allowed in the store name, subtitle and keywords, for search only (D-139). Store keywords may keep other search terms. Prose keeps "book" and "letter". |
| Printed product | Early Letters: Year One (from `brand.printTitle`) | yearbook, photo book | Not promised in v1.0. |
| Longer piece someone makes | letter | entry, post, memory, story, journal entry | |
| Short piece someone makes | note | quick entry, moment | Only ever something a person makes. |
| What we send (billing, months, birthdays) | reminder; message | note | "A reminder before your trial ends", "Month and birthday messages". |
| A month section of the book | month, "Month 4" | chapter (in copy), page | "chapter" may stay in code and design docs. |
| The spoken audio | recording; "your voice" in headlines | voice note, audio file, clip | |
| The words from a recording | your words; "what you said" | transcript (in app copy), caption | Legal pages may say "transcript". |
| The edit feature (D-074, D-086) | Word for word, only where the feature is named: the promise, Settings, the store, the website | Any word that says software tidied or cleaned a letter, polished, improved, corrected | Founder decision. In review and on the letter page we say what happened ("Took out a sound") and use "Exactly as said" only when it is true. |
| What the machine changes | small fix (each one named by what happened), shown as a mark you can undo | edits, corrections, improvements | D-086. The Review views are "With small fixes" and "Exactly as said". |
| What a small fix is, in one sentence | "We only fix small slips, like an um, a repeat or a misheard word, and mark each one." | "what the microphone got wrong", "slips of the tongue", "the slips a microphone makes" | One phrasing on every surface (comms validation LNG-18, 31 Oct 2026). Shorter forms keep "small slips". |
| The untouched words | "Exactly what you said"; setting "Exactly as said" | raw transcript, original text | |
| Record control | the red circle ("Tap the red circle and talk") | microphone button, record button, big round button | Brand review BRD-11; colour token `recording` is a UI state, never a brand fill. |
| Listening mode | Read together (two words, capital R only) | Read Together, story mode, bedtime mode, playback | No word highlighting claims until v1.1. |
| Quiet-day action | Not much today (in quotes when named in prose) | skip, check in, log | |
| Who signed it | "From {signsAs}" | author, contributor, poster | "author" allowed only in legal text. |
| Second parent (v1.0) | co-parent in settings and buttons; "{child}'s other parent" in prose | partner, spouse, coparent, member | The only family role at v1.0. |
| Other family (v1.1) | family; "Nani", "Papa" as the family uses them | contributor, user, member, senior, elderly | Not in any v1.0 public copy; in-app keys marked v1.1. |
| Approvals, gifts (v1.1) | none at v1.0 | "you approve", "parents approve", "give Early Letters", gift | |
| Backup | encrypted backup; "a backup is for you alone" | cloud sync (for audio), sharing | Owner only at v1.0. Family listening is v1.1. |
| Subscription | Plus | Early Letters Plus, Book Plus, Premium, Pro | |
| Plans (D-077) | Plus Monthly, Plus Annual | Plus Yearly, annual plan (as a name), monthly plan (as a name) | Must equal App Store display names. |
| Prices | $4.99 a month (1 month free); $49.99 a year (2 months free) | "/mo", "per mo", "{price}" left unfilled on public pages | In the app, prices come from StoreKit. |
| Languages | English, Hindi, Spanish, Mandarin Chinese, French, Arabic, Portuguese | "any language", "both in one sentence", "any mix" | Hindi-English mixing is v1.1. |
| Apple identity | Apple Account | Apple ID, iCloud account, store account | |
| Google identity | Google Account | Google ID, Gmail account | |
| Email sign-in | sign-in link; 6-digit code | magic link, login link, one-time password, OTP | "Magic link" only as Supabase's dashboard name in internal docs. |
| Sign-in buttons | Sign in with Apple; Sign in with Google; Sign in with email | Apple login, Google sign-in, log in, "Continue with Google", "Continue with email" | "Sign in with Google is now on your account". The app's buttons and the emails use the same words (LNG-13). Name a provider only where the build offers it. |
| Sign out elsewhere | Sign out other devices | Sign out of other devices, log out everywhere | Button and Account row (LNG-14). |
| Action | sign in / sign out | log in, log out, login | |
| Privacy promise | private by default; "Only you, and your co-parent if you invite them, can read what you add to the book. Our staff look only in the rare cases our Privacy Policy lists." | "only the family you invite", secure vault, military-grade, 100% private, end-to-end (letters are encrypted at rest, not end-to-end) | No Vault mode or cloud transcription in v1.0 public copy. |
| Release state | early version ("early version, can make mistakes", in the app only) | beta (in app, store and website copy), preview, alpha | TestFlight is the only beta (Brief 10). Legal terms may say beta until counsel changes them. |
| Email sign-off | "Warmly," then the brand name | The Early Letters Team, Love, Cheers, Best | `emailChrome.signature`. |
| Footer line | brand name, then the tagline "It stays in your words." | other tagline variants | `emailChrome.footer.nameLine`. |

## Internal terms, and what a parent sees instead (CR-25, 31 Oct 2026)

Two vocabularies, one door, one direction. Code, schema, test names and spec section 12 keep the internal term on the left, because those names hold the guarantees (renaming `raw_transcript` to something soft would invite an edit to it). Anything a parent can read uses the term on the right: app, store, website, email, help, the export README and the printed book. Spec sections that describe what a parent sees use the right-hand term too. `test/rules.test.ts` blocks the left-hand words in parent-facing copy. Promise words ("Word for word", "Exactly as you said it") stay under D-125 and are not changed here.

| Internal term | What a parent sees | Notes |
|---|---|---|
| `raw_transcript`, raw text | "Exactly what you said"; setting "Exactly as said" | Immutable. Never renamed. |
| `EditType`, edit, `verifyEdits` | small fix, marked and undoable | No parent word for the check itself. |
| take | recording | "Take your time" and "this can take a minute" are the verb and stay. |
| entry | letter (long) or note (short) | The export file `data/entries.json` is a format contract (D-096) and keeps its name. |
| draft | "Waiting to be kept." | A recording whose words are not kept yet. |
| held letter, Keep gate | "Waiting to be kept."; the action is Keep; the plan is Plus | The gate is never named in copy. |
| language pack, speech pack, text-rules pack | language; Settings > Languages and speech; "download" for the act | "Speech models" may stay where the file itself is meant. |
| chapter | month | Already in the table above. |
| `scribe` | nothing | The codename lives in repo, packages and bundle id only. |
