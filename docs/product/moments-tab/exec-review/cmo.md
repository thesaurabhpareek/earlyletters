> v2-era document; dispositions superseded by spec section 27 and 27b at PR #1314; kept as review history.

# NS-53 Moments tab: executive review, Chief Marketing Officer

Reviewer: Chief Marketing Officer (Claude role, not a lawyer). Date: 21 Nov 2026.
Document reviewed: `docs/product/prd/28-moments-tab.md` on `wip/moments-prd` at 5bebd892, read in full (1187 lines, NS-53-R1 to R191, section 25.3 is the pre-filled CMO block).
Scope: positioning, App Store listing and screenshots, the public claims this feature makes, push and email nudge wording, launch story, and anything that would read as watched.

## Verdict: ACCEPT-WITH-CHANGES

The product idea is sound and the brand fit is better than I expected: a tab that starts from a day the parent already owns, never writes for them, and says no to counts and streaks. The firewall F1 to F8, the closed reason list and the "no library data in any outbound channel" rule are the right marketing posture. I am not blocking the founder rulings (library read first, places and occasions in, faces and people out).

I am accepting on these conditions. Three are blockers for store submission and for any public word.

1. The primer and purpose string must say the app reads where pictures were taken as well as when (EX-CMO-1). As written the one sentence the parent consents to omits the thing that makes place cards possible.
2. Every store, site and review-notes line that says or implies "stays on your phone", "no account" or "no photo feature" must be rewritten for the production profile with the library read on, in the same build, with a code check behind each claim (EX-CMO-2).
3. No store screenshot, preview or website image may show the four-tab bar while the word Moments is counsel-gated (EX-CMO-3). R8 and the screenshot set cannot both hold today.
4. The library-timed push example "Some pictures from the weekend are here" is removed from 13.3, and a push never mentions pictures (EX-CMO-5).
5. The lifecycle email drops date-of-birth as a source and matches `docs/emails/COMPLIANCE.md` section 7 (EX-CMO-6).
6. The "five parents, nobody says 'I did not expect it to know'" bar becomes a launch gate for place and occasion cards, not only a halt on the signal (EX-CMO-4).

Counts: 3 BLOCKER, 7 MAJOR, 6 MINOR, 16 findings.

## What I checked and where I stopped

Read this session: the whole PRD; `docs/agents/exec/COUNCIL.md`; `packages/content/BRAND.md` (positioning, glossary, proof discipline); `packages/content/VOICE.md` (notification rules, content rules); `packages/content/src/store.en.ts` (listing, screenshot captions, review notes); `docs/store/notes-for-review-1.0.txt`; `docs/legal/privacy-policy.md` (build list), `docs/legal/app-store-privacy-labels.md` line 54; `docs/legal/COUNSEL_PACKET.md` (Q10, section 6 item 9); `docs/emails/COMPLIANCE.md` (sections 0, 1, 7, 9) and `docs/emails/CATALOG.md` ("Never" table). Outside world, read 21 Nov 2026: Apple App Review Guidelines at developer.apple.com/app-store/review/guidelines (5.1.2(vi), 5.1.1(iii), 5.1.1(iv), 5.1.2(i), 4.5.4, 2.3.1, 2.3.7, 2.3.10; the page text I received had no "Last Updated" date, so the date of the version is UNVERIFIED); a Justia trademark record; search result titles for WeChat Moments and the 2019 closure of Facebook's Moments app (titles only, pages not opened). CAN-SPAM, FTC and California statements below rely on the CMO skill's own dated read (31 Oct 2026) and are marked "skill read" where used; I did not re-read them today.

Not done: no counsel contact, no trademark search beyond one Justia page, no edit to any file outside this folder, no PR.

## Findings

### EX-CMO-1 BLOCKER: the consent sentence leaves out location

