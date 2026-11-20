Stacked on #722 which is stacked on #701 (#722 head ef8f8977cec99eaba1187b61c519f1347c449b27). Draft. Slice 2 of account-before-book (NX-31 revision 3; NX-36 S2, S3). Behind the existing server-features switch.

## What is in it
- **S2 Welcome and sign in** (`components/onboarding/welcome-sign-in.tsx`), laid out as NX-36 S2: lockup, descriptor (heading, takes focus), body, benefit line; footer pinned at default sizes and inline at accessibility sizes; Apple's own button as "Sign in with Apple" (`AppleButton` gained a `signIn` prop, default unchanged) and "Sign in with email" (solid accent), both 56 pt; the agreement line with Terms and Privacy links directly above them; "I was invited" where allowed; last-method footnote; no password, name or phone field; "I already have a book" folded into the same two buttons. Calls the existing `useAuth().signInWithApple`, the existing `/sign-in/email` and the existing `/sign-in/consent` sheet. Inline errors for `wrong_code`, `invalid_email`, `provider` (and other input-type kinds); a cancel shows nothing (A-REQ-031, as the sheet does); network, 429, unavailable and unknown go to the outage screen through the gate. No credential logged, no analytics event, no new motion.
- **S3 Outage and offline** (`components/onboarding/outage-screen.tsx`): the existing `StateScreen` (error kind, glyph). Try again is the primary; "Start on this phone" (19 characters) is the quiet button, its long sentence a note in the body; shown only where `firstRunGate` offers it. Driven by `firstRunGate` (`outage` / `offline` / local start).
- **Connectivity**: `online` now comes from `expo-network` (`lib/first-run/use-online.ts`), starts true, reads the OS's local state only. Reconnect and Try again set the failed state aside and return to the Welcome (`retryOnReconnect`). There is no timed back-off: nothing runs silently to retry, sign-in is the person's tap.
- **"I was invited" hidden** in a servers-on store build (`invitedDoorShown`). #720 is not an ancestor, so this is the minimal equivalent of `familySurfacesShown` / `CO_PARENT_IN_STORE_BUILD` with a local constant; replace with the import once #720 merges.
- The route: `onboarding.tsx` default export keeps its shape; `FirstRun` is now the small wrapper that asks `useFirstRunRoute`; the old big component is `FirstRunSteps` (body unchanged except the `localStartChosen` prop, the `doors` line and the gate call).
- With server features off (or a build with no sign-in settings) the gate answers `unchanged` and the route is `FirstRunSteps` as before.

## New dependency: NO
`expo-network ~57.0.2` is already in `apps/mobile/package.json` (used by backup and speech packs); Expo is `~57.0.26`. No package or lockfile change, no new native module, nothing new for the Build 12 native build.

## Not in it (next)
S5 email-code screen, S6 consent sheet and S7 child step (the existing code and consent sheets still serve), merge-back wiring, analytics.

## New visible strings (aligned to NX-36 S2 and S3, branch docs/nx-36-screen-specs-9nov at 1a30be2c)
Keys and placeholder words are NX-36's. Every row needs founder word approval. Keys are in `authCopy` (`packages/content/src/features/auth.en.ts`); the two buttons are registered in the copy-surfaces test (22-character rule).

| Key | Text | Status |
|---|---|---|
| `sheet.bodies.sign_in_first` | Your book opens on any phone you sign in on. | matches spec, needs founder word approval |
| `sheet.agreeLine` | By continuing you agree to the Terms of Service and Privacy Policy. | matches spec, needs founder word approval (Q3 in spec: possible duplicate of Before you begin) |
| `firstRun.errors.provider` | That sign-in did not finish. Try again, or try another way. | matches spec, needs founder word approval |
| `firstRun.errors.rateLimited` | Too many tries for now. Wait a few minutes, then try again. | matches spec, needs founder word approval |
| `firstRun.errors.notAvailable` | This way of signing in is not available right now. Try another way. | matches spec, needs founder word approval |
| `outage.title` | Sign in cannot be reached right now. | differs from spec ("We can't reach sign-in right now."; the content rules allow no "we"), needs founder word approval |
| `outage.body` | Try again in a moment, or start the book on this phone and sign in later. | matches spec, needs founder word approval |
| `outage.retry` | Try again | matches spec, needs founder word approval |
| `outage.startLocal` | Start on this phone | matches spec (19 characters), needs founder word approval |
| `outage.startLocalNote` | Start the book on this phone for now. You can sign in later to bring it to your account. | matches spec, needs founder word approval (says where the book is) |
| `outage.backOnline` | Sign in is back. | matches spec (announcement only), needs founder word approval |
| `offline.title` | Sign in needs a connection. | matches spec, needs founder word approval |
| `offline.body` | It tries again by itself when you are back online. | differs from spec ("We will try again when you are back online."; no "we"), needs founder word approval |

