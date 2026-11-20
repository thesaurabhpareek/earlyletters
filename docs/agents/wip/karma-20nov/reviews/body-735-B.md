## What this does
Build 12 is servers on, recording backup off, Family and co-parent surfaces hidden, recordings kept on the phone that made them. Several account, sign-in and deletion strings still said otherwise. This changes them to say only what the build does, and adds a test so an untrue claim cannot return.

**Every changed string below needs founder word approval.** Keys keep their names, so no screen code changes.

| Key (under `features.auth` unless noted) | Was | Why untrue in Build 12 | Now |
|---|---|---|---|
| `features.accountDeletion.what.intro` | Deleting your account removes your letters, recordings, photos and books from our servers. You have 30 days to change your mind. | Recordings are not on our servers (backup off); v1.0 makes no photos | Deleting your account removes your letters and books from our servers. You have 30 days to change your mind. |
| `features.accountDeletion.what.introProposed` | ...letters, recordings, books and recording backup... | Names a recording backup the build does not have | Key removed |
| `sheet.titles.first_letter` | Keep {child}'s book on any phone | Recordings do not follow the account | Keep {child}'s words on any phone |
| `sheet.bodies.first_letter`, `sheet.bodies.settings`, `account.signedOutBody` | Your letters come with you to a new phone, and {child}'s other parent can write in the same book. | Other parent cannot join (hidden); recordings do not come | The words of your letters come with you to a new phone. Recordings are kept on the phone that made them. |
| `sheet.titles.invite`, `sheet.titles.invite_create` | Sign in to join the book / Sign in to invite a co-parent | Invites and co-parent are hidden | Sign in |
| `sheet.bodies.invite` | You each write from your own phone, in the same book. | Same | Sign in on this phone to carry on. |
| `sheet.bodies.invite_create` | You both sign in, each on your own phone. | Same | Sign in on this phone to carry on. |
| `sheet.notConfigured` | ...Your letters are safe on this phone. | "Safe" is a protection promise; no backup | ...Nothing on this phone has changed. |
| `code.lettersSafe` | Your letters are safe on this phone. | Same; also read on a phone with no letters | Your letters are still on this phone. |
| `errors.network` | Your letters are safe on this phone. Sign in once you are back online. | Same | Your letters are still on this phone. Sign in once you are back online. |
| `errors.code_paused`, `email_wait`, `rate_limited`, `not_available`, `provider` | Your letters are safe. ... | Same | Nothing has changed. ... (rest of each line unchanged) |
| `errors.session_expired` | Your letters are safe on this phone. Sign in again to keep sharing them. | "Sharing" does not exist in this build | Your letters are still on this phone. Sign in again to carry on. |
| `errors.consent_unavailable` | Your letters are safe on this phone. Setting up your account did not finish. Try again. | Safe promise | Nothing has changed. Setting up your account did not finish. Try again. |
| `errors.unknown` | That did not go through. Your letters are safe on this phone. | Safe promise | That did not go through. Nothing has changed. |
| `account.syncLabel` and `en.settings.privacy.sensitiveLabel` | Sync and sharing / Sync and family sharing | No sharing or family in this build | Sync across your phones |
| `en.settings.privacy.keptSynced` | ...reach your other devices and your co-parent. ... | No co-parent | ...reach your other devices. Your recordings are kept on this phone. |
| `en.settings.delete.bookBody` | ...from our servers. Family members can save a copy of their own letters first. | No family members can write in a book | ...from this phone and from our servers. |

Also edited: `VOICE.md` ("safe" now only for a failed save and a crash), the pins in `server-surfaces-auth`, `server-surfaces-account-deletion`, `copy-surfaces` (the "photos" and "we" exceptions for the intro), and mobile `auth-machine.test.ts`, `delete-account.test.ts`, `e2e-web/j22-sign-in.flow.ts` (strings and comments). No screen `.tsx` is touched, so there is no overlap with #722, #724, #728.

## Test (red before, green after)
`packages/content/test/build12-untrue-copy.test.ts` reads the sign-in, Account, Delete account, Privacy, Where your letters live and sensitive-consent surfaces and fails on co-parent, invite, backup or "safe" claims. 6 of its 8 tests failed on develop's copy (29 claims). Registered text is held in a capped `HELD_FOR_COUNSEL` list that may only shrink.

Run: `npm test` all workspaces green (content 16 files, 375 tests, 8 new; mobile 233 files, 4371 tests); `npm run typecheck` and `cd apps/mobile && npx tsc --noEmit` clean.

## For counsel (not changed, not invented)
Registered text that still says things Build 12 does not do (only counsel changes it; `in-app-disclosures.md`):
1. `en.trust.signIn.privacy` / `features.auth.sheet.privacy`: "Only you and the people you invite can read your letters." No invites exist.
2. `en.trust.signIn.why` / `sheet.why`: "An account keeps your book safe when you change phones." Recordings do not move, and "safe" is a promise.
3. `features.auth.consent.terms.body`: "...private to you and the family you invite."
4. `en.sensitiveConsent.body`: "...share it with the family you choose..." and `declineHelp` "syncing and sharing stay off".
Retention promises in the Delete account flow, kept as they were (less what is not held): "removes your letters and books from our servers", "30 days to change your mind", `confirm.body` "everything comes back as it was", `scheduled.cancelled`, `onThisPhone`. Counsel should confirm what deletion removes and when, since the build now holds letters and books only.

## Follow-ups for the stacked PRs (strings in #722, #724, #728 not touched)
Those PRs rewrite the sign-in `code`, `consent`, `email`, `index` screens and `settings/account.tsx`. Check there for: any inline or new copy that says "safe", "other parent", "same book", "invite" or "sharing"; any use of the old text of `code.lettersSafe` in the account-first code screen (#728); and the first-run welcome/outage lines in #724. I did not read their diffs for new keys.
Left on purpose: `what.staysNone/One/Many`, `deletedFamily`, `contributor`, `bookBodyCoParent` and `scheduled.body` appear only when a book already has a second parent, which this build cannot make; they are listed in the test as such.
Out of scope, noticed: the emails (`packages/content/src/emails`, now sent) and `apps/web` invite pages (BL-558) were not audited; `claims-capabilities.test.ts` still judges the servers-off production profile and needs a Build 12 profile when #698 merges.

---
_Generated by [Claude Code](https://claude.ai/code/session_01WsZfAr14RMFfiXXQyKD8VR)_
