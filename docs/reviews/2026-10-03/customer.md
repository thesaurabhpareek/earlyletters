# Customer review: emails, site, store, pages, legal drafts

Reviewer: independent customer and support reviewer (new US parents, multilingual families, a co-parent, a privacy-minded skeptic, and the person answering hello@).
Branch: `feat/email-brand-library`. Date: 2026-10-03.
Method: built the emails (`npm run build -w @scribe/emails`, 36 emails), read every `packages/emails/out/*.txt` and spot-checked the HTML (lang, alt, dark mode, size), then read `packages/content/src/emails/*.en.ts`, `site.en.ts`, `store.en.ts`, `pages.en.ts`, the in-app strings these emails point to (`strings.en.ts`) and the legal drafts in `packages/content/legal`.

## Verdict

**Ship the email library, but not the customer journeys yet.** The emails themselves are unusually good: calm, honest about money, every billing notice has the price, the date, the cancel-by date and the steps, and deletion is reversible and clearly dated. A tired parent can act on most of them in 5 seconds.

What would make a customer angry or confused is not the tone. It is these:

1. Promises the product does not keep in v1.0: "Vault mode" and "cloud transcription" on the site and in the store, and "Only the family you invite can read your letters" while staff can look in narrow cases (CUS-01, CUS-02).
2. Emails send people to app screens that have no copy yet: Settings, Plan; Request a refund; change email; the sign-in screens and "Trouble signing in?" (CUS-03).
3. A co-parent who deletes their account silently removes their letters from the child's book. The other parent is never told and gets no chance to keep a copy (CUS-04).
4. A co-parent on Android has nowhere to go, and nothing says the app is iPhone only (CUS-05).
5. "I signed in and my book is empty" (Apple Hide My Email or a different sign-in method made a second account) is the most likely sign-in ticket, and nothing answers it (CUS-06).

## Journey table

| # | Journey | Result | Why |
|---|---|---|---|
| 1 | Sign up with email link (verify-email, then welcome) | Pass, with notes | One clear button. The code works on another device. The 15-minute window is stated. The link token sits in the URL fragment, so link scanners cannot use it up. Notes: welcome says "tap the red circle" (colour-only, CUS-13) and "Only the family you invite can read" (CUS-02). |
| 2 | Sign up again with the same address (account-create-attempt) | Pass | Kind ("Easy to do on very little sleep"), gives a way in, and does not reveal that the account exists to anyone but the inbox owner. It names only Apple, not Google (CUS-10). |
| 3 | Sign in on a new phone (sign-in-link, new-device-sign-in) | Pass for email. **Fail** for what happens next | The email works. A free user who signs in on a new phone finds the letters but not the recordings (no backup without Plus). No email, FAQ or page says so at the moment it matters (CUS-08). |
| 4 | Sign-in trouble, including Apple Hide My Email | **Fail** | Seven paragraphs come before the button, so it fails the 5-second test on a 375px screen. It opens with an idiom ("a little shy"). It does not cover "I see an empty book" (CUS-06, CUS-07). The in-app "Trouble signing in?" entry and the "check your email" screen have no copy in `strings.en.ts` (CUS-03). |
| 5 | Sign in with Apple and with Google (apple-account-linked, google-account-linked) | Pass | Short and plain. One action: reply. Security replies depend on a 10-business-day support promise (CUS-09). |
| 6 | Invite a co-parent (Messages link, then welcome-coparent) | **Fail** | The welcome email itself is warm and clear about equal ownership. But an Android co-parent is a dead end (CUS-05). The email never says Plus already covers them (Terms 14.12), so the co-parent may start a second trial or pay twice (CUS-11). |
| 7 | Trial start, reminders, renewal (trial-started, trial-ending-*, annual-renewal-*, anniversary-reminder) | Pass | Best-in-class. Every notice has the price, the period, the charge date, the cancel-by date and the steps in words. It says deleting the app or account does not cancel. No dark patterns. The "Settings, Plan, Manage subscription" path does not exist in the app strings yet (CUS-03). |
| 8 | Cancel, end, price change (plus-cancelled, plus-ended, price-increase, plus-quiet) | Pass, with notes | Clear and kind. "New recordings are kept on your phone" is accurate, but it never says this means one copy only, on one phone (CUS-08). |
| 9 | Change sign-in email (email-changed-new-address, email-changed-old-address) | Pass for email. **Fail** for the app | Both emails are clear and safe. No in-app copy exists for where to change the email (CUS-03). If the change was not you, the only fix is "reply", with no response time promised (CUS-09). |
| 10 | Delete account in the app (reauthenticate-code, account-deletion-scheduled, account-deletion-cancelled, account-deleted, `pages.deleteAccount`) | Pass, with notes | Dated, reversible, offers export first, warns that Plus keeps billing. Notes: the effect on the co-parent's book is understated (CUS-04). "We keep only what the law asks" contradicts the page (CUS-12). |
| 11 | Delete account by email (deletion-request-received) | **Fail** | People write in because they cannot use the app. The confirm step is a normal sign-in email ("Tap to open your book") that does not mention deletion and opens the app. That is a dead end (CUS-14). |
| 12 | Export (in-app; export-ready is v1.1) | Partial | The site, the store and What's New promise "a PDF of the book". The in-app Export screen says "Plain text and audio files" (CUS-15). Nothing explains where the file lands on an iPhone. |
| 13 | Contact support (reply-to hello@, `/contact`) | Partial | "A person reads every message" is lovely. But a 10-business-day reply time is too slow for "someone else is in my account" (CUS-09). Mail to hello@ may split across two inboxes (Resend and Porkbun forwarding, `docs/emails/SECURITY.md:36`, open Q1), so a customer's reply can go unseen (CUS-16). No email tells people what to do if a sign-in email never arrives (CUS-07). |
| 14 | Privacy-minded parent reads site, store and Privacy Policy | **Fail** | The site and store describe Vault mode and cloud transcription, which `pages.en.ts:8` says are not in v1.0. "Only the family you invite can read them" is stronger than the About page and Privacy Policy, which say staff can look in narrow cases and that letters are not end-to-end encrypted (CUS-01, CUS-02). The About page itself is excellent and honest. |
| 15 | Multilingual family | Pass, with notes | Short sentences, dates written out, and a code box that screen readers read digit by digit. Idioms are scattered through the copy (CUS-17). The FAQ says fixes include "grammar slips". For a parent who mixes languages or speaks a dialect, that sounds like rewriting (CUS-18). |

