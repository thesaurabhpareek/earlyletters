# Next: customer needs (Lane A)

Status: draft for the "next set of requirements" programme, 8 Nov 2026. Desk synthesis only. No new interviews were run. Owner: user-research. This file changes no decision; it gives the team evidence to choose from.

## 0. How to read this

Tags used on every claim that matters:

- **EVIDENCE (cite)**: a file in this repo or a public page I opened. The cite names the file or URL. Repo research files were read on 8 Nov 2026; the date inside each file is its own date. Public pages I opened myself on 8 Nov 2026 are marked "opened 8 Nov 2026".
- **HYPOTHESIS**: our guess. It names the cheapest way to test it (section 4).
- **NOT VERIFIED**: I looked and could not confirm it, or the source was not re-opened.

Rules I held myself to:

- No invented statistics. Every number below is copied from a repo file or a page I opened, and says where. Counts from reviews are directional, because the repo's own method notes say they were coded from short paraphrases (`docs/prd/v2/research/R2-customer-evidence.md` section 1.2; R7 method limit).
- No quotes of my own. Where a parent's words appear in quotes, they are quoted as an earlier repo file recorded them (cite given); I did not re-open the original posts, so treat them as "as recorded in the repo". Everything else is paraphrase.
- "Importance" and "bite" ratings (High, Medium, Low) are my judgement from the evidence, not measurements.
- No real family details. Where an example helps, it uses the fictional family Asha.

What the product already does well, so the list below is read as "what could come next" and not as a shortfall: speak a letter in under a minute with speech turned into words on the phone; every small fix shown and reversible; the recording kept; a book filed by the child's age; a co-parent who joins free; core writing, reading, playing and export free forever; Read together; reminders that never count anything; several children; a due-date mode (`docs/prd/v2/03-goals-and-principles.md` sections 1 and 3; `docs/prd/v2/02-customers.md` section 3).

### Sources read for this file

Repo (read 8 Nov 2026):
`CLAUDE.md`; `docs/research/USER_RESEARCH.md` (UR, 1 Oct 2026); `docs/research/COMPETITIVE_RESEARCH.md` (CR, 1 Oct 2026, first 80 lines); `docs/research/competitors/us.md` (searched for grandparent and relative lines only); `docs/research/NOTIFICATION_EVIDENCE_2026-11-01.md`; `docs/prd/v2/01-problem.md`, `02-customers.md`, `03-goals-and-principles.md`; `docs/prd/v2/research/R2-customer-evidence.md` (3 Oct 2026), `R7-sentiment-refresh-2026-10-28.md`; `docs/backlog/FUTURE.md`; `docs/backlog/future/02-family-circle.md` (first 120 lines); `docs/qa/ALPHA_GO_NO_GO.md` (first 60 lines).

Not opened in full, so anything that depends on them is NOT VERIFIED here: `docs/backlog/future/01`, `03`, `04`, `05` (read only through their summary in `FUTURE.md`); R1, R3 to R6 research files; `docs/prd/v2/features/*`; `docs/backlog/FUTURE-REBASELINE-2026-10-28.md`. There were no bug-hunt notes in `docs/qa/` for the TestFlight alpha; the notes named in the brief (`product/qe-bug-hunt-2026-11-08.md`) live in the Project, not the repo, and I did not read them.

Public pages I opened myself (8 Nov 2026):

- BLS, American Time Use Survey 2025 results, released 25 Jun 2026: https://www.bls.gov/news.release/atus.nr0.htm
- MadeForMums, "6 in 10 new mums say they're rarely in photos with their baby", published 9 Mar 2026 (survey commissioned by the photo printer CEWE): https://www.madeformums.com/news/family-news/new-mums-rarely-in-photos-with-kids
- Georgia Tech repository record, Bandlow, Vaughan and Stevens, "Capturing Memories: How parents record and archive items about their child's life", technical report, 2001: https://repository.gatech.edu/items/b5e37c82-f0f7-4964-a3a9-af59aa267888

A web search also returned a vendor survey page and a news aggregation I did not open; I do not use them.

### What is known about the people using the product today

The alpha is a TestFlight build in a family group. The founder-flagged problems so far were Listen and recording, the date-of-birth picker, consent links and the wait for the first download (task brief for this lane, 8 Nov 2026). The brief is the only source; the number of testers, their phones and the exact wording of each report are **NOT VERIFIED**. A family-and-friends group is a friendly, close-to-the-founder sample, so it cannot stand in for parents who found the app cold. Everything in section 4 is meant to widen that.

