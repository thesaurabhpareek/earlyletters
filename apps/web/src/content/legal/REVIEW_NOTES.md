# Legal pages: review notes for counsel and the founder

Internal file. Not a page. The website build must exclude it from the legal content collection (for example a glob of `*.md` with `!REVIEW_NOTES.md`).

Prepared 3 Oct 2026 by an AI (Claude, lane L1) for review by a licensed attorney. Not legal advice. Nothing in this folder may be deployed until counsel has reviewed it and the founder has approved it; every page carries `status: "draft"` so the site shows the "Draft, pending legal review" banner.

## 1. What is in this folder

| Web file | Slug | Version | Source (repo draft) | Source version | Why it exists |
|---|---|---|---|---|---|
| `terms.md` | `/terms` | 1.5.0 | `docs/legal/terms-of-service.md` | 1.4.0 | Required |
| `privacy.md` | `/privacy` | 1.4.0 | `docs/legal/privacy-policy.md` | 1.3.0 | Required |
| `subscription-terms.md` | `/subscription-terms` | 1.3.1 | `docs/legal/subscription-terms.md` | 1.3.0 | Part of the Terms (Section 1.3, 14.1); shown before purchase |
| `consumer-health-data.md` | `/consumer-health-data` | 1.1.1 | `docs/legal/consumer-health-data-notice.md` | 1.1.0 | See 1.1 below |
| `subprocessors.md` | `/subprocessors` | 1.3.0 | `docs/legal/subprocessors.md` section 2 | 1.2.0 | The Privacy Policy (section 8) and the CHD policy (section 5) point to a public list |

### 1.1 Why a Consumer Health Data policy is included

The repo documents conclude it is needed. Lawyer 2 (finding H2) and compliance register CR-031 and CR-032: letters, transcripts and the due date can be consumer health data under Washington's My Health My Data Act (no revenue threshold, private right of action, "collect" includes "retain"); Washington requires a separate Consumer Health Data Privacy Policy linked from every web page that collects personal information and from the app's download page (RCW 19.373.010 and .020 as read by Lawyer 2). `POLICY_VERSIONING.md` lists it as document key `health-privacy`. The Privacy Policy (sections 2, 13, 16) links to it.

### 1.2 Why a subprocessors page is included

The Privacy Policy section 8 says "The full list, with each provider's contact details and data terms, is at" a URL, and the CHD policy section 5 says the list "with contact details" is published. `subprocessors.md` section 1 says the public version is section 2 without notes, plus each vendor's privacy contact, and that the contact column is required by Washington (RCW 19.373.040). The page carries purposes, data, region and contact; it does not carry the internal DPA, retention and training assessments (see 4.4 on "data terms").

### 1.3 Versions

`POLICY_VERSIONING.md` section 2 says numbering starts at 1.0.0 "for the first public version", and section 2.4 says a number is never reused, even for an unpublished draft. The drafts already used 1.0.0 to 1.4.0, so I continued each document's sequence instead of resetting. Classification of my changes under POLICY_VERSIONING 2.2 and 2.3: Terms and Privacy are **minor** (they now describe the sign-in methods and name the email provider, which clarifies practice without changing it); Subscription Terms and the CHD policy are **patch** (links, contact details, formatting only); Subprocessors is **minor** (adds a provider in an existing category). **Counsel decides** whether the first published version should instead be 1.0.0 and whether any change is material. Whatever is chosen, the matching `docs/legal` source files must be brought to the same text and number by their owners, so there is one source of truth.

## 2. Every change made against the sources

### 2.1 Applied to all five files

