# Ways to sign in, the duplicate line, and the phone steps: screen spec (BL-1895)

Status: DRAFT, PROPOSED. Author: `design-systems`. Docs only. Row BL-1895; card `docs/product/prd/29-sign-in-methods-and-phone-verification.md` (NS-54: R14, R16, R22, R23, R27, R28, R34, R35) and NS-33. Nothing was run on a device. No word here is live: every line is a content key, and `content` writes the words (WRITING-GUIDE.md, BRAND.md). Where a sentence is quoted it is a PROPOSED sketch, marked P:.

Nothing here decides Google, the SMS vendor, spend, a date or legal text. Phone Phase A (optional, after the first letter) is the only phone design that builds; Phase B is not drawn beyond the hold in section 8. Every phone screen exists only where a cloud feature works (D-161: no disabled teaser) and only after the first letter is kept.

| Row | Screen id (PROPOSED) | Route (PROPOSED) | Source | Status |
|---|---|---|---|---|
| WS-1 | C-S30 Ways to sign in | `/settings/sign-in-methods` | NS-54-R14, R17, R18, R38 | PROPOSED |
| WS-2 | C-S31 Add a way (provider sheet return and refusal) | same page, system sheet | NS-54-R14, R18 | PROPOSED |
| WS-3 | C-S32 Last way guard | sheet on C-S30 | NS-54-R17 | PROPOSED |
| WS-4 | E-S40 You may already have a book (duplicate line) | between the provider sheet and consent | NS-54-R16, R21 | PROPOSED |
| WS-5 | C-S33 Phone prompt after the first letter | sheet after Keep | NS-54-R22, R23 | PROPOSED |
| WS-6 | C-S34 Phone number | page in the same flow | NS-54-R23, R28, R34 | PROPOSED |
| WS-7 | C-S35 Phone code | page in the same flow | NS-54-R24, R27, R34 | PROPOSED |
| WS-8 | C-S36 Phone in Me, Account | row with its own button on `/settings/account` (no detail page, 6.4) | NS-54-R39, R41 | PROPOSED |

Components used (all built, `apps/mobile/src/components/ui`): `BackButton` and `ModalHeader` for modal pages (Settings pages use the native Stack header, as `app/settings/_layout.tsx` does, so the title there is the route title), `ListRow`, `Card`, `TextField`, `Button`, `Sheet`, `InlineState`, `StateScreen`, `ErrorLine`, `Text`, `Separator`. One shape is new and PROPOSED: ST-NOTICE `Notice` (SCREEN-PATHS-20nov.md section 0). No new component is needed beyond it; the code field is a `TextField` (section 6.3).

