# ADR 0037: Writing Tools and letter words: one native setting, one shared input

- **Status:** PROPOSED, 21 Nov 2026. Ruled in `docs/agents/cto/RULINGS.md:652` (CR-67 AX-1, "ruling D2"); this file is the record that ruling cites as "ADR 0039" (eval C s1.4). Docs only.
- **Author:** `principal-architect`. Reviewers asked: `mobile`, `design-systems`, `security-architect`, `privacy`.
- **Number:** next free id on 21 Nov 2026 after ADR 0036. Read "ADR 0039" as 0037 (`docs/adr/CROSSWALK-new-scope.md`).

## Context

- The constitution: the machine may remove and repair, never add meaning. Apple's Writing Tools can rewrite text in a text field; a rewrite inside a letter's words would be a machine edit that skips `verifyEdits`.
- Fact carried from the 20 Nov design run: React Native 0.86.3 has no `writingToolsBehavior` prop in the installed `node_modules` (`docs/tdd/new-scope/architecture.md`, section 0 item 9). Not re-checked here (U).
- Three designs answer it three ways (`architecture.md` AX-1): build one native shim (`09-capture.md:185`), accept a recorded finding (`10-reading-and-family.md:207`), a native setting under NSC-05 (`security.md:50`).
- AP-12: every field whose text becomes a letter's words uses one shared input in `components/ui` with a letter variant. The Review editor already ships without the setting.

## Options

- **A. Build one native setting once; wire the shared input (ruled).** `mobile` writes the setting as a native module change under NSC-01 (hash pin, Swift scan, `security-architect` as a lens); `design-systems` wires the AP-12 input. Cost: a native change in a candidate build.
- **B. Accept it as a recorded finding and ship.** No native work; the words of a letter can be rewritten by a system tool on iOS 18 and later. This is the constitution's problem, not a detail.
- **C. Keep the field out of the app's own input** (for example render in a way the system cannot edit) [U: no such approach was found or tested].

**Default: A.** Until it lands, rows about Writing Tools (D2) are a recorded finding and the flag of every new word field stays off in `production` (`RULINGS.md:652`).

## Decision

1. Option A. One shared letter-words input, one native setting, set in one place.
2. No new word field (Firsts label, From name, photo words and place, typed-day words) ships on in `production` before the shared input uses the setting.
3. The Review editor gap is reported to the founder, not decided here. Nothing public claims anything about Writing Tools.
4. iOS 17 has no Writing Tools, so the setting matters on iOS 18 and later (`security.md:348`, U).

## Consequences

- One native module PR on the batch plan (AP-4); a source scan with a mutant.
- AS-9 in `architecture.md` gates NS-16, NS-18, the Firsts label and photo text on this.

## Not decided here

Whether the Review editor ships before the setting (founder); the exact native API name (UNVERIFIED until `mobile` reads the installed SDK).
