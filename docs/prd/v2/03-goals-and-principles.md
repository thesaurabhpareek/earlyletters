# 03. What we are solving: promise, principles, goals and metrics

Status: Draft V2.1, 13 Oct 2026. Revised after critique round 1 (R1 PL-02, PL-06, PL-08, PL-13, PL-15 to PL-18, PL-24, PL-27; R3 DX-04, DX-28, DX-39; R4 PT-13; R6 rows 40 and check 3 row 20) and for M15 to M17 (`_AUTHORING.md` section 3b). Dates are milestone ids from `08-delivery.md` section 2.1.

## 1. The promise

**Early Letters is the baby memory book you fill by talking. Your words are kept exactly as you said them, with your voice, filed by your child's age, for your child to read and hear for years.** (Positioning from `packages/content/BRAND.md`.)

Four things must be true for that sentence to hold:
1. **Exactly as you said it.** The machine removes and repairs; it never adds meaning (CLAUDE.md constitution). Typed text is never machine-edited (B5).
2. **Kept.** Nothing a parent records is lost or silently changed (ARCHITECTURE quality attribute 1).
3. **Private.** Never sold, never used for ads, never used to train models (B9). Letters reach our server to sync to the family's own book; the owner's recordings reach it encrypted for backup, and we hold a recovery key under strict, logged access (M16).
4. **Yours, always.** Every letter you write stays yours to read, play and export, with or without Plus, and deleting is always free; a 90-day shutdown pledge (PRD-REQ-009). This is not free writing: the first 2 of your own letters are free, counted once their words exist and you have seen them, and keeping more needs Plus (M1, M17). A letter waiting at that gate is kept as safely as a letter in the book: on the phone, and for a signed-in parent also synced as a private draft and, with backup on, its recording backed up (F14-REQ-039).

## 2. Problem statements and the outcome we want

| # | Problem (from 01) | Outcome we commit to | Measured by |
|---|---|---|---|
| PS1 | Parents have minutes, not hours, and often one hand | A letter is captured in under a minute, one-handed, in the dark | Median first launch to first saved letter 90 s or less in the lab and in C1 sessions; tap to microphone live p95 500 ms |
| PS2 | Losing work is the most common complaint in the category | Zero letters or recordings lost or silently changed, ever, including letters waiting at the Keep gate | Lost-letter incidents (gate: zero); kill-during-save test 500 of 500; held letter survives phone loss when signed in with backup on (F14-REQ-039) |
| PS3 | Products rewrite people's words | Every machine change is a typed, reversible, visible repair | Every edit passes `verifyEdits`; edit revert rate under 5% overall |
| PS4 | People pick a family memory app partly for privacy (29 of 80 positive reviews name it, R2 section 0 item 2; directional, coded from short paraphrases, R2 section 1.2) | Letters go to our server only to sync to the family's own book; the owner's recordings go only encrypted, for backup, with a recovery key we hold under logged access; never sold, never used for ads or to train models; no tracking | Privacy label with no "Data Used to Track You"; label 1.4.0 (counsel, T30) lists only data linked for app functionality [A]; log canary zero hits; every recovery-key use logged and reviewed (M16) |
| PS5 | Baby books stall and make parents feel behind | A book that grows at the family's pace with no guilt | Weekly making families (4.1); no streak or gap copy (content test) |
| PS6 | Families speak more than English | Each author writes in their own language and script, kept as spoken | Per-language gate pass (F05); author correction rate per language |
| PS7 | Memories feel held hostage by paywalls and shutdowns | Reading, playback and export of every letter already made never depend on paying; the only paid step is keeping a new letter after your first 2 with words you have seen; the gate never appears before a parent has seen a transcript; a letter waiting at the gate is kept as safely as a kept one | Lapsed offline export test passes (PRD-REQ-026); zero existing letters behind Plus; zero Keep sheets shown on a Keep without words on screen (F14-REQ-037); zero held letters lost (F14) |

## 3. Principles (how we decide when a spec is silent)

