# Catalogue A: keeping and foundations (cards 03, 09, 10, 32 to 36), wave 1

Owner: qa. Written 20 Nov 2026 against develop 16e61549 and the locked cards at 450bcb4a. This file holds 106 rows (71 P0, 35 others). No test is written here: each line is a design a builder can turn into a test and a reviewer can check.

How to read a line. Legend, tags and the rules behind it are in `CHECKS-AND-BALANCES.md` (C-R rules). Title: use it exactly; the card is the source. Lvl: U unit, I integration (real store on node SQLite or supabase test), S source scan (needs a positive control), J journey (simulator flow), D device, P process or document check. Run: SB runs in the sandbox (Node 22.5 and up; the 8 baseline files stay red); CI needs CI, macOS, Deno or a simulator; DV only on a phone; DOC a checklist. Today: `cited` means `scripts/trace.mjs` on develop finds a test title citing the row (T1 not yet checked: it may prove only part), `fails` means the design files say the code does not meet it today, `none` means no test cites it. Dsn: our design file that names the row (08, 09, 10, 11 = `docs/tdd/new-scope/*`, sec, priv, data, arch). Status DESIGNED means the card plus this line is enough to build a test that can fail; GAP means it is not and the line says what to add.

## Rows that fail today (build these first) - 2

| Row | Exact title | Lvl | Run | W | Today | Fixture, act, assert | Mutant that must turn it red | Lane | Dsn | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| NS-10-R3 | `[NS-10-R3] a second account never sees the first` | I | SB | 1 | fails; none | Phone holds Asha-A's book; sign in as Asha-B; assert B's session shows none of A's letters, recordings or child name through the real gate, not only the pure reader (BL-961 part 1 of 3 is on develop (account-scope.logic.ts, #869); its test cites the row in parentheses so trace misses it) | Gate opens the local book for any session (BL-961 parts 2 and 3 pending) | mobile | 08 priv sec | DESIGNED |
| NS-10-R7 | `[NS-10-R7] one acceptance row after a retry` | I | SB | 1 | fails; cites consent-retry-one-key.test.ts:79 +1 | Retry a consent answer after a lost response; assert one key and one server row; FAILS today (new key per answer, K11) | Mint a new idempotency key per attempt (today) | data-architect | 08 priv | DESIGNED |

## NS-03

| Row | Exact title | Lvl | Run | W | Today | Fixture, act, assert | Mutant that must turn it red | Lane | Dsn | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| NS-03-R1 | `[NS-03-R1] no contact before the counsel read (checklist in the pilot file)` | P | DOC | 1 | none | Checklist test on the pilot file: a dated counsel read exists before the first contact date PROPOSE: node check reading the pilot file front matter; process row, not app code | Contact date earlier than the read date | product | - | GAP |
| NS-03-R2 | `[NS-03-R2] no Arm V without both voice reads` | P | DOC | 1 | none | Check dates: security read and voice read <= consent date for every Arm V parent PROPOSE: same checker as R1 | Arm V parent with a later read | product | sec | GAP |
| NS-03-R3 | `[NS-03-R3] the read-out holds counts only` | S | SB | 1 | none | no-real-family-data test plus a scan of the read-out for quotes, codes and names (count only) | Add a participant code next to an answer | product | - | DESIGNED |
| NS-03-R4 | `[NS-03-R4] pilot data is deleted on its clocks (founder's dated note)` | P | DOC | 1 | none | Founder dated deletion notes at 30 days and 12 months; checklist, not CI PROPOSE: reminder row in the pilot file, checked at read-out | Missing note after the clock | product | - | GAP |
| NS-03-R5 | `[NS-03-R5] a withdrawal deletes notes in 2 working days` | P | DOC | 1 | none | Withdrawal log entry plus a deletion note within 2 working days PROPOSE: checklist line | Deletion note later than 2 days | product | - | GAP |
| NS-03-R6 | `[NS-03-R6] success lines do not move after day 0` | P | DOC | 1 | none | Hash of outcome table equals day-0 hash at read-out PROPOSE: pilot file stores the hash | Edit a line after day 0 | product | - | GAP |
| NS-03-R7 | `[NS-03-R7] no code or reward before the read-out` | P | DOC | 1 | none | Pilot file shows 0 codes or gifts before read-out; later codes carry the disclosure line PROPOSE: checklist line | Code given before read-out | product | - | GAP |
| NS-03-R8 | `[NS-03-R8] agents never read the pilot log (process check)` | P | DOC | 1 | none | Process check: no agent run reads the private log path; harness guard on path PROPOSE: add the path to the agent read deny list and test it in scripts/agents | Agent reads the log directory | product | sec | GAP |
| NS-03-R9 | `[NS-03-R9] recipient playback checked before recruiting` | P | DOC | 1 | none | Yes or no per recipient app before recruiting PROPOSE: checklist row | Missing row | product | sec | GAP |

