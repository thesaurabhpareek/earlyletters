# Function review: legal (LEG)

Status: draft for Karma's ruling, 20 Nov 2026. Backlog row BL-995. Author: `legal` (a Claude role drafting for counsel). Docs only.

> **Not legal advice.** This file was written by a Claude session playing the legal drafting role. It is not a lawyer, holds no licence, and no attorney-client relationship exists. Every legal reading below is a question for counsel, marked "counsel must confirm". Nothing here says that anything is compliant or legal. Counsel numbers are from `docs/legal/COUNSEL_PACKET.md` 1.5.0; a new question says "needs a number from legal" because this review may not edit the packet (BRIEF rule: write only your own file).

Scope (from the task): the Terms and Privacy Policy changes each card needs, notices at collection, consent records, account deletion text, IP and licences (fonts in the printable book, picture rights), co-parent removal (Q53), the shared letter, sealed letters and minors, and the counsel packet questions. The compliance side (obligations register, App Review, labels, gate evidence, the sign-up path, accessibility as a duty) is in `compliance.md`.

Tags: [F] fact read this session in a named file. [S] outside source read this session (URL and date in section 8). UNVERIFIED: not read or not run this session.

## 1. What I reviewed, and what I did not

Read in full or in the sections named, on branch `docs/locked-pack-inputs-20nov` at `7d0446d02` (20 Nov 2026, 05:36 UTC):
- `docs/product/prd/functions/BRIEF.md`; `README.md`; `00-product-frame.md` (all); `14-test-plan.md` (all); `16-council-review-round-2.md` (all); `18-errata-after-lock.md` (all); `GAP-LOG.md` (all).
- Cards `01` to `11`: for every card, sections 3 (what), 12 (door lines), 17 (legal inputs), 18 (label effect), 19 (claims), 20 (free or Plus), 22 (gates) and 23 (open questions); plus NS-01 sections 11 to 16 and rows R18, R19, R28, R30 to R32; NS-05 rows R1 to R27; NS-06 section B10.1; NS-25 rows R1 to R19 and gates; NS-26 to NS-31 decision records. Card `12` and `13` by title only.
- `docs/BACKLOG.md` rows BL-990 to BL-999 and the rows found by search (BL-119, BL-404, BL-444). I did not read BL-922 to BL-989 one by one; where a row is cited below it was found by search.
- `docs/legal/`: Terms of Service 4.1.0, Privacy Policy 3.0.0, COUNSEL_PACKET 1.5.0 (all); ENGINEERING_REQUIREMENTS 2.2.0 (header, LEGAL-REQ-012 to -014, -029 to -032, -040 to -045, -051 to -060, -064); POLICY_VERSIONING 1.4.0 (sections 1, 2, 6, 7.3); compliance-register 1.6.0 (row index); app-store-privacy-labels 2.2.0 (sections 3.4, 5, 6); `beta/terms-0.9.0.md` and `beta/privacy-0.9.0.md` (by search); `delete-account-page.md` 1.1.0 (by search).
- Code, read not run: `packages/content/src/pages.en.ts:236-244`; `apps/mobile/src/lib/auth/consent.ts:95-117`; `apps/mobile/src/lib/backup/runtime.ts:295-315`; `supabase/migrations/20261002020000_data_governance.sql:632-635`; `supabase/migrations/20261108000000_consent_record_fields.sql`; `packages/design-tokens/fonts/` and `apps/web/src/scenes/parts/act3/fonts/` (font files and OFL notices); `packages/brand/registry.ts:146-156`.
- `docs/DECISIONS.md` D-113, D-157 to D-162. `docs/store/app-store-connect-1.0.md` sections 1 to 7; `docs/store/notes-for-review-1.0.txt`.
- Design branch `origin/docs/e2e-ux-20nov` at `76c1e9971`: the screen inventories of areas A to E (`docs/design/e2e/*/DESIGN.md`), and area E's first-run and age-gate sections.
- Skills: `.claude/skills/early-letters-clo/SKILL.md`, `.claude/skills/regulatory-compliance/SKILL.md` and its `references/checked-facts.md`.

Not read, and why:
- `docs/product/prd/19-from-download-to-first-letter.md` (NS-38 to NS-45) does not exist on this branch or any fetched branch (BL-994 is in progress). Section 2 marks those cards "not on disk".
- `docs/product/prd/inputs/first-run-compliance.md` does not exist yet. The sign-up path is in `compliance.md` section 3, written to be reconciled with it when it lands.
- The e2e `WORDS.md` files and prototypes; the design system files. The memos `lawyer-1.md`, `lawyer-2.md` (AI reviews, not counsel; not relied on). Project docs in the claude.ai Project (no Projects tool in this session), including `ip/IP-DECISION-MEMO-2026-10-28.md`.
- No law text was read in full. Outside facts are limited to the sources in section 8.

