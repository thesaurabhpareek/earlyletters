# 03. What we are solving: promise, principles, goals and metrics

Status: Draft V2, 3 Oct 2026. Revised 13 Oct 2026 for the membership (M1 to M3, `_AUTHORING.md` section 3b): promise 4, PS7, principle 6, the Plus metrics and the business frame.

## 1. The promise

**Early Letters is the baby memory book you fill by talking. Your words are kept exactly as you said them, with your voice, filed by your child's age, for your child to read and hear for years.** (Positioning from `packages/content/BRAND.md`.)

Four things must be true for that sentence to be honest:
1. **Exactly as you said it.** The machine removes and repairs; it never adds meaning (CLAUDE.md constitution). Typed text is never machine-edited (B5).
2. **Kept.** Nothing a parent records is lost or silently changed (ARCHITECTURE quality attribute 1).
3. **Private.** Never sold, never used for ads, never used to train models (B9).
4. **Yours, always.** Every letter already made stays readable, playable and exportable forever, whether the family never pays, pays, or stops paying, and deleting is always free; a 90-day shutdown pledge (PRD-REQ-009). This is not free writing: the first 2 letters an account keeps are free, and keeping more needs Plus (M1; D-051 (main), D-082, D-083). A letter held at that gate is never lost.

## 2. Problem statements and the outcome we want

| # | Problem (from 01) | Outcome we commit to | Measured by |
|---|---|---|---|
| PS1 | Parents have minutes, not hours, and often one hand | A letter is captured in under a minute, one-handed, in the dark | Median first launch to first saved letter 90 s or less; tap to microphone live p95 500 ms |
| PS2 | Losing work is the most common complaint in the category | Zero letters or recordings lost or silently changed, ever | Lost-letter incidents (gate: zero); kill-during-save test 500 of 500 |
| PS3 | Products rewrite people's words | Every machine change is a typed, reversible, visible repair | Every edit passes `verifyEdits`; edit revert rate under 5% overall |
| PS4 | Privacy is why people choose and why they leave | Content never leaves the phone except to sync to the family's own book; no tracking | Privacy label without "Data Used to Track You"; log canary zero hits |
| PS5 | Baby books stall and make parents feel behind | A book that grows at the family's pace with no guilt | Weekly keeping families; no streak or gap copy (content test) |
| PS6 | Families speak more than English | Each author writes in their own language and script, kept as spoken | Per-language gate pass (F05); author correction rate per language |
| PS7 | Memories feel held hostage by paywalls and shutdowns | Reading, playback and export of every letter already kept never depend on paying; the only paid step is keeping a new letter after the first 2, and a letter waiting at that step is never lost | Lapsed offline export test passes (PRD-REQ-026); zero existing letters behind Plus; zero letters lost at the Keep gate (F14) |

## 3. Principles (how we decide when a spec is silent)

1. **The constitution beats every feature.** If a feature needs the machine to add, reword, summarise, translate or "shape" words, the answer is no. This includes translation for a co-parent who does not read the language.
2. **Durability before delight.** A letter is saved before anything else happens: before transcription, before sync, before any sheet or prompt. When in doubt, keep the audio.
3. **Privacy by default, said calmly.** Content stays on the phone unless it syncs to the family's own book. Say it once, in the right place, and back it with a control (B9).
4. **Celebrate what exists, never count gaps.** No streaks, points, badges, missed-day counts or "you haven't" copy (CLAUDE.md content rules).
5. **The original is always one tap away.** Every transcript links to its recording; every machine edit can be undone; the listening copy never replaces the original (B6).
6. **What you made stays yours.** Plus gates one thing: keeping a new letter after the first 2 per account (M1). Reading, playing, exporting, deleting and restoring a letter are never gated, before, during or after Plus (`FreeForever` in `packages/core/src/plan.ts`). The gate holds a letter and never takes it. Nothing that is free when v1.0 launches moves behind Plus later, and remote config may only raise the free allowance, never lower it (R2 section 0 item 3: new paywalls drew a negative review every time).
7. **Standard over custom.** Use what Apple and well-maintained permissive open source provide; add finishing touches on top (B16). Custom native code only where no standard exists (for example the SubscriptionStoreView bridge, R4 C5).
8. **Honest about quality.** A language, model or feature ships when it passes its gate on the reference device (iPhone SE 3rd gen), not when it compiles. Where quality is not there, say so and fall back to what is true (keep the recording, let the author type).
9. **Calm, premium, accessible.** Benchmarked against Airbnb, Calm, Headspace, Day One and Apple's own apps (B16). Every screen works at AX5 text size and with VoiceOver.
10. **One ask at a time.** At most one permission or consent sheet per session after the first letter, never during recording, review or export (PRD-REQ-001).

