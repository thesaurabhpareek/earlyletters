# F20 Help, support and safety resources

| | |
|---|---|
| Release | v1.0 gate |
| Priority and rank | P0, rank 20 (`05-feature-map.md` section 2) |
| Personas | P1 Evening parent, P2 Co-parent, P3 Expecting parent; the founder as the support desk |
| Existing IDs | K-14, C-REQ-016, LEGAL-REQ-014, LEGAL-REQ-015, LEGAL-REQ-031, LEGAL-REQ-051, LEGAL-REQ-052, LEGAL-REQ-056, LEGAL-REQ-057, PRD-REQ-009, D-030, D-034, D-059, D-060, B7, B8; COUNSEL_PACKET Q18, Q25, Q27, Q29; BL-Q29 (TDD 07) |
| Depends on | F17 (Settings shell and Help and Legal rows), F12 (hide a book), F15 (export), F01 (18+ gate), F11 (co-parent removal **[server]**), F21 (website help and legal pages, `/delete-account`), `packages/brand` (support address), `packages/content` (copy) |
| Status | Draft V2, 13 Oct 2026. Code checked on `docs/prd-v2` rebased on `origin/develop` at 6482cd3. Revised 14 Oct 2026 after critique round 1: server-on wording throughout (M14), a self-serve Quiet this book in front of the loss runbook, runbooks for safety removal and a parent's death, support mail retention (disposition in `reviews/DISPOSITION-C.md`) |

> **Not legal or clinical advice.** Items marked **[Counsel]** wait on a licensed attorney. Nothing here is a clinical protocol.

> **Build state.** Server features are on for v1.0 (M14, founder, 13 Oct 2026), reversing commit c1764f9: accounts, sync and co-parents exist at launch, so support handles deletion requests, under-18 reports and safety removal from day one. On 13 Oct every build profile still sets `EXPO_PUBLIC_SERVER_FEATURES` to `off` (`apps/mobile/eas.json`) until the release profiles flip; a build with it off (the kill path) has no account, every letter lives only on the phone, and support can never see, restore or delete a letter. Rows marked **[server]** need our server and are v1.0.

## 1. Why

- [D] The safety classifier is deferred to v1.1; a static, always-available "If you are struggling" row ships instead (B7, D-034, D-059).
- [D] The beta runs on TestFlight; the store listing never says beta; the app keeps a small "early version, can make mistakes" note (B8, D-030, D-060).
- [F] Content never appears in support prefill, logs or email subjects (LEGAL-REQ-014). Safety tiers never leave the device (LEGAL-REQ-015); the `safety_events` table was dropped (`supabase/migrations/20261002020000_data_governance.sql`).
- [S] Fast, human support is the praise theme for the two best-rated voice products, Remento and Storyworth (R1-S15, R1-S54). Qeepsake draws complaints that support is hard to reach and that its marketing texts arrive during a vulnerable postpartum period (R1-S55, R1-S1).
- [F] The postpartum window is sensitive; the copy rules forbid fear, guilt and loss language and require legacy to be written as time, never endings (`packages/content/VOICE.md` "The legacy rule"; CLAUDE.md).
- [F] Sibling specs route their hardest cases here: a child who has died (F12-REQ-009), a parent removed for safety (F11-U31), an account later reported under 18 (F01-U18), lost content as a severity 1 incident (03 section 4.3).
- [F] What exists: the Help row opens an email with a fixed subject and nothing else; the "If you are struggling" disclosure lists three US lines and a 911 line (`apps/mobile/src/app/settings/index.tsx`; `packages/content/src/strings.en.ts` `struggling`). Runbooks on develop cover deletion, purge, restore, leaks and breach notices only (`docs/ops/runbooks/`). Six draft help articles sit on the unmerged branch `origin/agent/support/help-centre`.

## 2. Who

| Who | Moment | What they hold | What F20 must do |
|---|---|---|---|
| P1 Evening parent | Something went wrong, late at night | A phone, little patience | One tap to write to a person, without being asked for their letters |
| P1 or P3 in a hard week | Opens Settings, sees "If you are struggling" | Exhaustion, maybe fear | Free, confidential lines, one tap to call or text; no questions, no tracking, nothing stored |
| A family whose child has died | Opens the book, or writes to support | Grief | A self-serve way to stop every message about the child without asking anyone (Quiet this book, F09 step 18); if they write, a human reply with choices (quiet, hide, export, delete), no product copy that names it (R3 DX-05) |
| A family with a baby in a NICU | Sets the birth date weeks before the due date | Exhaustion, fear | Reminders left off unless they choose them (F09 step 17, R3 DX-18) |
| TestFlight tester (C0, C1) | Hits a bug | The TestFlight app | A feedback path that does not leak letters in screenshots |
| Founder as support desk | Monday morning, 15 to 20 hours a week (R-04) | One inbox | Runbooks and reply templates so each case is calm, fast and the same every time |

## 3. What we are solving

**Outcome:** anyone can reach a person or a crisis line in two taps from the Book tab, support never needs a letter to help, and every sensitive case has a written, rehearsed path.

