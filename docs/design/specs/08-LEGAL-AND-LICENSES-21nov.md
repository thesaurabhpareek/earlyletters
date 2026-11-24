# Legal and Licenses: screen spec (GAP-01, GAP-02)

Status: DRAFT, PROPOSED, 21 Nov 2026. Author: `design-systems`. Docs only. Closes rows GAP-01 and GAP-02 of `docs/design/DESIGN-GAPS-21nov.md`. Founder ask, handoff #1181.

Both pages are BUILT. `IA-FINAL-20nov.md` section 7.4 gives them no screen id ("none"). This file gives them proposed ids and the states the design requires. It does not change a built word. Read from `apps/mobile/src/app/settings/legal.tsx` and `licenses.tsx` on `develop`; nothing was run on a device.

| Row | Screen id (PROPOSED, area E lead to re-key) | Route | Source requirement | Owner | Status |
|---|---|---|---|---|---|
| L1 | E-S33 Legal | `/settings/legal` | NS-42 (agreements and notices at collection); IA 7.4; the Terms name Settings as a path | design-systems (layout), legal (document text, never edited here) | PROPOSED |
| L2 | E-S35 Licenses | `/settings/licenses` | release requirement named in `licenses.tsx` (id UNVERIFIED); NS-33 | design-systems (layout), content (words, built) | PROPOSED |

Note on ids: `SCREEN-PATHS-20nov.md` PATH-08 already uses E-S34 for the new-device page, so Licenses takes E-S35 (PROPOSED; no other file under `docs/design` or `e2e/INDEX.md` uses it). The area E lead assigns final ids; until then this file calls them Legal and Licenses.

## 1. Legal (L1)

Reached from Me, Help and legal. A plain list in one `ListSection`: Terms of Service, Privacy Policy, Licenses. Terms and Privacy open the website's own pages in the iPhone in-app browser (a link, role "link"). Licenses pushes L2. The page holds no text of the documents.

**Shown:** row labels `copy.settingsHome.termsLabel`, `.privacyPolicyLabel`, `.licencesLabel` (built). **Records:** nothing. Reading a document is not an agreement; the act is recorded where the person agreed (PATH-01), never here. **Never:** a button that says "I agree" on this page; a version number or date the page cannot prove; any claim about what the documents say. **Decline and withdraw:** n/a, nothing is agreed here. Withdrawing is Me, Privacy and Me, Account.

| State | Exact screen | Copy key |
|---|---|---|
| Happy | Three rows, 44 pt or taller, chevron on each. Tap Terms: the in-app browser opens over the page; Done returns to the same row. | built |
| OFF | The in-app browser shows Apple's own page-could-not-load view; our page cannot see it. The row still opens. A quiet line on this page is not drawn: the person sees Apple's message and closes it. Licenses works offline (bundled). | none |
| DEN, REV | n/a: no system permission is involved | n/a |
| EMP | n/a: three fixed rows, never empty | n/a |
| ERR | The link cannot be opened by the system: ST-NOTICE above the list with "Try again"; the words are CONTENT-NEEDED. UNVERIFIED: the built page ignores a rejected `openBrowserAsync`. | CONTENT-NEEDED |
| SLO | Browser opening is Apple's; no spinner of ours. | none |
| EXP, DEC, FUL, INT | n/a: nothing here expires, is declined, fills up or runs in flight | n/a |
| AX5 (SE 3) | Row titles wrap to as many lines as needed, never truncate; each row grows; the chevron stays vertically centred. | none |
| Dark | Uses semantic tokens only; the chevron and divider meet 3:1 against the row (UI contrast). | none |
| Reduce Motion | The push to Licenses cross-fades (T-PUSH rule); no other motion. | none |
| VoiceOver | Order: heading "Legal" (navigation title), Terms of Service, link; Privacy Policy, link; Licenses, button. Terms and Privacy are announced as links because they leave the app. | built (`accessibilityRole="link"`) |

## 2. Licenses (L2)

Pushed from Legal. A long reading page: title, intro line, then groups by what the part does for the parent (Speech, Recording and audio, Look and feel, App framework, Storage and data, Signing in, Everything else), each with one line, then Language data attributions word for word, then the libraries line. One row per component: name and license. A row opens, one at a time, to version, copyright lines and the full license text. About 150 rows and 190 KB of text; the list is virtualised.

**Shown:** `licences.*` (built). The authors' own names, versions and license text are theirs and are never edited. **Records:** nothing. **Never:** a rewrite or shortening of a license text; motion or a lamp; a count of components shown as a score. **Decline and withdraw:** n/a.

| State | Exact screen | Copy key |
|---|---|---|
| Happy | Sections with sticky-free headings (headings scroll away; no pinned header, so AX5 keeps its room). Tap a row: it opens in place and the previous open row closes. | `licences.*` |
| OFF | Works offline: the list is generated from the lockfile and bundled. | none |
| DEN, REV | n/a | n/a |
| EMP | n/a: the list ships with the app | n/a |
| ERR | The generated list cannot be read: ST-INLINE "Try again", the page title and intro stay. Words CONTENT-NEEDED. UNVERIFIED: no catch is read in `licenses.tsx`. | CONTENT-NEEDED |
| SLO | First open parses the JSON (virtualised, loaded when the page opens, never at launch): the intro and the first group draw first; rows fill in without a spinner. If the parse takes longer than a moment, a still line in the list area says the list is on its way (CONTENT-NEEDED). | CONTENT-NEEDED |
| Long text | A license text longer than one screen scrolls with the page; the open row never becomes a nested scroller. | none |
| License not stated / no text | Built keys: `licences.licenceUnknown`, `licences.noText` (none today; the generator flags them). | built |
| AX5 (SE 3) | Names of long packages wrap; a version and a license name wrap under the name, never beside it; license text is `body`-or-smaller only if it stays readable at the largest size, otherwise it scales with the person's size. No horizontal scroll. | none |
| Dark | License text uses `text` on `surface` at 4.5:1 or more in both themes. | none |
| Reduce Motion | The row opens with no height animation (cross-fade at most). | none |
| VoiceOver | Each row is one element: "Name, License name, collapsed" and the expanded state is announced; opening a row moves focus to its first line; closing returns focus to the row. The headings are real headings so the rotor can jump groups. | CONTENT-NEEDED (the announced words) |
| Voice Control | Row names are the visible names, so "Tap React Native" works. | none |

## 3. For `mobile` and `content`

- `mobile`: confirm the ERR and SLO rows against the build; add the rotor headings and expanded-state announcement if the build lacks them (UNVERIFIED).
- `content`: the three CONTENT-NEEDED lines above. No sentence is drafted here.
- `legal`: nothing to change; the page links to documents it does not own.

Signed: `design-systems`, 21 Nov 2026.
