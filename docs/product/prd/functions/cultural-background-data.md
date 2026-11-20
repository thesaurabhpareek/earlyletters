# Function review: cultural background data (CUL)

Status: CURRENT (LOCKED rev 2) (function review) | 20 Nov 2026 | Owner: `privacy` | Replaces: none | Load when: cultural background and days data handling (FR-CUL).

Status detail: draft for Karma's ruling, 20 Nov 2026. Wave 3, brief 3 (`tools/review/wave3-briefs.md`). Written by the `privacy` agent, with the `legal` and `regulatory-affairs` lenses named where they speak. Docs only: this file changes no card, no legal text, no label and no code. Not committed.

I am a Claude role, not a lawyer and not a privacy regulator. Nothing here is legal advice. Every legal reading is marked "counsel must confirm". What I could not read, I say in section 1.3. Where a requirement would collect more, keep longer or weaken a consent gate, it is a question, not a ruling.

Scope (from the founder direction of 20 Nov, sections 1.2 and 3.4): the founder asked to optionally ask a parent for a religion and a native country, with a clear call-out that it is only used to choose which days we mark. This file decides how that data is classified, stored, erased, kept out of every export and log, shown (or not) on a lock screen, worded, and when it is asked. The list of days itself is the days-library file (`functions/days-library.md`, FR code DAY); the notification words are `functions/notification-catalogue.md` (NTC). I point to them and do not duplicate them.

## 0. The short version

1. **Classify it L4, all of it.** A religion, a country a family is from, and the list of days a parent ticks (which reveals both) are sensitive data about a person. Apple's own label lists "religious or philosophical beliefs" and "racial or ethnic data" under Sensitive Info (S1). GDPR Article 9(1) names "religious or philosophical beliefs" and "racial or ethnic origin" (S3). The California statute's sensitive list names both (S4, secondary). This repo already treats a proxy for ethnicity (languages spoken) as the highest class (`data-policy.md:46`).
2. **Recommended: store less than the founder asked.** Do not keep "religion" and "country" as fields at all. Ask, show that tradition's days, and keep only the days the parent ticks (and any date they moved). The tradition and country picks are a browsing filter that is forgotten when the sheet closes. "Prefer not to say", "None" and "Not now" then write nothing but a content-free "asked" flag. This is a collect-less ruling inside the `privacy` charter; the founder can overrule it (CUL-Q2), and if they do, every rule below applies to the fields too.
3. **On the phone only, and say so truthfully.** Nothing synced, nothing uploaded, no server column, never in the Save a copy file. Because the phone's local database is in the parent's own iPhone backup today (`data-policy.md:144`), the call-out "only on this phone" is not strictly true of the existing settings store. The fix is to keep this one store out of the backup (as the smaller picture copies already are, NS-37-R4), not to soften the sentence.
4. **Sign-out clears it** (as NS-13 reminders and NS-18 typed days do). That removes the second-account problem (X4) instead of testing for it, and makes Delete account reach every phone when its session ends.
5. **A lock screen must never teach a passer-by a family's faith.** All library-day notes share one neutral body, whatever the layer. The day's name shows in the notification only behind its own switch (default off, off whenever App lock is on), separate from the child-name switch.
6. **One reader.** Only the days module reads the store. A day note opens a generic prompt: `entries.prompt_key` is synced to the server (L2, `20261002020000_data_governance.sql:1116`), so a day-specific prompt key would put a tradition on our server by the back door. This is the leak I would most expect to be missed.
7. **Ask after the first kept letter, but not in the same sitting** (the first-letter screen already carries the Keep gate and the reminder ask, A-S13), once, with "Not now" a complete answer, and never in first run. I agree with Karma's recommendation (direction 3.3) and add the sequencing rule (CUL-15).
8. **Two things I could not verify** and that gate the label and the review story: whether App Review accepts an optional personalisation question under 5.1.1(iii) (UNVERIFIED, no source says), and whether GDPR Article 9 or US state sensitive-data rules reach data that never leaves the user's phone (counsel must confirm). Both have a no-data fallback in section 10 (CUL-Q8).

## 1. What I reviewed, and what I did not

### 1.1 Repo sources (read 20 Nov 2026)

| Source | What I read |
|---|---|
| `docs/product/prd/20-founder-direction-20nov.md` | In full. Sections 1, 2, 3 (3.1 to 3.4), 6.2, 7, 9 carry this brief |
| `tools/review/wave3-briefs.md`, `gap-agents-common.md`, `functions/BRIEF.md` | In full |
| `functions/privacy.md` (my wave 1 file) | In full. FR-PRV-07, 10, 11, 13, 14, 15, 18, 24, 29, 30, 34 are reused below |
| `functions/legal.md` | Header, section 1, FR-LEG list (rows 83 to 102 by their first lines); FR-LEG-08 (new field needs a policy line and notice) is the one that touches this file |
| `functions/compliance.md` | Coverage table, FR-CMP-03 (Notes for Review), FR-CMP-05, FR-CMP-17, questions C-1 to C-8, source list; line 161 (US storefront only) |
| Cards | `09-capture.md` NS-13 (lines 45, 64, 108, 131, 160, 167) and NS-18 (lines 933 to 1000 in full); `11-foundations.md` NS-32 (lines 37, 59, 106, 107, 139, 158, 171); `08-keeping-and-trust.md` NS-11 (lines 585 to 671); `19-from-download-to-first-letter.md` lines 38, 904, 1099 |
| `DATA_CLASSIFICATION.md` 1.5.0 | Header, section 0, section 1 and 1.1 (rules 1 to 9), section 2 (handling table). Not the section 4 inventory except by grep |
| `data-policy.md` | Line 46 (class definitions, languages as a proxy for ethnicity), lines 140 to 144 (backup rows) |
| `privacy-policy.md` | Lines 37, 67, 103 by grep (iPhone backup, Apple terms) |
| Code | `apps/mobile/src/lib/reminders/prefs.ts` (header and keys); `lib/erase-everything.ts` (header and first 80 lines); `lib/store.ts:272-277` (`getSetting` takes no account); `lib/export/schema.ts:271` (export carries consent choices from phone settings); `supabase/migrations/20261002020000_data_governance.sql:211, 1116, 1143` (`prompt_key`); `packages/analytics/src/consent.ts` header |
| Design branch `origin/docs/e2e-ux-20nov` | `DESIGN.md` screen inventories of areas A, C and D (A-S01 to A-S15, C-S01 to C-S22, D-S01 to D-S24) |

### 1.2 Outside sources read this session

See section 11 (S1 to S4, and one blocked page).

### 1.3 What I did not read or run

