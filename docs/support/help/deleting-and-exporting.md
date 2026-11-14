# Deleting and exporting

Your book is yours to keep, and yours to take with you. Export is free, always, with or without Plus.

## Export everything

Settings, **Export your book**, then **Export everything**.

You get one ZIP file with:

- every letter and note, as text;
- for the letters you wrote, a data file with your words exactly as you said them, every small fix, and the letter as you kept it;
- the letters your co-parent added to the book, as they kept them (version 1.1);
- every recording on this phone, exactly as it was made;
- a printable book for each child, by month (letters you kept private are not in it, but they are in the other files);
- a page you can open in any web browser to read every letter and hear every recording, with no connection;
- a short guide to every file.

Export runs on your phone and works offline. Nothing is sent anywhere. A big book can take a few minutes. When it is ready, tap **Save or share** to save it to Files, iCloud Drive or your computer.

The file is not locked with a password, so keep it somewhere private.

If the app says the export is larger than one file can hold, write to us and we will help you get every letter out.

Exporting now and then is a good habit. Settings notes that Early Letters is an early version and can make mistakes, and an export is a copy that is entirely in your hands. It is also the one copy of your recordings that you can keep anywhere you like. Settings, Export your book shows the date of your last export.

## Delete a letter

Open the letter and tap **Delete**. The app asks first: tap **Delete letter**, or **Keep it** to change your mind. Straight after, you can tap **Undo**.

The letter then waits in **Recently deleted** for 30 days, with its recording. Find it in Settings, **Recently deleted**. Each letter there shows the day it will be erased.

- Tap **Restore** to put it back exactly as it was.
- Tap **Erase now** to erase the letter and its recording from this phone at once. The app asks first.

After 30 days, the letter and its recording are erased from this phone the next time you open the app. A copy can still be in an iPhone backup made before then.

Deleting a letter does not give a free letter back. See [Plus and your Apple subscription](subscriptions.md).

You can delete only letters you wrote. Nobody can delete or change another person's words.

To take away a quiet-day mark, press and hold **A quiet day** in the book. You can tap Undo straight after.

## Delete {child}'s book

There is no way to delete a whole book in this version. You can delete its letters one at a time, as above, and export first, free.

If you have more than one book, you can also hide one: Settings, {child}'s book, **Hide this book**. It quiets every reminder and message about {child}. Nothing is deleted, and you can show it again any time.

## Delete your account

> **Version 1.1.** There are no accounts in this version, so there is no account to delete. To remove everything Early Letters keeps on your phone, delete the app (see below), and export first if you want a copy.

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

Deleting the app removes the letters and recordings it keeps on this phone. (From version 1.1, if you are signed in and synced, your letters are still in your account.) Your recordings live on this phone, so export them first to keep a copy.

One thing usually stays: a single number in your iPhone's Keychain, how many letters you have kept, so your two free letters are counted fairly if you install the app again. It holds no words, names or dates.

Deleting the app does not cancel Plus. Cancel with Apple: see [Plus and your Apple subscription](subscriptions.md).

## Without the app

> **Version 1.1.** This is about accounts, which are not in this version yet.

If you cannot use the app, write to us at {PRIVACY_EMAIL} and ask us to delete your account. The page at {WEB_DELETION_URL} explains the same steps.

## Still stuck?

Write to us at {SUPPORT_EMAIL}. Please do not send the letters themselves. Tell us which screen you are on and what you see.

---

## Reviewer notes (remove before publishing)

**Version 1.1 marks (founder decision, v1.0 is on-device only).** Marked above: co-parent letters in the export, Delete account, the synced-account line under Deleting the app, and Without the app. The `/delete-account` page and email route (D-042) cover accounts, so they are v1.1 too. Export itself is unchanged and runs on the phone.

**Re-checked against develop at ed16ca3 (14 Oct 2026), the shipping on-device v1.0:**
- **Delete a letter asks first** (D-085, `docs/DECISIONS.md` line 536): `apps/mobile/src/app/letter/[id].tsx`, the `ConfirmSheet` with `settings.delete.entryTitle`, `entryBody`, `entryConfirm` "Delete letter" and `keepButton` "Keep it" (`packages/content/src/strings.en.ts` lines 679 to 686). The Undo toast stays.
- **Recently deleted** (#98): `apps/mobile/src/app/settings/recently-deleted.tsx` lines 19 to 27 and 93 to 112 (Restore, Erase now, "Erased on {date}"). Strings lines 683 to 694 ("Letters you delete wait here for 30 days."; "The letter and its recording will be erased from this phone, at once."). The row is on Settings home (`apps/mobile/src/app/settings/index.tsx` line 118). The purge runs at launch (`apps/mobile/src/lib/capture/sweep.ts` lines 121 to 124; `apps/mobile/src/lib/capture/erase.ts` lines 29 to 31), file first, then the row. The screen's own comment (recently-deleted.tsx lines 23 and 24) says deleted text can remain in an old iPhone backup, so the article says so.
- **Last export** (D-085): `apps/mobile/src/app/settings/export.tsx` lines 146 and 147; `settings.export.lastExport` and `exportNudge` (strings lines 674 and 676).
- **Quiet-day marks** (D-084, #92): a long press removes a mark, with Undo (`apps/mobile/src/components/book/quiet-day-row.tsx` line 34; `apps/mobile/src/app/(tabs)/book.tsx` lines 82 to 84; `book.quietDay` strings lines 408 to 413).
- **Free letters:** a deleted letter still counts (D-083, DECISIONS.md line 527; `apps/mobile/src/lib/billing/letter-ledger.logic.ts` lines 4 to 8).
- **The Keychain count usually survives deleting the app:** letter-ledger.logic.ts lines 10 to 20. It holds only the number (`serializeKeychain`, line 66). So "Deleting the app removes everything it keeps on this phone" was no longer true and is replaced.
- **No Delete this book in v1.0.** `apps/mobile/src/app/settings/children/[id].tsx` has name, date, signature, reminders, the co-parent row and Hide this book, and no delete row. Hide shows only when there is more than one book (line 112). The `settings.delete.book*` strings (lines 695 to 701) are unused, and `bookBody` names "our servers", which v1.0 does not use. The old section said "Settings, {child}'s book, Delete this book" and is replaced.
- **Export:** `apps/mobile/src/app/settings/export.tsx` and `packages/content/src/features/export.en.ts`, unchanged in substance since my last check.
- **Account deletion** (version 1.1): Settings shows Delete account only when `capabilities.signIn` is on (index.tsx lines 123 to 125; `apps/mobile/src/lib/capabilities.ts` lines 44 to 48).
- **Not built:** the page at {WEB_DELETION_URL} (D-042). It covers accounts, so it is version 1.1.

**Open question (product, then counsel):** v1.0 has no way to delete a whole book and no "Erase everything" path. D-083 refers to Erase everything (it resets the free count). `eraseLetterLedger()` exists (`apps/mobile/src/lib/billing/gates.ts` lines 114 to 124) but no screen calls it. Until one ships, deleting letters one at a time, or deleting the app, are the only ways to remove local data, and deleting the app usually leaves the Keychain count. D-083 already asks counsel about the Keychain count.

**Changed in the 3 Oct review:**
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