## 4. Success metrics

Source codes: **S** server aggregate (synced users), **D** device analytics (opt-in only), **ASC** App Store Connect (all users). Purchases are visible only in ASC because no server of ours sees purchases (B2). Targets marked [A] are launch-quarter guesses to be reset after the first 8 weeks of cohorts.

### 4.1 North star
**Weekly keeping families (WKF):** families with at least one letter added to a child's book in the last 7 days, any author (definition in `docs/analytics/TRACKING_PLAN.md` 1.1, kept). Source S. Blind spot: phone-only users (no account) are invisible; report WKF with the share of first-letter users who synced. It is internal and never shown to users.

### 4.2 Input metrics

| Stage | Metric | Source | Target |
|---|---|---|---|
| Activation | Median time from first launch to first saved letter | D | 90 s or less [A] (UR R1) |
| Activation | Share of installs that pass the 18+ gate and save a first letter within 24 h | ASC installs, D | 60% or more [A] |
| Keep the book | Share of first-letter users with an account by day 7 | S | 50% or more [A] |
| Habit | Writers who save letters on 2 or more days within 14 days of the first | S | Set after cohorts |
| Two voices | Share of books with a second author (co-parent) by day 30 | S | 25% or more [A] |
| Retention | Active writers at week 4 / first-letter users; at month 6 | S | 35% or more; 20% or more [A] (C section 9) |
| Reminders | Letters saved within 2 h of a delivered reminder / reminders delivered | D | 12% or more [A] |
| Read together | Share of monthly active parents who start Read together | D | Set after cohorts |
| Plus | Plus started after the Keep gate / gate shown | D | Set after cohorts [A] |
| Plus | Trial to paid; annual share; refunds | ASC | 40%; 60%; under 3% [A] (C section 9) |

### 4.3 Guardrails (breaching one stops a rollout)

| Guardrail | Threshold |
|---|---|
| Letters or recordings lost or silently changed | Zero (gate) |
| Crash-free sessions | 99.8% or more (gate) |
| Machine edit revert rate | Under 5% overall; any edit type over 10% is reviewed |
| Author correction rate per language (share of transcript words the author changes in review, bucketed, computed on device) | Per-language threshold set by its F05 gate; a rise of 50% over baseline pauses that pack |
| Reminders muted or turned off per month | 10% or less [A] |
| Paywall shown outside its allowed triggers (C-REQ-023; F14 6.4) | Zero |
| Letters lost or discarded at the Keep gate | Zero (gate) |
| Feature difference by analytics consent | Zero (LEGAL-REQ-003) |
| Support tickets about lost content | Zero; each one is a severity 1 incident |

### 4.4 Business frame
The category is small (01 section 5). R3 section 5 sized year one at the old prices ($3.99 and $29.99). Repriced at $4.99 and $49.99 (M3) with R3's own Base inputs (19,835 families, 5% paying, 70% annual): average revenue per payer 0.7 x $49.99 + 0.3 x $59.88 = $52.96, so about 990 payers bring about $52.5k gross and $44.7k net after Apple's 15% [A] (R3 section 5.1 inputs, recomputed 13 Oct). Low and High with R3's inputs: about $4.8k and $263k net [A]. Fixed costs ($91 a month, R3 section 5.3) are covered at about 25 paying families instead of 37 [A]. The 5% pay rate is the weakest input: two free letters then a gate sits between R3's freemium (2.1%) and hard-paywall (10.7%) day-35 anchors (R3-S32), and no source measures that model [A]. Run costs must stay near $0.02 to $0.10 per family per month (ARCHITECTURE section 7). Design and build choices that raise run cost per family need a line in `09-decisions-and-risks.md`.

## 5. Non-goals for v1.0
- Writing, rewriting, summarising, translating or "improving" anyone's words.
- A social feed, likes, comments or public sharing.
- Photo albums. Photos are optional and secondary.
- Children as users, child accounts or anything addressed to children as an audience.
- Printed books (later, F30). The PDF export is the book at v1.0.
- Android, the web contribution page, grandparents as contributors, audio upload (v1.1, B1, B7).
- Server transcription or any AI model call off the phone (v1.1 with consent).
- Gamification of any kind.
