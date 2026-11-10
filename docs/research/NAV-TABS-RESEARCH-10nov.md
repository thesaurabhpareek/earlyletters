# Navigation tabs: how each tab earns its place (research, 10 Nov 2026)

Author: general-purpose agent in the researcher role, for the "unique tabs" programme (brief signed by Karma). Docs only. Read-only on code.
Founder direction, 10 Nov 2026: each tab on the nav should be unique and serve value; Tonight and Book feel the same; the third is an empty "coming soon"; coming soon can be less prominent.
Tags: [read] = page opened this session, listed in section 8. [repo] = read in this repo. [UNVERIFIED] = not read, remembered, or seen only as a search-result title. [H] = hypothesis or judgement.
Status: DRAFT. Nothing here is cleared by counsel. Anything about App Review is a question for the compliance lead, not a ruling.

## Answer in five lines

1. The outside evidence on this exact question is thin. Most of what is citable is practitioner guidance and vendor write-ups, not measured studies of tab bars. Treat sections 1 to 4 as principles with precedent, not proof. The Apple HIG tab bar page could not be read this session, so every HIG claim about tab bars is UNVERIFIED.
2. What we can say: show a destination only if it earns a place, and where a thing exists but is not usable yet, say so and say why (Smashing) [read]. Hiding primary navigation behind a menu cost use and speed on phones in NN/g's 2016 study, which also advised four or fewer visible top-level links [read]. Both are about sites and controls, not baby-book tab bars.
3. Tonight and Book feel the same for reasons visible in the code: one shared lamp light across tabs, card lists on both, and Tonight resurfacing an old letter ("A month ago") that belongs to the Book's job [repo]. They differ by job (do vs keep), not by chrome. Make the difference one of posture and time: Tonight is now, one question, one hand; Book is then, reading, two hands.
4. The "empty coming soon" tab is already half solved in the store build: with server features off, Family is left out of the bar and there are two tabs [repo]. The remaining problem is alpha and TestFlight builds, and what happens the day Family ships. Slack's mobile bar has a "You" tab for status and preferences [read], which is a precedent for the fourth tab the founder named.
5. Default recommendation (section 7): bar of Tonight, Book, You. Family joins the bar only when co-parent sharing can be used. Its "coming soon" page stays, reached from a quiet row in You and from invite entry points. Test the tab jobs and names with five parents before building (section 6).

## 1. What the evidence says