## NS-09

| Row | Exact title | Lvl | Run | W | Today | Fixture, act, assert | Mutant that must turn it red | Lane | Dsn | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| NS-09-R1 | `[NS-09-R1] the sweep finishes a discarding draft` | I | SB | 1 | cites sweep.disk.test.ts:288 | Seed one Asha draft with state discarding and its .m4a on a temp dir; run the launch sweep; assert file and row gone | Remove the `discarding` branch call in sweep.ts (:152-153) or delete the row before the file | mobile | - | DESIGNED |
| NS-09-R2 | `[NS-09-R2] a failed delete waits for the next launch` | I | SB | 1 | cites sweep.disk.test.ts:302 | Same seed, injected deleter throws; run sweep; assert row still discarding, file kept, nothing thrown, no screen event | Swallow the throw by deleting the row anyway (row removed before file result is known) | mobile | - | DESIGNED |
| NS-09-R3 | `[NS-09-R3] Listen never removes a row whose file is still there` | I | SB | 1 | cites listen.test.ts:347 +1 | Listen Discard with a deleter that throws; assert row exists and state is discarding (read the table, not a mock) | Call store.deleteDraft before the file delete resolves | mobile | - | DESIGNED |
| NS-09-R4a | `[NS-09-R4a] the line shows once per take` | U | SB | 1 | none | Review let-go with failing delete; render the line twice in one visit and for a second take; assert shown once per take, once per visit | Drop the per-take key so the line shows on every render | mobile | - | DESIGNED |
| NS-09-R4b | `[NS-09-R4b] Review says when a recording is not gone yet` | U | CI | 1 | none | Render the line and spy on the announce port; assert one announcement after the settle delay, not on mount PROPOSE: announce through a port `announce(text, delayMs)`; test with fake timers; device row for the real VoiceOver read | Announce on mount (before settle) | mobile | - | GAP |
| NS-09-R5 | `[NS-09-R5] an empty sweep costs nothing (BL-929 run sheet row)` | D | DV | 1 | none | SE 3 device: launch with 0 discarding drafts, read the sweep marker; under 5 ms (PROPOSED number) | Run the directory scan even when no draft is discarding | mobile | - | DESIGNED |
| NS-09-R6 | `[NS-09-R6] a stuck recording is visible in Storage` | U | SB | 1 | none | Fail a delete on 3 launches; render Storage line and Remove now; tap once; assert one retry (K3: card says Storage, built screen is Where your letters live) | Retry in a loop on tap | mobile | 08 | DESIGNED |
| NS-09-R7 | `[NS-09-R7] the discard reaches the server` | I | SB | 1 | none | Let go a synced held draft with sync allowed; assert one queued discard op with the draft id, and it stays queued until an ack fixture arrives | Remove the op when the request is sent instead of on ack | data-architect | facts | DESIGNED |
| NS-09-R8 | `[NS-09-R8] let go follows to the other phone (stand-in, then two phones)` | J | DV | 1 | none | Two-phone run: let go on phone A; relaunch phone B; assert neither row nor file on B. Stand-in: two stores on node SQLite with a fake server, titled `[stand-in]` | Server ack not applied by pull (skip the held.discard apply) | data-architect | - | DESIGNED |
| NS-09-R9 | `[NS-09-R9] the confirmation defaults to keep` | U | SB | 1 | none | Render the confirmation; assert default focus is Keep, label states the take cannot be brought back, no Undo after confirm | Make Let it go the default action, or add an Undo toast after confirm | mobile | 08 | DESIGNED |
| NS-09-R10 | `[NS-09-R10] kill switch queues the discard` | I | SB | 1 | none | Run with serverFeaturesEnabled() false, then with killSwitches.sync true; let go; assert local file and row gone and the op stays queued until allowed | Gate the local delete on the sync switch (delete waits) | mobile | - | DESIGNED |
| NS-09-R11 | `[NS-09-R11] a discard is never sent as another account` | I | SB | 1 | none | Queue a discard as Asha-A, sign out, sign in as Asha-B; drain outbox; assert zero requests under B's session and the op still held for A | Drain without checking the op's owner id | data-architect | - | DESIGNED |
| NS-09-R12 | `[NS-09-R12] sign out does not drop a discard` | I | SB | 1 | none | Queue a discard, call signOutWouldWait; assert true; force sign-out; assert op held and sent at A's next sign-in | Remove the discard kind from signOutWouldWait | data-architect | - | DESIGNED |
| NS-09-R13 | `[NS-09-R13] a large sweep stays off the first frame` | D | DV | 1 | none | SE 3 device: 50 discarding Asha drafts; sweep under 2 s and no JS-thread block over 100 ms (U7 open) | Do the 50 deletes synchronously in the first frame | mobile | 08 | DESIGNED |
| NS-09-R14 | `[NS-09-R14] a let-go held draft is purged on the server` | I | SB | 1 | none | supabase/tests/sync_v1_server.test.mjs: ack of held.discard; assert no row and no words for that id in the same request (cite K2 exceptions in the title note) (Two named exceptions (changed words, legal hold) need own tests once K2 is ruled) | Keep the row and only blank its text | data-architect | 08 arch data facts | DESIGNED |
| NS-09-R15 | `[NS-09-R15] the failure count survives a relaunch` | I | SB | 1 | none | Fail a delete twice, restart the settings store, assert discard.failures.<id> reads 2; remove the draft; assert key gone | Hold the count in memory only, or never remove the key | mobile | - | DESIGNED |
| NS-09-R16 | `[NS-09-R16] the sweep runs after an update` | I | SB | 1 | none | Seed a discarding draft, bump the app version setting, launch; assert sweep ran and finished it | Skip the sweep when the version changed | mobile | - | DESIGNED |
| NS-09-R17 | `[NS-09-R17] no remote switch stops a let-go (source check)` | S | SB | 1 | none | Source scan: no remote config key read inside let-it-go.logic.ts or the sweep delete path (positive control) | Read a config key to delay delete | mobile | arch | DESIGNED |

