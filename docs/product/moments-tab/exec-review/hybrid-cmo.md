# NS-53 Moments tab, hybrid picker route: executive review, Chief Marketing Officer

Reviewer: Chief Marketing Officer (Claude role, not a lawyer). Date: 21 Nov 2026.
Reviewed: `docs/product/moments-tab/HYBRID-PICKER-DELTA.md` on `wip/moments-picker-delta` at a84f448c7f75480b629000b7997d8c4f18652e2b (read in full); the spec `docs/product/prd/28-moments-tab.md` on `wip/moments-prd` at 1c1e05bc2f1dabc294a4b87aefca9035838f6fe7 (read in the sections named below, not line by line); my earlier review `exec-review/cmo.md` on `wip/moments-review-cmo`; the benchmark.
Fictional family Asha only.

Disclosures first, because they bear on how far to trust me. (1) I am a role a Claude session plays, not counsel and not a marketer with data. I have no parent evidence, no store analytics and no device. Anything about how real parents will feel is judgment and is marked as such. (2) A marketing seat has a built-in pull toward engagement claims and a larger permission grant rate. I have tried to argue against that pull here; where my advice lowers the grant rate, I say so. (3) Every legal and store-rule statement is UNVERIFIED unless it says I read the text this session.

## Verdict: ACCEPT-WITH-CHANGES

The hybrid is better for the customer and for the promise than the frozen spec. It gives a parent who says No something real to do on the tab, it narrows what a store reviewer can object to, and it removes an album chooser, a stored picture id and a viewer that I would have had to explain in public. I do not block it.

What it does not do is create repeat use. The picker door is discoverability for something capture already has (the delta says this itself, section 9, and I agree). The tab's reason to come back is still the unproven hypothesis it was before. Nothing in the launch story may say otherwise.

Counts: 0 BLOCKER, 10 MAJOR, 5 MINOR, 15 findings. My three blockers from the first review (consent sentence, store text truth, screenshots) are now carried in the spec as R192, R193 and R194 (read in the PRD at 1c1e05bc); they are closed in text, not yet in evidence, and the hybrid adds new facets to two of them (EXH-CMO-1, EXH-CMO-8).

Founder rulings stand as given: library read ships in the first release; places and occasions in; faces and people out. Nothing here reopens them.

## What I read, and what I did not

