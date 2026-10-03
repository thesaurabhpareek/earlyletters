# Roadmap: the 30-day path to App Store submission

Owner: lead PM (coordinator merges). **Version 2.1, 3 Oct 2026 (evening)**, by the backlog-consolidation PM. Supersedes 2.0 of the same day: same target, reconciled with what the 3 Oct waves actually built (`docs/BACKLOG.md` v1.0, checked in code), the security review (`docs/reviews/2026-10-04-security-privacy.md`), legal-alignment's Q-003 memo, and one ordered founder list (`docs/FOUNDER_TASKS.md`). After v1.0: `docs/backlog/FUTURE.md`. Who is doing what right now: `docs/agents/BOARD.md`.

**Target: submit to App Review in the week of Mon 2 Nov 2026 (Mon 2 Nov at the earliest, Fri 6 Nov at the latest). Release on approval, planned for Mon 16 Nov, with 9 to 20 Nov as the buffer for one rejection cycle.** The 30 days run from Mon 5 Oct to Wed 4 Nov.

## 0. The honest read

- **Code is ahead; the date is set by things only the founder, Apple, counsel and real phones can do.** The app records, transcribes in seven languages, saves crash-safely, syncs with a co-parent, sells Plus through Apple's own sheet, exports and deletes, all in code and green in CI. None of it has run on a real iPhone or against a configured Supabase project yet.
- **The date holds if three things hold:** Apple enrolment is Active by about Wed 7 Oct; the iPhone SE (3rd gen) runs the speech models within budget in week 2; counsel returns comments by Fri 23 Oct.
- **Most likely outcome: a one-week slip** (submit 9 to 13 Nov), from week-2 device findings, Beta App Review timing, or founder hours in weeks 1 and 2 (about 22 and 26 hours of founder work against the 15 to 20 planned [A]).
- **The largest single risk is App Review guideline 5.1.1(ix)** (an individual publishing an app that "requires sensitive user information", D-004: medium likelihood, high impact). A rejection on it costs 2 to 6 weeks (entity, D-U-N-S, organisation enrolment [U]).
- **The C1 beta is short.** D-045 asked for 3 weeks with 15 to 25 families; this plan gives about 10 days (19 to 29 Oct). That is enough to catch crashes and broken flows, not enough to read week-4 retention. Accept that, or move submission a week.
- **Three security fixes must land before anyone outside the family signs in** (Mon 19 Oct): Apple token capture (BL-330), the email-link login hijack (BL-347) and membership integrity (BL-331, BL-322). The first two have no owner in this wave yet.

## 1. What changed since version 2.0

| Change | Why | Where |
|---|---|---|
| Statuses checked against code: most of week 1's engineering list (boot wiring, `expo-iap` removal, per-icon Phosphor, sync access-matrix rows) is already done | 3 Oct waves a66376a and 7cc43b1 | BACKLOG "Status at a glance" |
| Security fixes added before C1: BL-330 (H3), BL-347 (H1), BL-322 and BL-331 (H2, M1, M5), BL-332 (M3), BL-349 (privacy manifest, L7) | Security review: 0 Critical, 3 High | BACKLOG M5 and "Security review follow-ups" |
| On-device plan reminders and "Save a copy" after purchase move into v1.0 (BL-342) | Subscription Terms 1.4.0 promise them from the first purchase (Q-003 memo) | BACKLOG M8 |
| Website legal pages needed **Wed 14 Oct**, not Mon 19 Oct | Testers tap Terms and Privacy on the first sheet, and Beta App Review is submitted Thu 15 | FT-31 |
| Production database by **Tue 13 Oct** | C0 on Wed 14 holds the founding family's real letters | FT-23 |
| Policy versions for the beta (0.9.0, then 1.0.0 with re-consent after counsel) | Sign-in needs published versions; counsel signs off only on 29 Oct | DEBATES Q-009, BL-338 |
| App Store age rating overridden to 18+ | The Terms require adults (qa-e2e, App Store Connect help) | FT-43 |
| Founder decisions this week grow to eight (adds invite link format and email code length) | Security review M2 and M4 | FT-04 |
| v1.1 scope question raised | Decision 9's v1.1 list is about twice one release | DEBATES Q-011, FUTURE section 3 |

## 2. Five weeks

