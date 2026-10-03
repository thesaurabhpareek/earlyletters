# F11 Co-parent sharing

| | |
|---|---|
| Release | v1.0 gate |
| Priority and rank | P0, rank 12 (`05-feature-map.md` section 2) |
| Personas | P2 Co-parent, P1 Evening parent, P4 Multilingual family. P5 only as v1.1 context |
| Existing IDs | B-REQ-007, B-REQ-009, B-REQ-010, B-REQ-011, B-REQ-016, B-REQ-023, B-REQ-025, B-NFR-002, B-NFR-003, B-NFR-004, B-NFR-009, PRD-REQ-004, PRD-REQ-014, PRD-REQ-021, C-REQ-007, A-REQ-028, A-REQ-029, DATA-REQ-012, DATA-REQ-014, DATA-REQ-015, DATA-REQ-016, LEGAL-REQ-006, LEGAL-REQ-024, LEGAL-REQ-032, LEGAL-REQ-054; K-09, K-10, K-18, K-22; D-020, D-024, D-025, D-036, D-039, D-050; DR-03, DR-07, DR-15; BL-112, BL-170, BL-175, BL-176, BL-190, BL-193, BL-195, BL-196, BL-233 |
| Depends on | F01 (18+ gate), F02 (sign-in, invite token storage), F16 (sync, `book_access`), F12 (books), F13 (notification permission), F14 (Plus sheet), F17 (consents, account deletion), F20 (support and safety removal), F21 (`/j` web page) |
| Status | Draft V2, 3 Oct 2026 |

## 1. Why

- [S] Sharing with family is the second most praised theme in photo-album apps after privacy: 31 positive reviews across 10 products [S] R2 section 2.2, theme T10. For letters the signal is thin: 1 of 287 coded reviews mentions a partner contributing [S] R2-S13.
- [F] Competitors charge for family: Qeepsake limits family contributors to Premium, FirstChapter puts family sharing in Premium, 23snaps makes each user subscribe [F] R1-S40, R1-S4, R1-S10. A free co-parent is a gap we can own (`04-market.md` section 4).
- [S] Fathers write letters or record videos to the future child on their own cadence [S] UR S25, S30. Photos of one parent with the baby often sit on the other parent's phone [A] UR S3x. One book with two voices answers both.
- [S] Shared albums that showed content to the wrong audience drew complaints [S] R2-S17. Who reads what must be plain at the moment of choosing.
- [F] In mixed-language couples, 92% of US Latino parents with a Latino partner speak Spanish to their children, against 55% with a non-Latino partner [F] R2-S31. A co-parent may not read the other parent's letters.
- [F] Shared books carry the worst security failure we could ship. The applied core migration let any member mint a parent invite; the pending `20261003000000_security_and_family.sql` replaces it with a parent-only function and an explicit role [F] TDD 02 finding 1, `supabase/migrations/20261003000000_security_and_family.sql` section 3. Risk R-09.
- [D] Family at v1.0 is co-parent only; contributors and the web page wait for v1.1 (B1). The co-parent gets Plus only through Apple Family Sharing (B2, DR-03). No audio leaves the phone in v1.0 (B7, DR-07).

## 2. Who

| Person | Moment | Holding, feeling, short of |
|---|---|---|
| P2 Co-parent | Often joins weeks after P1 started; opens a link in Messages or WhatsApp on a different evening from the invite | A phone, little patience for set-up, may never have heard of the app. 95.3% of fathers of children under 6 are in the labor force [F] R2-S30 |
| P1 Evening parent | Invites from the Family tab once they have an account and a few letters | Wants the partner in without giving up control of their own words |
| P4 Multilingual family | One parent writes in Hindi, Spanish or Arabic; the other may read only English | Wants each letter kept as spoken and never translated (R2-S31) |
| Separated parents | Two equals who may not talk to each other | Each needs their letters to stay theirs, and a way out that destroys nothing (B F8) |
| P5 Close family | Not a user at v1.0 (B1) | Parents show letters in person or share the PDF (F15); risk R-05 |

## 3. What we are solving

**Outcome.** Two parents keep one book for a child, each in their own words, and the author always decides what the other parent reads.

| Metric | Target | How measured | Consent caveat |
|---|---|---|---|
| Books with a second parent by day 30 of the book | 25% or more [A] (`03-goals-and-principles.md` 4.2, "Two voices") | Server aggregate: books with 2 parent members (BL-024) | Counts only; cells under 10 suppressed |
| Co-parent invites accepted before expiry | 50% or more [A] | Server aggregate on `child_invites.accepted_at` | Counts only |
| Joined parents who save a first letter within 14 days | 40% or more [A] | Server aggregate: first `entries` row by a joined parent | Counts only |
| Median time from invite created to accepted | Under 24 hours [A] | Server aggregate | Counts only |
| Cross-family or cross-child reads | Zero (gate) | Visibility matrix and leak tests (BL-195, F16-REQ-008) | n/a |
| Support tickets about not seeing the partner's letters | Under 2 per 100 joined parents in beta C1 [A] | Support log (F20) | n/a |

## 4. Scope

**In v1.0**
- Invite a co-parent by link or 8-character code, one child per invite, role `parent` only. Contributor paths are absent from the build (B1).
- Accept flow for a co-parent who has no app: install, 18+ gate, sign in, consent, join the named child's book.
- Visibility: private by default; the author chooses what goes in the book; working material and recordings stay with the author.
- No approval between parents (decision D1).
- At most two parents per book (decision D2).
- "Not your co-parent?" undo for 72 hours after a parent joins through your invite (decision D3).
- Leave with letter retention. No removal between parents; safety removal through support (F20).
- Account deletion of one parent (K-22).
- Co-parent letter notifications without content, replacing the C-REQ-007 family-letter push (decision D6).
- Honest states for the other parent's voice (DR-07) and for letters in a language one parent does not read (DR-15).
- Plus through Apple Family Sharing only, and what the co-parent sees outside one Apple Family (DR-03).
- A second-consent step at first share, built and switched off (D-050 default).

**Later**
- v1.1: family contributors in the app (F32), web contribution page (F37), shared voice and audio backup (F31), the author's own second-language version (F38).
- P1, launch quarter: multi-book invite picker (PRD-REQ-014), QR code of the invite (F11-REQ-021), "Take all my letters out" without leaving (F11-REQ-022, part of B-REQ-023).
- Later, needs a decision: a third parent or step-parent role (Q1), "Leave my letters after account deletion" (B-REQ-025, counsel).

**Never**
- Editing or deleting another person's words (K-10, DATA-REQ-015, the constitution in `CLAUDE.md`).
- Translating, transliterating or summarising a letter for the other parent (`03-goals-and-principles.md` principle 1, DR-15).
- Finding a partner by email or contacts lookup (UR R5; works with Apple private relay).
- A paywall on inviting, joining, writing or reading. `packages/core/src/plan.ts` lists `invite` and `family_authors` as `FreeForever`, so a gate on them cannot compile.
- The child's name, a signature or letter text in a server push (LEGAL-REQ-014, LEGAL-REQ-054, D-025).

## 5. Market reference