| # | Claim | Source | What it is | Confidence | Fit for us |
|---|---|---|---|---|---|
| E1 | Disable a feature when people should know it exists but cannot use it yet; hide it when it is irrelevant. When someone taps a disabled-looking feature, explain why and how to enable it. | Smashing Magazine, "Hidden vs. Disabled in UX" [read] | Practitioner article about UI controls | Medium as a principle, low as evidence of outcomes. No data shown. About form controls and filters, not navigation | Family "will the user ever be able to use it? yes" points to show, not hide. But a tab is not a control; the cost of a permanent visible tab is bigger than a greyed button |
| E2 | On phones, people used hidden navigation in 57 percent of cases and combo navigation in 86 percent; 15 percent slower with hidden nav; the authors advise four or fewer visible top-level links on mobile. | NN/g, "Hamburger Menus and Hidden Navigation Hurt UX Metrics" (2016, 179 participants, 6 live websites) [read] | Controlled remote study, but websites, not apps; visible-only navigation was not tested on phones; several effects were reported across phone and desktop together; time difference only marginally significant | Medium for "do not bury a primary destination"; low for "four" as a hard cap | Supports keeping Tonight, Book and You always visible. Says nothing about tab bars specifically. The four-link figure is a guideline from that study, not a limit on tab bars |
| E3 | A mobile app moved to a bottom tab bar of four (Home, DMs, Mentions and reactions, You) because "entry points to the most important screens need to be at the top level"; status and preferences had been in a menu that was "hard to discover". | Slack blog, "A simpler, more organized Slack on your phone" [read] | Vendor's own account of a redesign. No numbers in what I read | Low-medium. A real product decision by a large team, but self-reported and no data | Direct precedent for a "You" tab holding status, snooze and preferences. Not proof it works for a calm, low-frequency app |
| E4 | Day One added a Journals tab and a More tab on iOS (2025.6) "to simplify navigation". More holds Notifications, On This Day, Daily Prompt, Add from Photo Library and Streaks. Its views (List, Calendar, Media, Map) sit along the top, not in tabs. | Day One release note and iOS guide [read] | Vendor release note | Low-medium | A leading journal app puts "reflect on the past" (On This Day) and prompts in a catch-all tab. We should not copy: streaks are banned here (CLAUDE.md), and a More bucket is the opposite of "each tab unique" |
| E5 | Apple App Review 2.1(a): "placeholder text, empty websites, and other temporary content should be scrubbed before submission". Separately, a rule against "hidden, dormant, or undocumented features" (the fetched text numbered it 2.5.19; I could not confirm the number independently). | Apple App Review Guidelines [read, first 100,000 of 121,490 characters] | Platform rule | High that the text exists. Whether a calm, explained "not yet" page counts as placeholder content is unknown to me | A tab that shows a blank or a bare "Coming soon" is the risky shape. A page that is complete in itself and says plainly what is not here yet is a different shape. Question for the compliance lead (section 7, open items) |
| E6 | Tinybeans and Qeepsake both describe sharing as by invitation to a child's journal. Neither store page describes its tab bar. | App Store pages for Tinybeans and Qeepsake [read] | Vendor store copy | High that the pages say this; nothing about navigation | Co-parent sharing is a normal feature in this category. How competitors lay out their tabs: UNVERIFIED (needs screenshots or installs) |
| E7 | Fewer tabs generally make navigation easier; each tab should be a distinct section used often. | Uxcel lesson summarising Apple HIG [read] | Third-party summary; the page does not present the wording as Apple's | Low. Use only as a pointer to read the real HIG | Pointer only |
| E8 | "New" labels for an entirely new page should persist 30 days only; avoid badges to label features as new. | AWS Cloudscape, "Announcing new features" [read] | Design-system pattern for a web console | Low for our case (console, not consumer mobile) | If Family arrives in the bar, a short-lived "new" mark is the established pattern; keep it brief. Do not count or nag |
| E9 | Apple Journal: entries from text, photos, audio; on-device suggestions; device passcode or Face ID lock. The newsroom page does not describe the app's menus. | Apple newsroom, Journal launch [read] | Vendor press release | High for features, nothing for layout | Do not cite Journal's navigation; I have not seen it |

Not read this session, so nothing below depends on them: Apple HIG tab bars, NN/g mobile navigation pages, Material 3 navigation bar, Apple Photos help, Qeepsake help centre (see section 8).

What the evidence does not say: there is no source I read that measures whether a "coming soon" tab hurts or helps a consumer app. No source I read compares three, four and five tabs in a journaling or memory app. Anyone who quotes a percentage for either is quoting something I could not find.

## 2. What we have today [repo]

- Bar: Tonight, Book, Family, built with JS tabs, 58 pt plus safe area, always visible, single-word labels from `copy.tabs`. Capture is not a tab; it lives on Tonight (DESIGN_LANGUAGE section 12, H4).
- Family is inside `Tabs.Protected`. With server features off (the store build) there is no bar item and no route, so the store build has two tabs: Tonight and Book (D-126, BL-604). Every alpha build keeps the Family tab.
- With server features off, the Family tab shows the co-parent "coming soon" page: one line drawing, a serif heading, one plain line, no action. The "Tell me when it's here" button was removed (SET-08) because no build keeps that promise yet.
- Settings are not a tab. They sit behind a gear on the Book cover (`book.bar.settings`).
- Why Tonight and Book feel alike, from the code comments (these are causes in the build, not user findings):
  - One shared lamp light with `persistKey "tabs"`, so a tab switch settles the light and does not cut it. The design intent is continuity; the side effect is that the rooms look like one room.
  - Both lists are cards of letters. Tonight shows one card per unfinished letter, or "A month ago" when none is waiting; Book shows letter cards by month. A parent opening either sees a stack of letter cards.
  - Both have the same dateline-and-serif voice.
  - "A month ago" on Tonight is Book's job (looking back) placed on the capture tab.

