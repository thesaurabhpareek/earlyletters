# Experience pass, October 2026

v1.3, 2026-10-18 (v1.2 merged as #217; v1.1 merged as #170 on 2026-10-16; v1.0 was 2026-10-15). On `develop`. v1.2 matches P1 as built (#192, merged as `db258b5`, and #218 for the Reduce Motion timing): card to page and its Reduce Motion hand-off (S26, 5.5, 5.8 row 7, P5), the light-paper grain and the faint grain on night paper, and the dusk paper tone (5.1, 5.3, 5.7). v1.3 follows P2-V's measurements on #220: the S05 cover hides under 480 pt of free height, so the name field stays in view, and the S04 promise body is the sanctioned promise word for word, with the S04 word count at about 70 (D-111 item 11).
Scope: v1.0 with server features on (option B, D-100, confirmed 15 Oct). v1.0 ships sign-in, sync between a person's phones, co-parent sharing with at most two parents per book (D-069), and encrypted backup of the owner's recordings in Supabase Storage, free for everyone as the proposed default (D-104 item 2: "Proposed; awaits founder confirmation" in `docs/DECISIONS.md`, founder item F10), with a recovery key we hold under strict, logged access (D-102, D-108). Those surfaces (sign-in and the email code, Account, the Family tab and invite, joining a book, backup settings, restore on a new phone, erase across devices) are specified in chapter 7 of section 4 and built in package P8. P0 to P7 do not edit P8's files (section 6).

**What changed in v1.1.** Option B replaces every on-device-only assumption; package P8 and chapter 7 are new; `story.private.v2`, `book.monthRange` and `wordsCopy.pack.mobileDataButton` match PR #181 as built; the Recordings and Erase now lines cover our backup and the synced letter; transitions after first run are specified (section 5.8); every package boundary is a file list, with requests between packages (section 6); the strings that read as machine-written are replaced (review B6); PR #181 is the source of truth for strings, and the keys section 6 listed for it are applied in #181 at `de2b916`, plus final notes; the before contact sheets are out of git; the founder's and the coordinator's calls are recorded in section 7 (D-109).

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

The nine "before" contact sheets (812 KB) are not in git: COORDINATION section 8 keeps screenshots in the session scratchpad. They are at `/tmp/claude-0/-home-user-earlyletters/9c7d4e54-75ea-5024-8f40-e18f5142ba43/scratchpad/experience-pass/before/` (`01-first-run-1.jpg` to `09-errors-empty.jpg`), cut from the journey record on `origin/chore/journey-refresh` (b7afe42), which stays the source every screen entry cites.

**Sources added for v1.1.** On `origin/develop` (17d6319, merged into this branch): `docs/DECISIONS.md` D-100 to D-109 (D-109 from #173, merged as `b22876b`; D-110 is added by this PR), `docs/agents/COORDINATION.md`, PRD V2 `08-delivery.md` section 3 (streams S01 to S20 and the files each owns), `features/F08-recordings.md` (6.5 and 6.7), `F11`, `F16`, `F17`, the sign-in, Account, Family, invite and delete-account code and copy. Open pull requests read at their heads: #181 (P0, read at `7d3b507`, `bcf301e` and `de2b916`), #150 (backup client, `5c32ad1`), #151 (backup server, `ad222eb`), #148 (`946b14a`) and `feat/coparent-alpha` (`a39094f`) for invite, join and leave, #146 and #182 (sync, held drafts), #163 (server-product legal set). Both reviews of this PR (B, comment 6218727236; A, comment 6218750279).

**Sources read for this pass.** On `origin/develop` (56ec5b5): `CLAUDE.md`, `packages/content/VOICE.md`, `BRAND.md`, every copy file in `packages/content/src`, `docs/brand/BRAND_SYSTEM.md`, `docs/design/DESIGN_LANGUAGE.md`, `MOTION.md`, `COMPONENTS.md`, `BENCHMARK.md`, `packages/design-tokens/src/tokens.ts`, `docs/legal/ENGINEERING_REQUIREMENTS.md` (LEGAL-REQ-002, -003), `docs/legal/in-app-disclosures.md`, `docs/prd/PRD.md` (K-07, PRD-REQ-019, the A-REQ table), `docs/DECISIONS.md` (D-026), the gate, onboarding and Tonight code, `apps/mobile/src/app/_layout.tsx`, the e2e-web flows. PR #99 (`feat/mobile-calm-brand`, open then, merged since as `d74e860`): `lamp.tsx`, `lamp.logic.ts`, `quote-pair.tsx`, `tokens.atmosphere`, MOTION 5k, its before and after captures. On `origin/main` (69299f8): `apps/web` `Aurora.tsx` and its CSS, `globals.css`, the drawings in `apps/web/src/components/drawings`. The journey record on `origin/chore/journey-refresh` (b7afe42): `INDEX.md`, all 147 `steps/*.json`, and the screenshots for every distinct screen, light and dark (the nine contact sheets in the scratchpad are the ones looked at for this spec, on top of the four lenses' own looks).

**How to read a screen entry.** Copy tables use these marks: **KEEP** (same key, same words), **CHG** (same key, new words), **NEW** (new key), **RET** (no longer shown; the key stays until package P7 deletes it, so nothing breaks in between; in P8's own copy files P8 deletes it, section 6). `{app}` comes from `packages/brand`; `{child}`, `{signsAs}`, `{month}`, `{size}`, `{date}`, `{n}`, `{a}`, `{b}`, `{email}`, `{inviter}`, `{coParent}` are filled at runtime (all in the `rules.test.ts` placeholder list). For chapter 7, a mark is against `develop` unless the entry names the open pull request that adds the key (#148, #150, `feat/coparent-alpha`). Strings: #181 (P0, at `de2b916`, plus final notes) is the source of truth; section 4 matches it word for word, apart from the 13 held keys. A row that says "Held in #181" is a CHG that #181 keeps at `develop`'s words until the named package switches it (section 6). Every button label is 22 characters or fewer with the Asha fixtures. Screenshot references are to `docs/release/journey/screens/<id>.png` on `origin/chore/journey-refresh` (b7afe42); PR #132 (merged as `b151598`) took the journey screens out of git on `develop`, so that branch is where they stay readable.

**Benchmark marks.** *verified* = read from the primary source today (15 Oct 2026). The HIG quotes in this spec were re-read for this spec from Apple's documentation JSON (`developer.apple.com/tutorials/data/design/human-interface-guidelines/<page>.json`: onboarding, launching, writing, alerts, feedback, loading, progress-indicators, motion, settings, entering-data, privacy). Quotes the lenses cite from other HIG pages (modality, pickers, managing notifications, tab bars) are marked *verified by the product lens* where used. *repo-verified* = recorded as read from the primary source in `docs/design/BENCHMARK.md` or `MOTION.md`, not re-read today. *memory, unverified* = recollection only: dayoneapp.com, apple.com, headspace.com, calm.com, culturedcode.com, bear.app, overcast.fm, tinybeans.com, qeepsake.com and huckleberrycare.com did not resolve from this sandbox today. The HIG in-app purchase page returned 404 to the product lens, so it is cited from memory.

---

## 0. The biggest changes, in brief

1. The line "We ask everyone the same question." is gone. The age question stays the first screen on v1.0 (the law and PRD-REQ-019 say so), but it now opens in the launch screen's room: the opening quotation pair, the lamp light, one question, two equal answers. Moving it behind the welcome is specified and held for the founder and counsel.
2. First run becomes one lit room and one object. The lamp arrives at the gate and stays lit across first run. A paper **book cover** appears when the child is named, is signed on the next step, and opens on "The book is open."
3. The promise screen shows a small fix instead of describing three: a sample sentence with two marks you can tap and put back. It goes from about 110 words to about 70.
4. "We", explaining why we ask, and repeated reassurance come out of more than 40 strings. The three sanctioned promises ("We never rewrite your words.", the trust promise, the voice promise) and counsel-registered disclosure text stay word for word.
5. Tonight leads with one question. The second question, the subtitle, goes. The prompt becomes the one big literary line on lamp-lit paper, and the lamp's colour follows the time of day (gold in the morning, amber in the evening, a rose and dusk tail late at night), as the website's light follows the scroll.
6. Every unfinished letter shows on Tonight as its own card with the person's first words, not one generic "A letter is waiting" line.
7. A save files the letter into its month: "Kept in Month 7", then the card arrives in the Book with a soft wash (MOTION 5e, finally built). No more ghosted text.
8. Review reads like the website's proof letter: a letter sheet with a "TO ASHA · MONTH 7 / FROM MAMA" header, marks drawn the website's way, the fix list folded behind one row. Typed letters skip Review entirely.
9. The Book reads as chapters: month openers with a large numeral and a date range, a lit current month, excerpts that fade instead of ending in a cut-off glyph, and a card that grows into its page.
10. Read together turns pages sideways, holds a still dusk light at night, and ends on the moon drawing and stillness.
11. Every unhappy state names its real cause and gives one way forward. The microphone-denied screen no longer covers "busy" and "phone full". Delete returns to the Book with Undo instead of a dead page. The crash and launch screens render in the brand faces.
12. Settings looks and behaves like iOS Settings: the early-version note moves to About, the privacy promise appears once, long content pushes to its own page, and Plus names its plans the way App Store Connect does.
13. Two phones and two parents get the same care as first run (chapter 7, package P8): a sign-in sheet with one line of why, a code screen that says where the email went, a Family tab that shows who writes to the child as signatures, an invite that carries the book cover, a join that opens the cover for the second parent and lights the Book for them, and a backup screen that says plainly what we hold and why. Every "we" there is disclosure text for counsel, not chatter.
14. Moving between rooms after first run feels like one house (section 5.8): the lamp never cuts, it fades down when you step into Listen or a letter and comes back when you return; Listen dissolves into Review; a kept letter lands in the Book, in its month, under the wash; tabs keep their native swap while the light settles from one room's tone to the next.

---

## 1. Principles

Ten rules, merged from the four lenses. Each names its benchmark and how it was checked.

| # | Rule | What it means on screen | Benchmark |
|---|---|---|---|
| 1 | **Arrival before admin, and the law first.** The first frame is the brand's room. A required question is asked in that room, with nothing around it. Nothing is asked that the first letter does not need. | Gate in the launch screen's room; no setup beyond name, date and signature; the download is an offer, never a wall. | HIG Onboarding: "Postpone nonessential setup flows or customization steps." and "Don't let large downloads hinder onboarding." HIG Launching: "Design a launch screen that's nearly identical to the first screen of your app or game." (*verified*) |
| 2 | **Say the thing, never why.** No "we ask", no "we sort", no preamble, no reassurance padding. "We" appears only in the three sanctioned promises and in counsel-registered disclosure text. | Help lines that justify a field are deleted. Errors say what happened and what to do. | HIG Writing: "Avoid using *we* altogether because it may be unclear who the 'we' in question refers to." and "Check each word to be sure it needs to be there. If you can use fewer words, do so." HIG Alerts: "Avoid explaining alert buttons." (*verified*) |
| 3 | **One job, one primary action, one literary line.** Each key screen has one Literata line big enough to carry it, one primary action in the thumb zone, and quiet alternatives beneath. Two serif lines never compete; two questions never stack. | Tonight's prompt, "The book is open.", the letter itself, a month numeral. | The website hero on `origin/main` (one serif line on the lamp light, read); HIG Onboarding: "design a flow that's fast, fun, and optional" (*verified*); DESIGN_LANGUAGE principle 3, "Quiet UI, loud letters" (repo). |
| 4 | **Show, do not tell. The person's own words and the product's own objects are the pictures.** A sample you can tap, the held letter itself, the book cover with the child's name, the product's own line drawings. No stock photographs, no faces, no mascot. | Promise specimen, Plus gate held letter, book cover, export cover thumbnail. | HIG Onboarding: "Teach through interactivity." (*verified*); the website ProofLetter (read on `origin/main`); DESIGN_LANGUAGE 9, "No stock baby photos, anywhere" (repo); Day One "On This Day" resurfaces your own entries (*repo-verified*, BENCHMARK S6). |
| 5 | **One light per room, never on a voice or a problem.** The lamp (PR #99) lights paper behind arrival, first run, Tonight, Write, the Book and the Family tab, tinted by the time of day. It never cuts between rooms: it fades down and comes back (section 5.8). A still dusk pool may sit low behind Read together's controls at night. It never sits behind a recording being made, a letter page, an error, a sheet that sells, or the brand mark. Its strength is capped so the reading colours keep 4.5:1 everywhere on screen and the status colours keep it wherever text sits (D-110). | See the scene table in section 5.2. | The website `Aurora.tsx` (amber to rose to dusk, read); HIG Motion: "Add motion purposefully, supporting the experience without overshadowing it." (*verified*); MOTION 5k and the atmosphere contrast test on PR #99 (repo). |
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

**Under-18 stop screen (S02).** Same room: the same lamp at 0.6, still, and the same mark in the same place. One line in `title1` (Literata Medium 28/34), centred where the question was: `ageGate.stopTitle` "{app} is currently for adults 18 and over" (a title, so no full stop). Nothing else. After 24 hours, one secondary pill 32 pt below the line: `ageGate.mistakeButton` "I answered by mistake". It leads to the question with nothing preselected (J02-05). VoiceOver announces the line on arrival. No haptic, no timer, no "come back tomorrow". This is the only screen in the app allowed no way forward, by law.

Copy:

| Key | After | Mark |
|---|---|---|
| `ageGate.title` | Are you 18 or older? | KEEP |
| `ageGate.body` | (not shown) | RET |
| `ageGate.yesButton` | Yes | KEEP |
| `ageGate.noButton` | No | KEEP |
| `ageGate.stopTitle` | {app} is currently for adults 18 and over | CHG (was "Thank you for telling us."). Held in #181 at the old words until P2 switches it with the stop screen. |
| `ageGate.stopBody` | (not shown; its sentence became the title) | RET |
| `ageGate.stopNote` | (not shown) | RET. "Nothing you entered has been kept." refers to nothing (one tap was given) and is only partly true (the time of the No is stored, D-026). |
| `ageGate.mistakeButton` | I answered by mistake | KEEP |

Acceptance checks:
- [ ] On a fresh install the first screen after the splash is the question, with neither answer selected and Continue disabled (LEGAL-REQ-002 AC1).
- [ ] No string on the screen other than the question, "Yes", "No" and "Continue".
- [ ] Yes, Continue: `ageGate.passed` is the only thing written; the welcome follows in the same lit room with no flash of unlit paper.
- [ ] No, Continue: the stop screen shows only the stop line; only `ageGate.stoppedAt` is stored; the room does not dim or change.
- [ ] Relaunch within 24 hours shows the stop screen; after 24 hours "I answered by mistake" appears and leads to an empty question (J02-03, J02-04, J02-05).
- [ ] A deep link on a fresh install lands on the question (the gate stays in `_layout.tsx`). With server features on this includes an invite link (`/j#t=...`, #165) and a sign-in link: after Yes, Continue, the join sheet (S59) or the code screen (S54) opens; after No, nothing about the invite is read or kept beyond what `+native-intent.tsx` already stored, and it is cleared with the session (S01 owns that file).
- [ ] The age step inside account setup (S55), when it shows, is this same question with the same two pills and Continue, and no explanatory line.
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

The app has one story: a lamp comes on, a book is named and opened, a voice is kept, and the book fills, month by month, at bedtime and on quiet days, from one phone or two, by one parent or both. Seven chapters carry it. Light and motion change by chapter, so a person feels where they are without being told.

| Chapter | What the person feels | Light | Motion | Pictures |
|---|---|---|---|---|
| **1. Arrival** (gate, welcome, promise, naming, signing, the book opens) | "This is calm, it is mine, and it is ready." | The lamp arrives once at the gate (0.6, still), rises on the welcome (1.0, breathing), settles low for the form steps (0.5, still), and rises again when the book opens (1.0). It never goes out between steps. | Arrivals only: words rise 8 pt over 280 ms. Controls never move. | The opening quotation pair (gate), the lockup (welcome), the sample with two marks (promise), the **book cover** with the child's name (naming, signing), the cover opening (finish). |
| **2. The first evening** (Tonight, Listen, Review, saved) | "Say one thing. It is kept exactly as I said it." | Tonight is lit by the time of day. Listen has **no** lamp: only the voice moves the aura. Review is plain paper. | Tonight's lines arrive once per cold launch. The aura follows the voice. Marks are there from the first frame. The save files the letter into its month. | The prompt as the literary line, the person's own words on a letter sheet, the "Kept in Month 7" chip. |
| **3. The first letter in the book** (Book arrival, the letter page) | "It is really there, in my words and my voice." | Book: a low still pool behind the header. Letter page: plain paper, no light (a voice plays here). | The new card is already in place with a 1.6 s `accentSoft` wash. A card grows into its page. | The month opener and numeral; the letter as a page with the signature in italic. |
| **4. The book growing** (months, Read together, the end of the book) | "This is becoming the story of their life." | The current month's opener is lit; earlier months are paper. Read together at night: one still dusk pool low behind the controls. | Pages turn sideways. At the end, the moon draws on once, then nothing moves. | Month numerals, the moon drawing. |
| **5. The quiet days** (Not much today, quiet-day rows, reminders, the morning, "A month ago") | "Skipping is fine. Nothing is counted." | In the evening, "Not much today" lowers the Tonight lamp to 70 percent: lights down. Mornings are gold. | One small line in place of the link; Undo restores both line and light. | The moon glyph, the person's own month-old letter resurfaced (never a count). |
| **6. The hard moments** (mic off, words that do not come, the Plus gate, delete, not found, crash, launch failure, the stop screen) | "Nothing is lost, and I know what to do next." | **None.** Light is for moments, not problems. | None beyond a 200 ms fade. No breath on error drawings. | One static line drawing chosen for the moment, the held letter itself on the Plus gate. |
| **7. Two phones, two parents** (sign in, Account, the Family tab, invite, join, leave, backup, a new phone, erase everywhere, delete account) | "The book is ours, it comes with me to a new phone, and I know who can read it." | Sheets and Settings: none. The Family tab: a low, still pool (0.4). The joined parent's first Book: the light rises once, slowly, as it did on "The book is open." | Native sheets and pushes; steps inside a sheet cross-fade in place. The book cover opens for the second parent. A new member's row arrives with the wash once. | The book cover with the child's name; both signatures as the Family tab's list; the Microphone glyph on backup; no drawings of devices or locks as decoration. |

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
| 11 | Saved (S21) | J06-09, J07-07 | Added to Asha's book. | none | file into month chip, dismiss to the Book | success on commit |
| 12 | Book, new letter (S26) | J09-02 | Month 7 | L book 0.6, still; returns over 280 ms | lands scrolled to the card, arrival wash 1.6 s | none |
| 13 | A letter (S27) | J10-01 | the letter | none (the Book's lamp fades as the card grows) | card grows into page | none |
| 14 | Read together (S30) | J11-01 to J11-03 | the letter | dusk at night, still | page turn | none |
| 15 | End of the book (S31) | J11-04 | That is every letter so far. | dusk, dims | moon draws on, then still | none |
| 16 | Not much today (S33) | J08-02 | A quiet day, kept. | evening: lamp to 70% | line replaces link | soft |
| 17 | Keep needs Plus (S22) | J06-14 | Keep adding to Asha's book | none | held letter rises in | none |
| 18 | Microphone is off (S13) | J05-04 | The microphone is off | none | 200 ms fade | none |
| 19 | Deleted, Undo (S36) | J10-08 | Letter deleted. | (Book's own) | card collapses out of its row | warning on confirm |
| 20 | Crash, launch recovery (S50, S51) | J20-01, J20-02 | This page did not open / The book could not open | none | none | none |
| 21 | Sign in (S52 to S55) | J22-01 to J22-10, J22-20, J22-21, J22-31, J22-32, J22-40 to J22-43, J22-50, J22-60, J22-70, J22-71, J22-80, J22-81 | Keep Asha's book on any phone | none (sheet over the Book) | native sheet; steps cross-fade | none |
| 22 | Family tab (S57) | J17-01, J17-02, J17-03, J21-20 | Who writes to Asha | L family 0.4, still | lamp settles from the last tab's tone | none |
| 23 | Invite a co-parent (S58) | J21-21 to J21-23, J21-30, J22-90, J22-91 | Invite Asha's co-parent | none (sheet) | native sheet, then the share sheet | none |
| 24 | Joined (S59) | J21-05 to J21-08 | You're in Asha's book | none in the sheet; the Book's lamp rises after | the cover opens | success once |
| 25 | Back up my recordings (S61) | none yet (P8 adds j23) | Back up your recordings | none | the turn-on card folds into the On rows | tap |
| 26 | A new phone (S62) | none yet (j23) | Bringing your recordings to this phone. | (Book's own) | a thin determinate line, no count | success once when done |

The "before" for rows 1 to 20 is in the scratchpad contact sheets (sheets 01 to 09, labelled by step id; path in the files table above). Row 22's "before" is the coming-soon Family tab (`screens/J17-01.png`, sheet 08). Rows 21 and 23 to 26 have no "before": the record the sheets were cut from was made with server features off. P8's flows added rows 21 to 24, and the regenerated record (run with server features on, against the mock server) shows them at the steps above; rows 25 and 26 have no step yet (no j23 flow).

---

## 4. Screens, in journey order

Each entry: steps, before screenshot, verdict, package (section 6), copy after, visual, motion, states, acceptance. Copy keys are in `packages/content` (`en.*` in `strings.en.ts`, the named `*Copy` objects in `src/features/*.en.ts`). Where a screen has no change in a category, it says so.

### Chapter 1. Arrival

#### S01 Age question and S02 the under-18 stop screen
See section 2.3. Steps J00-open, J01-01, J01-02, J02-01, J02-05 (S01); J02-02, J02-03, J02-04 (S02). Before: `screens/J01-01.png`, `screens/J02-02.png`, `screens/J02-04.png`. Verdict: redesign (S01), polish (S02). Package P2.

#### S03 Welcome
Steps J01-03, J17-04. Before: `screens/J01-03.png`. Verdict: redesign. Package P2.

Problem: three text voices of equal weight, the product name retyped in Literata (BRAND_SYSTEM 2a: "Never retype the name in a font to stand in for the logo"), no light. PR #99 (merged as `d74e860`) added the pair and a lamp but still retypes the name.

Copy:

| Key | After | Mark |
|---|---|---|
| `onboarding.welcome.title` | {app} (accessibility label of the lockup only; never typed on screen) | KEEP, no longer visible text |
| `onboarding.welcome.subtitle` | The baby memory book you fill by talking. | KEEP, now the hero line |
| `onboarding.welcome.body` | A few words at a time, in your own voice. Kept for {child} to read and hear for years. | KEEP |
| `onboarding.welcome.freeLine` | Your first two letters are free. | KEEP (D-082) |
| `onboarding.welcome.startButton` | Begin the book | KEEP |
| `onboarding.welcome.signInButton` | I already have a book | KEEP, shown again (D-100 amends D-087); opens the sign-in sheet with trigger `sign_in` (S52) |
| `onboarding.welcome.joinButton` | I was invited | KEEP, shown again; opens the join sheet (S59) |

Visual: the stacked lockup (new registry context `app.welcome` resolving to `logo.lockup.stacked.ink` and `.reversed`, 96 pt tall, centred, its top 96 pt below the safe-area top) is the one logo. Founder item, section 7; until approved, use the existing `app.header` small-cut lockup at 26 pt. The hero line is `onboarding.welcome.subtitle` in `hero` (Literata Medium 44/50, tracking -0.4), centred, 32 pt below the lockup. Then `body` in `body` (Mukta 18/24) `textMuted`, centred, 16 pt below. Then `freeLine` in `footnote` `textMuted`, 12 pt below. "Begin the book" full width, 56 pt, bottom. Under it, one row of two quiet text buttons in `callout` `accent`, 44 pt tall, centred with 24 pt between them: "I already have a book" and "I was invited" (stacked at accessibility sizes, the same order). They are doors, not offers: no icon, no border, no line explaining accounts. With server features off (the kill path, `capabilities.signIn` false) both are hidden. Background: the lamp `welcome` scene (anchor top, core gold, tail amber, intensity 1.0, breathing per MOTION 5k). No line drawing: the light and the lockup are the picture, and BRAND_SYSTEM allows one logo per screen.

Motion: the lamp, already lit at 0.6 from the gate, rises to 1.0 over 1200 ms. The lockup fades in over 200 ms at 0 ms. The hero line enters at 120 ms, the body at 150 ms, the free line at 180 ms (`staggerMs` 30). The button is opaque from the first frame. On "Begin the book" (v1.0: straight to the promise; held version: opens the age sheet), the content exits up 8 pt over 160 ms and the lamp eases to 0.5, still.

States: no empty, loading or error state.

Acceptance:
- [ ] The product name is never typed in a font on this screen; the lockup comes from the registry and its accessibility label is the brand name.
- [ ] Exactly one serif line (the descriptor), one filled button and the two quiet doors; no line drawing. The one state with no filled button is a phone whose invite just joined a book that has not arrived: a line says the book is on its way in place of "Begin the book", until the book is here, 30 seconds pass, or sync cannot run (S59, as built in #375).
- [ ] "I already have a book" opens S52 over the welcome, and "I was invited" opens S59; closing either without a book returns to the lit welcome with the lamp at the same level (a sheet over a lit room holds its light, section 5.8).
- [ ] A sign-in that brings a book to this phone lands on the Book, where the letters that came back and the restore line show first (5.8 row 13), never on Tonight.
- [ ] From the gate to the welcome there is no frame of unlit paper (the lamp keeps its state through `persistKey`).
- [ ] Dark mode matches the website hero: reversed lockup, the amber lamp at the dark peak on `#161412`.
- [ ] Reduce Motion: the lamp holds still at 1.0, and the content appears with one 200 ms fade.

#### S04 The promise
Step J01-04. Before: `screens/J01-04.png`. Verdict: redesign. Package P2.

Problem: about 110 words in three cards and a footnote, three "we" sentences, and mechanics explained before the person has said a word. The mishear card repeats what the first Review note and Settings already say (those are the two places `docs/legal/in-app-disclosures.md` section 2 registers for it; first run is not one of them).

Copy:

| Key | After | Mark |
|---|---|---|
| `onboarding.promise.title` | Exactly as you said it. | KEEP |
| `onboarding.promise.body2` | We never rewrite your words, shorten them or write for you. | CHG (v1.3), directly under the title: the sanctioned promise word for word, then the two other claims. "Every sentence is one you said." is not repeated; the title says it. |
| `onboarding.promise.sampleLabel` | For example | NEW (as #181) |
| `onboarding.promise.sampleRaw` | Today, um, you you held the spoon all by yourself. | NEW. The sample's raw words, cleaned at runtime by the real engine (see Visual). |
| `onboarding.promise.sampleHint` | Word for word marks every small fix. Tap one to put it back. | NEW. Names the feature here, which VOICE allows on the promise. |
| `onboarding.promise.recordingBody` | The recording is kept on this phone, so one day {child} can hear you say it. | KEEP, now an icon row. Still true under option B: first run comes before sign-in, and backup is off until the owner turns it on (S61), so at this moment the recording is only on this phone. |
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
- [ ] At most about 70 words on the screen at the default text size (71 as built). Not about 60: the recording and privacy rows are at their floor (27 words, meaning fixed), and the sample, label and button are fixed by this acceptance and the engine test, so the body line was cut to its floor (11 words). The one cut left that needs no counsel diff, a hint without the name "Word for word", is not taken, because D-074 and D-086 chose that name (D-111 item 11, #229).
- [ ] The sample is set in Mukta, labelled "For example", unsigned, with no `{child}` name in it.
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
| `onboarding.child.nameLabelMore` | Another child's name | NEW (second and later rows; "Another name" read as a nickname for the same child; as #181's final notes) |
| `onboarding.child.namePlaceholder` | First name, or a nickname | CHG (#374, 28 Oct: "First name, or the name you use at home" did not fit the serif name field on a 375 pt phone. It asks for a name and promises no nickname feature, unlike the retired `nameHelp`, "You can add a nickname later.") |
| `onboarding.child.nameHelp` | (not shown) | RET |
| `onboarding.child.birthdayLabel` | Birthday | KEEP |
| `onboarding.child.birthdayHelp` | (not shown) | RET |
| `onboarding.child.expectingLabel` | Not here yet | KEEP |
| `onboarding.child.expectingHelp` | Letters written before the birth go in Before You. | CHG (as #181) |
| `onboarding.child.dueDateLabel` | Due date | KEEP |
| `onboarding.child.chooseDate`, `bornToday` | Choose a date / Born today | KEEP |
| `onboarding.child.addAnotherButton` | Add another child | KEEP |
| `onboarding.child.addAnotherHelp` | Twins or more? Each child gets their own book. | CHG |
| `childrenExtra.nameRequired`, `onboarding.child.needBirthday`, `needDueDate`, `needNameMany`, `nameLimit` | as today | KEEP |
| `childrenExtra.edit.birthdayFuture` | Choose today or an earlier day. | CHG (shared with S46) |
| `childrenExtra.edit.dueDateRange` | Choose a due date from today up to ten months ahead. | KEEP |
| `onboarding.child.cta` | Continue | KEEP |

Visual: introduce the **book cover** (`components/book/book-cover.tsx`, section 5.4). On this step it sits at the top right of the heading row, 88 x 116 pt, closed: paper (`surfaceRaised`, `radius.md`, elevation 1, a 1 pt `line` border in dark mode), the small-cut symbol at its head, and the child's name set live in Literata Medium 17 pt, centred, at most three lines, ending in a fade, never an ellipsis glyph and never a word broken in two: the type steps down to the 13 pt floor first, and a word still wider than the cover at the floor ends the name in a fade on one line (neither a 12 pt floor nor the 96 pt cover holds all of "Christopher", "Maximilian" and "Alexandrina": on the 88 pt cover 12 pt still fades Christopher, by 0.05 pt, and Alexandrina, and the 96 pt cover at the 13 pt floor fades both; `book-cover.test.ts` pins the 13 pt measurements and the 96 pt case, and lowering the floor is the spec owner's call; #374). Empty name: the cover is blank. Twins: a second cover fans 10 pt behind the first, rotated 3 degrees, carrying the second name. With the keyboard up and under 480 pt of free height, the cover hides, so the name field stays in view. Free height with the keyboard and its QuickType bar up, measured by P2-V on #220 on a web export, unverified on a phone: 407 pt on an iPhone SE, 538 on a 17 Pro, 610 on a Pro Max; so the SE hides the cover and the Pro and Pro Max keep it while the name is typed. The form itself may scroll once the date block is in (it does on all three under this rule: by 176 pt on the SE, 145 pt on the 17 Pro and 73 pt on the Pro Max). At accessibility text sizes the heading takes the whole row and the cover sits under it, here, on the signature step and in Add a child (S47), so the heading is never squeezed to a word a line (the P6a critics' pass S2, #374). The name field uses the letter face (Literata 22 pt), because it is the book's title, in first run (every name row) and in Add a child; labels stay Mukta, and the signature field keeps the app's face. "Born today" becomes a chip beside the date control. The disabled Continue is the outline style from S01.

The reason line stays in words and is never only a greyed button. It sits directly above Continue in `footnote` `textMuted` until the person taps the disabled Continue. Then it turns `caution` with a WarningCircle icon, is announced politely, and focus moves to the empty field. HIG Entering data: "make the button available only after people enter the data you require" (*verified*).

Motion: the cover fades in (200 ms) when the step arrives. Its name cross-fades (200 ms) after each typing pause of 300 ms, with no per-letter motion. The date block enters (`motion.enter`) after the first character of the name. The reason line cross-fades (150 ms) when it changes and never shakes. Reduce Motion: static cover, instant text.

States: empty name; name at the 60-character limit ("A name can have up to 60 characters."); no date; future birthday; due date beyond 305 days; empty twin row. All as today, in the words above.

Acceptance:
- [ ] No help line justifies a field; no "we" on the screen.
- [ ] The date row starts empty ("Choose a date"); there is no default date (the J01-07 fix holds).
- [ ] The reason line is muted until the disabled Continue is tapped, then caution with an icon, and focus moves to the field.
- [ ] The cover shows the typed name exactly as typed (trimmed only for display), and hides when the keyboard leaves less than 480 pt of free height, so the name field stays in view on an SE, a 17 Pro and a Pro Max.
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
Steps J01-16, J01-17, J03-03. Before: `screens/J01-16.png`, `screens/J01-17.png`, `screens/J03-03.png`. Verdict: redesign. Package P2 (and `components/speech/speech-consent-card.tsx`).

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

Visual: the cover from S06, now 132 x 176 pt and centred above the hero line, **opens**: its front cross-fades to the flyleaf (the child's name small at the top, "From Mama" at the foot, one hairline across the middle where the first letter will go). "The book is open." in `hero`, the body in `body`. The download card below: `accentSoft` fill, `radius.md`, 16 pt padding, title in `headline`, body in `footnote`, then a bordered secondary "Download on Wi-Fi" and a quiet "Not now" side by side (stacked at accessibility sizes). After a choice the card collapses to one line: `chosenYes` plus a thin determinate bar, or `chosenLater`, or `lowSpace`. "Write the first one" full width, pinned at the bottom below the scrolling step, so it is whole on an iPhone SE at the default text size (#374; the web flow measures that size only, and large type is a device check, D1 and D5 of the P2 critics' pass); the cover, the line and the download card scroll above it. The lamp `finish` scene rises from 0.5 to 1.0: the light comes up as the book opens.

Motion: on arrival the cover's front holds for 300 ms, then cross-fades to the flyleaf with an 8 pt shift on `standard` (no 3D flip). The lamp rises over 1200 ms. The hero line enters at 200 ms. The `success` haptic plays once when the step is reached. The card collapse uses `LinearTransition` on `standard`. Any tap completes the sequence. Reduce Motion: the open cover is shown at once, the lamp is at 1.0, one 200 ms fade.

States: low space (no download button, the low-space line); download in progress (the bar keeps moving: HIG Progress indicators, "When possible, use a determinate progress indicator" and "Keep progress indicators moving", *verified*); already on the phone (no card at all).

Acceptance:
- [ ] One filled button on the screen ("Write the first one").
- [ ] Nothing downloads until "Download on Wi-Fi" is tapped (D-087); the size shown is this phone's plan, never a typed number.
- [ ] After "Not now", one line: "Your voice is kept either way."
- [ ] With the model already on the phone, the card does not appear.

### Chapter 2. The first evening

#### S09 Tonight
Steps J01-18, J04-01, J04-02, J04-03, J04-05, J04-06, J04-08, J04-09, J04-10, J05-12, J06-12, J06-15, J07-05, J07-10, J08-01, J18-02. Before: `screens/J01-18.png`, `screens/J04-01.png`, `screens/J18-02.png`; PR #99 after: `docs/design/calm-brand/after/tonight-*.png` on `feat/mobile-calm-brand`. Verdict: redesign. Package P3.

Problem: two questions stack (the subtitle "What do you want Asha to know about today?" over the prompt), a caps label explains the prompt, the prompt sits in a card like every other card, and every unfinished thing shows the same generic line. Tonight lists only the first draft: `listDrafts(childId)` in `lib/store.ts` already returns every draft, and the `[0]` is in `app/(tabs)/index.tsx` line 57, so the fix is in P3's own file and `store.ts` (S03) is not touched.

Prompts are already chosen by the child's age (`selectPrompt` with `ageMonths`). Nothing says so.

Copy:

| Key | After | Mark |
|---|---|---|
| `tonight.greeting.*` | as today ("Good evening, {name}.", "The house is quiet, {name}.", ...) | KEEP |
| `tonight.subtitle` | (not shown) | RET |
| `tonight.promptLabel` | A thought to start with (accessibility hint of the prompt only) | KEEP, not visible |
| `tonight.newPromptButton` | Another thought | KEEP |
| `tonight.speakButton`, `typeButton`, `notMuchButton` | Speak / Type / Not much today | KEEP |
| `tonight.draftWaiting.title` | A recording is ready to read back. | CHG (spoken, words ready). Held in #181 until P3. |
| `book.waitingForWords` | A recording, waiting for its words. | KEEP, reused on the card |
| `tonight.draft.held` | Waiting to be kept. | NEW (held at the Plus gate) |
| `tonight.draft.swept` | Recorded before the app closed. | NEW (found by the launch sweep). Revised 16 Oct (review B6): "Kept" is the Keep step's word, and this card is not kept yet. |
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
- The greeting drops from `display` to `title2` (Literata Medium 22/28) and turns two-tone, the website's "Asha is / asleep." move: "Good evening, " in `text` and "Mama." in `textMuted`.
- **The prompt is the one literary line**: new token `type.promptHero` (Literata Regular 28/36, max scale 1.8), directly on the paper with no card, 24 pt below the greeting, max 4 lines. "Another thought" stays a quiet text button with ArrowsClockwise, 12 pt below.
- **Unfinished letters**, between the prompt and Speak and Type: one card per draft, newest first, no totals. Each card is letter-shaped (`surfaceRaised`, `radius.md`, elevation 1, a 3 pt `accent` rule on its left edge, 16 pt padding). It shows the dateline ("Tuesday evening, 0:42" for a recording, "Tuesday evening" for typing), then either the person's first words in `letterBody`, two lines with a fade, or the state line in `footnote` `textMuted`, then the action as a text button. The state comes from the draft's own fields:

| Draft | Line | Action |
|---|---|---|
| Spoken, words ready | first words, else `tonight.draftWaiting.title` | Read it back |
| Spoken, words not yet written down | `book.waitingForWords` | Open |
| Typed | first words | Pick it up |
| Held at the Plus gate | first words, then `tonight.draft.held` | Keep it |
| Found by the launch sweep | `tonight.draft.swept` | Read it back |

  If a state cannot be read from the draft, the card uses the first row. Where each state comes from, so no package touches the local schema implicitly (#146, #166 and #182 are changing it now, owned by S03): spoken or typed from `Draft.captureMode` and `audioUri`; words ready from `Draft.rawTranscript`; swept from `Draft.recoveredAt`; **held from `Draft.held`, which S03 adds in local schema v8 (#182)**. P3 reads these fields and changes none. Until #182 merges, a held draft has no field to read and shows the first row; nothing is inferred from a second gate call.
- **A month ago**: when no draft is waiting and a letter in the book is dated 28 to 35 days ago, show one card in the same shape with the `caption` kicker "A month ago" and the letter's first line in `letterBody`. Tapping it opens the letter. It shows the newest such letter only, never a count and never a gap. It never shows a private letter. (DESIGN_LANGUAGE 12 already specifies this card. Day One "On This Day", *repo-verified* in BENCHMARK S6.)
- Speak and Type: unchanged, identical twins, 64 pt, static.

Motion: cold launch only: the dateline, greeting and prompt enter with a 30 ms stagger, under 400 ms (MOTION 5a). A warm resume, a tab switch and a return from Listen, Review or a letter move nothing; only the lamp changes (section 5.8). "Another thought": the old prompt exits (160 ms), the new one enters (8 pt, 280 ms). Draft cards enter with `motion.enter` at a 30 ms stagger. Speak and Type never move. Reduce Motion: static; one 200 ms fade on a prompt change.

States: no drafts (prompt only); several drafts (scroll above the pinned Speak and Type); newborn day 0 (J04-03, the same layout); twins (no child switcher on Tonight in build 2: the switcher is on the Book only, one place for the control, and Tonight's dateline names the child it is for; the P3 critics' pass S3 asked for it in the dateline, and #376 left it to the Book).

Acceptance:
- [ ] One question on screen: the prompt. No subtitle, no caps label.
- [ ] After a kill with two kept takes, Tonight shows two cards.
- [ ] A typed draft closed mid-sentence shows its first words and "Pick it up" (J07-05).
- [ ] A letter held at the Plus gate shows "Waiting to be kept." and "Keep it" (J06-15, J07-10), read from `Draft.held` (#182); a swept take shows "Recorded before the app closed."
- [ ] The lamp tone changes with the greeting (gold in the morning, amber in the evening, the rose tail at night, the dusk tail late at night); with Increase Contrast there is no lamp.
- [ ] No count, days-since or streak anywhere on Tonight.

#### S10 Usage-sharing ask
Step J04-04, now titled "A later session: no usage-sharing ask". Before: `screens/J04-04.png` (it shows what `develop` does: Tonight with no sheet, because #118 turns analytics off in every profile; the old capture of the sheet is not in the regenerated record). Verdict: keep, not built in this pass. Package: none.

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
Steps J05-04, J05-10 (the phone being full is native only and judged from code). Before: `screens/J05-04.png`. Verdict: redesign. Package P4.

Problem: "We can't hear you yet" is a "we" line, and its body explains the two buttons. Worse, in `listen.tsx` `begin()` any error from `start()` shows this screen, so a microphone held by a call, a refused audio session or a full phone all say "allow the microphone in Settings", which cannot help. `errors.storageLow` exists and is never used.

Copy:

| Key | After | Mark |
|---|---|---|
| `errors.micDenied.title` | The microphone is off | CHG. Held in #181 until P4 splits off, busy and full. |
| `errors.micDenied.body` | Turn it on in Settings, or type this one. | CHG. Held in #181 until P4. |
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

Behaviour (P4): `begin()` in `listen.tsx` tells the cases apart: permission denied, then busy (start threw while permission is granted), then full (free space under 50 MB, from the new `lib/capture/free-space.ts`, checked before `beginTake`). "Type instead" opens Write with the same prompt. When the app returns to the foreground with permission now granted, the screen goes straight to the idle Listening state.

Acceptance:
- [ ] Denied, busy and full show three different titles; none says "we".
- [ ] A refused audio session while permission is granted never shows "The microphone is off".
- [ ] Returning from Settings with permission granted lands on idle Listening.

#### S14 Review while the words are being written down
Steps J05-03, J05-07, J05-08, J05-11. Before: `screens/J05-03.png`, `screens/J05-08.png`. Verdict: polish. Package P4.

Copy:

| Key | After | Mark |
|---|---|---|
| `wordsCopy.preparing` | Writing down what you said. | KEEP |
| `wordsCopy.listening` | Writing down what you said. Part {n} of {count}. | KEEP |
| `review.waitingLong` | Long recordings take a little more time. | NEW (after 8 s; as #181) |
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
| `review.waiting.body` | Your words follow once the download is done. | CHG. Revised 16 Oct (review B6): names the real cause (principle 8) instead of "this phone is ready". |
| status line | `speechSettingsCopy.downloading` / `waitingForWifi` / `noSpace` | KEEP |
| `wordsCopy.pack.mobileDataButton` | Use {size} of cellular | CHG (US), as #181 holds it. "Use cellular data {size}" is 24 characters, over the 22 in `rules.test.ts`, and `apps/mobile/test/speech-consent.test.ts` (from `develop`) requires the button to show the size from the plan (D-087). "Use 575 MB of cellular" is 22 characters. |
| `wordsCopy.pack.typeButton` | Type it instead | KEEP |

One primary ("Keep the recording" once the download is agreed) and one quiet action: "Use 575 MB of cellular" while waiting for Wi-Fi, otherwise "Type it instead". The moon drawing's breath is replaced by a still drawing plus the determinate bar (HIG Progress indicators: determinate when known).

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
| Empty take (no audio) | `review.emptyTake.title` NEW "Nothing was recorded" | `review.emptyTake.body` NEW "The recording ended before any sound came in." (revised 16 Oct, review B6: "take" is code vocabulary; the glossary word is recording) | `wordsCopy.noSpeech.recordAgainButton` "Record again" | "Type it instead" |
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
| `review.noChanges` | Nothing to fix. This is exactly what you said. | CHG (as #181) |
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
| `review.saveFailed` | Your words are still here. That did not work this time. | NEW (as #181: the words are safe before anything else, VOICE's Error row; a caution line above the primary, which reads "Try again" for that attempt) |

Visual: Review reads as a letter being read. Under the title, the letter sits on a **sheet** (`surfaceRaised`, `radius.xl` top corners, `radius.md` bottom corners, elevation 2, 16 pt gutters, 20 pt padding; dark `#201D1A` with a 1 px `line` border). Its header row, from the website ProofLetter: `review.headerTo` on the left and "From Mama" on the right, both in `letterDateline` caps `textMuted`. Then the words in `letterBody`. Marks use the website's grammar at full opacity from the first frame: a removed word carries a 1.5 pt `editMark` strike and sits in `textMuted`; a repaired name shows the struck heard word followed by the kept word on an `accentSoft` wash (radius 4). The first-time note (registered text) sits above the sheet as today and collapses on "Got it". The segmented control (44 pt pills) sits right under the sheet. The fix rows fold behind one disclosure row ("2 small fixes", chevron), because every mark is tappable in the text. "Change words" as a quiet link. Footer: "Add to Asha's book" (primary) and "Keep private" (quiet). No lamp: a voice plays here. Review is presented full screen, not as a page sheet, so Listen dissolves into it with no change of shape (5.8, row 4); Close stays at the top right.

Motion: as MOTION 5d: tapping a mark expands an inline card under its line (`LinearTransition`, `standard`, content after 80 ms); "Put it back" cross-fades the word in (out 120, in 160 ms), the paragraph reflows, the restored word gets a 1.6 s `accentSoft` wash, and "Put back. Undo" stays until dismissed. Switching to "Exactly as said" cross-fades the text (150 ms).

States: first time (the note); no fixes (`review.noChanges`); every fix put back (`noChangesAfterUndo`); a language with no fix rules (`noChangesNoRules`); save failed (`review.saveFailed`, the primary reads "Try again"); stopped early (the S14 stop line above the sheet).

Acceptance:
- [ ] No "we" on the screen except inside the registered first-time note.
- [ ] VoiceOver reads the letter header as "To Asha, Month 4" and "From Mama", never the "·" separator.
- [ ] Every mark is visible from the first frame, tappable, reversible both ways, and each one is an `EditType` checked by `verifyEdits` (constitution).
- [ ] "Exactly as said" and "Exactly as you said it." appear only when the final words equal the raw words (D-086).
- [ ] With a two-word name, the primary reads "Add to the book" whenever "Add to {child}'s book" would pass 22 characters.
- [ ] A failed save keeps the letter, relabels the primary "Try again" and shows "Your words are still here. That did not work this time." directly above it.

#### S18 Review, change words
Step J06-08. Before: `screens/J06-08.png`. Verdict: polish. Package P4.

Visual: edit in place on the same sheet. No inner box; the sheet's own edge becomes a 1.5 pt `accent` line, the caret is in the letter face, "Done" (`common.doneButton`) sits in the header and in the keyboard accessory bar. The 2 pt focus ring stays for Full Keyboard Access only. No copy change.

Acceptance:
- [ ] No web-form rectangle inside the letter while editing; the person's edits are stored as theirs.

#### S19 Write
Steps J04-07, J05-05, J07-01, J07-02, J07-06. Before: `screens/J07-02.png`. Verdict: polish. Package P4.

Copy: `write.autosaved` "Saved on this phone" KEEP; `write.label` KEEP; `tonight.typing.placeholder` "Write it the way you would say it." KEEP; `write.notSaved` NEW "Not saved yet" (autosave failure, caution, in the same place; retried on the next pause). The single "Save" is replaced by the destination pair (S20).

Visual: the lamp `write` scene (anchor top, 0.5, still: nothing breathes while typing). The prompt, when there is one, becomes the literary line in `prompt` (Literata 24/32) `textMuted`, above the page. The placeholder in `letterBody` `textMuted`. Above the keyboard: `review.destination.addButton` "Add to Asha's book" (primary) and `review.destination.privateButton` "Keep private" (quiet), side by side, stacking at accessibility sizes. Disabled until there is text, in the outline style.

Acceptance:
- [ ] Autosave line appears after a pause and stays; a failed write shows "Not saved yet" in place.
- [ ] Typed words are never touched by the machine.

#### S20 A typed letter: no Review step
Step J07-03 (now titled "Saved to the book, no Review": the regenerated record shows the saved moment of a typed letter, so the old Review screen for a typed letter is not in it and there is no "before"). Verdict: redesign. Package P4.

Decision: typed letters skip Review. A typed letter has no fixes and no recording, so "Read it back" is one extra screen between typing and keeping. Content and States wanted to keep it; Product wanted to skip it. Skipping wins: HIG Modality "keep modal tasks simple, short, and streamlined" (*verified by the product lens*); Apple Notes and Bear save without a review step (*memory, unverified*). The Keep step is still the only gate (D-082): tapping "Add to Asha's book" or "Keep private" on Write runs `decideKeepLetter()` exactly where Review does today, and the Plus gate (S22) opens from that tap.

Acceptance:
- [ ] From Write, one tap keeps the letter and shows the saved moment (S21); no "Read it back" screen for typed letters.
- [ ] The third kept letter without Plus opens the gate from Write, and the letter waits as a draft (D-082, D-083).

#### S21 The saved moment
Steps J06-09, J06-11, J07-07 (the saved screens on the Review route; the Book just after a save is in S26). Before: `screens/J06-09.png`, `screens/J07-07.png`. Verdict: redesign. Package P4.

Problem: the letter fades to about 10 to 15 percent opacity and stays there behind a green line. The captures read as a rendering bug, and nothing shows where the letter went.

Copy:

| Key | After | Mark |
|---|---|---|
| `review.destination.addedToast` | Added to {child}'s book. | KEEP |
| `review.destination.filedChip` | Kept in Month {month} | NEW (as #181: "Kept" is the word the person just tapped; the website's "Filed in Month 9" card stays the motion benchmark) |
| `review.destination.filedChipNewborn` | Kept in the first weeks | NEW |
| `review.destination.filedChipBefore` | Kept in Before You | NEW |
| `review.destination.privateToast` | Kept just for you. | KEEP (chip with LockSimple) |
| `review.destination.voiceOnlyToast` | Recording kept on this phone. | KEEP (true at this moment: a backup upload, when backup is on, comes after the save) |
| `billingCopy.keepGate.secondFreeNote` | That was your second free letter. | KEEP, once: on the second kept letter it shows as the Book's toast after the landing (no action, 4 s), not under the chip, where the hand-off leaves no time to read it (D-082) |

Visual and motion: build MOTION 5e as written. Commit, `success` haptic, then animate. At 0 ms the sheet scales from 1 to 0.9 and its radius goes from `xl` to `md` on `gentle`. At 250 ms (`motion.file.chipAtMs`) the chip fades in under it: `accentSoft` fill, `caption`, with the website's lit edge (a 1 pt border in the lamp `amber` tone at 40 percent opacity). At 550 ms (`moveAtMs`) the card moves down 24 pt (`dy`) and fades on `standard`. At about 900 ms, while Review still covers the screen, P4 selects the Book tab on the book the letter was kept in (Review can move a draft to another child, `setDraftChild`) and sets `arrived`; then Review fades out (200 ms) over the Book, so Tonight is never seen between them. The app lands on the **Book tab, on the new letter** (both "Add to {child}'s book" and "Keep private"; a private letter shows there with its Private chip): the Book opens already scrolled so the card sits under its month opener, with no scroll animation (section 5.8, row 5). From Write, the same sequence plays inside Write's sheet; the Book tab is selected under the sheet, then the sheet dismisses natively onto the Book. After the very first kept letter on a signed-out phone, the sign-in sheet (S52, trigger `first_letter`) rises over the Book 600 ms after it lands, once, so the person sees the letter in its place first; today `review.tsx` replaces Review with the sheet before the Book is ever seen. The confirmation line ("Added to Asha's book.") is in `text` with a success check icon, not green text. The person's words are never shown at ghost opacity: the card is at full strength or leaving. A tap skips to the end. On arrival in the Book the new card is already in place under a 1.6 s `accentSoft` wash. The States lens proposed a lamp bloom behind the saved card. Rejected: Review is a voice screen, and principle 5 keeps light off it.

Reduce Motion: the chip and the line appear with one 200 ms fade, then the modal dismisses; the arrival wash is static, then fades.

Acceptance:
- [ ] The save commits before any animation (MOTION principle 3); killing the app mid-animation loses nothing.
- [ ] The chip names the real month, "the first weeks" or "Before You".
- [ ] No frame shows the letter's words at partial opacity for longer than the 350 ms exit.
- [ ] "That was your second free letter." shows once, on the second kept letter only, as the Book's toast after the landing, with no count of what is left.
- [ ] The Book opens on the book the letter was kept in, and Tonight is never seen between Review and the Book.
- [ ] After keeping, the Book tab is selected with the new card in view and washed; Back or a tab tap from there behaves as on any Book visit.
- [ ] The first-letter sign-in sheet appears over the Book, never in place of Review, and "Not now" leaves the Book as it was.

#### S22 Keep needs Plus
Steps J06-14, J07-09. Before: `screens/J06-14.png`. Verdict: redesign. Package P6.

Problem: it looks like an empty state (a small glyph in a corner circle, two paragraphs), and it asks for something without showing the letter it is about. "Come back to it once Plus is on." tells the person what to do later instead of where the letter is now.

Copy:

| Key | After | Mark |
|---|---|---|
| `billingCopy.keepGate.title` | Keep adding to {child}'s book | KEEP |
| `billingCopy.keepGate.body` | Your first two letters are kept for good. Plus lets you keep adding letters. | CHG |
| `billingCopy.keepGate.heldNote` | This one waits on this phone, on Tonight, exactly as it is, for as long as you like. | CHG. Held in #181 until P3: it is true only once Tonight shows every draft. Follows #163's register 3.1.0, row "Keep step and held letter": the letter waits on this phone and is never discarded (C10). |
| `billingCopy.keepGate.heldNoteSynced` | This one waits on Tonight, exactly as it is, for as long as you like. It syncs privately with your account. | NEW (signed in; register 3.1.0: "and syncs privately when signed in"). P6 shows it on the Keep sheet when signed in; the content owner adds it with P3's switch (C10). |
| `billingCopy.keepGate.heldChip` | Waiting | NEW (chip on the held letter) |
| `billingCopy.keepGate.seePlus` | See Plus | KEEP, primary |
| `billingCopy.keepGate.holdButton` | Keep it here for now | KEEP, quiet |
| `billingCopy.keepGate.redeemLink` | Redeem a code | KEEP |
| `billingCopy.keepGate.lapsedBody` | Plus has ended. Every letter you kept is still yours to read, play and export. | CHG |
| `billingCopy.keepGate.offline` | Plus needs a connection to start. This one waits on this phone, on Tonight, exactly as it is. | CHG. Held in #181 until P3, as `heldNote`; register 3.1.0 as `heldNote` (C10). |
| `billingCopy.gate.unavailable` | Plus is not available on this device yet. | KEEP |

Visual: a full-height sheet on paper. At the top, the **held letter itself** as a small paper card (`surfaceRaised`, `radius.md`, elevation 1, rotated -2 degrees): its dateline, its first two lines in `letterBody` with a fade, "From Mama", and the "Waiting" chip. Then the title in `title1`, the body in `body`, the held note in `subhead` `textMuted` (trust copy is never below the subhead step). Then "See Plus" (opens the Plus store screen with Apple's `SubscriptionStoreView`), "Keep it here for now", and the "Redeem a code" link. No lamp and no lockup on this sheet: the stacked lockup belongs above Apple's subscription view (registry `app.paywall`), and light is for the person's moments, not for selling. No price, trial or countdown anywhere on the sheet (D-083). At accessibility text sizes the order changes (the P6a critics' pass S1, as built in #370; the default size keeps the order above): the footer holds exactly the two buttons, "See Plus" and "Keep it here for now", and no text (when Apple's store is not available "See Plus" is not drawn and the footer is just "Keep it here for now"); the scroll holds the title, the held note (the letter-safe line, right after the title), the note about See Plus when there is one, then the body, and after them the held card and "Redeem a code". The scroll comes first in reading order, so the held note is read before any button at every size.

Motion: the sheet opens natively; the held card rises with `motion.enter`; buttons are static.

States: no StoreKit on the device (one "Keep it here for now" and the "not available" line); offline (the offline line under "See Plus", which stays and retries); lapsed (`lapsedBody`).

Acceptance:
- [ ] The held letter's own first words are on the sheet; nothing is sent anywhere to show them.
- [ ] No "$", "price", "free trial" or "free months" on the sheet (the rules test already enforces this for `keepGate`).
- [ ] "Keep it here for now" closes the sheet and the letter appears on Tonight as "Waiting to be kept." (S09).

#### S23 Review opened with no draft
Step J06-13. Before: `screens/J06-13.png`. Verdict: polish. Package P4.

Copy: `review.noDraft.title` NEW "Nothing to read back here" (a state title carries no full stop, as #181); `review.noDraft.button` NEW "Go to the book". `errors.generic` stays for real failures only.

Visual: `StateScreen` kind `notFound`: the page drawing, static, centred; the title in `title2`; the primary at the bottom; Close in the header. No red, no body.

Acceptance:
- [ ] A stale Review link never says "Something went wrong" or asks to try again.

### Chapter 3. The first letter in the book

#### S24 Book, empty
Steps J03-04, J09-01. Before: `screens/J09-01.png`, `screens/J03-04.png`. Verdict: polish. Package P5.

Copy: `book.empty.bookTitle` "The first page is waiting." KEEP (also what the second parent sees in a book with no letters yet, after joining); `book.empty.bookBody` CHG "Tell {child} one thing about today." (VOICE's own "Do" line; the old one repeated the finish screen's sentence with another adjective); `book.empty.bookCta` "Write a letter" KEEP. With one book, the `children.switcher.label` row ("FOR ASHA") is hidden, because "Asha's book" already says the name.

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
Steps J06-10, J07-04, J07-08 (the Book on arrival after a save, 5.8 rows 5 and 5a), J08-03, J08-05, J08-06, J09-02, J09-03, J09-04, J09-05, J11-05, J18-03. Before: `screens/J09-02.png`, `screens/J09-04.png`, `screens/J09-04-full.png`, `screens/J18-03.png`. Verdict: redesign. Package P5.

Problem: it reads as a feed. The current month is a tinted box that explains the filing system on every visit and takes the hero position from the newest letter. Excerpts end in a cut-off glyph. A letter opens with a generic push.

Copy:

| Key | After | Mark |
|---|---|---|
| `book.title` | {child}'s book | KEEP |
| `book.monthKicker` | Month | NEW (opener kicker, caps by style) |
| `book.thisMonthLabel` | This month | KEEP (kicker of the current month's opener) |
| `book.chapterNewborn`, `book.beforeYouChapter` | The first weeks / Before You | KEEP (in place of the numeral) |
| `book.chapterLetters`, `chapterSubtitleOne` | {count} letters / 1 letter | KEEP |
| `book.fromTwo` | From {a} and {b} | NEW (the opener's signature line when both parents wrote that month, in the order of each one's first letter in it; one author keeps `common.signature`) |
| `book.monthRange` | {a} to {b} | NEW (for example "September 13 to October 12"). As built in #181: `{start}` and `{end}` are not in the `rules.test.ts` placeholder list, and `{a} to {b}` is the pattern `review.rowChange` already uses, so no test changes. P5 fills `a` with the month's first day and `b` with its last. |
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
- **The other parent's letters** (option B): the same card, signed with what the child calls them ("From Papa"); no avatar, no colour per person, no "new" badge. The first time this phone shows a letter that arrived by sync, it carries the same 1.6 s `accentSoft` wash as a letter just kept, once.
- **A new phone, recordings coming back** (S62): P8's `components/backup/restore-line.tsx` sits above the first opener while a restore runs: one line and a thin determinate bar, no count. P5 places it; P8 owns it.
- Lamp `book` scene (top, 0.6, still) behind the header, with `persistKey="tabs"`; cards are opaque.

Motion: the first Book view per session settles the header (opacity 0.6 to 1, y 6 to 0, `gentle`; MOTION 5a). A new letter arrives in place with the 1.6 s `accentSoft` wash: when the route carries `arrived=<entry id>` (set by P4 after a save, section 5.8 row 5), the list is positioned before its first frame so that card is in view under its opener, then the wash runs; the param is cleared after use so Back and tab taps never replay it. Opening a letter uses the measured-rect transition (MOTION 5f, built by P1 as `CardToPage`) from **build 3**: in build 2 the letter opens by the platform push, because the route stays `push` (`ROUTES['letter/[id]']` in `transitions.logic.ts`) until the device checks (D4) pass and the page reads `useCardToPagePhase()` for when its carried words are home (the P5 critics' pass S2). The push is the platform default and every other P5 line works under it. The rest of this paragraph is the build 3 design. The Book goes under a veil of the page's paper over 160 ms (`lamp.leaveMs`, on a straight line, the way its lamp leaves a lit room) while the tapped card holds for 136 ms (`cardToPage.holdMs`), keeping its press feedback; then one paper surface grows from the card's rect to the whole screen on `standard`, radius `md` to 0, its colour from the card's `surfaceRaised` to the page's `bg`. The card's dateline and opening lines are carried whole into the page (P1's contract, section 6, P5), and only the rest of the letter fades in from 60 percent progress. There is no dim and no blur on the Book: the veil is the dim. Back carries the words into the card while it is still visible, and the veil lifts over 280 ms (`lamp.returnMs`) once the paper is within 24 pt (`cardToPage.clearPt`) of the card; otherwise the page leaves by the 200 ms hand-off below. Reduce Motion, no measured card, or a page column or type size that differs from the card's: nothing moves; the move is one 200 ms fade (`fadeMs`) each way, shaped as a hand-off (`CARD_TO_PAGE.handOff`, #218): the leaving screen (the Book under the same veil, or on the way back the page, paper and words) fades over the first 140 ms, and the arriving one fades in over the last 120 ms, from 80 ms. Both are straight lines, so nothing loses more than half its strength in 50 ms (the planned worst is 36 percent), and the two screens' words are never on screen together at more than a quarter of their strength (0.23 planned; at most 0.18 measured on the web build). Measured on the web build, it is done 224 to 240 ms after the tap, both ways. As P1 built it (#192, with the Reduce Motion timing from #218; `CARD_TO_PAGE` in `lib/transitions.logic.ts`, stepped ms by ms in `transitions.test.ts`). The native push stays only until P5 mounts `CardToPage` and asks P1 to switch the route (section 6, P5).

States: one letter (J09-02); many months (J09-04); a recording waiting (J09-03); no words (J09-05); quiet days and removing a mark with Undo (J08-03, J08-05, J08-06); dark (J18-03); a letter from the other parent; a month both parents wrote in (`book.fromTwo`); a letter deleted on another phone (its card collapses out of its row on the next pull, `exitMs`, with no toast, because nobody tapped anything here); recordings coming back on a new phone (the restore line).

Acceptance:
- [ ] No tinted explainer box at the top; the current month is a lit opener with no sentence.
- [ ] Month openers show the numeral, the letter count and the date range; VoiceOver reads "2 letters, from Mama", never the "·" separator.
- [ ] No ellipsis glyph in any excerpt; the stored letter is never cut.
- [ ] A quiet-day mark is never counted or shown in the letter face.
- [ ] (Build 3.) The card-to-page transition reverses on Back, and under Reduce Motion or on failure falls back to the 200 ms hand-off: the Book (under the veil) fades over the first 140 ms and the whole page fades in over the last 120 ms, from 80 ms, done within 250 ms of the tap; the same shape back.
- [ ] (Build 3.) The letter card keeps its press feedback (cards at 0.98 on `snappy`, `motion.press.cardScale`) through the 136 ms hold, until the paper starts to grow.
- [ ] (Build 3.) When a card opens into its page, VoiceOver focus lands on the page's opening once the move or the fade settles, and the list behind cannot be reached by swiping (check on a device that the presenting screen is hidden; hide the list explicitly if not).
- [ ] Excerpts keep whole lines at every Dynamic Type size, including the three below the default (xSmall, Small and Medium, font scale 0.823, 0.882 and 0.941): two lines clip at exactly two rendered lines, and the fade sits on the last of them.
- [ ] After a save, the Book shows the new card in view and washed, once; the other parent's letter is signed with their name and carries no badge.
- [ ] The month range reads "{a} to {b}" filled with real dates, never a raw placeholder.

#### S27 A letter, as a page
Steps J10-01, J10-02, J10-05, J10-07, J10-16, J18-04. Before: `screens/J10-01.png`, `screens/J18-04.png`. Verdict: polish. Package P5.

Copy:

| Key | After | Mark |
|---|---|---|
| `book.provenance.spokenFixed`, `spokenExact`, `typed` | Spoken, with small fixes / Spoken, exactly as said / Typed | KEEP |
| `book.recordingOnPhone` | Recording kept on this phone | KEEP, joined into one line with the provenance: "Spoken, with small fixes. Recording kept on this phone." Shown while backup is off, or before this recording's upload has finished. |
| `book.recordingBackedUp` | Recording kept on this phone and backed up | NEW (the key retired on 3 Oct returns with backup, as its retirement note said). Shown once S05 reports this recording's backup object in place (`audio_blobs`). |
| `book.recordingElsewhere` | Recording kept on {signsAs}'s phone | KEEP. The other parent's letter: no player, because family listening is not in v1.0 (D-073: backup and playback are owner-only). |
| `backupCopy.recordingOnItsWay` | Your recording is on its way to this phone. | NEW, P8's file (S62). Own letter on a new phone while its recording is still being restored; replaces the player until the file is back. |
| `book.hearShort` | Hear {signsAs} | KEEP |
| `review.originalLabel` | Exactly what you said | KEEP |
| `book.entryMenu.*` | Add to book / Make private / Delete | KEEP |
| `playerCopy.cannotPlay` | This recording will not play here. It is still kept, and every export includes it. | CHG (as #181) |

Visual: the letter itself unchanged (dateline, words in `letterBody`, the italic signature, Reading size "Aa"). One **pill player** (`components/player/audio-player.tsx`): elevation 2, 56 pt tall, the play button, "Hear Mama", the time remaining, and a thin scrubber inside the pill (replacing the separate full-width slider and time labels). One provenance line in `footnote` `textMuted` with a Microphone icon, then the "Exactly as said" link (only when raw differs from final). The grouped action list stays. No lamp and no loop: a voice plays here. No paper texture (section 5.3 explains why). Chrome fades on scroll (DESIGN_LANGUAGE 12).

Motion: "Exactly as said" cross-fades the text over 150 ms with its label. Reading size cross-fades as today.

Acceptance:
- [ ] One player control group, not three rows.
- [ ] The "on this phone" fact stays visible on the page (K-42, D-033); only its form changes. With backup on, it says "and backed up" only for a recording whose upload has finished.
- [ ] The other parent's letter shows its words, its signature and "Recording kept on Papa's phone", and no player.
- [ ] Nothing loops on the letter page.

#### S28 A letter with no words
Steps J10-10, J10-17. Before: `screens/J10-10.png`. Verdict: polish. Package P5.

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
| `readTogether.nowReading` | Month {month} · From {signsAs} | CHG. Held in #181 until P5 builds all three datelines. |
| `readTogether.nowReadingNewborn` | The first weeks · From {signsAs} | NEW |
| `readTogether.nowReadingBefore` | Before You · From {signsAs} | NEW |
| `readTogether.autoplayLabel` | Keep playing | CHG |
| `readTogether.positionA11y` | Letter {n} of {count} | NEW (VoiceOver only) |
| `readTogether.previousButton`, `nextButton` | Back one / Next letter | KEEP |
| `readTogether.noRecording` | This one was typed. Read it aloud together. | KEEP |

Visual: chrome-free, Large print by default (as today), following the app's Appearance setting. The Visual lens proposed forcing a night page here whatever the theme. Rejected: the person chose an appearance in Settings, Appearance, and Large print readers who need light paper would lose it. At night (greeting `evening`, `night` or `lateNight`), the `readTogether` scene adds one **still** dusk pool anchored at the bottom behind the controls, never behind the letter text. The position becomes a 2 pt hairline progress line under the top bar (`accent` at 40 percent). "Keep playing" is a quiet toggle chip under the pill player, remembered across sessions, exposed to VoiceOver as a switch. The dateline in `letterDateline`.

Motion: **page turn** (new, `motion.pageTurn`): "Next letter" moves the page 24 pt left and fades it out (`exitMs` 160) while the next one enters from 24 pt right on `standard`. "Back one" reverses it. A horizontal swipe does the same, follows the finger, and can be interrupted. No curl. Quiet days are never pages (D-084). Reduce Motion: a 200 ms cross-fade. Haptic: none (playback has none, MOTION 6).

States: a typed letter (`noRecording`); a recording not on this phone (the existing line); the other parent's letter (`readTogether.recordingElsewhere` KEEP, "Papa's voice is on their phone. Read this one aloud together.": family listening is not in v1.0, D-073); an own letter whose recording is still coming back to a new phone (S62, the same line as the letter page); autoplay on (J11-03).

Acceptance:
- [ ] The dateline reads "Month 2 · From Mama" or "The first weeks · From Mama".
- [ ] There is no "1 / 5" text; VoiceOver reads "Letter 1 of 5", and the dateline as "Month 4, from Mama", never the "·" separator.
- [ ] The dusk pool appears only in the evening and later, never moves, and never sits behind the letter text.
- [ ] No word highlight (D-059).

#### S31 Read together, the end of the book
Step J11-04. Before: `screens/J11-04.png`. Verdict: polish. Package P5.

Copy: `readTogether.endOfBook` "That is every letter so far. More are still being written." KEEP (the Content lens wanted to cut the second sentence; three lenses keep it, and it speaks of time, not endings, as VOICE's legacy rule asks); `readTogether.finishButton` "Close the book" and `againButton` "Read it again" KEEP. `readTogether.endOfMonth` CHG "That was Month {month}." and `endOfMonthAlt` RET, because it would hold the same words (as #181) ("You are so loved." and "Every word was for you." are the app speaking sentiment to the child in its own voice; VOICE: the app's own words are small and add no meaning, and the letters carry the love.)

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
Steps J10-08, J10-09. Before: `screens/J10-08.png`. Verdict: redesign. Package P5.

Problem: a blank page says "Letter deleted." and explains the buttons while a toast says the same thing.

Copy: `settings.delete.entryToast` "Letter deleted." KEEP; `common.undoButton` "Undo" KEEP; `reader.deletedBody` (no page any more) RET.

Behaviour: on confirm, return to the Book at once (this follows the person's own tap, not a timer, so TDD 09 A11Y-F03 holds). With sync on the delete goes out as a tombstone through the outbox (S03), so the letter also leaves the other parent's book and the author's other phone on their next pull, with no toast there; Undo sends `entry.restore` and brings it back everywhere. The card collapses out of its row (height to 0 and a fade over `exitMs` 160, `LinearTransition` `standard`). One toast sits above the tab bar: "Letter deleted." with "Undo" and Close. It has an action, so it stays until Undo, Close or leaving the Book (DESIGN_LANGUAGE 11.5). Undo puts the card back in its place with the 1.6 s `accentSoft` wash.

Acceptance:
- [ ] No full-page deleted state remains.
- [ ] The toast has no timer; Undo restores the card in place.

#### S37 Letter not found
Step J10-11. Before: `screens/J10-11.png`. Verdict: polish. Package P5.

Copy: `reader.notFoundTitle` CHG "This letter is not in the book" (no full stop, as #181) ("not here anymore" leans toward loss language and was not what happened); `reader.notFoundDeleted` NEW "It is in Recently deleted."; `reader.openShelfButton` NEW "Open Recently deleted"; `reader.notFoundCta` "Back to the book" KEEP.

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
| `settings.delete.restoredToast` | Back in {child}'s book. | CHG. Held in #181 until P5 fills `{child}`. |
| `settings.delete.openButton` | Open | NEW (toast action after Restore) |
| `settings.delete.erasedToast` | Letter erased. | NEW, as built in #181. A synced letter is not only on this phone, so the line names no place (review A2b, B1). |

Visual: each card: the first words in `letterBody` `textMuted`, two lines with the fade (the full text is the accessibility label), "From Mama", then one `footnote` line joining the two dates ("Deleted October 13. Kept here until November 12."), then "Restore" (secondary filled) and "Erase now" (quiet destructive with the Trash icon). No countdown, no count (D-085). Empty: the page drawing, static, and `shelfEmpty`; no repeated heading.

Behaviour: a new toast always replaces the one on screen (`components/ui/toast.tsx`, P1). Restore: the card lifts out (160 ms) and "Back in Asha's book." with "Open". Erase now: the sheet (S39), then "Letter erased." with no action, which may time out after 4 s because it carries no action. With sync on, what Erase now reaches beyond this phone, and what the shelf shows until the server erase exists, is in S63; P5 builds those states in this file on P8's request.

Acceptance:
- [ ] After Erase now, no "Letter restored." toast is visible.
- [ ] No date reads as already done when it is in the future.

#### S39 Erase this letter now?
Step J10-14. Before: `screens/J10-14.png`. Verdict: keep. Package P5.

Copy: `settings.delete.eraseNowTitle` "Erase this letter now?" KEEP; `settings.delete.eraseNowBody` CHG "The letter and its recording are erased for good." (as built in #181: it says what is erased, the letter and its recording, and names no place, because a synced letter is also on our servers, the author's other phone and, with backup on, in the backup); `settings.delete.keepButton` "Keep it" KEEP (default); `settings.delete.eraseNow` "Erase now" KEEP (destructive). An irreversible loss gets a sheet: HIG Feedback (*verified*). On a phone the file is removed first, then the row (D-085). "For good" means nobody can restore it; database backups still roll off over 7 days, as the Privacy Policy says (#181, for counsel). With sync on, Erase now is shown only once the server erase exists (S63).

### Settings, Plus and the rest

#### S40 Settings home, with If you are struggling and Licenses
Steps J03-06, J03-10, J16-01, J16-05, J16-06, J16-20. Before: `screens/J16-01.png`, `screens/J16-01-full.png` (J16-05 and J16-06 are now their own pages, `/settings/struggling` and `/settings/licenses`, so the two captures that showed the accordions open, `J16-05-full` and `J16-06-full`, are not in the regenerated record). Verdict: polish. Package P6.

Problem: the early-version note is the first thing on every visit, in a tinted card, although `in-app-disclosures.md` section 1 registers it for Settings, About. The privacy short line appears twice. "If you are struggling" and the licenses open as accordions in the middle of the list.

Copy:

| Key | After | Mark |
|---|---|---|
| `settings.about.beta.label`, `.body` | Early version / {app} is an early version, and it can make mistakes. Some things may change. Export a copy of your letters now and then. | KEEP verbatim (registered), MOVED to About as its footer, unstyled |
| `trust.short` | Private by default. Never sold, never used for ads. | KEEP, shown once (under Your data); the page footer copy is removed |
| `settingsHome.planHelp` | Your first two letters are free. Plus lets you keep adding letters. | CHG |
| `settingsHome.accountLabel`, `accountHelp` | Account / Sign in, and the ways you sign in. | KEEP. With server features on the row is always shown (signed in or out); it opens S56. Requested by P8. |
| `backupCopy.title`, `rowOn`, `rowOff` | Back up my recordings / On / Off | KEEP (#150), P8's file. A row under Your data, after Recordings, with its On or Off value; it opens S61. Requested by P8. |
| `settingsHome.deleteAccountLabel` | Delete account | KEEP. Signed in only, its own section, destructive style; it opens S64. Requested by P8. |
| `settingsHome.licencesLabel` | Licenses | CHG (US) |
| `licences.title`, `licences.rowLabel` | Licenses | CHG (US) |
| `licences.libraries` | React Native, Expo and the other libraries in this app are open source. Each one is listed below with its license. | CHG (US spelling, and the page now lists each library, #175; as #181's final notes) |
| `struggling.*` | as today, word for word | KEEP (FT-36 owns any change) |
| `settingsHome.strugglingA11yHint` | Shows free, confidential support lines. | KEEP |

Visual: About shows the app icon at 60 pt and the small-cut lockup at 22 pt (registry `app.settings.about`), the version, then the early-version footer. "If you are struggling" and "Licenses" become rows with a chevron that push their own pages, like every other row (iOS Settings, observed). The struggling page keeps its three resources and the 911 line exactly, with no drawing, lamp or motion. Option B rows (P8 requests them; P6 builds them in this file): Account at the top of the first section, signed in or out, with "Signed in with Apple" (or Google, email) as its subtitle when signed in; Back up my recordings under Your data, after Recordings, with its value; Delete account in its own section above Help, signed in only. Each row is hidden when its capability is off (the kill path). Everything else as today.

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
| `billingCopy.plan.payment` | Apple handles the payment. Card details stay with Apple. | CHG. Registered text (in-app-disclosures.md, Terms 14.6): held in #181 at its registered words; P6 switches it only after counsel. |
| `billingCopy.plan.monthly` | Plus Monthly | CHG (D-077). Held in #181 until P6 switches the Plan screen to `plan.annual` too, after counsel (registered group). |
| `billingCopy.plan.annual` | Plus Annual | NEW (D-077; `plan.yearly` RET) |
| `billingCopy.plan.grace` | Apple could not take the last payment. Plus stays on while Apple tries again. | CHG. Held in #181 (registered group); P6 after counsel. |
| `billingCopy.plan.retry` | Plus is paused until a payment goes through. Every letter you kept is still here. | CHG. Held in #181 (registered group); P6 after counsel. |
| `billingCopy.plan.restoring` | Checking with the App Store | KEEP (row subtitle while restoring; it already holds these words, review B8) |
| `billingCopy.plan.restoreNone` | This Apple Account has no Plus to restore. | NEW. Revised 16 Oct (review B6): "No Plus found" reads like a search result. |
| `billingCopy.plan.restoreFailed` | The App Store did not answer. Try again in a moment. | CHG. Held in #181 (registered group); P6 after counsel. |
| `billingCopy.store.subtitle` | Your first two letters are free. Plus lets you keep adding letters. | CHG (it promised "a few extras"; Plus adds one thing). As #181, for counsel because it sits above Apple's plans: the same words as `planHelp`. Above a purchase, saying plainly what Plus does beats a literary line ("For every letter still to come.", considered and dropped), and VOICE asks for no claims beyond what the product does. |
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
| `settings.recordings.onPhoneTitle` | Kept on this phone | KEEP (backup off, and builds without backup) |
| `settings.recordings.onPhoneBody` | Recordings are kept on this phone and in your iPhone's own backup, if you use one. Export any time to keep a copy of your own. | KEEP, as #181 leaves it: shown only in a build without backup (the kill path, `capabilities.backup` off), where it is still the whole truth |
| `settings.recordings.onPhoneBodyBackupOff` | Recordings are kept on this phone and in your iPhone's own backup, if you use one. Our encrypted backup can keep them too, so they come back on a new phone. | NEW (backup in this build, turned off or signed out). Option B (review A2a): the v1.0 line left out our own backup. A new key rather than a CHG, so nothing changes on today's screen before P6 can tell the states apart; its Export sentence moves to the footer. |
| `settings.recordings.backedUpTitle` | Kept on this phone and backed up | NEW (backup on) |
| `settings.recordings.backedUpBody` | Recordings are kept on this phone and in our encrypted backup. We hold a recovery key under strict, logged access, so they can come back on a new phone. We never listen to them, sell them or use them to train models. | NEW (backup on). Says exactly what D-102 requires and nothing more: encrypted, a recovery key we hold under strict, logged access, never listened to, sold or used to train models. No "only you", "only your family's keys" or "end-to-end". Disclosure text: counsel approves it before it ships (C7). |
| `settings.recordings.exportFooter` | Export any time to keep a copy of your own. | NEW (section footer under the two backup variants; not under `onPhoneBody`, which already says it) |
| `settings.recordings.keepHelp` | (not shown; the card above says it) | RET |
| `speechSettingsCopy.title` | Writing down your words | KEEP |
| `speechSettingsCopy.footer` | Removing a language frees space. Recordings and letters stay. New recordings wait for their words until you add the language again. | CHG (as #181) |
| `speechSettingsCopy.downloadButton` | Download | NEW (row's trailing action) |
| `settings.tidyLabel`, `tidyOn`, `tidyOff` | Word for word / Small fixes, marked / Exactly as said | KEEP (Settings may name the feature) |
| `settings.tidyHelp` | Small fixes are marked in each letter and can be put back. Exactly as said keeps every um and false start. Either way, we never rewrite your words. | CHG |
| `settings.help.mistakesTitle`, `settings.help.mistakes` | How transcription works / Your words are kept as you said them. We can mishear, so read each letter and fix anything we got wrong. | KEEP verbatim (registered), the last footer |
| `packsCopy.cellularTitle` | Use cellular data | CHG (US) |
| `languageCopy.status.downloadNow` | Download now on cellular data | CHG (US) |

Visual: the language row reads "English" with the subtitle "575 MB" and a trailing "Download" text button when the model is not on the phone. While downloading, a small determinate ring with "Getting ready, 40%"; when done, "On this phone, 575 MB" and "Remove" (the existing confirm). No illustration. The card at the top reads backup's state from S05 (`lib/backup`, the same view the Settings row uses): a build without backup shows `onPhoneTitle` and `onPhoneBody`; backup off or signed out shows `onPhoneTitle` and `onPhoneBodyBackupOff`; on shows `backedUp*`, with one row under it, "Back up my recordings", that opens S61.

Acceptance:
- [ ] No fact appears twice on the screen.
- [ ] The language row is actionable when the model is missing.
- [ ] With backup on, the card names our encrypted backup and the recovery key; with it off, it says our backup can keep them; neither ever says the recordings are only on this phone.

#### S43 Export
Steps J15-01, J15-02, J15-03. Before: `screens/J15-02.png`, `screens/J15-03.png`. Verdict: polish. Package P6.

Copy:

| Key | After | Mark |
|---|---|---|
| `settings.export.body` | (not shown on Export; the "What is inside" list says it) | RET on this screen |
| `exportCopy.screen.offlineNote` | The export is made on this phone. It goes only where you send it. | CHG, as built in #181. Under option B, "Nothing is sent anywhere." would read as a claim about the whole app; this line is about the export only, which `lib/export` still builds with no network call. |
| `settings.export.neverExported`, `exportNudge` | Not exported yet / Save a copy of your book in Files or iCloud Drive. It is yours to keep. | KEEP |
| `exportCopy.screen.includesLetters` | Every letter, as text | CHG (v1.0 makes no notes) |
| `exportCopy.screen.includesRecordings`, `includesBook`, `includesData` | as today | KEEP |
| `settings.export.button` | Export everything | KEEP |
| `exportCopy.screen.emptyNote` | You can export once the book has a letter. | NEW (above the disabled button; as #181) |
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

Copy: `consentCopy.neverTitle` "What we never do" and its three lines KEEP (registered claims); `settings.privacy.documentsTitle` KEEP; the policy links are whatever #163 leaves, with one owned removal. #163 deletes the Consumer Health Data notice document but not its two links: `healthPrivacyLink` (`strings.en.ts` line 871 on #181's head), rendered at `settings/privacy.tsx` line 76, and `authCopy.consent.terms.healthLink`, rendered at `(auth)/sign-in/consent.tsx` line 136. **P6 with S14** removes the Privacy row from `privacy.tsx` and asks the content owner (S16) to retire `healthPrivacyLink` in the same merge; **P8a with S01** removes the account-setup link from `consent.tsx` and retires `healthLink` in `auth.en.ts` (P8a's file). Both land after #163 merges and no later than #169, which takes `/health-privacy` off the website, so no link ever points at a missing page. P6 otherwise renders the documents list from content and adds no link of its own (review A2c); `settings.privacy.analyticsOffNote` CHG "Turning this off stops sharing right away. Nothing else changes." (US; the screen part is hidden in v1.0). With server features on, Privacy also holds the sync-and-sharing consent row and its withdrawal sheet; their words are S14's with S16 and counsel (WP-F17-18), and P6 lays them out like the other rows without changing them.

Visual: the three never-lines become a plain list on paper, each with a 20 pt Phosphor icon in `textMuted`, not white grouped rows (rows look tappable and are not). The policy links stay as rows.

#### S45 Appearance
Steps J16-03, J16-04, J18-01. Before: `screens/J16-03.png`. Verdict: polish. Package P6.

Problem: the live sample "Dear {child}, today you laughed at the rain." is a letter the app wrote, set in the letter face, which VOICE forbids ("The app's own words ... never sit in the letter's type").

Copy: `settingsMore.themes.*` ("Match this phone", "Light", "Dark") KEEP; `reader.sizes.*` KEEP; `reader.preview` RET; `reader.previewEmpty` NEW "Aa".

Visual: the sample is the first line of the person's newest letter in the book (never a private letter), in `letterBody` at the chosen size. With no letter yet, the glyph specimen "Aa" in Literata at each size. The three Reading size labels are set in Literata at their own size (as S29). A theme change cross-fades the UI over 200 ms.

Acceptance:
- [ ] No sentence the app wrote is shown in the letter face.

#### S46 A child's book settings
Steps J03-07, J03-20, J03-21, J03-22, J03-23, J03-24, J03-25, J03-26, J03-27, J03-30, J03-31, J03-32, J03-33, J03-34, J03-40, J03-41 (J03-40 and J03-41 are the Hidden books page, the way back from "Hide this book"). Before: `screens/J03-07.png`, `screens/J03-31.png`. Verdict: polish. Package P6.

Copy:

| Key | After | Mark |
|---|---|---|
| `children.settings.remindersHelp` | Month and birthday messages for {child} follow this switch. | CHG |
| `children.settings.hideLabel` | Hide this book | KEEP, in `text`, not destructive red (nothing is deleted) |
| `children.settings.hideBody` | Hiding {child}'s book quiets every reminder and message about {child}. Nothing is deleted. | CHG (review B1: the old reason is dropped) |
| `children.settings.hideShared` | Hiding is only for you. {coParent} still sees {child}'s book as before. | NEW (a full sentence, review B; as #181's final notes), shown under `hideBody` only when the book has two parents. Hiding is per person: it never changes the co-parent's book (WP-F12-09 adds the per-person server column, S02; #166 adds the local per-person table, S03). Until those land, `store.hideChild` writes only on this phone, so the line stays true either way. |
| `familyCopy.bookRow.label` | Write this book together | NEW in `family.en.ts` (P8's file), replacing `familyCopy.soon.settingsRow` and `settingsRowHelp` with server features on. One parent: the row opens the invite sheet (S58). Two parents: the row's value is the co-parent's signature ("Papa") and it opens the Family tab. P6 builds the row in `children/[id].tsx` on P8's request. |
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
| `familyCopy.soon.settingsRow`, `settingsRowHelp` | as today | KEEP for the kill path only (server features off); replaced by `familyCopy.bookRow.label` when they are on |

The due-date card: when the due date has passed, a passed due date can be hard news, so the card never presumes a birth and never celebrates: no confetti, no drawing, no count of days. It is never a notification and never on Tonight. "Hide" hides it until the person opens the Due date row.

Acceptance:
- [ ] The born card can be hidden and never says the child was born.
- [ ] "Hide this book" is not styled as destructive; in a book with two parents its footer says hiding is only for you.
- [ ] Letters already written never change when the name or signature changes.
- [ ] With server features on, "Write this book together" opens the invite sheet (one parent) or the Family tab (two parents); with them off, the coming-soon row shows as today.

#### S47 Add a child
Steps J03-08, J03-09. Before: `screens/J03-08.png`. Verdict: redesign. Package P6 (consuming P2's `date-field.tsx`).

Problem: it prefills today as the birthday (the "0 days" trap first run removed) and its helper prints the placeholder as a name ("We sort letters by Their name's month of age.").

Copy: `children.add.title` "Add a child" KEEP; `children.add.body` (not shown) RET; the fields use the S05 keys; `children.add.cta` "Add {child}'s book" KEEP; `children.add.ctaShort` NEW "Add this book" (when the filled label passes 22 characters, or before a name is typed); `children.add.twinsHelp` KEEP.

Behaviour: identical to the first-run child step: no default date, "Born today" as a chip, Continue disabled with its reason line, the small book cover taking the name (at accessibility text sizes, under the heading: the P6a critics' pass S2, #374). Free, with no Plus gate (D-082, D-083).

Acceptance:
- [ ] The birthday starts empty; a seven-month-old cannot be saved as a newborn by default.
- [ ] No placeholder text ever appears inside a sentence.

#### S48 Family tab and the coming-soon sheet
Superseded by S57 (package P8). Option B puts the Family tab, the invite and joining in v1.0 (D-100; D-109 item 6), so this entry carries no steps: J17-01, J17-02 and J17-03 are placed in S57. The coming-soon presentation (`components/family/coparent-soon.tsx`, `familyCopy.soon.*`) stays only as the kill path when server features are off, with no copy change; the v1.0 line "Until then, every letter stays on this phone" is not applied anywhere (review B1).

### Errors and recovery

#### S49 Unknown route (404)
Step J19-01. Before: `screens/J19-01.png`. Verdict: polish. Package P6.

Copy: `errors.notFoundPage.title` CHG "Nothing at this link" (no full stop, as #181); `errors.notFoundPage.body` CHG "Your book is right where you left it."; `errors.notFoundPage.button` "Back to Tonight" KEEP.

Visual: `StateScreen`, like every other state: the window line drawing (ported, static), centred, the title in `title2`, the body in `body` `textMuted`, the primary full width at the bottom. Fix the gutter: pad the inner content View 20 pt (the `px-5` on `SafeAreaView` does not reach the content). Never show or log the address.

Acceptance:
- [ ] 20 pt gutters on both sides; the button is full width at the bottom.

#### S50 A screen could not be shown (root error boundary)
Step J20-01. Before: `screens/J20-01.png`. Verdict: polish. Package P6.

Copy: `errors.crash.title` CHG "This page did not open" (revised 16 Oct, review B6: "could not be shown" reads like a system log; this matches the launch screen's "The book could not open"; no full stop, as every error title in #181); `errors.crash.body` CHG "Your letters and recordings are safe on this phone." (it describes this phone's copy and does not say it is the only one, #181); `tryAgainButton` "Try again" and `tonightButton` "Go to Tonight" KEEP.

Visual: `components/resilience/plain-screen.tsx` sets `fontFamily` from `tokens.fontFamily` (`serifMedium` for the title, `sans` for the body and buttons). The faces are embedded at build time by the expo-font config plugin in `app.config.ts`, so nothing waits on a provider. Pill buttons with token radii. A static page drawing as a plain react-native-svg `Path` from `LINE_ART` with token colours. No lamp, no motion, no providers. Never show or log the error, its message or a stack (CLAUDE.md privacy rules).

Acceptance:
- [ ] The title renders in Literata and the body in Mukta, never Times, Georgia or Helvetica.
- [ ] The boundary imports nothing that can itself throw before render (no theme provider, no motion).

#### S51 The book could not open (launch recovery)
Step J20-02. Before: `screens/J20-02.png`. Verdict: polish. Package P6.

Copy:

| Key | After | Mark |
|---|---|---|
| `errors.launch.title` | The book could not open | CHG (no full stop, as #181) |
| `errors.launch.body` | Your letters and recordings are safe on this phone. | CHG. Revised 16 Oct (review B6): the second sentence was the padding principle 2 removes. "Safe on this phone" stays: `rules.test.ts` requires it in `en.errors`. |
| `errors.launch.hint` | Try again, or restart the phone. | CHG |
| `errors.launch.tryAgainButton` | Try again | KEEP |
| `errors.launch.exportButton` | Export what's readable | KEEP (22 characters; the States lens's "Save a copy of the files" is 24 and over the budget, rejected) |
| `errors.launch.exportingTitle` | Gathering your files | KEEP |
| `errors.launch.exportNothing` | This phone has no recordings or files to export. | CHG. Revised 16 Oct (review B6): active voice, no "were found". |
| `errors.launch.exportFailed` | That export did not work. Your files are still on this phone. | CHG. Revised 16 Oct (review B6): VOICE's own error shape ("That did not work this time."), then where the files are, with no "nothing was changed" padding. |
| `errors.launch.readme` | as today | KEEP |

Visual: as S50 (brand faces, static drawing, plain paper). No delete, reset or rebuild action may appear here (D-085).

### Chapter 7. Two phones, two parents (package P8)

Option B puts these surfaces in v1.0 (D-100; D-109 item 6). The streams built them as working screens with feature-local wording: S01 sign-in and Account, S04 the Family tab, invite, join and leave, S05 backup and restore, S14 account deletion. This chapter gives them the same treatment as chapters 1 to 6. Rules that apply here as well as everywhere else:

- **"We" only where the law or a promise needs it.** Consent and backup lines that counsel registers ship verbatim, and their trims go to counsel (section 7, C6 and C7); the deletion lines P8 corrects (photos, the backup) go to counsel before they ship (C8). Every other line follows principle 2.
- **Nothing about an invite before sign-in** (BL-322, security review H2). A joining parent sees the child's name only once they have joined.
- **No lamp in a sheet, a Settings page or a state here** (5.2). The Family tab is the one lit room, low and still. The joined parent's first Book is the one slow arrival outside first run (S59).
- **Native first.** `(auth)` and `invite` are modal stacks in `_layout.tsx`; Settings pages push. Steps inside one sheet are one act, so they cross-fade in place (`fadeMs`, 200 ms) instead of pushing.
- **P8 owns screens, components and words, never logic.** Each entry names the stream that owns the logic (PRD V2 `08-delivery.md` section 3.3). P8 edits none of those files and asks for changes in the stream's own PR.

**One sheet frame for the chapter**: `lib/auth/ui.tsx` (`SheetFrame`, `SheetTitle`, `SheetBody`, `QuietButton`, `Busy`, `ErrorLine`; P8a's file, consumed unchanged by P8b and P8c). `bg` paper, 24 pt top padding, 20 pt gutters. Title in `title2` (Literata Medium 22/28), body in `body` `textMuted`. One filled primary, 56 pt, at the bottom; quiet buttons as `accent` text, 44 pt. The privacy line in `footnote` `textMuted` with LockSimple 16 pt. An error is a `footnote` line with WarningCircle in `caution`, announced politely, never red text alone and never a shake. While busy, the primary keeps its size and shows its busy line with a small spinner inside it.

#### S52 Sign in, the sheet
Entry points: the welcome's "I already have a book" (trigger `sign_in`), the first kept letter (`first_letter`, over the Book, S21), Account signed out (`settings`), the Family tab's invite (`invite_create`), joining (`invite`). Steps J22-01, J22-02, J22-20, J22-21, J22-31, J22-50, J22-60 (J22-31 is this sheet opened from Account). Verdict: polish. Package P8a. Logic: **S01** (`lib/auth/**` except `ui.tsx`, `lib/supabase/**`, `supabase/functions/apple-token`; links bound to the asking phone and claim after consent, #139).

Problem: each body is one long sentence of reasons ("Sign in so your co-parent can write too, and so ..."); the unavailable line says "in this build"; errors put the problem before the reassurance, and two sound like a chat bot ("Let's take a short break.", "That's a lot of emails for one hour.").

Copy (`authCopy`, `packages/content/src/features/auth.en.ts`):

| Key | After | Mark |
|---|---|---|
| `sheet.titles.first_letter` | Keep {child}'s book on any phone | KEEP |
| `sheet.titles.invite` | Sign in to join the book | CHG ("the family book": a book has at most two parents in v1.0) |
| `sheet.titles.invite_create`, `sign_in`, `settings` | Sign in to invite a co-parent / Welcome back / Sign in | KEEP |
| `sheet.bodies.first_letter`, `sheet.bodies.settings` | Your letters come with you to a new phone, and {child}'s other parent can write in the same book. | CHG (what is true, not "sign in so") |
| `sheet.bodies.invite` | You each write from your own phone, in the same book. | CHG |
| `sheet.bodies.invite_create` | You both sign in, each on your own phone. | CHG |
| `sheet.bodies.sign_in` | Sign in the same way as last time to see every letter. | KEEP (it prevents a second account, PRD A F4) |
| `sheet.google`, `email`, `passkey`, `later`, `lastMethod.*`, `busy` | as today | KEEP |
| `sheet.privacy` (`trust.signIn.privacy`) | Only you and the people you invite can read your letters. We never sell them or use them for ads. | KEEP verbatim (registered). Under option B it claims who can read; C6 proposes the founder's line from `story.private.v2`. |
| `sheet.notConfigured` | Signing in is not available right now. Your letters are safe on this phone. | CHG ("in this build" is our word, not theirs; kill path only) |
| `errors.network` | Your letters are safe on this phone. Sign in once you are back online. | CHG (reassure first, VOICE Error row) |
| `errors.expired` | That link has expired. Send a new email for a fresh one. | CHG |
| `errors.code_paused` | Your letters are safe. You can try a code again in 15 minutes. | CHG (one sentence, without the system's voice; amended 28 Oct, #360: a service- or network-caused error says the letters are safe first) |
| `errors.rate_limited` | Your letters are safe. Sign-in emails are paused for an hour. Use Apple or Google, or try again later. | CHG (the cause and a way forward; amended 28 Oct, #360, as `code_paused`) |
| `errors.provider` | Your letters are safe. That did not work this time. Try again, or try another way. | CHG (VOICE's own error line; amended 28 Oct, #360, as `code_paused`) |
| `errors.session_expired` | Your letters are safe on this phone. Sign in again to keep sharing them. | CHG |
| `errors.consent_unavailable` | Your letters are safe on this phone. Setting up your account did not finish. Try again. | CHG |
| `errors.unknown` | That did not work this time. Your letters are safe on this phone. | CHG |
| `errors.not_available` | Your letters are safe. This way of signing in isn't available right now. Try another way. | CHG (amended 28 Oct, #360, as `code_paused`; the words after the first sentence as before) |
| `errors.wrong_code`, `invalid_email`, `under_18` | as today | KEEP (input errors keep their words) |

Visual: a native sheet, fit to contents (large at accessibility sizes). With a book on this phone (`first_letter`, `settings`, `invite_create`), the small closed book cover (88 x 116, the child's name) sits at the right of the title row, as on S05: the sheet is about that book. Under the body, the providers stacked full width, 56 pt, 12 pt apart: Sign in with Apple (Apple's own button, as HIG Sign in with Apple requires), "Continue with Google" (bordered, Google's mark as its branding rules allow), "Continue with email" (bordered, EnvelopeSimple 20 pt). "Use a passkey" as a quiet button only when enabled. "Last time you used Apple." in `footnote` under them. The privacy line and "Not now" at the foot. No illustration.

Motion: the sheet is native and its content adds no entrance (MOTION 5i). A provider tap puts that button in its busy state and disables the others. Success cross-fades to S55 in place, or closes the sheet when nothing is missing. A returning parent (`sign_in`) whose account brings a book lands on the Book, not Tonight (5.8 row 13). No haptic: an account is not an outcome in the letter's sense (MOTION 6).

States: kill path (`notConfigured`, no buttons); offline; busy; each error; opened while signed in (straight to S55, or closes); a sign-out still closing (buttons wait).

Acceptance:
- [ ] One title, one body sentence, the providers, the privacy line and "Not now".
- [ ] Service- or network-caused errors say the letters are safe first; input errors keep their words; unknown says it second.
- [ ] No "we" on the sheet outside the registered privacy line.
- [ ] "Not now" always closes and changes nothing on this phone.
- [ ] After the first kept letter it rises over the Book, never in place of Review (S21).

#### S53 Continue with email
Steps J22-03, J22-04, J22-05, J22-06. Package P8a. Logic: **S01** (`lib/auth/email.ts`: one email with a link and a code).

| Key | After | Mark |
|---|---|---|
| `email.title`, `label`, `placeholder` | Continue with email / Email / you@example.com | KEEP |
| `email.help` | A link and a code arrive by email. No password to remember. | CHG (no "we will send") |
| `email.send` | Send link | KEEP |

Visual: pushed inside the auth sheet. The title, one field (56 pt, `body` size, `email-address` keyboard, `textContentType="emailAddress"`, focused on arrival), the help in `footnote` under it, "Send link" full width above the keyboard, in the outline style until the text looks like an address.

States: invalid (shown on submit only, never while typing); rate limited; offline.

Acceptance:
- [ ] AutoFill offers the person's addresses; no error shows before the first submit.

#### S54 Check your email, and opening the link
Steps J22-07, J22-08, J22-09, J22-70, J22-71, J22-80, J22-81. Package P8a. Logic: **S01** (the link opens only on the phone that asked, #139; codes last 900 s, #159; `EMAIL_CODE_LENGTH` 6).

| Key | After | Mark |
|---|---|---|
| `code.title`, `body` | Check your email / Tap the link on this phone, or type the code here. | KEEP |
| `code.sentTo` | (not shown) | RET ("We sent a link and a code to") |
| `code.sentToEmail` | A link and a code are on their way to {email}. | NEW |
| `code.emailLabel` | Your email address | CHG ("Which email did we send it to?"; shown only when the app restarted in between) |
| `code.label`, `verify`, `openMail`, `resend`, `resendWait`, `resent`, `differentEmail` | Code / Continue / Open Mail / Send a new email / You can send another in a minute. / A new email is on its way. / Use a different email | KEEP |
| `code.lettersSafe` | Your letters are safe on this phone. | NEW (P8a critics S2, #372). Under the field while the email is on its way, and only when this phone holds a book; the same words as `errors.network`'s first sentence |
| `code.pausedOtherWays` | The link in the newest email still works, and so does signing in with Apple or Google. | NEW (P8a critics S1, #372). Said straight after `errors.code_paused`, in the same line, while the pause holds |
| `verify.title`, `typeCode`, `newEmail` | Signing you in / Type the code instead / Send a new email | KEEP |
| `en.auth.troubleButton`, `noEmailHelp` | Trouble signing in? / as today | KEEP (P0's file, unchanged); a quiet button at the foot that opens the help line in place |

Visual: `sentToEmail` with the address in `text` and the rest in `textMuted`. The code is one field in tabular figures, Mukta SemiBold 28 pt, tracking 6, centred, `textContentType="oneTimeCode"` so iOS offers the code from Mail, submitting at full length; "Continue" stays for VoiceOver and Switch Control. "Open Mail" bordered, then "Send a new email" and "Use a different email" quiet. Opening the link shows "Signing you in" with the small spinner, then S55 or closes. "Not now" (`sheet.later`, S52's key) is the sheet frame's header button, top right, outside the scroll and above the keyboard, so it stays in reach with the number pad up at every text size; it closes the sheet and changes nothing on this phone, and it waits while a code is being checked or a new email is being sent (#372). While the email is on its way, and only when this phone holds a book, `lettersSafe` sits under the field (a fresh install has no letters here to be safe); "A new email is on its way." shows under that line, and under the paused line while the pause holds.

Motion: a wrong code clears and refocuses the field and the line cross-fades in (150 ms); no shake, no haptic.

States: waiting; wrong code; expired; paused 15 minutes (S01's rule, unchanged: five wrong codes in 15 minutes pause typing a code for 15 minutes, and the server's own limit still holds. The field and Continue wait, and one polite line says `errors.code_paused` and then `code.pausedOtherWays`. "Send a new email" stays offered after its usual minute, because the newest email's link works too; sending never clears or shortens the pause. When the pause ends the field comes back and the line goes on its own; #372); rate limited; offline; restarted (asks the address); the link opened.

Acceptance:
- [ ] The address the email went to is on screen.
- [ ] A full-length code submits without a tap; a wrong one never shakes or flashes red.
- [ ] "Not now" is in the header and closes the sheet; it changes nothing on this phone, and it waits while a code is being checked or a new email is being sent.
- [ ] After five wrong codes the field waits, one line says the letters are safe and that the link and Apple or Google still work, and "Send a new email" is still offered; sending does not end the pause.

#### S55 Before your book syncs (terms, the age step, sensitive data)
Steps J22-10, J22-32, J22-40, J22-41, J22-42, J22-43. Package P8a. Logic: **S01** (`record_policy_act`, `my_sync_gate`, claim after consent), **S14** (the sensitive-data step moves to `app/consent/sensitive.tsx` in WP-F02-07; until it moves it is this file's third step), S17 and counsel (every word).

| Key | After | Mark |
|---|---|---|
| `consent.terms.*` | as today | KEEP verbatim (LEGAL-REQ-001, -006), except `healthLink`: RET, and its row leaves `consent.tsx` (P8a with S01), after #163 merges and no later than #169 (S44). Trims for counsel: C6. |
| `consent.age.title` | (not shown) | RET ("One quick question") |
| `consent.age.body` | Are you 18 or older? | KEEP, now the title |
| `consent.age.help` | (not shown) | RET ("We ask everyone the same question.", the line the founder objected to; C2 covers it, as for the gate) |
| `consent.age.yes`, `no` | Yes / No | KEEP, as S01's pills, with `common.continueButton` |
| `sensitiveConsent.*` | as today | KEEP verbatim (HN-4, counsel). Its `declineHelp` comment still says "v1.0 has no backup"; C7 asks counsel to re-read it for option B. |
| `consent.settingUp`, `consent.noBook.*` | as today | KEEP |

Visual: one sheet, the steps replace each other in place. Terms: title, body, each document as a row with a chevron (in-app browser), the agree line in `footnote`, "Agree and continue" filled, "Not now" quiet. Age: S01's layout without the mark and the lamp. Sensitive data: the title, then `body`, `use` and `changeLater` as three short paragraphs, then "Agree and sync" filled and "Keep on this phone" bordered at the same size beside it (a no must be as easy as a yes, LEGAL-REQ-006).

Motion: a 200 ms cross-fade between steps; `tap` on an answer.

Acceptance:
- [ ] Nothing syncs until the last step is answered (`canSync`).
- [ ] "Keep on this phone" is the same size as "Agree and sync" and leaves the person signed in.
- [ ] The age step shows only the question, Yes, No and Continue.
- [ ] P8 changes no registered sentence.

#### S56 Account
Steps J22-30, J22-33 (the sign-out wait and "Stay signed in" have no step: no web flow reaches them). Package P8a. Logic: **S01** (session, passkeys, sign out of other devices), **S03** (the sync state and the outbox drain before sign-out, `lib/sync/**`).

Problem: the signed-out body is two reasons and a reassurance; "Sync and family sharing" names a role v1.0 does not have; the sign-out lines say "we will sign you out".

| Key | After | Mark |
|---|---|---|
| `account.title`, `signedOutTitle`, `signIn`, `signedInWith.*` | Account / Not signed in / Sign in / Signed in with Apple (Google, email) | KEEP |
| `account.signedOutBody` | Your letters come with you to a new phone, and {child}'s other parent can write in the same book. | CHG (S52's body, word for word) |
| `account.syncTitle` | Sync | KEEP |
| `account.syncLabel` | Sync and sharing | CHG |
| `account.sync.on`, `off`, `unknown` | On / Off, kept on this phone / Waiting for a connection | KEEP |
| `account.sync.waiting` | Not set up yet | CHG ("Waiting for your answer") |
| `account.finishSetup`, passkey keys, `devicesTitle`, `signOutOthers*` | as today | KEEP |
| `account.signOut`, `signOutTitle`, `cancel` | Sign out / Sign out on this phone? / Cancel | KEEP |
| `account.signOutBody` | Your letters stay on this phone. Sign in again any time. | CHG. True (signing out leaves this phone's letters in place), so it is one of the three keys P8's test allows to say "stay on this phone" (section 6). |
| `account.signOutWaiting` | Your newest letters are still on their way. This phone signs out once they are sent. | CHG (no "we will") |
| `account.staySignedIn` | Stay signed in | NEW (BL-451, #388). A row under the waiting row that calls `cancelSignOutWait()`: back to signed in, nothing deleted, nothing sent. Only for a sign-out the person asked for (`reason === 'user'`), never while the sign-out is closing. |
| `account.signOutEarly` | Your newest letters are kept on this phone. They are sent the next time you sign in to this account. | NEW (BL-451, #388). On the signed-out page when the wait ended before the newest letters were sent (sync turned off, or the session ended during it). |

Visual: an iOS Settings page, no lamp. Signed in: a header on paper with the method's mark at 28 pt (Apple's logo as Apple allows, Google's G, or EnvelopeSimple), "Signed in with email" in `headline` and the address in `footnote` `textMuted`. Then Sync (one row with its value, or "Finish setting up" as a row), Passkeys, Devices, and "Sign out" as a row in `text`, not red: nothing is deleted (Delete account is on Settings home, S64). Signed out: the small closed cover, the title, the body and "Sign in". After a wait that ended early, `signOutEarly` sits between the body and "Sign in" in `body` `text`, and is announced once. It is the Account page's own state: it shows only if Account was open when the wait ended, and goes once the person is signed in again. In a sheet that needs the account (Invite a co-parent, Joining a book, Leave the book) the not-set-up-yet state is drawn by `AccountGate` (`lib/auth/ui.tsx`; signed out, it shows the sheet's sign-in body and "Sign in" instead): its line is a sentence about what the person was doing, not Account's row value (`account.sync.waiting` stays on Account): "Finish setting up your account to invite someone." (`familyCopy.card.finishSetup`) when inviting, "Finish setting up your account first." (`familyCopy.errors.consent_needed`) when joining or leaving, and `claim.waiting` while the claim screen is unanswered, each with "Finish setting up" under it. After a decline ("Keep on this phone") the gate shows nothing above "Agree and sync": `sensitiveConsent.declineHelp` would read as a question about a choice already made, and the step that button opens shows every registered line (P8a critics S4, #372).

Motion: native push. The sign-out confirm is a native alert. While the outbox drains, the Sign out row is replaced by the waiting row (`signOutWaiting` with a small spinner), with "Stay signed in" under it for a sign-out the person asked for; then the page cross-fades (200 ms) to signed out.

States: signed out; signed in with sync on; consent missing; offline; session expired (`errors.session_expired` above the sections, with "Sign in"); sign-out waiting (with "Stay signed in"); signed out after a wait that ended early.

Acceptance:
- [ ] Sign out never drops a queued letter: it waits for the outbox (F16) and says so.
- [ ] Sign out is not styled as destructive; no "we" on the page.

#### S57 Family tab
Steps J17-01, J17-02, J17-03, J21-20 (J17-01 to J17-03 moved from S48 and show the coming-soon tab; J21-20 is the live tab with one parent). Before: `screens/J17-01.png`, `screens/J17-01-full.png`. Verdict: redesign. Package P8b. Logic: **S04** (`lib/family/**`, `members.logic.ts`, `packages/core/src/{invite,family-rules}.ts`), S02 (invites, the two-parent cap, leave), S07 (family contracts, `invite-redeem`), **S03** (members from the last pull).

Problem: the tab is a list in a settings voice, the invite card explains equality and sign-in in three sentences, and its privacy line ("Only the people you invite can read Asha's book.") claims who can read, which option B does not keep (review A1).

| Key | After | Mark |
|---|---|---|
| `familyTab.membersTitle` | Who writes to {child} | KEEP, the room's one literary line |
| `members.you`, `coParent`, `invited`, `invitedName` | You / Co-parent / Invited / Your co-parent | KEEP |
| `members.openUntil` | Invited, open until {date} | KEEP (on `feat/coparent-alpha`) |
| `card.title`, `card.button`, `card.finishSetup` | Write this book together / Invite a co-parent / Finish setting up your account to invite someone. | KEEP |
| `card.body` | Invite {child}'s other parent. They write from their own phone, and you both read the whole book. | CHG |
| `card.signedOutNote` | (not shown) | RET (S52's title says it) |
| `card.privacy` | Shared only with the other parent, if you invite them. | CHG (review A1; the founder's words from `story.private.v2`, #181) |
| `pending.*` | Share again / Cancel invite / Cancel this invite? / The link will stop working. / Keep it / Invite cancelled. | KEEP |
| `left.note` | {signsAs} has left {child}'s book. | KEEP (on `feat/coparent-alpha`; once, neutral, F11-REQ-023) |
| `familyTab.emptyTitle`, `emptyBody`, `inviteNeedsSignIn` | (not shown) | RET, in `strings.en.ts` (P0): "Letters are lovelier with more voices." sells, and sign-in now exists |
| `tabs.tonight`, `tabs.book`, `tabs.family` | Tonight / Book / Family | NEW, in `strings.en.ts` (P0). Today the tab titles are typed in `(tabs)/_layout.tsx`: the one user-facing word outside `packages/content` this pass found. |

Visual: lamp scene `family` (top, gold core, amber tail, 0.4, still) with `persistKey="tabs"`. The dateline as on Tonight ("ASHA · 7 MONTHS"), then the title in `title1` (Literata Medium 28/34). The people are signatures, not accounts: each row is "From Mama" in `signature` (Literata Italic 17) with "You" or "Co-parent" in `footnote` `textMuted` under it; no avatar, no initials, no email address. A pending invite is the same row with "Your co-parent" in `textMuted` italic and "Invited, open until October 23" under it, then "Share again" (ShareNetwork 20 pt) and "Cancel invite" (X 20 pt) as quiet buttons. One parent: under the list, the invite card (`surfaceRaised`, `radius.md`, elevation 1, 16 pt padding) with the small closed cover at its right, the title in `headline`, the body, "Invite a co-parent" bordered with UserPlus 20 pt, and the privacy line with LockSimple. Two parents: no card; at the very bottom a quiet row, "Leave {child}'s book" (S60). Server features off: the coming-soon presentation, unchanged.

Motion: a tab switch swaps content natively and the lamp settles from the last tab's tone (5.8). The first time this phone shows the co-parent's row, it enters with `enter` and the 1.6 s `accentSoft` wash, once. Cancel invite collapses the row (`exitMs`, `LinearTransition` `standard`) and shows "Invite cancelled.". `left.note` fades in once (200 ms) above the list and stays until dismissed.

States: signed out (the card's button opens S52 with `invite_create`); consent missing; one parent; an invite open (one at a time); two parents; the other parent left; offline (a tap shows the network line under the card); the kill path.

Acceptance:
- [ ] Nothing is counted, and never more than two parents are shown (D-069).
- [ ] People appear as their signatures; no email address or avatar for anyone.
- [ ] The privacy line reads "Shared only with the other parent, if you invite them."
- [ ] Coming to this tab never re-arrives the lamp; Increase Contrast shows plain paper.
- [ ] The three tab titles come from `packages/content`.

#### S58 Invite a co-parent
Steps J21-21, J21-22, J21-23, J21-30, J22-90, J22-91 (J22-90 and J22-91 are the sheet's gate text). Package P8b. Logic: **S04** (`createCoParentInvite`, `shareInviteLink`, device-made invite ids WP-F11-01), S02 (invite rows, the 7-day expiry, the cap), S07 (the link `/j#t=TOKEN`, #165).

| Key | After | Mark |
|---|---|---|
| `create.title`, `body`, `signsAsLabel`, `signsAsPlaceholder`, `signsAsHelp`, `oneBook`, `linkNote`, `share`, `working` | as today | KEEP |
| `create.shareTitle`, `shareMessage`, `shareMessageNamed` | as today | KEEP (the person sees the message in the share sheet and can change it before sending) |
| `create.done` | The invite waits on the Family tab until they join. | CHG ("Invite ready." added nothing) |
| `create.full` | {child}'s book has two parents. | KEEP (on `feat/coparent-alpha`) |
| `errors.not_found` | That link does not open an invite. Check it and try again. | CHG (no "we couldn't", and not passive) |
| `errors.network` | This phone is offline. Try again once it is back online. | CHG |
| `errors.unknown`, `errors.retry_new_invite` | That did not work this time. Try again. | CHG |
| other `errors.*` | as today | KEEP |

Visual: a sheet at the large detent. The book cover (132 x 176, closed, the child's name) centred at the top: the invite is into this book. The title in `title2`, the body in `body` `textMuted`. The signature field in the letter face (Literata 22 pt) with S06's chips under it, so the cover's foot line reads "From Papa" as it is typed. `oneBook` and `linkNote` in `footnote`. "Share invite link" opens the iOS share sheet. No contact picker.

Motion: the foot line cross-fades after each 300 ms typing pause (200 ms), as S05. When the share sheet closes, this sheet dismisses; the Family tab's pending row enters with `enter` and `create.done` shows as a toast.

States: getting the link; two parents already (`full`, no Share); consent missing (the gate, S56); signed out (S52 first); rate limited; not a parent; offline.

Acceptance:
- [ ] The link carries no child name (BL-348, #165) and works once for 7 days.
- [ ] The app sends nothing itself; the person sends the link from the share sheet.

#### S59 Joining a book
The welcome's "I was invited" (S03) or an invite link opens it. Steps J21-01, J21-02, J21-03, J21-04, J21-05, J21-06, J21-07, J21-08, J21-10 (J21i and J21j, the quiet wait while sync runs and its end, record no step). Package P8b. Logic: **S04** (`join-flow.logic.ts`: views `paste`, `signIn`, `peeking`, `ask`, `account`, `joining`, `joined`, `failed`; `pending-invite.ts`), **S01** (`+native-intent.tsx` keeps the token; sign-in from here), S02 (`peek_invite` returns the inviter's sign-off only; `accept_child_invite`), **S03** (pulling the book to this phone).

Problem: the second parent's arrival, their "The book is open.", is a plain sheet that says "Your letters and your co-parent's will be together in one book."

| Key | After | Mark |
|---|---|---|
| `accept.title` | Join a book | CHG (the paste view) |
| `accept.pasteLabel`, `pasteHelp`, `pastePlaceholder`, `continue`, `notRecognised` | as today | KEEP (only what the person pastes is read, A-REQ-029) |
| `accept.invitedTitle` | You were invited to a book | KEEP (on `feat/coparent-alpha`) |
| `accept.signInBody` | You each write from your own phone, in the same book. | CHG (S52's `invite` body) |
| `accept.peeking` | Opening the invite | NEW (the busy line while `peek_invite` runs) |
| `accept.askTitle`, `invitedBy`, `invitedByUnknown`, `askBody`, `join`, `notNow` | Join this book as a parent? / Invited by {inviter} / You were invited to write a book together. / You will both read every letter in the book. Join only if you know who sent you this link. / Join the book / Not now | KEEP (on `feat/coparent-alpha`; `askBody` is the safety line) |
| `accept.needsSync` | To join, turn on sync and sharing in Settings, Privacy. | CHG (one instruction) |
| `accept.signIn`, `joining` | as today | KEEP |
| `accept.signsAsLabel`, `signsAsHelp`, `signsAsPlaceholder` | What does {child} call you? / It signs your letters in this book. / Mama, Papa, Amma, Baba | KEEP (on `feat/coparent-alpha`) |
| `accept.joinedTitle`, `joinedWaiting`, `open`, `close`, `tryAgain` | You're in {child}'s book / {child}'s book is on its way to this phone. / Open the book / Close / Try again | KEEP |
| `accept.joinedBody` | Your letters and {inviter}'s sit side by side, each signed. | CHG (the flyleaf, in words) |
| `accept.joinedBodyUnknown` | Your letters and theirs sit side by side, each signed. | NEW (no sign-off from the inviter) |
| `errors.not_found`, `network`, `unknown` | as S58 | CHG |
| other `errors.*` | as today | KEEP |

Visual: a sheet at the large detent; no lamp inside it. Paste: the title, the field, its help, Continue. Signed out: `invitedTitle` in `title2`, `signInBody`, "Sign in" and "Not now"; no cover and no names, because nothing is known. Ask: the title, then the inviter's sign-off set as a letter's signature, "Invited by Mama" in `signature` italic, then `askBody` in `footnote` `textMuted`, "Join the book" and "Not now"; still no child name. Signature: the field in the letter face, prefilled with the inviter's suggestion, with S06's chips. Joined: the book cover (132 x 176) appears for the first time with the child's name and **opens** to the flyleaf, where both signatures sit one above the other ("From Mama", "From Papa") with the hairline between; `joinedTitle` in `title1`, `joinedBody` in `body`; while the book is still coming down, `joinedWaiting` in `footnote` over a thin determinate bar with no count; "Open the book" filled.

Motion: views replace each other with a 200 ms cross-fade, never a push. Joined: the cover fades in (200 ms), holds 300 ms, then opens as on S08 (front cross-fades to the flyleaf with an 8 pt shift on `standard`); `success` once, when the join returns. "Open the book": the sheet dismisses natively, the app opens the Book tab on this book, and the Book's lamp **rises from 0 to 0.6 over `arriveMs` (1200 ms)** with the header settle (5a): the one slow arrival outside first run, because this is the second parent's first evening in the book. Reduce Motion: the cover shown open at once, one 200 ms fade, the lamp at 0.6 at once.

States: no link; a link not recognised; signed out; peeking; ask; consent or sync missing (the gate after "Join the book", S56: "Finish setting up your account first."; and `needsSync`, the line for the server's own `consent_needed` on the join call); joining; joined, book still coming (on a fresh phone Close hands over to the first-run welcome, which says "Asha's book is on its way to this phone." in place of "Begin the book", so the person is not left at a door that starts a second book; after 30 seconds, or when sync cannot bring the book (it is not running on this phone, or it cannot reach the server), it says "Asha's book has not reached this phone yet.", offers Try again while a sync can run, and "Begin the book" returns; when the child's name could not be read the lines say "The book"; once the book is here the welcome hands over to the Book; the P8b critics' pass S2, as built in #375); joined and ready; each final error (expired, used, cancelled, not found, already a member, two parents) with "Close"; offline with "Try again" (the token is kept); the kill path (`InviteComingSoon`, nothing kept).

Acceptance:
- [ ] Before sign-in, neither the child's name nor the inviter is shown (BL-322).
- [ ] Nothing joins until "Join the book"; the open book changes only on "Open the book".
- [ ] The child's name first appears on the opening cover.
- [ ] "Open the book" lands on the Book with the light rising once.

#### S60 Leave the book
No journey step. Package P8b. Logic: **S04** (`invite/leave.tsx` and its flow on `feat/coparent-alpha`; F11-REQ-011, -027, -028), S02 (the leave call; `last_parent`, DATA-REQ-016).

Copy: every `leave.*` key KEEP as on `feat/coparent-alpha` ("Leave {child}'s book?", "Leave my letters in the book" with "Anyone {coParent} invites later can read letters you leave in the book.", "Take my letters out of the book" with "Your letters stay yours. You can read, export and delete them on this phone.", "Letters already on {coParent}'s phone or in an export can't be taken back.", "Leave the book", "Stay", "Leaving the book", "You left {child}'s book. Your own letters are still on this phone."); `errors.last_parent` KEEP.

Visual: a sheet. The title in `title2`. The two choices as two equal cards in a radio group (`surfaceRaised`, 1 pt `controlBorder`; selected: `accentSoft` fill, 1.5 pt `accent` border, a check), each with its help line; nothing selected on arrival (R4 PT-14). `cantTakeBack` in `footnote` under them. "Leave the book" in the quiet destructive style, in the outline style until a choice is made; "Stay" is the default and closes.

Motion: `selection` on a choice; `warning` once on Leave; the sheet closes and the Family tab shows `leave.done` as a toast.

Acceptance:
- [ ] Nothing is preselected, and Leave stays disabled until a choice.
- [ ] The only parent of a book sees `last_parent` and no Leave.

#### S61 Back up my recordings
No journey step yet; P8c adds `j23-backup.flow.ts`. Package P8c. Logic: **S05** (`lib/backup/**` on #150: `gate.ts`, `runtime.ts`, `queue.ts`; `modules/scribe-keys`; the `backup` consent act before any upload, F08-REQ-039), **S01** (sign-in), S07 (kill switches `backupUploads`, `escrow`).

Problem: a correct screen with a form's feel: the turn-on words sit as a heading and a paragraph with a full-width button in the middle of a list, the state line is its own row and looks tappable, and "Use mobile data" is UK English.

Copy (`backupCopy`, `packages/content/src/features/backup.en.ts`; marks against #150 at `c8b564f`):

| Key | After | Mark |
|---|---|---|
| `title`, `rowOn`, `rowOff`, `sheetTitle`, `turnOnButton`, `signInFirst` | Back up my recordings / On / Off / Back up your recordings / Back up my recordings / Sign in to back up your recordings. | KEEP |
| `sheetBody` | Your recordings are encrypted on this phone before they leave it. We keep a recovery key so you can get them back on a new phone. We use it only through our recovery service, which logs every use and emails you each time. We never listen to your recordings, sell them or use them to train models. | KEEP verbatim: the disclosure D-102 requires; counsel approves it (C7) |
| `sheetNotIncluded` | Other family members can't hear your recordings yet. Listening copies stay on this phone. | KEEP verbatim; C7 proposes dropping "yet". True (listening copies are never uploaded), so it is one of the three keys P8's test allows to say "stay on this phone" (section 6). |
| `sheetReturning`, `turnOnFailed` | Your backed-up recordings come back to this phone on their own. Turn on backup here to back up new ones too. / Backup didn't turn on. Check your connection and try again. | KEEP (#150: the off card on a new phone; the line under the button when the consent act did not reach the server) |
| `sheetFree` | Free for everyone, with or without Plus. | NEW, **held until the founder confirms D-104 item 2** (proposed, not decided; F10): the key may exist, and P8c shows it only after the confirmation. The Plus checks in `rules.test.ts` scan billing and store copy, not this file, and Plus copy never mentions backup. |
| `unavailable` | Backup is not available on this phone right now. Your recordings are kept here as always. | CHG ("not ready ... yet") |
| `lastBackedUp`, `backingUp`, `needsConsent`, `signInAgain` | Backed up {date} / Backing up / Backup is off. Turn it on again to keep backing up new recordings. / Sign in again to keep backing up your recordings. | KEEP |
| `waitingKey` | New recordings back up from {date}. We emailed you to check it's you. | KEEP verbatim (#150; disclosure, counsel, C7): this phone waits for its key from the recovery service |
| `keyStopped` | This phone is not backing up new recordings. | CHG (was "Backing up from this phone was stopped.": passive, review B re-review 5) |
| `someKeptHere` | Some recordings stay on this phone and are not in the backup. | KEEP (#150; true: a recording changed after it was made, too long, or in a book that is not yours is never sent). One of the three keys P8's test allows to say "stay on this phone". |
| `waitingWifi` | Waiting for Wi-Fi | CHG (a state, not a rule) |
| `paused` | Backup carries on later. | CHG |
| `quotaReached` | New recordings are not being backed up. | CHG: #150 puts `writeToUs` ("Write to us", KEEP) beside it as its action, so the line no longer says it twice |
| `cellularTitle` | Use cellular data | CHG (US, principle 10) |
| `cellularHelp`, `offButton`, `offTitle`, `offBody`, `offKeep`, `keepOn` | as on #150 | KEEP |

Visual: an iOS Settings page, no lamp. **Off**, signed in: one card on paper (`surfaceRaised`, `radius.lg`, 20 pt padding): a 72 pt `accentSoft` circle with Phosphor Microphone (Light, 40 pt), `sheetTitle` in `title2`, `sheetBody` in `body`, `sheetNotIncluded` in `footnote` `textMuted`, "Back up my recordings" full width, then, once the founder has confirmed D-104 item 2, `sheetFree` in `footnote`, centred. **On**: a grouped list. The first row "Back up my recordings" with "On" and the state as its subtitle, not a row of its own (`lastBackedUp`; `backingUp` with a small spinner; `waitingWifi`; `paused`; `waitingKey`; `keyStopped`; `signInAgain` with "Sign in"; `quotaReached` with WarningCircle in `caution` and "Write to us"). `someKeptHere`, when it applies, is the section's footer. Then "Use cellular data" with `cellularHelp` as the footer. Then "Turn off backup" in `text` with a chevron, which opens the native alert (`offTitle`, `offBody`, `keepOn` as the default, `offKeep`). A restore in progress, or a request from a new phone (S62), is the first section.

Motion: turning on records the consent act first; on success the card folds into the On rows (`LinearTransition` `standard`, 280 ms) with `tap`; on failure the card stays, its button is enabled again, and `turnOnFailed` shows under it. Reduce Motion: a 200 ms cross-fade.

States: signed out (`signInFirst` and "Sign in", opening S52 with `settings`); unavailable (the Settings row is hidden and this route goes back, as #150 does); off; on, with each state line; consent withdrawn; a restore in progress; a request waiting.

Acceptance:
- [ ] Nothing is encrypted or uploaded before the consent act reaches the server (F08-REQ-039).
- [ ] No count of what is left, no percentage, no "only you", "only your family's keys" or "end-to-end" (#150's `apps/mobile/test/backup-copy.test.ts` stays green).
- [ ] The recovery key is named on the off card, word for word.
- [ ] "Free for everyone, with or without Plus." shows on the off card only after the founder confirms D-104 item 2; no Plus line mentions backup either way.

#### S62 Restore on a new phone
No journey step yet (j23; the device drill is WP-F08-B6). Package P8c. Logic: **S05** (`lib/backup/restore.ts` on #150: list, download, check, decrypt, place; `restore_requests` with the 72 h hold when an enrolled phone exists and 24 h when none; D-108's 7-day enrolment; the foreground check for a waiting request), **S01** (the `new-device-sign-in` email before any recovery-key use; Not me signs out every session), S07 (`push-send`: a time-sensitive push with no ids, F11-REQ-029), **S03** (the words of every letter arrive first, through sync).

Two phones see this. On the new phone, after sign-in, every letter's words arrive at once and the recordings follow. The old phone, if enrolled and seen in the last 90 days, is asked to say yes.

| Key | After | Mark |
|---|---|---|
| `restoreLooking` | Bringing your recordings to this phone. | KEEP (#150) |
| `restoreWaiting` | Your recordings will start coming back by {date}. We emailed you to check it's you. If you still have your old iPhone, open the app there to say yes sooner. | CHG: #150 at `c8b564f` holds the first two sentences, and the third returns with the approval sheet (S62, P8c). Counsel, C7. |
| `restoreUnavailable` | Your recordings will come back soon. This phone keeps trying. | CHG (was "... when we can reach them.", which sounds as if they are lost; `restore.ts` returns this state for a retryable error and the next pass retries) |
| `restoreStopped` | Your recordings did not come to this phone. | CHG (was passive; "Try again" sits under it) |
| `restoreSignInAgain`, `restoreTryAgain` | as on #150 | KEEP |
| `restoreDone` | Your recordings are back on this phone. | NEW (one toast, with `success`) |
| `recordingOnItsWay` | Your recording is on its way to this phone. | NEW (the letter page, S27) |
| `approveTitle` | A new iPhone asked for your recordings | NEW. Not F08 6.7's draft "Is this your new iPhone?": the sheet shows on the old phone, where "this" is the phone in the person's hand, so the draft steered toward the wrong yes (review B, re-review 1). F08 6.7 changes the same way (request to S05 and the PM lane). |
| `approveBody` | Is it yours? Only say yes if you just signed in on a new iPhone. | NEW (same reason; never "this" for the other phone) |
| `approveButton`, `notMeButton` | Yes, it's mine / Not me | NEW (F08 6.7; "it" is the new iPhone the title names) |
| `approveWhen` | Asked {date}. | NEW (the day and time of the request) |
| `notMeDone` | That request is stopped, and every phone is signed out. Sign in again on this one. | NEW ("this one" is the phone in hand, which is right here) (Not me cancels the request and signs out every session, F08 6.5 C) |
| `pendingTitle`, `pendingStop` | A new iPhone is waiting for your recordings / Stop this request | NEW (F08 6.7; Back up my recordings on any signed-in phone) |
| `approvePush` | A new iPhone asked for your recordings. | NEW (the push: one line, no ids; lock-screen wording is S14's with counsel) |

Visual, the new phone: on the Book, `components/backup/restore-line.tsx` (P8's; P5 places it above the first opener): Microphone 16 pt, `restoreLooking` or `restoreWaiting` in `footnote` `textMuted`, and under it a 2 pt determinate line in `accent` at 40 percent, the same hairline as Read together's position line; no count, no percentage. It fades out (200 ms) when the restore is done, and `restoreDone` shows once. A letter whose recording is still coming shows `recordingOnItsWay` in place of the player (S27). Back up my recordings shows the same line as its first section, with "Try again" when stopped.

Visual, the old phone: a sheet at the medium detent over whatever is open, on the next foreground or from the push. Phosphor DeviceMobile (Light, 40 pt) in a 72 pt `accentSoft` circle, `approveTitle` in `title2`, `approveBody` in `body`, `approveWhen` in `footnote` `textMuted`, then two equal pills side by side (stacked at accessibility sizes): "Yes, it's mine" filled, "Not me" bordered. Stopping must be as easy as agreeing, so neither is small or hidden. No countdown. Any signed-in phone lists a waiting request first on Back up my recordings, with "Stop this request".

Motion: a native sheet. "Not me" plays `warning` once and lands on the signed-out Account page with `notMeDone`; "Yes, it's mine" plays none. The restore line's bar moves with real progress only.

States, new phone: looking (iCloud Keychain may bring the key, with no hold); waiting for the hold, with the time; unavailable (kill switch, outage, a limit); stopped; sign in again; done. Old phone: a request waiting; approved; stopped from the email (no sheet); enrolled for under 7 days (no sheet, D-108).

Acceptance:
- [ ] Every letter's words are readable on the new phone before any recording comes back.
- [ ] No screen counts recordings, shows a percentage or names an id.
- [ ] "Not me" is the same size as "Yes, it's mine", and after it every phone is signed out.
- [ ] The approval sheet names the other phone as "a new iPhone" and never as "this" phone.
- [ ] A recording still coming says so on its letter page and never shows a broken player.

#### S63 Erase across devices
No journey step for the synced case (J10-12 to J10-15, the shelf on one phone, are in S38 and S39). Package: the screens are P5's (`settings/recently-deleted.tsx`, `components/book/confirm-sheet.tsx`, `letter/[id].tsx`, `(tabs)/book.tsx`), built on P8's request; P8 owns no file for this entry. Logic: **S03** (WP-F16-13 client: the erase op through `lib/sync/outbox.ts` and the sync branch of `store.eraseEntry`, which returns false today), S02 (WP-F16-13 server part with WP-F17-10: the server purges the row at once rather than at day 30), **S05** with S07 (F08-REQ-024: the backup object at its exact `audio_blobs.object_path`, through WP-F08-B3p's purge steps), S14 (F17-REQ-025: no Erase now in a sync build until the server erase ships).

A person can erase only their own letters, from Recently deleted (D-085; others' letters never appear there).

| Where | What happens | What the person sees |
|---|---|---|
| This phone | The recording and its listening copy go, then the row (D-085, unchanged); the erase op is queued | S39's sheet "The letter and its recording are erased for good.", then "Letter erased." |
| Our servers | The op purges the letter row at once and, with backup on, the backup object at its exact path, within the DELETION_AND_EXPORT_SPEC window (F16-REQ-024, F08-REQ-024) | Nothing more |
| The author's other phone | The shelf card leaves on its next pull; an open letter page there shows S37 "This letter is not in the book" with "Back to the book" and no Recently deleted line | No toast: nobody tapped anything there |
| The other parent's phone | Nothing changes: the letter left their book when it was deleted (S36) | Nothing |
| Offline | This phone erases at once; the op waits in the outbox and the server follows when it is online | The same sheet and toast. "For good" holds: nobody can restore it once confirmed. |

Until WP-F16-13 merges, a build with sync on hides Erase now (F17-REQ-025) and each shelf card shows only its date line ("Deleted October 13. Kept here until November 12.", from the server's `deleted_at` plus 30 days); the letter goes at the server purge. That is the honest state, not a broken button.

Copy: no new keys. `settings.delete.eraseNowBody` and `erasedToast` as S39 and S38 (#181's words), `settings.delete.erasesOn` "Kept here until {date}", `reader.notFoundTitle` as S37.

Acceptance:
- [ ] In a sync build without WP-F16-13 there is no Erase now button, and the date line comes from the server.
- [ ] After Erase now the letter does not come back on this phone, on the author's other phone after its next pull, or after a reinstall and sign-in (F16-REQ-024).
- [ ] With backup on, the backup object is gone within the window (F08-REQ-024).
- [ ] No toast shows on a phone where nobody tapped Erase now.

#### S64 Delete account
No journey step (no web flow reaches it). Package P8c. Logic: **S14** (`lib/account-deletion/**`: the two steps, the 30-day window, cancel), **S01** (the session, signing out of this phone), S02 and S07 (the purge across every system in F17 section 8.4: `prepare_account_purge`, the purge worker), **S05** (backup objects and keys in that purge), S06 (the Apple billing notice).

Problem: it promises to remove "photos", which v1.0 never makes; the export line lists photos; two lines say "we"; the errors put the failure before the reassurance.

Copy (`accountDeletionCopy`, `packages/content/src/features/account-deletion.en.ts`):

| Key | After | Mark |
|---|---|---|
| `title`, `what.heading` | Delete account / What happens | KEEP |
| `what.intro` | Deleting your account removes your letters, recordings, books and recording backup from our servers. You have 30 days to change your mind. | CHG (no photos in v1.0; names the backup, review A2) |
| `what.staysNone`, `staysOne`, `staysMany`, `deletedNone`, `deletedOne`, `deletedMany`, `noBooks`, `coParentFallback` | as today | KEEP (each book's outcome; the count is of the person's own letters, never a gap) |
| `what.deletedFamily`, `what.contributor` | as today | KEEP, never shown in v1.0: S14's `lib/account-deletion/logic.ts` adds them only when a book has family contributors, who come in v1.1 (D-055) |
| `what.copies` | A copy you exported stays wherever you saved it. | CHG ("recordings family already played" cannot happen: family listening is not in v1.0) |
| `exportFirst.heading`, `exportFirst.button` | Keep a copy first / Export everything | KEEP |
| `exportFirst.body` | Export everything, free: the book as a PDF, your letters as text and your recordings. | CHG (no photos) |
| `subscription.*`, `continueButton`, `confirm.*` | as today | KEEP ("Type delete to confirm" stays: the one irreversible act in the app) |
| `scheduled.emailNote` | A confirmation is on its way to your email. | CHG (no "we sent"; a receipt is for a purchase) |
| other `scheduled.*`, `executing`, `signedOut.*` | as today | KEEP |
| `notConfigured` | Accounts are not available right now. Everything stays on this phone, and deleting the app removes it. | CHG (kill path only) |
| `errors.offline` | Nothing has changed. Deleting an account needs a connection. | CHG (reassure first) |
| `errors.failed` | That did not work this time. Nothing has changed. | CHG |

Visual: a pushed Settings page; no lamp, no drawing. Step 1: "What happens" as a plain list on paper, one line per book with BookOpen 20 pt, then `copies`; "Keep a copy first" as a card with FileText and "Export everything" bordered; the subscription card with CreditCard only when Plus renews; "Continue" at the bottom. Step 2: `confirm.heading` in `title2`, its body with the date, the typed field, "Delete account" in the destructive filled style, enabled only when "delete" is typed, and "Keep my account" as the quiet default. Scheduled: the date in `title2`, "Cancel deletion" bordered, "Sign out of this phone".

Motion: the steps push natively; the final confirm plays `warning` once.

States: signed out; the kill path; step 1 (with or without a co-parent, with or without Plus); step 2; scheduled; executing; cancelled (toast); offline; failed.

Acceptance:
- [ ] No mention of photos anywhere in the flow.
- [ ] Each book's outcome is named before Continue.
- [ ] Deletion completes in the app with no email or support step (Apple 5.1.1(v)).
- [ ] "Erase everything on this phone" (F17 6.2 F, WP-F17-15, S14) is not built in this pass; when it is, it takes this page's layout and step 1's list.

---

## 5. Visual system additions

### 5.1 Tokens (`packages/design-tokens/src/tokens.ts`, on #99, merged as `d74e860`)

Replace #99's `atmosphere` with the shape below; do not add a second palette. This is a change of shape, not only an addition: #99 has `{ lamp: '#F3C98B', peak: { light: 0.1, dark: 0.16 } }`, so `peak.light` turns from a number into an object per tone. P1 updates every reader of `tokens.atmosphere` in the same PR: `components/ui/lamp.tsx`, `lamp.logic.ts`, `packages/design-tokens/test/atmosphere.test.ts` and `apps/mobile/test/lamp.test.ts` (grep on `develop`; no other file reads it). The older `feat/app-calm-integration` and `feat/app-lamp-wash` branches carry overlapping palettes (`lampGold`, `lampRose`, `lampDusk`); these names replace them, and those branches are retired.

```ts
const atmosphere = {
  /** The website's lamp colours (apps/web Aurora.module.css on main). Decorative only. */
  tone: { amber: '#F3C98B', gold: '#FFE2A8', rose: '#F08C7C', dusk: '#8076E2' },
  /**
   * Peak opacity of each tone at the core of the pool, by scheme, capped by D-110 (WCAG 2.x formula):
   * the reading colours (text, textMuted, accent, focus) keep 4.5:1 everywhere on screen at the peak;
   * the status colours (success, caution, recording, destructive) keep 4.5:1 where text actually
   * sits, and never sit on the gate's or Read together's lit paper. `onLitPaper` records where.
   * Light values as P1 built them (#192, merged as db258b5); v1.0 of this spec capped light mode by
   * `caution` at the core (0.12, 0.24, 0.05, 0.04), which read as plain paper. Dark is unchanged.
   */
  peak: {
    light: { amber: 0.35, gold: 0.78, rose: 0.17, dusk: 0.14 },
    dark: { amber: 0.18, gold: 0.16, rose: 0.24, dusk: 0.3 },
  },
  /**
   * On paper (the light scheme) the dusk is drawn in a warm mauve, the website's dusk and rose half and half:
   * the website's dusk blue mixed into amber over cream read grey. Late night and Read together use it.
   */
  paperTone: { dusk: '#B881AF' },
  /** Which text colours may sit where on lit paper (D-110). */
  onLitPaper: { reading: ['text', 'textMuted', 'accent', 'focus'], status: ['success', 'caution', 'recording', 'destructive'] },
  /**
   * The website's film grain over the pool, so an 8-bit display shows no rings: a 128 px tile drawn at 3 pixels
   * per point (textures/grain.png, 11 KB). On night paper it is drawn at `darkOpacity`: a dither, not a texture.
   */
  grain: { tile: 128, scale: 3, blackMax: 4, whiteMax: 12, seed: 20261016, darkOpacity: 0.18 },
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
    family: { anchor: 'top', core: 'gold', tail: 'amber', intensity: 0.4, breathe: false },
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
| `motion.lamp` | #99's `{ arriveMs: 1200, breathMs: 9000, breathOpacityMin: 0.88 }` plus `dimTo: 0.7`, `leaveMs: 160`, `returnMs: 280` | `dimTo`: "Not much today" lights down (S33). `leaveMs` (equal to `exitMs`): a lit room fades out as an unlit one covers it. `returnMs` (equal to `enter.durationMs`): a lit room comes back, or a tab's light settles to the next tab's (section 5.8). |
| `motion.route` | `{ dissolveMs: 280 }` | The cross-dissolve into and out of Listen, Review and Read together (section 5.8); where the platform ignores a duration, its own cross-dissolve is accepted |

`packages/design-tokens/test/atmosphere.test.ts` (from #99) and `apps/mobile/test/lamp.test.ts` are extended to D-110, over three phone sizes (iPhone 17 Pro, iPhone SE, the Pro Max size): for each scheme, scene and daypart, the reading colours keep 4.5:1 over the whole screen at every tone's peak, and the status colours keep 4.5:1 over the areas where status text is placed (in a room lit from the top, from 70 percent of the height down; never on the gate or Read together); in dark mode every text colour keeps 4.5:1 everywhere; every `scene` and `daypart` names a real tone; `intensity` is between 0 and 1; and `tokens.test.ts` still holds every sequence under 900 ms and the 2 s ceiling. Under Increase Contrast there is no lamp at all (#99's `lampOpacity` returns 0), so the high-contrast tokens need no lamp check.

### 5.2 The lamp

`apps/mobile/src/components/ui/lamp.tsx` (from #99), extended. One `RadialGradient`, drawn once; only a wrapper's opacity moves.

| Prop | Spec |
|---|---|
| `scene` | A key of `tokens.atmosphere.scene`; resolves anchor, tones, intensity and breath. Tonight passes the greeting key for its daypart. |
| `anchor` | `top` (cx 0.5, cy 0, r 0.95), `center` (cx 0.5, cy 0.42, r 0.8), `bottom` (cx 0.5, cy 1.0, r 0.9), as fractions of the screen. |
| Stops | #99's shape: offsets 0, 0.38, 0.66, 1 with opacities 1, 0.45, 0.12, 0. Offset 0 uses the core tone; the others use the tail tone. Each stop's colour opacity is `stop.opacity x peak[scheme][tone] x intensity`. |
| `intensity` | Animated on the wrapper: `withTiming` over `motion.lamp.arriveMs` (1200 ms), M3 easing, when the scene changes. |
| `still` / breathe | When the scene breathes: #99's native CSS-style opacity loop (1 to 0.88 over 4.5 s each way). Paused when the screen is not focused, the app is in the background, or Low Power Mode is on. |
| `persistKey` | A lamp with the same key that was lit earlier in this session mounts at its last intensity and does not arrive again. The gate and onboarding share `firstRun`, so the light never goes out between them. Tonight, the Book and the Family tab share `tabs`: the arriving tab's lamp starts at the tone and intensity the last tab left and eases to its own scene over `returnMs` (280 ms). Only the first lit room after a cold launch arrives over `arriveMs`; the joined parent's first Book (S59) is the one other slow arrival. |
| `useUnlitRoom()` | New hook in `lamp.tsx`. A screen with no lamp that covers a lit one (Listen, Review, Read together, the letter page) calls it while focused. Every mounted lamp then eases to 0 over `leaveMs` (160 ms), and back to its level over `returnMs` when the cover leaves. A sheet or a Settings push does not call it: under a sheet the room keeps its light and only pauses its breath, and a push slides the lit screen away with its light intact. |
| Reduce Motion | No arrival, no breath: the final state, still. |
| Increase Contrast, Reduce Transparency | Nothing (plain paper). |
| Accessibility | `pointerEvents="none"`, hidden from VoiceOver. |

As built, the light scheme draws a larger, round, softer pool on paper (21 eased stops, its core above or beside the text block, the dusk in its paper tone, the grain inside the layer); dark mode keeps #99's ellipse, with its four stops above drawn as one smooth curve through them (a monotone cubic, `lamp.logic.ts`). MOTION 5k is the as-built reference for the geometry.

Where it never appears: Listen, Review, the saved moment, the letter page, the Plus gate sheet and the Plus store screen, Settings (Account, Back up my recordings and Delete account included), every error and state screen, the struggling page, and every utility sheet (pickers, confirms, sign-in, invite, join, leave, the restore approval). Write is the one sheet that is a room, with its own `write` scene. In Read together it appears only as the still dusk pool at night, behind the controls.

D-110 sets where contrast is proven. v1.0 of this spec capped every tone so even `caution` kept 4.5:1 at the pool's core, and light mode read as plain paper in P1's screenshots. Now the reading colours are proven everywhere and the status colours only where text sits, so light mode carries a visible pool of gold and amber while every line stays readable; dark mode, where evenings mostly happen, carries the website's full amber, rose and dusk, unchanged.

### 5.3 Paper texture and grain

The Visual lens proposed `apps/web/public/textures/paper-v1.webp` (34.7 KB) at 4 percent behind the letter in light mode. Rejected for v1.0: #99 measured and recorded why textures are not ported (a decode on every cold start, memory against D-065, and the small pool needs no dithering), and the letter page's strength is plain paper. Revisit only if a device shows banding in the pool. Revisited in P1 (#192, coordinator's screenshot review, 16 Oct): the larger light-mode pool under D-110 showed rings, so P1 ports the website's film grain as one 11 KB paper grain tile (`packages/design-tokens/textures/grain.png`, 128 px drawn at 3 pixels per point, signed specks of a few levels, built deterministically by `src/build-grain.ts` and checked byte for byte). It is drawn inside the lamp's layer, so it comes and goes with the light: on light paper at full strength, and on night paper as a faint grain (`grain.darkOpacity` 0.18, under two levels at its brightest speck: a dither that does not read as texture). The same pass gives the dusk tone its paper colour: on light paper, late night on Tonight and the Read together pool draw the dusk as `paperTone.dusk` (#B881AF, the website's dusk and rose half and half), so they stay dim but warm instead of grey; night paper keeps the website's dusk (#8076E2). The paper texture itself and the vignette are still not ported, and the letter page stays plain paper.

### 5.4 Illustration and assets

| Asset | Where | Source | Licence and duties |
|---|---|---|---|
| Lamp, Window, ReadingLamp line drawings | Window on the 404 (S49); ReadingLamp reserved for empty Read together if the moon is replaced; Lamp reserved (not used on a screen in this pass, see S08) | `apps/web/src/components/drawings/Lamp.tsx`, `Window.tsx`, `ReadingLamp.tsx` on `origin/main`, made in-house (`apps/web/scripts/atmosphere`) | Company-owned, in-house. No attribution. Port to `components/ui/line-art.tsx` with their `STROKES` tables (path, start, end) and lengths measured offline. |
| Moon, Page, Envelope line drawings | Review waiting (S14), end of Read together (S31), state screens | Already in `apps/mobile/src/components/ui/line-art.tsx`; the web Moon's stroke table replaces the app's single path so it can draw on | In-house. No attribution. |
| Book cover | First run (S05, S06, S08), empty Book (S24), Add a child (S47), Export thumbnail (S43), sign-in (S52), Account signed out (S56), the Family tab's invite card (S57), the invite (S58), joining, where it opens to both signatures (S59) | New `components/book/book-cover.tsx`: react-native-svg and `Text`, no image files. 3:4 paper card; the small-cut symbol at its head (registry `logo.symbol.small.*`, 12 to 23 pt, used as a book mark as BRAND_SYSTEM allows on book surfaces); the name in Literata Medium, centred; a flyleaf state with "From {signsAs}" in Literata Italic and one hairline. States: `closed`, `open`. Sizes: 88 x 116, 132 x 176, 160 x 214, 96 x 128 pt. | In-house. The symbol comes from the registry, never a file path. |
| Opening quotation pair | Gate and stop screen (S01, S02) | #99's `quote-pair.tsx`, registry context `app.brand-device` | Brand asset. Decorative; fades only; never moves (registry rule). |
| Stacked lockup | Welcome (S03), Plus store screen (S41) | Registry `logo.lockup.stacked.ink` and `.reversed`: new context `app.welcome` (founder approval), existing `app.paywall` | Brand asset. One logo per screen. |
| Small-cut lockup and icon | Settings, About (S40) | Registry `app.settings.about` | Brand asset. |
| Icons: MicrophoneSlash, WarningCircle, ArrowsClockwise, Moon, LockSimple, Microphone, FileText, BookOpen, Database, Trash; for chapter 7 EnvelopeSimple, UserPlus, ShareNetwork, X, DeviceMobile, CreditCard (most already imported by the family and sign-in screens) | S13, S34, S38, S41, S43, S44, S09, S33, S52 to S64 | Phosphor (`phosphor-react-native` 3.0.6, already a dependency, imported one icon at a time). LICENSE: github.com/phosphor-icons/homepage/blob/master/LICENSE, "MIT License, Copyright (c) 2020 Phosphor Icons" (verified by the visual lens and recorded in DESIGN_LANGUAGE 7) | MIT: keep the notice. Already listed in Settings, Licenses (`licences.en.ts`). No new duty. |
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
| lamp leave / return | to 0 over `leaveMs` (160 ms) when an unlit room covers it; back over `returnMs` (280 ms); a tab's light settles to the next tab's over 280 ms | final state, instant |
| room dissolve | cross-dissolve into and out of Listen, Review and Read together, `motion.route.dissolveMs` (280 ms) | 200 ms cross-fade |
| step in a sheet | the next step cross-fades in place, `fadeMs` (200 ms); no push | the same fade |
| lamp breath | opacity 1 to 0.88 and back, 9 s cycle, only on welcome, finish and Tonight | none |
| strike draw | strokeDashoffset, 400 ms, M3 easing (promise sample) | complete |
| line drawing draw-on | strokeDashoffset per stroke table over 1200 ms (`drawMs`), then still | complete |
| empty breath | one element, opacity 0.85 to 1 over 8 s, only while focused | none |
| put back | out 120 ms, in 160 ms, reflow on `standard`, 1.6 s `accentSoft` wash | 200 ms fades, static wash then fade |
| file into month | MOTION 5e with `motion.file` | chip and line fade, dismiss |
| card to page | MOTION 5f: the Book under the page's paper veil over 160 ms while the card holds 136 ms, then the paper grows on `standard`, radius md to 0, carrying the card's words; back, the veil lifts over 280 ms; no dim | one 200 ms hand-off each way: the leaving screen fades over the first 140 ms, the arriving one over the last 120 ms from 80 ms, straight lines (done 224 to 240 ms after the tap, measured) |
| page turn | out 24 pt left with 160 ms fade; in from 24 pt right on `standard`; follows a swipe | 200 ms cross-fade |
| row collapse | height to 0 and fade, 160 ms, `LinearTransition` `standard` | fade |
| cover open | front holds 300 ms, then cross-fades to the flyleaf with an 8 pt shift on `standard` (S08, and S59 for the second parent) | open state at once |

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

D-065: App Store download under 40 MB; JS assets sub-budget 3 MB, 1.4 MB used (`docs/ops/APP_SIZE.md`). This pass adds no fonts and no native code, and one image: P1's 11 KB paper grain tile, drawn on light paper and faintly on night paper (5.3). The dusk paper tone (#B881AF) is a token, with no asset. The three ported drawings are about 7 KB of path source (the website's eight total about 19 KB). The book cover, the lamp extensions, the page turn and the card transition are code. New Phosphor glyphs are a few KB each, imported one at a time. Estimated total: under 0.1 MB of JS. The app still ships no photographs; nothing may import `apps/mobile/assets/photos` (that folder is not bundled because nothing requires it, and it must stay that way). P1 states the measured bundle delta in its PR (#192, as reviewer C re-measured: assets +11,493 B, the grain; bytecode +30,796 B; gzip +15,251 B).

### 5.8 Transitions after first run

First run is one lit room (chapter 1). After it, the app is a small house: three rooms you walk between (Tonight, the Book, the Family tab), two rooms you step into where the lights change (Listen and Read together), two pages you hold (Review, full screen, and Write, a sheet), a drawer (Settings) and small asks that sit over a room (sheets). Review B4 found that the light would cut at every one of these doors. These rules close that, using only the tokens in 5.1.

1. **The lamp never cuts.** A lit room covered by an unlit one fades its lamp to 0 over `motion.lamp.leaveMs` (160 ms) as the cover presents, and back over `returnMs` (280 ms) when it leaves (`useUnlitRoom()`, 5.2). Only the first lit room after a cold launch arrives over `arriveMs` (1200 ms); every later entry within the session is a return, except Read together's dusk pool and the second parent's first Book (rows 8 and 12).
2. **Content never re-enters on a return.** Tonight's stagger plays on a cold launch only; the Book's header settles once per session; a return from Listen, Review, a letter or Settings, and a tab switch, move no content.
3. **Controls are there from the first frame** of every transition (MOTION principle 2): Speak, Type, the red circle, Finish, Add to the book, Next letter, every sheet's primary.
4. **Native first.** Tabs swap with no animation and no haptic (MOTION 5i, 6); pushes, sheets and alerts are the platform's. We add opacity on top (the lamp, a dissolve, content entering) and the three custom moves already specified: file into month (5e), card to page (5f) and the page turn.
5. **Short and interruptible.** Every sequence stays under `sequenceMaxMs` (900 ms) except the save-to-Book hand-off below (about 1.2 s, under the 2 s `hardCeilingMs`); a tap lands on the end state at once.
6. **Reduce Motion.** Every custom move becomes one 200 ms fade (`fadeMs`); card to page shapes its 200 ms as a hand-off (row 7: the leaving screen over the first 140 ms, the arriving one over the last 120 ms, so two screens' words never pile up); the lamp jumps to its final level; native pushes and sheets follow the system's own reduced transition; nothing we control slides. Increase Contrast and Reduce Transparency: no lamp anywhere, the same transitions otherwise.

Presentation and animation per route live in one table in `lib/motion.ts` (`routeTransitions`), which `_layout.tsx` reads for its `Stack.Screen` options (P1 owns both; section 6). The rows below are that table.

| # | From, to | Presentation (route option) | What moves | Lamp | Haptic | Reduce Motion |
|---|---|---|---|---|---|---|
| 1 | Tonight to Listen (Speak) | `listen`: `fullScreenModal`, `animation: 'fade'`, `motion.route.dissolveMs` | Speak shows its press (0.97, `snappy`); Listen dissolves in; its audience line and prompt `enter` at 60 ms; the red circle and Finish are opaque from the first frame; the aura starts at rest | Tonight's leaves over 160 ms as the dissolve begins: the lights go down before the room changes | `press` on Speak (record start, MOTION 6) | one 200 ms cross-fade; the lamp off at once |
| 2 | Listen to Tonight (Close, Let it go) | the same dissolve, reversed | Tonight's content does not move | Tonight's returns over 280 ms | `warning` only on a confirmed Let it go | cross-fade; the lamp at its level at once |
| 3 | Listen to Write (Type instead) | Listen dissolves out (200 ms), Write rises as its sheet | the prompt carries over as Write's literary line | Tonight's returns under the sheet as Listen leaves; Write's own `write` scene returns over 280 ms | none | cross-fade, then the sheet |
| 3a | Tonight to Write (Type), and Write closed without keeping | `write`: native sheet (as today) | Write's sheet rises; on close nothing on Tonight moves, and a typed draft's card is already in place | Tonight's holds under the sheet and pauses its breath; Write's own `write` scene returns over 280 ms | `press` on Type (a capture starts) | the system's sheet; both lamps at their level at once |
| 4 | Listen to Review (Finish), and Tonight's "Read it back" card to Review | `review`: `fullScreenModal` (was a page sheet), `animation: 'fade'` | the aura releases (`breath.releaseMs`, 400 ms) as Listen dissolves into Review's waiting card; the moon card `enter`s at 80 ms; a voice room hands to a reading room with no shape change | none on either (from Tonight: Tonight's leaves over 160 ms) | `soft` when the take ends (VOICE, saving) | one 200 ms cross-fade |
| 4a | Review to Tonight without keeping (Close, Read it back later) | the row 4 dissolve, reversed | nothing on Tonight moves; the draft's card is already in place | Tonight's returns over 280 ms | none | one 200 ms cross-fade |
| 5 | Review to the saved moment to the Book (Add to the book, Keep private) | while Review still covers the screen, P4 selects the Book tab on the book the letter was kept in and sets `arrived=<entry id>`; then Review fades out (200 ms) over the Book, so Tonight is never seen between them | MOTION 5e in Review (0 to about 900 ms); the Book is positioned before its first frame with the new card under its opener, then the 1.6 s wash; on the second kept letter, `secondFreeNote` shows as the Book's toast (no action, 4 s); any tap skips to the settled Book | the Book's returns over 280 ms as Review fades | `success` once, at commit | the chip and line fade in (200 ms), Review fades out, the card shows a static wash that then fades |
| 5a | Write to the saved moment to the Book (typed letters skip Review) | the sequence plays inside Write's sheet; the Book tab is selected (and `arrived` set) under the sheet before it dismisses natively onto the Book | as row 5 | as row 5 | `success` at commit | as row 5 |
| 5b | The first kept letter, signed out | after row 5 settles, 600 ms after the Book appears, the sign-in sheet (S52, `first_letter`) rises over the Book, once | the person sees the letter in its month before the ask | the Book's lamp holds under the sheet | none | the sheet as the system presents it |
| 5c | Keep, when the gate opens (S22) | the Plus gate sheet rises over Review; no saved moment | the held letter card `enter`s; "Keep it here for now" closes the sheet and Review, back to Tonight, where the held card `enter`s | Tonight's returns over 280 ms | none | fades |
| 6 | Tab switches (Tonight, Book, Family) | native tab swap, no animation | nothing; the Book's header settle (MOTION 5a) only on its first view this session | `persistKey="tabs"`: the arriving tab's lamp starts at the tone and intensity the last one left and eases to its own over 280 ms (Tonight's daypart light settles to the Book's still 0.6 and the Family tab's 0.4); it never re-arrives | none | the lamp jumps; the swap is unchanged |
| 7 | Book to a letter, and back | measured-rect card to page (MOTION 5f; `presentation: 'transparentModal'`, `animation: 'none'`) in build 3, once the route is flipped to it after the device checks (D4); the platform push in build 2; also from Tonight's "A month ago" card | the Book goes under the page's paper veil over 160 ms while the tapped card holds for 136 ms, keeping its press feedback; then the paper grows to the page, radius `md` to 0, on `standard`, carrying the card's words; no dim (the veil is the dim). Back carries the words into the card if it is visible, and the veil lifts over 280 ms once the paper is within 24 pt of the card; else the 200 ms hand-off | the Book's leaves over 160 ms with the veil (a voice plays on the page) and returns over 280 ms as the veil lifts | none | one 200 ms hand-off each way (#218): the leaving screen (the Book under the veil, or back, the page) fades over the first 140 ms and the arriving one over the last 120 ms, from 80 ms; straight lines; done 224 to 240 ms after the tap (measured on the web build); the lamp jumps |
| 8 | The Book or a letter to Read together, and back | `read-together`: `fullScreenModal`, `animation: 'fade'` | the room dissolves into the chrome-free reader; inside it, the page turn | at night the still dusk pool arrives over `arriveMs` (1200 ms), once per opening: Read together is its own room; it dims as S31 says | none | cross-fade; the pool at its level at once |
| 9 | Tonight, the Book or the Family tab to Settings, and back | native push (the gear in the header); Settings' own pages push | the platform's push | none: the lit screen slides away and back with its light as it was | none | the system's |
| 10 | Any sheet: Whose book, Reading size, Choose a language, Erase this letter, Keep needs Plus, sign-in, invite, join, leave, the restore approval | native sheet (formSheet with detents, or a page sheet), MOTION 5i | sheet content adds no entrance, except the held letter on the Plus gate (rises with `enter`) and the cover opening on Joined (S59); steps inside one sheet cross-fade (200 ms) | the room behind keeps its light and pauses its breath while the sheet is up | per screen (a confirm that cannot be undone: `warning`) | the system's |
| 11 | Toasts and alerts | toasts sit above the tab bar; alerts are native | a toast enters with `enter` and exits with `exit` (160 ms); a new toast cross-fades over the one on screen (150 ms), never stacked | unchanged | as the action | fades |
| 12 | Joined to the Book (the second parent, S59) | the invite sheet dismisses natively; the tabs come forward on the new book | the header settles with the light | **rises from 0 to 0.6 over `arriveMs` (1200 ms)**: the second parent's first arrival | `success` already played on joining | the Book lit at once |
| 13 | The welcome to a returning parent's Book ("I already have a book", S52 `sign_in`, then S55) | when sign-in brings a book to this phone, the sheet dismisses natively and the tabs come forward on the Book, not Tonight (a request to P2: `onboarding.tsx` replaces to the Book instead of `/`). With `consent.noBook.*` the sheet stays on "No book here yet", and "Start a book" closes onto the lit welcome | the header settles (MOTION 5a); the letters that came back, and the restore line (S62), are the first thing seen | the welcome's light eases to the Book's 0.6 over `returnMs`, with no unlit frame | none | the Book lit at once |

Each row's owner builds it in its own files: P1 the table, `_layout.tsx`, `useUnlitRoom()` and `persistKey="tabs"`; P3 rows 1, 2, 3a and 6 on Tonight; P4 rows 1 to 5c in Listen, Review and Write (including the `arrived` param, the Book's selection under the modal and the 5b hand-off); P5 rows 5's arrival, 7 and 8, and the Book side of 12 and 13; P2 row 13's navigation in `onboarding.tsx`; P6 row 9's Settings pages; P8 rows 10 and 12 for chapter 7's sheets and the Family tab.

Acceptance (checked in P7's journey re-run and in each package's flows):
- [ ] No transition shows a frame of unlit paper between two lit rooms, and no lamp re-arrives within a session except rows 8 and 12.
- [ ] Listen to Review is one dissolve with no sheet shape appearing.
- [ ] After a save, the Book is on screen with the new card in view within about 1.2 s, and a tap gets there at once.
- [ ] With Reduce Motion on, every row is one 200 ms fade (row 7's shaped as a hand-off and done within 250 ms of the tap) or the system's own transition, and the lamp never animates.

---

## 6. Build packages

**Every boundary is a file list.** A file belongs to exactly one package at a time, and a package edits only the files listed under it; a new file a package creates is listed with it. When a package needs a change in another package's file, it does not make it: it files a request with the owner (each package lists its "Requests in"), and the owner makes the change in its own PR. Functions, screens and features never define a boundary. A package that reads a file it does not own (a type, a hook, a store function) reads it as it is on `develop`.

**Packages and streams.** These packages are the experience work. The streams in PRD V2 `08-delivery.md` section 3.3 still own their files on the board (`docs/agents/BOARD.md`); where a package edits a stream's file (for example P8b and S04's family screens), the package is built by that stream or with its review, and the PR lists the globs it touched.

**Order.** P0 lands first. #99 is merged (`d74e860`), so P1 builds on `develop`. P2 to P6 and P8 depend on P0 and P1 and are otherwise independent, with the small orderings noted. P7 lands last.

E2E flows in `apps/mobile/e2e-web` assert literal strings and are not run in CI. Each flow file belongs to exactly one package. Between P0 landing and a screen package landing, that screen's flow may assert old words; the owning package updates it, and P7 re-runs the whole journey.

**Files two packages need, and who owns each** (the rest of each list below has one user only):

| File | Owner | Who requests what |
|---|---|---|
| `packages/content/src/strings.en.ts` | P0 (then P7, once P0 has merged) | Every CHG, NEW and RET in section 4 that lives in this file is P0's, including the keys chapter 7 names here (`tabs.*`, the `familyTab` RETs) and the keys for S26, S27, S42 and S46 (`book.fromTwo`, `book.recordingBackedUp`, `settings.recordings.onPhoneBodyBackupOff`, `backedUp*`, `exportFooter`, `children.settings.hideShared`). P8 asks for nothing else in it. |
| `apps/mobile/src/app/_layout.tsx` | P1 (the `Stack.Screen` options only, read from `routeTransitions` in `lib/motion.ts`) | P4 and P5 get the rows in 5.8 from P1's table; P8c asks P1 for the `backup/approve` route (formSheet) and for one line mounting `components/backup/approve-watcher.tsx`. S05's #150 adds `startBackup` to the same file: whichever lands second merges the other. |
| `apps/mobile/src/components/book/book-cover.tsx`, `book-cover.logic.ts` | P1 | P2, P5, P6 and P8 use it unchanged; a new size or state is a request to P1. |
| `apps/mobile/src/components/ui/lamp.tsx` (`useUnlitRoom()`, `persistKey="tabs"`, the `family` scene) | P1 | P3, P4, P5 and P8b call it unchanged. |
| `apps/mobile/src/app/onboarding.tsx` | P2 | P8 asks for the welcome's two doors (S03) to open `/sign-in?trigger=sign_in` and `/invite`, and for a sign-in that brings a book to land on the Book instead of `/` (5.8 row 13). |
| `apps/mobile/src/app/review.tsx`, `write.tsx` | P4 | P4 itself sets `arrived=<entry id>` on the Book route after a save (the contract P5 reads). P8a asks for the first-letter hand-off to S52 after the Book settles (5.8 row 5b), replacing today's `router.replace('/sign-in')`. |
| `apps/mobile/src/app/(tabs)/book.tsx` | P5 | P4 asks P5 to read and clear `arrived` (S26). P8c asks P5 to place `<RestoreLine />` above the first opener (S62). |
| `apps/mobile/src/app/letter/[id].tsx` | P5 | P8c: `backupCopy.recordingOnItsWay` in place of the player while a restore runs; `book.recordingBackedUp` from S05's backup state (S27). |
| `apps/mobile/src/app/settings/recently-deleted.tsx`, `components/book/confirm-sheet.tsx` | P5 | P8: the synced states of S63 (hide Erase now until WP-F16-13; the server date line). |
| `apps/mobile/src/app/settings/index.tsx` | P6 | P8: the Account, Back up my recordings and Delete account rows (S40). #150 already adds the Backup row here, so P6 merges after #150 and S05 reviews P6's edit to this file. |
| `apps/mobile/src/app/settings/children/[id].tsx` | P6 | P8b: the "Write this book together" row (`familyCopy.bookRow.label`, S46). |
| `apps/mobile/src/app/settings/recordings.tsx` | P6 | Reads backup's state from S05's `lib/backup` for the S42 card; asks S05 for a read function if #150's view is not enough. S05 is this file's board owner (`08-delivery.md` 3.3), so S05 reviews P6's edit, and P6 merges after #150. |
| `apps/mobile/src/lib/auth/ui.tsx` | P8a | P8b and P8c use the sheet frame unchanged. |
| `apps/mobile/src/lib/store.ts`, `lib/db/**`, `lib/sync/**` | S03, no package | P3 reads `listDrafts` and `Draft.held` (#182) unchanged; P5 and P8 read sync state. No package edits the local schema. |
| `apps/mobile/src/lib/{auth,family,backup,account-deletion}/**` (except `lib/auth/ui.tsx`) | S01, S04, S05, S14, no package | P8 reads them; logic changes are requests to the stream. |

### P0 Copy (packages/content only), lands first: PR #181

Built as #181 (`feat/experience-p0-copy`, at `de2b916`, plus final notes: `onboarding.child.nameLabelMore`, `children.settings.hideShared` and `licences.libraries` as in section 4). Files: `packages/content/src/strings.en.ts`; `packages/content/src/features/{speech,billing,words,reminders,export,language,licences,packs,player}.en.ts`; `packages/content/src/stories.en.ts`; new `packages/content/test/experience-pass.test.ts`; the pinned strings only in `apps/mobile/test/keep-awake.test.ts` and `apps/mobile/test/shelf-strings.test.ts` (#181 needed them for `npm test`; no other package edits these two tests). Not P0's: `features/{auth,family,backup,account-deletion}.en.ts`, which are P8's.

Rules for this package:
1. Every CHG and NEW string in section 4 that lives in P0's files, exactly as written there, except the 13 held keys, which keep `develop`'s words until their package switches them (below). No other wording changes.
2. **No key is deleted or renamed.** RET keys stay with a `// retired by EXPERIENCE_PASS_2026-10; delete in P7` comment, so screen code that still reads them keeps compiling. `billingCopy.plan.annual` is added beside `plan.yearly`.
3. **Registered disclosure and claims text is not touched**: every key `docs/legal/in-app-disclosures.md` quotes that lives in `packages/content`, as #181's protected map pins them: `settings.about.beta.*`; `review.firstNote.*`, `settings.help.mistakes` and its title; `billingCopy.store` features, promise, renewal, cancel and family; every `billingCopy.plan.*` key on `develop`; `plus.legal.*`; `auth.consent.terms.agreeLine`; `trust.*`; `permissions.microphone`. Also `consentCopy` never-lines and `sensitiveConsent.*`. Proposed improvements to them are in section 7 for counsel; the registered `plan.*` rewordings switch only after counsel (P6).
4. Stories: `story.private.v2` (ids are never reused) as built in #181: headline "Private by default.", line "Shared only with the other parent, if you invite them. Never sold, never used for ads." (the founder's words). Two sentences, so it passes `rules.test.ts` "keeps each reassurance to one or two short sentences", and it says who the letters are shared with without claiming who can read them or where they are stored. It sits in `alternateStories`, not in the packaged deck: the deck requires `order === position` and the fallback test expects four cards, so adding it there would show two privacy cards. `story.private.v1` stays served; which card the server serves is D-066 and a counsel item (C4).
5. Button labels (keys ending in `Button`, `cta`, `action`) are 22 characters or fewer with the Asha fixtures. No new placeholder: only names already in the `rules.test.ts` list.

**#181 is the source of truth for strings.** At `bcf301e` it differed from section 4 in the keys below, where this spec's words are better against VOICE.md or are new in v1.1. **All of them are applied in #181 at `de2b916`, plus final notes** (checked key by key against section 4), so nobody applies them again; the table stays as the record of why. The final notes change three strings to the words section 4 now holds (`nameLabelMore`, `hideShared`, `licences.libraries`).

| Key | #181 at `bcf301e` | Applied at `de2b916` | Why |
|---|---|---|---|
| `tonight.draft.swept` | Kept when the app closed. | Recorded before the app closed. | "Kept" is the Keep step's word, and this card is not kept yet (review B6) |
| `review.waiting.body` | The words follow after the one-time download. | Your words follow once the download is done. | "Your words", the brand's own phrase; "follow after" says the same thing twice |
| `review.emptyTake.body` | The take ended before any sound came in. | The recording ended before any sound came in. | "take" is code vocabulary; the glossary word is recording (B6) |
| `billingCopy.plan.restoreNone` | No Plus found for this Apple Account. | This Apple Account has no Plus to restore. | A plain sentence, not a search result (B6); a new key nothing shows yet, so counsel sees it before P6 does |
| `errors.crash.title` | This screen could not be shown | This page did not open | Says what happened in the person's words, not a system log's (B6); matches "The book could not open"; no full stop |
| `errors.launch.body` | Your letters and recordings are safe on this phone. Nothing has been removed. | Your letters and recordings are safe on this phone. | The second sentence is the padding principle 2 removes (B6); "safe on this phone" stays for `rules.test.ts` |
| `errors.launch.exportNothing` | There are no recordings or files on this phone to export. | This phone has no recordings or files to export. | Shorter, active (VOICE: short sentences) |
| `errors.launch.exportFailed` | The export could not be made, and nothing was changed. Your files are still on this phone. | That export did not work. Your files are still on this phone. | VOICE's own error shape, then where the files are (B6) |
| `book.fromTwo` | (missing) | From {a} and {b} | NEW in v1.1 (S26) |
| `book.recordingBackedUp` | (missing) | Recording kept on this phone and backed up | NEW in v1.1 (S27) |
| `settings.recordings.onPhoneBodyBackupOff` | (missing) | Recordings are kept on this phone and in your iPhone's own backup, if you use one. Our encrypted backup can keep them too, so they come back on a new phone. | NEW in v1.1 (S42) |
| `settings.recordings.backedUpTitle` | (missing) | Kept on this phone and backed up | NEW in v1.1 (S42) |
| `settings.recordings.backedUpBody` | (missing) | Recordings are kept on this phone and in our encrypted backup. We hold a recovery key under strict, logged access, so they can come back on a new phone. We never listen to them, sell them or use them to train models. | NEW in v1.1 (S42); disclosure text with "we" (D-102, C7): `experience-pass.test.ts` lists it with the registered keys as an allowed "we", and nothing shows it before counsel approves it |
| `settings.recordings.exportFooter` | (missing) | Export any time to keep a copy of your own. | NEW in v1.1 (S42) |
| `children.settings.hideShared` | (missing) | Hiding is only for you. {coParent} still sees {child}'s book as before. | NEW in v1.1 (S46); the final-notes wording (review B) |
| `tabs.tonight`, `tabs.book`, `tabs.family` | (missing) | Tonight / Book / Family | NEW in v1.1 (S57): the tab titles move out of `(tabs)/_layout.tsx` |
| `familyTab.emptyTitle`, `familyTab.emptyBody`, `familyTab.inviteNeedsSignIn` | develop's words, unmarked | the `// retired by EXPERIENCE_PASS_2026-10; delete in P7` marker | RET in v1.1 (S57) |

Every other CHG, NEW and RET in section 4 that lives in P0's files is in #181 as written. #181 also marks `readTogether.endOfMonthAlt` RET (it would equal `endOfMonth`), and keeps `billingCopy.plan.restoreNothing` unretired because it is registered; P6 retires it once counsel clears `restoreNone`.

**Held keys.** #181 holds 13 CHG keys at `develop`'s words, each with a "held until Pn" comment, because today's screen would make the new words untrue or broken. The package that changes the screen switches them; its section below lists the keys and the new words. The switch is a one-line change in a P0 file, so it is a request to the content owner (S16, P0's author), who makes it in a PR that the coordinator merges together with the screen package's PR. No preview build then shows new words on an old screen or old words on a new one.

Tests: `npm test` green, including `packages/content/test/rules.test.ts` unchanged. `experience-pass.test.ts`, as #181 built it, pins rules, not words: it holds key lists (changed, added, held, retired) and checks that every key is present, that held and retired keys still exist and every held key names its package, that registered text is word for word, and, on every touched string: no "we" outside the sanctioned promises (plus `settings.recordings.backedUpBody` once added, above); no "tidy", "clean", "correct", "edit" or "improve"; buttons of 22 characters or fewer, raw and with the Asha fixtures; **no full stop at the end of an error or state title** (every `errors.*.title`, `reader.notFoundTitle`, `review.noDraft.title`); plural agreement for twins; no on-device-only claim. Across in-app copy: US spellings, and plans named only "Plus Monthly" or "Plus Annual". At P7 these rules fold into `rules.test.ts`.

Acceptance:
- [ ] Every CHG and NEW in section 4 in P0's files is present, word for word.
- [ ] No key removed; typecheck of `apps/mobile` passes unchanged.
- [ ] No registered text changed (diff check against `in-app-disclosures.md`).

### P1 Shared visual system

Depends on: P0. #99 is merged (`d74e860`).

Files: `packages/design-tokens/src/tokens.ts`; `packages/design-tokens/test/atmosphere.test.ts`, `tokens.test.ts`; `apps/mobile/src/components/ui/lamp.tsx`, `lamp.logic.ts`; `apps/mobile/test/lamp.test.ts`; `apps/mobile/src/components/ui/line-art.tsx`; `apps/mobile/src/components/motion/draw-on.tsx` (stroke tables); new `apps/mobile/src/components/book/book-cover.tsx`, `book-cover.logic.ts`, `apps/mobile/test/book-cover.test.ts`; new `apps/mobile/src/components/motion/page-turn.tsx`, `card-transition.tsx`, `excerpt-fade.tsx`; `apps/mobile/src/components/ui/state-screen.tsx` and `state-screen.logic.ts` (drawing slot, centred block, 20 pt gutters, Phosphor glyph slot); `apps/mobile/src/components/ui/toast.tsx` (a new show() replaces the toast on screen); `apps/mobile/src/components/ui/button.tsx` (disabled outline style); `apps/mobile/src/components/platform/toggle.tsx` (the web preview's thumb colour, S34); `apps/mobile/src/lib/motion.ts` (with `routeTransitions`, 5.8); `apps/mobile/src/app/_layout.tsx` (the `Stack.Screen` options and the one watcher line P8c asks for; no logic, the gate stays the root boot gate); `packages/brand/registry.ts` and `registry.json` (context `app.welcome`, approved: F3, D-109 item 2); `docs/design/MOTION.md` (5k scenes, page turn, file tokens, `breathIdleMs`, 5.8's transitions), `docs/design/DESIGN_LANGUAGE.md` (type tokens, imagery: the book cover), `docs/design/COMPONENTS.md` (BookCover, Lamp scenes, `useUnlitRoom`); `docs/brand/BRAND_SYSTEM.md` section 4 (the amendment approved as F2, D-109 item 1).

Requests in: P8c (the `backup/approve` route options and the watcher line in `_layout.tsx`); any package needing a new BookCover size or state.

Acceptance:
- [ ] Every reader of `tokens.atmosphere` is updated in the same PR (`lamp.tsx`, `lamp.logic.ts`, `atmosphere.test.ts`, `lamp.test.ts`).
- [ ] Contrast follows D-110, proven by tests over three phone sizes (iPhone 17 Pro, iPhone SE, the Pro Max size), both schemes, every scene including `family` and every daypart: the everyday text colours (`text`, `textMuted`, `accent`, `focus`) hold 4.5:1 everywhere on screen at every lamp tone's peak; the status colours (`success`, `caution`, `recording`, `destructive`) hold 4.5:1 where text actually sits (WCAG 1.4.3 measures text against the background behind it), and never sit on the lit paper of the gate or Read together.
- [ ] `Lamp` with `persistKey` mounts lit and does not arrive again; `useUnlitRoom()` fades and returns it over `leaveMs` and `returnMs`; with Reduce Motion it is still; with Increase Contrast it renders nothing (unit tests on the logic).
- [ ] `BookCover` renders a 60-character name in three lines with a fade and never an ellipsis glyph (unit test on the logic).
- [ ] Toast: showing a second toast replaces the first (unit test).
- [ ] `routeTransitions` holds every row of 5.8 that sets a route option; `_layout.tsx` reads it and types no duration.
- [ ] Bundle delta stated in the PR, under 0.1 MB.

### P2 First run and the age question

Depends on: P0, P1.

Files: `apps/mobile/src/components/gate/age-gate-screen.tsx`; `apps/mobile/src/app/onboarding.tsx`; new `apps/mobile/src/components/onboarding/promise-sample.tsx` and `apps/mobile/test/promise-sample.test.ts`; `apps/mobile/src/components/speech/speech-consent-card.tsx`; `apps/mobile/src/components/language/language-picker.tsx`; `apps/mobile/src/components/child/date-field.tsx`; e2e `apps/mobile/e2e-web/j01-first-run.flow.ts`, `j02-under-18.flow.ts`, `smoke.flow.ts`, `support/app.ts` (`passAgeGate` and the first-run helpers).

Not touched: `lib/age-gate.ts` (no logic change on v1.0) and `_layout.tsx` (P1's).

Requests in: P8 (the welcome's two doors and their routes; the returning parent's landing on the Book, 5.8 row 13).

Switches (held in #181; the content owner changes the line, merged with this package): `ageGate.stopTitle` to "{app} is currently for adults 18 and over" (today's stop screen also shows `stopBody`, so the switch lands with the screen that drops it).

Tests: `promise-sample.test.ts` (the sample's fixes come from the engine, pass `verifyEdits`, are exactly one filler and one repeat, and put back to the raw words; #181 checked the engine already returns that); gate tests unchanged and green; j01, j02 and smoke updated to the new words.

Acceptance: every checkbox under S01 to S08.

### P3 Tonight and prompts

Depends on: P0, P1. Reads `Draft.held` once S03's #182 merges (S09).

Files: `apps/mobile/src/app/(tabs)/index.tsx` (where the `[0]` is, line 57); new `apps/mobile/src/components/tonight/draft-card.tsx`, `draft-card.logic.ts`, `apps/mobile/test/draft-card.test.ts`, `resurfaced-card.tsx`, `quiet-day-inline.tsx`; e2e `j04-tonight.flow.ts`, `j08-quiet-day.flow.ts`.

Not touched: `lib/store.ts` (`listDrafts` already returns every draft), `lib/db/**` and `lib/capture/**`.

Switches (held in #181; the content owner changes the lines, merged with this package): `tonight.draftWaiting.title` to "A recording is ready to read back."; `billingCopy.keepGate.heldNote` to "This one waits on this phone, on Tonight, exactly as it is, for as long as you like."; `billingCopy.keepGate.offline` to "Plus needs a connection to start. This one waits on this phone, on Tonight, exactly as it is."; and the new `billingCopy.keepGate.heldNoteSynced`, "This one waits on Tonight, exactly as it is, for as long as you like. It syncs privately with your account.", which P6's Keep sheet shows when signed in. All three follow #163's register 3.1.0 ("Keep step and held letter") and go to counsel (C10). The two Keep gate lines promise what P3 builds (a card for every draft on Tonight), so they switch with P3 even though the Keep sheet itself is P6's.

Tests: `draft-card.logic` maps each draft state to its line and action, and a draft without `held` to the first row (unit); j04 covers two drafts after a relaunch; j08 asserts "A quiet day, kept." and Undo.

Acceptance: every checkbox under S09 and S33, and rows 1, 2, 3a and 6 of 5.8 on Tonight. Rows that use "·" as a separator carry an accessibility label without it ("To Asha, Month 4", "Month 4, from Mama"); VoiceOver never reads the separator. On Tonight that is the dateline ("Asha, 7 months"). When a card opens into a page, VoiceOver focus lands on the page and the list behind cannot be reached. Excerpts keep whole lines at every Dynamic Type size, including the three below the default (xSmall, Small and Medium). On Tonight: the draft cards' first words, and "A month ago" opening its letter.

### P4 Capture and Review

Depends on: P0, P1.

Files: `apps/mobile/src/app/listen.tsx`; `apps/mobile/src/app/review.tsx`; `apps/mobile/src/app/write.tsx`; `apps/mobile/src/components/capture/listening-aura.tsx`, `transcript.tsx`, `review-view.logic.ts`, `review-view.logic.test.ts`; new `apps/mobile/src/components/capture/letter-sheet.tsx`, `saved-moment.tsx`, `mic-state.tsx`; `apps/mobile/src/lib/capture/recorder.ts` (`StopReason`: Review reads it from Listen's params; only P4 may edit this file in this pass, and only if a stop reason is missing); new `apps/mobile/src/lib/capture/free-space.ts` (the 50 MB check before `beginTake`) and `apps/mobile/test/free-space.test.ts`; e2e `j05-voice-capture.flow.ts`, `j06-review.flow.ts`, `j07-typed.flow.ts`.

Not touched: `lib/capture/{erase,probe,sweep,sweep.logic}.ts`.

Requests in: P8a (the first-letter hand-off, 5.8 row 5b). P4 sets the `arrived` param on the Book route itself; P5 reads it.

Switches (held in #181; the content owner changes the lines, merged with this package): `errors.micDenied.title` to "The microphone is off" and `errors.micDenied.body` to "Turn it on in Settings, or type this one.", together with `begin()` telling denied, busy and full apart (S13).

Tests: review-view logic for the header row and the fallback button label; a unit test that a start failure with permission granted maps to "busy", not "denied"; `free-space.test.ts` for the threshold; j06 covers put back, the saved chip and the landing on the Book; j07 covers keeping a typed letter from Write with no Review screen.

Acceptance: every checkbox under S11 to S21 and S23, and rows 1 to 5c of 5.8. Rows that use "·" as a separator carry an accessibility label without it ("To Asha, Month 4", "Month 4, from Mama"); VoiceOver never reads the separator. In Review that is the letter header (`review.headerTo*`). When a card opens into a page, VoiceOver focus lands on the page and the list behind cannot be reached. Excerpts keep whole lines at every Dynamic Type size, including the three below the default (xSmall, Small and Medium). In P4 no card opens into a page; the excerpt rule applies to the saved moment's card while it files into its month.

### P5 Book, letter and Read together

Depends on: P0, P1.

Files: `apps/mobile/src/app/(tabs)/book.tsx`; every file in `apps/mobile/src/components/book/` except P1's `book-cover.tsx` and `book-cover.logic.ts` (that is `letter-card.tsx`, `chapters.ts`, `app-note.tsx`, `quiet-day-row.tsx`, `undo-toast.tsx`, `confirm-sheet.tsx`, `reading-size-sheet.tsx`, `shelf.logic.ts`, `letter-words.logic.ts`, `quiet-day.logic.ts`, `copy.ts` and their tests); `apps/mobile/src/app/letter/[id].tsx`; `apps/mobile/src/app/read-together.tsx`; `apps/mobile/src/components/player/audio-player.tsx`; `apps/mobile/src/components/child/whose-book-sheet.tsx`, `child-switcher.tsx`; `apps/mobile/src/app/settings/recently-deleted.tsx`; e2e `j09-book.flow.ts`, `j10-letter.flow.ts`, `j11-read-together.flow.ts`.

Card to page, P1's contract (#192, merged as `db258b5`): P5 wraps each letter card in `CardSource` (`id`), and the card's dateline and excerpt (an `ExcerptFade`, which draws the fade) in `CardText`, giving `lineHeight` (the line height its body renders at, from `lineHeightFor`) and `rtl` when the excerpt runs right to left. The letter page wraps itself in `CardToPage` with the same `id`, `onClosed` and `opening`, a function `(focus) => ...` that returns the page's dateline and whole letter and attaches `focus` to the dateline, the element VoiceOver lands on once the page has arrived. The page places that opening with `PageOpening` and its `lineHeight`, which must equal the card's for the words to be carried, and closes with `useCardToPageClose()`. The Book spreads `useHiddenBehindCardPage()` on its root, so screen readers cannot reach it under the page. The letter page opens in the card's text column, with the same width, type and gaps, so its first lines wrap exactly as they did on the card and the words travel without reflowing. Without a measured card, without a shared column, or under Reduce Motion, the transition falls back to one 200 ms hand-off each way (#218, 5.8 row 7): the leaving screen (the Book under the page's paper veil, or back, the page) fades over the first 140 ms, and the arriving one fades in over the last 120 ms, from 80 ms, on straight lines, done within 250 ms of the tap. The tapped card holds for 136 ms before the paper grows, and P5's `LetterCard` keeps its press feedback through that hold. The letter route stays a native push in build 2; the flip of `ROUTES['letter/[id]']` to `cardToPage` (one line and its test) ships in build 3, after the device checks (D4) and after the page reads `useCardToPagePhase()` (the P5 critics' pass S2).

Requests in: P4 (`arrived`); P8 (the restore line in the Book, the letter page's backup and restore lines, the synced erase states of S63).

Switches (held in #181; the content owner changes the lines, merged with this package): `readTogether.nowReading` to "Month {month} · From {signsAs}", with the first-weeks and Before You datelines built the same way (S30); `settings.delete.restoredToast` to "Back in {child}'s book.", with `{child}` filled (S38).

Tests: chapters logic (the month range filled as `{a} to {b}`, the current month, newborn and Before You openers, `book.fromTwo` order); shelf logic (the joined date line, no countdown, no Erase now in a sync build without the server erase); j10 covers delete returning to the Book with Undo, and Erase now showing "Letter erased."; j11 covers the page turn's button path and the dateline.

Acceptance: every checkbox under S24 to S32 and S35 to S39, the P5 parts of S62 and S63, and rows 5, 7 and 8 of 5.8. Rows that use "·" as a separator carry an accessibility label without it ("To Asha, Month 4", "Month 4, from Mama"); VoiceOver never reads the separator. In P5 that is the opener's line ("2 letters, from Mama"), the letter cards' datelines and Read together's dateline (`readTogether.nowReading*`). When a card opens into a page, VoiceOver focus lands on the page and the list behind cannot be reached. Excerpts keep whole lines at every Dynamic Type size, including the three below the default (xSmall, Small and Medium). In P5: every letter card opening into its page (`CardToPage`), and every excerpt on the Book and Recently deleted. The letter card keeps its press feedback (cards at 0.98 on `snappy`) through the 136 ms hold before the paper grows.

### P6 Settings, Plus and errors

Depends on: P0, P1; P2 for `date-field.tsx` (Add a child); P4 for the Listen ready state that `j19-errors.flow.ts` also asserts.

Files: `apps/mobile/src/app/settings/index.tsx`, `_layout.tsx`, `plus.tsx`, `reminders.tsx`, `recordings.tsx`, `export.tsx`, `privacy.tsx`, `appearance.tsx`, `storage.tsx`, `language.tsx`, `children/[id].tsx`, `children/new.tsx`; new `apps/mobile/src/app/settings/struggling.tsx` and `licenses.tsx`; `apps/mobile/src/components/child/plus-gate.tsx` (until S06's WP-F14-21 moves it to `components/plus/`; then the moved file is P6's for this pass), `add-child-form.tsx`, `child-editors.tsx`; `apps/mobile/src/components/consent/never-list.tsx`; `apps/mobile/src/app/plus/*`; `apps/mobile/src/app/+not-found.tsx`; `apps/mobile/src/components/resilience/plain-screen.tsx`, `error-boundary.tsx`, `launch-recovery.tsx`; e2e `j03-children.flow.ts`, `j03-child-editing.flow.ts`, `j12-plus.flow.ts`, `j13-reminders.flow.ts`, `j14-recordings.flow.ts`, `j15-export.flow.ts`, `j16-settings.flow.ts`, `j19-errors.flow.ts`, `j20-crash.flow.ts`.

Not touched: `settings/recently-deleted.tsx` (P5), `settings/{account,backup,delete-account}.tsx` and every other P8 file.

Requests in: P8 (the three Settings home rows, the child settings row).

Switches, after counsel has read them (held in #181 as registered text or the registered `billingCopy.plan.*` group; the content owner changes the lines, merged with this package): `billingCopy.plan.monthly` to "Plus Monthly", with the Plan screen moving from `plan.yearly` to `plan.annual` ("Plus Annual") in the same PR; `billingCopy.plan.payment` to "Apple handles the payment. Card details stay with Apple." ("takes" sounds like grabbing); `billingCopy.plan.grace` to "Apple could not take the last payment. Plus stays on while Apple tries again."; `billingCopy.plan.retry` to "Plus is paused until a payment goes through. Every letter you kept is still here."; `billingCopy.plan.restoreFailed` to "The App Store did not answer. Try again in a moment." P6 also starts showing the new `billingCopy.plan.restoreNone` then, and retires `restoreNothing`.

Tests: a unit test that `PlainScreen` styles use `tokens.fontFamily`; j03 asserts Add a child starts with no date; j12 asserts "Plus Monthly" and "Plus Annual" and no duplicated sentence; j14 asserts both Recordings cards; j16 asserts the early-version note only under About, the struggling page, and the Account and Delete account rows with server features on; j20 asserts "This page did not open" and "The book could not open".

Acceptance: every checkbox under S22, S34, S40 to S47 and S49 to S51.

### P8 Server surfaces: sign-in, Account, the Family tab, invite, joining, backup, restore, erase

Depends on: P0 (#181 with this revision), P1 (BookCover, the `family` scene, `useUnlitRoom`, toast, the outline button, `routeTransitions`). The logic it shows is the streams', most of it in open pull requests: S01 (#139), S03 (#146, #182, WP-F16-13), S04 (#148, `feat/coparent-alpha`, #165), S05 (#150, #151), S14 (`lib/account-deletion`). P8's screens may land before their logic behind the existing `capabilities.*` switches, never ahead of the R-17 security gate for anyone outside the family (D-100).

Built as three PRs on disjoint files, so each stream reviews its own surfaces.

**P8a Sign-in and Account** (S52 to S56). Files: `apps/mobile/src/app/(auth)/_layout.tsx`, `(auth)/sign-in/index.tsx`, `email.tsx`, `code.tsx`, `verify.tsx`, `consent.tsx`; `apps/mobile/src/lib/auth/ui.tsx` (presentational only); `apps/mobile/src/app/settings/account.tsx`; `packages/content/src/features/auth.en.ts`; new `packages/content/test/server-surfaces-auth.test.ts`; new e2e `apps/mobile/e2e-web/j22-sign-in.flow.ts`, `support/mock-server.ts` (from `feat/coparent-alpha`, or new if that has not merged) and `support/global-setup.ts`. Logic owners: **S01** for every other file in `lib/auth/**`, `lib/supabase/**`, `+native-intent.tsx`, `supabase/functions/apple-token/**` and `supabase/templates/**`; **S03** for the sync state and the outbox drain on sign-out (`lib/sync/**`); S14 for the sensitive-data screen if it moves to `app/consent/sensitive.tsx` (WP-F02-07).

**P8b The Family tab, invite, joining and leaving** (S57 to S60). Files: `apps/mobile/src/app/(tabs)/family.tsx`; `apps/mobile/src/app/(tabs)/_layout.tsx` (the tab titles from `packages/content`; no transition change, MOTION 5i); `apps/mobile/src/app/invite/_layout.tsx`, `invite/index.tsx`, `invite/new.tsx`, `invite/leave.tsx` (from `feat/coparent-alpha`); `apps/mobile/src/components/family/**` (`coparent-soon.tsx`, `invite-coming-soon.tsx`, `member-row.tsx`, and `join-ask.tsx`, `leave-sheet.tsx` from #148); `packages/content/src/features/family.en.ts`; new `packages/content/test/server-surfaces-family.test.ts`; e2e `j17-family.flow.ts`, `j21-coparent.flow.ts` (from `feat/coparent-alpha`). Logic owners: **S04** for `lib/family/**`, `packages/core/src/{invite,family-rules}.ts` and the push client; **S01** for sign-in from an invite and `+native-intent.tsx`; **S03** for pulling a joined book and members; S02 for `peek_invite`, accept, leave and the two-parent cap; S07 for the family contracts and `invite-redeem`.

**P8c Backup, restore, erase across devices and Delete account** (S61 to S64). Files: `apps/mobile/src/app/settings/backup.tsx` (from #150); new `apps/mobile/src/app/backup/approve.tsx`; new `apps/mobile/src/components/backup/restore-line.tsx`, `approve-watcher.tsx`; `packages/content/src/features/backup.en.ts` (from #150); `apps/mobile/src/app/settings/delete-account.tsx`; `packages/content/src/features/account-deletion.en.ts`; new `packages/content/test/server-surfaces-backup.test.ts`; new e2e `j23-backup.flow.ts`. S63's screens are P5's (requests above). Logic owners: **S05** for `lib/backup/**`, `modules/scribe-keys/**`, `supabase/functions/escrow/**` and the backup migration range; **S03** for the erase op (WP-F16-13 client, `store.eraseEntry`, `lib/sync/outbox.ts`) and text sync on a new phone; **S01** for the new-device email and signing out every session on "Not me"; S14 for `lib/account-deletion/**`; S02 and S07 for the server erase, `purge_due` and the purge worker.

Requests out: P0 (none beyond section 4), P1 (`_layout.tsx` route and watcher line), P2 (the welcome's doors), P4 (the first-letter hand-off), P5 (S62's restore line and letter-page lines, S63's states), P6 (the Settings home rows, the child settings row); to the streams: S01 (`errors` kinds the sheet maps, if any are missing), S04 (the `peeking` busy state and the inviter's sign-off for `joinedBody`), S05 (a read of one recording's backup state for S27, `restoreDone`, the approval request for the watcher), S03 (WP-F16-13 before Erase now shows in a sync build).

RET keys in P8's copy files are deleted in the same P8 PR that stops showing them: every reader of each is a P8 file (checked by grep on `develop`: `code.tsx`, `consent.tsx`, `family.tsx`, `invite/new.tsx`), so P8 leaves none for P7. The `familyTab` RETs live in `strings.en.ts` and are P7's to delete.

Tests: the three `server-surfaces-*.test.ts` assert, over P8's copy files: every CHG and NEW of chapter 7, word for word; no "we" in any of them except the disclosure keys chapter 7 keeps verbatim (S52 `sheet.privacy`, S55 `consent.terms.*`, S61 `sheetBody` and `waitingKey`, S62 `restoreWaiting`) and the kill-path `familyCopy.soon.*`; buttons of 22 characters or fewer; only allowed placeholders; no "photos"; no "only you", "only your family's keys" or "end-to-end"; no "stay on this phone" or "stays on this phone" outside the kill-path keys and the three keys where it is true: `authCopy.account.signOutBody`, `backupCopy.sheetNotIncluded` and `backupCopy.someKeptHere`; US spellings. #150's `backup-copy.test.ts` and S04's `coparent-soon.test.ts` stay green. j21 covers invite, join with the cover opening, and the joined parent landing on the lit Book; j22 covers each entry point of the sign-in sheet and the first-letter hand-off over the Book; j23 covers turning backup on and the restore line (against `support/mock-server.ts`).

Acceptance: every checkbox under S52 to S64, and rows 10 and 12 of 5.8.

### P7 Clean-up and the journey record, lands last

Depends on: P0 to P6 and P8 merged. P7's content files are P0's; because P7 starts only after P0 has merged, they pass from P0 to P7 then and are never shared by two live packages.

Files: P0's content files, `packages/content/src/strings.en.ts`, `stories.en.ts` and `packages/content/src/features/{speech,billing,words,reminders,export,language,licences,packs,player}.en.ts` (delete every key marked "retired by EXPERIENCE_PASS_2026-10" and confirm nothing reads it; P8's copy files are not P7's, P8 cleans its own); `apps/mobile/e2e-web/j18-dark-mode.flow.ts`; the journey record on `chore/journey-refresh` (`npm run e2e:web:journey -w @scribe/mobile`, then `node apps/mobile/e2e-web/support/build-index.mjs`), run with server features on against the mock server so chapter 7 has its steps, with the A-REQ-030 label in INDEX.md corrected to LEGAL-REQ-002 and PRD-REQ-019.

Acceptance:
- [ ] No retired key remains; `npm test` and `npm run typecheck` green.
- [ ] The regenerated journey has one screenshot per step for every journey, including j21 and j22 (there is no j23 flow), and every "after" in this spec can be checked against it.
- [ ] The transitions in 5.8 are checked on the regenerated journey and on one device run (no unlit frame between lit rooms).

---

## 7. What needs the founder, and what needs counsel

### The founder

The coordinator made the calls of this section on 16 Oct under the founder's standing delegation (D-109, #173, on `develop` as `b22876b`); the founder may reverse any of them. They are recorded here so the spec and the decision log say the same thing.

| # | Decision | Status | What it means for the build |
|---|---|---|---|
| F1 | Merge PR #99 (calm brand, lamp, quotation pair) | **Done**: merged as `d74e860` | P1 builds on `develop` and updates every reader of `tokens.atmosphere` (5.1) |
| F2 | Amend BRAND_SYSTEM section 4 "Never: ... a gradient anywhere except the app icon tile" to: "Never: a gradient anywhere except the app icon tile and the atmosphere lamp (`tokens.atmosphere`, `Lamp`), which is decorative, capped for contrast, and never sits inside, behind or around the mark." | **Approved** (D-109 item 1): the founder asked for the website's light and gradients in the app | P1 applies the amended line in `docs/brand/BRAND_SYSTEM.md` |
| F3 | New registry context `app.welcome` (stacked lockup, 96 pt, on the welcome) | **Approved** (D-109 item 2) | P1 adds the context; S03 uses the stacked lockup, not the `app.header` fallback |
| F4 | Amend PRD-REQ-019 so the welcome may come before the age question (2.4) | **Held for counsel's answer to C1** (D-109 item 3) | The gate stays first (2.3); 2.4 stays specified and unbuilt |
| F5 | Owner and date for the Declared Age Range call (2.5) | **Owned by S14 with S17, due before App Store submission**; not needed for TestFlight (D-109 item 4) | Outside this pass; when built, an under-18 result routes to the stop screen (S02) and an adult result does not skip the question unless counsel answers C1 that way |
| F6 | App Store Connect display names | **Plus Monthly and Plus Annual** (D-109 item 5); S06 corrects `docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md` ("Plus Yearly") | In-app "Plus Monthly" and "Plus Annual" ship (S41, P0); the store names match before submission (D-077) |
| F7 | Scope of sign-in, sync, co-parent and backup surfaces | **Answered by option B** (D-100; D-109 item 6): in v1.0, with their own experience package | Chapter 7 and P8; every surface v1.0 of this spec held back is now specified |
| F8 | Typed letters skip Review (S20) | **Approved** (D-109 item 7): typed words are never machine-edited | Ships as specified (P4) |
| F9 | After a letter is kept, the app lands on the Book with that letter in view, in its month (S21, 5.8 row 5), instead of returning to Tonight | **Decided** by the coordinator under the founder's delegation, 16 Oct; the founder may reverse it | Ships as specified: P4 selects the Book on the book the letter was kept in and sets `arrived` before Review fades, P5 shows the letter, and the second-free-letter line becomes the Book's toast. Benchmarks: Apple Journal and Day One return to the list where the new entry sits (*memory, unverified*) |
| F11 | The lamp's contrast rule (D-110, added to `docs/DECISIONS.md` by this PR): the everyday text colours hold 4.5:1 everywhere at every tone's peak; the status colours hold 4.5:1 where text sits and never sit on the gate's or Read together's lit paper; tests over three phone sizes | **Decided** by the coordinator under the founder's delegation, 16 Oct; the founder may reverse it | P1's acceptance line 2 (section 6) and 5.1; P1 (#192) builds and tests it |
| F10 | Confirm D-104 item 2: encrypted recording backup is free for everyone, and Plus never gates it | **Pending the founder**: `docs/DECISIONS.md` lists D-104 as "Proposed; awaits founder confirmation" | Until confirmed, P8c ships the backup screen without `sheetFree`, and nothing in the app says backup is free or paid |

Nothing in this pass is irreversible: every change is code or copy and can be reverted. No asset in it carries an attribution duty beyond the Licenses screen (section 5.4).

### Counsel

| # | Question | Source |
|---|---|---|
| C1 | Does a static welcome screen that collects nothing, and whose only action opens the age question, meet "asks before first use" (LEGAL-REQ-002, CR-004)? May a positive Declared Age Range result replace the question? | Compliance register section 6 Q6 |
| C2 | The v1.0 gate keeps the question, "Yes", "No", nothing preselected and the stop line, and drops "We ask everyone the same question." and "Nothing you entered has been kept." The same line goes from the age step inside account setup (S55, `authCopy.consent.age.help`). Please confirm no wording here was relied on. | LEGAL-REQ-002, PRD-REQ-019 |
| C3 | Optional trims to registered text, for a later release if counsel agrees: `settings.about.beta.body` without "Some things may change."; `review.firstNote.title` "Read it before you save" with the body "Small slips like an um or a repeat are taken out and marked. Tap a mark to put it back. A name can be misheard, so read it before you save." (same three facts, no "we"); a merged Recordings footer. Until then these ship verbatim. | in-app-disclosures.md sections 1 and 2 |
| C4 | Story card `story.private.v2`, as built in #181 with the founder's words: "Private by default." / "Shared only with the other parent, if you invite them. Never sold, never used for ads." It says who the letters are shared with and claims nothing about who can read them or where they are stored, which matters because letters on our servers are not end-to-end encrypted (#163, Privacy Policy section 3). `story.private.v1` stays served until counsel and D-066 decide. Claims registry entry (there is no `docs/legal/claims-registry.yaml` on `develop` yet, #181). | VOICE privacy table (D-061), review A1, B1 |
| C5 | The usage-sharing sheet words for v1.1 (S10) | LEGAL-REQ-003 |
| C6 | Registered lines that claim who can read under option B: `trust.signIn.privacy` ("Only you and the people you invite can read your letters. We never sell them or use them for ads.", on the sign-in sheet) and `authCopy.consent.terms.body` ("Your letters stay private to you and the family you invite."). Proposed: the founder's line from C4 for the first, and "the other parent, if you invite them" for the second. The P8 line `familyCopy.card.privacy` already uses the C4 words, because it is not registered. | review A1; #163 |
| C7 | Backup disclosure lines (D-102: "Copy says recordings are encrypted, that we hold a recovery key under strict, logged access, and that recordings are never read, sold or used to train models."): `backupCopy.sheetBody`, `sheetNotIncluded` (proposed without "yet": "Your co-parent reads your letters but cannot play your recordings."), `restoreWaiting` and `waitingKey`, the approval sheet (S62, worded so it never calls the other phone "this"; F08 6.7 should match), `settings.recordings.backedUpBody` and `onPhoneBodyBackupOff` (S42), `book.recordingBackedUp` (S27), and `sensitiveConsent.declineHelp`, whose comment still says "v1.0 has no backup". Also, outside this pass: the microphone purpose string ("Your recordings stay on this phone.", F08-REQ-036). | D-102, F08 6.7, review A2a |
| C8 | Erase and deletion lines under option B: `settings.delete.eraseNowBody` "The letter and its recording are erased for good." (database backups still roll off over 7 days, #181), `accountDeletionCopy.what.intro` with the recording backup named and photos removed (S64). | review A2b; F17 8.4 |
| C9 | The Privacy screen's documents list after #163 removes the Consumer Health Data notice. The two links that point at it (`healthPrivacyLink` on Privacy, `consent.terms.healthLink` in account setup) are removed by P6 with S14 and P8a with S01, after #163 and no later than #169 (S44). Counsel confirms no separate notice is needed (register 3.1.0, Q32). | review A2c; re-review A note 2 |
| C10 | The held-letter lines on the Keep step (S22): `keepGate.heldNote`, `heldNoteSynced` and `offline`, written to #163's register 3.1.0 row "Keep step and held letter" (waits on this phone, syncs privately when signed in, never discarded). | #163 `in-app-disclosures.md` 3.1.0; re-review A note 4 |

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
| Crash title | Product, Content: "Something went wrong". States: "This screen hit a problem." | "This page did not open" (v1.1; v1.0 had "This screen could not be shown.", which review B6 found reads like a system log): says what happened, with no blame and no "we", and matches "The book could not open". Error and state titles carry no full stop (#181). |
| Settings accordions | Product: push to pages. States: in place is right. | Push to pages: iOS Settings; the resources stay one tap away. |
| Born offer | Product: keep. Content: reword. States: never presume, allow hiding. | States: a passed due date can be hard news. |
| `story.private.v2` (v1.1) | v1.0 of this spec: "Only you can read these letters. They stay on this phone." Review A: false under option B; keep v1 or register a B line. Review B: untrue, and three sentences fail `rules.test.ts`. | The founder's words as built in #181: "Shared only with the other parent, if you invite them. Never sold, never used for ads." Two sentences, true under B, no claim about who can read (C4). |
| Light between rooms (v1.1) | Review B4: the lamp would cut between Tonight and Listen, saved and the Book, and on a tab switch. | Section 5.8: fade down over 160 ms, return over 280 ms, a tab's light settles to the next tab's; only the first lit room of a session and the second parent's first Book arrive slowly. |
| Review's presentation (v1.1) | v1.0: a page sheet after a full-screen Listen. | Full screen with a dissolve, so a voice room hands to a reading room with no change of shape (5.8 row 4). |
| Where a kept letter lands (v1.1) | v1.0: back to where Review opened (usually Tonight), so MOTION 5e's arrival wash was never seen. | The Book, on the letter, in its month (F9). |
| The Family tab's light (v1.1) | Principle 5 listed no lamp for it, so a tab switch to it would cut the light. | A low, still pool (0.4): the room about the people who write is warm, and every tab is lit, so a tab switch only settles the light. |
| Erase now in a sync build (v1.1) | Review A2b: no server erase-now exists; a synced letter waits for the day-30 purge. #181: "erased for good", no place named. | #181's words; Erase now hidden until WP-F16-13 (F17-REQ-025), with the honest date line meanwhile (S63). |

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

Every one of the 203 journey steps (22 journeys, `docs/release/journey/steps/`, regenerated in #389) is placed in exactly one screen entry in section 4 (S01 to S64); no step is left without an entry. The 57 steps that no entry cited when the record was regenerated are placed in: S09 J04-06, J04-08, J04-09, J04-10, J05-12; S13 J05-10; S14 J05-11; S19 J04-07; S27 J10-16; S28 J10-17; S40 J03-10, J16-20; S46 J03-34, J03-40, J03-41; S52 J22-01, J22-02, J22-20, J22-21, J22-31, J22-50, J22-60; S53 J22-03 to J22-06; S54 J22-07 to J22-09, J22-70, J22-71, J22-80, J22-81; S55 J22-10, J22-32, J22-40 to J22-43; S56 J22-30, J22-33; S57 J21-20; S58 J21-21 to J21-23, J21-30, J22-90, J22-91; S59 J21-01 to J21-08, J21-10. S15 and S16 cover native-only states with no journey step. S10 is recorded but not built in this pass. S48 carries no step since v1.1: J17-01, J17-02 and J17-03 are in S57. S52 to S59 have steps (J22 for S52 to S56, J21 for S57 to S59). S60 to S64 have none: there is no leave flow (S60), no j23 flow (S61 backup, S62 a new phone), no step for the synced erase (S63), and Delete account (S64) has no flow.
