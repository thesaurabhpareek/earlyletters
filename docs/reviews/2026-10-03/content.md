# Content review: emails, pages, site, store (branch feat/email-brand-library)

Reviewer: independent content reviewer (UX writing, tone, clarity, empathy). 3 Oct 2026.
Scope: `packages/content/src/emails/*.en.ts`, `pages.en.ts`, `site.en.ts`, `store.en.ts`, spot-check of `strings.en.ts`, `docs/emails/CATALOG.md`. All 36 emails rendered (`npm run build -w @scribe/emails`) and read as plain text in `packages/emails/out/*.txt`.
Measured against: `VOICE.md`, `BRAND.md` glossary, `docs/DECISIONS.md` D-071 to D-079, `docs/agents/BRIEF-2026-10-03.md`, `docs/prd/PRD.md` line 83 (v1.0 scope).

## Verdict

**Approve with changes. Fix the five High items before anything ships.**

The voice is very good. Emails read like a calm friend wrote them. They avoid guilt, use dates rather than countdowns, and never suggest that software writes. The wit lowers stress instead of performing ("Sign-in links are a little shy", the 404 page, "Easy to do on very little sleep"). Deletion and billing mail is plain, complete and free of pleading.

The weak spot is accuracy against the Oct 3 decisions:
- The site and the store promise Vault mode and cloud transcription, and neither is in v1.0.
- Google sign-in (now v1.0) is missing from every "how to get back in" path.
- Several v1.0 emails still talk about "family members" and "family letters" as if contributors existed.
- One billing email promises reminders that, under Brief decision 3, no server of ours can send.

| Dimension | Score | One line |
|---|---|---|
| Empathy | 9 | Calm, warm, no guilt, wit used only to lower stress. |
| Clarity | 7 | One action per email holds, but sign-in-trouble and the deletion and trial receipts run long, and "start of each new year" is ambiguous. |
| Consistency | 6 | "Word for word" is missing from the site and store. Three different descriptions of what transcription fixes. Footer lines are duplicated in the body. Annual versus yearly. |
| Accuracy | 5 | Vault mode and cloud transcription are claimed for v1.0. Google is missing. v1.1 family is referenced in v1.0 mail. An unbacked reminder promise. |

## Findings

Severity: **High** means it misstates the product or makes a promise we cannot keep, so it must be fixed before ship. **Medium** means a reader would be confused or a glossary or decision is broken. **Low** means polish.

### CNT-01 High: the site and store promise Vault mode and cloud transcription, which are not in v1.0

**Files:**
- `packages/content/src/site.en.ts:71`, `:73`, `:111`
- `packages/content/src/store.en.ts:172`
- spot-check: `strings.en.ts:548`

**Verified against:**
- PRD.md:83 says: "server transcription and the AI gateway (v1.1; nothing leaves the phone for AI in v1.0); Vault mode ... later".
- `pages.en.ts:8` says "v1.0 scope only: no Vault mode, no cloud transcription option", and the about page says "No audio leaves your phone to turn speech into text."

So the site contradicts our own about page on a privacy claim. The store line also contradicts itself: "only you can restore them. We keep a recovery key so we can help you".

**Replacements:**
- site.en.ts:71: `"We never rewrite your words. Transcription happens on your phone, and no audio leaves it to turn speech into text."`
- site.en.ts:72: `"Your recordings stay on your phone unless you back them up. A backup is for you alone."`
- site.en.ts:73: `"Backups are encrypted on your phone first. We keep a recovery key so we can help you restore them on a new phone."`
- site.en.ts:111: `"Each recording stays on your phone by default, attached to its letter. It leaves your phone only if you back it up. A backup is for you alone. Backups are encrypted on your phone first, and we keep a recovery key so we can help you restore them on a new phone. You can delete your recordings and letters whenever you like."`
- store.en.ts:172: `"The original recording stays with each letter, on your phone by default. With the optional backup, recordings are encrypted on your phone before upload, and a backup is for you alone. We keep a recovery key so we can help you restore it on a new phone. Years from now, your child can hear how you sounded when you said it."`
- strings.en.ts:548 (route to the app content owner): `"Copies your recordings to our servers, encrypted on this phone first, so a new phone can bring them back. We keep a recovery key so we can help you restore them."`

### CNT-02 High: trial-started promises reminders that no server can currently send

**File:** `emails/billing.en.ts:61`. Related: `:107`, `:128`, `:169`.

`"We will remind you before the trial ends, by email and in the app."` is a forward promise inside the copy the person is told to keep. CATALOG.md (reconciliation, Brief decision 3) says that every billing email is PARKED, because no server of ours sees purchases. If the sender is never built, this line becomes a broken promise in a legally sensitive receipt.

- **Replacement for :61, until the D-022 sender exists:** `"You can check the date your trial ends any time in the app, in Settings, Plan."`
- **For :107, :128 and :169:** keep each line only if the matching later notice is confirmed to send. Otherwise delete it.
- Founder and counsel decide; this item flags the dependency.

### CNT-03 High: Google sign-in is missing from the account-recovery copy

Sign in with Google is v1.0 (Brief decision 4). A parent who joined with Google and asks for help is told only about Apple.