## 3. How to make four tabs different from each other

Principle [H, consistent with E3 and E4]: each tab answers one question the parent has at a different moment, and nothing appears on two tabs. Differentiate three ways at once: the job, the time the tab looks at, and the posture of the person using it.

| Tab | The question it answers | Looks at | Posture | Must not contain | What makes it feel different [H] |
|---|---|---|---|---|---|
| Tonight | "What do I say to {child} right now?" | Now | One hand, low light, tired, a minute | History, a list of past letters, settings | Dark and warm; one question; Speak and Type are the screen; fewest items on any tab; unfinished letters only |
| Book | "What have I kept, and what does it read like?" | Then | Two hands, seated, unhurried, reading | Capture prompts, "another thought", reminders | Paper, not lamp; typographic months; the cover; Read together; print and export belong here. The page you would hand to a grandparent |
| Family | "Who writes to {child} with me?" | Us | Sharing, a short visit | Anything about the app or account | People as signatures ("From Mama"), not accounts. Only when usable |
| You | "How do I want this app to behave?" | The app | Setting up, rare | Letters, prompts, counts | Plain system-style list; account, backup, lock, reminders, export, delete. No lamp |

Specific changes this implies (design to decide; none is evidence-proven):
1. Remove the lamp's cross-tab continuity from Book: Tonight keeps the lamp; Book is paper. The shared light is the single biggest "same" signal in the code. Cost: the "settles the light instead of cutting it" transition (5.8 row 6) needs a decision.
2. Move "A month ago" out of Tonight, or keep it only as one line that opens the Book at that letter. It is the Book's job on the capture tab. Trade-off: it is a warm, low-effort reason to open the app; removing it may cost a gentle return trigger. Worth testing (section 6).
3. Give Settings a home so the gear leaves the Book cover. The gear on the cover makes Book a mixed tab (reading plus configuration).
4. Keep names single-word and parent-readable (BRAND glossary): "You" is plain; "Tonight" is a time, not a verb, which is an asymmetry the test should check.

## 4. Patterns for an unreleased feature without an empty tab

| Pattern | What it is | Evidence | Pros | Cons for us | Fit |
|---|---|---|---|---|---|
| A. Not in the bar; a quiet row where it will matter | No tab. One row in You (and wherever an invite is offered) opens the existing "coming soon" page | E1 (disable when people should know; explain why) [read] | Bar shows only what works. Nothing empty in primary navigation. Page can stay as designed | The feature is less discoverable; the bar changes when it ships (one tab appears). Smashing names layout shifts as a cost of hiding and showing [read] | Best default |
| B. A tab with an honest page (today in alpha) | Family is in the bar and opens the "not yet" page | E1 (explain why) [read]; E5 raises placeholder risk [read] | Predictable bar; tells people it is coming | Spends one of the few primary slots on a destination with no action. This is the founder's complaint | Keep only in alpha builds, if at all |
| C. Dimmed tab | Family in the bar, visibly disabled | E1 | Signals "exists, not yet" | A disabled item in a four-slot bar looks broken; the JS tab bar needs custom styling; accessibility labelling needs work [H]. Apple HIG on unavailable tabs: UNVERIFIED | Not recommended |
| D. Announce inside existing content | A one-time card on Book or You: "Writing together is coming." | E8 (short-lived "new" markers) [read] | Cheap, dismissible | Easily becomes noise; a promise we cannot date; the "Tell me" button was pulled for the same reason | Only with a real date; not now |
| E. Show nothing until it ships | No row, no page, no mention | E1 warns that hidden features hurt discoverability when users expect them [read]; E5 asks that no hidden or dormant features are shipped [read] | Simplest bar | Parents who read "shared with your co-parent" on the site or store page then find nothing. BRAND says v1.0 shares with the co-parent, so the product has already said it exists | Not recommended while the public copy promises sharing |