| Product | What it does | Does it work? (evidence) | What customers say | Our call |
|---|---|---|---|---|
| Day One Shared Journals | Up to 30 members; invitees join free; editing defaults to Author Only, owner may switch to Anyone; owner adds and removes members [F] R1-S24 | 4.8 (118K) [F] R1-S24 | n/a | **Match** author-only editing and free invitees. **Avoid** "Anyone can edit": nobody edits another person's words [R] |
| Qeepsake | Family contributors on Premium only; contributors not charged [F] R1-S40 | 4.9 (15K) | Limited admin features for co-parents [S] R1-S1 | **Avoid** a paid co-parent [R] |
| Tinybeans | Follower levels up to Full Access co-owner, who cannot delete the journal [F] R1-S47 | 4.9 (104K) | Want per-relative visibility [S] R1-S2 | **Match** "a co-parent cannot delete the book" (B-REQ-016) [R] |
| FamilyAlbum | Only album admins invite; invites by email, SMS or QR code [F] R1-S62 | 4.9 (375K) [F] R1-S12 | Easy family sharing [S] R1-S12 | **Match** QR for the partner in the same room, P1 [R]. **Avoid** admin-only invites: parents are equals |
| Notabli | Invite links with approval controls [F] R1-S7 | 4.7 (70) | No spam [S] R1-S7 | **Innovate**: no approval between parents, plus a 72-hour undo for a misused invite (D3) [R] |
| 23snaps | No family plan; each user subscribes [F] R1-S10 | 4.8 (11K) | Free tier "deliberately painful" [S] R1-S10 | **Avoid** [R] |
| Day One purchases | In-app purchases cannot be shared through Family Sharing [F] R1-S25 | n/a | n/a | **Innovate**: our Plus is family-shareable (R4-S17) [R] |
| From, Mama | "Village": partners and grandparents add letters [F] R1-S20 | 4.9 (48) | n/a | Tier Unverified (R1). We wait for v1.1 for grandparents (R-05) |

## 6. Experience

### 6.1 Entry points

| Entry | Where | Who |
|---|---|---|
| Family tab, "Invite your co-parent" | `apps/mobile/src/app/(tabs)/family.tsx` (today a disabled button with `familyTab.inviteNeedsSignIn`) | A parent |
| "Make it yours" invite card after the first letter (B F1 step 6; event `make_it_yours_card{card: invite}`) | Tonight | A parent |
| Settings > Children > {child}'s book > Who writes to {child} (`children.settings.familyLabel`) | Settings | A parent |
| First-run branch "My partner already started one" (B F1 step 2) | First run | Invitee |
| Invite link `https://earlyletters.com/j#t=<token>` (B-NFR-002) | Messages, WhatsApp, Mail | Invitee |
| Welcome screen, "I was invited" (A F7, D-043) | Entry | Invitee |

### 6.2 Happy path

#### A. Inviting the co-parent (P1)

| # | Person does | App shows (copy key) | System does |
|---|---|---|---|
| 1 | Taps Invite your co-parent | If not signed in, the Keep the book sheet first (F02). If sensitive-data consent is missing, that screen (PRD-REQ-002) | Reads `my_sync_gate()`; invites need an account and consent (`create_child_invite` calls `require_content_consent()`) |
| 2 | Sees one sheet: what the co-parent can do, an optional "What does {child} call them?" chip row, and the one-book line | New `coParent.invite.title`, `coParent.invite.body`; `family.invite.signsAsLabel`; `children.sharing.oneBookNote` | Makes an invite id (UUIDv7), a 32-byte token and an 8-character code on the device (D5) |
| 3 | Taps Share invite, or Show code | iOS share sheet with `family.shareMessage.imessage` (Rev (B1), see 13 Q8) and the link; or the code shown as `XXXX-XXXX` with new `coParent.invite.codeHelp` | Writes the invite op to the outbox (F16) with id, `sha256(token)`, code, role `parent`, suggested signature. Works offline; the link works once the op reaches the server |
| 4 | Sees the member list | "{signsAs}, invited, open until {date}" with Send again and Cancel invite (`family.invite.pendingLabel`, `family.invite.resendButton`, new `coParent.invite.cancelButton`) | Cancel calls `revoke_invite(id)` (exists) |
| 5 | Partner joins | The member row shows them. A passive push "Your co-parent joined the book" if notifications are allowed (new `notifications.coParentJoined.*`). For 72 hours the row also shows "Not your co-parent?" (new `coParent.joined.undoTitle`) | `undo_parent_join` is open to the inviting parent for 72 hours (D3) |

#### B. Joining when the app is not installed (P2)

| # | Person does | App shows (copy key) | System does |
|---|---|---|---|
| 1 | Taps the link on an iPhone | `earlyletters.com/j` (F21): the app name from `packages/brand`, a "Copy invite and get the app" button, and "Then open the app and tap I was invited." No child name, inviter name, analytics or third-party script | The token sits in the URL fragment, so no server receives it (B-NFR-002). The button copies the whole link (a user gesture), then opens the App Store listing |
| 2 | Installs, opens, taps I was invited | Welcome screen (D-043), then the 18+ gate (PRD-REQ-019, D-026) | The gate is root-level, so a link cannot skip it (D-026) |
| 3 | Taps Paste, or types the code | "Paste the invite link or type the code" (A F7) | Clipboard read only on that tap (A-REQ-029). Token or code stored in Keychain before any other UI (A-REQ-028) |
| 4 | Signs in with Apple, Google or email link plus code | Sign-in sheet with the Terms line and 18+ confirmation (A-REQ-034, B3, DR-13) | `terms` acceptance with `age_attested` (PRD-REQ-002) |
| 5 | Agrees to sync | `sensitiveConsent.*` (its body already names sharing with family) | `record_policy_act('sensitive-data', ...)` |
| 6 | Waits about a second | Progress, then the book | Link: `accept_child_invite(token)` (exists). Code: `invite-redeem` Edge Function (BL-190). Membership row with role `parent`; audit `member_joined`; `book_access` row (F16) |
| 7 | Reads the welcome and sets a signature | New `coParent.welcome.title`, `coParent.welcome.body`; `onboarding.signsAs.*` prefilled with the inviter's suggestion (B-REQ-002); languages step (F03) | Writes `child_member_prefs.signs_as` and profile languages |
| 8 | Lands on the Book | The other parent's in-book letters as text. Letters with a recording show "Recording kept on {signsAs}'s phone" (`book.recordingElsewhere`) | First pull of the book (F16-REQ-013). The joined book never counts as their free book (PRD-REQ-015) |
| 9 | Sees tonight's prompt to {child} | Tonight (F13) | |

If the app is already installed, the link opens it through a universal link (A-REQ-022) and the flow starts at step 3 with the token captured. The gate shows only if it was never passed.

#### C. A week in a shared book

1. Either parent saves a letter. Review asks "Where should this go?" (`review.destination.*`). In a book with two parents an audience line sits under Add to {child}'s book: new `coParent.audience.book` "{coParent} can read letters in the book." Nothing is preselected; a letter saved without a choice stays private (B-REQ-011).
2. The added letter syncs. The other parent's phone shows it within the F16 budget (F16-REQ-017). If that parent allows it, a passive push "A new letter in the book" arrives (D6).
3. The reader sees the letter, the signature "From {signsAs}" and its provenance line. No edit control, no "Show exactly what I said" (PRD-REQ-004), no play control for the other parent's recording (DR-07).
4. The author can take the letter out of the book at any time. It leaves the other parent's phone within one sync (LEGAL-REQ-032).

#### D. Leaving a book

1. Settings > Children > {child}'s book > Leave {child}'s book. A sole parent sees Delete the book instead (B-REQ-016, DATA-REQ-016).
2. One sheet, two choices: "Leave my letters in the book" (default) or "Take my letters out of the book". Two plain lines: "Anyone {coParent} invites later can read letters you leave in the book." and "Your letters stay yours. You can read, export and delete them on this phone." (new `coParent.leave.*`).
3. Confirm. The app sends `leave_child(child, keep_in_book)` (new).
4. The leaver's phone drops the other parent's letters and the book's shared details within one sync, and keeps their own letters under "Letters to {child}" with read, export and delete. The remaining parent sees one neutral note, "{signsAs} has left {child}'s book." (new `coParent.left.note`).

