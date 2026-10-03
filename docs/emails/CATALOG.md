# Email catalog

Owner: C2 (lifecycle and CRM content). Draft, 3 Oct 2026. Branch `feat/email-brand-library`.
Copy lives in `packages/content/src/emails/*.en.ts` (contract: `types.ts`, written by C1). Templates are built by D2. Compliance is confirmed by L2 (`docs/emails/COMPLIANCE.md`). Sending configuration is L3 (`supabase/auth-email.md`, `docs/emails/SECURITY.md`).

This is the full list of email the product sends, will send later, and will never send. If an email is not on this page, we do not send it.

## 1. Principles

1. **Email is for things a person needs to know or keep.** Receipts, legal notices, account and data changes, and the first hello. Nothing that exists to bring someone back into the app.
2. **One event, one email.** Every send carries an idempotency key (event + subject id + period). Nothing is ever re-sent because it was not opened; we do not know if it was opened (tracking stays off).
3. **Restraint over reach.** The app already has gentle, local, user-controlled reminders (`en.notifications`). Email never duplicates them. Push from the server is used for exactly one billing notice (D-022 trial final) and, from v1.1, family letters (C, D-025).
4. **No child names and no letter content in any email.** See section 2.
5. **No commercial email at v1.0.** Every v1.0 email is transactional or relationship mail. Commercial mail (a newsletter, product news) comes later, opt-in only, from a separate subdomain.
6. **Dates, not countdowns.** We write "on Tuesday, September 29, 2026", never "in 3 days" or "48 hours left". Dates follow D-028.
7. **A person answers.** Sender and reply-to are `Early Letters <hello@earlyletters.com>`. Never `no-reply@`.

## 2. Decisions this catalog makes (C2; founder and L2/L3 may override)

| # | Decision | Why |
|---|---|---|
| E-1 | **No `{child}` placeholder in any email body or subject.** Emails say "your book", "the book you write to", or "one of your books". | The child's name is L4 (PRD 7.10, DATA_CLASSIFICATION). D-025 already keeps it out of every server-sent push. Resend stores message content by default (turning storage off is a paid add-on with eligibility rules: resend.com/docs/knowledge-base/how-do-i-ensure-sensitive-data-isnt-stored-on-resend, opened 3 Oct 2026), and Privacy Policy section 15 lists the email provider as receiving identifiers only, not information about a child. Putting the name in email would make that table wrong. |
| E-2 | Adult display names (`{parentName}`, `{signsAs}`) are allowed only in emails to members of the same book. | They are L3, already shared with that person inside the app. |
| E-3 | Invites are never emailed by us. The parent shares the link from their own Messages or WhatsApp (`en.family.shareMessage`). | A note from Nani's own child beats a brand email; we would otherwise email an address whose owner never asked to hear from us. |
| E-4 | Contributors and co-parents who join by invite get a role-specific welcome (`welcome-family`, `welcome-coparent`) **instead of** C1's `welcome`. | C1's welcome is written for a parent starting a book; Nani is joining one. Needs the sender to branch on how the account was created (see section 9). |
| E-5 | Removing a family member, a member leaving, a declined invite and a letter kept aside send **no email**. One exception: when a co-parent asks to delete their account, the remaining parent gets `coparent-left` (founder instruction, 3 Oct 2026), because letters in the shared book disappear and silence would read as a fault. | PRD B F5 and F7: silence beats a rejection notice inside a family. |
| E-6 | Billing problems, renewal receipts and refunds send **no email from us**. Apple sends its own; the app shows Apple's in-app billing message. | Two emails about one charge confuse people and can read as a phishing pattern. |

## 3. Legend

- **Kind:** `T` transactional or relationship (CAN-SPAM primary purpose is the account or transaction). `C` commercial. `T?` = we believe transactional, **L2 must confirm**.
- **Priority:** `LB` v1.0 launch-blocking (legal requirement or P0 flow); `1.0` ships at v1.0, not a gate; `1.1`; `later`.
- **Sender (system):** `Auth` = Supabase Auth through Resend SMTP; `Fn` = Supabase Edge Function calling the Resend API; `Ops` = support sends the template by hand from the shared inbox (runbook). From address is always `Early Letters <hello@earlyletters.com>`.
- **Channels:** what goes out for the event. `card` = in-app card or sheet; `push` = server push. "Email only" means no push, by design.
- **Owner:** copy / template / send logic.