Requirements: NS-53-R72, R37, R61, R63; sections 7a.1, 8.5, 16; RV-19.
Finding: Section 8.5 gives the primer intent as "{app} reads the date and time of your pictures on this phone to show you days. It does not look at what is in them." Section 16 repeats it. But READ_SET_V1 now includes the picture's location coordinates (R37, RV-19) and places are in the first release (R61, R63, RSN-PLACE). A parent who agrees to "date and time" and then sees a card that says "Pictures from Lisbon" has been told one thing and shown another. The FTC judges net impression on a reasonable consumer, so "date and time" plus "does not look at what is in them" reads as a promise that nothing like place is used (FTC Policy Statement on Deception, skill read). That is the "I did not expect it to know" failure the PRD itself fears (R60, E7), created by our own sentence. R72 says the purpose string names every use, but the intent text that content will write from does not.
Proposed change: Change the 8.5 and 16 intent to name when and where: "{app} reads when and where your pictures were taken, on this phone, to show you days. It does not look at what is in them." Add to R72: the primer, the purpose string and the Me row use the same three facts (date, time, place from location), and a content test fails if the place source is on and the key does not contain the place word. "Does not look at what is in them" stays only if counsel agrees it is true while thumbnails are drawn (we show the picture, we do not analyse it); content to choose a plainer verb than "look at" if counsel prefers. Wording remains content's and counsel's.
Evidence: PRD lines 313, 388, 435 to 439, 797; repo read. No outside fact needed.

### EX-CMO-2 BLOCKER: today's store, site and review text is written for a build that will not exist

Requirements: NS-53-R80, R81, R169, R175; sections 17, 21 ("Also in force before submission"); RK-9.
Finding: The listing source says "Without an account, your book stays on your phone" (`packages/content/src/store.en.ts`, PRIVATE BY DEFAULT) and the Build 12 review-notes file is marked "SUPERSEDED ... DO NOT PASTE" and still says "NO ACCOUNT ... Everything is stored on the device". The label doc says "Photos or Videos: No. No photo feature in v1.0" (`app-store-privacy-labels.md` line 54). The privacy policy build list says the first store build has servers off (`privacy-policy.md` line 21), which the counsel packet already calls wrong (`COUNSEL_PACKET.md` section 6 item 9). The PRD itself says the first store submission is the production profile with server features on (section 17, RK-9). So the moment the library read ships, four public statements are false or misleading at once: the listing, the review notes, the label and the policy. Apple treats misleading metadata as grounds for removal (2.3.1(a), "marketing your app in a misleading way"; 2.3.1(b), "if you're dishonest, we don't want to do business with you"; read today). R81 covers the label and policy. Nothing in the PRD owns the listing text, the screenshot captions or the website.
Proposed change: Add a row, P0 (b), phase 1, owner CMO with `content` and `legal`: before submission, every public line that says "on your phone", "no account", "keeps everything on the phone" or "private" is re-proved against the production profile with the library flag on and either rewritten or backed by a named code check. The specific library claim, if made at all, is narrow and testable: "The dates and places of your pictures are read on this phone and are not sent to us", backed by R162 (canary test), R43 and R61 scans and R116 (no server column). Do not claim "stays on your phone" about the book as a whole; accounts and sync exist (D5-F4 already says this). Add the listing, screenshot captions and website to G6 ("content rules") so a reviewer must sign them. Founder approves every public line (skill section 5); counsel reads the "never sold, never used for ads, never used to train" practices through Q16 and Q17.
Evidence: `store.en.ts`, `notes-for-review-1.0.txt`, `app-store-privacy-labels.md:54`, `privacy-policy.md:21`, `COUNSEL_PACKET.md` section 6 item 9, PRD lines 816 and 936; Apple guidelines 2.3.1 read 21 Nov 2026.

### EX-CMO-3 BLOCKER: screenshots will carry the word Moments