---

## 1. Customer segments and jobs to be done

Personas P1 to P6 already exist (`docs/prd/v2/02-customers.md` section 3). This section reorganises them by situation, adds the ones the PRD only touches, and states each segment's job. Phrases in quotes are as recorded in repo research files; everything else is paraphrase.

| # | Segment | Job, in their words | Evidence |
|---|---|---|---|
| A | **Evening parent of a baby** (first child, often the mother, one hand free) | "Help me capture this moment in under a minute, one-handed, before it's gone." The unfilled book "can sit in the closet, quietly making you feel like you failed", and what helped one parent was an app that "doesn't make me feel behind." | EVIDENCE: UR section 5 and section 1.1 (quotes as recorded from UR S24); R2 T13 (31 reviews praise ease), T27. Time: BLS 2025 release, households with children under 6, 2.3 hours a day of primary childcare, 4.2 hours a day of secondary childcare on weekdays and 7.7 on weekend days (opened 8 Nov 2026). |
| B | **Parent of the second or third child** | Paraphrase: do for the next child what I did for the first, without a second round of effort. A younger sibling can resent having no book. | EVIDENCE (weak): UR section 1.4 (UK survey, 2013, commissioned by a photo studio, directional; and one Reddit signal, S26). R2 T18: 4 positive reviews on several children. HYPOTHESIS on what they need beyond "easy to add". |
| C | **Co-parent** (often the father) | Paraphrase: write or record to the child on my own schedule, in my own voice, and have it land in the same book. Fathers in the posts write letters or record videos to the future child. | EVIDENCE (thin): UR section 1.4 (S25, S30); R2 section 5 P2 (1 of 287 reviews mentions a partner contributing). We know little about this segment. |
| D | **Expecting parent** | Paraphrase: use the weeks before the birth so I know what to capture and can write to the child already. Pregnancy notifications can feel wrong. | EVIDENCE: UR section 1.1 (S27); R2 T28 (3 reviews: preterm adjusted dates, pregnancy notification felt wrong, praise for pregnancy-to-infancy pages). |
| E | **Multilingual family** (for example Hindi-English, Spanish, Mandarin) | Paraphrase: keep my language, my script and my family's names exactly as spoken, and keep the voice of the grandparents who carry the language. | EVIDENCE for motivation: UR section 1.4 (72% of Indian Americans aged 5 and over speak another language at home, Pew via UR S13); R2 section 4.10 (85% of US Latinos say it matters at least somewhat that future generations speak Spanish). EVIDENCE for the technical risk: UR S12. HYPOTHESIS for app use: R7 theme 15 found zero reviews or posts about language in 156 reviews. |
| F | **Grandparents, aunts, uncles, close friends** (author or reader) | Paraphrase: see and hear the baby grow, and be asked something I can answer. One recorded line in the repo: a Reddit commenter said the app "keeps the grandparents from doomscrolling" (`docs/research/competitors/us.md` line 165, as recorded). Some relatives will not install an app. | EVIDENCE: R2 T10 (31 positive reviews across 10 products credit family sharing, 25 of 80 positive reviews of baby memory apps); UR S15 (76% of US grandparents say digital tools are a primary way they stay connected, AARP); R2 T24 (8 Remento reviews describe users in their 80s to 100 recording on their own). Counter-signal: UR section 1.4 (an aunt writing in a baby book without asking caused real distress, S28). |
| G | **Gift giver** (grandparent or relative) | Paraphrase: give the new parents something lasting. | EVIDENCE for gifting elders: R2 T21 (7 gift reviews, Remento, Chatbooks, Storyworth); UR S15. NOT VERIFIED for gifts to new parents: R7 "Unmet needs" item 7 says that direction is not evidenced. Low at v1.0 (`02-customers.md` section 4 rank 9). |
| H | **Parent coordinating across homes or phones** (separated parents; one iPhone and one Android parent) | Paraphrase: let both of us keep adding to one book without it becoming a fight or a dead end. | EVIDENCE (weak): UR section 1.1 (50% of divorced parents wish they had saved more, YouGov via UR S8). HYPOTHESIS on how many couples are mixed-platform: `docs/backlog/future/02-family-circle.md` A4 (25%, labelled an assumption there), R2 U8 unresolved. |
| I | **The child, years later** (reader) | Paraphrase: a book that makes sense without the app, in the family's voices. | EVIDENCE: UR section 1.3 (S30: an email account kept for the child and handed over at 18); R2 T11 and T23 (voice and legacy are the most-named values in Remento and Storyworth reviews, 13 and 30 reviews; these are mostly about older relatives, R7 theme 6). |