1. Replaced the source frontmatter with the web frontmatter: `title`, `slug`, `effectiveDate: "TBD"`, `version`, `status: "draft"`, `summary`.
2. **New text: the `summary` line** at the top of each page. It is a plain-language restatement written for the web page; it is not in any source. Counsel must approve each summary, and should decide whether it needs a line such as "the full text below is what counts" (the Terms already say this in "The short version").
3. Removed the drafting notice, the founder note (Terms), every **[COUNSEL: ...]** block and inline note, the `[CN-n]` and `[HN-n]` tags, the appendices (notes for counsel, sources, decisions) and the changelogs. Their content is carried into sections 3 to 5 of this file.
4. Removed the H1 title (the page title comes from frontmatter) so that section headings start at H2 and the table of contents is built from H2 and H3. No heading text was changed. Numbered clauses (for example "14.6") stay as paragraphs inside their H2 section.
5. Placeholders: `{PUBLISHER_LEGAL_NAME}` became `{publisherLegalName}`; `{CONTACT_ADDRESS}` became `{postalAddress}`; `{SUPPORT_PHONE}` became `{supportPhone}`; `{COUNTY}` became `{county}`; `{TERMS_ARCHIVE_URL}` became `{termsArchiveUrl}`; `{POLICY_ARCHIVE_URL}` became `{privacyArchiveUrl}`.
6. **Contact email.** `{SUPPORT_EMAIL}` and `{PRIVACY_EMAIL}` both became `hello@earlyletters.com` (mailto link), per the brief (one human inbox, no no-reply). The sources kept two placeholders; a separate privacy address (for example `privacy@`) can be added later as an alias. Founder to confirm.
7. URLs resolved to site paths: Privacy Policy `/privacy`; Terms `/terms`; Subscription Terms `/subscription-terms`; CHD policy `/consumer-health-data`; subprocessor list `/subprocessors`; web deletion page `/delete-account`. `reportaproblem.apple.com` became a link.

### 2.2 `terms.md`

1. Section 1.3: the Privacy Policy and Subscription Terms bullets now link to the pages; the phrase "at {PRIVACY_URL}" and "at {SUBSCRIPTION_TERMS_URL}" was replaced by the link.
2. **Section 3.2 (D-044):** "You can sign in with Apple or email, and with Google where the app offers it." became "You can sign in with Apple, or with your email address using a sign-in link or a 6-digit code that we email to you, and with Google where the app offers it." "Where the app offers it" already covers Google arriving in v1.1, so it was kept.
3. Sections 4.5 and 6.3: "the Privacy Policy" linked. Section 8.4: "delete your account" linked to `/delete-account`. Section 14.1: "Subscription Terms" linked.
4. Section 28: line breaks added to the address block, and one new sentence: "You can also reach us through our contact page." linking `/contact`.
5. Removed: Option B (arbitration text for counsel only), Appendix A (sources), Appendix B (decisions), changelog.

### 2.3 `privacy.md`

1. Removed the line "Version 1.1.0. Effective date: TBD." (it contradicted the source frontmatter 1.3.0; the page shows the frontmatter version).
2. Section 1 and 20: contact filled (see 2.1).
3. **Section 3, Account row (D-044):** source "You, Apple or Google when you sign in" became "You, or Apple if you use Sign in with Apple (Google, once Google sign-in is offered)".
4. **Section 8, email row:** `{EMAIL_PROVIDER}` / `{REGION}` became "Resend | Sends sign-in emails (a sign-in link and a 6-digit code), and trial and renewal emails | Email address, message content we send | United States". See 4.1 for the open contract point.
5. **Section 15, CCPA table:** Identifiers source "You; Apple or Google sign-in" became "You; Sign in with Apple (Google sign-in, once offered)"; "email provider" became "Resend" in the Identifiers and Customer records rows.
6. Sections 2, 13, 16: CHD policy references linked; section 8 subprocessor URL and section 14 deletion URL linked.
7. Section 12: removed the sentence "See Appendix A, CN-2, for the full analysis." because the appendix is internal.
8. Removed Appendix A (CN-1 to CN-20), Appendix B and the changelog.

### 2.4 `subscription-terms.md`

1. Plans table: "{monthlyPrice} (US $3.99)" became "US $3.99" and "{annualPrice} (US $29.99)" became "US $29.99". The `{monthlyPrice}` and `{annualPrice}` tokens are in-app paywall variables that a static page cannot fill. The paywall copy should keep them. Meaning unchanged because the app is US only (Section "Plans" and Terms 14.2).
2. Terms and Privacy links resolved; contact filled.