## NS-10

| Row | Exact title | Lvl | Run | W | Today | Fixture, act, assert | Mutant that must turn it red | Lane | Dsn | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| NS-10-R0 | `[NS-10-R0] a returning account never meets the child step` | J | CI | 1 | none | Seed a returning account with no local book and consent pending; boot; assert the consent sheet or held screen within 10 s and 0 renders of the child step | Remove the no-book-with-account branch in the boot gate so first-run shows | mobile | - | DESIGNED |
| NS-10-R1 | `[NS-10-R1] two phones, one book (device row S1-204)` | J | DV | 1 | none | Two phones, one Asha account with 5 letters; second phone signs in; assert every letter's words and no page says a recording is kept on that phone (S1-204) | Show the recording line on pulled letters | mobile | - | DESIGNED |
| NS-10-R2 | `[NS-10-R2] a slow arrival shows what has come` | U | SB | 1 | none | Pull 400 of 1,000 Asha letters with 10 s elapsed; assert Book lists the 400 plus one line, never empty, never the child step | Show empty state while pulling | mobile | - | DESIGNED |
| NS-10-R4a | `[NS-10-R4a] deletion works without agreeing` | J | CI | 1 | none | Returning parent declines new Terms; open Settings; assert Delete account is reachable and completes | Require Terms before the delete route mounts | mobile | - | DESIGNED |
| NS-10-R4b | `[NS-10-R4b] export reachable after declining` | J | CI | 1 | none | Decline Terms with local letters, then with none; assert export opens for local data, and the empty case says the book is on the other phone | Hide export behind the Terms gate | mobile | - | DESIGNED |
| NS-10-R5 | `[NS-10-R5] a second account never claims the first's letters` | I | SB | 1 | none | A signs out with unsynced letters; B signs in; assert no claim screen offers A's letters and no upload under B (X4-R1 shares this proof) | Offer claim of un-owned rows regardless of owner | data-architect | - | DESIGNED |
| NS-10-R6 | `[NS-10-R6] restore plus sign-in never duplicates (two-phone device row)` | J | DV | 1 | none | Restore a device backup with L1..Ln then sign in pulling the same ids; assert each once. Unit stand-in: merge of identical ids on node SQLite, titled `[stand-in]` | Insert pulled rows without upsert on id | data-architect | 08 | DESIGNED |
| NS-10-R8 | `[NS-10-R8] kill switch at sign-in shows the local book` | U | SB | 1 | none | serverFeaturesEnabled false at sign-in; assert local book shown and held screen never mounted | Check the switch after the held screen decision | mobile | - | DESIGNED |
| NS-10-R9 | `[NS-10-R9] deletion elsewhere ends the wait` | U | SB | 1 | none | Held screen with account-deleted answer; assert plain line, no error code in text | Print the error code | mobile | 08 | DESIGNED |
| NS-10-R10 | `[NS-10-R10] a lapsed plan still brings the book` | I | SB | 1 | none | Lapsed plan fixture; pull 5 Asha letters; assert all arrive and open (plan.decide not consulted on pull) | Gate pulled rows on plan state | data-architect | - | DESIGNED |
| NS-10-R11 | `[NS-10-R11] retry after a lost books answer` | I | SB | 1 | none | Lose the sync_books answer, retry; assert books once and progress not reset to zero | Reset the cursor on retry | data-architect | - | DESIGNED |
| NS-10-R12 | `[NS-10-R12] wrong account names the method` | U | SB | 1 | none | Wrong account route fixture with an email; assert method name shown, no full address (regex) | Interpolate the full email | mobile | - | DESIGNED |
| NS-10-R13 | `[NS-10-R13] one book-level line for absent recordings` | U | SB | 1 | none | Backup off, new phone; Book shows one line at top; dismiss; assert not shown again; K9 differs from built behaviour | Show a per-card line | mobile | 08 | DESIGNED |
| NS-10-R14 | `[NS-10-R14] both phones keep receiving (device)` | D | DV | 1 | none | Two phones foreground; make a letter on each; p95 under 30 s over 20 runs | Add a 60 s poll instead of push | data-architect | - | DESIGNED |

