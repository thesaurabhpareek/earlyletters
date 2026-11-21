# D6: The tab is called Moments (ruling, glossary change, usage rules)

Status: the tab word is DECIDED by the founder (21 Nov 2026). The glossary change is made in PR #1276 (branch `chore/brand-moments-label`, ready for review, not merged). Every other line in this doc is PROPOSED: rules for push, email and the store, and the list of files to re-check. Branch `wip/moments-d6`, no PR. Owner: `content`. Date: 21 Nov 2026 (UTC).

FOUNDER-VISIBLE: this edits a brand rule. The founder has said the old rule "doesn't make sense" and approved the change: "Change brand.md and I approve moments." The rule he is changing was in `packages/content/BRAND.md`, glossary row "Short piece someone makes".

## 1. The founder's words, verbatim

- "Memories is nice. Moments too. That rule doesn't make sense so align with brand agents if we should choose that or something else."
- "Think we go with Moments".
- "Change brand.md and I approve moments."

## 2. Why Moments holds up, and the one risk

Short, because the word is decided. Moments passes the job sentence: "I go to Moments to choose a day to tell {child} about." The verb is "choose", it collides with Home (say), Book (read) and Me (look after), and it puts the act with the parent. It is one word of seven letters, so it fits the single-word tab rule (NX-30a-R9). It is not the product noun ("memory book"), so it does not blur with Book the way Memories would. It carries no fear, guilt or loss. It reads well aloud, and VoiceOver says "Moments, tab, 2 of 4" with no stumble.

The one risk I see: **a machine-curated slideshow tone.** Apple Photos and Apple's own journaling suggestions already group a person's pictures into things called moments, so "Moments" in a push or an email can sound like the app looked through your pictures and chose for you. That is the opposite of the constitution (the machine never adds meaning, and never picks the day). The rest of this doc is mostly the guard against that one risk: where the word may appear, and where it may not.

Second, smaller risks: the code namespace `en.moments` already means celebration strings (keep the name, never confuse it with the tab); and the name is not trademark-cleared (X1, Q-X1-12), which is why the store stays free of it (section 6).

## 3. The glossary change (done in PR #1276)

The old rule banned "moment" for a short piece a person makes, and the founder read it as too broad when applied to a tab name. The fix is not to loosen "note". It is to say what the ban is about: **what a person makes.** A tab is a place.

Rows edited in `packages/content/BRAND.md`:

| Row | Before | After |
|---|---|---|
| Short piece someone makes | Banned: quick entry, moment | Banned: quick entry, moment (as the name of a note or of anything a person makes). A short piece is still a note. |
| The fourth tab and its place (new) | none | Use: Moments, as a navigation label and a place ("Open Moments", "in Moments"). Banned: "your moments", "new moments", "these moments", "saved moments", a number of moments, "photo moments", "capture a moment"; Moments as the name of a note, letter, recording, picture or marked day; Moments in the store name, subtitle, keywords, listing, screenshots or website until counsel clears the name. |
| Internal terms (CR-25) | no row | `en.moments` celebration strings and NS-51 "photo moments" keep their code names; a parent never reads them. |

Ordinary English stays: "Try again in a moment", "One moment", "A good moment for a few words". These already ship and are not what the rule is about.

Test edit in `packages/content/test/rules.test.ts` (inside `describe('glossary (BRAND.md)')`):

- Honest finding: the old "moment" and "memory" bans were glossary text only. No test scanned for them. The tab-label test and the `en.moments` celebration tests were the only touchpoints.
- New guard `[BRAND-MOMENTS-1]`: no parent-facing string matches the thing-a-person-makes pattern (possessive or "new/these/saved" plus moment, "N moments", "capture/save/add/make a moment", "photo moments"). A second test proves the pattern catches the bad strings and lets "Moments", "Open Moments", "in a moment" and "One moment" pass.
- New guard `[BRAND-MOMENTS-2]`: store metadata never says "moments" until counsel clears the name.
- New guard `[BRAND-MOMENTS-3]`: BRAND.md carries the tab row and the note row.
- `tab-labels.test.ts` is NOT edited. It still expects Home, Book, Me. It changes in the PR that builds the tab behind its flag, to the four labels in the order the founder and design pick (section 5, item 2).

