# Nomenclature and IA audit, 31 Oct 2026 (v2, after the council)

Owner: Karma (CTO), via the platform session. Scope: every name a parent can see in the iOS app, the store listing, emails and the website, and how each maps to code, database, analytics and routes. Read on `develop` at e7b53193 and the website on `main` at 29fbe19d. The IA map is in [IA.md](IA.md).

v1 went to the full executive council (CMO, CDesO, CPO, CLO, CCO, CPrivO, CDO, CBO, CFO, CAIO, CISO) as seven independent reviews. All seven said ship with amendments. This version takes them in; section 7 says what changed and what I rejected.

## How this sits with the rest of the record

- The product vocabulary has one home: the glossary in `packages/content/BRAND.md`. CR-22 (PR #420, open) adds the internal-term door. This audit adds no second glossary. It checks the app against that one and proposes the rows it is missing (section 4).
- `docs/GLOSSARY.md` is cited by CODE-R07 and DB-R05 but was never written. After #420 merges, both rules point at BRAND.md (FP-6).
- Promise words stay founder and counsel territory. D-125 item 9 already holds "exactly as you said it" out of the store listing until counsel clears it at T30. Whether the same hold covers the website and the name "Word for word" is the second founder question in section 6.
- Another session is carrying the store listing and some of the copy this audit touches: branch `fix/comms-validation-2026-10-31` (no PR yet) rewrites `store.en.ts`, `app-store.md`, `billing.en.ts`, `strings.en.ts`, BRAND.md and both sets of terms. FP-1 and FP-2 rebase on it rather than race it (section 5).

## 1. What is solid

Read together, Recently deleted, Not much today, "From {signsAs}", Month {n} (no "chapter" visible), Before You, The first weeks, Early version (no "beta"), small fix, the red circle, Plus as the only product name, and the codename `scribe` kept out of every visible string except one recovery file that has to keep it (NA-34). Read together is the strongest name we have and reads the same in the app, the store and screenshot 5. The store build is meant to show two single-word tabs, Tonight and Book. On `develop` today it still shows Family as a third, "coming soon" tab until the D-126 change lands (IA.md).

## 2. Findings, worst first

Severity: High = a parent would read it wrongly, or a public line claims something the build does not do. Evidence is file:line on `develop` unless marked `main:`. NA-25 onward came from the council.

| ID | Sev | Finding | Evidence |
|---|---|---|---|
| NA-01 | High | The Settings switch is labelled with the feature name and reads backwards. "Word for word" ON gives "Small fixes, marked"; OFF gives "Exactly as said". It also sits under Your data > Recordings, though it only sets the view a new spoken letter opens in at Review. | `packages/content/src/strings.en.ts:725-728`; `apps/mobile/src/app/settings/recordings.tsx:93-95`; `apps/mobile/src/app/review.tsx:227` |
| NA-02 | High | The store source describes the full-scope product, not the first store build: notes ("NOTES AND LETTERS"), the co-parent, seven languages and their keywords, "the people you invite", "Private to your family" (screenshot 6), and "kept exactly as you said it". D-121 and guideline 2.3.1(a) say listing copy matches the build. Fix in flight on `fix/comms-validation-2026-10-31`. | `packages/content/src/store.en.ts:24,28,35,36,41,50-51,53-56,60,87`; `docs/store/app-store-staged-1.0-proposal.md:45-46` |
| NA-03 | High | The live website says more than the first store build does and uses banned forms: "A baby book you fill by talking" (glossary: "the baby memory book"), the sign-off "The Early Letters team" (glossary: "Warmly," then the name), "only the people you invite" (no invite in 1.0), a Family tab (D-126), "You and Mama add to the same book", "{name}'s Book" with a capital B where the app says "{child}'s book", seven languages, and "keeps every word exactly as you said it". Its price block lacks "renews automatically until you cancel". | `main:apps/web/src/content/site.ts:60,72,73,83,126,142,160-165,181,200,212-223,284,287,289,292` |
| NA-04 | Medium | Two website copy sources. `packages/content/src/site.en.ts` and `pages.en.ts` say `apps/web` renders them, but nothing on `main` imports them. `main` has its own copy-rules test over `site.ts`; that test requires seven languages and checks no glossary row. | `pages.en.ts:1-2`; `main:apps/web/test/copy-rules.test.ts:257-260` |
| NA-05 | Medium | Plan names drift. The Plan screen shows "Monthly" and "Yearly"; the confirmation, reminders, StoreKit file and App Store Connect say "Plus Monthly" and "Plus Annual" (D-077). The website cards say "Monthly" and "Yearly". | `apps/mobile/src/components/settings/plan.logic.ts:35-43`; `features/billing.en.ts:98-100,164-165`; `main:apps/web/src/content/site.ts:222-223` |
| NA-06 | Low | The Settings row and page are titled "Plan"; the product is "Plus". Not a defect: "Settings, Plan" is the cancel and refund path in the Terms, the Subscription Terms, D-094 and the billing emails. | `strings.en.ts:700-704,1138-1139`; `docs/legal/terms-of-service.md:245,251,254`; `docs/legal/subscription-terms.md:47,54,72` |
| NA-07 | Medium | "note" names things the app sends, which the glossary bans: "A note about Plus", "A yearly note", "Saves a note on this phone". The Terms promise reminders "as a note in the app", so the two plan lines match legal text. The export readme says "Every letter and note". | `features/billing.en.ts:141,146`; `features/family.en.ts:182-184`; `features/export.en.ts:13,82` |
| NA-08 | Medium | "member" and "family member" appear in parent-facing copy and the Terms, against the glossary. Two of the lines are counsel-held (backup, account deletion); one is never rendered. No test bans the word. | `strings.en.ts:797` (unused); `features/account-deletion.en.ts:26`; `features/backup.en.ts:26`; `docs/legal/terms-of-service.md:139,157,159` |
| NA-09 | Medium | The verb rule in the spec contradicts the product. F06-REQ-043 says actions say "Save"; F06 6.2 and F14 say "Save to {child}'s book" and "taps Save". D-083 has the parent tap Keep, and D-109 says "keeps it on Write". | `docs/prd/v2/features/F06-faithful-edit.md:317`; `F14-plus.md:165` |
| NA-10 | Medium | One action, three labels: "Add to {child}'s book", "Add to the book", and "Add to book" on the letter page menu. | `strings.en.ts:408-417,513-514` |
| NA-11 | Medium | "transcription" is visible in a Settings section title ("How transcription works"), and that section mixes the mishearing warning (the speech step) with the small-fix setting (the edit step). | `strings.en.ts:822`; `app/settings/recordings.tsx:70` |
| NA-12 | Medium | "Settings" means two things: "Turn it on in Settings" points at the iPhone Settings app, inside an app with its own Settings. | `strings.en.ts:972-973`; `features/reminders.en.ts:58-60`; `features/language.en.ts:30` |
| NA-13 | Medium | The child is called four things when no name is shown: "your child", "your little one", "your baby", and the name. | `features/reminders.en.ts:16-20,56`; `strings.en.ts:1191`; `features/family.en.ts:190` |
| NA-14 | Low | Code spells co-parent three ways: `coparent` (email ids, analytics event), `co_parent` (push kind), `other_parent` (a relation, which is fine). Analytics says `kept_aside` where core and the database say `set_aside`. | `packages/analytics/src/catalog.ts:40,355,669`; `packages/api/src/server/push.ts:15`; `packages/core/src/domain.ts:41` |
| NA-15 | Low | Analytics route names miss screens that exist. Analytics are off for the 1.0 line (D-124), so fixing this now costs nothing. | `packages/analytics/src/catalog.ts:139-169` |
| NA-16 | Low | `read_together_started.access: plus or free` still models Read together as gated, which D-082 removed. | `catalog.ts:607`; `read-together.tsx:73` |
| NA-17 | Low | The store subtitle "Baby journal in your own voice" uses "journal", which the glossary bans outside keywords. It is deliberate (search words the name lacks), but no exception is recorded. | `packages/brand/index.ts:81-82`; BRAND.md glossary row at line 86 |
| NA-18 | Medium | Docs describe a product the first build is not. DESIGN_LANGUAGE section 12 uses dropped names ("Another prompt", "Done", "Save letter", "Invite someone"), promises "Only people you invite can read or hear these" and "Add a photo", uses ellipses, and doesn't mark Family as build 2; section 13 has a stale end-to-end line (D-102). BRAND.md says the book is shared at v1.0 (line 38) and seven languages at v1.0 (line 26). `capabilities.ts:3` says server features are on in v1.0. | `docs/design/DESIGN_LANGUAGE.md:233-281`; `packages/content/BRAND.md:26,38`; `apps/mobile/src/lib/capabilities.ts:3`; `apps/mobile/eas.json:63,79` |
| NA-19 | Low | Dead copy carries names and claims that differ from live ones and could leak back: "Save" (Write), "Sign my letters as", "Names and words", "Quick note", "Notes" filter, "Keep this as said", "Invite co-parent", "We only fix what the microphone got wrong" (`neverRewrite`), `trust.signIn.privacy`, and section titles nothing renders ("Plus", "Privacy and space", "The book", "Your words", "Family"). | `strings.en.ts:178,202,229,400-441,496,692-700,717,719,722,797,839,1128-1129,1206` |
| NA-20 | Low | "page" means a day's place in the book (allowed, BRAND.md:45) and also a screen: "This page did not open". | `strings.en.ts:1004` |
| NA-21 | Medium | Keep and its opposite pull against each other. "Keep it here for now" is the gate's way out without keeping, which already breaks F14-REQ-028 ("Leave it waiting"). Confirm alerts offer "Keep it" or "Keep" as the safe choice in five places. | `features/billing.en.ts:56-58`; `strings.en.ts:278,773`; `features/speech.en.ts:24`; `features/packs.en.ts:51`; `features/family.en.ts:49` |
| NA-22 | Low | A reminder says "Say it out loud and we will keep it", which has the app doing the keeping. | `features/reminders.en.ts:15`; `strings.en.ts:620` |
| NA-23 | Low | PR #420's new glossary row points at "Settings > Languages and speech", which does not exist, and its row "entry: letter (long) or note (short)" says 1.0 makes notes. | #420 `packages/content/BRAND.md` |
| NA-24 | Low | The section "Your data" also held the small-fix setting. With R-A moving it to Writing, the section is right as it stands. | `apps/mobile/src/app/settings/index.tsx:106-113` |
| NA-25 | Medium | One download has four names: "Writing down your words", "Speech model", "Get your words ready", and "Language packs and speech models". The Storage intro says they download when you choose a language, which is false under D-087 (nothing downloads until "Download on Wi-Fi"), and it names the technology. The pack kind "Spelling and punctuation" also holds the filler and repeat tables. | `features/speech.en.ts:9`; `features/packs.en.ts:8,16` |
| NA-26 | Low | The row "Export your book" opens a page titled "Export". | `strings.en.ts:1142`; `app/settings/export.tsx:162` |
| NA-27 | Medium | Copy claims a fix the engine never makes. `site.en.ts:97` and `pages.en.ts:61` promise "we was to we were"; no rule emits `agreement`. BRAND.md:25 and VOICE.md:37 say "transcription only fixes microphone and grammar slips"; transcription fixes nothing, the engine removes sounds the parent made (D-086). Not rendered today (NA-04), but one wiring change would publish it. | `packages/content/src/site.en.ts:97`; `pages.en.ts:61`; `packages/core/src/model-edits.ts:34`; `packages/content/BRAND.md:25`; `VOICE.md:37` |
| NA-28 | Medium | The free allowance comes from remote config and can only go up, but the copy hard-codes "two" and "second". A raise to five (DR-21, T39) would show "That was your second free letter" with three left, and turn a config change into an app release. | `apps/mobile/src/lib/remote-config.ts:105-134`; `features/billing.en.ts:28,32,46,58`; `strings.en.ts:69,1140`; `store.en.ts:63,75`; `main:site.ts:209,215,237` |
| NA-29 | High before submission | The Subscription Terms on `develop` (1.4.0) still list $3.99 and $29.99 and the old Plus contents; the D-082 text exists only on `docs/legal-v1-server`, unmerged. The title "Early Letters Plus Subscription Terms" is a banned form. The disclosures register lists the old features. | `docs/legal/subscription-terms.md:2,13,21-33`; `docs/legal/in-app-disclosures.md:47` |
| NA-30 | Medium | The Terms promise reminders that give "the price after"; D-083 and D-094 keep prices out of app copy, and the reminder lines show none. | `terms-of-service.md:251`; `subscription-terms.md:54`; `features/billing.en.ts:136-142` |
| NA-31 | Medium | Two kinds of "family sharing" in one Settings: the consent switch "Sync and family sharing" sits near Apple's "Family Sharing" for Plus. A parent could withdraw one thinking of the other. | `strings.en.ts:709-710,846` |
| NA-32 | Medium | BRAND.md promises an "encrypted backup that only you can restore or play" and "a backup is for you alone". D-102 bans that claim, and backup is off in every build profile. | `packages/content/BRAND.md:32,104`; `apps/mobile/eas.json:17,35,50,64,80` |
| NA-33 | Medium | The export format id is derived from the brand name, which is not trademark-cleared. A rename would change the id and make older exports fail validation. | `apps/mobile/src/lib/export/schema.ts:50,210,410`; `packages/brand/index.ts` |
| NA-34 | Low | The codename is visible in one place: the recovery export writes `database/scribe.db` and its `-wal` and `-shm` files. It has to stay (SQLite matches the WAL by file name). No exception is recorded. | `apps/mobile/src/lib/resilience/recovery-export.logic.ts:33` |
| NA-35 | Low | `withdrawn` is accepted by the API's sync enum but not by core, the database check or DATA_CLASSIFICATION, and it collides with consent withdrawal (D-128). v1 called it a separate state; the line it cited is a comment. | `packages/api/src/server/sync.ts:84`; `supabase/migrations/20261003000000_security_and_family.sql:396` |
| NA-36 | Low | `children.hidden_at` is a book-level server column the other parent can read, but the product says hiding a book is only for you. Unused on the server today. | DATA_CLASSIFICATION `:186`; `supabase/migrations/20261015000000_*.sql:124`; `strings.en.ts:920-923` |
| NA-37 | Low | The founder's App Store Connect run sheet expects labels that build 2 will not show ("Leave it waiting", "Save"). | `docs/release/APP_STORE_CONNECT_SUBSCRIPTIONS.md:148,150` |

Not findings: `data/entries.json` in the export keeps its name (format contract, D-096, CR-22). The website uses the child's real first name on purpose (D-118); I don't reopen it.

## 3. Rulings

All T1, two-way, unless marked. In-app copy and UI work lands after the go/no-go (Mon 9 Nov, D-130): the freeze starts Tue 3 Nov and other branches touch `strings.en.ts`. Rulings by other executives are in `docs/agents/exec/RULINGS.md` (CPO-1, CDO-1, CPrivO-1, CLO-1, CCO-1) and are cited where they apply.

**R-A. Word for word moves to Writing and becomes a choice (NA-01, NA-11, NA-24).** The feature keeps its name (D-074, D-086). Settings > Writing gets a row "Word for word" showing its value. It opens a page with one checkmark list, "New spoken letters start", with "With small fixes" and "Exactly as said". Footer: "Small fixes are marked in each letter and can be put back. You can switch any letter while you read it back. Typed letters, and words that arrive after you keep a letter, are never fixed." The mishearing warning moves to the footer of "Writing down your words" as "We can mishear a word or a name, so read each letter and change anything we got wrong." The section title "How transcription works" goes. The setting key `review.defaultView` and its values `fixes` and `exact` do not change (CISO). Build 1's TestFlight notes ask testers one question about it, which feeds the revisit trigger. "Exactly as said" goes on counsel's T30 list with the headline (CLO); if counsel objects, the fallback label is "No fixes". Way back: restore the switch strings and the row. Revisit if a tester still misreads it.

**R-B. Keep commits a letter, and only that (NA-09, NA-10, NA-21, NA-22).** This is a UX call inside decided scope, and the CPO owns the requirement text (CPO-1 amends F06-REQ-043, F06 6.2, F14-plus.md:165 and the DX-08 note). Write already commits with "Add to {child}'s book" and "Keep private", so it needs no change; the unused "Save" at `strings.en.ts:229` is deleted. To make Keep mean one thing:
- The gate's way out says "Leave it waiting" (F06-REQ-043, F14-REQ-028).
- Every confirm alert's safe choice says "Cancel", as iOS does: the delete sheet, Listen discard, Remove language, Remove download, Cancel invite.
- Putting a letter in the book always reads "Add to {child}'s book" ("Add to the book" only with no name). "Keep private" in Review and "Make private" on a letter stay.
- Save stays for drafts saving themselves, files ("Save or share") and "Save words".
- The reminder "we will keep it" becomes "keep it for {child}".

**R-C. "Plan" stays the Settings title; the plans are "Plus Monthly" and "Plus Annual" (NA-05, NA-06).** "Settings, Plan" is the cancel path in the Terms and D-094, so renaming it would be counsel's business and buys nothing. The in-app period labels are registered disclosure text counsel is holding (`plan.logic.ts:26-33`, `in-app-disclosures.md:54`), so they switch after counsel through FP-7 and then FP-1. The website cards change in FP-3. "Membership" stays internal: it already means two things in code (the D-082 model, a co-parent's place in a book), and neither is renamed.

