# Moments tab: product and data rulings (council round, 21 Nov 2026)

Status: PROPOSED rulings, docs only. Nothing here changes code, the PRD, `docs/DECISIONS.md` or `agents/roster.json`. Karma files each ruling into `docs/agents/exec/RULINGS.md` under the next free number for its role; the ids below (MR-1 to MR-14) are working ids only, because I did not check the Project docs `infra/exec-rulings-*` for numbers already used (this session cannot read them).
Base: `origin/develop` at `8ca6d7d28`. Spec: `docs/product/prd/28-moments-tab.md` (line numbers below are that file unless another is named).
Signed: Chief Product Officer (Claude role), with the Chief Data Officer (Claude role) and the Chief Privacy Officer (Claude role, not counsel). Where a ruling needs another seat, that seat is named.

## 0. How to read this

Honest setup. Every seat here is one Claude session playing a role from a skill. The "challenger" line under each item is written by this same session in the voice of another seat, so it is not an independent challenge. A human or a different model family reading the items marked "read this one twice" would add the most.

Authority. The founder delegated every open Moments decision to the council on 21 Nov 2026 ("Decide all open with exec"). That sentence reached this session through Karma's brief; I did not find it in the repo, so it is UNVERIFIED in the repo until Karma records it in `docs/DECISIONS.md` in his words. The founder then replied the same day. The coordinator relayed his reply to me in this session, and it is quoted here as relayed, not read from the founder's own message:

> "I agree with all your recommendations. Continue. Approved."

