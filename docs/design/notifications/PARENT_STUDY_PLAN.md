# Research B: test plan with real parents (reminders, notifications, photo links)

Date 1 Nov 2026. Author: user-research agent. Read-only on repo. Tags: [verified: source] or [unverified].

## Recommendation

Run one study, 10 parents, two weeks, in three parts: a 30 minute session (interview, prototype tap test, card sort), a 7 day diary with real local notifications on TestFlight, and a 10 minute debrief. It needs no analytics. The study instruments itself with a 3 tap daily diary and a participant code.

Because the first store build ships before results land (freeze Tue 3 Nov, go/no-go Mon 9 Nov, D-130 [verified: docs/DECISIONS.md]), ship the conservative default for every question below now. The study can only loosen a default, and only when it clears a threshold written here first. Today's conservative defaults are names off (D-025), 20:30 default inside the 07:00 to 21:30 window, no festival messages unless chosen, and no photo permission.

Decision this study changes: whether to loosen D-025, how the reminder card presents times, which copy tone ships in rotation, how festival opt-in is built, and which of three photo permission levels F46 builds first. If none of those would change, do not run it.

Honest limits. N=10 is directional, not statistical. Thresholds below are guard rails for a founder decision, not significance tests. The founder is a new parent and the product owner, so they will lean toward the design. Mitigation: a fixed script, neutral wording, and a second person runs at least 2 sessions if possible.

## 1. Who (8 to 12; target 10)

| Group | n | Notes |
|---|---|---|
| Expecting (any trimester, at least 1 partner who is not the birthing parent) | 3 to 4 | Tests pre-birth reminders and the "no countdown" rule |
| New parents, child 0 to 18 months | 6 | At least 2 on a second or later child |
| Self-described tradition other than Christian or none | at least 4 of the 10 | Ask open question "which traditions or celebrations matter at home?" Never choose a label for them; record their words as given |
| Hard season | 2 to 3 (not labelled in findings) | See care protocol |

Recruit through the founder's network plus two community routes the founder chooses (recruiting is a founder decision). Do not recruit only friends; at most 5 of 10 from the founder's close circle. Incentive is a founder decision; pay regardless of completion or skipped items.

Hard season care protocol:
- The invitation says: "Some questions touch days that can be tender, like due dates or hospital stays. You can skip anything, stop any time, and still be paid."
- Pre-session form has one optional yes/no: "Would you like us to take extra care? (No reason needed.)" We never ask why and never write the reason down.
- Do not recruit anyone currently in acute crisis. Never recruit through a hospital, NICU or loss group without that group's leader agreeing (founder decision).
- Hard season stimuli (due date, anniversary-like, "first month" notes) are shown last, each with a visible "skip" card. A skip is data and is never probed.
- Session end: no pressure, a short list of general support lines the founder verifies beforehand [unverified: founder to confirm numbers].
- One person reporting a notification as distressing halts that stimulus for everyone and goes to `product` the same day.

## 2. What to test, and how

| # | Question | Method | Time |
|---|---|---|---|
| Q1 | Setup choices and recommended times | Interview + prototype tap test; confirm in diary | 8 min |
| Q2 | Name in notification comfort | Scale grid + diary (lock screen real) | 5 min |
| Q3 | Copy: 15 stimuli, three tones | Card sort + 7 day diary | 10 min + 7 days |
| Q4 | Festival opt-in | Three prototype designs + comprehension check | 5 min |
| Q5 | Photo linking, three permission levels | Static mock screens + comfort grid | 7 min |