| Metric | Target | How measured | Consent caveat |
|---|---|---|---|
| First human reply to a support email | Within 2 business days during beta and the first 8 weeks [A] | Support log (counts only) | None |
| Deletion or rights request by email | Acknowledged within 10 business days (the public `/delete-account` page says so) | Support log | None |
| Support tickets about lost content | Zero; each one opens a severity 1 incident (03 section 4.3) | Support log tag `lost_content` | None |
| Taps to "If you are struggling" from the Book tab | 2 (the Settings gear, then the row); a gear on Tonight and Family is F17's call | Navigation test | None |
| Support emails that ask the person for letter text, recordings or a child's name | 0 | Template review; content test over templates | None |
| Sensitive-case runbooks dry-run before C1 | 8 of 8: S-1 to S-5, S-7, S-8 and S-9 (section 6.5; R4 PT-16) | Dry-run record | None |

## 4. Scope

**In v1.0**
- Settings > Help and legal: Help (write to us), If you are struggling, How transcription works, Terms of Service, Privacy Policy, Consumer Health Data Privacy Policy, Subprocessors, Licences, the 90-day promise, Version. Rows already built are marked in section 7.
- Contact support by email to `hello@earlyletters.com` with a fixed subject and a body holding only the app version, build and iOS version. Never letter text, transcripts, names or plan state.
- The static "If you are struggling" disclosure: three verified US lines and a 911 line, one tap to call or text, always present, never behind a flag, never counted.
- The in-app "early version, can make mistakes" note (B8).
- TestFlight feedback for C0 and C1: test information, a tester welcome note, daily triage with severity labels.
- Runbooks and reply templates for sensitive cases (section 6.5), with no loss language in any copy.
- A support log that holds tags and counts, never content.
- Report a concern (LEGAL-REQ-056, P1) **[server]**: v1.0 now that co-parents ship (M14).
- Safety removal of a parent through an audited service-role path **[server]** (F11, LEGAL-REQ-025): v1.0 now that co-parents ship (M14).

**Later**
- The on-device safety classifier and its cards, only with a perinatal clinician's written sign-off (F39, D-034).
- An accessibility statement page with a contact route (LEGAL-REQ-052, P1): v1.0.1 unless counsel asks for it at launch.
- A published help centre at earlyletters.com (articles from the help-centre branch, v1.0 parts only), hosted by F21.

**Never**
- Asking a person to send letters, recordings, screenshots of letters, or a child's name to get help.
- Staff browsing letters. A preservation path exists only on counsel's instruction (LEGAL-REQ-057) **[server]**.
- An analytics event for opening "If you are struggling" or for any support contact (LEGAL-REQ-015 spirit; F18).
- Promotions, offers or upsells inside a support reply or during a sensitive case.
- Clinical advice, diagnosis or triage by support. Support points to the lines and to 911.
- Product copy that names death, loss or absence (VOICE.md; F12-REQ-009).

## 5. Market reference

| Product | What it does | Does it work? (evidence) | What customers say | Our call |
|---|---|---|---|---|
| Remento | Human support | Praised as responsive [S] R1-S15 | Communication overload after sign-up [S] R1-S15 | **Match** human replies; **Avoid** a stream of emails [R] |
| Storyworth | Human support | Praised as responsive [S] R1-S54 | n/a | **Match** [R] |
| Qeepsake | Email support [F] R1-S43 | Trustpilot 3.0; no replies to recent negative reviews [F][S] R1-S55 | Hard to reach; aggressive marketing texts postpartum [S] R1-S55, R1-S1 | **Avoid**: no promotions in the first weeks [R] |
| Huckleberry | AI guidance; paid "Expedited Service" $19.99 [F] R1-S11 | 4.9 (74K) | Reduces parental anxiety [S] R1-S11 | **Avoid** paid support and AI answers [R] |
| From, Mama | Reflect tab content honouring motherhood [F] R1-S20 | 4.9 | Less anxious about time passing [S] R1-S20 | Neutral |
| Static safety rows | None seen in competitors' pages | **Unverified** (R1 F20) | n/a | Our row has no visible precedent in the category [F] R1 F20 |

## 6. Experience

### 6.1 Entry points

| Where | What | Built? |
|---|---|---|
| Settings > Help and legal > Help ("Write to us") | Opens Mail with the subject "Help with the app" | Built (`apps/mobile/src/app/settings/index.tsx`; `supportMailto` in `packages/brand/index.ts`) |
| Settings > Help and legal > If you are struggling | Disclosure with lines, tap to call | Built (same file; copy `struggling` in `strings.en.ts`) |
| Settings > Recordings footer, first-run Ready screen | How transcription works (`settings.help.mistakes`) | Built there; not in Help and legal |
| Settings top card | "Early version" note with Export a copy | Built (`settings/index.tsx`; `settings.about.beta`) |
| Website `/delete-account` | Deletion by email route | Live (F21); text describes account deletion, which v1.0 has (M14); check it against F17 before submission (F21-REQ-014) |
| TestFlight app | Screenshot and crash feedback to App Store Connect | Apple feature; tester note not written |
| `hello@earlyletters.com` | Founder's inbox through forwarding (`docs/ops/DOMAINS.md` 3 and 9) | Live per D-063 |