#### Decisions the flows rely on

| ID | Decision [R] | Why |
|---|---|---|
| D1 | **No approval between parents.** A parent's letter goes into the book when its author chooses Add to {child}'s book. Approval stays for contributor letters only (B-REQ-009), dormant at v1.0 | Parents are equals (B F8). The author decides who reads (B-REQ-011). Approval would let one parent hold back the other's words, which the equals rule forbids. Day One defaults to author control [F] R1-S24. The schema already does this: `entries_family_rules` sets `approval = 'not_needed'` for parents' letters [F] `20261003000000_security_and_family.sql` section 4. Cost: a parent can add a letter the other dislikes. Recourse is talking, leaving, or support for safety cases (F20) |
| D2 | **At most two parents per book at v1.0.** Create and accept refuse a third parent | A new parent would read the existing parent's in-book letters without that parent agreeing. This matters most for separated parents. Blended families who need more wait for the v1.1 role work (Q1) |
| D3 | **72-hour undo.** The parent whose invite was used can remove the person who joined with it for 72 hours. After that, neither parent can remove the other | Invites are forwarded by mistake. Without an undo, a stranger who joins as a parent could never be removed by the family (parents are equals) and would fill the second seat (D2). The joiner's letters stay theirs and leave the book |
| D4 | **Contributors absent from the build; refused by the server.** The app has no code path that creates a `contributor` invite. The server refuses that role unless server config `contributors_enabled` is true (default false) | B1. A remote flag must never switch on an unreviewed feature (B14, App Review 2.3.1 in R4 section 0 item 8). The server check stops a modified client from creating half-built contributor states |
| D5 | **Invite id, token and code are made on the device.** The server stores `sha256(token)` and an HMAC of the code; it never returns a secret | Create becomes idempotent on the id (a retry after a lost response is safe), works offline, and the server cannot leak a token in a response or log. The code HMAC uses a pepper in Edge Function secrets so a database dump cannot brute-force 40-bit codes (TDD 04 3.4.1) |
| D6 | **Notifications are passive, generic and content-free.** Server pushes say "A new letter in the book" with no child name, signature, text or ids | LEGAL-REQ-014 lists signatures among content banned from push payloads; D-025 bans the child's name in server pushes. Passive delivery avoids a sound or a lit screen at night without storing anyone's time zone |

#### What each parent can see and do (v1.0)

| Action or data | Author parent | Other parent | Source |
|---|---|---|---|
| Write letters to {child} | Yes | Yes | B F9 |
| Own private letters | Read, edit, delete | Never sees them | B-REQ-011 |
| Own letters in the book | Read, edit, take out, delete | Reads text, signature, provenance, date | B F9, `book_entries` columns |
| Raw transcript, machine edits, STT metadata, edit history, conflict notes | Author only | Never | PRD-REQ-004, K-09 |
| Recording and listening copy | On the author's phone only | "Recording kept on {signsAs}'s phone" | B7, DR-07 |
| Edit or delete the other parent's words | n/a | Never; no control in app or API | K-10, DATA-REQ-015 |
| Book settings: name, nickname, birthday or due date, photo, look, hide | Edit | Edit | PRD-REQ-013, `children_guard` |
| Delete the book | Only as sole parent; with a co-parent, delete means leave and remove own letters | Same | B-REQ-016, `request_book_deletion` |
| Invite a co-parent | Yes, while the book has one parent | Same | B-REQ-007, D2 |
| Cancel a pending invite | Yes | Yes | `revoke_invite` |
| Remove the other parent | Only within 72 hours of a join through own invite (D3); else support | Same | B F8, D3 |
| Leave | Yes, keeping or taking out own letters | Same | B-REQ-010 |
| Export | Own letters and recordings; the PDF book (F15 decides what it includes) | Same | LEGAL-REQ-034 |
| Per-person settings (signature, reminders, celebrations, co-parent letter notifications) | Own only | Own only | PRD-REQ-013 |

#### The other parent's voice (DR-07)
No audio leaves a phone in v1.0 (B7). On the reader's phone, a letter whose `audio_kept_on_device` is true shows `book.recordingElsewhere` and no play control. Read together on that phone plays only recordings made on it (F10). Nothing in F11 copy, the Plus sheet or the store listing may suggest the other parent's voice plays on your phone. Shared voice is the first v1.1 item (F31).

#### Letters in a language one parent does not read (DR-15)
The letter shows exactly as written, in its own script and direction (F09 renders Devanagari, Arabic right to left, Chinese characters). No translation, transliteration, summary or "what this says" line exists anywhere (constitution). There is no language label at v1.0, so no new column holds a language per letter (languages are L4, PRD 7.10). The v1.1 answer is the author's own second version (F38). Study 3 tests how this feels (U6 in `02-customers.md`).

#### Plus and Apple Family Sharing (DR-03)
- [F] Family Sharing covers one Apple Family, same home country, six people; once on for a product it cannot be turned off; the purchaser can stop sharing at any time [F] R4 section 1.2 (R4-S17, R4-S18, R4-S19).
- [F] A co-parent who has Plus through the family sees it in their own `Transaction.currentEntitlements` with `ownershipType` family shared [F] R4-S6, R4-S18.
- [D] Plus is per Apple Family, not per book (DR-03 default A). No server tells one parent that the other pays (B2).
- What the co-parent sees outside the payer's Apple Family: their own phone has no Plus. They keep every free thing: invite, write, read, export, their own first book free (joined books never count). They meet the Plus sheet at the same triggers as anyone (F14). The sheet carries one line when `Product.isFamilyShareable` is true: new `coParent.plus.familySharingNote` "Plus on one parent's Apple Account reaches the other only through Apple Family Sharing." F14 owns the sheet.
- Consequence to accept: two parents in different Apple Families may both buy Plus. PRD-REQ-022's "no offer in a book covered by the other parent" cannot be checked without a server (R4 C2, C3). F14 records this.

#### Separated parents
- Neither parent can remove the other, delete the other's words, or delete the shared book (B F8, DATA-REQ-014, DATA-REQ-015).
- Each parent can keep new letters private, take letters out of the book, leave with or without their letters, and export for free (B F8, LEGAL-REQ-034).
- Hiding a book is book-level and affects both parents (B-REQ-014); either parent can show it again (F12).
- Safety cases, such as a court order: support verifies and removes a member through an audited service-role runbook (B F8.3, DATA-REQ-027, LEGAL-REQ-025). F20 owns the path.
- Plus does not follow a separated co-parent who leaves the payer's Apple Family (R4-S18). Their books stay open; only Plus extras stop (C-REQ-028).

#### Account deletion of one parent (K-22)
- At request, `request_account_deletion` tombstones every letter the person wrote, so their letters leave the shared book at once; cancelling within 30 days restores them [F] `20261003000000_security_and_family.sql` section 5.
- The book, the other parent's letters and the book settings survive; `children.created_by` becomes null [F] `20261002020000_data_governance.sql` section 0 (DATA-REQ-012).
- The deletion screen (F17, BL-233) says per shared book: "{child}'s book stays with {coParent}. Your letters to {child} will be removed." and offers export first (DELETION spec 2.6.1).
- After execution, the remaining parent sees `coParent.left.note` once. No push.
- "Leave my letters for {child}" after deletion stays P2 and needs counsel (B-REQ-025).