## NS-32

| Row | Exact title | Lvl | Run | W | Today | Fixture, act, assert | Mutant that must turn it red | Lane | Dsn | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| NS-32-R1 | `[NS-32-R1] one budgeted notification a day` | U | SB | 1 | none | Plan 92 days with all budgeted classes on; group by local date; assert max 1 per date | Remove the one-per-day clamp in allocate() | mobile | 09 11 | DESIGNED |
| NS-32-R1b | `[NS-32-R1b] birthday and month-day on one date` | U | SB | 1 | none | Two Asha books, one birthday and one month-day on the same date; assert exactly one scheduled | Skip the same-date merge | mobile | - | DESIGNED |
| NS-32-R2 | `[NS-32-R2] unregistered class fails` | U | SB | 1 | none | Add a class to the code without a registry row; the registry test fails (positive control) | Register the class in one place only | mobile | - | DESIGNED |
| NS-32-R3 | `[NS-32-R3] priority decides` | U | SB | 1 | none | Two classes same day, assert higher priority wins | Invert the sort | mobile | - | DESIGNED |
| NS-32-R4 | `[NS-32-R4] plan notice on time` | U | SB | 1 | none | Plan notice due with typedDay due; assert plan delivered in its window; with notifications off assert Settings, Plan shows the date | Give the plan class a budgeted priority | mobile | - | DESIGNED |
| NS-32-R4b | `[NS-32-R4b] plan notices at the iOS ceiling` | U | SB | 1 | none | Fill 60 budgeted; add 4 plan notices; assert all 4 kept and total <= 64 (design keeps 60 total, Conflict P1: confirm with product before building) PROPOSE: reword Given per eval B s8; test total <= 64 and plan >= 4 separately | Cap the total before reserving plan slots | mobile | 11 | GAP |
| NS-32-R5 | `[NS-32-R5] registry rows` | U | SB | 1 | none | Registry lists plan, typedDay, birthday, monthAge, evening with group, priority, owner; no occasion | Add an occasion class | mobile | - | DESIGNED |
| NS-32-R6 | `[NS-32-R6] time zone change` | U | SB | 1 | none | Change the zone mid plan; re-plan; no local date holds 2 budgeted | Plan in UTC dates | mobile | - | DESIGNED |
| NS-32-R7 | `[NS-32-R7] pending ceilings` | U | SB | 1 | none | Fill each group; assert budgeted <= 60 and plan <= 4 | Raise a ceiling constant | mobile | - | DESIGNED |
| NS-32-R8 | `[NS-32-R8] back-off pre-scheduled` | U | SB | 1 | none | Plan with day 0, no letters, app never opened; assert no evening note after day 35 | Remove the day-35 cutoff | mobile | - | DESIGNED |
| NS-32-R9 | `[NS-32-R9] typed day survives back-off` | U | SB | 1 | none | Back-off over a typed day; typed day survives | Apply back-off to all classes | mobile | 09 | DESIGNED |
| NS-32-R10 | `[NS-32-R10] interruption level` | U | SB | 1 | none | Every scheduled request has interruption level active | Set time-sensitive | mobile | 09 | DESIGNED |
| NS-32-R11 | `[NS-32-R11] bodies from content keys` | S | SB | 1 | none | Source scan: every notification body is a packages/content key; positive control: a literal string fails | Add a literal body in a scheduler | mobile | - | DESIGNED |
| NS-32-R12 | `[NS-32-R12] lock screen stays plain` | U | SB | 1 | none | For every class and names on or off, assert body and title hold no Asha name or letter words; plan notice holds no name, count or price | Interpolate {child} in the default body | mobile | arch sec | DESIGNED |
| NS-32-R13 | `[NS-32-R13] preview placeholder` | U | SB | 1 | none | Every category sets hiddenPreviewsBodyPlaceholder (neutral) | Omit it on one category | mobile | 09 | DESIGNED |
| NS-32-R14 | `[NS-32-R14] quiet book adds nothing` | U | SB | 1 | cites reminders-quiet-books.test.ts:75 | Quiet one Asha book; plan; assert zero budgeted notes for it, across cadence settings (tested on develop (reminders-quiet-books.test.ts:75); the design file predates the fix) | Plan ignores Child.quiet (planner.ts) | mobile | 09 11 | DESIGNED |
| NS-32-R15 | `[NS-32-R15] a class cannot raise the total` | U | SB | 1 | none | addNotificationClass does not raise the group ceiling | Bump the ceiling per class | mobile | - | DESIGNED |
| NS-32-R16 | `[NS-32-R16] re-plan after update` | I | SB | 1 | none | Launch with a changed app version; assert re-plan called once | Skip re-plan | mobile | - | DESIGNED |

