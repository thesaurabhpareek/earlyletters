# Early Letters brand guide

## Positioning statement

For parents of young children and the family who love them, Early Letters is the baby memory book you fill by talking. Unlike fill-in-the-blank baby books or photo apps, it keeps letters to your child in your own words and your own voice, exactly as you said them, so your child can read and hear them for years.

## Naming system

- **Early Letters** is the brand. Never alone on first mention to a new audience.
- **Early Letters + memory book** is how we introduce ourselves. "Early Letters, the baby memory book you fill by talking." Use at any first contact: App Store, homepage hero, ads, gift copy.
- **Early Letters: Memory Book** is the App Store name only.
- **Early Letters** alone is fine once context is set: after the hero, in email to existing users, in the app.
- **Early Letters: Year One**, **Year Two**, and so on, name the printed books. No other book-line names.
- **Notes** and **letters** are the two things people make. A note is quick. A letter is longer. Both live in the memory book.
- **Read together** names the listening experience. Always two words.

## Messaging pillars

### 1. Exactly as you said it
Your words, never ours.
- On-device transcription only fixes microphone and grammar slips.
- We never rewrite your words. Every sentence is one the person actually said.
- Every language stays as spoken: seven languages at v1.0, each in its own script, never translated. Hindi and English in one sentence arrives in v1.1.

### 2. A voice to come back to
Read it, and hear it.
- The original recording is kept with each letter, on your phone and in your own iPhone backup. It is never altered; a cleaner listening copy may sit beside it (D-058). Hearing each other's recordings across phones arrives in v1.1.
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

Only claim what the product does today. No user counts, rankings or testimonials until real and verifiable. Price is "{price}" until decided. The v1.0 scope is in docs/DECISIONS.md (3 Oct 2026); `packages/content/test/rules.test.ts` blocks the known overclaims in store and website copy.
