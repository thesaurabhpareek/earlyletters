# Early Letters help centre

Owner: `support` (Customer Support Lead). Status: draft for review, written before launch from the product as decided and built. Last updated 3 Oct 2026, checked against develop at 7cc43b1.

These articles answer the questions parents ask most. They speak in the product's voice (`packages/content/VOICE.md`): warm, calm, short sentences. They follow the content rules in `CLAUDE.md`.

## Articles

| Article | What it answers |
|---|---|
| [Signing in](help/signing-in.md) (version 1.1) | Apple, Google and email sign-in, the email link and code, passkeys, a new phone, signing out |
| [Recording and transcription](help/recording-and-transcription.md) | How speaking a letter works, languages and downloads, the small slips we fix, and what we never change |
| [Your privacy](help/privacy.md) (parts are version 1.1) | Who can read your letters, where recordings live, what we never do |
| [Deleting and exporting](help/deleting-and-exporting.md) (parts are version 1.1) | Export everything, Recently deleted, deleting a letter, a book or your account |
| [Plus and your Apple subscription](help/subscriptions.md) (parts are version 1.1; hold, see its notes) | What Plus adds, what stays free, free trials, cancelling, refunds through Apple, Family Sharing |
| [Writing with your co-parent](help/co-parent.md) (version 1.1) | Inviting a co-parent, what each of you sees, leaving a shared book |

## When you write to us

You never need to send us your letters, your recordings or your child's name to get help. Tell us what you tapped and what you saw. In the app, Settings, **Help** opens an email to us with a subject line and nothing else.

If things feel heavy, open Settings and tap **If you are struggling**, under Help and legal. It lists free, confidential lines you can call or text, any time. In the United States you can also call or text 988. If you or your baby are in danger right now, call 911.

## How these articles mark what is not ready

