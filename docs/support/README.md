# Early Letters help centre

Owner: `support` (Customer Support Lead). Status: draft for review, written before launch from the product as specified. Last updated 3 Oct 2026.

These articles answer the questions parents ask most. They speak in the product's voice (`packages/content/VOICE.md`): warm, calm, short sentences. They follow the content rules in `CLAUDE.md`.

## Articles

| Article | What it answers |
|---|---|
| [Signing in](help/signing-in.md) | Apple, Google and email sign-in, the email link and code, a new phone, signing out |
| [Recording and transcription](help/recording-and-transcription.md) | How speaking a letter works, languages, the small slips we fix, and what we never change |
| [Your privacy](help/privacy.md) | Who can read your letters, where recordings live, what we never do |
| [Deleting and exporting](help/deleting-and-exporting.md) | Export everything, Recently deleted, deleting a letter, a book or your account |
| [Plus and your Apple subscription](help/subscriptions.md) | What stays free, free trials, cancelling, refunds through Apple, Family Sharing |
| [Writing with your co-parent](help/co-parent.md) | Inviting a co-parent, what each of you sees, leaving a shared book |

## When you write to us

You never need to send us your letters, your recordings or your child's name to get help. Tell us what you tapped and what you saw. In the app, Settings, Help, Support adds the app version and your plan for you, and nothing else.

If things feel heavy, Settings, Help, If you are struggling lists people you can talk to, any time. In the United States you can also call or text 988.

## How these articles mark what is not ready

- Text without a mark describes the first version of the app (v1.0) as the founder has decided it.
- "In a later update" in an article means the founder has decided it comes after v1.0.
- Each article ends with **Reviewer notes**, which are for the team and are removed before publishing. They say what is built today, what is still to build (with backlog ids), where the article comes from, and anything that needs a decision.

## Placeholders to fill before publishing

| Placeholder | What it becomes | Where it is decided |
|---|---|---|
| `{SUPPORT_EMAIL}` | The support mailbox | `packages/brand` (`publisher.supportEmail`, BL-100). The brief of 3 Oct says hello@earlyletters.com is live; the founder decides whether support uses it. |
| `{PRIVACY_EMAIL}` | The privacy request mailbox | Privacy Policy section 1 |
| `{WEB_DELETION_URL}` | The page for deleting an account without the app | BL-243 |

Legal pages use the addresses in the brief of 3 Oct (decision 13): https://earlyletters.com/terms, /privacy, /health-privacy and /subprocessors.

## Reviewer notes (remove before publishing)

**Where the two sources disagree.** The brief of 3 Oct (`docs/agents/BRIEF-2026-10-03.md`) and PRD 1.3 (`docs/prd/PRD.md`) were both written on 3 Oct, and the brief came about 25 minutes later. My charter tells me to follow the brief, so these articles follow it on every point below. The other documents still need to change to match it, or the founder needs to reverse it. Hand-offs: product (`product`) for the PRD and backlog, legal (`legal`) for the published terms.

| Topic | Brief of 3 Oct (these articles follow) | Still says otherwise |
|---|---|---|
| Sign-in | Apple, Google and email link at v1.0; passkeys can be added after sign-in (decision 4) | PRD 2.1 and D-044: Google in v1.1; BL-302 in the v1.1 table; PRD 2.2: passkeys out of scope. No backlog task for passkeys. |
| Family | Co-parent only at v1.0; other family later (decision 5) | PRD K-35 and D-002 (family contributors in the app at v1.0); `family.*` invite strings; Privacy Policy section 7 |
| Plus and the co-parent | Co-parent gets Plus through Apple Family Sharing, which is turned on; no server of ours sees purchases (decision 3) | ADR 0013, BL-103, ROADMAP week 3 and TDD 08: Family Sharing off; Terms 14.12: Family Sharing not available at launch; PRD K-28: Plus per account, covering the co-parent through the server |
| Recordings | No audio upload in v1.0 (decision 9) | Subscription terms list encrypted backup as a Plus feature; Privacy Policy short version and section 7; `settings.backup.*` strings |
| Safety | A static "If you are struggling" row (decision 9) | Privacy Policy sections 3, 5, 10 and 13 describe on-device support cards |
| Reminders before a trial ends | No server of ours sees purchases (decision 3) | Subscription terms "Reminders from us" promise email reminders, which need the server to know about a trial |

**Build status today (develop at 3688796).** The app runs on the phone only. There is no sign-in, sync, export, deletion flow, Plus purchase or co-parent invite yet. The Settings screen says so (`settingsMore.*NotYet` strings). Every article lists its own blocked tasks.

**Not checked by the content tests.** `packages/content/test/rules.test.ts` does not read `docs/support/`. This run checked these files with the same patterns as that test (characters, emoji, fear words, the machine-writing list, and the never-rewrite rule), plus the VOICE.md bans: no gendered pronouns for anyone, and none of the words VOICE.md and K-26 retire. A follow-up for `content`: extend the test to read `docs/support/**`.
