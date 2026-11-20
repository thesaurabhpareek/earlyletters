Re-open every file:line before relying on it: several cites in the designs went stale on 20 Nov (checked here at develop `16e61549` and head `6e613591`, 20 Nov 19:44 UTC).
Blocked until: nothing for the helper (the plan marks BL-957 ready, no dependency; `data-architect` pairs). But #836 already carries a copy of the rule for photo words (`lib/photos/text.ts`, 16 code points per character); land after #836 or the helper and `text.ts` will collide. The Firsts label (NS-06) and From name (NS-16) fields are not built on develop: build the helper and the photo fields; list the other two as open rows.

```
BRIEF BL-957 (one length rule for typed words)    Filled by: mobile RD-H1 for Karma, 20 Nov 2026 19:44 UTC
Agent: mobile (with data-architect)   Lane: Pack 1 (Photo and media)   Build: 14 on   Wave: 2

1. GOAL: When a parent types photo words (140 characters), a place (60), a Firsts label (40) or a From name (30), the field counts what a person sees (graphemes),
   refuses before save, and the database ceiling (code points) never trips first, in Devanagari, Arabic and CJK as in English.

2. CARD ROWS and TEST TITLES
   Rows: NS-01-R21a, R54; NS-06-A (label ceiling); NS-16-R1, R6. Cards 01, 06, 16 at 450bcb4a.
   Titles (catalogue B, PR #926, exact):
     [NS-01-R21a] photo words and place are optional and capped
     [NS-01-R54] caps count graphemes and the database agrees
   A property test over Devanagari, Arabic and CJK fixtures at each limit, with and without `Intl.Segmenter` (Hermes has none, ADR 0014). Red on develop: no `packages/core` helper;
   three counters disagree (database code points, field `maxLength` UTF-16 units, `text.ts` graphemes: backlog problem line). Mutants (catalogue B): ceiling 140 code points;
   count code points. Edge to pin (review A note on #836, mutants T5 and T6): a 16-code-point cluster x 140 equals 2,240 exactly.

3. FILES  Touch: packages/core/src/graphemes.ts (LD-17 OWN) and its test, apps/mobile/src/lib/photos/text.ts (use the helper), the photo fields' `maxLength` (components/photos/*),
   tests photos-device (cap tests at `:228-268` on #836's head). Never: packages/content, supabase/** (the CHECK ceilings 2240 and 960 are migration 11 in #835; if they must change, send to data-architect),
   lib/find/**. Shared file rule: `text.ts` is #836's file.

4. READING PACK: Pack 1 items 2, 4; `docs/engineering/readiness-20nov/libraries/LIBRARY-DECISIONS-B-data-time-test.md` LD-17 (PR #920); #836 review notes 2 (cap edge; Hermes fallback splits flags and Thai).

5. CODE ENTRY POINTS (#836 head 6e613591; develop 16e61549)
   apps/mobile/src/lib/photos/text.ts:3 comment on Hermes; :11 CODE_POINTS_PER_CHARACTER = 16; :15 the Intl.Segmenter lookup   (on #836, not on develop)
   apps/mobile/src/lib/db/migrations.ts:462-463 (#835 head)   photo_text <= 2240, place <= 960
   packages/core/src/ : `ls packages/core/src | grep -i graph` finds none on develop [V]

6. DATA AND SECURITY
   Data classes: L3 words and place, local only. New storage, send, log: none. The helper must not log its input. Boundary: none. Owner of the read: none beyond lens B.
   Constitution: the helper only COUNTS and CUTS at a cluster boundary on the parent's own typing; it never edits or rewrites words (no `verifyEdits` path; say so in the PR).

7. LIBRARIES: OWN `packages/core/src/graphemes.ts`; AVOID `@formatjs/intl-segmenter` (LD-17, PR #920). Where the engine has `Intl.Segmenter`, use it.

8. BUDGETS (PR #928): none. Counting runs on each keystroke: keep it linear; a Node tripwire at 1,000 characters under 1 ms [E, Rec, no card gives a number].

9. ACCEPTANCE  Experience: A-S06 Write with a photo (PR #921); EX-02 field scrolls at AX5. Test cases above. Done also means: red on old code and on both mutants.

10. PR BREAKDOWN: one PR, about 250 lines, base develop (after #836) or base #836's branch; branch `feat/mobile-bl-957-one-length-rule`. Flag-off proof: no flag; the helper is pure and the photo fields are behind `EXPO_PUBLIC_PHOTOS`.

11. LENSES: A principal-architect, B data-steward (plan 2.4).

12. ORDER: after #836; before BL-956. Blocked by: #836 merge (soft).

13. DEFINITION OF DONE
    [ ] tests red on old code and mutants; `npm test -w packages/core` and `npm test -w apps/mobile`: only the 8 baseline files red; `npx tsc --noEmit` apps/mobile: only 5 known errors
    [ ] ASCII only (fixtures use `\u` escapes); no input in a log; labels agent:mobile, from:agent; journal PATCHed; check-in line committed

14. ONLY A PHONE CAN PROVE: typing a Devanagari conjunct and a skin-toned family emoji into the real field on Hermes (the fallback path), VoiceOver reading the cut.

15. STOP AND ASK: the fallback must split a cluster (known gap, review A of #836); a ceiling in a migration must change; the Firsts or From fields appear and disagree on the limit.

16. HARNESS: claim row held by Karma. Journal issue #8, marker `<!-- journal run:sess-20261120-mobile-bl957 agent:mobile -->`.
    Check-in `docs/agents/checkins/mobile-bl957.md`. Branch feat/mobile-bl-957-one-length-rule. Comments start `<!-- agent:mobile -->`.
```