- Not read: `apps/mobile/src/lib/reminders/planner.ts` and `scheduler.ts` beyond a grep (so "what the planner must change" is written from NS-13, NS-18 and NS-32, not from the code); the sign-out code path (so "sign-out clears" is a requirement, not a statement about today); the `.xcprivacy` manifest and `Info.plist`; `packages/content` VOICE.md and BRAND.md (the call-out drafts in section 9 are for `content` to finish, checked only against the CLAUDE.md content rules); the five `WORDS.md` files; NS-42 to NS-45 in full (only the lines above); `packages/analytics` allowlist tests.
- Not verified in code: that the local database file is in the iPhone backup today. I rely on `data-policy.md:144` (D-033: "the local database [is] included"). If that is wrong, CUL-06 reduces to a test.
- Not read: the text of CCPA (the statute PDF at cppa.ca.gov failed to load), the state comprehensive privacy acts (Colorado, Connecticut, Virginia and others), any EU guidance on whether an app that only stores data on the user's device is a controller of it. Those are UNVERIFIED and are counsel's.
- Not read: any source on how App Review treats an optional faith or origin question. I found none. UNVERIFIED.
- Not run: no test, device or app. Whether Notification Center, Apple Watch mirroring or Apple's notification summaries show our body text under a locked phone is a device walk (J-CUL-01), not something I read.
- Blocked: `https://gdpr-info.eu/art-9-gdpr/` did not load (a permission request went unanswered). I did not retry it and used the legislation.gov.uk copy of the adopted text instead.

## 2. Coverage verdict per card (cultural-data view)

The founder's ask touches few cards. Cards not listed hold no data from this feature and are "n/a: nothing new" for this file.

| Card | Verdict | Why | FR rows |
|---|---|---|---|
| NS-13 Reminders | Partly | Sign-out clears reminders and names are off by default; the names switch is for the child's name (`notifications.lockScreenNames`). A faith day needs its own switch, or turning on the child's name would also expose a tradition | 12 |
| NS-18 Typed days | Partly (conflict) | Its "Not in scope" says: "Recurring days. Days the app suggests. Syncing typed days." (`09-capture.md`, section 3). A chosen library day is recurring and app-suggested, so it cannot be a typed day without changing this card. Typed days are "per phone, not per book", deleted the day after delivery and removed at sign-out; none of that fits a yearly day. The direction (3.1) says a chosen day "becomes a typed day": that sentence needs a card change or a separate store | 02, 12, 13 |
| NS-32 Notification budget | Partly | `occasion` was removed (parked with NX-39); Q-FD-6 reopens it. Rules R12 (no names or words by default), R13 (neutral placeholder), no time-sensitive class all carry over; a library-day class needs its own priority and one neutral string for every layer | 12 |
| NS-36 Data follows the letter / Erase | Missing | Its erase rows list letters and pictures; a new phone-only store must be added to the registry and the Erase scan (FR-PRV-07, 34) | 01, 07 |
| NS-11 Save a copy | Missing | Silent on a preference store. The export reads phone settings for its consent block (`schema.ts:271`), so a new settings key could leak into the file by accident | 11 |
| NS-39 First launch, NS-40, NS-41, E-S01 to E-S08 | Covered if kept closed | First run has a 90 second target and a field-inventory test (FR-PRV-24). Nothing here is added to it | 15 |
| NS-44 First letter to the Keep gate (A-S13) | Partly | A-S13 already hands off to the Keep gate (E-S10) and the reminder ask (D-S04). A third ask in the same sitting would stack three requests on the most emotional screen | 15 |
| NS-45 Sign-out, delete, session end | Missing (not yet written) | Must carry the sign-out clear (08) and the Delete account line (09) | 08, 09 |
| NS-25 The other parent | Covered | Per phone and never shared must be stated for this store | 23 |
| NS-01, 02, 05, 06, 08, 10, 12 to 17, 19 to 24, 26 to 31, 33 to 38 | n/a | No data from this feature | none |

## 3. Function requirements

Priority: P0 carries its RR-4 reason: (a) a promise, (b) a legal or store duty, (c) the core loop. Owner lanes are agent handles. Every legal reading is "counsel must confirm". "New row needed" means no backlog row exists yet (no id above BL-999; Karma allocates). Screen ids marked "(proposed)" do not exist yet.

### 3.1 What the data is and how little we keep

| Id | Requirement (Given, When, Then) | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-CUL-01 | Given any value that states or implies a religion, a tradition, a country or region a family is from, or the list of library days a parent has ticked, When it is stored anywhere, Then it is class L4, in the FR-PRV-07 registry with: store, account scope (per account, cleared at sign-out), sign-out behaviour (cleared), Erase behaviour (erased), export flag (not exported), backup flag (excluded), and sync flag (never). One class for the whole store: the highest item wins (DATA_CLASSIFICATION rule 1.1.1), so a ticked "Mother's Day" is L4 beside a ticked faith day | NS-47 (new card); NS-36 rows; FR-PRV-07; new row needed; screen (proposed) C-S24 | P0 (a): "never in analytics, logs or crash reports" (CLAUDE.md) and the founder's "only on this phone" | privacy; mobile | DATA_CLASSIFICATION rules 1.1.1, 1.1.2 (derived data inherits), 1.1.3 and 1.1.6; `data-policy.md:46` ("languages spoken (proxy for ethnicity)" is S); S1 Sensitive Info row; S3 Art 9(1); S4 |
| FR-CUL-02 | Given the ask card or Me, Days we mark, When a parent picks a tradition or a country, Then it is a browsing filter held in memory until the sheet closes; the only thing written is each day the parent ticks (a stable day key and, if the parent moved it, the date) and the content-free `culture.asked` flag (`done`). "Prefer not to say", "None", "Not now" and closing the sheet write only the flag, and the app behaves afterwards exactly as if the question was never asked. If the founder rules instead that the picks are kept as fields (CUL-Q2), each one is a separate registry row under FR-CUL-01 and a "Clear" control removes it | NS-47-R1; NS-18; D-S06; (proposed) C-S24; new row needed | P0 (a) | privacy; mobile | Direction 3.4 ("Prefer not to say is a first-class answer and is the same as not answering"). This is collect-less: what is not kept cannot leak, be subpoenaed, or surface in a backup. CPrivO skill section 4 (collect less is a `privacy` ruling) is cited in `privacy.md` FR-PRV-35 |
| FR-CUL-03 | Given any answer, Then no value is attached to the child: no column, key or label on `children`, `child_member_prefs`, the book, or a letter says the family or the child follows a tradition, and no screen word says "your child is {tradition}". The days belong to the parent's choice for the family, never to the child's record | NS-47-R2; DATA_CLASSIFICATION rule 1.1.6 (child data is L4); C-S15 | P0 (a) | privacy; content | Rule 1.1.6; a child cannot give a view on faith, and a book is shared with the other parent and relatives |