Result on the PR: `npm test -w @scribe/content`, 22 files, 454 passed (450 before, 4 new).

### MT-D6-R1. The glossary allows the tab and keeps the note

Given a string a parent reads, When it names the fourth tab or opens it ("Open Moments"), Then it passes; and When it calls something a person made a moment, or says "your moments", a count of moments, or "photo moments", Then the content test fails and the copy is fixed, not the test. Test layer: content rules `[BRAND-MOMENTS-1]`.

### MT-D6-R2. A short piece is still a note

Given the glossary, When a person writes a short thing, Then the word in the product is "note" (v1.0 makes no notes, so no string yet), and "moment" is never its name. Test layer: content rules `[BRAND-MOMENTS-3]` (the note row is kept).

## 4. Where the word may appear in the app

| Surface | Moments allowed? | Rule |
|---|---|---|
| Tab label | Yes | `en.tabs`, one word, from `packages/content` only (MT-X1-R12). |
| Tab heading, first line | Yes as the heading | The first line is the job sentence slot, in words that name days and the parent's own words, not "moments". |
| Cards | No | A card shows a date and the parent's own label. No card is titled "a moment". |
| Empty and error states | Only as a place | "Open Moments" is fine; "no moments yet" is not (it counts a gap and names a thing). |
| Me, pictures row (NS-51-R35) | No, keeps "pictures" | See section 5, item 3. |
| Settings, Privacy | No | The row is "Photos" or "Pictures". |
| Celebration strings (`en.moments.*`) | Never shown as "moments" | They show "The first letter." and so on; the name is code only. |

### MT-D6-R3. The Me pictures row never says Moments

Given the Me row for pictures, When its words are written, Then it says "pictures" and never "Moments", Because the row is a switch about pictures and the tab also holds days and prompts; naming the switch Moments would make the tab sound photo-only and would put two Moments places in one app. Test layer: content `[NS-51-R35] row words pass the rules`.

## 5. Files that state the old rule, or must be checked

Edited in PR #1276 (the rule itself):

1. `packages/content/BRAND.md`: glossary rows and internal-terms row.
2. `packages/content/VOICE.md`: "moments never count days" and "Moments celebrate what exists" now say celebration strings (`en.moments`, not the Moments tab); one new line on the tab.
3. `packages/content/test/rules.test.ts`: four tests (section 3).
4. `docs/brand/CONSISTENCY_AUDIT.md`: the source row for the glossary now carries the change.
5. `docs/product/prd/27-photo-moments-and-media.md`: NS-51-R35 and the "banned" line in section D.2 say Moments is the tab's name and stays off the Me row.
6. `docs/design/NOTIFICATIONS.md`: a parent-set date was called "Moments"; it is now "an away date", because a date a person sets is a thing a person makes.
7. `docs/design/e2e/C-keeping-and-trust/DESIGN.md`: C-S27.paused, a Me row value word "Moments" became "Pictures".

