# Writing with your co-parent

{child}'s book is lovelier with two voices. Invite your co-parent and you both write to {child}, in one book.

## What a co-parent can do

A co-parent writes, reads the whole book, and has the same say over it as you do. You are equals. Neither of you can remove the other, or change or delete the other's letters.

Inviting your co-parent is free, and so is everything they write.

## Invite your co-parent

You both need an account, so first sign in. See [Signing in](signing-in.md).

1. Open the **Family** tab.
2. Tap **Invite someone to write**.
3. Send the invite link in a message, or tap **Show code** to read out an 8-character code.

The invite is for {child}'s book only. If you have more than one child, invite your co-parent to each book you want to share.

The invite lasts 7 days. Until it is used, it shows as Invited, with **Send again** and **Cancel invite**.

## Accept an invite

1. Install Early Letters from the App Store, if it is not on your iPhone yet.
2. Tap the link. Or open the app, tap **I was invited**, and paste the link or type the code.
3. Sign in.

**"This invite has expired."** Ask for a new one. A new invite takes a moment to send.

**"We couldn't find that invite."** Check the link or code. Each invite works once, so ask for a new one if it was already used.

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

Inviting grandparents, aunts, uncles and friends to write arrives in a later update.

---

## Reviewer notes (remove before publishing)

**Built today (develop at 3688796):** the Family tab with the roles explanation; invites are not built. The tab shows "Inviting family needs an account ... Sign in arrives in a coming update" (`familyTab.inviteNeedsSignIn`).

**To build:** BL-170 invite tokens and deep links, BL-176 co-parent invite in the app, BL-190 invite redemption, BL-194 per-child sharing, leave and the last-parent guard (B-REQ-010, DATA-REQ-016), BL-171 and BL-051 sign-in.

**Sources:** PRD B F5 (invite flow, Show code, 8-character code, Invited, Send again, Cancel invite; "Show code" and "Cancel invite" are not in strings yet, so confirm the labels when `content` adds them), F7 (leave choices), F8 (equals rule, safety cases through support), F9 (visibility); K-09 (author-only original words); K-18 (7-day co-parent expiry); DATA-REQ-014 to 016; strings `family.invite.*`, `familyTab.coParentBody`, `children.sharing.oneBookNote`, `errors.inviteExpired`, A section 9 `invite.notFound`; PRD-REQ-015 (joined books do not count).

**Founder decisions this article depends on:**
1. **Co-parent only at v1.0** (brief decision 5). PRD K-35 and D-002 ship family contributors in the app at v1.0. If K-35 stands, remove the last section and add Family roles, approvals and "Family can read the book". The invite screen copy (`family.invite.body`: "You choose which ones go in the book") is written for family members; hand-off to `content`.
2. **Hearing each other's recordings.** Brief decision 9 says family members hearing each other's recordings comes in v1.1, with no audio upload in v1.0. D-032 (shared voice, recommended, decision by 23 Oct) would change this. The article states the v1.0 behaviour plainly but gently. Update it if D-032 is approved.
3. **Plus through Family Sharing.** See the subscriptions article notes.

**Leave path:** the exact Settings row name for leaving is not in strings yet. "Settings, {child}'s book, then leave" follows PRD C-REQ-016 (per-child page holds members and delete). Name the row when `content` adds it.

**Safety routing:** the court-order and safety line follows B F8.3 (support verifies and removes a member through the service-role runbook, BL-237). The macros and the escalation and safety routing guide (standing duty 2) will spell out what support asks for. We never ask for letter content.