## 4. Auth (copy: C1)

Listed so the catalog is complete. C1 owns the copy in `auth.en.ts`; ids are C1's.

| id | Trigger | Sender | Kind | Channels | Priority | Cap | Owner |
|---|---|---|---|---|---|---|---|
| `sign-in-link` | Email entered on the sign-in sheet (A-REQ-018): link plus 6-digit code | Auth | T | Email only | LB | Resend after 60 s; 5 per address per hour (A-REQ-025) | C1 / D2 / Supabase config (L3) |
| `verify-email` | First sign-in with a new address (confirm email) | Auth | T | Email only | LB | As above | C1 / D2 / L3 |
| `account-create-attempt` | Sign-up with an address that already has an account (enumeration-safe) | Auth | T | Email only | LB | 1 per address per hour | C1 / D2 / L3 |
| `welcome` | First successful sign-in of a parent who starts a book | Fn | T? (relationship; no promotion inside) | Email only | 1.0 | Once per account, ever | C1 / D2 / backend |
| `sign-in-trouble` | "Having trouble?" on the check-your-email screen | Auth or Fn | T | Email only | LB | Same limits as sign-in | C1 / D2 / L3 |
| `reauthenticate-code` | Re-authentication before account deletion when the session is older than 24 h and no device passcode (DELETION spec 2.6.1 step 5; Supabase Reauthentication template) | Auth | T | Email only | LB | Same limits as sign-in | C1 / D2 / L3 |
| `apple-account-linked` | Sign in with Apple added to an existing account | Fn | T | Email only | 1.0 | Per event | C1 / D2 / security |
| `email-changed-old-address`, `email-changed-new-address` | User changes their sign-in email (Supabase Change Email template; notice to the old address, confirmation to the new) | Auth | T | Email only | 1.0 | Per request | C1 / D2 / L3 |
| `new-device-sign-in` | Sign-in on a device not seen before | Fn | T | Email only | 1.0 | At most 1 per device; never for the first device | C1 / D2 / security |
| `google-account-linked` | Sign in with Google added (founder decision 4, Oct 3) | Fn | T | Email only | 1.0 | Per event | C1 / D2 / security |
| `passkey-added` | A passkey is added after sign-in (founder decision 4; content review CNT-08) | Fn | T | Email only | 1.0 | Per event | C1 / D2 / security |

## 5. Onboarding and lifecycle (copy: C2, `lifecycle.en.ts`)

There is deliberately almost nothing here. No drips, no tips series, no re-engagement.

| id | Trigger | Sender | Kind | Channels | Priority | Cap | Owner |
|---|---|---|---|---|---|---|---|
| `welcome-family` | First sign-in that came from accepting a Family (contributor) invite. Replaces `welcome` | Fn | T? | Email only (the app shows the contributor welcome screen) | 1.1 (v1.0 family is co-parent only, founder decision 5) | Once per account, ever | C2 / D2 / backend |
| `welcome-coparent` | First sign-in that came from accepting a Co-parent invite. Replaces `welcome` | Fn | T? | Email only | 1.0 | Once per account, ever | C2 / D2 / backend |
| `news-confirm` | Opt-in to a future newsletter (double opt-in) | Fn on `news.` subdomain | C | Email only | later | Once per opt-in | C2 / D2 / L2 |
| `book-printed` | A printed book (Year One) ships | Fn | T | Email + card | later (D-010) | Per order | C2 / D2 / print |

## 6. Family and invites (copy: C2, `family.en.ts`)