### Q1 Setup choices and times
Prototype (clickable slides or Figma; no build needed) shows the reminder card on Tonight in two placements: A) the card after the first saved letter (current spec, K-02/DR-12 B), B) a step in first setup (founder's ask). Show both in random order.

Tasks: "Set this up so it suits your week." Observe: do they accept 20:30 and Tue/Sat unchanged, open the time picker, or choose "off". Then ask: "When, honestly, are you free and not asleep?" and "What did you do last night after the baby slept?" Capture the real evening, not the ideal.

Time chip options tested (to learn the spread, not to ship all): 20:30 default; 3 chips: "After bedtime (20:30)", "Nap or feed time (13:00)", "Morning (07:30)". Cadence options: weekly, a few times (Tue, Sat), every evening, off.

Thresholds (set before data):
- Keep the 20:30 and Tue/Sat default if at least 6 of 10 accept it unchanged and at least 6 of 10 call 20:30 to 21:30 "when I could talk". 
- If 4 or fewer accept, change the card to make the parent pick from 3 chips (no preselect) before turning on.
- If 3 or more choose a time before 20:00, widen what the card shows, not the 21:30 gate (C-NFR-001 stays).
- Placement: if at least 7 of 10 say A or "no preference" and no one says B would have prevented them quitting, keep K-02 as is. If at least 6 prefer B, escalate to `product` as a K-02 reopen with the quotes. Separately check: "Did seeing a reminder ask before you saved anything feel pushy?" 3 or more yes means B loses.

### Q2 Name in notification comfort
Show the same notification with and without a child name on a mock lock screen. Parent types the name they would use (real or stand-in; we never ask which and never record it). For each setting: alone, with partner, at work with phone on desk, relatives visiting, phone face up in a shared room. Scale 1 to 5 (1 not at all comfortable). Also: "If your name for the child were hidden, would the notification still feel personal?" (tests whether {child} is needed at all).

Thresholds:
- D-025 stays (names off by default) unless at least 9 of 10 score 4 or 5 in every context and no hard season participant scores below 4. Asymmetric on purpose: exposure cannot be undone.
- Offer the named toggle with a lock screen preview if at least 7 of 10 score 4 or 5 when alone.
- If 3 or more score 1 or 2 in any shared context, the Settings toggle must show an "others may see this" line (copy to `content`).
- Because this is cheap: run it again in the diary. Half the participants get named copies on day 5 to 7 (only if they typed a name on device).

### Q3 Copy: 15 stimuli, three tones
Tones (names are mine; `content` may rename): Calm (plain, invitation, "when you have a minute"), Warm (personal, uses {child} in 2 of 5), Light (a little playful, no emoji, no pressure). 5 per tone. Every stimulus obeys BRAND/VOICE rules: no em or en dashes, curly quotes, ellipsis or emoji; no streak, gap, "missed", fear or loss words; no gendering; never implies a machine writes; words from the glossary only (letter, note, recording, Tonight); fits a lock screen (aim 60 characters title plus body 100; [unverified: truncation limits vary by device, so check on a real phone]). Copy comes from `content`; I do not write the final strings. Use a placeholder row per stimulus: tone, named or neutral, prompt type (open question, invitation to talk, age note, festival note, photo note). Fixed rules for stimuli:
- 3 of 15 are age notes (month-day), 2 are festival notes using the participant's own chosen example, 2 are photo notes (Q5), 2 are explicit "no pressure" rewrites of the same ask. Rest are everyday evening prompts.
- Never include real letter text.
- Never use a countdown to a due date. Hard season stimuli are shown last with a skip card.

Card sort (session, 10 min): participant sorts all 15 printed on screen cards into "I'd open this tonight", "Maybe", "I'd swipe it away", "Feels wrong". Think aloud on "Feels wrong" only. Then "Which three feel most like Early Letters?"

Diary (7 days, one real local notification a day at the participant's chosen time; that is the product's one-a-day cap [verified: brief]). Each participant sees 7 of the 15, rotated so every stimulus is seen by 4 to 5 participants and each tone appears for each person at least twice. Day 7 repeats the day 1 copy, to test wear-out. Diary form (3 taps, under 30 seconds, no free text required):
1. What happened? Did not see it / saw it and left it / opened the app / wrote or recorded a letter.
2. How did it feel? Welcome / neutral / pressured or behind / odd or too personal.
3. Was the time right? Yes / too early / too late.
Optional one word.

Delivery of the test notifications. Local notifications in the production planner cannot take study copy. Options, cheapest first:
1. A throwaway TestFlight build (separate preview bundle id; the preview App ID already exists in the plan [verified: docs/release/TESTFLIGHT.md]) with a hidden screen that schedules 7 local notifications from a bundled JSON by participant code. Needs mobile agent effort of about a day [unverified]. No server, no push token, consistent with D-121.
2. If that is not ready, run the diary as scheduled messages the founder pre-schedules to a study number. Weaker: no lock screen fidelity, so Q2 comfort in the diary is lost. Say so in findings.
Keep these a separate pack from the product. Test notifications must never go to the production app.

Thresholds for copy:
- Cut a stimulus if 2 or more participants (or at least 20% of those who saw it) flag "pressured, odd, wrong".
- Ship a stimulus if at least 60% of viewers say "welcome" or "opened" and no "pressured" flag.
- Tone: pick a lead tone only if one tone beats the others by at least 15 points on "opened or wrote" and is not the worst for any hard season participant. Otherwise ship the three in rotation (what the planner already assumes: variety).
- Wear-out: if day 7 repeat is rated lower than day 1 by at least 3 of 10, rotation depth must grow beyond 8 variants.
- Overall guard: if more than 3 of 10 turn reminders off during the week, the cadence default changes to weekly before any copy choice.

### Q4 Festival opt-in
Principle from BRIEF: the parent chooses traditions, we never infer. Show three prototypes on the same card:
- A) Parent picks from a broad list (grouped neutrally, alphabetical, "none" first), nothing preselected.
- B) Parent types their own dates and names ("Add something that matters to your family").
- C) A region or religion question first, then a suggested list. Included to be falsified; I expect it to fail.