## 2. Coverage verdict per card (legal)

Covered = the card already carries what legal needs. Partly = the card names the issue but a legal text, notice, record or gate is missing. Missing = a legal need the card does not name.

| Card | Verdict | Why (and the FR that closes it) |
|---|---|---|
| NS-01 Photo with a letter | Partly | R31 fixes only `pages.en.ts:240`; Privacy 7 and `delete-account-page.md` still need the picture lines (FR-LEG-02). Privacy 2 says we do not collect "photos" while the app now keeps pictures on the phone: true of our servers, but it needs the on-phone line R32 asks for (FR-LEG-01). No Terms line on the right to add a picture (FR-LEG-14). |
| NS-02 Find | Covered | No legal text changes; index on the phone, query never stored (R15). Deletion lines name the index with pictures (FR-LEG-02). |
| NS-03 Pilot | Partly | Consent texts W and V are written; the new counsel question has no number, and the consent text has no document key in POLICY_VERSIONING (FR-LEG-11). |
| NS-04 Hands-free spike | Covered | No parent; NS-04b writes door lines. |
| NS-05 Share one letter | Partly | No Terms or Privacy line says what sharing is, that we receive nothing, and that it cannot be taken back (FR-LEG-05). Q45 gates the picture toggle; card says so. |
| NS-06 A Firsts | Partly | A synced label that may be a health fact; the Privacy Policy does not list first marks and labels (FR-LEG-08). |
| NS-06 B Sealed letter | Partly | No Terms or Privacy text for "hidden until a day" (FR-LEG-06); the minors question has no number (FR-LEG-07; section 7); D6 deletion line not in the legal texts (FR-LEG-02). |
| NS-06 C Quick capture | Covered | Legal side n/a until NS-04b; App Review side in `compliance.md`. |
| NS-07 C5 Quiet day | Covered | Terms 8.1 already says quiet-day marks do not count. |
| NS-07 C28 Printable book | Partly | The CLO "NEEDS EVIDENCE" on OFL embedding is now answered [S]; a font allowlist and the Terms 5.6 print-shop wording are missing (FR-LEG-12, FR-LEG-13). |
| NS-07 G11 Label guard | Covered | Legal owns no part of the guard. |
| NS-08 Backup readiness | Partly | Door lines written; the consent record the code sends cannot be stored by today's schema (FR-LEG-09); Privacy 4 operational facts need the founder's confirmation before any flip (FR-LEG-16). |
| NS-09 Let it go | Covered | Privacy 7 could name the let-go server copy (P2, FR-LEG-17). |
| NS-10 New phone | Partly | Door line uses method `tap`, which the schema refuses (FR-LEG-09). Terms 3.1 says no account is needed, while D-160 requires sign-in in the store build (FR-LEG-04). |
| NS-11 Save a copy | Covered | No legal text unless the "as private as where you put it" line uses a safety word (Q43). |
| NS-12 Earlier versions | Partly | Privacy 7 does not say earlier versions are kept until removed (FR-LEG-17). |
| NS-13 Reminders | Covered | Privacy 5 already says reminders show a child's name only if turned on. |
| NS-14 Whose book | Covered | No new data. |
| NS-15 Another day | Covered | No new data. |
| NS-16 Someone else speaks | Partly | Terms 5.5 covers recordings of other adults, not a typed name or a letter signed as someone else; child speaker not tagged `child-input` (FR-LEG-15; `compliance.md` FR-CMP-14). |
| NS-17 Second language | Partly | Packet Q9 (training-data terms) is named, but no per-pack licence record gates the listing (FR-LEG-13). |
| NS-18 Typed days | Partly | Privacy 5 says no letter text in a notification; typed-day words in a notification are opt-in and not letter text, but the policy should say so (FR-LEG-08). |
| NS-19, NS-20 | Covered | Not built; nothing to publish. |
| NS-21 Letter page | Covered | "Who can read it" and Delete reuse existing texts. |
| NS-22 Book header | Covered | Settings only. |
| NS-23 One past letter | Covered | Nothing reaches a notification. |
| NS-24 Read the year back | Covered | Ruling T1 matches Terms 8.2 and 8.4 (Read together free today, not in the permanent list); Q40 stays open. |
| NS-25 The other parent | Missing (three items) | Terms 4.3 and 10.1 promise "leave a book at any time" while D-113 hides Leave; the invite and accept do not state the 72-hour and no-removal rule before anyone agrees; the safety route Terms 4.4 relies on has no door in the app (FR-LEG-03, FR-LEG-10; consent records FR-LEG-09). |
| NS-26 to NS-31 | Covered (parked) | Decision records name the counsel questions (Q54(d), Q45, Q42, Q47, Q11). |
| NS-32 Notification budget | Covered | Q41 named; plan notices outside the budget. |
| NS-33 Accessibility | Covered (legal) | LEGAL-REQ-051 named; the duty itself is in `compliance.md`. |
| NS-34, NS-35, NS-37 | Covered | No legal text. |
| NS-36 Data follows the letter | Partly | Rule 4 puts each new field in the data inventory, but no rule puts it in the Privacy Policy and the notice at collection in the same release (FR-LEG-08; card change C-12). |
| NS-38 to NS-45 | Not on disk | `19-from-download-to-first-letter.md` is not written yet. What legal needs from them is FR-LEG-04, FR-LEG-09 and `compliance.md` section 3. |