## NS-33

| Row | Exact title | Lvl | Run | W | Today | Fixture, act, assert | Mutant that must turn it red | Lane | Dsn | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| NS-33-R1 | `[NS-33-R1] letter page heading` | U | SB | 1 | cites a11y-headings.test.ts:35 | Render the letter page; assert dateline has header role (RN carries no level, design P7: Unverified; state it as a stand-in for level 1) (device confirm) | Render the dateline as plain Text | design-systems | 10 11 | DESIGNED |
| NS-33-R2 | `[NS-33-R2] Me heading matches tab` | U | SB | 1 | cites a11y-headings.test.ts:56 | Render Me; assert heading text equals the tab label key | Change the heading key | design-systems | - | DESIGNED |
| NS-33-R3 | `[NS-33-R3] lens is a choice, not tabs` | S | SB | 1 | none | Render the lens: one radiogroup, two radios, exactly one checked; scan src for role tablist = 0 | Revert the lens to a tablist | design-systems | 11 | DESIGNED |
| NS-33-R4 | `[NS-33-R4] AX5 on SE 3` | D | DV | 1 | cites a11y-ax5.test.ts:73 +2 | SE 3 at AX5: Home, Listen Ready, Review, Book, letter page; measure targets >= 44 pt, no clipped text; plus lint scan for numberOfLines without a guard | Set numberOfLines on a title without a large-text guard | design-systems | - | DESIGNED |
| NS-33-R5 | `[NS-33-R5] no loops under Reduce Motion` | D | DV | 1 | none | Reduce Motion on; walk every screen 30 s each; assert no looping animation (screen recording); plus unit: every Animated loop reads reduceMotion | Add a loop that ignores useReducedMotion | design-systems | - | DESIGNED |
| NS-33-R6 | `[NS-33-R6] VoiceOver core loop` | D | DV | 1 | none | VoiceOver on SE 3: start, stop, review, undo a fix, Keep, no sighted help; start and stop announced within 1 s (stopwatch on screen recording) | Remove the announce on stop | design-systems | - | DESIGNED |
| NS-33-R7 | `[NS-33-R7] AX5 with Bold Text` | D | DV | 1 | none | AX5 plus Bold Text: repeat R4 steps on the four screens | Fixed-height row around a Text | design-systems | - | DESIGNED |
| NS-33-R8 | `[NS-33-R8] contrast` | U | SB | 1 | none | Token test: every text token pair on the four screens, light, dark and Increase Contrast, >= 4.5:1; device spot check (device confirm) | Lighten one text token by one step | design-systems | - | DESIGNED |
| NS-33-R9 | `[NS-33-R9] Voice Control labels` | D | DV | 1 | none | Voice Control: say each visible label on the five screens; assert it triggers (Show names overlay) PROPOSE: unit scan that visible text equals accessibilityLabel on every Button | Give a button an accessibilityLabel different from its visible text | design-systems | - | GAP |
| NS-33-R10 | `[NS-33-R10] Switch Control reach` | D | DV | 1 | none | Switch Control scanning reaches every control on the five screens PROPOSE: unit scan that every pressable is accessible with a role | Make a control a Pressable with accessible=false | design-systems | - | GAP |
| NS-33-R11 | `[NS-33-R11] Smart Invert ignores pictures` | U | SB | 1 | none | Every PhotoFrame and brand symbol sets accessibilityIgnoresInvertColors (source scan) | Remove the prop from PhotoFrame | design-systems | - | DESIGNED |
| NS-33-R12 | `[NS-33-R12] recording state not colour alone` | U | SB | 1 | none | Render the recording state; assert a text label and a shape element exist and colour is not the only differentiator | Remove the label, keep the colour | design-systems | - | DESIGNED |
| NS-33-R13 | `[NS-33-R13] tab bar large content` | U | SB | 1 | none | Tab bar items carry large content title and image | Remove the prop | design-systems | - | DESIGNED |
| NS-33-R14 | `[NS-33-R14] Bold Text on custom fonts` | D | DV | 1 | none | Bold Text: Mukta, Literata render heavier; Tiro has Regular only (P4): record as known limit PROPOSE: row stays device; evidence file lists Tiro as exempt by founder note | Nothing to mutate; a device observation | design-systems | 11 | GAP |
| NS-33-R15 | `[NS-33-R15] undo windows wait for VoiceOver` | U | SB | 1 | none | createUndo with VoiceOver on: window = seconds plus read time; Switch Control: until moved on; fake timers (BL-954) | Fixed window ignoring VoiceOver | mobile | 11 | DESIGNED |
| NS-33-R16 | `[NS-33-R16] automated audit` | D | CI | 1 | none | XCUITest performAccessibilityAudit at AX5 on each named screen, zero critical violations; no harness today, so propose Accessibility Inspector by hand as stand-in PROPOSE: BL row for an XCUITest target in the e2e profile; stand-in run recorded as `[stand-in]` | Remove a label from one control | qa | 11 | GAP |