Notes:
- The dormant-feature rule (E5) needs a read by the compliance lead: Family code exists in the binary but is switched off in the store build. A visible, explained row is easier to defend than silent dormant code, but that is my reading, not a ruling.
- The warm tone of the current page (no badge, no points, no footer: "says 'not yet' once") already meets the content rules. The problem is where it lives, not how it reads.

## 5. Tab count trade-offs

| Option | Bar | For | Against |
|---|---|---|---|
| 2 tabs | Tonight, Book | Cleanest; the store build today | Settings on a cover gear stays; no room for You or Family; a two-item bar looks sparse and the next tab is a layout change |
| 3 tabs (recommended default) | Tonight, Book, You | Each slot is a working destination with a distinct job; settings get a real home (E3); room to add Family as the fourth | Settings becomes a primary destination for something used rarely; the founder may see "You" as filler [H] |
| 3 tabs, Family live | Tonight, Book, Family | The current design | Leaves settings on the gear; fine once sharing works |
| 4 tabs | Tonight, Book, Family, You | The long-run shape; within NN/g's "four or fewer" guideline for visible links [read] | Only once Family has an action. Four equal slots on a calm app is more visual weight than the founder's "less prominent" ask |
| 5 or more | | Not needed | UNVERIFIED what Apple says about five; Day One's More tab (E4) is the cautionary shape: a catch-all dilutes "each tab unique" |

What this does not settle: how many tabs a tired parent at 22:00 handles comfortably. That is a test question, not a literature one.

## 6. What we cannot learn without real families, and a cheap test

Open questions only parents can answer:
- Q1. Do the four names and jobs make sense, and do parents go to the right tab first (first-click)?
- Q2. Does "Tonight" read as a place to talk, or as a feed? Does "Book" read as past or as the same list?
- Q3. Does removing "A month ago" from Tonight lose a reason to open the app, or does it sharpen Tonight?
- Q4. Does a "writing together is coming" row in You read as a promise, a tease, or noise? Does it make them want to ask their partner?
- Q5. Does a lamp-free Book still feel like the same product?
- Q6. Where do they expect Settings? Does a "You" tab feel right for a baby book?

### Five-parent test plan (extends `docs/design/notifications/PARENT_STUDY_PLAN.md`; apply its consent and hard-season rules as written)

Decision this changes: the bar (Tonight, Book, You vs with Family), the tab names, whether "A month ago" stays on Tonight, and where the coming-soon row lives. If none of those would change, do not run it.

- Who: five adults 18+, parents or expecting. At least 2 with a child under 12 months, at least 1 second-time parent, at most 1 from the founder's close circle. Directional, not statistical; five per round then iterate. Incentive and recruiting are founder decisions.
- Method: 20 minutes each, remote or in person, think-aloud, on a clickable prototype of the bars (two variants: A is Tonight, Book, You; B is Tonight, Book, Family-with-soon-page). Counterbalance order.
- Tasks (first-click and short interview):
  1. Show the bar with labels only. "What would you expect behind each one?" Then "Which one do you open to add tonight's letter? to read what you wrote in March? to change your reminder? to invite your partner?" Record the first tap and any hesitation.
  2. Show Tonight with and without "A month ago". "Which would you rather see at 10pm? Why?"
  3. Show the coming-soon row (A) or page (B). "What do you expect to happen? Does this feel like a promise?"
  4. One sentence: "Say in your own words what this app is for."
