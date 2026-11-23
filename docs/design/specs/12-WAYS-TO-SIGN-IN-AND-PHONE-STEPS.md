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
| WS-8 | C-S36 Phone in Me, Account | row and detail on `/settings/account` | NS-54-R39, R41 | PROPOSED |

Components used (all built, `apps/mobile/src/components/ui`): `BackButton` and `ModalHeader` for modal pages (Settings pages use the native Stack header, as `app/settings/_layout.tsx` does, so the title there is the route title), `ListRow`, `Card`, `TextField`, `Button`, `Sheet`, `InlineState`, `StateScreen`, `ErrorLine`, `Text`, `Separator`. One shape is new and PROPOSED: ST-NOTICE `Notice` (SCREEN-PATHS-20nov.md section 0). No new component is needed beyond it; the code field is a `TextField` (section 6.3).

## 1. Rules every screen here holds

Tokens only, from `packages/design-tokens/src/tokens.ts`; a screen names a role, never a value.

| Thing | Token |
|---|---|
| Gutter | `layout.gutter` (16 compact, 20 regular); gaps `space.3` to `space.6`; section gap `layout.sectionGap` |
| Row height | `layout.listRowMin`; every target at least `target.min`; primaries `target.primary` |
| Type | page title `display` or `cardTitle`; body `body`; helper `footnote`; row title `label`; code field `nameField` is NOT used, see 6.3; no size below `minFontSize` |
| Colour | `text`, `textMuted`, `surface`, `surfaceRaised`, `accent`, `caution` for a condition, `controlBorder` for field edges, `focus` for the ring, `destructive` is not used here (removing a way does not put the book at risk); never `recording` |
| Shape | `radius.sm` fields, `radius.md` cards, `radius.pill` buttons, `radius.xl` sheet |
| Motion | `motion.standard` for a sheet or row change; under Reduce Motion `motion.reduceMotion` (a 200 ms fade) and no spring, no slide |
| Contrast | text 4.5:1, outlines and icons 3:1 in light and dark and under Increase Contrast (the `highContrast` overrides); colour is never the only signal: a method row says "Linked" in words |

- Dynamic Type: from AX1 (`useIsAccessibilitySize`) every row and button stacks; nothing truncates; letter text is not on these screens but the child's name in any line is never cut. Primary buttons scroll with the content from AX1 and are not pinned (SCREEN-PATHS rule).
- Provider buttons keep Apple's own size and rules (NS-54-R1, R13). Apple's button is first, Google is never larger.
- VoiceOver: the page title takes focus on open (`useFocusOnMount`); order is always title, explanation, content, primary, quiet.
- One-handed: primary at the bottom of the content; Not now is a full-width quiet button of the same height, never a small text link (R22).
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
| Two or more | Remove appears on each linked row | `ways.remove` |
| Add, provider sheet open | The row shows "Adding" in words; the system sheet (ST-IOS) owns the screen; cancel returns with nothing shown (NS-54-R11) | `ways.adding` |
| Add succeeded | The row flips to Linked; VoiceOver announces it; a quiet line says a notice went to the account's address (R20) | `ways.added`, `ways.noticeSent` |
| Add refused: belongs to another account | ST-NOTICE above the list, nothing moved, how to carry on named (R18) | `ways.errors.inUse` |
| Add failed (provider or network) | ST-NOTICE with Try again; no provider text (R11) | `ways.errors.generic` |
| Reauth needed | A recent sign-in is asked before Remove; the system or email step runs, then the removal sheet opens (R17) | `ways.reauth` |
| Offline | ST-FULL offline; the list is read only when cached, with Add and Remove disabled and the reason said, never greyed alone | `authCopy.offline.*`, `ways.offlineNote` |
| Google off in this build | No Google row at all, no teaser (D-161); the intro names only what shows | `ways.intro` |
| Removing | Row reads "Removing"; done returns focus to the list title | `ways.removing` |
| AX5 (SE 3) | Rows stack: name, status, action each on its own line, action full width; the explanation sits above the card and scrolls | built layout |
| Dark, Increase Contrast | Row edges `line` becomes control strength; status words stay 4.5:1 | none |
| Reduce Motion | Row flips by cross-fade only | none |
| VoiceOver | Row is one element: "Apple Account, linked", hint "Remove"; or "Google Account, not linked", hint "Add". Order top to bottom. Status change is announced with `announce` | `ways.a11y.*` |
| Voice Control | "Tap Add Google Account" works because the visible label contains the provider name | none |

