# Nomenclature and IA audit, 31 Oct 2026

Owner: Karma (CTO), via the platform session. Scope: every name a parent can see in the iOS app, the store listing, emails and the website, and how each maps to code, database, analytics and routes. Read on `develop` at fa37032 and the website on `main`. The IA map is in [IA.md](IA.md).

## How this sits with the rest of the record

- The product vocabulary already has one home: the glossary in `packages/content/BRAND.md`. CR-21 and CR-22 (PR #420, open) add the internal-term door to it. This audit adds no second glossary. It checks the app against that one, and proposes the rows the glossary is missing (section 4).
- `docs/GLOSSARY.md` is cited by CODE-R07 and DB-R05 but was never written. After #420 merges, those two rules should point at BRAND.md instead of a file that does not exist. That is a two-line docs fix (FP-6).
- Promise words stay founder and counsel territory (D-125 item 9, CR-21): the name "Word for word" and "exactly as you said it" are not touched here.

## 1. What is solid

Read together, Recently deleted, Not much today, "From {signsAs}", Month {n} (no "chapter" visible), Before You, The first weeks, Early version (no "beta"), small fix, the red circle, Plus as the only product name, and the codename `scribe` kept out of every visible string. The two tabs of the store build (Tonight, Book) are single words, as the design language asks.

## 2. Findings, worst first

Severity: High = a parent would read it wrongly, or a public line claims something the build does not do. Evidence is file:line on `develop` unless marked `main:`.

| ID | Sev | Finding | Evidence |
|---|---|---|---|
| NA-01 | High | The Settings switch is labelled with the feature name, and reads backwards. "Word for word" ON gives "Small fixes, marked"; OFF gives "Exactly as said". A parent expects "word for word" to mean untouched. | `packages/content/src/strings.en.ts:725-728`; `apps/mobile/src/app/settings/recordings.tsx:93-95` |
| NA-02 | High | The store listing and its counsel proposal promise notes ("NOTES AND LETTERS ... a quick note"). v1.0 makes no notes, so this breaks the rule that public copy describes only the shipped build (D-121, issue #127 item 3). | `packages/content/src/store.en.ts:50-51`; `docs/store/app-store.md:39-40`; `docs/store/app-store-staged-1.0-proposal.md:45-46`; `strings.en.ts:453` |
| NA-03 | High | The live website uses two banned forms: "A baby book you fill by talking" and the sign-off "The Early Letters team". | `main:apps/web/src/content/site.ts:72,83,292`; BRAND.md glossary rows "What the product makes", "Email sign-off" |
| NA-04 | High | Two website copy sources. `packages/content/src/site.en.ts` and `pages.en.ts` say `apps/web` renders them, but nothing on `main` imports them; the site reads `apps/web/src/content/site.ts`. The content rules test guards the copy nobody sees. | `pages.en.ts:1-2`; `main:apps/web/src` imports |
| NA-05 | Medium | Plan names drift. The Plan screen shows "Monthly" and "Yearly"; the confirmation, reminders and App Store say "Plus Monthly" and "Plus Annual" (D-077). The website film says "Monthly" and "Yearly". | `apps/mobile/src/components/settings/plan.logic.ts:35-43`; `features/billing.en.ts:98-100,164-165`; `main:apps/web/src/content/site.ts:222-223` |
| NA-06 | Low | The Settings row and page are titled "Plan"; the product is "Plus"; the route and analytics say `plus`. Not a defect: "Settings, Plan" is the path the Terms of Service, the Subscription Terms, D-094, the pre-purchase cancel line and the billing emails give for cancelling and refunds. | `strings.en.ts:700-704,1138-1139`; `docs/legal/terms-of-service.md:245,251,254`; `docs/legal/subscription-terms.md:8,47,54` |
| NA-07 | Medium | "note" names things the app sends, which the glossary bans: "A note about Plus", "A yearly note: Plus renews", "Saves a note on this phone", "Noted on this phone". But the Terms and Subscription Terms promise reminders "as a note in the app", so the plan lines match the legal text. The export readme says "Every letter and note". | `features/billing.en.ts:141,146`; `features/family.en.ts:182-184`; `features/export.en.ts:82` |
| NA-08 | Medium | "member" and "family member" appear in parent-facing copy and the terms, against the glossary's ban. | `strings.en.ts:797`; `features/account-deletion.en.ts:26`; `features/backup.en.ts:26`; `docs/legal/terms-of-service.md:139,159` |
| NA-09 | Medium | The verb rule in the spec contradicts the product. F06-REQ-043 says actions say "Save" and the gate's way out is "Leave it waiting"; the founder's decisions (D-082, D-083, M17) and the glossary make Keep the product verb. The app follows the founder. | `docs/prd/v2/features/F06-faithful-edit.md:317`; `strings.en.ts:240-246`; `features/billing.en.ts:45-66` |
| NA-10 | Medium | One action, three labels: "Add to {child}'s book", "Add to the book", and "Add to book" on the letter page menu. | `strings.en.ts:408-417,513-514` |
| NA-11 | Medium | "transcription" is visible in a Settings section title ("How transcription works"). The glossary bans transcript wording in app copy. | `strings.en.ts:822`; `app/settings/recordings.tsx:70` |
| NA-12 | Medium | "Settings" means two things. "Turn it on in Settings" and "Open Settings" point at the iPhone Settings app, inside an app with its own Settings. | `strings.en.ts:972-973`; `features/reminders.en.ts:58-60`; `features/language.en.ts:30` |
| NA-13 | Medium | The child is called four things when no name is shown: "your child", "your little one", "your baby", and the name. | `features/reminders.en.ts:16-20,56`; `strings.en.ts:1191`; `features/family.en.ts:190` |
| NA-14 | Low | Code spells co-parent three ways: `coparent` (email ids, analytics event), `co_parent` (push kind), `other_parent` (analytics relation). Analytics names the set-aside decision `kept_aside` where the database says `set_aside`. (`withdrawn` is a separate state, not a spelling: `supabase/migrations/20261015000000_*.sql:35`.) | `packages/content/src/emails/account.en.ts:188`; `emails/family.en.ts:5`; `packages/analytics/src/catalog.ts:40,355,669`; `packages/api/src/server/push.ts:15`; `packages/api/src/server/sync.ts:84`; `packages/core/src/domain.ts:41` |
| NA-15 | Low | Analytics route names miss screens that exist: Recently deleted, Backup, Licenses, If you are struggling, Hidden books, Plus is on, Leave book. Analytics are off for the 1.0 line (D-124), so this costs nothing to fix before they turn on. | `packages/analytics/src/catalog.ts:139-169` |
| NA-16 | Low | `read_together_started.access: plus or free` still models Read together as gated, which D-082 removed. | `catalog.ts:607` |
| NA-17 | Low | The store subtitle "Baby journal in your own voice" uses "journal", which the glossary bans outside keywords. It is deliberate (the comment says it adds search words the name lacks) but no exception is recorded. | `packages/brand/index.ts:81-82` |
| NA-18 | Low | The design language section 12 still uses names the app dropped: "Another prompt", "Done", "Discard", "Save letter", "Edit text", "Asha's Book", "Invite someone", word highlighting. BRAND.md line 38 says the book is shared at v1.0. `capabilities.ts:3` says server features are on in v1.0; the store and testflight profiles set them off. | `docs/design/DESIGN_LANGUAGE.md:243-281`; `packages/content/BRAND.md:38`; `apps/mobile/src/lib/capabilities.ts:3`; `apps/mobile/eas.json:63,79` |
| NA-19 | Low | Dead copy carries names that differ from live ones and could leak back: "Names and words", "Quick note", "Notes" filter, "Keep this as said", "Invite co-parent", "Sign out other devices". | `strings.en.ts:178,202,400-441,496,717,722` |
| NA-20 | Low | "page" means a day's slot, the book, and a screen ("This page did not open"). | `strings.en.ts:501,626,630,1004` |
| NA-21 | Medium | Three uses of Keep pull against each other: Keep commits a letter, "Keep it here for now" is the gate's way out without committing, and "Keep it" cancels a delete. Write's commit button says "Save", while Review's says Keep. | `strings.en.ts:229,246,773`; `features/billing.en.ts:56-58` |
| NA-22 | Low | One setting, two labels: "Sign my letters as" and "Sign my letters to {child} as". A reminder says "Say it out loud and we will keep it", which has the app doing the keeping. | `strings.en.ts:620,719,910`; `features/reminders.en.ts:15` |
| NA-23 | Low | PR #420's new glossary row points at "Settings > Languages and speech", which does not exist. Languages are under Writing > Spoken language; downloads are under Recordings and Storage. | #420 `packages/content/BRAND.md` (new internal-terms table); [IA.md](IA.md) |
| NA-24 | Low | The Settings section "Your data" holds Recordings and Storage, which are about the phone's space and the speech downloads as much as data. | `apps/mobile/src/app/settings/index.tsx:106-113` |

Not a finding: `data/entries.json` in the export keeps its name; it is a format contract (D-096, CR-22).

## 3. Rulings (Karma)

All T1, two-way, unless marked. Copy and UI work lands after the go/no-go (Mon 9 Nov, D-130): the freeze starts Tue 3 Nov and two active branches touch `strings.en.ts`. An independent challenger read the first draft; what it changed is in section 6.

**R-A. The Word for word setting becomes a choice, not a switch (NA-01, NA-11).** The feature keeps its name (D-074, D-086, CR-21). D-086 asks for "a Settings switch for the default", and a two-value choice is that setting without the backwards reading. On the Recordings page, the section "How transcription works" becomes "Word for word", and its one row becomes "Show spoken letters", a checkmark list with the two values Review already uses: "With small fixes" and "Exactly as said". Typed letters are never touched (D-057, D-109 item 8), which is why the row says spoken. Way back: restore the switch strings. Revisit if a tester still misreads it on a device.

**R-B. Keep commits a letter, and only that (NA-09, NA-10, NA-21, NA-22).** This is my UX call, not a founder decision: D-083 has the parent tap Keep and the free count is of letters kept, and F06-REQ-043 (PRD V2) says "Save" instead. I'm keeping Keep, because the count, the gate and the store lines already speak it, and amending F06-REQ-043 through the PRD lane. To make Keep mean one thing:
- Write's commit button becomes "Keep", like Review's.
- The gate's way out uses F06-REQ-043's own words, "Leave it waiting".
- The safe choice on a delete sheet becomes "Cancel", as iOS does it.
- Putting a kept letter in the book always reads "Add to {child}'s book" ("Add to the book" only with no name). "Keep private" in Review and "Make private" on a letter stay; they say different things on purpose.
- Save stays only for drafts saving themselves and for files ("Save or share").
- The reminder "we will keep it" becomes "keep it for {child}". One label for the signature: "Sign my letters to {child} as".

**R-C. "Plan" stays the Settings title (NA-05, NA-06).** I proposed renaming it to "Plus"; the challenge showed "Settings, Plan" is the cancel and refund path written into the Terms, the Subscription Terms and D-094, so renaming it is counsel's business and buys nothing. Only the period labels change: "Plus Monthly" and "Plus Annual" everywhere, as D-077 already says. "Membership" stays out of copy.

**R-D. Notes (NA-02, NA-07).** The store listing drops its notes lines, applying the founder's call that public copy describes only the on-device v1.0 (issue #127 item 3, D-121); the store agent makes the change in its submission PR and counsel's proposal follows. In the app, "A note about Plus" and "A yearly note" stay until the legal lane changes the Terms' "as a note in the app"; the glossary records that exception. The Family teaser lines are hidden in the store build (D-126) and change with the v1.1 copy. The export readme says "Every letter".

**R-E. "member" leaves parent-facing copy (NA-08).** Those lines are on server surfaces, so they change with the v1.1 copy: "{child}'s other parent" now, "family" when family arrives. The Terms change goes to the legal lane with counsel (D-125).

**R-F. Small consistency fixes (NA-12, NA-13).** Buttons keep Apple's "Open Settings"; prose says "the Settings app". With no name shown, the child is "your child"; "your little one" leaves the reminders. The crisis line keeps "you or your baby", because it is about safety, not voice.

**R-G. Analytics before they turn on (NA-15, NA-16, NA-14).** The route list gets the missing screens, `read_together_started` drops `access`, and `family_letter_reviewed.decision` uses the database's `set_aside`. Analytics are off for the 1.0 line (D-124), so nothing live changes. The `coparent` email ids and teaser events keep their names: they are pinned by tests, D-126 hides the teaser, and renaming for style is what DB-R05 tells us not to do.

**R-H. Record the subtitle exception (NA-17).** The subtitle stays. BRAND.md gets a line saying "journal" is allowed in the store subtitle and keywords, for search only. Changing the subtitle would be new store copy, so that would be the founder's call; I don't recommend it.

**R-I. Docs follow the code (NA-18, NA-19, NA-23, NA-04).** DESIGN_LANGUAGE section 12 is refreshed against the app; BRAND.md line 38 and the `capabilities.ts` header are corrected; unused strings are deleted; CODE-R07 and DB-R05 point at BRAND.md; #420's Settings path is corrected before it merges. The website thread chooses one copy source for the site and deletes or wires the other.

Not ruled: NA-24 (the "Your data" grouping) waits for the design lane's next Settings pass, since moving rows during the freeze costs more than it buys.

## 4. Rows to add to the BRAND.md glossary (after #420 merges)

| Concept | Use | Banned in copy | Notes |
|---|---|---|---|
| Committing a letter | Keep; "Kept." | save (for a letter), store, submit | R-B. Save is for drafts and files only. |
| Not committing at the gate | "Leave it waiting" | "Keep it here for now" | R-B, F06-REQ-043. |
| Putting a letter in the book | "Add to {child}'s book" | Add to book, publish, share | R-B. |
| The Plus place in Settings | Plan ("Settings, Plan") | | R-C. Fixed by the Terms; the product is still Plus. |
| What the app sends about Plus | "A note about Plus", "A yearly note" (until the Terms change) | | R-D. The only "note" exception. |
| The iPhone's own settings | "Open Settings" on buttons; "the Settings app" in prose | | R-F. |
| The child, when no name is shown | your child | your little one, the baby, the kid | R-F. The crisis line may say "your baby". |
| Store subtitle | "Baby journal in your own voice" | | R-H. The only place "journal" is allowed besides keywords. |

## 5. Fix packages

| Pkg | What | Owner lane | When |
|---|---|---|---|
| FP-1 | R-A, R-B, R-D (export readme), R-F: copy, with rules-test lines for the new banned words | content + mobile | After the go/no-go, Mon 9 Nov |
| FP-2 | R-D in the store listing and counsel's proposal; R-H line in BRAND.md | store agent | With the submission PR |
| FP-3 | NA-03, NA-04: website copy fixes and one copy source | website thread | Its next PR on `main` |
| FP-4 | R-G analytics | analytics | After the go/no-go |
| FP-5 | R-E and the Family teaser lines | content | With the v1.1 copy |
| FP-6 | R-I docs, and the section 4 rows | docs | After #420 merges |
| FP-7 | R-B in F06-REQ-043; R-D and R-E in the Terms | PRD lane; legal lane with counsel | Next PRD update; counsel round |

## 6. Debate record

An independent agent challenged the first draft, read-only, with the decisions, BRAND.md, VOICE.md and #420 in front of it. 15 of 16 spot-checked citations held.
- Accepted:
  - Dropped the Plan to Plus rename (R-C). The Terms and D-094 name "Settings, Plan" as the cancel path.
  - Kept "note" in the two plan lines the Terms describe (R-D).
  - Corrected the `withdrawn` claim and narrowed R-G. Email ids stay.
  - Said plainly that R-B is my call amending a PRD requirement, not a founder decision.
  - Fixed the other two uses of Keep.
  - Changed the R-A label from "New letters open", which read two ways and was wrong for typed letters, to "Show spoken letters".
  - Used Apple's "Open Settings".
  - Exempted the crisis line.
  - Added NA-21 to NA-24.
  - Corrected one line number.
- Rejected: the challenger's view that the store notes lines need a founder question. Removing a line that describes a feature the build doesn't have applies the founder's existing call (issue #127 item 3), and it goes through the store agent and counsel as usual.
- Not acted on: one challenger point, that a notification titled "Dear {child}," conflicts with D-084. D-084 is about the quiet-day sentence, so I found no conflict.

Karma
