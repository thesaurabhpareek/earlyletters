**BL-565 (S0, COMP-01).** D-138 item 1: publish a test version (0.9.0) of the app's own Terms and Privacy Policy before build 2 signs anyone in.

**This is `docs/legal/**`, so the founder merges it (D-125).** It was written by an agent and has had no legal review. It is not legal advice. Every legal reading below is marked **counsel must confirm**. COUNSEL_PACKET Q44 (old Q31, real families under draft texts) and Q58 still stand. Publishing these texts does not answer them. The packet's default is that no outside family signs in before counsel comments.

## Founder decision (8 Nov 2026): versioned URLs only
The two texts are published **only** at `https://earlyletters.com/legal/terms/0.9.0` and `https://earlyletters.com/legal/privacy/0.9.0` (and the raw `.md` of each). The live `/terms` and `/privacy` stay the website's own pages, unchanged. The website half is #652.

## What changed since the four reviews (head `e002f8ec`, two reviewers, CHANGES)
Only the two texts and their test changed. Each statement is now true of what exists, clearly scoped to the second test build or to what is planned, or removed. No promise was added or made stronger.
- **Scope line near the top of each text.** The text describes the second test build (servers on) and applies when that build is available to you. The first test build (servers off) keeps everything on the phone. The old "describes only what the test app does today" is gone. "When it is available" was added where the text said the second build can do something in the present tense.
- **Leaving a book and undoing a join are not in the app yet.** Terms 4.3 and 10.1 (leave a book, `LEAVE_BOOK_OFFERED = false`), Terms 3.3 and the short-version bullet (undo the join within 72 hours; no screen calls `undo_parent_join`).
- **Email routes say "we will do it by hand".** Delete account by email (Terms 10.1, Privacy 7), withdraw sync (Privacy 9), see, export, correct or delete (Privacy 10). Nothing built does these; the founder does them.
- **Privacy 7 states the email provider's 30-day retention.** The email we send when a deletion finishes, and the address on it, stays with the provider for up to 30 days after that, about 60 days after the request (data-policy.md "one stated exception").
- **Marked planned, or "once that part is running":** the 30, 31, 38 and 45 day deletion times, the keeping periods after deletion, the GitHub row (encrypted copies for 7 days), "stored in the United States", and Terms 10.1 "Deletion takes effect after 30 days".
- **The internal word "entry" is replaced** with "record of the book" (Privacy 7, three places; CR-25).
- **Removed:** "an individual based in California" (Terms 1.1, Privacy 1; no decision records it, the website says "its founder") and "we will ask you to agree in the app" (Terms top and 17; the app has no re-consent screen). The Terms top now says "we will tell you in the app", as Privacy already did.
- **Letters allowance** (Terms 8.1) follows the alpha decision text: "every letter you keep is free, and the test app lets you keep up to 100" (`alpha.ts`: the engine cap `MAX_FREE_LETTERS`; the docs say "no letter limit", the build holds the 101st).
- **Smaller truth fixes:** Resend "may receive" mail sent to our address; the speech model files come straight from Hugging Face (the R2 row no longer says "speech"); TestFlight feedback, such as a screenshot, can leave the phone.
- **Tests:** `packages/content/test/legal-beta.test.ts` has the two new hashes and 12 new tests (scope line, vocabulary, "by hand", planned markers, the email-provider sentence, leave and undo, no California individual, the allowance). 10 of the 12 fail on the old text; the other two (no internal word in the Terms, leave and undo in the Privacy Policy) pin what was already clean.

Every edit is in the second commit (word-level diff: `git show --word-diff fb65fe0d`).

## What changed (unchanged since the first push)
- `docs/legal/beta/terms-0.9.0.md` and `docs/legal/beta/privacy-0.9.0.md`: the beta texts and the source of truth. They are cut from Terms 4.1.0 and Privacy 3.0.0.
  - The first line says the text is a test version for family testers on TestFlight, has not had a full legal review, and will be replaced by a reviewed version.
  - Privacy lists everything that is not in the app yet. Terms section 8 says Plus is not part of the test.
  - Taken out because no build does them: Plus prices, trials and renewal, recording backup and the recovery key, the country check, the passkey and Google sign-in.
  - Added from the live website pages: the email list, unsubscribe, the IP held 10 minutes, no cookies, the sound setting. Also added: TestFlight feedback and crash reports, and the GitHub encrypted nightly backup (BL-566 runbook, now marked planned).
  - The opening sentence follows D-139.
  - There are no bracketed blanks. The publisher is "its founder", which is the website's own fallback. The legal name never goes in git.