| id | Trigger | Sender | Kind | Channels | Priority | Cap | Owner |
|---|---|---|---|---|---|---|---|
| `family-book-closing` | A sole parent deletes a book that has contributors (B-REQ-016, DATA-REQ-053). Sent to each contributor within 1 hour | Fn | T | Email + card (no push) | 1.1 (no contributors at v1.0, D-057) | 1 per contributor per deletion request | C2 / D2 / privacy engineer |
| `family-book-restored` | The parent cancels that deletion within 30 days. Sent only to people who got `family-book-closing` | Fn | T | Email + card | 1.1 | 1 per contributor per request | C2 / D2 / privacy engineer |
| `family-letter` | A family letter waits for approval | push (`en.notifications.familyLetter`) | n/a | **Push and in-app only. No email.** | n/a | C owns timing | C |
| `family-added` | A parent adds a contributor's letter to the book | push (`en.notifications.familyAdded`) | n/a | **Push and in-app only. No email.** | n/a | C owns timing | C |
| `family-digest` | Opt-in weekly email of new family letters for parents who do not use push | Fn | T? | Email, opt-in only, off by default | later | 1 per week, only when something arrived; no counts in the subject | C2 / D2 / backend |
| `family-export-ready` | Server export link for contributors whose book is being deleted (DATA-REQ-054, server export) | Fn | T | Email + card | 1.1 (BL-309) | Per export | C2 / D2 / privacy engineer |

Not sent, by decision E-3 and E-5: invite emails, invite reminders, invite expired, invite declined, member removed, member left, letter kept aside.

## 7. Billing and subscription (copy: C2, `billing.en.ts`)

**Trigger (D-061, founder, 3 Oct 2026; un-parks this section).** The app reports subscription **status only** to our server: plan, trial end date, renewal date and a cancelled (renewal off) flag. It reports when a purchase or trial completes in the app and on each launch. Never payment or card data, never receipts, no App Store Server Notifications, and the server still does not enforce Plus. Only the device whose transaction is the person's own purchase reports, so Family Sharing members get no billing email. A cancellation in iOS Settings is seen on the next app open, so every reminder carries "If you have already cancelled, there is nothing to do." `{price}` comes from the published price of the reported plan (US only); a price increase cannot be seen from the status, so `price-increase` stays later.

Every notice in D-022 is here. Schedule, windows and suppression rules are D-022's, not this page's: `E` = trial or period end, `C` = cancel deadline = `E - 24h`. A cancelled renewal skips every pending renewal or trial notice for that period. A missed window pages the founder; nothing is sent late. All rows are legal-sensitive (`// L2 review` in the copy file).

| id | D-022 row | Trigger and send time | Sender | Kind | Channels | Priority | Cap | Owner |
|---|---|---|---|---|---|---|---|---|
| `trial-started` | Acknowledgment | Trial starts; within 1 h | Fn | T | Email + in-app sheet | LB | Once per original transaction | C2 / D2 / payments engineer |
| `plus-started` | Acknowledgment | Purchase with no trial; within 1 h | Fn | T | Email + in-app sheet | LB | Once per original transaction | C2 / D2 / payments |
| `trial-ending-week` | Trial week | Trial of 31 days or less that will renew; `E-7d`, window `[E-8d, E-5d]` | Fn | T | Email + card | LB | Once per trial | C2 / D2 / payments |
| `trial-ending-long` | Trial long | Trial over 31 days that will renew; `E-18d`, window `[E-21d, E-16d]` | Fn | T | Email + card | LB | Once per trial | C2 / D2 / payments |
| `trial-ending-final` | Trial final | Every trial that will renew; `E-4d 12h`, window `[E-5d, E-4d]` | Fn | T | Email + card + **one push** (the only billing push) | LB | Once per trial | C2 / D2 / payments |
| `annual-renewal-long` | Annual renewal, long | Annual, will renew, not in trial; `E-30d 12h`, window `[E-31d, E-30d]` | Fn | T | Email + card | LB (first one fires about 13 months after launch; build with the engine) | Once per period | C2 / D2 / payments |
| `annual-renewal-short` | Annual renewal, short | Annual, will renew; `E-7d`, window `[E-8d, E-6d]` | Fn | T | Email + card | LB (as above) | Once per period | C2 / D2 / payments |
| `anniversary-reminder` | Anniversary reminder | Monthly plans, each subscription anniversary; same day | Fn | T | Email only (D-022) | LB (first fires 12 months after launch) | Once per subscription year | C2 / D2 / payments |
| `price-increase` | Price increase | Approved increase with the store's opt-in consent; `effective-25d`, window `[-30d, -7d]` | Fn | T? | Email + card | later (must exist before any price change) | Once per change | C2 / D2 / payments, counsel |
| `plus-cancelled` | not in D-022 | A status report shows renewal turned off (seen on the next app open, D-061) | Fn | T | Email + card | 1.0 | Once per period; not re-sent if renewal is turned on and off again within 24 h | C2 / D2 / payments |
| `plus-ended` | not in D-022 | The reported renewal or trial end date passes with renewal off, or a status report shows no active plan (D-061) | Fn | T | Email + card | 1.0 | Once per period | C2 / D2 / payments |
| `plus-quiet` | C-REQ-031 dormant payer | Plus with no saves in 60 days | Fn | T? | Email only | 1.1 | At most once every 6 months; never in a trial; never within 14 days of another billing email | C2 / D2 / payments |
| `gift-*` | n/a | Gift a year of Plus (paid once, never renews) | Fn | T | Email | later | Per gift | C2 / D2 / payments |