Read this session, primary:
- The delta in full, and the PRD sections 8 (consent), 11 (first experience), 13 (nudges), 16 (content), 22b (rows R192 to R244).
- `CLAUDE.md` content rules; `docs/agents/exec/COUNCIL.md`; the CMO skill; `packages/content/VOICE.md` (notification rules, lines 64 to 70, 153, 160); `packages/content/src/strings.en.ts` (the `notifications` block, lines 719 to 760 on develop); `apps/mobile/src/lib/reminders/planner.ts` lines 270 to 305 and `budget.ts` on the delta branch; `packages/content/src/store.en.ts` (private-by-default paragraph, line 76); `docs/store/notes-for-review-1.0.txt` (its own header says superseded for Build 12).
- Apple App Review Guidelines at developer.apple.com/app-store/review/guidelines, 21 Nov 2026: 2.3.1, 2.3.3, 2.3.7, 2.3.10, 4.5.4, 5.1.1(i), 5.1.1(iii), 5.1.1(iv), 5.1.2(i), (iii), (v), (vi). The page text I received had no "Last Updated" date, so the version date is UNVERIFIED. The text of 5.1.1(iii) and (iv), which the delta marked UNVERIFIED, I have now read (quoted in EXH-CMO-4).
- Apple developer pages, 21 Nov 2026: PHPickerViewController (PhotosUI, iOS 14 and later; the page says the picker is system-rendered, cannot be subclassed, and lists "Availability of PHLivePhoto objects without library access"; it does NOT say in the text I got whether the picker needs library authorization, so that is still UNVERIFIED from the reference, and the delta's WWDC23 summary remains its only source); PHAssetCollectionType.moment (Photos framework, "A moment in the Photos app", "The Photos app automatically creates moments to group assets by time and location", availability iOS 8 to 13).

Read, secondary: the market benchmark by the `b1` lead. The branch you named, `wip/moments-benchmark`, does not exist on the remote. The file is `docs/product/moments-tab/B1-market-benchmark.md` on `docs/moments-benchmark` at 2de1259b47ad820fd01a5128fdde107535863428. Its own delivery note says it was written without a shell and that its review quotes are small samples. I use it only for patterns, labelled SECONDARY, and I did not re-fetch its pages.

Not done: no counsel contact, no trademark search, no device test, no read of Apple's marketing or trademark guidelines for use of Apple's interface in screenshots (UNVERIFIED, see EXH-CMO-8), no edit to any file outside this review, no PR, no merge.

## What the hybrid gets right (so the changes below are read as changes, not objections)

- A parent who declines gets a door that works. That is the honest answer to 5.1.1(iv): "Where possible, provide alternative solutions for users who don't grant consent" (read 21 Nov 2026).
- It lets the Notes for Review lead with 5.1.1(iii): "Where possible, use the out-of-process picker or a share sheet rather than requesting full access" (read 21 Nov 2026). The hybrid is the first version of this feature that can say we did.
- The picker door sits under F1 only, so a failed library gate leaves a tab with a real action in it. That makes my "listing must be true with the library flag on and off" rule (EX-CMO-7, now R193) much cheaper to keep.
- Dropping the album chooser and the stored picture id removes two things I would otherwise have to claim about (an album name on a card, a stored identifier).

## Findings

### EXH-CMO-1 MAJOR: the first-run promise has to be written for three states, and the headline must be the parent's act

Requirements: R69, R79, R120, R193; delta sections 2, 8, 9; EX-CMO-7.
Finding: Before the hybrid, the first-run story had two outcomes: library read granted, or "tab on its no-library content". Now there are three, and they promise different things:
- Granted (Full or Limited): "days suggested from your pictures", Recent, place and date lines. Needs F2 and a passed gate set.
- Declined, Not now, Restricted, or library flag off: "choose pictures yourself". Needs F1 only. True in every build.
- Limited with an outside pick: the parent chose it, so it is the second case.
If the headline promise is "Moments shows you days from your pictures", it is false for the second group, and under the FTC net-impression test (CMO skill section 8, skill read 31 Oct 2026, UNVERIFIED today) a footnote about declining does not cure it. The only promise true in all three is the one the parent performs: pick pictures from a day, then speak.
Change: Lead every public and first-run surface with the act ("Pick pictures from a day, then tell {child} about it"). Suggestions are a second, conditional sentence that appears only where F2 is on and the build is approved with it. In the store, the act goes in the description and screenshots; any "days suggested from your pictures" line lives only in promotional text, after the F2-on build is approved and the release record shows the gates (extends R193, which already says this; the hybrid makes the first sentence available). Add to R120: the first value line on the tab states the act, not the suggestion.
Evidence: R69, R79, R193 read; delta sections 2 and 8 read; FTC statement per skill (UNVERIFIED today).

### EXH-CMO-2 MAJOR: two doors, two meanings, and a third voice we do not control

Requirements: NEW-2, NEW-3, R70, R159; delta section 1 (first-time experience), section 7 (new risks).
Finding: A parent can now meet two things that look alike. "Choose pictures" opens Apple's picker, where Apple's own first-time introduction appears in Apple's words (delta, WWDC23 summary: it explains that the app can only access the selected photos; UNVERIFIED against the live screen). "Show days from my pictures" opens our primer, where we say we read when and where pictures were taken. A tired parent who reads Apple's "only the photos you select" and then our "reads the date, time and place" can reasonably think one of us is wrong. They are both true, because they describe different doors, and nothing in our words yet says so.
Change: Name the two doors by what the parent does and who sees what, in two verbs: one picks ("Choose pictures"), one asks for suggestions ("Show days from my pictures", already the R73 door row). The primer's one sentence must make the difference visible (variant B below does). Add to G4: a task where a parent uses each door and is asked, in their own words, what the app can see after each. If more than a minority of the five cannot say, the labels or the primer change before launch. Do not paraphrase Apple's introduction in our copy; we cannot check it will stay as it is, and we do not own it.
Evidence: delta sections 1 and 7 (WWDC23 summary read by the product lead, not by me); R73 text read.

### EXH-CMO-3 MAJOR: the primer must carry the choice, and I owe the founder three variants

Requirements: R72, R192, R218, R71; PRD 8.4 (no "allow", "access" or "settings" outside the denied line and Me).
Finding: R192 already makes the primer name the date, the time and where, read on this phone, only while the tab is open, with no "does not look at what is in them" until counsel clears it in writing. That closes my first blocker. The hybrid changes what an honest primer is for: once a picker exists, the library read is an optional extra, and the primer is the place where the parent decides whether they want the extra. Saying so is more honest than leaving the picker out of the conversation. It will lower the grant rate somewhat (my judgment, no data); I accept that, and I would rather the grant rate be earned.
Change: Test the three variants in section "Drafts" in G4 (one task per variant, same five parents is not possible, so use the five-parent check for A and B and a smaller read of C). My recommendation is A as the base wording because it is the one R192 already describes and the one counsel is being asked about, with B as the challenger. All three stay one sentence or two short ones and keep Continue and Not now equal (R71). No variant says "allow", "access", "settings", "never", "only you", "safe", "private", "secure" or "stays on your phone".
Evidence: R71, R72, R192, R218, PRD 8.4 read.

### EXH-CMO-4 MAJOR: the review-notes story is stronger now, but it must be concrete about what only the library can do

Requirements: R80, R240, R242; delta section 3 (R80 row), section 12.
Finding: The delta proposes the Notes for Review argue "we use the system picker wherever it suffices; the library read is only for suggestions, Recent and place and date lines, which the picker cannot give" and marks 5.1.1(iii) UNVERIFIED. I have read the text now (21 Nov 2026): "Apps should only request access to data relevant to the core functionality of the app and should only collect and use data that is required to accomplish the relevant task. Where possible, use the out-of-process picker or a share sheet rather than requesting full access to protected resources like Photos or Contacts." Two things follow. First, the argument is the right one, and the hybrid is what makes it available. Second, "relevant to the core functionality" is the part a reviewer will press, and our core is a voice letter. Suggestions are a convenience on the way to the core, not the core. I cannot say how a reviewer will weigh that; it is UNVERIFIED, and it is also why the notes must not over-claim. 2.3.1(a) separately says new features must be described "with specificity" in the Notes (generic descriptions are rejected; read today).
Change: Draft Notes for Review (below) in this order: what the app is; the tab works fully with access refused; what is read, in the primer's own three facts; why the picker alone cannot give suggestions; what is not done (no marketing use, no profile, nothing sent); how to test both ways with the demo sign-in the founder supplies. Do not state a reading of 5.1.2(vi) as settled (R242); counsel answers it. The Notes sit under `docs/release/` as R240 says, and each sentence maps to a source row.
Evidence: guideline text read 21 Nov 2026; R80, R240, R242 read.

### EXH-CMO-5 MAJOR: the spec's lock-screen sentence is stricter than the code that ships, and my nudge lines depend on which is right

Requirements: R131, R138, R234; PRD 13.3 bullet "Lock screen"; `planner.ts`; `strings.en.ts`.
Finding: PRD 13.3 and R234 say a Moments-class note (`typedDay`, `birthday`, `monthAge`) carries no child name and no age or month number "on every setting" / "on any setting". R138 says the same only for names off or App lock. The planner on the delta branch does the R138 version: with names on, the birthday note is "Happy birthday to {child}" and the month note carries the month number (`planner.ts` lines 283 to 297; `strings.en.ts` `notifications.birthday` and `notifications.monthOpen`); with names off it uses neutral variants (`reminderCopy.neutral`, whose text I did not read). So the spec contradicts itself and the code, and "A year of letters" in the birthday body also brushes against the no-count rule (my reading, minor). Which one is right is a product and privacy call, not mine; it changes which of my lines can ship.
Change: Product and privacy to pick one and make R138, R234 and 13.3 say it. My lines below are written to the stricter reading (no name, no occasion word on any setting for the three Moments classes) so they pass either way; the evening class keeps the existing name rule. Until the choice is made, no Moments push copy is final.
Evidence: `planner.ts` and `strings.en.ts` read on the delta branch and develop; PRD 13.3, R138, R234 read. Class membership of `libraryDay` (a ranked source inside the `typedDay` group, `budget.ts` lines 9 and 47 to 62) read.

### EXH-CMO-6 MAJOR: cadence, with one rule stated plainly: Moments replaces a reminder, it never adds one

Requirements: R130 to R135, R197; 13.3, 13.6; benchmark section 4 (SECONDARY).
Finding: The spec's ceilings are one budgeted note per local date and 60 in 92 days (13.3; `budget.ts` `TOTAL_MAX` = 60 for pending notes). A ceiling is not a cadence. The parent's own choice at first run is "a couple of evenings a week, at a time you pick" (`strings.en.ts` line 186, read). If Moments signals can fill the ceiling instead of the parent's choice, the hybrid has quietly raised the pressure on a parent. The benchmark's cross-cutting complaints (SECONDARY, small samples) are the same ones I would expect: reminders after you already acted, marketing bundled with the useful prompt, resurfacing that hurts. Also, a parent who stays on the picker door produces no signal at all; there is nothing to nudge from, and I do not want anyone to "fix" that by sending more.
Change: Add one rule: a Moments signal takes the place of an evening note on the same date; the parent's chosen cadence is the cap, and the 60-in-92 ceiling is a safety limit, never a target. Whether the planner enforces the parent's cadence as a cap beneath the ceiling is UNVERIFIED (I did not read the whole planner); `mobile` to confirm. State what we never do, as a content-rule test where a string can show it and a PRD line where it cannot: no second note after the parent opened the app or made a letter that day (R133 already); no win-back, "we miss you" or lapsed-parent ladder; no weekly digest; no note because a picture exists; no escalation after a No. Email stays as R197 has it: one message per parent-chosen date, no series, phase 2, dark until RV-09 and counsel.
Evidence: R133, R197, 13.3, 13.6 read; `budget.ts` and `strings.en.ts` read; benchmark SECONDARY.

### EXH-CMO-7 MAJOR: what drives repeat use ethically, and what we must not claim yet

Requirements: R123, R159, R260, E2, E4; 4.4; VOICE.md line 153; delta section 9.
Finding: The honest list of what can bring a parent back without a hook is short:
1. A finished set. For you ends; there is no feed, nothing waiting, no count (R123, benchmark principle 1). A parent can be done and feel done.
2. The parent's own dates. A day they typed, a date they ticked, a birthday or month day they gave us. These carry the strongest reason, because the parent asked for them.
3. The fixed question, chosen by the child's age from the 111 prompts. It is the same on a day with pictures and a day without, so it works for the parent who stays on the picker door.
4. The product itself: a voice letter is a thing the parent wants to have made. The tab is a way to find the day, not the reason to speak.
5. Silence after acting (EXH-CMO-6).
What does not belong on the list: streaks, counts, "x days since", badges, "you have N", a reminder after the parent has acted, scarcity as pressure, and "memories" that surface a hard day. The picker adds none of these, which is its virtue. It also adds no signal that a parent will come back; the delta says so (section 9), the PRD says the daily-return hypothesis has no parent evidence (R260), and analytics is off for the 1.0 line (D-095, per the CMO skill, read 31 Oct 2026). So there is no way, and I would not want a way, to measure return from the library.
Change: (a) No public line, store line, launch post or onboarding string says the tab brings parents back, helps them write more, or builds a habit; VOICE.md already bans "daily", "every day" and a daily rhythm (line 153). (b) The only repeat-use evidence we collect before launch is the five-parent check and the card sort, with a parent's own consent. (c) After launch, repeat use is read from App Store Connect aggregates and from a parent who tells us, never from the library and never from a library-derived event (R131, R135). Parent quotes from any study leave only through the CMO with written consent and any code or early access disclosed (EX-CMO-15, R200).
Evidence: R123, R260, 4.4, VOICE.md read; delta section 9; analytics-off per skill (UNVERIFIED today).

### EXH-CMO-8 MAJOR: naming and screenshots, with two facets the hybrid adds

Requirements: R8, R194, O-28; NEW-4 (host sheet heading); delta section 7; EX-CMO-3, EX-CMO-10.
Finding: R194 (screenshots hide the tab bar or mask it; a frame check fails any frame whose accessibility tree names the tab) stands and is right. The hybrid adds two things R194 does not cover. (a) NEW-4 gives the host sheet "our own heading". If that heading is "Moments", the name appears in the one new screen the store set will most want to show, with the picker in it. (b) A frame that shows Apple's inline picker shows Apple's interface, Apple's badges and selection numbers, and photographs. I have not read Apple's marketing or trademark guidelines for showing Apple's interface in a store screenshot or for naming Apple's Photos in text; that is UNVERIFIED. Guideline 2.3.3 only says screenshots "should show the app in use" (read today).
On the name itself, one new fact and no new clearance. Apple's own Photos framework has a collection type called `moment`, described as "A moment in the Photos app" that groups assets "by time and location", available iOS 8 to 13 (read today, developer.apple.com/documentation/photos/phassetcollectiontype/moment). That is an API term for a historical Photos grouping, not a trademark, and I draw no legal conclusion from it; I mention it because a feature named Moments that reads when and where pictures were taken sits next to a Photos concept of the same name, and a reviewer or a journalist may notice. My earlier name evidence (WeChat Moments, Facebook's closed Moments app, one Justia record) is unchanged and thin; clearance is counsel's through the CLO (counsel Q10 and the packet's Moments question).
Change: (a) The host sheet heading comes from a content key that is not the tab name; "Choose pictures" or the day's date is enough. Add to R194's frame check: it covers the host sheet as well. (b) A store frame that shows the picker uses only Asha synthetic pictures, no real people, and is shown only if the founder approves it after the Apple-interface question is answered; the safer default is a frame of our own day sheet and capture screen, which show the same act. (c) No public line says "Apple Photos", "your Photos app" or names Apple's picker (EX-CMO-14 stands). (d) Keep the one-key label and the named fallback of R194. I do not rule on the name; the founder and counsel do.
Evidence: R194 and NEW-4 read; Apple guideline 2.3.3 and the Photos framework page read 21 Nov 2026; WeChat, Facebook and Justia items are from my first review (titles and one opened record, UNVERIFIED beyond that).