### 6.2 Happy path

**A. A question.**
1. Asha's parent taps Settings > Help. Mail opens with subject `settingsHome.helpSubject` "Help with the app" and a body of three lines: app version, build, iOS version (new; today the body is empty).
2. The founder replies within 2 business days using a template from `docs/support/` (section 6.5). The reply never asks for a letter. If a screen helps, the template asks the person to describe what they tapped and saw.
3. The founder tags the ticket in the support log (tags only: `bug`, `question`, `billing`, `lost_content`, `deletion`, `sensitive`), with no names or content.

**B. A hard night.**
1. A parent opens Settings and taps "If you are struggling". The row expands in place: `struggling.body`, then three lines (National Maternal Mental Health Hotline, 988 Lifeline, Postpartum Support International), each a single button that dials, then `struggling.emergency`.
2. Nothing is logged, sent or remembered. The row looks the same tomorrow.

**C. A tester bug in C1.**
1. The tester's welcome note (section 6.6) says: use Settings > Help for anything with words in it; do not screenshot letters in TestFlight feedback.
2. The founder triages TestFlight feedback and crashes daily, files a GitHub issue with `beta` and `S0` to `S3`, describing the problem in words (no screenshot with a letter is ever copied into an issue).

### 6.3 Unhappy paths and edge cases

| ID | Trigger | System behaviour | What the person sees | Recovery | Test |
|---|---|---|---|---|---|
| F20-U01 | No mail account on the phone (`mailto:` cannot open) | `Linking.openURL` rejects; today nothing happens | Required: a sheet with the address `brand.support.email`, selectable, and Copy | Copy and write from any app | Component test with a rejecting `Linking` |
| F20-U02 | iPad or iPod without telephony taps a line | `tel:` fails | The number and "Call or text" stay visible as text; required: the button falls back to copying the number | Copy | Component test |
| F20-U03 | Offline | Mail queues in Mail; tel works without data | Normal | n/a | Manual |
| F20-U04 | A person emails letter text or a recording anyway | Founder reads only what is needed, replies without quoting it, never forwards it, and deletes the attachment after the case closes; the email itself follows the 2-year support retention (Q26 default) | A normal reply | n/a | Runbook dry run |
| F20-U05 | A person writes in distress or mentions harm | Runbook S-2: reply the same day with the three lines and 911, plain and short; no clinical advice; no product talk | A human reply | Lines, 911 | Runbook dry run |
| F20-U06 | A family writes that their child has died | Runbook S-1; the reply first points to Quiet this book, which they can do alone (F09) | A human reply with choices; no product copy about it | Quiet this book, hide, export, delete | Runbook dry run; F12-REQ-009 |
| F20-U07 | Someone reports a letter or a book is lost or changed | Severity 1 incident (03 section 4.3). Support never opens a letter. It walks the person through Recently deleted, signing in on the phone to bring synced letters back (F16), restoring recordings from the owner's backup if it was on (F08), Export, and their iPhone backup | A human reply | F09, F15, F16, F08 | Runbook dry run |
| F20-U08 | A deletion or rights request by email (v1.0 holds accounts, M14) | The deletion runbook (`docs/ops/runbooks/stuck-deletion.md`) with a sign-in link to prove identity; deletes the support thread and any mailing-list entry on request. A kill-path build (server features off) instead explains that letters live only on the phone and how to delete them in the app | A human reply within 10 business days | n/a | Runbook dry run |
| F20-U09 | A deletion request by email **[server]** | `docs/ops/runbooks/stuck-deletion.md` and the deletion spec; sign-in link to prove identity, as the public page says | Receipt email | 30-day undo | Existing runbook |
| F20-U10 | A user says they are under 18 **[server]** | Runbook S-4 (`close_underage_account`, TDD 04 3.3 item 5) | A human reply | Counsel decides grace | Runbook dry run |
| F20-U11 | A custody dispute or court order | Runbook S-5: Terms 9.3 and 9.4; counsel decides; never move or hand over one parent's letters at the other's request | A human reply | Counsel | Runbook dry run **[Counsel]** |
| F20-U12 | Apparent child sexual abuse material reported or found **[server]** | Counsel-led runbook (Q27): preserve, report to NCMEC, do not browse beyond what the runbook requires | n/a | Counsel | Tabletop **[Counsel]** |
| F20-U13 | A parent asks to remove the other parent for safety **[server]** | Runbook S-8 and F11's audited removal (LEGAL-REQ-025) | A human reply | F11 | Runbook dry run (R4 PT-16) |
| F20-U23 | A sole parent has died and a partner or guardian asks for the letters | Runbook S-9: verified documents counsel defines, one export to the named person, no account takeover (R4 PT-17) | A human reply | Counsel | Runbook dry run **[Counsel]** |
| F20-U14 | VoiceOver on the struggling row | Row announces title and hint "Shows free, confidential support lines."; expanded state; each line is a link named with its name and how | Readable | n/a | A11y snapshot |
| F20-U15 | AX5 text | Lines wrap; no truncation of numbers | Readable | n/a | AX5 snapshot |
| F20-U16 | Reduce Motion | Expand without animation | n/a | n/a | Snapshot |
| F20-U17 | A person outside the US (a traveller; storefront is US only) | Lines are US numbers; 911 line shown | US lines | They use local services | Accepted at v1.0; noted in Q4 |
| F20-U18 | A resource number changes | Release checklist re-verifies all three lines and their sources each release (Q25 default) | Correct numbers | Content update and release | Checklist item |
| F20-U19 | Two resource lists drift (`packages/core/src/safety.ts` `US_RESOURCES` dated 30 Sep, and `strings.en.ts` `struggling` dated 3 Oct, describe Postpartum Support International differently) | One list must be the source (F20-REQ-004) | n/a | Delete or align the core list | Test that the two match or one is gone |
| F20-U20 | The founder is away for a week | Auto-reply on `hello@` names the expected reply day and the three lines in one sentence (Q2) | A short auto-reply | n/a | Mailbox setting |
| F20-U21 | Duplicate or abusive emails to `hello@` | Answered once; abuse ignored; no block list holds content | n/a | n/a | n/a |
| F20-U22 | A TestFlight screenshot shows a letter | Triage never copies it into an issue; the issue describes it in words | n/a | n/a | Triage checklist |