Not sent by us (decision E-6): renewal receipts, purchase receipts, refund confirmations, billing retry and grace period (D-048; Apple emails the customer and StoreKit shows its billing message in the app), restore conflicts (D-047, in-app).

Billing copy rules (from Subscription terms 1.3.0 and D-022): every notice names the plan, the price and billing period, the date it renews or the trial ends, the date to cancel by where relevant, that it renews automatically until cancelled, and the cancel steps in words plus `{manageUrl}`. Every notice says letters and recordings stay free to read, play and export. No offer, discount or "are you sure" ever appears in a billing email (California B&P 17602 as amended by AB 2863 allows save offers only next to a "click to cancel" link; we simply never make them).

## 8. Data and privacy rights (copy: C2, `account.en.ts`)

| id | Trigger | Sender | Kind | Channels | Priority | Cap | Owner |
|---|---|---|---|---|---|---|---|
| `account-deletion-scheduled` | `request_account_deletion()` succeeds (DATA-REQ-025 receipt 1) | Fn | T | Email + in-app status | LB | Once per request | C2 / D2 / privacy engineer |
| `account-deletion-cancelled` | `cancel_account_deletion()` (DATA-REQ-026, receipt 2) | Fn | T | Email + in-app | LB | Once per request | C2 / D2 / privacy engineer |
| `account-deleted` | Deletion executes, step 7 `receipt_email`, sent before the auth user is removed (DATA-REQ-025, receipt 3; DATA-REQ-022 repeats how to cancel with Apple) | Fn | T | Email only (the account no longer exists) | LB | Once per request; the last email to that address | C2 / D2 / privacy engineer |
| `book-deletion-scheduled` | Sole parent deletes a book (`request_book_deletion()`) | Fn | T | Email + in-app | 1.0 | Once per request | C2 / D2 / privacy engineer |
| `book-deletion-cancelled` | `cancel_book_deletion()` | Fn | T | Email + in-app | 1.0 | Once per request | C2 / D2 / privacy engineer |
| `deletion-request-received` | Deletion asked for by email through `/delete-account` (D-042), before identity is confirmed | Ops | T | Email only | LB (D-042 route) | Once per request | C2 / D2 / support runbook |
| `deletion-confirm` | Sent right after `deletion-request-received`. One-time link to `/delete-account/confirm` (web, any browser; route still to build), which shows the date and one button; pressing it files the request with `source='support'` (DATA-REQ-021) and `account-deletion-scheduled` follows (customer review CUS-14) | Ops or Fn | T | Email only | LB (D-042 route) | Once per request; link expires | C2 / D2 / web / support runbook |
| `coparent-left` | A co-parent's `request_account_deletion()` succeeds. To the remaining parent of each shared book, within 1 hour. Their letters left the book at request (DELETION spec 2.6.2); no email if the leaver cancels within the hour | Fn | T | Email + in-app card (`en.coParentLeft`) | 1.0 | Once per request per remaining parent | C2 / D2 / privacy engineer |
| `privacy-request-received` | Access, correction, provider-list or other rights request by email (Privacy Policy section 14) | Ops | T | Email only | 1.0 | Once per request | C2 / D2 / support runbook |
| `export-ready` | Server-built export finished (DATA-REQ-054); link valid 7 days | Fn | T | Email + card | 1.1 (BL-309) | Once per export | C2 / D2 / privacy engineer |
| `policy-update` | Major change to a policy (POLICY_VERSIONING section 5), on `published_at`, at least 30 days before `effective_at` | Fn | T? (FTC CAN-SPAM rule 16 CFR 316.3 lists notice of a change in account terms as transactional; L2 confirms) | Email + in-app card until accepted or effective | 1.0 (needed before the first major change after launch) | Once per major version per account; sent even with marketing off; all accounts including Apple relay | C2 / D2 / legal |