1. **The constitution beats every feature.** If a feature needs the machine to add, reword, summarise, translate or "shape" words, the answer is no. This includes translation for a co-parent who does not read the language.
2. **Durability before delight.** A letter is saved before anything else happens: before transcription, before sync, before any sheet or prompt. When in doubt, keep the audio.
3. **Privacy by default, said plainly.** Content leaves the phone only to sync to the family's own book and, for the owner's recordings, as an encrypted backup with a recovery key we hold under logged access (M16). Say it once, in the right place, and back it with a control (B9). Never say more than the system does: no "only your family's keys" claim anywhere.
4. **Celebrate what exists, never count gaps.** No streaks, points, badges, missed-day counts or "you haven't" copy (CLAUDE.md content rules).
5. **The original is always one tap away.** Every transcript links to its recording; every machine edit can be undone; the listening copy never replaces the original (B6).
6. **What you made stays yours.** At v1.0 Plus gates one thing: keeping a new letter after your first 2 (M1, M17). `backup_upload` and `theme_extra` stay in `GatedFeature` in `packages/core/src/plan.ts` with no caller (F14-REQ-022). Reading, playing, exporting, deleting and restoring a backup are in `FreeForever`; restoring from Recently deleted is never gated (F09, D-085). The gate holds a letter and never takes it, and never fires before the parent has seen the letter's words. Nothing that is free when v1.0 launches moves behind Plus later, and remote config may only raise the free allowance, never lower it (R2 section 0 item 3: new paywalls drew a negative review every time). Owner backup is free under the spec default [R] (F08 Q2, founder at T07); if the founder makes it a Plus feature, this principle, M1 and the F14 and F21 claims change first.
7. **Standard over custom.** Use what Apple and well-maintained permissive open source provide; add finishing touches on top (B16). Custom native code only where no standard exists (for example the SubscriptionStoreView bridge, R4 C5).
8. **Ship a language or feature when it passes its gate.** A language, model or feature ships when it passes its gate on the reference device (iPhone SE 3rd gen), not when it compiles. Where quality is not there, say so and fall back to what is true (keep the recording, let the author type).
9. **Every screen passes AX5 text and VoiceOver on the iPhone SE 3.** Benchmarks for finish: Calm, Day One, Apple Journal and Apple's own apps (B16).
10. **One ask at a time.** At most one permission or consent sheet per session after the first letter, never during recording, review or export (PRD-REQ-001; F02 owns the session definition and the full ask table).

## 4. Success metrics

Sources: **ASC** App Store Connect (every user, no consent needed); **S** server aggregate (signed-in users only); **D** device analytics (opt-in only, about 40% [A] per F18 section 3, biased toward engaged users). Money comes only from ASC; our server holds only the D-080 status fields, never purchase data (B2, D-080). Every [A] target names its source and the reading that resets it.

### 4.1 The two headline numbers

1. **Business: paying families over first-time downloads, by install week (ASC).** A family counts once a paid period has started. Target **5% at week 8** after release (T39) [A]: R3's Base input, which R3 states over families who installed and saved a letter (R3 section 5.1). First-time downloads are a larger denominator, so this target is stricter than R3's; T39 resets it. No consent needed, and the gate cannot hide it. This is the number that decides the membership rule review in F14 section 6.9.
2. **Habit: weekly making families (WMF).** Families where any author made at least one letter in the last 7 days. "Made" means saved in any state: kept in the book, held at the Keep gate, or waiting for words. Source S for signed-in families, D for the rest. Reported by plan state (free, trial, Plus, lapsed). A free family cannot keep a third letter, so made, not kept, is the habit signal (R1 PL-15).

**Weekly keeping families (WKF)** stays as the paid-health number: families with at least one letter added to a child's book in the last 7 days (`docs/analytics/TRACKING_PLAN.md` 1.1), reported by plan state. It is internal and never shown to users.

### 4.2 Input metrics

| Stage | Metric | Source | Target | Basis | Reading that changes it |
|---|---|---|---|---|---|
| Activation | Median time from first launch to first saved letter | Lab and C1 observation | 90 s or less [A] | UR R1 | Study 1 (T26) |
| Activation | Share of first spoken letters with words on screen within the first session | D, C1 observation | Set after C1 | R1 PL-05; the model may not be on the phone yet (F05) | C1 exit (T34) |
| Activation (proxy) | Accounts created over ASC first-time downloads | S over ASC | Labelled proxy, no target at v1.0 | The first letter comes before consent and before any account, so a field activation rate cannot be measured (R1 PL-16) | Week 8 (T39) |
| Keep the book | Share of first-letter users with an account by day 7 | S | 50% or more [A] | none; a guess | Week 8 |
| Habit | Authors who make letters on 2 or more days within 14 days of the first | S, D | Set after cohorts | Uses letters made, so the gate does not cap it | Week 8 |
| Letters made and kept | Letters made per family per week; letters kept per family per week; by plan state | S, D | Set after cohorts | The gap between them is the gate's effect | Week 8 |
| Two voices | Share of books with a second author by day 30 | S | Set after C1 | 1 of 287 coded reviews mentions a partner contributing (R2-S13), so no basis for a number | C1 exit (T34) |
| Retention | Active makers at week 4 over first-letter users; at month 6 | S | 35% or more; 20% or more [A] | PRD 1.3 appendix C section 9 | Week 8; month 6 |
| Reminders | Letters made within 2 h of a delivered reminder over reminders delivered | D | 12% or more [A] | Appendix C | Week 8 |
| Read together | Share of monthly active parents who start Read together | D | Set after cohorts | U5 untested | Study 3, week 8 |
| Plus | Gate to trial start (`keep_gate_shown` to `plus_started_from_gate`) | D | Diagnostic only | Opt-in and biased; counts include restores and codes (F14 section 3) | n/a |
| Plus | Trial to paid, **monthly** | ASC | 40% [A] | RevenueCat: 43.7% median on monthly plans with 17 to 32 day trials (R3-S33) | First 200 monthly trials |
| Plus | Trial to paid, **annual** (2-month trial) | ASC | Set at T40 | No benchmark exists for trials over 32 days (R3-S33) | T40 |
| Plus | Annual share of new paid plans; refunds | ASC | 60%; under 3% [A] | Appendix C; refunds 2% to 5% typical (R3-S35) | Week 8 |