Reading the table: segments A, C and F carry most of the evidence. Segments B, G and H are mostly signals. The child (I) is never a research participant.

---

## 2. Unmet needs and pain points, ranked

Ranking: first by how often the need shows up across independent sources, then by how hard it bites (leaving the product, losing trust, or losing a memory). "Bite" and "How often" are my judgement from the cited evidence. "Served today" says what the product already does, so nothing here reads as a shortfall.

| Rank | Need or pain (from the parent's side) | How often | Bite | Tag | Evidence and what is served today |
|---|---|---|---|---|---|
| 1 | **It must just work: record, hear it back, never lose it.** Includes Listen and recording behaving, and a clear "saved". | High | High | EVIDENCE | R2 section 0 item 1: 41 of 104 negative or mixed reviews (39%) are about bugs, crashes, sync or lost work; 9 describe work that vanished. Founder-flagged TestFlight problems with Listen and recording (task brief 8 Nov 2026; details NOT VERIFIED). Served: save before anything else, kill-during-save drills (`docs/qa/ALPHA_GO_NO_GO.md` B1-7, B2-11), export free. |
| 2 | **Getting started without fiddly steps or a long wait.** The date-of-birth picker, consent links that read plainly, the first download of the speech files. | High (during first week) | High (first impression) | EVIDENCE (occurrence), HYPOTHESIS (effect on keeping) | Four founder-flagged alpha problems (task brief; NOT VERIFIED beyond the list). Also UR R1 (first letter within about 90 seconds, no tutorial); UR section 2.2 (NN/g: tutorials gave no gain in task success). The 90 s target is not yet measured with a parent who found the app cold (`02-customers.md` section 7 U1; `03-goals-and-principles.md` section 4.2). |
| 3 | **Relatives can see, hear and add**, ideally without installing an app. | High | High | EVIDENCE | R2 section 0 item 7 and T10: family sharing is the second most-praised theme in photo-album apps after privacy. Risk R-05 in the PRD: parents arriving from Tinybeans or 23snaps may expect grandparents on day one (`02-customers.md` P5). Competitors answer it with phone lines and no-login links: CR section 2 (Remento storyteller needs "no apps, downloads, or logins"); `us.md` (Tiny Treasures family phone line, withyou). Served: co-parent only at v1.0; grandparents planned from v1.1 to v1.2 (`FUTURE.md` sections 3.2 and 3.3, a proposal). |
| 4 | **A reason to open it again that does not feel like homework** (right age, not repeated, not too many, parent picks the time). | High | High (muted or deleted) | EVIDENCE | R2 T4 (27 reviews praise prompts) against T5 (4: repeat or misfit) and T6 (5: too many messages). UR section 3 (92 of 200 Qeepsake reviews mention prompts or reminders, 20 of 43 negative ones). `NOTIFICATION_EVIDENCE_2026-11-01.md`: no published evidence on the best time for new parents; only controlled test found shows more weekly messages raised uninstalls (retail app, so direction only). Served: F13 reminders, age-aware prompts, back-off. How well they work for real families is HYPOTHESIS. |
| 5 | **Trust about money: nothing I made is held back, charges are plain.** | High (category-wide) | High | EVIDENCE for the fear; HYPOTHESIS for our gate | R2 T2: 10 of 10 reviews about a new paywall on old features are negative. R7 Bottom line 1 and 2: 30 of the 40 newest Chatbooks reviews are about price, surprise charges, cancelling or expiring credits; 9 reviews across Chatbooks and Qeepsake describe losing access when payment stopped. Whether "first 2 letters free, then Plus to keep more" feels fair is untested (`02-customers.md` U9). Served: every letter stays readable, playable and exportable with or without Plus. |
| 6 | **Catching up and bringing in what I already have** (earlier months; voice memos; photos with their dates). | Medium | Medium | EVIDENCE | UR section 1.1: starting late means rebuilding from texts and photos (S27). R2 T25: all 6 chronology reviews are complaints (feed order, hard to add missed days, a fee to backdate). UR section 1.3: voice memos of a toddler (S30b). Dearest imports voicemails and voice memos with original dates (R2-S7). Served: backdating (UR R10 as a requirement; whether and how it is built was not checked). Import is Later (`FUTURE.md` CVL-12). |
| 7 | **Names and mixed languages kept as spoken**, with anything the speech missed marked, not dropped. | Medium (core to segment E) | High (trust) | EVIDENCE (risk), HYPOTHESIS (demand) | UR S12: off-the-shelf speech scored a 52% error rate on Hindi-English mixed speech (Interspeech 2025 paper, as recorded in UR) and tends to drop words at language switches. CR S27 as recorded: a rewrite tool dropped proper nouns. R7 AI section: one Remento reviewer (8 Sep 2026) said generated text dropped proper nouns. But zero consumer reviews or posts about language (R7 theme 15). Served: per-language gate, names dictionary; Hindi-English in one letter planned v1.1 (`FUTURE.md` CVL-01). |
| 8 | **The co-parent hears the other parent's voice on their own phone.** | Medium | Medium to High | EVIDENCE (gap is fact), HYPOTHESIS (demand) | `02-family-circle.md` section 1 fact 6: in v1.0 a co-parent reads the other's letter but can hear it only on the recording phone or from an export; `FUTURE.md` says the free family promise is "half true" without it. Review evidence for partners is thin (1 of 287). Tiny Voices reviewers could not generate a partner share link (R7 theme 9: 2 reviews). Planned v1.1 (FAM-03). |
| 9 | **Something to hold: a finished book.** | Medium | Medium | EVIDENCE | R2 T3: 26 praise annual printed books; 19 complain about cost or quality; blank pages after prompts were removed (one person's three comments, counted as one signal). Served: PDF and audio export, free. Print is later (`FUTURE.md` BK-13, BK-14, go/no-go June 2027). |
| 10 | **Hearing it back and a quiet moment when a month is complete.** | Medium | Low to Medium | HYPOTHESIS | UR section 5 delights 1 to 3 and 5 (reading entries aloud, handover at 18, a finished book per year, as signals). Read together exists; use unknown (`02-customers.md` U5). |
| 11 | **Sealed letters and handover at 18.** | Low to Medium | Medium | EVIDENCE (signals) | UR S30 (sealed birthday letters; an email address for the child handed over at 18). Dearest offers sealed letters (R2-S7). Planned later (`FUTURE.md` BK-03, FAM-13). |
| 12 | **One-handed, no-look capture** (lock screen, widget, contact nap). | Medium | Medium | EVIDENCE (signals) | UR S29b (parents on a contact nap want to do it on the phone), UR R6. Quick capture is "promote if beta shows capture friction" (`FUTURE.md` rank 39). The alpha group has not yet reported on it (NOT VERIFIED). |
| 13 | **A mixed-platform couple can both join.** | Unknown | High for those couples | HYPOTHESIS | v1.0 is iPhone only (`02-customers.md` P2). Share of mixed couples unknown (U8). `FUTURE.md` section 3.1 (L5) plans a counter in the invite sheet. |
| 14 | **A person answers when I ask for help.** | Medium | Medium | EVIDENCE | R2 T15 (22 support reviews, 6 negative). R7 theme 4: 17 items about unreachable support or refused refunds (13 of them Chatbooks). R7 Risk 8: solo team. |
| 15 | **Privacy that holds in everyday places** (lock screen previews, system search, app lock). | Medium | High when it fails | EVIDENCE (mixed) | R2 T9: privacy named in 29 of 80 positive reviews of baby memory apps; 2 describe failures (passcode bypassed through system search; private photos seen by the wrong people). R7 theme 13: 0 of 156 newer reviews name privacy as a reason, so the October 2026 weight is unconfirmed. Face ID lock is Later (`FUTURE.md` T5-14). |
| 16 | **The parent is in the book too**, with their voice. | Unknown | Unknown | HYPOTHESIS | Survey of more than 500 UK mothers commissioned by a photo printer (published 9 Mar 2026, fieldwork dates not stated; opened 8 Nov 2026): 58% say they are rarely or never pictured with their baby in the first year, and 88% say they are the usual family photographer. This is about photos, so a voice letter doing this job is our guess. |
| 17 | **Re-record only part of a take**; speak about a photo. | Low | Low | EVIDENCE (single signals) | R7 Unmet needs items 1 and 2 (one Remento reviewer each). |
| 18 | **Voice-first access for older or less sighted relatives.** | Low to Medium | Medium | EVIDENCE (signals) | R7 Unmet needs item 4 (a reviewer with macular degeneration; a father who needed speech-to-text). R2 T24 (elders recording alone). |
| 19 | **Dates that fit a preterm birth.** | Low | High for those families | EVIDENCE (weak) | R2 T28 and R2 section 5 P3 (preterm parents asked for adjusted dates). Handle with a perinatal organisation's review before any test (`02-customers.md` section 7 closing note). |

What I could not rank at all: separated-family needs beyond safety (HYPOTHESIS; `02-family-circle.md` plans a floor, not demand data), and gifts to new parents (NOT VERIFIED).

A caution on the top of the list: ranks 1 and 2 are strong in the category's reviews but the alpha evidence behind them is four reports from a family group. They tell us where trust is thinnest right now, not how many parents would meet the same problem.

---

## 3. Moments in the year when the product is opened or set down

Each row is a moment, what the parent is likely doing, and why they may open or set the app down. "Source" shows whether this is evidence or our guess.

| Moment | What is happening | Opens because | Sets down because | Tag and source |
|---|---|---|---|---|
| **The first week with the app** (new install, or just home with a baby) | Highest intent; least time and patience for set-up. | Wants the first letter in the first minutes. | A fiddly set-up screen, a long first download, a consent link that does not read plainly, or a recording that does not behave. | EVIDENCE: four alpha reports (task brief); UR section 2; CR section 2 (Tinybeans' older sign-up flow caused fatigue). Install-day dominance: 82% of trial starts happen on install day (RevenueCat, as recorded in UR section 4.2, S5). |
| **Newborn nights, about weeks 2 to 8** | One free hand, a dark room, a sleeping baby close by; fragmented sleep. | A thing worth keeping just happened; contact nap with a phone in hand. | Speaking aloud may wake the baby (U1: untested); a reminder at the wrong hour. | HYPOTHESIS for speaking at night (U1). EVIDENCE: UR S29b; `NOTIFICATION_EVIDENCE` section 1 (a 24-mother study found night sleep heavily interrupted; small sample). No published best notification time for new parents. |
| **Month birthdays** (the child turns 1 month, 2 months, and so on) | A natural, calm anchor the parent already feels. | A "turns 7 months on Friday" kind of note; time to write about the month. | A month with nothing recorded can feel like a failure if the wording is wrong. | HYPOTHESIS: UR section 3 (acceptable-reminder idea marked A). Never count gaps: `CLAUDE.md` content rules. |
| **First words, first steps, first foods** (milestones the parent chooses) | A moment parents are excited to keep. | Immediate wish to say it out loud. | Needs one-handed, fast capture. | EVIDENCE (weak): R2 section 3.1 (one parent excited a 2-month-old may have said a first word). We do not build milestone checklists (`FUTURE.md` 7.6). |
| **When parental leave ends, often cited as about 3 to 4 months** | Time shrinks; the second drop-off wave. | Evenings and weekends only. | Habit fades. | HYPOTHESIS. The return-to-work timing is **NOT VERIFIED**: R2 section 4.5 says no source opened gives it. 68.0% of mothers of children under 6 are in the labor force (BLS, as recorded in R2-S30; I did not re-open that page). |
| **Meeting the paid step: the third letter, then the end of a trial** | Decision point. | Value has been seen. | A gate that feels like a trick, or a worry that waiting letters are unsafe. | EVIDENCE for the fear (R2 T2, R7 themes 1 to 3); our gate untested (U9). |
| **Relatives' visits and calls** (grandparents in town; a video call; a holiday the family chooses) | Family time; a natural moment to play a letter or ask someone to say something to the child. | Wants to show or play something; wants a relative to add a line. | Relative cannot install the app or sees nothing. | HYPOTHESIS. No repo source studies visits as a moment; closest is relatives adding content (R2 T10). Recorded as a topic for the diary in section 4. We do not infer occasions from names or language (`FUTURE.md` 7.3); occasions would be opt-in only. |
| **Mother's Day and Father's Day** | Time of reflecting on the parent's own role. | Cards, gifts. | n/a | HYPOTHESIS. The roadmap plans keepsake work around Mother's Day 9 May 2027 (`FUTURE.md` section 0). |
| **First birthday and each birthday after** | A natural looking-back moment; year-in-review desire. | Wants a book or a playback of the year. | Nothing prepared. | EVIDENCE (signals): R2 T3p (printed annual books); UR delight 5. Planned v1.3 (`FUTURE.md` BK-04 to BK-07). |
| **After a bug or a muted reminder** | Trust dip. | n/a | Quiet loss of faith; deletion. | EVIDENCE: R2 T7, T8; UR section 3 (muted prompts). |
| **Years later (handover)** | The child, at 18 or earlier, reads. | Receives the book. | n/a | EVIDENCE (signals): UR S30. |

I did not find evidence for the exact hour of day parents would like to be asked; the notification evidence note says the same.

---

## 4. Research plan for the gaps

Principle (from my brief): start every study with the decision it changes; if none, do not run it. Existing studies are in `docs/prd/v2/02-customers.md` section 7 (Studies 1 to 3). This plan adds to them and reuses the alpha. Recruiting, incentives and any paid tool are founder decisions, so costs are not stated here. The founder or a human researcher runs sessions; I plan, write guides and synthesise.

### 4.1 Gaps and the cheapest way to close each

| # | Gap | Decision it changes | Whom to ask | Method | Size | Tag of the gap |
|---|---|---|---|---|---|---|
| G1 | Does the first minute work for a parent who found the app cold? (picker, consent links, download wait, first record) | What to fix before wider TestFlight, and the copy around the download | New parents not in the founder's circle, babies up to 9 months; include 2 who use VoiceOver or large text | Moderated usability test, 30 minutes, think-aloud, on their own phone with a test child profile for Asha | 5 to 8; stop when the same problems repeat | HYPOTHESIS on effect; EVIDENCE of 4 alpha problems |
| G2 | When and where do parents record, and do they speak aloud near a sleeping baby? | Default to speak or type at night; reminder window | Parents of babies 0 to 9 months | Two-week diary with a two-question nightly form, then a 30-minute interview (this is Study 1 in `02-customers.md`) | 14 to 16 as already planned | HYPOTHESIS (U1, U7) |
| G3 | What brings a parent back or lets it go? | Reminder cadence and prompt wording; what the app leads with after week 2 | Parents who started a baby book or memory app and stopped, and parents who kept going | Interview, 45 minutes, "walk me through the last time" structure from UR interview guide questions 1 to 5 | 8 to 10 | HYPOTHESIS |
| G4 | What do relatives need to see or hear, and what stops them? | Order of grandparent features; no-install path | Grandparents and close relatives (adults), some with Android or no smartphone; and the parents who would invite them | Paired concept interviews with a clickable prototype (Study 3 covers co-parents; extend to 6 relatives as in R2 section 8.2) | 6 relatives, 6 parents | HYPOTHESIS on demand; EVIDENCE of general demand |
| G5 | Do co-parents want to hear each other's voices, and how do they split writing? | Priority of shared voice; co-parent prompts | Couples, both partners, including 2 where one partner is not the main writer | Paired sessions (Study 3), 60 minutes | 8 couples as planned | HYPOTHESIS |
| G6 | How common are mixed-platform couples and what do they do now? | Whether Android moves earlier | Couples in recruiting for the above, plus a screener question | Two screener questions; the in-app invite counter after launch | Whole screener pool | HYPOTHESIS (U8) |
| G7 | Does "first 2 free, then Plus to keep more" feel fair, and do parents believe a waiting letter is safe? | Gate copy and allowance | 150 to 200 parents of children under 3 plus 8 follow-ups | Study 2 as planned (unmoderated test plus follow-ups) | as planned | HYPOTHESIS (U9) |
| G8 | Are names and language switches kept well enough that families trust it? | Which languages ship, what is marked | Hindi, Spanish and Mandarin speaking families | Scripted three-sentence read-aloud plus a short interview inside Study 1 | at least 2 per language, as planned | EVIDENCE (risk), HYPOTHESIS (demand) |
| G9 | What do relatives' visits and calls look like as a moment? | Whether a playback or a "say hello" path has value | Parents and grandparents together | Add a "visits and calls" question to the G2 diary and G4 interviews | no extra people | HYPOTHESIS |
| G10 | Whether the parent's own voice in the book matters to them (the missing-parent-in-photos idea) | Whether to lead the story with it | Parents, any age of baby | 3 questions at the end of G2 and G3 interviews; no separate study | no extra people | HYPOTHESIS |

Sample sizes are small on purpose: they are enough to see repeated problems in a usability test or an interview round, not to measure rates. No number from this plan should be reported as a share of parents. Rates come only from the opt-in analytics and App Store Connect once the app is live (`03-goals-and-principles.md` section 4).

### 4.2 Biases to name in every finding

- The alpha family group is friendly and close to the founder; its feedback is not the voice of strangers (section 0).
- Recruiting through parenting forums finds people who already write about this topic.
- Review counts are directional (R2 section 1; R7 method limit).
- Paid panels and incentives bring people who sign up for studies.
- Fathers and relatives are thin in the evidence, so recruit them on purpose.

### 4.3 Consent and privacy rules for research with parents

These follow `CLAUDE.md`, the user-research brief and PRIV-R21 (every agreement carries the Shown, Records, Never and Decline lines). They bind anyone who runs a session.

1. **Adults only.** Participants are parents, co-parents and relatives aged 18 or more. No child is interviewed, observed, recorded or asked to try the app. A child may be in the room by chance; we do not note anything about them.
2. **Consent first, in plain words, before anything is recorded.** The consent text for each study states: Shown (what the participant is shown), Records (exactly what we keep: notes, and a recording only if they agree), Never (we never put a child's name, a letter's words or anything that identifies the family in a file or report), and Decline (they can skip any question or stop at any time with no effect on any incentive agreed in advance).
3. **No real child names, no letter text, no identifying quotes in the repo.** Findings use participant codes (P-01, P-02) and, where an example is needed, the fictional family Asha. Quotes in findings are cut to remove names, places and anything that could identify a person. Raw notes, recordings and consent forms stay outside the repo; only the researcher and the founder hold them.
4. **Testers never type or screenshot a child's name or a letter's words into TestFlight feedback** (the alpha rule in `docs/qa/ALPHA_GO_NO_GO.md` B1-11). Sessions use a test profile for Asha, or a profile the participant creates with a nickname they choose.
5. **Nothing that writes, rewrites or summarises a person's words** is ever shown as a study concept. Faithful-versus-polished comparisons (Study 2) show a version only as a competitor-style stimulus clearly labelled, and use test text, never a real letter.
6. **Sensitive topics.** Do not ask about a participant's health, mood or loss. If a participant raises it, acknowledge it kindly, offer to pause or stop, and do not follow up. Bereaved parents and families in intensive care are not recruited for early flows; any copy touching them is reviewed by a perinatal organisation first (`02-customers.md` section 7).
7. **Data minimisation.** Recruiting forms collect only what a screener needs. Contact details are kept apart from notes and removed when the study closes. Voice samples gathered for speech checks are kept in `experiments/` for evaluation only and are never used to train anything (`FUTURE.md` section 7.3).
8. **Who runs sessions.** The founder or a human researcher. The user-research agent does not contact participants.
9. **Plan before recruiting.** Each study's plan goes in a pull request for `product` review before anyone is recruited. Incentives and tools are the founder's call.

---

## 5. Candidate opportunities

At most 25, one line each, written from the customer's side, in plain words. Each carries a tag and its main cite. They are candidates, not recommendations; the roadmap id in square brackets, where one exists, is from `docs/backlog/FUTURE.md`. No effort or return numbers are given here.

1. I tap Speak and it records every time, I can hear it back at once, and I see it is saved. EVIDENCE (R2 T7, T8; alpha reports, task brief)
2. I set up {child}'s birth date or due date in a few easy taps with one hand. EVIDENCE (alpha report, task brief; R2 T28 on preterm dates)
3. The terms and privacy links open a page that reads plainly and takes me back to where I was. EVIDENCE (alpha report, task brief)
4. If the speech files need to download, I am told the size, I can wait for Wi-Fi, and I can keep recording while words catch up. EVIDENCE (alpha report, task brief; R2 T30 on mobile data use)
5. My first letter is saved within the first minutes, with no tour in the way. EVIDENCE (UR section 2.2, UR R1; not yet measured on a stranger)
6. My partner can hear my voice on their phone, not only read my words. EVIDENCE of the gap (`02-family-circle.md` fact 6); HYPOTHESIS on demand [FAM-03]
7. A grandparent opens a link and records a hello for {child} without installing anything. EVIDENCE (R2 T10, T24; CR section 2 Remento; `us.md` phone-line entries) [FAM-05, FAM-07]
8. A relative who only wants to listen and read can, without being asked to write. EVIDENCE (`02-family-circle.md` principle 3; R2 T10) [FAM-06]
9. I can send a relative one question they can answer by voice. EVIDENCE (R2 T4; R7 theme 10: 17 reviews praise prompts that get relatives talking) [FAM-09]
10. I hear when a family member has added a letter, without a name or words on my lock screen. EVIDENCE (`02-family-circle.md` fact 11: co-parent letters arrive silently today; R2 T6 on too many messages) [FAM-17]
11. My partner on Android can join our book. HYPOTHESIS (U8; `02-family-circle.md` A4 marked as an assumption) [FAM-14]
12. I can write about a month I missed, with the dates of my photos next to it. EVIDENCE (UR S24, S27; R2 T25) [UR R10]
13. I can bring in voice memos I already have, keeping their original dates. EVIDENCE of the habit (UR S30b; Dearest, R2-S7); HYPOTHESIS on demand [CVL-12]
14. I can start a letter from the lock screen or a widget with one hand. EVIDENCE (UR S29b, UR R6) [CVL-13]
15. I can re-record just one part of a take and still keep the first take. EVIDENCE (single signal: R7 Unmet needs item 1)
16. I can speak about one photo and keep the two together. EVIDENCE (single signal: R7 Unmet needs item 2) [CVL-10]
17. Names are spelled my family's way, and a fix I make once is remembered. EVIDENCE (UR S12; CR S27; R7 AI section) [CVL-03]
18. I can speak Hindi and English in one letter, and any word the speech missed is marked rather than dropped. EVIDENCE of the risk (UR S12); HYPOTHESIS on demand (R7 theme 15) [CVL-01, CVL-06]
19. My reminders arrive when I chose, fit my child's age, never repeat, and stop gracefully if I am busy. EVIDENCE (R2 T4 to T6; `NOTIFICATION_EVIDENCE`) [F13]
20. When a month is complete I can play it back once, in each person's voice, with no fuss. HYPOTHESIS (UR delights; U5) [BK-01]
21. I can hold the year: a book that prints from my letters exactly as they are. EVIDENCE (R2 T3) [BK-13, BK-14]
22. I can seal a letter to open on a birthday or at 18. EVIDENCE (UR S30; Dearest) [BK-03]
23. Before I pay, a plain page says what stays free, what keeping more needs, and that my letters stay mine either way. EVIDENCE for the fear (R2 T2; R7 themes 1 to 3); HYPOTHESIS on whether the current wording lands (U9)
24. When I write to support, a person answers within a day. EVIDENCE (R2 T15; R7 theme 4)
25. I am in the book too: my voice sits beside the photos where I am usually the one behind the camera. HYPOTHESIS (MadeForMums/CEWE survey, 9 Mar 2026: 58% of more than 500 UK mothers rarely or never pictured with baby; photo-printer commissioned)

Not on the list because the repo's will-not-build rules forbid them: streaks or counts of missed days, read receipts, milestone checklists, machine-written recaps, translated or synthetic voices (`docs/backlog/FUTURE.md` section 7).

---

## 6. What I could not verify

- The founder's alpha problem list exists only in the task brief. Its details, frequency and tester count are NOT VERIFIED.
- Return-to-work timing after a birth, and the best hour for a reminder to new parents: no source found (R2 section 4.5; `NOTIFICATION_EVIDENCE` section 1).
- Whether any real parent wants a recorded parent's voice for the child: only older-relative evidence exists (R7 theme 6). The Georgia Tech study (2001, sample size not stated on its page) says only that parents struggle to preserve and organise memories while also being caregivers; it adds no numbers and is old.
- BLS: the 2025 release (opened 8 Nov 2026) gives 3.2 hours of leisure a day for employed adults in households with children under 6 and no figure for all adults. R2 and `01-problem.md` quote 3.2 hours for adults whose youngest child is under 6 from the 2024 Economics Daily page; I did not re-open that page, so the two are not reconciled here.
- Whether parents of second children, separated parents or gift buyers have needs beyond what is listed: evidence is weak or absent.
- Reddit, BabyCenter, What to Expect and Mumsnet threads: not reachable in earlier passes (R7 gaps), and I did not retry them.
- The rest of the future backlog files (01, 03, 04, 05) and the feature specs F01 to F21 were not read in full.
