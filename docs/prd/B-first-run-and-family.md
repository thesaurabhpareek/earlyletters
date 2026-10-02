# Early Letters launch PRD, Section B: first-run profile, family, privacy, personalization

Owner: PM Lead B. Draft, 1 Oct 2026. **Revised Oct 2 2026 per PRD.md conflict log** (K-01, K-02, K-07, K-08, K-09, K-12, K-18); [PRD.md](PRD.md) wins where they differ. iOS at launch; every requirement must also work on Android (one Expo codebase). Siblings: **Section A** (launch, intro, sign-in, "I was invited"), **Section C** (reminders, celebrations, settings, pricing, paywall).

---

## 1. Goals and non-goals

**Goals**
1. First saved letter with only two required child facts (name; birthday or due date). Evidence: USER_RESEARCH 6 (R1, R2), 2.1.
2. Every author signs as who they are to the child ("From Nani") and speaks their own languages. Evidence: USER_RESEARCH 1.4 (multilingual row); COMPETITIVE_RESEARCH 2, takeaway (d).
3. A grandparent can add a first letter from a link, with no app install and no password. Evidence: USER_RESEARCH 6 (R14); COMPETITIVE_RESEARCH 2 (Remento), 5.3.
4. Parents control the book without ever editing anyone's words. Evidence: USER_RESEARCH 5 (fear 5), 6 (R13); the aunt incident [S28].
5. Private by default, minimal data, honest about who can read and hear what. Evidence: USER_RESEARCH 2.1 (63% worry about location, 62% about embarrassment).
6. Every personalization question changes something the user can see. No question without a use.

**Non-goals (launch)**
- Any paywall on co-parents, family, invites or approvals (COMPETITIVE_RESEARCH 2 takeaway (c), 7.8).
- Child gender, surname, birth weight, birth place, location, contacts access. Never collected.
- Copy for pregnancy or infant loss. We ship a graceful, quiet path (B-REQ-014), not words about it.
- Hindi app UI (P2); printed-book themes (print is later, ARCHITECTURE 10); child accounts.

---

## 2. User stories

- **US1** Tired parent: name the baby and start talking in under 90 s.
- **US2** Expecting parent: write before birth, into "Before You".
- **US3** Parent of two or twins: switch children in one tap and always see who I'm writing to.
- **US4** Hindi-English family: my words stay in the language I said them, names spelled my way.
- **US5** Parent: invite my partner as an equal, and grandparents as writers.
- **US6** Grandparent: tap a WhatsApp link, talk, done; large text.
- **US7** Parent: choose which family letters go in the book; nobody edits anyone's words.
- **US8** Any author: leave or be removed without anyone's words being destroyed.
- **US9** Parent: a letter that opens at an age.

---

## 3. Flows

### F1. First run, new parent (after Section A's intro; sign-up timing is A's call)
Target: R1, first saved letter at ≤ 90 s median (USER_RESEARCH 6).
1. **Who is this book for?** Name field (required, 1 to 60 characters, any script). Help: "First name, or the name you use at home."
2. **Birthday or Not here yet.** Segmented control. Birthday: date wheel, no future dates. Not here yet: due date wheel, today to +10 months.
   - Branch: "My partner already started one" → "Ask them to send you an invite from Family", then A's "I was invited" entry. Prevents duplicate books.
3. **What does {child} call you?** `onboarding.signsAs.examples` chips or free text (1 to 30). Preview "From Papa". Required: every letter is signed.
4. **Which languages do you speak with {child}?** Optional. Chips: English, Hindi, "Another language". With Hindi: "How should Hindi look in your letters?" Devanagari / Roman letters / As spoken (USER_RESEARCH 6 R12). It sits before the first letter because it sets that letter's transcription. Skip = automatic detection.
5. **Tonight**, with the first prompt. Speak or Type. First letter saved (owned by the capture spec).
6. **After the first save, "Make it yours"**: optional skippable cards: What matters (F3), Names and words (F4), Invite family (F5), photo. Unfinished cards rest in Settings, never as nags.
   - *Revised Oct 2 2026 per PRD.md conflict log K-02:* first run never asks for notification permission and never shows a reminder step. The reminder priming card belongs to C (C-REQ-001) and appears on a later Tonight view.