Comprehension check: "If you pick nothing, what will the app send about celebrations?" (right answer: nothing). And "What does the app think you celebrate?" (right answer: nothing until I say).

Thresholds:
- A design passes if at least 8 of 10 answer both comprehension questions correctly and none of the non-Christian group says "it assumed something about us". 
- Ship B first if at least half of the non-Christian group prefer B or say A's list leaves out what they need. Add A later.
- Drop C if even one participant says it felt like being guessed at.
- Festival notes as a feature: continue only if at least 5 of 10 say they would opt in to some. If fewer than 4, demote below the age notes and photo notes.
- Date-sensitive items (lunar or moveable dates): ask "who should decide the date?" Ship only parent-entered dates unless 8 of 10 trust a built-in list [unverified: calendar sources not evaluated].

### Q5 Photo linking, three permission levels
Static mock screens only. No real photo access is requested in this study, and no photos of children are used. Stimuli are stock or synthetic landscapes, food, hands, toys, with no faces; participants never upload or show their own photos.

Levels:
- L0 Pick: after writing or recording, "Add up to 5 photos" using the system picker (no app permission request) [unverified: confirm in Apple docs that the system picker needs no library permission].
- L1 Limited: the parent shares a chosen set of photos with the app (the limited library mode) [unverified: Apple docs]; the app suggests from only those.
- L2 Library (NOT APPROVED, blocked by M13 rule 4; shown only to measure comfort, never to build): full library read so a trip or birthday photo triggers a nudge from date and place data.

Comfort grid, 1 to 5, per level, plus two nudge wordings: inferred ("Tell more about your recent trip") versus neutral ("Some photos from this weekend. Want to talk about them?"). The inferred one is the riskiest: the app is guessing what the photos mean. It also goes through the constitution check, because on-device classification is AI-like and the app must never add meaning [verified: CLAUDE.md]. Test the neutral version as the baseline; the inferred one is the hypothesis to falsify.

Thresholds:
- L2 is never built from this study: it needs a change to M13 rule 4, the privacy steward, counsel and a founder decision first. The score only records comfort. Otherwise L0 first, L1 second.
- If at least 6 of 10 say they would use L0 weekly or more, L0 is the first F46 slice regardless of L2.
- Inferred wording passes only if at least 8 of 10 find it welcome and none finds it presumptuous; otherwise ship the neutral one. Any hard season participant calling any photo nudge "painful" blocks date-triggered nudges until reviewed.
- Privacy label guard: any level that reads the library changes the privacy story (label says Data Not Collected; reading on device only keeps that, but needs counsel confirmation [unverified]).