## Findings

Severity: **High** = a customer is misled, stuck, or loses something; **Medium** = a predictable support ticket or a hit to trust; **Low** = polish.

### CUS-01 High: site and store promise features v1.0 does not have
- `packages/content/src/site.en.ts:71` ("If you ever choose cloud transcription, we ask first"), `:72`, `:73` ("unless you choose Vault mode"), `:111`; `packages/content/src/store.en.ts:172` ("unless you choose Vault mode"); `packages/content/src/strings.en.ts:548`.
- `packages/content/src/pages.en.ts:8` states v1.0 has "no Vault mode, no cloud transcription option". `legal/privacy.md:15,122` describes Vault as if it exists, and `privacy.md:34` defers only cloud transcription and the web page. A skeptical parent who goes looking for Vault mode will not find it, and an App Review accuracy check (2.3) can fail on the store text.
- **Fix:** founder confirms whether Vault ships in v1.0. If not, cut "unless you choose Vault mode" from site:73, site:111, store:172 and strings:548. Cut the cloud-transcription clauses from site:71, :72 and :111. Then add Vault to the "arrive after the first version" list in `privacy.md:34`. Store:172 should become: "With the optional backup, recordings are encrypted on your phone before upload. We keep a recovery key so we can help you restore them on a new phone."

### CUS-02 High: "Only the family you invite can read your letters" overclaims
- `packages/content/src/emails/auth.en.ts:103` (welcome), `site.en.ts:70`, `store.en.ts:187`.
- `pages.en.ts:71` and the site FAQ (`site.en.ts:83`) correctly say letters are not end-to-end encrypted and staff can look in narrow, logged cases. A privacy-minded parent who reads both feels misled. In v1.0, "the family" is also only the co-parent.
- **Fix:** welcome (auth:103): "Your letters are private. Only you, and your co-parent if you invite them, can read them in the app." Site:70 and store:187: "Only you, and your co-parent if you invite them, can read what you add to the book. Our staff look only in the rare cases our Privacy Policy lists." Keep "No ads" as it is.