- Bars written before data (guard rails for N=5): at least 4 of 5 pick the right tab first for add / read / reminder tasks; at most 1 of 5 says the coming-soon item "feels like a promise" or "feels like an ad"; at least 4 of 5 describe Tonight and Book differently without prompting. Missing a bar means revise names or jobs and retest, not ship.
- Stop rules: any participant who is upset by the partner question (sleep deprivation, loss, a difficult relationship, a hard season): stop that task, thank them, do not probe.

### Consent and data rules

- Plain written consent before any session: what we collect, who sees it, how long we keep it, how to withdraw. Read aloud and kept as a one-page form outside the repo, in founder-controlled storage. Counsel reads the consent page before first use (the study plan already asks for this).
- No audio or video recording by default; opt in per session, and no recording of any child.
- Notes by participant code (P01 to P05) only. No child names, dates of birth, photos, voice samples or real letters in notes, prototypes or findings. The prototype uses the fictional family "Asha"; participants never type their own child's name. Per CLAUDE.md, real family details never go in code, tests or fixtures.
- No analytics SDK in the prototype. Findings are aggregate counts and unidentifying paraphrase; raw notes, consent forms and the linking sheet stay out of the repo and are deleted on a stated date.
- Outputs, if run: `docs/research/studies/2026-11-nav-tabs/` with PLAN, GUIDE and FINDINGS. I have not created those files.
- Timeline: two days of sessions after the founder approves recruiting, synthesis the day after. Whether that fits any build cut: unmeasured.

## 7. Recommendations

### R1. (Default) Bar of Tonight, Book, You; Family joins when it works; coming soon becomes a quiet row

What: Family leaves the bar in every build until co-parent sharing is usable. Settings move to a new You tab (gear leaves the Book cover). The existing coming-soon page is reached from one row in You ("Writing together") and from invite entry points, unchanged in tone and still with no action and no promise of a date. When sharing ships, Family becomes the fourth tab, with a short-lived "new" marker (E8).
Why: the founder's two complaints are an empty tab and sameness. This removes the empty tab, gives each remaining tab a job, and uses the existing "no tab, no route" mechanism already used in the store build [repo]. Evidence is E1, E3, E2 (all low to medium confidence, section 1).
Cost: a new tab to build; the bar changes later when Family arrives; alpha testers lose the Family tab and the visible co-parent preview.
Do first: the five-parent test (section 6) on names and first-click, before building You.

### R2. Differentiate Tonight and Book by job, time and posture, not just chrome

What: Tonight is now (one question, Speak and Type, unfinished letters, lamp). Book is then (paper, reading, months, Read together, print). Take "A month ago" off Tonight or reduce it to a link into Book; end the shared-lamp continuity across the two.
Why: the code shows why they feel alike (section 2). The table in section 3 is the proposed contract.
Cost and risk: "A month ago" is a gentle return hook. Removing it is a bet [H]. Test Q3 before deciding.
Can be done independently of R1.

### R3. Keep Family in the bar as a quiet last tab (fallback if the founder prefers it)

What: a fixed three-tab bar of Tonight, Book, Family with Family showing the existing page, and settings staying on the gear.
Why include: it matches the present code and the DESIGN_LANGUAGE text, and costs nothing.
Against: it is exactly the empty "coming soon" tab the founder wants moved out of the way. Only choose this if the founder wants Family visible for marketing reasons (BRAND says the book is shared with the co-parent at v1.0), and in that case dim nothing; keep the page as is.

Default if no one decides: R1 plus R2.

### Open items for the founder and leads

1. Compliance lead: does a visible, explained "not yet" page count as placeholder content (2.1(a)), and does the switched-off Family code count as a dormant feature (the rule fetched as 2.5.19)? Please read the guideline text directly; I could read only part of the page.
2. Design lead: the section 3 table, the lamp decision (R2.1) and whether "You" is the right name.
3. Founder: recruiting and incentives for the five-parent test; approve the consent page for counsel.
4. Product lead: BRAND says sharing ships at v1.0; with Family out of the bar and the feature not live, check that no public line says "co-parent" in the present tense before the build.