## 3. Scripts and stimuli

Session guide (30 min, founder or second runner, audio only, no video, no recording by default; notes by code P01 to P10):
1. Welcome and consent read aloud (2 min). "You are testing the idea, not yourself. There are no wrong answers. Skip anything."
2. Context (4 min): "Tell me about the last evening you had a free half hour." Do not mention the app.
3. Q1 prototype tasks (8 min).
4. Q2 name grid (4 min).
5. Q4 festival prototypes (5 min).
6. Q5 photo mocks (6 min).
7. Card sort Q3 (6 min); explain diary and how to switch notifications off in one tap.
Neutral probes only: "What are you thinking?", "What did you expect?", "Say more about that." Never "Would you use this?" (people say yes). Ask about last behaviour instead.

Wording rules for anything shown to participants: same as the hard content rules in BRIEF. Say "letter", "note", "recording", "Tonight". Never "entry", "take", "draft", "pack". Never imply the app writes. Never say "streak" or "missed". Do not call the study a "test of reminders for busy parents who forget"; say "reminders and notes about your child's first years". Scripts reviewed by `content` before use.

Debrief (10 min, day 8): the 3 feel questions, the one stimulus they liked most and least, "Did any notification arrive at a bad moment?", and a close: "Anything you want removed from what we noted?" Delete on request, no questions.

## 4. Consent and data handling (parents and children)