## 3. Function requirements (legal)

Owner lanes: `legal` drafts legal texts and the counsel packet; `content` owns every in-app and website word; `privacy` owns the data inventory and consent schema; the founder approves and publishes (D-125). Every row is a draft for counsel; counsel must confirm each legal reading.

| Id | Requirement (Given, When, Then where testable) | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-LEG-01 | Given a build with `EXPO_PUBLIC_PHOTOS` on, When a reader opens the Privacy Policy version that build links, Then section 2 "Your book" names pictures, the words about a picture and its place as kept on this phone only and never sent to our servers, and "What we do not collect" says "photo library" rather than "photos". The same release bumps the Privacy Policy (minor under POLICY_VERSIONING 2.2 if counsel agrees no new collection; major if not). | NS-01-R26, R32, R61; NS-01 section 18; A-S03, B-S11; BL-931 | P0 (b) | legal, content | `privacy-policy.md:35,45` [F]; Apple: on-device data is not "collected" [S2]; CalOPPA 22575 via CLO skill (secondary) |
| FR-LEG-02 | Given any build, When the deletion texts are read (in-app delete sheet C-S20, `pages.en.ts:236-244`, `delete-account-page.md`, Privacy 7), Then each says: (a) with photos on, pictures and the Find index live only on the phone, account deletion cannot reach them, and Erase everything or deleting the app removes them; (b) with seals on, letters hidden until a day are deleted with the account (D6); (c) only systems the build uses are named: no "status of your Plus plan that the app reported to us" while the status report is off, and no analytics provider while analytics is off. A content test fails on (c) for the build's flags. | NS-01-R31; NS-06-B18 (D6); NS-02; C-S20, C-S19; LEGAL-REQ-029, -064 | P0 (b) | content, legal | `pages.en.ts:240-242` names photos, the status report and an analytics provider [F]; Apple deletion page: "let people know what information will and won't be retained" [S3] |
| FR-LEG-03 | Given a store build in which Leave is hidden (D-113), When the Terms version it links is read, Then no sentence says a parent can leave a book "at any time"; sections 4.3 and 10.1 carry the 0.9.0 wording ("not in the app yet; when it is...") until BL-444 ships Leave. Given NS-25's flag on in production, Then either BL-444 has shipped or the Terms say Leave is not available. | NS-25 section 3 (Leave not offered), gates; D-113; BL-444; D-S18 | P0 (a) | legal, founder | Terms 4.1.0 4.3 and 10.1 [F]; `beta/terms-0.9.0.md:66` already says "not in the test app yet" [F] |
| FR-LEG-04 | Given the store build requires sign-in (D-160), When the Terms and Privacy Policy that build links are read, Then Terms 3.1 does not say "you can write and keep letters on your phone without an account", and the Privacy Policy "Which builds" section no longer says the first App Store build has servers off. Both are rewritten to Build 12 facts (servers on, sign-in required, backup and status report off) before submission. | NS-10 section 17; NS-38 to NS-45 (when written); E-S02, E-S03, E-S07; LEGAL-REQ-064 | P0 (b) | legal, founder | Terms 3.1 [F]; `privacy-policy.md:21` [F]; D-157, D-160 [F]; `app-store-connect-1.0.md` section 4 marks the policy URL BLOCKED [F] |
| FR-LEG-05 | Given NS-05 Level 1 on in a build, When the Terms and Privacy Policy that build links are read, Then the Privacy Policy says that a letter you share leaves through your own phone's share sheet, that we do not receive it, learn the app or the person, or keep any record that it was shared, and that it cannot be taken back once sent; and the Terms say you share only your own letters, and that a picture of your child or of another adult goes wherever you send it. No claim says "private" or "secure" about a sent letter. | NS-05-R3a, R3b, R5b, R7, R12, R24; D-S01, D-S02; Q45, Q48, Q43 | P1; P0 (b) for the picture line while Q45 gates the toggle | legal, content | NS-05 section 12 and rows [F]; Terms 5.4 covers only the co-parent [F] |
| FR-LEG-06 | Given NS-06 Part B on in a build, When the Terms and Privacy Policy that build links are read, Then they say: only the author sees a letter hidden until a day; other readers of the book get it from that day; it is hidden in the app, not locked or encrypted; the day can come early on a phone whose clock is changed or in a time zone to the west; Open now ends the hiding for good; the letter counts as a kept letter; deleting the account deletes it (D6); and we never deliver it to anyone, the child included. The server stores the sealing zone's UTC offset, and the texts never describe the seal as location-free. | NS-06-B1, B2, B3, B12 (door lines), B17; B-S13, B-S14, B-S16; CR-62; Q43, Q49, Q50, Q54, Q20 | P0 (a) | legal, content | NS-06 B12 and B17 [F]; Terms 4.2 knows only "private" and "in the book" [F] |
| FR-LEG-07 | Given the seal date sheet (B-S13), Then it offers no age-keyed choice ("at 18", "on their 18th birthday", "when they are grown"), no store, site or in-app line says a letter is "for when they turn 18" or "delivered to your child", and no feature asks a child to sign in to read a letter. A content scan over `packages/content` and the date sheet's options fails on any match. Until counsel answers the minors question, the latest day stays the 25th birthday (NS-06 OQ-B3) and is a date, never an age. | NS-06-B9, B17, B18 (claims), OQ-B3; B-S13 | P0 (b) pending counsel | content, legal | NS-06 B3 and B18 forbid the wording [F]; question in section 7 (L-2) |
| FR-LEG-08 | Given any card whose flag adds a field that reaches our servers or a notification, When its flag turns on in production, Then in the same release the Privacy Policy section 2 lists it and the place it is collected shows a notice or a link (CCPA notice-at-collection reading, Q20). Today this means: first marks and their labels (NS-06 A, synced, may state a health fact, Q32); the hidden-until day, instant and sealing UTC offset (NS-06 B); the From name of someone who is not a user (NS-16, Q48, Q54 proposed (f)); earlier versions kept until removed (NS-12, Q51); typed-day words, which stay on the phone and show in a notification only when the parent turns that on (NS-18). | NS-06 A10, B10; NS-16-R3 to R6; NS-12; NS-18 section 12; NS-36 rules 4 and 6; A-S09, B-S12, B-S13, D-S08 | P0 (b) | legal, privacy, content | Privacy 2 lists letters, names list and children only [F]; NS-36 rule 4 covers the inventory, not the notice [F] |
| FR-LEG-09 | Given every PRIV-R21 consent act a card names, When the app records it, Then `record_policy_act` accepts the method and surface the card names, and POLICY_VERSIONING 7.3 has a row for it. Today the code and schema disagree in two places: `backup/runtime.ts:308` sends method `backup_sheet`, and NS-10's door line names method `tap`; the `policy_acceptances.method` check allows neither (`20261002020000_data_governance.sql:632-634`). NS-25's `invite_accept` and invite-created acts and NS-10's `returning_consent_sheet` have no 7.3 row. Each act also carries the rendered text hash PRIV-R21 asks for; `consent.ts:104-116` and `runtime.ts:304-314` pass none (read, not run). | NS-08 section 12; NS-10 section 12; NS-25-R17, section 12; E-S07, C-S11, D-S16, C-S21; PRIV-R21; BL-577 | P0 (b) | privacy, data-architect, legal (7.3 rows) | code and migration lines named [F]; whether a later branch changes the check is UNVERIFIED (grep of `supabase/migrations` found no other method list) |
| FR-LEG-10 | Given the inviter on the invite sheet (D-S13) and the invitee on the accept sheet (D-S16), Before either agrees, Then each reads, in plain words: the other parent will read every letter in the book that is not private, including earlier ones (NS-25-R16); the inviter can undo the join for 72 hours; after that neither parent can remove the other; and where to go if they feel unsafe. The accept act's record names the Terms version that carries this rule. | NS-25-R13, R16, R17; D-S13, D-S16, D-S19; Terms 3.3, 4.2, 4.4; Q53, Q48; D11 | P0 (b) | content, legal | NS-25-R16 states only what is shared, not the removal rule [F]; Terms 4.2 [F] |
| FR-LEG-11 | Given the NS-03 pilot, Then each consent text (W and V) has a document key (proposed `pilot-consent`), a version and a sha256 in POLICY_VERSIONING section 1 marked "outside the app, never in `policy_acceptances`"; the record kept is the one NS-03 section 15 names; the texts are marked draft for counsel; and Arm V does not start before the Q45 read is on record. | NS-03-R1 to R8, section 15, section 20; D-S23; D4; Q44, Q45, Q51 | P0 (b) | legal, user-research | NS-03 section 15 [F]; POLICY_VERSIONING section 1 has no such key [F] |
| FR-LEG-12 | Given the printable PDF (NS-07 C28), When the PDF builder embeds a font, Then the face is on an allowlist whose every entry has its licence file in the repo and a licence that permits embedding in documents (today: Literata, Mukta, Tiro Devanagari Hindi under OFL 1.1 in `packages/design-tokens/fonts/`; for Arabic and Chinese, Amiri and Noto Serif SC, whose OFL notices sit in `apps/web/src/scenes/parts/act3/fonts/` and would move to the shared fonts folder). A test fails on a face with no licence file beside it. Me, Licences lists every face the app or the PDF embeds. | NS-07-C28 section 4.17; C-S05; CR-123; NS-30 | P0 (b) for the allowlist; P1 for the Licences list | mobile, legal | OFL FAQ 1.12 and 1.13: embedding in a document is allowed, in full or subset, and does not change the document's licence [S5]; none of the three app OFL notices names a Reserved Font Name [F] |
| FR-LEG-13 | Given a speech pack for a second language (NS-17) or any font, model or image added to the app, Then a licence record (licence, URL, date read, and for model weights the training-data terms question of Q9) exists before the item ships in a store build, and the store listing names only languages whose pack has that record. | NS-17-R4, section 17; CR-123; Q9, Q12; ADR 0015 | P0 (b) for NS-17 in production | speech, legal | NS-17 section 17 names Q9 [F]; CLO skill section 9 quotes ADR 0015 [F] |
| FR-LEG-14 | Given the Terms that ship with NS-01, Then section 5 gains: add only pictures you took or have the right to use; a picture that shows another adult needs their agreement; you keep the rights you have in your pictures, and you give us no licence to them because they never leave your phone. The store and site never show a real child; screenshots use illustrated or licensed images of the fictional Asha, with the licence recorded in `packages/brand` registry. | NS-01 section 12 (another adult), section 19 (screenshots); Q48; Terms 5.1, 5.2, 5.5 | P1 | legal, marketing | Terms 5.2 licenses Your Content to us for running the Service [F]; the picture never reaches us (NS-01-R61) [F] |
| FR-LEG-15 | Given NS-16 on in a build, Then the Terms say: if you sign a letter as someone else, do it only with their agreement; they are not a user and the letter is yours under these Terms (counted, stored and deleted as yours); never record or sign as a child. The From sheet (A-S09) keeps its instruction line (D9). Counsel answers Q48 and Q45 (a child speaking) before the flag is on in production. | NS-16-R3 to R6, section 17, D9; A-S09; Q45, Q46, Q48, Q54; LEGAL-REQ-059 | P0 (b) | legal, content | Terms 5.5 covers recordings only [F]; NS-16 section 17 [F] |
| FR-LEG-16 | Given the NS-08 flip is proposed, Then the counsel draft (NS-08 deliverable 4) starts from Privacy 4 as written and lists each operational fact it asserts for the founder to confirm in writing (two sealed paper copies in different places, quarterly seal check, 24 or 72 hour hold, 7-day device rule, email on each use), and the Terms 7.2 and Privacy 4 versions are major under POLICY_VERSIONING 2.1 item 1 with re-consent. | NS-08 deliverable 4, section 12, section 17; C-S21; Q42, Q47, Q51, Q54; LEGAL-REQ-023, -061 | P1 now; P0 (a) at the flip | legal, founder | Privacy 4 [F]; COUNSEL_PACKET section 6 item 7 [F] |
| FR-LEG-17 | Given NS-09 and NS-12 on, Then Privacy 7 says: a draft you let go that reached our servers is erased there when your phone tells us, except under a legal hold (D7, errata E8); earlier versions of your words are kept until you remove them or delete the letter, and are then erased on the same clock as a deleted letter (D8). | NS-09 D7; NS-12 D8; errata E8; Q51 | P2 (NS-09), P1 (NS-12) | legal | Privacy 7 [F]; `18-errata-after-lock.md` E8 [F] |
| FR-LEG-18 | Given counsel is engaged (BL-104), When the packet is sent, Then it is version 1.6.0 or later and: its product paragraph describes Build 12 (servers on, sign-in required, backup and status report off, photos phone-only) rather than option B with optional sign-in; it carries the new questions of section 7 with numbers; and each card that a counsel read gates (NS-01 label line, NS-05 picture, NS-06 B, NS-16, NS-25) is listed with the question number and the default. | all cards' section 17; README "Reads that gate anything"; BL-104 | P0 (b) | legal | COUNSEL_PACKET 1.5.0 section 0 paragraph describes optional sign-in [F] |
| FR-LEG-19 | Given any legal draft changed under this review, Then it carries `status: draft-for-counsel`, a new version under POLICY_VERSIONING 2.4 (never reused), a changelog row, and no internal id in published text (LEGAL-REQ-064). Version collisions between parallel branches are checked with `node scripts/agents/next-id.mjs` or by reading open PR diffs before merge. | all; LEGAL-REQ-064 | P1 | legal | POLICY_VERSIONING 2.4 [F] |

