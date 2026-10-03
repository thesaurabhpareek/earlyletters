# Deleting and exporting

Your book is yours to keep, and yours to take with you. Export is free, always, with or without Plus.

## Export everything

Settings, Your data, **Export everything**.

You get one ZIP file with:

- every letter you wrote, with the words exactly as they first came out, each small fix, and the letter as you kept it;
- the letters your co-parent added to the book, as they kept them;
- every recording on this phone, exactly as it was recorded;
- your photos;
- a PDF of {child}'s book;
- a page you can open in any web browser to read the letters and play the recordings, even with no internet;
- a short guide to every file.

Export runs on your phone and works offline. A big book can take a few minutes. When it is ready, save it to Files, iCloud Drive or your computer.

Exporting now and then is a good habit. It is the one copy of your recordings that is entirely in your hands.

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

Settings, Your data, **Delete your account**. You can do it all in the app. There is nothing to email and no one to call.

1. The app shows what will happen to each book.
2. It offers to export everything first.
3. If you have Plus, it reminds you that deleting your account does not cancel your Apple subscription, and opens Apple's subscription screen if you want to cancel there. See [Plus and your Apple subscription](subscriptions.md).
4. You confirm.

**What happens.** Your letters, recordings and photos are removed from every book, including a book you share with a co-parent. That book stays with your co-parent. A book where you are the only parent is deleted with everything in it.

**You have 30 days to change your mind.** Sign in before the date the app shows and you can cancel.

**After 30 days,** your account is erased from our live systems. Copies in our backups are erased within 38 days of your request, and by the companies that help us run Early Letters within 45 days.

**Some things stay where they are.** Exports you already saved, and anything kept in your own iPhone backup, stay with you. A small record that you agreed to our terms is kept, without your name or email, so we can show what was agreed. Apple keeps its own record of any purchase.

## Deleting the app

Deleting the app removes everything it keeps on this phone, including recordings. If you are signed in and synced, your letters are still in your account. Recordings are kept only on your phone, so export first if you want to keep them.

Deleting the app does not cancel Plus. Cancel with Apple: see [Plus and your Apple subscription](subscriptions.md).

## Without the app

You can ask us to delete your account at {WEB_DELETION_URL}, or by email to {PRIVACY_EMAIL}. We send a sign-in link to the email on your account first, to make sure it is you.

## Still stuck?

Write to us at {SUPPORT_EMAIL}. Please do not send the letters themselves. Tell us which screen you are on and what you see.

---

## Reviewer notes (remove before publishing)

**Built today (develop at 3688796):** delete a letter from the letter screen with an Undo toast; Hide this book. Deleting a book is not built (the `settings.delete.book*` strings exist but no screen uses them; the row name "Delete this book" is from PRD B F2). Settings says export is coming (`settingsMore.exportNotYet`) and "Accounts arrive with sign in" (`settingsMore.deleteAccountNotYet`). Recently deleted is not built (no screen uses `settings.delete.recentlyDeleted`).

**To build:** BL-150 offline export (ZIP and PDF), BL-233 in-app account deletion, BL-220 account deletion billing step, BL-237 support deletion runbook, BL-243 static deletion page, plus Recently deleted and restore (DATA-REQ-010). BL-264 replaces the timed undo with a persistent toast for accessibility.

**Sources:** DELETION_AND_EXPORT_SPEC 2.2 (letter), 2.3 (book, equals rule), 2.6 (account, Apple 5.1.1(v), billing step), 4.1 and 4.2 (export contents, offline `index.html`, byte-identical audio); Privacy Policy section 10 (31, 38 and 45 days; consent records pseudonymised); PRD K-22, K-23; strings `settings.delete.*`, `settings.export.*`, `children.settings.hide*`.

**Narrowed by the brief of 3 Oct:**
- *Recordings in export.* The spec exports audio "on the phone or in backup". With no audio upload in v1.0 (brief decision 9), the article says "every recording on this phone". The co-parent's recordings are on the co-parent's phone, so this export includes their text only.
- *Family members.* Co-parent only at v1.0 (brief decision 5), so the sole-parent case leaves out "family members can save a copy" (`settings.delete.bookBody`). That string still mentions family; hand-off to `content` if the brief stands.

**Still open:**
- "After 30 days ... live systems": the policy says erased "within 31 days of your request". I said "after 30 days" for the grace period and kept 38 and 45 for backups and processors. Counsel may want "within 31 days" word for word.
- The web deletion page is reduced at v1.0 (PRD 3.0: static page plus email route). `{WEB_DELETION_URL}` comes from BL-243.
- Deleting the app removes recordings that were never exported. This is true whether or not D-033 passes, because deleting an app removes its iPhone backup data on the next backup (Unverified; general iOS behaviour). The sentence is kept factual and not alarming, per VOICE.
- "Delete your account" is the label (`settings.delete.accountTitle`).
