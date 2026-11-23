# PROPOSED: the v1.0 localisation position (BL-411)

PROPOSED, 23 Nov 2026. Not approved. This is a promise about what people get, so the founder or the exec team approves it before any public word changes. Author: `content`. This file changes no string in `packages/content`, no store copy, no Settings copy and no code. It does not edit `docs/BACKLOG.md`, `docs/DECISIONS.md` or `docs/legal/**`.

## 1. The problem in one paragraph

BL-411 (satisfies D-056) asks that Store copy and Settings say "English app, seven spoken languages". Two later decisions overtake that line. D-111 item 4: the alpha transcribes English only, and another language needs a native reviewer first. D-121 item 1 and D-125 item 2: the first store binary is English only (`EXPO_PUBLIC_ENGLISH_ONLY=on`), and each other language appears in the picker only after its own gate passes. The listing "must stop promising seven languages" (D-121, risks). The code agrees: `packages/content/src/store.en.ts` says English only, and the website answer says "English first. More languages follow one at a time". So the BL-411 scope line is stale. This proposal replaces it with a position that is true of the build.

## 2. The position, in plain words

1. The app's own words are English at v1.0, on every phone, whatever the phone's language (K-24). Nothing in the app is translated at v1.0.
2. The first store build lets a parent speak and type English. That is all it promises.
3. Seven languages are the plan (D-056): English, Hindi, Spanish, Mandarin Chinese, French, Arabic, Portuguese. Each one switches on in a later 1.0.x release, only after a native reviewer signs it and a recorded test passes on the minimum device (D-125 item 2). The order is Spanish, French, Portuguese and Mandarin as their reviewers sign, then Hindi (after counsel packet Q9 clears), then Arabic last, with the recording kept and the author typing.
4. A letter written in any script is kept as written. A parent can type Arabic, Hindi or Chinese into a letter today, and the book, the export and the reader page show it unchanged (checked by `apps/mobile/test/localisation-fixtures.test.ts`). That is a statement about keeping words, not about transcribing them.
5. Words are never translated, by anyone (website answer, `site.en.ts`).

## 3. The wording this would allow, if approved

These are proposals for the founder. None is live.

| Place | Today | Proposed when approved |
|---|---|---|
| Store listing | English only, said by omission (`store.en.ts` header) | No change at v1.0. Add one language line only when the first extra language ships. |
| Settings, spoken language | Shows English | Shows English. A language row appears only when its gate has passed. No "coming soon" row (no counting what is missing). |
| Website question "Which languages can I use?" | "English first. More languages follow one at a time, each after a native speaker has checked it." | Keep as it is. It is already the position above. |
| BL-411 scope line "English app, seven spoken languages" | In the backlog | Retire it. Owner of `docs/BACKLOG.md` to amend. |

## 4. What each part of BL-411 becomes

| BL-411 part | Under this position |
|---|---|
| Store copy and Settings state "seven spoken languages" | Not at v1.0. Replaced by section 3. |
| Export-golden fixtures ar, hi, zh and a layout check at AX5 | Fixtures and HTML and CSS layout checks: done in this slice. Pixel check at AX5: needs a device, not done. |
| Signature chip suggestions per spoken language | Waits for the first extra language. No second set of suggestions ships while only English is on. Content will write each set with its reviewer. |
| Date pill shows a short date and wraps | Dates stay English (en-GB on a non-English phone, `apps/mobile/src/lib/dates.ts`), so the export's date already wraps. The pill in the app is a mobile-engineer change. |
| Language list aligns rows to start under RTL | Mobile engineer. Not in this slice. |
| Long date does not truncate in es, fr, pt | Holds for the book and export (tested). The in-app pill is still to check on a device. |

## 5. Findings from this slice

- `bookHtml` and the reader page write `lang="en"` for the whole file. A Chinese letter should carry `lang="zh"` so the right font is picked. Small change in `apps/mobile/src/lib/export/build.logic.ts`, and it moves goldens, so it is left as an `it.todo`.
- The reader page `.tag` rule uses `margin-left`. Under right-to-left it should be `margin-inline-start`. Also left as an `it.todo`.
- The printable book already uses `dir="auto"` on every paragraph and signature and `text-align:end`, no physical left or right, and nothing that stops a long word wrapping. Those are now held by tests.

## 6. What is not done yet

- Founder or exec approval of sections 2 and 3.
- The AX5 pixel check on a device for ar, hi and zh (journeys J01-05, J01-10, J01-12).
- The two findings in section 5.
- The date pill and the language list under RTL in the app (mobile engineer).
- Per-language signature chip sets, after each language's gate passes.
- Amending BL-411 and BL-156 in `docs/BACKLOG.md` (not edited here).
