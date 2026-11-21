# Early Letters help centre

Owner: `support` (Customer Support Lead). Status: draft for review, written before launch from the product as decided and built. Last updated 14 Oct 2026, checked against develop at ed16ca3 (the first TestFlight build of the on-device v1.0, #100).

These articles answer the questions parents ask most. They speak in the product's voice (`packages/content/VOICE.md`): warm, calm, short sentences. They follow the content rules in `CLAUDE.md`.

## Articles

| Article | What it answers |
|---|---|
| [Signing in](help/signing-in.md) (version 1.1) | Apple, Google and email sign-in, the email link and code, passkeys, a new phone, signing out |
| [Recording and transcription](help/recording-and-transcription.md) | How speaking a letter works, quiet days, the one-time download, languages, the small slips we fix, what we never change, changing a name or birthday |
| [Your privacy](help/privacy.md) (parts are version 1.1) | Who can read your letters, where recordings live, what we never do |
| [Deleting and exporting](help/deleting-and-exporting.md) (parts are version 1.1) | Export everything, deleting a letter, Recently deleted, hiding a book, deleting the app, your account (version 1.1) |
| [Plus and your Apple subscription](help/subscriptions.md) | Two free letters, what Plus adds, what counts as a letter, free trials, cancelling, refunds through Apple, offer codes, Family Sharing |
| [Writing with your co-parent](help/co-parent.md) (version 1.1) | Inviting a co-parent, what each of you sees, leaving a shared book |

## When you write to us

You never need to send us your letters, your recordings or your child's name to get help. Tell us what you tapped and what you saw. In the app, Settings, **Help** opens an email to us with a subject line and nothing else.

If things feel heavy, open Settings and tap **If you are struggling**, under Help and legal. It lists free, confidential lines you can call or text, any time. In the United States you can also call or text 988. If you or your baby are in danger right now, call 911.

## How these articles mark what is not ready

- Text without a mark describes the first version of the app (v1.0) as the founder has decided it.
- "Not in this version yet" in an article means the founder has decided it is not in v1.0. Articles do not promise when it comes.
- "Coming in version 1.1" or "(version 1.1)" marks something that needs sign-in, sync, backup to our servers, family sharing or usage reports. A marked passage runs to the next heading, or to a line that says "End of the version 1.1 part". The founder decided that v1.0 is on-device only, so those parts are not in v1.0 (brief decisions 4 and 5, as amended in PR #33). Hold marked articles and passages back when the v1.0 help centre is published.
- Each article ends with **Reviewer notes**, which are for the team and are removed before publishing. They say what is built on develop, what is still to build, where the article comes from, and anything that needs a decision.

## Placeholders to fill before publishing

| Placeholder | What it becomes | Where it is decided |
|---|---|---|
| `{SUPPORT_EMAIL}` | `brand.support.email` (hello@earlyletters.com today) | `packages/brand/index.ts` lines 34 and 35, D-063 |
| `{PRIVACY_EMAIL}` | The privacy request mailbox | Privacy Policy section 1, still a placeholder there. `docs/ops/DOMAINS.md` line 12 suggests a `privacy@` address; not decided. |
| `{PLUS_PRICE_MONTHLY}`, `{PLUS_PRICE_YEARLY}` | `PLUS_PRICE.monthly` and `PLUS_PRICE.yearly` ($4.99 and $49.99 today) | `packages/content/src/pricing.ts` lines 8 to 11, D-082. Website and help pages only: the app itself never shows a price (D-083). |
| `{WEB_DELETION_URL}` | `brand.web.deleteAccount` (https://earlyletters.com/delete-account) | `packages/brand/index.ts` lines 55 and 56, D-042. DOMAINS.md line 12 lists the page as "later". |

The articles keep placeholders rather than typing these values, so `packages/brand` stays the one source. Legal pages use the addresses in D-063 and `packages/brand`: https://earlyletters.com/terms, /privacy, /health-privacy and /subprocessors.

## Reviewer notes (remove before publishing)

**Re-checked on 15 Oct 2026 against develop at 56ec5b5** for #118 (no analytics in v1.0) and #121 (plan reminders): `privacy.md` and `subscriptions.md` changed; see their notes.

**Re-checked on 14 Oct 2026 against develop at ed16ca3** (the 4 Oct merges #92 to #104, #86 and the decisions D-082 to D-088 in `docs/DECISIONS.md` lines 518 to 549). What changed in the help centre:
- **Plus is now a membership** (D-082, D-083). The subscriptions article no longer says Read together after 3 free times and books for more children. It says the first two letters are free across every book, and Plus lets you keep adding. The hold on that article is lifted. Prices come from `pricing.ts` through placeholders.
- **Deleting** follows D-085 (confirm, Recently deleted, Erase now, Last export). v1.0 has no Delete this book, so that section now says so. Deleting the app usually leaves the free-letter count in the Keychain, and both the deletion and privacy articles say so.
- **Recording** follows D-086 (Exactly as said, the Word for word switch), D-087 (the download asks first; editing a child's name, date and signature) and D-084 (quiet-day marks with no words). Names and words is still not built, so it is no longer named.
- **Co-parent** (version 1.1) drops two lines from the old Plus model.

**v1.0 is on-device only.** `apps/mobile/src/lib/capabilities.ts` lines 1 to 57: one build switch, off in every v1.0 profile, turns off sign-in, sync and co-parent sharing. Signing in and Writing with your co-parent are entirely version 1.1; Your privacy and Deleting and exporting have marked version 1.1 passages; Plus and Recording and transcription need no mark (Plus's Family Sharing section needs no Early Letters account). No account means v1.0 support will not get sign-in questions.

**Changed in the 3 Oct review.** "Settings, Help, Support adds the app version and your plan" was wrong: the Help row opens an email with the subject "Help with the app" and nothing else (re-checked 14 Oct: `apps/mobile/src/app/settings/index.tsx` line 130; `supportMailto` in `packages/brand/index.ts` lines 145 to 147; LEGAL-REQ-014). "If you are struggling" is a row on Settings home in the Help and legal section, not under a Help screen, and it never hides behind a flag (index.tsx lines 27 and 129 to 141). Its lines, 988 included, and its 911 line are `struggling.resources` and `struggling.emergency` (`strings.en.ts` lines 1052 to 1069). D-088 (DECISIONS.md line 548) adds a content-free block (version, build, screen) to the Help email; it is not built yet (`supportMailto` adds only a subject), so the help centre still says the email has a subject line and nothing else.

**Where the founder's decisions and other documents disagree.** The founder's decisions of 3 Oct are now in `docs/DECISIONS.md` (D-051 to D-067), and these articles follow them. These are hand-offs, not open founder decisions: `product` updates the PRD and backlog, and `legal` updates the terms and policy. The one row that is still an open question is the last one.

| Topic | Decision (these articles follow) | Still says otherwise on develop |
|---|---|---|
| Sign-in | D-054: Apple, Google and email link; passkeys after sign-in (built behind a flag) | PRD 2.1 and 2.2; BL-302 (`docs/BACKLOG.md` line 891) puts Google in v1.1 |
| Family | D-055: co-parent only at v1.0 | PRD K-35; Privacy Policy section 7 |
| Plus | D-082 and D-083: two free letters, then Plus to keep adding; Apple only, on the device (D-053); Family Sharing on | PRD C (themes, Read together sessions); Subscription terms lines 18 to 33 (D-053 scope, $3.99 and $29.99); Terms 14.12 (no Family Sharing); App Review note in `docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md` line 102 |
| Recordings | D-059: no audio upload in v1.0 (answers D-032) | Subscription terms list encrypted backup; Privacy Policy short version and section 7 |
| Safety | D-059: static "If you are struggling" row (answers D-034) | Privacy Policy sections 3, 5, 10 and 13 describe on-device support cards |
| Reminders before a trial ends (built 15 Oct, #121; counsel still reviews the wording) | D-053: no server of ours sees purchases; the reminders are local notifications on the purchaser's iPhone, a courtesy that can come late or not at all | Subscription terms line 54 promises reminders before a trial ends, before an annual renewal and once a year. #121 builds exactly those (`apps/mobile/src/lib/billing/plan-reminders.logic.ts`, `billing.en.ts` `reminders` and `confirmed`). Q-003 memo, counsel confirms |

ADR 0013 and ROADMAP now agree with D-053 and D-054, so they are no longer in the table.

**Price changes: settled.** Subscription terms line 60 now says existing subscribers keep their price, relying on Apple's "keep current price" choice for every change (line 88). The subscriptions article uses that wording.

**Build status (develop at ed16ca3).** Built for v1.0 and described: Plus on the device through Apple with the Keep gate, the Plan screen and offer codes; export with Last export; delete with confirm and Recently deleted; quiet-day marks; the Word for word switch and the Exactly as said control; the speech download consent; editing a child's name, date and signature; Settings home with Plan, Recently deleted, Recordings, Storage and the "If you are struggling" row. Built but switched off until version 1.1: sign-in, sync, co-parent invites and account deletion. Built after that check (develop 56ec5b5, 15 Oct): plan reminders on the purchaser's iPhone and the purchase confirmation with Save a copy (#121); no analytics in v1.0 (#118). Not built: Names and words, Delete this book, Erase everything, the web deletion page. Nothing in these articles has been tested on a device by `support`.

**Early version.** D-060: the store listing never says beta, and the app keeps "early version, can make mistakes" at the top of Settings. No article says "beta". The deleting and exporting article mentions the early-version note next to export, and that sentence goes when the founder ends the note.

**Not checked by the content tests.** `packages/content/test/rules.test.ts` does not read `docs/support/`. Each review checks these files with the same patterns as that test (characters, emoji, fear words, the machine-writing list, the never-rewrite rule, and the D-053 Plus words), plus the VOICE.md bans: no gendered pronouns, and none of the words VOICE.md and K-26 retire. A follow-up for `content`: extend the test to read `docs/support/**`.
