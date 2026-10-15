# Experience pass, October 2026

v1.0, 2026-10-15. Status: **spec for build, not merged**. Branch `docs/experience-pass-oct`, into `develop`.
Scope: the app as it is on `develop` (on-device v1.0). Sign-in, sync, co-parent sharing and backup surfaces (the Family tab, the invite sheet, the "Write this book together" row, "I was invited", "I already have a book") are **held: scope decision pending**. They are listed where they appear and are not redesigned.

The founder's brief, in one line: some screens sound machine-made ("We ask everyone the same question."), several screens do not meet the bar the website set, and the app should feel like a journey, with light, motion and pictures where they earn their place, built with a premium product mindset.

This document is the one spec an engineer builds from. It merges four critiques (copied for traceability in `docs/design/experience-pass/critiques/`), decides where they disagree, and rejects what breaks the constitution, the content rules or the brand system.

**Files in this pass**

| Path | What |
|---|---|
| `docs/design/EXPERIENCE_PASS_2026-10.md` | This spec |
| `docs/design/experience-pass/critiques/01-product-ux.json` | Product and UX lens (49 screens) |
| `docs/design/experience-pass/critiques/02-content-voice.json` | Content and voice lens (51 screens) |
| `docs/design/experience-pass/critiques/03-visual-motion.json` | Visual and motion lens (46 screens) |
| `docs/design/experience-pass/critiques/04-states-errors.json` | States, errors and empathy lens (50 screens) |
| `docs/design/experience-pass/before/*.jpg` | Nine contact sheets of the "before" screens, cut from the journey record, so a reviewer can see what each section changes without checking out another branch |

**Sources read for this pass.** On `origin/develop` (56ec5b5): `CLAUDE.md`, `packages/content/VOICE.md`, `BRAND.md`, every copy file in `packages/content/src`, `docs/brand/BRAND_SYSTEM.md`, `docs/design/DESIGN_LANGUAGE.md`, `MOTION.md`, `COMPONENTS.md`, `BENCHMARK.md`, `packages/design-tokens/src/tokens.ts`, `docs/legal/ENGINEERING_REQUIREMENTS.md` (LEGAL-REQ-002, -003), `docs/legal/in-app-disclosures.md`, `docs/prd/PRD.md` (K-07, PRD-REQ-019, the A-REQ table), `docs/DECISIONS.md` (D-026), the gate, onboarding and Tonight code, `apps/mobile/src/app/_layout.tsx`, the e2e-web flows. PR #99 (`feat/mobile-calm-brand`, open): `lamp.tsx`, `lamp.logic.ts`, `quote-pair.tsx`, `tokens.atmosphere`, MOTION 5k, its before and after captures. On `origin/main` (69299f8): `apps/web` `Aurora.tsx` and its CSS, `globals.css`, the drawings in `apps/web/src/components/drawings`. The journey record on `origin/chore/journey-refresh` (b7afe42): `INDEX.md`, all 147 `steps/*.json`, and the screenshots for every distinct screen, light and dark (the nine sheets in `before/` are the ones looked at for this spec, on top of the four lenses' own looks).

**How to read a screen entry.** Copy tables use these marks: **KEEP** (same key, same words), **CHG** (same key, new words), **NEW** (new key), **RET** (no longer shown; the key stays until package P7 deletes it, so nothing breaks in between). `{app}` comes from `packages/brand`; `{child}`, `{signsAs}`, `{month}`, `{size}`, `{date}`, `{n}` are filled at runtime. Every button label is 22 characters or fewer with the Asha fixtures. Screenshot references are to `docs/release/journey/screens/<id>.png` on `origin/chore/journey-refresh` (b7afe42); PR #132 takes the journey screens out of git on `develop`, so that branch is where they stay readable.

**Benchmark marks.** *verified* = read from the primary source today (15 Oct 2026). The HIG quotes in this spec were re-read for this spec from Apple's documentation JSON (`developer.apple.com/tutorials/data/design/human-interface-guidelines/<page>.json`: onboarding, launching, writing, alerts, feedback, loading, progress-indicators, motion, settings, entering-data, privacy). Quotes the lenses cite from other HIG pages (modality, pickers, managing notifications, tab bars) are marked *verified by the product lens* where used. *repo-verified* = recorded as read from the primary source in `docs/design/BENCHMARK.md` or `MOTION.md`, not re-read today. *memory, unverified* = recollection only: dayoneapp.com, apple.com, headspace.com, calm.com, culturedcode.com, bear.app, overcast.fm, tinybeans.com, qeepsake.com and huckleberrycare.com did not resolve from this sandbox today. The HIG in-app purchase page returned 404 to the product lens, so it is cited from memory.

---

## 0. The biggest changes, in brief

1. The line "We ask everyone the same question." is gone. The age question stays the first screen on v1.0 (the law and PRD-REQ-019 say so), but it now opens in the launch screen's room: the opening quotation pair, the lamp light, one question, two equal answers. Moving it behind the welcome is specified and held for the founder and counsel.
2. First run becomes one lit room and one object. The lamp arrives at the gate and stays lit across first run. A paper **book cover** appears when the child is named, is signed on the next step, and opens on "The book is open."
3. The promise screen shows a small fix instead of describing three: a sample sentence with two marks you can tap and put back. It goes from about 110 words to about 60.
4. "We", explaining why we ask, and repeated reassurance come out of more than 40 strings. The three sanctioned promises ("We never rewrite your words.", the trust promise, the voice promise) and counsel-registered disclosure text stay word for word.
5. Tonight leads with one question. The second question, the subtitle, goes. The prompt becomes the one big literary line on lamp-lit paper, and the lamp's colour follows the time of day (gold in the morning, amber in the evening, a rose and dusk tail late at night), as the website's light follows the scroll.
6. Every unfinished letter shows on Tonight as its own card with the person's first words, not one generic "A letter is waiting" line.
7. A save files the letter into its month: "Filed in Month 7", then the card arrives in the Book with a soft wash (MOTION 5e, finally built). No more ghosted text.
8. Review reads like the website's proof letter: a letter sheet with a "TO ASHA · MONTH 7 / FROM MAMA" header, marks drawn the website's way, the fix list folded behind one row. Typed letters skip Review entirely.
9. The Book reads as chapters: month openers with a large numeral and a date range, a lit current month, excerpts that fade instead of ending in a cut-off glyph, and a card that grows into its page.
10. Read together turns pages sideways, holds a still dusk light at night, and ends on the moon drawing and stillness.
11. Every unhappy state names its real cause and gives one way forward. The microphone-denied screen no longer covers "busy" and "phone full". Delete returns to the Book with Undo instead of a dead page. The crash and launch screens render in the brand faces.
12. Settings looks and behaves like iOS Settings: the early-version note moves to About, the privacy promise appears once, long content pushes to its own page, and Plus names its plans the way App Store Connect does.

---

## 1. Principles

Ten rules, merged from the four lenses. Each names its benchmark and how it was checked.

