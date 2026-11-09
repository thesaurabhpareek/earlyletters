# NX-37: A 20-minute usability and first-impression study with real parents, for Build 12

Readiness: not scored against the 14-point audit (it is a study plan, not a build row). It is ready to run when the founder answers the three questions in "Blocked on" and a TestFlight candidate that completes first run exists. Nothing in this file has been run.

Status: draft, 9 Nov 2026 (UTC). Docs only. Author: the Early Letters `user-research` handle (a Claude role, not a person). It assigns no BL, D or CR id, reserves nothing, changes no decision and edits no other file. Task G-11.

Tags: EVIDENCE (a file I opened, named), HYPOTHESIS (our guess, to be tested), UNVERIFIED (not read or not confirmed), proposed (a target or threshold nobody has measured; it is a plan, not data).

A disclosure first. I am an AI handle writing a plan for a study I will not run, with a pre-agreed fallback rule (below) that I did not choose. Every threshold here is mine and proposed. Five people cannot give rates; the plan says what each answer can and cannot support.

## 0. The founder ruling this study tests, not chooses

On Mon 9 Nov the founder ruled that the fourth-position tab label is **"You"** (relayed in the task for this file; I did not find it in a decisions file, UNVERIFIED in the repo). The study does not compare label candidates. It tests whether "You" works, with one pre-agreed fallback:

- If **fewer than 4 of the 5 parents** find Settings within **10 seconds** (task U1, unaided), the label becomes **"Settings"**. That is the whole rule. No third label is shown to anyone.
- The rule counts the five parents only. The two grandparents or relatives are reported separately (section 9).

What "tab bar" the candidate has is itself not settled in the files I read. NX-30 (on `docs/nx-30-nav-landing-8nov`) specifies four tabs (Tonight, Book, Photos, You) after the founder's request; NX-31 revision 3 says the Build 12 cut has "the You tab as the third tab" and the Photos tab waits; NX-30a recommends Tonight, Book, You in the store build. The study works with either bar. Session notes record how many tabs the candidate had.

## 1. The decisions this study informs

A study that changes no decision is not run. Each line names the decision, who owns it, and what answer would change what.

| # | Decision | Owner | A result that would change it | Section |
|---|---|---|---|---|
| D1 | Does "You" work as the tab label, or does it become "Settings"? | founder, `content` | Fewer than 4 of 5 parents find Settings in 10 s: label key changes (the rule in section 0) | U1, U5 |
| D2 | Does account-first on screen 2 lose or confuse people? | founder, `product` | Several people hesitate, look for a way around it, or cannot say why they were asked: change screen 2's line, not the order (order is the founder's decision; this study only reports) | T1 |
| D3 | Is Tonight dull, and does a kept-letter "From the book" row change that? | `design-systems`, `product` | Most name the row as a reason to open the app: keep L1 (NX-30). Most do not notice it or call it noise: reconsider L1 vs L2 | U4 |
| D4 | Can a parent find Settings, Account and Delete account without help? | `design-systems`, `mobile` | Account or Delete account missed by 2 or more of 5: change the path or the header card, not the bar | U1 to U3 |
| D5 | Is the optional-name step understood as optional? | `content`, `product` | People type a name because they think it is required, or hesitate and ask: change the step's wording | T1 (name) |
| D6 | How does sign-in feel at about 150 s (Apple) versus 240 s (email code)? | `product`, `mobile` | Where people stall or go quiet, and what they say the wait felt like. Not a pass or fail on 150 and 240 | T1 (sign-in) |
| D7 | What does "kept on this phone" make a parent believe about safety, when backup is OFF in Build 12? | `content`, `privacy`, founder | Any parent who believes the letter is also safely stored elsewhere: the line is misleading and must change (counsel reads it, it is a registered string in NX-31 R21) | T1 (kept) |
| D8 | Which three moments felt flat to the founder (NX-35 F-4)? | `design-systems` | Scopes the motion work (S1) after Build 12; Build 12 itself gets no motion change (NX-35 F-5) | section 6 |

D2 and D6 need a working account-first first run on the candidate. If the candidate falls back to the on-device binary (NX-31 section 0, any open gate at submit), D2, D6 and part of D7 cannot be answered from the build; see section 8.

## 2. Method

**Moderated, think-aloud, 20 minutes, one person at a time.** The method fits the question: "Can people do this task with this design?" is a moderated usability test with about five people per round (`.claude/skills/user-research`, section 2). The skill's rule applies: ask what decision the study changes (section 1) before running it.

**Who:** 5 parents of a child under 3, plus 2 grandparents or close relatives of a child under 3. Adults only. Codes P1 to P5 (parents) and P6, P7 (relatives). Recruit from the founder's network (a bias, section 9).

**What they use:** the Build 12 TestFlight candidate. Two ways, with a recommended default:

1. **Default: a study phone** (the founder's phone or a spare iPhone, loaded with the build, speech model already downloaded, on Wi-Fi). Reason: an internal TestFlight build is, as I remember Apple's rules, only available to people added to the team in App Store Connect, which would give each parent a team account (UNVERIFIED, from memory, not read this run). An external TestFlight link needs Beta App Review (UNVERIFIED). A study phone also keeps every sign-in on a study identity, so no participant's Apple ID or email is bound to a backend account.
2. **Own phone, only if an external TestFlight link exists** and only on the email path with a study address the moderator supplies. Never the Apple path on a participant's own phone (it would bind their real Apple Account to a prototype account). The cost: the person's phone has different text size and settings, which is useful, and the build may differ from the device-run build.

**Two people in the room (or on a call):** a moderator who speaks and a note-taker who times and writes. If only one person is available, the moderator times with a stopwatch app and timings are good to about 2 seconds at best (limit, section 9). Who plays these roles is the founder's decision (section 12); my recommendation is that the founder does not moderate where a participant knows him, because people soften what they say to the person who made the thing.

**No recording by default.** No audio or video of the participant, no screen recording that captures the microphone. Written notes only, codes only (section 10). A recording would need a separate, explicit opt-in per session and is not part of this plan.

**The pretend baby.** Every participant uses the fictional family "Asha" (`CLAUDE.md`). A card in front of them says: "Today the baby is Asha. Please use only pretend details: Asha's name (or leave it empty if you like), and the made-up date on this card. Please do not type the real name or birthday of anyone in your family." The moderator writes the made-up date on the card so Asha is about 7 months old. Participants speak two made-up sentences into the app. For a relative: "Pretend Asha is your grandchild" (or niece or nephew).

**Study accounts.** The build is signed into only through study identities held by the founder: an Apple Account created for the study with a neutral name, and a study mailbox for the email code. After each session the moderator deletes the account in the app (which is also a use of the Delete account path, so a failure is itself a finding) and deletes the app. UNVERIFIED: whether the build's backend allows re-creating an account on the same address straight away; whether the email-code rate limit (NX-31 R20, preflight) allows 3 or 4 codes in a day.

**Staging checklist, before each session** (the moderator ticks it, 5 minutes): app deleted and reinstalled fresh; study account state clean; Wi-Fi on; the speech download either finished or the moderator knows what screen 5 will show; silent mode off, volume up; Do Not Disturb on; text size set (default for P1 to P5; see U6); Reduce Motion off (record it); no app lock; screen brightness fixed; build number written down; timer ready; the Asha card and the consent sheet printed.

**One check on the Apple path.** The Apple sheet needs the phone owner's passcode or Face ID. A participant cannot unlock the study phone's identity themselves, so the moderator enters it. The timer is paused for that, and the sign-in time on the Apple path is noted as "without the system authentication" (limit).

## 3. Screener (6 questions, no sensitive data)

The founder sends this as a message or a short form. Nothing is collected beyond the answers below plus a way to reach the person (kept apart from the notes, section 10). Never ask a child's name, a child's age in months, health, or location.

1. Do you have a child under 3, or are you a grandparent, aunt, uncle or close relative of a child under 3?
   (A) I am a parent of a child under 3. (B) I am a grandparent or relative of a child under 3. (C) Neither. [C: thank them and stop.]
2. Is an iPhone your main phone?
   (A) Yes. (B) No. [B: thank them and stop; the build is iPhone only.]
3. Which of these do you already use to keep or share things about a child? Tick any.
   Notes app / Photos app / a journal or diary app / a baby-tracking app / voice messages / none of these.
4. Have you ever kept a baby book, on paper or on a phone?
   Yes, on paper / yes, on a phone / both / never.
5. Are you comfortable talking out loud while someone watches and takes written notes for 20 minutes? You would say two made-up sentences to the app about a pretend baby.
   Yes / No. [No: thank them and stop.]
6. Which of these times could you give us 20 minutes? [the founder fills the windows, for example three or four slots over the days chosen in section 7]
   Window 1 / Window 2 / Window 3 / Window 4 / none of these.

Selection, not asked: aim for a spread on question 3 and 4 (at least 1 parent who has never kept a baby book; at least 1 who uses a journal or baby-tracking app), and for P6 and P7 one grandparent and one other relative if the network allows. Do not try to balance anything else; seven people cannot represent a population.

## 4. Session plan (20 minutes) and the task scripts

| Clock | What | Notes |
|---|---|---|
| 0:00 to 2:00 | Welcome, consent script (section 10), the Asha card, "we are testing the app, not you" | Read the consent aloud; get a spoken yes; the note-taker writes "consent given" and the code, nothing else |
| 2:00 to 9:00 | T1: first run, fresh install, to the first kept letter | Cap 7 minutes. If the person is still in sign-in at 5:00, the moderator records where and offers a prepared Asha book |
| 9:00 to 15:00 | U1 to U5 (and U6 if used) on the Asha book | One task at a time, read aloud, no hints; a hint is recorded as a hint |
| 15:00 to 19:00 | Reflection questions (R-questions below) | Open questions first |
| 19:00 to 20:00 | Thank, answer questions, say what happens to the notes, stop | No pitching, no promising features |

Moderator rules (the skill, section 4): never pitch, never correct, never promise features; open questions ("Tell me about...") over leading ones; do not say the names of the tabs; do not say "Settings", "Account", "You" or "Delete" in a task. If the person says they feel upset or the session touches something painful, stop the task, be kind, and offer support information; do not probe; note only "session ended early" (section 10).

Common prompts: "What are you thinking?" / "What did you expect to happen?" / "Say a bit more." A hint ladder, used only after 30 seconds of a task with no progress and always logged: hint 1 "What would you try next?"; hint 2 "Take your time, look around the whole screen"; then the moderator stops the task and records "not completed".

### T1: First run (D2, D5, D6, D7)

Read aloud: "Imagine you have just downloaded this app on the store's recommendation. Please use it the way you would at home, saying what you are thinking. Here is the pretend baby. Go as far as saving a first letter for Asha."

The moderator hands over the phone at the first screen. The note-taker starts the timer at the person's first tap on the age question, and records the clock at: reaching screen 2; finishing sign-in (excluding system authentication); reaching the child step; reaching the Speak button; the first kept letter. Path: P1, P3, P5, P7 take Apple; P2, P4, P6 take email (UNVERIFIED that both are on in the candidate). That puts three or four people on each path, which is anecdote (section 9).

Observe, do not ask during: any look for a skip or back; whether the person reads the line on screen 2; whether they type a name or leave it empty; what they do on the name box; hesitations over 5 seconds and where; wrong taps.

Asked straight after the first kept letter (R-questions, T1 group):

- T1a. "How did signing in feel just now: quick, slow, in the way, or fine? Say a bit about why." (D6)
- T1b. "The app asked you to sign in before anything else. What do you think that was for?" (D2)
- T1c. "If this was an app you had just downloaded for real, and you were on that first sign-in screen, would you carry on? What would you want to know first?" (D2; a stated intention, not behaviour)
- T1d. "On the screen about the baby, was there anything you were not sure you had to fill in? What did you take the name box to be for?" Then, if they filled it: "What would have happened if you had left it empty?" If they left it empty: "Why did you leave it empty?" (D5)
- T1e. "The app told you the letter was kept on this phone. In your own words, what does that tell you?" then "If this phone fell in a lake tonight, what do you think happens to this letter?" then "Where do you think the recording is right now?" Do not say anything about backup, accounts or servers. (D7)

Record T1e as one of: **B1** believes it is also stored somewhere else or backed up; **B2** believes it exists only on this phone and would be lost; **B3** unsure. B1 is the worrying answer when backup is off (severity 3, section 5). The sign-in itself shows that an account exists, so B1 is plausible, which is the reason to ask (HYPOTHESIS).

### U1: Find Settings (D1, D4)

Read aloud: "Imagine you want to change how the app works for you, for example the time of an evening reminder. Show me where you would go. I will time you; there is no wrong answer."

The wording leaves out the word "Settings" on purpose. NX-30 T1 says "Find where your settings are", which hands the person the fallback label and would make "Settings" look findable even if "You" is not. NX-30a U1 used a reminder task, which this follows.

Start the timer when the sentence ends. **Success (proposed):** the Settings home page is on screen within **10 seconds**, no hint, by any path. Record the path: the fourth-position tab, the Book gear, or something else. A person who reaches Settings through the Book gear counts for the founder's rule as found in 10 seconds, but the note-taker flags it, because the rule exists to judge "You". If 4 of 5 pass and 2 or more of them used the gear rather than the tab, the founder is told so (section 6 of the analysis).

### U2: Find the account (D4)

"Imagine you want to see which Apple sign-in or email this book is under, or sign out of it. Show me where you would go."

**Success (proposed):** the Account page on screen within 10 seconds of the end of the task, no hint (NX-30 evaluation uses 10 s for this). Record the path and tap count. The expected path with the You tab is You, then the header card (NX-30a, derived from reading code, not measured; UNVERIFIED on the candidate).

### U3: Find Delete account, and say what it does (D4)

"Imagine you decided you no longer want an account with this app, and you want it removed. Show me where you would go. Please stop when you reach the final confirmation. Do not tap it."

**Success (proposed):** the delete confirmation on screen within 20 seconds, no hint, and no tap on the final confirmation (the moderator stops it by saying so in advance). Then ask: "In your own words, what does this screen say will happen? What do you think happens to the letters on this phone?" Record the answer in the person's words; the aim is whether they understand the screen, not whether they agree with it. Never let a participant complete the deletion on the study account until the session ends.

### U4: Tonight, a first look (D3)

The moderator returns the person to the Tonight tab. "This is the screen the app opens on. Tell me what you see. If you were describing it to a friend in a sentence, what would you say?" Then: "What would you do first here?" Then: "Is there anything on this screen that would make you open the app tomorrow? Anything that feels like nothing?" Then: "One word for how this screen feels." (the word "dull" is the founder's, not ours to put in a participant's mouth.)

Part B, the kept-letter row (D3). If the candidate shows a "From the book" row (NX-30 option L1, a kept letter shown below Speak and Type), the moderator checks that it is visible; if the candidate shows no such row, which I expect for a fresh Asha book because the existing resurfaced card needs a kept letter 28 to 35 days old (NX-30, `resurfaced`, EVIDENCE from NX-30 only; UNVERIFIED on the candidate), the moderator shows a **mock** of Tonight with the row, using the same Asha screen with a made-up sample letter, handed over as a printed or on-screen image, and says: "Here is a version with one extra row." Then: "What do you think this row is?" / "Would it change whether you open the app? In what way?" / "Which of the two screens would you rather open on a normal evening, and why?" Swap the order (with the row first, then without) for every second person. The mock text is a sample line the founder writes as fictional Asha words and is labelled as a sample; the study does not test any text the machine wrote or shaped (the constitution).

### U5: What is the last tab for? (D1)

Run after U1 to U4, so no earlier question hints at it. "Look at the bar at the bottom. What do you think each button is for?" Then for the last button: "What would you expect to find behind it?" Record exact words. **Success (proposed):** at least 4 of 5 parents say settings, account, "my stuff" or similar (NX-30a, same bar). The word "You" is never repeated by the moderator. If the answer is "me" or "profile", that is recorded and left; no alternative labels are offered.

### U6 (optional): larger text

For one session in the P6 or P7 slot, the moderator sets the study phone to a larger text size before the session, without asking why. "Show me where you would go to change the evening reminder." Success (proposed): Settings in 20 seconds, labels all visible (NX-30 R13 is the AX5 row). Use only if the person is comfortable; never ask about health or eyesight. This does not replace the VoiceOver check (NX-30a U7), which needs a VoiceOver user and its own session; it is not covered here.

### Closing questions (R-questions, final group)

- R1. "Which moment in the whole thing felt best, and which felt like nothing?" (NX-35 T9, one question; this is the 20-minute proxy for T9's week-long look, not a replacement for it.)
- R2. "Was there a moment you wanted to stop?"
- R3. "What would you tell a friend this app is for?" (record the words; it also tells us whether the promise is read as a baby book, a journal, or something else)

## 5. Observation sheet

One sheet per participant, filled by the note-taker during the session and completed by the moderator within 24 hours. Header: participant code (P1 to P7), group (parent or relative), session date (day only), phone and iOS version, build number, tab count, text size, Reduce Motion on or off, path (Apple or email), moderator and note-taker initials. No names, no contact details.

| Field | What to write |
|---|---|
| Task | T1 (with clock marks), U1, U2, U3, U4a, U4b, U5, U6 |
| First tap | What they tapped first (tab name or control) |
| Path | The route they took, in screen names |
| Taps | Count from the task start to the target |
| Seconds | Task start to the target on screen (or "not reached"); T1 clock marks listed in section 4 |
| Hint | 0 none, 1 first hint used, 2 second hint used |
| Wrong first tap | yes or no, and where |
| Words | Short verbatim quotes, trimmed of anything identifying |
| Belief (T1e) | B1, B2, B3 |
| Understood (U3, T1d) | what they said the screen means, in their words |
| Severity | 0 to 3 below |

Severity scale (proposed), one value per task per participant:

| Score | Meaning |
|---|---|
| 0 | No problem seen. Target reached, no hint, no pause longer than 5 seconds |
| 1 | Minor: a wrong first tap or a pause, recovered alone, under the time target |
| 2 | Real: over the time target, or one hint needed, or a wrong belief about what a screen does, but finished |
| 3 | Blocking or harmful: did not finish, two hints needed, or (T1e) believes B1 while backup is off, or (U3) misreads what Delete does to the letters |

A finding is any task where two or more participants score 2 or 3, or any single 3 on a safety or deletion belief. One person's trouble is logged and watched, not promoted.

## 6. The founder's 10-minute "flat moments" walkthrough (NX-35 F-4)

NX-35 F-4 asks for a device walkthrough where the founder names the three moments that felt flat, before the motion work (S1) is scoped. NX-35 says the large signature moments are built and only the founder's eyes can say which did not land; its hypotheses for the flatness are (a) motion is subtle by design and reads as nothing, (b) the in-between moments use platform defaults, (c) Tonight has nothing of the person's own book to show, (d) the build was not the one the motion document describes. This form lets one 10-minute pass tell these apart. It is the founder's opinion, one person, not evidence from parents.

Do it alone on his own phone, on the Build 12 candidate, once with Reduce Motion off. Fresh install, then use it as a parent would. Fill the form while using it, not after.

Header: build number: ______; iOS version: ______; Reduce Motion: off / on; dark or light: ______; date: ______.

For each moment, mark **F** flat (I expected something and felt nothing), **O** okay, **G** good, **N** not reached; and one line, "I expected ______".

| # | Moment | F / O / G / N | I expected ... |
|---|---|---|---|
| 1 | First launch to the age question | | |
| 2 | Sign-in to the book opening | | |
| 3 | "The book is open." arrival | | |
| 4 | Tonight appearing | | |
| 5 | Tapping Speak, the room going quiet | | |
| 6 | While talking (the glow following the voice) | | |
| 7 | Stopping, the words appearing | | |
| 8 | Tapping Keep, the letter joining the book | | |
| 9 | The first kept letter message and the reminder card | | |
| 10 | Switching between tabs | | |
| 11 | Opening Settings | | |
| 12 | Opening the Book, then a letter | | |
| 13 | Hearing a letter back | | |
| 14 | Anything else, named by you | | |

Then the three moments, ranked: 1 ______ 2 ______ 3 ______.

Then four tick boxes, one per NX-35 hypothesis, "which of these is closest to why": (a) it happened but was too quiet to notice; (b) nothing happened between the big moments; (c) there was nothing of my own book to look at; (d) this is not the build I thought it was. Add one sentence for the one he ticked.

The moments list is mine, not NX-35's moment numbers (M1 to M14 in that file; I did not read each spec). `design-systems` maps the founder's three to those ids. UNVERIFIED that every item exists in the Build 12 candidate; "N" is a valid mark.

## 7. Schedule against the Build 12 submit date

I do not have the Build 12 submit date: it is not in any file I read. Call it S. The device run for Build 12 is about 14.5 hours (given in the task; the run sheet itself, `proposals/device-run-sheet-build12.md`, was not read, UNVERIFIED). Effort estimate for the study, mine and unmeasured: scheduling 7 people about 2 hours of the founder's time over a day or two; 7 sessions at 30 minutes each including staging and the account reset, about 3.5 hours; notes completed and sheet summary about 2 hours; analysis about 2 hours. Total about 10 hours of people time, spread over two or three days, with the run itself at about 3.5 hours.

| Option | When | What it can change before S | What it cannot | Needs |
|---|---|---|---|---|
| A: in parallel (recommended) | Sessions run while the device run is under way, on a separate study phone running the same TestFlight internal build, in sessions over 1 to 2 days ending well before S | The tab label key (one string, `copy.tabs.you`), screen 2's line, the "kept on this phone" line (all copy, which counsel may need to read), the order in which Account and Delete account are reached if it is a small change | Anything structural; the account-first order itself (the founder has ruled it) | A second phone and a second person for timing; a build that completes first run; founder time that does not collide with the 14.5 hour device run (the founder is probably also doing that run: UNVERIFIED who does it) |
| B: after the device run | Sessions on the build that passed the device run | Whatever ships after S (copy changes, the next build) | Anything before S | None extra |
| C: prototype first, build later | Sessions before a candidate is stable, on screenshots or a click-through | Label guess (U5 words), the Tonight row (U4 part B), reading of "kept on this phone", reading of the name step and the delete screen | Time to find things (U1 to U3 as timed tasks), sign-in feel (150 s versus 240 s), flatness of motion, real speech, tap counts | A prototype |

On the prototype: the NX-36 wireframe file `docs/roadmap/next/03-requirements/NX-36-wireframes.html` on branch `docs/nx-36-screen-specs-9nov` **does not exist** as far as I could tell. `git fetch origin docs/nx-36-screen-specs-9nov` returned "couldn't find remote ref" and `git ls-remote origin 'refs/heads/docs/nx-3*'` listed NX-30, NX-31, NX-32, NX-33, NX-34 and NX-35 branches but no NX-36 one (checked 9 Nov). So option C has no wireframe to use today. If it appears, check it contains the Tonight row and the screen 2 sign-in screen before using it; until then a prototype means screenshots of the candidate plus the mock in U4. A sentence of caution: a screenshot walk-through measures what people say they would tap, not what they do, so no timed claim (U1's 10 seconds) can come from it.

Recommendation: A. If the candidate cannot yet complete first run with sign-in, run only the parts that do not need it (U1 to U5 on a pre-made Asha book) and carry T1 to option B. A decision check after P5: tabulate U1 for the five parents; the label decision does not need to wait for P6 and P7.

## 8. What the candidate must be for the study to mean anything

- First run completes with sign-in on (NX-31 gates G1 to G7 relate; I did not check their state, UNVERIFIED), or the questions that need sign-in are carried to B.
- The tab bar, the Account page and the Delete account path are in the build (NX-31 R25 puts Delete account in the same build as sign-in).
- The candidate says "kept on this phone" in its first-run line (NX-31 R21, Build 12 truthful line). If the candidate says something else, record the exact line shown; D7 then tests that line.
- No analytics are on (off in every 1.0 profile); nothing about the sessions is measured by the app.
- If the candidate has no "From the book" row, use the mock (U4).

## 9. Honest limits

- **Five people give no rates or percentages.** Report counts ("3 of 5"), never "60 percent". A 4 of 5 pass on U1 is a decision rule the founder pre-agreed, not a measured success rate. The same 4 of 5 could come from a population where half would fail.
- **No A/B winner.** The with-row versus without-row comparison is within each person, in swapped order, with seven people. It shows reasons and reactions, not which design wins.
- **Network bias.** Recruiting from the founder's network brings friends and friends of friends. They are kinder, more tech-comfortable, and more willing to carry a stranger's app through a sign-in than a stranger from the store. Account-first looks safer than it will for strangers. Say this in the findings.
- **The moderator effect.** If the founder moderates, people soften what they say. The pre-agreed fallback rule is not affected (it is a time on a task), but U4 and the safety belief questions are.
- **Lab behaviour is not store behaviour.** A person who agreed to a 20-minute session will not abandon at screen 2. Abandonment cannot be seen. "Would you carry on?" is a stated intention.
- **No retention evidence.** One session says nothing about use in week two, month two, or the letters a parent writes over time. NX-35 T9, the five-parents-for-a-week look, is a different study and is not replaced by this one.
- **Timing is rough.** Think-aloud slows everything; a moderator and a system authentication on the Apple path interrupt. The T1 clock marks are not comparable with the NX-31 R15 targets (150 s Apple, 240 s email, medians of scripted Maestro runs and then families). Use them to find where people stall.
- **Paths are 3 and 4 people each.** The Apple versus email comparison is anecdote.
- **The two relatives are two people.** Any subgroup of two is anecdote and is reported on its own line, never merged into the parent counts. A relative may meet the app differently (no baby book of their own, different words for their relationship); the "what does {child} call you" step is worth a note for them.
- **Learning effect on U1.** U1 comes after about eight minutes of first run, so the person has already seen the tab bar. This is the "second visit" the founder's complaint was about (he knew the app and could not find Settings, NX-30a). It is not a first-sight test of discoverability. First sight is covered only by what the person does in the first minute after the book opens, which the note-taker should record.
- **Not covered:** VoiceOver (NX-30a U7), Reduce Motion users, languages other than English, the local-start fallback screen, a failing connection, Android, a second phone, sharing, and anyone who has no iPhone.
- **Baseline.** NX-30 asks for a baseline run on the current build before the bar. This study runs on one build; before-and-after tap counts are from reading code (NX-30a), not from this study.
- **An AI wrote this plan.** I have not talked to a parent. Thresholds are proposed. The scripts have not been rehearsed; a pilot run (the founder or the note-taker doing it once on a person they know, dropped from the counts) will find errors in the scripts and is worth 30 minutes.

## 10. Privacy and ethics

**Consent script (read aloud before anything else; plain words):**

"Thank you for doing this. I am going to ask you to use a new app and say out loud what you are thinking. We are testing the app, not you; nothing you do is wrong. Today the baby is pretend. The baby is called Asha, and everything you enter, including your two spoken sentences, should be made up. Please do not type the real name or birthday of anyone in your family. I will take written notes. I will write down what you do and say, using a code like P3 instead of your name. I am not recording sound or video. The notes are kept in a private folder only the research team can open, until [date the founder sets], and then deleted. Your name and how to reach you are kept separately and deleted after the sessions. You can stop at any time, skip any question, and ask me to delete your notes by telling me the date of your session, even afterwards. If something I ask feels uncomfortable, say so and we will move on. Is it okay to start?"

(Counsel does not need to read this script unless the founder offers an incentive that changes the terms; UNVERIFIED, no counsel view was sought.)

Door lines (COORDINATION section 10 shape):

- **Shown:** the consent script above, spoken, and the Asha card.
- **Records:** a spoken yes (the note-taker writes "consent given" and the code); written notes under a code; the session day. Not names in the notes, not voices, not faces, not the screen.
- **Never:** no recording of the participant; no real child name, birth date, photo or health detail; no location; no asking about the participant's own child's age in months; no follow-up marketing from this list; no putting a participant's real Apple Account or real email on a backend account; no raw notes in the repository.
- **Decline and withdraw:** the person can decline before, skip any task, stop mid-session, or later ask for their notes to be deleted, with no reason given and no effect on anything.

**Anonymisation and storage.** Notes use P1 to P7. Quotes are trimmed of anything that could identify a person or a family. Raw notes live only in the claude.ai Project docs for "Letters & Memories App" (founder instruction for this task). The skill (section 3) says raw notes live outside the repo in founder-controlled storage with a stated delete date; the founder confirms the Project docs meet that and sets the date (section 12). Only de-identified findings enter `docs/research/`, following the skill's layout `docs/research/studies/2026-11-build12-usability/` with `FINDINGS.md` (the folder does not exist today; `ls docs/research/` on 9 Nov shows no `studies` directory). The scheduling list (names, contact) is kept by the founder outside the notes and deleted when the sessions end.

**Real family data.** Real family details never go in code, tests or fixtures (`CLAUDE.md`). The pretend family is Asha. The mock row in U4 uses made-up Asha words. If a participant types real details by mistake, the moderator tells them, deletes the entry in the app, and does not copy it into the notes.

**Adults only.** Participants are 18 or older. No child is interviewed, recorded or present in the session (if a child is in the room, the session pauses or moves).

**Distress or risk.** If anyone becomes upset or discloses something about their own or a child's safety or health, stop the task, be kind, give support information the founder has prepared in advance (a short list printed on the consent sheet: UNVERIFIED, the founder prepares it), do not probe, and note only that the session ended early.

**The constitution.** The study tests no feature that writes, rewrites or summarises a person's words. The two spoken sentences are the participant's own; the app's faithful edit is not under test, and the moderator says nothing about it.

**Incentive.** Whether to offer one, what, and how much, is a **founder spend decision**. I price nothing; the cost is UNVERIFIED and I give no figure. The skill (section 3) notes that incentives cost money and that recruiting through personal networks adds bias; a thank-you may change who says yes and how kindly they speak. If the founder gives one, the consent line says so, and the recipient's name is not kept in the notes.

## 11. Analysis plan: from observations to backlog items and requirement rows

**During:** the sheet per person (section 5). **After each session, within 24 hours:** the moderator completes the sheet and writes three lines, "what happened", "what surprised me", "what to change in the script", in the Project doc.

**After P5 (the five parents):** tabulate U1 first. The label decision is the one the founder pre-agreed: 4 or more of 5 find Settings in 10 seconds unaided (any path) means "You" stays; fewer than 4 means "Settings". Report the path split (tab versus gear). Tabulate the rest by task: counts of severity 0, 1, 2, 3 per participant (a grid of seven rows by the tasks).

**After P7:** the relatives on their own lines. Then synthesis (skill, section 5): observations (what people did and said), then themes, then insights (why), then implications. Separate evidence from interpretation. For each finding: evidence (the participant codes), confidence (low, medium, high: with 5 people almost nothing is "high"), and the decision it informs (D1 to D8). Count how many people showed each pattern; one quote is not a trend. Say what families did that worked (VOICE.md; do not frame findings only as failures).

**Where each finding goes.** Findings become **proposals to `product`** for backlog rows (the id is taken by `product` from `node scripts/agents/next-id.mjs`, never by this file) and copy issues to `content`. The rows that a finding can touch, by decision:

| Finding about | Rows it informs | What can change |
|---|---|---|
| Label "You" found or not (D1) | NX-30-R1 (the tab opens Settings in 1 tap), NX-30-R19 (the evaluation thresholds), NX-30a label section, NX-30 "if it fails" step 1 | The one `copy.tabs.you` key to "Settings" if the founder's rule trips; R19 gets its first observations (it stays HYPOTHESIS; five people cannot "pass" it) |
| Account and Delete account paths (D4) | NX-30-R1 second half, NX-32 (Account and Delete account rows; which rows: not re-read, UNVERIFIED), NX-31-R25 (delete in the same build) | The path, the header card, the wording of the delete screen (counsel reads wording) |
| Account-first on screen 2 (D2) | NX-31-R17, section 3 of NX-31 (why this order, said honestly), the screen 2 line | Screen 2's line and what it says about why. The order is the founder's decision and the study does not reopen it; it reports |
| Sign-in feel (D6) | NX-31-R15 (timing study row), NX-31 section 6.4 (150 s and 240 s targets), NX-31-R11/R8 (email wait and recovery, from the device rows list; not re-read) | Where to cut screens or taps; the targets stay "proposed" |
| Optional name (D5) | NX-31-R3, NX-31-R28 | Wording on screen 3 |
| Tonight and the row (D3) | NX-30-R2, R4, R10 (the study row), R14; NX-30 hypotheses H1 to H3 | Keep or rethink L1 and L2; R10 is a study row: its Then ("most name the row as the reason") gets a count out of 5, not a verdict |
| "Kept on this phone" (D7) | NX-31-R21 (Build 12 true line), screen 2 line, the "kept" line in the first-letter moment | The wording, with counsel; or evidence for the backup decision the founder has parked (backup is OFF in Build 12) |
| Flat moments (D8) | NX-35 F-4 and F-5, S1 scoping, T9 | Which of NX-35's moments to specify first, after Build 12 |

**What the study cannot do to rows.** It does not turn a HYPOTHESIS row into a pass. Study rows (NX-30-R10, R19; NX-31-R15; NX-35 T9) receive observations and counts, and the note beside the row says "observed in 5 parents, 9 Nov, NX-37" not "passes". Nothing that depends on a rate (a median time, a share who reach screen 3) is answered here.

**Output.** `FINDINGS.md` leads with the decision and the answer in three lines, then findings, then method and limits (skill, section 6). The decision on the label goes to the founder the same day as P5.

## 12. Blocked on (founder decisions, with recommended defaults)

| # | Question | Recommended default |
|---|---|---|
| 1 | Incentive: offer one, and what? Cost is UNVERIFIED and not priced here | Founder decides. If any, keep it small and the same for everyone; a thank-you does not need the recipient's name in the notes |
| 2 | Who to recruit: which seven people from the founder's network, and whether any relatives are chosen | Parents who have not seen the app and who do not work on it or know its makers closely; at least one who never kept a baby book; the two relatives, one grandparent and one other relative if possible. Not a close friend, not a family member, and nobody who has tested before |
| 3 | Who runs the sessions: moderator and note-taker | Moderator someone the participants do not know well if possible; the founder as note-taker or as a silent second person. If it has to be the founder, say so in the findings. Two people, always |
| 4 | Study phone and Apple Account for the study identity; whether own-phone sessions are allowed if an external TestFlight link exists | A study phone and a study identity. Own phone only on the email path, only if an external link is available |
| 5 | Where notes live and when they are deleted | The Project docs for this project, with a date the founder writes on the consent sheet (a date a few weeks after the sessions end is mine, unmeasured) |

## 13. The check

Every row is a study row: Test: none, study, owner `user-research`. Each Then has a number; each number is **proposed**. "Fails on old code" here means the evidence that exists today: none, for every row.

| Label | Tag | Given, When, Then | Why there is no evidence today |
|---|---|---|---|
| NX-37-R1 | HYPOTHESIS | Given the Build 12 candidate and the label "You", When 5 parents each are read task U1, Then at least 4 of 5 reach the Settings home page in 10 seconds or less, unaided, by any path. | No study has been run; the founder's own trouble finding Settings (NX-30a) is one person. |
| NX-37-R2 | HYPOTHESIS | Given fewer than 4 of 5 parents succeed on R1, When the study closes, Then the tab label becomes "Settings" and no other label is tried. | The pre-agreed rule; nothing triggers it yet. |
| NX-37-R3 | HYPOTHESIS | Given U5, When 5 parents say what the last tab is for, Then at least 4 of 5 say settings, account or "my stuff" in their own words. | Never asked of a parent. |
| NX-37-R4 | HYPOTHESIS | Given U2, When 5 parents are read the task, Then at least 4 of 5 reach the Account page in 10 seconds or less, unaided. | Never run. |
| NX-37-R5 | HYPOTHESIS | Given U3, When 5 parents are read the task, Then at least 4 of 5 reach the delete confirmation in 20 seconds or less, unaided, none taps the final confirmation, and at least 4 of 5 say in their own words that it removes the account and what is stored with it. | Never run; what people understand the screen to say is untested. |
| NX-37-R6 | HYPOTHESIS | Given T1, When 5 parents reach screen 2 (sign in), Then at most 1 of 5 shows a pause over 5 seconds on it plus an attempt to look for a way around it, and at least 4 of 5 give a reason for the sign-in in T1b that is close to what the screen says. | No stranger has seen screen 2. |
| NX-37-R7 | HYPOTHESIS | Given T1 on the Apple and the email path, When the clock marks are written, Then they are recorded to find where people stall, with no pass bar and no comparison to 150 s or 240 s. | NX-31 R15 is the study row for medians; this study cannot supply them. |
| NX-37-R8 | HYPOTHESIS | Given the child step, When 5 parents reach it, Then at least 4 of 5 leave the name empty or fill it while saying they know it can stay empty, and none says they were blocked. | Never observed with the name optional (NX-31 R3, R28). |
| NX-37-R9 | HYPOTHESIS | Given U4 part A, When 5 parents describe Tonight, Then the words they use are written down and sorted; no pass bar. | "Dull" is the founder's word, with no parent evidence. |
| NX-37-R10 | HYPOTHESIS | Given U4 part B (with and without the "From the book" row, order swapped), When 5 parents compare, Then at least 3 of 5 name the row as a reason to open the app, and the count of those who find it noise is written beside it. (A count, not a verdict.) | This is NX-30-R10's study. |
| NX-37-R11 | HYPOTHESIS | Given T1e, When 5 parents say what "kept on this phone" means, Then 0 of 5 believe B1 (also stored somewhere else) while backup is off. Any B1 is a finding and sends the line to `content` and counsel. | No parent has been asked. |
| NX-37-R12 | HYPOTHESIS | Given the 10-minute walkthrough, When the founder fills the flat-moments form, Then he names three moments and ticks one of the four NX-35 hypotheses. | NX-35 F-4 is waiting for this. One person's view. |
| NX-37-R13 | HYPOTHESIS | Given the two relatives (P6, P7), When they run U1 to U5, Then their results are reported on their own lines and are not added to R1 to R5. | A subgroup of two is anecdote. |
| NX-37-R14 | CONDUCT | Given any session, Then no audio, video or screen recording of a participant exists, notes carry only P1 to P7, no real child detail is written or entered, and raw notes are held only where section 10 says. Checked by the founder at close: the notes folder is listed and read once. | A process, not a build row. Test: none, owner `user-research` and the founder. |

## 14. Edge cases

- A person finds Settings by the Book gear in 4 seconds, never touching the last tab: counts for R1's rule, flagged (section 4, U1).
- A person taps the last tab and sees a page with a different name than they expected: write it down; do not explain.
- The email code is late or lands in spam: record how long, what the screen offered, what the person did; it feeds D6 and NX-31 R20, but do not coach.
- The Apple sheet fails or the study account is rate limited: stop, reset, move that person to the other path if time allows, and note it; the session still counts for its other tasks.
- A participant types a real name or birth date: tell them, delete it in the app, do not note it.
- A person cannot make the two sentences up and freezes: the moderator offers "Say what Asha had for breakfast", which is a made-up fact, not words for them.
- The session runs long: skip U6 and the closing R2, keep T1, U1 to U5 and R1.
- A person is upset or says something that suggests risk: section 10.

## 15. Engineering block

Nothing is built by this file. The study asks of engineering only: a TestFlight candidate per section 8, no analytics, a study backend or the production one with Asha accounts that can be deleted (UNVERIFIED which), and the speech model downloadable on Wi-Fi in advance. No schema, grants, API, copy key, event or switch is added. The "From the book" mock in U4 is an image, not code. No data class is created: the notes are research notes about adults, held in the Project docs.

## 16. Trace and tests

| Id | Refines | Layer | Test | Owner |
|---|---|---|---|---|
| NX-37-R1 | NX-30-R1, NX-30a U1 | study | none, study | `user-research` |
| NX-37-R2 | NX-30a (label section), founder ruling 9 Nov | study | none, study | `user-research`, founder |
| NX-37-R3 | NX-30a U5 | study | none, study | `user-research` |
| NX-37-R4 | NX-30-R1, NX-30 T2 | study | none, study | `user-research` |
| NX-37-R5 | NX-31-R25, NX-32 (delete rows) | study | none, study | `user-research` |
| NX-37-R6 | NX-31-R17 | study | none, study | `user-research` |
| NX-37-R7 | NX-31-R15 (not satisfied here) | study | none, study | `user-research` |
| NX-37-R8 | NX-31-R3, R28 | study | none, study | `user-research` |
| NX-37-R9 | NX-30 H1 to H3 | study | none, study | `user-research` |
| NX-37-R10 | NX-30-R10, R2 | study | none, study | `user-research` |
| NX-37-R11 | NX-31-R21 | study | none, study | `user-research`, `privacy` |
| NX-37-R12 | NX-35 F-4 | study | none, walkthrough | founder, `design-systems` |
| NX-37-R13 | NX-30-R19 | study | none, study | `user-research` |
| NX-37-R14 | `user-research` skill, section 3 | process | none | `user-research`, founder |

Trace: NX-37-R1..R14 -> NX-30-R1, R2, R10, R19; NX-30a U1 to U7 (U7 not covered); NX-31-R3, R15, R17, R21, R25, R28; NX-35 F-4, T9. Working ids only; no real id is assigned here (`_CONVENTIONS.md`, section 4).

## 17. Not verified

- The founder's "You" ruling (relayed in the task; no decisions file read).
- The Build 12 submit date, the 14.5 hour device-run figure (given in the task), and the device run sheet itself.
- Which tab bar the candidate has (three or four tabs), whether it has the "From the book" row, and whether first run completes with sign-in on. NX-31 gates G1 to G7 state not checked.
- That Apple and email sign-in are both on in the candidate; the email-code rate limit; whether a study account can be re-created on the same address after deletion.
- Apple's TestFlight rules (internal testers must be App Store Connect users; external needs Beta App Review): from memory, not read this run.
- The NX-36 wireframe file and its branch: not found (fetch of `docs/nx-36-screen-specs-9nov` failed; `ls-remote` lists no NX-36 branch, 9 Nov).
- Tap counts and 10 second feasibility on the candidate: derived from reading code in NX-30a, not measured.
- NX-32's individual rows (I did not re-read them); NX-30 hypotheses H1 to H3 text (cited by id only); NX-35 moment specs M1 to M14 (not read in full).
- The effort estimates in section 7: mine, unmeasured. The incentive cost: not priced.
- Any other research privacy rule in `docs/`: I searched `docs/research` and `docs/agents` for research or consent rules and found none beyond the `user-research` skill; counsel was not consulted.