## NS-34

| Row | Exact title | Lvl | Run | W | Today | Fixture, act, assert | Mutant that must turn it red | Lane | Dsn | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| NS-34-R1 | `[NS-34-R1] run sheet recorded` | P | DOC | 1 | none | Run sheet in docs/qa/evidence has met or missed per section 3 number | Blank cell | qa | - | DESIGNED |
| NS-34-R2 | `[NS-34-R2] a miss holds the feature` | P | DOC | 1 | none | Process check: run sheet row with a miss has an open BL row and its flag stays off in eas.json; scripted check in preflight-production PROPOSE: preflight reads docs/qa/evidence for MISS and fails on a flag in production | Set the flag on while the miss row is open | qa | - | GAP |
| NS-34-R3 | `[NS-34-R3] run sheet provenance` | P | DOC | 1 | none | Evidence front matter holds model, iOS and fingerprint (template check) | Missing fingerprint | qa | - | DESIGNED |
| NS-34-R4 | `[NS-34-R4] evidence filed` | P | DOC | 1 | none | Evidence path pattern docs/qa/evidence/<date>-<build>-se3.md | Wrong name | qa | - | DESIGNED |
| NS-34-R5 | `[NS-34-R5] runs on Asha only` | S | SB | 1 | none | no-real-family-data test runs on any PR touching docs/qa/evidence; evidence filename pattern asserted | Add a real-looking name to a fixture file | qa | - | DESIGNED |
| NS-34-R6 | `[NS-34-R6] markers content-free` | S | SB | 1 | none | Source scan of perf marker names and payloads: no path, text or name fields (positive control) PROPOSE: markers pass a typed allowlist `PerfMarker` and a log canary reads the sink | Add a `path` field to a marker | qa | - | GAP |
| NS-34-R7 | `[NS-34-R7] both iOS versions` | P | DOC | 1 | none | Evidence names iOS 17 and latest iOS runs | One missing | qa | - | DESIGNED |