### EXH-CMO-9 MAJOR: the picker path needs its own claims rows before any line is written

Requirements: R88, R91, R95, NEW-1, NEW-3, NEW-5, NEW-7; R193; EX-CMO-8.
Finding: The picker path has facts that are easy to over-claim: the stripper removes location and other metadata from a picked picture (NS-01-R17, per the delta; the delta's inference is that this holds with Full access where Apple's own location-strip option is absent, section 1); the date chip is read inside the native module and nothing else; an iCloud original may download after a pick (R91 carve-out); a picked file's temp copy is removed on back-out and Erase (NEW-7); a kept letter holds a stored copy that is part of an iPhone backup (R235). None of these is a claim yet, which is the point: each public sentence about them needs a row first.
Change: Add rows to the claims inventory in the CMO's format (words, surfaces, decision of record, proving code or test, profiles where false, verdict), none shipped until proved:
- "Pictures you choose are added to your letter without the place they were taken." Proof: stripper test on a picked file with GPS, all three producers (R88). Hold until the L0 test exists.
- "{app} sees only the pictures you choose." Proof: NEW-5 plus a call-site scan; true only on the picker path. State the path, not the app.
- "Choosing pictures does not ask for access." Proof: R70 L1 scan that the picker never calls the authorization request. True only if that scan exists.
- "{app} reads the date, time and place of your pictures on this phone." Proof: R192, R37, R61, R162. True only where F2 and F2b are on; scope it by the build.
Do not write "never leaves your phone", "stays on your phone" or "only the pictures you pick" about the product as a whole; accounts and sync exist (D5-F4).
Evidence: delta sections 1 and 3 read; R88, R91, R235 read.