#### Second consent at first share (D-050)
Counsel has not answered. Spec default: no second consent; the sensitive-data consent already names family sharing. The app ships a one-tap `family-share` sheet before the first invite, compiled off. The server check in `create_child_invite` reads server config `family_share_consent_required` (default false). If counsel says yes, a migration adds the `family-share` row to `policy_documents`, a release turns the sheet on, and the config turns the server check on.

### 6.3 Unhappy paths and edge cases

| ID | Trigger | System behaviour | What the person sees | Recovery | Test |
|---|---|---|---|---|---|
| F11-U01 | Invitee taps the link with no app installed | `/j` page; token stays in the fragment | Copy invite and get the app | After install, I was invited > Paste | Manual script M-F11-1 |
| F11-U02 | The link opens in an in-app browser that drops the fragment | Page cannot read a token | "Ask the person who invited you for their 8-character code" | Type the code | Manual: WhatsApp and Gmail in-app browsers |
| F11-U03 | Invitee opens the link on a device that is not an iPhone | Page shows the app needs an iPhone (D-002 consequence) | Plain line, no store links for other platforms | Join later on an iPhone | Manual |
| F11-U04 | Invite expired (7 days, K-18) | `accept_child_invite` raises `SCINV` | New generic `errors.inviteExpired.bodyGeneric` "Ask for a new one." (the existing body names an inviter the app cannot know) | Inviter taps Send again: a new invite | `[B-REQ-007] expired invite refused` (exists) |
| F11-U05 | Invite used or revoked | `SCINV` | New `errors.inviteUsed` "This invite has already been used. Ask for a new one." | New invite | `security_family.test.mjs` revoked case (exists) |
| F11-U06 | Wrong code entered | `invite-redeem` counts failures per device | After 10 failures in an hour: new `errors.inviteTooManyCodes` "Please wait an hour, or use the link." | Wait, or use the link | `[B-NFR-004] 11th failed code in an hour is refused` |
| F11-U07 | Invitee opens the link before the inviter's phone has sent the invite (D5) | Token hash not found | New `errors.inviteNotReady` "This invite starts working once the person who sent it is online. Try again in a few minutes." | Retry; token kept in Keychain for 14 days | Integration: accept before push, then after |
| F11-U08 | Same person accepts twice, or on a second device | `accept_child_invite` returns the child id again (exists) | Opens the book | None | `accept is idempotent for the same person` (exists) |
| F11-U09 | The inviter taps their own link | `SCINV` (already a member) | New `errors.inviteOwn` "This is your own invite. Send it to your co-parent." | Share it | `the inviter cannot accept their own invite` (exists) |
| F11-U10 | Book already has two parents (two invites both used, or a stale invite) | Accept refuses with `SCINV` detail `full`; create refuses the same way | New `errors.inviteFull` "This book already has two parents." | None at v1.0; Q1 | `[F11-REQ-004] third parent refused at create and accept` |
| F11-U11 | Invitee declines sensitive-data consent | Accept would raise `SCCON` | New `coParent.join.needsSync` "Joining a shared book needs sync. You can turn it on in Settings, Privacy." | Turn on sync in Settings; the stored token is tried again until expiry | `[LEGAL-REQ-006] accept refused without consent; invite not used up` (exists) |
| F11-U12 | Invitee answers No at the 18+ gate | Stop screen (PRD-REQ-019). The stored token is deleted from Keychain | Stop screen only | None; the inviter is not told | Unit: gate No clears pending invite token |
| F11-U13 | Offline when trying to join | Join needs the network (B-NFR-009) | New `coParent.join.offline` "We will finish joining when you are back online." | Automatic retry on reconnect | Integration: airplane mode during accept |
| F11-U14 | Inviter offline when sharing | Invite op queued (D5); the share sheet still opens | The member row shows "Not sent yet" until the op lands (F16-REQ-016) | Automatic | Integration |
| F11-U15 | Double tap on Share invite | Same invite id, one op | One invite | None | Unit: one op per sheet session |
| F11-U16 | A forwarded link is used by the wrong person | Wrong person joins as a parent | Inviter sees "Not your co-parent?" for 72 hours | Remove them; their letters leave the book and stay theirs; then invite the right person | `[F11-REQ-008] undo within 72 h; refused after; refused for the non-inviting parent` |
| F11-U17 | Invitee has letters in a local-only book for the same child | Offer "Bring your letters into {child}'s book" (F12-REQ-007) with "Keep them private" as the default | Choice sheet | Keep separate instead | F12 tests |
| F11-U18 | Invitee already has a synced book for the same child | Both books stay (moving synced letters is P1, F12-REQ-008) | Both in the switcher | Hide one (F12) | Manual |
| F11-U19 | Both parents started separate books and invite each other | Two books, two parents each | Two books for one child | Each keeps one, hides the other; merge is v1.1 | Manual; prevented upstream by the first-run branch (B F1 step 2) |
| F11-U20 | The author takes a letter out of the book or deletes it | Removal reaches the reader (F16-REQ-009) | The letter is gone from the reader's book within one sync | None | `[LEGAL-REQ-032] removal reaches the co-parent device` |
| F11-U21 | The other parent leaves | `book_access` row gone; letters kept or out per their choice | `coParent.left.note` once | Invite a new co-parent (D2 seat is free) | Integration |
| F11-U22 | The other parent requests account deletion | Their letters tombstoned at request | Their letters leave the book; returned if they cancel within 30 days | None | `[DATA-REQ-012] book survives a parent's deletion` (data_governance tests) |
| F11-U23 | Notifications not allowed, or the per-child toggle off | No push | A "New" label (`family.approval.newBadge`) on the other parent's letters added since this phone last opened the book | None | Unit: new-since-last-open marker |
| F11-U24 | Reminders muted | Co-parent letter pushes still arrive (C-REQ-007 Rev (B1)) | Push as normal | None | `[C-REQ-007] muting reminders keeps co-parent letter pushes` |
| F11-U25 | Co-parent outside the payer's Apple Family | No Plus on their phone | Plus sheet at normal triggers, with the Family Sharing line | Join the Apple Family, or buy | F14 tests |
| F11-U26 | One parent withdraws sensitive-data consent | Their uploads pause with `SCCON`; reading continues [F] `security_family.test.mjs` ("reading still works after withdrawal") | "Not sent yet" on their new letters with the paused reason (F16) | Consent again | Exists |
| F11-U27 | Rate limit: 20 invites a day per parent or per book | `SCRAT` (exists) | "Too many invites today. Try again tomorrow." | Wait | `[B-NFR-004]` tests (exist) |
| F11-U28 | Server error on accept | Retry with backoff from 1 s to 5 minutes; token kept | Spinner, then `errors.generic` after 30 s with Try again | Retry | Fault-injection integration |
| F11-U29 | VoiceOver on the code screen | Code read character by character, in two groups | Spelled code; Copy code button | n/a | XCUITest accessibility audit; label test |
| F11-U30 | AX5 text on the invite sheet, member list and leave sheet, iPhone SE 3 | Text wraps, controls stack, no truncation (D-027) | Full text | n/a | Component tests at AX5 (BL-269) |
| F11-U31 | A parent asks support to remove the other parent for safety | Runbook, audited (LEGAL-REQ-025) | F20 copy | n/a | Runbook test (BL-237) |
| F11-U32 | Letter in a script whose font pack is not on the reader's phone | System font fallback (F09) | Correct glyphs, never empty boxes | n/a | F09 rendering test with Devanagari, Arabic, Chinese fixtures |

