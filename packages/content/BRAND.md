# Early Letters brand guide

The name, store name, category, tagline and print title live in `packages/brand/index.ts`. Copy in `packages/content/src` never types the name: it uses `${brand.name}` (D-076; the rules test fails otherwise). This guide may name the product, because it is documentation.

## Positioning statement

For parents of young children, Early Letters is the baby memory book you fill by talking. Unlike fill-in-the-blank baby books or photo apps, it keeps letters to your child in your own words and your own voice, exactly as you said them, so your child can read and hear them for years. (From v1.1: and for the family who love them.)

## Naming system

- **Early Letters** is the brand. Never alone on first mention to a new audience.
- **Early Letters + memory book** is how we introduce ourselves, with one descriptor only: "Early Letters, the baby memory book you fill by talking." Use at any first contact: App Store, homepage hero, ads.
- **Early Letters: Memory Book** is the App Store name only.
- **Early Letters** alone is fine once context is set: after the hero, in email to existing users, in the app.
- **Early Letters: Year One**, **Year Two**, and so on, name the printed books. No other book-line names.
- **Notes** and **letters** are the two things people make. A note is quick. A letter is longer. Both live in the memory book.
- **Read together** names the listening experience. Always two words.
- **Word for word** names the edit feature. Its changes are **small fixes**, shown as marks the person can undo.
- **Plus** is the subscription. Plans are **Plus Monthly** and **Plus Annual**, exactly as in App Store Connect.

## Messaging pillars

### 1. Exactly as you said it
Your words, never ours.
- On-device transcription only fixes microphone and grammar slips.
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
| Descriptor | "the baby memory book you fill by talking" | "the memory book you fill by talking", other variants | One descriptor everywhere. |
| What the product makes | memory book; "the book" or "{child}'s book" after first mention | journal, diary, baby book (except about paper competitors), album, scrapbook | Store keywords may keep search terms. |
| Printed product | Early Letters: Year One (from `brand.printTitle`) | yearbook, photo book | Not promised in v1.0. |
| Longer piece someone makes | letter | entry, post, memory, story, journal entry | |
| Short piece someone makes | note | quick entry, moment | Only ever something a person makes. |
| What we send (billing, months, birthdays) | reminder; message | note | "A reminder before your trial ends", "Month and birthday messages". |
| A month section of the book | month, "Month 4" | chapter (in copy), page | "chapter" may stay in code and design docs. |
| The spoken audio | recording; "your voice" in headlines | voice note, audio file, clip | |
| The words from a recording | your words; "what you said" | transcript (in app copy), caption | Legal pages may say "transcript". |
| The edit feature (D-074) | Word for word | Lightly tidied, Tidying, tidy, tidied, cleaned up, polished, improved, corrected | Founder decision. |
| What the machine changes | small fixes, shown as marks you can undo | edits, corrections, improvements | |
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
| Sign-in buttons | Sign in with Apple; Sign in with Google | Apple login, Google sign-in, log in | "Sign in with Google is now on your account". |
| Action | sign in / sign out | log in, log out, login | |
| Privacy promise | private by default; "Only you, and your co-parent if you invite them, can read what you add to the book. Our staff look only in the rare cases our Privacy Policy lists." | "only the family you invite", secure vault, military-grade, 100% private, end-to-end (letters are encrypted at rest, not end-to-end) | No Vault mode or cloud transcription in v1.0 public copy. |
| Release state | early version ("early version, can make mistakes", in the app only) | beta (in app, store and website copy), preview, alpha | TestFlight is the only beta (Brief 10). Legal terms may say beta until counsel changes them. |
| Email sign-off | "Warmly," then the brand name | The Early Letters Team, Love, Cheers, Best | `emailChrome.signature`. |
| Footer line | brand name, then the tagline "Exactly as you said it." | other tagline variants | `emailChrome.footer.nameLine`. |