In-app only, no email: letter deleted or restored (Recently deleted shows it), export finished on the phone (DATA-REQ-052 runs on the device), consent withdrawn, sync turned off.

## 9. Support

| id | Trigger | Sender | Kind | Channels | Priority | Owner |
|---|---|---|---|---|---|---|
| Human replies | Any email to `hello@` | A person | T | Email | LB | Founder |
| `deletion-request-received`, `privacy-request-received` | See section 8 | Ops | T | Email | LB / 1.0 | C2 |

No auto-responder at v1.0. A one-line auto-acknowledgment ("A person reads every message and replies within 2 working days") is acceptable later if volume needs it; C2 writes it then.

## 10. Global frequency rules

1. Legally required notices (section 7 except `plus-quiet`, and the three deletion receipts) are never suppressed, delayed or batched by any cap.
2. Everything else: at most one non-auth email per address per day. If a non-required email collides with a required one, the non-required one waits a day; if that pushes it out of its own purpose (a welcome after the person has been active for a week), it is dropped, not sent late.
3. Nothing is sent between 21:30 and 07:00 in the recipient's time zone **except** a D-022 notice whose hard window would otherwise close, and auth mail (the person is waiting for it). If we do not know the time zone, use the device time zone last synced; else US Pacific.
4. A hard bounce or Apple relay rejection stops all non-required email to that address and shows a quiet "We could not reach {email}" row in Settings, Account (copy needed from C1 or C2; see section 13). Required notices still try once; the in-app card carries the same facts.
5. Emails ignore the child's birthday (D-022 birthday rule); there are no child-anchored emails at all.

## 11. Apple private relay (launch-blocking)

People who choose Sign in with Apple can hide their email, so their address is `@privaterelay.appleid.com` (how many will, UNVERIFIED; plan for most). Apple relays mail to them **only** from domains and addresses registered in the Apple Developer account under Certificates, Identifiers and Profiles, Services, "Sign in with Apple for Email Communication", and only if the mail passes SPF (Apple Developer Help, "Configure private email relay service"; Resend docs, "Sending to Apple Private Relay", both opened 3 Oct 2026).

What to register (L3 owns the runbook):
- Domain `earlyletters.com`.
- The Resend return-path (MAIL FROM) subdomain, by default `send.earlyletters.com` (Resend docs say to register it too).
- Address `hello@earlyletters.com`.
- Later: `news.earlyletters.com` and its sender, when commercial mail exists. `earlyletters.app` only if it ever sends.

Why it blocks launch: trial and renewal notices are legally required (D-022) and must reach relay users. Supabase Auth mail (sign-in link and code) to a relay address also needs this, though Apple users rarely need email sign-in. If a relay user turns off forwarding in their Apple settings, mail is dropped silently; the in-app card is the fallback for every billing notice, which is one reason every D-022 email has a card.

## 12. Emails we will never send