## 4. Design needs (legal)

Keyed to the e2e screen ids on `origin/docs/e2e-ux-20nov` at `76c1e9971`. Words are intent; `content` writes, the founder approves, counsel reads the ones marked.

| Screen | Need | FR |
|---|---|---|
| C-S20 Delete account | Lines for pictures and the Find index (stay on this phone until Erase everything), hidden-until letters (deleted with the account), and no line about a status report or analytics the build does not have. State for photos on and off; seals on and off. Counsel reads. | FR-LEG-02 |
| C-S19 Erase everything | Names pictures among what is erased (already in NS-01-R52 scope; confirm the words name them). | FR-LEG-02 |
| D-S13 Invite sheet, D-S16 Accept | Add the removal rule (72-hour undo by the inviter, then no removal) and one line on where to go if someone feels unsafe; the accept sheet's Terms link opens the version recorded. Counsel reads. | FR-LEG-10 |
| D-S18 Family page | No Leave row and no "coming soon" (D-161, D-113); if BL-444 ships first, Leave with the choice "leave my letters in the book" or "take them out", nothing preselected (Terms 4.3). | FR-LEG-03 |
| New screen needed: Report a concern (Me, Help) | A plain route for a safety worry or a co-parent problem, opening support with no letter content prefilled (LEGAL-REQ-056). Needed before NS-25 is in a store build, because Terms 4.4's safety limit has no door today. | FR-LEG-10 |
| D-S02 Share preview | Keep the where-it-goes line (R24). When the picture toggle is on, one line that the picture goes wherever the letter goes. No "private" or "secure" word. Counsel reads with Q45 and Q43. | FR-LEG-05 |
| B-S13 Hide until a day | The honest limits as NS-06 B12 lists, plus "Only you can see it until then; we never send it to anyone". No age presets in the picker; a date only. Counsel reads. | FR-LEG-06, FR-LEG-07 |
| B-S16 Sealed card, B-S22 Recently deleted | No words, no countdown; nothing else from legal. | FR-LEG-06 |
| A-S09 From sheet | Keep "Ask before you record someone else"; add nothing that reads as an attestation (D9). | FR-LEG-15 |
| A-S03 Picker | The NX-33 label line stays absent until counsel's Q43 read (NS-01 section 12). | FR-LEG-01 |
| C-S05 Making the printable book | No licence text is needed inside the PDF (OFL FAQ 1.10, embedded in a document) [S5]; no design change. Me, Licences (C-S01 path) lists the faces. | FR-LEG-12 |
| E-S03 Age gate, E-S07 Agreements | Terms and Privacy links open the exact versions the act records; the agree line is unchanged until FR-LEG-04's rewrite is approved. | FR-LEG-04, FR-LEG-09 |
| C-S11 Returning consent sheet | Records with an allowed method (FR-LEG-09); no design change. | FR-LEG-09 |
| C-S21 Recording backup (flip only) | The consent sheet with D-102 wording and the versioned Privacy 4 link; decline and withdraw states. Drawn now, built at the flip. | FR-LEG-16 |
| D-S23 Pilot artefacts | Consent W and V shown with their version; withdrawal line "we delete your notes" (NS-03 section 15). | FR-LEG-11 |

