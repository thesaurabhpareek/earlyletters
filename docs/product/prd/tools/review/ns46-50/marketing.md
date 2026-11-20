# Review of NS-46 to NS-50: growth, positioning and store claims

Status: WORKING-INPUT (record; findings applied in the cards; do not load) | 20 Nov 2026 | Owner: the review role named in the file | Replaces: none | Load when: auditing where a finding came from; otherwise do not load.

Reviewer: `marketing` (Claude role, growth lens; function files read: `functions/marketing.md` and `functions/support.md`). Date 20 Nov 2026. Docs only: nothing here is published, posted or sent, and no string here is final (`content` writes words, the founder approves every public promise, `legal` takes every claim). This is not legal advice; every legal reading is "counsel must confirm". Fictional family Asha only.

Card file: `docs/product/prd/21-days-cultural-photos-home.md` (cited as `21:<line>`). Also read: `20-founder-direction-20nov.md`, `GAP-LOG.md` rulings (R-IA, N-, CB-, DL-, K1 to K10), `18-errata-after-lock.md`, `packages/content/src/store.en.ts`, `packages/content/BRAND.md`, `packages/content/VOICE.md`, `packages/brand/index.ts`.

Outside source read this session (Apple App Review Guidelines, https://developer.apple.com/app-store/review/guidelines/, first 100,000 of 121,052 characters; the rest not read):
- 4.5.4: "Push Notifications must not be required for the app to function, and should not be used to send sensitive personal or confidential information."
- 5.1.1(iii): "Apps should only request access to data relevant to the core functionality of the app and should only collect and use data that is required to accomplish the relevant task."
- 1.1.1: objectionable content "including references or commentary about religion, race, sexual orientation, gender, national/ethnic origin, or other targeted groups, particularly if the app is likely to humiliate, intimidate, or harm a targeted individual or group."
- 2.3.7: keywords "accurately describe your app", with no "trademarked terms, popular app names, pricing information, or other irrelevant phrases".
- 2.3.8: metadata "appropriate for all audiences" and "For Kids" and "For Children" reserved for the Kids Category.
- No "Journaling" wording found in the part read.
- Not read: whether 4.5.4 reaches local notifications (the card's default, treat it as applying, is the safer reading and I keep it; UNVERIFIED), and whether Apple restricts targeting by religion in paid search (UNVERIFIED; I rely on our own rule, section 6).

## 0. Summary

The five cards support the promise, and the hard parts (nothing ticked for the parent, nothing leaves the phone, no strip, no count, no streak, no guilt in the words, a neutral lock screen) are well built. The risks are in the public layer the cards do not yet cover:

1. Vocabulary: the cards call a day reminder a "note". BRAND.md line 93 and NS-48-R10 say that is the wrong word (P1).
2. A listing line becomes untrue: "You pick the days and the time" (`store.en.ts`) is false for library days, which fire at 09:00 (P1).
3. Ticking a day may promise a note that never arrives, if iOS notifications were never allowed (P1).
4. NS-48 "picture" kind variants contradict NS-49-R3 and the forbidden claim "any nudge from pictures" (P1).
5. One remote pause hides every tradition because one date is wrong (P1).
6. The brand risk of "exploiting religion" is mostly in what marketing does next (store art, keywords, seasonal posts, promotional text), which no card governs. New rows below (P1).
7. "Only on this phone" is true but incomplete: sign-out clears the list and a new phone starts empty (P1).

The promise as the task states it ("a baby memory book families fill by talking") is not the current wording: BRAND.md says Positioning A (D-139) replaced that descriptor with "letters to your child, in your own words and voice". I review against the current one. Nothing in NS-46 to NS-50 contradicts either.

## 1. Does the scope support the promise

| Question | Reading |
|---|---|
| Does a day note serve "letters a parent speaks to their child"? | Yes, if the landing stays a prompt to talk to the child (`days.landing.bright`, intent: "Anything you would like {child} to hear about today?", 21:284). It becomes a calendar app only if the store page leads with it. Default: it never leads (see 4) |
| Does picture-first blur the position against photo apps? | A little. BRAND.md lines 50 to 51 say "Your camera roll keeps the picture. Early Letters keeps your voice." Level 1 and 2 are a picture then your voice, which fits, but only if the store never uses "photo", "album", "memories" or "journal" as the product's name for the start (21:874 already bans most). Add "Journaling Suggestions" and "Apple Journal" to the ban for our public copy (new row NS-49-R28) |
| Does Home today dilute it? | No. One slip, one line, no list (NS-50-R2, R11). Leave alone |
| Does the catalogue dilute it? | No: it changes words, not volume (NS-48-R2). Leave alone |
| Is any of it child-directed? | No card writes to a child. Risk is imagery and tone in marketing, not product (section 6) |

## 2. Findings

### F1. "Note" is the wrong parent word (NS-46, NS-47, NS-48, NS-50). P1.
- Evidence: NS-46 section 3 says "one note", "a note on the day", enabled claim "Pick the days you want a note on" (21:113, 293); NS-47-R19 and its ask "a note on days that matter to your family" (21:323, 484); the Me group "Notes and days" (21:110). BRAND.md line 18: "Notes and letters are the two things people make. A note is quick." BRAND.md line 93 (glossary): what we send is "reminder; message", internal term "note". NS-48-R10 itself bans "story" or "note" for an app message (21:585).
- Wrong: a parent will read "a note on Thanksgiving" as a quick entry they make, and the cards break their own rule.
- Change: NS-46 sections 3, 4, 19 and NS-47 section 16 say "reminder" for the thing that arrives ("Pick the days you want a reminder on"). Rename the Me group "Days and reminders" (or "Reminders and days"). NS-47 `culture.ask.question` intent becomes "Would you like a reminder on days that matter to your family?" The ask must not say "note". Add a BRAND.md glossary row for "day we mark" (F8) in the same PR.

### F2. The listing line "You pick the days and the time" turns false for library days. NS-46-R10. P1.
- Evidence: `store.en.ts` REMINDERS section: "You pick the days and the time, and none comes after 9:30 at night." NS-46-R10: a library day fires at 09:00 local, clamped into the parent's window (07:00 to 21:30); DL-6 fixes 09:00. The parent chooses which days, not the time.
- Wrong: the listing line would be untrue of this build once days ship (Apple 2.3: metadata must reflect the core experience; FR-MKT-01 holds a claim whose row says otherwise).
- Change: new row NS-46-R29 (P1): "Given the release that turns days on, When the listing and /support are read, Then the REMINDERS paragraph says the evening reminder's days and time are the parent's and says a ticked day arrives in the morning, and `[NS-46-R29]` fails if any public line promises the parent picks the time of a day reminder." Or, if the founder prefers, let the parent move the time of day reminders (one setting) and keep the line. Default: keep 09:00, fix the words.

### F3. Ticking a day can promise a reminder that never comes. NS-46 section 5 rows "Notifications not allowed" and "Reminders switched off". P1.
- Evidence: 21:134 says ticking still works, "one line says notes need permission, with no promise of delivery and no second ask (E K-E13)". 21:135: reminders off, library days still come if notifications are allowed.
- Wrong: a parent who never allowed notifications ticks seven days and gets nothing, all year. That is a quiet broken promise and a one-star review ("it never reminded me"). Ticking is the parent's own act in a clear context, which is the moment an iOS ask is honest.
- Change: NS-46-R30 (P1): "Given notifications are not allowed and the parent ticks their first day, When they tap Done, Then the app asks iOS once, in that moment, with one line beforehand saying why in the parent's words; if iOS refuses, the Days page shows one calm line and each ticked day shows no promise. This is the one ask E K-E13 allows because the other ask was never answered." Needs Karma to confirm it does not break E K-E13 ("whichever ask comes first asks iOS"); if it does, the one line at tick time must say plainly that nothing will arrive until notifications are allowed in Settings. Also confirm that a parent with Reminders off ticking a day is told once, in plain words, "This sends a reminder on that day", since the listing says "Reminders are off until you turn them on".

### F4. NS-48 "picture" kind variants contradict NS-49-R3. P1 (conflict, not a ruling).
- Evidence: NS-48-R5 and section 3 item 2 list kind "picture" and allow a body like "a picture with it?" (21:580). NS-49-R3 (P0): after a letter began from a picture, no reminder or slip mentions the picture (21:763). NS-49 forbids "any nudge from pictures" (21:874 and R26). NS-48-R27 reads picture as `none` only until NS-01 supplies flags.
- Wrong: the moment NS-01 ships a flag, the planner reads that the last letter had a picture and words the next reminder from it. Marketing cannot say "we never use your pictures for reminders" while that holds, and Home would carry both rules.
- Change: NS-48-R27 and section 3: drop `picture` from the last-letter kinds, or add "a picture kind may shape the body only as a generic invitation that does not depend on whether the last letter had a picture". Preferred (P1): drop it; `first` and `small` are enough. Karma to rule.

### F5. One pause hides everything because one date is wrong. NS-46-R28, NS-46 section 10. P1.
- Evidence: `killSwitches.libraryDays` hides the whole library and cancels all library reminders (21:201, 230). The same card says a wrong date is "the failure mode with the highest cost to trust".
- Wrong: a wrong Eid date would also cancel a parent's Thanksgiving. For marketing, a public wrong date about a faith day in a review is the most damaging single event in this scope; the response must be narrow and fast.
- Change: NS-46-R28 gains: "the pause is per layer (seasonal, family, civic, each tradition id, culture-led) so one tradition's rows can be hidden without hiding the rest", and a runbook row (owner `support` with `content`): hide a day within one working day of a verified report, tell no one the tradition's name in public status text. Pair with DL-8 (member review before each tradition ships), which stays.

### F6. "Only on this phone" is true but incomplete. NS-47 section 12, R22. P1.
- Evidence: the call-out (21:450) says "Only on this phone. Used for one thing: suggesting days to mark. Change or clear any time." NS-47-R15 clears the store at sign-out; NS-47-R6 keeps it out of the iPhone backup; a new phone starts empty (R7); Save a copy never holds it (R10). The same app syncs letter words (D-160), so a parent who reads "only on this phone" next to the privacy promise may extend it.
- Wrong: a parent who signs out and signs back in finds their days gone and feels a promise broke; support gets the ticket (see F10).
- Change: NS-47-R22 gains: "the call-out also says in one line what clears it: signing out, erasing and a new phone", and a forbidden line: "we never store your religion", "we do not know your faith" (a ticked tradition day implies it; the claim would be false in substance even though no religion field exists). Allowed: "The days you choose stay on this phone."

### F7. The ask is really a browse filter, so do not market it as a question about religion. NS-47 section 3 item 2, section 19. P1.
- Evidence: CUL-Q2 default and NS-47-R2: tradition and country are held in memory and forgotten; only ticked days are stored. The ask slip text does not mention religion or country (21:323). The founder's direction said "religion and native country" (20:8).
- Reading: the public story is "you choose days", not "we ask your religion". Calling it a religion question in the store page, site, Notes for Review or press would raise the 5.1.1(iii) data-minimisation reading (text above) for no benefit, because we keep nothing but ticks.
- Change: NS-47 section 19, Forbids add: "we ask your religion", "tell us your religion", "your tradition", "for your faith", "know your culture", "personalised to your beliefs". Enables: only the call-out lines that have claims rows. Notes for Review (NS-47-R23): lead with the fallback (a plain browse-and-tick list, CUL-Q8) as the default description and the ask slip as the optional entry to it. Founder default for the first submission: keep the ask slip but be ready to ship the fallback if Review pushes back; counsel's CUL-Q5 to Q7 answers stay gates.

### F8. Parent-facing name "Days we mark" (NS-46 title, NS-50 "a day we mark"). P2.
- "We mark" says we choose and we mark the date, but the parent chooses. The list already separates "a day you type" and "a day we mark" (21:281). BRAND.md glossary (CR-25) needs a row either way.
- Change: parent-facing wording "A day you chose" and "A day you typed", page title "Days". Internal name stays `libraryDay`. `content` decides; add the row to the BRAND.md glossary table near line 93.

### F9. Retention honesty: what to forbid saying about recency and habits (NS-48). P1.
- Evidence: the catalogue picks words by days since the last letter and the last letter's kind (R3, R5). The words never mention the gap (R4), which is right, and a day-35 silence ends it. But the Me, Reminders help and the site could say "we never track when you write", which is false (the phone computes it, on device).
- Change: NS-48 section 19, Forbids add: "we do not track when you write", "we do not look at your letters" (true of the text, but read as covering kind and date), "not based on your habits", "adapts to you", "keeps you on track", "personalised". Enables stays "nothing new". Also add to the claims inventory: "Reminders change wording from time to time" is the only allowed public line about variety. Leave alone: R4, R10, day-35 end, zero exclamation marks.

### F10. Support and policy cost the cards do not carry (function file: support). P1.
- Evidence: FR-SUP-04 names Reminders and notifications as an article but not days; FR-SUP-08 categories have no "a day's date"; FR-SUP-11 lists what never reaches our servers.
- Change (new row NS-46-R31, P1): "Given days ship, Then the help centre has one article, Days and reminders, which says: you choose the days; dates marked 'around' can be moved; a wrong date is fixed by Move this date; the list stays on this phone, is cleared at sign-out and on erase, and a new phone starts empty; an iPhone setting can hide the day's name on the lock screen. Support macros: M-DAY-1 wrong date (never asks which tradition the parent follows; asks only the day's name as the parent reads it, typed), M-DAY-2 'my days are gone' (sign-out clear, new phone), M-DAY-3 'a reminder came with Reminders off' (ticked days are the parent's own, how to untick). Support category counts gain 'a day's date', counts only. FR-SUP-11's list gains 'the days a parent chose never reach us'. Support never asks for or records a tradition or country." Also an article line for level 2: 'Pick from recent days' does not show on iOS 17.0 and 17.1, with Journaling Suggestions off, or when the flag is off; Apple's own journal suggestion notifications are Apple's, not ours (NS-49-R22).

### F11. Conflict with my own function review, flagged not reopened (R-IA-5, R-IA-3). P2.
- FR-MKT-24 says no promotional or "try this feature" slip type is ever registered. R-IA-5 and NS-50 register the Days ask as rank 2c. The ruling is binding; I accept it as a question about a family choice, once, with "Not now" final for Home, not a promotion.
- Change: reword FR-MKT-24 to allow exactly one ask slip, once per account, and add NS-50-R13 (P1): "the 2c slip carries no feature name, no 'new', no count and no price, and is never shown in a session where the rating request or the Keep gate was shown." FR-MKT-23's exclusion list gains "the Days ask". Reason: asking about the family's days and then asking for a review in the same sitting is tone-deaf.
- Also: FR-MKT-20 says a test fails on any unregistered class id. NS-46 adds `libraryDay` as a source of the `typedDay` group, not a class (N-2); confirm that test allows the source, not a class.

### F12. Day reminders and the first minutes. NS-47-R19, NS-46 section 1. P2 (leave mostly alone).
- Good: not in first run (FR-MKT-21 holds), a later sitting, once. Keep. One note: the Days ask is the second ask after the reminder ask (NS-13). A parent can meet the Keep gate, the reminder ask and the Days ask across three sittings. Founder question Q-M3 below.

## 3. Store listing, screenshots and preview: what changes

| Surface | Change | Why |
|---|---|---|
| Description, REMINDERS paragraph | After flag on: one line "Choose days that matter to you and get a reminder that morning." (intent; never "holiday", "festival", a faith name, "every culture") plus the F2 fix | FR-MKT-01, A1 2.3 |
| Description, PRIVATE BY DEFAULT | No new sentence for days. The days call-out lives in the app, Privacy Policy and help centre only | One privacy promise, `en.trust.promise` word for word (D-061) |
| Promotional text | May change without a version (A2). Never tied to a day, season or tradition; no "Happy X" or "for Diwali" or "for Eid" | NS-46-R32 (section 6) |
| Keywords | No religion, holiday, festival, calendar, planner, "photos" or "journal prompts" words. Also not "Christmas", "Easter", "Ramadan", "Diwali" and the like, which would pack a metadata field with terms that do not describe the core experience (A1 2.3.7 text above). FR-MKT-11 extended, P1 | 2.3.7, brand risk |
| What's New, when each flag is on | NS-46: "Choose the days you want a reminder on, like Thanksgiving or the first day of spring." (example days are seasonal or civic only). NS-49: "Start a letter from a picture, or from your recent days." (the second half only once level 2 is on in production). NS-47, NS-48, NS-50: none. Never "new", "personalised", "smart" | FR-MKT-09 |
| Screenshots | No new frame needed for 1.0. If a frame shows the Days list, it shows seasonal and civic days only (Thanksgiving, first day of spring, Mother's Day) on Asha. NS-47 section 15 allows "a synthetic tradition"; I advise against: a made-up tradition on a store page reads as the app treating faith as a placeholder. Drop that allowance (new NS-47-R28, P1). No frame of the tradition lists, the ask slip, or a lock screen showing a day name | FR-MKT-12, 2.3.8 |
| Screenshot, picture start | Show our Ready screen with an illustrated or licensed picture (FR-MKT-12). Never a capture of Apple's picker or Apple's suggestions sheet: it holds the device owner's real places, workouts and pictures and is Apple's UI; use no mock of it | NS-49 R10 and R23 spirit; FR-MKT-12 |
| Preview video | Re-shoot (FR-MKT-15) shows no Days page and no suggestions sheet | A1 2.3.4 |
| Seasonal imagery | No pumpkins, eggs, stockings, hearts or other kids' holiday art in store frames. It reads as child-directed (A1 2.3.8 text above) and as a calendar app | Brand, 2.3.8 |

Subtitle, tagline and the first three frames (talk; every change marked; your voice kept) stay unchanged. The scope does not earn a headline.

## 4. Website one-pager and privacy label story

- Site: no section for days at launch. A single line under Reminders only after the flag is on in production (FR-MKT-31). Never a section about traditions. If a later site section is wanted, its draft is for `content` and says "pick the days you want a reminder on", with no religion, culture or country word.
- Privacy label: "none expected" holds only while NS-47-R4 and R6 hold (nothing leaves the phone; Apple's own privacy page, read by the earlier marketing review, says data processed only on the device is not collected). The label is itself a public surface; it is re-run per build (NS-47-R23). Keep.
- Level 2: the label stays unchanged only while the chosen picture never leaves the phone (NS-49-R27). If pictures ever sync (counsel Q54), the Photos or Videos row changes and `site.ts` s09 and the listing move in the same release (FR-MKT-16).
- Claims inventory rows needed before the flag (each a row with words, surface, decision, evidence): "The days you choose stay on this phone"; "Choose the days you want a reminder on"; "Pick a picture from your recent days, then say what you want to say" (21:874); "The phone makes the list; only the picture you pick comes to the app" (NS-49-R16; counsel first).

## 5. Cultural moments as a brand strength

Good for the brand, if the brand never claims it: a parent saying something to their child on a day that matters to the family is on-position (letters, voice, keeping). Where it could go wrong is coverage: the library will be US-first (DL-7) and will not hold every family's day. The cards handle this well (Add a day takes any day; the app never says a day is missing, R19). For marketing:
- Lead with the parent's choice, not the list's breadth. Allowed claim: "Pick the days you want a reminder on." Forbidden (NS-46 section 19 already, add): "every holiday", "all religions", "every culture", "for every family", "celebrate your culture", "we know your traditions", "the right date".
- Trust before reach: a tradition ships only after a member review is on record (NS-46-R23, DL-8). Keep this as written. Add an annual public check line to the launch plan, never a public claim of accuracy.
- Brand voice on a day: no greeting, no "Happy" or "Blessed" (NS-46-R17). Extend the same rule to every marketing surface (section 6).

## 6. Risks: marketing to children, exploiting religion

New rows (marketing owns; no card governs these surfaces today):

| Id | Row | Priority |
|---|---|---|
| NS-46-R32 | Given any marketing surface (store text, promotional text, screenshots, site, email, social, paid placement, press), Then it does not name, picture or target a faith, a tradition's day, an ethnicity or a country as an audience; no seasonal or religious-day campaign, post or promotional text; no "Happy" or greeting line; no paid targeting by religion, ethnicity or origin (our rule; platform rules UNVERIFIED); a scan of `store.en.ts`, `site.ts` and `packages/emails` for the day names and faith words in `days.name.*` finds none, with an allow-list that needs a written reason | P1 |
| NS-46-R33 | Given store art and site images, Then no child-directed holiday imagery and no image of a real child, family or place of worship; Asha only (FR-MKT-12, FR-MKT-32); no word "kids", "for children" or a child-addressed line (A1 2.3.8) | P1 |
| NS-49-R28 | Given any public line, Then it never names Apple's Journal app or "Journaling Suggestions" as ours or as a partner feature, and never implies Apple endorses or runs the list; it says "your phone's recent days" (the legal reading of using Apple's feature name: counsel must confirm; UNVERIFIED) | P1 |
| NS-47-R28 | Given store art, Then no frame draws the tradition list, the ask slip, a faith day name or a synthetic tradition (replaces the allowance in NS-47 section 15) | P1 |

Not a risk worth more rows: nothing in the five cards speaks to a child; the reader is the parent (`{child}` appears only in the parent's prompt).

## 7. Good enough to leave alone

- NS-46-R2 and R19: nothing pre-ticked, and the app never says a day is missing. Exactly the right retention honesty.
- NS-46-R16 and R17: quiet days stay quiet; no greeting, no "your", no count, no question mark on a quiet day.
- NS-46-R22 and NS-50-R2: no look-back, no "last year", no upcoming list, no count.
- NS-47-R12, R13, R14: a neutral title and body on the lock screen, the day's name only behind its own switch, forced off with App lock. This is what Apple's 4.5.4 text (above) points at; the card's default of treating it as applying to local notifications is right.
- NS-47-R18 and R19: no faith or origin field in first run; the ask comes once, later.
- NS-47-R2, R3, R4, R9, R11: picks are a filter, nothing attached to the child, no request or analytics carries a day.
- NS-48-R2, R4, R10, R11, R16, R24: variety never raises volume; copy never mentions a gap; no exclamation mark; no child name by default; no new class.
- NS-49-R6, R10, R25, R26: no permission, photos only, level 3 stays closed, a spike produces a decision not a feature.
- NS-49-R11 and R12: cancel and empty write nothing; a locked return is discarded.
- NS-50-R1, R5, R10, R11: one slip slot, one order, no picture slip, Home is not a feed. R-IA-3 is right; a strip would have broken "nothing keeps score".
- Free (T2) on all five, and no price, plus or Keep line in any reminder (NS-46-R27).
- Not in first run, no marketing in notifications: consistent with FR-MKT-20 and FR-MKT-21.

## 8. Verdict per card

| Card | Verdict | Required changes |
|---|---|---|
| NS-46 Days we mark | CHANGES | F1 (wording: "reminder", not "note"), F2 (R29 time claim), F3 (R30 permission at tick), F5 (per-layer pause in R28), F8 (parent-facing name), F10 (R31 help centre and macros), R32 and R33 (marketing never uses days) |
| NS-47 Cultural background | CHANGES | F1 (ask wording), F6 (R22 what clears it and the forbidden lines), F7 (section 19 forbids, Notes for Review lead with the fallback), NS-47-R28 (no synthetic tradition in store art). Counsel gates unchanged |
| NS-48 Notification catalogue | CHANGES | F4 (drop or generalise `picture` kind; conflict with NS-49-R3 for Karma), F9 (section 19 forbids on habits and tracking), F1 (R10 already bans "note"; the other cards must follow it) |
| NS-49 Picture-first and suggestions | CHANGES | NS-49-R28 (no Apple Journal or Journaling Suggestions in public copy), screenshot rule (no capture of Apple's sheet), keep keywords free of "photo"; claims rows before the flag. Otherwise strong |
| NS-50 Home today | PASS | One P1 addition: NS-50-R13 (the Days ask slip carries no feature name, "new", count or price and never shares a session with the rating request or Keep gate); P2 note on the conflict with FR-MKT-24 (F11) |

No card is a BLOCK: nothing in the five contradicts a ruling or the privacy promise.

## 9. Questions for the founder (each with a default)

| Id | Question | Default |
|---|---|---|
| Q-M1 | Should a ticked day's time be the parent's to choose, or fixed at 09:00 with the listing words fixed (F2)? | Fixed 09:00; fix the words; revisit after tester sheets |
| Q-M2 | May tapping Done after the first tick trigger the iOS notification ask once, with one line first (F3)? | Yes, once, only if the earlier ask was never answered; Karma checks E K-E13 |
| Q-M3 | Do you accept that no store frame, preview, post or promotional text ever shows a tradition, a faith day name or a seasonal or religious-day greeting (NS-46-R32, NS-47-R28)? | Yes |
| Q-M4 | Do you accept that the store, site and Notes for Review never describe the ask as a question about religion or country (F7), and that the plain browse-and-tick fallback ships if App Review questions the ask? | Yes |
| Q-M5 | Do you want the per-layer pause (F5), so one wrong date never hides every day? | Yes |
| Q-M6 | Drop `picture` as a last-letter kind in NS-48 so no reminder is ever worded from a picture (F4)? | Yes (Karma to rule) |
| Q-M7 | Rename the parent-facing feature to "Days" or "A day you chose" and the Me group to "Days and reminders" (F1, F8)? | Yes; `content` words it, you approve |

## 10. Not verified, not done

- I did not run a keyword tool or read any volume data; no keyword here has a volume.
- 4.5.4 applying to local notifications, and any Apple or ad-platform rule on religion-based targeting: UNVERIFIED.
- I did not read the last 21,000 characters of Apple's guidelines.
- I did not read `docs/design/e2e/IA-AUDIT.md`, the days-library, notification-catalogue or cultural-background function files in full; I relied on the cards' quotations of them and on GAP-LOG.
- Every legal reading: counsel must confirm (including the Apple feature-name use in NS-49-R28, and Article 9 for a device-only ticked list, which is NS-47's).
- Nothing here was published, posted, emailed or sent.
