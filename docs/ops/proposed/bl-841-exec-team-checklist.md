# Exec-team checklist for the media and photo counsel questions (BL-841, PROPOSED, internal)

Status: **PROPOSED**, 23 Nov 2026, written by `compliance-engineer` under exec ruling 6. **Sent nowhere.** It is for the exec team's own review only (CLO, CCO, Chief Privacy Officer: Claude roles, not licensed lawyers; this is not legal advice). D-172 (founder, 23 Nov 2026): there is no outside counsel, the exec team's review stands in for counsel, and the Fri 27 Nov counsel-decision date is superseded. Nothing here is counsel-approved, and no reviewer may mark an item "approved by counsel". The record of a review is a ruling in `docs/agents/cto/RULINGS.md`, not a tick on this page.

This replaces the "founder takes the brief to counsel" step in BL-841 (`docs/BACKLOG.md`) with an internal read. The questions are the council's merged brief, CB-1 to CB-28, in `docs/roadmap/next/03-requirements/NX-39-council-record-10nov.md` section 5. This page does not restate them; it says which ones gate what in 1.0 and what each reviewer checks.

## Why this exists now

D-169 (founder, 22 Nov 2026): 1.0 ships with the photo library read **off** unless all five photo gates (CPrivO-29) close by Fri 27 Nov 2026. The switch is off by default (`apps/mobile/src/lib/photos/flag.ts`) and production sets no `EXPO_PUBLIC_PHOTOS` (`apps/mobile/eas.json`). So the default answer for 1.0 is: photos stay off, and the claims in `docs/legal/CLAIMS-1.0.md` section 4 stay `held`.

## What a review must produce

For each item below, one line in a ruling: the item id, the reviewer's role, a reading ("engineering reading, confirm with a licensed lawyer" if anyone later engages one), and the effect on the claims registry. If a question needs a primary source that was not fetched, write "not verified" and do not rule.

## Items that gate turning the photo flag on (Tier A, before P0 and P1)

| Item | Question in one line | Who reads | What changes if the answer is yes or no |
|---|---|---|---|
| CB-1 | Are the candidate promise forms (PW-A to PW-D) accurate, given device backup, iCloud-only originals, synced letter words and the parent's export? | CLO, CCO | Which "we do not receive" line may appear at all. Rows M-03 in `CLAIMS-1.0.md`. |
| CB-2 | Does reading date and city on the phone, with nothing leaving it, keep the Photos, Precise Location and Coarse Location label answers at No? | CPrivO | `docs/legal/app-store-privacy-labels.md` row for Photos or Videos (line 54). Row M-01. |
| CB-3 | Does adding media need a material-change notice and a policy version bump (`docs/legal/POLICY_VERSIONING.md`)? | CLO | Privacy and Terms versions; the 30-day gap. |
| CB-4 | Is a consent act of our own needed beyond Apple's prompt? Which key? | CPrivO | `consent-manifest` and PRIV-R21 lines (Shown, Records, Never, Decline). Row M-06. |
| CB-5 | Words for `NSPhotoLibraryUsageDescription` and the pre-sheet | CLO, CPrivO | The purpose string. None is drafted in this PR. |
| CB-6, CB-7, CB-8, CB-9 | Right-to-add term, other people's images, children's media, other people's voices in video | CLO | Terms text; not a 1.0 build change while the flag is off. |
| CB-10, CB-11, CB-12 | City-level place: precise geolocation or not, which state rules, geocoder or bundled table | CPrivO | Whether "we do not collect your location" stays true. |
| CB-13 | Export and print: does "stays on your phone" survive? | CPrivO, `data-architect` | Export README line; `docs/legal/DELETION_AND_EXPORT_SPEC.md` 4.2 (BL-868, CR-62 item 3: stripped copy only). |
| CB-14 | Picker-only within App Review 5.1.1(iii); Journaling Suggestions entitlement | CCO | Not read: the full Apple Developer Program License Agreement. Mark "not verified". |

## Items for later phases (not 1.0)

CB-15 to CB-20, CB-12b, CB-25 to CB-28 (Tier B: library read, derived data, background reading, hidden days, narrowing of access) and CB-21 to CB-24 (Tier C: occasions and reminders). CB-20 must be ruled before the background flag can ever be on in a shipped build. These stay open; none gates 1.0 while the flag is off.

## Before any flag change (Karma's check)

1. All five photo gates in CPrivO-29 are closed and each has a ruling. Not verified: where the five are listed; the fifth is not named in anything I opened.
2. `docs/legal/CLAIMS-1.0.md` section 4 rows M-01 to M-06 are moved into live sections with a backing test each.
3. The label-effect guard (`docs/product/prd/07-remaining-capability-rows.md` OQ-2, with `security-architect`) exists and fails if the flag and the label disagree.
4. `docs/legal/app-store-privacy-labels.md` is updated in the same pull request that turns the flag on, and App Store Connect is updated by the founder (a physical act, `docs/release/FOUNDER_QUEUE.md`).
5. Privacy Policy and Terms text has been through the exec-team read and is published before the build ships (the live page covers the website only today: `docs/store/app-store-connect-1.0.md` section 4).

## Not done here

- No question is answered. No law is said to apply or not apply.
- No counsel, regulator or user was contacted. Nothing was sent.
- The `COUNSEL_PACKET.md` Q58 onward entries and the `compliance-register.md` edits named in BL-867 are not in this PR; they belong to a follow-up once the exec team has ruled on the order of review.
