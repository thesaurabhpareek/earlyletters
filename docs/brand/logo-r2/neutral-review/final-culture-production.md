# Final round: culture, accessibility and production (X vs Y)

Blind review from the packet only. X = soft, rounded quote marks with blunt curled tails. Y = sharper, typographic quote marks with angled cut tails, slightly smaller in the tile.

## Contrast (computed; tile colours sampled from the 1024 masters)
| Pair | Ratio |
|---|---|
| Paper #FBF8F3 on tile top (~#93603F sampled; #9A613C spec) | 4.95 (4.78 at #9A613C) |
| Paper on tile bottom (~#7C4F33 sampled; #7F4F30 spec) | 6.56 (6.47) |
| Paper on tile at glyph centre (interpolated) | about 5.5 |
| Light sepia #D9A47E on dark tile (~#211D1A) | about 7.6 |
| Tinted-light system glyph (~#946A3B on ~#F6E2CA) | about 3.8 (passes 3:1 for graphics, weakest mode) |

The gradient raises contrast at the bottom, where the bowls sit, and lowers it only at the top, where there is just tail. That is the right way round. Both icons are identical on contrast.

## Cultural readings (both)
- **Quotation reading across launch languages.**
  - Brazilian Portuguese and Simplified Chinese use curly or straight double quotes as primary (verified: Non-English usage of quotation marks table).
  - French and Spanish use guillemets « » as primary, with "..." as secondary (verified, same source). Neither reads a 66 as odd: it is the familiar secondary or "English" quote and the default in digital text.
  - Arabic: the preferred quotes are guillemets «», drawn with rounded glyphs in Arabic typography; Unicode unifies Arabic quotes with Latin ones (verified: Unicode mailing list, 2013). In right-to-left Arabic text, English-style marks often appear mirrored, so a 66 sitting at the left is not what an Arabic reader would see opening a quote. The 66 therefore reads as "a Latin quotation mark" rather than "Arabic quote". That is neutral, not negative. That Arabic readers see it this way is my inference, not verified by survey.
  - The 6-shape also echoes the Arabic comma ، (U+060C, a turned comma), so it reads as punctuation, not as an image. Harmless.
- **Mandarin.** The 66 reads as 六六大顺, a lucky phrase (verified in round 1).
- **US.** "Route 66" is a harmless echo.
- **Hindi.** The Devanagari digit for 6 (६) has a different shape, so there is no collision.
- **Sperm or tadpole read (round-1 flag).** Largely fixed in both: the tails are now short and stubby, not long whips.
  - In X, the round bowl with a fat curled hook can still read as a curled embryo, cashew or bean. That is low risk and arguably on-theme, but it is less "elite".
  - In Y, the hooks are crisp typographic terminals. It reads only as punctuation, with no bodily read.
- **RTL motion.** The marks don't imply motion. The big-then-small order reads as parent then child in left-to-right reading and as child then parent in right-to-left reading. Both are fine.
- **Religious or political symbols, death or bad-luck readings.** None found for either.

## Legibility
- **16 px.**
  - X holds as a clear "66", and the notches between the hooks and the bowls survive.
  - Y's small mark loses its notch and becomes a sliver. The pair still reads as a quote mark, but more weakly. Y also occupies roughly 10% less of the tile.
- **29 px.** Both are clear. X is slightly bolder.
- **Appearances.** Default, dark, tinted-dark, tinted-light, clear-dark and clear-light are all robust for both, because they are solid silhouettes. The tinted home-screen crop for Y is clean and distinct from the Books and Moon icons.
- **Notification.** Y reads instantly at notification size. X is the same or slightly stronger.

## Production
- **Single-colour emboss or deboss on cloth.**
  - X is excellent: blunt terminals and wide notches.
  - Y is good: its angled tail tips and the small mark's narrow notch need a minimum feature size of about 0.5 mm at a 25 mm mark size, or the notch will bridge.
- **Monochrome glyph (Android small icon later).** Both are excellent silhouettes.

## Scores (1-10)
| | Simple | Communicative | Cultural safety | Small-size | Mode robustness | Production |
|---|---|---|---|---|---|---|
| X | 9 | 8 | 8 | 9 | 9 | 9 |
| Y | 9 | 9 | 9 | 8 | 9 | 8 |

## Pick: Y
- **Why Y:** it is the cleaner cultural read (pure typography, no bodily or embryo echo) and the more grown-up, heirloom feel the brief asks for.
- **Where X wins:** small-size and emboss performance, by a small and fixable margin.

## Must-fix before ship (Y)
1. Scale the mark up about 8-10% in the tile to match X's optical mass. This is the biggest 16 px gain.
2. Open the notch on the small mark (or thicken its hook) so it survives at 16 px and on emboss. Keep at least 0.5 mm minimum features at 25 mm.
3. Ship a hand-tuned small asset (16, 29 and 40 px) in the asset catalogue. The system-scaled master loses the small-mark notch.
4. Check the system-generated tinted-light glyph on a device. It is the only mode near 3.8:1.

## Verdict
Yes for Y, conditional on fixes 1 to 3. X is also a safe yes if the team prefers the softer feel.

## Sources
- [Non-English usage of quotation marks (table)](https://en-academic.com/dic.nsf/enwiki/11827799)
- [Unicode mailing list: Arabic quoting characters (2013)](https://unicode.org/mail-arch/unicode-ml/y2013-m06/0036.html)
- [Wikipedia: « (guillemet)](https://wikipedia.com/wiki/%C2%AB)
- [LTL School: lucky numbers in China](https://ltl-school.com/lucky-numbers-chinese/)
