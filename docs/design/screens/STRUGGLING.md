# If you are struggling, by the phone's region: screen spec

Owner: `design-systems`. Status: written 9 Nov 2026 from the code at develop `6cd2223b` (the region page is CCO-11, F20-REQ-005, D-034; the lines are `packages/content/src/helplines.ts`). Not run on a device. What only a phone can show is marked **Device** and has a row in S1-150 or S1-153 (`docs/qa/DEVICE_TEST_PLAN.md`).

How to read this file:
- **Built** is what the code does. **Spec** is what the screen should do; every place the build differs is in section 11 with file and line.
- **PROPOSED** is a proposal waiting for the person named. **OPEN (owner)** is a design decision nobody has made yet. Words marked PROPOSED WORDING are the founder's to approve.
- File and line numbers are at `6cd2223b`; later merges (#712, #713, #714, #717) moved some, so resolve a citation with `git show 6cd2223b:<path>`. Paths start at `apps/mobile/src/` unless they start with `packages/` or `docs/`.

Sources: EXPERIENCE_PASS S40 (`docs/design/EXPERIENCE_PASS_2026-10.md`); D-034 and D-059 (a static row, no classifier; D-034 is recorded "Recommended, needs founder OK", and it covers the row, not the region read); CCO-11 (lines we could not read on their own official page are held); F20-REQ-005 and F20-REQ-007 (a tap opens Phone or Messages and never dials by itself; where it cannot open, the number is shown to copy); the design-systems audit of 9 Nov (rows 4, 15) and the Chief Design Officer's note of 9 Nov (defect 3). The audit and the note were written in the council round of 9 Nov and are not in the repository, so each verdict this file takes from them is stated where it is used. The code also cites `struggling-page.md`, which is not in the repo; this file replaces it as the design reference.

The words on this page are founder-owned (FT-36). Every number and line is `content`'s, with its source page and the day it was read. This spec fixes no number and adds no line.

Strings are keys, `copy.struggling.*` and `copy.helpLinks.*`, plus `HELPLINES` in `packages/content/src/helplines.ts`.

## 1. Purpose

A parent having a hard night finds the right number fast: the emergency number first, then the lines for their region, each with a Call and a Text button that open the phone's own apps. The page is calm and plain: no drawing, no lamp, no motion. Nothing on it is recorded or sent (its own line, `struggling.privacy`), and the code counts and logs nothing. The region is read on the phone, needs no permission and no network, and is never stored or sent (the header of `components/settings/struggling.logic.ts` says so).

## 2. Layout

Settings > If you are struggling (`app/settings/struggling.tsx`), one tap from Settings home, never behind a flag. A phone set to the United States:

```
  (native header)  If you are struggling
  The early months ask a lot of anyone. If you want
  to talk to someone, these lines are there.                  body
  +----------------------------------------------------+
  | Are you or your baby in danger right now?          |      Card tinted, headline, heading
  | [                 Call 911                       ]  |      Button primary, large
  +----------------------------------------------------+
  +----------------------------------------------------+
  | National Maternal Mental Health Hotline            |      Card flat, headline, heading
  | Call or text 1-833-852-6262. Free and confidential.|      subhead, muted
  | [   Call   ]  [   Text   ]                         |      Button secondary, small
  +----------------------------------------------------+
  (988 Lifeline, Postpartum Support International, etc.)
  [ Find a free helpline near you  >  ]                       only when the region has no lines
  [ Lines in other countries        >  ]
  Nothing on this page is recorded or sent.                   subhead, muted
```

"Lines in other countries" (`app/settings/struggling-elsewhere.tsx`): the intro line, then each region we hold under its country (`title2` heading), "Emergency: 999" in `subhead` muted, its line cards, then the directory row and the privacy line.

## 3. Parts, library components and tokens

| Part | Component | Notes |
|---|---|---|
| Page | `ScrollView` `gap-6 px-5 pb-12 pt-4` (elsewhere: `gap-7`) | `contentInsetAdjustmentBehavior="automatic"`. |
| Emergency card | `Card` `tinted` (`accentSoft`), padding 4; `Text` `headline` heading; `Button` primary `lg` | The one warm card on the page. When the region is not held, the card holds `Text` `body` instead of the button. |
| Line card | `HelplineCard` (`components/settings/helpline-card.tsx`) over `Card` `flat` (`surface`) | Name `headline` heading; `how` line `subhead` muted; `ButtonRow` gap 2 with one `Button` per action. |
| Buttons | `Button` `sm` | Built `secondary`; Spec `outline` (section 6). Label is the visible word; the accessible name adds the line ("Call {name}"). |
| Directory, other countries | `ListSection` and `ListRow` with a chevron | The directory row has `accessibilityRole="link"` and a hint (`helpLinks.webHint`). It opens `findahelpline.com` in the in-app browser. |
| Fallback | `Sheet` (`help-fallback.tsx`) | The number as selectable text, one Copy button, "Number copied" in place. |

Tokens: `accentSoft`, `surface`, `accent`, `onAccent`, `controlBorder`, `text`, `textMuted`, `target.min`. No colour or size is a literal on this page.

A tap on Call or Text goes through `useHelpLink().open`: it tries the `tel:` or `sms:` link and, where the device reports it cannot open it (an iPad, a phone with no SIM, no Messages), shows the fallback sheet in the same tap, so a tap never does nothing.

## 4. States

Region is the phone's setting (iOS Language and Region, then the `Intl` locale), read once when the page opens (`phone-region.ts`). A number-only region such as `es-419` is skipped (an area, not a country), and the next candidate is tried.

| State | What shows |
|---|---|
| Region held with lines (US, CA, GB, AU, NZ) | Body, the emergency card with "Call {n}", that region's line cards, "Lines in other countries", the privacy line. No directory row. |
| Region held, lines held back (IN) | The emergency card with "Call 112", then the directory row and "Lines in other countries". Tele-MANAS is held until a current official source is read. |
| Region not held, or none (for example Germany or Ireland) | The emergency card holds "Call your local emergency number." with no button, then the directory row. Nothing is guessed. |
| Device cannot call or text | The fallback sheet: `helpLinks.noCallTitle` or `noTextTitle`, the body, the number in `headline`, Copy number, then "Number copied" in a polite live region. |
| Device capability not yet known | Call's hint is the safe one ("Shows the number to call from a phone or copy."). It becomes "Starts a call." only after the device says it can call (`rowHint`). |
| Loading | None. The region is read at once and the lines are data in the app. |
| Empty | None. The emergency card is always there. |
| Error | None built. A directory link opened offline shows the in-app browser's own error. |
| Stale lines | The page shows no date. Every line carries `verifiedOn` and its sources, and `packages/content/test/helplines.test.ts` fails 90 days after the oldest reading (`helplinesDueOn()`, which is 6 Feb 2027 while every source was read on 8 Nov 2026). |

### The country in the emergency card (PROPOSED)

Built: the emergency card names no country. The number comes from the phone's region setting, which is where the phone is set, not where the person is standing. A traveller sees "Call 999" and cannot tell which country's number it is (CDesO defect 3). The page cannot know where the person stands: it asks for no location, by design (D-034).

PROPOSED (CDesO, 9 Nov): name the country in the emergency card, and add a pointer to the page of other countries.

| Option | What is added | New words |
|---|---|---|
| A. The country alone | A `subhead` muted line in the emergency card under its heading, the country's name ("United Kingdom"). | None beyond the name, which is data (`RegionHelplines.country`, `helplines.ts:51`). |
| B. The country and a pointer | A. plus the CDesO's line "Not in {country}? Lines in other countries", which opens the existing page. | PROPOSED WORDING, founder approves. It is 42 characters, so it is a row or a link, not a `Button` (the 22-character label rule). The "Lines in other countries" row already sits lower on the page; B moves a pointer to where the traveller looks. |

Open points for either option:
- For the six regions we hold the country name exists. For a region we do not hold there is no name in the data, and the card already says "your local emergency number". Whether the device can supply a name for the rest (`Intl.DisplayNames` on Hermes) is not verified. **OPEN (`mobile` to check)**.
- The country name is read on the phone with the region and is shown, never stored or sent.

**OPEN (CDesO, founder for the words):** A or B, or neither.

## 5. Dynamic Type, to AX5

- Nothing truncates; every line wraps; the page scrolls.
- `ButtonRow` stacks the two buttons from xxxLarge text, full width (`components/ui/button.tsx:238-250`, `useIsLargeText`). At AX5 Call and Text are two full-width buttons that grow with their labels.
- The emergency button is a minimum of 56 pt and grows. The `headline` and `body` text are uncapped; `title2` on the other-countries page stops at 2.0x.
- Every control is at least 44 pt (`sm` is 44 pt).
- The long `how` lines ("Call or text 1-833-852-6262. Free and confidential. Any time, in English or Spanish.") wrap inside the card.

## 6. Dark mode and contrast

Light / dark, from `tokens.ts` with the WCAG 2.x formula.

| Part | Pair | Ratio |
|---|---|---|
| Emergency card text | `text` on `accentSoft` | 12.07 / 11.20 |
| Emergency button label | `onAccent` on `accent` | 5.82 / 8.11 |
| Emergency button fill against its card | `accent` on `accentSoft` (3:1 needed) | 4.74 / 5.99 |
| Line card text | `text` on `surface` | 12.98 / 14.94 |
| `how` line | `textMuted` on `surface` | 5.11 / 7.65 |
| Call, Text label, built | `text` on `accentSoft` (`secondary-foreground`, `button.tsx:71-77`) | 12.07 / 11.20 |
| **Call, Text fill against the card, built** | `accentSoft` on `surface` | **1.08 / 1.33** |
| Call, Text edge, Spec | `controlBorder` on `surface` (3:1 needed) | 3.36 / 4.27 |
| Call, Text label, Spec | `text` on `surface` | 12.98 / 14.94 |

Built, the label passes AA but the button's shape disappears: a pale tint on a pale card. This is the page people open on the worst nights, and the buttons are the reason they came. **Spec (design-systems): Call and Text are `outline`** (PR #713, merged 9 Nov 2026, built exactly this): a 1 pt `controlBorder` edge (3.36 / 4.27 on the card), label `text`. Both have the same weight, because a person may want to text and neither should look like the page's main action; the one primary is the emergency button. Increase Contrast swaps `controlBorder` to `#2B2722` / `#F2ECE4`.

Light mode is checked by arithmetic only. **Device**: the S1-150 (a) screenshot in light and dark, and S1-153 row (d).

The same weakness is on every `secondary` button that sits on a card or the lit band: Restore the book (`screens/DELETE_THIS_BOOK.md` section 6) and Read together (`screens/BOOK_PAGE.md` section 7). **PROPOSED (design-systems), for `COMPONENTS.md` 2.1:** a `secondary` button is used only on `bg`, where its tint is a label surface; on any card or tinted host, use `outline`. A row in `packages/design-tokens/test/tokens.test.ts` for each button fill against its host surface would pin it (the next design-systems run, not this PR).

## 7. Reduce Motion, haptics

No motion on the page, so Reduce Motion changes nothing here. The fallback `Sheet` follows the Sheet rules: under Reduce Motion it and its scrim fade over `fadeMs`.

Haptics: none. A call or a text is navigation, and the page counts and records nothing.

## 8. VoiceOver

Order: back, the title "If you are struggling", the body line, the emergency heading, the emergency button ("Call 911", hint "Starts a call." once the device says it can call), then each line: its name (heading), its `how` line, "Call {name}", "Text {name}" (hints: "Starts a call." and "Opens Messages, or shows the number to copy."), then the directory row (a link), "Lines in other countries", the privacy line.

- The visible label is "Call" or "Text" and the accessible name starts with it, so Voice Control's "Tap Call" matches (WCAG 2.5.3).
- The fallback sheet takes focus on its title; Copy number is a button; "Number copied" is announced.
- **Heading levels.** Built: the emergency heading is level 2 and each line's name is level 3, which makes the lines children of a heading they do not sit under (`struggling.tsx:43`, `helpline-card.tsx:22`). Spec: both are level 2 on this page; on "Lines in other countries" the country is level 2 and its line names level 3, which is right. `HelplineCard` takes the level as a prop (default 3). The effect has a limit: the `aria-level` that `Text` sets is for the web (`components/ui/text.tsx:101`), and a search of `node_modules/react-native` 0.86.3 for `aria-level`, `accessibilityLevel` and `ariaLevel` finds nothing. On iOS the rotor therefore lists every heading flat, with no levels. The fix is right for the web preview and costs nothing, but it does not change what a VoiceOver user on an iPhone hears. **Device**: the rotor's Headings (S1-153 row (d)).

## 9. Copy keys

`struggling`: `title`, `body`, `emergencyTitle`, `emergencyCall`, `emergencyLocal`, `call`, `text`, `callA11y`, `textA11y`, `directory`, `directoryBody`, `otherCountries`, `otherCountriesBody`, `emergencyIn`, `privacy`.

`helpLinks`: `callHint`, `callHintNoPhone`, `textHint`, `webHint`, `noCallTitle`, `noPhoneBody`, `noTextTitle`, `noTextBody`, `copyNumber`, `numberCopied`.

Data: `HELPLINES` (region, country, emergency, lines with `how`, `tel`, `sms`, `sources`, `verifiedOn`), `HELPLINE_DIRECTORY`.

## 10. Device steps

S1-150 rows (a) to (f): order, regions, Germany, other countries, the iPad, VoiceOver and AX5. S1-153 row (d): Call and Text visible in light and dark, and the rotor's Headings. Do not complete a call or a text to any helpline: back out before it dials or sends.

## 11. Where the build departs from this spec

Line numbers at `6cd2223b`.

1. **Call and Text are `secondary` on a flat card** (`components/settings/helpline-card.tsx:34`, card variant at `:20`, `components/ui/card.tsx:26`). Fill 1.08 / 1.33 against the card. Spec: `outline`. Owner design-systems for the rule, `mobile` or design-systems for the two props. Pin: a contrast row, and a source test that the card passes no `secondary`. Done in PR #713 (merged; `variant="outline"`, `test/helpline-buttons-visible.test.ts`).
2. **No country in the emergency card** (`struggling.tsx:42-58`). PROPOSED, section 4.
3. **Heading levels** (`struggling.tsx:43`, `helpline-card.tsx:22`): section 8. Low, and web only in effect.
4. **S1-150 (f)** says "At AX5 the Call and Text buttons stack" and nothing about the rotor. Row (d) of S1-153 adds it.

## 12. OPEN decisions

| # | Question | Owner |
|---|---|---|
| 1 | Country in the emergency card: A (name only), B (name and pointer), or neither | CDesO; founder approves any words |
| 2 | A country name for regions we do not hold | `mobile` to check what the device can supply |
| 3 | One rule for `secondary` on a card or lit host | design-systems |
