# BL-804 and BL-815: the exact words (10 Nov 2026)

Written by `content`, docs only. It decides nothing and changes no source file. Every string below **needs founder word approval**. Rows marked **COUNSEL** state where letters or recordings are, or what a person agrees to, and are counsel-read before they ship (`docs/legal/in-app-disclosures.md`). Nothing here is applied to `packages/content`; BL-824 and BL-794 wire the BL-804 words after approval.

Facts every line below keeps true (Build 12): recording backup is OFF; the Family tab and co-parent surfaces are hidden; the words of a letter go to the account, and a recording stays on the phone that made it. No line says "safe" or "kept safe" (council conflict 4; counsel decides that wording later). No line implies a machine writes anything. The child is never gendered; `{child}` is used, and a nameless child reads through `onboarding.childFallback`.

Read against, and not contradicted: `packages/content/BRAND.md` glossary, `VOICE.md`, the executive council slice 3 (9 Nov), PR #735 (head 45ff115b74ef66aeb236166e7efe05e3119963f8, the untrue-copy fixes) and NX-31 revision 3 (branch `docs/nx-31-onboarding-8nov`, R8, R21, section 10).

## Part 1. BL-804: Screen 2 and the sign-in arrival, two variants

Satisfies NX-31-R8, NX-31-R21, NX-34-R12. **Variant B (backup off) is the default and the only one wired in Build 12.** Variant A (backup on) is written so it exists, is rule-checked, and is not reachable.

### 1.1 How a variant is chosen (a rule, not a string)

- Default: B. A build constant keeps it B.
- A is shown to an account only when ALL of NX-31-R21 hold for that account: the build's backup capability is on; the sensitive-data consent is given; the backup opt-in is given; the backup kill switch is not tripped; backup has started for the account. The line follows the account, never the build.
- Done when (BL-804): both variants pass `packages/content/test/rules.test.ts`, and a test shows the B string is the one rendered in a Build 12 profile (proposed title: `[NX-31-R21] Build 12 renders variant B on screen 2 and on the arrival`).

### 1.2 Screen 2, what stays as it is (no new words)

| Element | Words | Source |
|---|---|---|
| One-line description | Letters to your child, in your own words and voice. | `onboarding.welcome.subtitle`, unchanged, from the brand descriptor |
| Privacy line | Private by default. Never sold, never used for ads. | `en.trust.short`, registered, word for word |
| Buttons | Sign in with Apple / Sign in with email | BRAND.md glossary (not "Continue with ..."); the Apple button is the system control |

Screen 2 must not render `authCopy.sheet.why` ("An account keeps your book safe when you change phones.") or `authCopy.sheet.privacy` ("Only you and the people you invite..."). Both are registered, both say things Build 12 does not do, and #735 left them for counsel. On screen 2 the body below replaces `why`, and `en.trust.short` replaces `privacy`. No registered text is edited here.

### 1.3 Variant B, backup off (wired)

| # | Key | Words | Counsel |
|---|---|---|---|
| B1 | `authCopy.sheet.titles.sign_in_first` | Sign in to open your book | no |
| B2 | `authCopy.sheet.bodies.sign_in_first` | The words of your letters come with you to a new phone. Recordings are kept on the phone that made them. | **COUNSEL** (says where things are kept). Same sentence as #735's `sheet.bodies.first_letter`, so the two screens agree |
| B3 | `authCopy.sheet.agreeLine` (screen 2 only, directly above the buttons) | By continuing, you agree to the Terms of Service and Privacy Policy. | **COUNSEL** (what a person agrees to). Drops "you confirm you are 18 or older" because NX-31-R8 allows no second age question on screen 2; see open question 2 |
| B4 | `onboarding.finish.recordingNote` ("The book is open." footnote) | The recording is kept on this phone, so one day {child} can hear you say it. | **COUNSEL**, already reviewed (it is `onboarding.promise.recordingBody`, lawyer-2 H4); reused, not reworded |
| B5 | `onboarding.finish.recordingNoteNoName` (no name typed) | Recordings are kept on this phone, so you can hear them again one day. | **COUNSEL** |
| B6 | `authCopy.newPhone.arrivedWords` (a returning person, first Book view) | Your book is here. The words came across; the recordings are still on your other phone. | **COUNSEL**. Taken word for word from council slice 3, section 5; see open question 5 |