### EXH-CMO-10 MAJOR: dropping "Leave out this picture" has a customer cost the delta does not name

Requirements: R56, R57, R247, R255; delta Q2; benchmark section 4 point 3 (SECONDARY).
Finding: The delta drops R56 because "a parent who does not want a picture simply does not tick it." That is right for the day sheet, which the parent opens on purpose. It is not true for the For you card's lead tile, which the engine picks and the parent sees without choosing (the grouping and collage rows R37 to R55 and R208). If the lead tile is a picture the parent does not want to see that morning (illness, a hospital stay, a hard anniversary), the only remedy left is "Not this one", which hides the whole day, including the pictures they might want. The benchmark's evidence (SECONDARY) is that "cannot remove it once shown" is the specific thing parents complain about. I think the drop is still right, because a stored picture id is a real data cost and EX-CDO-9 and EX-PRV-6 dissolve with it; but it is a trade, and the founder should see it as one.
Change: Accept the drop on one condition: G4 includes a task, "a picture on a card you did not want to see", and if even one of the five parents hits it, R56 returns for the lead tile only or the engine never leads with a picture for a year-ago or hard-stretch day (R24). Say so in the Q2 answer. Do not let a "Hide this day" line become the answer by default without that check.
Evidence: R56, R57 and the delta read; R37 to R55 and R208 as cited in the delta; benchmark SECONDARY.