- Participants are adults. Children are not participants, are not interviewed, recorded, photographed or named. Remote sessions: audio only; if a baby is in view, the runner asks the parent to turn the camera away.
- No child photos collected. Stimuli are stock or synthetic. Participants are asked not to share photos or names of children in answers or in TestFlight feedback (matches the existing TestFlight rule [verified: docs/release/TESTFLIGHT.md]).
- Child names: participants type any name or a stand-in on their own device only; we do not ask for it or record it.
- Consent: one page, plain English, in a signed or checked form kept by the founder outside the repo, in an encrypted folder. It states: purpose, what we collect (notes by code, diary taps), that notifications on their phone are test messages, that they can stop or skip without losing payment, how to withdraw, and who sees the data (founder and the agents that read anonymised findings). Counsel should review the form before use [unverified: no study consent template exists in docs/; I searched docs/ and the compliance register for research consent and found none]. The consent text must also name the sensitive fields in plain words: tradition and whether the family is in a hard season are recorded, only as grouped counts, and any participant may skip them. Payment records and tester data in TestFlight are counsel questions (retention is counsel's call).
- Contact details live in one sheet, separate from the code-keyed notes; delete contact details 30 days after the study ends (proposal; retention is counsel's call).
- Raw notes, recordings (none by default), consent forms and the linking sheet never enter the repo. Findings carry codes and groups only, no quotes that identify anyone, and tradition or hard season shown only as aggregate counts ("2 of 4"), never attached to a code.
- No analytics SDK, no tracking links in the diary. Diary form tool is a founder decision (paid tools are founder decisions). It must not collect email, IP or device ID [unverified for any specific tool]; if unsure, collect the 3 taps by a call or text and type them into the sheet.
- No feature that writes, rewrites or summarises a person's words is tested. Diary one-word comments are stored as given.
- Study-run notifications arrive only on test devices of participants who installed the study build and can be turned off in iOS.

## 5. Timeline (14 days from founder go)

| Day | Step |
|---|---|
| 0 to 2 | PR with this plan for `product` review; founder approves recruiting, incentive, form tool; `content` supplies the 15 stimuli; `mobile` ships the study build |
| 3 to 5 | Recruit; send consent; install study build |
| 6 to 8 | Sessions (3 or 4 a day at most) |
| 7 to 14 | Diary runs per participant from their session day for 7 days |
| 14 to 16 | Debriefs; synthesis; FINDINGS.md |

This is tight. If the study build is not ready by day 5, split: run sessions (Q1, Q2, Q4, Q5, card sort) on schedule and the diary as a second wave.

## 6. Feeding D-decisions

Write results in `docs/research/studies/<date>-notifications/FINDINGS.md` (codes only), then update USER_RESEARCH.md beliefs as evidenced (study, n=10, directional), assumed or contradicted. Each decision gets one evidence line: question, threshold, result, recommended action.

| Decision | Threshold in this plan | If met | If not |
|---|---|---|---|
| D-025 names off by default | Q2: 9 of 10 at 4+ in all contexts | Propose default on via remote-config D-025 allows | Stays off; add "others may see" line |
| K-02/DR-12 B reminder card after first letter | Q1: 7 of 10 fine with A; under 3 call it pushy | Keep | Reopen with quotes |
| C-NFR-001 21:30 gate and 20:30 default | Q1: 6 of 10 accept | Keep | 3 chips, no preselect |
| Cadence default (Tue and Sat) | Diary: 3 or fewer turn off | Keep | Weekly default |
| New: festival opt-in design | Q4 comprehension 8 of 10 | A or B | Parent-typed dates only |
| New: photo permission level for F46 | Q5 | L2 allowed | L0 then L1 |
| New: lead copy tone | 15 point gap | Lead tone | Rotate all three |

New decisions need a D-number from the coordinator. Hand-offs: `content` gets cut and ship lists for copy; `design-systems` gets prototype issues; `decision-science` gets two proxies to keep after launch (see below); `product` gets backlog proposals.

Measurement after launch with analytics off (D-124): the numbers above come only from the study. Keep a small ongoing panel of 15 to 20 TestFlight parents who answer the same 3 tap diary question for a week at each release, plus App Store Connect aggregates that need no consent [unverified: which numbers TestFlight shows without tester sharing]. Do not infer notification success from a missing signal.

## 7. Hypotheses other agents are likely to propose, and how this study falsifies them

| Hypothesis | What would falsify it |
|---|---|
| H1 Night after the child sleeps (20:30 to 21:30) is the best time | Fewer than 6 of 10 say they are free then, or most pick nap, feed or morning |
| H2 Using the child's name lifts engagement | Neutral open rate equal or higher; or discomfort in shared contexts |
| H3 Names should be on by default to feel personal | Q2 threshold missed |
| H4 Variety beats consistency | Day 7 repeat rated as well as day 1; or people prefer one familiar message |
| H5 Questions outperform statements | Questions feel like homework (Qeepsake complaint [verified: USER_RESEARCH S32]) |
| H6 Sentimental tone wins | Tired parents pick Calm; Warm gets "pressured" flags |
| H7 Playful tone works | Light tone gets "odd" flags, especially from hard season participants |
| H8 Month and age notes are delightful | Read as counting or pressure; "behind" flags |
| H9 Festival messages are a differentiator | Fewer than 4 of 10 opt in; non-Christian group finds the list generic or presumptuous |
| H10 A built-in festival calendar is better than parent-typed dates | Parents prefer typing; calendar errors on dates |
| H11 Photo-triggered nudges are the differentiator | L2 comfort under 7 of 10; neutral nudge equals inferred |
| H12 Parents will grant photo library access | Prefer L0 or L1 |
| H13 Setup should ask for reminders during first run (founder's ask) | Placement B seen as pushy or slows them; K-02 stands |
| H14 A primer lifts notification opt-in (S22, directional) | Participants decline the system prompt anyway [unverified: needs real device] |
| H15 Expecting parents want reminders before birth | They find it presumptuous; hard season flags |
| H16 Competitor patterns (Qeepsake text prompts) transfer | Our parents mute them within 7 days |
| H17 More notifications means more letters | More than 3 of 10 turn off; wear-out rises |

Stating the risk ranking for the next release (standing duty 2): 1) names on the lock screen (Q2, irreversible if wrong), 2) tone landing wrong for hard season parents (Q3), 3) photo nudges reading the library without a trust base (Q5).

## 8. Open items for the founder

1. Approve recruiting, incentive and the diary form tool.
2. Decide whether to ship the throwaway study build (about a day of `mobile`).
3. Counsel review of the consent page.
4. Nothing here has run on a real phone; lock screen truncation, delivery time and permission behaviour are unverified until the study build is on a device.
