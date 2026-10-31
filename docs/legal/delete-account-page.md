---
title: Delete account page copy (https://earlyletters.com/delete-account)
version: 1.1.0
status: draft-for-counsel
last_updated: 2026-10-31
owner: founder
for: the words of apps/web/src/lib/legal/delete-account-copy.ts. Each heading below is a key of that object; {brand.name}, {brand.storeName} and {contact} are filled as the page does today.
---

# Delete account page

## metaTitle

Delete your {brand.name} account

## metaDescription

How to delete your {brand.name} account, what is removed, and what we keep.

## title

Delete your {brand.name} account

## intro

This page is for {brand.storeName}. You can delete your account by email. Where your build of the app has the Delete account control, you can also delete it there (the early test builds hide it unless it is switched on, D-129). Deleting your account removes your letters and your account from our servers.

## inApp

**heading:** Delete it in the app, where your build has the control

**lead:** If Settings, Your data shows Delete account, this is the quickest way. If it does not, use the email steps below.

**steps:**

1. **Open Settings.** Tap Settings, then Your data.
2. **Choose Delete account.** You will see what happens to each book you are in.
3. **Export first, if you like.** Export everything gives you every letter and the recordings on this phone, free.
4. **Plus is not cancelled for you.** Deleting your account does not cancel Plus. Apple keeps billing until you cancel in your Apple Account subscriptions. You can delete your account either way.
5. **Confirm.** Type delete to confirm.
6. **Note the date.** The app shows the date your account will be deleted, 30 days from now.

## next

**heading:** What happens next

- You have 30 days to change your mind. Sign in before the date the app showed and choose Cancel, and everything comes back.
- After that, we erase your information from our live systems within 31 days of your request (except the kept book entry above), from our backups within 38 days, and from our service providers within 45 days. Our email provider keeps each email it sends for 30 days.
- When the 30 days end, every device signed in to your account is signed out.

## removed

**heading:** What is removed

- Your letters, from every book, including a book you share with a co-parent. That book stays with your co-parent.
- Any book where you are the only parent, with everything in it, except the letters of someone who left that book earlier (below).
- If someone left a book, or their joining was undone, before you deleted it, their letters stay theirs. We keep the book's entry with the child's name, birth date and due date to label those letters, clear its nickname, photo and other details, and delete it when nothing of theirs is left.
- If you used recording backup, your encrypted recordings and the keys that open them.
- Your account, your sign-in methods and your Sign in with Apple connection.
- Copies your co-parent already exported, and letters already on their phone, stay with them.

## kept

**heading:** What we keep, and why

**lead:** None of these hold your letters or recordings.

- Records of what you agreed to, for 3 years, without your name or email.
- Activity logs, and the log of each use of the recovery key, for 24 months, without your name or email.
- A record that the deletion happened, for 3 years.
- Security logs, for 12 months.
- Emails you send us about your request, for 2 years after your last message.

## email

**heading:** Cannot open the app?

- Email {contact} from the address on your account, with the subject "Delete my account".
- Please leave out letters, recordings and details about your child. We only need to know it is you.
- We reply within 10 business days. We send a code to that address to confirm it is you before we start. The same 30 days to change your mind apply.

**button:** Email us to delete your account

**subject:** Delete my account

If you only gave us your email on our website, use the unsubscribe link in any email from us, or write to the same address with the subject "Delete my email address".

## other

**heading:** Other requests

**body:** To download your book, correct something or ask what we hold, see your choices in our Privacy Policy.

**href:** /privacy#10-your-rights

## Changelog

| Version | Date | Change |
|---|---|---|
| 1.1.0 | 2026-10-31 | Adds the kept letters of a former member (D-116) and the book entry kept to label them; says the in-app Delete account control is used where a build has it and is hidden in the early test builds unless switched on (D-129). The website no longer serves /delete-account (content moved into /privacy, #169), so this copy now feeds the deletion section there. Version 1.1.0 because 1.0.0 is used. |
| 1.0.0 | 2026-10-16 | Deletion for an app with accounts and sharing. |
