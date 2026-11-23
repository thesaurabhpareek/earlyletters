# BL-487 What stays reachable during the 24-hour age closure

Owner: QA. Source: BL-487 (council ruling, batch 6, option a). Method: reading the code and the tests at origin/develop 003ae0507. Nothing here was run on a phone or in a simulator: every device effect is UNVERIFIED until the device run below is done.

## Question
After a person answers No on the account age step (S55), are reading a letter and "Save a copy" (Settings > Export your book) still reachable during the 24-hour closure?

## Finding (code reading): neither is reachable
1. No at the age step ends the session with `under_18` (`apps/mobile/src/lib/auth/machine.logic.ts:191`). The provider signs out on this phone and calls `onUnder18` (`apps/mobile/src/lib/auth/session-provider.tsx:359-374`), which is `closeGate` in `apps/mobile/src/app/_layout.tsx`.
2. `closeGate` calls `answerAgeGate('no')`, which deletes `ageGate.passed` and sets `ageGate.stoppedAt` (`apps/mobile/src/lib/age-gate.ts`). `decideGate` then answers `stop` for 24 hours (`apps/mobile/src/lib/age-gate.logic.ts`, `BLOCK_MS`).
3. While the decision is not `pass`, the root layout renders only `AgeGateScreen`; the whole `Stack` (Tonight, Book, a letter, read together, Settings, Export) is the other branch (`apps/mobile/src/app/_layout.tsx`, `gate.decision !== 'pass' ? (`).
4. The stop screen holds one line and, only after 24 hours, "I answered by mistake" (`apps/mobile/src/components/gate/age-gate-screen.tsx`, `gate.stop`, `gate.stop.mistake`). It has no link to a letter, to read, or to export.
5. Deep links are gated too: `apps/mobile/src/app/+native-intent.tsx` calls `decideGate` for an invite link, and no route renders anyway.
6. Erase everything is also out of reach, and an erase never ends a running stop early (`apps/mobile/src/lib/store.ts`, `AGE_STOPPED_AT` kept).

So read, play, "Save a copy" and every other screen are unreachable until the 24 hours pass and the person answers again. The letters stay on the phone, untouched (the sign-out is `scope: 'local'`).

## Tests that cover this
- `apps/mobile/test/erase-all.test.ts` "(a) a stopped person cannot reach Settings or Erase everything: no route renders until the gate passes" (checks the layout order: gate screen first, `Stack` in the other branch). It reads source text; it does not render.
- `apps/mobile/test/age-gate-ns40.test.ts` "[NS-40-R8] No at the age step ends the session": only `ageGate.stoppedAt` is stored, decision `stop`.
- `apps/mobile/test/auth-machine.test.ts` "[LEGAL-REQ-002] answering No on the age sheet ends the session with the under-18 stop".
- `apps/mobile/test/age-gate-erase.test.ts`: No goes to the stop at once.
- Gap: no test starts from a phone that already holds a book and a passed gate, answers No on the age step, and checks the book is unreachable. UNVERIFIED on a device and not asserted by a render test.

## Device check (for the founder run; not added to DEVICE_TEST_PLAN.md, BL-948 owns it)
Phone with a drill book "Asha" and an older drill account whose Terms are current without the age line (needs a test account in that state: UNVERIFIED that one exists on staging).
1. Sign in, reach the age step, choose No, Continue. Expect the stop line, no tab bar.
2. Press the home button and reopen. Expect the stop line again.
3. Try the Settings and invite deep links. Expect the stop line.
4. Set the clock forward 24 hours, open the app. Expect "I answered by mistake" and, after it, the question; Yes then shows the book with every letter and Export working.
Record in the session's evidence file.