## 5. Card changes I propose (for Karma to rule)

| # | Card row | Change | Why |
|---|---|---|---|
| C-1 | NS-25 section 12 (Invite, Accept) and a new row NS-25-R20 | Invite and accept state the 72-hour undo and the no-removal rule before agreement; P0 (b: consent design, Q53, Q48) | A permanent, one-way sharing term should be read before the act, not only in the Terms (FR-LEG-10) |
| C-2 | NS-25 section 22 (gates) | Add: Terms 4.3 and 10.1 match the build's Leave (FR-LEG-03); a Report a concern route exists (LEGAL-REQ-056) | Terms promise Leave and a safety limit that the build has no door for |
| C-3 | NS-01-R31 | Extend from `pages.en.ts:240` to Privacy 7 and `delete-account-page.md`, and add the build-truth clause (no status report or analytics lines while off) | The legal texts make the same promise as the in-app page (FR-LEG-02) |
| C-4 | NS-06-B17 and B18 | Add a P0 (b) row for FR-LEG-07 (no age-keyed seal choices or claims; content scan) and cite the new counsel question once numbered | Minors and delivery are a counsel question; the card forbids the claim but has no test |
| C-5 | NS-06-B12 and B17 | Add the Terms and Privacy lines of FR-LEG-06 as a dependency of the production flag | The seal changes who sees what, a major change under POLICY_VERSIONING 2.1 item 8 |
| C-6 | NS-07 section 4.17 | Replace "CLO: NEEDS EVIDENCE" with the OFL FAQ 1.12 and 1.13 reading [S5] and add the font allowlist row (FR-LEG-12) | Evidence now read; one test closes the rest |
| C-7 | NS-08 section 12 | Reconcile the record: card says surface `backup_sheet`; code sends method `backup_sheet` and surface `settings.backup`; schema allows neither method. Pick method `consent_sheet`, surface `backup_sheet` (or `settings.backup`) and add a P0 (b) row | Otherwise the backup consent act is refused at the flip (FR-LEG-09) |
| C-8 | NS-10 section 12 | Method `tap` becomes `consent_sheet` (or `reconsent_sheet`), surface `returning_consent_sheet` | The schema check refuses `tap` (FR-LEG-09) |
| C-9 | NS-16 section 17 | Add the Terms line of FR-LEG-15 as a production gate, and tag the flag `child-input` (LEGAL-REQ-059) | A sibling speaking puts a child's voice in a letter with our knowledge |
| C-10 | NS-05 section 17 | Add the Terms and Privacy lines of FR-LEG-05 as a production gate | Sharing has no description in the legal texts |
| C-11 | NS-10 section 17 | Add Terms 3.1 and the Privacy "Which builds" section to the gate (FR-LEG-04) | The store build requires sign-in (D-160) |
| C-12 | NS-36 section 3 | Add rule 9: the Privacy Policy and the notice at collection name the field in the same release as the flag | Rule 4 covers the inventory, not what a parent is told (FR-LEG-08) |
| C-13 | README "Reads that gate anything" | Add: counsel Q48 and Q45 for NS-16; Q53 and Q48 for NS-25; the minors question for NS-06 B (already in the card); Q45 for the NS-05 picture toggle | One place lists every counsel gate |
| C-14 | `00-product-frame.md` section 4 and README ground rules | "D-161 as drafted in #827" becomes "D-161 (DECISIONS.md, decided 11 Nov 2026)"; D-160's "coming soon" half is superseded | D-161 and D-162 are on `develop` (`docs/DECISIONS.md:668-669`) [F] |

