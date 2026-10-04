# Writing with your co-parent

> **Coming in version 1.1.** Writing together with a co-parent is not in this version yet. In this version every letter stays on your phone.

Invite your co-parent, and you can both write to {child}, in one book.

## What a co-parent can do

A co-parent writes, reads the whole book, and has the same say over it as you do. You are equals. Neither of you can remove the other, or change or delete the other's letters.

Inviting your co-parent is free, and so is everything they write.

## Invite your co-parent

You both need an account, so your co-parent can write from their own phone. If you have not signed in yet, the app asks you to first. See [Signing in](signing-in.md).

1. Open the **Family** tab.
2. Tap **Invite a co-parent**.
3. If you like, add what {child} calls them. It signs their letters.
4. Tap **Share invite link** and send it in a message.

The invite is for {child}'s book only. If you have more than one child, invite your co-parent to each book you want to share.

The link works once, for 7 days. Until your co-parent joins, the Family tab shows them as Invited, with **Share again** and **Cancel invite**.

## Accept an invite

1. Install Early Letters from the App Store, if it is not on your iPhone yet.
2. Tap the link. Or open the app, tap **I was invited**, and paste the link.
3. Sign in, then follow the steps the app shows.

Then you are in {child}'s book, and it arrives on your phone.

**"This invite has expired."** Ask for a new one.

**"This invite has already been used."** Each invite works once. Ask for a new one.

**"This invite was cancelled."** Ask for a new one.

**"We couldn't find that invite."** Check the link and try again.

## What each of you sees

- **Letters in the book.** You both read every letter that is in {child}'s book.
- **Private letters.** A letter either of you keeps private stays with its writer. You can add it to the book later.
- **The words as they first came out, and the small fixes.** Only the person who wrote the letter sees those.
- **Recordings.** Each recording is kept on the phone it was made on, so you hear your own. Your co-parent's letters reach you as words.

## Plus and your co-parent

If one of you has Plus, you can share it through Apple Family Sharing. See [Plus and your Apple subscription](subscriptions.md). A book you joined as a co-parent does not count as your free book, so you can still start one of your own.

## Leaving a shared book

Anyone can leave. Settings, {child}'s book, then leave.

- Choose **Leave my letters in the book** so {child} keeps them, or **Take my letters out**. Nothing is deleted either way.
- After you leave, you can still read, export and delete your own letters. You can no longer read the other letters in the book.
- The book stays with your co-parent.

If you are the only parent of a book, you cannot leave it, because then no one would look after it. The app offers to delete the book instead, with 30 days to change your mind. If you only want a rest, hide the book. See [Deleting and exporting](deleting-and-exporting.md).

## When things change between you

Families change. Each of you can keep new letters private, leave the book with your letters, and export your own letters, free, any time.

If you need help because of a court order or a safety concern, write to us at {SUPPORT_EMAIL}. Tell us it is about access to a shared book. We will ask for what we need to check, and we never need the letters themselves.

## Grandparents and other family

Inviting grandparents, aunts, uncles and friends to write is not in this version yet.

---

## Reviewer notes (remove before publishing)

**Version 1.1 (founder decision, v1.0 is on-device only).** This whole article describes co-parent sharing, invites, accounts and sync, which move to v1.1 (brief decisions 4 and 5, as amended in PR #33; the v1.0 build shows a "coming soon" screen in PR #54). Do not publish it with the v1.0 help centre. The notes below describe what is built on develop.

**Built on develop (7cc43b1):** co-parent invites end to end.
- Family tab: `apps/mobile/src/app/(tabs)/family.tsx`. Signed out, "Invite a co-parent" opens sign-in first (lines 93 and 94). Pending invites show "Invited" with "Share again" and "Cancel invite" (lines 160 to 168).
- Words: `packages/content/src/features/family.en.ts`. "Invite a co-parent" (line 19), the optional "What does {child} call them?" (lines 37 to 39), "The link works once, for 7 days. You can cancel it any time." (line 41), "Share invite link" (line 42), the accept screen with a pasted link (lines 50 to 68), and the error messages quoted in the article (lines 71 to 75).
- Server: `create_child_invite`, `revoke_invite`, `accept_child_invite` (`supabase/migrations/20261003000000_security_and_family.sql` lines 317, 349 and 366). A co-parent invite lasts 7 days (line 342). The app always sends the parent role (`apps/mobile/src/lib/family/invites.ts` line 3).
- Opening a link signed out lands on "Join the family book", then sign-in and consent (`docs/ops/AUTH_SETUP.md` line 284).

**Changed in this review:** the invite flow follows the build. There is no 8-character code and no "Show code": a co-parent joins by link only, and "I was invited" takes a pasted link (AUTH_SETUP line 189). "Invite someone to write" is now "Invite a co-parent", and "Send again" is now "Share again". The error messages are the built ones.

**Not built yet: leaving.** There is no leave screen, and no `leave_child` function in `supabase/migrations` (PRD B line 312 names `leave_child(p_keep_in_book)`). The only server path today is `request_book_deletion` with a co-parent (`supabase/migrations/20261002020000_data_governance.sql` lines 488 to 504), which removes the caller's own letters and leaves. That is "Delete this book" with a co-parent, not "Leave my letters in the book", and it deletes rather than keeps. Hand-off to `product`: B-REQ-010 needs its leave choices built, or this section changes. The last-parent guard exists (same file, line 361). The leave row name is not in strings yet.

**Settled (hand-offs, not founder decisions):**
1. **Co-parent only at v1.0:** D-055 (Decided) supersedes D-002. PRD K-35 still ships family contributors at v1.0. Hand-off to `product`.
2. **Plus through Family Sharing:** D-053. See the subscriptions article notes.
3. **Hearing each other's recordings:** D-059 answers D-032: no audio upload in v1.0 (DECISIONS.md lines 378 and 393). The "Recordings" line above is the v1.0 behaviour, and `readTogether.recordingElsewhere` says the same in the app.
4. **At most two parents per book:** D-069 is Recommended (founder OK needed). The article does not depend on it.

**Hand-off to `content`:** `familyTab.emptyBody` (`strings.en.ts` line 861), "Letters are lovelier with more voices.", counts a gap for a parent who keeps a book alone, the same issue the red team found in this article's first draft. The Family tab still shows it (family.tsx line 176).

**Wording:** the last section says "not in this version yet" rather than promising a later update. D-055 has the store listing, website and story cards say grandparents are "coming in a later update". Hand-off to `content` to pick one phrasing for every surface (red-team nit 4).

**Safety routing:** the court-order and safety line follows B F8.3 (support verifies and removes a member through the service-role runbook, BL-237; `ops.audit_log` lists a `safety_removal` runbook, `supabase/migrations/20261004200000_ops_deletion_worker.sql` line 37). The macros and the escalation and safety routing guide (standing duty 2) will spell out what support asks for. We never ask for letter content.