### CUS-03 High: emails point to app screens that have no copy
- The emails cite "Settings, Plan, Manage subscription" (`billing.en.ts:37`, `:250`), "Settings, Plan, Request a refund" (`legal/subscription-terms.md:62`), "Settings, Your data, Delete account / Cancel" (`account.en.ts:44`), "tap Sign in with Apple in the app", "enter the code in the app" and "Trouble signing in?" (`auth.en.ts:46,63,113,125`).
- In `strings.en.ts:516-523` the settings sections are Book, Recordings, Your words, Family, Reminders and Your data. There is no Plan section, no Account or sign-in section (change email, sign-in methods, sign out), no refund entry, no code-entry or check-your-email screen, and no Cancel-deletion string. Sign-in is still "arrives in a coming update" (`strings.en.ts:786,799`).
- **Fix:** before these emails go live, add the in-app copy with exactly these labels: a `settings.sections.plan: "Plan"` section with "Manage subscription" and "Request a refund"; a `settings.sections.account: "Account"` section with "Sign-in email", "Sign-in methods" and "Sign out"; `auth.checkEmail`, `auth.enterCode` and `auth.trouble`; and `delete.accountScheduled` with a "Cancel deletion" button. Add a content test asserting that every "Settings, X, Y" path in the email copy matches a real label.

### CUS-04 High: a deleting co-parent silently empties half the child's book
- `account.en.ts:45` ("Letters you wrote in a book you share with a co-parent leave that book. The book stays with them."); `pages.en.ts:227`; `strings.en.ts:572`; catalog decision E-5 (no email when a member leaves).
- From the remaining parent's side: their partner's letters to their child vanish with no notice and no chance to keep them. This is the most painful case (separation), and it will become a support escalation. Recovering the letters later is impossible.
- **Fix (founder decision):** (a) Make the email to the deleting parent plain about the effect: "Your letters and recordings will be removed from the book you share with your co-parent. They will no longer be able to read them. If you would like them to keep a copy, export first and share it." (b) Show the remaining co-parent a calm in-app card, not an email, so E-5 still holds: "Some letters in this book are no longer available. Letters you wrote are not affected." (c) Consider letting the deleting parent choose to leave their letters in the shared book. That would need a privacy review.

### CUS-05 High: Android co-parents hit a dead end, and nothing says the app is iPhone only
- `site.en.ts:39,95` ("from their own phone"), `store.en.ts:181` ("from the free app on their own phone"), `lifecycle.en.ts:46`. The legal drafts say "Android, once available" (`subscription-terms.md:36,43`), but no customer-facing FAQ does.
- Many US couples use one iPhone and one Android phone. The co-parent taps the invite link and finds nothing to install.
- **Fix:** add a site FAQ entry: "Does my co-parent need an iPhone? Yes, for now. Early Letters is on iPhone first. Android is coming, and their place in the book will be waiting." Change site:39 to "from their own iPhone". The invite landing page (`/open`) should detect Android and say the same in one line, with an optional "Tell me when Android is ready" email.

### CUS-06 Medium-High: "I signed in and my book is empty" is not answered anywhere
- `auth.en.ts:121-127`, `pages.en.ts:181`.
- Typical causes: the parent joined with Apple and Hide My Email, then later used the email link with their real address or with Google, which made a second, empty account. Or they joined with Google and later typed a different address. account-create-attempt cannot catch these, because the addresses differ.
- **Fix:** add to sign-in-trouble (after the Hide My Email line) and to `/contact`: "See an empty book? You may have signed in a different way from the first time. Sign out, then use the way you first joined: Apple, Google, or the same email." Support also needs a runbook to merge or close a duplicate empty account.

### CUS-07 Medium: sign-in-trouble fails the 5-second test, and "no email arrived" has no answer
- `auth.en.ts:119-128`. Seven paragraphs come before the button. Its HTML is the largest email at 15.9 KB. The opener "Sign-in links are a little shy" is a metaphor that many non-native readers will not parse.
- **Fix:** put the fresh link and code first, after a one-line heading. Move the explanations below the code as short "If..." lines: "If the link opened on another device, type the code." "If you joined with Apple, tap Sign in with Apple." "If you see an empty book..." Cut "a little shy". For "no email arrives", add to the in-app check-your-email screen and to `/contact`: "Nothing yet? Wait a minute, then check Spam, Junk or Promotions for an email from hello@earlyletters.com. Still nothing? Use Sign in with Apple or Google, or write to us."