- `packages/content/test/legal-beta.test.ts`: the `[BL-565]` tests. They check each file's version, status, URL and top line; the published-page rules from `legal-docs.test.ts`; the providers Privacy names; and **the sha256 of each file**, which is the immutability check from POLICY_VERSIONING 9.2.
- `docs/legal/POLICY_VERSIONING.md` 1.4.0: section 2.4 says where the 0.9.0 texts live and how they are served and hashed. When `packages/content/legal/` exists, they move there byte for byte.

## Consent (the Terms acceptance this text sits behind)
- **Shown:** the consent sheet after sign-in, "By continuing, you confirm you are 18 or older and agree to the Terms of Service and Privacy Policy." Its links open `brand.web.terms` and `brand.web.privacy`, which are the floating `/terms` and `/privacy`. Nothing in the app changes in this PR.
- **Records:** `policy_acceptances` gets document `terms`, version `0.9.0` (the newest row whose `new_users_from` is not after now), action `accept`, method `signin_sheet`, surface `auth.consent.terms` and context `{auth, age_attested: true}`, through `record_policy_act` (`apps/mobile/src/lib/auth/consent.ts`). No IP address.
- **Never:** recorded without the tap; recorded for a No to the age question; recorded against a version that has no published row.
- **Decline:** with "Not now", nothing is recorded. Sync stays paused, and letters stay on the phone.
- **Consequence of the decision above, for the founder:** build 2 is frozen and its sheet links to `/terms` and `/privacy`, which now stay the website's own short pages. A tester who taps Agree and continue records `terms 0.9.0`, but the page the sheet opened is not the 0.9.0 text. The 0.9.0 text is at its versioned address only. To make the record and the page agree, a later build must link to `/legal/terms/0.9.0` and `/legal/privacy/0.9.0` (and PR #635's `TERMS_DOC_VERSION` 4.1.0 and `PRIVACY_DOC_VERSION` 3.0.0 must become 0.9.0), or the founder accepts the gap for the family test. Not decided here.

