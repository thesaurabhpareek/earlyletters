# Function review of the requirements, second wave: print and fulfilment (PRT)

Author: the Chief Business Officer role (a Claude role, not a lawyer, accountant, tax adviser or print-industry professional; nothing here is legal, tax or financial advice). Written 20 Nov 2026 under `docs/product/prd/functions/BRIEF.md` and `/home/claude/review/gap-agents-common.md`. Docs only: nothing here contacts a partner, opens an account, spends money, accepts terms or changes a user-facing word. Every money, partner and seller decision is the founder's; each carries a recommended default. Every legal or tax reading says "counsel must confirm" (or "accountant must confirm"). Words a parent would read are quoted as intent only: `content` writes them, the founder approves them, and none implies that anything but the parent writes the words. Example family: the fictional Asha.

One line up front, because the founder prefers the honest answer. Printing is the part of this product most likely to disappoint a family if it is done half-way, and least likely to pay for itself soon. At the repo's own volume assumptions it earns a few hundred to a few thousand dollars a year before founder hours (section 3.4). I recommend: ship the free printable file in 1.0 as the card says, sell nothing, and take the printed book to a go/no-go on evidence. The requirements below are written so that if the answer is yes, the book is built with the family's trust intact. They are not a schedule.

---

## 1. What I reviewed, and what I did not

### Read this session

Repo (`/home/claude/earlyletters`, branch `docs/locked-pack-inputs-20nov`, head `f79661826`):