### 2.5 `consumer-health-data.md`

1. Removed the line "Version 1.0.0. Effective date: TBD." (it contradicted the source frontmatter 1.1.0).
2. Privacy Policy, subprocessor list and deletion page linked; "See the Privacy Policy, section 7" linked.

### 2.6 `subprocessors.md` (new public page built from `docs/legal/subprocessors.md` section 2)

1. Intro sentences are taken from Privacy Policy section 8 (instructions, written contract, protection parity, deletion on request, no sale, no training, 30 days' notice for providers that handle letters or recordings).
2. Rows: Supabase, PowerSync, PostHog, Sentry, Vercel, Resend in use; Groq, DeepInfra and the Vercel-hosted family contribution page "for features that arrive later" (the source marks them "from v1.1"); Apple, Apple Declared Age Range, Google and the speech-model host as "not our service providers" (source: "Not processors (independent parties)").
3. Wording changes from the internal table: "magic-link landing page" became "the page that opens sign-in links" (banned vocabulary); "invite hashes" became "scrambled invite fingerprints" and "wrapped keys" became "locked keys" (the Privacy Policy's own words); internal notes (pending D-023, DPA links, retention, training analysis) are not on the public page.
4. **New facts added: privacy contacts**, opened 3 Oct 2026 on each vendor's privacy policy: Supabase privacy@supabase.com; PowerSync dpo@powersync.com; PostHog privacy@posthog.com; Sentry compliance@sentry.io; Vercel privacy@vercel.com; Resend support@resend.com (Resend's privacy policy gives no separate privacy address); Groq privacy@groq.com; DeepInfra policy@deepinfra.com (dpo@deepinfra.com also listed). Re-check before publication.
5. Resend legal entity "Plus Five Five, Inc." is from the Resend DPA (opened 3 Oct 2026, "Last update: December 31st, 2025").
6. `{modelHost}` placeholder for the speech-model host, which the founder has not chosen (D-046).

## 3. Inconsistencies between source documents, memos and decisions (not resolved here)

I kept the source wording in each case. Each needs a decision by the owner named.

1. **Google billing at launch.** Terms short version ("renews automatically through Apple or Google"), 8.4, 14.4 ("Billing is handled by Apple or Google"), 14.5 (Android steps with no "once available"), 14.7 and 26.2 read as if Google Play billing exists today. D-001 and ADR 0013 say Plus is sold only through Apple at v1.0, and the Subscription Terms 1.3.0 say "Google Play, once the Android app is available". The Terms 1.4.0 changelog says "Section 14's Google Play lines apply when Android ships", but the text does not say so. Owner: Terms drafter and counsel. Suggested: add "once the Android app is available" in the same places as the Subscription Terms.
2. **Gifts.** Terms 14.13 says a family member "may buy a year of Plus"; Subscription Terms say "Gifts of Plus are not available yet" (P1). Owner: Terms drafter.
3. **"Listening" in the Terms short version.** "Writing, reading, listening, export and family authors are free, always." PRD K-11, the Subscription Terms and register section 3 row 10 changed "listening" to "playing your recordings" because Read together is Plus after the free sessions. Terms 13.1 already says "playing their recordings". Owner: Terms drafter.
4. **PowerSync.** Named in Privacy section 8 and the CCPA table, and on the subprocessor page, while D-023 recommends the outbox sync on expo-sqlite with no PowerSync (founder answer due 16 Oct). PowerSync also has no written no-training clause, so Privacy section 6 cannot be published while it is listed (CN-7, subprocessors gap 1 and 11). If D-023 is adopted, remove PowerSync from Privacy sections 8 and 15 and from the subprocessor page (a minor change before publication).
5. **Recordings leaving the phone (D-032, pending).** Terms 12.1 and the Privacy short version list backup and the web page as the only exits. If "shared voice" is approved, recordings of letters in a shared book upload for every user, and Terms 12.1, the Privacy short version, sections 4 and 7, and the CHD table must change before publication. Also D-033 (recordings in the user's own iCloud device backup): Privacy section 9 already discloses device backups; Terms 12.4 still says recordings "that live only on a lost phone cannot be recovered by us", which stays true, but the related in-app copy is pending.
6. **Server location.** Privacy section 9: "Our servers are in the United States, in California." Supabase is in us-west-1 (California), but Resend's primary processing is in the United States generally (brief: us-east-1, Virginia, UNVERIFIED for our account), and PostHog, Sentry and Vercel are not described as California. Suggested: "Our servers and our service providers are in the United States." Owner: privacy drafter.
7. **Support mailbox.** Privacy section 3 says support messages live with "Our email provider". The brief says replies go to a human inbox; that mailbox host is not named in any source and is not on the subprocessor list. If the human inbox is not Resend (Resend inbound is not described anywhere), the mailbox provider holds support content (which can include letter text or health details) and must be added to Privacy section 8, the CCPA table, the CHD recipients and the subprocessor page. Owner: founder.
8. **Resend versus the subprocessor selection criteria.** `subprocessors.md` row 8 requires "DPA with purpose limitation and no-training clause, US region, link tracking and open tracking turned off". Resend's DPA (opened 3 Oct 2026) limits processing to the agreement and the customer's documented instructions and says primary processing is in the US, but I found **no AI-training clause** in the DPA, the Terms of Service or the Privacy Policy, and Resend's own subprocessor list (updated 27 Aug 2026) includes "Anthropic, PBC: Artificial Intelligence" and "RunPod, Inc.: Self-hosted LLMs". Privacy section 8 and the subprocessor page say none of our providers may train on content. Resend gives 14 days' notice of new subprocessors (our promise of 30 days applies only to providers that handle letters or recordings) and deletes customer data within 90 days of termination. I named Resend because the brief records it as decided and `subprocessors.md` already reserves the role; get a written no-training confirmation from Resend (as for PowerSync) before publication, or change the sentence.
9. **Where published text lives and its URLs.** `POLICY_VERSIONING.md` section 1 says published text lives in `packages/content/legal/<key>/<version>.md` (immutable) and section 4 uses `/legal/<key>` and `/legal/<key>/<version>`, with in-app links always opening the versioned URL. The brief places the pages in `apps/web/src/content/legal/` at `/terms`, `/privacy` and so on. Document keys also differ from slugs: `auto-renewal-terms` (Subscription Terms) and `health-privacy` (CHD policy). Owner: founder and D3. Suggested: keep the friendly floating URLs, add `/legal/<key>/<version>` routes for the archive, and fill `{termsArchiveUrl}` and `{privacyArchiveUrl}` with them.
10. **Version line in the source bodies.** Privacy body said "Version 1.1.0" under frontmatter 1.3.0; CHD body said "Version 1.0.0" under 1.1.0. Removed on the web pages (2.3 and 2.5); the source owners should remove or fix them.
11. **Deletion page scope.** LEGAL-REQ-030 describes `/delete-account` as a page where the user enters an email and confirms with a link and code; D-042 (counsel to confirm) makes v1.0 a static page plus an email route. Privacy section 14 and CHD section 6 say "on the web at /delete-account" and "use the web page ... for deletion", which fits either, provided the page offers the email route. LEGAL-REQ-030 also uses the banned term "magic link".
12. **Email and consumer health data.** CHD section 5 lists processor purposes as hosting, sync, cloud transcription and backups; it does not mention email. That is accurate only if no email ever carries health details (for example a due date, letter text, or a letter excerpt in a family notification). If any email will, add email to CHD section 5. Owner: C2 (email catalog) and privacy drafter.
13. **Staff access "logged".** Privacy section 7 ("Each access is logged and reviewed") and CHD section 5 ("Each access is logged") depend on the service-role access log (CN-8), which is not built.
14. **Brand file.** `packages/brand/index.ts` still has `domain: 'example.com'`, `supportEmail: 'support@example.com'` and `privacyUrl: 'https://example.com/privacy'` (BL-100), while the brief fixes `earlyletters.com` and `hello@earlyletters.com`. Owner: founder (outside this lane).
15. **Voice rules versus legal accuracy.** The brief bans "AI" and loss language in product voice. The legal pages keep "train AI models" (Privacy, CHD, subprocessors) and Terms 12.2 and 12.4 ("If you lose them, neither you nor we can recover those recordings"; "a lost phone") because these are required disclosures (Privacy CN-6). If legal Markdown is ever added to `packages/content/test/rules.test.ts`, it needs an exemption for these. No em dashes, en dashes, curly quotes or ellipsis characters appear in any file in this folder.

## 4. Open legal questions (carried from the removed counsel notes)

### 4.1 Terms of Service

1. Individual publisher (D-004): is "we" acceptable for an individual, and can a successor entity take over by assignment under 27.3? A mailing address that is not the family home for 1.1, 26.1(h) and 27.8.
2. Pre-account local use has no explicit acceptance step (browsewrap); decide whether that is acceptable (1.5). Web contributors need an acceptance line (v1.1).
3. Age: is a self-declared 18+ confirmation enough under Texas SB 2420 and similar Utah and Louisiana laws, and what changes by 1 Jan 2027 for California AB 1043? Exclude teen parents? Expecting-parent and guardian wording (2.1 to 2.3).
4. "No training" promise (6.2): confirm every AI provider is bound before launch; Standard backup mode means 6.2 is a policy limit, not a technical one.
5. Account deletion and shared books (8.4): "leave my letters for {child}" would need a surviving license; contributor deletion; privacy-law deletion rights.
6. Court orders, protective orders, subpoenas: runbook, verification standard, notice to the other parent, law-enforcement request page (9.4).
7. CSAM reporting duty under 18 U.S.C. 2258A and preservation; recording-consent law (Cal. Penal Code 632) for 10.2; DMCA agent (10.3, 10.4).
8. Transcription promise (11): keep 11.1 matched to `EditType` in `packages/core` at every release.
9. "Free, always" (13.3) is non-amendable for existing users: confirm the founder accepts it and how it binds a buyer (27.3).
10. Auto-renewal with Apple as merchant of record: do the California, New York, Virginia, Massachusetts, Colorado and NYC duties apply as stated; is the purchase sheet plus `plus.legal.agree` express affirmative consent; does a deep link to Apple's cancel screen meet the one-step cancellation laws (14.3, 14.5, 14.10)? Lifetime: AB 2426 disclosure. Massachusetts monthly-plan disclosures (Lawyer 1 M8).
11. Pro-rated refunds for Apple purchases (16.3, 17.1): commit to a direct refund outside the store or not.
12. Beta (16.4): when the founder ends the beta, 16.4, the in-app label and store copy change in one release; D-030 recommends no beta line in the store listing.
13. 90-day shutdown promise (17): enforceability against an asset buyer and in insolvency; wind-down reserve.
14. Liability cap (21): the $50 floor for irreplaceable family recordings; carve out a security breach or a breach of 6.2; Civil Code 1668 and 1670.5; Apple minimum term 5.
15. User indemnity (22): keep or remove.
16. Arbitration (23): draft keeps courts plus small claims; Option B (arbitration) was removed from the web page and is in the source file.
17. International (24): India DPDP, GDPR Article 8, UK, before any non-US storefront.
18. Custom EULA versus Apple Standard EULA (26.1); `{supportPhone}` must be a real number.
19. California Complaint Assistance Unit address and phone numbers (28) were not verified.
20. Print Terms not drafted (15).

### 4.2 Privacy Policy (CN notes)

1. CN-1 controller is an individual; named privacy contact; entity formation later is a major change and an app transfer.
2. CN-2 COPPA: written confirmation that background child audio in a parent's letter is not collection from a child; `child-input` features stay off.
3. CN-3 and CHD notes (section 4.3 below).
4. CN-4 CCPA applicability; 7027(m) purposes so no "Limit" link; risk assessment timing; CalOPPA Do Not Track (Unverified).
5. CN-5 approval of `analyticsConsent.*` strings.
6. CN-6 third-party AI consent wording under Apple 5.1.2(i).
7. CN-7 no-training launch gate (PowerSync; now also Resend, section 3 item 8).
8. CN-8 staff access log; CN-9 publishing request counts.
9. CN-10 `safety_events` drop migration must be applied before sections 3, 5, 10 and 13 are published.
10. CN-11 30-day subprocessor notice versus vendor notice periods (PostHog 14 days, Sentry 30, Vercel unspecified, Resend 14).
11. CN-12 retention periods marked "proposed" need scheduled purges and counsel approval.
12. CN-13 `children.created_by on delete cascade` fix before section 10 is accurate.
13. CN-14 overseas contributors (DPDP section 3, GDPR Art. 3(2)), from v1.1.
14. CN-15 recording other adults.
15. CN-16 Connecticut 15-day revocation; Washington separate sharing consent (D-050).
16. CN-17 biometrics; extend LEGAL-REQ-019 to photos.
17. CN-18 analytics deletion through the analytics ID at in-app deletion.
18. CN-19 device backups (D-033).
19. CN-20 features after v1.0 (web page, cloud transcription); remove each mention when it ships.

### 4.3 Consumer Health Data policy (HN notes)

1. HN-1 letters can contain consumer health data (decided); New York HIPA watch item.
2. HN-2 are kept recordings and photos "biometric data"?
3. HN-3 is on-device safety tiering "collection" by us?
4. HN-4 can a parent consent for a child's data; third adult's data; second consent at first family share (D-050, due end of week 6); consent text approval.
5. HN-5 statutory deletion request versus author ownership; proposed runbook.
6. HN-6 homepage links (checklist below).
7. HN-7 processor contracts must cover consumer health data (DeepInfra has no DPA).
8. HN-8 backup deletion timing (38 days, inside Washington's six months).
9. HN-9 due date declared as Sensitive Info in Apple's label.
10. HN-10 no affiliates as an individual; confirm MHMDA applies the same way to an individual regulated entity.

### 4.4 Subprocessors

1. Privacy section 8 promises the list shows each provider's "data terms"; the public page shows purpose, data, region and contact only. Decide whether to add a DPA link column.
2. Supabase DPA names Supabase Pte. Ltd. (Singapore): confirm the contracting entity for a US customer (gap 8).
3. Groq Zero Data Retention, DeepInfra DPA (v1.1); Sentry and Vercel settings (gaps 2 to 5).

## 5. Items the lawyer memos flagged as unresolved

Lawyer 1 (terms and consumer law):
- H1 notice windows: resolved in PRD K-38 and D-022; counsel confirms the table once. Engineering must actually send on those days, or Terms 14.6 and the Subscription Terms "Reminders" must be cut.
- H4 age self-declaration under Texas SB 2420 and AB 1043 (4.1 item 3).
- M2 one-step cancellation via deep link (4.1 item 10).
- M3 marketing claims stronger than Terms 11.1 ("every word exactly as you said it"): content owner.
- M4 Terms of Use and Privacy links in the store description: content owner.
- M5 "never sell or share" wording: content owner.
- M8 Massachusetts monthly-plan disclosures.
- L2 liability cap; L3 arbitration; L4 custom EULA and support phone; L6 free-forever acceptance.

Lawyer 2 (privacy):
- H1 analytics consent strings approval; analytics ID at deletion (CN-18).
- H2 CHD homepage links (checklist below).
- H3 photo guardrail in LEGAL-REQ-019.
- H4 claims rows 13 to 21 in `packages/content`.
- H5 cascade bug migration (CN-13).
- M3 Connecticut revocation; M4 retention conflicts (RevenueCat now gone; `safety_events` purge in the draft migration); M5 `safety_events` drop; M6 PowerSync no-training clause and DeepInfra DPA.
- "Needs a human lawyer" list, items 1 to 8 (sections 4.2 and 4.3 above).

## 6. Pre-publication checklist

Counsel and founder
- [ ] Counsel reviews and approves each of the five pages, including each `summary` line, and classifies the version (POLICY_VERSIONING 2); approval name and date recorded in each document's changelog.
- [ ] Founder approves publication; only then change `status` from `"draft"` and remove the draft banner.
- [ ] Source files in `docs/legal/` updated to the same text and version (one source of truth).

Placeholders
- [ ] `{publisherLegalName}`: the founder's legal name, entered only here and in App Store Connect (D-004; never in code).
- [ ] `{postalAddress}`: a PO box or virtual mailbox, never the family home (D-004); counsel confirms it works for each notice.
- [ ] `{supportPhone}`: a real number (Apple minimum EULA term (h), Terms 26.1(h) and 28).
- [ ] `{county}`: venue county for Terms 23.2 and 23.3.
- [ ] `{termsArchiveUrl}`, `{privacyArchiveUrl}`: permanent versioned URLs (section 3 item 9).
- [ ] `{modelHost}`: the speech-model host (D-046).
- [ ] `effectiveDate` on every page; `published_at`, `new_users_from`, `effective_at` rows per POLICY_VERSIONING 3.

Launch gates named in the sources
- [ ] D-023 decided; PowerSync removed or its no-training clause signed (CN-7).
- [ ] Resend: DPA accepted, written no-training confirmation, open and click tracking off (section 3 item 8).
- [ ] Support mailbox provider named and listed, or confirmed to be Resend (section 3 item 7).
- [ ] D-032 decided and Terms 12.1 and the Privacy short version, sections 4 and 7 match it.
- [ ] `safety_events` drop migration applied (CN-10); `children.created_by` fix shipped (CN-13); staff access log built or the "logged" claims softened (CN-8).
- [ ] Vercel paid Pro with training opt-out; Sentry scrubbing and IP storage settings (subprocessors gaps 4 and 5).
- [ ] Terms 14.6 reminder schedule implemented exactly (D-022).

Apple
- [ ] App Store Connect Privacy Policy URL: `https://earlyletters.com/privacy` (the floating URL, POLICY_VERSIONING 4).
- [ ] Terms of Use (EULA) link in the App Store description and in the app beside the Plus purchase (DPLA Schedule 2 section 3.8(b)); choose custom EULA or Apple's Standard EULA (Terms 26.1).
- [ ] Support URL (for example `https://earlyletters.com/contact`) with a working contact route.
- [ ] In-app account deletion and Sign in with Apple token revocation (5.1.1(v), CR-084); `/delete-account` page live (D-042).
- [ ] App Privacy answers match the Privacy Policy and the data map (LEGAL-REQ-042).
- [ ] Register `earlyletters.com` (and the sending addresses) under Sign in with Apple for Email Communication, or emails to `@privaterelay.appleid.com` users, including renewal and policy-change notices the Terms promise, will not be delivered (brief).
- [ ] No beta line in the store listing (D-030); Terms 16.4 stays.
- [ ] Guideline 5.1.1(ix) individual-developer risk accepted or entity started (D-004, by 27 Nov).

Google (when Android ships)
- [ ] Play Console privacy policy URL; account deletion web link `https://earlyletters.com/delete-account` with retention disclosure (CR-091, LEGAL-REQ-030 full flow before Android per D-042); Data safety form; target audience 18+.

Links and placement
- [ ] Washington homepage link to `/consumer-health-data` in the footer of every site page, on the waitlist form, in the App Store description legal-links line and in Settings, Help and Legal (HN-6); also the contribution page from v1.1.
- [ ] Footer links to `/terms`, `/privacy`, `/subscription-terms`, `/subprocessors`, `/delete-account`, `/contact`.
- [ ] In-app Settings, Legal lists Terms, Privacy, CHD policy and Subprocessors (register K8, LEGAL-REQ-008), opening versioned URLs.
- [ ] Publish PR per POLICY_VERSIONING 9: manifest with hashes, `policy_versions` migration row, Internet Archive snapshot, evidence archive.
- [ ] Accessibility check of the legal pages (WCAG 2.2 AA, CR-070), including the wide tables on a 375px screen.
- [ ] Re-check vendor contacts and terms on the publication date.