### 6.4 What support can and cannot do

| Can | Cannot |
|---|---|
| Explain any screen; walk through Export, Recently deleted, hiding a book, turning reminders off, removing packs | See or edit a letter, ever. Restore or delete a letter except through the person's own app or the deletion runbook. In a kill-path build there is nothing on a server at all |
| Point to Apple for refunds and subscription changes (F14) | Grant Plus, refund or extend a trial (Apple only, B2) |
| Delete a mailing-list address and the support thread on request | Promise a reply time faster than the published one |
| Follow a counsel-approved runbook for legal and safety cases | Give clinical, legal or custody advice |

### 6.5 Runbooks and reply templates (new, `docs/support/`)

Each runbook states: when to use it, the first reply template, the steps, what never to say, who decides, and what is logged (a tag and a date, nothing else). Every template passes the content rules (VOICE.md: no fear, guilt or loss words; never gender the child; `{child}` placeholder; calm, short).

| ID | Case | Core steps | Decides | Status |
|---|---|---|---|---|
| S-1 | A child has died | Reply personally the same day. Offer, without pressing: Quiet this book (self-serve, F09; stops every message about the child for this parent), hide the book for both parents only after asking whether the other parent wants that (F12; R4 PT-18), export, delete. Offer to stop every email from us except the ones the law requires: billing notices continue while Apple still bills, and the reply says so and links Settings > Plan > Manage subscription and Apple's refund request (F14). Offer to delete the due date if the loss was in pregnancy (it is consumer health data, R4 PT-18). No follow-ups unless asked | Founder; counsel on whether billing notices may stop on request | Not built |
| S-2 | A parent in distress or mentions harm | Same-day reply with the three lines and 911, two or three sentences; no advice; no product talk; follow up once after 2 days only if they wrote again | Founder; counsel on wording (Q25) | Not built |
| S-3 | Lost or changed content | Open a severity 1 incident; ask what they tapped and saw; walk through Recently deleted, Export, the iPhone backup; record the build and steps in the incident | Founder | Not built |
| S-4 | Under-18 user **[server]** | Close the account per TDD 04 3.3 item 5; counsel sets any grace period | Counsel, founder | Not built |
| S-5 | Custody dispute, court order, legal request | Do not act on one parent's request against the other; route to counsel; preservation only per LEGAL-REQ-057 | Counsel | Not built |
| S-6 | Suspected CSAM **[server]** | Counsel-led per Q27; preserve, report, do not browse | Counsel | Not built |
| S-7 | Rights request (access, deletion, correction) by email | In a server-off build: explain local data and in-app deletion; delete support and mailing-list data on request; in a server-on build: the deletion runbook | Founder; counsel for edge cases | Partly built: `docs/ops/runbooks/stuck-deletion.md` covers the server path only |
| S-8 | Safety removal of a parent **[server]** | Counsel sets the evidence that counts; reply within 1 business day; remove through F11's audited path; each parent sees only what F11 specifies; never move letters between parents; one `ops_audit_log` row; tell the remaining parent that letters already on the other phone or in an export cannot be taken back (R4 PT-15, PT-16) | Founder with counsel | Not built |
| S-9 | A sole parent has died; a fiduciary asks for the letters **[server]** | Documents counsel defines; one export of the book to the verified fiduciary; no account takeover and no sign-in for them; a Terms clause on fiduciary access (legal lane) and one Help line; a "trusted person" feature is a v1.1 candidate (F30) (R4 PT-17) | Counsel, founder | Not built |
| S-10 | Billing and refunds | Point to Apple's manage and refund sheets in Settings > Plan (F14) | Founder | Not built |

