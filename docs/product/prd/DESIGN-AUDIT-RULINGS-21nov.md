# Design audit: product rulings, draft (21 Nov 2026)

Status: DRAFT, PROPOSED. Author: `product`. Docs only. Answers the product questions in `docs/design/DESIGN-GAPS-21nov.md` (GAP-03, GAP-04, GAP-08) and in the conformance audit of PR #1233 (`docs/design/CONFORMANCE-21nov.md`: F-07a, F-07b, F-13, F-21, F-08d, F-10).

How to read this. Each ruling is a recommendation and a DEFAULT so builders can proceed today; the founder can overrule any of them. Nothing here is a D-entry, an erratum, a legal text or a promise to users. Every word a parent would read is marked PROPOSED and still goes through `content` and the voice rules. Rows marked FOUNDER are founder-owned (scope, what users are promised, copy, dates) and stay open until he answers; the default is what builders use meanwhile. [U] marks anything not verified: PR #1233 and the open mobile PRs (#838 to #840, #1172, #1226) are not on `develop` (#1175 is merged, `6483ac754`), so what "code does today" below is taken from the audit's reading, not from a run.

Two caveats up front.
1. GAP-03 as asked says "which page owns the child's name". The gap list says the conflict is over which page owns the name "Your words". I answer that question. [U] if the founder meant something else.
2. F-08d as asked says the E83 erratum proposes the lock-screen words. In `docs/product/prd/18-errata-after-lock.md`, E83 is the new-device sign-in email timing. The words "Something for the book" and "Whenever you have a minute" are in `docs/design/e2e/D-family-sharing-reminders/WORDS.md` (rows `notifications.placeholder.*`, G1) and E82 is the lock-screen rule. I treat those as the source.

## Summary

| Id | Recommendation (default) | Owner |
|---|---|---|
| GAP-03 | "Your words" stays the name of the built page (default view of new letters). The taught-names list is not called Your words. | product (default stands) |
| GAP-04 | Taught-names screen is not in 1.0. No route, no screen. 1.0 learns nothing from the family. | FOUNDER (scope) |
| GAP-08 | A-S18 survives as the id for the Photos ask. E-S32 is its first-run step, C-S27 and A-S17 stay as separate screens. | product (default stands) |
| F-07a | Keep four actions on the held screen. Design updates C-S10.held. | product, design-systems |
| F-07b | Give the held screen its own heading. PROPOSED "One thing first". | content to confirm |
| F-13 | Code wins: red circle stays, quiet Type under it, at least 44 pt. A-S06 is redrawn. | product, design-systems |
| F-21 | 1.0 has no per-picture alternative text in production, said plainly. The fields stay off until the native setting exists. | FOUNDER (what users are told) |
| F-08d | One neutral body true for all three: PROPOSED "Whenever you have a minute." | FOUNDER (copy), content |
| F-10 | A tick that cannot be saved goes back to unticked with one quiet line and "Try again". Never leave a row ticked that is not stored. | product, design-systems |

## GAP-03: which page owns the name "Your words"

Evidence. The built page `apps/mobile/src/app/settings/your-words.tsx` offers "Small fixes, marked" or "Exactly as said" as the default for new letters (setting `review.defaultView`); `docs/design/specs/09-YOUR-WORDS-21nov.md` section 1 records it. `docs/design/SCREEN-PATHS-20nov.md` PATH-12 (changed by E80) describes the same name as a list of taught names. E80 (`18-errata-after-lock.md`) and FR-AIS-34 rule only where a taught-names dictionary lives (phone only, empty on a new phone); neither says a screen exists, and spec 09 found none on `develop`.

Recommendation. The built page keeps the name. It is the page a parent can reach and test now, it is the page the constitution cares about (what the machine may change in her words), and renaming a built page costs a string change and re-reading every test and screenshot. If a taught-names list is ever built it takes another name and sits as a separate row under Me, Writing. PATH-12's EMP and ERR rows are read as describing that future page and are not a spec for 1.0. Default: as above. Builders: no change to the built page; do not add a names section to it.

## GAP-04: is a taught-names screen in 1.0 (FOUNDER, scope)

Evidence. FR-AIS-34 is P0 (a) for the rule (a taught name is spelled that way only when the recogniser is close, never one family name into another), and `packages/core/src/lang/dictionary.ts` and the engine in `pipeline.ts` exist. The rule is about what the engine does with a dictionary, not about a screen. No card in the locked set names a teach-a-name screen as a requirement; E80 says a new phone starts with it empty "apart from any seed from the child's name (card 19, F03-REQ-010, unverified)". A names screen adds a place where a child's name (L4) is typed and stored, a new empty, add, edit, remove, duplicate and AX5 set of states, and a new device-only store that schema 10 has no table for (E80).