## 7. Requirements and acceptance criteria

| ID | P | Requirement | Acceptance criteria | Source |
|---|---|---|---|---|
| B-REQ-007 Rev (B1) | P0 | Invite by link and code with an explicit role; only parents create invites. At v1.0 the app creates `parent` invites only | Given a parent, When they share an invite, Then the server row has role `parent`, expires 7 days after creation, and stores only hashes. Given a build of the app, When the source is searched, Then no call creates a `contributor` invite. Given a contributor calls create, Then `SCPAR` (exists) | B, K-18, D-002, B1 |
| B-REQ-009 Rev (B1) | P0 | Approval applies to contributor letters only; parents' letters need none. Dormant in the v1.0 UI; server tests stay green | Given a parent saves a letter to the book, Then `approval = 'not_needed'` and `in_book = true`. The existing contributor approval tests still pass | B, D1 |
| B-REQ-010 Rev (B1) | P0 | Leave with letter retention for every member. Remove applies to contributors only (dormant at v1.0); parents cannot remove each other except F11-REQ-008 | Given a co-parent leaves keeping letters, Then the remaining parent still reads them and the leaver can read, export and delete them (DATA-REQ-016). Given a parent tries to remove the other after 72 hours, Then no control exists and the API refuses | B, B F8 |
| B-REQ-011 | P0 | Private by default; visibility per B F9 | Given a letter saved without a choice, Then it is private and the other parent's pull returns nothing for it | B |
| B-REQ-016 | P0 | Only a sole parent deletes a book; with a co-parent, delete means leave and remove own letters | Given two parents, When A deletes, Then `request_book_deletion` returns `left_and_removed_own_letters`, B keeps the book and B's letters (exists) | B, DATA-REQ-014 |
| B-NFR-002 | P0 | Tokens travel in the URL fragment; only hashes stored | Given an invite link, Then the token is after `#`. Given server and function logs from the E2E run, Then the token string never appears (log canary) | B, LEGAL-REQ-026 |
| B-NFR-003 Rev (D-023) | P0 | Every rule has an access test, and the pull RPCs have a parity test against RLS | Given the fixture families, Then F16's parity suite returns exactly the rows RLS allows for each parent | B, F16-REQ-008 |
| B-NFR-004 | P0 | Invite creation 20 per parent and per book per day; code entry 10 failures per device per hour | Given the 21st invite in 24 hours, Then `SCRAT`. Given the 11th failed code in an hour from one device, Then refused for the rest of the hour | B |
| B-NFR-009 | P0 | Invites and joins queue visibly when offline | Given airplane mode, When a parent shares an invite, Then the op is queued and the member row says "Not sent yet" until it lands | B |
| PRD-REQ-004 | P0 | Raw transcript, machine edits and STT metadata are author-only | Given the other parent's pull and `book_entries`, Then none of those columns is present | PRD, K-09 |
| PRD-REQ-014 Rev (B1) | P0 | Invites, roles and sharing are per child; one child per invite | Given an invite to Asha's book, When accepted, Then the joiner has a `book_access` row for Asha only and receives nothing from a sibling's book | PRD, K-12 |
| PRD-REQ-021 Rev (B7) | Later | Shared voice is not in v1.0; moves to F31 (v1.1) | Given v1.0, Then no recording or listening copy is uploaded by any code path (network capture test) | B7, DR-07 |
| C-REQ-007 Rev (B1) | P0 | Separate channels: Reminders, Letters from your co-parent, Your plan. Muting reminders keeps co-parent letter pushes | Given Reminders paused, When the other parent adds a letter, Then the push still arrives | C, D6 |
| DATA-REQ-012 | P0 | No cascade across authors | Given the parent who created the book deletes their account, Then the book and the other parent's letters remain (exists) | DELETION spec |
| DATA-REQ-015 | P0 | Nobody deletes another person's words | Given a parent calls `delete_entry` on the other parent's letter, Then `P0002` and nothing changes (exists) | K-10 |
| LEGAL-REQ-024 | P0 | Access control tested before any non-founder family data | Given CI, Then the F11 tests and the visibility matrix pass on every PR touching `supabase/**` | ENGINEERING_REQUIREMENTS |
| LEGAL-REQ-032 | P0 | Deletion and removal reach every member device | Given the author takes a letter out of the book, Then the other parent's device drops the row within one sync (p95 60 s online) | ENGINEERING_REQUIREMENTS |
| LEGAL-REQ-054 | P0 | Push payloads carry no content | Given every push type built in tests with the Asha fixtures, Then no payload contains a child name, signature, letter text or id | ENGINEERING_REQUIREMENTS |
| F11-REQ-001 | P0 | Co-parent invite by link or code, one child, role `parent`, from the Family tab, the invite card and the book's settings | Given a signed-in, consented parent of a one-parent book, When they open the invite sheet, Then Share invite and Show code are reachable in 2 taps from the Family tab | B F5 |
| F11-REQ-002 | P0 | The device makes the invite id (UUIDv7), a 32-byte token and an 8-character Crockford base32 code. The server stores `sha256(token)` and `hmac_sha256(pepper, code)`, never returns a secret, and treats a repeat create with the same id and hash as success | Given a create retried 3 times after lost responses, Then one row exists. Given the database, Then no token or code appears in clear. Given a code that collides with a live invite, Then `SCINV` detail `code_taken` and the client makes a new code | D5, TDD 04 3.4.1 |
| F11-REQ-003 | P0 | The server refuses `contributor` invites unless `contributors_enabled` is true (default false) | Given the default config, When any caller creates a contributor invite, Then `SCINV` detail `role_disabled` | D4, B1 |
| F11-REQ-004 | P0 | At most two parents per book | Given a book with two parents, When a parent creates a parent invite or anyone accepts one, Then `SCINV` detail `full`, and the invite sheet shows `coParent.invite.fullNote` instead of Share | D2 |
| F11-REQ-005 | P0 | The `/j` page copies the link and opens the App Store; it loads no analytics or third-party script and never sends the fragment anywhere | Given the page in a network capture, Then the only requests are its own static files, and no request contains the token | B-NFR-002, F21 |
| F11-REQ-006 | P0 | Joining needs the 18+ gate, sign-in, Terms with age, and sensitive-data consent, in that order. An under-18 answer deletes the stored token | Given a fresh install opened from a link, When the person answers No at the gate, Then Keychain holds no invite token afterwards | PRD-REQ-019, PRD-REQ-002 |
| F11-REQ-007 | P0 | Codes are redeemed only through `invite-redeem`, which verifies the caller's JWT, limits failures (10 per device per hour, 1,000 per hour globally, then the code path pauses and alerts) and calls a service-role-only accept by code | Given 1,001 failed codes in an hour across devices, Then code redemption returns `SCRAT` for everyone and an alert fires within 15 minutes; links keep working | TDD 02 2.4, BL-190 |
| F11-REQ-008 | P0 | For 72 hours after a parent joins through an invite, the parent who created that invite can remove them. The removed person's letters in that book are taken out of the book (not deleted) and stay theirs | Given a join at T, When the inviter undoes at T+71h, Then the membership is gone, their letters are private, and audit `member_join_undone` exists. At T+73h, or by the other parent, Then `SCPAR` | D3 |
| F11-REQ-009 | P0 | The other parent receives a letter only while it is in the book and live; never private letters, working material, edit history, conflict notes or audio | Given the visibility matrix fixtures, Then the other parent's pull and `book_entries` match the table in 6.2 row for row | B F9, PRD-REQ-004 |
| F11-REQ-010 | P0 | No approval between parents | Given a parent adds a letter, Then the other parent sees it without any review step | D1 |
| F11-REQ-011 | P0 | Leave goes through `leave_child(p_child, p_keep_in_book)` only. With `false`, own letters in that book get `in_book = false` in the same transaction. The last-parent guard applies. Others' rows leave the leaver's phone within one sync | Given a leave with take-out, Then every own letter in that book is private, versions are recorded, and audit `left_book` exists. Given a sole parent, Then `SCLPG` and the UI offers Delete. Given a direct delete on `child_members`, Then refused | B-REQ-010, DATA-REQ-016 |
| F11-REQ-012 | P0 | After the 72-hour window, removal of a parent happens only through the support runbook | Given the app and the API, Then no client-callable path removes another parent after 72 hours | B F8, DATA-REQ-027 |
| F11-REQ-013 | P0 | Account deletion of one parent: own letters leave the shared book at request and return on cancel; the deletion screen names each shared book and offers export first | Given parent A requests deletion, Then B's pull returns removals for A's letters within one sync. Given A cancels, Then they return | K-22, DATA-REQ-012 |
| F11-REQ-014 | P0 | Co-parent letter push: when a parent's letter enters the book (insert with `in_book`, or `in_book` turning true) in a book with another parent whose per-child toggle is on and who has a push token, send a passive APNs notification with generic text, no ids, one per author per book per 2 hours (collapse) | Given 5 letters added by A within an hour, Then B receives at most 1 push. Given the payload, Then it holds only `kind`, title and body from new `notifications.coParentLetter.*` | D6, LEGAL-REQ-054, BL-196 |
| F11-REQ-015 | P0 | Other parent's recordings: show `book.recordingElsewhere`, no play control, skipped by Read together | Given B opens A's letter with `audio_kept_on_device = true`, Then no play control renders and the line shows | DR-07 |
| F11-REQ-016 | P0 | A letter in any language shows as written; nothing translates, transliterates or summarises it | Given a Hindi letter in Devanagari on an English-only reader's phone, Then the rendered text equals `final_text` byte for byte | DR-15, constitution |
| F11-REQ-017 | P0 | Plus reaches the co-parent only through Family Sharing; the app never assumes the other parent's Plus | Given B outside A's Apple Family, Then B's plan state is Free, and `plan.ts` receives `coveredByOtherParent = false` | DR-03, R4 C2 |
| F11-REQ-018 | P0 | Second-consent sheet built and compiled off; server check behind `family_share_consent_required` (default false) | Given the default build and config, Then no sheet shows and create succeeds without a `family-share` act. Given the config on and no act, Then `SCCON` detail `family-share` | D-050 |
| F11-REQ-019 | P0 | Member list per book: members with signature, role label and joined date; pending invites with "open until {date}"; no email or phone | Given a book with one pending invite, Then the list shows it with Send again and Cancel | B F5 |
| F11-REQ-020 | P0 | Audience line in Review for books with two parents | Given a shared book, When Review shows the destination, Then `coParent.audience.book` is visible under Add | B, R2-S17 |
| F11-REQ-021 | P1 | QR code of the invite link on the invite sheet | Given the sheet, When Show QR is tapped, Then the camera of a second iPhone opens the link | R1-S62 |
| F11-REQ-022 | P1 | Take all my letters out of {child}'s book without leaving | Given 40 own letters in the book, When confirmed, Then all 40 become private within one sync on both phones | B-REQ-023 |
| F11-REQ-023 | P0 | The remaining parent sees one neutral note when the other parent leaves or their deletion completes | Given B leaves, Then A's book shows `coParent.left.note` once and never again | K-22 |
| F11-REQ-024 | P0 | Joined-parent welcome sets the signature for this child and the person's languages | Given a join, Then `child_member_prefs.signs_as` is set before the first letter | B-REQ-002, B-REQ-003 |