Edge cases
- No account yet (if A defers sign-up): stored locally, created via `create_child` at sign-up. Invites need an account; tapping Invite starts A's sign-up.
- Adoption: birthday picker allows "I only know the month" (stores month precision; chapters still work). Optional "The day {child} came home" date is P2.
- Twins or more: "Add another child" repeats steps 1 to 2 with the date prefilled; one book each. *Revised Oct 2 2026 per PRD.md conflict log K-12:* children added together in first run are free (provisional, founder to confirm) and no Plus sheet ever appears in first run.
- Name in Devanagari or with diacritics: accepted as typed; never transliterated.

### F2. Children: add, switch, expecting to born, remove
1. Add: Settings > Children > Add a child, or the child switcher. ≤ 3 taps to a second child's book (R3). *Revised Oct 2 2026 per PRD.md conflict log K-12:* a second or later child's book is part of Plus (founder decision 2 Oct 2026), so the third tap opens the Plus sheet for a Free user; twins and multiples added together are free (provisional). Every existing book stays writable after a lapse (C-REQ-028).
2. Switch: "For Asha" with a chevron atop Tonight and Book. Listening and Review always show "To Asha" plus the audience line (DESIGN_LANGUAGE 12); the child can be changed in Review before save. *Revised Oct 2 2026 per PRD.md K-12:* the switcher lists active books (youngest first), then "Add a child" and "Hidden books"; with one child the name shows without a chevron. The last opened child is remembered per device. A family member invited to several books sees only those books.
2a. Per-child settings (*added Oct 2 2026 per PRD.md K-12*): each child has a Settings page "{child}'s book". Shared for the whole book (parents edit): name, nickname, birthday or due date, photo, book look, family can read, hide, delete. Per person for this child: sign my letters as, include in my reminders, pause celebrations; parents also set auto-add per family member. Per person for all children: reminder cadence and time, languages, reading size, analytics choice.
3. Expecting to born: from the child row, "{child} is here?" → birth date, optional name change (placeholder names are common). Letters dated before birth stay in **Before You**; chapters re-derive from the birth date (`packages/core/src/age.ts` already returns "before birth").
   - Never a due-date countdown or "due today" message. 14 days past the due date, the only change is a quiet "Update {child}'s details" on the Settings row. No push, no card.
4. Remove child (graceful, no loss copy): Settings > {child} > "Hide this book" stops prompts, reminders, month, birthday and celebration notifications on every member's device; readable from Settings > Hidden books; restorable. "Delete this book" sits on the same screen (B-REQ-016).

### F3. What matters to you (goals)
"What matters most to you? Pick any." Multi-select, skippable, editable in Settings. Each answer has a visible effect:

| Choice | Visible effect | Owner |
|---|---|---|
| Remember the everyday | Prompt mix favours everyday prompts; "Not much today" on Tonight | B, prompt engine |
| Keep our voices | Backup explainer once after the 5th recording; Read together card at month end | C |
| Bring family in | Invite card first; `family` prompts on; family-letter digest | B, C |
| Keep our languages | Script choice; `heritage` prompts; Hindi invite text (P1) | B, content |
| Letters for when they're older | New entries default to "A letter"; birthday and sealed templates surfaced (P1) | B |
| A book to hold | Chapter completion surfaced; free PDF export shown after month 1 | B, C |

C owns reminder cadence; goals are an input, within R7 (≤ 2 per week). Evidence: USER_RESEARCH 3, 6 (R7, R8).