### CUS-08 Medium: the new phone loses recordings for free users, and nobody says so at the right moment
- `billing.en.ts:248,268` ("New recordings are kept on your phone"); `site.en.ts:72`; `pages.en.ts:244` mentions iCloud Backup only under deletion.
- The top anger case after launch will be "I got a new phone and my voice recordings are gone". The in-app note `strings.en.ts:539,550` is good but sits in Settings.
- **Fix:** add a site FAQ entry: "What happens to my recordings if I change phones? Your letters come with you when you sign in. Recordings come with you if backup is on (part of Plus), or if you move your phone with an iPhone backup or Quick Start. Without either, export them first." Add one line to plus-cancelled and plus-ended: "Without backup, recordings are only on this phone. Export a copy now and then."

### CUS-09 Medium: security emails say "reply straight away", but support promises 10 business days
- `auth.en.ts:149,165,179,197`; `pages.en.ts:167`.
- **Fix:** add to `/contact`: "Someone else in your account? Put Not me in the subject. We answer those first, within 1 business day." Add "with Not me in the subject" to the four security emails. Add an in-app "Sign out of other devices" so the safest step needs no human.

### CUS-10 Low: Google is missing from account-create-attempt and sign-in-trouble
- `auth.en.ts:46,125` mention only Apple, but v1.0 ships Google too (`auth.en.ts:154`).
- **Fix:** "If you first joined with Apple or Google, tap that button in the app instead."

### CUS-11 Medium: the co-parent is never told that Plus covers them
- `lifecycle.en.ts:46-49`; Terms 14.12 (`legal/terms.md:233`) says Plus covers the co-parent in that book, and Family Sharing is on. No site FAQ, store text or email says so.
- **Fix:** add a site FAQ entry: "If one of us has Plus, does the other need it? No. Plus covers both parents in the books it includes." In the app, the co-parent's Plus screen should show "Included through your co-parent" instead of a trial offer.

### CUS-12 Medium: "We keep only what the law asks" is not accurate
- `account.en.ts:87` (account-deleted) and `:31-32`. `pages.en.ts:245` also lists activity records for 24 months and support emails for 2 years, which no law requires.
- **Fix:** "A few records stay, with no letters or recordings in them: a record of what you agreed to (3 years, without your name), purchase records (7 years, for tax law), activity records (24 months, without your name) and support emails (2 years after your last one)." Use the same sentence in account-deletion-scheduled.

### CUS-13 Low: "tap the red circle" relies on colour
- `auth.en.ts:100`, `lifecycle.en.ts:28`. Readers with colour blindness and VoiceOver users cannot use it.
- **Fix:** use the record button's accessible label, for example "tap the big round button and talk".

### CUS-14 High: deletion by email has no way through for people who cannot use the app
- `account.en.ts:130-145` (deletion-request-received: "we will send a separate sign-in email"); `pages.en.ts:220-221`.
- The person who writes in usually has deleted the app, lost the phone, or is on Android. A standard sign-in-link email ("Tap to open your book", "Tap the button on the phone where the app is open") says nothing about deletion and lands them nowhere.
- **Fix:** send a dedicated "Confirm your deletion request" email whose link opens a web page (`/delete-account/confirm`) with one button, "Delete my account", plus the date and how to cancel. Change deletion-request-received to "we will send a separate email with a link that confirms it. It works in any browser."

### CUS-15 Medium: export says "PDF" outside the app and "plain text" inside
- `site.en.ts:103`, `store.en.ts:193,204` ("a PDF of the book"); `strings.en.ts:558` ("Plain text and audio files").
- **Fix:** make the app match what ships. If the PDF is in v1.0, change strings:558 to "Your letters, your recordings and a PDF of the book." If not, remove "PDF" from site:103, store:193 and store:204. Add one line to the export screen: "On iPhone it saves to the Files app. Choose where to keep it."

### CUS-16 Medium: replies to hello@ can be lost
- Every footer promises "Reply to this email. A person reads every one" (`chrome.en.ts:149`). `docs/emails/SECURITY.md:36` shows mail to hello@ going to Resend, with Porkbun forwarding as a fallback, so it can land in two inboxes. Replies to Apple relay users can bounce if the human inbox is not registered with Apple (`docs/emails/COMPLIANCE.md:446`).
- **Fix:** resolve open question Q1 to a single inbound route before launch. Register the reply path with Apple. Send a test reply to a relay address.