### EXH-CMO-11 MINOR: the picker door must not read as "add photos"

Requirements: NEW-2; EX-CMO-9(b); BRAND.md positioning.
Finding: The positioning of record is the voice and the letter, with the camera roll as the thing we are not (BRAND.md contrast line, per my first review). A visible door labelled "Choose pictures" on the tab, in every state, makes the tab look like an add-photos screen.
Change: Keep the verb as the label, but keep the job line "Choose a day to tell {child} about." above it, so the picture is a way to find the day and the start control leads to speaking. No public line markets the door as photo storage, an album or a feed.

### EXH-CMO-12 MINOR: Apple's selection numbers are Apple's; ours must not copy them

Requirements: NEW-3, NEW-6, R157, R208; delta section 7.
Finding: The delta notes Apple's picker draws selection numbers and badges we cannot remove, against our no-counts rule, and says the rule is about gaps and things waiting. I agree that it is, and that a count of what the parent just ticked is not a gap. The risk is in our own words: a Start control that reads "Start with 3 pictures" imports a count into our copy, and a screenshot caption could do the same.
Change: Our Start control, host sheet and any caption carry no number. Add to the content test for NEW-3 strings: no digit and no count word in the Start or Cancel keys.

### EXH-CMO-13 MINOR: prepare three launch notes, not two

