# The You tab as three named states, plus Account (BL-801)

Owner: design systems. Status: spec for `mobile`, 9 Nov 2026. Nothing here is built yet except where it says "exists".
Sources read: exec council slice 3 section F (9 Nov), NX-36 S14, S15 and S16 (branch `docs/nx-36-screen-specs-9nov`), NX-30 and NX-30a, PR #699 (head `cab3713a3c872e10bcbcfc5266ae48530250ec04`), and `apps/mobile/src/app/settings/index.tsx`, `settings-home.logic.ts`, `lib/store.ts` (`localDeletionAllowed`), `lib/capabilities.ts`, `settings/account.tsx` and `packages/content/src/features/auth.en.ts` on `develop`.

Where this file and NX-36 S14 differ, this file governs and says so. Where it differs from the code, the gap is flagged "GAP" and a decision is named.

## 1. What the person should feel

The You tab is where a parent checks that their book is theirs and safe. It is calm and plain: one card at the top that says, truthfully, where the letters are and how they sign in; everything else is the Settings they already know. Nothing nags. No badge, no count, no colour change on the tab when something is wrong (NX-36 S0).

## 2. One shell, three named states

The tab root is the Settings home component, mounted by `(tabs)/you.tsx` (#699: `export { default } from '../settings/index'`). One component, never a copy; `test/account-deletion-switch.test.ts` pins `settings/index.tsx` as the only file that names the Delete account route.

Page title: native header "Settings" (`copy.settings.title`), heading level 1. A tab root has no Back, so VoiceOver starts on the title, not "Back". No lamp (DESIGN_LANGUAGE 2b, `lamp.test.ts`). The tab label is "You" (`tabs.you`, placeholder in #699); the page says "Settings" so a parent knows they arrived.

Naming, so the code and the specs say the same thing:

| Name | When | How the shell tells (proposed predicate, `mobile` to confirm) |
|---|---|---|
| A. Signed in | The phone has a session | `capabilities.signIn && auth.signedIn` |
| B. Signed out | Sign-in is on, no session, and the phone has signed in before (a book exists, a session ended, or an account was deleted elsewhere) | `capabilities.signIn && !auth.signedIn && syncOwner !== null` |
| C. Local start | Sign-in is on, no session, and the phone never signed in (a book made by the outage fallback) | `capabilities.signIn && !auth.signedIn && syncOwner === null` |
| (0. No sign-in build) | `capabilities.signIn` off | Exists today: card says "On this phone", opens nothing. Not one of the three; listed so the shell has no fourth branch hidden in it |

GAP 1 (predicate). Today `headerCard()` takes `status`, `provider` and `signsAs` only. It cannot tell B from C, and for both it returns the title (name or "Account") with the subtitle "Not signed in" and a chevron to Account. The NX-36 `SignedOutCard` does not exist (`git grep SignedOutCard` on `develop` finds nothing). `mobile` adds the predicate and the card; `syncOwner(db)` is the existing source for B versus C (the same value `localDeletionAllowed()` reads).

GAP 2 (two meanings of signed in). `headerCard` treats `checkingConsent`, `needsConsent`, `ready` and `signingOut` as signed in; the Delete row tests `auth.signedIn`. Whether those two agree during `needsConsent` and `signingOut` is UNVERIFIED. This spec uses one meaning: a user id on the phone. `mobile` to confirm the Delete row and the card cannot disagree.

## 3. Rows by state

Sections in today's order. "Same" means the existing row, existing key, no change.

| Order | Row | A. Signed in | B. Signed out | C. Local start |
|---|---|---|---|---|
| 1 | Top card | Account card (below) | `SignedOutCard` | `SignedOutCard` plus one line |
| 2 | Plan | Shown | Shown | Shown |
| 3 | Children (title "Children" section, one row per book, Add, Hidden books only if any) | Same | Same | Same |
| 4 | Writing: Spoken language, Your words, Reminders, Appearance | Same | Same | Same |
| 5 | Your letters: Where your letters live, Export your book, Recently deleted, Storage | Same | Same | Same |
| 5a | Back up row | Absent (`backupInBuild()` false) | Absent | Absent |
| 5b | Erase everything on this phone | Absent | Absent (GAP 3) | Shown, last in Your letters, destructive |
| 6 | Privacy and security: App lock (value On or Off), Privacy | Same | Same | Same |
| 7 | Delete account (own section above Help) | Only if the gate in section 6 holds | Absent | Absent |
| 8 | Help and legal: Help, If you are struggling, Legal | Same | Same | Same |
| 9 | About: Version, early-version note, sign-off | Same | Same | Same |

Not on the You tab in any state: a Sync row (it lives in Account only), any Family or co-parent row, any claim that recordings are backed up.

### Top card, A (signed in)

- One `ListRow` in its own `ListSection`. Title: the name the person signs as (for example "Mama"), else `settingsHome.accountLabel` "Account". Subtitle: `authCopy.account.signedInWith.{apple|google|email|other}`. Trailing chevron. Hint `settingsHome.cardHint.account` "Opens Account.". Opens Account. All keys exist.
- Plan row directly under it in the same `ListSection` (exists).

### Top card, B (signed out) and C (local start)

`SignedOutCard` (new component in `components/ui` or `components/settings`; built from `Card variant="outlined"`, `Text`, `Button`):

1. Title, `headline`, heading: `authCopy.account.signedOutTitle` "Not signed in" (exists).
2. Body, `body`, `textMuted`: B uses `settingsHome.signedOut.body`; C uses `settingsHome.signedOut.body` and then, as a second paragraph, `settingsHome.localStart.body`.
3. One `Button` `variant="primary"` `size="md"` (48 pt), `fullWidth`, label `authCopy.account.signIn` "Sign in" (exists). Opens `/sign-in?trigger=settings`; consent and the claim screen follow (NX-36 S3, 4.2). Nothing moves until the person agrees.
4. The card never blocks the tab bar, reading, recording or Export (NX-31-R22). It shows no account email, no plan status that needs the server and no sync status.
5. The Plan row sits in its own `ListSection` directly under the card (the Terms name "Settings, Plan").

The card is not a button as a whole (one button, one target, no second tap area). It does not appear on Tonight in Build 12 (NX-36 Q4); if product changes that, this same component is reused.

## 4. Strings

Reuse first. Every NEW or CHANGED string below is flagged **needs founder word approval**, and rows marked R also need counsel (they say where the letters are).

| Key | Words | Status | R |
|---|---|---|---|
| `copy.settings.title` | Settings | exists | no |
| `tabs.you` | You | exists in #699 (placeholder, founder confirms "You", "Yours" or "Settings") | no |
| `tabs.youA11yHint` | Settings and account | NEW, needs founder word approval | no |
| `authCopy.account.signedOutTitle` | Not signed in | exists | no |
| `authCopy.account.signIn` | Sign in | exists | no |
| `authCopy.account.signedInWith.*` | Signed in with Apple, Google, email, or Signed in | exists | no |
| `settingsHome.accountLabel`, `cardHint.account`, `cardOnPhone` | Account, Opens Account., On this phone | exist | no |
| `settingsHome.signedOut.body` | Your letters are on this phone. Sign in to open your book on any phone. | NEW, needs founder word approval | yes |
| `settingsHome.localStart.body` | This book is on this phone. When you sign in, it moves to your account after you agree. | NEW, needs founder word approval | yes |
| `authCopy.account.signedOutBody` | Your letters come with you to a new phone. | CHANGED, needs founder word approval (drops the co-parent clause) | yes |
| `authCopy.sheet.bodies.settings` | Your letters come with you to a new phone. | CHANGED, needs founder word approval (the sign-in sheet reads it for the `settings` trigger) | yes |
| Sync row label in Account | Sync (`authCopy.account.syncTitle`) | exists; replaces `syncLabel` "Sync and sharing" | no |
| `settingsHome.childFallback` (key name for `mobile`/`content` to choose) | Your child's book | NEW, needs founder word approval (the nameless-child fallback from NX-36 S14, #703's `fill()`) | no |
| `accountDeletionCopy.signedOut.*` | Sign in to delete your account... | exists | no |
| `authCopy.account.signOutBody` | Your letters stay on this phone. Sign in again any time. | exists, registered | no |

No co-parent mention. While family surfaces are hidden (Family is inside `Tabs.Protected` in #699), no string on the You tab, in the signed-out cover or in the sign-in sheet's `settings` body names a co-parent, "other parent", "family" or "sharing". The current `signedOutBody` and `bodies.settings` do ("{child}'s other parent can write in the same book"), so they change in this build and keep today's text for builds where family is shown (a build-profile choice, not a runtime branch in the card).

GAP 4 (co-parent switch). `capabilities.coParent` reads the same switch as `capabilities.signIn` (`serverFeaturesEnabled()`), so in any sign-in build it reads true even though the Family tab is hidden by `Tabs.Protected`. The string rule above must therefore key off whether family surfaces are shown, not off `capabilities.coParent` alone. `mobile` to name the one flag; UNVERIFIED which.

Content rules for every string above: no em or en dashes, curly quotes, ellipsis characters or emoji; the child is never gendered (`{child}` or the fallback).

## 5. Account (S15), per state

A pushed Settings page, native header "Account", no lamp, gutter 20 pt, section gap 28 pt. A section whose capability is off is absent, not greyed.

### Signed in (A)

Sections in this order and no other:

1. You: provider mark (28 pt), `signedInWith.*` in `headline` (heading), the address in `footnote`, selectable. Exists.
2. Signs letters as: one row, value the name, chevron, opens the book's sign-as editor. New key `signsAsTitle` "Signs letters as" (needs founder word approval).
3. Ways to sign in: read only. One row per method with "Added {date}" and "This is how you signed in" on the current one. No Add or Remove rows. GAP 5: `account.tsx` on `develop` still draws "Add a passkey" and "Remove" rows. The Build 12 slice removes them or hides them behind the passkey capability; `mobile` to confirm which. New keys `methodsTitle`, `methodThisOne`, `methodAddedOn` (all need founder word approval).
4. Devices: only if `list_my_sessions` is ready, else absent. "This phone" first, then "Another device" with "Last used {date}"; no model, IP or place. "Sign out other devices" asks first ("Sign out other devices?", "Those devices keep their letters. They will ask to sign in again."). Offline: the row is disabled and says "Needs a connection." New keys per NX-36 S15, all need founder word approval.
5. Lock: App lock, value On or Off, opens the existing page. No claim that the lock protects the account.
6. Your data: Plan (same words as Settings), Sync, Export your book.
   - Sync row label: "Sync". The section heading is also `syncTitle` "Sync" today, so the section and its one row would read the same twice. Recommendation: keep the row, drop the section heading, so VoiceOver says "Sync, On" once. Open question 4.
   - Sync value from the same source as Settings, Privacy: `On`, `Off, kept on this phone`, `Not set up yet`, `Waiting for a connection` (all exist under `authCopy.account.sync.*`). Where they apply: `Finish setting up` (`finishSetup`) or `Agree and sync` (`sensitiveConsent.agreeButton`). "Agree and sync" cannot be withdrawn in Build 12.
   - Export works signed out.
7. Help: one row, the support mail with the fixed subject and nothing else.
8. Sign out, last, in `text` colour (not red: nothing is deleted). Native confirm title `signOutTitle`, body `signOutBody`. While the outbox drains the row becomes the waiting row: a small spinner, `signOutWaiting`, and a `staySignedIn` button under it.

Delete account is not repeated here (NX-32-R19 held; one entry only, on the You tab root).

### Signed out (B), stale link

Account is not reachable from the tab (the card has no chevron). A stale link or a session that ended on this page shows the closed cover: small closed-cover glyph, `signedOutTitle`, `signedOutBody` (the no-co-parent text above), one "Sign in" button.

### Local start (C)

Account is not reachable (no session). The top card on the You tab is the only entry. A stale link to Account shows the same closed cover as B.

## 6. The Delete account row (S16 entry): gate

The row is its own `ListSection` above Help, destructive variant (title in the `destructive` tone, no chevron icon besides the trailing one; the words carry the meaning). It renders only if both hold:

1. `capabilities.accountDeletion` (build flag `EXPO_PUBLIC_ACCOUNT_DELETION=on`, which needs the server switch), and
2. `auth.signedIn`.

Otherwise the row is absent, not dimmed. This matches `settings/index.tsx` today (`capabilities.accountDeletion && auth.signedIn`).

Release gate (from the exec council, section E; this spec does not decide to ship it): the same build profile that has sign-in on has the deletion flag on, and QA fails the build otherwise; the D-129 drill and the Apple revoke proof have evidence in the build record; the intro text is true of Build 12 (the live `intro` names photos and recordings on our servers, which Build 12 does not have: the placeholder is "Deleting your account removes your sign-in, and your book if you chose to keep it with us. You have 30 days to change your mind.", NEW, R, needs founder word approval); the 30-day wait is accepted (F3). If any of those fail, the row is absent, which a sign-in build must not ship with (G5). Signed-out and local-start phones never show the row: for B the way is "Sign in" on the card, then the row.

## 7. Erase everything on this phone, per state

| State | Shown? | Why |
|---|---|---|
| A. Signed in | No | An account holds the books too; deletion goes through Delete account |
| B. Signed out | **No in code. NX-31-R26 and NX-36 State B say yes. GAP 3.** | `localDeletionAllowed()` is `syncOwner(db) === null`; a phone that signed in once has an owner for good |
| C. Local start | Yes | Owner is empty |
| 0. No sign-in build | Yes | Owner is empty |

Decision per the exec council (CPrivO and CISO): leave the code, document the gap, do not widen local deletion on a phone the server also holds. So State B does not show Erase, and the spec text in NX-36 S14 State B ("Erase everything on this phone: shown") is wrong and is superseded here. The same predicate also hides "Delete this book" on a book's page and the delete-book route (`children/[id].tsx`, `delete-book.tsx`), so a B phone has no local deletion anywhere. The person's recourse, said once on the card for B: Sign in, then Delete account. No extra string is added; the card's Sign in button is the path. Open question 2 asks whether a quiet line saying so is wanted (it would be NEW and R).

## 8. Dynamic Type, Reduce Motion, themes

| Concern | Spec |
|---|---|
| Letter text | Never truncated at any size (D-027). Names, titles, values, subtitles and the card body wrap |
| Rows | `ListRow` grows with type; minimum 44 pt; at AX3 and above the value moves under the title (existing `ListRow` behaviour); no two-column squeeze |
| Card | At AX5 the title wraps, the body wraps, the Sign in button stays `fullWidth` and its label wraps to two lines (Button spec: wraps, never truncates). Minimum height 48 pt, grows |
| Tab label | Stays 13 pt (fixed bar). The Large Content Viewer is the AX5 path: long press shows "You" (`LARGE_CONTENT`). The label never wraps, hides or goes icon-only (NX-36 S0) |
| Scroll | The whole page scrolls; nothing is pinned. Delete account stays inline, reachable at AX5, never in a footer |
| Order | Sections never reorder with size or state; a section is absent or present |
| Reduce Motion | Nothing enters or animates on a visit; sub-pages use the native push; sign-out uses the `fadeMs` crossfade; no spring on the card |
| Reduce Transparency | The page and card use solid roles (`bg`, `surfaceRaised`); no blur anywhere |
| Dark | List card `surfaceRaised` with a 1 pt `line` edge (the `ListSection` does this); the outlined card uses `line`; destructive role 7.65 : 1 in dark, 5.05 : 1 in light; colour is never the only signal (the word "Delete account" carries it) |
| Targets | Sign in 48 pt; every row and button 44 pt or more (`target.min`) |
| Haptics | None on this page for navigation. Sign in is a normal button press only |

## 9. VoiceOver

Order, top to bottom, one element per row:

1. Tab bar item: "You, tab, 3 of 3. Settings and account." (hint `tabs.youA11yHint`), selected state announced. Last item in the focus order is the tab bar, as on every tab.
2. Heading: "Settings" (heading level 1).
3. Top card.
   - A: "Mama, Signed in with Apple. Opens Account." (one element, button). Plan row next: "Plan, Free, {subtitle}" (value then subtitle as built).
   - B: heading "Not signed in"; then the body as static text; then "Sign in, button". Three elements, in this order. Plan row next.
   - C: heading "Not signed in"; body one; body two; "Sign in, button". Plan row next.
4. Section headings are headings: "Children", "Writing", "Your letters", "Privacy and security", "Help and legal", "About".
5. Rows as built. A nameless child's row reads "Your child's book" (today it reads nothing: GAP 6, `title={ch.name}` renders empty; fix is `title = ch.name || fallback`, and the same for the child's page title).
6. Delete account (A only): "Delete account, button". The destructive tone is not the only signal; the label says it. No hint needed on the row; the next page explains.
7. Help rows, About rows, version (static), the early-version note (one element), the sign-off (static).

Escape gesture on a pushed sub-page returns to the You tab root. The focus after returning from a sub-page lands on the row that was opened.

## 10. Empty, offline and error variants

| Variant | A. Signed in | B. Signed out | C. Local start |
|---|---|---|---|
| Empty | n/a: the shell always has rows. A phone with no book still shows the card and Children with only "Add a child" | same | same |
| Loading (session restoring at cold launch, up to 10 s) | Card shows the name alone; no spinner, no "checking" text; the subtitle resolves in place | The card shows as B. If the session then restores, it changes to A in place with no animation | As B |
| Offline | Everything local works. Account rows that need a connection use `gateOffline` inside their own page. The card is unchanged (the subtitle is cached) | The card is unchanged. Tapping Sign in with no connection shows the sign-in page's own offline line; nothing on the You tab changes | Same as B |
| Error (account read failed) | Only the card subtitle changes to the cached method; no alarm, no banner | n/a | n/a |
| Error (any sub-page) | That page shows one `ErrorLine` in the section that failed; the rest works | Same | Same |

An account problem is never a badge or a colour on the tab or on the card.

## 11. Component notes

- `SignedOutCard` (NEW): `Card variant="outlined"`, padding 5, `Text` headline and body, one `Button primary md fullWidth`. Props: `variant: 'signedOut' | 'localStart'`, `onSignIn`. No images, no illustration, no lamp. Add it to `docs/design/COMPONENTS.md` section 2 when it is built; this file is the interim spec. Android later: same code.
- `ListRow` and `ListSection`: unchanged. The destructive variant for Erase and Delete account is unchanged.
- Tokens: no new token. Every colour, space and duration is an existing role.
- Tab selection cue (icon weight plus label face) is NX-36 S0 and NX-30a-R5. It is left for qa BL-807 and is not specified or changed here.

## 12. Acceptance checks (for `mobile` tests and the device pass)

- [ ] Three states render from one component; A shows the Account card, B and C show `SignedOutCard`.
- [ ] B and C cards have exactly one button; C has the extra paragraph; neither names a co-parent, family or sharing.
- [ ] Plan row is present in A, B and C.
- [ ] Delete account is present only with the deletion flag and `auth.signedIn`; absent in B and C and in a build without the flag.
- [ ] Erase everything is present only in C and 0; absent in A and B (until GAP 3 is decided otherwise).
- [ ] Account has no Sync and sharing label; Sync reads "Sync".
- [ ] Header "Settings" is heading 1 and VoiceOver does not start on "Back".
- [ ] AX5 on a 320 pt phone: no clipped line on the card, the Sign in label wraps, Delete account reachable by scrolling.
- [ ] Reduce Motion and Reduce Transparency walks show no movement and no blur.
- [ ] Nameless child row has a title.
- [ ] Light and dark contrast: card text and the Sign in label pass 4.5 : 1 (existing roles; no new colour).

## 13. Open questions

1. Who writes the predicate that tells B from C (`syncOwner` through a small exported function)? Confirm `syncOwner` is set at the moment of the first sign-in, not at the first claim (UNVERIFIED), since that decides whether a just-signed-in phone is briefly C.
2. Should the B card carry a quiet line saying the way out of a local book is Sign in, then Delete account? The council said recourse only; a line would be NEW and R. Default: no line.
3. Which flag means "family surfaces are shown" for the string choice (GAP 4)?
4. Account: drop the "Sync" section heading so the one row is not read twice? Default: drop the heading.
5. Is the signed-out card's second paragraph for C always shown, or only until the first sign-in? It cannot show after a sign-in (the phone is then B), so no extra rule is needed; confirmed by the predicate.
6. Counsel (R rows): `settingsHome.signedOut.body`, `settingsHome.localStart.body`, `signedOutBody`, `bodies.settings`, the Delete account intro placeholder.