| File | Replacement |
|---|---|
| `emails/auth.en.ts:130` | `"If you first joined with Apple or Google, tap Sign in with Apple or Sign in with Google in the app instead."` |
| `emails/auth.en.ts:209` | `"Joined with Apple or Google? Tap Sign in with Apple or Sign in with Google in the app."` |
| `pages.en.ts:181` | Add after the first sentence: `"If you joined with Google, tap Sign in with Google in the app."` |
| `pages.en.ts:230` | `"We revoke your Sign in with Apple or Sign in with Google connection and delete the random ID that links your account to your App Store purchases."` (legal lane to confirm the Google revoke step exists) |

### CNT-04 High: "family letters" are called free in v1.0 billing copy

**Files:**
- `emails/billing.en.ts:249`, `:266`
- spot-check: `strings.en.ts:711`

At v1.0 the only family role is the co-parent (D-055), and "family letters" names the v1.1 contributor feature. The line appears in the plus-cancelled and plus-ended emails and in the Plus sheet.

**Replacement (all three):** `"Writing, reading, playing your recordings, export and writing with {child}'s other parent are free, always."`

Email cannot use `{child}` (E-1), so use this wording in the two emails: `"Writing, reading, playing your recordings, export and writing together with your co-parent are free, always."`

### CNT-05 High: v1.0 deletion emails and the delete-account page describe contributors who do not exist yet

**Files and replacements:**

| File | Replacement |
|---|---|
| `emails/account.en.ts:46` | Delete the line in v1.0. Keep it behind a v1.1 flag. |
| `emails/account.en.ts:85` | `"Anything you exported stays with you."` |
| `emails/account.en.ts:103` | Delete the line in v1.0. A book with a co-parent is not deleted by one parent. |
| `emails/account.en.ts:115` | Preheader: `"Every letter and recording in it is back, right where it was."` |
| `emails/account.en.ts:119` | Delete the line in v1.0. |
| `pages.en.ts:228` | `"A book where you are the only parent is deleted with everything in it."` |
| `pages.en.ts:244` | `"Any exports you made, and your phone's own backups, such as iCloud Backup, stay with you. Those are in your hands, not ours."` |

**Why:**
- account.en.ts:85 says "Letters already on family members' phones stay with them". That contradicts :45, where your letters leave the shared book, and it implies the co-parent keeps copies.
- pages.en.ts:244 uses "saved or played on their own phones", but family listening is v1.1 (D-073).

### CNT-06 Medium: renewal timing reads like a calendar date

**File:** `emails/billing.en.ts:57`, `:103`, `:124`, `:145`

`"then at the start of each new {periodUnit}"` renders as "then at the start of each new year", which a tired reader takes to mean January 1.

**Replacement:** `"Apple charges your Apple Account {price} on {trialEndDate}, then again every {periodUnit} on that date, until you cancel."` Adapt the same wording for the three "If you keep it" lines.

### CNT-07 Medium: the edit feature is not named on the site or in the store, and what it fixes is described three ways

**Files:**
- `site.en.ts:27`: "only fixes microphone slips"
- `site.en.ts:87`: "microphone and grammar slips"
- `store.en.ts:169`: "only fixes the mistakes a microphone makes"
- `emails/auth.en.ts:186`: "We fix microphone slips"

The feature also removes "um" and stumbles (VOICE.md, D-074), so "only microphone" understates what it changes. For a product whose promise is honesty about edits, that matters.

**Replacements:**
- site.en.ts:27: `"Word for word: transcription happens on your phone and fixes only small slips, like a stray um or a misheard name. Every small fix is marked, and you can undo it. We never rewrite your words."`
- store.en.ts:169: `"Transcription happens on your phone by default. Word for word fixes only small slips, like a stray um, a misheard name or a missing full stop, and every small fix is marked so you can undo it. We never rewrite your words. Every sentence in your book is one you actually said."`
- auth.en.ts:186: `"Every letter is kept exactly as you said it. Word for word fixes only small slips, marked so you can undo them. We never rewrite your words."`

### CNT-08 Medium: emails with no notice for passkeys, and nothing tells a co-parent their partner's letters left

**File:** `docs/emails/CATALOG.md` section 4 and section 8.

1. **Passkey added.** The Brief (decision 4) says passkeys can be added after sign-in. Every other new sign-in method gets a security notice, so this one should too. Add `passkey-added`:
   - subject `"A passkey was added to your account"`
   - preheader `"Just letting you know. If this was you, there is nothing else to do."`
   - body: same shape as apple-account-linked
2. **The other parent deletes their account.** When one parent deletes their account, their letters leave the shared book (`account.en.ts:45`). The remaining parent gets no notice and simply finds letters missing. Recommend an in-app card rather than email (E-5 spirit). Suggested text: `"Some letters are no longer in the book, because the person who wrote them closed their account."` PM to decide.

### CNT-09 Medium: "any language" in the v1.0 invite text

**Files:**
- `strings.en.ts:403` (`shareMessage.whatsapp`, used for the co-parent invite per CATALOG E-3)
- `emails/lifecycle.en.ts:290` (v1.1)