## 6. Engineering needs (backlog rows to add or change)

| Row | What | FR |
|---|---|---|
| New | Content test: the account-deletion texts name only systems the build's flags turn on (status report, analytics, pictures, seals). Extends NS-01-R31's content test. | FR-LEG-02 |
| New | Consent act conformance: a unit test over every `record_policy_act` call site asserts the method is in the schema's allowed list and a rendered text hash is sent; fix `backup/runtime.ts:308` before any backup build; add POLICY_VERSIONING 7.3 rows for `invite_accept`, invite created, `returning_consent_sheet`, `backup` | FR-LEG-09 |
| New | PDF font allowlist test, and move Amiri and Noto Serif SC with their OFL notices into the shared fonts folder if the PDF uses them | FR-LEG-12 |
| New | Flag registry: tag the NS-16 flag `child-input` (LEGAL-REQ-059, BL-119 pattern) | FR-LEG-15 |
| New | Seal options scan: no age-keyed preset or string (NS-06 B) | FR-LEG-07 |
| BL-444 | Either ship Leave before NS-25's store flag, or record that the Terms keep the "not in the app yet" wording | FR-LEG-03 |
| New (or BL-404 scope) | Report a concern in Me, Help (LEGAL-REQ-056), no content prefill | FR-LEG-10 |
| BL-104 | Counsel packet 1.6.0 (FR-LEG-18) before engagement | FR-LEG-18 |