B3 gets the PRIV-R21 lines because a person agrees to it:
- Shown: the agree line, directly above the two sign-in buttons, with Terms of Service and Privacy Policy as links to the versioned pages.
- Records: nothing on its own. The server record of the Terms is written at the consent sheet's Terms step (council slice 3, B), with the rendered-text hash. Tapping a sign-in button on screen 2 writes no legal act.
- Never: a pre-ticked box; a second age question on screen 2; a promise about backup.
- Decline: the person does not tap a sign-in button. Nothing is recorded and nothing leaves the phone.

### 1.4 Variant A, backup on (written, not wired, held)

Held until backup is scheduled (B-1 to B-5 of NX-34 are decided) and counsel has answered whether a backup claim is worded as a plain state. NX-31's placeholder `recordingsSafe` is not used, because it says "kept safe".

| # | Key | Words | Counsel |
|---|---|---|---|
| A1 | `authCopy.sheet.titles.sign_in_first` | Sign in to open your book | no |
| A2 | `authCopy.sheet.bodies.sign_in_first` | Your letters and your recordings come with you to a new phone. The backup is encrypted and for you alone. | **COUNSEL** |
| A3 | `onboarding.finish.recordingNote` | Your recordings are backed up, so {child} can hear you say it one day. | **COUNSEL** |
| A4 | `onboarding.finish.recordingNoteNoName` | Your recordings are backed up, so you can hear them again one day. | **COUNSEL** |
| A5 | `authCopy.newPhone.arrivedWithRecordings` | Your book is here, with your words and your recordings. | **COUNSEL** |

Screen 2's description, privacy line, buttons and agree line (B3) are the same in A.

### 1.5 Both variants must pass

- No "safe", "kept safe", "protected", "secure". No "sync", "upload", "cloud". No em dash, en dash, curly quote, ellipsis character or emoji.
- Every line that names where a recording is matches the privacy policy, the privacy label and the subprocessor list on the day it ships.

## Part 2. BL-815: the header lines

Satisfies NX-33, NX-34, NX-35, NX-30 and NX-32 headers, and NX-31's two citations. These are the exact lines for the authors of the NX files to paste at the top of each file. They are not edited here (the files live on other branches). They are developer-facing, not parent copy, and restate the Build 12 cut (D-149 to D-152 are Proposed until the founder decides).

| File | Author | Header line (exact) | Council condition |
|---|---|---|---|
| NX-30 | `mobile` | Build 12 status: three tabs, Tonight, Book and You. The four-tab layout (Tonight, Book, Photos, You) is the intent and is marked future; the Photos tab arrives only when a photo can be added to a letter. Required before engineers start the screens: day-zero Tonight, one-letter Tonight, the empty "From the book" state, the SemiBold selected cue, and the You tab lamp and heading. | 1 |
| NX-31 | `design-systems` or its author | Build 12 status: account first. Two copy variants for screen 2 and the sign-in arrival, backup on and backup off; off is the default and the only one in Build 12 (BL-804). The merge-back rule after the local start is BL-803. The session-3 ask order, including what happens if the counter path is skipped, is BL-808. F03-U02 is stale (BL-805). | 2 |
| NX-32 | its author | Build 12 status: one Delete account entry. Step-up and `list_my_sessions` come after Build 12. | 4 |
| NX-33 | `mobile` | Not in Build 12. Nothing in this file reaches the App Store build: no photo copy, no Photos tab, no photo UI. | 6 |
| NX-34 | `data-architect` | Not in Build 12: no copy, no UI, no migration applied. Recording backup is off. B-1 to B-5 stay open until backup is scheduled, and B-1 is labelled not for Build 12. | 5 |
| NX-35 | `design-systems` | Not in Build 12 as a whole. M8, the full motion push, is removed from every Build 12 list. Whether the first-kept-letter moment is in is open (BL-800, founder). "From the book" is chosen by date, by the same weekday, or by the parent, and is never scored for relevance. | 6 |