Requirements: NS-53-R8, R176, R189; G6; O-28; RK-11.
Finding: R8 says the store listing, name, subtitle, keywords, screenshots, previews and website do not say "Moments" until counsel clears the name. But the tab bar is on every Home, Moments, Book and Me screen, so any ordinary store screenshot (the current set is 8 frames in `store.en.ts`) shows "Moments" in the bar. App Review expects screenshots to show the app in use. The PRD has no rule for how to satisfy both. Left alone, the first screenshot export either breaks R8 or someone crops the bar late in the week of submission.
Proposed change: Add to R8: store screenshots and previews are captured from screens that hide the bar (Listen, Review, Keep, the letter page, the day sheet) or the bar is masked in the frame, and a frame check in the store lane fails any screenshot whose accessibility tree names the tab; or counsel clears the name before the screenshot freeze and R8 relaxes for screenshots only. Decide which by a named date, because screenshots are slow to redo and cached. Caption for any frame that shows the feature, without the name: "Pick a day from your own pictures." Founder approves the frame set.
Evidence: R8 text (line 174); `store.en.ts` screenshot list; Apple 2.3.1(a), 2.3.7 (metadata and screenshots must not carry irrelevant or misleading content) read 21 Nov 2026. Whether Apple counts an in-app tab label as metadata is UNVERIFIED; the risk here is counsel's, not Apple's.

### EX-CMO-4 MAJOR: places and occasions are where a parent will feel watched

Requirements: NS-53-R60, R63, R64, R16, G4, E7, U23 to U26, RK-3, RK-4.
Finding: The product rule is right (computed on the phone, ours, replaceable, hideable). The marketing risk is the first sighting. A parent who consented to a primer sees an unprompted "Pictures from Lisbon" or "From a first you marked" with no hint of where it came from. Today the halt rule is "any parent says 'I did not expect it to know' halts that signal until privacy reads it" (R60); that is a stop after the fact, not a pass bar for launch. Two further points: the home place is computed in memory and used to decide which days are "away", which is a quiet inference about where the family lives even though it is never named; and the card reason list shows what we computed but not why we may.
Proposed change: (a) Promote the E7 result to a launch gate for the place and occasion parts in G4: if any of five parents says they did not expect it to know, the place line ships off in that build (F2 stays on for dates; place resolver flag off) and the fix is copy or design first. (b) Add a "Where this came from" line in the card menu from a closed content key, truthful and plain, for example that the place comes from the location saved with the pictures on this phone; content writes it. Closed list, not free text, so F2 holds. (c) Keep O-34 default (place shown only when away), and say in 7a.2 that the home place is never shown, spoken in VoiceOver, or used outside the "away" test. Design and privacy own the shape; I own the claim that a parent can always find out why a card appeared.
Evidence: PRD lines 336, 358 to 364, 892, 931; no parent evidence exists (PRD section 20 says so itself). The creepiness risk is a judgment, not data: UNVERIFIED.

### EX-CMO-5 MAJOR: a push example names pictures on the lock screen

Requirements: NS-53-R131, R135, R138, R191; section 13.3; RV-08; O-02.
Finding: Section 13.3 says a library-timed note's title and body equal an existing evening key "word for word", and, a few lines later, "The neutral photo wording ('Some pictures from the weekend are here', NS-51) must pass rules.test.ts ... before it ships." These contradict each other. The second would put a statement on a lock screen that the app has looked at the phone's pictures, which is the opposite of the identical-words rule (R135, R191), is the kind of lock-screen disclosure R138 forbids, and invites a parent's partner or colleague to ask what the app is doing with the photos. It is also close to Apple's 4.5.4 ("should not be used to send sensitive personal or confidential information", read 21 Nov 2026) and to 5.1.2(vi) (Photo API data may not be used for "marketing, advertising or use-based data mining", read 21 Nov 2026): a nudge timed from a picture fact is the sort of use counsel must clear (G2, Q-X1-6).
Proposed change: Delete the "neutral photo wording" bullet and the NS-51 example from 13.3. State as a rule: no push, email, widget or badge ever contains the word picture, photo, place, day or the name of this tab; library-timed or not, the words are an existing evening key. Voice: VOICE.md "Invite, never remind", under 60 characters, no counts, no urgency (read). Keep F4 off until counsel answers.
Evidence: PRD lines 657 to 659, R131, R135, R138; `VOICE.md` lines 64 to 70; Apple 4.5.4 and 5.1.2(vi) read 21 Nov 2026.