Reused, not new: `sheet.email` ("Sign in with email"), `sheet.busy`, `sheet.lastMethod.*`, `onboarding.welcome.subtitle` and `.body`, `.joinButton`. Apple's button text is Apple's own ("Sign in with Apple", type SIGN_IN, per the 9 Nov ruling over spec decision 3). No recording, backup or "kept safe" claim.

Differences from the spec that are not strings:
- "I was invited" is shown on S2 only where `invitedDoorShown` allows it (hidden in a servers-on store build, per the 9 Nov ruling).
- S3's note under the local-start button is appended to the body, because `StateScreen` has no note slot (a `design-systems` follow-up). There is no busy state on Try again and no back-off timer; reconnect or Try again returns to the Welcome.
- The spec's first-run rate-limit and not-available lines are mapped, but the gate sends those kinds to the outage screen (QA: a 429 is an outage), so they are a fallback.
- S2's `analytics` list in the spec (`auth_sheet_shown` and so on) is NOT sent: the brief for this slice said no analytics events.

## Tests
`apps/mobile/test/first-run-welcome.test.ts` (26 tests). Two titles are NX-36 section 12's, word for word: `[NX-36-S2] Apple and email buttons have equal height; no string on the screen says recordings are kept safe` and `[NX-36-S3] the local-start option shows only after Yes, on a failure, with the constant on`. The other tests use the same ids as working labels, plus `[NX-31-R17]`, `[NX-31-R18]`, `[NX-31-R19]` (NX-36 lists no titles for those; #722 holds the gate ones) and a servers-off "unchanged" group. Red before (the new modules did not exist), green after. `test/lamp.test.ts` allowlist gained the welcome file (the lamp is mounted there).
Checks: `npm test` all workspaces green (mobile 232 files, 4391 tests; was 231 and 4365 on #722); `npm run typecheck` clean; `cd apps/mobile && npx tsc --noEmit` clean; banned-character scan on added lines clean.

## Shared files
`apps/mobile/src/app/onboarding.tsx` (also #701, #703, #716, #721, #722), `apps/mobile/src/lib/auth/ui.tsx`, `apps/mobile/src/lib/first-run/gate.logic.ts` (#722), `packages/content/src/features/auth.en.ts`, `packages/content/test/support/copy-surfaces.ts`, `apps/mobile/test/lamp.test.ts`. Not touched: `_layout.tsx`, `capabilities.ts`, `eas.json`, supabase.

## UNVERIFIED
No device or simulator run. Not checked: real Apple or email sign-in; the Apple button's "Sign in with Apple" artwork; VoiceOver order and labels (set by source and read from code only); Dynamic Type AX5 (the body scrolls and uses existing patterns, not seen); the Welcome-to-consent hand-off (`router.push('/sign-in/consent')` from a non-modal route); the offline and reconnect behaviour of `expo-network` (device rows D31-10, D31-11, D31-19); the flash-free restore (`restoring` renders blank paper).

https://claude.ai/code/session_01WsZfAr14RMFfiXXQyKD8VR

## Update 10 Nov: new head d4a9983b22fcd121fcf0bd43736d91246a643d11 (red-team fixes)
**Every earlier review is void at this head; re-review needed.** Merged #722's new head (df7033071) into this branch (merge commit, no force push). What changed:
- WORDS: `authCopy.sheet.bodies.sign_in_first` was "Your book opens on any phone you sign in on." (untrue: recordings stay on the phone, and with consent declined not even the words move). Now "Sign in to begin your book." It says nothing about phones or recordings. **TODO(founder, counsel): this is a placeholder line, needs word approval.** I did not use #735's "The words of your letters come with you to a new phone..." because that is also an unapproved claim and the Welcome comes before consent. The same class of line in #738 (`settingsHome.signedOut.body`) is handled in that PR.
- `useOnline(enabled)`: a servers-off build no longer reads the network state or registers a listener (`serverFeaturesEnabled() && auth.configured`).
- ONE co-parent flag in this stack: added `lib/family/surfaces.logic.ts`, a byte-for-byte copy of the file #737 adds (so #737 merges over it with no conflict), and `invitedDoorShown` now calls `familySurfacesShown`; `INVITED_DOOR_IN_STORE_BUILD` is gone. Still two flags until #720 lands (`CO_PARENT_IN_STORE_BUILD` in #720 / `entry.logic.ts`): whoever merges second must delete one. I cannot edit #720 or #737 from here.
- Bounded wait: while the session is read from the Keychain the first screen may be blank for at most 10 s (`RESTORE_WAIT_MS`), then the Welcome shows. Pure rule `restoreBlocksScreen` plus a timer in `use-first-run-route.ts`.
- New tests: `test/first-run-welcome-redteam.test.ts` (4 tests, fail on the old code). Existing welcome test updated for the flag move.
- Not done: founder word approval for the whole strings table, the CCO line for the outage / local-start disclosure, a device VoiceOver run, and the compliance-fence run (it runs on `pull_request_target` synchronize; check it at this head).

Tests at this head: apps/mobile 233 files, 4400 tests green; packages/content 15 files, 367 tests green; `npx tsc --noEmit` clean.

---
_Generated by [Claude Code](https://claude.ai/code)_