## NS-35

| Row | Exact title | Lvl | Run | W | Today | Fixture, act, assert | Mutant that must turn it red | Lane | Dsn | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| NS-35-R1 | `[NS-35-R1] only Home starts` | S | SB | 1 | none | navigation-one-entry scan: no screen outside Home calls startCapture or pushes /listen | Add a push to /listen from the Book | qa | - | DESIGNED |
| NS-35-R2 | `[NS-35-R2] mode changes are not starts` | U | SB | 1 | none | Listen to Review and mode changes are not counted as starts in the one-entry test | Count them as starts | qa | - | DESIGNED |
| NS-35-R3 | `[NS-35-R3] doorways land, never start` | U | SB | 1 | none | Doorway fixtures (notification tap, link): assert route is Home or reading, recorder never armed | Arm Listen from a notification handler | mobile | 09 | DESIGNED |
| NS-35-R4 | `[NS-35-R4] extensions are doorways` | S | SB | 1 | none | Scan share extension, notification actions and intents: none calls the recorder or store.keep | Call keep from a notification action | mobile | - | DESIGNED |
| NS-35-R5 | `[NS-35-R5] closed source list` | U | SB | 1 | none | Add a source to start-capture handlers without the closed list entry; the test fails | Add a handler only | qa | 09 | DESIGNED |
| NS-35-R6 | `[NS-35-R6] remaining navigation checks` | S | SB | 1 | none | Navigation test N2 d-f, N6 b d, N7, N8, N9 each with a failing fixture committed | Skip the fixture | qa | - | DESIGNED |
| NS-35-R7 | `[NS-35-R7] no microphone from outside` | U | SB | 1 | none | Arrival from outside; spy on start-intent.ts; assert mic port untouched | Request the mic in start-intent on cold open | mobile | - | DESIGNED |

## NS-36