### CUS-17 Low: idioms trip non-native readers
- "a little shy" (`auth.en.ts:121`), "Easy to do on very little sleep" (`:44`), "sort it out" (`:108`), "straight away" (`:149,165,197`), "earning its place" and "No hard feelings" (`billing.en.ts:280,284`), "all set" (several).
- **Fix:** keep the warmth and swap the idioms: "fix it", "right away", "If Plus is not useful right now", "you are done".

### CUS-18 Low: "grammar slips" sounds like rewriting
- `site.en.ts:87`, `legal/terms.md:17`, `legal/privacy.md:70`, against "only fixes the slips a microphone makes" (`pages.en.ts:60`). The `agreement` edit ("she have" to "she has") is real, but a parent who speaks a dialect, or mixes languages, may not want it.
- **Fix:** use one phrase everywhere, with the example: "microphone slips, and one-word grammar slips like she have to she has. Each is marked and can be undone, or turn on Exactly as said."

### CUS-19 Low: no time zone on the new-device time; preview data is inconsistent
- `auth.en.ts:177` "{when}" renders as "9:14 pm" with no zone. **Fix:** render it in the account holder's time zone and add its short name ("9:14 pm ET").
- Preview fixtures: plus-started shows an Annual plan renewing 2 months after purchase, and anniversary-reminder (monthly plans only) previews "Plus Annual". **Fix:** correct the fixtures in `packages/emails/src/templates/fixtures.ts` so reviewers judge realistic dates.

## Top 10 support questions and where they are answered

| # | Question | Answered? | Where / gap |
|---|---|---|---|
| 1 | "My sign-in link doesn't work / expired / opened on my laptop." | Yes | sign-in-link, sign-in-trouble, `/contact` "Trouble signing in". Tighten per CUS-07. |
| 2 | "I never got the email." | **No** | Nothing mentions spam, Promotions or the sender address (CUS-07). |
| 3 | "I signed in and my book is empty." | **No** | Not covered (CUS-06). Hide My Email is covered in part in sign-in-trouble and `/contact`. |
| 4 | "How do I cancel the trial? Will I be charged?" | Yes, very well | trial-started, trial-ending-*, Subscription terms. |
| 5 | "I deleted the app or my account, why am I still being charged?" | Yes | trial-started, plus-started, account-deletion-scheduled, account-deleted, `/delete-account`. |
| 6 | "Does my partner need to pay or subscribe too?" | **Only in Terms 14.12** | Not in FAQ, store or email (CUS-11). |
| 7 | "My partner has an Android phone." | **No** | CUS-05. |
| 8 | "New phone: where are my recordings?" | Partly, in-app only | `strings.en.ts:539,550`; no FAQ or email (CUS-08). |
| 9 | "Who can read my letters? Can your staff?" | Yes on About and FAQ, contradicted elsewhere | `pages.en.ts:68-72`, `site.en.ts:83`; contradicted by welcome, site:70 and store:187 (CUS-02). |
| 10 | "How do I get everything out / delete everything?" | Mostly | `/delete-account` is excellent. Export format is inconsistent (CUS-15). Deletion by email dead-ends (CUS-14). |

Runner-up questions: "How do I get a refund?" (answered in billing emails and Subscription terms; the in-app entry has no copy, CUS-03). "How do I change my email?" (the emails exist; there is no in-app copy, CUS-03). "Where is Vault mode?" (CUS-01). "Does the book stop at age five?" (the store says "birth to five" at `store.en.ts:200`; nothing says what happens after. Add: "The book stays open as long as you like.").

## What is already right (keep it)
- Billing notices: price, period, dates, cancel-by date, steps in words, "deleting does not cancel", and no save offers.
- Deletion: 30-day grace period, dated receipts, export offered first, the Plus warning repeated, request numbers.
- Security emails: plain, one action, "we never ask for this code". Codes work across devices. Link tokens in the URL fragment.
- No child names in email, no tracking, and a real person at the reply address.
- HTML: `lang="en"`, logo alt text, digit-by-digit code for screen readers, dark mode handled in three layers, every email well under Gmail's clipping limit.