### EX-CMO-6 MAJOR: the lifecycle email contradicts the email rules and is not yet shippable

Requirements: NS-53-R140, R141, R142, R143, R188; sections 13.1, 13.6; RV-09; O-03; C-4.
Finding: What I like: opt-in, off by default, one purpose, designed to the commercial standard whatever counsel rules, no library data, dark first and send to the founder only. That is the right framing and I would not rely on "transactional". Problems:
(a) Source conflict. 13.6 says the email may use "the child's date of birth (only with the dob-email choice and RV-09)" and R188 says the job reads date of birth. R140 and C-4 say the server is told only a date the parent chose. `docs/emails/COMPLIANCE.md` section 7 recommends a hard rule of no child name, birthday, age, month of age or due date in any email body or subject, and `docs/emails/CATALOG.md` lists birthday, month-of-age and due-date emails under "Never" because those dates can fall on the worst day of a family's year. The PRD must pick one; I pick the stricter.
(b) Frequency. "At most one a week" describes a series. A reminder the parent set for one date is a single message. A weekly cap invites a schedule we have not designed and reads like a drip campaign.
(c) Subject. Truthful subject is a legal requirement for commercial mail (CAN-SPAM 15 U.S.C. 7704(a)(2), skill read 31 Oct 2026) and a trust one for us. The PRD has no subject rule.
(d) Prerequisites. A postal address has not been chosen (`docs/emails/BRIEF.md` line 29, repo read); sending to Apple Hide My Email addresses needs sending-domain registration with Apple (`COMPLIANCE.md` section 9, repo read, Apple pages not re-read by me, so UNVERIFIED today). Both are founder items and neither is in the PRD's gate list.
(e) Where it sends from: the account email, not a marketing list (COMPLIANCE.md says news mail goes from a separate subdomain and must not use account-wide suppression that would block sign-in; PRD R141 already protects sign-in and safety mail, good).
Proposed change: Strike date of birth from 13.6 "What it may use" and from R188; the only sources are a date the parent chose, with no child name, age or month number. Replace the weekly cap with: one message per parent-chosen date, never on a date with a budgeted push, never when a letter was made. Add a subject rule to R141: the subject states the reason the parent set it up in plain words, carries no child name, no count, no "moments", no "memories", no urgency; content writes it; counsel reads it. Add the postal address and Apple relay registration to the phase 2 gate list. Whether the message is commercial is counsel's call (CQ-17); we ship to the commercial standard.
Evidence: PRD lines 640, 672 to 674, 696 to 697, 959, 1014; `COMPLIANCE.md` lines 17, 387 to 418, 439; `CATALOG.md` "Never" table; `BRIEF.md:29`; CAN-SPAM per skill read (15 U.S.C. 7702, 7704), UNVERIFIED today.

### EX-CMO-7 MAJOR: the listing has to be true with the library flag on and off