| Row | Exact title | Lvl | Run | W | Today | Fixture, act, assert | Mutant that must turn it red | Lane | Dsn | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| NS-36-R1a | `[NS-36-R1a] delete hides everything` | I | SB | 1 | none | Asha letter with stored and two smaller copies, a first and a seal; delete; assert all hidden in one step, same transaction | Hide the picture in a second transaction | data-architect | 11 priv | DESIGNED |
| NS-36-R1b | `[NS-36-R1b] restore returns everything` | I | SB | 1 | none | Restore within 30 days; assert all parts back | Restore the letter row only | data-architect | - | DESIGNED |
| NS-36-R1c | `[NS-36-R1c] purge removes picture files` | I | SB | 1 | none | Advance clock 31 days; purge; assert 3 files and the row gone, files first | Purge the row and leave files | data-architect | - | DESIGNED |
| NS-36-R1d | `[NS-36-R1d] no picture on the server` | I | CI | 1 | none | supabase/tests: entry-photos bucket write denied for any role; 0 objects after a letter with a picture syncs | Relax the bucket write policy | data-architect | data | DESIGNED |
| NS-36-R2 | `[NS-36-R2] export holds every part` | I | SB | 1 | none | Export an Asha letter with picture, seal; assert every part named in the manifest and bytes equal | Skip the photo object in the writer | data-architect | 11 priv | DESIGNED |
| NS-36-R3 | `[NS-36-R3] seal instant on two phones` | J | DV | 1 | none | Seal for a day; two phones in different time zones; both open at the same UTC instant (J-N14) | Compare local clock times instead of the instant | data-architect | - | DESIGNED |
| NS-36-R4 | `[NS-36-R4] acceptance record` | P | DOC | 1 | none | Check that ADR 0028 is on develop with its X10 fix and the classification test lists the L3 columns before any picture writes on a store build PROPOSE: a test titled `[NS-36-R4]` reading DATA_CLASSIFICATION for the three columns | Remove the classification row for entry_media.entry_id | data-architect | data priv | GAP |
| NS-36-R5 | `[NS-36-R5] export 1.7.0 golden` | I | SB | 1 | none | Golden export 1.7.0 with one Asha picture at photos/<entry_id>/<media_id>.jpg; a 1.6.0 file still reads | Change the photo path pattern | data-architect | 11 arch data | DESIGNED |
| NS-36-R6 | `[NS-36-R6] inventory check` | S | SB | 1 | none | Scan data-policy.md section 4 and DATA_CLASSIFICATION.md for each new field name in the migration PROPOSE: test that lists new columns of the latest migration and requires a row for each | Add a column without a doc row | privacy | data priv | GAP |
| NS-36-R7 | `[NS-36-R7] export versions one way` | U | SB | 1 | none | 1.6.0 schema rejects a 1.7.0 fixture; 1.7.0 schema reads it | Loosen the 1.6.0 schema to ignore unknown keys | data-architect | 11 | DESIGNED |
| NS-36-R8 | `[NS-36-R8] Find row follows the letter` | I | SB | 1 | none | Reindex with letter hidden, deleted, restored; assert Find row follows; same transaction (BL-952) | Reindex in a separate transaction | data-architect | 11 | DESIGNED |
| NS-36-R9 | `[NS-36-R9] typed days are settings` | U | SB | 1 | none | Typed day stored in settings, never in entries (schema scan) | Add a typed_day column to entries | data-architect | - | DESIGNED |
| NS-36-R10 | `[NS-36-R10] level in the migration` | S | SB | 1 | none | Classification test: every column added since a base has a level in the migration comment | Add a column without the comment | data-architect | data | DESIGNED |
| NS-36-R11 | `[NS-36-R11] trigger tuple and view` | I | CI | 1 | none | supabase test: new synced column appears in the entries content trigger tuple and the book_entries view | Add the column to the table only | data-architect | data | DESIGNED |
| NS-36-R12 | `[NS-36-R12] new fields never logged` | I | SB | 1 | none | Log canary: write letter with canary text in the new fields; assert absent from logs, crash, analytics | Log the caption on a failed write | privacy | priv | DESIGNED |