With server features on for v1.0 (M14), all ten apply at launch. S-1 to S-5, S-7, S-8 and S-9 need a dry run before C1 (R4 PT-16); S-6 is a counsel-led tabletop. A named backup responder is in place before C1, or safety removal by support is out of v1.0 and Help says so (R4 PT-16; Q3).

### 6.6 TestFlight feedback

1. App Store Connect > TestFlight > Test Information: beta description, feedback email `hello@earlyletters.com`, contact details, and (server-on only) sign-in notes (`docs/qa/DEVICE_TEST_PLAN.md` TF-08).
2. Tester welcome note (new, `docs/support/testflight-welcome.md`): what to try, how to report (Settings > Help, or TestFlight feedback for crashes), and one plain line: please do not include your letters or your child's name in screenshots; describe what you saw instead (TDD 07 OQ-4).
3. Daily triage of TestFlight feedback and crashes from C0 start to C1 exit (dates in `08-delivery.md` section 2.1): one GitHub issue per problem with `beta` and `S0` to `S3` (DEVICE_TEST_PLAN; FOUNDER_TASKS FT-32).
4. The store listing and website never say beta; the in-app note stays (B8, D-060).

### 6.7 Screen states

| Screen | Empty | Loading | Error | Offline | AX5 (SE 3) | VoiceOver |
|---|---|---|---|---|---|---|
| Settings > Help and legal | Every row present in every build and plan state | n/a | A link that cannot open: the row stays and the URL is shown to copy | Rows open; web pages fail with Safari's own page; the struggling row and the pledge work offline | Rows wrap to two lines | Rows are buttons; disclosures announce expanded or collapsed |
| If you are struggling (disclosure) | Always the three lines and 911 | n/a | No telephony: the number is copied and `struggling.numberCopied` (new, "Number copied") shows (F20-REQ-005) | Works offline (tel needs no data) | Numbers never truncate | Each line reads name, then how to reach it (F20-U14) |
| Mail fallback sheet | n/a | n/a | It is the error state: `brand.support.email` with Copy (F20-REQ-007) | Identical | Address wraps | Sheet title first |

## 7. Requirements and acceptance criteria

Renamed on 14 Oct 2026 (R5 EQ-05): F20-REQ-006 and F20-REQ-021 no longer carry C-REQ-016 and K-14 as IDs; F17 is their home.

Status: **Built** (file), **Partly built**, **Not built**, checked 13 Oct. **[server]** needs our server and is v1.0 (M14); built code behind the switch is "Built, switch off in release profiles" until the profiles flip.