| # | Rule | What it means on screen | Benchmark |
|---|---|---|---|
| 1 | **Arrival before admin, and the law first.** The first frame is the brand's room. A required question is asked in that room, with nothing around it. Nothing is asked that the first letter does not need. | Gate in the launch screen's room; no setup beyond name, date and signature; the download is an offer, never a wall. | HIG Onboarding: "Postpone nonessential setup flows or customization steps." and "Don't let large downloads hinder onboarding." HIG Launching: "Design a launch screen that's nearly identical to the first screen of your app or game." (*verified*) |
| 2 | **Say the thing, never why.** No "we ask", no "we sort", no preamble, no reassurance padding. "We" appears only in the three sanctioned promises and in counsel-registered disclosure text. | Help lines that justify a field are deleted. Errors say what happened and what to do. | HIG Writing: "Avoid using *we* altogether because it may be unclear who the 'we' in question refers to." and "Check each word to be sure it needs to be there. If you can use fewer words, do so." HIG Alerts: "Avoid explaining alert buttons." (*verified*) |
| 3 | **One job, one primary action, one literary line.** Each key screen has one Literata line big enough to carry it, one primary action in the thumb zone, and quiet alternatives beneath. Two serif lines never compete; two questions never stack. | Tonight's prompt, "The book is open.", the letter itself, a month numeral. | The website hero on `origin/main` (one serif line on the lamp light, read); HIG Onboarding: "design a flow that's fast, fun, and optional" (*verified*); DESIGN_LANGUAGE principle 3, "Quiet UI, loud letters" (repo). |
| 4 | **Show, do not tell. The person's own words and the product's own objects are the pictures.** A sample you can tap, the held letter itself, the book cover with the child's name, the product's own line drawings. No stock photographs, no faces, no mascot. | Promise specimen, Plus gate held letter, book cover, export cover thumbnail. | HIG Onboarding: "Teach through interactivity." (*verified*); the website ProofLetter (read on `origin/main`); DESIGN_LANGUAGE 9, "No stock baby photos, anywhere" (repo); Day One "On This Day" resurfaces your own entries (*repo-verified*, BENCHMARK S6). |
| 5 | **One light per room, never on a voice or a problem.** The lamp (PR #99) lights paper behind arrival, first run, Tonight, Write and the Book, tinted by the time of day. A still dusk pool may sit low behind Read together's controls at night. It never sits behind a recording being made, a letter page, an error, a sheet that sells, or the brand mark. Its strength is capped so every text colour keeps 4.5:1. | See the scene table in section 5.2. | The website `Aurora.tsx` (amber to rose to dusk, read); HIG Motion: "Add motion purposefully, supporting the experience without overshadowing it." (*verified*); MOTION 5k and the atmosphere contrast test on PR #99 (repo). |
| 6 | **Motion is the receipt and the map.** Commit first, then move. A save files into its month, a card grows into its page, pages turn sideways, a deleted card leaves its row. Every sequence is under 900 ms, any tap skips it, and controls are opaque and hittable from the first frame. | MOTION 5e, 5f and a new page turn, built as specified. | HIG Motion: "Aim for brevity and precision in feedback animations." and "Let people cancel motion." (*verified*); Things 3 in-place expansion (*repo-verified*, MOTION M13); the website's "Filed in Month 9" card (read). |
| 7 | **Stillness where people speak, read or struggle. Every layer has a still twin and a plain twin.** On Listen only the voice moves the aura. On the letter page and in errors nothing loops. Reduce Motion turns every arrival into one 200 ms fade and shows drawings complete. Increase Contrast and Reduce Transparency show plain paper. | The table in section 5.6. | HIG Motion: "Make motion optional." and the caution on oscillation "around 0.2 Hz" (*verified*); Calm's slowest breathing pace, 8 a minute (*repo-verified*, MOTION M10). |
| 8 | **Honest states.** Name the real cause; never reuse one state for another problem; one primary action and at most one quiet escape; Undo for what can be undone, a confirm only for what cannot; a toast states what just happened and is replaced, never stacked or contradicted; after a kill or crash, put people back where they were. | Mic off, mic busy and phone full are three screens; delete uses Undo; erase uses a sheet. | HIG Writing: errors should "avoid blame, and be clear about what someone can do to fix it." HIG Alerts: "Avoid displaying alerts for common, undoable actions, even when they're destructive." HIG Feedback: "Warn people when they initiate a task that can cause data loss that's unexpected and irreversible." HIG Launching: "Restore the previous state when your app restarts." (*verified*) |
| 9 | **Settings feel like Settings; gates are honest; doors are equal.** Grouped inset lists, one switch per decision, long content on its own page. The Plus gate shows what stays free and where the letter waits, and Apple's sheet shows the price. Speak and Type stay identical twins. No streaks, counts of gaps or urgency anywhere. | Settings home, Plan, Reminders, Keep needs Plus. | HIG Settings: "Minimize the number of settings you offer." and "Put general, infrequently changed settings in your custom settings area." HIG Onboarding: "Prefer letting people experience your app or game before prompting them for ratings or purchases." (*verified*); Overcast Premium's one plain screen (*memory, unverified*). |
| 10 | **One name per thing, US English, lean by construction.** letter, the book, Month N, small fix, Read together, Plus Monthly and Plus Annual, this phone, message (never note) for what the app sends. license, period, cellular data, right away, Mommy. Nothing new in the binary: no Skia, Lottie, Rive or gradient package; every change states its bytes against D-065. | Glossary fixes across the copy package; section 5.7 size budget. | BRAND.md glossary, D-077, D-087 (US storefront only) (repo); MOTION 9 "none in v1" (repo); HIG Writing: "Build language patterns. Consistency builds familiarity." (*verified*). |

---

## 2. The age question

### 2.1 What the law and our decisions require

The journey record labels the gate "A-REQ-030". That is a mislabel: A-REQ-030 in `docs/prd/PRD.md` and `docs/prd/A-entry-and-auth.md` is "Offline entry". The age question's real sources are:

- **LEGAL-REQ-002 (P0)**, `docs/legal/ENGINEERING_REQUIREMENTS.md`, revised 2 Oct 2026, sourced to CR-001, CR-004 (Texas SB 2420 in force; Apple Declared Age Range), CR-005, CR-006. It requires: the app "asks before first use (an entry gate before first run, invites and sign-in)", "presented neutrally (no pre-selected answer, no hint that one answer is 'right')"; acceptance criterion 1: "When the user takes any first action (start a book, I was invited, sign in, or an invite link), Then the age question appears first, with nothing preselected"; a stop screen that "explains the app is currently for adults 18 and over"; nothing stored but the gate state; closed for 24 hours after an under-18 answer; the Declared Age Range API called where required and used in memory only.
- **PRD-REQ-019 (P0)** and **K-07**, `docs/prd/PRD.md`: "Before any first-run screen, story 4 action or invite flow, a neutral 'Are you 18 or older?' (Yes, No, nothing preselected)". Yes is stored as a boolean only.
- **D-026**, `docs/DECISIONS.md`: `ageGate.passed` after Yes, `ageGate.stoppedAt` after No, no instant retry, "the gate is a root-level boot gate so links cannot bypass it".
- **Open counsel question Q6** (compliance register section 6): whether the neutral-screen requirement is met, and whether a positive Declared Age Range result may replace the question.

What the founder objected to, "We ask everyone the same question.", is not required by any of these. It is an explanation, and principle 2 removes it.

### 2.2 Decision for v1.0: the gate stays first, in the launch screen's room

The four lenses split. Product and UX, and States, proposed welcome first, with the question as a sheet on "Begin the book". Content proposed tap-to-commit buttons labelled "I am 18 or older" and "I am under 18". Visual proposed keeping the gate first and giving it the lamp and the brand mark.

**Decision.** On v1.0 the question stays the first screen, because PRD-REQ-019 says "Before any first-run screen" and the welcome is a first-run screen (it is step 1 of `onboarding.tsx`). The welcome-first version (2.4) is fully specified and held for the founder and counsel. Moving the question changes a P0 legal requirement's wording, and that cannot be decided in a design pass.

**Why keep Continue (rejecting tap-to-commit).** A No closes the app for 24 hours with no retry (D-026). A mis-tap on a one-tap No locks a parent out for a day. The confirming tap costs one second and protects against that. Both answers pass through the same step, so the confirmation is neutral.

**Why keep "Yes" and "No" (rejecting the labelled answers).** K-07 and PRD-REQ-019 name "Yes, No". HIG Alerts advises against Yes and No as alert buttons, but these are not alert buttons: they are the two answers to a yes-or-no question, set as equal choices with a separate Continue. Labelled answers would need a counsel read. Yes and No do not.

**Legal check of the new screen.** Nothing is preselected (unchanged). There is no hint that one answer is right: the lamp, the mark and the question are identical before and after either choice, and answering No does not dim or change the room. The question appears before any child detail, recording or invite (unchanged: the gate stays the root-level boot gate in `_layout.tsx`). Nothing new is stored. The stop screen still says the app "is currently for adults 18 and over". Deleting the explanatory line removes words and adds no claim.

### 2.3 The exact v1.0 screens

**Age question (S01).** iPhone 17 Pro, 402 x 874 pt, light and dark.

| Layer | Spec |
|---|---|
| Background | `bg` paper, with `Lamp` scene `gate`: anchor `center` (cx 0.5, cy 0.42, r 0.8), core `gold`, tail `amber`, intensity 0.6, `still` (no breath), `persistKey="firstRun"`. Increase Contrast or Reduce Transparency: no lamp. |
| Mark | `QuotePair` (registry `app.brand-device`: `logo.symbol.accent` on light, `logo.symbol.reversed` on dark), 56 pt tall, centred, its top 120 pt below the safe-area top. Decorative, hidden from VoiceOver. |
| Question | `ageGate.title` "Are you 18 or older?" in `display` (Literata Medium 34/41), centred, 24 pt below the mark, max width 320 pt. VoiceOver focus lands here on arrival. |
| Answers | Two pills in one row, equal width, 56 pt tall, 12 pt gap, 32 pt below the question: "Yes" and "No", `label` style. Unselected: 1 pt `controlBorder`, transparent fill. Selected: `accentSoft` fill, 1.5 pt `accent` border, a check icon before the label. Nothing selected on arrival. Exposed as a radio group named by the question. At accessibility text sizes the pills stack, Yes first, same width. |
| Primary | `common.continueButton` "Continue", full width, 56 pt, 16 pt side gutters, bottom of the thumb zone (24 pt above the safe-area bottom). Disabled: 1 pt `controlBorder` outline, label in `textMuted`, no fill (not today's pale fill, which reads as broken). Enabled: `accent` fill, `onAccent` label. |
| Nothing else | No body line, no link, no legal footer, no illustration. |

Motion: the splash hides with its native fade. The mark fades in over `fadeMs` (200 ms). The question enters at 60 ms (`motion.enter`: opacity 0 to 1, y 8 to 0, 280 ms, M3 easing). The answers and Continue are opaque from the first frame. The lamp arrives over `motion.lamp.arriveMs` (1200 ms) to intensity 0.6. A selection plays the `selection` haptic. Continue plays none. After **Yes, Continue**: the mark and question exit (opacity to 0, y to -8, `exitMs` 160); the lamp keeps its state (same `persistKey`) and rises to 1.0 over 1200 ms on the welcome; the welcome's content enters. After **No, Continue**: the question and answers cross-fade (200 ms) into the stop screen; the lamp and mark do not move or change. Reduce Motion: every change is one 200 ms fade and the lamp holds its final state.

**Under-18 stop screen (S02).** Same room: the same lamp at 0.6, still, and the same mark in the same place. One line in `title1` (Literata Medium 28/34), centred where the question was: `ageGate.stopTitle` "{app} is currently for adults 18 and over." Nothing else. After 24 hours, one secondary pill 32 pt below the line: `ageGate.mistakeButton` "I answered by mistake". It leads to the question with nothing preselected (J02-05). VoiceOver announces the line on arrival. No haptic, no timer, no "come back tomorrow". This is the only screen in the app allowed no way forward, by law.

Copy:

| Key | After | Mark |
|---|---|---|
| `ageGate.title` | Are you 18 or older? | KEEP |
| `ageGate.body` | (not shown) | RET |
| `ageGate.yesButton` | Yes | KEEP |
| `ageGate.noButton` | No | KEEP |
| `ageGate.stopTitle` | {app} is currently for adults 18 and over. | CHG (was "Thank you for telling us.") |
| `ageGate.stopBody` | (not shown; its sentence became the title) | RET |
| `ageGate.stopNote` | (not shown) | RET. "Nothing you entered has been kept." refers to nothing (one tap was given) and is only partly true (the time of the No is stored, D-026). |
| `ageGate.mistakeButton` | I answered by mistake | KEEP |

Acceptance checks:
- [ ] On a fresh install the first screen after the splash is the question, with neither answer selected and Continue disabled (LEGAL-REQ-002 AC1).
- [ ] No string on the screen other than the question, "Yes", "No" and "Continue".
- [ ] Yes, Continue: `ageGate.passed` is the only thing written; the welcome follows in the same lit room with no flash of unlit paper.
- [ ] No, Continue: the stop screen shows only the stop line; only `ageGate.stoppedAt` is stored; the room does not dim or change.
- [ ] Relaunch within 24 hours shows the stop screen; after 24 hours "I answered by mistake" appears and leads to an empty question (J02-03, J02-04, J02-05).
- [ ] A deep link on a fresh install lands on the question (the gate stays in `_layout.tsx`).
- [ ] Reduce Motion: fades only. Increase Contrast: plain paper. Dark: lamp at the dark peak, reversed mark.
- [ ] VoiceOver reads "Are you 18 or older?", then a radio group with "Yes" and "No", then "Continue, dimmed".

### 2.4 Held: welcome first, the question as the first tap

This version ships only if the founder amends PRD-REQ-019 and counsel answers Q6 in its favour.

- The welcome (S03) is the first screen after the splash. It holds no data and no action except "Begin the book".
- "Begin the book" opens a sheet (`ui/sheet`, `dismissible={false}`, fit to contents, no grabber, no Close): the question in `title1`, the two answer pills, and Continue. It looks exactly like 2.3 with no mark, because the welcome's lockup is the screen's one logo.
- `useAgeGate()` stays at the root. Every route except the static welcome stays unreachable until the gate passes. A deep link lands on the welcome.
- Amendment text for PRD-REQ-019, for the founder: "Before any first-run step that asks for a detail (the child step onward), any story 4 action, sign-in or invite flow, a neutral 'Are you 18 or older?' (Yes, No, nothing preselected), asked when the person first taps to begin." LEGAL-REQ-002's criterion 1 ("When the user takes any first action ... Then the age question appears first") already reads this way.
- Question for counsel: is a static welcome screen that collects nothing and whose only action opens the question "asking before first use" under CR-004's reading of SB 2420 and Apple's Declared Age Range guidance?

### 2.5 Gap found: Declared Age Range is not called

LEGAL-REQ-002 requires calling Apple's Declared Age Range API "where required (Texas now)". Nothing in `apps/mobile` calls it (grep on `develop`; `docs/qa/DEVICE_TEST_PLAN.md` marks it F). This is a P0 legal gap outside this design pass. It needs an owner (section 7). When it is built, the result is used in memory only, an under-18 result routes straight to the stop screen, and an adult result does not skip the question unless counsel answers Q6 that way.

---

## 3. The journey as a journey

### 3.1 The arc

The app has one story: a lamp comes on, a book is named and opened, a voice is kept, and the book fills, month by month, at bedtime and on quiet days. Six chapters carry it. Light and motion change by chapter, so a person feels where they are without being told.

| Chapter | What the person feels | Light | Motion | Pictures |
|---|---|---|---|---|
| **1. Arrival** (gate, welcome, promise, naming, signing, the book opens) | "This is calm, it is mine, and it is ready." | The lamp arrives once at the gate (0.6, still), rises on the welcome (1.0, breathing), settles low for the form steps (0.5, still), and rises again when the book opens (1.0). It never goes out between steps. | Arrivals only: words rise 8 pt over 280 ms. Controls never move. | The opening quotation pair (gate), the lockup (welcome), the sample with two marks (promise), the **book cover** with the child's name (naming, signing), the cover opening (finish). |
| **2. The first evening** (Tonight, Listen, Review, saved) | "Say one thing. It is kept exactly as I said it." | Tonight is lit by the time of day. Listen has **no** lamp: only the voice moves the aura. Review is plain paper. | Tonight's lines arrive once per cold launch. The aura follows the voice. Marks are there from the first frame. The save files the letter into its month. | The prompt as the literary line, the person's own words on a letter sheet, the "Filed in Month 7" chip. |
| **3. The first letter in the book** (Book arrival, the letter page) | "It is really there, in my words and my voice." | Book: a low still pool behind the header. Letter page: plain paper, no light (a voice plays here). | The new card is already in place with a 1.6 s `accentSoft` wash. A card grows into its page. | The month opener and numeral; the letter as a page with the signature in italic. |
| **4. The book growing** (months, Read together, the end of the book) | "This is becoming the story of their life." | The current month's opener is lit; earlier months are paper. Read together at night: one still dusk pool low behind the controls. | Pages turn sideways. At the end, the moon draws on once, then nothing moves. | Month numerals, the moon drawing. |
| **5. The quiet days** (Not much today, quiet-day rows, reminders, the morning, "A month ago") | "Skipping is fine. Nothing is counted." | In the evening, "Not much today" lowers the Tonight lamp to 70 percent: lights down. Mornings are gold. | One small line in place of the link; Undo restores both line and light. | The moon glyph, the person's own month-old letter resurfaced (never a count). |
| **6. The hard moments** (mic off, words that do not come, the Plus gate, delete, not found, crash, launch failure, the stop screen) | "Nothing is lost, and I know what to do next." | **None.** Light is for moments, not problems. | None beyond a 200 ms fade. No breath on error drawings. | One static line drawing chosen for the moment, the held letter itself on the Plus gate. |

### 3.2 Storyboard, in screen order

Light: L (lamp scene, section 5.2), none, or dusk. Motion names refer to section 5.5.

| # | Screen | Steps | One line on screen | Light | Motion | Haptic |
|---|---|---|---|---|---|---|
| 1 | Age question (S01) | J00-open, J01-01, J01-02 | Are you 18 or older? | L gate 0.6, still | mark fade, question enter, lamp arrive | selection on choice |
| 2 | Welcome (S03) | J01-03 | The baby memory book you fill by talking. | L welcome 1.0, breath | lamp rise, staggered enter | none |
| 3 | The promise (S04) | J01-04 | Exactly as you said it. | L form 0.5, still | strike draws on the sample, tap to put back | selection on put back |
| 4 | Who is this book for (S05) | J01-05 to J01-12 | Who is this book for? | L form 0.5, still | the cover appears and takes the name | none |
| 5 | What does Asha call you (S06) | J01-13, J01-14 | What does Asha call you? | L form 0.5, still | the cover takes the signature | selection on chip |
| 6 | The book is open (S08) | J01-16, J01-17 | The book is open. | L finish, rises to 1.0 | the cover opens, the light rises | success on finish |
| 7 | Tonight (S09) | J01-18, J04-* | the prompt | L tonight by daypart, breath | cold-launch enter | none |
| 8 | Listening (S11) | J05-01, J05-02 | Listening. | none | voice aura only | light on start and stop |
| 9 | Review, waiting (S14) | J05-03 | Writing down what you said. | none | moon breath 8 s | none |
| 10 | Review, letter (S17) | J06-01 to J06-07 | the letter | none | inline card expands; put back cross-fades | selection on put back |
| 11 | Saved (S21) | J06-09, J07-07 | Added to Asha's book. | none | file into month chip, dismiss | success on commit |
| 12 | Book, new letter (S26) | J09-02 | Month 7 | L book 0.6, still | arrival wash 1.6 s | none |
| 13 | A letter (S27) | J10-01 | the letter | none | card grows into page | none |
| 14 | Read together (S30) | J11-01 to J11-03 | the letter | dusk at night, still | page turn | none |
| 15 | End of the book (S31) | J11-04 | That is every letter so far. | dusk, dims | moon draws on, then still | none |
| 16 | Not much today (S33) | J08-02 | A quiet day, kept. | evening: lamp to 70% | line replaces link | soft |
| 17 | Keep needs Plus (S22) | J06-14 | Keep adding to Asha's book | none | held letter rises in | none |
| 18 | Microphone is off (S13) | J05-04 | The microphone is off | none | 200 ms fade | none |
| 19 | Deleted, Undo (S36) | J10-08 | Letter deleted. | (Book's own) | card collapses out of its row | warning on confirm |
| 20 | Crash, launch recovery (S50, S51) | J20-01, J20-02 | This screen could not be shown. / The book could not open. | none | none | none |

The "before" for each row is in `docs/design/experience-pass/before/` (sheets 01 to 09, labelled by step id).

---

## 4. Screens, in journey order

Each entry: steps, before screenshot, verdict, package (section 6), copy after, visual, motion, states, acceptance. Copy keys are in `packages/content` (`en.*` in `strings.en.ts`, the named `*Copy` objects in `src/features/*.en.ts`). Where a screen has no change in a category, it says so.

### Chapter 1. Arrival

#### S01 Age question and S02 the under-18 stop screen
See section 2.3. Steps J00-open, J01-01, J01-02, J02-01, J02-05 (S01); J02-02, J02-03, J02-04 (S02). Before: `screens/J01-01.png`, `screens/J02-02.png`, `screens/J02-04.png`. Verdict: redesign (S01), polish (S02). Package P2.

#### S03 Welcome
Steps J01-03, J17-04. Before: `screens/J01-03.png`. Verdict: redesign. Package P2.

Problem: three text voices of equal weight, the product name retyped in Literata (BRAND_SYSTEM 2a: "Never retype the name in a font to stand in for the logo"), no light. PR #99 adds the pair and a lamp but still retypes the name.

Copy:

| Key | After | Mark |
|---|---|---|
| `onboarding.welcome.title` | {app} (accessibility label of the lockup only; never typed on screen) | KEEP, no longer visible text |
| `onboarding.welcome.subtitle` | The baby memory book you fill by talking. | KEEP, now the hero line |
| `onboarding.welcome.body` | A few words at a time, in your own voice. Kept for {child} to read and hear for years. | KEEP |
| `onboarding.welcome.freeLine` | Your first two letters are free. | KEEP (D-082) |
| `onboarding.welcome.startButton` | Begin the book | KEEP |
| `onboarding.welcome.signInButton`, `joinButton` | hidden | held: scope decision pending |

Visual: the stacked lockup (new registry context `app.welcome` resolving to `logo.lockup.stacked.ink` and `.reversed`, 96 pt tall, centred, its top 96 pt below the safe-area top) is the one logo. Founder item, section 7; until approved, use the existing `app.header` small-cut lockup at 26 pt. The hero line is `onboarding.welcome.subtitle` in `hero` (Literata Medium 44/50, tracking -0.4), centred, 32 pt below the lockup. Then `body` in `body` (Mukta 18/24) `textMuted`, centred, 16 pt below. Then `freeLine` in `footnote` `textMuted`, 12 pt below. "Begin the book" full width, 56 pt, bottom. Background: the lamp `welcome` scene (anchor top, core gold, tail amber, intensity 1.0, breathing per MOTION 5k). No line drawing: the light and the lockup are the picture, and BRAND_SYSTEM allows one logo per screen.

Motion: the lamp, already lit at 0.6 from the gate, rises to 1.0 over 1200 ms. The lockup fades in over 200 ms at 0 ms. The hero line enters at 120 ms, the body at 150 ms, the free line at 180 ms (`staggerMs` 30). The button is opaque from the first frame. On "Begin the book" (v1.0: straight to the promise; held version: opens the age sheet), the content exits up 8 pt over 160 ms and the lamp eases to 0.5, still.

States: no empty, loading or error state.

Acceptance:
- [ ] The product name is never typed in a font on this screen; the lockup comes from the registry and its accessibility label is the brand name.
- [ ] Exactly one serif line (the descriptor) and one button; no line drawing.
- [ ] From the gate to the welcome there is no frame of unlit paper (the lamp keeps its state through `persistKey`).
- [ ] Dark mode matches the website hero: reversed lockup, the amber lamp at the dark peak on `#161412`.
- [ ] Reduce Motion: the lamp holds still at 1.0, and the content appears with one 200 ms fade.

#### S04 The promise
Step J01-04. Before: `screens/J01-04.png`, `screens/J01-04-full.png`. Verdict: redesign. Package P2.

Problem: about 110 words in three cards and a footnote, three "we" sentences, and mechanics explained before the person has said a word. The mishear card repeats what the first Review note and Settings already say (those are the two places `docs/legal/in-app-disclosures.md` section 2 registers for it; first run is not one of them).

Copy:

| Key | After | Mark |
|---|---|---|
| `onboarding.promise.title` | Exactly as you said it. | KEEP |
| `onboarding.promise.body2` | We never rewrite, shorten or write for you. Every sentence is one you said. | KEEP, now directly under the title |
| `onboarding.promise.sampleLabel` | Sample | NEW |
| `onboarding.promise.sampleRaw` | Today, um, you you held the spoon all by yourself. | NEW. The sample's raw words, cleaned at runtime by the real engine (see Visual). |
| `onboarding.promise.sampleHint` | Word for word marks every small fix. Tap one to put it back. | NEW. Names the feature here, which VOICE allows on the promise. |
| `onboarding.promise.recordingBody` | The recording is kept on this phone, so one day {child} can hear you say it. | KEEP, now an icon row |
| `onboarding.promise.privateNote` | Private by default. You choose what goes in the book. | KEEP, now an icon row |
| `onboarding.promise.body` | (not shown; the sample shows it) | RET |
| `onboarding.promise.recordingTitle`, `mishearTitle` | (not shown) | RET |
| `settings.help.mistakes` | (not shown in first run; stays in Settings and the first Review note) | KEEP elsewhere |
| `onboarding.promise.cta` | That sounds right | KEEP |

Visual: title in `display`; `body2` in `body` 12 pt below. Then the **specimen card** (`surfaceRaised`, `radius.md`, elevation 1, 16 pt padding): `sampleLabel` in `caption` caps `textMuted`, then the sample sentence in **UI sans** (`callout`, Mukta 17/22), never the letter face, because VOICE says "The app's own words ... never sit in the letter's type". Unsigned. The two marks use the Review grammar: "um," and the second "you" are struck through with a 1.5 pt `editMark` line and set in `textMuted`. Each mark is a 44 pt tappable target. Tapping one puts the word back (it cross-fades in, the strike fades out) and shows the review toast "Put back." with "Undo". Under the card, `sampleHint` in `footnote`. Then two icon rows, 24 pt apart, Phosphor Regular 20 pt in `textMuted`: Microphone with `recordingBody`, LockSimple with `privateNote`. CTA at the bottom. Lamp `form` scene (0.5, still).

The sample is not hand-marked. P2 runs `sampleRaw` through the real engine in `packages/core` (the same path a recording takes, `verifyEdits` included) and renders whatever it returns. A unit test asserts that the result has exactly two small fixes, one filler and one repeat, that `verifyEdits` accepts them, and that putting both back yields `sampleRaw` exactly. If the engine returns anything else, the test fails and P0 changes the sample words. The engine is never bent to fit the sample. The machine is shown working on fictional words, and it adds nothing.

Motion: on arrival the two strikes draw across their words (strokeDashoffset, 400 ms, M3 easing, 120 ms apart, after the title has entered). Put back: out 120 ms, in 160 ms, `selection` haptic (MOTION 5d). Reduce Motion: strikes shown complete; put back is a 200 ms fade.

States: none.

Acceptance:
- [ ] At most about 60 words on the screen at the default text size.
- [ ] The sample is set in Mukta, labelled "Sample", unsigned, with no `{child}` name in it.
- [ ] The unit test in P2 proves the two fixes come from the engine, pass `verifyEdits` and are fully reversible.
- [ ] Tapping either mark puts the word back; Undo reverses it.
- [ ] No "We can mishear" card in first run; the first Review note and Settings still carry the registered text.

#### S05 Who is this book for (name, birthday or due date, twins)
Steps J01-05, J01-06, J01-07, J01-08, J01-09, J01-10, J01-11, J01-12, J03-01. Before: `screens/J01-05.png`, `screens/J01-07.png`, `screens/J01-09.png`, `screens/J03-01.png`. Verdict: redesign. Package P2 (and `components/child/date-field.tsx`, shared with Add a child).

Problem: the screen explains itself three times ("You can add a nickname later." promises a feature v1.0 lacks; "We sort letters by Asha's month of age." justifies the field and, with a 60-character name, prints the name twice; the reason line above a greyed button reads as an error before anyone has erred). Nothing makes the child feel present.

Copy:

| Key | After | Mark |
|---|---|---|
| `onboarding.child.title` | Who is this book for? | KEEP |
| `onboarding.child.nameLabel` | Name | CHG |
| `onboarding.child.nameLabelMore` | Another name | NEW (second and later rows) |
| `onboarding.child.namePlaceholder` | First name, or the name you use at home | KEEP |
| `onboarding.child.nameHelp` | (not shown) | RET |
| `onboarding.child.birthdayLabel` | Birthday | KEEP |
| `onboarding.child.birthdayHelp` | (not shown) | RET |
| `onboarding.child.expectingLabel` | Not here yet | KEEP |
| `onboarding.child.expectingHelp` | Letters written before the birthday go in Before You. | CHG |
| `onboarding.child.dueDateLabel` | Due date | KEEP |
| `onboarding.child.chooseDate`, `bornToday` | Choose a date / Born today | KEEP |
| `onboarding.child.addAnotherButton` | Add another child | KEEP |
| `onboarding.child.addAnotherHelp` | Twins or more? Each child gets their own book. | CHG |
| `childrenExtra.nameRequired`, `onboarding.child.needBirthday`, `needDueDate`, `needNameMany`, `nameLimit` | as today | KEEP |
| `childrenExtra.edit.birthdayFuture` | Choose today or an earlier day. | CHG (shared with S46) |
| `childrenExtra.edit.dueDateRange` | Choose a due date from today up to ten months ahead. | KEEP |
| `onboarding.child.cta` | Continue | KEEP |

Visual: introduce the **book cover** (`components/book/book-cover.tsx`, section 5.4). On this step it sits at the top right of the heading row, 88 x 116 pt, closed: paper (`surfaceRaised`, `radius.md`, elevation 1, a 1 pt `line` border in dark mode), the small-cut symbol at its head, and the child's name set live in Literata Medium 17 pt, centred, at most three lines, ending in a fade, never an ellipsis glyph. Empty name: the cover is blank. Twins: a second cover fans 10 pt behind the first, rotated 3 degrees, carrying the second name. With the keyboard up and under 640 pt of free height (iPhone SE), the cover hides, so the form never scrolls. The name field uses the letter face (Literata 22 pt), because it is the book's title; labels stay Mukta. "Born today" becomes a chip beside the date control. The disabled Continue is the outline style from S01.

The reason line stays in words and is never only a greyed button. It sits directly above Continue in `footnote` `textMuted` until the person taps the disabled Continue. Then it turns `caution` with a WarningCircle icon, is announced politely, and focus moves to the empty field. HIG Entering data: "make the button available only after people enter the data you require" (*verified*).

Motion: the cover fades in (200 ms) when the step arrives. Its name cross-fades (200 ms) after each typing pause of 300 ms, with no per-letter motion. The date block enters (`motion.enter`) after the first character of the name. The reason line cross-fades (150 ms) when it changes and never shakes. Reduce Motion: static cover, instant text.

States: empty name; name at the 60-character limit ("A name can have up to 60 characters."); no date; future birthday; due date beyond 305 days; empty twin row. All as today, in the words above.

Acceptance:
- [ ] No help line justifies a field; no "we" on the screen.
- [ ] The date row starts empty ("Choose a date"); there is no default date (the J01-07 fix holds).
- [ ] The reason line is muted until the disabled Continue is tapped, then caution with an icon, and focus moves to the field.
- [ ] The cover shows the typed name exactly as typed (trimmed only for display), and hides when the keyboard leaves less than 640 pt.
- [ ] A 60-character name fits the cover in three lines with a fade.

#### S06 What does {child} call you (signature and spoken language)
Steps J01-13, J01-14, J03-02. Before: `screens/J01-13.png`, `screens/J01-14.png`, `screens/J03-02.png`. Verdict: polish. Package P2.

Copy:

| Key | After | Mark |
|---|---|---|
| `onboarding.signsAs.title`, `titleMany` | What does {child} call you? / What do {child} call you? | KEEP |
| `onboarding.signsAs.body` | (not shown; the preview shows it) | RET |
| `onboarding.signsAs.placeholder` | Papa, Mama, Amma, Baba, Dad | KEEP |
| `onboarding.signsAs.examplesLabel` | A few ideas | KEEP |
| `onboarding.signsAs.examples` | Mama, Papa, Amma, Appa, Mommy, Daddy, Ma, Baba | CHG ("Mummy" to "Mommy", US storefront, D-087) |
| `onboarding.signsAs.notYetHelp` | Not talking yet? Pick the name you hope to hear. | KEEP |
| `onboarding.signsAs.preview` | From {signsAs} | KEEP |
| `onboarding.signsAs.needSignsAs` | Add what {child} calls you to continue. | KEEP (one name) |
| `onboarding.signsAs.needSignsAsMany` | Add what {child} call you to continue. | NEW (fixes "Asha and Nila calls", J03-02) |
| `settingsHome.languageLabel` | Spoken language | KEEP |
| `onboarding.dictionary.languagesBody` | (not shown under the language row) | RET on this step |
| `onboarding.signsAs.cta` | Sign my letters | KEEP |

Visual: the cover from S05, same place, now shows "From Mama" in `signature` italic (Literata Italic 15 pt) on its foot line, replacing the floating preview in the middle of the screen. The chips, field and language row stay. The language row sits below a hairline with no footer.

Motion: a chip tap fills the field and the cover's foot line together (cross-fade, `snappy`), with the `selection` haptic.

Acceptance:
- [ ] One signature preview, on the cover; no subtitle; no language footer.
- [ ] Twins: the title and the reason line both agree in number ("What do Asha and Nila call you?", "Add what Asha and Nila call you to continue.").

#### S07 Choose a language sheet
Step J01-15. Before: `screens/J01-15.png`. Verdict: keep. Package P2.

Copy: `languageCopy.picker.searchPlaceholder` CHG "Find a language"; `languageCopy.picker.none` CHG "No match. Letters can be spoken in these seven languages for now." Everything else KEEP (each language in its own script with the English name beneath, Arabic right to left).

Visual and motion: none beyond the native sheet (MOTION 5i: sheet content adds no entrance). A language whose speech model is not on the phone shows its size in the row from `speechSettingsCopy.absent` ("Not on this phone, 575 MB").

Acceptance:
- [ ] Seven languages, one check; no download starts from this sheet (D-087).

#### S08 The book is open, with the one-time speech download
Steps J01-16, J01-17, J03-03. Before: `screens/J01-16.png`, `screens/J01-16-full.png`, `screens/J01-17.png`, `screens/J03-03.png`. Verdict: redesign. Package P2 (and `components/speech/speech-consent-card.tsx`).

Problem: the emotional peak of first run carries a five-line help-centre card with its own filled button, so two primary buttons compete, and after "Not now" the screen says the voice is kept twice.

Copy:

| Key | After | Mark |
|---|---|---|
| `onboarding.finish.title` | The book is open. | KEEP |
| `onboarding.finish.body` | Say one thing about {child} today. That is a letter. | KEEP |
| `onboarding.finish.cta` | Write the first one | KEEP, the only primary |
| `speechConsentCopy.title` | Get your words ready | KEEP |
| `speechConsentCopy.body` | Spoken letters are written down on this phone. One download of {size}, on Wi-Fi. | CHG |
| `speechConsentCopy.note` | (not shown) | RET |
| `speechConsentCopy.downloadButton` | Download on Wi-Fi | KEEP, now secondary |
| `speechConsentCopy.laterButton` | Not now | KEEP, quiet |
| `speechConsentCopy.footnote` | (not shown) | RET |
| `speechConsentCopy.chosenYes` | Getting ready. It waits for Wi-Fi. | KEEP |
| `speechSettingsCopy.downloading` | Getting ready, {n}% | KEEP, shown in the card while downloading |
| `speechConsentCopy.chosenLater` | Your voice is kept either way. | CHG |
| `speechConsentCopy.lowSpace` | This phone needs {size} of free space first. | KEEP (no download button then) |

Visual: the cover from S06, now 132 x 176 pt and centred above the hero line, **opens**: its front cross-fades to the flyleaf (the child's name small at the top, "From Mama" at the foot, one hairline across the middle where the first letter will go). "The book is open." in `hero`, the body in `body`. The download card below: `accentSoft` fill, `radius.md`, 16 pt padding, title in `headline`, body in `footnote`, then a bordered secondary "Download on Wi-Fi" and a quiet "Not now" side by side (stacked at accessibility sizes). After a choice the card collapses to one line: `chosenYes` plus a thin determinate bar, or `chosenLater`, or `lowSpace`. "Write the first one" full width at the bottom. The lamp `finish` scene rises from 0.5 to 1.0: the light comes up as the book opens.

Motion: on arrival the cover's front holds for 300 ms, then cross-fades to the flyleaf with an 8 pt shift on `standard` (no 3D flip). The lamp rises over 1200 ms. The hero line enters at 200 ms. The `success` haptic plays once when the step is reached. The card collapse uses `LinearTransition` on `standard`. Any tap completes the sequence. Reduce Motion: the open cover is shown at once, the lamp is at 1.0, one 200 ms fade.

States: low space (no download button, the low-space line); download in progress (the bar keeps moving: HIG Progress indicators, "When possible, use a determinate progress indicator" and "Keep progress indicators moving", *verified*); already on the phone (no card at all).

Acceptance:
- [ ] One filled button on the screen ("Write the first one").
- [ ] Nothing downloads until "Download on Wi-Fi" is tapped (D-087); the size shown is this phone's plan, never a typed number.
- [ ] After "Not now", one line: "Your voice is kept either way."
- [ ] With the model already on the phone, the card does not appear.

### Chapter 2. The first evening

#### S09 Tonight
Steps J01-18, J04-01, J04-02, J04-03, J04-05, J06-12, J06-15, J07-05, J07-10, J08-01, J18-02. Before: `screens/J01-18.png`, `screens/J04-01.png`, `screens/J18-02.png`; PR #99 after: `docs/design/calm-brand/after/tonight-*.png` on `feat/mobile-calm-brand`. Verdict: redesign. Package P3.

Problem: two questions stack (the subtitle "What do you want Asha to know about today?" over the prompt), a caps label explains the prompt, the prompt sits in a card like every other card, and every unfinished thing shows the same generic line. Tonight lists only the first draft (`listDrafts(childId)[0]`), so after a kill a second kept take is invisible.

Prompts are already chosen by the child's age (`selectPrompt` with `ageMonths`). Nothing says so.

Copy:

| Key | After | Mark |
|---|---|---|
| `tonight.greeting.*` | as today ("Good evening, {name}.", "The house is quiet, {name}.", ...) | KEEP |
| `tonight.subtitle` | (not shown) | RET |
| `tonight.promptLabel` | A thought to start with (accessibility hint of the prompt only) | KEEP, not visible |
| `tonight.newPromptButton` | Another thought | KEEP |
| `tonight.speakButton`, `typeButton`, `notMuchButton` | Speak / Type / Not much today | KEEP |
| `tonight.draftWaiting.title` | A recording is ready to read back. | CHG (spoken, words ready) |
| `book.waitingForWords` | A recording, waiting for its words. | KEEP, reused on the card |
| `tonight.draft.held` | Waiting to be kept. | NEW (held at the Plus gate) |
| `tonight.draft.swept` | Kept when the app closed. | NEW (found by the launch sweep) |
| `tonight.draft.typedA11y` | A letter you started, {date}. | NEW (typed drafts show the first words, so no visible line) |
| `tonight.afterSave.reviewButton` | Read it back | KEEP |
| `tonight.draft.pickUpButton` | Pick it up | NEW (typed draft) |
| `tonight.draft.openButton` | Open | NEW (waiting for words) |
| `tonight.draft.keepButton` | Keep it | NEW (held for Plus; opens Review, then the gate) |
| `tonight.resurfaced.kicker` | A month ago | NEW |
| `tonight.resurfaced.a11y` | A letter from {date}. Opens the letter. | NEW |

Visual:
- Lamp `tonight` scene: anchor top, tone from the greeting's daypart (section 5.2), breathing per MOTION 5k.
- The dateline (`letterDateline`, "ASHA · 7 MONTHS") as today.
- The greeting drops from `display` to `title2` (Literata Medium 22/28) and turns two-tone, the website's "Meera is / asleep." move: "Good evening, " in `text` and "Mama." in `textMuted`.
- **The prompt is the one literary line**: new token `type.promptHero` (Literata Regular 28/36, max scale 1.8), directly on the paper with no card, 24 pt below the greeting, max 4 lines. "Another thought" stays a quiet text button with ArrowsClockwise, 12 pt below.
- **Unfinished letters**, between the prompt and Speak and Type: one card per draft, newest first, no totals. Each card is letter-shaped (`surfaceRaised`, `radius.md`, elevation 1, a 3 pt `accent` rule on its left edge, 16 pt padding). It shows the dateline ("Tuesday evening, 0:42" for a recording, "Tuesday evening" for typing), then either the person's first words in `letterBody`, two lines with a fade, or the state line in `footnote` `textMuted`, then the action as a text button. The state comes from the draft's own fields:

| Draft | Line | Action |
|---|---|---|
| Spoken, words ready | first words, else `tonight.draftWaiting.title` | Read it back |
| Spoken, words not yet written down | `book.waitingForWords` | Open |
| Typed | first words | Pick it up |
| Held at the Plus gate | first words, then `tonight.draft.held` | Keep it |
| Found by the launch sweep | `tonight.draft.swept` | Read it back |

  If a state cannot be read from the draft, the card uses the first row.
- **A month ago**: when no draft is waiting and a letter in the book is dated 28 to 35 days ago, show one card in the same shape with the `caption` kicker "A month ago" and the letter's first line in `letterBody`. Tapping it opens the letter. It shows the newest such letter only, never a count and never a gap. It never shows a private letter. (DESIGN_LANGUAGE 12 already specifies this card. Day One "On This Day", *repo-verified* in BENCHMARK S6.)
- Speak and Type: unchanged, identical twins, 64 pt, static.

Motion: cold launch only: the dateline, greeting and prompt enter with a 30 ms stagger, under 400 ms (MOTION 5a). A warm resume moves nothing. "Another thought": the old prompt exits (160 ms), the new one enters (8 pt, 280 ms). Draft cards enter with `motion.enter` at a 30 ms stagger. Speak and Type never move. Reduce Motion: static; one 200 ms fade on a prompt change.

States: no drafts (prompt only); several drafts (scroll above the pinned Speak and Type); newborn day 0 (J04-03, the same layout); twins (the switcher in the dateline, as today).

Acceptance:
- [ ] One question on screen: the prompt. No subtitle, no caps label.
- [ ] After a kill with two kept takes, Tonight shows two cards.
- [ ] A typed draft closed mid-sentence shows its first words and "Pick it up" (J07-05).
- [ ] A letter held at the Plus gate shows "Waiting to be kept." and "Keep it" (J06-15, J07-10).
- [ ] The lamp tone changes with the greeting (gold in the morning, amber in the evening, the rose tail at night, the dusk tail late at night); with Increase Contrast there is no lamp.
- [ ] No count, days-since or streak anywhere on Tonight.

#### S10 Usage-sharing ask
Step J04-04. Before: `screens/J04-04.png` (stale: on `develop` the sheet never shows, because #118 turns analytics off in every profile). Verdict: keep, not built in this pass. Package: none.

When the sheet returns in v1.1, these words are recorded for that work, with LEGAL-REQ-003 and counsel: title "Share usage reports?", body "Which screens you open and when something breaks. Never your letters, recordings or anyone's names.", equal buttons "Don't share" and "Share usage". No copy changes in v1.0.

#### S11 Listening
Steps J05-01, J05-02, J05-06, J05-09, J18-06. Before: `screens/J05-01.png`, `screens/J05-02.png`, `screens/J18-06.png`. Verdict: polish. Package P4.

Copy: every `listen.*` and `tonight.states.*` key KEEP: "To {child}", "Only you, until you add it to the book.", "Listening.", "Say it however it comes.", "Still here. Take your time.", "Paused.", "Keep talking", "Finish", "Let it go", and the discard alert "Let this recording go?" / "It will be removed from this phone." / "Keep it" / "Remove it". The States lens proposed "Discard". Rejected: the buttons already name their outcome, and "Keep it" is a clear safe choice (HIG Alerts asks for a safe way out and a specific verb, both present).

Visual:
- What stays still: everything except the aura. No lamp, no drawing, no first-recording card.
- When the person started from a prompt, the prompt is the one literary line at the top, under the audience line, in `prompt` (Literata 24/32) `textMuted`, at most 3 lines.
- The clock drops from 1.75x `headline` to `headline` (Mukta SemiBold 18/23), tabular figures, `textMuted`. A recording screen is not a timer.
- Light mode: keep the disc at `recording`, and hold the glow inside `breath.opacityMin` to `opacityMax` (0.18 to 0.40), so it reads as warmth, not warning.

Motion: `motion.breathIdleMs` goes from 4000 to 7500 (8 breaths a minute, Calm's slowest pace, *repo-verified* MOTION M10; it also keeps the idle loop below HIG Motion's 0.2 Hz caution, *verified*). `components/capture/listening-aura.tsx` reads its values from `tokens.motion.breath` and `breathIdleMs` and drops its hardcoded `B` constants. The Visual lens proposed growing the Speak button into the red circle. Rejected: MOTION principle 2, controls never animate in.

States: paused, offline (nothing changes, which is right), over a minute, interrupted (S14 and S17 say why it stopped).

Acceptance:
- [ ] No lamp and no decorative loop on Listen; the aura moves only with the voice or the idle breath.
- [ ] The idle breath cycle is 7.5 s; Reduce Motion shows the stepped static ring.
- [ ] The prompt appears only when the take started from a prompt.

#### S12 Listen opened without a tap
Step J19-02. Before: `screens/J19-02.png`. Verdict: redesign. Package P4.

Problem: an error-style page with an envelope and a "Start" pill teaches a different gesture from the one Speak uses.

Copy: `listen.ready.title`, `listen.ready.body` (not shown) RET; `listen.ready.hint` NEW "Tap the red circle and talk." (the BRAND.md glossary's own phrase); `listen.ready.startA11y` NEW "Start recording"; `listen.ready.startButton` "Start" RET.

Visual: render Listening itself, idle: "To {child}", the audience line, the red circle at rest (120 pt, `recording`, no aura), no clock, and `listen.ready.hint` under it in `callout` `textMuted`. The whole disc is the start control. Close at the top right.

Acceptance:
- [ ] The microphone is not touched until the circle is tapped.
- [ ] VoiceOver reads "Start recording, button".

#### S13 Microphone is off, busy, or the phone is full
Step J05-04 (busy and full are native only and judged from code). Before: `screens/J05-04.png`. Verdict: redesign. Package P4.

Problem: "We can't hear you yet" is a "we" line, and its body explains the two buttons. Worse, in `listen.tsx` `begin()` any error from `start()` shows this screen, so a microphone held by a call, a refused audio session or a full phone all say "allow the microphone in Settings", which cannot help. `errors.storageLow` exists and is never used.

Copy:

| Key | After | Mark |
|---|---|---|
| `errors.micDenied.title` | The microphone is off | CHG |
| `errors.micDenied.body` | Turn it on in Settings, or type this one. | CHG |
| `errors.micDenied.typeButton` | Type instead | KEEP, primary |
| `errors.micDenied.settingsButton` | Open Settings | KEEP, quiet |
| `errors.micBusy.title` | The microphone is in use | NEW |
| `errors.micBusy.body` | A call or another app has it right now. | NEW |
| `common.tryAgainButton` / `errors.micDenied.typeButton` | Try again (primary) / Type instead (quiet) | KEEP |
| `errors.phoneFull.title` | This phone is full | NEW |
| `errors.phoneFull.body` | Free some space to record, or type this one. | NEW |
| (buttons) | Type instead (primary) / Try again (quiet) | KEEP keys |
| `errors.storageLow` | (never used) | RET |

Visual: one state layout (`StateScreen`): a 72 pt `accentSoft` circle holding a Phosphor Light 40 pt glyph in `textMuted` (MicrophoneSlash for off and busy, WarningCircle for full); the title in `title2`; the body in `body` `textMuted`; the primary and the quiet button at the bottom; Close at the top right. Plain paper, no lamp, no breath.

Behaviour (P4): `begin()` tells the cases apart: permission denied, then busy (start threw while permission is granted), then full (free space under 50 MB, checked before `beginTake`). "Type instead" opens Write with the same prompt. When the app returns to the foreground with permission now granted, the screen goes straight to the idle Listening state.

Acceptance:
- [ ] Denied, busy and full show three different titles; none says "we".
- [ ] A refused audio session while permission is granted never shows "The microphone is off".
- [ ] Returning from Settings with permission granted lands on idle Listening.

#### S14 Review while the words are being written down
Steps J05-03, J05-07, J05-08. Before: `screens/J05-03.png`, `screens/J05-08.png`. Verdict: polish. Package P4.

Copy:

| Key | After | Mark |
|---|---|---|
| `wordsCopy.preparing` | Writing down what you said. | KEEP |
| `wordsCopy.listening` | Writing down what you said. Part {n} of {count}. | KEEP |
| `review.waitingLong` | A long recording takes a little longer. | NEW (after 8 s) |
| `review.laterButton` | Read it back later | NEW (after 15 s with no progress) |
| `review.playButton` | Hear it | KEEP |
| `wordsCopy.pack.stoppedInBackground` | The recording stopped when you left the app. Everything before that is kept. | CHG |
| `wordsCopy.pack.stoppedInterruption` | The recording stopped for a call or an alert. Everything before that is kept. | NEW |
| `wordsCopy.pack.stoppedClosed` | The recording stopped when the app closed. Everything before that is kept. | NEW |

The Content lens proposed "Still writing. A long letter takes a moment longer." Rejected: "Still writing" can read as software writing the letter, which the constitution and VOICE forbid. "Writing down what you said" names transcription; "still writing" does not.

Visual: the card on `surfaceRaised`: the moon line drawing at 96 pt, the line in `callout`, the recording length ("0:42") in `footnote` under it. The stop-reason line, when there is one, sits above the card in `footnote` `textMuted`. After 15 s with no progress, "Read it back later" appears as a quiet button: it closes Review, the queue carries on, and Tonight shows the "waiting for its words" card.

Motion: the moon breathes opacity 0.85 to 1 over `emptyBreathMs` (8 s, MOTION 5j) and stops the moment "Hear it" plays. When words arrive, each finished part fades in (180 ms, MOTION 5c), never word by word and never with a cursor. Reduce Motion: static moon, 150 ms fade.

States: multi-part (the existing determinate bar with "Part 2 of 3"); a take under 1.5 s goes straight to the empty-take state (S16).

Acceptance:
- [ ] Nothing on the screen suggests software is writing the letter (no typewriter effect, no "writing" without "down").
- [ ] The interrupted-by-a-call take says so in Review.

#### S15 Review when the language is not on this phone yet
Native only, no journey step (judged from `WordsStatus` in `review.tsx`). Verdict: polish. Package P4.

Copy:

| Key | After | Mark |
|---|---|---|
| (not yet agreed to the download) title, body | `speechConsentCopy.title` "Get your words ready" / `speechConsentCopy.body` (S08 wording) | KEEP keys |
| primary / quiet | `speechConsentCopy.downloadButton` "Download on Wi-Fi" / `review.voiceOnlyButton` "Keep the recording" | KEEP |
| (downloading or waiting) title | `review.waiting.title` "Your voice is kept" | KEEP |
| `review.waiting.body` | The words follow once this phone is ready. | CHG |
| status line | `speechSettingsCopy.downloading` / `waitingForWifi` / `noSpace` | KEEP |
| `wordsCopy.pack.mobileDataButton` | Use cellular data {size} | CHG (US) |
| `wordsCopy.pack.typeButton` | Type it instead | KEEP |

One primary ("Keep the recording" once the download is agreed) and one quiet action: "Use cellular data" while waiting for Wi-Fi, otherwise "Type it instead". The moon drawing's breath is replaced by a still drawing plus the determinate bar (HIG Progress indicators: determinate when known).

Acceptance:
- [ ] At most two controls plus Close; mobile data is used only on a tap (D-087).

#### S16 Review when the words do not come
Native only, no journey step (failed transcription, an empty take, a recording with no words). Verdict: redesign. Package P4.

Problem: three and four actions per state, a body that explains them, "The recording is safe on this phone" shown for a take whose file is empty, and a title ("No talking in this one") that says nobody spoke, which the Book's own rule forbids (the take may hold a laugh or a babble).

Copy:

| State | Title | Body | Primary | Quiet |
|---|---|---|---|---|
| Failed, can retry | `errors.transcriptionFailed.title` CHG "No words yet for this one" | `errors.transcriptionFailed.body` CHG "The recording is kept." | `errors.transcriptionFailed.button` "Try again" | `wordsCopy.noSpeech.keepButton` "Keep the recording" |
| The file is missing | `review.missingFile.title` NEW "The recording did not save" | none | `wordsCopy.noSpeech.typeButton` "Type it instead" | none |
| Empty take (no audio) | `review.emptyTake.title` NEW "Nothing was recorded" | `review.emptyTake.body` NEW "The take ended before any sound came in." | `wordsCopy.noSpeech.recordAgainButton` "Record again" | "Type it instead" |
| No words in the recording | `wordsCopy.noSpeech.title` CHG "No words in this one" | `wordsCopy.noSpeech.body` CHG "The recording is kept just as it is." | `wordsCopy.noSpeech.keepButton` "Keep the recording" | `wordsCopy.waiting.writeButton` "Write the words" |

In the no-words state, "Try again" (same audio, same result) and "Record again" (a new letter belongs on Tonight) are removed. The footer's duplicate "Keep the recording" is removed whenever the state card carries it. Drawings: a closed envelope for failed and no words, the page for an empty take; static.

Acceptance:
- [ ] No state claims a recording is kept when its file is empty or missing.
- [ ] No title says or implies that nobody spoke (D-086).
- [ ] The person writes any words; the app never fills them in.

#### S17 Review with small fixes
Steps J06-01, J06-02, J06-03, J06-04, J06-05, J06-06, J06-07, J18-05. Before: `screens/J06-01.png`, `screens/J06-01-full.png`, `screens/J06-03.png`, `screens/J06-06.png`, `screens/J18-05.png`. Verdict: redesign. Package P4.

Problem: a settings-like stack (dateline, title, a permanent "we" reassurance that stays up even in the "Exactly as said" view, the first-time card, the letter, the segmented control, the fix list, a footnote, two buttons). The letter is not the hero, and the website's proof letter sets a higher bar. The trust mechanics are unique and stay: no benchmark app marks machine changes.

Copy:

| Key | After | Mark |
|---|---|---|
| `review.title` | Read it back | KEEP |
| `review.subtitle`, `review.trustLine` | (not shown) | RET |
| `review.headerTo` | To {child} · Month {month} | NEW (letter header, left) |
| `review.headerToNewborn` | To {child} · The first weeks | NEW |
| `review.headerToBefore` | To {child} · Before You | NEW |
| `common.signature` | From {signsAs} | KEEP (letter header, right) |
| `review.firstNote.title`, `.body`, `.dismissButton` | Please have a read / We take out small slips, like an um or a repeat, and mark each one. Tap a mark to see it and put it back. We can mishear a name, so please read it before you save. / Got it | KEEP verbatim (registered disclosure, in-app-disclosures.md section 2) |
| `review.view.fixes`, `review.view.exact` | With small fixes / Exactly as said | KEEP |
| `review.changesLabel`, `changesLabelOne` | {count} small fixes / 1 small fix | KEEP, now the disclosure row |
| `review.noChanges` | No fixes. This is exactly what you said. | CHG |
| `review.noChangesAfterUndo` | Every fix put back. This is exactly what you said. | CHG |
| `review.noChangesNoRules` | Exactly as you said it. | KEEP |
| `review.edits.filler.explain` | An um or an uh, taken out. | CHG |
| `review.edits.falseStart.explain` | A sentence begun twice. The second try is kept. | CHG |
| `review.edits.repeat.explain` | A word said twice in a row. One is kept. | CHG |
| `review.edits.misheardName.explain` | A misheard name, spelled your way. | CHG |
| `review.edits.punctuation.explain` | Commas and periods, where you paused. | CHG (US) |
| `review.edits.grammarSlip.explain` | A slip of the tongue, like "a apple". Only that word changed. | CHG |
| `review.edits.paragraph.explain` | A long pause. A new paragraph starts here. | CHG |
| `review.edits.script.explain` | The same word, in the script you chose. | CHG |
| `review.edits.*.label` | Took out a sound / a restart / a repeat, Spelled your way, Punctuation, One word fixed, New paragraph, Your script | KEEP |
| `review.cardYouSaid`, `cardTakenOut`, `undoEditButton`, `putBackToast` | You said / Taken out / Put it back / Put back. | KEEP |
| `review.editTextButton` | Change words | KEEP |
| `review.destination.addButton` | Add to {child}'s book | KEEP |
| `review.destination.addButtonShort` | Add to the book | NEW (used when the filled label passes 22 characters) |
| `review.destination.privateButton` | Keep private | KEEP |
| `review.destination.privateHelp` | (not shown) | RET ("Keep private" carries it; VOICE: do not repeat a promise where nobody is wondering) |
| `review.saveFailed` | That did not save. | NEW (caution line above the primary, which reads "Try again" for that attempt) |

Visual: Review reads as a letter being read. Under the title, the letter sits on a **sheet** (`surfaceRaised`, `radius.xl` top corners, `radius.md` bottom corners, elevation 2, 16 pt gutters, 20 pt padding; dark `#201D1A` with a 1 px `line` border). Its header row, from the website ProofLetter: `review.headerTo` on the left and "From Mama" on the right, both in `letterDateline` caps `textMuted`. Then the words in `letterBody`. Marks use the website's grammar at full opacity from the first frame: a removed word carries a 1.5 pt `editMark` strike and sits in `textMuted`; a repaired name shows the struck heard word followed by the kept word on an `accentSoft` wash (radius 4). The first-time note (registered text) sits above the sheet as today and collapses on "Got it". The segmented control (44 pt pills) sits right under the sheet. The fix rows fold behind one disclosure row ("2 small fixes", chevron), because every mark is tappable in the text. "Change words" as a quiet link. Footer: "Add to Asha's book" (primary) and "Keep private" (quiet). No lamp: a voice plays here.

Motion: as MOTION 5d: tapping a mark expands an inline card under its line (`LinearTransition`, `standard`, content after 80 ms); "Put it back" cross-fades the word in (out 120, in 160 ms), the paragraph reflows, the restored word gets a 1.6 s `accentSoft` wash, and "Put back. Undo" stays until dismissed. Switching to "Exactly as said" cross-fades the text (150 ms).

States: first time (the note); no fixes (`review.noChanges`); every fix put back (`noChangesAfterUndo`); a language with no fix rules (`noChangesNoRules`); save failed (`review.saveFailed`, the primary reads "Try again"); stopped early (the S14 stop line above the sheet).

Acceptance:
- [ ] No "we" on the screen except inside the registered first-time note.
- [ ] Every mark is visible from the first frame, tappable, reversible both ways, and each one is an `EditType` checked by `verifyEdits` (constitution).
- [ ] "Exactly as said" and "Exactly as you said it." appear only when the final words equal the raw words (D-086).
- [ ] With a two-word name, the primary reads "Add to the book" whenever "Add to {child}'s book" would pass 22 characters.
- [ ] A failed save keeps the letter, relabels the primary "Try again" and shows "That did not save." directly above it.

#### S18 Review, change words
Step J06-08. Before: `screens/J06-08.png`. Verdict: polish. Package P4.

Visual: edit in place on the same sheet. No inner box; the sheet's own edge becomes a 1.5 pt `accent` line, the caret is in the letter face, "Done" (`common.doneButton`) sits in the header and in the keyboard accessory bar. The 2 pt focus ring stays for Full Keyboard Access only. No copy change.

Acceptance:
- [ ] No web-form rectangle inside the letter while editing; the person's edits are stored as theirs.

#### S19 Write
Steps J05-05, J07-01, J07-02, J07-06. Before: `screens/J07-02.png`. Verdict: polish. Package P4.

Copy: `write.autosaved` "Saved on this phone" KEEP; `write.label` KEEP; `tonight.typing.placeholder` "Write it the way you would say it." KEEP; `write.notSaved` NEW "Not saved yet" (autosave failure, caution, in the same place; retried on the next pause). The single "Save" is replaced by the destination pair (S20).

Visual: the lamp `write` scene (anchor top, 0.5, still: nothing breathes while typing). The prompt, when there is one, becomes the literary line in `prompt` (Literata 24/32) `textMuted`, above the page. The placeholder in `letterBody` `textMuted`. Above the keyboard: `review.destination.addButton` "Add to Asha's book" (primary) and `review.destination.privateButton` "Keep private" (quiet), side by side, stacking at accessibility sizes. Disabled until there is text, in the outline style.

Acceptance:
- [ ] Autosave line appears after a pause and stays; a failed write shows "Not saved yet" in place.
- [ ] Typed words are never touched by the machine.

#### S20 A typed letter: no Review step
Step J07-03. Before: `screens/J07-03.png`. Verdict: redesign. Package P4.

Decision: typed letters skip Review. A typed letter has no fixes and no recording, so "Read it back" is one extra screen between typing and keeping. Content and States wanted to keep it; Product wanted to skip it. Skipping wins: HIG Modality "keep modal tasks simple, short, and streamlined" (*verified by the product lens*); Apple Notes and Bear save without a review step (*memory, unverified*). The Keep step is still the only gate (D-082): tapping "Add to Asha's book" or "Keep private" on Write runs `decideKeepLetter()` exactly where Review does today, and the Plus gate (S22) opens from that tap.

Acceptance:
- [ ] From Write, one tap keeps the letter and shows the saved moment (S21); no "Read it back" screen for typed letters.
- [ ] The third kept letter without Plus opens the gate from Write, and the letter waits as a draft (D-082, D-083).

#### S21 The saved moment
Steps J06-09, J06-10, J06-11, J07-04, J07-07, J07-08. Before: `screens/J06-09.png`, `screens/J07-07.png`. Verdict: redesign. Package P4.

Problem: the letter fades to about 10 to 15 percent opacity and stays there behind a green line. The captures read as a rendering bug, and nothing shows where the letter went.

Copy:

| Key | After | Mark |
|---|---|---|
| `review.destination.addedToast` | Added to {child}'s book. | KEEP |
| `review.destination.filedChip` | Filed in Month {month} | NEW |
| `review.destination.filedChipNewborn` | Filed in the first weeks | NEW |
| `review.destination.filedChipBefore` | Filed in Before You | NEW |
| `review.destination.privateToast` | Kept just for you. | KEEP (chip with LockSimple) |
| `review.destination.voiceOnlyToast` | Recording kept on this phone. | KEEP |
| `billingCopy.keepGate.secondFreeNote` | That was your second free letter. | KEEP, once, muted beneath (D-082) |

Visual and motion: build MOTION 5e as written. Commit, `success` haptic, then animate. At 0 ms the sheet scales from 1 to 0.9 and its radius goes from `xl` to `md` on `gentle`. At 250 ms (`motion.file.chipAtMs`) the chip fades in under it: `accentSoft` fill, `caption`, with the website's lit edge (a 1 pt border in the lamp `amber` tone at 40 percent opacity). At 550 ms (`moveAtMs`) the card moves down 24 pt (`dy`) and fades on `standard`. The modal dismisses natively at about 900 ms. The confirmation line ("Added to Asha's book.") is in `text` with a success check icon, not green text. The person's words are never shown at ghost opacity: the card is at full strength or leaving. A tap skips to the end. On arrival in the Book the new card is already in place under a 1.6 s `accentSoft` wash. The States lens proposed a lamp bloom behind the saved card. Rejected: Review is a voice screen, and principle 5 keeps light off it.

Reduce Motion: the chip and the line appear with one 200 ms fade, then the modal dismisses; the arrival wash is static, then fades.

Acceptance:
- [ ] The save commits before any animation (MOTION principle 3); killing the app mid-animation loses nothing.
- [ ] The chip names the real month, "the first weeks" or "Before You".
- [ ] No frame shows the letter's words at partial opacity for longer than the 350 ms exit.
- [ ] "That was your second free letter." shows once, on the second kept letter only, with no count of what is left.

#### S22 Keep needs Plus
Steps J06-14, J07-09. Before: `screens/J06-14.png`. Verdict: redesign. Package P6.

Problem: it looks like an empty state (a small glyph in a corner circle, two paragraphs), and it asks for something without showing the letter it is about. "Come back to it once Plus is on." tells the person what to do later instead of where the letter is now.

Copy:

| Key | After | Mark |
|---|---|---|
| `billingCopy.keepGate.title` | Keep adding to {child}'s book | KEEP |
| `billingCopy.keepGate.body` | Your first two letters are kept for good. Plus lets you keep adding letters. | CHG |
| `billingCopy.keepGate.heldNote` | This one waits on Tonight, exactly as it is. | CHG |
| `billingCopy.keepGate.heldChip` | Waiting | NEW (chip on the held letter) |
| `billingCopy.keepGate.seePlus` | See Plus | KEEP, primary |
| `billingCopy.keepGate.holdButton` | Keep it here for now | KEEP, quiet |
| `billingCopy.keepGate.redeemLink` | Redeem a code | KEEP |
| `billingCopy.keepGate.lapsedBody` | Plus has ended. Every letter you kept is still yours to read, play and export. | CHG |
| `billingCopy.keepGate.offline` | Plus needs a connection to start. This one waits on Tonight. | CHG |
| `billingCopy.gate.unavailable` | Plus is not available on this device yet. | KEEP |

Visual: a full-height sheet on paper. At the top, the **held letter itself** as a small paper card (`surfaceRaised`, `radius.md`, elevation 1, rotated -2 degrees): its dateline, its first two lines in `letterBody` with a fade, "From Mama", and the "Waiting" chip. Then the title in `title1`, the body in `body`, the held note in `footnote` `textMuted`. Then "See Plus" (opens the Plus store screen with Apple's `SubscriptionStoreView`), "Keep it here for now", and the "Redeem a code" link. No lamp and no lockup on this sheet: the stacked lockup belongs above Apple's subscription view (registry `app.paywall`), and light is for the person's moments, not for selling. No price, trial or countdown anywhere on the sheet (D-083).

Motion: the sheet opens natively; the held card rises with `motion.enter`; buttons are static.

States: no StoreKit on the device (one "Keep it here for now" and the "not available" line); offline (the offline line under "See Plus", which stays and retries); lapsed (`lapsedBody`).

Acceptance:
- [ ] The held letter's own first words are on the sheet; nothing is sent anywhere to show them.
- [ ] No "$", "price", "free trial" or "free months" on the sheet (the rules test already enforces this for `keepGate`).
- [ ] "Keep it here for now" closes the sheet and the letter appears on Tonight as "Waiting to be kept." (S09).

#### S23 Review opened with no draft
Step J06-13. Before: `screens/J06-13.png`. Verdict: polish. Package P4.

Copy: `review.noDraft.title` NEW "Nothing to read back here."; `review.noDraft.button` NEW "Go to the book". `errors.generic` stays for real failures only.

Visual: `StateScreen` kind `notFound`: the page drawing, static, centred; the title in `title2`; the primary at the bottom; Close in the header. No red, no body.

Acceptance:
- [ ] A stale Review link never says "Something went wrong" or asks to try again.

### Chapter 3. The first letter in the book

#### S24 Book, empty
Steps J03-04, J09-01. Before: `screens/J09-01.png`, `screens/J03-04.png`. Verdict: polish. Package P5.

Copy: `book.empty.bookTitle` "The first page is waiting." KEEP; `book.empty.bookBody` CHG "Tell {child} one thing about today." (VOICE's own "Do" line; the old one repeated the finish screen's sentence with another adjective); `book.empty.bookCta` "Write a letter" KEEP. With one book, the `children.switcher.label` row ("FOR ASHA") is hidden, because "Asha's book" already says the name.

Visual: the book cover (section 5.4), closed, 160 x 214 pt, centred: the same object the person named and signed in first run. The lamp `book` scene (top, 0.6, still). Title in `title1`, body in `body` `textMuted`, CTA full width at the bottom.

Motion: the cover is still (the lamp is the only light; nothing breathes). Reduce Motion: no change.

Acceptance:
- [ ] The cover shows the child's name and "From {signsAs}".
- [ ] No count of missing days or months.

#### S25 Whose book? sheet
Step J03-05. Before: `screens/J03-05.png`. Verdict: polish. Package P5.

Copy: KEEP `children.switcher.title` "Whose book?", the "{child}'s book" rows, `children.switcher.addButton` "Add a child". Each row adds the child's current month under the name in `footnote` `textMuted`, using existing keys (`book.chapterTitle` "Month {month}", `book.chapterNewborn`, `book.beforeYouChapter`).

Motion: choosing a book cross-fades Tonight's and the Book's content over 200 ms.

Acceptance:
- [ ] Each row shows a month line; the current book has the check.

#### S26 Book with letters
Steps J08-03, J08-05, J08-06, J09-02, J09-03, J09-04, J09-05, J11-05, J11-06, J18-03. Before: `screens/J09-02.png`, `screens/J09-04.png`, `screens/J09-04-full.png`, `screens/J18-03.png`. Verdict: redesign. Package P5.

Problem: it reads as a feed. The current month is a tinted box that explains the filing system on every visit and takes the hero position from the newest letter. Excerpts end in a cut-off glyph. A letter opens with a generic push.

Copy:

| Key | After | Mark |
|---|---|---|
| `book.title` | {child}'s book | KEEP |
| `book.monthKicker` | Month | NEW (opener kicker, caps by style) |
| `book.thisMonthLabel` | This month | KEEP (kicker of the current month's opener) |
| `book.chapterNewborn`, `book.beforeYouChapter` | The first weeks / Before You | KEEP (in place of the numeral) |
| `book.chapterLetters`, `chapterSubtitleOne` | {count} letters / 1 letter | KEEP |
| `book.monthRange` | {start} to {end} | NEW (for example "September 13 to October 12") |
| `book.empty.chapterTitle`, `chapterBody` | (not shown on the Book) | RET |
| `book.waitingForWords` | A recording, waiting for its words. | KEEP |
| `book.waitingReady` | Ready to read back | NEW |
| `bookCopy.nobodySpoke` | No words in this one. The recording is kept just as it is. | KEEP |
| `book.quietDay.label`, `remove` | A quiet day / Remove this mark | KEEP |
| `book.quietDay.removedToast` | Mark removed. | CHG |
| `book.privateLabel` | Private | KEEP |
| `book.chapterSubtitle`, `chapterNotes`, `chapterNoteOne`, `chapterMixed` | (v1.0 makes no notes) | RET |

Visual:
- **Month openers.** Each month starts with: the kicker ("MONTH", or "THIS MONTH" for the current one) in `letterDateline` caps `textMuted`; then the numeral in the new token `type.numeral` (Literata Medium 64/64, max scale 1.4), or "The first weeks" / "Before You" in `title1`; then "2 letters · From Mama" in `footnote`; then `book.monthRange` in `letterDateline` `textMuted`; a hairline above each opener except the first.
- **The current month is lit**: its opener sits in a `radius.lg` card on paper with a 1 pt edge in the lamp `amber` tone at 40 percent and a still inner radial in `gold` at the scheme's peak times 0.5. When it has no letters, the opener stands alone, like an open page, with no sentence.
- **Letter cards** as today (dateline caps, the excerpt in `letterBody`, "From Mama", the Private chip, the recording length), except the excerpt ends in a fade (a react-native-svg `LinearGradient` from transparent to the card colour over the last 40 percent of the final line), never the ellipsis glyph.
- **Waiting and no-words cards**: a 16 pt Microphone glyph instead of the info icon (which reads as a warning). The waiting card adds its live reason beside its length, in `footnote` `textMuted`: `speechSettingsCopy.downloading` ("Getting ready, 40%"), `waitingForWifi`, or `book.waitingReady`.
- **Quiet-day rows**: unchanged: the app's own small line, sans, muted, unsigned (D-084).
- Lamp `book` scene (top, 0.6, still) behind the header; cards are opaque.

Motion: the first Book view per session settles the header (opacity 0.6 to 1, y 6 to 0, `gentle`; MOTION 5a). A new letter arrives in place with the 1.6 s `accentSoft` wash. Opening a letter uses the measured-rect transition (MOTION 5f): the tapped card's rect grows to full screen by translate and scale, radius `md` to 0, on `standard`; content fades in from 60 percent progress; the list behind dims to 0.96 with no blur. Back reverses it if the card is still visible, otherwise a 200 ms fade. Reduce Motion: 200 ms cross-fades. Fallback on any failure: the native push.

States: one letter (J09-02); many months (J09-04); a recording waiting (J09-03); no words (J09-05); quiet days and removing a mark with Undo (J08-03, J08-05, J08-06); dark (J18-03).

Acceptance:
- [ ] No tinted explainer box at the top; the current month is a lit opener with no sentence.
- [ ] Month openers show the numeral, the letter count and the date range.
- [ ] No ellipsis glyph in any excerpt; the stored letter is never cut.
- [ ] A quiet-day mark is never counted or shown in the letter face.
- [ ] The card-to-page transition reverses on Back and falls back to the native push under Reduce Motion or on failure.

#### S27 A letter, as a page
Steps J10-01, J10-02, J10-05, J10-07, J10-09, J18-04. Before: `screens/J10-01.png`, `screens/J18-04.png`. Verdict: polish. Package P5.

Copy:

| Key | After | Mark |
|---|---|---|
| `book.provenance.spokenFixed`, `spokenExact`, `typed` | Spoken, with small fixes / Spoken, exactly as said / Typed | KEEP |
| `book.recordingOnPhone` | Recording kept on this phone | KEEP, joined into one line with the provenance: "Spoken, with small fixes. Recording kept on this phone." |
| `book.hearShort` | Hear {signsAs} | KEEP |
| `review.originalLabel` | Exactly what you said | KEEP |
| `book.entryMenu.*` | Add to book / Make private / Delete | KEEP |
| `playerCopy.cannotPlay` | This recording will not play here. Export keeps the file. | CHG |

Visual: the letter itself unchanged (dateline, words in `letterBody`, the italic signature, Reading size "Aa"). One **pill player** (`components/player/audio-player.tsx`): elevation 2, 56 pt tall, the play button, "Hear Mama", the time remaining, and a thin scrubber inside the pill (replacing the separate full-width slider and time labels). One provenance line in `footnote` `textMuted` with a Microphone icon, then the "Exactly as said" link (only when raw differs from final). The grouped action list stays. No lamp and no loop: a voice plays here. No paper texture (section 5.3 explains why). Chrome fades on scroll (DESIGN_LANGUAGE 12).

Motion: "Exactly as said" cross-fades the text over 150 ms with its label. Reading size cross-fades as today.

Acceptance:
- [ ] One player control group, not three rows.
- [ ] The "on this phone" fact stays visible on the page (K-42, D-033); only its form changes.
- [ ] Nothing loops on the letter page.

#### S28 A letter with no words
Step J10-10. Before: `screens/J10-10.png`. Verdict: polish. Package P5.

Copy: `bookCopy.nobodySpoke` KEEP; primary `wordsCopy.waiting.writeButton` "Write the words" (opens the existing sheet: `wordsCopy.waiting.writeLabel` "Words for this recording", `saveButton` "Save words", `cancelButton` "Not now"). "Record again" is removed from this page (it starts a separate letter and can meet the gate). "Add to book" and "Delete" stay.

Acceptance:
- [ ] After saving words, the provenance reads "Typed" and the signature sits under the person's words; the recording is untouched (D-058).

#### S29 Reading size sheet
Steps J10-03, J10-04. Before: `screens/J10-03.png`. Verdict: keep. Package P5.

Copy KEEP (`reader.readingSizeTitle`, `reader.sizes.*`). Each row's label is set in Literata at its own size (Standard 20, Large 24, Large print 29), the page behind changes live, the font size never animates (text cross-fades 150 ms), with a `selection` haptic per step (MOTION 5i). Apple Books "Themes and Settings" (*repo-verified*, BENCHMARK S9).

### Chapter 4. The book growing

#### S30 Read together
Steps J11-01, J11-02, J11-03, J11-08. Before: `screens/J11-01.png`, `screens/J11-03.png`. Verdict: redesign. Package P5.

Problem: nothing says bedtime or turning a page (the next letter swaps instantly), the dateline joins a name and a month with a comma and a mid-line capital ("Mama, The first weeks"), the autoplay switch is a settings row inside the reading experience, and "1 / 5" sits at the top like a counter.

Copy:

| Key | After | Mark |
|---|---|---|
| `readTogether.nowReading` | Month {month} · From {signsAs} | CHG |
| `readTogether.nowReadingNewborn` | The first weeks · From {signsAs} | NEW |
| `readTogether.nowReadingBefore` | Before You · From {signsAs} | NEW |
| `readTogether.autoplayLabel` | Keep playing | CHG |
| `readTogether.positionA11y` | Letter {n} of {count} | NEW (VoiceOver only) |
| `readTogether.previousButton`, `nextButton` | Back one / Next letter | KEEP |
| `readTogether.noRecording` | This one was typed. Read it aloud together. | KEEP |

Visual: chrome-free, Large print by default (as today), following the app's Appearance setting. The Visual lens proposed forcing a night page here whatever the theme. Rejected: the person chose an appearance in Settings, Appearance, and Large print readers who need light paper would lose it. At night (greeting `evening`, `night` or `lateNight`), the `readTogether` scene adds one **still** dusk pool anchored at the bottom behind the controls, never behind the letter text. The position becomes a 2 pt hairline progress line under the top bar (`accent` at 40 percent). "Keep playing" is a quiet toggle chip under the pill player, remembered across sessions, exposed to VoiceOver as a switch. The dateline in `letterDateline`.

Motion: **page turn** (new, `motion.pageTurn`): "Next letter" moves the page 24 pt left and fades it out (`exitMs` 160) while the next one enters from 24 pt right on `standard`. "Back one" reverses it. A horizontal swipe does the same, follows the finger, and can be interrupted. No curl. Quiet days are never pages (D-084). Reduce Motion: a 200 ms cross-fade. Haptic: none (playback has none, MOTION 6).

States: a typed letter (`noRecording`); a recording not on this phone (the existing line); autoplay on (J11-03).

Acceptance:
- [ ] The dateline reads "Month 2 · From Mama" or "The first weeks · From Mama".
- [ ] There is no "1 / 5" text; VoiceOver reads "Letter 1 of 5".
- [ ] The dusk pool appears only in the evening and later, never moves, and never sits behind the letter text.
- [ ] No word highlight (D-059).

#### S31 Read together, the end of the book
Step J11-04. Before: `screens/J11-04.png`. Verdict: polish. Package P5.

Copy: `readTogether.endOfBook` "That is every letter so far. More are still being written." KEEP (the Content lens wanted to cut the second sentence; three lenses keep it, and it speaks of time, not endings, as VOICE's legacy rule asks); `readTogether.finishButton` "Close the book" and `againButton` "Read it again" KEEP. `readTogether.endOfMonth` and `endOfMonthAlt` CHG, both "That was Month {month}." ("You are so loved." and "Every word was for you." are the app speaking sentiment to the child in its own voice; VOICE: the app's own words are small and add no meaning, and the letters carry the love.)

Visual and motion: the moon line drawing (ported stroke table, section 5.4) draws on over `drawMs` (1200 ms) above the line, centred. At night the dusk pool dims from its level to half over 1200 ms. Then nothing moves. The buttons are present from the first frame. Reduce Motion: the drawing is complete; one 200 ms fade.

Acceptance:
- [ ] After the drawing completes, nothing on the screen moves.

#### S32 Read together with no letters
Step J11-07. Before: `screens/J11-07.png`. Verdict: polish. Package P5.

Copy: title `readTogether.title` KEEP; body `readTogether.empty` KEEP; primary `book.empty.bookCta` "Write a letter" (to Tonight). The moon drawing, static. Close in the header.

Acceptance:
- [ ] The stale link has a way forward, not only Close.

### Chapter 5. The quiet days

#### S33 Not much today, kept
Steps J08-02, J08-04. Before: `screens/J08-02.png`. Verdict: polish. Package P3.

Copy: `notMuch.savedToast` CHG "A quiet day, kept." (the old "Kept. Rest well." assumes bedtime and was captured at 2 pm; the new words match `book.quietDay.a11y`); `notMuch.undo` "Undo" KEEP; `notMuch.confirmBody` KEEP (VoiceOver hint).

Visual: in place of the link, the Phosphor Moon glyph (20 pt, `textMuted`), the line in `text` (not success green), and "Undo" beside it. It stays until Undo or until the person leaves Tonight.

Motion: the link fades out (160 ms) and the line fades in (200 ms), with the `soft` haptic. In the evening dayparts (`evening`, `night`, `lateNight`) the Tonight lamp eases to 70 percent of its level over 1200 ms: lights down. Undo restores both. Reduce Motion: fades; the lamp change is instant.

Acceptance:
- [ ] The mark stores no words (D-084); no count, no streak.
- [ ] Undo restores the link and the lamp.

#### S34 Reminders
Steps J13-01, J13-02, J13-03. Before: `screens/J13-02.png`, `screens/J13-02-full.png`. Verdict: polish. Package P6.

Copy:

| Key | After | Mark |
|---|---|---|
| `settings.reminders.help` | A gentle nudge a few evenings a week, at the time you choose. Never late at night. | KEEP |
| `reminderCopy.settings.monthNotesLabel` | Month and birthday messages | CHG (BRAND.md: "note" is only something a person makes; the glossary's own example) |
| `reminderCopy.settings.monthNotesHelp` | A short message on the day a new month begins in each book, and on birthdays. | CHG |
| `reminderCopy.settings.eveningsHelp`, `eveningHelp` | (not shown; the chips speak for themselves) | RET |
| `reminderCopy.settings.lateNightClamp` | Late nights stay quiet. | CHG |
| `reminderCopy.settings.deniedTitle` | Notifications are off | CHG |
| `reminderCopy.settings.deniedBody` | Turn them on in Settings to get these reminders. | CHG |
| `reminderCopy.settings.openSettingsButton` | Open Settings | KEEP |
| `reminderCopy.settings.onToast` | Reminders are on. | NEW |
| `settings.reminders.pauseLabel` | (removed if it duplicates the master switch, see below) | RET if so |

"Pause all reminders" sits under a master "Reminders" switch, which is two ways to turn off the same thing (HIG Settings: "Minimize the number of settings you offer", *verified*). P6 checks `reminders.tsx`: if turning the master switch off keeps the cadence, evenings and time (it should), the Pause row goes. If it does not, P6 makes the master switch keep them, then removes Pause.

Visual: the notifications-off card gets WarningCircle in `caution`. On iOS the switch is the native switch with an `accent` track. On the web preview `toggle.web` uses the same tokens; the teal thumb in J11-03, J13-02 and J14-01 is a web-only defect. When the person returns from Settings with permission granted, the card collapses (`LinearTransition`, 280 ms) and the toast "Reminders are on." shows.

Acceptance:
- [ ] One switch per decision; no "note" for anything the app sends.
- [ ] No count of days or runs anywhere on the screen or in the notifications.

### Chapter 6. The hard moments (delete, restore, not found)

#### S35 Delete this letter?
Step J10-06. Before: `screens/J10-06.png`. Verdict: polish. Package P5.

Copy: `settings.delete.entryTitle` "Delete this letter?" KEEP; `settings.delete.entryBody` CHG "It waits in Recently deleted for 30 days."; `settings.delete.keepButton` "Keep it" KEEP (primary, the default); `settings.delete.entryConfirm` "Delete letter" KEEP (quiet, destructive, with the Trash icon). The header Close is removed: "Keep it" and a swipe down are the ways out. D-085 chose a light confirm for letters; it stays, although HIG Alerts would not ask for an undoable delete. The `warning` haptic plays only on the confirm.

#### S36 Letter deleted, with Undo
Step J10-08. Before: `screens/J10-08.png`. Verdict: redesign. Package P5.

Problem: a blank page says "Letter deleted." and explains the buttons while a toast says the same thing.

Copy: `settings.delete.entryToast` "Letter deleted." KEEP; `common.undoButton` "Undo" KEEP; `reader.deletedBody` (no page any more) RET.

Behaviour: on confirm, return to the Book at once (this follows the person's own tap, not a timer, so TDD 09 A11Y-F03 holds). The card collapses out of its row (height to 0 and a fade over `exitMs` 160, `LinearTransition` `standard`). One toast sits above the tab bar: "Letter deleted." with "Undo" and Close. It has an action, so it stays until Undo, Close or leaving the Book (DESIGN_LANGUAGE 11.5). Undo puts the card back in its place with the 1.6 s `accentSoft` wash.

Acceptance:
- [ ] No full-page deleted state remains.
- [ ] The toast has no timer; Undo restores the card in place.

#### S37 Letter not found
Step J10-11. Before: `screens/J10-11.png`. Verdict: polish. Package P5.

Copy: `reader.notFoundTitle` CHG "This letter is not in the book." ("not here anymore" leans toward loss language and was not what happened); `reader.notFoundDeleted` NEW "It is in Recently deleted."; `reader.openShelfButton` NEW "Open Recently deleted"; `reader.notFoundCta` "Back to the book" KEEP.

Behaviour: if a tombstone exists for that id, show the deleted line, "Open Recently deleted" (primary) and "Back to the book" (quiet). Otherwise no body and "Back to the book". `StateScreen` with the page drawing, static, centred. Never show the id or the route.

#### S38 Recently deleted
Steps J10-12, J10-13, J10-15. Before: `screens/J10-12.png`, `screens/J10-13.png`, `screens/J10-15.png`. Verdict: redesign. Package P5.

Problem: the excerpt is in the UI sans although it is the person's words, three stacked dates include "Erased on" with a future date, the empty state repeats the nav title as a heading, and after "Erase now" the capture still shows a stale "Letter restored." toast, the opposite of what happened.

Copy:

| Key | After | Mark |
|---|---|---|
| `settings.delete.shelfHelp` | Letters you delete wait here for 30 days. | KEEP (the line under the nav title) |
| `settings.delete.shelfEmpty` | No deleted letters. | CHG |
| `settings.delete.deletedOn` | Deleted {date} | KEEP |
| `settings.delete.erasesOn` | Kept here until {date} | CHG |
| `settings.delete.restoreButton`, `eraseNow` | Restore / Erase now | KEEP |
| `settings.delete.restoredToast` | Back in {child}'s book. | CHG |
| `settings.delete.openButton` | Open | NEW (toast action after Restore) |
| `settings.delete.erasedToast` | Erased from this phone. | NEW |

Visual: each card: the first words in `letterBody` `textMuted`, two lines with the fade (the full text is the accessibility label), "From Mama", then one `footnote` line joining the two dates ("Deleted October 13. Kept here until November 12."), then "Restore" (secondary filled) and "Erase now" (quiet destructive with the Trash icon). No countdown, no count (D-085). Empty: the page drawing, static, and `shelfEmpty`; no repeated heading.

Behaviour: a new toast always replaces the one on screen (`components/ui/toast.tsx`, P1). Restore: the card lifts out (160 ms) and "Back in Asha's book." with "Open". Erase now: the sheet (S39), then "Erased from this phone." with no action, which may time out after 4 s because it carries no action.

Acceptance:
- [ ] After Erase now, no "Letter restored." toast is visible.
- [ ] No date reads as already done when it is in the future.

#### S39 Erase this letter now?
Step J10-14. Before: `screens/J10-14.png`. Verdict: keep. Package P5.

Copy: `settings.delete.eraseNowTitle` "Erase this letter now?" KEEP; `settings.delete.eraseNowBody` CHG "The letter and its recording are erased from this phone right away."; `settings.delete.keepButton` "Keep it" KEEP (default); `settings.delete.eraseNow` "Erase now" KEEP (destructive). An irreversible loss gets a sheet: HIG Feedback (*verified*). On a phone the file is removed first, then the row (D-085).

### Settings, Plus and the rest

#### S40 Settings home, with If you are struggling and Licenses
Steps J03-06, J03-09, J16-01, J16-05, J16-06. Before: `screens/J16-01.png`, `screens/J16-01-full.png`, `screens/J16-05-full.png`, `screens/J16-06-full.png`. Verdict: polish. Package P6.

Problem: the early-version note is the first thing on every visit, in a tinted card, although `in-app-disclosures.md` section 1 registers it for Settings, About. The privacy short line appears twice. "If you are struggling" and the licenses open as accordions in the middle of the list.

Copy:

| Key | After | Mark |
|---|---|---|
| `settings.about.beta.label`, `.body` | Early version / {app} is an early version, and it can make mistakes. Some things may change. Export a copy of your letters now and then. | KEEP verbatim (registered), MOVED to About as its footer, unstyled |
| `trust.short` | Private by default. Never sold, never used for ads. | KEEP, shown once (under Your data); the page footer copy is removed |
| `settingsHome.planHelp` | Your first two letters are free. Plus lets you keep adding letters. | CHG |
| `settingsHome.licencesLabel` | Licenses | CHG (US) |
| `licences.title`, `licences.rowLabel` | Licenses | CHG (US) |
| `struggling.*` | as today, word for word | KEEP (FT-36 owns any change) |
| `settingsHome.strugglingA11yHint` | Shows free, confidential support lines. | KEEP |

Visual: About shows the app icon at 60 pt and the small-cut lockup at 22 pt (registry `app.settings.about`), the version, then the early-version footer. "If you are struggling" and "Licenses" become rows with a chevron that push their own pages, like every other row (iOS Settings, observed). The struggling page keeps its three resources and the 911 line exactly, with no drawing, lamp or motion. Everything else as today.

Acceptance:
- [ ] The early-version note appears only under About, with its registered text unchanged (D-060, K-13).
- [ ] The short privacy line appears once on Settings home.
- [ ] No accordion opens inside the Settings list.
- [ ] The struggling resources are one tap from Settings home and unchanged.

#### S41 Plan
Steps J12-01, J12-02. Before: `screens/J12-01.png`, `screens/J12-02.png`. Verdict: polish. Package P6.

Problem: the same sentence twice in a row, "Manage subscription" shown when there is no subscription, no way to see what Plus adds or redeem a code, plan names that are not the App Store's (D-077), and a "we" reassurance about card details.

Copy:

| Key | After | Mark |
|---|---|---|
| `billingCopy.plan.seePlans` | See what Plus adds | KEEP, first row (opens the Plus store screen) |
| `billingCopy.store.promise` | Your first two letters are free. Every letter you keep stays yours to read, play and export, with or without Plus. | KEEP verbatim (registered), the section footer, once |
| `billingCopy.plan.off` | (no status card when Plus is off) | RET |
| `billingCopy.plan.manage` | Manage subscription | KEEP, shown only when a subscription exists (the Terms and emails name "Settings, Plan, Manage subscription") |
| `billingCopy.plan.restore` | Restore purchases | KEEP |
| `billingCopy.keepGate.redeemLink` | Redeem a code | KEEP, now also a row here |
| `billingCopy.plan.payment` | Apple takes the payment. Card details stay with Apple. | CHG |
| `billingCopy.plan.monthly` | Plus Monthly | CHG (D-077) |
| `billingCopy.plan.annual` | Plus Annual | NEW (D-077; `plan.yearly` RET) |
| `billingCopy.plan.grace` | Apple could not take the last payment. Plus stays on while Apple tries again. | CHG |
| `billingCopy.plan.retry` | Plus is paused until a payment goes through. Every letter you kept is still here. | CHG |
| `billingCopy.plan.restoring` | Checking with the App Store | NEW (row subtitle while restoring) |
| `billingCopy.plan.restoreNone` | No Plus found for this Apple Account. | NEW |
| `billingCopy.plan.restoreFailed` | The App Store did not answer. Try again in a moment. | CHG |
| `billingCopy.store.subtitle` | Two letters free. Then Plus. | CHG (it promised "a few extras"; Plus adds one thing) |
| `billingCopy.store.features` | Keep adding letters to every book, as many as you like. | KEEP (registered; must match Subscription Terms) |

Visual: an iOS Settings list. Section PLUS: "See what Plus adds" with a chevron, then the promise footer. Second section: "Manage subscription" (only with a subscription), "Restore purchases", "Redeem a code", footer `plan.payment`. The restore result shows inline under its row (WarningCircle in `caution` for a failure). With Plus on, the first row reads "Plus" with the value "On" and the plan name and renewal date from StoreKit. The **Plus store screen** (`See what Plus adds`, Apple's `SubscriptionStoreView`) carries the stacked lockup once above Apple's view (registry `app.paywall`, 88 to 120 pt) and `billingCopy.store.subtitle` as its one line. No lamp on either.

Acceptance:
- [ ] No sentence appears twice on Plan.
- [ ] Plan names read "Plus Monthly" and "Plus Annual", matching App Store Connect (founder item for the ASC display name).
- [ ] No price typed in the app (D-083; the rules test checks `plan`).

#### S42 Recordings
Step J14-01. Before: `screens/J14-01.png`. Verdict: polish. Package P6.

Copy:

| Key | After | Mark |
|---|---|---|
| `settings.recordings.onPhoneTitle`, `onPhoneBody` | Kept on this phone / Recordings are kept on this phone and in your iPhone's own backup, if you use one. Export any time to keep a copy of your own. | KEEP |
| `settings.recordings.keepHelp` | (not shown; the card above says it) | RET |
| `speechSettingsCopy.title` | Writing down your words | KEEP |
| `speechSettingsCopy.footer` | Removing a language frees space. Recordings and letters stay, and new recordings wait for their words until it is added again. | CHG |
| `speechSettingsCopy.downloadButton` | Download | NEW (row's trailing action) |
| `settings.tidyLabel`, `tidyOn`, `tidyOff` | Word for word / Small fixes, marked / Exactly as said | KEEP (Settings may name the feature) |
| `settings.tidyHelp` | Small fixes are marked in each letter and can be put back. Exactly as said keeps every um and false start. Either way, we never rewrite your words. | CHG |
| `settings.help.mistakesTitle`, `settings.help.mistakes` | How transcription works / Your words are kept as you said them. We can mishear, so read each letter and fix anything we got wrong. | KEEP verbatim (registered), the last footer |
| `packsCopy.cellularTitle` | Use cellular data | CHG (US) |
| `languageCopy.status.downloadNow` | Download now on cellular data | CHG (US) |

Visual: the language row reads "English" with the subtitle "575 MB" and a trailing "Download" text button when the model is not on the phone. While downloading, a small determinate ring with "Getting ready, 40%"; when done, "On this phone, 575 MB" and "Remove" (the existing confirm). No illustration.

Acceptance:
- [ ] No fact appears twice on the screen.
- [ ] The language row is actionable when the model is missing.

#### S43 Export
Steps J15-01, J15-02, J15-03. Before: `screens/J15-02.png`, `screens/J15-03.png`. Verdict: polish. Package P6.

Copy:

| Key | After | Mark |
|---|---|---|
| `settings.export.body` | (not shown on Export; the "What is inside" list says it) | RET on this screen |
| `exportCopy.screen.offlineNote` | Nothing is sent anywhere. | CHG |
| `settings.export.neverExported`, `exportNudge` | Not exported yet / Save a copy of your book in Files or iCloud Drive. It is yours to keep. | KEEP |
| `exportCopy.screen.includesLetters` | Every letter, as text | CHG (v1.0 makes no notes) |
| `exportCopy.screen.includesRecordings`, `includesBook`, `includesData` | as today | KEEP |
| `settings.export.button` | Export everything | KEEP |
| `exportCopy.screen.emptyNote` | Export opens once the book has a letter. | NEW (above the disabled button) |
| `exportCopy.screen.failedTitle` | The export did not finish | KEEP |
| `exportCopy.screen.lowSpaceBody` | This phone needs more free space first. | CHG |
| `exportCopy.screen.tooBigTitle` | This book is too big for one file | NEW |
| `exportCopy.screen.tooBigBody` | (not shown; the button says it) | RET |
| `settingsHome.helpValue` | Write to us | KEEP, primary for too big (mail, subject `settingsHome.helpSubject`) |
| `exportCopy.screen.againButton` | Export again | KEEP |
| `exportCopy.screen.cancelled` | Export stopped. | CHG ("Nothing was kept" could read as letters not kept) |
| `exportCopy.screen.privacyNotice` | This file holds your letters and recordings, unlocked. Keep it somewhere private. | KEEP (DATA-REQ-056) |

Visual: a live thumbnail of the export's cover at the top: the book cover, closed, 96 x 128 pt, with the child's name and the month span ("Month 1 to 7"), so the person sees what they will get. The "What is inside" rows get 20 pt Phosphor icons (FileText, Microphone, BookOpen, Database). The failure card gets WarningCircle in `caution`. Empty book: the disabled button in the outline style with the empty note above it. Never mention print.

Acceptance:
- [ ] Every failure names its cause and has an action that can work (too big leads to "Write to us").
- [ ] Export stays free and offline.

#### S44 Privacy
Step J16-02. Before: `screens/J16-02.png` (stale: the usage switch is hidden on `develop` because `capabilities.analytics` is off). Verdict: polish. Package P6.

Copy: `consentCopy.neverTitle` "What we never do" and its three lines KEEP (registered claims); `settings.privacy.documentsTitle` and the four links KEEP; `settings.privacy.analyticsOffNote` CHG "Turning this off stops sharing right away. Nothing else changes." (US; the screen part is hidden in v1.0).

Visual: the three never-lines become a plain list on paper, each with a 20 pt Phosphor icon in `textMuted`, not white grouped rows (rows look tappable and are not). The policy links stay as rows.

#### S45 Appearance
Steps J16-03, J16-04, J18-01. Before: `screens/J16-03.png`. Verdict: polish. Package P6.

Problem: the live sample "Dear {child}, today you laughed at the rain." is a letter the app wrote, set in the letter face, which VOICE forbids ("The app's own words ... never sit in the letter's type").

Copy: `settingsMore.themes.*` ("Match this phone", "Light", "Dark") KEEP; `reader.sizes.*` KEEP; `reader.preview` RET; `reader.previewEmpty` NEW "Aa".

Visual: the sample is the first line of the person's newest letter in the book (never a private letter), in `letterBody` at the chosen size. With no letter yet, the glyph specimen "Aa" in Literata at each size. The three Reading size labels are set in Literata at their own size (as S29). A theme change cross-fades the UI over 200 ms.

Acceptance:
- [ ] No sentence the app wrote is shown in the letter face.

#### S46 A child's book settings
Steps J03-07, J03-20, J03-21, J03-22, J03-23, J03-24, J03-25, J03-26, J03-27, J03-30, J03-31, J03-32, J03-33. Before: `screens/J03-07.png`, `screens/J03-31.png`. Verdict: polish. Package P6.

Copy:

| Key | After | Mark |
|---|---|---|
| `children.settings.remindersHelp` | Month and birthday messages for {child} follow this switch. | CHG |
| `children.settings.hideLabel` | Hide this book | KEEP, in `text`, not destructive red (nothing is deleted) |
| `children.settings.hideBody` | Hiding {child}'s book quiets every reminder and message about {child}. Nothing is deleted. | CHG (v1.0 has no family) |
| `childrenExtra.edit.born.title` | {child}'s birthday | NEW (card title) |
| `childrenExtra.edit.born.offerBody` | Add it when you are ready. | CHG |
| `childrenExtra.edit.born.confirm` | Set the birthday | KEEP, secondary pill |
| `childrenExtra.edit.born.hideButton` | Hide | NEW |
| `childrenExtra.edit.born.offer` | (not shown) | RET ("{child} was born, set the birthday" presumes the outcome) |
| `childrenExtra.edit.born.keepNote` | Letters written before this day stay in Before You. | KEEP |
| `childrenExtra.edit.signsAsNewOnly` | Letters already written keep their signature. | CHG |
| `childrenExtra.edit.nameTooLong`, `signsAsTooLong` | Up to {n} characters. | CHG |
| `childrenExtra.edit.birthdayFuture` | Choose today or an earlier day. | CHG (as S05) |
| `childrenExtra.edit.nameEmpty`, `signsAsEmpty`, `birthdayMissing`, `dueDateRange` | as today | KEEP |
| `familyCopy.soon.settingsRow`, `settingsRowHelp` | as today | held: scope decision pending |

The due-date card: when the due date has passed, a passed due date can be hard news, so the card never presumes a birth and never celebrates: no confetti, no drawing, no count of days. It is never a notification and never on Tonight. "Hide" hides it until the person opens the Due date row.

Acceptance:
- [ ] The born card can be hidden and never says the child was born.
- [ ] "Hide this book" is not styled as destructive.
- [ ] Letters already written never change when the name or signature changes.

#### S47 Add a child
Step J03-08. Before: `screens/J03-08.png`. Verdict: redesign. Package P6 (consuming P2's `date-field.tsx`).

Problem: it prefills today as the birthday (the "0 days" trap first run removed) and its helper prints the placeholder as a name ("We sort letters by Their name's month of age.").

Copy: `children.add.title` "Add a child" KEEP; `children.add.body` (not shown) RET; the fields use the S05 keys; `children.add.cta` "Add {child}'s book" KEEP; `children.add.ctaShort` NEW "Add this book" (when the filled label passes 22 characters, or before a name is typed); `children.add.twinsHelp` KEEP.

Behaviour: identical to the first-run child step: no default date, "Born today" as a chip, Continue disabled with its reason line, the small book cover taking the name. Free, with no Plus gate (D-082, D-083).

Acceptance:
- [ ] The birthday starts empty; a seven-month-old cannot be saved as a newborn by default.
- [ ] No placeholder text ever appears inside a sentence.

#### S48 Family tab and the coming-soon sheet
Steps J17-01, J17-02, J17-03. Before: `screens/J17-01.png`, `screens/J17-01-full.png`. Verdict: keep. **Held: scope decision pending** (co-parent sharing). Not redesigned and no copy changes. If the founder keeps the tab in v1.0, the Content lens's line is recorded for that decision: `familyCopy.soon.building` "Coming in a later update. Until then, every letter stays on this phone."

### Errors and recovery

#### S49 Unknown route (404)
Step J19-01. Before: `screens/J19-01.png`. Verdict: polish. Package P6.

Copy: `errors.notFoundPage.title` CHG "Nothing at this link."; `errors.notFoundPage.body` CHG "Your book is right where you left it."; `errors.notFoundPage.button` "Back to Tonight" KEEP.

Visual: `StateScreen`, like every other state: the window line drawing (ported, static), centred, the title in `title2`, the body in `body` `textMuted`, the primary full width at the bottom. Fix the gutter: pad the inner content View 20 pt (the `px-5` on `SafeAreaView` does not reach the content). Never show or log the address.

Acceptance:
- [ ] 20 pt gutters on both sides; the button is full width at the bottom.

#### S50 A screen could not be shown (root error boundary)
Step J20-01. Before: `screens/J20-01.png`. Verdict: polish. Package P6.

Copy: `errors.crash.title` CHG "This screen could not be shown."; `errors.crash.body` CHG "Your letters and recordings are safe on this phone."; `tryAgainButton` "Try again" and `tonightButton` "Go to Tonight" KEEP.

Visual: `components/resilience/plain-screen.tsx` sets `fontFamily` from `tokens.fontFamily` (`serifMedium` for the title, `sans` for the body and buttons). The faces are embedded at build time by the expo-font config plugin in `app.config.ts`, so nothing waits on a provider. Pill buttons with token radii. A static page drawing as a plain react-native-svg `Path` from `LINE_ART` with token colours. No lamp, no motion, no providers. Never show or log the error, its message or a stack (CLAUDE.md privacy rules).

Acceptance:
- [ ] The title renders in Literata and the body in Mukta, never Times, Georgia or Helvetica.
- [ ] The boundary imports nothing that can itself throw before render (no theme provider, no motion).

#### S51 The book could not open (launch recovery)
Step J20-02. Before: `screens/J20-02.png`. Verdict: polish. Package P6.

Copy:

| Key | After | Mark |
|---|---|---|
| `errors.launch.title` | The book could not open. | CHG |
| `errors.launch.body` | Your letters and recordings are safe on this phone. Nothing has been removed. | CHG |
| `errors.launch.hint` | Try again, or restart the phone. | CHG |
| `errors.launch.tryAgainButton` | Try again | KEEP |
| `errors.launch.exportButton` | Export what's readable | KEEP (22 characters; the States lens's "Save a copy of the files" is 24 and over the budget, rejected) |
| `errors.launch.exportingTitle` | Gathering your files | KEEP |
| `errors.launch.exportNothing` | No recordings or files to export were found on this phone. | CHG |
| `errors.launch.exportFailed` | The export could not be made, and nothing was changed. Your files are still on this phone. | CHG |
| `errors.launch.readme` | as today | KEEP |

Visual: as S50 (brand faces, static drawing, plain paper). No delete, reset or rebuild action may appear here (D-085).

---

## 5. Visual system additions

### 5.1 Tokens (`packages/design-tokens/src/tokens.ts`, after #99)

Extend #99's `atmosphere`; do not add a second palette. The older `feat/app-calm-integration` and `feat/app-lamp-wash` branches carry overlapping palettes (`lampGold`, `lampRose`, `lampDusk`); these names replace them, and those branches are retired.

```ts
const atmosphere = {
  /** The website's lamp colours (apps/web Aurora.module.css on main). Decorative only. */
  tone: { amber: '#F3C98B', gold: '#FFE2A8', rose: '#F08C7C', dusk: '#8076E2' },
  /**
   * Peak opacity of each tone at the core of the pool, by scheme. Each cap keeps every text token
   * (text, textMuted, accent, success, caution, recording, destructive, focus) at 4.5:1 or more on
   * the lit paper, with a margin (computed with the WCAG 2.x formula; limits in brackets):
   * light amber 0.12 (0.140), gold 0.24 (0.305), rose 0.05 (0.065), dusk 0.04 (0.050);
   * dark amber 0.18 (0.215), gold 0.16 (0.195), rose 0.24 (0.280), dusk 0.30 (0.370).
   */
  peak: {
    light: { amber: 0.12, gold: 0.24, rose: 0.05, dusk: 0.04 },
    dark: { amber: 0.18, gold: 0.16, rose: 0.24, dusk: 0.3 },
  },
  /** Tonight's light by greetingKey(): core and tail tone, and intensity (0 to 1). */
  daypart: {
    earlyMorning: { core: 'gold', tail: 'gold', intensity: 0.7 },
    morning: { core: 'gold', tail: 'gold', intensity: 0.7 },
    midday: { core: 'gold', tail: 'amber', intensity: 0.6 },
    afternoon: { core: 'gold', tail: 'amber', intensity: 0.6 },
    evening: { core: 'gold', tail: 'amber', intensity: 1 },
    night: { core: 'amber', tail: 'rose', intensity: 0.9 },
    lateNight: { core: 'amber', tail: 'dusk', intensity: 0.8 },
  },
  /** Where the light appears. Anything not listed has no lamp. */
  scene: {
    gate: { anchor: 'center', core: 'gold', tail: 'amber', intensity: 0.6, breathe: false },
    welcome: { anchor: 'top', core: 'gold', tail: 'amber', intensity: 1, breathe: true },
    form: { anchor: 'top', core: 'gold', tail: 'amber', intensity: 0.5, breathe: false },
    finish: { anchor: 'top', core: 'gold', tail: 'amber', intensity: 1, breathe: true },
    tonight: { anchor: 'top', daypart: true, breathe: true },
    write: { anchor: 'top', core: 'gold', tail: 'amber', intensity: 0.5, breathe: false },
    book: { anchor: 'top', core: 'gold', tail: 'amber', intensity: 0.6, breathe: false },
    readTogether: { anchor: 'bottom', core: 'dusk', tail: 'dusk', intensity: 1, breathe: false, nightOnly: true },
  },
} as const;
```

Also in `tokens.ts`:

| Token | Value | Use |
|---|---|---|
| `type.promptHero` | Literata-Regular 28/36, tracking 0, `title1`, max scale 1.8 | Tonight's prompt (S09) |
| `type.numeral` | Literata-Medium 64/64, tracking -0.5, `largeTitle`, max scale 1.4 | Month openers (S26) |
| `motion.breathIdleMs` | 7500 (was 4000) | Listening idle breath (S11; MOTION open question 1) |
| `motion.file` | `{ chipAtMs: 250, moveAtMs: 550, dy: 24, scale: 0.9 }` | The saved moment (S21; MOTION 5e numbers move into tokens) |
| `motion.pageTurn` | `{ dx: 24 }` | Read together (S30) |
| `motion.lamp` | #99's `{ arriveMs: 1200, breathMs: 9000, breathOpacityMin: 0.88 }` plus `dimTo: 0.7` | "Not much today" lights down (S33) |

`packages/design-tokens/test/atmosphere.test.ts` (from #99) is extended: for each scheme and each tone, blending the tone at its `peak` into `bg` keeps every text token at 4.5:1 or more; every `scene` and `daypart` names a real tone; `intensity` is between 0 and 1; and `tokens.test.ts` still holds every sequence under 900 ms and the 2 s ceiling. Under Increase Contrast there is no lamp at all (#99's `lampOpacity` returns 0), so the high-contrast tokens need no lamp check.

### 5.2 The lamp

`apps/mobile/src/components/ui/lamp.tsx` (from #99), extended. One `RadialGradient`, drawn once; only a wrapper's opacity moves.

| Prop | Spec |
|---|---|
| `scene` | A key of `tokens.atmosphere.scene`; resolves anchor, tones, intensity and breath. Tonight passes the greeting key for its daypart. |
| `anchor` | `top` (cx 0.5, cy 0, r 0.95), `center` (cx 0.5, cy 0.42, r 0.8), `bottom` (cx 0.5, cy 1.0, r 0.9), as fractions of the screen. |
| Stops | #99's shape: offsets 0, 0.38, 0.66, 1 with opacities 1, 0.45, 0.12, 0. Offset 0 uses the core tone; the others use the tail tone. Each stop's colour opacity is `stop.opacity x peak[scheme][tone] x intensity`. |
| `intensity` | Animated on the wrapper: `withTiming` over `motion.lamp.arriveMs` (1200 ms), M3 easing, when the scene changes. |
| `still` / breathe | When the scene breathes: #99's native CSS-style opacity loop (1 to 0.88 over 4.5 s each way). Paused when the screen is not focused, the app is in the background, or Low Power Mode is on. |
| `persistKey` | A lamp with the same key that was lit earlier in this session mounts at its last intensity and does not arrive again. The gate and onboarding share `firstRun`, so the light never goes out between them. |
| Reduce Motion | No arrival, no breath: the final state, still. |
| Increase Contrast, Reduce Transparency | Nothing (plain paper). |
| Accessibility | `pointerEvents="none"`, hidden from VoiceOver. |

Where it never appears: Listen, Review, the saved moment, the letter page, the Plus gate sheet and the Plus store screen, Settings, every error and state screen, the struggling page, sheets. In Read together it appears only as the still dusk pool at night, behind the controls.

The light-mode limits are low on purpose: rose and dusk at 0.05 and 0.04 are a whisper on `#FBF8F3`, because `success` and `caution` text would drop under 4.5:1 above that. Light mode carries its warmth with gold and amber; dark mode, where evenings mostly happen, carries the website's full amber, rose and dusk.

### 5.3 Paper texture: not in v1.0

The Visual lens proposed `apps/web/public/textures/paper-v1.webp` (34.7 KB) at 4 percent behind the letter in light mode. Rejected for v1.0: #99 measured and recorded why textures are not ported (a decode on every cold start, memory against D-065, and the small pool needs no dithering), and the letter page's strength is plain paper. Revisit only if a device shows banding in the pool.

### 5.4 Illustration and assets

| Asset | Where | Source | Licence and duties |
|---|---|---|---|
| Lamp, Window, ReadingLamp line drawings | Window on the 404 (S49); ReadingLamp reserved for empty Read together if the moon is replaced; Lamp reserved (not used on a screen in this pass, see S08) | `apps/web/src/components/drawings/Lamp.tsx`, `Window.tsx`, `ReadingLamp.tsx` on `origin/main`, made in-house (`apps/web/scripts/atmosphere`) | Company-owned, in-house. No attribution. Port to `components/ui/line-art.tsx` with their `STROKES` tables (path, start, end) and lengths measured offline. |
| Moon, Page, Envelope line drawings | Review waiting (S14), end of Read together (S31), state screens | Already in `apps/mobile/src/components/ui/line-art.tsx`; the web Moon's stroke table replaces the app's single path so it can draw on | In-house. No attribution. |
| Book cover | First run (S05, S06, S08), empty Book (S24), Add a child (S47), Export thumbnail (S43) | New `components/book/book-cover.tsx`: react-native-svg and `Text`, no image files. 3:4 paper card; the small-cut symbol at its head (registry `logo.symbol.small.*`, 12 to 23 pt, used as a book mark as BRAND_SYSTEM allows on book surfaces); the name in Literata Medium, centred; a flyleaf state with "From {signsAs}" in Literata Italic and one hairline. States: `closed`, `open`. Sizes: 88 x 116, 132 x 176, 160 x 214, 96 x 128 pt. | In-house. The symbol comes from the registry, never a file path. |
| Opening quotation pair | Gate and stop screen (S01, S02) | #99's `quote-pair.tsx`, registry context `app.brand-device` | Brand asset. Decorative; fades only; never moves (registry rule). |
| Stacked lockup | Welcome (S03), Plus store screen (S41) | Registry `logo.lockup.stacked.ink` and `.reversed`: new context `app.welcome` (founder approval), existing `app.paywall` | Brand asset. One logo per screen. |
| Small-cut lockup and icon | Settings, About (S40) | Registry `app.settings.about` | Brand asset. |
| Icons: MicrophoneSlash, WarningCircle, ArrowsClockwise, Moon, LockSimple, Microphone, FileText, BookOpen, Database, Trash | S13, S34, S38, S41, S43, S44, S09, S33 | Phosphor (`phosphor-react-native` 3.0.6, already a dependency, imported one icon at a time). LICENSE: github.com/phosphor-icons/homepage/blob/master/LICENSE, "MIT License, Copyright (c) 2020 Phosphor Icons" (verified by the visual lens and recorded in DESIGN_LANGUAGE 7) | MIT: keep the notice. Already listed in Settings, Licenses (`licences.en.ts`). No new duty. |
| Fonts | everywhere | Literata, Mukta, Tiro Devanagari Hindi, already bundled | SIL OFL 1.1, already listed in Licenses. No new duty. |
| Photographs | none in the app | Unsplash and Pexels stay for the website and social only (PHOTOGRAPHY.md) | Not used in the app. No stock photographs of children anywhere (DESIGN_LANGUAGE 9). |
| Open Doodles | rejected | opendoodles.com (unreachable today; licence unverified) | Rejected: it draws people with faces, which DESIGN_LANGUAGE 9 rules out ("No faces, no mascot"), and the licence could not be read. |
| Lottie, Rive, Skia, expo-linear-gradient | rejected | | Not needed (MOTION 9: none in v1). react-native-svg covers gradients, react-native-reanimated covers motion. |

No asset in this pass carries an attribution duty beyond what the Licenses screen already lists.

### 5.5 Motion catalogue

| Name | Spec | Reduce Motion |
|---|---|---|
| enter | opacity 0 to 1, y 8 to 0, 280 ms, M3 easing, 30 ms stagger, at most 6 items | one 200 ms fade |
| exit | opacity to 0, y to -8, 160 ms | 160 ms fade |
| lamp arrive / rise / dim | intensity over 1200 ms, M3 easing | final state, instant |
| lamp breath | opacity 1 to 0.88 and back, 9 s cycle, only on welcome, finish and Tonight | none |
| strike draw | strokeDashoffset, 400 ms, M3 easing (promise sample) | complete |
| line drawing draw-on | strokeDashoffset per stroke table over 1200 ms (`drawMs`), then still | complete |
| empty breath | one element, opacity 0.85 to 1 over 8 s, only while focused | none |
| put back | out 120 ms, in 160 ms, reflow on `standard`, 1.6 s `accentSoft` wash | 200 ms fades, static wash then fade |
| file into month | MOTION 5e with `motion.file` | chip and line fade, dismiss |
| card to page | MOTION 5f measured-rect, `standard`, radius md to 0 | 200 ms cross-fade |
| page turn | out 24 pt left with 160 ms fade; in from 24 pt right on `standard`; follows a swipe | 200 ms cross-fade |
| row collapse | height to 0 and fade, 160 ms, `LinearTransition` `standard` | fade |
| cover open | front holds 300 ms, then cross-fades to the flyleaf with an 8 pt shift on `standard` | open state at once |

Every sequence is under `sequenceMaxMs` (900 ms), any tap skips it, and controls never animate in (MOTION principles 2 and 4).

### 5.6 Dark mode, Reduce Motion, Increase Contrast, Reduce Transparency

| Layer | Dark | Reduce Motion | Increase Contrast | Reduce Transparency |
|---|---|---|---|---|
| Lamp | the dark peaks (the website's amber on `#161412`); dark mode is tuned first and is the reference frame | final state, still | none | none |
| Line drawings | `textMuted` dark | shown complete | `textMuted` high-contrast | as default |
| Book cover | `surfaceRaised` dark with a 1 px `line` border, name in dark `text` | static | `line` at high-contrast strength | solid |
| Review sheet | `#201D1A` with a 1 px `line` border | as default | high-contrast `line` | solid |
| Marks | `editMark` dark `#D9A47E` | at full opacity from the first frame, as always | high-contrast `editMark` | as default |
| Lit month edge and chip edge | amber at 40 percent | static | replaced by a 1 pt `line` | replaced by a 1 pt `line` |
| Excerpt fade | gradient to dark `surfaceRaised` | as default | as default | as default |
| Every arrival | as default | one 200 ms fade | as default | as default |

### 5.7 Size budget

D-065: App Store download under 40 MB; JS assets sub-budget 3 MB, 1.4 MB used (`docs/ops/APP_SIZE.md`). This pass adds no images, no fonts and no native code. The three ported drawings are about 7 KB of path source (the website's eight total about 19 KB). The book cover, the lamp extensions, the page turn and the card transition are code. New Phosphor glyphs are a few KB each, imported one at a time. Estimated total: under 0.1 MB of JS. The app still ships no photographs; nothing may import `apps/mobile/assets/photos` (that folder is not bundled because nothing requires it, and it must stay that way). P1 states the measured bundle delta in its PR.

---

## 6. Build packages

Each package touches files no other package touches, so agents can work in parallel. **P0 lands first.** **#99 (`feat/mobile-calm-brand`) must be merged before P1, or P1 is built on top of it and merges it in first.** P2 to P6 depend on P0 and P1 and are otherwise independent, with the two small orderings noted below. P7 lands last.

E2E flows in `apps/mobile/e2e-web` assert literal strings and are not run in CI. Each flow file belongs to exactly one package (below). Between P0 landing and a screen package landing, that screen's flow may assert old words; the owning package updates it, and P7 re-runs the whole journey.

### P0 Copy (packages/content only), lands first

Files: `packages/content/src/strings.en.ts`; `packages/content/src/features/{speech,billing,words,reminders,export,language,licences,packs,player}.en.ts`; `packages/content/src/stories.en.ts` (one new story id, below); new `packages/content/test/experience-pass.test.ts`.

Rules for this package:
1. Every CHG and NEW string in section 4, exactly as written there. No other wording changes.
2. **No key is deleted or renamed.** RET keys stay with a `// retired by EXPERIENCE_PASS_2026-10; delete in P7` comment, so screen code that still reads them keeps compiling. `billingCopy.plan.annual` is added beside `plan.yearly`.
3. **Registered disclosure and claims text is not touched**: `review.firstNote.*`, `settings.help.mistakes`, `settings.about.beta.*`, `trust.*`, `billingCopy.store.features`, `billingCopy.store.promise`, `billingCopy.store.renewal`, `billingCopy.store.cancel`, `billingCopy.store.family`, `plus.legal.*`, `consentCopy` never-lines. Proposed improvements to them are in section 7 for counsel.
4. Stories: add `story.private.v2` (ids are never reused): headline "Private by default.", line "Only you can read these letters. They stay on this phone. Never sold, never used for ads." Do not remove `story.private.v1`; which one is served is a server-side decision (D-066) and a counsel item (claims registry).
5. Button labels (keys ending in `Button`, `cta`, `action`) are 22 characters or fewer with the Asha fixtures.

Tests: `npm test` green, including `packages/content/test/rules.test.ts` unchanged. The new `experience-pass.test.ts` asserts: no in-app string touched by this pass contains the word "we" except the sanctioned promises and the registered keys; no touched string contains "tidy", "clean", "correct", "edit", "improve" (the glossary); every new button label is 22 characters or fewer; `billingCopy.plan.monthly` and `annual` equal "Plus Monthly" and "Plus Annual"; and US spellings hold (no "Licences", "mobile data", "full stops", "straight away", "Mummy" in in-app copy).

Acceptance:
- [ ] Every CHG and NEW in section 4 is present, word for word.
- [ ] No key removed; typecheck of `apps/mobile` passes unchanged.
- [ ] No registered text changed (diff check against `in-app-disclosures.md`).

### P1 Shared visual system

Depends on: #99 merged (or merged in first), P0.

Files: `packages/design-tokens/src/tokens.ts`; `packages/design-tokens/test/atmosphere.test.ts`, `tokens.test.ts`; `apps/mobile/src/components/ui/lamp.tsx`, `lamp.logic.ts`; `apps/mobile/test/lamp.test.ts`; `apps/mobile/src/components/ui/line-art.tsx`; `apps/mobile/src/components/motion/draw-on.tsx` (stroke tables); new `apps/mobile/src/components/book/book-cover.tsx`, `book-cover.logic.ts`, `apps/mobile/test/book-cover.test.ts`; new `apps/mobile/src/components/motion/page-turn.tsx`, `card-transition.tsx`, `excerpt-fade.tsx`; `apps/mobile/src/components/ui/state-screen.tsx` and `state-screen.logic.ts` (drawing slot, centred block, 20 pt gutters, Phosphor glyph slot); `apps/mobile/src/components/ui/toast.tsx` (a new show() replaces the toast on screen); `apps/mobile/src/components/ui/button.tsx` (disabled outline style); `apps/mobile/src/lib/motion.ts`; `packages/brand/registry.ts` and `registry.json` (context `app.welcome`, only after founder approval); `docs/design/MOTION.md` (5k scenes, page turn, file tokens, `breathIdleMs`), `docs/design/DESIGN_LANGUAGE.md` (type tokens, imagery: the book cover), `docs/design/COMPONENTS.md` (BookCover, Lamp scenes); `docs/brand/BRAND_SYSTEM.md` section 4 (only the founder-approved amendment in section 7).

Acceptance:
- [ ] The atmosphere test proves 4.5:1 for every text token at every tone's peak, both schemes.
- [ ] `Lamp` with `persistKey` mounts lit and does not arrive again; with Reduce Motion it is still; with Increase Contrast it renders nothing.
- [ ] `BookCover` renders a 60-character name in three lines with a fade and never an ellipsis glyph (unit test on the logic).
- [ ] Toast: showing a second toast replaces the first (unit test).
- [ ] Bundle delta stated in the PR, under 0.1 MB.

### P2 First run and the age question

Depends on: P0, P1.

Files: `apps/mobile/src/components/gate/age-gate-screen.tsx`; `apps/mobile/src/app/onboarding.tsx`; new `apps/mobile/src/components/onboarding/promise-sample.tsx` and `apps/mobile/test/promise-sample.test.ts`; `apps/mobile/src/components/speech/speech-consent-card.tsx`; `apps/mobile/src/components/language/language-picker.tsx`; `apps/mobile/src/components/child/date-field.tsx`; e2e `apps/mobile/e2e-web/j01-first-run.flow.ts`, `j02-under-18.flow.ts`, `smoke.flow.ts`, `support/app.ts` (`passAgeGate` and the first-run helpers).

Not touched: `lib/age-gate.ts` and `_layout.tsx` (no logic change on v1.0; the gate stays the root boot gate).

Tests: `promise-sample.test.ts` (the sample's fixes come from the engine, pass `verifyEdits`, are exactly one filler and one repeat, and put back to the raw words); gate tests unchanged and green; j01, j02 and smoke updated to the new words.

Acceptance: every checkbox under S01 to S08.

### P3 Tonight and prompts

Depends on: P0, P1.

Files: `apps/mobile/src/app/(tabs)/index.tsx`; new `apps/mobile/src/components/tonight/draft-card.tsx`, `draft-card.logic.ts` and its test, `resurfaced-card.tsx`, `quiet-day-inline.tsx`; the draft listing in `apps/mobile/src/lib/capture` (list every draft, not `[0]`), only the function Tonight reads; e2e `j04-tonight.flow.ts`, `j08-quiet-day.flow.ts`.

Tests: `draft-card.logic` maps each draft state to its line and action (unit); j04 covers two drafts after a relaunch; j08 asserts "A quiet day, kept." and Undo.

Acceptance: every checkbox under S09 and S33.

### P4 Capture and Review

Depends on: P0, P1.

Files: `apps/mobile/src/app/listen.tsx`; `apps/mobile/src/app/review.tsx`; `apps/mobile/src/app/write.tsx`; `apps/mobile/src/components/capture/listening-aura.tsx`, `transcript.tsx`, `review-view.logic.ts` and its test; new `apps/mobile/src/components/capture/letter-sheet.tsx`, `saved-moment.tsx`, `mic-state.tsx`; the stop-reason and free-space check in `apps/mobile/src/lib/capture` (not the draft listing P3 owns); e2e `j05-voice-capture.flow.ts`, `j06-review.flow.ts`, `j07-typed.flow.ts`.

Tests: review-view logic for the header row and the fallback button label; a unit test that a start failure with permission granted maps to "busy", not "denied"; j06 covers put back and the saved chip; j07 covers keeping a typed letter from Write with no Review screen.

Acceptance: every checkbox under S11 to S21 and S23.

### P5 Book, letter and Read together

Depends on: P0, P1.

Files: `apps/mobile/src/app/(tabs)/book.tsx`; `apps/mobile/src/components/book/letter-card.tsx`, `chapters.ts`, `app-note.tsx`, `quiet-day-row.tsx`, `undo-toast.tsx`, `confirm-sheet.tsx`, `reading-size-sheet.tsx`, `shelf.logic.ts` and their tests; `apps/mobile/src/app/letter/[id].tsx`; `apps/mobile/src/app/read-together.tsx`; `apps/mobile/src/components/player/audio-player.tsx`; `apps/mobile/src/components/child/whose-book-sheet.tsx`, `child-switcher.tsx`; `apps/mobile/src/app/settings/recently-deleted.tsx`; e2e `j09-book.flow.ts`, `j10-letter.flow.ts`, `j11-read-together.flow.ts`.

Tests: chapters logic (month range, the current month, newborn and Before You openers); shelf logic (the joined date line, no countdown); j10 covers delete returning to the Book with Undo, and Erase now showing "Erased from this phone."; j11 covers the page turn's button path and the dateline.

Acceptance: every checkbox under S24 to S32 and S35 to S39.

### P6 Settings, Plus and errors

Depends on: P0, P1; P2 for `date-field.tsx` (Add a child); P4 for the Listen ready state that `j19-errors.flow.ts` also asserts.

Files: `apps/mobile/src/app/settings/index.tsx`, `plus.tsx`, `reminders.tsx`, `recordings.tsx`, `export.tsx`, `privacy.tsx`, `appearance.tsx`, `storage.tsx`, `language.tsx`, `children/[id].tsx`, `children/new.tsx` (not `recently-deleted.tsx`, which P5 owns); new `apps/mobile/src/app/settings/struggling.tsx` and `licenses.tsx` pages; `apps/mobile/src/components/child/plus-gate.tsx`, `add-child-form.tsx`, `child-editors.tsx`; `apps/mobile/src/components/consent/never-list.tsx`; `apps/mobile/src/app/plus/*`; `apps/mobile/src/app/+not-found.tsx`; `apps/mobile/src/components/resilience/plain-screen.tsx`, `error-boundary.tsx`, `launch-recovery.tsx`; e2e `j03-children.flow.ts`, `j03-child-editing.flow.ts`, `j12-plus.flow.ts`, `j13-reminders.flow.ts`, `j14-recordings.flow.ts`, `j15-export.flow.ts`, `j16-settings.flow.ts`, `j19-errors.flow.ts`, `j20-crash.flow.ts`.

Not touched: the Family tab, the invite sheet and every "Write this book together" surface (held).

Tests: a unit test that `PlainScreen` styles use `tokens.fontFamily`; j03 asserts Add a child starts with no date; j12 asserts "Plus Monthly" and "Plus Annual" and no duplicated sentence; j16 asserts the early-version note only under About and the struggling page; j20 asserts the new crash and launch titles.

Acceptance: every checkbox under S22, S34, S40 to S47 and S49 to S51.

### P7 Clean-up and the journey record, lands last

Depends on: P0 to P6 merged.

Files: `packages/content/src/*` (delete every key marked "retired by EXPERIENCE_PASS_2026-10" and confirm nothing reads it); `apps/mobile/e2e-web/j18-dark-mode.flow.ts`; the journey record on `chore/journey-refresh` (`npm run e2e:web:journey -w @scribe/mobile`, then `node apps/mobile/e2e-web/support/build-index.mjs`), with the A-REQ-030 label in INDEX.md corrected to LEGAL-REQ-002 and PRD-REQ-019.

Acceptance:
- [ ] No retired key remains; `npm test` and `npm run typecheck` green.
- [ ] The regenerated journey has one screenshot per step for all 20 journeys, and every "after" in this spec can be checked against it.

---

## 7. What needs the founder, and what needs counsel

### The founder

| # | Decision | Why it needs you | Default if you say nothing |
|---|---|---|---|
| F1 | Merge PR #99 (calm brand, lamp, quotation pair) | P1 builds on it | P1 waits |
| F2 | Amend BRAND_SYSTEM section 4 "Never: ... a gradient anywhere except the app icon tile" to: "Never: a gradient anywhere except the app icon tile and the atmosphere lamp (`tokens.atmosphere`, `Lamp`), which is decorative, capped for contrast, and never sits inside, behind or around the mark." | The lamp is a gradient behind content; #99 adds it without amending this line, and BRAND_SYSTEM wins over DESIGN_LANGUAGE when they disagree | The lamp ships only where #99 already puts it |
| F3 | New registry context `app.welcome` (stacked lockup, 96 pt, on the welcome) | Brand contexts are your call | The welcome uses `app.header` (small-cut lockup, 26 pt) |
| F4 | Amend PRD-REQ-019 so the welcome may come before the age question (2.4) | A P0 requirement's wording; only after counsel answers C1 | The gate stays first (2.3) |
| F5 | Owner and date for the Declared Age Range call (2.5) | A P0 legal gap, outside this pass | Stays open; flagged in the release checklist |
| F6 | App Store Connect display name "Plus Annual" (docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md still says "Plus Yearly") | Store metadata; D-077 says the names must match | In-app "Plus Annual" ships and ASC is corrected before submission |
| F7 | Scope decision on sign-in, sync, co-parent and backup surfaces | Held throughout this spec | Nothing in those surfaces changes |
| F8 | Typed letters skip Review (S20) | A flow change you will feel on every typed letter | Ships as specified |

Nothing in this pass is irreversible: every change is code or copy and can be reverted. No asset in it carries an attribution duty beyond the Licenses screen (section 5.4).

### Counsel

| # | Question | Source |
|---|---|---|
| C1 | Does a static welcome screen that collects nothing, and whose only action opens the age question, meet "asks before first use" (LEGAL-REQ-002, CR-004)? May a positive Declared Age Range result replace the question? | Compliance register section 6 Q6 |
| C2 | The v1.0 gate keeps the question, "Yes", "No", nothing preselected and the stop line, and drops "We ask everyone the same question." and "Nothing you entered has been kept." Please confirm no wording here was relied on. | LEGAL-REQ-002, PRD-REQ-019 |
| C3 | Optional trims to registered text, for a later release if counsel agrees: `settings.about.beta.body` without "Some things may change."; `review.firstNote.title` "Read it before you save" with the body "Small slips like an um or a repeat are taken out and marked. Tap a mark to put it back. A name can be misheard, so read it before you save." (same three facts, no "we"); a merged Recordings footer. Until then these ship verbatim. | in-app-disclosures.md sections 1 and 2 |
| C4 | Story card `story.private.v2` ("Only you can read these letters. They stay on this phone. Never sold, never used for ads.") replaces v1's "and the people you invite" while v1.0 has no invites. Claims registry entry. | VOICE privacy table (D-061), claims-registry |
| C5 | The usage-sharing sheet words for v1.1 (S10) | LEGAL-REQ-003 |

---

## Appendix A. Where the critiques disagreed, and what was decided

| Topic | Positions | Decision and reason |
|---|---|---|
| Where the age question sits | Product, States: welcome first, question as a sheet. Visual: gate first, lit. Content: gate first, tap-to-commit labelled buttons. | Gate first on v1.0 (PRD-REQ-019 "Before any first-run screen"); welcome-first fully specified and held for F4 and C1. |
| Continue on the gate | Content, Visual: tap commits. Product, States: keep Continue. | Keep Continue: a mis-tapped No locks a parent out for 24 hours. |
| Gate answer labels | Content: "I am 18 or older" / "I am under 18". | Keep "Yes" / "No": K-07 names them; no counsel round needed. |
| Light on the gate | Product: none. Visual, States: lamp. | A still lamp at 0.6 that never changes with the answer: the same room as the welcome, and neutral. |
| Stop screen words | Product: "For now, ...". Content: title plus "Nothing was saved.". States: title only. | Title only: "Nothing was saved." is not true (the time of the No is stored). |
| Welcome logo | Product: small-cut lockup plus a drawing. Visual: stacked lockup. #99: the pair plus a typed name. | Stacked lockup (F3), no drawing: one logo per screen and the light as the picture. |
| Welcome body | Product: delete. Others: keep. | Keep: it is not an explanation, and it is the brand's one descriptor line. |
| Promise | Product: a sample letter in the letter face. Visual: one token in sans. Content: text only. | A one-sentence sample in sans, from the real engine: Product's "teach by doing" without breaking VOICE's rule that the app's words never sit in the letter's type. |
| Mishear note in first run | Product: required here. Content, Visual: not here. | Not here: in-app-disclosures.md section 2 registers the first Review and Settings, not first run. |
| The book cover | Visual: proposed. Product: the child step stays quiet. | Adopted, small, and hidden when space is short: it is the journey's one object, and it shows the person's own words, not decoration. |
| Tonight subtitle and caps label | Content: keep. Product, Visual: remove. | Remove: two questions stack. |
| Tonight lamp position and morning | Product: bottom, none in the morning. Visual: top, gold in the morning. | Top (as #99 built), tinted by daypart all day: the room is never unlit, only warmer or cooler. |
| Typed letters and Review | Product: skip. Content, States: keep. | Skip (S20). |
| Saved moment light | States: a lamp bloom. Visual: a lit chip edge. | The chip's lit edge only: no light on a voice screen. |
| Plus gate picture | Product: lamp plus stacked lockup. Visual: two kept letters fanned. States: the held letter. | The held letter: it answers the person's real worry. No lockup (registry `app.paywall` is above Apple's view) and no lamp (light is not for selling). |
| Read together theme | Visual: force a night page. | Follow the person's Appearance setting; a still dusk pool at night only. |
| End of the book line | Content: cut "More are still being written." | Keep: it is about time, not endings. |
| Read together autoplay | Product: a "Keep playing" chip. Visual: move to the Aa sheet. Content: rename. | A "Keep playing" chip under the player: task options belong in the task, visibly. |
| Listen transition | Visual: grow Speak into the red circle. | Rejected: controls never animate in (MOTION principle 2). |
| Discard wording | States: "Discard". | Keep "Let it go" with "Keep it" and "Remove it". |
| Paper texture | Visual: letter page in light mode. #99: not ported. | Not in v1.0 (5.3). |
| Not much today line | Product: two lines by time of day. States: "A quiet day, kept." | "A quiet day, kept.": one line true at any hour. |
| Crash title | Product, Content: "Something went wrong". States: "This screen hit a problem." | "This screen could not be shown.": says what happened, with no blame and no "we". |
| Settings accordions | Product: push to pages. States: in place is right. | Push to pages: iOS Settings; the resources stay one tap away. |
| Born offer | Product: keep. Content: reword. States: never presume, allow hiding. | States: a passed due date can be hard news. |

## Appendix B. Proposals rejected because they break the constitution, the content rules or a standing rule

| Proposal | Lens | Rule it breaks |
|---|---|---|
| "Still writing. A long letter takes a moment longer." | Content | Constitution and VOICE: never imply software writes a letter. |
| A sample letter set in the letter face on the promise screen | Product | VOICE: the app's own words never sit in the letter's type. |
| Keeping "Dear {child}, today you laughed at the rain." as the Appearance sample | (current app) | Same VOICE rule; replaced by the person's own words (S45). |
| Keeping "You are so loved." as a month ending | (current app) | VOICE: the app's own words add no meaning; replaced (S31). |
| "Save a copy of the files" | States | The 22-character button budget (24 characters). |
| The stacked lockup on the Keep gate sheet | Product | Registry `app.paywall`: above Apple's subscription view only. |
| Growing Speak into the red circle | Visual | MOTION principle 2: controls never animate in. |
| A lamp bloom on Review after saving | States | Principle 5: no light on a voice screen (MOTION 5k). |
| "Nothing was saved." on the stop screen | Content | Not true: `ageGate.stoppedAt` is stored (D-026). |
| Open Doodles illustrations | Visual (considered) | DESIGN_LANGUAGE 9: no faces; licence unverified. |

## Appendix C. Step coverage

Every one of the 147 journey steps is placed in exactly one screen entry in section 4 (S01 to S51). S15 and S16 cover native-only states with no journey step. S10 and S48 are recorded but not built in this pass.