| Source | What I used |
|---|---|
| `docs/product/prd/functions/BRIEF.md`, `/home/claude/review/gap-agents-common.md` | Format, FR ids, linking |
| `docs/product/prd/07-remaining-capability-rows.md` lines 227 to 322 (C28 sections 4.1 to 4.7), 392 to 406 (4.15 to 4.19) | The printable file: scope, rows NS-07-C28-1 to 19, claims, "Free" |
| `docs/product/prd/10-reading-and-family.md` lines 943 to 956 (NS-30) | The printed book is a decision record; three conditions; "Forbids order, printed, hardcover and any partner name" |
| `docs/product/prd/00-product-frame.md` lines 28, 153, 169 | Ranks 27 (file) and 43 (printed book, "G Parked") |
| `docs/product/prd/functions/{finance,legal,privacy,support,compliance,marketing,risk-security,operations}.md` (print rows by search, then the rows read) | FR-FIN-24; FR-LEG-12, -13, L-10; FR-PRV-16, -34; Q-SUP-9, FR-SUP-xx print lines; FR-SEC-03, -06, -08, -19; marketing "Forbids" list |
| `docs/product/prd/GAP-LOG.md` lines 152 to 172, 309 | C G3, G8, W2, W7 (printable section placement, "printable" names only C28's file); C E5 (print flag and kill switch not in the registry, BL-973, ADR 0029) |
| `docs/backlog/future/03-book-keepsakes.md` lines 465 to 531 (BK-13, BK-14) and 566 to 594 (BK-16) | The previous product thinking: file spec, price, margin sketch, regions, support, timing, metrics |
| `docs/adr/0007-payments-and-print.md` | Printed books by card payment, not IAP; the founder owns payment, refunds, support |
| `docs/legal/compliance-register.md` lines 113 (CR-054), 143 (CR-087), 181 (CR-120) | Print sale duties, Apple 3.1.3(e) line, tax line |
| `docs/legal/data-policy.md` lines 105, 170, 207; `privacy-policy.md` lines 45 and 153 (by search); `docs/emails/COMPLIANCE.md` line 17 (by search) | Print order records "Planned", 7 years "proposed"; the policy says today "We do not collect ... photos ... payment details"; sign-up country block; no child name in email subjects or bodies (recommended rule) |
| `packages/content/BRAND.md` lines 17, 36, 90; `packages/design-tokens/src/tokens.ts` lines 144 to 156 | "Early Letters: Year One" names the printed book, "Not promised in v1.0"; Mukta, Literata, Tiro Devanagari Hindi, each commented SIL OFL 1.1 |
| `docs/DECISIONS.md` lines 23, 87, 117 (D-004, D-010), `docs/product/prd/README.md` line 7, 41 to 42 | Individual publisher; digital only in v1; X2 (voice leaving the phone needs a security and counsel read), X3 (free versus Plus) |
| `.claude/skills/early-letters-cbo/SKILL.md` (sections 1 to 9) | The role's rules, partner shortlist rule (public pages only; no contact, no account) |
| `docs/product/prd/functions/finance.md` sections 1 and 3.2 (lines 105 to 160) | Plus net per payer $3.75 blended; the $92.25 a month floor |
| `docs/agents/COORDINATION.md` section 10 | Shown, Records, Never, Decline lines |
| Design, `origin/docs/e2e-ux-20nov` head `ed44fe899`: `C-keeping-and-trust/DESIGN.md` lines 16, 31 to 34, 98, 105 to 113; the screen tables of `B-`, `D-` and `E-` DESIGN.md | C-S04, C-S05, C-S06, C-S07; B-S01, B-S02, B-S19, B-S20; E-S04 to E-S07, E-S10 to E-S14, E-S17, E-S18 |

Outside pages read 20 Nov 2026 (this session):

| Id | Page | What it says that this file uses |
|---|---|---|
| S1 | Apple, App Review Guidelines, https://developer.apple.com/app-store/review/guidelines/ | 3.1.3(e): "If your app enables people to purchase physical goods or services that will be consumed outside of the app, you must use purchase methods other than in-app purchase to collect those payments, such as Apple Pay or traditional credit card entry." 3.1.1: "Physical gift cards that are sold within an app and then mailed to customers may use payment methods other than in-app purchase." 5.1.1(i): the privacy policy must say what data the app collects, how, and all uses, and explain retention and deletion. 5.1.1(v): account creation requires in-app account deletion. The page read was cut before 5.1.4; later sections not read |
| S2 | FTC, Mail, Internet, or Telephone Order Merchandise Rule guide, https://www.ftc.gov/business-guidance/resources/business-guide-ftcs-mail-internet-or-telephone-order-merchandise-rule | No stated shipping time: "you must have a reasonable basis for believing that you can ship within 30 days"; a delay needs a notice with a revised date and a free way to cancel; refund within seven working days after cancellation; store credit cannot replace a required refund. Its exemptions list does not name made-to-order goods and the page does not discuss them: whether the rule covers a personalised book is for counsel |
| S3 | Lulu, Print API, https://www.lulu.com/sell/sell-on-your-site/print-api | "print facilities located in Australia, Canada, France, India, the United Kingdom, and the United States"; "JSON/XML and webhook compatible, RESTful API"; "shipped directly to the recipient"; "tracking information available through the API". The page states no price, does not mention a sandbox, and states no reprint policy |
| S4 | Lulu, Photo books, https://www.lulu.com/create/photo-books | Square 8.5 x 8.5 in (216 x 216 mm), hardcover, Premium Color 80# interior, "Starting price 14.76 USD". Page counts, print and ship countries and any quality guarantee are not on the page |
| S5 | Gelato, Photo books, https://www.gelato.com/en-US/products/photo-books/ | "7 formats", hardcover and softcover, square 5.5 x 5.5 in and 8 x 8 in, "tens of thousands of API customers", "Gelato operates in 34 countries", "100 print partners". No price, no 8.5 in size. The repo says 33 countries (BK-14); a search snippet in this session said 32; the page says 34: treat the count as unsettled |
| S6 | Stripe pricing, https://stripe.com/pricing | "2.9% + 30c per successful transaction for domestic cards"; Stripe Tax 0.5% per transaction on no-code integrations "where you're registered to collect tax"; dispute received $15.00 |

Fetch that failed: California SB 478 (Attorney General page): not retrieved, so every SB 478 line below is UNVERIFIED (the repo names it in BK-14 and Terms counsel note; I did not read the statute).

### Not read, not run

- The Project docs in the attached list (`infra/...`, `claude/...`): no Project read tool here. In particular the exec record that holds the proof-book spend (finance.md also could not read it), and `proposals/app-review-demo-signin.md`.
- `19-from-download-to-first-letter.md`; cards 01 to 06, 08, 09, 11, 12 in full (read through the other function files and by search only). `LEGAL-REQ-058` (cited by BK-14 for "US-only"): I did not open it.
- Lulu's API documentation, wholesale print prices, file specification (trim, bleed, spine formula), terms and DPA; Gelato's API docs and terms; Stripe Checkout and Tax documents beyond the pricing page. No quote was requested, no account opened, no sandbox touched (CBO rule).
- Any real printed proof. No code was run. No law was read except the FTC guide above. UNVERIFIED in this file: SB 478, state sales-tax nexus and rates, Apple's privacy-label rule for payment data collected by a hosted page, GPSR and EU duty claims in BK-14 (repo secondary sources), CPSIA, USPS rules for P.O. boxes, partner defect policies, Remento's and other competitors' prices (repo figures, not re-read).

---

## 2. Coverage verdict per card (print lens)

| Card | Verdict | Why |
|---|---|---|
| NS-07 C28 printable file | partly | Strong on the rule that only the parent's words print (C28-2, -3, -4, -18) and on fonts (C28-13). Missing for a family who takes the file to a shop: any cover, any spine, any trim and bleed, any help text; page order is unsaid ("book order"); no thin-book rule; no emoji rule; C28-8 forbids a quality message even where a paying customer would want one (section 5) |
| NS-30 A book to hold | partly | Right gates (entity, partner and terms, hosted audio) and right claims ban, but it describes no order, no money path, no support, no data flow, no refund, no country rule. It is a decision record, as intended |
| NS-11 Save a copy | covered | The ZIP and the printable section share C-S04 (GAP-LOG C G3, W2). Nothing needed for print except that C-S04 stays free of any order word |
| NS-01 Pictures (T3 stored copy sizes) | covered | 4,032 px cap and 2,550 px floor keep 8.5 in at 300 dpi possible; pictures stay on the phone, so printing means a new upload (FR-PRT-13) |
| NS-06 Firsts and seals | covered | Seal words stay out until they open (C28-4); first labels print above letters, uncounted (C28-19) |
| NS-25 Write this book together | partly | C28-18 keeps the other parent's private letters out. It says nothing about printing the other parent's in-book letters into a physical object the first parent pays for (FR-PRT-26) |
| NS-24 Read together (year, oldest first) | covered | The only place the product already reads oldest first; printed order should match it (FR-PRT-05) |
| NS-22 / B-S01, B-S02 The Book | partly | Book is newest first; the entry points for a book to hold do not exist and must not exist in 1.0 |
| NS-28 hosted family link, NS-08 backup | covered | They are the reason a QR to the voice waits (NS-30). I keep QR out of this file (FR-PRT-39) |
| NS-12 Plus gate | covered | Print is outside Plus (closed X3, C28 4.19); no entitlement test is needed |
| NS-17 Languages | partly | Fonts for Devanagari are bundled; Arabic and CJK faces for print are UNVERIFIED (C28-13) |

Cards NS-02 to NS-05, NS-09 to NS-10, NS-13 to NS-23, NS-26 to NS-29, NS-31 to NS-45 not otherwise reviewed for print.

---

## 3. What is missing for a launch-ready, customer-first printed book

I read the family's side first, then the operator's side.

### 3.1 What a family needs that no card gives

1. **A promise they can check.** "Exactly the words in your Book" has to be provable on the page they approve, before they pay. Today there is no preview that is the same file the printer receives.
2. **A clear first-year book.** What is Year One (which months, whether Before You is in), in what order do pages run, who wrote the letters inside, and what happens when the year has only a few letters.
3. **No surprises on money.** One price with shipping and tax shown before pay; no credit that expires; no subscription; no upsell.
4. **A way out.** Cancel before it prints; a reprint or refund if it arrives wrong or never arrives; a person to write to.
5. **The other parent.** A second copy for the other parent's address, and honest handling of the other parent's letters inside the book.
6. **Privacy calmly said.** Ordering moves their words and pictures off the phone for the first time on purpose, and puts a home address with us. That has to be shown in plain words with a way to say no, and the free PDF has to keep working if they do.

### 3.2 What the business side lacks

A seller of record and entity answer (D-004); a partner chosen by written criteria; a tax answer; Print Terms; privacy policy and label changes; a refund and delivery-failure policy; a support lane with a tool that never shows letter content; a server-side order system (none exists); a kill switch (GAP-LOG C E5: print flag and switch not in the registry); a quality protocol with real proof books; and a metric source that is not device analytics.

### 3.3 Partner selection criteria (public pages only; nothing contacted)

Weights are mine [A]. "Read" means read this session (sources S3 to S5).

| # | Criterion | Why it matters | Lulu (S3, S4) | Gelato (S5) |
|---|---|---|---|---|
| 1 | Production inside the United States for a US pilot | Speed, no customs, no cross-border duty | Read: US print facility listed | Not read for the US (a US page exists in search results; not fetched). UNVERIFIED |
| 2 | Square hardcover at about 8.5 in with a custom cover and spine | The product BK-14 describes | Read: 8.5 x 8.5 in hardcover, from $14.76 (retail starting price) | Read: hardcover and softcover, 8 x 8 in square; 8.5 in not listed |
| 3 | API with order status and webhooks | One order, no manual work | Read: RESTful, webhook compatible, tracking through the API | Read: API exists; details not on the page. UNVERIFIED |
| 4 | Wholesale cost by page count and ship method through a cost endpoint | Margin and the price shown before pay | Not on the page (ADR 0007 says a cost-calculation endpoint exists: UNVERIFIED this session) | UNVERIFIED |
| 5 | A sandbox | Build without real orders | Not mentioned on the page. UNVERIFIED | UNVERIFIED |
| 6 | File check before print and clear rejection reasons | Fail before we charge | UNVERIFIED | UNVERIFIED |
| 7 | Defect and reprint terms, damage in transit, lost parcel terms | Who pays when it goes wrong | Not on the page | UNVERIFIED |
| 8 | Deletion of our print files after shipping; no reuse of content; staff access | The words are a family's private letters | UNVERIFIED (BK-14 lists it as a criterion) | UNVERIFIED |
| 9 | Processor terms and a DPA we can accept (Q11); is the partner a processor or an independent controller (data-policy line 170 lists "Processor / independent") | The privacy policy must say which | UNVERIFIED | UNVERIFIED |
| 10 | Handling of Devanagari, Arabic and CJK in files (embedded fonts accepted, no re-flow) | Our promise is every script | UNVERIFIED | UNVERIFIED |
| 11 | Delivery time and cost to US addresses, carrier tracking | The FTC delivery statement (S2) rests on it | UNVERIFIED | UNVERIFIED |
| 12 | Outage history and seasonal cutoffs | Holiday load (BK-14: first birthdays cluster in late 2027 [A]) | UNVERIFIED | UNVERIFIED |
| 13 | Regions later (Canada, UK, Australia) with in-region production | Do not ship cross-border from one country (BK-14, FamilyAlbum lesson, repo secondary source) | Read: Australia, Canada, France, India, UK, US | Read: "34 countries" (count unsettled) |

My shortlist, from the CBO skill and ADR 0007: Lulu first, Gelato as the regional fallback. I have not verified either one beyond the public pages. The shortlist is not a recommendation to sign; it is the list to ask counsel and the founder about, in that order.

### 3.4 Cost and margin (my arithmetic on figures read or estimated; check against `finance.md` before use)

Price used: $59 for the first copy with US shipping included, $39 for each extra copy in the same order (BK-14's proposal [R], not a decision). Plus is $4.99 a month or $49.99 a year (D-082, finance.md 3.2); print is a separate purchase.

| Line | First copy | Extra copy, same order | Source and label |
|---|---|---|---|
| Print, square hardcover base | $14.76 | $14.76 | S4, a retail starting price; wholesale API cost not read (UNVERIFIED) |
| Pages beyond the base | about $6 | about $6 | BK-14 [E] |
| Shipping | about $8 | about $3 extra | BK-14 [E]; the extra-copy figure is mine [A] |
| Card fee: 2.9% of price plus $0.30 (once per order) | $2.01 | $1.13 | S6 read; $59 x 0.029 + 0.30; $39 x 0.029 |
| Tax tool, 0.5%, where registered | $0.30 | $0.20 | S6 read; applies only where registered |
| Defect and reprint reserve, 5% of price | $2.95 | $1.95 | BK-14 [E] |
| QR reserve | $0 | $0 | Dropped: no QR in the pilot (FR-PRT-39) |
| Cost | about $34.02 | about $27.04 | Sum |
| Contribution before founder hours | about $24.98 (42%) | about $11.96 (31%) | $59 minus cost; $39 minus cost |
| Stress case (pages $10, shipping $12) | cost about $44.02, contribution about $14.98 (25%) | | Mine [A]: a higher quote than BK-14's guesses |

What it means [E, built on BK-14's own target of 10 to 15 orders per 100 families reaching a first birthday, an [A]]:
- 100 families reach a first birthday in a year: 10 to 15 orders; about $250 to $375 contribution at the base case.
- 1,000 families (D-004's own entity trigger): 100 to 150 orders; about $2,500 to $3,750.
- The fixed floor for the whole company on Plus is 25 paying families, about $92 a month (finance.md 3.2). So the print contribution at these volumes is real but small, and every hour of founder support time and every hundred dollars of counsel or accountant time for print comes out of it.
- A dispute costs $15 (S6) before the book's cost. One lost parcel in ten orders erases most of that batch's margin at the stress case.
- BK-14's own margin gate is 35% [A]. The base case clears it with about seven points to spare; the stress case does not. The real wholesale quote decides.

So: the case for print is trust and the family's keepsake, not revenue. Say so to the founder, and do not let the number drive a rushed launch.

---

## 4. Function requirements

Priority: P0 only where RR-4 reason (a) promise, (b) legal or store, or (c) core loop applies. Everything that builds an order is P2 "gated": it is written now so that it is right if NS-30 reopens, and it ships only after the reopen conditions in FR-PRT-34. Owner lane names are the repo's lanes where I know them.

Link conventions: card rows `NS-nn-Rn` or "new card row needed"; e2e ids from `docs/design/e2e/*/DESIGN.md` (`C-S04`) or "new screen needed" with a proposed id `PRT-Sn` (section 5); backlog rows are BL ids where one exists, BK ids from `docs/backlog/future/03-book-keepsakes.md`, or "new row needed" (none above BL-999 is used).

### 4.1 Promise, scope and what 1.0 contains

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-PRT-01 | Given any build in 1.0, When it is searched or run, Then no string, screen, store line, site line, email or help article says order, printed, hardcover, print-ready, photo book or any partner's name, and no screen can place an order; the order feature has its own flag (proposed `EXPO_PUBLIC_PRINT_ORDER`, off, absent from store builds) and its own server pause key, both in the flag registry | NS-30 "Claims"; NS-07-C28-1; C-S04; BL-973 (flag and kill switch registry) ; new row needed for the order flag | P0 (b) | `content`, `mobile`, `ops` | `rules.test.ts` K-32 (`PRINT` pattern, per C28 4.1 text); marketing.md line 269; GAP-LOG C E5 |
| FR-PRT-02 | Given the free printable file in 1.0 (NS-07 C28), When a parent reads the line above its button, Then it says what the file is in plain words (a file of this book made for printing at home or at a print shop of their choice) and does not say a shop will accept it, and no help or store line says "ready to print" | C-S04, C-S05; NS-07-C28-1 | P0 (a) | `content`, `marketing` | K-32; C28 4.18 "Enables: A free printable PDF of the book." |
| FR-PRT-03 | Given the free file in 1.0, When a parent wants a paper book from it, Then a help article (no partner name) says what the file holds, that the page is square and provisional until the proof books are read, and what to ask a print shop (trim size, that fonts are embedded, that there is no cover in this file), written from the build that ships | C-S05.ready; new help article | P1 | `support`, `content` | C28 4.3 "Not in scope ... a cover designer"; BK-13 problem lines on cover, bleed and spine; FR-SUP-04 (help centre) |
| FR-PRT-04 | Given the 1.0 pack, When the founder reads the go/no-go (FR-PRT-34), Then the signal is measured by the same tester question C28 already fixes ("Did you make the printable book file this month (yes or no)?") and by the founder's own proof-book read-out, not by any new analytics event | NS-07 C28 4.20; FR-DAT print rows | P1 | `product` | C28 4.20; Privacy rules (no new content analytics) |

### 4.2 The book itself: layout from the Book, scripts, pictures

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-PRT-05 | Given a book for print, When pages are laid out, Then chapters run oldest first (Before You, then the first weeks, then month 1 onward), and letters inside a chapter run oldest first by `occurred_on` then `captured_at`, the reverse of the Book tab (newest first, F09 6.3); Read together already reads oldest first (B-S19); a test builds a 20-fixture book and asserts the order | NS-07-C28-3 ("book order" is ambiguous: card change PC-1); B-S19; new screen PRT-S02 | P2 gated | `product`, `mobile` | F09 section 6.3 "Order"; DESIGN B line 156 and 162 |
| FR-PRT-06 | Given the printed Year One, When a parent chooses what goes in, Then the default is Before You plus chapters 0 to 11 (month 12 begins Year Two), the parent can choose any run of whole chapters, and the preview names every author whose letters are inside; no letter is ever split between two books | NS-30; PRT-S01; BK-14 solution 2 | P2 gated | `product` | BRAND.md line 17 ("Year One, Year Two"); F09 section 6.3 age math. Default is mine [R]; founder rules |
| FR-PRT-07 | Given any page, When it prints, Then every word on it is a letter's `final_text`, a parent-typed dedication or book name, a month or chapter heading, or the fixed unsigned title and colophon words; there is no caption, summary, highlights page, generated title, "made with" line about AI, and no word the parent did not say or type. The order file is made by the same builder as the free file (one layout engine, one layout version recorded in its metadata), and the text layer of the order file equals the `final_text` of the letters in order | NS-07-C28-2, -3, -16; new screen needed | P2 gated; guard P0 (a) | `mobile`, `qa` | C28-2, C28-3; constitution in CLAUDE.md |
| FR-PRT-08 | Given a letter longer than one page (a long spoken letter), When it is laid out, Then it flows across pages with no cut, no ellipsis and no "continued" invention beyond a fixed unsigned marker, a letter that fits on one page is not split by a page turn, and no page ends with a single orphaned line | NS-07-C28; BK-13 solution 3 | P2 gated | `mobile` design-systems | BK-13 solution 3; BK-13 evidence "blank pages with a single line" |
| FR-PRT-09 | Given a book with few letters, When the partner has a minimum page count (UNVERIFIED: Lulu's page does not state one), Then the file is brought to the minimum with fixed unsigned pages only (title, a dedication page the parent may fill with their own typed words, colophon, and pages left open for the family's own hand) and never with generated text, repeated pages or a count of what is missing; no page count shows in any message that talks about letters; the page count appears only where price needs it, as part of the price line | PRT-S02; C28-5 | P2 gated | `product`, `design-systems` | C28-5 (no page count or "pages left"); BK-13 problem lines. Design question DQ-3 |
| FR-PRT-10 | Given the script of each letter (Latin, Devanagari, Arabic, Han), When the order file is built, Then every glyph comes from an embedded OFL face on the allowlist (Literata, Mukta, Tiro Devanagari Hindi today; an Arabic and a Han face are UNVERIFIED as bundled), each letter keeps its stored direction, and a preflight test fails if any glyph would print as a box or fall to a system font; Apple's system fonts are never embedded | NS-07-C28-13; NS-17; FR-LEG-12 | P2 gated (P0 (b) for the font licence record) | `mobile`, `legal` | tokens.ts lines 144 to 156; FR-LEG-12; BK-13 evidence ("whether [system fonts] may be embedded in a book we sell is doubtful [U, counsel]") |
| FR-PRT-11 | Given a letter that contains a character no allowlisted face covers (for example a colour emoji a parent typed), When the parent goes to preview, Then the app does not drop, swap or rewrite it: it shows the parent which letter holds it, and the choices are to keep it as the letter is with a blank where it cannot print, or to change the letter in the app themselves; nothing is changed for them. Whether an OFL emoji face is bundled for print is UNVERIFIED and an open question (Q-PRT-9) | PRT-S02; B-S08; NS-07-C28-13 | P2 gated | `product`, `mobile` | Constitution: the machine never adds meaning |
| FR-PRT-12 | Given a picture with a stored copy, When it is placed, Then it prints at its own size without cropping or upscaling (C28-8), its effective resolution at the printed size is computed in preflight, and in the order preview (not in the free file) one calm line tells the parent, once, if any picture will print softer than 150 dpi (threshold is my [A]); there is no per-picture warning, no red mark and no word like "poor"; the screen colours and the paper colours are different and the preview says so once | NS-07-C28-8; NS-01 T3; PRT-S02 | P2 gated | `design-systems`, `content` | T3: 4,032 px cap, 2,550 px floor at 8.5 in and 300 dpi (NS-30 text); C28-8. Card change PC-2 |
| FR-PRT-13 | Given the cover and spine, When the order file is built, Then the cover is a fixed design in a small set of brand colours (cloth or paper look per BK-14), carries the book name the parent set, the child's first name only as the parent wrote it, the year line from `brand.printTitle`, "From {signsAs}" is not on the cover, no cover photo by default, and the spine width is computed from the partner's own formula for the final page count (UNVERIFIED: Lulu's formula not read) | PRT-S02; BK-14 solution 1 | P2 gated | `design-systems`, `mobile` | BK-14 solution 1; BRAND.md lines 17, 90 |

### 4.2a Proof

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-PRT-14 | Given a parent about to order, When they open the preview, Then they can page through every page of the exact file the partner will receive (hash shown to support, not to the parent), the same file is uploaded and submitted (a hash check in the server function rejects any difference), and if they go back and change a letter in the app the preview is rebuilt and the old one cannot be ordered. The approve button says what it does in plain words and is not primary-coloured over a lower-weight "Back"; no timer, no "only n left", no pressure | PRT-S02; B-S08 (changing words); NS-07-C28-16 | P2 gated | `mobile`, `design-systems` | Customer-first rule 1 (3.1); BK-14 order flow step 3 ("full preview of every page and every cost before payment (Terms 15.2)") |
| FR-PRT-15 | Given the preview, When VoiceOver, Voice Control, Switch Control, Dynamic Type AX5 or Reduce Motion is on, Then each page can be reached and its text read from the text layer (the file's text layer equals the words), the preview works offline once built, and the page controls are labelled with the page number only; this is tested on the SE 3 and recorded. Whether the system PDF viewer reads the text layer well with VoiceOver is UNVERIFIED | PRT-S02; E-S23 (accessibility walk) | P2 gated | `a11y`, `qa` | C28 section 4.6 (VoiceOver row) |

### 4.3 Who orders, from which screens, and consent

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-PRT-16 | Given a signed-in parent who can read at least one kept letter in a book that is not hidden from them, When the order flag is on, Then they can start an order from three places only: the printable section of Save a copy (C-S04), the "More for this book" menu (B-S02), and the year-end slip (C-S06, one quiet line, no countdown, no "order by" pressure except a true holiday cutoff stated once inside checkout); a hidden book, a letter set aside, a held draft beyond the allowance, a sealed letter before it opens, a quiet day and a Recently deleted letter are never included; Plus status does not matter (print is outside Plus, closed X3) | C-S04, C-S06, B-S02, PRT-S01; NS-07-C28-4, -18; NS-12; FR-SEC-03 | P2 gated | `product`, `mobile` | C28 4.19 and README X3; FR-SEC-03; C28-4 |
| FR-PRT-17 | Given a parent who is signed out or has a local-only book, When they start an order, Then one sheet says an account is needed so the order can be followed and the receipt sent, the sign-in sheet (E-S04) opens, and on Not now they return to where they were with the free file still there; the sign-in and the order never change what the parent's book keeps | E-S04 to E-S07, PRT-S01; E-S18 | P2 gated | `mobile` | Account-first rule E-S02; C28 "Signed out: works on the local book" stays true for the file |
| FR-PRT-18 | Door lines for the one act that moves a family's words and pictures off the phone for printing. **Shown:** the exact words, by content key and versioned links, on PRT-S07 before the file is uploaded: what leaves the phone (the words of the letters in this book, the pictures chosen, the book name and child's first name as printed), where it goes (our printing partner only, to be printed), how long it is kept (a stated number of days, FR-PRT-31), and that the voice recordings never leave. **Records:** one consent row per PRIV-R21 (document, version, action, method, surface, server and phone times, app version and build, OS major version, platform, text language, hash of the words shown, order id as allowlisted context). **Never:** audio; transcripts or `raw_transcript`; letters not in this order; the child's birthday or due date; any use of the file beyond this order; analytics of any of it. **Decline and withdraw:** "Not now" leaves everything as it was and the free file works; later withdrawal before the file is submitted deletes the uploaded file and cancels the order; export and deletion keep working | PRT-S07; E-S07 (pattern); PRV rules | P2 gated; P0 (b) before the flag turns on | `content`, `privacy`, `mobile`, `sync` | COORDINATION section 10 "The door"; README X2 ("A copy of a child's voice leaving the phone needs a security-architect read and a counsel read first": this is words and pictures, not voice, but the same read is the safe default) |

### 4.4 Payment, Apple's rules, tax, price

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-PRT-19 | Given the order flow, When payment is taken, Then it is by card or Apple Pay on a hosted page opened outside the app (or a payment sheet that uses Apple Pay), never in-app purchase, no StoreKit product exists for a book, and the app never sees a card number; the App Review notes say the app sells a physical good paid outside in-app purchase under 3.1.3(e) and give a reviewer a path that shows the flow without placing a real order | PRT-S03; E-S27; CR-087, CR-054 | P2 gated; P0 (b) at the moment the flag turns on | `mobile`, `compliance` | S1 (3.1.3(e)); ADR 0007; CR-054 ("hosted checkout so we never touch card data", PCI level UNVERIFIED) |
| FR-PRT-20 | Given a parent at checkout, When they see the price, Then one screen shows the book, the number of copies, shipping (included, or the amount), tax (a line, computed, not estimated) and the total, before any payment step; no price shows before the parent has seen the preview; no strike-through price, no "credit", no subscription, no saved card by default | PRT-S03 | P2 gated | `content`, `design-systems` | BK-14 order flow; SB 478 all-in pricing is UNVERIFIED (statute not read); counsel must confirm |
| FR-PRT-21 | Given a US order, When sales tax is calculated and collected, Then the tool and the states are chosen by the accountant before the first order, the pilot is limited to states where that is settled, and the tax line is never a guess; as an individual seller (D-004) the founder carries personal liability for sales-tax duties; counsel and the accountant must confirm nexus, rates, registration, who collects (seller or partner), and whether an entity should be the seller | PRT-S03; CR-120 | P2 gated; P0 (b) at first order | founder, accountant, CFO role | CR-120 (tax line, "Gap"); S6 (tool fee, "where you're registered to collect tax"); finance.md FR-FIN-24 and A7 |
| FR-PRT-22 | Given any money path, When it is proposed to build, Then the founder has answered in writing: who sells (the individual, or an entity), whose Stripe account (or other processor), who owns refunds and support, who pays tax, and the margin floor (35% [A], BK-14) is met at the partner's real quote | all PRT; finance.md FR-FIN-24 | P2 gated | founder, CFO, CBO, CLO roles | FR-FIN-24; ADR 0007 consequences |
| FR-PRT-23 | Given the processor's fees (2.9% plus $0.30 and $15 a dispute, S6) and the partner's unknown wholesale cost, When the price is set, Then the founder sees section 3.4 re-done with a real partner quote and the real card fee before he approves a price | none | P2 gated | CBO, CFO roles | S6; section 3.4 |

### 4.5 Where books can go

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-PRT-24 | Given the pilot, When a parent enters a delivery address, Then only addresses in the 50 US states and the District of Columbia are accepted (default), chosen from a country field and not inferred from the phone's location; any other country shows one calm line ("We can only send books to addresses in the United States for now.", intent), never "unavailable in your region" and never a block that ends the free file; P.O. boxes, military and territory addresses wait for the partner's carrier rules (UNVERIFIED). The sign-up country block for sanctioned places (Privacy Policy section 12) stays, and counsel must confirm that a US-only address list is enough for the order flow | PRT-S03; E-S07 | P2 gated | `product`, `legal` | BK-14 solution 5 ("US addresses only for the pilot (the app is US-only, LEGAL-REQ-058)": I did not open LEGAL-REQ-058); privacy-policy.md line 153 |
| FR-PRT-25 | Given a request to open another country, When it is proposed, Then it needs production in that country (S3: Lulu lists Australia, Canada, France, India, the UK and the US; S5: Gelato says 34 countries), a stated tax and importer answer, and a counsel read of local consumer and product rules; no cross-border shipping from one production country; the EU, India and others are out of scope until then. The repo's EU duty and GPSR statements are secondary-sourced and UNVERIFIED | none | P2 gated | CBO, CLO roles | BK-14 solution 5; BK-16 solution 4 (India GST question) |

### 4.6 Orders: states, failures, cancellations, refunds

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-PRT-26 | Given an order, When it moves, Then it follows one state list with one calm email and one line in the app per change: Preview, Awaiting payment, Paid or authorised, File received, File checked, On hold (cancellable), With the printer, Shipped (with tracking), Delivered, Needs attention, Cancelled, Refunded, Reprinting. The card is captured or charged only after the file is received and checked and the partner has accepted the job (if the processor's authorisation window allows: UNVERIFIED; otherwise the order is held before payment until the file check passes); every server step is idempotent so a retry never charges or prints twice; webhooks from the processor and the partner are signature-checked | PRT-S04; E-S14 (offline) | P2 gated | `sync`, `api` | ADR 0007 (Edge Function submits the print job); S3 (webhooks, tracking through the API) |
| FR-PRT-27 | Given a paid order not yet with the printer, When the parent cancels, Then they can do so in the app until a hold window ends (proposed 60 minutes [A]) and get a full refund to the original payment method within the FTC's seven working days or sooner (S2); after the order is with the printer, cancellation is not possible and the Print Terms say so in plain words (counsel must confirm the wording and any state rule on custom goods) | PRT-S04; PRT-S06 | P2 gated | `product`, `legal` | S2 (refund timing, cancellation); BK-14 support line |
| FR-PRT-28 | Given the delivery time stated in checkout, When it is written, Then it is a range supported by the partner's real data (not a hope), and if a parcel will miss the stated date the parent gets one notice with the new date and a free, one-tap way to cancel for a full refund, within the FTC's rules; the process and the 30-day default are written into the support runbook before the first order; counsel must confirm whether the rule applies to a personalised book | PRT-S04, PRT-S06 | P2 gated; P0 (b) at first order | `support`, `ops`, `legal` | S2 (30-day default; delay notice; no store credit in place of a refund; made-to-order not discussed on the page) |
| FR-PRT-29 | Given a delivery that fails, When the parent reports it, Then the answer is by case, and the parent is never asked for a photo of their letters: (a) lost in transit or never arrived: one reship, or a refund if it fails again; (b) damaged in transit or printed wrong (binding, misprint, cut-off text caused by us): a free reprint or a refund, the parent's choice, with one photo of the damage only (not of the pages); (c) the parent's own content error seen in the preview (a typo they approved, a small picture): not a defect, said kindly, with the reorder path; (d) undeliverable or wrong address typed by the buyer: one reship at our cost if our address check passed, otherwise at theirs, said before they pay; (e) a dispute through the bank: answered with the order record, never the file | PRT-S06; FR-SUP | P2 gated | `support`, `ops` | BK-14 solution 7; S6 (dispute fee $15); partner terms UNVERIFIED |
| FR-PRT-30 | Given a refund or reprint, When it is made, Then it goes to the original payment method by the processor, takes nothing from Plus, from Apple, or from the parent's letters, and is recorded on the order row with the reason code, never with free text from the parent that may carry letter content | PRT-S06 | P2 gated | `support`, CFO role | ADR 0007 ("we own payments, refunds and support") |

### 4.7 Address, order data and privacy

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-PRT-31 | Given an order, When data is stored, Then: the address, name and phone (if any) are collected on the hosted page or a field that is classified L3, sent only to the processor and the partner, stored on our order row only until a stated number of days after delivery or refund (proposed 30 days [A]) and then set to null, while the order row without the address (order id, date, amounts, tax, state, reason codes) is kept for the tax period (7 years is proposed in data-policy, counsel and accountant must confirm); the uploaded print file is deleted from our storage after the partner has accepted it plus a short margin (proposed 7 days [A]) and the partner must delete its copy after shipping (a criterion, row 8 of 3.3); none of it appears in analytics, logs or crash reports; the Privacy Policy, subprocessor table and privacy label (Contact Info; Photos or Videos and Other User Content if the file counts; Purchases) are updated before the flag turns on; the line "We do not collect ... photos ... payment details" in the policy changes; whether payment data collected by a hosted page counts on the label is UNVERIFIED and for compliance and counsel | PRT-S07; PRT-S04 | P2 gated; P0 (b) before the flag turns on | `privacy`, `compliance`, `data-architect` | data-policy lines 105, 170, 207; privacy-policy line 45; S1 (5.1.1(i) disclosure and retention); BK-14 dependencies (T5-01 label) |
| FR-PRT-32 | Given an order sent to a different address (a second copy to the other parent, a grandparent), When it is placed, Then the buyer is told once that the recipient's name and address go to the printer and the carrier only for this parcel and are kept as in FR-PRT-31; the recipient is not told in advance by us; no other use is made of any third-party address; it is never imported into contacts, never reused as a default and never exported to the parent's other books | PRT-S03; BK-16 legal | P2 gated | `privacy` | BK-16 "Legal and cost" ("a grandparent's shipping address is a third party's personal data (L3)") |
| FR-PRT-33 | Given account deletion or Erase everything, When an order is in flight, Then the parent is told in plain words that the account can be deleted after the parcel is delivered or the order is cancelled, or deleted now with the order cancelled and refunded; when an order is delivered, deletion erases the address and the uploaded file on the FR-PRT-31 schedule and keeps only the tax record; export (ZIP and printable file) keeps working in every state | E-S13; C-S01; DELETION_AND_EXPORT_SPEC (not re-read) | P2 gated | `privacy`, `sync` | S1 (5.1.1(v) in-app account deletion); data-policy line 207 |

### 4.8 Reorders, copies, gifting, the other parent

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-PRT-34a | Given a parent who wants a second copy now, When they order, Then extra copies go in the same order, to the same address or to others, at the extra-copy price, with no gift-note feature in the pilot (BK-16 later); a note card holding the sender's own typed words is a later item and never generated | PRT-S03; BK-16 | P2 gated | `product` | BK-16 solution 1 |
| FR-PRT-35 | Given a parent who ordered a book before and wants another later, When they reorder, Then the app rebuilds the preview from the book as it is now, shows it in full, and says what changed since the last order only by showing it (no diff machine, no "new letters" count); the identical earlier file is not promised, because the file is deleted (FR-PRT-31); order history shows past orders with state, date and total, and "Order again" | PRT-S05; PRT-S02 | P2 gated | `product`, `mobile` | FR-PRT-31 retention; BK-14 metrics |
| FR-PRT-36 | Given a parent who wants to send the book to the other parent: the other parent is a co-author with their own copy, so the answer is a second copy to their address (FR-PRT-34a), not a gift product, not a gift card and not an Apple gift (3.1.1 allows physical gift cards by other payment, S1, but we sell none); the other parent's letters inside it follow FR-PRT-37 | PRT-S03; D-S18 | P2 gated | `product` | S1 (3.1.1 physical gift cards); BK-16 |
| FR-PRT-37 | Given a book that holds the other parent's in-book letters, When the first parent orders, Then the preview names every author whose letters are inside ("Letters from Mama and Papa", intent), the other parent's private, sealed, hidden and deleted letters are never inside (C28-4, -18), and after the order the other parent sees one calm line in the app, with no approval step between parents (F11-REQ-010 says there is none for in-book letters) and no email that carries the child's name; counsel must confirm that printing co-parent in-book letters is within Terms 7.1 and whether the other parent should be asked first; default is notice, not approval | PRT-S02; D-S18; NS-25; NS-07-C28-18 | P2 gated | `product`, `legal`, `privacy` | BK-14 solution 2 ("from every author, as Terms 7.1 allows": I did not read Terms 7.1 line by line); F09 scope; emails COMPLIANCE line 17 |
| FR-PRT-38 | Given order emails, When one is sent, Then there is one per state change in FR-PRT-26 (order received, with the printer, shipped with tracking, delivered or problem), each is transactional, contains the order number, state and a link back to the app's order screen, and never holds letter text, the child's name, a picture or a recipient's address; no marketing email goes to a buyer on the strength of an order | PRT-S04; docs/emails | P2 gated | `emails` | emails COMPLIANCE line 17 (recommended hard rule; resend limits in finance.md V4 cover the volume) |

### 4.9 QR and the voice

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-PRT-39 | Given any printed page, When it is designed, Then it has no QR code, no link, no printed URL and no mention of audio in the pilot, because a code that plays a recording needs hosted audio (NS-28, NS-08 Level 3), a counsel read, a decades-long resolver and a new disclosure (anyone holding the book can hear it); the book is complete without one (BK-14); if BK-15 is ever taken up it is a separate card | NS-30; NS-07-C28-6; BK-15 | P0 (a) while hosted audio does not exist | `product` | NS-30 conditions; BK-15 legal and cost lines; README X2 |

### 4.10 Support

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-PRT-40 | Given a buyer who needs help, When they use Write to us from an order screen, Then the message carries the order number and state and nothing else of the book; the support person sees order id, state, dates, totals, reason codes, tracking, and the address, and never the print file or any letter text; the replies come from the support alias; the first reply target is two business days [A]; a macro set exists for the five cases in FR-PRT-29; escalation to the partner uses the order id only; expected load is 3 to 5 tickets per 100 orders [A, BK-14]; the support runbook is written and read by the founder before the first order | PRT-S06; FR-SUP-04; Q-SUP-9 | P2 gated | `support`, `ops` | BK-14 cost line; support.md Q-SUP-9 ("It is not Apple"), line 205 |
| FR-PRT-41 | Given the founder as the single seller and support person, When orders open, Then there is a pause: the server key from FR-PRT-01 stops new orders in one step, shows one line in the app ("Books are paused for now. Your file is still here to save.", intent), lets in-flight orders finish, and a holiday cutoff date is set from the partner's real data and stated once in checkout; order volume is capped for the pilot so one person can answer every order (proposed cap [A]: 50 a month until the first read-out) | PRT-S01; E-S13 | P2 gated | `ops`, founder | ADR 0007; FR-OPS-01 kill switch |

### 4.11 Quality

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-PRT-42 | Given an order file, When it is built, Then an automated preflight passes before the file can leave the phone: fonts embedded and subset; zero missing-glyph boxes; text layer equals words; trim, bleed, spine and cover sized to the partner's spec; images at or above their own size with no upscaling; no page with a single orphaned line; file size under the partner's limit (UNVERIFIED); fixtures cover Latin, Devanagari, Arabic, Chinese, mixed direction, a 1,000-letter book and a one-letter book | NS-07-C28-3, -10, -13; E-S17 | P2 gated | `mobile`, `qa` | C28 rows; BK-13 solution 4 |
| FR-PRT-43 | Given the layout before launch, When the founder has approved the spend, Then two physical proof books from two services (C28's exec record) are made from the fictional Asha fixtures only (never a real family's letters or pictures), and the proof read-out checks: gutter and margins, Devanagari conjuncts and marks not clipped, Arabic reads right to left inside each letter, a long letter across a page turn, a small picture, a colour match against the screen, cover and spine alignment, hardcover feel and smell, and delivery packaging; a reader of Hindi reviews the Devanagari proof; the read-out sets the numbers C28 section 4.7 leaves blank (trim, margins, bleed, page limit, cover) and is dated | NS-07 C28 4.7 last paragraph; OQ-1 | P1 | founder, `product`, `qa` | C28 "Not specified, because the numbers come from proof books"; D13 (Asha-only install) |
| FR-PRT-44 | Given live orders, When the pilot runs, Then the founder sees monthly: orders, reprint or defect rate (target under 2% [A]), refund rate (under 3% [A]), median days order to delivery (under 10 in the US [A]) and gross margin per book (at least 35% [A]) from the orders table (server counts only, never device analytics), and a stop-sale rule: pause orders if the defect rate exceeds 5% [A] for any 20 orders or any one systematic defect is found | PRT-S04; FR-DAT | P2 gated | `ops`, CBO role | BK-14 metrics (targets are the repo's [A]); stop-sale rule is mine [A] |
| FR-PRT-45 | Given a printed page contains a real family's words, When a proof, test or support check is run, Then fictional Asha fixtures only are used, and no real family letter is ever printed, photographed or attached to a ticket by us | all | P0 (a) | all lanes | CLAUDE.md privacy rules; `no-real-family-data.test.ts` |

### 4.12 Legal and security gates

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-PRT-46 | Given the order flow, When the flag is first turned on, Then these exist and are merged by the founder: Print Terms (not drafted today; Terms 15 is "not offered yet" per BK-14), the Terms 5.6 wording on print shops (FR-LEG-13, L-10), Privacy Policy changes (FR-PRT-31), subprocessor entries for the partner and the processor (Q11), a refund and delivery policy in plain words, and a counsel read of SB 478, the FTC rule, state tax and any children's-product rule (CPSIA is UNVERIFIED and listed in Q-PRT-8) | PRT-S03, PRT-S07 | P2 gated; P0 (b) before launch | `legal`, founder | CR-054; BK-14 dependencies; FR-LEG-12, -13 |
| FR-PRT-47 | Given the order system, When it is designed, Then a threat-model row exists before the flag turns on in `preview` (FR-SEC-19): signed, short-lived upload URLs; the upload bucket private with no listing; partner and processor keys held as server secrets; webhook signatures verified; an order id is not guessable; no order screen shows another account's order; rate limits on order creation; the print file is not excluded from the existing rule that the free file is unlocked once saved by the parent (FR-SEC-08), but the upload copy is never readable by support | all order screens | P2 gated; P0 (b) before launch | `security`, `sync` | FR-SEC-19, FR-SEC-08 |

### 4.13 What is in and what is out of 1.0

| Item | In 1.0? | Note |
|---|---|---|
| Free printable file (NS-07 C28), flagged, free, local, no sale | In (card ruling P1; founder may cut it first) | FR-PRT-02, -03 |
| Help article for the file | In | FR-PRT-03 |
| Any order, price, partner, checkout, address field, tax, shipping, order email | Out | FR-PRT-01 |
| Print words in store, site, email, help | Out | K-32 |
| QR codes and audio on pages | Out | FR-PRT-39 |
| Server order tables, partner and processor integrations | Out (not built, not provisioned) | Section 6 |
| Printed book pilot | Out; earliest per BK-14: go/no-go on the file's signal, pilot after Print Terms, the entity answer and proof books | FR-PRT-34 below |

### 4.14 Reopen conditions for NS-30

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-PRT-34 | Given the question "should the printed book be built", When the founder rules, Then all of these are true and written: the file's demand signal is read (BK-13's go signal is 10% of families reaching a first birthday making a file within 30 days [R], a figure I would not trust at tester volume: use "x of n" under 20 families); the founder has answered FR-PRT-22; the entity decision is made (BK-14 recommends forming it before the first order; D-004 triggers); a partner has been chosen against section 3.3 with a written quote; proofs are read (FR-PRT-43); counsel and the accountant have answered (FR-PRT-46); the support runbook exists; the margin at the real quote is at least 35%; hosted audio is not required | NS-30 "What would reopen it" | P2 | founder, CBO role | NS-30; BK-14 "Dependencies" and "Horizon" |

---

## 5. Design needs

New screens use the proposed id `PRT-Sn` for the e2e lead to assign (an area C or area B addition, to be placed by Karma). All of them stay out of every store build until FR-PRT-34.

| Screen or change | What | Keyed to |
|---|---|---|
| C-S04, C-S05 (existing) | The 1.0 file: one plain line saying what the file is and is not (FR-PRT-02); no change to the buttons; add the help-article link | FR-PRT-02, -03 |
| PRT-S01 A book to hold (sheet) | Choose the book and the run of chapters (default Before You plus 0 to 11), see the authors named, one line saying what happens next; entry only from C-S04, B-S02 and C-S06 | FR-PRT-06, -16 |
| PRT-S02 Preview, every page | Full-page paging of the exact file; changes route back to B-S08; the one softer-picture line; the emoji and missing-glyph states; the order approve button; AX5, VoiceOver, offline | FR-PRT-05 to -15 |
| PRT-S03 Where to send it, and what it costs | Address (US only), copies and addresses, price with shipping and tax, delivery range, the Print Terms link, the hosted payment hand-off; the unsupported-country line | FR-PRT-19 to -25, -32, -34a |
| PRT-S04 Order status | State list in plain words, tracking link, cancel while on hold, Write to us | FR-PRT-26 to -28, -38, -40 |
| PRT-S05 Orders and Order again | History, reorder through a new preview | FR-PRT-35 |
| PRT-S06 Something is wrong with an order | Case chooser (not arrived, damaged or misprinted, wrong address), one-photo rule for damage, no photo of pages, outcome words | FR-PRT-29, -30 |
| PRT-S07 What leaves the phone | The door sheet with Shown, Records, Never, Decline; Not now returns without loss | FR-PRT-18, -31 |
| C-S06 (year-end slip) | A quiet line to a book to hold, no countdown, off when the flag is off | FR-PRT-16 |
| E-S13 and E-S14 | Order screens under outage and offline: the order status reads the last known state; creation of an order is disabled offline with a line; pause line from FR-PRT-41 | FR-PRT-41 |
| Design questions | DQ-1: how the cover looks in a small set of colours (design); DQ-2: whether the preview should offer a two-page spread; DQ-3: the open-hand pages for a thin book, and how they are worded without counting; DQ-4: the exact calm refusal for a non-US address | FR-PRT-09, -13, -24 |

---

## 6. Card changes proposed (for Karma to rule)

| Id | Card row | Change | Why |
|---|---|---|---|
| PC-1 | NS-07-C28-3 | Replace "in book order" with "in the order the preview shows: oldest first by chapter and by date"; say that the free file also reads oldest first | The Book tab is newest first; a paper book that starts at this month would read backwards; Read together already goes oldest first |
| PC-2 | NS-07-C28-8 | Keep "no message" for the free file; add that an order preview may carry one line about softer pictures (FR-PRT-12) | A parent who pays should know before they pay; the free file is not a purchase |
| PC-3 | NS-07 section 4.3 "Not in scope" | Add: "a cover and a spine: the free file holds interior pages only; the help article says so" | BK-13 listed a cover file with a computed spine; the card dropped it without saying so; a parent taking the file to a shop deserves to know |
| PC-4 | NS-30 "What must be true before anyone designs it" | Add the FR-PRT-34 list (partner, quote, proofs, Print Terms, accountant, support runbook, margin at the real quote) | Today it names three gates; the others are what failed the category's competitors (late parcels, lost orders; BK-14 cites them) |
| PC-5 | NS-30 "Claims" | Add: "Forbids 'photo book', 'keepsake' as a price word, 'free shipping' and any delivery date until the partner's data supports it" | FTC delivery statements need a basis (S2) |
| PC-6 | NS-25 | Add a line: the other parent's in-book letters can appear in a printed book the first parent orders; the other parent sees a notice, not an approval (counsel confirms) | FR-PRT-37 |
| PC-7 | README, section "Parked" or frame row 43 | State that a printed book needs a server-side order system and a new data flow (words and pictures leave the phone on purpose), so the label effect is not "None" (NS-30 says "None for the file", which is right; for the book it is not) | NS-30 only mentions the hosted-audio label effect |
| PC-8 | GAP-LOG C E5 | Register the order flag and the server pause key as two separate registry rows, off in store builds | Flag registry |

---

## 7. Engineering needs

None of this is built or scheduled. Every row is "new row needed" (BL ids are assigned by Karma; none above BL-999).

| Need | Detail | FR |
|---|---|---|
| Flag and pause key | `EXPO_PUBLIC_PRINT_ORDER` (off, not in store builds) and a signed-config pause key, in the flag registry (BL-973 covers the registry; a row for these two) | FR-PRT-01, -41 |
| Order-file builder | Extend the C28 builder with cover, spine, bleed, one layout version, deterministic output and a content hash; preflight as tests; fixtures | FR-PRT-05 to -13, -42 |
| Preview screens | PDF paging with the text layer and accessibility, rebuilt on change | FR-PRT-14, -15 |
| Order service | Tables (orders, order events, no address after retention), Edge Functions for create, upload URL, file receive and check, partner submit, processor and partner webhooks, cancel, refund and reprint, with idempotency keys; grants in their own migrations and in `supabase/tests/grants.mjs` (CLAUDE.md rule) | FR-PRT-26 to -33 |
| Partner and processor integration | Behind server secrets; cost endpoint call so the price shown is the quote (UNVERIFIED that Lulu has one: ADR 0007 says so) | FR-PRT-20, -23 |
| Hosted checkout and return | Hosted page, universal-link return, no card data in the app, App Review notes | FR-PRT-19 |
| Emails | Five transactional templates with no content; counts against the send limits | FR-PRT-38 |
| Support tooling | An order lookup that never shows the file or letter text; macros | FR-PRT-40 |
| Fonts | Allowlist test and licence records for the Arabic and Han faces and any emoji face used for print | FR-PRT-10, -11 |
| Metrics | A server-side orders view for the monthly read-out | FR-PRT-44 |
| Account deletion | Order handling in the deletion spec and the purge worker (address null after 30 days [A]) | FR-PRT-33 |

---

## 8. Founder and counsel questions, with recommended defaults

Counsel numbers are from `docs/legal/COUNSEL_PACKET.md` 1.5.0 where one exists (Q11 processors; Q47 publisher identity; Q30 "Later features", row printed books). New questions say "needs a number from legal". Claude roles are not licensed professionals; every legal reading here needs counsel.

| Id | Question | Recommended default | Who | Counsel number |
|---|---|---|---|---|
| Q-PRT-1 | Build the printed book at all, or stay with the free file? | Ship the free file in 1.0; decide at the go/no-go on evidence; do not build ordering before FR-PRT-34 is true | founder | none |
| Q-PRT-2 | Who is the seller: the founder as an individual (D-004), or an entity formed first (BK-14 recommends the entity before the first order)? | Entity first; selling physical goods as an individual carries personal liability; accountant and counsel to confirm | founder, counsel, accountant | Q47 |
| Q-PRT-3 | Which partner, and may the CBO role request a written quote (a contact, which the CBO role may not do)? | No contact until the founder says so; shortlist Lulu first, Gelato second, from public pages only | founder | Q11 for the DPA |
| Q-PRT-4 | Price and shipping: $59 first copy with US shipping, $39 each extra (BK-14 [R]) | Do not fix any price until a real wholesale quote and card fee are in section 3.4; price shown all-in with tax visible | founder, CFO | needs a number from legal (SB 478, UNVERIFIED) |
| Q-PRT-5 | Is the FTC Mail Order Rule (S2) applicable to a personalised book; what must the Print Terms and delay notices say? | Assume it applies; build to its notice and refund timing | counsel | needs a number from legal |
| Q-PRT-6 | Sales tax: which states, who collects, which tool, and does an individual seller change the answer? | Pilot only where the accountant has settled; use a tax tool (S6 lists one) | accountant, counsel | CR-120; FR-FIN-24; finance A7 |
| Q-PRT-7 | Is the other parent asked before their in-book letters are printed in a book the first parent buys? | Notice, not approval (FR-PRT-37) | founder, counsel | Q30 (printed books row); Terms 7.1 |
| Q-PRT-8 | Does a printed book named for a baby bring any children's-product or labelling rules (CPSIA, ink and materials); and is the PCI level SAQ A with a hosted page (CR-054)? | Counsel to answer; assume none until told | counsel | needs a number from legal |
| Q-PRT-9 | Emoji and unusual characters in letters: print a blank, or bundle an OFL emoji face for print? | Blank with a choice to change the letter themselves; no automatic substitution | founder, content | needs a number from legal for the face licence |
| Q-PRT-10 | Where is the line between a defect (we pay) and the parent's own content (they pay)? And a goodwill allowance? | FR-PRT-29 as written; a founder-set goodwill reprint allowance, 1 per 20 orders [A] | founder | none |
| Q-PRT-11 | Are page order and the Year One range (FR-PRT-05, -06) as recommended? | Oldest first; Before You plus months 0 to 11 | founder, product | none |
| Q-PRT-12 | Where does the partner keep and delete our file, who at the partner can see it, and is the partner a processor or an independent controller (data-policy line 170)? | Processor, with deletion after shipping; if the partner will not accept that, it is not the partner | counsel, CLO | Q11 |
| Q-PRT-13 | Pilot limit: 50 orders a month and a holiday cutoff? | Yes | founder | none |

---

## 9. What I did not read or run, and what I found that others should hear

Not run: nothing was built or executed; no proof book exists; no quote, sandbox or account was touched. Not read: the items listed in section 1. The margin in 3.4 is my arithmetic on one page price (S4), the card fee (S6) and BK-14's own estimates; it is not a partner quote.

Where the repo and the pages I read disagree: Gelato's country count (repo 33; page 34; a snippet 32). Lulu's "from $14.76" is a retail starting price for the square hardcover; the repo's earlier ADR 0007 example (6x9 hardcover, $12.07) is a different product. The repo says a Lulu sandbox exists; the Lulu page I read does not mention one.