The coordinator listed the recommendations that reply covers: O-62 (one picture first), `labels{}` not exported, O-49 no enum, O-56 door below the ask card, roster owner names for `product` and `security-architect`, and for O-48 one recommended text plus a fallback because he decides what users are promised. Those are recorded below as founder-decided or founder-approved, with the words quoted once here. One more founder decision is not in this file: cover ON (the app-switcher cover for Moments with App lock off) is founder-decided and ruled in the design closure `docs/design/moments-design-closure.md`, DC-5 and G-01 (merged in PR #1367). Do not read its absence here as undecided. Anything the reply did not name is ruled by the council under the delegation.

What the delegation does not do. It does not replace counsel (silence from counsel is never a pass: gate G2, line 1115), it does not merge legal text (D-132), and it does not turn on a store build. Where an item needs a human body, the "Hands" line says whose.

Every outside-world fact below is UNVERIFIED unless a line says I read its source this session. I read only repo files. I read no Apple page, statute or vendor page.

Summary table (one line each; detail follows).

| Item | Ruling | Standing |
|---|---|---|
| O-48 value proposition | Recommend 16.1 text, primer A, with a stated fallback; the founder picks. Second line and primer A need counsel reading and stay unpublished | FOUNDER (his words asked for: one text plus fallback) |
| O-49 analytics enum | No enum in the first release | Founder-approved |
| O-50 names in notifications | Stricter reading (R280) for Moments-owned notes now; shipped planner untouched until PR 23, which must test it | Council |
| O-52 door and the photo flag | The door follows the photo flag; same build as its legal set | Council |
| O-54 per-type limit | One total cap; per-type check at Start; moot for the first door (pictures only, one) | Council |
| O-56 door when never asked | Quiet text row below the ask card; never beside it, never in the primer | Founder-approved |
| O-57 host layout | First release is Apple's picker as its own sheet (Layout C by construction); A or B only for the later inline host (B is founder-approved in DC-2) | Council, compatible with DC-2 only if 18b-2 is the only inline host |
| O-59 card verb word | "Not now" (until tomorrow) on the card face; "Not this one" (this day never again, Undo) in the menu. Aligned with DC-6; the earlier "Not this one on the face" proposal is withdrawn | Council (keeps the founder's brief word) |
| O-62 one picture or six | One picture; six is BL-1472, later | Founder-decided |
| `labels{}` export (R250) | Not exported, not in backup | Founder-decided |
| RV-23 the door | Approve as the fifth signature, conditional on the R278 set | Council |
| Roster names | `product`: "product manager", "product"; `security-architect`: "security architect" | Founder-approved |

## 1. O-48 Value proposition, first-run promise, store story

Question. Approve the proposed text of 16.1 (D10): what a parent is told about Moments in the app and in the store. Founder-only because it is a promise to users (line 1404, D10 at line 154; text at 16.1, line 877 onward).

Options.
1. Approve all of 16.1 as written, including the store promotional line and primer A.
2. Approve the lead pair, the three-state first-run promise and the "true in every build" store story as one text; hold the promotional line and every public use until the gates close (recommended), with primer A as base and B as challenger.
3. Do nothing: leave 16.1 as placeholders and let `content` write PR 12 without an approved lead line.

Recommendation to the founder (one text, one fallback, as he asked).

Recommended text, in the app and the "true in every build" store story:
- Lead: "Pictures start the story. Your voice finishes it."
- Second line: "{app} never adds a word to your letter." (Replaces my first draft, "We never write a word for you." Review B note 1: that draft uses "we" against PRD D5-F3 (`docs/product/prd/28-moments-tab.md:857`, `{app}` not "we" or "our" in touched in-app copy) and is an absolute authorship claim wider than the live "It never adds a word" (`docs/store/listing/apple.md:41`, `packages/content/src/store.en.ts:58`). The proven form is the only one with a test behind it. It goes into the claims register with `rules.test.ts` and `verifyEdits` as its test. Both forms need counsel's reading under Q130 (spec Q8, `FREEZE-CHECKLIST.md:238, 242`) before any public use; keep unpublished.)
- Store story (every build): "Pick pictures from a day you want to remember, then say what was happening. Your words stay yours. It never adds a word to your letter."
- Primer A: "{app} reads the date, the time and the place of your pictures, on this phone and only while Moments is open, to suggest days to tell {child} about." (Needs counsel's reading: "on this phone and only while Moments is open" is a location and time-scope claim of the kind D5-F4 (line 857) says not to make in touched copy, and the primer line at 893 forbids "stays on your phone" and "never". `content` does not freeze primer A in PR 12 until Q8 (b) mode-scoped wording is read. It is a Q1 and Q8 item.)

Fallback if you want the lead to cover parents who type: change "Your voice finishes it." to "Your words finish it." Nothing else moves. Reason to keep the fallback ready: the existing listing says letters you type stay as typed (`docs/store/listing/apple.md:41`), so "voice" could read as "not for me" to a parent who types. I have no research on this: it is a G4 reading (line 1117), not a fact.

What is not approved by this ruling, in any form: the promotional line ("Let the app suggest days from the date, time and place of your pictures, read on this phone", cut here, 16.1) and any public use of the primer or the store story. They stay unpublished until counsel's written answer on G2 questions Q1 and Q8 (21.3, line 1156 onward) and the G6 mode-scoped claim test pass. So the founder is approving working copy for PR 12 and test builds, which is what the PRD default already says (line 1348: the default applies to docs and test builds only, never to public text).

Truth check done. "It never adds a word" matches the allowlist: no `EditType` inserts a word (`packages/core/src/types.ts:12-19`; `punctuation` adds marks, `agreement` is one word with the same stem, `stt_fix` takes a dictionary term). The same sentence is already in the store listing (`docs/store/listing/apple.md:41`). "Read on this phone" is a design fact for F2, not yet a counsel-cleared claim (Q1, Q8).

Risk against return. Return: PR 12 can freeze strings and the lead line is true in all three access states. Risk: a promise is published before counsel reads it; held by the unpublished status. A fourth risk, "voice" excluding typists, is small and has the fallback.
The way back. Strings are `content` keys behind the F1 and F2 flags; nothing is public. Two-way.
Challenger (CMO): "The lead names the act, but 'finishes it' promises the app completes a letter; that smells like AI authorship." Answered: the second line and the store story say {app} never adds a word, and the constitution test (`packages/content/test/rules.test.ts`) bans implying AI writes; G6 runs it on the final keys.
Hands. The founder chooses between the recommendation and the fallback. Counsel's written answer (founder spend, O-40). Karma merges no public text before then.
Sources: line 1404; line 154; 16.1 (line 877); line 1348; `docs/store/listing/apple.md:41`; `packages/core/src/types.ts:12`.

## 2. O-49 Analytics enum for how a letter was started

Question. Send a closed enum (picker, card, capture) when a letter starts (line 1405, D13 at line 157, R284 at line 1327).

Options.
1. Do not send it in the first release; read the answer from App Store Connect cohorts and two diary questions (the PRD default).
2. Send `start_source` in {picker, card, capture} on the existing letter-start event.
3. Send only a `moment` entry-point value (the O-38 shape).
4. Do nothing (no ruling): leaves PR 7 undecided.

Ruling (founder-approved, relayed): option 1. No enum in the first release.

Why, in data terms. The CDO test is what we would do differently with the number. The first-release question is whether the door gets used at all, and the diary plus store data answer that coarsely. The enum also correlates with a consent state: `picker` appears mostly after a No, Limited or library-off state (R270, line 1313), so a count of `picker` approximates the permission result, which O-18 already defaults to No as an event (line 1374). Level of the value alone: L2. Next to a timestamp and the device id it is a permission-state proxy; I would not add it without a decision that needs it.

Blind spot that remains: we cannot see door use at scale in the first release. D-163 (founder, 20 Nov, `docs/DECISIONS.md:670`) already orders page-view, click and impression instrumentation before the production build. If the registry for that work includes a tap on the door, it answers "was the door used" without a new enum. Whether it does is UNVERIFIED; I did not read the instrumentation files.

Risk against return. Return of sending: a trend line on door use, at the cost of a new allowlist value (`packages/analytics/src/catalog.ts` is closed enums only) and a privacy-label and consent line to check. Risk of not sending: a slower read. Skipping costs nothing to undo, because an event can be added later; a value that was sent cannot be unsent.
The way back. Add the value later with a registry change and a `SCHEMA_VERSION` bump. Revisit trigger: after the F2a read-out, if the diary (R284) and the D-163 click events cannot say whether the door is used, bring one combined O-38 and O-49 registry change.
Challenger (CPO): "Without the enum the diary has five parents and no scale." Answered: five parents is all G4 can read anyway; the diary is a second reading, and D-163 clicks may fill the gap.
Hands: none.
Sources: line 1405; line 157; line 1327; `docs/DECISIONS.md:670`; `packages/analytics/src/catalog.ts`; `docs/product/moments-tab/ALIGNMENT-data.md` section 6 (E1 to E3, the spec text about analytics names is wrong in three places: those are separate fixes for `product`).

## 3. O-50 Names in Moments-class notifications

Question. Moments-class push and email carry no child name and no month number on any setting (the stricter reading), against the shipped planner, which names the child when "Names in notifications" is on (line 1406, D11 at line 155, R280 at line 1323, R138 at line 763, R234 at line 1270).

Options.
1. Stricter reading for all three classes (`typedDay`, `birthday`, `monthAge`), changing the shipped planner now.
2. Stricter reading for Moments-owned sends only; the shipped planner is not edited by this ruling and changes in PR 23 when Moments takes those sends over (recommended).
3. Keep the shipped behaviour: names when the parent turned names on.
4. Do nothing: leaves R138, R234 and `planner.ts` contradicting each other.

Facts read. `apps/mobile/src/lib/reminders/planner.ts:295-311`: with names on, `birthday` and `monthOpen` notes name the child and show a month number; with names off they use neutral text. `planner.ts:185`: `namesOnLockScreen` defaults to false (D-025). Moments push is phase 2: the library read drives no push or email in the first release (16.1, last paragraph; R132 to R135). PR 23 (nudges from phone-held facts, planner change R280) is wave D (`HARNESS-REPLAN-HYBRID.md:55`).

Ruling: option 2, and I adopt the stricter R280 reading (`28-moments-tab.md:1323`, all three classes) as the governing rule now, for Moments-owned notes. This ruling supersedes R280's timing for the interim only: shipped notes keep the planner behaviour until PR 23, then R280 applies to all three classes. `typedDay` does not exist in the planner yet (`PlannedKind` is `evening | monthAge | birthday`, `planner.ts:136`); it is a new Moments-owned kind, added in PR 23, and nameless. For any note that Moments owns or adds (`typedDay` and every new class), no child name and no month number or age in the title or body, on every setting. The parent's explicit "Names in notifications" choice stays honoured for the evening class and for the shipped birthday and month notes until PR 23 lands. PR 23 must say in its body, founder-visible, that those two notes lose names when Moments takes them over, and `content` writes nameless variants. PR 23 must also carry a test that asserts no child name and no month number in any Moments-class note, with names-in-notifications on and off, over every payload field for email and push, not only title and body (`not yet: PR 23`). No Moments push copy is final until then.

Why. A parent who turned names on chose that for classes they were shown. Silently removing names from shipped notes is a behaviour change outside this feature, and the first release does not send Moments-class notes anyway. The stricter reading collects and shows less on the lock screen, so it is a privacy call I may make (CPrivO may block a leak and show less). Lock-screen exposure of a baby's age is what the setting guards (planner comment at `planner.ts:309`).
Risk against return. Return: the spec and the code stop contradicting each other without touching shipped notifications. Risk: between now and PR 23 the PRD says "no names on every setting" while the planner still names; the ruling closes that by saying which governs when. A second risk: a parent notices names vanish at PR 23; mitigated by the founder-visible line.
The way back. The nameless variants are planner table rows; revert PR 23. Two-way with cost.
Challenger (CPrivO): "The lock screen is the leak; a parent who turned names on still did not agree to a note derived from their pictures." Answered: no Moments-class note is derived from pictures in the first release (library read drives no push), and any new Moments note is nameless, which is your reading.
Hands: `mobile` and `content` own the PR 23 rows; no founder hand.
Sources: line 1406; line 155; line 1323; `planner.ts:185, 283-311`; `HARNESS-REPLAN-HYBRID.md:55`.

## 4. O-52 Does the door pull the photo flag into the Moments release

Question. Does the picker door ship in the Moments release, pulling `EXPO_PUBLIC_PHOTOS` with it, or wait for the photo flag's own build (line 1408, D9 at line 153, R278 at line 1321, EXH-LEG-1).

Options.
1. The door ships only in the same build as the photo flag's legal set (label, policy, Terms, backup line, the deletion-screen line, counsel Q5 to Q7 and Q9, and packet Q43, Q45, Q48, Q51 and Q54) and follows the photo flag (recommended).
2. The door ships first, alone, and the legal set follows.
3. The door waits for the photo flag's own build, outside this release.
4. Do nothing: PR 18b-1a merges with no stated rule.

Ruling: option 1. The flip list is the full R278 set (`28-moments-tab.md:1321`): the privacy label row (still "No photo feature in v1.0" at `docs/legal/app-store-privacy-labels.md:54`), the policy, the Terms, the backup line, the deletion-screen line (a deleted letter's copy leaves the phone but not an older backup Apple holds), counsel Q5 to Q7 and Q9, and packet Q43, Q45, Q48, Q51 and Q54. The door is F1 and rides the photo flag. No profile that reaches the store carries the door unless the same build carries the photo legal set. The release read-out guard (PR 25a, photo line; `not yet: PR 25a`, so until it exists the rule is prose only) fails a production build with the door on and a photo line missing (`HARNESS-REPLAN-HYBRID.md`, section 1 text under the table). If counsel's answers or the paperwork miss the submission date, the door and the photo flag stay dark and Moments ships on its no-library content, the same fallback shape as O-37 (line 1393).

Facts. The photo UI is behind `EXPO_PUBLIC_PHOTOS` and no `eas.json` profile sets it (FACT-CHECK, spec line 917; UNVERIFIED by me against `eas.json` today, I did not grep it). The labels row says "No photo feature" today (R278 names `app-store-privacy-labels.md` lines 54, 117, 127, and policy line 45; I did not re-read those lines).
Risk against return. Return: a coherent promise, one reviewed build, and no half-true label. Risk: the door slips with the legal set. The door is the smaller footprint on every row but one (a temporary located original in `Caches/ImagePicker`, line 915), so the cost of waiting is lower than the cost of a wrong label.
The way back. Flag off; the door row is a component and a route (`moments/pick`). Two-way until a store build carries it; once a parent has seen it, two-way with cost.
Challenger (CTO): "The library read waits on counsel and the door is the smaller route; shipping the door first is the cheap App Review story." Answered: R278 and D9 forbid it, and CPO skill section 9 notes dormant or undocumented features are a 2.5.19 risk (UNVERIFIED reading, counsel and Apple decide). A door whose label is wrong is worse than no door.
Hands: counsel's written answers (founder spend, O-40); the founder or Karma merges legal text (D-132).
Sources: line 1408; line 153; line 1321; `HARNESS-REPLAN-HYBRID.md` section 1.

## 5. O-54 Per-type limit

Question. If a mixed limit (pictures and videos) cannot be enforced live, use one total cap with a per-type check at Start, or two doors (line 1410, R90 at line 553, R272 at line 1315).

Options.
1. One total cap, per-type check at Start (recommended).
2. Two doors, one for pictures and one for videos.
3. Do nothing until G1a-P (h) reports.

Ruling: option 1, and it is moot for the first door. The first picker PR is pictures only (R271, D3) and O-62 below fixes the first release at one picture, so there is no mix to enforce. The per-type check at Start matters only when video ships (PR 18c, LATER). Two doors are rejected: they double the door surface, and R270 wants one verb family and one component (line 1313). `content` may write the 18b-1a strings now for the one-picture door: one limit line is not needed at a cap of one, because Apple's picker closes on the first pick; the limit line returns with multi-select (BL-1472).
Risk against return. Return: unblocks PR 12's door strings now instead of after the spike. Risk: video later needs the per-type check anyway; it is a Start-time check in our code, so it costs little.
The way back. Strings and one check; revert in `content` and `mobile`.
Challenger (CDesO): "A cap of one with a tray reads as a worse picker than Apple's own." Answered: with one pick there is no tray (see O-57); Apple's picker is the body.
Hands: none.
Sources: line 1410; line 553; line 1315; `HARNESS-REPLAN-HYBRID.md:44, 46`.

## 6. O-56 The door in the never-asked state

Question. Where the "Choose pictures" door sits when the parent has never been asked about library access (ACC-0): below the ask card, or only after the parent answers (line 1412). D2 (line 146) and R270 (line 1313) say "only after"; `EXPERIENCE-AND-MOTION.md` section 2.2 (the ACC-0 row, line 80) says below the ask card.

Options.
1. Quiet text row below the ask card, never beside it, never inside the primer or ask flow (the experience spec; recommended).
2. Only after the parent has answered (D2, R270 as written).
3. Do nothing: PR 14 and PR 17 are filed against two incompatible specs.

Ruling (founder-approved, relayed): option 1. The door is a quiet text row below the ask card in ACC-0, never beside it, never inside the primer flow. D2 and R270 are reconciled to this by `product` in a docs edit; I make no spec edit in this PR. Three PROPOSED row changes that depend on the answer become adopted: R106, R120 and R253 (the door is one verb family "Choose pictures", sits below the ask card, and R253's "Add pictures" folds into it). A fourth, R144, depends on O-27 (tray flight), which stays off by default and is undecided here.
ACC-2 (granted, full access): a ruling by Karma and the CPO, not founder-decided; the founder's words covered only the never-asked state. I keep the experience spec's quiet last row of Recent, not R270's "not on ACC-2", the same as the design closure DC-1. Reason: a parent with full access who wants a picture older than the Recent window has no other route except the day sheet. It is a content row. Removal trigger, in DC-1's wording: G4 task T4 compares the door shown against the door hidden as evidence, not as a gate; the row goes if that evidence shows it is not used or is read as a way around the ask.
Stop line. G4 already compares "door shown after a No only" against "beside the ask" (line 1117, default the narrower door). The founder chose the wider placement, so G4 keeps the comparison as a check with a bar: if two of five parents read the door as a way around the ask, or hesitate before tapping Continue because of it, `product` returns the door to the after-No placement (D2) before launch. Two of five is my planning bar [A], not a sourced figure.
Risk against return. Return: a parent who is not ready to grant library access still has something that works on first look (EXPERIENCE-AND-MOTION 2.2). Risk: the door reads as a rival yes or no, or as a funnel away from the ask (the Privacy objection in D2). Mitigation: a text row, the same verb as capture Add, no permission or purpose string on the door.
The way back. Move one row; a content and layout change. Two-way.
Challenger (CPrivO): "No funnel into or away from the ask." Answered: the door never mentions the library or the ask and shows only a picker that has no identifier (D3); the G4 bar above is the check.
Hands: none.
Sources: line 1412; lines 146, 1313; `EXPERIENCE-AND-MOTION.md:80, 90`; rows R106 (line 569), R120 (645), R144 (822), R253 (1289).

## 7. O-57 Host sheet layout A, B or C

Question. Layout A (hide both Apple bars), B (keep the top bar) or C (Apple's picker as its own sheet, no inline host, no tray for Apple's picks), decided by device matrix DM-02 (line 1413; `EXPERIENCE-AND-MOTION.md:246-258` and 457 onward). It extends O-53 (line 1409).

Options.
1. Run the matrix rule: A if Albums, Options, the privacy badge and the first-show panel stay reachable with both bars hidden; else B; else C.
2. Decide C now for the first release.
3. Do nothing until G1a-P's device read-out.

Ruling: option 1 for the inline host, plus a fact that changes what is first. The first-release door is PR 18b-1a, a modal presenter with one pick; the inline host is PR 18b-2, marked LATER and "not on the first-release critical path" (`HARNESS-REPLAN-HYBRID.md:44, 47`). So the first release ships Apple's picker as its own sheet, which is Layout C in all but name. A, B or C is a live question only for 18b-2. Default stays B until DM-02 shows A passes (O-53, O-57). This is compatible with the design closure, which builds Layout B as founder-approved (`docs/design/moments-design-closure.md` DC-2), only if 18b-2 is the only inline host: B governs that host, and the first release has none. If any other inline host appears, DC-2 governs it. Never hide Options (it is Apple's privacy control, `EXPERIENCE-AND-MOTION.md:252`).
Consequence to confirm. With one picture and no inline host in the first release, the host-sheet frame and tray in PR 14b may not be needed until 18b-2. I did not read the PR 14b row against that; `product` confirms against section 19.4 before PR 14b is filed. UNVERIFIED.
Risk against return. Return: the first door does not wait for the hardest device unknowns. Risk: Apple's own sheet is less ours, and its first-time text and badge cannot be styled (KM5, line 163).
The way back. 18b-2 can replace the modal later through the same `AttachRequest`; revert is a PR.
Challenger (CDesO): "Layout C hands the best moment to Apple's chrome." Answered: that is the price of one plain `PHPickerConfiguration` with no identifier (D3), and the privacy footprint is the reason the door can ship alone.
Hands: the device read-out of G1a-P needs the founder's phone (`mobile` with the phone, line 1117).
Sources: line 1413; line 1409; `HARNESS-REPLAN-HYBRID.md:44, 47`; `EXPERIENCE-AND-MOTION.md:246-258`.

## 8. O-59 The word on the card face

Question. The set-aside verb on a card face: "Not now" (the founder's brief) or "Not this one", and its promotion from the menu to the face, one tap with Undo (line 1415; `EXPERIENCE-AND-MOTION.md:105`).

What I found that the PRD does not say plainly. There are two verbs with different effects. R28 (line 313) calls one "Not today": it leaves until the next local day. Line 366 lists "Not now (until tomorrow)" and "Not this one (this day never again in For you or Recent)", and R275 (line 1318) keeps "Not this one" one tap from every card, including Recent cards, undoable, with a day key only. The experience spec promotes "the existing set-aside verb" (the until-tomorrow one) and asks only which word. The words in the spec are not in the shipped content strings: `packages/content/src` has no "Not this one" or "Not this place" (grep this session), so "existing" means existing in the spec, not in the build. "Not now" is shipped as a button word elsewhere (`strings.en.ts:45`).

Options.
1. "Not now" on the face (until tomorrow); "Not this one" in the menu (the PRD default).
2. "Not this one" on the face (this day never again, Undo); "Not now" in the menu.
3. Both on the face.
4. Do nothing.

Ruling: option 1, aligned with the merged design closure DC-6 (`docs/design/moments-design-closure.md`, PR #1367). "Not now" (until the next local day) is on the card face; "Not this one" (this day never again in For you or Recent, with Undo) is in the card menu, with "Hide this place". My earlier proposal, "Not this one" on the face with "Not now" in the menu, is withdrawn. Reason: the face word and its effect agree, and this keeps the founder's brief word, "Not now" (`EXPERIENCE-AND-MOTION.md:105`; I did not read the brief itself). So there is no departure from the founder's brief and nothing for him to pick here. The two files no longer contradict each other, and Karma files one O-59 ruling, not two. `content` owns the final word and may change it without a design change (DC-6); if `content` ever picks "Not this one" for the face, the effect changes with it and the Undo copy follows, and that returns to the founder as a change from his word. Hiding is soft and reversible through the Me list (R29, line 314, and PR 21 "Hidden choices"). The G4 hand-over task (T10 in DC-6) asks whether one tap to "Not now" is enough for a card the parent did not want (EXH-CMO-10, EXH-PRV-9, R275); a parent who needs more has "Not this one" one tap further.
Risk against return. Return: one tap, honest, the word and the effect agree. Risk: a parent who expects "Not now" to mean never (DC-6's own risk) sees the picture again tomorrow. Mitigation: "Not this one" in the menu, with Undo that never times out.
The way back. A content key and one effect constant. Two-way.
Challenger (privacy lens): "Not now only hides until tomorrow, and a picture on a card the parent did not want comes back." Answered: the menu has "Not this one" one tap further, and G4 asks whether one is enough; if not, the face verb is revisited with the founder.
Hands: none.
Sources: line 1415; lines 313, 314, 366, 1318; `EXPERIENCE-AND-MOTION.md:105`; `packages/content/src/strings.en.ts:45`; `docs/design/moments-design-closure.md` DC-6.

## 9. O-62 One picture or six

Founder-decided (relayed), words as quoted in section 0: "I agree with all your recommendations. Continue. Approved." The recommendation he approved: the first Moments door ships with ONE picture; six becomes the proposed row BL-1472, later.

Question. The code holds one pending picture per letter while R90 plans six pictures or two videos (line 1418, R90 at line 553).

Options. (1) One picture first; BL-1472 later. (2) Six pictures first; build BL-1472 now. (3) Do nothing: PRs 18b-1c, 19b and 18d are filed to the wrong shape.

Ruling: option 1. Facts read: `apps/mobile/modules/scribe-photo/ios/ScribePhotoModule.swift:137` sets `selectionLimit = 1`; `apps/mobile/src/lib/photos/pending.ts:56` replaces the pending picture on a new pick; BL-1472 (`docs/BACKLOG.md:7379`) is sized M, ASSUMED about 300 lines, and says it is UNVERIFIED whether the `entry_media` save path writes more than one row on develop.
What changes. PR 18b-1c (multi-select contract) and the multi-picture parts of PR 19b, 18d and the tray wait. R90 and R272 describe the later state; the picker contract is written with N = 1 and a place for more. The Start hand-off carries one picture, so the tray-flight question (O-27) shrinks. `product` owes docs edits to R90, R272, 19.4 and the C-53 line (line 1517) saying the first door is one picture. I make none here.
Minimisation gain (CDO and CPrivO read). One picture means one temporary located original in `Caches/ImagePicker` instead of up to six, one iCloud download instead of up to eight, and lower memory on an iPhone SE 3. The data inventory row (`DATA_CLASSIFICATION.md:758`) stays accurate.
Return and risk. Return: smaller, shippable, and it matches the code. Risk: "pictures from a day" with one picture may feel thin; I have no research on it. A reading, [A]: if at least three of five parents at G4 try to pick more than one or say one is not enough, `product` brings BL-1472 into the release if the calendar fits, else the first 1.0.x after. That bar is mine, not sourced.
The way back. Pull BL-1472 forward. Two-way before launch; once parents have seen one picture, adding more is also additive, not a reversal.
Challenger (CDesO): "The day collage and the tray promise a set; one picture breaks the story of a day." Answered: cards still show up to four tiles from the library read (F2) because that is a read, not an attach; the attach path is what is limited to one.
Hands: none.
Sources: line 1418; line 553; `ScribePhotoModule.swift:137`; `pending.ts:56`; `docs/BACKLOG.md:7379`.

## 10. R250 and `labels{}`: is it exported

Founder-decided (relayed), words as quoted in section 0: "I agree with all your recommendations. Continue. Approved." The recommendation he approved: `labels{}` is NOT exported in the first release, because free text can hold a child's name and an export is a new promise needing counsel.

Question. R250 (line 1286) says typed place and picture labels stay on this phone, in no backup and no export, or are exported as a labelled section; "OPEN for `privacy` and the founder". `labels{}` is a day key mapped to up to 60 characters of the parent's own words (line 934). `ALIGNMENT-data.md:38` (G4) and line 58 call it the highest-risk field: L4, free text that "can hold a child's name".

Options. (1) Stay on the phone: no backup, no export, a plain statement (R250's default). (2) Export as a labelled section. (3) Do nothing: PR 8 cannot write its 4.6 rows.

Ruling: option 1. `labels{}` stays in `moments.json`, outside `scribe.db`, excluded from iPhone backup and read back (ADR 0032 pattern), never read by the outbox, pull merge, push mapper or export (R162, line 921; canary R257).
Conditions I add, as CDO and CPrivO.
1. A plain statement on the surface where the parent types a label, and in the policy text counsel reads, that says what the field is and what follows: typed day labels do not move to a new phone. It also says the label is kept on this phone and not in an export or backup, scoped to what the field is; no absolute "never leaves" or "stays on your phone" wording (H-11, D5-F4). The disclosure goes to counsel as a row of the claims inventory. Whether a direct phone-to-phone transfer also leaves it out is UNVERIFIED and is not asserted anywhere until tested.
   A named test covers "excluded from iPhone backup" (ADR 0032 pattern, `docs/adr/0032-on-device-sensitive-store.md`): `not yet: PR 8`, added by PR 8.
2. Merge-blocking for PR 8: before PR 8 merges, `data-architect` reads `docs/legal/DELETION_AND_EXPORT_SPEC.md` for whether a parent's own typed words on this phone fall under an export duty (DATA-REQ-052, DSR-R14). Review B read lines 198 ("Export everything is the primary button", run locally), 255 (one local Export of what is still on the phone) and 371 ("export of everything on the phone completes"); those phrases make such a duty plausible (engineering reading, confirm with counsel). The PR 8 body cites the DATA-REQ ids found, and if the exclusion stands, DSR-R14's "export is complete by design" wording is reconciled in chapter 08. I did not re-read the spec myself, and `ALIGNMENT-data.md:38` says its id is UNVERIFIED. If a DATA-REQ requires the export, this decision returns to the founder; a legal default is built until counsel answers (`docs/prd/v2/README.md`, source order item 4, as the CPO skill records it).
3. `DATA_CLASSIFICATION.md` 4.6 gets one row for `labels{}` at L4 with the fields' retention, deletion path (Turn off, Erase, sign-out, account deletion per R246) and the deletion test, in PR 8 (R250 home; `HARNESS-REPLAN-HYBRID.md:29`). `docs/legal/data-policy.md` 4.4 gets a device-store row (privacy decides wording).
The cost, stated plainly. A parent who moves to a new phone loses the day labels they typed. Letters are unaffected. A phone-only store with no backup is the only way to keep a free-text field that may hold a child's name off every other copy.
Risk against return. Return: no new promise about what an export holds, and no child name in a file a parent hands to someone else. Risk: lost labels on a phone change; a gap against any export duty (condition 2).
The way back. Add a labelled export section later with counsel's reading and a policy line. The reverse (promising export, then removing it) would be a broken promise, which is why we do not start there.
Challenger (CPO): "A parent's own words that vanish on a new phone breaks 'what you made stays yours' (principle 6)." Answered: that principle covers letters; a label is a card hint, not a letter. If counsel or the export spec says otherwise, condition 2 sends it back.
Hands: counsel's read of the export line (founder spend); none otherwise.
Sources: line 1286; line 934; `ALIGNMENT-data.md:6, 38, 58`; `HARNESS-REPLAN-HYBRID.md:29`.

## 11. RV-23 The door as its own reversal

Question. Sign RV-23 as a fifth signature beside the four of G10, so one signature does not carry it (line 116, G10 at line 1123, O-42 at line 1398). RV-23 says: the picker door (a sheet with Apple's picker, pictures only first) is part of the first Moments release under F1, independent of the library gates but not of counsel or the photo flag's legal set (R278).

Options. (1) Approve RV-23 as written, conditional on the R278 set. (2) Fold RV-23 into the four. (3) Do nothing: G10 cannot pass for the door.

Ruling: option 1, as its own entry, with the O-52, O-62 and O-56 rulings above attached so it reads "one picture, below the ask card, same build as the legal set". It approves building behind F1; it does not flip the flag. The flip needs: counsel's Q5 to Q7 and Q9 answered or defaulted, PRs 11a, 18a, 18b-0, 18b-1a, 18b-1b, 19b and 25a exist, and the G11a-photo line is on file.
What G10 still needs. G10 says "founder signs" and "the entry" (line 1123). The D-### entry must carry the founder's words (`docs/DECISIONS.md` entries that are not his recorded words are founder-only, CTO skill section 3). So the council cannot create the entry on its own: Karma records the 21 Nov delegation and reply in his words in the entry. Whether that satisfies G10 is Karma's call. Recorded here, not decided.
Risk against return. Return: the door can be built and reviewed while the legal set is prepared. Risk: a signature mistaken for permission to ship; the guard (25a) is the check.
The way back. Do not flip the flag; revert the PRs.
Challenger (CLO): "A reversal signed before counsel answers invites 'it was approved' pressure at submission." Answered: the entry states the flip conditions in one list and the guard fails the build without them.
Hands: Karma files the entry with the founder's words. No physical founder step.
Sources: line 116; line 1123; line 1398; `HARNESS-REPLAN-HYBRID.md` section 1 text.

## 12. Roster `backlog_owner_names` for `product` and `security-architect`

Question. `docs/BACKLOG.md:2054` records that `Owner: product` is rejected because the product agent has no owner name (`scripts/agents/lib.test.mjs` requires every owner role to map to an agent), and `docs/agents/handoffs/MOMENTS-NS53-HARNESS-HANDOFF-21nov.md` shows BL-1448 and BL-1450 carrying `founder` and "security engineer" because neither handle has a name. `agents/roster.json:74` (`product`) and `:233` (`security-architect`) both have `"backlog_owner_names": []`.

Options. (1) Add one natural name each. (2) Add the bare handle too, because `content` and `legal` already use bare handles. (3) Do nothing: the harness keeps mapping those rows to other roles or to the founder.

Founder-approved (relayed). Exact JSON, tested here: I applied it to a scratch copy of `agents/roster.json`, ran `node scripts/agents/check.mjs` ("agent team is consistent") and `node --test scripts/agents/lib.test.mjs` (31 pass, 0 fail), then reverted. No name collides with an existing one (the current set was listed by script). This PR does not carry the roster edit.

```json
{
  "handle": "product",
  "title": "Product Manager",
  "department": "product",
  "backlog_owner_names": [
    "product manager",
    "product"
  ],
  "kind": "planner",
  "daily_runs": 3,
  "wip_limit": 2
}
```

```json
{
  "handle": "security-architect",
  "title": "Identity and Security Architect",
  "department": "standards",
  "backlog_owner_names": [
    "security architect"
  ],
  "kind": "steward"
}
```

(Replace only the `backlog_owner_names` array in each entry. Do not paste the whole snippet: the other keys are shown for placement only, and the file also has `daily_runs: 2`, `wip_limit: 1` and `review_paths` on `security-architect` that this snippet omits and a paste would drop.) The two-name list for `product` lets the coordinator's existing `Owner: product` text pass; "security" stays with the `security` handle, so I did not add it.

Cautions, for whoever opens the roster PR.
1. `agents/roster.json` is in the `security-architect` `review_paths` and `.claude/**` and `scripts/agents/**` are too. That steward cannot give the counted review on a PR that widens its own task intake. Another lens (the `principal-architect` or red team) gives it, and Karma merges (CR-70, CR-73; the `review-gate` skill).
2. Once named, the dispatcher can assign tasks to these handles (`docs/agents/OPERATING_MODEL.md:31`). Whether the dispatcher assigns work to a `planner` kind handle is UNVERIFIED; I did not read `scripts/agents/` dispatch code. Check before relying on it. BL-1448 still needs the founder's label to merge, so its Owner stays `founder`.
3. A steward that writes under `docs/security/**` while also being the reviewer for that path needs a different reviewer. BL-1450 (18b-0, threat-model rows, docs) is the intended use.
Risk against return. Return: 18b-0 and product-written rows get an owner the harness accepts. Risk: a steward doing authored work erodes its independence as reviewer; the second caution handles it.
The way back. Remove the names; `check.mjs` flags any backlog row that then names an unmapped owner.
Challenger (CISO): "A steward with task intake is a reviewer marking its own homework." Answered: caution 1 and 3; and the use is narrow (docs rows).
Hands: Karma opens and merges the roster PR (a roster edit is a harness change, T2).
Sources: `agents/roster.json:74, 233`; `docs/BACKLOG.md:2054`; `scripts/agents/lib.mjs:37-48`; `docs/agents/OPERATING_MODEL.md:31`; the handoff doc rows for BL-1448 and BL-1450.

## 13. Follow-ups owed (not done here)

Docs edits, owed to `product` (this PR makes none):
1. D2 and R270 reworded to the O-56 ruling; R106, R120, R253 adopted.
2. R90, R272, 19.4 and C-53 (line 1517) say the first door is one picture (O-62); PR 18b-1c and the multi-picture parts of 19b and 18d marked as waiting on BL-1472.
3. R28's "Not today" word, line 366's "Not now" and R275's "Not this one" brought to one list with effects (O-59).
4. E1 to E3 of `ALIGNMENT-data.md` section 6: the spec names `picker_unavailable` and `system.error.raised` that the analytics catalog does not have, and R282 contradicts itself on a new wire code; consistent with O-49 (no new value).
5. A D-### entry recording the delegation and the founder's reply in his words (Karma).

Hands needed from a human, summarised. Counsel's written answers on the Moments questions (founder spend, O-40). The founder's choice of the O-48 text (recommended or fallback). Karma files the D-### entry and the roster PR. The founder's phone for the G1a-P device read-out. Nothing in this PR needs the founder's hands.

## 14. What this document did not do

No code, migration, spec, decision-entry, roster or catalog edit. No production data read. No outside source read: no Apple page, no statute, no vendor page. I did not read `docs/legal/DELETION_AND_EXPORT_SPEC.md`, `docs/legal/app-store-privacy-labels.md`, the O-18 row text, the analytics instrumentation files or the dispatcher code; each is marked UNVERIFIED where it matters. I did not contact counsel.

Chief Product Officer (Claude role), with the Chief Data Officer (Claude role) and the Chief Privacy Officer (Claude role, not counsel).
