# ADR 0038: One phone, two accounts: a screen cover and one data check

- **Status:** PROPOSED, 21 Nov 2026. Ruled in `docs/agents/cto/RULINGS.md:663` (CR-67 AX-12); the record that ruling cites as "ADR 0031". Docs only.
- **Author:** `principal-architect`. Reviewers asked: `mobile`, `security-architect`, `privacy`.
- **Number:** next free id on 21 Nov 2026 after ADR 0037. Read "ADR 0031" in older text as 0038 (0031 is the home slip registry; `docs/adr/CROSSWALK-new-scope.md`).

## Context

- The book on a phone belongs to the account that claimed it (`sync.ownerId`). When another account signs in on that phone, A's child name and letters must not show or be read, claimed, uploaded, indexed or reminded (`security.md` NSC-03, NS-10-R3, `[X4-R1]`).
- Built and merged: the pure rule `bookVisibleTo({ owner, sessionUser })` (`apps/mobile/src/lib/auth/account-scope.logic.ts:34`, #869) and the screen cover (`components/account/account-layer.tsx:39`).
- Open: #879 puts one `bookVisibleNow()` in `lib/store.ts` so list reads return nothing while another account is signed in; reads by id stay open on purpose because the listening-copy cleanup deletes a copy whose draft and entry are both gone (`lib/audio-enhance/index.ts:109`, per the PR). #1087 guards Delete account's note. #895 will guard Find the same way. The reminder planner guard is not written (U).
- A route cover alone does not stop a scheduled reminder that names A's child, a Find catch-up or a slip (`architecture.md` AX-12).

## Options

- **A. Cover for screens and one data check for reads, planner and Find (ruled).**
- **B. Cover only.** Smallest; leaves reminders and index open.
- **C. Wipe A's book when B signs in.** Closes the leak by destroying a family's words; rejected under the constitution (nothing is deleted or moved by a sign-in).

**Default: A.**

## Decision

1. One owner-versus-session rule (`bookVisibleTo`), one store-level reader of it (`bookVisibleNow`), failing closed when the owner cannot be read.
2. When the answer turns false, every scheduled notification is cancelled, because notes already planned under A still fire and name A's child (NS-32-R12, P0).
3. Writes, sync and the stored rows are unchanged; nothing is deleted or moved. Erase everything and export are never gated by this check (LEGAL-REQ-040).
4. The cover sets `accessibilityViewIsModal`, as the app lock does, since screens under it stay mounted; the data check is the real control.

## Consequences

- Until #879 merges, a second account sees A's lists through the store (RC-7 in `architecture.md`).
- Every new reader of book data (Find, planner, slips, days) uses the same check and adds a test that the other account reads nothing.

## Not decided here

Whether `reading by id` should also close once listening copies are cleaned up another way (`mobile`, `security-architect`).