## 7. Founder and counsel questions

Each has a recommended default. Counsel numbers are packet 1.5.0. "Needs a number from legal" means the question is new and gets its number when the packet is next versioned.

| # | Question | To | Recommended default | Number |
|---|---|---|---|---|
| L-1 | Co-parent removal: is the 72-hour undo plus no later removal enforceable and fair between separating parents, and is it enough that the rule is shown at invite and accept (FR-LEG-10)? What evidence standard limits a parent's access under Terms 4.4? | counsel | As drafted (D11); the rule shown on both sheets; access limited only on a verified court order or a safety report checked by the founder | Q53, Q50 |
| L-2 | Sealed letters and minors: may a letter be hidden until a day in the child's minority or adulthood with no delivery by us? Does "open at 18" wording, or any later reading by the grown child, create a duty to deliver, verify age or obtain consent? Who may open a sole author's sealed letter after death or incapacity? | counsel | Ordinary dates only, latest the 25th birthday, no age wording, no delivery, deleted with the account (D6); no fiduciary clause yet | needs a number from legal; with Q49 |
| L-3 | A sealed letter and a court order or custody dispute: may the author hide a letter from the other parent (B8), and what do we do with an order for a hidden letter? | counsel | Yes, the author may hide; orders handled under the Q50 runbook; the hiding does not change what we hand over | Q50 |
| L-4 | Shared letter: is a parent sending a picture of their child, or a letter naming another adult, through their own share sheet outside our collection and responsibility, as with Export? | counsel | Same as Export: the parent's own act; we collect nothing; the picture toggle off by default; flag off in production until the read is on record | Q45, Q48 |
| L-5 | Is the NX-33 label line above the photo picker, and the "Pictures stay on this phone" claim, accurate and sufficient? | counsel | Line absent until read; claim used only while NS-01-R15, R26, R61 pass on the candidate | Q43 |
| L-6 | Someone else speaks: on the parent's say-so, may we store another adult's name and words in the parent's letter, and what if the speaker is a child? | counsel | Instruction line only (D9); flag off in production until read; tagged `child-input` | Q48, Q45, Q46 |
| L-7 | Concierge pilot with tester families: consent texts W and V, notes retention 30 days, consent records 12 months, and Arm V (a child's voice sent by the parent to a relative) | counsel | Arm W only until the reads; texts as NS-03 section 15 | needs a number from legal; with Q44, Q45, Q51 |
| L-8 | Terms 3.1 and sign-in required (D-160): rewrite the Terms to say an account is needed in this version, or keep local use without an account? | founder | Rewrite Terms 3.1 and the Privacy "Which builds" section to Build 12 facts (FR-LEG-04); App Review risk is in `compliance.md` (C-4) | founder decision; counsel reads with Q44 |
| L-9 | Leave: ship BL-444 before co-parent is in a store build, or keep the Terms wording "not in the app yet"? | founder | Keep the 0.9.0 wording in the next Terms version; ship Leave before NS-25's store flag | founder decision |
| L-10 | Printable PDF: are OFL fonts embedded in a parent's PDF, printed by a print shop of the parent's choice, within Terms 5.6 "personal and family use", or should 5.6 name print shops? | founder, counsel | Add "including through a print shop you choose" to 5.6; OFL allows the embedding [S5] | Q12 (IP), counsel confirms |
| L-11 | Earlier versions and the right to delete: does a deletion right reach a removed earlier version, and on what clock? | counsel | Erased on the deleted-letter clock (D8) | Q51, Q48 |
| L-12 | Typed days and names in notifications: is the opt-in for typed words and the child's name enough under Privacy 5 and Apple 4.5.4 for local notifications? | counsel | As built; never by default; Privacy 5 says so (FR-LEG-08) | Q43 |

Chief Legal Officer (Claude role, not a lawyer)

## 8. Sources read this session (20 Nov 2026)

Numbering is shared with `compliance.md` section 8; S4 and S6 to S8 are listed there.

| # | Source | What it was used for |
|---|---|---|
| S1 | Apple App Review Guidelines, https://developer.apple.com/app-store/review/guidelines/ (no last-updated date shown on the fetched text) | 5.1.1(i), (iii), (v); 2.5.19; 2.3.8 quoted in `compliance.md` |
| S2 | Apple, App privacy details on the App Store, https://developer.apple.com/app-store/app-privacy-details/ | "Data that is processed only on device is not 'collected'"; Photos or Videos and Audio Data definitions |
| S3 | Apple, Offering account deletion in your app, https://developer.apple.com/support/offering-account-deletion-in-your-app/ | "let people know what information will and won't be retained"; user content shared with others is expected to be deleted |
| S5 | SIL OFL FAQ, https://openfontlicense.org/ofl-faq/ | 1.10 (licence text not needed when embedded in a document), 1.12 (embedding in full or subset allowed), 1.13 (the document's licence is unchanged), 1.20 (an app that bundles a font includes the licence) |

Every other law or rule cited in this file is from the repo's own records (register rows, CLO skill) and is UNVERIFIED this session.
