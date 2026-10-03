# Roadmap: the 30-day push to App Store submission

Owner: lead PM (coordinator merges). Version 2.0, 3 Oct 2026. Supersedes version 1.0 of the same day (submission 11 January 2027), which planned before the founder's decisions of 3 Oct 2026 cut scope (`docs/agents/BRIEF-2026-10-03.md`, decisions 1 to 17; recorded in `docs/DECISIONS.md` by the coordinator). Task detail: `docs/BACKLOG.md`. Who is doing what right now: `docs/agents/BOARD.md`.

**Target: submit to App Review in the week of 2 November 2026 (Monday 2 Nov at the earliest, Friday 6 Nov at the latest). Release on approval, with 9 to 20 November as buffer for one rejection cycle.**

**This date is conditional on the founder tasks in section 3.** Each one names the day it is needed and what moves if it is late. Engineering is ahead of the founder path: most of the app was built in the 3 Oct wave, so the date is now set by Apple accounts, store setup, counsel and the beta, not by code.

## 1. Why 30 days is realistic now

The 3 Oct decisions removed the slowest work from v1.0:

| Was in v1.0 | Now | Saves |
|---|---|---|
| Family contributors, approvals, the web page | Co-parent only (decision 5) | about 4 weeks (old M6, web) |
| Shared voice: audio upload, wrapped keys, playback service | No audio upload; recordings stay on the phone (decision 9) | about 3 weeks (old M7) |
| App Store Server Notifications, server entitlements, notice engine | StoreKit 2 and Apple's own subscription screens, checked on the device (decision 3) | about 2 to 3 weeks (old M8 server half) |
| PowerSync and an engine swap | Outbox plus cursor sync on Supabase (decision on D-023) | about 1 to 2 weeks |
| Safety classifier with clinician sign-off | A static "If you are struggling" row (decision 9) | about 1 week plus review |
| Passwords and recovery | Apple, Google and email link; passkeys later (decision 4) | about 1 week |

Already built in the 3 Oct wave (board, "Done this wave"): language packs and per-language speech models, the transcription queue, auth (Apple, Google, magic link, co-parent invites), outbox and cursor sync, Apple-only Plus (`SubscriptionStoreView`), server jobs (purge, analytics-forget), the design system and fonts, reminders, player, export, remote content and packs, brand, icons, emails and the store listing.

## 2. Four weeks

| Week | Dates | Engineering (agents, coordinator merges) | Exit |
|---|---|---|---|
| 1 | 5 to 9 Oct | Integrate the wave: boot wiring (`startRemote`, `startPacks`, `startSync`, `startPlus`, `startReminders`, `startTranscriptionQueue`, `UIProvider`); remove `expo-iap` and per-icon Phosphor imports (size); access-matrix rows for sync; first EAS development and preview builds on an iPhone SE 3 and a current iPhone | Internal build installs and records, transcribes, saves and plays on a real phone |
| 2 | 12 to 16 Oct | Device spikes: transcription speed and heat per language on SE 3; StoreKit sandbox purchase, restore and Family Sharing; sign-in with all three methods; two-phone co-parent sync; deletion end to end in staging; App Thinning report under 40 MB. Internal TestFlight (C0) from Wednesday 14 Oct | C0 running on the founding family's phones; no open S0 |
| 3 | 19 to 23 Oct | External TestFlight (C1, 15 to 25 friendly families, D-045) after Beta App Review, sent by Monday 19 Oct; daily triage; store screenshots regenerated from the release build; privacy labels and manifest from the shipped build | C1 families recording daily; crash-free sessions 99.5% or more |
| 4 | 26 to 30 Oct | **Feature freeze Monday 26 Oct.** Fixes only. C1 exit review Thursday 29 Oct (zero open S0 or S1, crash-free 99.8% or more, no fidelity complaint traced to an engine edit, co-parent flow done without help). Counsel sign-off on the legal pages; App Review notes and demo account | Release candidate tagged `ios-v1.0.0` |
| Submit | 2 to 6 Nov | Submit; answer App Review within a day | In review |
| Buffer | 9 to 20 Nov | One rejection cycle; release on approval | Live in the US App Store |

What a slip looks like: the most likely is 1 week, from on-device transcription on older phones (week 2) or Beta App Review timing (week 3). Section 4 lists the cuts that protect the date.

## 3. Founder tasks (the date depends on these)