### 3.2 It never leaves the phone

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-CUL-04 | Given the store, Then it is never synced, uploaded or sent: no migration adds a column, table or setting key whose name matches tradition, religion, faith, country, origin or culture (a migration lint fails on one); `sync_push` and every Edge Function contract carry none; a network-fake test over the ask, the tick, the clear, the claim step and a re-plan sees zero requests carrying a day key. Nothing is written to `record_policy_act` or any server table when the parent answers or declines: a "this person answered a faith question" row would itself be the derived fact S1 warns about | NS-47-R3; FR-PRV-29 (G11 guard); E-S24 claim; new row needed | P0 (a) | mobile; data-architect | S1: "Data that is processed only on device is not 'collected' ... If you derive anything from that data and send it off device, the resulting data should be considered separately" |
| FR-CUL-05 | Given a notification from a library day, When the parent taps it, Then Home opens a generic prompt from the existing catalogue (the same one an ordinary evening uses); `entries.prompt_key`, `prompt_library_version` and every other synced entry field carry nothing that identifies the day or its tradition; a letter written from a day note is indistinguishable, in every column the server holds, from one written on any other evening. A test saves a letter from each library day and compares the synced row to a control | NS-47-R4; NS-13; NS-35; entries columns; new row needed | P0 (a) | mobile; sync; content | `data_governance.sql:1116`: `entries.prompt_key` is "L2 prompt catalogue key" and is in the synced view (`:1143`). Direction 3.4 "never changes what the app says outside these suggestions" |
| FR-CUL-06 | Given the store, Then it lives in a file or database excluded from the iPhone backup (as `photos/*-512.jpg` are, NS-37-R4), not in the `settings` table of `scribe.db`; deleting the app deletes it (never the Keychain, which outlives a reinstall: `erase-everything.ts` already has to clear Keychain leftovers for that reason). A restored phone does not ask again: `culture.asked` is in `settings`, which restores (NS-47-R6); a fresh install with no restore asks once. If the founder prefers the `settings` table, the call-out sentence changes to "on this phone and in your own iPhone backup" and the Privacy Policy line to match (CUL-Q4) | NS-47-R5; NS-37-R4; privacy-policy.md:37; new row needed | P0 (a): the call-out says "only on this phone" | mobile | `data-policy.md:144`: "recordings and the local database are included" in iOS backup (D-033), UNVERIFIED in code this session; `store.ts:272`: `getSetting(key)` is the phone's one settings table |
| FR-CUL-07 | Given the claim step on the "Start on this phone" path (E-S24) or the new-phone path, When a book is claimed or restored, Then the store is re-keyed to the account unchanged and uploads nothing; on a new phone it is empty and the card follows the ask rules afresh (not synced, as NS-13-R22 does for reminders) | NS-47-R6; E-S24; C-S10; NS-13-R22; new row needed | P0 (a) | mobile; sync | NS-13-R22 line 160 |

### 3.3 Nothing in logs, analytics, URLs, crash reports, support or the file

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-CUL-08 | Given the log canary (FR-PRV-10), When it runs with synthetic tradition and day keys in every new path (ask, tick, move a date, clear, schedule, deliver, tap), Then none appears in any log, breadcrumb, error message, URL, route parameter, notification identifier or body (except behind the switch of FR-CUL-12), analytics property, or support link. Fixtures use a synthetic key (for example `zz-test-tradition`) and a synthetic day, never a real tradition paired with the Asha family (Asha has no tradition; tying a real one to a fictional family is its own stereotype) | NS-47-R7; FR-PRV-10, 11, 12, 13; J-N18; new row needed | P0 (a) | qa; platform; mobile | CLAUDE.md privacy rules; LEGAL-REQ-014; DATA_CLASSIFICATION section 2 (L4 never logged, never in URLs) |
| FR-CUL-09 | Given opt-in analytics (a later decision, off through 1.0, D-124) or the k-anonymised insights, Then no event, property, bucket or aggregate carries a tradition, a country, a day key or a count of parents who ticked any; the typed catalogue test rejects names matching the FR-CUL-04 list; and the `lang` precedent (a language code is allowed) is not extended to these. A parent's choice is never an experiment variable | NS-47-R8; `packages/analytics` allowlist; DATA_CLASSIFICATION 4.7, 4.9; `analytics` agent | P0 (a) | analytics; privacy | DATA_CLASSIFICATION section 2 Analytics row (L4 never); `consent.ts` header (L2 only) |
| FR-CUL-10 | Given the Save a copy file (`account.json`, the book, the manifest), Then it holds none of this store; a test builds an export with every key set and finds no key, day, tradition or country in any file. Me, Days we mark says in one line that the list is not in Save a copy. A letter that mentions Diwali in the parent's own words is the parent's words and exported as always | NS-11; NS-47-R9; C-S04; `schema.ts:271` | P1 (a): the export is "plaintext by design" and travels | mobile | DATA_CLASSIFICATION section 2 Export row: plaintext by design, the screen says so (DATA-REQ-056). Ruled as for typed days in `privacy.md` section 5 (phone-only, never held by us, so outside an access request to us; counsel must confirm) |
| FR-CUL-11 | Given the module boundary, Then only the days module reads the store; the planner receives opaque slots (date and neutral body key); prompts, Home copy, emails, the Find index, analytics and support read none of it; an import-boundary test fails on a second reader. The stated purpose, "used for one thing: suggesting days", is therefore true by construction | NS-47-R10; NS-32; Apple 5.1.2(ii) | P0 (a)(b) | mobile; privacy | S2 5.1.2(ii): "Data collected for one purpose may not be repurposed without further consent unless otherwise explicitly permitted by law"; 5.1.2(iii) no profile building |

### 3.4 The lock screen and the people around the phone

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-CUL-12 | Given a library-day note of any layer (seasonal, family, civic, tradition, national), Then by default its body is one neutral string, the same for every layer, never naming the day, the tradition or the country (intent: "Something for the book today"; `content` writes it); its category sets the hidden-preview placeholder. The day's name shows in the body only when the parent turns on a separate switch (proposed "Show the day's name in the note", default off, not tied to `notifications.lockScreenNames`, forced off while App lock is on as F17-REQ-015 does for names). No notification, in any state, ever carries a tradition label ("Hindu day"). Identifiers are opaque. A device walk (J-CUL-01) checks the lock screen, Notification Center, Apple Watch mirror and a Focus summary | NS-47-R11; NS-32-R12, R13; NS-13; D-S06, D-S10 (new class `libraryDay`); J-N24; new row needed | P0 (a): the lock screen promise (NS-32-R12) | mobile; content | `prefs.ts` header (names off by default; app lock forces names off); NS-32 line 37 (every body a content key, every category sets a placeholder). Whether Apple's notification summaries or a watch show a hidden body: UNVERIFIED, device walk |
| FR-CUL-13 | Given the Days we mark list and the Home strip, When shown, Then they show only to the person using the unlocked phone; the app-switcher snapshot is blank (errata E18); the Home strip reads the day's neutral label (the day's name) only when the day is today, and never lists upcoming days or a count of ticked days | NS-47-R12; NS-23; errata E18; A-S01; (proposed) C-S24 | P1 | mobile; design-systems | Errata E18 (one rule for the app switcher snapshot) |
| FR-CUL-14 | Given 4.5.4 ("should not be used to send sensitive personal or confidential information"), Then a library-day note is treated as if the rule applied even though it is local, not push: neutral by default (FR-CUL-12), no tradition in any body | NS-32; compliance question C-7 | P1 (b) | privacy; legal | S2 4.5.4 read 20 Nov; compliance C-7 asks counsel whether 4.5.4 reaches local notifications, default "treat as applying" |