## 8. Data, privacy and security

| Data | Level (PRD 7.10) | Where | Who reads | Retention |
|---|---|---|---|---|
| `child_invites` row: hashes, role, expiry, suggested signature | L3 (hash), L3 (`signs_as`) | Postgres | Parents of that book (`child_invites_select`, exists) | Deleted 90 days after `coalesce(revoked_at, accepted_at, expires_at)` (D-020; `purge_due` in `20261003020000_purge_batching.sql`) |
| `child_invites.code_hash` (new) | L3 | Postgres | Nobody through the API; `invite-redeem` compares | Same as the row |
| Invite token and code in clear | L4 (token) | Inviter's phone until shared; invitee's Keychain until accept, expiry error or 14 days (TDD 04 3.2.1) | The device | As stated; never on our server in clear |
| `child_members` row | L3 | Postgres | Members of that book | Until leave, removal, or account deletion |
| `child_member_prefs.signs_as`, new `notify_letters` | L3, L2 | Postgres | Owner only (`child_member_prefs_own`, exists) | Cascades on leave |
| `push_tokens` (new): token hash and token, device kind, last seen | L3 | Postgres, service role only | `push-send` function | Deleted on sign-out, account deletion, an APNs "unregistered" answer, or 90 days unseen |
| `notify_outbox` (new): kind, recipient profile id, book id, send-after | L3 | Postgres, service role only | `push-send` function | Deleted 7 days after sent |
| Audit rows: `invite_created`, `invite_revoked`, `member_joined`, `left_book`, new `member_join_undone` | L2 with L3 ids | Postgres | Actor reads own rows | 24 months (D-021) |
| Other parent's letters, as cached on the reader's phone | L4 | Reader's device database (iOS Data Protection, LEGAL-REQ-022(b)) | Reader | Removed on take-out, deletion, leave, sign-out |

**Never leaves the phone:** recordings and listening copies (B7), drafts, the 18+ gate state, Read together counts (D-037), invite secrets (only hashes go up).

**Threats and controls**

| Threat | Control |
|---|---|
| A contributor or modified client makes someone a parent | Parent-only create (exists); explicit role (exists); contributor role refused by server config (F11-REQ-003); accept never changes an existing role (exists) |
| Forwarded or leaked link | Single use (exists), 7-day expiry (exists), 72-hour undo (F11-REQ-008), two-parent cap (F11-REQ-004) |
| Code brute force (about 40 bits, TDD 04 3.4.1) | Function-only redemption, per-device and global limits, pepper outside the database (F11-REQ-007) |
| Token in logs | Fragment URL; tokens only in request bodies; device-made tokens are never in responses; log canary (LEGAL-REQ-014) |
| Membership probing through error messages | Accept errors are generic per class; `book_has_plus`-style answers for non-members return nothing (pattern in `20261003010000_children_and_entitlements.sql`) |
| Push content leak | Generic text, no ids, passive; payload test (LEGAL-REQ-054) |
| A third reader added without the first parent agreeing | Two-parent cap; leave sheet names later readers |

## 9. Non-functional requirements

| Item | Budget | Gate |
|---|---|---|
| Invite sheet opens | Under 300 ms on iPhone SE 3 | Yes |
| `create_child_invite` (through the outbox) | p95 500 ms, p99 1.2 s at the client (PRD 7.2 write RPC) | Yes |
| `accept_child_invite`, `leave_child`, `undo_parent_join` | p95 500 ms | Yes |
| `invite-redeem` | p95 600 ms, p99 1.5 s including cold start (PRD 7.2 light Edge Function) | Yes |
| Join to book list visible | p95 10 s (PRD 7.3 new phone budget) | Yes |
| Join to one year of the other parent's letters (about 240) | p95 30 s on LTE (PRD 7.3) | Yes |
| Co-parent letter push sent after the letter reaches the server | p95 60 s [A]; APNs delivery time is not ours to promise | No |
| Accessibility | AX5 on every F11 screen; VoiceOver spells the code; 44 pt targets, 56 pt primary (PRD 7.6) | Yes |
| Shared rules | `06-nfr.md` | |