| Week | Dates | Engineering (agents; coordinator merges) | Founder (`docs/FOUNDER_TASKS.md`) | Exit |
|---|---|---|---|---|
| 1 | Mon 5 to Fri 9 Oct | Commit and merge this wave; BL-330 Apple token capture; BL-347 email-link fix; BL-322 invite confirm; finish BL-331 to BL-333 tests and their APPLY.md section; BL-349 privacy manifest; BL-339 EAS project id; BL-335 public key line in `packages/api/src/keys.ts` | FT-01 to FT-20: Apple enrolment, counsel engaged, eight decisions, Paid Apps, Apple key, app record and products, Supabase staging with every migration, Auth and Resend, DNS, Google (cuttable), R2 and signing key, `eas init` and the first build, counsel package, mailing address, GitHub | A development build on a real iPhone records, transcribes, saves and plays; staging has every migration; sign-in works against staging |
| 2 | Mon 12 to Fri 16 Oct | Fix what the device spikes find; BL-342 plan reminders; BL-336 iOS 17 target; BL-337 pack host; first signed publish of config, content and packs (coordinator, with the founder's OK); qa-e2e's Maestro flows and device plan | FT-21 to FT-31: 14 recordings, device spikes (speech per language on SE 3, StoreKit sandbox, three sign-ins, two-phone sync, deletion, kill test, size), production database (Tue 13), PostHog, **C0 Wed 14**, **Beta App Review Thu 15**, recruit C1, reviewers, trademark screen, Small Business Program, DPAs, legal pages live (Wed 14) | C0 running on the founding family's phones; no open S0; Beta App Review submitted |
| 3 | Mon 19 to Fri 23 Oct | Daily C1 fixes; store screenshots from the release build (BL-340); review notes and demo account (BL-341) | FT-32 to FT-38: **C1 from Mon 19**, daily triage, counsel comments (Fri 23), per-language go or no-go (Fri 23), trademark opinion if needed, check the support resources, insurance quotes, screenshot review | C1 families recording; crash-free sessions 99.5% or more |
| 4 | Mon 26 to Fri 30 Oct | **Feature freeze Mon 26.** Fixes only; release PR to `main`; tag `ios-v1.0.0` | FT-39 to FT-44: release-candidate device checks, C1 exit review (Thu 29), counsel sign-off and 1.0.0 policy versions (Thu 29), D-031 Hindi script (Fri 30), listing and privacy answers (Fri 30), approve the release | Release candidate tagged; listing complete |
| Submit | Mon 2 to Fri 6 Nov | Answer App Review questions within a day | FT-45: submit with manual release | In review |
| Buffer | 9 to 20 Nov | One rejection cycle | Release on approval (planned Mon 16 Nov) | Live in the US App Store |

C1 exit criteria (Thu 29 Oct): zero open S0 or S1; crash-free sessions 99.8% or more; no fidelity complaint traced to an engine edit; the co-parent flow done without help.

## 3. The critical path

```
Mon 5   FT-01 Apple enrolment
Wed 7   FT-06 Paid Apps Active        FT-04 decisions
Thu 8   FT-07 Apple key, FT-08 app record, FT-09 products, FT-10 staging, FT-12 Auth
Fri 9   FT-16 signing key, FT-17 first build on a phone, FT-18 counsel package
Mon 12  FT-22 device spikes start (speech on SE 3 decides each language)
Tue 13  FT-23 production database and beta policy versions
Wed 14  FT-25 C0 and FT-31 legal pages live
Thu 15  Beta App Review submitted (security fixes BL-330, BL-347, BL-322, BL-331 in the build)
Fri 16  FT-22 device spikes done
Mon 19  FT-32 C1 starts
Fri 23  FT-33 counsel comments; FT-34 language go or no-go
Mon 26  feature freeze (BL-342 in)
Thu 29  FT-40 C1 exit; FT-41 counsel sign-off
Fri 30  FT-43 listing; tag ios-v1.0.0
Mon 2   FT-45 submit
```

Every link in this chain is either a founder step, an Apple queue, counsel or a device run. Agents can make each link faster to do; they cannot remove any of them.

## 4. What cannot be compressed

| Item | Why it cannot be squeezed | Least time [A unless marked] | What we do instead |
|---|---|---|---|
| Apple enrolment and the Paid Apps agreement | Apple verifies identity, bank and tax; only the Account Holder can act | 1 to 3 days each, sometimes longer [U] | Start Monday morning; everything else Apple-side waits, so no other work is blocked behind it in week 1 |
| Device testing | Heat, memory and speed on an SE 3, 500 kills during save, two phones syncing, an iCloud restore to a second phone: none of it runs in a simulator or CI | About 10 hours in week 2 and 6 in week 4 | Scripts from qa-e2e (`docs/qa/`); a trusted helper can run them with the founder |
| Beta App Review | Apple's queue for the first external build | About a day [A] | Submit Thu 15 so C1 can start Mon 19 |
| C1 real use | Families have to record on real evenings | 10 days in this plan (D-045 asked for 21) | Accept thinner evidence, or slip a week |
| Counsel | Review of about ten documents plus open questions | About 3 weeks from the package (9 to 29 Oct) | Legal-alignment pre-aligns the drafts and a numbered question list (`docs/legal/COUNSEL_PACKET.md`); default positions are written so silence does not stop work |
| App Review | Apple's queue, plus any rejection cycle | 1 to 3 days per round [A]; the buffer holds one rejection | Review notes and a demo account ready (BL-341); answer within a day |
| Founder-only setup | Account Holder actions, secrets, legal approvals and money cannot be delegated | About 22 hours in week 1 | The "if short" order in FOUNDER_TASKS: Google, GitHub, mailing address, trademark move to Monday |
| DNS and universal links | Apple's CDN fetches the AASA file within about a day (AUTH_SETUP 5.2) | 1 day | Publish the AASA with the Team ID as soon as FT-07 is done |

## 5. Risks, ranked

| # | Risk | Likelihood, impact | Early signal | Response |
|---|---|---|---|---|
| 1 | Founder hours in weeks 1 and 2 exceed the plan | High, medium | FT items still open on Wed 7 Oct | Use the "if short" order; agents prepare every value and command; pair sessions for the dashboards |
| 2 | Speech too slow or hot on the SE 3 in some languages (TDD 10 risk 1; unmeasured) | Medium, high | FT-22 numbers on Mon 12 to Wed 14 Oct | Smaller model on small phones, or hold the language back; the listing names only shipping languages (cut table) |
| 3 | Apple enrolment or Paid Apps delayed | Medium, high | Not Active by Wed 7 Oct | Day for day slip; nothing else can stand in |
| 4 | Security fixes not in before C1 (BL-330, BL-347 have no owner this wave) | Medium, high | Not merged by Fri 16 Oct | C1 waits for them: a phishing link could upload a family's letters to someone else's account (H1), and deletion could not revoke Apple sign-in (H3, a likely rejection) |
| 5 | Counsel slow, or a material change (Q-003, Q-005, D-050) | Medium, high | No comments by Fri 23 Oct | Every question carries a default; past 23 Oct, submission moves |
| 6 | Rejection under guideline 5.1.1(ix) as an individual (D-004) | Medium, high | Resolution Center message citing 5.1.1(ix) | Lifestyle category, no health language, review notes describe a family journal; the entity hedge (FT-48) makes the fallback days, not weeks, only if started early |
| 7 | Beta App Review rejects or legal pages are not live | Low to medium, medium | Pages not live Wed 14 Oct | Website thread first; C1 slips with it |
| 8 | C1 too short to show retention or a real crash rate | High, medium | Fewer than 15 families active by Wed 21 Oct | Accept for v1.0 (D-045 lets the public link follow submission), or slip a week |
| 9 | Trademark conflict for "Early Letters" (CR-122) | Low to medium, high | FT-28 finds a live mark in class 9 or 41 | Counsel opinion by Fri 23 Oct; a rename before launch is cheap, after launch it is not |
| 10 | Migrations applied by hand (D-041's CI deploy is not built) | Low, high | A check in APPLY.md fails | Staging first, every step has a check and a rollback; never edit an applied file |
| 11 | Upload rejected for a missing privacy manifest (ITMS-91053, review L7) | Medium, medium | First production upload | BL-349 before the C1 build |
| 12 | Non-English letters keep fillers and stumbles (all six packs' word tables are `draft`, so they run punctuation-safe, ADR 0014) | Certain, low to medium | C1 feedback in those languages | Honest copy ("you can fix any word"); native-speaker review starts now (CVL-02) and lands as data without a release |
| 13 | California AB 1043 or Texas SB 2420 age-signal duty from 1 Jan 2027 [U] | Unknown, medium | Counsel's answer in November | BL-345 in a 1.0.x release if needed |

## 6. Cuts that protect the date (in order; each reversible in a later release)

| Red signal | Cut |
|---|---|
| A language's model is too slow or hot on the SE 3 (week 2) | Ship that language on the small model, or hold it back to a pack update; the listing names only shipping languages (`docs/store/app-store.md` checklist) |
| Google sign-in setup or brand verification stalls | Apple and email link only (guideline 4.8 still met) |
| StoreKit sandbox not green by Fri 23 Oct | Ship v1.0 free and add Plus in 1.0.1; the app already treats Plus as off. The Subscription Terms then wait too |
| Counsel has not cleared the analytics consent copy (Q-004, Q-005) by Fri 23 Oct | Build without the PostHog key; server aggregates still count families [U: confirm the consent ask hides when no key is set] |
| Reminders or month notes misbehave in C1 | Reminders off by default, month notes later |
| Size over 40 MB | Fonts subset further, drop unused native modules (`docs/ops/APP_SIZE.md`) |

**Not cuttable** (the constitution and P0 duties): the verifier and immutable raw transcript; crash-safe capture; export; in-app account deletion with Apple token revocation (BL-330); the 18+ gate; opt-in consent before any analytics; server-side access checks, including the two-parent cap and the invite fixes (BL-331); the email-link fix (BL-347); accurate claims, which now include the on-device plan reminders the Subscription Terms promise (BL-342), unless the Terms change instead; "If you are struggling".

## 7. v1.0 scope in one list

**In:** 18+ gate; welcome; first run with any number of children; speak or type; crash-safe capture; on-device transcription in English, Hindi, Spanish, Mandarin Chinese, French, Arabic and Portuguese (each only if it passes week 2), with rules-only fixes through `verifyEdits` (non-English word tables in punctuation-safe mode until native review); Review with every edit visible and undoable; the original recording never altered, with an optional clearer listening copy; book by month; playback; Read together (3 free sessions per book, then Plus) without word highlight; export (ZIP and PDF, offline); Apple, Google and email-link sign-in (passkeys built, off); text sync; co-parent invites (at most two parents per book); local reminders; Plus monthly and annual through Apple only, with Family Sharing, on-device plan reminders and "Save a copy"; opt-in analytics; Settings with privacy, storage, plan and legal; in-app account deletion; downloadable language packs; server-delivered prompts, tips and story cards inside native screens; US App Store; TestFlight beta; age rating 18+.

**Not in v1.0** (decision 9 and later decisions): Hindi-English mode, the safety classifier (a static "If you are struggling" row ships), word highlight, family hearing each other's recordings (no audio upload), other family members and the web contribution page, Android, backup and restore, printed books.

## 8. After v1.0

Ranked in `docs/backlog/FUTURE.md`:
- **v1.0.1 (by Mon 7 Dec 2026):** review ask (G-03), offer codes (G-16), age signal if counsel says so (T5-15), the "co-parent uses Android" counter (FAM-14 part 6).
- **v1.1 (about mid January 2027):** shared voice, word highlight, Hindi-English with "not written down" markers (if the golden corpus clears it by 30 Nov), On this day, family-letter notifications, the "we never make a voice" promise with its guards, the safety classifier only with a clinician's sign-off.
- **v1.2 (about mid March 2027):** web platform and web deletion, family members as authors with the safety floor, invites where relatives are, guest author, the web contribution page, names that learn, remote config matured, ways to sign in.
- **v1.3 (about early May 2027):** Plus follows the book, Android for co-parents if its gates are met, realtime co-parent updates, the Year page with birthdays and firsts, prompts v3.

This moves two items from decision 9's v1.1 list (the web page to v1.2, Android to v1.3), because the six items together are about twice one release. The founder decides (DEBATES Q-011).

## 9. Decisions the date depends on

| Needed by | Decision | Default if unanswered |
|---|---|---|
| Wed 7 Oct | FT-04: Q-001 pack host, Q-002 iOS 17, D-069 two parents, D-045 C1 only, Q-009 beta policy versions, which project is production, invite link format, email code length | The recommendation in FT-04 |
| Fri 23 Oct | Counsel on Q-003 (memo is the default), Q-004, Q-005 | Q-003 memo; analytics cut per section 6 |
| Fri 30 Oct | D-031 Hindi script default | Devanagari with English in Latin |
| Fri 27 Nov | D-004 hedge: start an entity in parallel | No entity; accept the 5.1.1(ix) risk |
| Mon 30 Nov | Q-011 v1.1 scope; CVL-02 reviewer budget; the "never make a voice" line | FUTURE.md's recommended plan |

## 10. Publishing as an individual

Unchanged from version 1.0 and recorded in `docs/DECISIONS.md` D-004 and D-064: the founder's legal name is the seller; no liability shield; guideline 5.1.1(ix) is a medium-likelihood, high-impact risk mitigated by the Lifestyle category, no health language in metadata and review notes that describe a family memory journal; transfer to an organisation later is possible with Apple's conditions. Reconsider before the public TestFlight link, paid marketing, 1,000 families, US $2,000 a month in proceeds, the first hire, Android, or selling printed books.