| ID | P | Requirement | Acceptance criteria | Status | Source |
|---|---|---|---|---|---|
| F20-REQ-001 Rev (B7, D-034) | P0 | "If you are struggling" is always on Settings, never behind a flag, never counted | Given any build and any remote config, Then the row renders in Help and legal; grep finds no flag read around it and no analytics call inside it | Built (`apps/mobile/src/app/settings/index.tsx`) | D-034, D-059 |
| F20-REQ-002 | P0 | Three verified US lines and a 911 line, each one tap to call or text | Given the row expanded, Then 3 link buttons dial their numbers and `struggling.emergency` shows; VoiceOver reads name and how for each | Built (`settings/index.tsx`, `strings.en.ts` `struggling`) | D-034 |
| F20-REQ-003 | P0 | Each release re-verifies the three lines against their official pages and records the date and URL **[Counsel]** | Given the release checklist, Then a dated line for each resource exists for that build | Not built (comment says verified 3 Oct; no checklist step) | COUNSEL_PACKET Q25 |
| F20-REQ-004 | P0 | One source of truth for crisis resources | Given the repo, Then either `packages/core/src/safety.ts` `US_RESOURCES` is removed or a test asserts it equals `struggling.resources` | Not built (two lists; Postpartum Support International text line differs) | LEGAL-REQ-015 |
| F20-REQ-005 | P0 | A device without telephony can still use a line | Given `tel:` unsupported, Then tapping copies the number and says "Number copied" (new copy) | Not built | LEGAL-REQ-051 |
| F20-REQ-006 | P0 | Help opens an email with a fixed subject and a body of app version, build and iOS version only (help slice of C-REQ-016; home F17) | Given the mailto URL, Then subject is `settingsHome.helpSubject`, the body has exactly 3 lines matching `Version {v} ({b})`, `iOS {x}`, and nothing else; no plan state, language, child count or name | Partly built: subject only, empty body (`settings/index.tsx`; `supportMailto`) | LEGAL-REQ-014 |
| F20-REQ-007 | P0 | When Mail cannot open, the address is shown to copy | Given `Linking.openURL` rejects, Then a sheet shows `brand.support.email` with Copy | Not built | LEGAL-REQ-051 |
| F20-REQ-021 | P0 | How transcription works is always in Help and legal (slice of K-14; home F17) | Given Settings, Then `settings.help.mistakesTitle` is a row in Help and legal (2 taps) | Partly built: shown in Recordings and first run, not in Help and legal | K-14 |
| F20-REQ-008 | P0 | Help and legal lists: Help, If you are struggling, How transcription works, Terms, Privacy Policy, Consumer Health Data Privacy Policy, Subprocessors, Licences, the 90-day promise, Version | Given Settings, Then each row exists and opens a URL from `packages/brand` or an in-place disclosure | Partly built: Help, struggling, Terms, Privacy Policy, Licences, Version are in Help and legal; Consumer Health Data and Subprocessors are in Settings > Privacy; `help.pledge` has no row | C-REQ-016, PRD-REQ-009 |
| F20-REQ-009 | P0 | The early-version note stays until the founder ends the beta, and never appears in the listing or website | Given the store and site copy tests, Then no beta-like word; given Settings, Then the note shows | Built (`settings/index.tsx`; `packages/content/test/rules.test.ts` K-13 rule) | B8, D-060 |
| F20-REQ-010 | P0 | Support never asks for content | Given every template in `docs/support/`, Then none asks for a letter, recording, screenshot of a letter or a child's name; the content rules test reads `docs/support/**` | Not built (templates do not exist on develop; rules test does not read `docs/support/`) | LEGAL-REQ-014 |
| F20-REQ-011 | P0 | Runbooks S-1 to S-10 exist with templates, and S-1 to S-5, S-7, S-8 and S-9 are dry-run before C1 | Given the dry-run record, Then 8 cases walked end to end with timings, and a backup responder is named | Not built | F12-REQ-009, F11-U31, F01-U18; R4 PT-16, PT-17 |
| F20-REQ-012 | P0 | No loss, fear or guilt language in any support copy or template | Given the content rules applied to `docs/support/**`, Then 0 findings | Not built | VOICE.md, CLAUDE.md |
| F20-REQ-013 | P0 | First reply targets (an operations measure read at C1 exit, not a build test, R5 sample item 38) | Given the support log for C1, Then 90% of first replies within 2 business days and 100% of deletion or rights requests acknowledged within 10 business days | Not built (no log) | LEGAL-REQ-031, `/delete-account` page |
| F20-REQ-014 | P0 | The support log holds tags and dates only | Given the log, Then no name, email address, letter text or child detail; tags from a fixed list | Not built | LEGAL-REQ-014 |
| F20-REQ-015 | P0 | TestFlight test information and the tester welcome note are filled before C1 | Given App Store Connect, Then feedback email is `hello@`; the note includes the no-screenshot line | Not built (`docs/ops/RELEASE.md`, which DEVICE_TEST_PLAN cites, does not exist) | TDD 07 OQ-4, BL-Q29 |
| F20-REQ-016 | P0 | Daily triage with severity labels from C0 to C1 exit | Given each day from C0 start to C1 exit, Then feedback and crashes reviewed and issues filed with `beta` and `S0` to `S3` | Partly built: process in `docs/qa/DEVICE_TEST_PLAN.md`, `docs/FOUNDER_TASKS.md` FT-32 | D-045 |
| F20-REQ-017 | P0 | No promotion in any support reply or sensitive case | Given templates, Then no price, offer or Plus pitch | Not built | R1 F20 |
| F20-REQ-018 | P0 | Support has no tool to read letters | Given the repo, Then no admin screen or script reads `entries` text except the counsel-only preservation path **[server]**, and no runbook step in `docs/support/` or `docs/ops/runbooks/` opens a content table in the Supabase dashboard. Dashboard reads are not logged until F17's database audit lands (R4 PT-03), so this requirement does not support a "each one is logged" claim | Partly built: no admin tool found; the runbook check is new | LEGAL-REQ-057; R4 PT-03 |
| F20-REQ-019 | P1 | Privacy and security mailboxes exist, and the policies and `security.txt` name the right ones | Given DNS and the site, Then `privacy@` and `security@` forward, and `/.well-known/security.txt` returns 200 | Partly built: `hello@` live; others suggested (`docs/ops/DOMAINS.md`); live `security.txt` returned 404 on 13 Oct | LEGAL-REQ-052, DOMAINS.md |
| LEGAL-REQ-056 | P1 | Report a concern **[server]** | Given a family member exists, Then a Help row opens a support form with category only | Not built; v1.0 (M14) | CR-086 |
| LEGAL-REQ-052 | P1 | Accessibility statement and feedback route | Given the website, Then the statement and a contact route exist; Help links it | Not built (`/accessibility` returned 404 on 13 Oct) | CR-070 |

### 7.1 Test map (P0)

