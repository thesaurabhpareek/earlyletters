## Review B at 4879ff5c82ea3ac7f419db17c9ffdfcb27c3402b: PASS WITH NOTES
<!-- agent:security-architect -->

Lens B (identity, security, privacy). PR 2 of the BL-961 stack. My first review was at `46608dd4`. The head is now `4879ff5c` (pushed 12:25 UTC), a merge of develop `f04cdf4b` (#869 merged as `c1306b18`, #875 as `f04cdf4b`), and the base is now develop. Check: `git diff f04cdf4b 4879ff5c` is byte-identical to `git diff 427f1fea 46608dd4` (cmp, 11 files, +390/-5), and #869's two files on develop match `427f1fea`. So everything below, checked at `46608dd4`, holds at this head. The delta: the gate step `otherAccount`, the route reading the owner, the screen cover `components/account/account-layer.tsx`, PROPOSED words, and three tests. Reviewed after the new head was 10 minutes old. CI at 12:48 UTC: `required`, tests and content rules, typecheck, database rules, Deno and the other jobs green; the store-profile Release launch job was still queued (it waits on the shared runner queue, as it did on the earlier heads); one duplicate compliance-fence run cancelled beside a green one. The full mobile suite and tsc at #879's head `e27d104e`, which contains this head, show only the sandbox baseline (8 files / 73 tests; 5 known tsc errors).

Must fix: none.

What I checked:
- Tests in a worktree of the head (with its own workspace links): account-scope, account-gate, account-layer, account-route and use-first-run-route, 83 of 83 pass. Mutation: removing the `otherAccount` line in `firstRunGate` fails 4 of 10 in account-gate and account-route. Full mobile suite on the head: 9 files / 74 tests fail. 8 files / 73 tests are the sandbox baseline (expo-local-authentication, expo-clipboard). The ninth, `book-cover.test.ts`, timed out at 5 s under the parallel run and passes alone (59 of 59). `npx tsc --noEmit`: the 5 known errors only. The full run includes #869's code.
- The cover sets `accessibilityViewIsModal`. On iOS it is `FullWindowOverlay unstable_accessibilityContainerViewIsModal` (`account-layer.tsx:44`; the prop exists in react-native-screens 4.26.2), and the inner page View also carries `accessibilityViewIsModal` (`:53`). This matches the app lock (`app-lock-layer.tsx:80, 84`) and NSC-03 on #858. It is mounted under the app lock (`_layout.tsx`), so the lock stays on top.
- No first-account data deleted. Sign out on the cover calls `notMyAccount()` (`session-provider.tsx:384-388`), which dispatches `SIGN_OUT_REQUESTED` with `pendingUploads: 0`. The reducer (`machine.logic.ts:191-196`) then does not wait, so `canSync` stays false and A's outbox is never sent under B. A's queued ops stay in `sync_outbox`. After the sign-out, `releaseEmptyPhone` keeps the owner because the phone holds rows (`ownership.ts:106-118`). Nothing on the cover offers Erase.
- No sync under B: `claim()` meets `AccountMismatchError` and `ensureEngine` never starts an engine for B (`sync/index.ts:174-184, 201-207`). The route now also never asks B's account for `sync_books` (`asks` needs `visible`; pinned in account-route).
- No user content in logs: no `console`, analytics or crash call is added (grep of the diff). The cover reads only `sync.ownerId` and the session id, and shows no name, count or email (pinned in account-layer).
- Cites, 9 sampled, 9 hold: `gate.logic.ts:123-125` on `20553b18`, `ownership.ts:49`, `sync/index.ts:73, 180`, `session-provider.tsx:384-388`, `machine.logic.ts:229-241`, `store.ts` `currentUserId` (owner setting), `app-lock-layer.tsx:80`, #858 security.md:52 (NSC-03).

Every read path, covered or listed:
- Covered by the cover (iOS): Tonight, Book, letters, Listen, Review, Write, Settings, sheets and deep links. That is visual and VoiceOver cover only; screens stay mounted underneath.
- Listed as not covered here: the store's reads (#879), Find (#798), Photos lens (#840), reminders (`lib/reminders`).
- Not listed (findings 2 and 3): Android and web, and effects that keep running under the cover.

Findings (most serious first):
1. Note, cold start: while the Keychain read is `restoring`, the session reads as signed out, so A's Tonight can draw for a few frames before the cover. Under D1 the person holding the phone can open the book anyway by signing out, so this is not a new exposure. The cover protects the separation of accounts, not the phone from its holder. Keep device row 4. If the founder ever drops D1, this window becomes a finding.
2. Note, Android and web: the cover there is a plain `View` with `zIndex: 999`. It has no modal semantics for TalkBack, and a native `Modal` (for example `reminder-prime-ask.tsx:97`) draws above it. iOS is first, so this is not a blocker. Add an Android row before Android ships: `importantForAccessibility="no-hide-descendants"` on the content under it, or a native overlay.
3. Note, under the cover screens stay mounted, so their effects run under B's session: for example, playback already going on, timers, the transcription queue on A's waiting takes. None of these sends anything to B's account (sync is stopped), but audio that is already playing would still be heard. Name it in device row 3 (start Listen, then sign in as B).
4. Note, words: `components/account/copy.ts` ships PROPOSED sentences in app code, outside `packages/content`. The PR marks them needs:founder. Merging before approval would put unapproved words in front of a parent. That is the founder's gate, not mine. I flag it so the label holds the merge.
5. Note: the route reads the owner only with server features on (`phoneOwner = active ? currentUserId() : null`), but the cover reads it whenever a session exists. That is the right way round: a remote switch-off cannot lift the cover.

Not verified:
- On a phone: the cover over a presented sheet, VoiceOver focus, AX5, the cold-start frames (the PR's device rows 1 to 5).
- Android (not built).

Reviewer: independent of the author (CR-44).
