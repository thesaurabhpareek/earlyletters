# Home page copy proposal: shorter and scannable

Status: proposal for the founder and design. Not applied. `apps/web/src/content/site.ts` is untouched; an engineer applies this after the design is agreed and after the scroll-effects PR lands.
Author: Content agent. Date: 2026-10-04. Branch: `docs/web-home-copy`.

Request (founder, verbatim): "For the page, this content is too long and a para, organise this beautifully". The founder then pointed at the pricing paragraph (section 9). That block was done first and is below with a claim-by-claim change table.

How this was made: `https://earlyletters.com` could not be fetched from this environment (proxy returned 403), so the audit reads `apps/web` on `origin/main` (`src/content/site.ts`, `components/landing/Landing.tsx`, `components/site/ShareButton.tsx`). Facts were checked against `packages/content/VOICE.md` and `BRAND.md` (origin/develop) and decisions D-082 to D-088 (origin/docs/decisions-4-oct, PR #91). Word counts cover headline plus body text of each section; the language samples, month cards and form labels are unchanged and not counted.

Note on {name}: stands for the public name from `packages/brand`. "Meera" is the film's child, as in site.ts. No dashes of any kind, curly quotes, ellipsis characters or emoji are used in proposed copy, and the child is never gendered.

## 1. Result

| # | Section | Before | After |
|---|---|---:|---:|
| 1 | Hero | 44 | 42 |
| 2 | Evening | 12 | 12 |
| 3 | A minute / Just talk | 29 | 29 |
| 4 | Exactly as you said it | 25 | 33 |
| 5 | Your voice / Said once | 52 | 37 |
| 6 | The book | 27 | 22 |
| 7 | Your language | 19 | 21 |
| 8 | Private by default | 48 | 32 |
| 9 | Pricing (the founder's block) | 80 | 66 |
| 10 | Early access (destination) | 24 | 24 |
| | **Total** | **360** | **318** |

Reduction: 42 words, about 12 percent overall; seven sections shrink or reflow, three are unchanged. The pricing block alone goes from 80 to 66 words, and from one paragraph to a lead, two plan cards and a reassurance line. The count falls less than the layout suggests because the plan cards carry the prices; what changes most is how it reads (the longest unbroken run was 75 words, now 16). Sections 4 and 7 get slightly longer in words because one sentence becomes short separate lines; to cut them, drop the 'Runs on your phone by default.' line (the hero trust line already says it) and the 'Your words stay in the language you said them.' sentence.

## 2. Where the page is text-heavy today (audit)

Longest single blocks on the home page, in word count:

| Block | Words | Verdict |
|---|---:|---|
| s10 pricing support | 75 | Wall of text, one paragraph, five claims, one 31-word sentence. Fix first. |
| comingSoon.line (hero) | 29 | Two sentences, one is filler. Shorten. |
| s09 five private lines | 45 | Five lines, two pairs say related things. Merge to three. |
| s06 book support | 21 | Two ideas. Split. |
| s07 years card | 21 | Overlaps s05. Merge. |
| s04 proof support | 20 | Three ideas in two sentences. Split. |
| s05 voice support | 18 | Overlaps s07 card. Merge. |
| s08 languages support | 14 | Repeats the list shown below it. Shorten. |

Everything else (evening, how it works, early access) is already short and stays.

## 3. Section by section, before and after

### 1. Hero  (44 words to 42)

Source: site.comingSoon.line + .trust (Landing hero)

Before:

> A calm place to keep and treasure every milestone. The baby memory book you fill by talking, with every word kept exactly as you said it, in your voice.
>
> Private by design. Your letters stay on your phone, and we never rewrite your words.

After:

> The baby memory book you fill by talking.
>
> A minute at the end of the day. Every word kept exactly as you said it, in your voice.
>
> Private by design. Your letters stay on your phone, and we never rewrite your words.

Why: Lead with the one-line brand idea, then one plain sentence; the "treasure every milestone" opener is filler and goes. Trust line kept word for word.

Facts: Facts carried: baby memory book you fill by talking (brand.line); a minute at the end of the day and exactly as you said it, in your voice (site.meta.description, scenes s02, s05); trust line (comingSoon.trust, unchanged).

### 2. Evening  (12 words to 12)

Source: s01 headline + support

Before:

> Meera is asleep.
>
> The house is quiet for the first time today.

After:

> Meera is asleep.
>
> The house is quiet for the first time today.

Why: Already one idea, two short lines. No change.

### 3. A minute / Just talk  (29 words to 29)

Source: s02 + s03

Before:

> A minute is plenty.
>
> Open {name} and tell Meera about today. One sentence counts.
>
> Just talk.
>
> Say it the way you would say it to Meera. Pauses are fine.

After:

> A minute is plenty.
>
> Open {name} and tell Meera about today. One sentence counts.
>
> Just talk.
>
> Say it the way you would say it to Meera. Pauses are fine.

Why: Already short and scannable. No change.

### 4. Exactly as you said it  (25 words to 33)

Source: s04 support (beside the phone)

Before:

> Exactly as you said it.
>
> Transcription runs on your phone by default and only clears the ums and misheard names. We never rewrite your words.

After:

> Exactly as you said it.
>
> Runs on your phone by default.
>
> Only ums and misheard names are fixed.
>
> Every small fix is marked. Put any of them back.
>
> We never rewrite your words.

Why: One sentence with three ideas becomes three short lines and the promise on its own. "Fixed" and "put back" use the app and VOICE.md words (Word for word, small fixes) instead of "clears".

Facts: Facts carried: on your phone by default, only ums and misheard names, never rewrite (all in s04 today). "Every small fix is marked, and you can put it back" is already shown inside the phone on this page (s04 appChanges, appPutBack) and in VOICE.md; it is new only as page text.

### 5. Your voice / Said once  (52 words to 37)

Source: s05 support + s07 card

Before:

> Your voice stays with it.
>
> The recording is kept with every letter you speak. One day Meera can hear how you sounded tonight.
>
> Years from now
>
> Said once. Heard for years.
>
> Open a spoken letter and hear it in the voice that said it, with the words right there on the page.

After:

> Your voice stays with it.
>
> The recording is kept with every letter you speak.
>
> Said once. Heard for years.
>
> Open a letter and hear it in the voice that said it, words right there on the page.

Why: Two blocks that said the same thing twice become one: the keeping, then the hearing. The "one day Meera can hear" line is dropped because "Heard for years" already says it.

Facts: Facts carried: recording kept with every spoken letter (s05); hear it in the voice that said it (s07). Nothing about backup or hearing on another phone (D-085, D-059).

### 6. The book  (27 words to 22)

Source: s06 support

Before:

> A book that grows by month.
>
> Each letter is filed under Meera's age that month and signed with your name. Both parents write in the same book.

After:

> A book that grows by month.
>
> Filed by Meera's age. Signed with your name.
>
> Both parents can add to the same book.

Why: Two short lines, then the co-parent line. Month cards below stay as they are.

Facts: Facts carried: filed by age, signed (s06); co-parent shares the book (BRAND.md pillar 3, D-055). CONFIRM the last line: the coordinator reads v1.0 co-parent as on-device. See open question 2.

### 7. Your language  (19 words to 21)

Source: s08 support

Before:

> Say it in your language.
>
> English, Hindi, Spanish, Mandarin, French, Arabic and Portuguese, each written in its own script.

After:

> Say it in your language.
>
> Seven languages, each in its own script. Your words stay in the language you said them.

Why: The seven names already appear as the example list below, so the sentence stops repeating them and adds the VOICE.md line.

Facts: Facts carried: seven languages, own script (D-056, s08). "Your words stay in the language you said them" is VOICE.md, multilingual rule. No translation promised, no mixing in one sentence.

### 8. Private by default  (48 words to 32)

Source: s09 points (5 lines)

Before:

> Private by default.
>
> Your letters are shared only with the people you invite.
>
> No ads. We never sell your data.
>
> Your letters are never used to train models.
>
> Every letter you have made stays yours to export, any time.
>
> Delete a letter or a recording whenever you like.

After:

> Private by default.
>
> Shared only with the people you invite.
>
> No ads. We never sell your data, and never use your letters to train models.
>
> Yours to export or delete, any time.

Why: Five lines become three: who sees it, what we never do, what you control.

Facts: Facts carried: all five original claims (s09). Export and delete merged into one line without changing either. CONFIRM line 1 for v1.0 (open question 3).

### 9. Pricing (the founder's block)  (80 words to 66)

Source: s10 support (one 75-word paragraph)

Before:

> Two letters free. Then Plus.
>
> Your first two letters are free, so you can try it. After that, Plus membership lets you keep adding letters, backs up every recording, opens Read together after the free sessions and covers every child's book, with the whole family adding letters. $3.99 a month with a 1-month free trial, or $29.99 a year with a 2-month free trial. Every letter you have made stays yours to read, play and export, even if you stop.

After:

> Two letters free. Then Plus.
>
> Your first two letters are free, so you can try it.
>
> Plus lets you:
>
> Keep adding letters.
>
> Cover every child's book with one membership.
>
> Plus Monthly
>
> $3.99 a month
>
> 1-month free trial
>
> Plus Annual
>
> $29.99 a year
>
> 2-month free trial
>
> Bought through the App Store.
>
> Every letter you have made stays yours to read, play and export, even if you stop.

Why: Short lead, two plain benefits, two plan cards, one reassurance line. Only claims that hold for v1.0.

Facts: Prices, trial lengths and the reassurance sentence are verbatim from site.ts and D-082. See the change table.

### 10. Early access (destination)  (24 words to 24)

Source: s11 headline + supportPrelaunch, NotifyForm

Before:

> Tell Meera about today.
>
> {name} is coming to iPhone in the US. Leave your email and we will write once, when it is ready.

After:

> Tell Meera about today.
>
> {name} is coming to iPhone in the US. Leave your email and we will write once, when it is ready.

Why: Already two short sentences. Stays last, with the form directly under it. No change.

### Layout hint for design (not a requirement)

Section 9: lead line, then two side by side plan cards (stacked on phones), the two Plus benefits as a short list above them, the reassurance line under the cards in the quiet text style. Section 4: the three short lines as a list with the promise set apart beneath. Section 8: three lines with the heading above.

## 4. Pricing section: claim by claim (for the founder to confirm)

Source of truth: D-082 (membership), D-083 (open edges), D-085 (backup), D-055 (co-parent only), VOICE.md "Saying what the product does today".

| Claim in the current paragraph | Decision | Why |
|---|---|---|
| "Your first two letters are free, so you can try it." | Kept, verbatim | D-082: first 2 letters per account are free. |
| "Plus membership lets you keep adding letters" | Kept, shortened to "Keep adding letters." | D-082: after the first 2, adding letters needs Plus. |
| "backs up every recording" | REMOVED | D-085: backup through our own service is not in v1.0; v1.0 relies on the person's own iPhone or iCloud backup plus Export, and "backup claims come out of the website and Plus copy until it ships". |
| "opens Read together after the free sessions" | REMOVED | D-082 supersedes the "3 free sessions" rule; D-083: Read together is free for letters that exist, membership gates adding. The sentence is false as written. |
| "covers every child's book" | Kept, reworded to "Cover every child's book with one membership." | D-083 (one pool of 2 free letters across all books) and D-082 (one membership covers the book); confirmed true for v1.0 by the coordinator. |
| "with the whole family adding letters" | REMOVED | D-055: co-parent only at v1.0; other family is a later update, and VOICE.md says no public copy promises family letters. |
| "$3.99 a month with a 1-month free trial" | Kept exactly, set as the Plus Monthly card | D-082, BRAND.md proof discipline (website shows price). "Plus Monthly" is the App Store Connect plan name. |
| "$29.99 a year with a 2-month free trial" | Kept exactly, set as the Plus Annual card | Same. |
| (not in the paragraph) "Bought through the App Store." | ADDED, plain statement of a decided fact | D-082: Apple in-app purchase only. Founder may drop it; it is not needed for the page to work. |
| "Every letter you have made stays yours to read, play and export, even if you stop." | Kept, verbatim | D-082: existing letters always stay readable, playable and exportable. |

Optional, not added: "Read together is free for every letter you have made" (true under D-083, but D-083 is a delegated decision, so left for the founder to opt in); "Family Sharing is on" (D-082, but it is an Apple-side behaviour that counsel should word).

## 5. Same check on the rest of the page

| Where | Text | Status | Action |
|---|---|---|---|
| s10 (above) | backup, Read together sessions, whole family | Stale | Fixed in this proposal. |
| s06 support | "Both parents write in the same book." | Possibly stale | Question 2. Proposal softens to "can add to". |
| s09 point 1 | "shared only with the people you invite" | True in principle; check v1.0 | Question 3. D-087 hides "I was invited" and the Family can read switch in v1.0. |
| comingSoon.trust, hero | "Your letters stay on your phone" | Consistent with D-085 (recordings stay on the phone and in the iPhone backup) | Kept. |
| s05 | recording kept with every letter | True | Kept. Does not claim hearing on another phone (v1.1). |
| s06 month cards | "9 letters", "11 letters", "12 letters" | Numbers in a fictional example | Question 4: label as an example, or keep. |
| s08 language lines | seven sample sentences | True (D-056), but each needs native speaker sign-off per the existing note | Unchanged. |
| welcomeEmail.promises | voice kept with each letter, private, no ads | True | Unchanged. |
| docs/web/copy/BR1-audit.md | rows treating "free, always" as supported | Already marked stale in its own header | A new claims pass is owed; this proposal covers the home page only. |
| Legal pages, Terms 14.1 | "encrypted backup", "extra themes" | Not reviewed here | D-053 note: legal must drop them before publication. Flag to legal. |

## 6. Microcopy

### (a) Scroll nudge button, bottom right

| Part | Copy |
|---|---|
| Visible label | Early access |
| Accessible name (aria-label) | Go to the early access sign-up |
| Behaviour note | Moves the visitor to the sign-up (section 10) and puts focus on the email field. Hidden once the sign-up is on screen. Quiet, no animation for reduced motion, no count, no pulse. |

Alternatives if "Early access" tests as unclear: "Keep me informed" (matches the header pill and the form button today).

### (b) Share with a fellow parent (subtle text control near the sign-up, below the form)

| Part | Copy | Notes |
|---|---|---|
| Button label | Share with a fellow parent | Replaces "Share with friends and family"; said plainly, no exclamation. aria-label same as label. |
| Share sheet title | {name}, the baby memory book | Same as today (shareTitle). |
| Share sheet text | Coming soon to iPhone: the baby memory book you fill by talking. Every word kept exactly as you said it. | 19 words. Honest about status (not yet released), makes no privacy or price claim, does not ask for anything. |
| Share sheet url | The plain site address | No tracking code, referral id or count, as ShareButton.tsx does today. The page makes no promise about tracking; it simply does none. |
| Copy-link confirmation (live region, polite) | Link copied. | Today: "Link copied". Shown for about 3 seconds. |
| Failure state (no share sheet and no clipboard) | That did not copy. Here is the link: | Followed by the address as selectable text, so the person can copy it by hand. Today the failure is silent. |
| If the person closes the share sheet | nothing | Not an error. |

## 7. Open questions for the founder

1. Pricing: are you happy to drop backup, the Read together limit and the whole-family line, as in the table in section 4? Add the optional "Read together is free for every letter you have made"?
2. Book section: at v1.0 is the co-parent writing into the same book on the same phone only, or on their own? "Both parents can add to the same book" is true for the first, and is the VOICE.md and BRAND.md wording; if neither is shipping at launch, the line goes.
3. Private section: "shared only with the people you invite". D-087 hides invite flows in v1.0. Keep, or change to "Shared only with your co-parent, if you choose"?
4. The month cards show 9, 11 and 12 letters for the film's family. Label them "An example", or leave?
5. Keep "Bought through the App Store." on the pricing cards?
6. Scroll nudge label: "Early access" or "Keep me informed"?
7. Counsel: trial and renewal wording on the website (D-083 lists it as needing sign-off); the claims registry should get the new pricing and backup lines before they go live.