### F4. Names-and-words dictionary and the name check
1. Automatic, P0: child name, nickname, own and family signatures become `dictionary_terms` rows (`child`, `nickname`, `self`, `family`), fed to the transcription prompt (ARCHITECTURE 4 step 2). Evidence: COMPETITIVE_RESEARCH 4 complaint 8, 7.2.
2. Manual, P1 card "Your words, spelled your way": names, home words, places, pets.
3. **Say the name three times**, P1, only once the on-device model is ready (574 MB, downloads after first run, ARCHITECTURE 11 R2): a one-time Tonight card, or from Review when the name was low-confidence.
   1. Three clips ≤ 4 s, transcribed on device with the dictionary prompt **off** to learn natural mishearings.
   2. Mishearings go to `heard_as`; clips are deleted at once, never uploaded.
   3. All match: "Got it." Otherwise "We heard: X. Is that how you spell it?"
   - Microphone denied: card says it's optional; no repeat ask.

### F5. Invite co-parent and family (app side)
1. Family tab > "Invite someone to write". Choose role:
   - **Co-parent** (`parent`): "Writes, reads the whole book, chooses which family letters go in."
   - **Family** (`contributor`): "Writes to {child}. You choose which letters go in the book."
2. "What does {child} call them?" chips (Nani, Dadi, Nana, Dada, Grandma, Grandpa, Aunty, Uncle, Other) or free text. Optional: first name, their languages, "Larger letters for them" (on for grandparent chips, DESIGN_LANGUAGE 12).
3. Multi-child families: "Which books?" checkboxes (P1; P0 is one child per invite). *Revised Oct 2 2026 per PRD.md K-12:* sharing is per child. Each book has its own member list and roles; an invite to one book never opens another. At P0 the invite sheet states "This invite is for {child}'s book only." (`children.sharing.oneBookNote`). The P1 picker defaults to the child currently selected, not all children.
4. Share sheet with `family.shareMessage` texts and the link; **Show code** gives an 8-character code to read aloud (R5).
5. Member list: "Invited", Send again, Cancel invite.

Branches and edge cases
- **Expired** (7 days for Co-parent, 14 days for Family; *revised Oct 2 2026 per PRD.md K-18*): invitee sees `errors.inviteExpired`; inviter sees "Invite expired" with Send again (new token).
- **Co-parent declines or ignores**: "Not now" on the invitee side notifies nobody; row stays "Invited" until expiry. Decision: silence beats a rejection notice inside a family.
- **Invitee already keeps a book for this child**: offer "Bring your letters into this book" (P1, B-REQ-021); until then both coexist.
- **Contributor tries to invite**: not offered; server refuses.
- **Forwarded link**: single-use; the parent sees who joined and can remove them.
- **Apple private relay**: no effect; no email lookup (USER_RESEARCH 2.3).