| ID | Test file or run | Exists? |
|---|---|---|
| F20-REQ-001, F20-REQ-002, F20-REQ-008, F20-REQ-021 | `apps/mobile/test/settings-help.test.ts` (rows present, no flag read, no analytics call) | New |
| F20-REQ-003 | Release checklist line with dated URLs (evidence) | Human |
| F20-REQ-004 | `packages/core/test/core.test.ts` or the content test (one list) | Exists; case new |
| F20-REQ-005, F20-REQ-006, F20-REQ-007 | `apps/mobile/test/settings-help.test.ts` (mailto body, rejecting `Linking`, no telephony) | New |
| F20-REQ-009 | `packages/content/test/rules.test.ts` ("[K-13] has no beta wording") | Exists |
| F20-REQ-010, F20-REQ-012, F20-REQ-017 | `packages/content/test/rules.test.ts` extended to `docs/support/**` | Exists; extension new |
| F20-REQ-011, F20-REQ-013, F20-REQ-014, F20-REQ-015, F20-REQ-016 | Dry-run record, support log and C1 exit review (operations, not build tests) | Human |
| F20-REQ-018 | `scripts/` grep in CI over `docs/support/` and `docs/ops/runbooks/` for dashboard content-table steps (new); repo search for admin tools | New |

## 8. Data, privacy and security

| Data | Level | Where | Who reads | Retention | Never |
|---|---|---|---|---|---|
| Support emails | L3 (they may contain anything a person types, up to L4 when someone attaches a letter or recording) | The founder's inbox through forwarding; the mailbox provider is named on the subprocessor page (F21; R4 PT-33) | Founder | 12 months after the last message [R] (R4 PT-33; counsel decides with Q26, whose default is 2 years); attachments deleted when the case closes, checked monthly | Copied into issues, chat or the repo |
| Support log | Tags and dates | A private sheet or the issue tracker | Founder | 2 years | Names, addresses, content |
| Crisis row use | None | Nowhere | Nobody | n/a | Logged, counted or sent |
| TestFlight feedback and screenshots | May contain L4 | App Store Connect | Founder | Apple's retention [U] | Copied into GitHub issues |
| Mailing-list address (website) | L3 | Resend | Founder | Until unsubscribe | Used for product messages to app users |

- v1.0 holds account data, letter text and encrypted recordings on our server (M14), so a breach of our systems could expose letter text; the security fixes come first (09 R-17). Support email is also a store of personal data and gets the same care. In a kill-path build we hold no letter.
- The subprocessor list names Resend and the mail forwarder (F21).

## 9. Non-functional requirements

| Item | Budget | Source |
|---|---|---|
| Struggling row | Opens in place in under 100 ms; works offline | LEGAL-REQ-051 |
| Accessibility | VoiceOver, AX5, Reduce Motion pass on Help and legal | LEGAL-REQ-051 |
| Support capacity | About 2 hours a week of founder time at C1 [A: 15 to 25 families] | ROADMAP R-04 |
| Reply time | Section 3 | Section 3 |

Shared budgets: `06-nfr.md`.

## 10. Analytics

None, by decision. Opening Help, opening "If you are struggling", calling a line and writing to support are never events (F18). Support volume comes from the support log tags (counts only). The F11 metric "tickets about not seeing the partner's letters" reads the same log.

## 11. How we build it (with the architect)

- **App.** `apps/mobile/src/app/settings/index.tsx` keeps the Help and legal section; add the How transcription works row, the 90-day promise row (a `Disclosure` with `help.pledge`), the mail fallback sheet and the tel fallback. New strings go to the feature `copy.ts` first, then `packages/content` (brief coordination rules). Body lines from `expo-constants` and `Platform.Version` (both in use already).
- **One resource list.** Delete `US_RESOURCES` and `SAFETY_COPY` usage from `packages/core/src/safety.ts` or move the list there and import it in content; keep one. The classifier stays unused until F39.
- **Support folder.** `docs/support/` (new on develop): runbooks S-1 to S-8, templates, the tester welcome note, the log format. Start from the help-centre branch's README and articles, keeping only v1.0 passages (its own notes mark the v1.1 ones).
- **Content test.** `packages/content/test/rules.test.ts` reads `docs/support/**/*.md` with the same patterns.
- **Riskiest unknown.** Founder time: one person answers every email, including hard ones, during the 30-day sprint. Mitigation: templates and an auto-reply; Q3 names a backup.

## 12. Work packages

`08-delivery.md` section 3.3 governs file ownership: a path below owned by another stream is a request to that stream (R5 EQ-08).

Only for what is missing or partly built.

