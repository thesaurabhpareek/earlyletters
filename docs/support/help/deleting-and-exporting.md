# Deleting and exporting

Your book is yours to keep, and yours to take with you. Export is free, always, with or without Plus.

## Export everything

Settings, **Export your book**, then **Export everything**.

You get one ZIP file with:

- every letter and note, as text;
- for the letters you wrote, a data file with your words exactly as you said them, every small fix, and the letter as you kept it;
- the letters your co-parent added to the book, as they kept them;
- every recording on this phone, exactly as it was made;
- a printable book for each child, by month (letters you kept private are not in it, but they are in the other files);
- a page you can open in any web browser to read every letter and hear every recording, with no connection;
- a short guide to every file.

Export runs on your phone and works offline. Nothing is sent anywhere. A big book can take a few minutes. When it is ready, tap **Save or share** to save it to Files, iCloud Drive or your computer.

The file is not locked with a password, so keep it somewhere private.

If the app says the export is larger than one file can hold, write to us and we will help you get every letter out.

Exporting now and then is a good habit. Settings notes that Early Letters is an early version and can make mistakes, and an export is a copy that is entirely in your hands. It is also the one copy of your recordings that you can keep anywhere you like.

## Delete a letter

Open the letter and tap **Delete**. You can tap Undo straight away.

After that, the letter waits in **Recently deleted** for 30 days. Tap **Restore** to bring it back. After 30 days it is erased.

You can delete only letters you wrote. Nobody can delete or change another person's words.

## Delete {child}'s book

Settings, {child}'s book, **Delete this book**.

- **If you keep the book on your own,** every letter and recording in it is removed, from this phone and from our servers.
- **If you share the book with a co-parent,** the book stays with your co-parent. Only your own letters and recordings leave it, and you leave the book.

Either way you have 30 days to change your mind. You can export first, free.

Want a rest instead? **Hide this book** quiets every reminder and note about {child}. Nothing is deleted, and you can show it again any time.

## Delete your account

Settings, **Delete account**. You can do it all in the app. There is nothing to email and no one to call.

1. The app shows what will happen to each book.
2. It offers to export everything first.
3. If you have Plus, it reminds you that deleting your account does not cancel Plus, and **Manage subscription** opens Apple's subscription screen if you want to cancel there. See [Plus and your Apple subscription](subscriptions.md).
4. Type "delete" to confirm.

**What happens.** Your letters are removed from every book, including a book you share with a co-parent. That book stays with your co-parent, with their letters. A book where you are the only parent is deleted with everything in it.

**You have 30 days to change your mind.** The app shows the date. Until then, cancel in Settings, Delete account, or by signing in again, and everything comes back as it was. We email you a receipt.

**After 30 days,** your account is erased from our live systems. Copies in our backups are erased within 38 days of your request, and by the companies that help us run Early Letters within 45 days.

**Some things stay where they are.** Exports you already saved, and anything kept in your own iPhone backup, stay with you. A small record that you agreed to our terms is kept, without your name or email, so we can show what was agreed. Apple keeps its own record of any purchase.

## Deleting the app

Deleting the app removes everything it keeps on this phone, including recordings. If you are signed in and synced, your letters are still in your account. Your recordings live on this phone, so export them first to keep a copy.

Deleting the app does not cancel Plus. Cancel with Apple: see [Plus and your Apple subscription](subscriptions.md).

## Without the app

If you cannot use the app, write to us at {PRIVACY_EMAIL} and ask us to delete your account. The page at {WEB_DELETION_URL} explains the same steps.

## Still stuck?

Write to us at {SUPPORT_EMAIL}. Please do not send the letters themselves. Tell us which screen you are on and what you see.

---

## Reviewer notes (remove before publishing)