- Text without a mark describes the first version of the app (v1.0) as the founder has decided it.
- "Not in this version yet" in an article means the founder has decided it is not in v1.0. Articles do not promise when it comes.
- "Coming in version 1.1" or "(version 1.1)" marks something that needs sign-in, sync, backup to our servers or family sharing. The founder decided that v1.0 is on-device only, so those parts are not in v1.0 (brief decisions 4 and 5, as amended in PR #33). Hold marked articles and passages back when the v1.0 help centre is published.
- Each article ends with **Reviewer notes**, which are for the team and are removed before publishing. They say what is built on develop, what is still to build, where the article comes from, and anything that needs a decision.

## Placeholders to fill before publishing

| Placeholder | What it becomes | Where it is decided |
|---|---|---|
| `{SUPPORT_EMAIL}` | `brand.support.email` (hello@earlyletters.com today) | `packages/brand/index.ts` lines 34 and 35, D-063 |
| `{PRIVACY_EMAIL}` | The privacy request mailbox | Privacy Policy section 1, still a placeholder there. `docs/ops/DOMAINS.md` line 12 suggests a `privacy@` address; not decided. |
| `{WEB_DELETION_URL}` | `brand.web.deleteAccount` (https://earlyletters.com/delete-account) | `packages/brand/index.ts` lines 55 and 56, D-042. DOMAINS.md line 12 lists the page as "later". |

The articles keep placeholders rather than typing these values, so `packages/brand` stays the one source. Legal pages use the addresses in D-063 and `packages/brand`: https://earlyletters.com/terms, /privacy, /health-privacy and /subprocessors.

## Reviewer notes (remove before publishing)

**v1.0 is on-device only (4 Oct 2026).** The articles were written when sign-in and co-parent sharing were planned for v1.0 (D-054, D-055). The table below still describes those decisions; the on-device-only decision supersedes them for v1.0 and is not yet in `docs/DECISIONS.md` on origin/develop. Per article: Signing in and Writing with your co-parent are entirely version 1.1; Your privacy, Deleting and exporting and Plus have marked version 1.1 passages (Plus also carries a hold, see its notes); Recording and transcription needs no change. No account means v1.0 support will not get sign-in questions, and the "account mismatch" and email-link hand-offs move to v1.1.

**Changed in this review.** "Settings, Help, Support adds the app version and your plan" was wrong: the Help row opens an email with the subject "Help with the app" and nothing else (`apps/mobile/src/app/settings/index.tsx` line 123; `supportMailto` in `packages/brand/index.ts` lines 123 to 126; LEGAL-REQ-014). "If you are struggling" is a row on Settings home in the Help and legal section, not under a Help screen, and it never hides behind a flag (index.tsx lines 24 and 124 to 135). Its 911 line is `struggling.emergency` (`strings.en.ts` line 951).

**Where the founder's decisions and other documents disagree.** The founder's decisions of 3 Oct are now in `docs/DECISIONS.md` (D-051 to D-067), and these articles follow them. These are hand-offs, not open founder decisions: `product` updates the PRD and backlog, and `legal` updates the terms and policy. The one row that is still an open question is the last one.

| Topic | Decision (these articles follow) | Still says otherwise on develop |
|---|---|---|
| Sign-in | D-054: Apple, Google and email link; passkeys after sign-in (built behind a flag) | PRD 2.1 and 2.2; BL-302 (`docs/BACKLOG.md` line 891) puts Google in v1.1 |
| Family | D-055: co-parent only at v1.0 | PRD K-35; Privacy Policy section 7 |
| Plus | D-053: Read together and more books only; Apple only, on the device; Family Sharing on | PRD C line 90 and 125 (themes); BL-103 (BACKLOG line 69: Family Sharing off); Terms 14.1 and Subscription terms (backup, themes); Terms 14.12 (no Family Sharing) |
| Recordings | D-059: no audio upload in v1.0 (answers D-032) | Subscription terms list encrypted backup; Privacy Policy short version and section 7 |
| Safety | D-059: static "If you are struggling" row (answers D-034) | Privacy Policy sections 3, 5, 10 and 13 describe on-device support cards |
| Reminders before a trial ends (open: `legal` and `product`) | D-053: no server of ours sees purchases | Subscription terms "Reminders from us" promise email reminders. `docs/agents/DEBATES.md` Q-003, open, needs counsel |

ADR 0013 and ROADMAP now agree with D-053 and D-054, so they are no longer in the table.

**Price changes (hand-off to `legal` and `payments`).** The Subscription terms say "We never raise your price unless you agree." Apple asks subscribers to agree only above certain thresholds and otherwise just notifies them (App Store Connect Help, "Manage pricing for auto-renewable subscriptions"). So our promise holds only if every future increase keeps existing subscribers on their current price. Details in the subscriptions article notes.

**Build status (develop at 7cc43b1, the 3 Oct wave).** Built: sign-in (Apple, Google, email link and code; passkeys behind a flag), sync, co-parent invites, Plus on the device through Apple, export, in-app account deletion with the purge worker, language downloads, Settings home with Plan, Account, Privacy, Storage and Recordings. Not built yet, and marked in each article's notes: leaving a shared book, deleting a book from the app, Recently deleted, the Word for word switch, Names and words, and the web deletion page. Migrations from this wave are pending, not applied (`supabase/APPLY.md`), and nothing has been tested on a device for these articles.

**Early version.** D-060: the store listing never says beta, and the app keeps "early version, can make mistakes" at the top of Settings. No article says "beta". The deleting and exporting article mentions the early-version note next to export, and that sentence goes when the founder ends the note.

**Not checked by the content tests.** `packages/content/test/rules.test.ts` does not read `docs/support/`. Each review checks these files with the same patterns as that test (characters, emoji, fear words, the machine-writing list, the never-rewrite rule, and the D-053 Plus words), plus the VOICE.md bans: no gendered pronouns, and none of the words VOICE.md and K-26 retire. A follow-up for `content`: extend the test to read `docs/support/**`.