Recommendation. Not in 1.0. The engine keeps its protections; the dictionary is seeded only from names the parent already typed (the child's name, From names), never from a new field. It is a version 1.1 candidate once real mishearings of family names show up in testing. This ships less, stores less and keeps the first release smaller, which is the E43 to E83 rule. Default: not in 1.0; design-systems draws nothing for it; PATH-12 and E80's design lines read "no screen". Founder can overrule by naming the screen and its page name (not "Your words"), and the answer then needs a privacy read and a card.

## GAP-08: which id survives for Photos access

Evidence. `IA-FINAL-20nov.md` OI-7 and `e2e/INDEX.md` section 7: four ids, A-S18 (the ask), E-S32 (the primer step and permission order), C-S27 (where moments are turned on, limited, or the index removed), A-S17 (the Moments sheet the ask leads to). Area files already say A-S18 and E-S32 draw the same sheet with one `PermissionPrimer` component.

Recommendation. A-S18 survives as the one id for the ask and all access states (denied, limited, primer). E-S32 becomes a pointer in INDEX ("first-run step that opens A-S18"), not a screen. C-S27 stays because it is a settings page with controls the ask never has; A-S17 stays because it is the destination, not the ask. Net: four ids become three screens and one alias. No product requirement moves (NS-51). Default: as stated; design-systems updates INDEX.

## F-07a: held screen, four actions or two

Evidence (F-07a). Code shows Finish setting up (primary), Try another way, Delete account and the export link. `C-S10.held` draws two: "Finish setup" and "Try another way"; the four-action list belongs to `.declined`. The code folds R4a and R4b (delete and export) into the held screen.

Recommendation. Keep four. A person signed in who has not agreed to the Terms is exactly the person who must be able to leave and take their data without agreeing first; putting delete and export behind "Not now" makes a way out depend on a second step. It is probably the less risky side for privacy, rights reachable at once [U], though it is also a consent-gate screen, so counsel should read it; it costs only layout. Design-systems updates C-S10.held to four rows: one primary, three quiet, stacked, scrollable at AX5 on an SE 3 (mobile checks). No new copy. Default: four.

## F-07b: a true heading for the held screen

Evidence. Code reuses the loading heading "Opening your book." (`auth.newPhone.loading`) on the held state. Nothing is opening, and VoiceOver announces it through `Arrives`. C-S10 names the body line (`auth.newPhone.needsConsentBody`, "Finish setting up to open your book here.") and no heading. Titles carry no full stop (E-area WORDS).

Recommendation. A heading that says only what is true: that one step is left. PROPOSED: "One thing first". Alternatives for `content`, also PROPOSED: "Before we open your book", "Nearly ready". Avoid "Welcome back" (not known without the network) and anything about letters arriving. Default: "One thing first" under key `auth.newPhone.needsConsentTitle` (PROPOSED key). Also align the key mismatch of F-07c (code `consentBody`, design `needsConsentBody`): content picks one; not a product call.

## F-13: Ready with a picture, twins or red circle

Evidence. A DESIGN A-S06 draws Speak and Type as 64 pt twins and no red circle. Card NS-01-R20b reads "thumbnail, Change, prompt, Speak, Type"; spec 01 section 3.2 and the code (#838) keep the red circle and add a quiet `md` "Type" under it. The product is voice first (the constitution speaks of a book families fill by talking); typing is the supported alternative.

Recommendation. Code wins. The red circle remains the one primary action on Ready, Type stays quiet under it, and A-S06 is redrawn to match. Two conditions: the Type target is at least 44 pt (R20a), and the reading order stays thumbnail, Change, prompt, Speak, Type (R20b). If testing with real parents shows people miss Type, twins are a later change that costs one screen, not a requirement now. Default: circle plus quiet Type.

## F-21: a text alternative for a picture in production (FOUNDER, what users are told)

Evidence. NS-01-R50 hides the photo words and place fields in every `production` profile until the native setting of ADR 0039 (`docs/adr/0037-writing-tools-for-letter-words.md`, PROPOSED; cited as ADR 0039 in `docs/adr/CROSSWALK-new-scope.md` line 14 and ruled in `docs/agents/cto/RULINGS.md` line 652, CR-67 AX-1) turns iOS writing tools off, because writing tools can rewrite a person's words and the constitution forbids it. Spec 01 section 8 calls the typed words "the only text alternative". VoiceOver therefore reads the fixed phrase (PROPOSED words: "Photo with this letter") and, on a lens card, the letter's own start (NS-01-R9a, R9b, R21a to R21c).

Recommendation. The hidden field is the right default; the constitution outranks the field. For 1.0 the spec says plainly: a picture has no description of its own in production; the letter's words beside it are its text, and VoiceOver reads the fixed phrase (PROPOSED: "Photo with this letter") then the letter's own words (the phrase PROPOSED, content to confirm). The app never generates a description (spec 01 section 8, which stays). Ship the fields only when the native setting exists and is tested on a device; that is the one way a parent gets a picture description, and it needs no new rule. Striking "only" from spec 01 section 8 would stop it promising a path that is not shipped, but that edit needs the founder's sign-off. FOUNDER decides because this is a statement about accessibility to users: do not put "accessible" or "described" wording on the store page or the website for pictures until this ships. Default: as above; no copy to parents.

## F-08d: the neutral lock-screen body (FOUNDER, copy)

Evidence. `days.lock.body.neutral` is "A day you chose to mark. A few words, if you like." (RULED 20 Nov, one fixed string). #1172 reuses it for the child's month note and the birthday, where the parent chose no day, so it is untrue there. E82 says the lock screen shows no age with names off and the birthday body is swapped. WORDS.md lists the title "Something for the book today" (`days.lock.title.neutral`, PROPOSED and ruled 20 Nov) and a hidden-preview line "Something for the book, whenever you have a minute." (`notifications.placeholder.*`, G1 and G-D19).

Recommendation. One neutral body for all three kinds, true whether or not the parent chose the day, and not hinting at which kind it is. Two candidates:
- A: "Something for the book" as the whole line: true, but it repeats the title ("Something for the book today") and adds nothing.
- B: "Whenever you have a minute." True for a ticked day, a month note and a birthday; no claim about a day, an age or a word count; no urgency.
Recommend B, PROPOSED: title "Something for the book today", body "Whenever you have a minute." This keeps the title proposed and ruled on 20 Nov and removes "A day you chose to mark" from every case, including the ticked day, so there is one string and no kind leaks to someone glancing at the lock screen (E82 reasoning). The 20 Nov ruling (one fixed string, "A day you chose to mark. ...") stands until the founder answers; B changes a string it ruled. Cost: a ticked day loses the cue that it is "a day you chose". Default: B for all three. The hidden-preview placeholder stays as the longer sentence in WORDS.md. Counsel to confirm that no child fact shows [U]; the founder approves wording, and `content` checks the glossary (no "note", "push").

## F-10: what a person sees when a Days tick cannot be saved

Evidence. #1175 (merged, `6483ac754`) and #1226 (open) build the days store, the write queue and typed ticks; the queue makes a tick asynchronous. `SPEC-SYNC-20nov.md` OI-S10 lists `C-S24.store-unavailable` as undrawn; `C-S24` WORDS has a PROPOSED line for the page not loading ("Days you chose could not be shown just now." with "Try again"), nothing for a tick that fails. What the store does on failure is [U].

Recommendation. The row must show the truth: a day that did not save must not stay ticked, because a ticked row is a promise that a day note will come. On failure the row returns to its earlier state, and one quiet line appears once under the list, polite announcement, no red, no count, no "lost" or "failed" language, with one action. PROPOSED: "That did not save." and "Try again" (the same Try again as the page line). A queued write that fails after the row showed ticked behaves the same way, without leaving the page. Retry resubmits the same tick; no data is shown as saved until the store says so. If the store is unavailable at open, use the existing PROPOSED line "Days you chose could not be shown just now." Default: as above; design-systems draws it before the Days UI lane starts; mobile confirms the failure signal.

## What builders may do now

Build to the defaults above. Nothing here changes a locked card, an erratum, `docs/DECISIONS.md` or any legal text. Where a default needs a founder answer (GAP-04, F-21, F-08d) the build is made behind a flag or string key, and nothing reaches users before he answers.

## Founder, in one place

1. GAP-04: taught-names screen in 1.0? Recommend no.
2. F-21: say plainly that 1.0 has no per-picture description in production? Recommend yes, and no accessibility claim for pictures until the native setting ships.
3. F-08d: one neutral body "Whenever you have a minute." for day, month note and birthday? Recommend yes.

Signed: `product`, 21 Nov 2026.
