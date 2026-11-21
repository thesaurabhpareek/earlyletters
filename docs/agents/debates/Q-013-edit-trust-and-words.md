# Q-013: How the app talks about its edits, and the Review screen's trust model

Prepared 4 Oct 2026 by the content and trust debate lane. It prepares the decision; the founder decides. Nothing here is built.
Id note: PRs #84 and #85 also took Q-013. The coordinator renumbers at merge (this entry has no other dependency on its number).
Baseline: `origin/develop` at cfdca3f. The critiques are of `origin/qa/journey-flows` (PR #83), which is older than develop, so section 2.2 lists what develop already fixed. Backlog tasks BL-375, BL-376, BL-377, BL-393, BL-395 and founder question FT-54 are from PR #86 (not merged). Standards (WCAG, Apple HIG) were not fetched: the sandbox blocks w3.org (HTTP 403 through the proxy), so they are cited as unverified and the repo's own tokens are the working standard.

- **Raised by:** product, design and quality critiques (`docs/release/journey/critiques/*.md|json` on PR #83): steps J01-04, J05-03, J06-01 to J06-13, J09-04, J09-05, J10-01, J10-09, J10-10, J14-01.
- **Affected:** content (VOICE.md, BRAND.md glossary, `strings.en.ts`), mobile (Review, letter page, Settings), design (COMPONENTS 2.19), speech, legal-alignment (in-app disclosure text), translators, QA.
- **Status:** Escalated to the founder (it refines D-074 and touches what the app promises about the parent's words).

## 1. The question

D-074 named the feature "Word for word". What are the exact words, defaults and screens by which a tired parent understands, in one glance, what the machine did to their letter, can undo any of it in one tap, and is never left stuck when the words are wrong, empty or not ready?

## 2. Facts

### 2.1 Decided already (this entry does not reopen these)
- Constitution (CLAUDE.md): the machine may remove and repair, never add meaning; every edit goes through `verifyEdits` (`packages/core/src/verify.ts`); `raw_transcript` is immutable; every edit is stored and reversible; no feature writes, summarizes or shapes words; never imply AI writes.
- **D-074** (founder, 3 Oct 2026), exact text: "the feature is named 'Word for word'. 'Lightly tidied', 'Tidying' and other words that suggest software tidied a letter leave the product (VOICE.md)." Effects: the content lane renames the CA-027 strings and updates the glossary.
- D-057 typed text is never rewritten; D-056 seven spoken languages, UI English only for now; D-065 and D-046 models download on demand from our own host; D-003 analytics are opt-in. ADR 0003 decision 1: v1 edits are rules only, no model pass. Tagline "Exactly as you said it." is locked (`docs/brand/BRAND_SYSTEM.md:195`).
- Edit types (`packages/core/src/types.ts:12-19`): `filler`, `false_start`, `repeat`, `stt_fix`, `punctuation`, `agreement`, `paragraph`. The review label adds a kind `script` (`lang/script.ts:78`). Level `clean` allows all seven; `verbatim` allows only `stt_fix` and `punctuation` (`verify.ts:38-41`). Only English runs at `clean` today (`transcription-queue/clean.ts:17`).

### 2.2 Critique findings that develop already fixed (stale in the critiques)
- "Lightly tidied" and "Tidying" are gone from user-facing copy: `strings.en.ts:255-263` ("Word for word, small fixes marked"), `:383` ("Spoken, word for word"), `:628-631`, promise at `:61-66`. The rules test blocks `tidy*` and "cleaned up" (`rules.test.ts:729`). FT-54 as written ("still on about fifteen screens") is out of date; what is left to decide is below.
- Review already has Try again and Type instead for a failed job, a language-pack waiting card with progress, Wi-Fi hold and no-space lines (`review.tsx:~700-760`, `words.en.ts`), and a Keep my voice path. Marks have a 44 pt hit area (`transcript.tsx:26`), buttons have a 44 pt floor (`button.tsx:55`).

### 2.3 Still true on develop
1. **The idiom collides with the name.** "Word for word" means verbatim in English, yet it captions text that has fixes (`strings.en.ts:255,259,263,383`). The promise screen says "Word for word: we fix only what the microphone got wrong. A stray um..." (`:63`): an um is what the parent said, not a microphone error. The OFF state is "Exactly as said" (`:630`), which a parent reads as the same thing.
2. **"Exactly as said" is sometimes untrue.** `provenanceOf` returns `spokenExact` whenever `editLevel === 'verbatim'` (`chapters.ts:84`, same in `export/build.logic.ts:154`), and `verbatim` still applies name and punctuation edits. A Hindi letter with added full stops is labelled "Spoken, exactly as said".
3. **"Undo every fix" cannot be undone.** `wordForWord()` sets `applied` to `[]` and level to `verbatim` (`review.tsx:248-257`); the cleaning effect depends on `raw`, not `applied` (`:156-159`), so nothing re-applies them. It sits next to a view toggle with the same link style (`:624-633`).
4. **Settings has no switch.** `tidyOn` and `tidyOff` (`strings.en.ts:629-630`) are unused; `recordings.tsx:51` shows one static row. The default is hard-coded per language.
5. **Words that arrive later are fixed unread.** `deliver()` cleans a waiting letter's words with no person looking (`transcription-queue/index.ts:451-458`), and the letter page has no marks, no put-back and no edit (`letter/[id].tsx`, no edit code; only a whole-text toggle at `:200-207`). The promise "read each letter and fix anything we got wrong" (`strings.en.ts:702`) is half true.
6. **The waiting and silent letter is a dead end.** The page shows one italic line (`letter/[id].tsx:170-176`), then Add to book and Delete. No type, retry or reason.
7. **Labels are jargon.** "Filler", "False start", "Small slip" (`strings.en.ts:283-318`). The card's second caption is the long "Word for word, small fixes marked" (`review.tsx:566`). The follow-up "Tap any word to change it" has nothing tappable (`:669`).
8. **Review controls.** Under the card: one count line, up to n fix rows, two links, Change words, a question with two buttons, a help line; then a two-button footer (`review.tsx:600-700`). The "Does this sound like you?" answer is written to the entry (`:317`) and it is synced and exported (`sync/merge.ts:188`, `export/build.logic.ts:495`), but no screen reads it (grep of develop, 4 Oct). Analytics already carry `machine_edit_reverted` and `review_action` (`TRACKING_PLAN.md:55,140`).
9. **Type sizes.** First note body is `text-sm` (14), trust line `text-base` (16) muted (`review.tsx:462,472-486`); token floor is 13 (`minFontSize`). Mark stroke is a literal 2 (`transcript.tsx:58`) while `tokens.stroke.editMark` is 1.5.
10. **First night.** The English model is 574,041,195 bytes and nothing ships inside the app (`models/catalog.ts:7,134`); cellular is refused above 5 MB (`packs/engine.ts:43,555`). The language step does not show the size (quality J01-12). Marks are not capped: the verifier ceiling covers model edits only (`verify.ts:542`), and punctuation edits get a mark too (`pipeline.ts:169-181`). How many marks a real letter gets is unmeasured.

### 2.4 Open
Exact words for the noun and the two views (FT-54); whether the count shows; the default and its persistence; later-arriving words; the wrong, empty and not-ready states' actions; first-night download consent.

## 3. The one word

| Word | Verdict | Why |
|---|---|---|
| tidied, tidying, cleaned (up) | No | D-074 and VOICE.md:44 ban them. They judge how the parent talks. |
| corrected, improved, polished, edited | No | Say the parent was wrong, or that software shaped the words. "Edited" is also in `editA11yHint` (`strings.en.ts:269`) and is read aloud on every mark. |
| repaired | Docs only | The constitution's word, accurate for a name or comma, but "repair" says something broke. Heavy for an um. |
| kept exactly | Raw side only | It names the untouched state, not the act. Use it for "Exactly as said" and only when it is true (2.3 item 2). |
| **small fix** | **Yes** | Plain, small, already in VOICE.md and the UI. Residual risk: "fix" implies a mistake. We reduce it by naming each fix by what happened ("Took out an um"), never by category. |

One noun (small fix), one raw view ("Exactly as said"), one feature name ("Word for word", used where the feature is named: promise, Settings, store, website). The idiom is not used to caption fixed text.

## 4. Options for the trust model

### A. Finish what develop has (copy stays, fix hierarchy only)
- **Product:** least change; D-074 strings already in.
- **Design:** enlarge marks, trust note and rows (BL-395) without changing controls.
- **Content:** keeps "Word for word, small fixes marked" as caption.
- **Red team:** (1) the idiom still captions fixed text, and the OFF label still sounds the same as the ON label, so the trust screen stays ambiguous; (2) "Undo every fix" stays one-way and next to a view toggle; (3) provenance stays untrue for non-English letters; (4) nothing reaches the dead ends. It polishes the surface of a screen whose model is unclear.

### B. Say what happened, in plain words, with one reversible control (recommended)
- **Product:** the default stays "fixes on, marked" (the heirloom reads smoothly, nothing is hidden). One segmented control, "With small fixes | Exactly as said", is both the view and the permanent choice for this letter, and it is reversible until save.
- **Design:** the removed words show inline struck through, so before and after is visible without opening anything. Fewer links under the card.
- **Content:** each fix is named by what happened. The name "Word for word" appears once as a name; elsewhere we say what is true.
- **Legal/privacy:** claims stay checkable: "nothing added" is what the verifier enforces; "exactly" is used only when raw equals final. The in-app disclosure text (first note, promise) goes to legal-alignment.
- **Engineering:** M. Segmented control state, provenance rule, a Settings switch, a letter-page waiting card.
- **Red team:** (1) a global default of "fixes on" is still a machine choice made for the parent: mitigated by the switch, the per-letter control and the marks, and measured by `machine_edit_reverted` once the beta opts in; (2) struck-through words add visual noise on a letter with many punctuation marks: mitigate by measuring marks per 100 words before shipping (2.3 item 10); (3) "small fix" for a punctuation edit is a stretch, but it is still a change to their words and must be visible; (4) a segmented control hides whether partial put-backs happened: derived state, count line tells the truth; (5) six languages need translators for a feature name that is an English idiom.

### C. Raw first: fixes are suggestions the parent accepts
- **Product:** strongest honesty; the parent decides every change like spellcheck.
- **Legal/privacy:** best against any "exactly" claim.
- **Red team:** (1) a tired parent at night must tap through marks or ship an um-filled letter into a book meant to be read for years; (2) the product's felt value, a letter that reads like them without effort, drops; (3) voice-only letters that finish later have no reader, so they stay raw forever or revert to silent fixing; (4) it contradicts "the machine may remove and repair", which the constitution allows by default as long as each edit is shown and reversible. Reject for v1.0; revisit if the beta shows a high revert rate.

## 5. Recommendation: B

Reasoning: the constitution allows fixes if they are visible and reversible, so the job is to make "visible and reversible" understood in one glance, and to stop the copy saying "exactly" where it is not. B does that with the fewest new controls (it removes more than it adds).

### 5.1 Sub-decisions
| Topic | Recommendation |
|---|---|
| Count | Show it, as a plain sentence, never a badge or colour, never on Book cards. Zero has three honest wordings (below). |
| Before and after | Removed words struck through inline; replaced words dotted-underlined; tap opens the card "You said / Now it reads" with Put it back. A row per fix is the 48 pt target and the VoiceOver path. |
| Default | Spoken English: fixes on and marked. Typed: never touched (D-057). Other languages: names and punctuation only, so no "Nothing needed fixing" claim there. |
| Keep exactly as I said | The segment "Exactly as said": one tap, reversible, replaces "Undo every fix". A Settings switch sets the default for new letters. |
| Later-arriving words | Arrive "Exactly as said". The card says "Words are ready. Read it back." and opens Review with fixes proposed. Nothing is fixed unread. (Effort: Review reads a draft today; making it open a saved letter is unverified, ask the engineer.) |
| Wrong words | Hear it, then Change words (autosave, BL-377). Rename the follow-up so it points at a real control. |
| Empty, failed, not ready | Always one primary action plus a reason line (table 5.3). |
| Drop a control | Remove "Does this sound like you?" from Review for v1.0 (the field stays null; the column and export keep working). |

### 5.2 Exact English strings (straight quotes only; buttons at most 22 characters)
Keys are `packages/content/src/strings.en.ts` unless noted. `{child}`, never gendered. No "edit", "correct", "clean", "tidy" in user-facing text.
- `onboarding.promise.body`: `This is Word for word. We take out a stray "um", fix a misheard name, add a missing comma, and mark every small fix so you can undo it.` (`body2` stays.) The tagline title stays.
- `review.subtitle`: `Here is what you said. Small fixes are marked.`
- `review.trustLine`: `We only fixed what got in the way of your words. Nothing added.` (unchanged text, larger type)
- `review.firstNote.body`: `We take out small slips, like an um or a repeat, and mark each one. Tap a mark to see it and put it back. We can mishear a name, so please read it before you save.`
- `review.view.fixes`: `With small fixes`; `review.view.exact`: `Exactly as said`.
- `review.changesLabel`: `{count} small fixes`; `changesLabelOne`: `1 small fix`.
- `review.noChanges` (nothing was fixed): `Nothing needed fixing. This is exactly what you said.`
- `review.noChangesAfterUndo` (new): `You put every small fix back. This is exactly what you said.`
- `review.noChangesNoRules` (new, languages without fix rules): `Exactly as you said it.`
- `review.cardYouSaid`: `You said`; `review.cardNowReads` (replaces `tidiedLabel`): `Now it reads`; removal: `Taken out`.
- `review.editA11yHint`: `Small fix. Double tap to see what you said.`
- `review.voiceCheck.*`: removed (the five strings).
- `settings.tidyLabel`: `Word for word`; `tidyOn`: `Small fixes, marked`; `tidyOff`: `Exactly as said` (existing, now used by a switch titled by `tidyLabel`).
- `book.provenance.spokenTidied` (rename key to `spokenFixed`): `Spoken, with small fixes`; `spokenExact`: `Spoken, exactly as said`; `typed`: `Typed`.
- Waiting and silent letter (`book.waiting.*`, new): `reason` lines reuse `wordsCopy.pack.*`; `writeButton`: `Write the words`; `retryButton`: `Try again`; `readyButton`: `Get words ready`; `recordAgainButton`: `Record again`; `readItBackButton`: `Read it back`; `readyBody`: `Words are ready. Read it back.`
- Silent recording: the line is in Q-013 (quiet day, PR #84)'s app-voice decision; this entry only adds the actions.

| `EditType` / kind | Row label (what happened) | Row shows | Card explain |
|---|---|---|---|
| `filler` | `Took out a sound` | `um` struck through | `You said um or uh. We took it out.` |
| `false_start` | `Took out a restart` | `she was,` struck | `You began a sentence, then began again. We kept the second try.` |
| `repeat` | `Took out a repeat` | `the` struck | `A word came out twice in a row. We kept one.` |
| `stt_fix` | `Spelled your way` | `Usher` to `Asha` | `The microphone misheard a name. We used the spelling from your words list.` |
| `punctuation` | `Punctuation` | `.` or `,` | `We added commas and full stops where you paused.` |
| `agreement` | `One word fixed` | `she have` to `she has` | `A tiny slip of the tongue, like "a apple". We fixed only that.` |
| `paragraph` | `New paragraph` | a break mark | `You took a long pause, so we started a new paragraph.` |
| `script` | `Your script` | the character | `We wrote a character the way your chosen script writes it. It is the same word.` |

Six other languages (hi, es, zh, fr, ar, pt): the UI is English only in v1.0 (D-056). These strings go to native-speaker translators, never machine rewriting, with a glossary note: "Word for word" is a feature name and an English idiom, so translators should choose a name that works in their language, not translate literally; "small fix" and "Exactly as said" have fixed meanings; give a length allowance for the 22-character button rule; Arabic mirrors the segmented control and the struck-through text must follow script direction. Pending the native-speaker programme (Q-006 pm-1 reply).

### 5.3 States
| State | Reason line | Actions |
|---|---|---|
| Words coming (model downloading) | `Getting ready, {n}%` / Wi-Fi / space lines (exist) | Keep my voice, Type it instead (exist) |
| Model not on the phone, first night | Size and Wi-Fi shown before any download starts (BL-375) | Get words ready, Keep my voice, Type it instead |
| Failed | `The recording is safe on this phone. You can try again or type it.` (exists) | Try again, Type instead |
| Nobody spoke | `No talking in this one` (exists) | Try again, Record again, Type it instead, Keep the recording |
| Waiting, saved letter | `A recording, waiting for its words.` (exists) plus the reason | Write the words, Try again or Get words ready |
| Words wrong | none | Hear it, Change words |

### 5.4 Layout, using existing tokens
- Trust line: `subhead` 16/21 in `text` colour (was `textMuted`). First note: title `headline` 18/23, body `subhead` 16/21, "Got it" Button `sm` (44 pt = `target.min`), card `radius.lg` 20.
- View control: full width under the card, height `target.min` 44, `radius.pill`; selected = `accentSoft` fill, `accent` edge `stroke.selected` 1.5, and a check; unselected = `controlBorder` 1.
- Marks: stroke `tokens.stroke.editMark` 1.5 in `editMark` (5.82:1 light, 7.64:1 dark per tokens); struck text in `letterBody` 20/32. Fix rows min height 48 (`space[10]`), chevron, label `labelSmall` 16, original in `footnote` 14. The inline mark's own hit area is a bonus (the WCAG inline-target exception is unverified); the rows meet 44.
- Footer unchanged in size (primary `lg` 56 = `target.primary`, Keep private demoted to a quiet `sm` 44), so about 128 pt plus inset. The gain is under the card: from nine controls to the view control and Change words. At AX text sizes only the primary stays pinned.
- Edit mode: `letterBody` serif explicitly (not a class that may fall back), `radius.sm` 8, focus ring `tokens.focusRing` (2, offset 2) in `focus` (#2F6F8F light, #8CC4DE dark), `Done` as a `sm` Button in the header row where Close was, edits autosaved. The critique saw a browser default font and square amber outline on web; confirm on a device (possible web artifact).
- Waiting card: stacked full-width `md` buttons (48), primary first.

## 6. Cost, risks, what changes my mind
- **Cost:** S for strings and provenance; M for Review and the letter page; S for the Settings switch; M for tests. About 5 to 7 engineer-days by my estimate (not measured). Translators add a later cost.
- **Risks:** the brand promise "Exactly as you said it" and the feature name "Word for word" both lean on "exactly" while ums are removed; the marks, the count and the one-tap raw view are the defence, and legal-alignment should read the promise and first note (AI counsel support, not legal advice). Marks per letter are unmeasured.
- **Would change my mind:** beta data (opt-in) showing a revert rate above about one in five fixes by type moves me to option C for that type; a measured median above about 10 marks per 100 words moves me to counting only word-changing fixes in the line; an engineer finding that reusing Review for saved letters is L moves later-arriving words to "apply fixed, show marks on the letter page".

## 7. Change list for a build agent (after the founder says yes)
1. `packages/content/src/strings.en.ts`: change/add the strings in 5.2; rename `tidiedLabel` to `cardNowReads`, `spokenTidied` to `spokenFixed`; remove `review.voiceCheck`. `packages/content/src/features/words.en.ts`: add `book.waiting.*`, Nobody-spoke actions. `VOICE.md` and `BRAND.md:94`: record "small fix", "Exactly as said", where "Word for word" is used.
2. `apps/mobile/src/app/review.tsx`: segmented view control (derived state; stash undone edits in a ref so the toggle is reversible), delete `wordForWord`'s one-way path, drop voice-check, larger note and trust line, `Done` in the header, autosave (BL-377). `components/capture/transcript.tsx`: struck removals, `stroke.editMark`. `components/book/chapters.ts:84` and `lib/export/build.logic.ts:154`: `spokenExact` only when `finalText === rawTranscript`.
3. `apps/mobile/src/app/letter/[id].tsx`: waiting and silent cards with actions; subscribe to the store (quality J10-01). `lib/transcription-queue/index.ts:451`: later words stored with no fixes applied and flagged `readItBack`. `settings/recordings.tsx` and `lib/settings`: the switch, read by Review's initial level.
4. Tests:
   - `packages/content/test/rules.test.ts`: extend the glossary test to ban `edit(s|ed)`, `correct(ed|s)`, `clean(ed|s|ing)`, `improv*` in `en.review`, `en.onboarding.promise`, `book.provenance`, `features.words|speech`; a new test that "word for word" appears only on the allowlisted paths; the existing 22-character button rule covers the new buttons.
   - `apps/mobile/test`: provenance cases (verbatim with punctuation edits is "with small fixes"); a pure test that the view toggle round-trips; waiting-letter state actions per job state.
   - Journey flows (PR #83): J06 `j06-review.flow.ts` currently clicks "Keep it word for word" and "Show tidied" (`:30-33`), which no longer exist on develop. Switch to testIDs (`review.view`, `review.fixRow`), assert the count line, toggle to Exactly as said and back, bounding boxes at least 44 pt for every button and link, first-note computed size at least 16, edit field outline colour and serif family, and that no step text contains "tidy". J10 `j10-letter.flow.ts:19,53-55`: replace "Show tidied", assert Write the words, Try again or Get words ready on the waiting letter, Record again on a silent one, and the provenance line. J09-04, J09-05 and J14-01 (model row with a Download button) follow BL-375/376.
5. If any `en.review` copy changes, the Maestro flows E2E-03 use testIDs (`review.keepVoice`) and need no change.

## 8. Questions only the founder can answer
1. **A or B.** Where "Word for word" appears: (A) also as the Review caption and letter provenance, as on develop today; (B, recommended) only where the feature is named (promise, Settings, store, website), with plain words elsewhere.
2. **Yes or no.** Is "small fix" the noun for each single change (the FT-54 answer)? If no, give the word; "small change" is the only alternative I would defend.
3. **Yes or no.** Add the Settings switch (default on) so a parent can make "Exactly as said" the default for new letters in v1.0?
4. **A or B.** Words that arrive later: (A, recommended) shown exactly as said until the parent reads them back; (B) fixed silently, with marks and put-back on the letter page.
5. **Yes or no.** Remove "Does this sound like you?" from Review for v1.0?
6. **A or B.** First night: (A) ask at the language step, with size and Wi-Fi ("Get words ready", 574 MB, Wi-Fi only); (B) leave the first download to the first Review as now.
7. **Yes or no.** May legal-alignment review the new promise and first-note text before it ships (it is disclosure text)?