`ModalHeader` on the two phone pages (BL-1940; read from `apps/mobile/src/components/ui/screen-header.tsx` on develop `89ccadd1`, not run): it takes an optional `title` (drawn as `headline`, a heading that is not focused on open), a `leading` slot that can hold `BackButton`, and a Close it always draws (`onClose` is required, `closeDisabled` only dims it, and it has no option like the Sheet's `hideClose`).
- C-S34 Phone number: fits for the back control (`BackButton` in `leading`) and for a title, but its always-drawn Close is a second decline beside Not now, the clash section 1 avoids on sheets with `hideClose`; missing is either a way to leave Close out or a line here that Close counts as Not now (OPEN for `mobile` and this spec), and the page title stays in the content (`display` or `cardTitle`, focused by `useFocusOnMount`), not in the header's `headline` `title`.
- C-S35 Phone code: the same fit and the same Close clash with Not now (6.6), with `closeDisabled` covering Verify in flight; this spec names no back control for C-S35 (6.3), so whether `BackButton` in `leading` returns to C-S34 to fix the number is OPEN, and the title that names the last two digits stays in the content, as on C-S34.

## 1. Rules every screen here holds

Two definitions. **Equal** (Not now against Continue, the two duplicate-line buttons, Cancel against Remove) means the same height (`target.primary`), the same width, the same type and the same tap area, never dimmed or smaller; it does not mean the same fill: the one the screen proposes may be filled and the other outlined with `controlBorder`, and both read as buttons. **Claim rule:** any line that says or implies the book, the letters or the phone are unaffected ("your book stays", "nothing changes", "nothing on the phone changes [CLAIM]") is a claim that must be true in the build before `content` writes it; each is marked [CLAIM] below and is dropped if mobile cannot show it is true.

Tokens only, from `packages/design-tokens/src/tokens.ts`; a screen names a role, never a value.

| Thing | Token |
|---|---|
| Gutter | `layout.gutter` (16 compact, 20 regular); gaps `space.3` to `space.6`; section gap `layout.sectionGap` |
| Row height | `layout.listRowMin`; every target at least `target.min`; primaries `target.primary` |
| Type | page title `display` or `cardTitle`; body `body`; helper `footnote`; row title `label`; code field `nameField` is NOT used, see 6.3; no size below `minFontSize` |
| Colour | `text`, `textMuted`, `surface`, `surfaceRaised`, `accent`, `caution` for a condition, `controlBorder` for field edges, `focus` for the ring, `destructive` is not used here; never `recording` |
| Shape | `radius.sm` fields, `radius.md` cards, `radius.pill` buttons, `radius.xl` sheet |
| Motion | `motion.standard` for a sheet or row change; under Reduce Motion `motion.reduceMotion` (a 200 ms fade) and no spring, no slide |
| Contrast | text 4.5:1, outlines and icons 3:1 in light and dark and under Increase Contrast (the `highContrast` overrides); colour is never the only signal: a method row says "Linked" in words |

- Matrix for every screen and sheet here (C-S30, C-S31, C-S32, E-S40, C-S33, C-S34, C-S35, C-S36). Each states below the rows it varies; the rest hold as written here:
  - Voice Control: every button and field is reached by its visible label (the label is the accessible name; no icon-only control). Sheets: "Tap Remove Apple Account", "Tap Cancel", "Tap Close" (the Sheet's own Close, on the C-S32 refusal only), "Tap Not now", "Tap Carry on", "Tap Continue". Close on every sheet is stated in section 1 (Sheets).
  - Increase Contrast and dark: edges move to control strength (`highContrast`), text stays 4.5:1, a `Sheet` keeps its `scrim` and a 1 pt edge.
  - Reduce Motion: every Sheet, page change and notice uses the `motion.reduceMotion` fade; no slide, shake or spring.
  - VoiceOver: the title or Sheet title takes focus on open; a condition that appears (notice, wrong code, done) is announced once with `announce`.
  - AX5 on SE 3: stack, scroll, never pinned, nothing cut.
- Dynamic Type: from AX1 (`useIsAccessibilitySize`) every row and button stacks; nothing truncates; letter text is not on these screens but the child's name in any line is never cut. Primary buttons scroll with the content from AX1 and are not pinned (SCREEN-PATHS rule).
- Sheets (which draws its own Close, `Sheet` `hideClose`): the C-S32 remove-confirm sheet and the C-S33 phone prompt set `hideClose`, because each already has a visible decline of equal rank (Cancel, Not now) and a second Close would be a third way to say the same thing. Swipe down, the scrim and the VoiceOver Escape gesture still dismiss them, and each counts as that decline (Cancel; Not now, remembered on the phone only). The C-S32 last-way refusal has no decline button, so it keeps the Sheet's own Close (section 4). PROPOSED; `mobile` confirms `Sheet` honours this with `dismissible` left on.
- Provider buttons keep Apple's own size and rules (NS-54-R1, R13). Apple's button is first, Google is never larger.
- VoiceOver: the page title takes focus on open (`useFocusOnMount`); order is always title, explanation, content, primary, quiet.
- One-handed: primary at the bottom of the content; Not now is a full-width button equal to Continue as defined above (same height and tap area, outlined, not dimmed), never a small text link (R22).
- Offline: every screen below shows the same ST-FULL offline state, `authCopy.offline.*` (built), never a spinner that does not end.
- Privacy: no full email, no full number, no provider id on any screen, in any accessibility label, route param or log (R14, R26). The method is named, not the address.

## 2. C-S30 Ways to sign in (`/settings/sign-in-methods`, from Me, Account)

Behaviour. A list, one row per way: Apple, Google (only where Google is on in this build, NS-54-R6), email. Each row shows the way's name from the BRAND.md glossary ("Apple Account", "Google Account", "Email"), "Linked" or "Not linked" in words, and for email the masked address style the Account page already uses. Linked rows open C-S32 only through a quiet "Remove" action; unlinked rows carry "Add". The page never says "sign up" or "log in" (R10). It never shows a provider's id. It never compares or counts ("2 of 3").

Layout. The native Stack header carries the title, then one explanation sentence (`footnote`, `textMuted`), then `Card` with `Separator` rows (`ListRow`, `layout.listRowMin`). Row: provider mark (decorative, hidden from VoiceOver), name (`label`), status (`footnote`), trailing action as a quiet `Button` of `target.min` whose visible label carries the provider ("Add Google Account", "Remove Apple Account"; keys take `{provider}`), so Voice Control and VoiceOver agree.

States.

| State | Exact screen | Content key (PROPOSED) |
|---|---|---|
| Opening | List drawn from the account at once; no spinner for what is on the phone | `ways.title`, `ways.intro` |
| One way only | The only linked row has no Remove; a one-line reason sits under it so the missing control is explained | `ways.lastReason` |
| Two or more | Remove appears on each linked row | `ways.removeButton` |
| Add, provider sheet open | The row shows "Adding" in words; the system sheet (ST-IOS) owns the screen; cancel returns with nothing shown (NS-54-R11) | `ways.adding` |
| Add succeeded | The row flips to Linked; VoiceOver announces it; a quiet line says a notice went to the account's address (R20) [CLAIM: only if the notice is sent] | `ways.added`, `ways.noticeSent` |
| Add refused: belongs to another account | ST-NOTICE above the list, nothing moved [CLAIM], how to carry on named (R18) | `ways.errors.inUse` |
| Add failed (provider or network) | ST-NOTICE with Try again; no provider text (R11) | `ways.errors.generic` |
| Reauth needed | A recent sign-in is asked before Remove; the system or email step runs, then the removal sheet opens (R17) | `ways.reauth` |
| Offline | ST-FULL offline; the list is read only when cached, with Add and Remove disabled and the reason said, never greyed alone | `authCopy.offline.*`, `ways.offlineNote` |
| Google off in this build | No Google row at all, no teaser (D-161); the intro names only what shows | `ways.intro` |
| Removing | Row reads "Removing"; done returns focus to the list title | `ways.removing` |
| AX5 (SE 3) | Rows stack: name, status, action each on its own line, action full width; the explanation sits above the card and scrolls | built layout |
| Dark, Increase Contrast | Row edges `line` becomes control strength; status words stay 4.5:1 | none |
| Reduce Motion | Row flips by cross-fade only | none |
| VoiceOver | Each row is two elements: the row text ("Apple Account, linked"), then its trailing button ("Remove Apple Account", a real button, so Voice Control and Switch Control reach it). No custom action and no combined element. Order top to bottom. Status change is announced with `announce` | `ways.a11y.*` |
| Voice Control | "Tap Add Google Account" works because the visible label contains the provider name | none |

Shown: `ways.*`. Records: the link and unlink act on the account only; an analytics event only if analytics was agreed and it carries no provider id or address. Never: a full address, a provider id, a merge of two accounts, a count of what is missing. Decline: closing the page changes nothing [CLAIM].

## 3. C-S31 Add a way (the return from the provider sheet)

Not a screen of ours: Apple's or Google's own sheet, then the row state above. Specified so the failure kinds are not invented in code.

| Return | Shows | Key |
|---|---|---|
| Cancelled | Nothing | none |
| Same account already has it | Row already reads Linked; nothing happens | none |
| Another account has it (R18) | ST-NOTICE `ways.errors.inUse`; no name of whose | `ways.errors.inUse` |
| Needs a recent sign-in | The reauth step, then retry once | `ways.reauth` |
| Refused country (NS-40) | The neutral refusal screen, not an error (R8) | `authCopy.region.*` (on hold and PROPOSED per its own comment, not built) |
| Anything else | `ways.errors.generic` | `ways.errors.generic` |

## 4. C-S32 The last-way guard (NS-54-R17)

A guard, not a punishment. With one way left, Remove is absent (section 2). If the account has two and the person removes one, the Sheet confirms it. If a race leaves one, the same Sheet shows the refusal instead.

| State | Sheet | Key |
|---|---|---|
| Confirm | Title (first heading), one sentence saying the book stays [CLAIM] and this way stops working, Remove as a neutral `Button` (`accent` fill, not `destructive`: the claim that the book is not at risk must be true in the build) and Cancel equal to it (section 1, outlined). The Remove label names the provider (`ways.removeSheet.confirmButton` holds "Remove {provider}", filled with the BRAND.md glossary name, so it reads "Remove Apple Account", the same words as the row's button and what Voice Control hears); the title and body carry `{provider}` too. `hideClose` is set (section 1, Sheets) | `ways.removeSheet.title`, `.body`, `.confirmButton`, `.cancelButton` |
| Last way (refusal) | Title, one sentence saying this is the only way in and another must be added first, one primary "Add another way" that closes the sheet and opens the add choice, and the Sheet's own Close (`Sheet` draws it unless `hideClose` is set; this sheet leaves it on, and adds no second Close); swipe down, the scrim and the VoiceOver Escape gesture also dismiss it; no remove button | `ways.lastSheet.title`, `.body`, `.addAnotherButton` |
| Reauth first | The reauth step runs before the Sheet opens | `ways.reauth` |
| Done | Sheet closes, toast (words only and it times out: `toast.tsx` has no Close of its own on this path and a link cannot be un-removed without proof; the words are also announced) says it was removed, a notice email goes out | `ways.removed` |
| Offline, ERR | ST-NOTICE inside the Sheet; nothing removed [CLAIM] | `ways.errors.generic`, `authCopy.offline.*` |

AX5: Sheet scrolls, buttons stack, full width, at the end of the body (not pinned). VoiceOver: the Sheet title takes focus; the Remove action is read with its consequence in the hint. Never: "are you sure", fear or loss wording; the book is never said to be at risk, and "it is not" is itself a [CLAIM].

## 5. E-S40 You may already have a book (the duplicate line, NS-54-R16, R21)

Where. After a provider sheet returns for a person who is new on this phone, before the age and consent steps, so before anything is agreed. Trigger, decided on the phone from the provider result alone: the provider returned an Apple relay address or no address. The line does not depend on any account lookup. NS-54-R15 (same verified email, one account; a person back on the same provider is R10) is decided by Supabase on the server after the person chooses Continue, and then they are signed in to that one account as today; the line is therefore shown to everyone with that provider result, whether or not an account exists, so its presence reveals nothing (enumeration). This costs a returning Apple relay person one extra tap. OPEN for the security engineer: whether any shown-or-not rule that uses the server answer can be made safe; until answered, the safe default above stands. It is a line, not a gate.

Conflict with R16 (a P0 row), stated plainly. A phone-only trigger on relay or no-address results meets R16 only when Apple was the relay side. A person whose first account used Apple (relay) and who then taps Google (real address) gets no line and a second account is made: card scenario S6 is not met by this trigger. That case rests on one vendor claim, that Google returns a real address on every sign-in [UNVERIFIED: not read from Google's documents or tested; this whole paragraph depends on it, and if it is false the narrow trigger already covers the case]. A wider trigger that still uses no account lookup exists: show the same line to every person who is new on this phone after any provider return (Apple, Google or email), for one extra tap each. OPEN (BL-1942, product and the security engineer; this spec does not decide it). Recommendation carried from BL-1942, not a decision: the wider trigger, as long as it still uses no account lookup, with one extra tap, because it closes the R16 P0 gap (the Apple relay then Google case) that the narrow trigger leaves with a second account and no warning. The security engineer reads the wider trigger for the lookup point. The screen is identical under either trigger.

Layout. ST-FULL, calm, no alert colour. Title, one sentence, two equal buttons of `target.primary`: the first "Sign in another way" (`duplicate.backButton`; goes back to the Welcome choices, nothing created [CLAIM]), the second "Carry on" (`duplicate.continueButton`, 8 characters; it promises neither a new nor an existing book, because the server decides after it: a person who used this same provider before is signed in to their account (R10, one door for new and returning), one whose verified email matches another way's account is signed in to that one (R15), and only otherwise do age and consent follow). The sentence names neither outcome as the likely one (P: "You might already have a book here. If you used another way to sign in before, you can go back and use it. Or carry on with this one."). Both buttons are equal as defined in section 1 (the definition lives there and is not restated here), the first listed first. Fill: both use `Button` `outline` at one size, because neither is the one the screen proposes and a filled one would be a pre-selected default; the first is not louder than the second, and both keep `controlBorder` edges and `text` labels. Never a pre-selected default, never a timer, never a confirm-shaming line.

| State | Exact screen | Key (PROPOSED) |
|---|---|---|
| Shown | As above. P: "You might already have a book here. If you used another way to sign in before, you can go back and use it. Or carry on with this one." | `duplicate.title`, `.body`, `.backButton`, `.continueButton` |
| Back chosen | Returns to the Welcome with every way offered; the provider sheet's result is discarded and nothing is stored [CLAIM] (R16: nothing merges) | none |
| Carry on chosen | The server answers as today: the same provider as before (R10) or a matching verified email (R15) signs in to that account, otherwise the age and consent steps follow and the account is created only after consent | none |
| A second account on the phone (R21) | The line never names, hints at or counts another account here; wording is the same for everyone | none |
| Offline | ST-FULL offline, the provider result is held only in memory | `authCopy.offline.*` |
| AX5 | Title, body and two buttons stack and scroll; no pinned primary; nothing truncated | built layout |
| VoiceOver | Title takes focus; body; then the two buttons in the order above; each reads its full label | `duplicate.a11y.*` |
| Reduce Motion | Cross-fade only | none |

Shown: `duplicate.*`, one line, no consent text on this screen. Records: nothing (no consent act yet; the line is not an agreement). Never: the name or address of the other account, a hint of which way was used, the word "duplicate" or "merge" to a parent, "AI", "we noticed". Decline: both buttons are an answer; there is no third.

## 6. The phone steps (Phase A)

Entry rules (R22, R32). One optional prompt, after the first letter is kept and never before it, on the same terms for Apple, Google and email people. It shows at most once on first offer and once more at a calm moment (the person's choice is remembered on the phone only). A paused step (R37) is simply absent. No count, no progress bar, no "N steps".

### 6.1 C-S33 Phone prompt (Sheet after Keep)

Layout. Sheet: title, one sentence on what it is for, the Shown line (6.5) with a link to read more, "Continue" and "Not now" equal as defined in section 1 (Continue filled, Not now outlined, same size), stacked full width at the end of the body. `hideClose` is set (section 1, Sheets): Not now is the visible decline, and a swipe, the scrim or Escape counts as Not now.

| State | Exact screen | Key |
|---|---|---|
| Shown | As above; the letter just kept stays visible behind the scrim | `phone.prompt.title`, `.body`, `.shown`, `.continueButton`, `.laterButton` |
| Not now | Sheet closes; nothing changes anywhere [CLAIM]; no reminder badge; remembered on the phone only | none |
| Read more | Opens the privacy page; return keeps the Sheet | `phone.prompt.readMore` |
| Phase paused or no cloud feature | The Sheet never opens | none |
| Offline | Not shown (the step needs a connection); never a dead button | none |
| AX5 | Sheet scrolls; Continue then Not now stack, both `target.primary` high; the Shown line is full text, never clamped | built layout |
| VoiceOver | Sheet title first; Shown line before the buttons; Not now reads as a button of equal rank | `phone.prompt.a11y.*` |
| Reduce Motion | `motion.reduceMotion` fade for the Sheet | none |

### 6.2 C-S34 Phone number

Layout. `BackButton` in the modal header (or the Stack back); title; one `TextField` for the number with a country picker as a separate labelled control beside it (stacked from AX1); helper line; primary "Send the code"; "Not now" equal to it (section 1: outlined, same size). Field uses `textContentType="telephoneNumber"` and a phone keypad; the number is normalised to E.164 on the phone only (R23), and the full number is shown while typing and never again after (R39).

| State | Exact screen | Key |
|---|---|---|
| Empty | Primary dim with its reason in the helper line, nothing red | `phone.number.helper` |
| Typing | Format as the person types; no per-key validation message | none |
| Invalid shape | Helper becomes a plain line under the field, text kept, focus stays | `phone.number.invalid` |
| Sending | Primary reads "Sending", field locked, then the next page; the same page and timing for a number that has an account and one that has not (R23) | `phone.number.sending` |
| Cannot use this number (R28) | ST-NOTICE with a contracted sketch (P: "We can't text this number."), then the fallback (6.6) and Not now; no mention of region, never "fraud", "blocked" or "suspicious" | `phone.number.unusable` |
| Country not reachable | Same notice and fallback | `phone.number.unusable` |
| Roaming or foreign SIM (R30) | Any supported country verifies; no price or store change; nothing said about it | none |
| Too many sends (R24) | Page stays, the wait is said in words, Not now stays | `phone.errors.wait` |
| Provider fails or offline (R27) | ST-NOTICE with Try again and Not now; nothing on the phone changes [CLAIM] | `phone.errors.generic`, `authCopy.offline.*` |
| AX5 | Country control above the field, both full width; primary and Not now stack and scroll | built layout |
| Dark, Increase Contrast | Field edge `controlBorder` 3:1 (control strength under Increase Contrast); helper and notice text 4.5:1 | none |
| Reduce Motion | Page change and notice by `motion.reduceMotion` fade only | none |
| VoiceOver | Title; field labelled "Phone number"; country control labelled with its name and calling code; helper; primary; Not now | `phone.number.a11y.*` |
| Voice Control | "Tap Send the code" works from the visible label | none |

### 6.3 C-S35 Phone code

Layout. Title that names only the last two digits of the number ("ends in 42", never the whole number); one `TextField` for the code (one field, not boxes; width fits the code length; `textContentType="oneTimeCode"` so iOS AutoFill offers it, R34); a quiet "Send again" that waits; "Not now" (6.6) equal to the primary (section 1). Type is `body` or larger, never `nameField`; the field takes the whole width at AX5 and the code is never cut. One-field-with-length means VoiceOver reads "Code, 6 digits" (length is a key placeholder, not hard-coded).

| State | Exact screen | Key |
|---|---|---|
| Waiting | Focus rule: the field takes keyboard focus on arrival so AutoFill can offer the code, but with VoiceOver on, VoiceOver focus goes to the title first and the field is next (focus is not stolen); AutoFill allowed; Send again shows the wait in words, not a ticking bar | `phone.code.title`, `.resendWait` |
| Entering | Never auto-submits: only a press of Verify sends the code, for everyone, so no rule needs to detect Voice Control (an app cannot reliably tell that it, Switch Control or dictation is on [UNVERIFIED on device]). Why: a mis-dictated or mis-filled code that sent itself would spend one of the five tries (R24). Verify is dim until the field holds the full length (`{length}`), with its reason in words. The rule is one pure function a unit test checks: `canSend(code, length)` is false for a code shorter or longer than `length` or with a non-digit, true only at full length, and an AutoFill or paste that fills the field never calls send; a test with a full-length code must see no send until Verify is pressed. Alternative if product wants fewer taps: send after a 2 second pause with an Undo, which still spends a try, so it is not proposed | `phone.code.verifyButton` |
| Wrong code | One line under the field, text kept, focus stays; the field clears only on the next keystroke | `phone.code.wrong` |
| Five wrong tries (R24) | Entry pauses as the email code does (NS-41-R9): the wait is said in words; Send again and Not now stay | `phone.code.paused` |
| Expired | Plain line and a primary to send a new code | `phone.code.expired` |
| No code arrives (R27) | After the wait: Send again and Not now, in that order (the 6.6 "Use another way" is the same act as Not now in Phase A, so it is one button, not two; a separate other-way button is added only when Phase B defines a real other way, and has no key until then); the line says it can take a minute (any line that the book is unaffected is a claim that must be true in the build before it is written) | `phone.code.noCode` |
| Resend | Allowed after the wait; announces "Code sent"; same screen for every number | `phone.code.sent` |
| Verified | Success haptic, one line, the page closes to where the person was; VoiceOver announces it; only the last two digits show from here on | `phone.code.done` |
| Provider fails / offline | ST-NOTICE, Try again, Not now | `phone.errors.generic`, `authCopy.offline.*` |
| Backgrounded, killed | The step restarts at the number page; nothing is kept but the choice to be asked later; no number is stored in route params or state restoration (R26) | none |
| AX5 | Title, field, Verify, Send again, Not now stack in that order and scroll; nothing pinned | built layout |
| VoiceOver | Title with the last two digits read as digits; field "Code, N digits"; every error is announced when it appears, not only drawn | `phone.code.a11y.*` |
| Reduce Motion | No shake on a wrong code; a line only; page change by fade | none |
| Dark, Increase Contrast | Code field edge `controlBorder`; every line 4.5:1 | none |

### 6.4 C-S36 Phone in Me, Account

A row on `/settings/account`: "Phone number", status "Verified" with last two digits and when (R39), or "Not added". Row or button: the row is text and opens nothing; only its trailing button acts, as in section 2, and there is no detail page. The button label carries what it does, as in section 2: "Add phone number" or "Remove phone number" (20 characters; `phone.account.addButton`, `phone.account.removeButton`). VoiceOver and Voice Control rows below describe this: two elements, the row text, then the real button. Remove (R41) opens a Sheet like C-S32 (Cancel equal to it, `hideClose`, `phone.account.removeSheet.{title,body,confirmButton,cancelButton}`, the confirm reading "Remove phone number"), a notice email goes out, the session is untouched, and after removal the button reads Add again. The export note lives in the export screen (R40, BL-1909). No full number, ever. Hidden entirely when the cloud feature or the step is not available (R37, D-161). AX5: the row stacks as in section 2. PROPOSED; `mobile` confirms.

| State | Shown | What moved | Key (PROPOSED) |
|---|---|---|---|
| Loading | Row label and a quiet "Checking" line (`InlineState`); no button, no spinner that does not end; announced once | Nothing | `phone.account.loading` |
| Verified | "Phone number, verified, ends in {last2}, {when}", then Remove phone number | Nothing | `phone.account.verified`, `.removeButton` |
| Not added | "Phone number, not added", then Add phone number (starts C-S34 on the Phase A terms; no prompt text here) | Nothing | `phone.account.notAdded`, `.addButton` |
| Removing | Row reads "Removing", button absent, focus stays on the row; the Sheet has closed | The number is being deleted (R41) | `phone.account.removing` |
| Removed | Row flips to Not added; one announcement; a notice email goes out; the session is untouched | The number is gone from the account | `phone.account.removed` |
| Remove failed | ST-NOTICE with Try again; the row still reads Verified; no vendor text (R11 style) | Nothing [CLAIM: only if the delete is all or nothing in the build] | `phone.account.removeFailed` |
| Reauth needed | A recent sign-in is asked first (the same step as section 2), then the Sheet opens; if it is cancelled the row is unchanged | Nothing | `ways.reauth` |
| Offline | The row is read only when cached; both buttons disabled with the reason said in words, never greyed alone; ST-FULL offline only where nothing is cached | Nothing | `authCopy.offline.*`, `phone.account.offlineNote` |

Dark, Increase Contrast and Reduce Motion as section 2 (row flip by cross-fade only). VoiceOver: "Phone number, verified, ends in 42", then "Remove phone number" as a button.

### 6.5 The Shown line (PRIV-R21, R35)

Shown before the number is typed, on C-S33, and linked from C-S34. One content key `phone.prompt.shown`; content writes it and counsel holds it before any build uses it; its hash is recorded with the act row. Required parts, in plain order: what it is for, that we text one code, that message rates may apply, that we keep the number only to prove the account and for recovery, where to read more. Records: the act row of PRIV-R21 with no number. Never: marketing, invites, ads, contacts match, a full number after entry, a condition of reading the book already on the phone. Decline: Not now, always, with every feature kept.

### 6.6 Fallback and Not now

Where a text cannot arrive (no phone, no signal, an unreachable number), the screen offers Not now (there is no separate "Use another way" in Phase A) with a line that the book and everything on the phone work without a number [CLAIM]. The wider fallback for Phase B (7.4 of the card: cloud features only, voice call, support) is not decided and not drawn. Not now is never smaller, dimmer or lower in tap area than Continue (equal as defined in section 1; it follows Continue in reading order), and carries no line about what is lost or what is missed. The one line near it is the reassurance above (the book and the phone work without a number), which is a [CLAIM] and is shown only when true.

## 7. Content-key list (all PROPOSED; none exists; `content` owns the words)

Button-cap note. `packages/content/test/rules.test.ts` ("buttons stay short", lines 279-282) caps at 22 characters only keys whose path ends in `button` or `cta` (or has `.cta`, `.button`). So every button key here is named to be covered: `ways.addButton`, `ways.removeButton`, `ways.removeSheet.confirmButton`, `ways.removeSheet.cancelButton`, `ways.lastSheet.addAnotherButton`, `duplicate.backButton`, `duplicate.continueButton`, `phone.prompt.continueButton`, `phone.prompt.laterButton`, `phone.number.sendButton`, `phone.code.verifyButton`, `phone.code.resendButton`, `phone.account.addButton`, `phone.account.removeButton`, `phone.account.removeSheet.confirmButton`, `phone.account.removeSheet.cancelButton`. There is no other-way button in Phase A (6.3, 6.6). They replace the shorter names used in the tables above. Provider names are filled in at run time, so the 22-character cap is checked on the filled string by mobile (UNVERIFIED: "Remove Apple Account" is 20, "Remove Google Account" is 21).

`ways.title`, `.intro`, `.lastReason`, `.addButton`, `.removeButton`, `.adding`, `.added`, `.noticeSent`, `.removing`, `.removed`, `.reauth`, `.offlineNote`, `.errors.inUse`, `.errors.generic`, `.removeSheet.{title,body,confirmButton,cancelButton}`, `.lastSheet.{title,body,addAnotherButton}`, `.a11y.*`; `duplicate.{title,body,backButton,continueButton}`, `duplicate.a11y.*`; `phone.prompt.{title,body,shown,continueButton,laterButton,readMore}`, `phone.number.{helper,invalid,sending,unusable,sendButton}`, `phone.code.{title,verifyButton,resendButton,wrong,paused,expired,noCode,resendWait,sent,done}`, `phone.errors.{generic,wait}`, `phone.account.{loading,verified,notAdded,addButton,removeButton,removing,removed,removeFailed,offlineNote,removeSheet.*}`, `phone.*.a11y.*`. Reused, built: `authCopy.offline.*`, `authCopy.errors.*`; on hold, PROPOSED: `authCopy.region.*`. Placeholders `{last2}`, `{length}`; never `{child}` gendered, no child name on these screens.

## 8. Open and held

- Phase B and the fallback beyond Not now: held for the founder with counsel (card 7.4, Q6, Q8); no screen is drawn.
- Whether Google shows at all: founder's scope call; section 2 handles both.
- The duplicate-line trigger: narrow (relay or no address) or wide (every new-on-phone provider return); section 5 states the R16 conflict of the narrow one. Product and the security engineer decide; the Supabase behaviour behind it is [UNVERIFIED]. OPEN, BL-1942: the recommendation is the wide trigger (section 5); it is not decided in this spec.
- Route names and screen ids are PROPOSED; `mobile` confirms.
- UNVERIFIED on device: VoiceOver order, AX5 stacking, Increase Contrast, AutoFill of the code, the Apple button's own accessibility. A phone walk is needed on iPhone SE 3 (NS-33 floor) before the build is called accessible.
- No contrast numbers are new: all roles are existing tokens, so no token test is added.

Signed: `design-systems`.