Shown: `ways.*`. Records: the link and unlink act on the account only; an analytics event only if analytics was agreed and it carries no provider id or address. Never: a full address, a provider id, a merge of two accounts, a count of what is missing. Decline: closing the page changes nothing.

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
| Confirm | Title (first heading), one sentence saying the book stays and this way stops working, Remove as a neutral `Button` (`accent` fill, not `destructive`: taking a way off does not put the book at risk) of `target.primary`, Cancel as equal-size quiet | `ways.removeSheet.title`, `.body`, `.confirm`, `.cancel` |
| Last way (refusal) | Title, one sentence saying this is the only way in and another must be added first, one primary "Add another way" that closes the sheet and opens the add choice, and a quiet Close; swipe down, the scrim and the VoiceOver Escape gesture also dismiss it; no remove button | `ways.lastSheet.title`, `.body`, `.addAnother` |
| Reauth first | The reauth step runs before the Sheet opens | `ways.reauth` |
| Done | Sheet closes, toast (words only and it times out: `toast.tsx` has no Close of its own on this path and a link cannot be un-removed without proof; the words are also announced) says it was removed, a notice email goes out | `ways.removed` |
| Offline, ERR | ST-NOTICE inside the Sheet; nothing removed | `ways.errors.generic`, `authCopy.offline.*` |

AX5: Sheet scrolls, buttons stack, full width, at the end of the body (not pinned). VoiceOver: the Sheet title takes focus; the Remove action is read with its consequence in the hint. Never: "are you sure", fear or loss wording; the book is not said to be at risk because it is not.

## 5. E-S40 You may already have a book (the duplicate line, NS-54-R16, R21)

Where. After a provider sheet returns for a person with no account on this phone, The trigger is decided on the phone from the provider result alone (an Apple relay address, or no address returned), never from an account lookup, so the screen cannot reveal whether any address has an account (enumeration). It sits before the age and consent steps, so before anything is agreed. It does not appear when the same verified email matched an existing account (R15: that person simply signs in) and never when no other way is plausible: it is a line, not a gate.

Layout. ST-FULL, calm, no alert colour. Title, one sentence, two equal-size buttons of `target.primary`: the first "Sign in another way" (goes back to the Welcome choices, nothing created), the second "Start a new book" (button copy stays within the 22-character cap of `rules.test.ts` "buttons stay short") (goes on to consent and creates the account). Neither is the louder: both are the same variant weight, the first listed first. Never a pre-selected default, never a timer, never a confirm-shaming line.

| State | Exact screen | Key (PROPOSED) |
|---|---|---|
| Shown | As above. P: "You might already have a book here. If you used another way to sign in before, use that one to see it." | `duplicate.title`, `.body`, `.back`, `.continue` |
| Back chosen | Returns to the Welcome with every way offered; the provider sheet's result is discarded and nothing is stored (R16: nothing merges) | none |
| Continue chosen | Goes to the age and consent steps; the account is created only after consent as today | none |
| A second account on the phone (R21) | The line never names, hints at or counts another account here; wording is the same for everyone | none |
| Offline | ST-FULL offline, the provider result is held only in memory | `authCopy.offline.*` |
| AX5 | Title, body and two buttons stack and scroll; no pinned primary; nothing truncated | built layout |
| VoiceOver | Title takes focus; body; then the two buttons in the order above; each reads its full label | `duplicate.a11y.*` |
| Reduce Motion | Cross-fade only | none |

Shown: `duplicate.*`, one line, no consent text on this screen. Records: nothing (no consent act yet; the line is not an agreement). Never: the name or address of the other account, a hint of which way was used, the word "duplicate" or "merge" to a parent, "AI", "we noticed". Decline: both buttons are an answer; there is no third.

## 6. The phone steps (Phase A)