## 8. Sources

Opened and read this session (fetched text):
- Smashing Magazine, "Hidden vs. Disabled in UX": https://www.smashingmagazine.com/2024/05/hidden-vs-disabled-ux/
- NN/g, "Hamburger Menus and Hidden Navigation Hurt UX Metrics" (2016): https://www.nngroup.com/articles/hamburger-menus/
- Slack, "A simpler, more organized Slack on your phone": https://slack.com/intl/de-ch/blog/productivity/simpler-more-organized-slack-mobile-app
- Day One release note, iOS 2025.6 navigation update: https://dayoneapp.com/releases/major-navigation-update-with-journals-more-tab/
- Day One, Journal views in Day One for iOS: https://dayoneapp.com/guides/day-one-ios/journal-views-in-day-one-for-ios/
- Apple, App Review Guidelines (read first 100,000 of 121,490 characters): https://developer.apple.com/app-store/review/guidelines/
- Apple newsroom, Journal launch (Dec 2023): https://apple.com/au/newsroom/2023/12/apple-launches-journal-app-a-new-app-for-reflecting-on-everyday-moments
- Tinybeans on the App Store: https://apps.apple.com/us/app/-/id521633042
- Qeepsake on the App Store: https://apps.apple.com/us/app/qeepsake-family-photo-album/id1332312787
- AWS Cloudscape, Announcing new features: https://cloudscape.design/patterns/general/announcing-new-features/
- Uxcel, Tab bar essentials (third-party summary): https://app.uxcel.com/courses/apple-hig/navigation-architecture-159/tab-bar-essentials-0769
- Matthias Frank on Notion's mobile bar (read, not used in the findings): https://matthiasfrank.de/en/notion-updates/new-tabbed-mobile-navigation/

Repo files read: CLAUDE.md; packages/content/BRAND.md (glossary, positioning); packages/content/src/strings.en.ts (tabs); docs/research/FIRST-RUN-RESEARCH-10nov.md; docs/design/DESIGN_LANGUAGE.md (navigation line); docs/design/notifications/PARENT_STUDY_PLAN.md (headings and consent section); .claude/skills/user-research/SKILL.md (consent section); apps/mobile/src/app/(tabs)/_layout.tsx, index.tsx, book.tsx and family.tsx (header comments); components/family/coparent-soon.tsx (header).

## 9. UNVERIFIED and blocked

- Apple HIG "Tab bars" (https://developer.apple.com/design/human-interface-guidelines/tab-bars.md): the fetch was blocked (the permission request was not answered in time, and the tool said not to retry). One web search (the single retry the brief allowed) returned only result titles with no text. Everything about what Apple says on tab count, labels, unavailable tabs and badges is UNVERIFIED. The DESIGN_LANGUAGE and `_layout.tsx` comments cite the HIG on tab bars; I did not confirm those citations.
- Blocked the same way, not read: NN/g mobile navigation patterns, NN/g bottom navigation, NN/g mobile navigation design, NN/g empty states, Material 3 navigation bar, Android Compose navigation bar, Apple Photos help page, Qeepsake help centre, and Apple's Journal navigation. Anything these might say is UNVERIFIED here.
- Seen only as search-result titles, not read: Tinybeans's own site, Huckleberry, 1 Second Everyday, Spotify and Notion "coming soon" threads, Day One's other guides.
- The numbering "2.5.19" for the hidden, dormant, undocumented features rule: it came from the fetched text via the summariser and I did not see the page itself. Verify the number and the wording.
- Competitor tab bars (Tinybeans, Qeepsake, Day One, Apple Journal, Apple Photos): UNVERIFIED. Store pages and release notes I read do not describe them.
- Any figure for how often parents skip, tap, or abandon a tab, or for how much a coming-soon item helps or hurts: none found. No statistics in this document come from outside the sources above.