### 3.5 Second account, sign-out, Erase, Delete account

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-CUL-15 | Given account A signs out (book kept, D1), Then the store and its scheduled notes are cleared at that moment (as typed days are, NS-18 "Signed out: Removed at sign-out"), the `culture.asked` flag stays keyed to A's account id, and B, signing in on the same phone, reads nothing of A's store, is never told it existed, and is asked afresh on B's own rules. The `[X4-R1]` test enumerates the registry, so this store is covered by FR-PRV-14 once registered | NS-47-R13; FR-PRV-14; BL-961; C-S03; J-C05 | P0 (a): the D1 ruling and NS-10 door line | mobile | `privacy.md` FR-PRV-14; the alternative (kept per account across sign-out) is CUL-Q3. I chose clearing because a phone handed on after sign-out should not reveal a faith, and because it makes FR-CUL-17 work |
| FR-CUL-16 | Given Erase everything (C-S19), When it finishes, Then the store, its flag and every pending library-day notification are gone; the FR-PRV-34 scan covers the store's file; a kill mid-erase resumes and finishes (the erase mark already does this) | NS-47-R14; FR-PRV-34; C-S19; NS-36 | P0 (a) | mobile; qa | `erase-everything.ts` header: every row of every table "settings included" and our scheduled reminders; a new file store must be added to its list |
| FR-CUL-17 | Given Delete account, When the request is made on this phone, Then this phone clears the store at once; every other phone of the account clears it when its session ends (FR-CUL-15). C-S20 "What happens" gets one line (FR-PRV-18 pattern): "We keep nothing about the days you chose; it was only ever on your phones" (content writes the words). A phone that is offline for a while keeps it until its next launch, and the line does not claim otherwise | NS-47-R15; FR-PRV-18; C-S20; NS-45 (when written) | P1 (b): S2 5.1.1(v), "delete the entire account record, along with associated personal data" (as cited in `privacy.md` S3); we hold none on the server | mobile; content | `privacy.md` section 1.4 S3; none of this is on the server, so no server deletion path is needed |

### 3.6 When and how it is asked

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-CUL-18 | Given first run (E-S01 to E-S08), Then no field, card, picker or line about tradition, faith or country appears; the FR-PRV-24 field-inventory test stays unchanged and fails if one is added. Reason: first run is tested on strangers against a 90 second target, and a faith question from an app a person has not yet used is the riskiest place to ask it | NS-39; NS-47-R16; FR-PRV-24; E-S01 to E-S08 | P1 (b) | mobile; design-systems | Direction 3.3; S2 5.1.1(iii) "only collect and use data that is required to accomplish the relevant task" (not collected here, but a reviewer may read a first-run ask against it: UNVERIFIED) |
| FR-CUL-19 | Given a book with at least one kept letter, When the reminder ask (D-S04) has been answered or has reached its two-showing cap, and not in the sitting where the Keep gate or the reminder ask was shown, Then Home may show the ask card once, on a later open: one question, one primary "Choose days" and an equal-weight "Not now". "Not now" ends it: Home never shows it again and the same choices stay one tap away in Me, Days we mark. It is never shown to an account with `culture.asked = done` and never from a notification, an email or a banner. Nothing is preselected | NS-47-R17; NS-13 (ask cap, line 45); A-S13; D-S04; A-S01 (state `daysAsk`, proposed) | P1 | mobile; design-systems | Direction 3.3, Q-FD-2; S2 5.1.1(iv): do not "manipulate, trick, or force people to consent to unnecessary data access" (the card is not a consent to collection, but its pressure must meet the same bar) |
| FR-CUL-20 | Given the ask and the picker, Then: several traditions may be chosen (a household can be of more than one); the list is alphabetical with equal visual weight, never ordered by size or popularity; "Another tradition" lets the parent add their own day and date; there is no "Eastern" option (it names a region, not a tradition; Q-FD-1); a choice of country offers national days only, and a choice of tradition offers that tradition's days only. Neither ever suggests the other (India does not suggest Hindu days; Israel does not suggest Jewish days), and device locale, the storefront and time zone never prefill either | NS-47-R18; FR-DAY rows; direction 3.2, 3.4 | P1 | content; mobile; user-research | Section 6 (stereotyping); device locale is L3 in the classification and inferring origin from it is the profiling 5.1.2(iii) warns about |
| FR-CUL-21 | Given any day offered, Then the parent ticks it; nothing is pre-ticked; a day the parent ticks can be unticked in one tap in Me, Days we mark; and "Clear all" (with one confirm) removes every tick and cancels every pending note immediately. This is the "easily accessible way to withdraw" (5.1.1(ii)) applied by analogy, though nothing is collected | NS-47-R19; (proposed) C-S24 | P0 (b) by analogy: S2 5.1.1(ii) | mobile | S2 5.1.1(ii): "an easily accessible and understandable way to withdraw consent" |