| Needed by | Task | If late |
|---|---|---|
| Mon 5 Oct | Apple Developer Program enrollment as an individual (D-004); accept the latest agreements | Every Apple step waits; day for day |
| Wed 7 Oct | Paid Applications Agreement, tax and banking (Plus cannot be tested in sandbox without it) | Plus testing slips; submission slips day for day after 16 Oct |
| Thu 8 Oct | App Store Connect: bundle id `com.earlyletters.scribe`, app record, subscription group, `plus.monthly` ($3.99, 1 month free) and `plus.annual` ($29.99, 2 months free), **Family Sharing on** for both (decision 3; it cannot be turned off later), US only (`docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md`) | Plus spikes slip |
| Thu 8 Oct | Supabase staging and production projects; apply migrations in `supabase/APPLY.md` order to staging; function secrets (`docs/ops/README.md`) | Sync, sign-in and deletion tests slip |
| Thu 8 Oct | Sign-in dashboards: Apple key, Google client, Supabase providers, Resend SMTP for the magic link with the template in `packages/emails/supabase/magic-link.html` (`docs/ops/AUTH_SETUP.md`) | Sign-in spike slips |
| Fri 9 Oct | Resend: SPF, DKIM and DMARC for earlyletters.com verified; open and click tracking **off** (our emails promise no tracking) | Magic link can land in spam |
| Fri 9 Oct | Answer the open questions: model and pack CDN hostname (DEBATES Q-001), minimum iOS 17 (Q-002) | Model downloads cannot be tested on device |
| Fri 9 Oct | Send counsel the v1.0 package: Terms, Privacy Policy, Consumer Health Data policy, Subscription Terms, in-app disclosures, claims registry. Note for counsel: Plus in v1.0 adds only Read together after 3 free sessions per book and books for more children (Terms 14.1 still lists backup and themes) | Counsel sign-off is the longest pole; past 23 Oct it moves submission |
| Fri 16 Oct | Recruit C1 families (co-parents, at least one Hindi and one Spanish speaker, one VoiceOver user, one set of twins) | C1 starts smaller |
| Mon 19 Oct | Website live with `/terms`, `/privacy`, `/health-privacy`, `/subprocessors`, `/delete-account` and the `.well-known` files (separate thread, `docs/ops/well-known`) | Universal links and Beta App Review fail |
| Thu 29 Oct | Counsel sign-off received; legal pages published at the versions the app links to | Submission waits |
| Fri 30 Oct | Approve the store listing (`docs/store/app-store.md`) and screenshots; App Privacy answers entered; age rating; review notes | Submission waits |
| Mon 2 Nov | Press submit | |

Also open, not date-critical: D-004 hedge (start an entity in parallel or accept the 5.1.1(ix) risk as an individual); D-031 Hindi script default (from the language spike).

## 4. Cuts that protect the date (in order, each reversible in v1.1)

| Red signal | Cut |
|---|---|
| A language's model is too slow or hot on SE 3 (week 2) | Ship that language on the small model, or hold it back to a pack update; the listing names only shipping languages (`docs/store/app-store.md` checklist) |
| Google sign-in setup or review issue | Apple and email link only (guideline 4.8 still met) |
| Plus sandbox not green by 23 Oct | Ship v1.0 free; Plus in 1.0.1 (the app already treats Plus as off) |
| Reminders or month notes misbehave in C1 | Reminders off by default, month notes later |
| Size over 40 MB | Fonts subset further, drop unused native modules (`docs/ops/APP_SIZE.md`) |

Not cuttable (the constitution and P0 legal duties): the verifier and immutable raw transcript; crash-safe capture; export; in-app account deletion; the 18+ gate; opt-in consent before any analytics; server-side access checks; accurate claims; "If you are struggling".

## 5. v1.0 scope in one list

In: 18+ gate; welcome; first run with any number of children; speak or type; crash-safe capture; on-device transcription in English, Hindi, Spanish, Mandarin Chinese, French, Arabic and Portuguese with rules-only fixes through `verifyEdits`; Review with every edit visible and undoable; the original recording never altered, with an optional clearer listening copy; book by month; playback; Read together (3 free sessions per book, then Plus) without word highlight; export (ZIP and PDF, offline); Apple, Google and email-link sign-in; text sync; co-parent invites; local reminders; Plus monthly and annual through Apple only, with Family Sharing; opt-in analytics; Settings with privacy, storage and legal; in-app account deletion; downloadable language packs; server-delivered prompts, tips and story cards inside native screens; US App Store; TestFlight beta.

## 6. v1.1 and later

v1.1 (target: 6 to 8 weeks after launch), from decision 9: Hindi and English in one sentence; the safety classifier (with a clinician's sign-off); word highlight in Read together; family members hearing each other's recordings (audio upload); other family members as contributors and the web contribution page; Google Play and Android. Also: passkeys on by default, the 4-story intro, backup and restore, a server-side Read together counter.

Later: printed books (Early Letters: Year One), lifetime purchase, the app interface in other languages (the copy is ready for localisation), photos under per-book keys.

## 7. Publishing as an individual

Unchanged from version 1.0 and recorded in `docs/DECISIONS.md` D-004: the founder's legal name is the seller; no liability shield; guideline 5.1.1(ix) is a medium-likelihood, high-impact risk mitigated by the Lifestyle category, no health language in metadata and review notes that describe a family memory journal; transfer to an organisation later is possible with Apple's conditions. Reconsider before the public TestFlight link, paid marketing, 1,000 families, $2,000 a month in proceeds, the first hire, or Android.