### F6. Grandparent contribution without the app (web contribution page)
Evidence: USER_RESEARCH 6 (R14), 1.4 (grandparents struggle with app UX); COMPETITIVE_RESEARCH 2 (Remento: "no apps, downloads, or logins"), 4 praise 5.
1. Link opens the app if installed (universal link / Android App Link, then A's "I was invited"); otherwise the **web contribution page**.
2. Large Print if the inviter chose it. "Welcome, Nani. {inviter} is keeping a book of letters for {child}. Yours can be part of it." Child's first name only. "Only {child}'s parents see your letters until they go in the book."
3. "Tap the red circle and talk." One 96 px button; the page explains the microphone before the browser asks.
4. Recording: elapsed time, Pause, Done. No live transcript (no model in the browser).
5. Play it back, "Send to {inviter}", "Say it again", or "Type instead".
6. "Your letter is on its way to {inviter}. Come back any time with this same link."
7. Transcription runs on the parent's phone, on device, when the letter arrives (no third-party AI; ARCHITECTURE 2, attribute 3). The contributor later sees their words, with "Keep it word for word".
- Return access: the single-use invite creates an anonymous session plus a **personal return link** (hashed, revocable). "Send {signsAs} a new link" retires the old one. *Revised Oct 2 2026 per PRD.md conflict log K-07, K-08:* the anonymous session is created at the first Send, not on page load, and Send includes the 18+ confirmation. Anonymous auth is used on the web page only, never in the app.
- Edges: microphone blocked → Type instead. Browser can't record → "Type your letter, or open the link on another phone." Interrupted upload → held and retried, shown as "Not sent yet".
- "Get the app" is offered after the second letter; the same profile continues there (account linking).

### F7. Approving family letters, removing someone, leaving
Approval (either parent; first action wins):
1. Parents get `notifications.familyLetter` (timing: C).
2. "Letters from family": play, read, **Add to the book** or **Keep it aside** ("{signsAs} will not be told"). No edit control for anyone else's words.
3. P1: "Send a thank you"; per-person auto-add, default off.
- Contributor sees "With {inviter}" (pending or aside) or "In the book".

Remove family member (parents only): they lose the book and can't write; added letters stay unless "Also take their letters out" is ticked (set aside, never deleted). Honest line: "Recordings they already played may still be on their phone" (ADR 0006: revocation rotates the key for new files only).

Leave (anyone): "Leave my letters in the book" (default) or "Take my letters out"; own letters stay readable and exportable. **Last-parent guard**: a sole parent with contributors deletes instead (B-REQ-016).

### F8. Relationship breakdown
**Decision:** two parents are equals. In v1 neither can remove the other, delete the other's letters, or delete the shared book.
1. Each can make their own letters private (singly, or all at once P1) and default new letters to private.
2. Each can leave (F7), keeping their letters; export stays free (USER_RESEARCH 6 R15).
3. Safety cases (e.g. court order): support verifies and removes a member via a service-role runbook (Ops; Help entry in C).
4. Contributors belong to the child, not to the inviting parent.

### F9. Sharing and visibility model
| Who | Own letters | Co-parent's letters | Family letters | Private letters of others | Child profile |
|---|---|---|---|---|---|
| Parent | All | In the book | Pending, set aside and in the book | Never | Read, edit |
| Contributor | All, with status | Only if "Family can read the book" is on (default off) | Others' added letters, same rule | Never | Name, nickname, photo; no edit |
| Removed or left member | Read and export only | None | None | Never | None |

Entries are private unless the author picks "Add to {child}'s book" (`review.destination`). *Revised Oct 2 2026 per PRD.md conflict log K-09:* `raw_transcript`, `machine_edits` and `stt_meta` are readable by the author only; everyone else reads entries through a security-barrier view without them, and "Show exactly what I said" appears only on your own letters. Sealed letters are visible to non-authors only as "A sealed letter from Papa, to open when {child} is 18".

### F10. Appearance, reading size, themes, templates
- App appearance: System (default), Light, Dark. Per device.
- Reading Size: 1.0, 1.2, Large Print 1.45 (`tokens.readingScale`), per reader per device; offered at first launch to invitees (DESIGN_LANGUAGE 3).
- Book themes (P1): Paper (default), Linen, Plain (prints well at home). Per child, for reader and PDF.
- Letter templates (P1): Birthday letter, A first (any first the author names), Before You (automatic), Sealed letter. A template sets an occasion label, a starting question above the recorder, and an ornament.
- **Limits** (CLAUDE.md constitution): never insert, alter, reorder or summarise words; never hide signature or provenance line; never touch audio. "Dear {child}," stays a placeholder.

---

## 4. Requirements

P0 launch blocker, P1 launch quarter, P2 later.

| ID | P | Requirement |
|---|---|---|
| B-REQ-001 | P0 | Required: child name and birthday or due date. All else optional. |
| B-REQ-002 | P0 | Author signature ("What does {child} call you?") captured before the first letter. |
| B-REQ-003 | P0 | Languages and Hindi script preference, driving transcription. |
| B-REQ-004 | P0 | Multiple children; switcher; "To {child}" while recording; changeable before save. |
| B-REQ-005 | P0 | Expecting mode with due date and Before You chapter; transition to born. |
| B-REQ-006 | P0 | Automatic dictionary terms from names and signatures. |
| B-REQ-007 | P0 | Invite by link and code with explicit role; parent-only invite creation. |
| B-REQ-008 | P0 | Web contribution page: record or type, send, return link, no install, no ads. |
| B-REQ-009 | P0 | Family letter approval by either parent; contributors cannot place letters in the book directly. |
| B-REQ-010 | P0 | Remove member and leave, with letter-retention choices. |
| B-REQ-011 | P0 | Private-by-default entries; visibility per F9; "Family can read the book" default off. |
| B-REQ-012 | P0 | Appearance (System, Light, Dark) and Reading Size incl. Large Print. |
| B-REQ-013 | P0 | Goals capture with the mapped effects in F3. |
| B-REQ-014 | P0 | Hide a child's book: stops all child-anchored notifications for all members within one sync. |
| B-REQ-015 | P0 | No due-date countdown or due-date push, ever. |
| B-REQ-016 | P0 | Only a sole parent deletes a book; with a co-parent, delete = leave and remove own letters. 30-day restore; contributors get export. |
| B-REQ-017 | P1 | Name check (say it three times). |
| B-REQ-018 | P1 | Sealed letters (age or date), author can unseal early. |
| B-REQ-019 | P1 | Book themes and letter templates per F10. |
| B-REQ-020 | P1 | Write to several children at once and sibling letters ("From Asha, with Papa"). |
| B-REQ-021 | P1 | Merge a duplicate book into the shared one; move a saved letter to another child. |
| B-REQ-022 | P1 | Hindi invite messages and Hindi web contribution page. |
| B-REQ-023 | P1 | Per-person auto-add, thank you, "Make all my letters private". |
| B-REQ-024 | P1 | Optional author and child photos. |
| B-REQ-025 | P2 | "The day {child} came home"; Hindi app UI; leave letters after account deletion. |

**Decision on research items:** due-date mode is **P0** (USER_RESEARCH 2.1, R2; [S27] missed pregnancy pages). Sealed letters are **P1** (R21, [S30]; Dearest parity, COMPETITIVE_RESEARCH 7.19): the first unlock is years away, and hiding text needs a new view.

### Acceptance criteria (Given/When/Then)

**B-REQ-001**
- Given "Asha" and a birthday, When Continue, Then a child exists with no other fields, And nothing asks for surname, gender, photo or contacts.
- Given no birthday or due date, Then Continue stays disabled with "We sort letters by {child}'s month of age."

**B-REQ-002**
- Given the parent picks "Papa", Then their letters to this child are signed "From Papa".
- Given someone is "Nani" to one grandchild and "Dadi" to another, Then each book shows its own signature.

**B-REQ-003**
- Given Hindi and "Devanagari", When they record, Then transcription runs with Hindi enabled, Hindi words render in Devanagari, And nothing is translated or transliterated.
- Given the step was skipped, Then automatic detection is used.

**B-REQ-004**
- Given two children, When recording, Then "To {child}" is visible, And in Review it can be changed, And the save goes to the chosen child.
- Given the switcher, Then a second child's empty book is ≤ 3 taps away (for a Free user, the third tap is the Plus sheet; revised Oct 2 2026 per PRD.md K-12).
- Given two children, When a parent turns off "Include Asha in my reminders", Then that parent gets no reminder naming Asha, And the co-parent's reminders are unchanged.
- Given Nani is invited to Asha's book only, When she syncs, Then she receives nothing from the sibling's book.

**B-REQ-005**
- Given due date mode, When a letter is saved, Then it is in "Before You".
- Given a birth date is entered, Then earlier letters stay in Before You and chapters start from it.
- Given the due date passed without a birth date, Then no notification or Tonight card mentions it.

**B-REQ-006**
- Given "Asha", nickname "Ashu", signature "Papa", Then `dictionary_terms` rows exist for each, And child-level terms are readable by every member.

**B-REQ-007**
- Given a parent creates a Family invite, Then the link holds a single-use token, 14-day expiry (Co-parent: 7 days; revised Oct 2 2026 per PRD.md K-18), role `contributor`.
- Given a contributor calls invite creation, Then the server rejects it.
- Given an expired link, Then the page shows `errors.inviteExpired`.
- Given 10 wrong codes in an hour from one device, Then entry is blocked for an hour.

**B-REQ-008**
- Given no app, When a grandparent opens the link in iOS Safari or Android Chrome, Then they record, play back and send in ≤ 4 taps after microphone permission, with no password or email.
- Given they reopen the return link, Then they see their letters and statuses.
- Given "Send {signsAs} a new link", Then the old link stops working.
- Given an iMessage or WhatsApp preview, Then it shows no child name or photo.

**B-REQ-009**
- Given a contributor sends a letter, Then both parents see it pending and no other contributor sees it.
- Given parent A adds it, Then parent B sees it added and the contributor sees "In the book".
- Given any parent, Then no control edits a family member's words.

**B-REQ-010**
- Given Nani is removed without "Also take their letters out", Then her added letters stay, she can't read the book or write, And she can still read and export her own letters.
- Given a sole parent with contributors tries to leave, Then Delete the book is offered instead.

**B-REQ-011**
- Given a letter saved without choosing, Then it is private.
- Given "Family can read the book" off, When a contributor syncs, Then they receive only their own entries.

**B-REQ-012**
- Given Large Print, When reading a letter at AX5 Dynamic Type, Then text never truncates and controls stack.

**B-REQ-013**
- Given "Bring family in", Then the Invite card is first and a family prompt appears within the first 7 prompts.
- Given no goals, Then defaults apply and nothing asks again.

**B-REQ-014**
- Given Asha's book is hidden, When any member's device syncs, Then no reminder, month-open, birthday or celebration for Asha remains scheduled.

**B-REQ-016**
- Given two parents, When A deletes, Then the book remains for B and only A's letters go (30-day restore).
- Given a sole parent deletes, Then each contributor gets "Save a copy of your letters to {child}" with a 30-day export link.

**B-REQ-017**
- Given transcripts "Aasha", "Asha", "Usha", Then `heard_as` stores "Aasha" and "Usha", And the clips are deleted.

**B-REQ-018**
- Given Papa seals a letter until 18, Then the co-parent sees only "A sealed letter from Papa, to open when {child} is 18", And it opens on that date, And the UI says the seal is a privacy lock, not encryption.

**B-REQ-019**
- Given any theme or template, Then rendered text equals stored `final_text` and signature and provenance are shown.

**B-REQ-020**
- Given "Write to both", Then one entry per child shares a group id, each with that child's visibility.

---

## 5. Non-functional requirements

| ID | Area | Requirement |
|---|---|---|
| B-NFR-001 | Privacy | *Revised Oct 2 2026 per PRD.md K-01:* all events are sent only after analytics opt-in; children are referred to by ordinal (`first`, `second`, `third_plus`), never id or name. No child name, signature, language names or token in analytics, logs or crashes (CLAUDE.md). Allowlisted events: `child_added {mode}`, `invite_created {role}`, `invite_accepted {role, surface}`, `family_letter_reviewed {decision}`, `goals_set {keys}`, `languages_set {multilingual}`. Language names can proxy ethnicity. |
| B-NFR-002 | Privacy | Tokens travel in the URL fragment (`/j#t=...`) so servers never log them; only SHA-256 hashes stored (existing pattern). Link previews are generic. |
| B-NFR-003 | Security | RLS mapping below; each rule gets an access test and a PowerSync parity test (ARCHITECTURE 8). |
| B-NFR-004 | Security | Invite creation rate limit 20 per parent per day; code entry 10 attempts per hour per device; return links revocable and rotated on removal. |
| B-NFR-005 | Security | Web contributor audio is encrypted in the browser to the child's inbox public key before upload, so the server never holds plaintext audio (extends ADR 0006). |
| B-NFR-006 | Accessibility | Dynamic Type to AX5; VoiceOver and TalkBack; 44 pt targets (56 primary); web WCAG 2.2 AA, 48 px targets, 200% zoom. |
| B-NFR-007 | Localization | Strings in `packages/content`; names in any script; relationship names never translated; locale dates; birthdays as calendar dates (no timezone shift); no hardcoded LTR. |
| B-NFR-008 | Performance | First-run screens interactive ≤ 300 ms on the oldest supported iPhone; invite link ≤ 1 s; web page LCP ≤ 2.5 s on 4G, ≤ 300 KB; resumable upload. |
| B-NFR-009 | Offline | F1 to F4 work offline; invites and approvals queue visibly. |
| B-NFR-010 | Children's data | Counsel: COPPA scope (collected from parents, about children), India DPDP parental consent, GDPR/UK GDPR. Child data builds that child's book only, never marketing (CREATIVE 7). |

### RLS mapping to the current schema

| Rule | Today (`20260930000000_scribe_core.sql`, hardening) | Needed |
|---|---|---|
| Edit child | `children_member_update` allows any member, including contributors | Parents only |
| Create invite | `create_child_invite(p_child)` lets any member mint a **parent** invite (role defaults to `parent`) | Parent-only, explicit role argument. **Security fix, P0.** |
| Book read | `entries_select`: any member reads `in_book` entries | Parents: in book, plus pending family letters. Contributors: own entries, plus approved book entries only when `family_can_read` |
| Put in book | Author sets `in_book` directly | Contributor's `in_book` means "sent"; only `review_family_letter()` sets approval |
| Leave | `child_members_leave` lets the last parent leave and orphan the child | Last-parent guard |
| Remove other | Not possible | `remove_child_member()` parent-only, contributors only |
| Dictionary | Owner-only | Child-level name terms readable by members of that child |
| Profiles | Members read whole profile row | Members read signature, display name, avatar only; languages and goals in an owner-only table |
| Photos | Read if entry in book and member | Unchanged, plus child-photo bucket readable by members |

---

## 6. Data model deltas (new migration; never edit applied ones)

1. `profiles`: add `avatar_path`.
2. New `profile_settings` (owner-only RLS): `languages text[]` (BCP-47), `hindi_script` (`devanagari`, `latin`, `as_spoken`), `goals text[]`, `entry_default` (`note`, `letter`), `new_entries_private_default bool`.
3. `children`: add `nickname`, `due_date`, `birth_date_precision` (`day`, `month`), `photo_path`, `book_theme`, `family_can_read bool default false`, `hidden_at`, `deleted_at`, `inbox_public_key`; check `date_of_birth is not null or due_date is not null`.
4. `child_members`: add `signs_as` (per-child override of `profiles.signs_as`), `relation`, `auto_add_letters bool default false`, `invited_by`.
5. `child_invites`: add `signs_as`, `relation`, `display_name`, `languages_hint text[]`, `large_print bool`, `code_hash`, `revoked_at`. Replace `create_child_invite(uuid)` with `create_child_invite(p_child, p_role, p_signs_as, p_relation, ...)`, parent-only. P1: `invite_children` for multi-child invites.
6. `entries`: add `approval` (`not_needed`, `pending`, `added`, `set_aside`) set by trigger from the author's role, `reviewed_by`, `reviewed_at`, `occasion`, `sealed_until date`, `with_child_id`, `letter_group_id`, `source` (`app`, `web`). Sealed text is exposed to non-authors through a security-barrier view that nulls `final_text`, since RLS cannot hide columns.
7. New `member_return_links` (hashed token, profile, child, created, revoked).
8. Functions: `review_family_letter`, `remove_child_member`, `leave_child(p_keep_in_book)`, `hide_child`, `delete_child`, `revoke_invite`, `set_family_can_read`; P1 `merge_child_into` and `move_entry` (copy with identical `raw_transcript` and `captured_at`, tombstone original, so the immutability trigger stays intact).
9. Storage: `child-photos/{child_id}/`, `avatars/{profile_id}/`, `inbox/{child_id}/{entry_id}` (ciphertext from the web).
10. `dictionary_terms`: unique on `(owner_id, child_id, term)`; shared-read policy for child-level `child`, `nickname`, `family` kinds.
11. Content: prompt band `before` (0 of 104 prompts cover pregnancy today) and `tags` (`heritage`, `older`).
12. Auth: anonymous web sessions linkable to a full account later (Supabase capability **to verify**). *Revised Oct 2 2026 per PRD.md conflict log K-08:* web contribution page only, created at the first Send; the app never uses anonymous auth.

---

## 7. Copy rules (VOICE.md applies in full)

- Relationship names as families use them: "From Nani", never "Contributor: Grandmother". Roles are "Co-parent" and "Family"; never "admin", "owner", "contributor" or "member" in UI.
- Privacy once, plainly, when it matters: "Only the family you invite can see your letters."
- Removal is neutral: "Nani won't see {child}'s book anymore. Her letters already in the book stay." Never "kicked" or "revoked".
- Hidden or deleted books and expecting mode: no loss, ending, countdown or urgency language (VOICE legacy and no-guilt rules).
- Languages: "Your words stay in the language you said them." Never "mixed" or "broken"; never promise translation.
- Templates "help you start"; nothing implies software writes.
- Grandparent screens: one instruction per sentence.
- Mechanics enforced by `packages/content/test/rules.test.ts`.
- Fix: `family.contributorWelcome.privacyNote` says only {inviter} sees letters; both parents do. Use the line in F6.
- Flag to C: `onboarding.reminder.body` "One gentle nudge a day" conflicts with R7 (≤ 2 per week).

---

## 8. Open questions

1. Account before or after the first letter (A)? B works either way; invites need an account.
2. Approval default (USER_RESEARCH question 5)? Proposed: approve each letter; per-person auto-add P1.
3. Does "Family can read the book" off by default starve grandparents of the reward? Test in dogfood.
4. Server transcription (with consent, ZDR) so web contributors review words at once? Proposed P1.
5. Is on-device Whisper good enough on short Hindi names? Phase 0 data (ARCHITECTURE 10).
6. A co-parent's account deletion removes their letters from the shared book. "Leave my letters for {child}" (P2) needs counsel.
7. ~~7-day expiry for grandparents?~~ Resolved Oct 2 2026 (PRD.md K-18): 14 days for Family, 7 for Co-parent.
8. The return link is a bearer credential. Acceptable, or phone OTP on new devices?

---

## 9. Dependencies

**On Section A**
- "I was invited" accepts a link, pasted link or 8-character code; routes Co-parent to the app, Family to app or web.
- Sign-up timing and local-to-server handoff via `create_child`; account linking for web contributors who install later.

**On Section C**
- Never paywall invites, family authors, approvals, or own-letter read and export, even after leaving (USER_RESEARCH 6 R15).
- Reminders and celebrations read `hidden_at`, expecting mode and goals; no due-date reminders. C delivers `familyLetter` and `familyAdded`.
- Settings hosts Children, Family, Languages, Names and words, Appearance, Reading Size, What matters, Hidden books, Delete.
- Contributors never start or consume a trial; grandparent gifts (USER_RESEARCH 4.4) attach to the child's book.

**Others**: ADR 0006 update (inbox key); prompt tags and `before` band; `apps/web` (ADR 0010) hosts the contribution page.
