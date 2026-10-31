# Release notes: v1.0.0 and the template for later releases

Applies to: App Store "What's New in This Version" (limit 4000 characters) and Google Play "What's new" (limit 500 characters per language). Release tag format from `CLAUDE.md`: `ios-v<major>.<minor>.<patch>`. Version in `apps/mobile/app.config.ts` is `1.0.0`; `eas.json` has `appVersionSource: remote` and `autoIncrement: true`, so the build number is assigned by EAS, not by hand.

Writing rules (from `packages/content/VOICE.md` and `CLAUDE.md`, enforced by `packages/content/test/rules.test.ts` when text moves into `store.en.ts`): no em or en dashes, curly quotes, ellipsis characters or emoji; no fear, guilt or loss language; no streaks or counts; never imply a machine writes anything; never gender the child; at most 3 exclamation marks across all product copy (use none); no other platform's name in iOS metadata (App Review 2.3.10); no "beta" in the v1.0 store listing (D-030, OPEN-21).

Every sentence below is checked against the code. A feature that is not in the build is not mentioned (Guideline 2.3.1).

## 1. v1.0.0 for Profile A (build as coded today: local-only)

Use this text only if you submit the binary that exists in `apps/mobile` now (OPEN-01).

### App Store, What's New (about 640 characters)

```
Hello. This is the first version of Early Letters.

Tell your child about today. Type a letter, or speak one and your voice is kept with it. Letters are filed by month of age in a memory book that stays on your phone. We never rewrite your words.

Choose your child's name, birthday or due date, and what they call you. Then a minute is plenty.

We would love to hear how it goes: hello@earlyletters.com
```

Notes:
- "Speak one and your voice is kept with it" is true today: the recording is saved. The words from a recording are not made in a release build (OPEN-12). If you want the reviewer and users to hear that plainly, add: "Words from your recordings arrive in a later update." Counsel and the founder decide whether that sentence is acceptable under D-030.
- It does not mention Plus, free letters, family, export or backup, because none of those work yet (see `README.md` capability table).
- The support address is the only contact in `apps/web/src/content/site.ts` (`hello@earlyletters.com`). Replace with the support address from OPEN-04 if it differs.

### Google Play, What's new (about 230 characters)

```
Hello. This is the first version of Early Letters. Type a letter to your child, or speak one and keep your voice with it. Letters are filed by month of age in a memory book on your phone. We never rewrite your words.
```

Google Play is not in v1.0 scope under D-013 (OPEN-20); this text is ready if that changes.

## 2. v1.0.0 for Profile B (v1.0 as designed)

Use only when sign-in, sync, family invites, Plus, export and speech to text have shipped in the binary and the pending migrations are live. Source is `packages/content/src/store.en.ts` `whatsNewV1`; reproduced here with a trial line added for the subscription disclosure.

### App Store, What's New

```
Hello. This is the first version of Early Letters.

Talk or type a letter to your child, keep your voice with it, invite family to add their own letters, read together, and export your memory book as a PDF. Your first two letters are free. After that, adding new letters needs Plus.

Plus is $4.99 a month with a 1-month free trial, or $49.99 a year with a 2-month free trial. It renews until you cancel, and you can cancel any time in your Apple Account settings. Every letter you have made stays yours to read, play and export, even if you stop.
```

The two price figures and trial lengths are the only figures allowed, and they come from `apps/web/src/content/pricing.ts` (`plusPricing`). Do not hand-type them in the console: generate this paragraph from that file so `apps/web/test/pricing.test.ts` style checks can cover it. (`in-app-disclosures.md` section 3 says the words "first 2 letters" must never sit in the same line as a trial or price; the paragraph above puts them in separate sentences within one block. Counsel to confirm, since the same document also flags the FTC "free" question, CR-012.)

### Google Play, What's new (about 330 characters)

```
Hello. This is the first version of Early Letters. Talk or type a letter to your child, keep your voice with it, invite family, read together and export your memory book. Your first two letters are free. Plus adds more and renews until you cancel.
```

## 3. Internal release record for v1.0.0 (not shown to users)

Fill this in at release time and keep it next to the tag. Do not put any real family detail, child name, email or transcript in it (CLAUDE.md privacy rules).

| Field | Value |
|---|---|
| Tag | `ios-v1.0.0` |
| Profile (A or B) | OPEN-01 |
| Commit | |
| EAS build id and build number | |
| Supabase migrations live (list the filenames) | OPEN-26 |
| Privacy label version submitted | `privacy-labels-apple.md`, profile |
| Data safety form version submitted | `data-safety-google-play.md` |
| Age rating answers | `age-rating.md` |
| Review notes version | `app-review-notes.md` |
| `npm test` result | |
| `npm run test:db` result | |
| `npm run typecheck` result | |
| Known limits shipped | e.g. speech to text not available (OPEN-12) |

## 4. Template for later releases

Copy this block for each release. Keep it short. Say what a parent can now do, in the order they will notice it.

```
[One warm line saying what this release is. No exclamation marks.]

New
- [What a parent can now do, in plain words.]

Better
- [What got easier or calmer.]

Fixed
- [What was wrong, said without blame or alarm.]

[Optional one line: where to write to us.]
```

Rules for every release:

1. **Only what is in the binary.** If a feature is behind a remote-config flag that is off, it is not in the notes (Guideline 2.3.1 and 2.3.12).
2. **No numbers except from the single source.** Prices and trial lengths come from `apps/web/src/content/pricing.ts` only. Release notes normally need no price; mention Plus only when the release changes what Plus does.
3. **Say it when the privacy answers change.** Any release that adds a data type, an SDK or a permission also updates `privacy-labels-apple.md`, `data-safety-google-play.md` and `permissions.md` in the same pull request, and the privacy policy version (`docs/legal/POLICY_VERSIONING.md`). A new permission string needs counsel's wording check.
4. **Migrations.** A release that depends on a database change names the migration filename in the internal record. Migrations only ship as a new file; never edit an applied one (CLAUDE.md).
5. **Size and language.** Apple: 4000 characters per locale. Google Play: 500 characters per language. English (US) only until another locale is built.
6. **No guilt, no counting, no streaks.** Never "you have not written in N days", never badges or points, never fear of losing memories.
7. **Never imply we write.** Say "fixes small slips", "keeps your words as you said them". Never "improved by", "polished", "generated", or any suggestion that software composed anything.
8. **Review notes.** If the review path changes (new sign-in method, new gate, new demo steps), update `app-review-notes.md` before submitting.
9. **Tag and record.** Tag `ios-v<major>.<minor>.<patch>`, and fill in the internal record in section 3 above.

### Worked example (a later release; invented for the template, contains no family detail)

```
A small update to make evenings easier.

New
- Choose the evening reminder time that suits your house.

Better
- Reading a letter back opens faster.

Fixed
- A recording that was interrupted by a phone call is now kept with its letter.
```