To change when the tab is built (not in PR #1276, by design; no shipping parent-facing string was added):

1. `packages/content/src/strings.en.ts` `en.tabs`: add the label. `packages/content/test/tab-labels.test.ts` currently pins `['tonight','book','you']` and `['Home','Book','Me']`, and `/^[A-Z][a-z]+$/` ("Moments" passes). Update the two lists to the final order. Order is open: the feasibility note recommends second of four (Home, Moments, Book, Me); the founder and design decide.
2. New tab strings go in a namespace that is not `en.moments` (D5 proposed `en.gather`; now `en.momentsTab` or `features/momentsTab.en.ts`). `en.momentsTab.` does not start with `en.moments.`, so the celebration tests (`C-REQ-015`) do not wrongly scan it. Add it on purpose to `RHYTHM_SCOPE` (`rules.test.ts` line 298) so the day-count and gap guards cover it. A new feature copy file needs a `SURFACES` row or an opt-out (P8 test).
3. `apps/mobile/src/app/(tabs)/_layout.tsx` and its tests (`tab-bar.test.ts` SCREENS, `you-tab-states.test.ts`, `transitions.test.ts`): per the feasibility note, section 5; mobile owns them.
4. `docs/product/prd/README.md` lines 125 to 127 (and `12-parked-and-not-built.md`, D-161): they say "No Moments tab". That is the founder's reversal; product records it.
5. `docs/DECISIONS.md` D-161 ("Three tabs in every build"): the entry in section 9 amends it.
6. MT docs that say `{tab name}` or "Moments (working)": D2 (`MT-D2-Q1`, the Settings row "Photos ... 'Moments' if that name stands"), D5 (finding MT-D5-F1, section 4 table, `gather.*` keys, push keys `notifications.gather.*`, Q1 and Q7), P1 (`tabsJob.moments`, job sentence, J10), X1 (section 11, Q-X1-12). Each should drop "working label" and, for D5, rename `gather.*` to the new namespace. D5's recommendation of "Gather" is withdrawn.
7. `docs/product/prd/functions/languages-and-localisation.md` FR-LOC-37 and NS-49-R37 (no "moments" in store metadata and public copy): unchanged in effect and now matched by `[BRAND-MOMENTS-2]`.
8. `docs/design/e2e/D-family-sharing-reminders/WORDS.md` line 804 ("Never: ... moments ..."): about words for what the app says about a picture; still true, no edit.
9. `docs/design/e2e/B-book-and-reading/DESIGN.md` line 850 ("The Book has no 'Moments' lens") and `docs/design/e2e/IA-AUDIT.md` line 198: re-read so the Book never grows a second Moments; design owns.
10. Screenshots, website three-tab scenes (FUNCTION-TRACE NR-10), the store listing: see section 7.

### MT-D6-R4. The VoiceOver label

Given VoiceOver is on, When the tab bar is focused, Then the tab is read as "Moments, tab, 2 of 4" (position per the final order), with the hint "Days and ideas to tell {child} about" (PROPOSED words, founder approves before the flag turns on), and no label says "moments" for a card, a picture or a letter. Test layer: device accessibility audit plus content scan. Never: "photo of", a place, a machine guess.

### MT-D6-R5. The tab label comes from content

Given the tab label, When the layout renders it, Then it reads `en.tabs`, one word, matching `^[A-Z][a-z]+$`, and the layout does not hard-code "Moments" (as `tab-labels.test.ts` already scans for the other labels). Test layer: content `tab-labels`.

## 6. Push and email

The risk is the slideshow tone (section 2). So the word itself does little work in a nudge. The nudge says what to do, in the parent's own terms (a day, a letter, {child}), and Moments appears at most as a place to go.

Rules (PROPOSED; push budget and server limits are NS-32, ML-3 and E79, not re-verified here):

1. Never "your moments", "new moments", "some moments", "moments from the weekend", "moments waiting", or any plural noun for what the app shows. (The guard in `[BRAND-MOMENTS-1]` already fails on the first four in shipping strings.)
2. No count of anything: not "3 moments", not "a few days", not "12 pictures".
3. No sentence that implies the app chose, found, curated or looked: no "we found", "picked for you", "suggested", "highlights", "memories", "recap", "throwback", "look back", "AI", "smart".
4. The word is not in a push title and not in an email subject line. In a push body or an email body it may appear once, only as a place after a verb: "Open Moments". It is never the subject of a sentence ("Moments has something for you" is out).
5. A nudge names a parent act: "Something to tell {child}, when you have a minute." Use D5 section 12.1 lines (`A day to mark`, `{child} is a month older`, `A question for {child}`) with the key prefix renamed; the Gather lines in D5 are withdrawn with the Gather name.
6. No place, picture count, thumbnail or "waiting" in any nudge. The pictures push remains the open question Q4 in D5 (ML-3), unchanged by the name.
7. Email: from server knowledge only (the child's date of birth, typed days, letters made), never a library signal, and the nudge-email class itself still needs the founder and counsel (D5 Q5). In an email the child is "your child", never the name (VOICE.md).
8. No exclamation mark, no emoji, no fear, guilt or loss ("before it is too late", "slipping away").

### MT-D6-R6. A nudge never reads as a slideshow

Given a push or an email that points at the tab, When it is written, Then it has no plural "moments", no count, no word that says the app chose or looked, and the word Moments is absent from the title and the subject line. Test layer: content scan over `en.notifications.*` and `emails` (add the patterns in the PR that adds the strings).

Examples that pass: title "A day to mark", body "Something to tell {child}, when you have a minute." Examples that fail: "Your moments from the weekend", "3 new moments", "We found a moment to remember".

## 7. App Store, website and screenshots

Counsel X1 advises in-app only, not store metadata, until a trademark clearance (Q-X1-12). X1 found two dead USPTO records for MOMENTS and many other MOMENT marks, and counsel has not cleared the name. We are not registering the tab name; it is a feature label under the existing mark.

1. Store name, subtitle, keywords, promotional text, description, "what's new": no "Moments". `[BRAND-MOMENTS-2]` enforces it on the store copy that exists in `packages/content`. Keywords also stay free of "photos", "journal" and "memories" (FR-LOC-37).
2. Screenshots: the tab bar is visible in a screenshot, so the label would be in the listing. Until clearance, either do not show the fourth tab in store screenshots, or show screens where the bar is cropped or the tab is not selected. Counsel decides whether a visible label in a screenshot counts as metadata; I propose the careful read (no).
3. Website: no "Moments" until clearance, same as store.
4. After clearance, the store may say what the tab does in the parent's words ("choose a day to tell {child} about"), not the name, unless counsel says the name is clear.
5. Never imply Apple runs the list (NS-49-R37).

### MT-D6-R7. The store carries no Moments until counsel clears it

Given store metadata, When it is built, Then no field contains "Moments" and screenshots do not feature the fourth tab until X1 Q-X1-12 is answered. Test layer: `[BRAND-MOMENTS-2]` for text; a human check for screenshots (`marketing`, `legal`).

## 8. Checked against each test I was asked to apply

| Test | Result |
|---|---|
| Job sentence "I go to Moments to choose a day to tell {child} about" | Pass; 12 words with {child} as one |
| One verb per tab (J1) | Pass; the declared verb is "choose", which Home (say), Book (read) and Me (look after) do not use. The name is a noun, as Home, Book and Me are |
| Other tab names | Distinct; single word; no clash |
| "Memory book" next to Book | No blur (Memories would have) |
| Glossary collisions | `en.moments` celebration namespace (code only, guarded); "moment" for a note (still banned); NS-51 "photo moments" (internal only) |
| VoiceOver | Reads naturally; plural noun; no stumble. MT-D6-R4 |
| App Store copy | Kept out for now. MT-D6-R7 |
| The 111 prompts voice | Prompts do not use the word; none to change (grep of `prompts.ts` found no moment or memory) |
| No fear, guilt, loss | Neutral word |
| Push or email subject | Only as a place, never in a title or subject. MT-D6-R6 |

## 9. DECISIONS entry (ready to paste; check the number before merging)

```
### D-164 The fourth tab is called Moments; "moment" stays banned for what a person makes (founder, 21 Nov 2026)
- **Status:** Decided by the founder in chat on 21 Nov 2026. Recorded by `content`. Entries that record the founder's own words are merged by Karma under D-132.
- **Source, the founder's words, verbatim:** "Memories is nice. Moments too. That rule doesn't make sense so align with brand agents if we should choose that or something else." Then: "Think we go with Moments". Then: "Change brand.md and I approve moments."
- **Decision:** the new fourth tab is called Moments. In the BRAND.md glossary, "moment" is allowed as the name of that tab and the place a parent opens ("Open Moments"). It stays banned as a word for something a person makes: a short piece is a note, a long one is a letter. "Gather" is withdrawn.
- **Why:** the old row banned the word everywhere, which the founder judged too broad for a tab name. Moments passes the job sentence ("I go to Moments to choose a day to tell {child} about"), keeps one verb per tab, and does not blur with "memory book" the way Memories would.
- **What it changes:** `packages/content/BRAND.md` (two glossary rows, one internal-terms row), `VOICE.md`, `packages/content/test/rules.test.ts` (four tests), and four docs that stated the old rule (PR #1276). The Me pictures row keeps "pictures" (NS-51-R35).
- **Limits:** in-app only. Not in the store name, subtitle, keywords, listing, screenshots or website until counsel clears the name (X1, Q-X1-12). In push and email, never "your moments", never a count, never in a title or subject line.
- **Amends:** D-161 (three tabs in every build): a fourth tab is a founder reversal of that entry, in the position the founder and design choose.
- **Open:** tab position; the words of the tab, which the founder approves before the flag turns on (`13-engineering-plan.md` section 4); trademark clearance; the picture nudge under ML-3.
- **Owner:** founder; `content`.
```

## 10. Open questions

| # | Question | Default | Owner |
|---|---|---|---|
| Q1 | May a screenshot show the fourth tab's label before clearance? | No; crop or omit | counsel, `marketing` |
| Q2 | Rename the code namespace `en.moments` to `en.milestones` to end the confusion? | No; keep, guarded, revisit when the tab ships | `content`, `mobile` |
| Q3 | Tab order | Second of four, per feasibility | founder, design |
| Q4 | May "Open Moments" appear in an email body at all? | Yes, once, as a place; held until the nudge email class exists | founder, counsel |

## 10a. More rules the name needs

### MT-D6-R8. The prompts do not use the word

Given the 111 prompts in `packages/content/src/prompts.ts`, When the tab shows one as a question for {child}, Then the prompt text does not contain "moment" or "memory" as a name for what the parent will make, and the card title is "A question for {child}", never "A moment for {child}". Test layer: the existing prompt rules plus `[BRAND-MOMENTS-1]` over `prompts.ts`. Today no prompt uses either word, so nothing changes.

### MT-D6-R9. Nothing in the tab calls a parent's own words a moment

Given a letter, a note or a recording the parent made and the tab shows it, When its card renders, Then the card says "Read it" or "Write about this" and the date, and never "your moment", "saved moment" or "moment from {date}". Test layer: `[BRAND-MOMENTS-1]` over the tab strings, and a component test on the card text builder.

### MT-D6-R10. The celebration strings stay what they are

Given the `en.moments.*` strings ("The first letter.", "10 letters."), When the tab ships, Then they keep their keys, their no-compare and no-plan rules (`C-REQ-015`) and their text, and no parent-facing line anywhere calls them moments. Test layer: existing `C-REQ-015` tests, unchanged.

### MT-D6-R11. No streak or count rides on the name

Given the word Moments, When any string uses it, Then it carries no count, run, total, gap or "new" badge: no "3 new in Moments", no dot on the tab, no "Moments (4)". Test layer: `[BRAND-MOMENTS-1]` for the number pattern; design review for any badge on the tab icon (design-systems).

## 10b. What did not change

- "Gather" is withdrawn. Memories and Remember were not chosen; they are not used.
- The ban on "memory" for a longer piece someone makes stays as it was; "memory book" is still the product noun.
- No shipping parent-facing string was added or edited. The changes are rules, docs and tests.
- `packages/brand` is untouched; the public name comes only from there.
- The test was not loosened to pass. The guard is new and narrow; the old rule had no test.

## 11. Verified and unverified

VERIFIED this run (read in a clone of the repo): BRAND.md glossary rows; `rules.test.ts` and `tab-labels.test.ts`; no test scanned "moment" or "memory" before PR #1276; the `en.moments` namespace and its tests; the existing "in a moment" strings; NS-51-R35 and related rows; D2, D5, P1 and X1 text on their branches; X1 section 11 and Q-X1-12; the 454 passing tests on the PR branch.

UNVERIFIED: ML-3, NS-32 and E79 (cited from D5 and X1, not re-read); Apple's use of the word "moments" in Photos and journaling suggestions (taken from X1 and the feasibility note, not re-read); trademark status (X1's search only); how VoiceOver reads the tab (expected, not run on a device); PRs #1264 and #1267 (their titles are about the Home engagement wheel and the tab privacy read; I did not need them for the tab word).
