# CR-61 amendment (Karma, Tue 17 Nov 2026, after Review B M4 at d38e8b69)

The decision stands: #764 ships with the needsConsent gap named truthfully; closing it is a round of its own (BL-922).
The premise is corrected in two places, from the code Review B cited:

1. The second book is never silent. A book made under a needsConsent session has no owner (takeOwnership runs only from
   onSignedIn), so when the person finishes setup (Settings > Account > Finish setup, then Agree) the claim screen shows
   before anything moves: "Keep your letters in this account?" with the second-book body ("This account already has a
   book. The book on this phone will be added to it as a second book. Nothing is deleted."), Keep in this account, and
   Not my account (which ends the session and leaves the phone as it was). Two books exist only after Keep. So BL-922
   scope (2), "show the claim screen at Finish setup", is already built by #737 and comes out of BL-922.
2. Recovery in build 13 is Hide this book, not Delete this book. Once Keep writes the owner, local deletion is refused
   (localDeletionAllowed is false) and server-side deletion (F17-REQ-026) is not built; the extra book can be hidden on
   the phone and removed by the operator on request. No letter is lost.

Why the decision holds: the path needs a Terms version bump between a returning account's last acceptance and a new
phone (the gate my_sync_gate() is per account), the person is told and chooses before a second book exists, and the
remaining cost (an extra, hideable book until deletion ships) is bounded and recoverable with support.

BL-922 now: (1) hold a needsConsent session with no local book out of the child step (re-push the consent sheet at
relaunch, or a held screen with a way forward and its own words); (2) the consent sheet's duplicate readAccountBooks and
double Start a book (lens A should-fix 3 at 5e896fed). Scope "claim screen at Finish setup" removed: built.

Revisit when: a Terms version bump is planned before BL-922 lands; any report of a second book from a family;
F17-REQ-026 (server-side book deletion) ships, when the recovery line changes.

Way back: BL-922, or a hold behind the consent sheet in a follow-up PR. Door: two-way with cost.