## For the website lane (apps/web deploys from `main`; this PR does not touch it)
1. After this PR merges, copy `docs/legal/beta/terms-0.9.0.md` and `docs/legal/beta/privacy-0.9.0.md` **byte for byte** into the website (`apps/web/content/legal/terms/0.9.0.md`; #652 does it). Check `sha256sum` against the hashes below before you commit.
2. Serve the raw files unchanged at `https://earlyletters.com/legal/terms/0.9.0.md` and `https://earlyletters.com/legal/privacy/0.9.0.md`, as `text/markdown; charset=utf-8`. Do not change line endings or the trailing newline. The raw file keeps its frontmatter (the hash covers it), so `status: draft-for-counsel` and the `source:` path are public there.
3. Render the body (the frontmatter removed) at the permanent pages `https://earlyletters.com/legal/terms/0.9.0` and `https://earlyletters.com/legal/privacy/0.9.0`. The version line "Version 0.9.0, a test version." must stay at the top.
4. **Founder decision, 8 Nov 2026: the live `/terms` and `/privacy` are not replaced.** They stay the website's own pages. (This replaces the earlier step 4, "floating /terms and /privacy must show the same 0.9.0 text".)
5. Those two files are never edited after publication. Any change is published as 0.9.1 at a new path. Request an Internet Archive snapshot of each versioned URL (best effort, POLICY_VERSIONING 4).
6. Verify the hashes with `curl -sS https://earlyletters.com/legal/terms/0.9.0.md | sha256sum` and the same for privacy. Each must equal its hash below, and each HTML URL must return 200.

## `policy_versions` rows for APPLY step 8.2 (staging; insert only after step 6 passes)
The hashes changed with the edits above. Old values (head `e002f8ec`): terms `8da3bd2c...`, privacy `bcfd0603...`.

| document | version | url | content_sha256 (hex, of the bytes served at `<url>.md`) |
|---|---|---|---|
| `terms` | `0.9.0` | `https://earlyletters.com/legal/terms/0.9.0` | `dfa303a731edd0fe5a68e05157587e260b00ea55b286cd57512156d0da0e6af1` |
| `privacy` | `0.9.0` | `https://earlyletters.com/legal/privacy/0.9.0` | `4ec16856b2527cfdc7987f7cb8018fd1ab095b4ecf6093d0fcfcecf4f990cfe4` |

```sql
insert into public.policy_versions (document, version, change_class, requires_reconsent, published_at, new_users_from, effective_at, content_sha256, url, summary) values
 ('terms', '0.9.0', 'initial', false, now(), now(), now(), decode('dfa303a731edd0fe5a68e05157587e260b00ea55b286cd57512156d0da0e6af1', 'hex'),
  'https://earlyletters.com/legal/terms/0.9.0', 'Test version of the Terms for family testers of the TestFlight builds. A reviewed version will replace it.'),
 ('privacy', '0.9.0', 'initial', false, now(), now(), now(), decode('4ec16856b2527cfdc7987f7cb8018fd1ab095b4ecf6093d0fcfcecf4f990cfe4', 'hex'),
  'https://earlyletters.com/legal/privacy/0.9.0', 'Test version of the Privacy Policy for family testers of the TestFlight builds. A reviewed version will replace it.');
```
- My reading of "the sha256 of the served text": the hash is of the raw markdown at `<url>.md`, not of the HTML page, as POLICY_VERSIONING 7.2 says ("sha256 of the published English markdown"). If the founder wants `url` to be the `.md` itself, the hash does not change.
- If the founder edits either text before publishing, re-run `sha256sum`, then update the test, #652's copies and pins, and this table.
- **Sign-in also needs a `sensitive-data` row** (`docs/ops/AUTH_SETUP.md` section 1 item 4; the gate reads `terms` and `sensitive-data`). That row is not in this PR. Its text is `sensitiveConsent` in `packages/content/src/strings.en.ts`, owned by content and privacy. **Without it, build 2 sign-in still stops at "We couldn't finish setting up your account".**
- 1.0.0 must later be published as `major` with `requires_reconsent = true` (POLICY_VERSIONING 2.4).

## Founder facts still to confirm before publishing (the texts state them; nothing here verifies them)
- **D-129 outcome.** Both texts say "If your test build shows Delete account in Settings, you can start it there instead", next to email deletion by hand. True either way.
- **Deletion and keeping periods** hold only if the purge cron (APPLY step 7) and the purge worker (TESTFLIGHT step 12) run on staging. The text now says "planned, once that part is running".
- **GitHub backup (BL-566)**: the row says "(planned)". Remove "(planned)" and the future tense only when it runs (that is a new version).
- **Staging in a US region** (TESTFLIGHT step 6): the text says "We plan to store your information in the United States".
- **Still stated as fact:** data on our servers is encrypted at rest; access limited to the founder with two-factor authentication; "only the founder" can read letters; TestFlight visibility for the family group (Apple's behaviour, TESTFLIGHT_TESTERS A3 and A4).
- **Mail to hello@:** MX records send it to Resend or, as a fallback, to Porkbun forwarding (`docs/emails/SECURITY.md`, open question Q1). The text says Resend "may receive" it and does not name Porkbun or the founder's own mailbox. Pick one route, or name Porkbun.
- **No legal name, postal address or phone** (D-004 effects and Q47 default say a mailing address; the website is email only). Not decided.
- **Email routes are done by hand.** There is no built mechanism for account deletion by email, withdrawing sync, export or correction. The text now says so. The founder needs to be able to do each, with no runbook yet.
- No hosted system was touched. Nothing was applied to Supabase.

## Counsel must confirm (I am not a lawyer)
- Whether a published text saying it has not had a full legal review is acceptable, and whether family testers may sign in under it (Q44, Q58).
- Whether the sign-in-wrap is enforceable (D-138 item 3, BL-575).
- Contact by email only, with no legal name, postal address or phone number (Q47), and whether the Terms can say only "its founder".
- Venue "courts in California" with no county named, and California law now that the text no longer says the founder is based there.
- The liability cap and US $50 floor (Q39).
- The Apple section, with the refund line removed because the test app is free.
- The CCPA statements, including the reworded GPC line.
- The MHMDA and Connecticut consent and the email withdrawal path done by hand (Q48), and COPPA (Q45).
- Removing "under a written contract" for providers (Q11).
- The 45-day response time and the appeal path.
- Whether the two-sentence statement of the email provider's 30-day retention is enough (data-policy.md calls it "one stated exception"; COUNSEL_PACKET Q13).

## Claims mismatches found (claims registry; flagged to `content`, `privacy` and the founder, not fixed here)
1. `packages/content/src/strings.en.ts` `sensitiveConsent.changeLater` says "You can change this any time in Settings, Privacy.", but build 2 has no switch (`sensitiveHelp`; BL-485 (a)).
2. `billing.en.ts` "Every letter is free while you test." The alpha allowance is capped at 100 letters (`MAX_FREE_LETTERS`). The 101st letter is held. Terms 8.1 now says both.
3. Privacy 3.0.0 says the list address is kept "until you unsubscribe". The website code keeps it marked unsubscribed. The 0.9.0 text follows the code. 3.0.0 needs the same fix. Privacy 3.0.0 and 4.1.0 also need the email-provider sentence and the "entry" fix.
4. **New, from review:** the registered sign-in line "Only you and the people you invite can read your letters" (`strings.en.ts`, pinned byte for byte in `server-surfaces-auth.test.ts` and `experience-pass.test.ts`) sits beside the agree line in build 2, while Privacy 3 says letters are not end-to-end encrypted, so we could read them. The policy is the honest side. The string must change; no registered string is edited here. Same family: "the family you choose/invite" (`strings.en.ts`, `auth.en.ts`) against the two-parent limit.
5. **New, from review:** PR #635's `agreements.logic.ts` records `TERMS_DOC_VERSION` 4.1.0 and `PRIVACY_DOC_VERSION` 3.0.0; once 0.9.0 is what a tester opens they must become 0.9.0.
6. **New, from review:** `POLICY_VERSIONING.md` line 32 still says published text lives in `packages/content/legal/`, and the 0.9.0 to 4.1.0 and 3.0.0 relationship is only in the files' `source:` frontmatter.
7. Left as is: prose says "co-parent" where BRAND.md prefers "{child}'s other parent".

## Tests
- Before the edits, the new tests fail on the old text (12 of 28 fail, including the two hash tests); after, 28 of 28 pass. The first push was checked by moving `docs/legal/beta` away.
- `cd packages/content && npx vitest run`: 13 files, 308 of 308 pass.
- `npx tsc --noEmit -p packages/content`: clean.
- Not run: mobile, db and functions tests, because no code, SQL or function changed.

## Second round of reviews (8 Nov, after fb65fe0d)

Review B2 at fb65fe0d: PASS WITH NOTES. Review A2 at fb65fe0d: CHANGES, one must-fix, now fixed in the next commit:

- Privacy 7, "A letter": "You can also erase it at once." was true in the first test build and false in the second, which this text describes (a sync build shows no Erase now, `shelfActions` in `apps/mobile/src/components/book/shelf.logic.ts`). It now reads "In the first test build you can also erase it at once. The second test build does not offer that yet." The privacy hash changed; the new value is in the table above, the test pin and #652.

Left for the founder or counsel (not decided here; counsel must confirm anything legal):

1. Build 2's consent sheet and Settings rows open the website's own /terms and /privacy, while the consent record says 0.9.0. A tester agrees to a version the app never shows (POLICY_VERSIONING.md:105, D-138 item 3). A later build has to link the versioned URLs; until then the invitation and What to Test can carry both 0.9.0 links.
2. Two Terms and Privacy documents both claim earlyletters.com: the live short pages and 0.9.0. Which governs a visitor or list subscriber is a counsel question.
3. California: the text no longer says the founder is based there, but California law, courts, Civil Code 1668 and the CLRA, the 1789.3 notice and a CCPA paragraph remain. No legal name, postal address or county yet (D-004, Q47, T15, Q34).
4. "By hand" for deletion, withdrawing sync, see/export/correct, under-18 closure and TestFlight feedback deletion is honest, but no runbook or mechanism exists (BL-551, D-129). The founder must confirm he will do these.
5. The registered sign-in line "Only you and the people you invite can read your letters" and `auth.en.ts:149` contradict Privacy 3 in the frozen second build. The strings change before anyone outside the family signs in.
6. ALPHA_GO_NO_GO.md:51 (B2-9) should check the versioned URLs.
7. The scope sentence ("applies when that build is available to you") can be read as the whole policy waiting for the second build. Left as is: it is a legal scope statement.
8. Still stated as fact and unverified: staging region, purge worker, encryption at rest, two-factor, "only the founder" can read letters, the founder can do each by-hand route.

https://claude.ai/code/session_01NBzZMdFrvcifyquTUAekLF

---
_Generated by [Claude Code](https://claude.ai/code)_