| Never | Why |
|---|---|
| Streaks, "N days in a row", "N letters this week", badges, progress bars | CLAUDE.md and VOICE.md: no streaks, points or badges, ever; never count. |
| "We miss you", "It has been a while", "Come back", any re-engagement after inactivity | No guilt. Skipped days are normal. The only email that reacts to inactivity is `plus-quiet` (1.1), and it helps a payer stop paying. |
| Countdowns: "3 days left", "Last chance", "Ends tonight", "48 hours" | No urgency words (VOICE.md). Legal notices give the date and the cancel-by date instead. |
| "Moments are slipping away", "they grow up so fast", "before it is too late" | Fear and loss language; banned by the content rules. |
| Birthday, month-of-age, due-date or pregnancy-week emails | These dates can fall on the worst day of a family's year (loss, estrangement, a hospital stay). B-REQ-015 bans due-date messages; month and birthday notes stay as local notifications the parent controls and can pause per child. They would also put the child's name in the email provider (E-1). |
| "On this day" or memory-resurfacing emails with letter text or audio | Letters never leave the app by email. Privacy rule: no entry text in any service that is not the book. |
| Family activity counts ("Nani wrote 3 letters") | Counts, and family letters already have a push. An opt-in digest without counts may come later (`family-digest`). |
| Invite emails, invite reminders, "your invite expires soon" | E-3. The parent invites in their own words from their own phone. |
| Notices of removal, leaving, a declined invite or a letter kept aside | E-5. Silence beats a rejection inside a family. |
| Win-back discounts, "We would hate to see you go", offers after cancelling | No save offers (AB 2863), and it is not who we are. `plus-cancelled` and `plus-ended` carry no offer. |
| "You looked at Plus" or abandoned-paywall emails | Requires tracking we do not do; pressure. |
| Onboarding drips (day 1, 3, 7 tips), "Did you know" feature tours | "Never as nags" (PRD B F1). The app teaches in place. |
| Review requests, ratings, NPS, surveys by default | Proof discipline (BRAND.md); a survey can go to beta families by hand, with consent. |
| Referral and "get a free month" schemes | Gamification; turns family into a funnel. |
| Duplicates of Apple's mail: receipts, refunds, billing problems | E-6. |
| "Back up now or you could lose" style warnings | Fear. Backup state lives quietly in Settings. |
| Anything to a child, or about a child to someone outside the book | 18+ only; minimisation. |
| Tracking pixels, click tracking, remote images from other hosts | Brief hard rule; Resend tracking stays off. |

## 13. Open questions

For the founder:
1. **E-1 (no child names in email).** Warmer copy is possible with names; the cost is L4 data in Resend logs and a Privacy Policy change, or the Resend no-storage add-on (paid, eligibility rules). Recommend keeping E-1.
2. `plus-quiet` (C-REQ-031) promises "pause or cancel". Apple offers no subscription pause for iOS apps as far as we can tell (UNVERIFIED; Google Play has one). The 1.1 copy says cancel only.
3. `welcome-family` and `welcome-coparent` at v1.0, or C1's `welcome` for everyone?

For L2: confirm the `T?` rows (section legend) and that `policy-update` and the billing notices need no postal address line. Confirm the acknowledgment emails satisfy B&P 17602(a)(3) (terms, cancellation policy, how to cancel, in a form the consumer can keep) and AB 2863's annual reminder content (product, charges, how to cancel).

For L3: register the private-relay senders (section 11); make the send pipeline branch on invite role for E-4; Resend content-storage setting.

For C1: the bounce row in Settings (rule 10.4) needs one in-app string; and E-4 means `welcome` should say it is for a parent starting a book.

Conflict to resolve (PM): DATA-REQ-053 promises contributors "a server export link valid 30 days" when a sole parent deletes a book, but server export (DATA-REQ-054) is P1 and ROADMAP puts it in v1.1 (BL-309). D-002 is superseded by D-057: at v1.0 there are no contributors, so `family-book-closing` is 1.1. When contributors arrive they are in the app and can export from their own phone, so `family-book-closing` points them to the app. `family-export-ready` adds the link in 1.1.

## Reconciliation with founder decisions of Oct 3 (docs/agents/BRIEF-2026-10-03.md)
- Decision 4: Google sign-in is v1.0. `google-account-linked` moves to v1.0. Sign-in copy says "sign-in link", never "magic link" (VOICE.md).
- Decision 5: family at launch is co-parent only. `welcome-family` moves to v1.1; `welcome-coparent` stays v1.0.
- Decision 3: payments are Apple only. Billing emails were PARKED because no server of ours saw purchases. **Un-parked by D-061 (founder, 3 Oct 2026, 19:30 UTC):** the app reports subscription status only (plan, trial end date, renewal date, cancelled flag) so the D-022 reminders can be sent; see the trigger note in section 7. Apple still processes payments; no RevenueCat; no App Store Server Notifications. Prices are $3.99/month (1-month trial) and $29.99/year (2-month trial).
- Decision 13: the health data policy lives at /health-privacy.