Requirements: R193; EX-CMO-7; delta Q5.
Finding: My first review asked for two launch notes (library on, library off). With the hybrid there are three: library read approved and on; library read on but the parent declined or limited it; library flag off or a gate failed. The second is the commonest parent experience on day one and has no note.
Change: Prepare all three, in plain words, none promising what the build lacks. The What's New text (guideline 2.3.12 per the CMO skill, UNVERIFIED today) describes only the significant change in that build. The library-off note is the one ready to send the day a gate fails.

### EXH-CMO-14 MINOR: deferring the viewer needs a size test, not only a cut

Requirements: R149, PR 20; delta Q4.
Finding: With the viewer deferred, a parent chooses among near-identical pictures of a baby from small tiles. That may be fine, or it may make them choose blind and discover the choice only in capture. I have no parent evidence.
Change: Accept the deferral, add a G4 task choosing between two similar pictures from the day sheet, and set a minimum tile size in design (Design owns it). If a parent cannot tell the pictures apart, a single-picture enlarge (the reduced PR 20 of the delta, about 150 lines, ASSUMED) is back on the list.

### EXH-CMO-15 MINOR: process note on the benchmark and on claims I made from it

Finding: The benchmark file is not on the branch the brief named, was written by a session with no shell, and its review samples are two to three reviews per product. I used it only for patterns and marked them SECONDARY. If a number or a quote from it is ever used in a public line, it must be re-read from its source first.
Change: The `b1` lead to confirm the branch and head sha; no content in this review depends on a benchmark number.