Requirements: NS-53-R171, R169, G1 to G10; section 19.3; RK-2, RK-12.
Finding: The PRD's own fallback is that if a gate fails, F2 stays off and "the tab ships on its no-library content". Store text is written and submitted before that outcome is known (review can also reject the usage string: RK-2). A listing line such as "Pick a day from your own pictures" is false in the fallback build and would be a misleading claim under 2.3.1(a). The PRD has no row on listing copy under the two outcomes, no What's New rule (guideline 2.3.12 in the skill's list), and no plan for the launch story if the library part is pulled.
Proposed change: Add a row: the first submission's description, screenshots and subtitle are written to be true in both builds (the letter, your voice, the book, the questions, the days you marked); any line about days from pictures lives only in the promotional text, which Apple lets us change without a new build and which does not affect search ranking (Apple product page guidance, skill read 31 Oct 2026, not re-read today, UNVERIFIED), and goes live only after the build with F2 on is approved and the release record shows G1 to G7 and G10. Prepare both launch notes now; the library-off note is ready to send the day a gate fails.
Evidence: PRD lines 870, 929, 939; guideline 2.3.1(a) read 21 Nov 2026; skill section 8 for promotional text limits.

### EX-CMO-8 MAJOR: the claims registry has no rows for this feature, and the file does not exist

Requirements: new row needed; relates to R72, R81, R135, R143, R159, R162.
Finding: COUNCIL section 4 makes the CMO keeper of the claims registry, with the CCO checking each claim against the build. This feature adds new claims, some stated, some implied: reads only date, time and place; does not analyse pictures; nothing from the library is sent to us; the tab works if you say no; Not now is final; email is opt-in and off by default; reminders use plain words. The PRD owns the tests (canary R162, scans R43 and R61) but never says that each claim gets a row with its words, surfaces, proof and verdict. `docs/legal/claims-registry.yaml` does not exist on this branch (checked), and the inventory I can use is `docs/reviews/2026-10-claims-inventory.md`, last dated 28 to 30 Oct.
Proposed change: Add an NS-53 row, P0 (b): each claim in 8.5, 13 and 16 is added to the claims inventory in the CMO's format (words, surfaces, decision of record, code that makes it true, profiles where false, verdict) before it is written into a screen, store field or email; a claim with no proving test stays "unverified" and is not shipped. Three claims need a "true only while a flag is off" note and a plan for the day the flag turns on: nothing leaves the phone (F3 geocoder off, R62), no library-timed reminder (F4 off), no email from library data (R188). The PRD already ties the label, policy and purpose string to that day (R62); I want the registry row linked to it.
Evidence: COUNCIL.md section 4; PRD lines 389, 435 to 443; file listing of `docs/legal` on the branch (no `claims-registry.yaml`).

### EX-CMO-9 MAJOR: protect the promise, and keep the letter at the centre of the story

Requirements: NS-53-R11, R17, R52, R159; sections 1.4, 3.3 (F1 to F8), 25.4; positioning in `BRAND.md`.
Finding: Two separate risks.
(a) Promise scope. The store listing says "It never adds a word" and "We never rewrite your words ... or write for you". Those lines are true of the letter. But Moments cards will show words we wrote ("Pictures from Lisbon", "A day you marked") next to the parent's pictures at the moment they decide to talk. A reader who sees the two together can take "never adds a word" more broadly than we mean. Under the FTC net-impression test the safe course is to scope the promise to what is true (skill section 7). The firewall (F3, F4, F5) makes our labels visibly ours and keeps them out of letters; that is a strong product answer to the pre-filled 25.4 question, and I accept it. It needs a matching public scope.
(b) Positioning drift. The positioning of record is "letters to your child, in your own words and voice" (BRAND.md, D-139) and its contrast line against photo apps is "Your camera roll keeps the picture. Early Letters keeps your voice." A tab built on the camera roll moves us toward the competitor we position against. The pictures are a way to find the day; the product is still the voice.
Proposed change: (a) In every public line, say "your letter" where the promise is about the letter: "It never adds a word to your letter." Add a content test that the three words "never adds a word" do not appear in a string without "letter" or "your words" in the same sentence, in store and site copy. (b) Launch story rule: the headline claim is the voice and the letter; pictures appear as "a way to pick the day", never as the hero. The photo contrast line stays: "pictures show how {child} looked; letters tell {child} how it felt". Do not market the feature as a photo organiser, memory feed or "highlights" (R11, R52 forbid those words in app; the same list governs press, ads and community posts).
Evidence: `store.en.ts` IT STAYS IN YOUR WORDS section; `BRAND.md` positioning and contrast lines; PRD lines 40, 128, 202; FTC net-impression test per skill section 8 (skill read 31 Oct, UNVERIFIED today).

### EX-CMO-10 MAJOR: the name Moments is crowded and not cleared; make the label cheap to change

Requirements: NS-53-R8, R9, R159; RV-14; O-28; RK-11; D6; PR #1276.
Finding: I checked the outside world today. "Moments" is the name of WeChat's social feed (a Wikipedia entry titled "Moments (social networking)") and was the name of a Facebook photo app closed in 2019 (Fortune, 24 Jan 2019, from search result titles; I did not open the pages). One US trademark record titled MOMENTS, classes 9 and 38, shows as abandoned in 2019 (Justia, opened today); it does not tell us who owns any live mark. That is thin evidence, not a clearance: trademark clearance is counsel's through the CLO (COUNSEL_PACKET Q10 is "Live, unchanged"; skill section 6). Name risk is unverified in either direction. The PRD's default (in-app only, not in store text or website) is correct. Three residual costs if counsel says no after launch: the label is in every user's tab bar and support text; `scribe://moments` is a link; screenshots and press would already carry it.
Proposed change: (a) Add to R8 that the label comes from exactly one content key, the link path and route name are internal and never user-visible, and a fallback label (PR #1270's "Days" or another cleared word) is named now so renaming is a one-key change. (b) Add Q-Moments to the counsel packet next to Q10: use of the word as an in-app navigation label for a feature that groups the parent's own pictures by day, with the three uses above. (c) Update the BRAND.md glossary in the same PR as the tab (the glossary currently bans "moment" as a word for a short piece and lists "Letters (alone)"; RV-14 and R9 handle the scope). I do not rule on the name; the founder and counsel do.
Evidence: Justia record 86790791 (opened 21 Nov 2026); search result titles for Wikipedia "Moments (social networking)" and Fortune "facebook moments closing" (titles only, UNVERIFIED beyond that); `COUNSEL_PACKET.md:159`; `BRAND.md` glossary.

### EX-CMO-11 MINOR: do not let "come back every day" reach the copy

Requirements: NS-53-R123, R159; section 4.4; O-04; G-2.
Finding: The founder's words ("a reason to come back everyday") are in the PRD as a hypothesis, which is honest. `VOICE.md` line 153 forbids "daily", "every day", "every night" and any daily rhythm in anything the product says about itself. The risk is a launch post, store line or onboarding string that borrows the founder's phrase. A related tone point: the tab name echoes "Capture every precious moment", which `VOICE.md` line 23 lists as a phrase to avoid. The name is not banned, but copy around it must not use that register.
Proposed change: Add to R159: the hypothesis never appears in a public string; the closed word list for Moments (R52) is also the banned list for launch and community copy. Keep O-04's default.
Evidence: PRD lines 28, 152; `VOICE.md:23`, `VOICE.md:153`.

### EX-CMO-12 MINOR: the Home pointer is in-app marketing

Requirements: NS-53-R121; O-06; RV-15.
Finding: One quiet line after the first kept letter, once, is acceptable. It must not borrow launch language.
Proposed change: Add: no "new", "discover" or "introducing"; one verb; plain statement of what the tab holds; never reappears after a tap or dismissal (already in R121); not shown to a parent who has already opened the tab. Content writes it.
Evidence: PRD lines 158, 581.

### EX-CMO-13 MINOR: "we ask once" is a behaviour, not a promise to make

Requirements: NS-53-R73, R76; section 8.4.
Finding: R73 is clear: the primer does not return by itself; the small door row and the Me row remain; Denied shows a calm line with Open Settings. A line in a post or listing such as "we only ask once" would be near-true, but the tab always shows a door or a line, which a parent may count as asking.
Proposed change: Do not state "we ask once" or "we never ask again" publicly. Say what is true: "You choose, and the app works the same if you say no" (backed by R79).
Evidence: PRD lines 433, 452, 455.

### EX-CMO-14 MINOR: do not borrow Apple's Journal as a reference

Requirements: NS-53-R82, R94; section 1.2 (founder quote); Route A; O-08.
Finding: The founder's brief says "Apple Journal-like access". That phrase is for the team, not the public. Naming another app in listing metadata is not allowed in the subtitle ("reference other apps", 2.3.7, read 21 Nov 2026), and a comparison to Apple's own app invites a trademark, partnership or accuracy question. If Route A (Apple's journaling suggestions) ships in phase 3, any public mention of Apple's picker needs its own claims row and an Apple marketing-guidelines read (not read today, UNVERIFIED).
Proposed change: Add: no public line compares the tab to another app or names Apple's Journal; Route A, when it ships, is described only by what the parent does ("choose from your pictures"), not by Apple's brand.
Evidence: PRD line 27; Apple 2.3.7 read 21 Nov 2026.

### EX-CMO-15 MINOR: parents in the studies are not testimonials

Requirements: NS-53-R7, R60, R161, R168, R174; section 20.
Finding: The card sort, five-parent check and diary will produce quotes and goodwill. The CMO rules are unchanged: no quote from a study is used publicly without that parent's written consent, disclosure of any code or early access they received, and no selection of only good answers. This protects the brand and sits inside the FTC Endorsement Guides (16 CFR 255, revised 2023) and the Consumer Reviews and Testimonials rule (16 CFR 465, effective 21 Oct 2024) as the skill summarises them (skill read 31 Oct 2026, not re-read today).
Proposed change: Add to R174: findings are internal; a quote may leave the study only through the CMO with consent and the disclosure above.
Evidence: skill section 8 (UNVERIFIED today); PRD lines 898, 799.

### EX-CMO-16 MINOR: "this day last year" pictures can land on a hard day

Requirements: NS-53-R24, R47; K-YEAR (pictures); U19, U24.
Finding: R24 stops year-ago cards in a quiet or hard-stretch state on this phone. The pictures card (RSN-YEAR, R47) is shown from the library alone and the phone has no signal that a date is an anniversary of a loss. The card shows only "Pictures from this day in 2025", which is plain and low risk, but this is exactly where a parent would feel watched or hurt. This is design and privacy's lane; I flag it because a single press quote or review about it would define the feature publicly.
Proposed change: Keep the plain wording; make "Not this one" for a year-ago card also remove that date for all years (R47 says "for good" already; confirm in the golden). Include a year-ago card in the five-parent check's feel-watched question (G4).
Evidence: PRD lines 249, 269, 323, 614.

## Answers to the pre-filled CMO questions (25.3)

1. Is the tab name used only in-app (O-28)? In the PRD text yes (R8, R159, O-28). In practice not yet: screenshots will show the tab bar (EX-CMO-3) and the name has no clearance (EX-CMO-10). Do the value lines avoid claims the label or policy cannot back (13.1, 16)? Not yet: the primer sentence omits location (EX-CMO-1), the listing says "stays on your phone" (EX-CMO-2), and no registry row exists (EX-CMO-8).
2. Is the lifecycle email acceptable to the stricter commercial standard? The design stance is right; the date-of-birth source, weekly cap, missing subject rule, postal address and Apple relay step are not (EX-CMO-6). Is the nudge wording free of slideshow tone? The tone rules are right (R131, R135); one example in 13.3 must go (EX-CMO-5).
3. Pre-filled 25.4 question (brand promise and machine-computed labels): the firewall F1 to F8 answers it in product; it needs a matching scope in public copy (EX-CMO-9).

## Rows to change (summary)

R8, R72, R80, R81, R131, R135, R140, R141, R159, R174, R188, G4, G6, 7a.2, 8.5, 13.3, 13.6, plus new rows for listing truth in both builds (EX-CMO-7), claims registry (EX-CMO-8) and the name fallback (EX-CMO-10). Owner for all: `product` with the CMO, `content`, `legal` and counsel as named. Dates: before the screenshot freeze and before store submission; the phase 2 items before any email send.

## Founder items this review creates

- Approve or reject every public line (listing, screenshots, site, any post); I prepare, he ships.
- Choose by a named date: counsel clears the name for screenshots, or screenshots hide the bar (EX-CMO-3).
- Choose a postal address and own the Apple relay step before any phase 2 email (EX-CMO-6).

Chief Marketing Officer (Claude role, not a lawyer)