"Any language" is banned in the glossary, because seven languages is the v1.0 truth.

**Replacements:**
- strings.en.ts:403: `"... You just talk, in English, Hindi, Spanish, Mandarin Chinese, French, Arabic or Portuguese. ..."`. Alternatively drop the clause: `"You just talk. Your voice is kept too."`
- lifecycle.en.ts:290: `"Then just talk, in your own language. A minute is plenty."`

### CNT-10 Medium: PLUS_INCLUDES claims "extra themes and covers"

**File:** `emails/billing.en.ts:43`

PRD C line 90 lists themes and covers as Plus, but the app ships only System, Light and Dark (`strings.en.ts:802`). This constant goes into the annual-renewal and AB 2863 anniversary notices, which must describe the product accurately.

**Replacement until covers ship:** `"Plus includes encrypted backup of every recording, Read together, and books for more children."`

### CNT-11 Low: footer line repeated in the body

**Files:** `emails/auth.en.ts:188`, `emails/account.en.ts:195`, `emails/billing.en.ts:231`

The rendered plain text shows "Questions? Reply..." twice, and once it says "A real person", which is inconsistent with the footer's "A person".

**Fix:** delete these body lines. The footer already says it. For welcome, replace with `"Ideas are welcome too. Just reply."`

### CNT-12 Low: "Plus" in a sign-in preheader

**File:** `emails/auth.en.ts:202`

"Plus the usual culprits" puts the subscription name in a sign-in email, and "culprits" mildly blames.

**Replacement:** `"A fresh link, and the quick fixes for the usual snags."`

### CNT-13 Low: sign-in-trouble is seven paragraphs for a 2 a.m. reader

**File:** `emails/auth.en.ts:205-211`

**Fix:** merge the Apple and Hide My Email lines (with Google, see CNT-03) into one:
`"Joined with Apple or Google? Use that button in the app. If you chose Hide My Email, your book is under Apple's private address, and Sign in with Apple takes you straight there."`

### CNT-14 Low: annual versus yearly, and plan names

**File:** `emails/billing.en.ts:160-161`

Heading "Your annual plan" against preheader "Your yearly plan". The glossary bans "annual plan" as a name.

**Replacements:**
- Heading: `"{planName} renews on {renewalDate}"`
- Preheader: `"The price, the date, and how to change it if you want to."`

### CNT-15 Low: subjects with dates overflow 45 characters once filled

**Files:** `emails/billing.en.ts:98`, `:140`, `:180`

For example, "Your free trial ends on Thursday, December 3, 2026" is 50 characters.

**Fix:** the sender renders subject dates without the weekday ("December 3"). For `:180`, use `"Plus renews on {renewalDate}"`.

### CNT-16 Low: "original transcript" on a public page

**File:** `pages.en.ts:61`

The glossary bans "raw transcript" and "original text" outside legal pages.

**Replacement:** `"Every fix is recorded and can be undone. Exactly what you said is kept unchanged with each letter, and Show exactly what I said brings it back whenever you like."`

### CNT-17 Low: the /why page hints at mixing languages within a sentence

**File:** `pages.en.ts:117`

"The word from your first language, because that word was the right one" implies Hindi-English mixing, which is v1.1 (VOICE.md).

**Replacement:** `"The way your own language says it, because those were the right words."`

### CNT-18 Low: export contents differ between surfaces

**Files:**
- `strings.en.ts:557`: "Plain text and audio files"
- `site.en.ts:103` and `store.en.ts:193`: "and a PDF of the book"

Align on what v1.0 export produces (BRAND.md says free PDF export). If the PDF ships, the app string should read `"Download every letter and recording, any time, free. A PDF of the book, plus plain text and audio files."`

### CNT-19 Low: the legacy rule in the store

**File:** `store.en.ts:166`

"for a lifetime" leans toward endings. VOICE.md asks for "for years".

**Replacement:** `"... a book your child can read, and hear, for years."`

### CNT-20 Low: CATALOG.md drift from the Oct 3 decisions

**File:** `docs/emails/CATALOG.md`

- Section 6 marks `family-book-closing` as LB, but `family.en.ts:216` says it is never sent in v1.0. Change it to 1.1.
- Section 13 says "contributors are in the app (D-002)", but D-002 is superseded by D-055.
- Section 1.3 lists server push for family letters, which is v1.1.
- The new email from CNT-08 is missing.

## Checked and fine

- No em or en dashes, curly quotes, emoji, streaks, countdowns or guilt anywhere in scope.
- No `{child}` in any email (E-1 holds).
- The sign-off is "Warmly," followed by the brand name.
- The footer nameLine is correct.
- Prices on the site and the about page match Brief decision 3 exactly.
- Plan names are Plus Monthly and Plus Annual.
- The store never says "beta".
- The seven languages are listed in VOICE order.
- No word-highlighting claim.
- The deletion timeline in email (backups clear 7 days after) matches the page (31 and 38 days).
- Every billing notice carries the cancel-by date, auto-renew, the cancel steps and the stays-free line. None contains an offer.
- welcome-coparent and the 404 page are exemplary.