### 2.1 "Kept safe" replaced in NX-34 (and wherever NX-31 quotes it)

| Where | Replace | With |
|---|---|---|
| NX-34 and NX-31 lines for Build 12 (backup off) | "Your recordings are kept safe, so {child} can hear you say it one day." | The recording is kept on this phone, so one day {child} can hear you say it. |
| Same, no name typed | "Your recordings are kept safe, so you can hear them again one day." | Recordings are kept on this phone, so you can hear them again one day. |
| Lines for a future account whose backup has started | any "kept safe" | Your recordings are backed up, so {child} can hear you say it one day. (A3 above; wording for counsel) |

NX-31 section 10 also holds an outage placeholder, "We can't reach sign-in right now. Your letters are safe." It says "safe" and "can't" is a contraction the voice avoids in a system line. Suggested instead (BL-803's to approve): "We cannot reach sign-in right now. Nothing on this phone has changed."

### 2.2 Check against the council's conditions

Conditions 1, 2, 4, 5 and 6 (pass 2, section 7) are each met by one header line above; condition 3 (F03-U02, name-absent audit) is BL-805 and is not part of this row. Condition 2's other items (local-start constant and Notes sentence, resume rules) are other rows (BL-786, BL-803) and are only cited in the NX-31 line.

## String count

17 distinct strings for approval: Variant B 6 (B1 to B6, of which B4 is existing registered text reused), Variant A 4 more (A2 to A5; A1 is the same sentence as B1), the 6 header lines, and 1 outage suggestion. The three replacement rows in 2.1 reuse B4, B5 and A3, so they add none. Unchanged and listed for context: 3 (description, privacy line, buttons).

## Open questions

1. Founder: approve B1 to B6, A1 to A5, the six header lines and the replacements, one yes or no per row.
2. Counsel and founder: NX-31-R8 allows no second age question on screen 2, but today's `authCopy.consent.agreeLine` says "you confirm you are 18 or older". B3 drops the age clause on screen 2. The server record of the age is written at the consent sheet, so this is only right if the Terms step keeps its age line (council F1 default: keep).
3. Product: NX-31-R8 keeps a text link "I was invited" on screen 2. In Build 12 invites and co-parent surfaces are hidden (#735), so the link goes nowhere true. Recommend no link in Build 12; the key `onboarding.welcome.joinButton` stays in code. Not decided here.
4. Council slice 3 section 7 proposes `account.signedOutBody` and `sheet.bodies.settings` = "Your letters come with you to a new phone." #735 already changed them to say the words come and the recordings stay. B2 follows #735 because the shorter line lets a reader think recordings come too. The council row should adopt #735's text. The same two sources differ on the Sync label ("Sync" in the council, "Sync across your phones" in #735); not part of these rows.
5. Counsel: B6 says "your other phone". A person whose old phone is lost reads it as a promise that a recording exists somewhere. Counsel may prefer "the recordings stay on the phone that made them", which matches B2.
6. Counsel (registered text still untrue in Build 12, from #735 and unchanged here): `en.trust.signIn.why`, `en.trust.signIn.privacy`, `consent.terms.body`, `en.sensitiveConsent.body`. Screen 2 simply does not show the first two (section 1.2).
7. Not verified: I ran no test and no build (docs-only clone, no `node_modules`), so the content rules test has not run over these words; I checked by eye and by a character scan only. `onboarding.finish.recordingNote*` and `authCopy.sheet.agreeLine` are new keys that do not exist on `develop`; the NX-31 file was read from its branch head, not from `develop`.