### 3.7 Words, claims, the label and the store

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-CUL-22 | Given the call-out at the point of choice, Then every sentence in it has a row in the claims inventory that is true of that build, and the call-out never promises more than the code does: "stays on this phone" only while FR-CUL-04 and 06 hold; "used only to suggest days" only while FR-CUL-11 holds; it never says the lock screen "never" shows it (the day's name can show behind the switch). Door lines are in section 8, item 9. `content` finishes the words under VOICE.md; drafts are in section 9 | NS-47-R20; PRIV-R17; PRIV-R21; claims inventory | P0 (a) | content; privacy | Direction 3.4 call-out draft; `privacy.md` FR-PRV-33 (claims rows) |
| FR-CUL-23 | Given a store candidate, Then `privacy` re-runs the label against the binary (FR-PRV-30): the label stays "not collected" for this data while FR-CUL-04 holds; the Sensitive Info row stays as it is for the due date; a G11 check (FR-PRV-29) fails on any new host or analytics property that references this store (the "derived data sent off device" trap in S1). The Privacy Policy gains one plain sentence (legal): an optional list of days, kept on the phone only, never sent to us. Notes for Review gain a section for the feature: what it does, that it is optional, where to find it (FR-CMP-03) | NS-47; FR-PRV-29, 30; FR-CMP-03, 05; FR-LEG-08; E-S27 | P0 (b): S1 "accurate and up to date" | privacy; legal; compliance-engineer | S1; label file 2.2.0 (read via `privacy.md`); whether App Review accepts the field is UNVERIFIED (section 10, CUL-Q8) |
| FR-CUL-24 | Given the library content, Then each day's name and one neutral line are written without ranking or commentary on any tradition, with the source and its uncertainty in the library data (DAY), and `legal` and `regulatory-affairs` read the set against 1.1.1 (no "discriminatory or mean-spirited content, including references or commentary about religion ... national/ethnic origin") before it ships | DAY file; NS-46; S2 1.1.1 | P1 (b) | content; legal; regulatory-affairs | S2 1.1.1 read 20 Nov |

### 3.8 Family, accessibility, testing

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-CUL-25 | Given two parents on one book (NS-25), Then each phone holds its own store; nothing on the family page (D-S18), the invite sheet or any shared surface shows, counts or hints at the other parent's days; days are never shared | NS-25; D-S13, D-S18; NS-18 ("Two parents: per phone; never shared") | P1 | mobile | NS-18 scenario table |
| FR-CUL-26 | Given the ask card, the picker and Me, Days we mark, at AX5 with Bold Text, VoiceOver, Voice Control and Switch Control, Then every control is reachable, the list reads as a flat list with no grouping that ranks traditions, "Not now" has a visible label and the same touch size as the primary, and nothing truncates. Added to the FR-CMP-07 walk | NS-33; FR-CMP-07; (proposed) C-S24, A-S01.daysAsk | P1 (b) | qa; design-systems | FR-CMP-07 pattern |
| FR-CUL-27 | Given the research on this feature, Then the tester sheet asks only reaction questions ("Did this question feel fine, odd, or too personal?" counts), never a tester's own religion or origin, never records one; any session using real people follows `user-research` consent rules; a result where more than one tester in five says "too personal" moves the ask from Home to Me only | NS-47; `user-research` | P2 | user-research | Constitution and CLAUDE.md (no real family data); the threshold is my proposal, `user-research` sets the real one |

## 4. Design needs

Keyed to e2e ids at `origin/docs/e2e-ux-20nov` (areas A, C, D inventories read). "New screen needed" means no id exists.

| Screen or flow | What design must add or change | For |
|---|---|---|
| A-S01 Home (state `daysAsk`, proposed) | One card, used once, in the slot where the Home slips already rise. Words: the question, "Choose days", "Not now". Equal weight for both buttons. No count, no badge. Gone after either answer | FR-CUL-19, 26 |
| A-S01 Home slip (day slip, NS-50) | A day we mark today shows its name; nothing for tomorrow; never a list | FR-CUL-13 |
| A-S13 After Keep | No change: the ask never rises here; keep the Keep gate and reminder ask as the only hand-offs | FR-CUL-19 |
| New screen needed: Me, Days we mark (proposed C-S24) | Row in C-S01 under Reminders or Family; list of ticked days with untick; "Browse by tradition" and "Browse by country" as two flat alphabetical lists; "Another tradition" add; "Clear all"; one line: "Not in Save a copy"; the call-out at the top; states: empty, some, browse, clear-confirm, offline (no network is needed), AX5 | FR-CUL-02, 10, 20, 21, 22 |
| D-S06 Me, Reminders | One switch "Show the day's name in the note" under the names switch, default off, shown disabled with a reason while App lock is on (the built `.appLock` state pattern) | FR-CUL-12 |
| D-S10 Lock screen | New class `libraryDay`: one neutral body for every layer; placeholder for hidden previews; a drawn state for the switch on (day name only) | FR-CUL-12 |
| D-S11 Notification landing | New state `.libraryDay`: opens Home with a generic prompt; no route parameter holds the day | FR-CUL-05 |
| D-S08 / D-S09 Add a day | No change (typed days stay one-off). Make the difference between "a day you type" and "a day we mark" visible by placing the two in different sections | FR-CUL-02 |
| C-S03 Sign-out sheet | One line: "Days you chose on this phone are cleared" (content writes it); fits the D1 lines | FR-CUL-15 |
| C-S19 Erase everything | No new body; the "everything" list includes the days list (the scan proves it) | FR-CUL-16 |
| C-S20 Delete account | The FR-CUL-17 line in "What happens" | FR-CUL-17 |
| C-S04 Save a copy | No change to the file; the one line lives on C-S24 | FR-CUL-10 |
| E-S01 to E-S08 | No change; a design check that none gains a tradition or country field | FR-CUL-18 |
| E-S27 App Store page | Screenshots only from the Asha book; a screenshot of Days we mark uses a synthetic tradition or seasonal days only, never a real tradition on a fictional family | FR-CUL-08, 23 |

## 5. Card changes I propose (for Karma to rule)

| Card row | Change | Why |
|---|---|---|
| NS-18 section 3 "Not in scope" and the direction 3.1 sentence "A chosen day becomes a typed day" | Either (a) keep typed days one-off and per phone, and have NS-47 own a separate yearly store that feeds the same planner slot, or (b) change NS-18 to allow suggested and recurring days. I recommend (a). The direction's sentence should read "a chosen day uses the typed day's planner slot and lock-screen rules" | NS-18 forbids recurring and suggested days; its deletion rule (the day after delivery) would delete a yearly day |
| NS-32 section 3 classes; direction Q-FD-6 | If `occasion` is reopened, name the class `libraryDay`, give it the top priority the direction asks for, one neutral body for every layer, and inherit R12 and R13 | FR-CUL-12 |
| NS-13 settings table and `prefs.ts` | Add the separate day-name switch beside `notifications.lockScreenNames`; document that app lock forces both off | FR-CUL-12 |
| NS-36 and the Erase rows | Add the store to the erase scan and the registry | FR-CUL-16, FR-PRV-07, 34 |
| NS-11 section 3 | One line: "Not included: the list of days you mark (phone only)" | FR-CUL-10 |
| NS-45 (when written) | Carries FR-CUL-15 (sign-out clears) and FR-CUL-17 (Delete account line) | Section 2 |
| `DATA_CLASSIFICATION.md` section 4.5 (device) and `data-policy.md` section 4 | New device row: L4, per account, excluded from backup, cleared at sign-out and Erase, never exported or synced | FR-CUL-01 (privacy owns; schema is not touched) |
| Frame section 7 "Inventory home" | Add this store as a row the inventory owes before NS-47 locks | Same as FR-PRV-24's request |
| `privacy-policy.md`, `in-app-disclosures.md` | One sentence on the optional list of days; wording to `legal` | FR-CUL-23 |
| NS-47 (new) | Section 8 outline | Direction section 8 item 3 |

## 6. Discrimination and stereotyping risk

These are product risks, not legal claims. `legal` reads them against 1.1.1 (S2); counsel must confirm anything that touches a protected class.

| Risk | How it shows up | What the requirements do |
|---|---|---|
| Assuming a faith from a place, or a place from a faith | "You chose India, here is Diwali"; "You chose Hindu, here is a country" | FR-CUL-20: separate lists, no cross-suggestion, no prefill from locale or storefront |
| One day per tradition, one tradition per family | A parent who is secular, interfaith, or of a tradition not on the list sees a wrong or empty answer | Several traditions allowed; "Another tradition" with the parent's own date; nothing assumed from silence |
| A ranking that reads as importance | A list ordered by population ("largest religions", direction 3.2) looks like a hierarchy | Alphabetical, equal weight; size is only a content-agent method to choose which to include, never shown |
| Dates that look authoritative | Moon-sighting days differ by place; Orthodox and Western Easter differ | The picker says "around" and lets the parent move the date (DAY owns the table and its uncertainty) |
| "Eastern" and other region words | A region is not a tradition; the label may read as othering | No such option (Q-FD-1); wording uses "tradition" and "where your family is from", never "native", never "foreign" |
| Outing | A notification, a Home strip or a shared phone shows a faith to a partner, relative, colleague or stranger. For some people this is a safety matter | FR-CUL-12, 13, 15: neutral body, separate switch, App lock forces off, sign-out clears, blank app-switcher snapshot |
| Attaching faith to a child | "Your child's festival"; a child's record carrying a tradition | FR-CUL-03: nothing on the child; words speak of the family, never of the child |
| Remembered pressure | A card that comes back, or a "most families choose" line | FR-CUL-19: once; "Not now" is final for Home; no social proof |
| Civic days that hurt | Mother's Day or Memorial Day for a bereaved or non-traditional family | Never pre-ticked (Q-FD-3); wording and loss-language ruling are R-FD-3 and the days-library file's, not this file's |

## 7. Engineering needs (backlog rows to add or change)

All are "new row needed" (Karma allocates ids; BL-1000 and above are invisible to the dispatcher, BL-999 note).

| Row | Add or change | For |
|---|---|---|
| New (mobile) | The days module with its single store, excluded from backup, per-account scope, sign-out and Erase hooks; registry entry | FR-CUL-01, 02, 06, 15, 16 |
| New (mobile, qa) | Import-boundary test (one reader); route-registry and error-message scans gain the FR-CUL-04 name list | FR-CUL-11; FR-PRV-11, 13 |
| New (data-architect) | Migration lint: no column, view or RPC argument named like tradition, religion, faith, country, origin or culture; no `prompt_key` value from a day | FR-CUL-04, 05 |
| New (mobile) | Planner: a `libraryDay` slot with one neutral body; no day key in an identifier or `userInfo`; the day-name switch and its app-lock rule | FR-CUL-12 (read `lib/reminders/planner.ts`, `scheduler.ts` first; I did not) |
| New (qa, platform) | Canary: synthetic tradition and day keys through every path; export, log, URL, crash and notification scans; network-fake over the claim step | FR-CUL-04, 07, 08, 10 |
| New (analytics) | Allowlist negative test for the FR-CUL-04 names and for any count of these choices | FR-CUL-09 |
| New (mobile) | Home `daysAsk` card state and its show rules; Me, Days we mark | FR-CUL-19, 21 |
| BL-961 | Gains this store in its `[X4-R1]` enumeration | FR-CUL-15 |
| BL-975 | Gains the "derived off-device" check (FR-PRV-29(d) pattern) for this store | FR-CUL-23 |
| New (device walk) | J-CUL-01: lock screen, Notification Center, Apple Watch mirror, Focus summary, Show Previews set to Never, App lock on and off, names switch on and off | FR-CUL-12 |

## 8. Proposed card NS-47: Days we mark, the family background choice (outline for Karma)

Number and title are proposals (direction section 8: NS-46 days library, NS-47 cultural background, NS-48 catalogue). Sections follow the card format; those that restate the library are left to NS-46.

1. Who and when: a parent after their first letters who would like a note on days that matter to their family.
2. Why: job "tell me what to write about", made personal by the parent's choice, at no cost to trust.
3. What, and Not in scope. What: the ask card, Me > Days we mark, a store of ticked days, one neutral note per day. Not in scope: any server copy, any sync, any use outside suggesting days, an "Eastern" option, country from the device, a field in first run, any tradition on the child.
4. Happy path: first kept letter; later open, the card; "Choose days"; pick a tradition (a filter); tick Diwali, Mother's Day; close. On the day: neutral note; tap; a generic prompt; speak.
5. Unhappy paths: "Not now"; sign-out; Erase; Delete account; new phone; App lock on; Show Previews Never; the parent moves a date; an app update adds days (never pushed, appears only when Me is opened); offline.
6. Scenario coverage: the standard table (two books, two parents, second account, Plan lapsed, AX5, Reduce Motion, multilingual: the list reads in any language, RTL).
7. Acceptance rows `NS-47-R1` to `R20` as in section 3 (each FR above names its row).
8. Data (section 10 of cards): one registry row: class L4, device only, per account, excluded from backup, cleared at sign-out and Erase, not exported, never logged; and the `culture.asked` flag as L2, per account.
9. Door lines (PRIV-R21 form; no consent row is written, so "Records" says so):
   - Shown: "Only on this phone. Used for one thing: suggesting days to mark. Change or clear any time." (draft, section 9) before the first tick.
   - Records: nothing on our servers. On the phone, the days the parent ticks and the `asked` flag. No `record_policy_act` row.
   - Never: a pre-ticked day; a second ask after "Not now"; a tradition or country on the child; a tradition or country in analytics, logs, crash reports, URLs, notifications, the Save a copy file, a backup, support mail or an email; an inference of one from the other or from the device.
   - Decline: "Not now" is a full answer of equal weight; the app is unchanged; Days we mark stays one tap away in Me.
10. Legal inputs: S1 to S4; counsel questions CUL-Q6, Q7, Q8.
11. Label effect: none while FR-CUL-04 holds; Privacy Policy sentence; Notes for Review section.
12. Gates: G5 label check; FR-CUL-04, 05, 08, 10, 11, 12, 15, 16 green on the candidate; the device walk J-CUL-01; counsel's answers to CUL-Q6 and CUL-Q7 cited in the gate record if the founder wants the fields stored (CUL-Q2), because then the data is stored as fields rather than as a list of ticks.
13. Claims: only the call-out sentences with claims rows.

Tests (titles): `[NS-47-R3] no request carries a day key`; `[NS-47-R4] a letter from a day note has the same synced columns as any other`; `[NS-47-R5] the store is excluded from the iPhone backup`; `[NS-47-R9] the export holds none of it`; `[NS-47-R10] one reader`; `[NS-47-R11] one neutral body for every layer`; `[NS-47-R13] sign-out clears and B sees nothing`; `[NS-47-R14] erase scan finds nothing`; `[NS-47-R16] first run has no such field`.

## 9. Call-out and ask wording (drafts for `content`; checked only against the CLAUDE.md content rules, not VOICE.md)

No em dashes, no emoji, never implies AI writes, `{child}` never gendered, no loss or guilt language. `content` and the founder choose.

| Where | Draft |
|---|---|
| Ask card question | "Would you like a note on days that matter to your family?" (the direction's own words) |
| Ask card buttons | "Choose days" and "Not now" |
| Call-out (storage as FR-CUL-06 default) | "Stays on this phone. Only used to suggest days to mark. Change or clear any time in Me." |
| Call-out (if the settings table is kept) | "On this phone, and in your own iPhone backup if you use one. Only used to suggest days to mark. Change or clear any time in Me." |
| Country picker header | "A country that matters to your family" (not "native country"; "where you live" is never asked) |
| Tradition picker header | "A tradition your family keeps" with the entries "Another tradition" and "Not now" |
| Lock-screen body (all layers) | "Something for the book today" (the direction's own words; NTC owns the final) |
| Switch | "Show the day's name in the note" with the line "Anyone who sees your lock screen can read it." |
| Save a copy line (on C-S24) | "These days are not part of Save a copy." |
| Sign-out line | "Days you chose on this phone are cleared." |

## 10. Founder and counsel questions

Each has a recommended default that holds until answered. Counsel numbers are packet 1.5.0; new ones "need a number from legal".

| # | Question | Who | Recommended default | Counsel number |
|---|---|---|---|---|
| CUL-Q1 | What does "East East" mean (Q-FD-1)? | Founder | There is no such option. "Another tradition" and "Not now" cover it; "Prefer not to say" is the same as "Not now" | none |
| CUL-Q2 | Keep a tradition and a country as stored fields (the founder's ask) or only the days the parent ticks (my recommendation)? | Founder | Only the ticked days. The field adds nothing the list does not hold, and is one more sensitive value to protect. If the founder wants fields, each gets a registry row and a Clear control, and counsel's answers CUL-Q6 and Q7 gate the flag | none |
| CUL-Q3 | At sign-out, clear the store (default) or keep it per account? | Founder | Clear. Matches reminders and typed days; no cross-account risk; makes Delete account reach every phone | none |
| CUL-Q4 | Exclude the store from the iPhone backup (default), or keep it in `scribe.db` and widen the call-out? | Founder, privacy | Exclude; the short truthful call-out | none |
| CUL-Q5 | Is the list left out of Save a copy (default)? | Founder, counsel | Yes, left out; one line says so | needs a number from legal (near Q55, access) |
| CUL-Q6 | Does GDPR Article 9, or a US state sensitive-data rule, reach religion or origin data that is stored only on the user's own phone and never received by us? Is an app maker a controller for it? Does a US-only storefront (compliance.md line 161) change the answer? | Counsel | Design as if it did: explicit, optional, withdrawable, never received; counsel confirms. S3 Art 9(1), 9(2)(a) and S4 are the only texts read | needs a number from legal |
| CUL-Q7 | Do we leave the privacy label's answer as "not collected" for this data, relying on the on-device rule (S1), and do we add the Privacy Policy sentence? | Counsel, legal | Yes to both; the label is re-run per build (FR-CUL-23) | Q57(f)-adjacent: needs a number from legal |
| CUL-Q8 | Would App Review read an optional faith or origin question as breaching 5.1.1(iii), data minimisation? | Founder (Notes for Review) | Describe the field in the Notes (FR-CMP-03). If a reviewer objects, the fallback is to remove the ask card and keep a plain list of days to browse and tick in Me, with no question about the family at all: the same data, no question. UNVERIFIED | none |
| CUL-Q9 | Separate switch for the day's name in a note, default off, forced off by App lock? | Founder | Yes. The direction says the faith is named "only when the parent has switched on names in notifications"; a separate switch avoids exposing a faith just because the child's name was switched on | none |
| CUL-Q10 | Ask after the first kept letter in a later sitting (default), after the first letter in the same sitting, in first run, or only in Me? | Founder (Q-FD-2) | Later sitting; fall back to Me only if more than one tester in five calls the question too personal (FR-CUL-27) | none |
| CUL-Q11 | Is a note that names a faith day "sensitive personal information" for the purposes of 4.5.4 even though it is local? | Counsel | Treat as yes; neutral by default (FR-CUL-14) | Q41 (compliance C-7) |
| CUL-Q12 | The yearly store versus NS-18's "no recurring days": rule (a) separate store, or (b) change NS-18 (section 5)? | Karma | (a) | none |

## 11. Sources read this session (20 Nov 2026)

| # | Source | What I rely on |
|---|---|---|
| S1 | Apple, App privacy details, https://developer.apple.com/app-store/app-privacy-details/ | "Collect" means transmitting data off the device so you or partners can access it longer than needed to serve the request in real time; "Data that is processed only on device is not 'collected' and does not need to be disclosed ... If you derive anything from that data and send it off device, the resulting data should be considered separately"; the Sensitive Info row lists "racial or ethnic data ... religious or philosophical beliefs"; national origin is not listed; the page does not mention a user's own iCloud; "You're responsible for keeping your responses accurate and up to date" |
| S2 | Apple, App Review Guidelines, https://developer.apple.com/app-store/review/guidelines/ (no last-updated date shown; I read the first 100,000 of 121,052 characters) | 5.1.1(i), (ii) withdrawal, (iii) data minimisation, (iv) do not manipulate or force; 5.1.2(i) to (iii) (no repurposing without consent; no surreptitious profile); 1.1.1 (discriminatory content, religion, national or ethnic origin); 4.5.4 (push not for sensitive personal information). I did not read 5.1.1(v) and 5.1.3 on this fetch; the 5.1.1(v) text is cited from `privacy.md` S3, read earlier on 20 Nov |
| S3 | GDPR, Article 9 (adopted text), https://www.legislation.gov.uk/eur/2016/679/article/9/adopted?view=plain | 9(1): processing "revealing racial or ethnic origin, political opinions, religious or philosophical beliefs" is prohibited; 9(2)(a): "explicit consent ... for one or more specified purposes"; 9(2)(e): data "manifestly made public by the data subject". This is the UK legislation site's copy of the original EU text, not a current-law statement for any country |
| S4 | Akin Gump, California expands the definition of sensitive personal information, https://www.akingump.com/en/insights/blogs/ag-data-dive/california-expands-definition-of-sensitive-personal-information-covered-under-ccpa (secondary, page dated 13 Oct 2023) | The CCPA sensitive list names "racial or ethnic origin, religious or philosophical beliefs" and, since AB 947, citizenship and immigration status. I did not read the statute (the cppa.ca.gov PDF failed to load) or any exception for data not collected to infer characteristics |
| Blocked | https://gdpr-info.eu/art-9-gdpr/ | Not read (permission unanswered); not retried |

Everything else outside the repo is UNVERIFIED in this file: other US state acts; EU guidance on device-only processing; how App Review treats optional personalisation questions; whether Apple's notification summaries or watch mirroring show a hidden body.

## 12. Hand-offs

- To `legal`: Privacy Policy sentence, in-app disclosure line, the 1.1.1 read of library content, counsel questions CUL-Q5 to Q7 and Q11 (numbers).
- To `regulatory-affairs`: CUL-Q8 and the Notes for Review section; the 5.1.1(iii) reading.
- To `data-architect`: the migration lint (FR-CUL-04, 05); no schema change otherwise.
- To `analytics`: FR-CUL-09 allowlist negative test.
- To `content`: the words in section 9; the neutral lock-screen body with NTC.
- To `design-systems`: section 4 (new C-S24, the A-S01 card, the D-S06 switch).
- To `mobile`: section 7.

Chief Privacy Officer (Claude role, not counsel), as the `privacy` agent

---

## Addendum 20 Nov 2026: photo moments and pictures and videos

Source: `../26-founder-direction-photos-library-and-media.md` (no face recognition or person matching; analysis on the phone only; no content classification by default, Q-PM-5 and Q-PM-6). Cards NS-51 Photo moments and NS-52 Pictures and videos with a letter (by name; `../27-photo-moments-and-media.md` absent when written). Biometric laws (for example Illinois and Texas) are not read: UNVERIFIED, and no feature here needs them because faces are not matched. Counsel must confirm every legal reading.

### New requirements

| Id | Requirement | Links | Priority | Owner | Source |
|---|---|---|---|---|---|
| FR-CUL-28 | Given photo moments and any analysis of pictures, videos or library metadata, Then cultural data is never an input: no tradition, country, ticked day, or browse choice is read by the moments module, and no picture, album name, place, caption, language or date from the library is written to or compared with the culture store; no signal about belief, origin, ethnicity, dress, food, place of worship or language is derived from any picture or video, by any method | FR-CUL-02, 11; NS-51; `../26-founder-direction-photos-library-and-media.md` s1 | P0 (a)(b) promise and sensitive-data risk | mobile, privacy | FR-CUL-11 |
| FR-CUL-29 | Given the module boundary of FR-CUL-11, Then the import test also fails if the moments module imports the days module or store, and fails if the days module imports a library, picker or media package; one test, both directions | FR-CUL-11; FR-DAY-32; NS-51 | P0 (a) | mobile, qa | FR-CUL-11 |
| FR-CUL-30 | Given place names in moment suggestions (Q-PM-5), Then the default stays off; if the founder turns them on, a place name is class L4 and a place of worship, a cultural centre or a place whose name implies a faith or origin is never shown; the card must say how that is known without classifying images (it needs a place-category read the founder has not approved; so default: place names stay off) | NS-51; FR-CUL-01 | P0 (a)(b) | privacy, product | Q-PM-5 |
| FR-CUL-31 | Given a cluster on or near a day a tradition keeps, Then the cluster looks and reads exactly like any other: no label, ordering, emphasis or invitation differs by date, and no tradition names a cluster | FR-DAY-29; FR-CUL-20 | P0 (a) | mobile, content | FR-DAY-29 |
| FR-CUL-32 | Given the ask card (FR-CUL-19), the reminder ask and a Photos permission ask, Then the Photos ask is never in the same sitting as the Days ask, the reminder ask or the Keep gate, and it is asked from the capture area when the parent opens the moments view, not as a Home card; the library permission copy mentions no tradition, family background or day | FR-CUL-19; NS-51; NS-13 | P1 (a) | product, design-systems | FR-CUL-19 |
| FR-CUL-33 | Given sign-out, Erase everything and Delete account, Then the on-phone moment index and the culture store are cleared by the same path, and neither survives in the other's file (FR-CUL-15 to 17 extended) | FR-CUL-15, 16, 17; NS-36 | P0 (a) | mobile, qa | FR-CUL-15 |
| FR-CUL-34 | Given the log canary (FR-CUL-08), Then it runs with synthetic album names and place names that contain tradition words ("Diwali party", "Eid") through the moments paths, and none appears in any log, URL, notification, analytics or crash report | FR-CUL-08; FR-PRV-10 | P0 (a)(b) | qa, mobile | FR-CUL-08 |
| FR-CUL-35 | Given a test library (Asha, fictional), Then it holds 40 pictures dated on Christmas Day, an Eid, a Diwali, a Lunar New Year and a Thanksgiving, and the tests assert: no day suggested, no culture-store write, no label from the dates, no change to which days Browse shows first; no real family media in any fixture | FR-DAY-29, 32; `CLAUDE.md` privacy rules | P0 (a)(b) | qa | FR-CUL-27 |
| FR-CUL-36 | Given research on moments, Then the tester sheet never asks a tester about the religion, origin or traditions their pictures show, never records one, and uses reaction questions only (extends FR-CUL-27) | FR-CUL-27 | P1 | user-research | FR-CUL-27 |

### Changes to existing rows
None superseded. FR-CUL-11 and FR-CUL-27 are extended by FR-CUL-29 and FR-CUL-36.

### Links
NS-47, NS-51, NS-52, NS-36; FR-CUL-01, 02, 08, 11, 15 to 17, 19, 20, 27; FR-DAY-29, 32.

### Design needs
- Permission explainer for the library (new screen needed) with no cultural wording; checked by this lens before design signs off.
- Moments view: clusters labelled by date only, one visual treatment for every date.

### Engineering needs (new rows needed)
- The two-way import-boundary test; the canary additions; the synthetic Asha library fixture; extend the migration lint (FR-CUL-04) so no setting key for the moment index matches tradition, religion, country or culture words.

### Questions (default, who)
| Id | Question | Default | Who |
|---|---|---|---|
| CUL-Q13 | Place names in suggestions (Q-PM-5) | Off | Founder |
| CUL-Q14 | Does the moment index (dates, counts, clusters) itself count as sensitive data in a family context, and does a date cluster plus the ticked days list amount to inference? | Keep both on the phone, never joined in storage; counsel must confirm | Counsel (needs a number from legal) |
| CUL-Q15 | Any on-device image analysis beyond metadata (Q-PM-6) | No; and never for belief or origin even if later allowed | Founder, counsel |

### Cannot assess yet
- Whether limited or full library access changes what dates the phone shows; not read.
- Whether biometric or children's data laws reach a metadata-only on-phone index; none read.
- Whether App Review reads Photos access plus a faith-days feature as too sensitive together; no Apple text read.