**Built on develop (7cc43b1):**
- **Export:** `apps/mobile/src/app/settings/export.tsx` and `apps/mobile/src/lib/export/`. Contents from `packages/content/src/features/export.en.ts` lines 10 to 14 (the "What is inside" list) and the README lines 64 to 87 (printable book leaves out private letters; `index.html` works with no connection; recordings byte for byte). "Works without a connection. Nothing is sent anywhere." (line 15), "Save or share" (line 21), the unlocked-file notice (line 23), the too-big message (line 28). The words exactly as heard and the fixes are exported for your own letters only (`apps/mobile/src/lib/export/schema.ts` line 67). The path is the Settings row "Export your book" (`settingsHome.exportLabel`) and the button "Export everything" (`settings.export.button`, `strings.en.ts` line 627).
- **Account deletion:** `apps/mobile/src/app/settings/delete-account.tsx` with `apps/mobile/src/lib/account-deletion/`; words in `packages/content/src/features/account-deletion.en.ts` (type "delete" lines 42 and 43; date, cancel and receipt lines 41 and 49 to 54; Plus step lines 31 to 35, shown only with a subscription). Server: `request_account_deletion` schedules 30 days out (`supabase/migrations/20261002020000_data_governance.sql` lines 425 to 469, line 440); books with a co-parent stay with them (lines 450 to 455). The purge worker and its checks are in `supabase/migrations/20261004200000_ops_deletion_worker.sql` (an alert fires if anything deleted more than 31 days ago is still there, line 274) and `supabase/functions/purge-worker/`. That migration is pending, not applied (its line 4).
- **Delete a letter** with Undo: `apps/mobile/src/app/letter/[id].tsx`. **Hide this book:** `apps/mobile/src/app/settings/children/[id].tsx` line 62.

**Not built in the app yet:**
- **Recently deleted** (no screen uses `settings.delete.recentlyDeleted`). The server keeps deleted letters restorable until purge.
- **Delete this book.** The server function exists (`request_book_deletion`, data_governance.sql lines 491 to 517, the equals rule included), but `settings/children/[id].tsx` has no delete row.
- **The page at {WEB_DELETION_URL}.** D-042 (Recommended): a static page plus an email route at v1.0. `docs/ops/DOMAINS.md` line 12 lists `/delete-account` as "later".

**Changed in this review:**
- Paths follow Settings home (`apps/mobile/src/app/settings/index.tsx` lines 111 to 120): "Export your book" and "Delete account" are rows of their own.
- "Your photos" is gone from the export list: letters have no photos in this version (`photo: null`, `apps/mobile/src/lib/export/build.logic.ts` line 478). The account deletion "what happens" line no longer names recordings or photos, because recordings are not on our servers in v1.0 (D-059).
- "We send a sign-in link first" is gone from "Without the app". That is the full web flow, which D-042 moves to before Android.
- New, because they are built: the unlocked-file notice, the too-big help line, type "delete" to confirm, the receipt email, and the early-version line (D-060: the app keeps "early version, can make mistakes" in Settings, `strings.en.ts` lines 665 to 668, shown at the top of Settings home, index.tsx lines 80 to 86). Remove that sentence when the founder ends the early-version note.

**Hand-offs:**
- `content`: `accountDeletion.what.intro` (account-deletion.en.ts line 13) says deletion removes "your letters, recordings, photos and books from our servers", and `exportFirst.body` (line 28) promises "your photos" in the export. In v1.0 there is no recording upload (D-059) and no photos in the export (above).
- `legal` and support operations: the email route for deleting without the app has no runbook on develop. D-042 says a runbook handles it within LEGAL-REQ-031 times. The escalation guide (my standing duty 2) needs it, including how we confirm a request comes from the account holder.

**Placeholders:** `{WEB_DELETION_URL}` is `brand.web.deleteAccount` (https://earlyletters.com/delete-account). `{PRIVACY_EMAIL}` is still a placeholder in Privacy Policy section 1 (DOMAINS.md suggests a `privacy@` address; not decided).

**Still open:**
- "After 30 days ... live systems": the policy says erased "within 31 days of your request". I said "after 30 days" for the grace period and kept 38 and 45 for backups and processors (Privacy Policy section 10, unchanged on develop). Counsel may want "within 31 days" word for word.
- Deleting the app removes recordings that were never exported. Deleting an app also removes its data from the next iPhone backup (Unverified; general iOS behaviour). The sentence is kept factual and not alarming, per VOICE.

**Sources:** DELETION_AND_EXPORT_SPEC 2.2 (letter), 2.3 (book, equals rule), 2.6 (account, Apple 5.1.1(v), billing step), 4.1 and 4.2 (export contents); Privacy Policy section 10 (31, 38 and 45 days; consent records pseudonymised); PRD K-22, K-23.