## Drafts

All drafts obey the content rules (no em or en dashes, curly quotes, ellipsis characters or emoji; no fear, guilt or loss; `{child}` never gendered; no "we" outside sanctioned promises). They are PROPOSED. `content` and counsel write final words; the founder approves anything the public sees.

### Three primer variants (the one sentence; Continue and Not now stay equal)

A, base (R192 wording, closest to what counsel is asked):
"{app} reads the date, the time and the place of your pictures, on this phone and only while Moments is open, to suggest days to tell {child} about."

B, choice first (challenger; the only variant that tells the parent the picker exists):
"You can choose pictures yourself any time. If you would like suggestions, {app} can read the date, time and place of your pictures, on this phone, while Moments is open."

C, shortest (for a small screen or AX sizes; two plain sentences):
"To suggest days, {app} reads the date, time and place of your pictures. It happens on this phone, only while Moments is open."

Notes: none says "allow", "access", "settings", "private" or "stays on your phone". None says the app does not look at what is in the pictures (R192: only if counsel clears it in writing). B is two sentences where R218 asks for one; if the founder wants one sentence, merge as "You can choose pictures yourself any time, or let {app} read the date, time and place of your pictures, on this phone and only while Moments is open, to suggest days." The "Decline" door line (turning this off leaves pictures already in letters) sits behind the R218 disclosure.

### Five nudge lines (push; PROPOSED; under 60 characters each part; no exclamation marks; none contains picture, photo, place, day, weekend or the tab name, which R196 bans)

Each is a candidate for the existing evening pool or the neutral set, so that a library-timed note (phase 2) can use one word for word (R135). Lines 3 to 5 carry no child name, age, month number or occasion word, so they pass either reading of EXH-CMO-5.

