# Product critique: Early Letters v1.0 journey (116 steps)

Method: read INDEX and every step JSON, looked at about 25 of the 116 PNGs directly (first run, Tonight, listening, Review, letter page, Book, Plan, Family, Read together), judged the rest from step text and notes. Checked against CLAUDE.md, VOICE.md, docs/DECISIONS.md on origin/develop and origin/main (D-051 is on main only) and apps/web site.ts. I did not fetch earlyletters.com. Totals: 7 blocker, 30 major, 42 minor; 70 steps ok, 41 fix, 6 gap. Detail in product.json.

## Top 10 issues
1. **D-051 is not in the app (blocker).** Free is now the first 2 letters per account, then Plus. The app has no letter counter, no third-letter paywall, no held-in-progress-letter state, and Plan, Settings and the book gate still say 'free, always' and 'writing stays open' (J12-01, J03-08, J03-06). I found no free-letters code in the mobile or core source.
2. **The app writes words for the parent (blocker).** 'Not much today' stores 'Sunday. Not much today. Just Asha, and us, and an ordinary day.' signed From Mama, and it shows in the Book (J08-02, J08-03). That breaks the constitution. The step note claiming it never appears in the book is wrong.
3. **Blank crash screen (blocker, J20-01).** No message, no way back, in an app holding irreplaceable voice recordings. The unknown-route page is also a developer screen (J19-01).
4. **No real purchase screens (major).** Price, trial, renewal terms and any 'Redeem a code' row (D-052) are not captured; Apple 3.1.2 needs them beside the buy button.
5. **Speech model download is invisible (major).** English shows '575 MB, not on this phone'. No consent, Wi-Fi, progress or failure states. The first night may end in 'waiting for its words' with no action (J09-04, J10-09 are dead ends).
6. **Delete is immediate, with no confirm, next to Make private (major, J10-01, J10-06).** The unsaved take has a confirm; the saved letter and its voice do not.
7. **Dead doors in v1.0 (major).** 'I was invited', the Family tab, the 'Family can read' switch and 'We'll let you know here' promise features that do not exist and cannot notify (D-055).
8. **D-074 not applied (major).** 'Lightly tidied', 'Tidying' and 'tidy' still appear on about fifteen screens.
9. **Birthday silently defaults to today (major, J01-05).** A 7-month-old becomes '0 days' and every chapter and prompt is wrong.
10. **Durability and website parity (major).** On-device only, with Export as the only safety net and no new-phone story. D-073 says backup ships in v1.0; the website says Plus 'backs up every recording'. Neither matches the app.

## Decisions needed from the founder
- **D-051 open edges**: do family letters count; what a second child's book gets free; does a 'Not much today' marker or a silent recording count as a letter; is Read together still gated (3 free sessions) now that letters are gated.
- **Quiet day**: approve removing generated text (marker only).
- **Backup (D-073) vs on-device only**: in or out of v1.0, then align the website and store copy.
- **Family surfaces in v1.0**: hide the Family tab, 'I was invited' and the 'Family can read' switch, or keep a defined invited-person page.
- **Gate order**: age gate before welcome (current, D-006) or after (D-043).
- **Delete**: approve a confirm sheet and a 30 day Recently deleted list.
- **Offer codes (D-052)**: approve the mechanism so a Redeem row can be designed.
