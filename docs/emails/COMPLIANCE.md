# Email compliance

Owner: L2 (email privacy and marketing compliance). Draft for counsel, 3 Oct 2026. Branch `feat/email-brand-library`.

> **Not legal advice.** Prepared by an AI (Claude) for review by a licensed attorney. It tells the founder and counsel what the rules say, what we verified, what we could not verify (marked **UNVERIFIED**), and what we recommend. Nothing here is final until counsel signs it off.

Reads with: `docs/emails/BRIEF.md`, `docs/emails/CATALOG.md` (C2), `docs/DECISIONS.md` (D-001, D-004, D-005, D-022, D-042, D-044), `docs/legal/compliance-register.md` (CR-050, CR-051, CR-060), `docs/legal/ENGINEERING_REQUIREMENTS.md` (LEGAL-REQ-014, -047, -048, -049, -053), `docs/legal/subscription-terms.md` 1.3.0, `docs/legal/terms-of-service.md` 14.6 and 14.8, `docs/legal/privacy-policy.md` 1.3.0, `docs/legal/consumer-health-data-notice.md` 1.1.0. Copy: `packages/content/src/emails/legal.en.ts`.

## 0. The answer in eight lines

1. **Every email we send at v1.0 is transactional or relationship mail.** None needs an unsubscribe link or a postal address under CAN-SPAM. They still must not have false or misleading headers (15 U.S.C. 7704(a)(1) covers transactional mail too) and must not deceive.
2. **Keep them transactional by keeping them clean.** One promotional sentence (a Plus upsell, a "tell a friend") can turn a message commercial under the FTC's primary-purpose rule. The rule for copy: no offers, no upsells, no referral asks in any v1.0 email.
3. **The first commercial email (a newsletter, a waitlist launch announcement) needs:** a working opt-out honoured within 10 business days (we target 48 hours, Gmail's ask), a postal address, accurate From and subject, and, for Gmail and Yahoo, RFC 8058 one-click `List-Unsubscribe` headers. Send it from `news.earlyletters.com`, never from the sign-in domain.
4. **Postal address:** a USPS PO box or a private mailbox (PMB) at a commercial mail receiving agency both satisfy the rule (16 CFR 316.2(p)). Never the family home (D-004).
5. **Never unsubscribe anyone from transactional mail.** Do not use Resend's suppression list for newsletter opt-outs: it is account-wide and would also block sign-in links and legally required renewal notices.
6. **Auto-renewal notices (D-022) are the highest-risk emails.** Section 5 lists the exact fields each must carry. Two gaps for counsel: Massachusetts may want terms repeated with each monthly bill (the catalog sends no receipts), and the cancel-by date must be computed so a user in Pacific time cannot miss it by a few hours.
7. **No letter text, transcripts, audio, photos, child names, birthdays or due dates in any email body or subject.** Recommended as a hard rule (section 7). It follows from our privacy rules, keeps the Privacy Policy's processor table true, and keeps consumer health data out of the email provider.
8. **Launch blockers outside copy:** Apple private relay registration (section 9), and a PO box or PMB before the first commercial email (not before launch).

---

## 1. Transactional or commercial: the test

### 1.1 What the law says

**Commercial** email is any message "the primary purpose of which is the commercial advertisement or promotion of a commercial product or service (including content on an Internet website operated for a commercial purpose)". It expressly **excludes** transactional or relationship messages (15 U.S.C. 7702(2)(A) and (B)).

**Transactional or relationship** messages are those whose primary purpose is to (15 U.S.C. 7702(17)(A), paraphrased from the Cornell text):
- (i) facilitate, complete or confirm a commercial transaction the recipient already agreed to;
- (ii) give warranty, recall, safety or security information about a product or service they use or bought;
- (iii) notify them of a change in the terms or features of, or their standing or status in, a subscription, membership, account or comparable ongoing relationship, or give periodic account statements;
- (iv) employment information (not relevant);
- (v) deliver goods or services, including product updates or upgrades, they are entitled to receive under a transaction they agreed to.

**Mixed messages** (16 CFR 316.3, eCFR):
- Commercial content plus transactional content: the message is **commercial** if (i) a reasonable recipient reading the **subject line** would conclude it is promotional, **or** (ii) the transactional content does **not appear at the beginning** of the body.
- Commercial content plus other (non-transactional) content: commercial if a reasonable recipient would conclude from the subject line or body (placement, proportion, formatting) that promotion is the primary purpose.
- Only transactional content: never commercial.

### 1.2 Our working test (apply to every new template)

Answer in order. Stop at the first "commercial".

| # | Question | If yes |
|---|---|---|
| 1 | Did the recipient do something, or is something happening to their account, book, data or plan, that this email tells them about? | Go on. If no, it is **commercial** or should not exist. |
| 2 | Does the subject line mention a product, feature, price or offer they have not already bought or asked about? | **Commercial** |
| 3 | Is the first paragraph anything other than the account or transaction fact? | **Commercial** |
| 4 | Is there any sentence whose job is to sell (upgrade to Plus, try a feature, tell a friend, rate us, gift a year)? | **Commercial** (316.3 mixed-content rule; also our CATALOG principle 1) |
| 5 | Is the email something the person subscribed to receive on a schedule (digest, newsletter)? | Not commercial by that fact alone, but Gmail treats it as a **subscription message** that needs one-click unsubscribe (section 4.4) |
| 6 | None of the above | **Transactional** |

Legal wording inside a transactional email (price, plan name, renewal date) is not promotion: it is the account fact the law requires us to state.

### 1.3 Classification of every email

Sources: `BRIEF.md` required list, `CATALOG.md` as of 3 Oct 2026 08:00, and the copy files C1 and C2 had written by then, `auth.en.ts` ids. **Kind** = our classification. **Basis** = the 7702(17)(A) limb. "Conditions" are what keeps it transactional; break one and the email becomes commercial.

#### Auth and security (C1)

| id | Kind | Basis | Conditions and notes |
|---|---|---|---|
| `sign-in-link` | T | (iii) access to account; user requested | No promotion. |
| `verify-email` | T | (i)/(iii) completing sign-up the user started | As above. |
| `account-create-attempt` | T | (ii) security; (iii) account status | Sent to the account holder; reveals nothing to a stranger. |
| `sign-in-trouble` | T | (iii) | User requested. |
| `reauthenticate-code` | T | (ii) security | |
| `apple-account-linked` | T | (ii) security, (iii) change to account | |
| `google-account-linked` (v1.0, Brief decision 4) | T | as above | |
| `passkey-added` | T | (ii) security, (iii) change to account | Added 3 Oct 2026 evening (content review CNT-08). |
| `new-device-sign-in` | T | (ii) security | |
| `email-changed-old-address` | T | (ii)/(iii) | Should not show the full new address (L3 to decide; a masked form is enough). |
| `email-changed-new-address` | T | (iii) | |
| `welcome` | **T, confirmed with conditions** | (iii) a new account; (v) delivering the service they signed up for | The current copy (auth.en.ts) is clean: how to begin, our promise, reply to reach a person. It must never gain a Plus mention, "upgrade", a referral ask or a review ask. The "We never rewrite" line is a product promise, not promotion. Risk is low but real if copy drifts; the content test should block "Plus" in this template. |

#### Lifecycle and family (C2)

| id | Kind | Basis | Conditions and notes |
|---|---|---|---|
| `welcome-family` | **T, confirmed with conditions** | (iii) new account and membership of a book | Same as `welcome`. Never mention Plus or gifting (gifts would be a sales pitch to a grandparent). |
| `welcome-coparent` | **T, confirmed with conditions** | as above | Same. Do not mention that the co-parent's own Plus would cover more books. |
| `family-book-closing` (1.1) | T | (iii) change in their standing in a book | No contributors at v1.0 (D-055 supersedes D-002); sent from v1.1. Name the book by the parent's display name (E-2), not the child (section 7). |
| `family-book-restored` | T | (iii) | |
| `family-digest` (later, opt-in) | **T under CAN-SPAM; subscription message for Gmail** | (v) delivering service content they opted into | Needs a one-click unsubscribe (RFC 8058) and an in-body "stop these" link, because Gmail requires it for "subscribed messages" (section 4.4). Unsubscribing stops the digest only. No letter text (section 7). |
| `family-export-ready` (1.1) | T | (v) | Link must be authenticated and expire. |
| `book-printed` (later) | T | (i)/(v) order confirmation and delivery | No cross-sell of another book. |
| `news-confirm` (later) | **T (confirmation of a request); give it the commercial footer anyway** | (i) confirms the sign-up the person just made | A double opt-in confirmation with no promotion is not an ad. It goes out on the `news.` subdomain and carries the postal line, because it is the first message of a commercial list and the cost is nil. The catalog lists it as C; either reading is safe if it carries the footer. |

#### Billing (C2; all legal-sensitive)

| id | Kind | Basis | Conditions and notes |
|---|---|---|---|
| `trial-started` | T | (i) confirms the transaction; California 17602(a)(3) acknowledgment | Fields in section 5. |
| `plus-started` | T | (i) as above | Fields in section 5. |
| `trial-ending-week` | T | (iii) change in status | Section 5. |
| `trial-ending-long` | T | (iii); 17602(b)(1) | Section 5. |
| `trial-ending-final` | T | (iii) | Section 5. |
| `annual-renewal-long` | T | (iii); 17602(b)(2) | Section 5. |
| `annual-renewal-short` | T | (iii) | Section 5. |
| `anniversary-reminder` | T | (iii) "at regular periodic intervals ... account statement"; 17602 annual reminder | Section 5. |
| `price-increase` | **T, confirmed** | (iii) "change in the terms" of a subscription; 17602(g) | The one place where a promotional sentence is most tempting ("still the best value"). Never. State the change, the date, that it will not renew at the higher price unless they agree, and how to cancel. |
| `plus-cancelled` | T | (iii) | No offer, no "come back" (CATALOG never-send list; California 17602 save-offer rules, section 5.4). |
| `plus-ended` | T | (iii) | Same. "Your letters stay" is a fact about their account, fine. |
| `plus-quiet` (1.1, C-REQ-031) | **T, confirmed with conditions** | (iii) account status statement | Its only job is to tell a payer how to stop paying. It must not list features to "get more from Plus" (that would make it a retention pitch and arguably commercial). Never in the same week as another billing email (catalog cap). |
| `gift-*` (later) | T | (i) to the buyer; (iii) to the book's parents | The notice to the parents must not suggest buying more. |

#### Data and privacy rights (C2)

| id | Kind | Basis | Notes |
|---|---|---|---|
| `account-deletion-scheduled` | T | (iii) | |
| `account-deletion-cancelled` | T | (iii) | |
| `account-deleted` | T | (iii) | Must still say deleting does not cancel Plus, with Apple steps (DATA-REQ-022, Subscription terms "How to cancel"). |
| `book-deletion-scheduled` | T | (iii) | |
| `book-deletion-cancelled` | T | (iii) | |
| `deletion-request-received` (Ops) | T | (iii); legal obligation | Contains no data about the person beyond the request. |
| `deletion-confirm` (Ops or Fn) | T | (iii); legal obligation | Added 3 Oct 2026 evening (customer review CUS-14). One-time link to `/delete-account/confirm`; states expiry; no promotion. |
| `coparent-left` | T | (iii) change in their standing in a book (a co-member's letters leave it) | Added 3 Oct 2026 evening (CNT-08, CUS-04, founder instruction). Names the leaver by display name only (E-2), no child name (E-1), no letter content. Counsel questions in `docs/legal/COUNSEL_PACKET.md`. |
| `privacy-request-received` (Ops) | T | (iii) | |
| `export-ready` (1.1) | T | (v) | |
| `policy-update` | **T, confirmed** | (iii) "notification concerning a change in the terms or features of" the account | Legal change notices are transactional. Keep the subject factual ("We are updating our Privacy Policy"), first paragraph the change, no feature launch news in the same email. If a policy change is bundled with a new feature announcement, the feature part must be secondary and after the change, or send separately. |

#### Not in the catalog, but will exist

| id | Kind | Notes |
|---|---|---|
| Waitlist launch announcement (`site.en.ts` waitlist promises "We will write when Early Letters is ready") | **Commercial** | Announcing the app to people who asked to hear is still promotion of a product. It is sent with prior affirmative consent, so the "this is an advertisement" label is not required (7704(a)(5)(B)), but the **opt-out and postal address are**. One email, as promised, from the `news.` subdomain. Recommend C2 add it to the catalog as `waitlist-ready`. See also 6.3 on what the waitlist sign-up may be used for. |
| Newsletter, product news | **Commercial** | Opt-in only, `news.` subdomain, section 6. |
| Human replies from `hello@` | Not commercial (not an advertisement) | If support ever pastes a promotion into a reply, that reply becomes commercial. Do not. |
| Auto-acknowledgment (later, CATALOG section 9) | T | |

#### Answers to CATALOG section 13 questions for L2

- **`T?` rows:** all confirmed transactional (`welcome`, `welcome-family`, `welcome-coparent`, `family-digest`, `price-increase`, `plus-quiet`, `policy-update`) subject to the conditions above. `family-digest` also needs one-click unsubscribe for Gmail reasons, not CAN-SPAM reasons.
- **`policy-update` and billing notices need no postal address line.** Correct under CAN-SPAM. (See 3.3 for why we still recommend publishing the address in the Terms and policies, which D-004 already requires.)
- **Acknowledgment emails and 17602(a)(3):** satisfied if `trial-started` and `plus-started` carry fields A1 to A10 in section 5.2. The email itself is "capable of being retained".
- **Annual reminder content:** satisfied if `anniversary-reminder` (and the annual-plan notices) carry the product, the amount and frequency of charges, and how to cancel (section 5.2, row R).

---

## 2. Footer requirements per class

| Element | Transactional (all v1.0 mail) | Subscription-transactional (`family-digest`) | Commercial (`news.`, waitlist) | Source |
|---|---|---|---|---|
| Accurate From, Reply-To, routing | Required | Required | Required | 7704(a)(1) (all three classes) |
| Subject reflects content | Required by Section 5 FTC Act and good sense; not CAN-SPAM-specific | Same | Required, 7704(a)(2) | FTC guide; statute |
| Why you got this (`emailLegal.whyYouGotThis`) | Recommended | Recommended | Recommended | Ours; supports "clear and conspicuous" opt-out context |
| Reply to reach a person (`emailChrome.footer`) | Recommended | Recommended | Recommended | CATALOG principle 7 |
| Help and Privacy links | Recommended | Recommended | Recommended | Washington MHMDA wants the CHD policy linked from every web page that collects data, not emails; Privacy link is enough here |
| Unsubscribe line in body (`emailLegal.unsubscribe`) | **Never** (nothing to unsubscribe from; a dead link misleads) | Required (stops the digest) | **Required** | 7704(a)(3), (a)(5)(A)(ii); Gmail |
| `List-Unsubscribe` + `List-Unsubscribe-Post` headers | **Never** | Required | **Required** | RFC 8058; Gmail and Yahoo |
| Postal address (`emailLegal.postalLine`) | Not required. Recommend **omit** until a PO box or PMB exists, then optional | Not required; optional | **Required** | 7704(a)(5)(A)(iii) |
| "This is an advertisement" | Never | Never | Not required when the recipient opted in (double opt-in); required for anything sent without opt-in, which we never do | 7704(a)(5)(A)(i) and (B) |
| Email preferences link | Not at v1.0 | Yes | Yes | Chrome links |
| Billing fields (section 5) | Billing notices only | n/a | n/a | 17602 and state laws |

D1's `<EmailFooter kind>` and B3's `emailChrome.footer` already follow this split. The content test in `packages/content/test/emails.test.ts` should add: a `transactional` email must not contain `{unsubscribe}` or `{unsubscribeUrl}`; a `commercial` email footer must contain both `{unsubscribe}` and `{postalAddress}` (this is LEGAL-REQ-053's acceptance test).

---

## 3. Postal address

### 3.1 The rule

Commercial email must include "a valid physical postal address of the sender" (15 U.S.C. 7704(a)(5)(A)(iii)). The FTC rule defines it as "the sender's current street address, a Post Office box the sender has accurately registered with the United States Postal Service, or a private mailbox the sender has accurately registered with a commercial mail receiving agency that is established pursuant to United States Postal Service regulations" (16 CFR 316.2(p), eCFR, opened 3 Oct 2026). The FTC compliance guide says the same in plain words.

### 3.2 For an individual publisher (D-004)

Options, cheapest first:
1. **USPS PO box** at a local post office. Meets 316.2(p). Some carriers (UPS, FedEx) cannot deliver to it; fine for mail. Rent varies by size and location (not checked).
2. **Private mailbox (PMB) at a commercial mail receiving agency** (a UPS Store or a virtual mailbox service). Meets 316.2(p) if registered with USPS through **PS Form 1583**, which requires identity documents and verification (secondary sources; the form itself at about.usps.com/forms/ps1583.pdf was found but not opened: **UNVERIFIED** detail). USPS addressing rules require the "PMB" (or "#") designation in the address (secondary; **UNVERIFIED** against the Domestic Mail Manual). A virtual mailbox also gives a street-style address that can serve the Terms (Apple's EULA minimum term asks for the developer's address, Terms 26.1(h)) and the privacy notices.
3. **Home address:** legal, but D-004 rules it out, and it would be published in every commercial email and in the Terms. Do not use it.

Recommendation: a PMB at a commercial mail receiving agency (option 2) because one address can then serve CAN-SPAM, the Terms, the Privacy Policy, the CHD policy and the App Store contact, and it can receive certified mail and legal process more reliably than a PO box. Counsel to confirm the address works for service of process and for any state notice that asks for a "physical" address.

### 3.3 What transactional mail needs

Nothing. Transactional and relationship messages are exempt from the postal-address, opt-out and ad-label requirements; only the header-accuracy rule applies to them (7704(a)(1)). **So v1.0 can launch with no postal address in any email.** Honest note: the Terms, Privacy Policy and CHD policy still need `{CONTACT_ADDRESS}` for other reasons (D-004, Terms 26.1(h), 27.8), so the founder needs the PMB before those documents are published, which is before launch in practice. Once it exists, adding it to transactional footers is optional; we recommend leaving it out of transactional mail to keep footers short, and it must never be the home address.

### 3.4 Related: trading under a brand name as an individual

The From line says "Early Letters", while the legal sender is the founder personally. CAN-SPAM asks that the From line identify the person or business who sent the message (FTC guide); a trading name the public knows is generally fine. **For counsel (UNVERIFIED, from general knowledge, not opened):** California requires a person doing business under a name other than their own surname to file a fictitious business name statement with the county (Bus. & Prof. Code 17900 and following). If that applies, file it before launch; it also makes "Early Letters" the clearly identified sender name for D-004 notices.

---

## 4. Unsubscribe, preferences and suppression

### 4.1 The legal floor (commercial mail only)

From 15 U.S.C. 7704 and 16 CFR 316.5, and the FTC compliance guide (opened 3 Oct 2026):
- A clear and conspicuous explanation of how to opt out, and a working mechanism (reply email or an internet-based mechanism).
- Honour the request within **10 business days** (7704(a)(4)).
- The mechanism must work for **at least 30 days** after the message is sent.
- No fee, no information beyond the email address and preferences, and no steps other than replying to an email or visiting **a single web page** (316.5).
- Never sell or transfer an opted-out address, "even in the form of a mailing list" (FTC guide).
- Penalty shown by the FTC guide today: up to **$53,088 per email** (FTC page, opened 3 Oct 2026).

### 4.2 Our standard (stricter than the floor)

| Rule | Standard |
|---|---|
| Honouring time | Immediately on the one-click POST or button press; never more than **48 hours** (Gmail's recommended timeline; Yahoo says "within 2 days"). |
| Lifetime of the link | The signed URL never expires (well beyond 30 days). |
| Mechanism | RFC 8058 headers on every commercial and subscription email, plus the body link (`emailLegal.unsubscribe`) to one page with one button (`emailLegal.unsubscribePage`). No sign-in, no "why are you leaving" survey before the button. |
| Body link behaviour | The body link opens the page; the **button** does the unsubscribe (a POST). Do not unsubscribe on GET: link scanners and mail security tools prefetch links and would unsubscribe people who never asked. The header URL takes the RFC 8058 POST directly. |
| Scope | Unsubscribe removes the person from **that list** (newsletter, or digest). It never touches transactional mail and never touches their account. Gmail confirms one-click removes only "the mailing list associated with the message". |
| Mailto | Optional extra in `List-Unsubscribe`; it does not count for Gmail (FAQ). |
| Replies | A reply saying "stop" or "unsubscribe" is an opt-out under CAN-SPAM: the shared inbox runbook processes it within 2 business days. |

### 4.3 RFC 8058 header specification (for the sender)

Verified against RFC 8058 (rfc-editor.org, opened 3 Oct 2026):
```
List-Unsubscribe: <https://earlyletters.com/email/unsubscribe/{signedToken}>, <mailto:unsubscribe@news.earlyletters.com?subject={signedToken}>
List-Unsubscribe-Post: List-Unsubscribe=One-Click
```
- `List-Unsubscribe` MUST contain one HTTPS URI; it may add a mailto.
- The URI MUST identify the recipient and the list (the signed token carries both; it must not contain the email address in clear).
- `List-Unsubscribe-Post` MUST be exactly `List-Unsubscribe=One-Click`.
- The message MUST carry a valid **DKIM signature covering both headers** (Resend signs with DKIM; L3 to confirm Resend includes custom headers in the signed set: **UNVERIFIED**).
- The receiver POSTs with no cookies or auth; the endpoint MUST NOT redirect.
- Resend: add both headers through the `headers` field of the send call (Resend docs, "Add unsubscribe to transactional emails", opened 3 Oct 2026). If we later use Resend Broadcasts with Topics, Resend "automatically provides an unsubscribe flow"; whether it sets RFC 8058 headers itself is **UNVERIFIED**, so check a delivered message's raw headers before relying on it.

### 4.4 Gmail and Yahoo sender rules (as they bear on us)

Verified 3 Oct 2026 against Google's "Email sender guidelines" (support.google.com/mail/answer/81126), the "Email sender guidelines FAQ" (support.google.com/a/answer/14229414), Google's "Email subscription guidelines for senders" (support.google.com/mail/answer/15263077) and Yahoo's "Sender Best Practices" (senders.yahooinc.com/best-practices).

| Rule | All senders | Bulk senders (5,000+ a day to Gmail; status is permanent once reached) |
|---|---|---|
| SPF or DKIM | Required | **Both** required |
| DMARC | Recommended | Required, at least `p=none`, with From aligned to SPF or DKIM domain |
| TLS, valid forward and reverse DNS, RFC 5322 format | Required | Required |
| Spam rate (Postmaster Tools) | Below 0.3%; aim for under 0.1% | Same; mitigation only after 7 days under 0.3% |
| One-click unsubscribe | n/a | Required for **marketing and promotional messages** and **subscribed messages**. "Transactional messages are excluded from this requirement", with password resets, reservation confirmations and form-submission confirmations given as examples (Google FAQ). "Messages sent for legal or other reasons, such as an explicit action or request by the user, aren't subscription messages" (subscription guidelines). |
| Honour unsubscribes | | Within **48 hours** (Google); within 2 days (Yahoo) |
| Separate streams | | Google: send subscription and non-subscription mail "from different email addresses". Yahoo: do not send marketing from the IPs used for transactional mail. |
| Enforcement | Google FAQ: "Starting November 2025, Gmail is ramping up its enforcement on non-compliant traffic", including temporary and permanent rejections. | |

We are far below 5,000 a day at launch, but these rules cost little and protect the sign-in stream, which is the one that matters most. Recommendations: SPF, DKIM and DMARC aligned on `earlyletters.com` from day one (L3); DMARC `p=none` with reports at first, tighten later; commercial mail only from `news.earlyletters.com` with its own From address, so a newsletter complaint never hurts sign-in delivery.

### 4.5 Suppression handling in Resend

What Resend does (Resend docs, "Email suppressions", opened 3 Oct 2026):
- An address is suppressed on a **hard bounce**, a **spam complaint**, or **manually**.
- Suppressions are **account-wide**: "skipped across all your domains and subdomains when sending transactional or Broadcast emails".
- They stay until removed (dashboard or API); a new bounce or complaint re-suppresses.

What this means for us:
1. **Never put a newsletter or digest opt-out into Resend's suppression list.** It would stop that person's sign-in links, security notices and legally required renewal notices. Marketing opt-outs live in our own `email_list_optouts` table (hashed address plus list id) or in Resend Contacts and Topics on the `news.` audience. (Resend's Topic labels are easy to misread: its docs describe an "Opt-in" topic as one everyone receives unless they unsubscribed, and "Opt-out" as one nobody receives unless they subscribed. Use the setting that means "nobody receives unless subscribed" for any newsletter: **verify in the dashboard before first use**.)
2. **A spam complaint on a transactional email suppresses that address everywhere**, including future renewal notices. The catalog's rule 10.4 already handles the visible part (a quiet Settings row; the in-app card carries the same facts). Add to the support runbook: when such a person writes in, explain, and remove the suppression only at their request (it will re-suppress automatically if they complain again).
3. **Hard bounces** (including an Apple relay address whose owner turned forwarding off) are handled the same way: the in-app card is the fallback for every D-022 notice, which is why every D-022 notice has a card.
4. **Our own suppression record.** Keep opted-out addresses as a salted SHA-256 hash of the normalised address, indefinitely (ENGINEERING_REQUIREMENTS retention table: "Email suppression hashes: Indefinitely"), including after account deletion, so a deleted user who re-joins the waitlist with the same address is checked. Counsel to confirm keeping the hash after a deletion request (CCPA allows retention to comply with a legal obligation; not opened here).
5. **Resend content storage.** Resend stores message content by default; turning it off is a paid add-on with eligibility rules ($50 a month; Pro or Scale for a month; active website; over 3,000 sends under 5% bounce: Resend knowledge base, opened 3 Oct 2026). Resend's pricing page shows "30 days" data retention on every self-serve plan (opened 3 Oct 2026; whether that covers message bodies is **UNVERIFIED**). Section 7 makes this low-risk by keeping content out of email.

### 4.6 Never unsubscribe from transactional

Sign-in links, security notices, deletion receipts, policy-change notices and every D-022 notice go to everyone with an account, always, including Apple relay users and people who opted out of news. That is lawful (CAN-SPAM does not reach transactional opt-outs) and in some cases required (17602 notices, policy-change notice promised in Privacy Policy section 19 and Terms 25.3). The transactional footer explains this in one line (`whyYouGotThis.transactional`) instead of showing an unsubscribe link.

The only way to stop transactional email is to close the account. Keep the counts low instead (CATALOG section 10).

---

## 5. Auto-renewal notices (D-022)

### 5.1 Status of the law, 3 Oct 2026

- **California ARL**, Bus. & Prof. Code 17600 and following, as amended by AB 2863 for contracts entered, amended or extended on or after 1 July 2025. Text read through Justia (2025 California Code; the official leginfo site refused the connection). Requirements we rely on:
  - (a)(3) acknowledgment with the offer terms, cancellation policy and how to cancel, "capable of being retained";
  - (a)(6) keep proof of consent for 3 years or 1 year after termination, whichever is longer;
  - (b)(1) free trial or promotional period **over 31 days**: notice "at least 3 days before and at most 21 days before" it ends, stating that it will renew unless cancelled, the length of the renewal term, the amount and frequency of charges, and how to cancel;
  - (b)(2) initial term of **one year or longer**: notice "at least 15 days and not more than 45 days before" renewal, same contents;
  - (d) online cancellation by a prominent direct link or button, or an immediately accessible termination email;
  - (e) save offers allowed only on terms that do not obstruct the cancellation (we make none);
  - (g) price change notice "no less than 7 days and no more than 30 days" before the change, clear and conspicuous, with how to cancel, "capable of being retained";
  - (h) an annual reminder with the product, the frequency and amount of charges, and how to cancel. (Paraphrased from Justia; the exact wording of (h) on timing and medium should be read by counsel against the official text: **partly UNVERIFIED**.)
- **Other states** (New York GBL 527-a, Virginia 59.1-207.46, Utah, Massachusetts 940 CMR 38.00, Colorado, Minnesota, New York City): taken from Lawyer 1's memo (`docs/legal/memos/lawyer-1.md`, H1, M2, M8), not re-opened by L2. D-022's table is built to fit all of them at once.
- **FTC Negative Option Rule ("click to cancel"):** the 2024 amendments were **vacated by the Eighth Circuit on 8 July 2025** for procedural failures; the FTC did not appeal (Crowell client alert; Mondaq/Venable). The FTC restarted with an **advance notice of proposed rulemaking released 11 to 18 March 2026**, comments due **13 April 2026** (Cooley, 19 Mar 2026, cites Federal Register document 2026-04952; Covington, March 2026). We found **no proposed rule (NPRM) as of 3 Oct 2026** (search only; **UNVERIFIED** that none exists). With the 2024 amendments gone, the original Negative Option Rule (16 CFR 425, prenotification plans) is in force again, which does not fit app subscriptions closely; **ROSCA** (15 U.S.C. 8401 to 8405) and FTC Act Section 5 still apply to online subscriptions. ROSCA asks for clear disclosure before billing, express informed consent and a simple cancellation mechanism; our design already meets the stricter California rules.
- **Apple as merchant of record:** whether these duties fall on us or on Apple is open (Lawyer 1, question 1). We assume they fall on us and comply.

### 5.2 Required fields, by notice

Field codes. Under D-080 (founder, 3 Oct 2026) every date and the plan come from the subscription status the app reports (plan, trial end date, renewal date, cancelled flag), never from list prices in code; the status carries no price, so `{price}` is the published price of the reported plan (US only, Brief decision 3). No App Store Server Notifications and no receipts reach us. Counsel questions: `docs/legal/COUNSEL_PACKET.md`.

| Code | Field | Placeholder (suggested) | Why |
|---|---|---|---|
| A1 | Plan name exactly as sold ("Early Letters Plus, yearly" or the store display name) | `{planName}` | 17602 product identification; Subscription terms use "Plus Monthly" and "Plus Annual". **Fix:** D2's fixtures say "Book Plus"; pick one name and use it in the app, the store and every email. |
| A2 | What Plus includes, one line | static copy | 17602(h) "product or service"; Terms 14.6 annual reminder |
| A3 | Price and billing period ("$29.99 a year") | `{price}` | (b), (g), (h) |
| A4 | It renews automatically until cancelled | static copy | (b)(1), (b)(2); NY; Terms 14.4 |
| A5 | Length of the renewal term ("each year", "each month") | static, by plan | (b)(1), (b)(2) |
| A6 | The date it renews or the trial ends (`E`) as a calendar date in the user's time zone | `{renewalDate}` or `{trialEndDate}` | (b); Terms 14.6; CATALOG principle 6 |
| A7 | The last day to cancel to avoid the charge (from `C = E - 24h`) | `{cancelByDate}` | Massachusetts "date to cancel by"; NY windows keyed to `C`; Terms 14.5 |
| A8 | How to cancel, in words, plus a direct link | `{manageUrl}` and `{cancelHelpUrl}` | 17602(d); LEGAL-REQ-048 ("every notice email includes the same instructions and a link to a web page explaining how to cancel") |
| A9 | Cancellation policy: Plus keeps working until the period ends; no partial refunds unless the law or Apple says otherwise; refunds through Apple | static copy | (a)(3) "cancellation policy"; Subscription terms "Refunds" |
| A10 | Who charges them (Apple, through their Apple Account) and the date they agreed | `{agreedDate}` (acknowledgment only) | (a)(3); D-001; LEGAL-REQ-049 consent record |
| A11 | Letters and recordings stay free to read, play and export if Plus ends | static copy | Our promise (Terms 13.3); not a legal field, keeps the notice calm |
| A12 | How to reach a person | footer | |
| P1 to P4 | Price change only: old price, new price, the date it takes effect, that it will not renew at the new price unless they agree in the App Store | `{oldPrice}`, `{newPrice}`, `{effectiveDate}` | 17602(g); Terms 14.8; NY (Lawyer 1 M1) |

| Notice (D-022 row) | id | Must carry | Notes |
|---|---|---|---|
| Acknowledgment | `trial-started` | A1 to A12, plus trial length, the date of the first charge and its amount | 17602(a)(3) acknowledgment. Terms 14.6 promises "the date it ends, the date to cancel by, the price after, and how to cancel". Must go out for every trial and purchase, within 1 hour. Subject must be factual ("Your Plus free trial has started"). |
| Acknowledgment | `plus-started` | A1 to A6, A8 to A12 (A7 as "cancel at least 24 hours before {renewalDate}") | As above. |
| Trial week | `trial-ending-week` | A1, A3 to A8, A11 | Courtesy and Virginia (Lawyer 1). |
| Trial long | `trial-ending-long` | A1, A3 to A8, A11 | 17602(b)(1): 3 to 21 days. Window `[E-21d, E-16d]` is inside it. |
| Trial final | `trial-ending-final` | A1, A3 to A8, A11 | Terms promise "at least 3 days before the last day to cancel". The one push carries no price or name beyond "Your free trial ends on {date}". |
| Annual renewal, long | `annual-renewal-long` | A1 to A8, A11 | 17602(b)(2) 15 to 45 days; window `[E-31d, E-30d]` fits every state in D-022. |
| Annual renewal, short | `annual-renewal-short` | A1, A3 to A8, A11 | Courtesy. |
| Anniversary reminder | `anniversary-reminder` | A1, A2, A3, A5, A8 | 17602 annual reminder: product, frequency and amount of charges, how to cancel. Terms 14.6 promises "what Plus is, what it costs, how often you are charged, and how to cancel". Monthly plans; annual plans get this content in `annual-renewal-long`. |
| Price increase | `price-increase` | A1, A3, A6, A8, A11, P1 to P4 | 17602(g) 7 to 30 days; D-022 window `[-30d, -7d]`. Only with the store's opt-in consent flow (Lawyer 1 M1). Whether a price decrease also needs a notice: counsel (5.6.3). |
| (not D-022) | `plus-cancelled` | A1, the date Plus ends, A11; no price needed | Confirms the cancellation; no offer. Note: 17602(d) cancellation is Apple's screen; this email is a courtesy and a record. |
| (not D-022) | `plus-ended` | A1, A11 | |
| (not D-022) | `account-deleted`, `account-deletion-scheduled` | "Deleting your account does not cancel Plus", A8 | DATA-REQ-022; Subscription terms "How to cancel". |

### 5.3 Two details that decide compliance

1. **The cancel-by date.** `C` is a UTC instant (`E - 24h`). If we print only `C`'s date, a user in Pacific time could act late on that date, after `C` in UTC, and be charged. Rule for the sender: `{cancelByDate}` = the last calendar day, **in the recipient's time zone**, that ends before `C`. If the time zone is unknown, compute it in Hawaii time (UTC-10), the westernmost time zone of a US App Store user we expect, which gives the earliest, safest date. Test it in the scheduler suite (LEGAL-REQ-047) with DST.
2. **Same channel, always sent.** These notices go even to people who opted out of news, to Apple relay addresses, and when push is off. The email is the legal channel; the in-app card is the fallback.

### 5.4 What billing emails must never do

- No offer, discount, "are you sure", or "here is what you will miss" in any billing email (CATALOG never-send list). 17602(e) tolerates save offers only alongside an unobstructed cancel path; we make none, which also keeps the emails transactional (section 1).
- No countdowns ("3 days left"): dates only (VOICE.md, CATALOG principle 6).
- No hiding the price in an image or footnote: A3 sits in the body text near A6.

### 5.5 Review of C2's `billing.en.ts` (as of 3 Oct 2026 07:55)

Every billing email checked against 5.2. All are transactional; none contains a promotional sentence or an offer. Findings:

| id | Result | Change requested (C2) |
|---|---|---|
| `trial-started` | Has A1, A3 to A8, A10, A11; refunds line | Add `PLUS_INCLUDES` (A2: the acknowledgment should state what was bought) and a cancellation-policy line: "Unless the law or Apple's policy says otherwise, there are no partial refunds for unused time." (A9, Subscription terms "Refunds"). **Applied 3 Oct 2026 evening (LGL-12).** |
| `plus-started` | Same as above | Same two additions. **Applied.** |
| `trial-ending-week`, `trial-ending-long`, `trial-ending-final` | Complete for 17602(b)(1) | None |
| `annual-renewal-long` | Complete for 17602(b)(2) and the annual reminder | None |
| `annual-renewal-short` | Complete | None |
| `anniversary-reminder` | Complete for the annual reminder | None |
| `price-increase` | Has P1 to P4, A8 | None |
| `plus-cancelled`, `plus-ended` | Informational; no offer | None ("you can turn renewal back on" is a fact, not a pitch) |
| `plus-quiet` | Transactional; helps a payer stop | None; keep it free of feature lists |
| File header | `{cancelByDate}` is described as "E minus 24 hours, as a date (C)" | Change the description to the 5.3 rule (last local day that ends before `C`), so the sender does not print a date a Pacific-time user could miss. **Applied.** |
| File header | `{manageUrl}` marked UNVERIFIED | Point it at our `/cancel` help page (section 11, D2 row). **Applied in the header; the `/cancel` web route and the fixture value are still to change (web and D2 lanes).** |
| All reminders (added 3 Oct 2026 evening) | D-080 sees a cancellation made in iOS Settings only on the next app open | Every trial and renewal reminder carries "If you have already cancelled, there is nothing to do." **Applied.** |

### 5.6 Open for counsel

1. **Massachusetts monthly repetition (Lawyer 1 M8).** If 940 CMR 38.00 requires the key terms to be repeated with each monthly bill, the catalog's "no receipts" decision (E-6) fails for monthly plans. Options: a short monthly renewal email from us (adds a monthly email to every monthly payer), or counsel's view that Apple's receipt satisfies it. **Decision needed before launch.**
2. Whether the D-022 table meets New York's "same medium" and Colorado's one-step cancellation when the cancel path is Apple's screen (Lawyer 1 M2).
3. Whether a price **decrease** or a change of what Plus includes needs a 17602(g) or Terms 25.3 notice.
4. Whether the acknowledgment must be sent when Apple already sends its own subscription confirmation (we recommend sending ours regardless: we are the party the statute names).

---

## 6. Records, consent and the future newsletter

### 6.1 What to keep, and for how long

| Record | Contents (no message body, no child data) | Keep | Why |
|---|---|---|---|
| Notice send log | account id, notice id, template version, window, scheduled and sent time, Resend message id, delivery status | 3 years, or 1 year after the subscription ends if longer (matches 17602(a)(6)) | Proof that each D-022 notice went out in its window |
| Template archive | every published version of every legal-sensitive template (billing, policy-update, deletion receipts) as rendered HTML and text, with dates | Same, per version | LEGAL-REQ-047 evidence; CR-050 "email templates archived per version" |
| Purchase consent | D-049 rows | Life of account plus 3 years (Privacy Policy section 10) | 17602(a)(6) |
| Newsletter consent | see 6.2 | While subscribed plus 3 years | Proof of affirmative consent |
| Opt-outs | salted hash of the address, list id, date | Indefinitely | 4.5 |
| Resend logs | Resend's own | Resend's retention (30 days shown on pricing; scope **UNVERIFIED**) | Processor; list in subprocessors.md with its region and retention (currently `{EMAIL_PROVIDER}`, `{REGION}`, `{RETENTION}` placeholders: fill with Resend, us-east-1, and the confirmed retention) |

CAN-SPAM itself has no record-keeping rule; these records are for California and for our own proof.

### 6.2 Consent capture for a newsletter (later)

- **Separate stream:** `news.earlyletters.com`, its own Resend domain, its own From (`Early Letters <news@news.earlyletters.com>`), its own DKIM and return path, registered with Apple's relay (section 9). Never send news from `earlyletters.com` or `hello@`.
- **Opt-in only, never bundled:** an unticked checkbox or a separate form; never a condition of using the app; never inferred from having an account or from the waitlist; not shown before the 18+ confirmation in the app.
- **Plain consent text** stating what they will get and how often, for example: "Send me occasional news about Early Letters. About once a month. Unsubscribe in one step." (C2 to write; L2 to review.)
- **Record:** normalised email, list id, consent text version, where it was given (form URL or app screen id), time of request, time of confirmation. Do not store IP addresses unless counsel asks for them; the confirmation click is our proof.
- **Double opt-in: recommended.** CAN-SPAM does not require it. It proves consent, stops someone signing up another person's address (or a mistyped one), and protects the domain's spam rate. The confirmation email (`news-confirm`) has no promotion, expires its link in 7 days, and an unconfirmed address is deleted after 30 days.
- **Privacy Policy:** before the first newsletter, add the newsletter to sections 3 to 5 (what, why, legal basis: consent) and to the CCPA table, with retention.

### 6.3 The waitlist

The waitlist form says "We will write when Early Letters is ready for you." That is consent to **one** launch email, not to a newsletter. Recommendations:
- Send exactly one `waitlist-ready` email, with the commercial footer and RFC 8058 headers. Offer the newsletter inside it as an opt-in link, not an automatic enrolment.
- Then delete waitlist addresses on the data-policy clock (launch invite plus 12 months, or sooner).
- **CCPA notice at collection** (11 CCR 7012: "at or before the point of collection", categories, purposes, whether sold or shared, retention, or a link straight to that section of the privacy policy, opened via Cornell LII 3 Oct 2026): the form should carry one line under the field, for example "We will use this only to tell you when Early Letters is ready. Privacy Policy." with a link to the notice-at-collection section. Owner: D3 and C3 (site copy), not this lane.

---

## 7. Data minimisation in email

### 7.1 Question

Should email bodies and subjects never contain letter text, transcripts, audio or the child's name?

### 7.2 What the repo already says

- CLAUDE.md privacy rules name analytics, logs and crash reports, not email.
- LEGAL-REQ-014 bans entry text, transcripts, audio, child names and tokens in "email subject lines" (subjects only).
- DATA_CLASSIFICATION: L4 (child names, letter content) never in an "email subject"; its processor table says of the email provider "Transactional only; no content in subjects or bodies".
- Privacy Policy section 8 (service providers) tells users the email provider gets "Email address, message content we send" for "sign-in, trial and renewal emails"; section 5 says information about a child is never used for marketing.
- CHD notice section 3: consumer health data is used only to provide the book. Section 5 says processors receive "what each needs to run its part of the service" (hosting, sync, transcription, backups); sending email is not one of those purposes.
- CATALOG decision E-1: no `{child}` in any email.

### 7.3 Recommendation: make it a hard rule, bodies and subjects alike

**Never in any email subject, preheader, body, attachment or link text:**
1. Letter text, titles or excerpts, transcripts or their fixes.
2. Audio or photos, as attachments, inline images or playable links. A link to open the app is fine; a link that serves the media without signing in is not.
3. The child's name, nickname, birthday, age, month of age, due date or pregnancy week.
4. Anything about health (CHD policy), safety tiers (never leave the phone, LEGAL-REQ-015) or the book's contents.
5. Other family members' letters or counts of them.

**Allowed:** the recipient's own email address; the adult display name of someone in the same book, only to members of that book (E-2); plan, price and dates; device type and approximate time for security notices; "your book" or "the book {parentName} keeps".

Why:
- **It keeps three published documents true.** The Privacy Policy's processor row (section 8), DATA_CLASSIFICATION's processor row and the CHD notice's purposes (sections 3 and 5) all assume email carries no content and no health data. Putting a child's name or a letter in email would make them inaccurate, which is itself a deceptive-practice risk.
- **Consumer health data.** Washington's MHMDA treats letters that mention health, and the due date, as consumer health data (Lawyer 2 H2; RCW 19.373.010 as opened by Lawyer 2). Every copy we put into an email lands with Resend (stored by default; section 4.5) and in mailbox providers, adding processors and retention we would have to disclose and contract for. Keeping it out means the CHD notice needs no change.
- **Email is the least controllable channel.** It is forwarded, shared in family inboxes, previewed on lock screens, synced to work devices and kept forever. Our deletion promises (30-day undo, erase from backups) cannot reach a copy in someone's inbox.
- **Phishing resistance.** If our emails never contain content, a message that does is suspect.
- **Consistency with D-025** (no child names in server-sent push) and the brief's no-tracking rule.

Cost: copy is less personal ("your book" instead of a name), and a contributor in several books may not know which book a `family-book-closing` email means. Mitigation: name the parent ("the book {parentName} keeps") under E-2, and let the in-app card carry the child's name. Recommend the founder accept this cost.

Enforcement: extend `packages/content/test/emails.test.ts` to fail if any email string contains `{child}`, `{childName}`, `{letter...}`, `{transcript...}` or `{dueDate}` placeholders, and add the fixture-family canary ("Asha") to LEGAL-REQ-014's log scan for rendered emails. Recommend CLAUDE.md's privacy rules add "email" to the list (owner: PM; a one-word change outside this lane).

---

## 8. Other laws checked

| Law | Applies to our email? | Note |
|---|---|---|
| **CCPA/CPRA** | Indirectly | Email addresses are personal information collected at sign-in and on the waitlist; notice at collection is due there (11 CCR 7012), not in each email. The Privacy Policy already lists the email provider and email address. Emails themselves need no CCPA notice. Likely not a "business" at launch (Lawyer 2 M2); we comply voluntarily. |
| **Washington MHMDA** | Yes, by keeping it out | Section 7. The "homepage" link duty covers web pages that collect data and the download page (Lawyer 2 H2), not emails. Our emails link to the Privacy Policy, which links to the CHD policy. |
| **COPPA** | No | COPPA covers personal information collected online **from** children under 13. The FTC FAQ: "COPPA only applies to personal information collected online from children. It does not cover information collected from adults that may pertain to children" (FTC, "Complying with COPPA: Frequently Asked Questions", opened 3 Oct 2026). Every account holder is 18+ (D-006) and we never email a child (CATALOG never-send list). If we learn a user is under 13, COPPA duties start (same FAQ, actual knowledge). The amended COPPA Rule (April 2025) changes nothing here. |
| **California Bus. & Prof. Code 17529.5** (commercial email with falsified headers or misleading subjects) | Commercial mail only | From general knowledge, not opened (**UNVERIFIED**). Our header and subject rules already meet it. |
| **TCPA** | No | No SMS (CR-062). |
| **Apple App Review 4.5.4** | Push, not email | Promotional push needs opt-in; we send none. |

---

## 9. Apple private relay

Verified against Apple Developer Help, "Configure private email relay service", and Apple's "Communicating using the private email relay service" (both opened 3 Oct 2026), and Resend's "Sending to Apple Private Relay" (opened 3 Oct 2026).

- Register every sending domain, subdomain and address under Certificates, Identifiers and Profiles, Services, **Sign in with Apple for Email Communication**. Unregistered sources bounce: "email sent to the private relay service will result in a bounce message".
- Mail must pass **SPF** (envelope sender domain registered and matching exactly) or **DKIM** (`d=` matching the registered From domain).
- Resend says to register the domain **and** its return-path subdomain (`send.earlyletters.com` by default) and every From address.
- **Limit for an individual account: 32 email sources** (organisations: 100). That is ample (`earlyletters.com`, `send.earlyletters.com`, `hello@earlyletters.com`, later `news.earlyletters.com`, its return path and `news@`), but it is a D-004 consequence worth knowing.
- Relay addresses end in `@privaterelay.appleid.com` **or `@icloud.com`**: do not detect relay users by domain alone.
- Each relay address takes at most **100 emails a day**, counting replies. No issue for us.
- If the user turns off forwarding, the relay **rejects** all mail to that address. Handle as a hard bounce (4.5).
- **Replies from the human inbox:** when the founder replies to a relay user from `hello@`, that reply also goes through the relay. If the inbox sends through a different provider (for example Google Workspace), that provider's SPF must be in `earlyletters.com`'s SPF record, or its DKIM must sign as `earlyletters.com`, or the reply bounces. Owner: L3.
- Why this matters legally: D-022 notices and the Terms 25.3 change notice must reach Apple users, and many will hide their email. Without registration, every one of those legally required emails bounces.

---

## 10. Copy delivered: `packages/content/src/emails/legal.en.ts`

`emailLegal` exports the contract keys (`postalLine`, `unsubscribe`, `whyYouGotThis`) plus optional `unsubscribeLink` and `unsubscribePage`. All strings pass `packages/content/test/emails.test.ts` and the rules in `rules.test.ts` (checked 3 Oct 2026). The unsubscribe page wording tells people plainly that account emails continue, so nobody expects an unsubscribe to stop renewal notices.

---

## 11. Changes requested outside this lane

| Owner | Change |
|---|---|
| C2 | Add `waitlist-ready` (commercial) to the catalog; keep `welcome-*`, `plus-quiet` and `price-increase` free of any promotional sentence; billing templates carry the section 5.2 fields, including `{cancelByDate}` and `{cancelHelpUrl}`. |
| C1 | Keep `welcome` free of Plus, referral or review asks (it is transactional only while it stays that way). |
| D2 | Use one plan name everywhere (fixtures say "Book Plus", Subscription terms say "Plus Monthly" and "Plus Annual"). Fixture `manageUrl` uses `apps.apple.com/account/subscriptions`, which we could not confirm on an Apple page; Apple Support (support.apple.com/en-us/118428) gives `https://account.apple.com/account/manage/section/subscriptions`. Recommend `{manageUrl}` points to our own `/cancel` help page (LEGAL-REQ-048) which links to both. |
| D1 / content tests | Test: transactional emails contain no `{unsubscribe}`; commercial ones contain `{unsubscribe}` and `{postalAddress}`; no child, letter, transcript or due-date placeholders in any email. |
| L3 | SPF, DKIM, DMARC alignment; RFC 8058 headers on commercial mail only; confirm DKIM covers the custom headers; Apple relay registration including the human inbox's sending provider; never use Resend suppressions for marketing opt-outs; Resend content storage decision. |
| Backend | `{cancelByDate}` computation (5.3); notice send log and template archive (6.1); opt-out table with hashed addresses (4.5). |
| D3 / C3 | Notice-at-collection line on the waitlist form (6.3). |
| PM | Add "email" to CLAUDE.md's privacy rule list (7.3). Update subprocessors.md and Privacy Policy section 8 placeholders to Resend, us-east-1, confirmed retention. |
| Founder | PMB or PO box before the first commercial email and before the legal documents publish (3.2); fictitious business name statement question for counsel (3.4). |

## 12. Questions for counsel (about 1 hour)

1. Confirm the transactional classification of `welcome`, `welcome-family`, `welcome-coparent`, `plus-quiet` and `policy-update` (section 1.3). (10 min)
2. Massachusetts monthly-term repetition and whether the catalog must add a monthly renewal email (5.6.1). (15 min)
3. 17602(h) annual reminder: exact timing and medium, and whether `annual-renewal-long` satisfies it for annual plans (5.1). (10 min)
4. PMB at a commercial mail receiving agency for CAN-SPAM, the Terms (Apple EULA minimum terms) and service of process; fictitious business name statement (3.2, 3.4). (10 min)
5. Keeping hashed opt-out records after an account deletion request (4.5.4). (5 min)
6. Waitlist consent scope: one launch email only (6.3). (5 min)

## Sources (opened 3 Oct 2026 unless marked)

- FTC, CAN-SPAM Act: A Compliance Guide for Business: https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business
- 16 CFR Part 316 (eCFR): https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-316
- 15 U.S.C. 7702 and 7704 (Cornell LII): https://www.law.cornell.edu/uscode/text/15/7702 , https://www.law.cornell.edu/uscode/text/15/7704
- RFC 8058: https://www.rfc-editor.org/rfc/rfc8058
- Google, Email sender guidelines: https://support.google.com/mail/answer/81126 ; FAQ: https://support.google.com/a/answer/14229414 ; Email subscription guidelines: https://support.google.com/mail/answer/15263077
- Yahoo, Sender Best Practices: https://senders.yahooinc.com/best-practices/
- California Bus. & Prof. Code 17602 (Justia, 2025 code): https://law.justia.com/codes/california/code-bpc/division-7/part-3/chapter-1/article-9/section-17602/ (official leginfo page not reachable from this environment)
- FTC negative option status: Crowell, https://crowell.com/en/insights/client-alerts/clicking-all-the-right-boxes-ftc-moves-to-revive-click-to-cancel-rule-following-eighth-circuit-vacatur ; Cooley, https://www.cooley.com/news/insight/2026/2026-03-19-ftc-issues-new-advance-notice-of-proposed-rulemaking-on-negative-option-marketing ; Mondaq, https://www.mondaq.com/unitedstates/advertising-marketing-branding/1760248/ftc-relaunches-negative-option-rulemaking-with-new-questions-new-branding ; Covington (search result only), https://www.cov.com/en/news-and-insights/insights/2026/03/ftc-launches-new-rulemaking-on-the-negative-option-rule
- 11 CCR 7012 (Cornell LII): https://law.cornell.edu/regulations/california/11-CCR-7012
- FTC COPPA FAQ: https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions
- Apple, Configure private email relay service: https://developer.apple.com/help/account/capabilities/configure-private-email-relay-service/ ; Communicating using the private email relay service: https://developer.apple.com/documentation/signinwithapple/communicating-using-the-private-email-relay-service
- Apple Support, cancel a subscription: https://support.apple.com/en-us/118428
- Resend: suppressions https://resend.com/docs/dashboard/emails/email-suppressions ; unsubscribe headers https://resend.com/docs/dashboard/emails/add-unsubscribe-to-transactional-emails ; topics https://resend.com/docs/dashboard/topics/introduction ; Apple relay https://resend.com/docs/knowledge-base/sending-apple-private-relay ; content storage https://resend.com/docs/knowledge-base/how-do-i-ensure-sensitive-data-isnt-stored-on-resend ; pricing https://resend.com/pricing
- Secondary, not relied on for rules: USPS PS Form 1583 guides (search results only); Red Sift on Gmail enforcement.
- Not opened (general knowledge, **UNVERIFIED**): Cal. Bus. & Prof. Code 17529.5 and 17900 ff.; ROSCA text; 16 CFR 425; state ARL texts other than California (relied on Lawyer 1).