## 10. Analytics

Consent-gated per PRD-REQ-016; properties are L2 only. Business metrics in section 3 come from server aggregates, not these events.

| Event (catalogue in `packages/analytics/src/catalog.ts`) | Properties | Question it answers |
|---|---|---|
| `invite_created` (exists) | `role: co_parent`, `channel: share_sheet / copy_link / code`, `large_print: false`, `child_ordinal` | Which channel do parents use? |
| `invite_opened` (exists) | `via: link / code / paste`, `signed_in` | Where do invitees drop before accepting? |
| `invite_accepted` (exists) | `role: co_parent`, `surface: app` | Funnel end |
| `member_left` (exists) | `role: co_parent`, `letters: keep / take_out` | Do leavers keep their letters in? |
| `error_shown` (exists) | `code`: `invite_expired` (exists); new values `invite_used`, `invite_full`, `invite_not_ready`, `invite_rate_limited` | Which invite failures need copy or design work? |
| `notification_opened` (exists) | `type: family_letter` (reused for co-parent letters) | Do co-parent pushes bring parents back? |
| `member_join_undone` (new) | none | How often are invites misused? |

## 11. How we build it (with the architect)

**Components and files**

| Part | Files (new unless stated) | Notes |
|---|---|---|
| Pure rules | `packages/core/src/invite.ts`, `packages/core/src/family-rules.ts`, tests | Code alphabet and normalisation, expiry display, `canDo(role, action, bookState)` used by UI and tests. Randomness injected |
| Contracts | `packages/api/src/family.ts` | Typed inputs and results for create, revoke, accept, redeem, leave, undo; error detail enums (`full`, `role_disabled`, `code_taken`) |
| Migration | `supabase/migrations/20261012020000_coparent_invites_and_leave.sql` (name indicative; the data architect assigns the timestamp after the newest applied file) | `child_invites.code_hash`; new `create_child_invite(p_invite_id, p_child, p_role, p_token_hash, p_code, p_signs_as)` overload keeping the 3-argument one for two app releases (TDD 02 6.2); two-parent cap in create and accept; `contributors_enabled` and `family_share_consent_required` checks; `accept_child_invite_by_code(p_user, p_code)` granted to `service_role` only; `leave_child`; `undo_parent_join`; the `child_members_leave` policy narrowed so the RPC is the only leave path; `child_member_prefs.notify_letters`; audit value `member_join_undone`. Never edits an applied migration (`.github/migrations-applied.txt`) |
| Notifications migration | `supabase/migrations/20261012040000_coparent_notifications.sql` (indicative) | `push_tokens`, `notify_outbox`, trigger on `entries` for a parent's letter entering the book of a two-parent book, trigger on `member_joined`; `register_push_token`, `unregister_push_token` RPCs |
| Edge Functions | `supabase/functions/invite-redeem/`, `supabase/functions/push-send/` | Deno; typed ops logger with `req_id` only (TDD 06 5.3); APNs token auth with a `.p8` key in function secrets |
| Mobile UI | `apps/mobile/src/app/(tabs)/family.tsx` (exists), `apps/mobile/src/components/family/` (exists: `member-row.tsx`), new `invite-sheet.tsx`, `code-view.tsx`, `leave-sheet.tsx`, `apps/mobile/src/lib/family/copy.ts` | Strings go in `copy.ts`; the content agent moves them to `packages/content` (BRIEF coordination rules) |
| Mobile logic | `apps/mobile/src/lib/family/` | Invite creation into the outbox (F16), redeem, leave, push token registration, new-since-last-open marker |
| Tests | `supabase/tests/coparent.test.mjs`, function tests, Maestro flows | Titles carry requirement ids (BACKLOG DoD) |

**Libraries (standard over custom).** `expo-crypto` for random bytes and SHA-256; `expo-notifications` for the push token and the foreground handler; React Native `Share` for the share sheet; the QR view (P1) from a permissive library chosen at build time. Every one checked against the installed version's source, licence (MIT, Apache-2.0, BSD, ISC) and a release in the last 12 months (BRIEF).

**Data model deltas** (all new, one migration each as listed): `child_invites.code_hash bytea`, unique on live invites; `child_member_prefs.notify_letters boolean not null default true`; `push_tokens`; `notify_outbox`. `book_access` comes from F16.

**Sequencing.** BL-112 pending pack applied to staging, then F16 `book_access` (WP-F16-02), then WP-F11-01, then mobile WPs. Push work runs in parallel after its spike.