**R-D. Notes and the store listing (NA-02, NA-07).** Public copy describes the first store build only (D-121, guideline 2.3.1(a); D-125 item 4 supersedes issue #127). The store listing takes the whole staged proposal, not only the notes cut, plus three amendments: the notes block becomes "QUIET DAYS COUNT TOO" (or the comms branch's "A SENTENCE IS PLENTY", which says the same), screenshot 6 is "Private by default", and the rules test bans "exactly as you said it" in `storeListing` until counsel clears it (CCO-1). The comms branch already does all three. CPrivO-1 holds the co-parent and invite lines out of any submission until that lands. In the app, "A note about Plus" and "A yearly note" stay until the Terms change "as a note in the app"; the export readme says "Every letter, as text, private ones too". Whether notes are in v1.0 at all is founder question 1.

**R-E. "member" leaves parent-facing copy (NA-08).** The backup and account-deletion lines are counsel-held, so they move with counsel in FP-7, not with the v1.1 copy. The unused `strings.en.ts:797` is deleted. `rules.test.ts` bans "member" in copy. In the Terms, "a member's access" becomes "a person's access" until counsel picks one defined term (CLO-1).

**R-F. Small consistency fixes (NA-12, NA-13, NA-20, NA-26).** Buttons keep Apple's "Open Settings"; prose says "the Settings app". With no name shown, the child is "your child"; the crisis line keeps "you or your baby". "This page did not open" becomes "This screen did not open". The export page title matches its row, "Export your book".

**R-G. Analytics before they turn on (NA-14, NA-15, NA-16, NA-35).** The route list adds `recently_deleted`, `backup`, `licenses`, `plus_confirmed` and `invite_leave`. It never lists `settings/struggling` or `settings/children/hidden`: a view of either can signal a mental state or a loss, and a test pins both absences. Because the additions widen what `screen_view` could collect, they ride in the founder's analytics-on packet (D-095, D-124), not a separate question now. `read_together_started` drops `access` and `SCHEMA_VERSION` goes from 6 to 7. The analytics approval enum is built from core's `APPROVALS`, so `kept_aside` becomes `set_aside` and cannot drift again. `withdrawn` leaves the API enum after the API owner confirms nothing sends it (CDO-1). The `coparent` email ids and the `co_parent` push kind keep their names: they are contracts.

**R-H. Record the subtitle exception (NA-17).** The subtitle stays, and BRAND.md says "journal" is allowed in the store subtitle and keywords, for search only. The founder approves the subtitle with the whole listing, so it needs no separate question.

**R-I. Docs follow the code (NA-18, NA-19, NA-23, NA-27, NA-32, NA-04).**
- The design lane rewrites DESIGN_LANGUAGE sections 12 and 13 against the app, citing string keys rather than literals.
- BRAND.md lines 25, 26, 32, 38 and 104 and VOICE.md line 37 use D-086's own sentence and the D-102 backup wording, and say English only for the first store build.
- `capabilities.ts:3` is corrected.
- Unused strings in NA-19 are deleted, so they can't leak back.
- CODE-R07 and DB-R05 point at BRAND.md.
- #420 is corrected before it merges: the Settings path, "entry" means letter, and the rows in section 4.
- The website keeps `site.ts` as its single copy source. `site.en.ts` and `pages.en.ts` are deleted from `packages/content`; none of their routes exist on `main`, and with them goes the "we was" claim.

**R-J. One name for the speech download (NA-25).** Parent copy says "language", as #420 does; parents never see "speech model". The Storage intro becomes "Each language's speech files download only when you say yes. Removing one never touches your letters or recordings." The pack kind "Spelling and punctuation" becomes "Small fixes".

**R-K. The allowance is read, not written (NA-28).** In-app lines read the number from remote config and spell it as a word. F14 section 6.9 names the store, website and Terms lines as part of any raise, and DR-21 gets a note.

**R-L. Contracts are never renamed (NA-33, NA-34). T2.** `EXPORT_FORMAT` becomes the literal `early-letters-export`, so a brand rename can't break old exports (CR-26). It needs a test that fails on the old code and two reviews before merge. #420's `scribe` row lists every contract: the repo, packages, Supabase projects, bundle id, the URL scheme `scribe://`, the Expo slug and the database file `scribe.db`, including the recovery export. Any IA change that renames a route or setting key updates `isCaptureRoute` and `resilience.test.ts` in the same PR.

Routed, not ruled here: NA-29 (Subscription Terms 1.4.0) and NA-30 ("the price after") go to the legal lane and counsel Q8; merging legal text is the founder's (D-125), and both are already in the counsel flow. NA-31 is consent text (HN-4) and goes to counsel with the candidate "Sync and sharing with {child}'s other parent". NA-36 gets a DATA_CLASSIFICATION note: if hiding is ever synced, it is stored per person in `child_member_prefs`. NA-37 gets a docs note in the run sheet.

## 4. Rows to add to the BRAND.md glossary (after #420 merges)

| Concept | Use | Banned in copy | Notes |
|---|---|---|---|
| Committing a letter | Keep; "Kept." | save (for a letter), store, submit | R-B. Save is for drafts, files and "Save words". |
| Not committing at the gate | "Leave it waiting" | "Keep it here for now" | R-B, F06-REQ-043, F14-REQ-028. |
| The safe choice in a confirm alert | Cancel | Keep it, Keep | R-B. |
| Putting a letter in the book | "Add to {child}'s book" | Add to book, publish, share | R-B. |
| Private | "Keep private", "Make private" | | Not in the book: the other parent can't read it, and it is left out of Read together and the printable book. It is still in your export and, once you agree to sync, on our servers. |
| The Plus place in Settings | Plan ("Settings, Plan") | | R-C. Fixed by the Terms; the product is still Plus. |
| Plan names | Plus Monthly, Plus Annual | Monthly, Yearly (alone) | R-C, D-077. |
| Membership | (internal only) | membership | R-C. Copy says subscription. |
| What the app sends about Plus | "A note about Plus", "A yearly note" (until the Terms change) | | R-D. The only "note" exception. |
| The speech download | language | speech model, language pack | R-J. |
| The iPhone's own settings | "Open Settings" on buttons; "the Settings app" in prose | | R-F. |
| The child, when no name is shown | your child | your little one, the baby, the kid | R-F. The crisis line may say "your baby". |
| Store subtitle | "Baby journal in your own voice" | | R-H. The only place "journal" is allowed besides keywords. |
| Recovery export file | `scribe.db` | | R-L. The one visible codename; a contract. |

## 5. Fix packages

| Pkg | What | Owner lane | When |
|---|---|---|---|
| FP-1 | R-A, R-B, R-F, R-J, R-K, R-D (export readme), R-E (`rules.test.ts`), with rules-test lines for the new banned words | content + mobile | After the go/no-go (Mon 9 Nov), rebased on the comms branch; before the store build is cut |
| FP-2 | R-D in the store listing and counsel's proposal; R-H line in BRAND.md | the comms validation session (`fix/comms-validation-2026-10-31`) | Before submission |
| FP-3 | NA-03, NA-04, R-C cards, R-I site source; port the glossary bans into `main`'s copy-rules test and drop its seven-language requirement | website thread | Before submission; the founder merges to `main` (D-107) |
| FP-4 | R-G analytics | analytics | After the go/no-go; route additions with the analytics-on packet |
| FP-5 | The Family teaser lines | content | With the v1.1 copy |
| FP-6 | R-I docs, section 4 rows, CR-25 and CR-26 into `docs/agents/cto/RULINGS.md` (after #420 merges, to avoid a conflict on the log) | docs | After #420 merges |
| FP-7 | CPO-1 in the PRD; R-C labels, R-E lines, NA-29, NA-30, NA-31 with counsel | PRD lane; legal lane with counsel | Next PRD update; counsel round |
| FP-8 | R-L export format literal (T2) | mobile | After the go/no-go, with two reviews |

## 6. Founder questions (two, after Karma's gate)

1. **Are notes in v1.0?** PRD V2 still lists a P0 note-or-letter control (F04-REQ-014) and F06 Q10 is open on it. The build has retired notes: the control and its test don't exist, and EXPERIENCE_PASS marks the strings "v1.0 makes no notes". Recommendation: confirm notes are out of v1.0, move F04-REQ-014 to `docs/backlog/FUTURE.md` as a later entry kind, and keep `note` as a reserved kind in the data model and export (no migration). Default if no answer by Mon 9 Nov: that. Challenged: "a dead label isn't worth his minute." It is a P0 row in a spec he signs, and only he cuts scope.
2. **Hold "exactly as you said it" and "Word for word" off the website and marketing email until counsel clears them at T30?** D-125 item 9 already holds the phrase out of the store listing; the live site still says it six times, and guideline 2.3.1(a) covers metadata "within or outside of the App Store". Recommendation: yes, use "Every change is marked" on public surfaces; "Word for word" stays the in-app name. Default: the hold lands in the next website PR, before submission. Challenged: "it's the tagline, and the site sells nothing." The site is live while App Review looks, and restoring the line is one PR.

Not founder questions: "the price after" and the 1.4.0 Subscription Terms are already counsel items (Q8); the child's name on the site is D-118.

## 7. Debate record

v1: an independent agent challenged the first draft. It dropped my Plan-to-Plus rename (the Terms name "Settings, Plan" as the cancel path), kept "note" in the two plan lines, and changed the R-A label from "New letters open".

v2: seven council reviews, independent of each other, read the repo themselves. They share a model family with me, so the independence is of method, not of judgement. What changed:
- R-A. Mine was "Show spoken letters" under Recordings. The CAIO showed "Show" is wrong: the setting only sets the view a new spoken letter starts in, and kept letters don't change. The CDesO showed it belongs under Writing, not Your data. The mishearing warning moved to the speech step, where it is true.
- R-B. I had two facts wrong. Write already says "Add to {child}'s book" and "Keep private", and the "Save" I cited is dead code. Cancel was also missing from four more alerts.
- R-D. It now cites D-121 and 2.3.1(a), and covers the whole store source, not just notes. NA-14's `withdrawn` claim was wrong (CDO); corrected as NA-35.
- R-E. The counsel-held lines are rerouted to FP-7.
- New. R-G's never-list (CDO, CPrivO), R-J, R-K, R-L, and NA-25 to NA-37.
- IA. It now separates today's state on `develop` from the D-126 target, and backup appears in no build.

What I rejected:
- The CMO and CCO wanted the promise-word hold on the site as a ruling. It changes public promise copy, so it is founder question 2.
- The CPO's founder question on notes: I tested whether D-121 already settles it. It doesn't. D-109 adopted F2 to F8 only, and no decision records the cut. So it stays a question.
- The CLO's "price after" item as a founder question now: it is already counsel Q8, and counsel answers first.

Karma