1. Evening class. Title: "Anything to tell {child}?" Body: "A few words is plenty. Or tap Not much today."
   (Close to an existing key and to VOICE.md's "Good" example. "today" appears; R196 names "day", and existing keys already use "today" and "weekday", so the content test is presumably word-bounded: UNVERIFIED, content to confirm. If not, drop "today" and "Not much today" together.)
2. Evening class. Title: "{child}'s book is open" Body: "One sentence is a whole letter."
3. Neutral, any class, safe on a locked screen. Title: "Something for the book" Body: "Whenever you have a minute. Just talk."
4. A date the parent set (`typedDay`, ticked). Title: "A reminder you set" Body: "Tap when you are ready. A few words will do."
5. Birthday and month-day class, names off or the stricter reading. Title: "Your book is here" Body: "Read a few letters, or add a new one."

Why these: each invites and is easy to ignore, none counts or names an absence, none says what the phone looked at, and the picker produces no signal so none depends on it.

### One email (phase 2, dark until RV-09 and counsel; commercial standard whatever counsel rules, as R197)

Subject: "The reminder you set in {app}" (states the reason, no child name, no count, no urgency, no "moments", no "memories").
Body line: "You asked {app} to remind you about a date you chose. Open the app when you are ready and say a few words." Postal address, one-click unsubscribe and the rest as R197 and `docs/emails/COMPLIANCE.md`. One message per chosen date, never on a date with a budgeted push or a made letter, no series.

### Store story (draft lines; true in every build unless marked)

True with F1 only (description and screenshots): "Pick pictures from a day you want to remember, then say what was happening. Your words stay yours." (The second sentence is the letter promise, scoped to the letter as EX-CMO-9(a) asks: "It never adds a word to your letter.")
Promotional text only, live only after the F2-on build is approved and the gates are on record (about 125 characters; the field allows 170 per the CMO skill, Apple's product page read 31 Oct 2026, UNVERIFIED today): "Let the app suggest days from the date, time and place of your pictures, read on this phone, or choose pictures yourself any time."
Never: "Moments", "stays on your phone", "no account", "private" as a bare headline, "Apple Photos", "memories", "highlights", "daily", "every day", "never ask again".

### Notes for Review (structure; counsel and the founder write the words; the founder supplies the demo sign-in)

1. What the app is: a baby memory book parents fill by talking; letters are never rewritten; not a health service.
2. The Moments tab has two ways to pick pictures. The system picker works with no permission in every state. The library read is optional and powers suggestions, recent days, and date and place lines, which the picker cannot give.
3. With access refused, limited or restricted, the tab, Export, Delete and the whole capture flow work (R79).
4. What is read: the date, time and place of pictures, on the phone, while the tab is open (R192). What is not done: nothing leaves the phone from the library; no marketing, advertising or use-based data mining; no profile; no contact outreach (counsel's reading of 5.1.2(v) and (vi) pending; do not assert it).
5. The permission can change pictures and our code does not (R233).
6. How to test: demo sign-in, then the tab with access granted, then limited, then refused; the host sheet and the picker door in each.

## Answers to the delta's founder questions Q1 to Q5

(Section 11 of the delta. If you meant the six test items of the brief, they are answered in EXH-CMO-3 (primer), -4 and the store story (listing and notes), the nudge drafts and EXH-CMO-6 (copy and cadence), EXH-CMO-1 (first-run promise), EXH-CMO-8 (naming) and EXH-CMO-7 (repeat use).)

Q1, where does the inline picker live? Agree with the default: inside a full-height sheet, not as the body of the tab. For marketing the reason is control: a sheet gives us a frame we can screenshot or leave out, and keeps Apple's first-time introduction off the first screen of the tab where it would speak before we do. Conditions: the sheet heading is not the tab name (EXH-CMO-8a); Start and Cancel carry no number (EXH-CMO-12).

Q2, drop the album chooser and "Leave out this picture" now? Drop the album chooser: yes, and it closes O-14. Drop "Leave out this picture": yes, but conditionally. The cost is that a picture on a card's lead tile can no longer be removed alone (EXH-CMO-10). Accept it only if G4 asks about a picture a parent did not want to see, and bring R56 back for the lead tile if one parent hits it.

Q3, date chip only, or a place label too, for a picked picture? Date chip only. For a public promise this is cleaner: "date" for a picked picture, "date, time and place" only for suggestions. A place from a picked file would add the location questions (Q3 and Q4 of the counsel list) to a path that otherwise has none, and would complicate the "choosing pictures does not ask for access" claim (EXH-CMO-9).

Q4, defer the viewer? Defer pinch and pan; accept deferring PR 20 with one test: a parent can tell two similar pictures apart from the day-sheet tiles (EXH-CMO-14). Design sets the tile size. If it fails, the reduced viewer returns.

Q5, picker door under F1 alone? Yes, and it is the most useful decision in the delta for the launch story: a promise about choosing pictures can be made in every build, and a promise about suggestions only where F2 is on. Add the guard check as the delta says, and make the listing (EXH-CMO-1, -13) follow the same split.

## What I need from the founder (nothing is applied)

- Approve or reject every public line above; I prepare, he ships.
- Choose between the strict and the shipped lock-screen reading (EXH-CMO-5), with product and privacy.
- Decide, by a named date, whether screenshots hide the tab bar and the host sheet heading, or wait for name clearance (R194, EXH-CMO-8).
- Decide whether a store frame may show Apple's picker, once the Apple-interface question is answered (EXH-CMO-8b).

Open for others: `mobile` (does the planner treat the parent's cadence as a cap under the 60-in-92 ceiling), `content` (word-bounded test for R196; neutral set text), `privacy` (strict or shipped lock-screen reading), the CLO (the name and the Photos-framework term), the CCO (5.1.1(iii) and (iv) as evidence in the Notes), counsel (Q1 to Q10 stand).

## Not verified, in one place

How any reviewer will weigh 5.1.1(iii); whether the picker needs library authorization (the PHPickerViewController reference text I got did not say; the delta rests on a WWDC23 summary); Apple's interface in store screenshots; Apple's version date for the guidelines; any trademark position; how real parents will feel about a picker door beside a primer; the neutral notification text; whether the planner caps by parent cadence; whether `rules.test.ts` matches "day" by word.

Chief Marketing Officer (Claude role, not a lawyer)