**Riskiest unknowns and spikes**
1. APNs from a Supabase Edge Function: HTTP/2, ES256 JWT, and the `interruption-level` passive key. None verified today (Apple's pages not opened). Spike WP-F11-09a sends one passive push to a TestFlight build from staging.
2. Universal links on a fragment URL: that `/j` matches the app's associated domains and the fragment reaches the app [A]. Spike with F21's site in week 6.
3. Clipboard handoff after install: iOS shows a paste permission prompt on read [A]. A-REQ-029 already reads only on tap; verify the prompt wording on iOS 17 and 26.

## 12. Work packages

| WP | Scope | Owner | Owns files or folders | Depends on | Done when (tests that must pass) | Mode |
|---|---|---|---|---|---|---|
| WP-F11-01 | Invite, cap, leave and undo migration | Data architect | `supabase/migrations/20261012020000_coparent_invites_and_leave.sql`, `supabase/tests/coparent.test.mjs` | BL-112 in staging, WP-F16-02 | `[F11-REQ-002] create idempotent on id`, `[F11-REQ-003] contributor role refused`, `[F11-REQ-004] third parent refused`, `[F11-REQ-008] undo window`, `[F11-REQ-011] leave keep and take out`, `[DATA-REQ-016] last parent guard`, existing `security_family.test.mjs` green; `npm run test:db` | Agent, `approve-migration` label and independent review (D-041). BL-175, BL-193 |
| WP-F11-02 | `invite-redeem` function | Data architect | `supabase/functions/invite-redeem/` | WP-F11-01, BL-236 | `[B-NFR-004] 11th failed code refused`, `[F11-REQ-007] global brake`, token never logged (canary) | Agent, fenced. BL-190 |
| WP-F11-03 | Pure invite and permission rules | Core engineer | `packages/core/src/invite.ts`, `packages/core/src/family-rules.ts`, tests | none | Code normalisation (case, dash, O/0), expiry formatting, `canDo` matrix equals 6.2 table | Agent |
| WP-F11-04 | Family contracts | Platform engineer | `packages/api/src/family.ts` | WP-F16-01 (package skeleton) | Type tests; error detail enums match the migration | Agent |
| WP-F11-05 | Inviter UI: sheet, share, code, member list, cancel, undo | Mobile engineer | `apps/mobile/src/app/(tabs)/family.tsx`, `apps/mobile/src/components/family/`, `apps/mobile/src/lib/family/` | WP-F11-03, WP-F11-04, WP-F16-05 (outbox) | Maestro flow F11-invite; AX5 component tests; `[F11-REQ-019]` | Agent. BL-176 |
| WP-F11-06 | Invitee flow: paste or code, consent hand-off, accept, welcome, signature | Mobile engineer | `apps/mobile/src/lib/family/join.ts`, welcome screen | WP-F11-05, F02 (BL-170, BL-171, BL-051, BL-054) | Maestro flow F11-join from a fresh install; `[F11-REQ-006]` gate No clears token | Agent. BL-176 |
| WP-F11-07 | Leave sheet and remaining-parent note | Mobile engineer | `apps/mobile/src/components/family/leave-sheet.tsx` | WP-F11-01 | `[F11-REQ-011]` UI states; `[F11-REQ-023]` shown once | Agent. BL-193 |
| WP-F11-08 | Shared-book reading states: audience line, recording elsewhere, new-since-last-open | Mobile engineer | Review destination component, letter view (coordinate with F06, F09 owners) | WP-F16-06 (pull) | `[F11-REQ-015]`, `[F11-REQ-020]`, `[F11-REQ-016]` byte-equality render test | Agent |
| WP-F11-09a | Spike: APNs passive push from an Edge Function | Platform engineer | `experiments/apns-spike/` (throwaway) | APNs key (founder) | One passive push lands on a TestFlight device; findings written in the PR | Pair |
| WP-F11-09 | Push tokens, notify outbox, `push-send` | Data architect, mobile engineer | `supabase/migrations/20261012040000_coparent_notifications.sql`, `supabase/functions/push-send/`, `apps/mobile/src/lib/family/push.ts` | WP-F11-09a, WP-F11-01 | `[F11-REQ-014] one push per author per book per 2 hours`, `[LEGAL-REQ-054] payload has no name, signature, text or id`, `[C-REQ-007] reminders muted, push arrives` | Agent, fenced. BL-196 |
| WP-F11-10 | Parent-pair visibility matrix and leak tests | Security engineer, QA | `supabase/tests/visibility_matrix.test.mjs` (BL-195 file) | WP-F16-03 (pull RPCs) | Matrix rows for author, other parent, left parent, undone joiner, stranger; Asha and sibling books | Agent. BL-195 |
| WP-F11-11 | `/j` page and associated-domains path | Web engineer (website thread) | Website repo `/j` route; AASA file | F21 | `[F11-REQ-005]` network capture; manual M-F11-1 | Agent in the website thread |
| WP-F11-12 | Second-consent sheet, compiled off | Mobile engineer | `apps/mobile/src/lib/family/family-share-consent.tsx` | WP-F11-01 | `[F11-REQ-018]` both config states | Agent |
| WP-F11-13 | QR invite (P1) | Mobile engineer | `apps/mobile/src/components/family/invite-qr.tsx` | WP-F11-05 | Two-device manual scan | Agent |

## 13. Open questions and assumptions

| Q | Who answers, by when | What changes |
|---|---|---|
| Q1 Two parents per book at v1.0 (D2). Blended families may want a step-parent as a parent | Founder, 23 Oct (with DR-03) | If no cap: add "existing parent agrees" before a third parent joins |
| Q2 Undo window length for a misused invite (D3): 72 hours | Founder, 23 Oct | A constant in the migration and `family-rules.ts` |
| Q3 D-050 second consent at first share | Counsel, end of week 6 | Turn on WP-F11-12 and the server check |
| Q4 Co-parent letter pushes on by default, passive, generic (D6) | Founder, 30 Oct | Default of `notify_letters` |
| Q5 B-REQ-025 "Leave my letters after account deletion" | Counsel, before v1.1 | A P2 flow |
| Q6 Evidence standard for a support removal of a parent | Founder with counsel, by F20 freeze | F20 runbook |
| Q7 `/j` page on the Vercel site: fragment-only, no analytics, no third-party script | F21 owner, week 6 | F21 requirements |
| Q8 Copy written for contributors at v1.0: `familyTab.coParentBody` ("chooses which family letters go in"), `familyTab.rolesTitle`, `family.shareMessage.*` and `notifications.familyLetter` (uses `{signsAs}`, so only renderable on the device) | Content owner, week 7 | Copy edits in `packages/content` |

| A | Assumption | How we validate |
|---|---|---|
| A1 | Most co-parents accept within 7 days | Invite acceptance aggregate in beta C1 |
| A2 | Passive pushes are noticed without being intrusive | Study 3 interviews; `notification_opened` rate |
| A3 | Most co-parents share one Apple Family, so Plus reaches them | Unverified; ask in Study 3; watch double purchases in ASC |
| A4 | APNs works from Supabase Edge Functions with HTTP/2 | WP-F11-09a |
| A5 | A co-parent who cannot read the other's language still values the book | Study 3 (U6) |

## 14. Sources

- Rulebook and decisions: `docs/prd/v2/_AUTHORING.md` (B1, B2, B7, B14, B15); `docs/agents/BRIEF-2026-10-03.md`; `docs/DECISIONS.md` D-002, D-020, D-021, D-024, D-025, D-026, D-036, D-039, D-041, D-043, D-050; `docs/prd/v2/09-decisions-and-risks.md` DR-03, DR-07, DR-13, DR-15, R-05, R-09.
- V2 context: `01-problem.md`, `02-customers.md` (P2, P4, U6), `03-goals-and-principles.md` (principle 1, 4.2), `04-market.md` section 4, `05-feature-map.md`.
- Requirements: `docs/prd/B-first-run-and-family.md` (F5, F7, F8, F9, B-REQ and B-NFR rows); `docs/prd/A-entry-and-auth.md` F7 and A-REQ-028, -029, -034; `docs/prd/PRD.md` K-09, K-10, K-18, K-22, K-28, K-35, PRD-REQ-004, -014, -015, -021, -022, 7.2, 7.3; `docs/prd/C-habits-pricing-settings.md` C-REQ-007, C-REQ-028.
- Legal: `docs/legal/DELETION_AND_EXPORT_SPEC.md` DATA-REQ-012, -014 to -016, -027, 2.6.1; `docs/legal/ENGINEERING_REQUIREMENTS.md` LEGAL-REQ-006, -014, -022, -024, -025, -026, -032, -034, -054.
- Technical: `docs/tdd/02-sync-backend.md` finding 1, 2.4, 6.2; `docs/tdd/04-security-identity.md` 3.2.1, 3.4; `docs/tdd/06-performance-reliability.md` 5.3; `docs/BACKLOG.md` BL-112, BL-170, BL-175, BL-176, BL-190, BL-193 to BL-196, BL-233, BL-236, BL-237, BL-269.
- Code and schema: `supabase/migrations/20260930000000_scribe_core.sql`, `20261002020000_data_governance.sql`, `20261003000000_security_and_family.sql`, `20261003010000_children_and_entitlements.sql`, `20261003020000_purge_batching.sql`; `supabase/tests/security_family.test.mjs`; `.github/migrations-applied.txt`; `apps/mobile/src/app/(tabs)/family.tsx`; `apps/mobile/src/lib/store.ts`; `packages/core/src/plan.ts`; `packages/content/src/strings.en.ts` (`family.*`, `familyTab.*`, `children.*`, `book.recordingElsewhere`, `review.destination.*`, `errors.inviteExpired`, `sensitiveConsent.*`, `notifications.familyLetter`); `packages/analytics/src/catalog.ts`.
- Research: `research/R1-competitors-by-feature.md` F11 (R1-S1, R1-S2, R1-S4, R1-S7, R1-S10, R1-S12, R1-S20, R1-S24, R1-S25, R1-S40, R1-S47, R1-S62); `research/R2-customer-evidence.md` T10, R2-S13, R2-S17, R2-S30, R2-S31; `research/R4-platform-and-policy.md` 1.2 (R4-S6, R4-S17, R4-S18, R4-S19), section 10 C2, C3; `docs/research/USER_RESEARCH.md` S3x, S25, S30, R5.