Entry rules (R22, R32). One optional prompt, after the first letter is kept and never before it, on the same terms for Apple, Google and email people. It shows at most once on first offer and once more at a calm moment (the person's choice is remembered on the phone only). A paused step (R37) is simply absent. No count, no progress bar, no "N steps".

### 6.1 C-S33 Phone prompt (Sheet after Keep)

Layout. Sheet: title, one sentence on what it is for, the Shown line (6.5) with a link to read more, "Continue" and "Not now" of equal size and weight, stacked full width at the end of the body.

| State | Exact screen | Key |
|---|---|---|
| Shown | As above; the letter just kept stays visible behind the scrim | `phone.prompt.title`, `.body`, `.shown`, `.continue`, `.later` |
| Not now | Sheet closes; nothing changes anywhere; no reminder badge; remembered on the phone only | none |
| Read more | Opens the privacy page; return keeps the Sheet | `phone.prompt.readMore` |
| Phase paused or no cloud feature | The Sheet never opens | none |
| Offline | Not shown (the step needs a connection); never a dead button | none |
| AX5 | Sheet scrolls; Continue then Not now stack, both `target.primary` high; the Shown line is full text, never clamped | built layout |
| VoiceOver | Sheet title first; Shown line before the buttons; Not now reads as a button of equal rank | `phone.prompt.a11y.*` |
| Reduce Motion | `motion.reduceMotion` fade for the Sheet | none |

### 6.2 C-S34 Phone number

Layout. `BackButton` in the modal header (or the Stack back); title; one `TextField` for the number with a country picker as a separate labelled control beside it (stacked from AX1); helper line; primary "Send the code"; quiet "Not now". Field uses `textContentType="telephoneNumber"` and a phone keypad; the number is normalised to E.164 on the phone only (R23), and the full number is shown while typing and never again after (R39).

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
| Provider fails or offline (R27) | ST-NOTICE with Try again and Not now; nothing on the phone changes | `phone.errors.generic`, `authCopy.offline.*` |
| AX5 | Country control above the field, both full width; primary and Not now stack and scroll | built layout |
| Dark, Increase Contrast | Field edge `controlBorder` 3:1 (control strength under Increase Contrast); helper and notice text 4.5:1 | none |
| Reduce Motion | Page change and notice by `motion.reduceMotion` fade only | none |
| VoiceOver | Title; field labelled "Phone number"; country control labelled with its name and calling code; helper; primary; Not now | `phone.number.a11y.*` |
| Voice Control | "Tap Send the code" works from the visible label | none |

### 6.3 C-S35 Phone code

Layout. Title that names only the last two digits of the number ("ends in 42", never the whole number); one `TextField` for the code (one field, not boxes; width fits the code length; `textContentType="oneTimeCode"` so iOS AutoFill offers it, R34); a quiet "Send again" that waits; a quiet "Use another way" (6.6); "Not now". Type is `body` or larger, never `nameField`; the field takes the whole width at AX5 and the code is never cut. One-field-with-length means VoiceOver reads "Code, 6 digits" (length is a key placeholder, not hard-coded).

| State | Exact screen | Key |
|---|---|---|
| Waiting | Focus rule: the field takes keyboard focus on arrival so AutoFill can offer the code, but with VoiceOver on, VoiceOver focus goes to the title first and the field is next (focus is not stolen); AutoFill allowed; Send again shows the wait in words, not a ticking bar | `phone.code.title`, `.resendWait` |
| Entering | Auto-submits when the length is reached, except with VoiceOver or Switch Control on, where only the Verify primary submits so the digits can be heard first; Verify always exists | `phone.code.verify` |
| Wrong code | One line under the field, text kept, focus stays; the field clears only on the next keystroke | `phone.code.wrong` |
| Five wrong tries (R24) | Entry pauses as the email code does (NS-41-R9): the wait is said in words; Send again and Not now stay | `phone.code.paused` |
| Expired | Plain line and a primary to send a new code | `phone.code.expired` |
| No code arrives (R27) | After the wait: Send again, Use another way, Not now, in that order; the line says it can take a minute (any line that the book is unaffected is a claim that must be true in the build before it is written) | `phone.code.noCode` |
| Resend | Allowed after the wait; announces "Code sent"; same screen for every number | `phone.code.sent` |
| Verified | Success haptic, one line, the page closes to where the person was; VoiceOver announces it; only the last two digits show from here on | `phone.code.done` |
| Provider fails / offline | ST-NOTICE, Try again, Not now | `phone.errors.generic`, `authCopy.offline.*` |
| Backgrounded, killed | The step restarts at the number page; nothing is kept but the choice to be asked later; no number is stored in route params or state restoration (R26) | none |
| AX5 | Title, field, Verify, Send again, Use another way, Not now stack in that order and scroll; nothing pinned | built layout |
| VoiceOver | Title with the last two digits read as digits; field "Code, N digits"; every error is announced when it appears, not only drawn | `phone.code.a11y.*` |
| Reduce Motion | No shake on a wrong code; a line only; page change by fade | none |
| Dark, Increase Contrast | Code field edge `controlBorder`; every line 4.5:1 | none |

### 6.4 C-S36 Phone in Me, Account

A row on `/settings/account`: "Phone number", status "Verified" with last two digits and when (R39), or "Not added" with Add. The detail offers "Remove" (R41; Sheet like C-S32, a notice email goes out, the session is untouched) and, after removal, Add again. The export note lives in the export screen (R40, BL-1909). Same rules as section 2: no full number, ever. Keys `phone.account.*`. Hidden entirely when the cloud feature or the step is not available (R37, D-161). AX5: the row stacks as in section 2. VoiceOver: one element, "Phone number, verified, ends in 42".

### 6.5 The Shown line (PRIV-R21, R35)

Shown before the number is typed, on C-S33, and linked from C-S34. One content key `phone.prompt.shown`; content writes it and counsel holds it before any build uses it; its hash is recorded with the act row. Required parts, in plain order: what it is for, that we text one code, that message rates may apply, that we keep the number only to prove the account and for recovery, where to read more. Records: the act row of PRIV-R21 with no number. Never: marketing, invites, ads, contacts match, a full number after entry, a condition of reading the book already on the phone. Decline: Not now, always, with every feature kept.

### 6.6 Fallback and Not now

Where a text cannot arrive (no phone, no signal, an unreachable number), the screen offers "Use another way": for Phase A this is Not now plus a line that the book and everything on the phone work without a number. The wider fallback for Phase B (7.4 of the card: cloud features only, voice call, support) is not decided and not drawn. Not now is never smaller, dimmer, further down in order or later in reading order than Continue, and never carries a consequence line or an untrue reassurance.

## 7. Content-key list (all PROPOSED; none exists; `content` owns the words)

`ways.title`, `.intro`, `.lastReason`, `.remove`, `.adding`, `.added`, `.noticeSent`, `.removing`, `.removed`, `.reauth`, `.offlineNote`, `.errors.inUse`, `.errors.generic`, `.removeSheet.{title,body,confirm,cancel}`, `.lastSheet.{title,body,addAnother}`, `.a11y.*`; `duplicate.{title,body,back,continue}`, `duplicate.a11y.*`; `phone.prompt.{title,body,shown,continue,later,readMore}`, `phone.number.{helper,invalid,sending,unusable}`, `phone.code.{title,verify,wrong,paused,expired,noCode,resendWait,sent,done}`, `phone.errors.{generic,wait}`, `phone.account.*`, `phone.*.a11y.*`. Reused, built: `authCopy.offline.*`, `authCopy.errors.*`; on hold, PROPOSED: `authCopy.region.*`. Placeholders `{last2}`, `{length}`; never `{child}` gendered, no child name on these screens.

## 8. Open and held

- Phase B and the fallback beyond Not now: held for the founder with counsel (card 7.4, Q6, Q8); no screen is drawn.
- Whether Google shows at all: founder's scope call; section 2 handles both.
- Whether the duplicate line also appears after Google when Apple was the first way: the trigger is the provider result alone (section 5); the security engineer confirms it against the Supabase version run [UNVERIFIED].
- Route names and screen ids are PROPOSED; `mobile` confirms.
- UNVERIFIED on device: VoiceOver order, AX5 stacking, Increase Contrast, AutoFill of the code, the Apple button's own accessibility. A phone walk is needed on iPhone SE 3 (NS-33 floor) before the build is called accessible.
- No contrast numbers are new: all roles are existing tokens, so no token test is added.

Signed: `design-systems`.