### 4.3 Guardrails (breaching one stops a rollout)

| Guardrail | Threshold |
|---|---|
| Letters or recordings lost or silently changed | Zero (gate) |
| Crash-free sessions | 99.8% or more after release (G5); in C1, zero unresolved crash signatures on the candidate build (07 owner, R2 AR-26) |
| Machine edit revert rate | Under 5% overall; any edit type over 10% is reviewed |
| Author correction rate per language (share of transcript words the author changes in review, bucketed, computed on device) | Per-language threshold set by its F05 gate; a rise of 50% over baseline pauses that pack |
| Reminders muted or turned off per month | 10% or less [A] |
| Paywall shown outside its allowed triggers (C-REQ-023; F14 6.4) | Zero |
| Keep sheet shown on a Keep with no words on screen (M17) | Zero |
| Letters lost or discarded at the Keep gate | Zero (gate) |
| Feature difference by analytics consent | Zero (LEGAL-REQ-003) |
| Support tickets about lost content | Zero; each one is a severity 1 incident |
| A recovery-key use without a log row (M16) | Zero; each one is a severity 1 incident |

### 4.4 Business frame

The category is small (01 section 5). R3 section 5 sized year one at the old prices ($3.99 and $29.99). Repriced at $4.99 and $49.99 (M3) with R3's own Base inputs (19,835 families, 5% paying, 70% annual): average revenue per payer 0.7 x $49.99 + 0.3 x $59.88 = $52.96, so about 990 payers bring about $52.5k gross and $44.6k net after Apple's 15% **as a run-rate at month 12**, not as cash received in year one: trials delay cash (R3 section 5.2) [A]. Low and High with R3's inputs: about $4.8k and $263k net [A]. Fixed costs ($91 a month, R3 section 5.3) are covered at about 25 paying families instead of 37 [A].

One-off launch costs sit outside that floor (R3 section 5.3 leaves them out): the three studies, about $9,200 [A] (02 section 7); counsel for the v1.0 package, "low five figures" [A]; native-speaker spot checks, about $1,000 to $1,500 [E]; the Apple Developer Program, $99 a year; used test iPhones, about $150 to $350 each [A] (all from `docs/FOUNDER_TASKS.md` costs at a glance); the device operator, cost unknown (`08-delivery.md` Q9).

**The model is a hard paywall with a two-letter sample.** R3 gives anchors for freemium (2.1% by day 35) and hard paywalls (10.7%) (R3-S32); no source measures a two-letter sample, and a keepsake's value builds over months, so the 5% pay rate is the weakest input here [A]. It is tracked as the headline business number (4.1), and F14 section 6.9 holds the pre-committed rule for raising the free allowance if it falls short. Run costs must stay near $0.02 to $0.10 per family per month (ARCHITECTURE section 7); design and build choices that raise run cost per family need a line in `09-decisions-and-risks.md`.

### 4.5 How families find us (first 8 weeks)

No channel has evidence yet; every line here is [A] until week 8 (T39).

| Channel | What we do | Cost | Why this one |
|---|---|---|---|
| App Store search | A subtitle that is not generic "voice memory book" (04 section 5, F21); screenshots that lead with what passed (04 section 5); Apple's rating request after a good moment, never after the gate (F13-REQ-020; first in 1.0.x) | $0 [A] | Rating count drives search rank; the closest rival has 7 ratings, the leaders thousands (R1 PL-29; F14 section 5) |
| Parent communities and C1 word of mouth | The founder posts where parents already describe this job (r/beyondthebump, r/daddit: UR S26, S30), within each community's rules; after release, C1 families get Apple offer codes to pass on (M5; codes exist only once the app is Ready for Sale, BL-344) | Founder time | The behaviour we copy, letters and voice memos to the child, was found there |
| Paid search (optional) | An Apple Search Ads test with a budget the founder sets | Founder sets; none committed | Only after organic numbers exist |

**Reach target:** R3's Base case is 1% of about 1.98 million reachable new families a year installing and saving at least one letter: 19,835 families (R3 sections 5.1, 5.2). That is about 380 a week, so **about 3,050 families with a first letter in the first 8 weeks** [A, arithmetic]. ASC first-time downloads are the field proxy until the server count of first letters (signed-in families only) is read beside it. If week 8 shows under half of that, reach, not the gate, is the first assumption to fix, and the founder decides whether to fund the paid channel.

## 5. Non-goals for v1.0
- Writing, rewriting, summarising, translating or "improving" anyone's words.
- A social feed, likes, comments or public sharing.
- Photo albums. Photos are optional and secondary.
- Children as users, child accounts or anything addressed to children as an audience.
- Printed books (later, F42). The PDF export is the book at v1.0.
- Android, the web contribution page, grandparents as contributors, family members hearing each other's recordings (v1.1, B1, B7, D-073). The owner's own encrypted recording backup is v1.0 (D-073, M14, M15).
- Server transcription or any AI model call off the phone (v1.1 with consent).
- Gamification of any kind.