| WP | Scope | Owner | Owns files or folders | Depends on | Done when | Mode |
|---|---|---|---|---|---|---|
| WP-F20-01 | Help body lines, mail fallback sheet, tel fallback | Mobile | `apps/mobile/src/app/settings/index.tsx`, feature `copy.ts` | none | `[F20-REQ-005]`, `[F20-REQ-006]`, `[F20-REQ-007]` | Agent |
| WP-F20-02 | Help and legal rows: How transcription works, 90-day promise | Mobile with F17 | `apps/mobile/src/app/settings/index.tsx` | F17 IA | `[F20-REQ-021]`, `[F20-REQ-008]` | Agent |
| WP-F20-03 | One crisis resource list | Core, content | `packages/core/src/safety.ts`, `packages/content/src/strings.en.ts`, a new test | none | `[F20-REQ-004]` | Agent |
| WP-F20-04 | Runbooks S-1 to S-10 and reply templates | Support lead, counsel for S-1 (billing emails), S-2, S-4, S-5, S-6, S-8, S-9 | `docs/support/runbooks/`, `docs/support/templates/` (new) | Q25, Q27 | `[F20-REQ-011]` files present; `[F20-REQ-010]`, `[F20-REQ-012]`, `[F20-REQ-017]` | Agent then counsel |
| WP-F20-05 | Content rules over `docs/support/**` | Content | `packages/content/test/rules.test.ts` | WP-F20-04 | `[F20-REQ-010]`, `[F20-REQ-012]` tests green | Agent |
| WP-F20-06 | Tester welcome note and TestFlight test information | Release owner, founder | `docs/support/testflight-welcome.md` (new); App Store Connect | C0 build | `[F20-REQ-015]` | Pair |
| WP-F20-07 | Support log format and triage checklist | Support lead | `docs/support/log.md` (new, format only) | none | `[F20-REQ-013]`, `[F20-REQ-014]`, `[F20-REQ-016]` | Agent |
| WP-F20-08 | Dry runs of S-1 to S-5, S-7, S-8, S-9; name a backup responder | Founder with support lead | Dry-run record in `docs/support/` | WP-F20-04 | `[F20-REQ-011]`: record with 8 rows and the backup's name | Human |
| WP-F20-09 | `privacy@`, `security@`, live `security.txt` | Founder, web | DNS; website `/.well-known/security.txt` (F21) | none | `[F20-REQ-019]` | Human then agent |

## 13. Open questions and assumptions

| Q | Who, by when | What changes |
|---|---|---|
| Q1 Does a static list of verified national lines plus the Terms 20.3 disclaimer suffice, with no clinician sign-off (COUNSEL_PACKET Q25, default yes)? **[Counsel]** | Counsel; 16 Oct | F20-REQ-003 wording |
| Q2 An auto-reply on `hello@` with the reply day and the three lines in one sentence: yes or no? Default [R]: yes during C1 | Founder; 16 Oct | Mailbox setting |
| Q3 Who answers support when the founder is away? Without a named backup, safety removal by support stays out of v1.0 (R4 PT-16) | Founder; before C1 | Runbooks name a backup |
| Q7 May billing notices stop when a grieving family asks us to stop all email (R4 PT-18)? **[Counsel]** | Counsel; with the M14 counsel delta | S-1 template |
| Q8 What documents prove a fiduciary's right to a dead parent's letters, and what may they receive (R4 PT-17)? **[Counsel]** | Counsel; before C1 | S-9 |
| Q4 Non-US lines for travellers: none at v1.0 (US-only storefront) | Founder; v1.1 planning | Resource list |
| Q5 Is a forwarding phone number required for the custom EULA (COUNSEL_PACKET Q18)? **[Counsel]** | Counsel; 23 Oct | Support channels and Terms 26.1 |
| Q6 Wording of S-2 and S-5 templates **[Counsel]** | Counsel; 23 Oct | Templates |

| A | Assumption | How we validate |
|---|---|---|
| A1 | C1 families send fewer than 10 emails a week | Support log after week 1 of C1 |
| A2 | Two business days is fast enough for a beta | C1 exit review |

## 14. Sources

- Brief and rulebook: `docs/agents/BRIEF-2026-10-03.md` items 9 to 11; `_AUTHORING.md` 3 (B7, B8), 3b (M13), 7.
- Decisions: D-030, D-034, D-059, D-060, D-061 in `docs/DECISIONS.md` on develop; commit c1764f9.
- Code and copy: `apps/mobile/src/app/settings/index.tsx`; `packages/brand/index.ts` (`supportMailto`, `brand.web`); `packages/content/src/strings.en.ts` (`settingsHome`, `struggling`, `settings.help`, `settings.about.beta`); `packages/core/src/safety.ts`; `packages/content/VOICE.md`; `packages/content/test/rules.test.ts`.
- Ops and QA: `docs/ops/runbooks/` (5 files); `docs/ops/DOMAINS.md` sections 3, 8 and 9; `docs/qa/DEVICE_TEST_PLAN.md` TF-07 to TF-09; `docs/FOUNDER_TASKS.md` FT-32; `docs/tdd/07-quality-test-strategy.md` OQ-4, BL-Q29; branch `origin/agent/support/help-centre` `docs/support/README.md`.
- Legal: `docs/legal/ENGINEERING_REQUIREMENTS.md` LEGAL-REQ-014, -015, -031, -051, -052, -056, -057; `docs/legal/COUNSEL_PACKET.md` Q18, Q25, Q26, Q27, Q29; `docs/legal/terms-of-service.md` 9.3, 9.4, 10.3.
- Website: earlyletters.com `/delete-account`, `/accessibility`, `/.well-known/security.txt`, fetched 13 Oct 2026.
- Research: R1 F20 (R1-S1, R1-S11, R1-S15, R1-S20, R1-S43, R1-S54, R1-S55).
- Siblings: F01-U18, F11-U31 and Q6, F12-REQ-009 and F12-U20, F17 section 4 and 6.2.
