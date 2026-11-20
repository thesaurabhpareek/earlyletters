# Founder direction, 20 Nov 2026 (second round): photo library moments and pictures and videos with a letter

Status: founder direction, in his words (voice, partly garbled): "make sure product agents enhance their requirement doc to include that thinking, specially Apple Journal like access to photos folder and using that data to find what letter someone should write and attach pictures or videos to the letter. And make sure all other agents have updated their requirement for all enhancements in product spec."

Earlier direction (20-founder-direction-20nov.md, section on pictures): "attaching pictures would become really important for us and getting access to your Photos folder would allow us to look at your photos and see what you have been doing and based on that actually create nudge, think about what Apple Journal does where you select a picture and then you write a story about it."

## 1. What this changes

Three rulings made earlier on our own reading are now overtaken by the founder's direction. Each is recorded as a reversal, not silently changed (GAP-LOG RV-18 onward):

| Earlier position | Where | Now |
|---|---|---|
| Level 3 (library read access) is closed in 1.x; spike plan only | 20-founder-direction 6.1, NS-49 not-in-scope | Level 3 is specified in full as a card, behind its own flag, in drop C; the spike and gates are part of the card |
| No video (NS-01-R22; OPP-16 "not recommended") | 01-photo-with-a-letter.md, feature-opportunities.md | Pictures and videos can be attached to a letter; specified as a card with limits, storage, label and counsel gates |
| A letter holds one picture | NS-01 | A letter can hold several pictures and videos (limits proposed as defaults below) |

What does NOT change (constitution and privacy rules still bind; a feature that cannot meet them is redesigned, not waived):
- The machine may remove and repair, never add meaning. No caption, title, summary or story is ever written, suggested as words, or pre-filled from a picture. A nudge never describes what a picture shows.
- No picture, video, filename, album name, place or date from the library leaves the phone except by the parent's own act under the X2 rule (security read plus counsel read before a child's voice or picture leaves the phone, 00-product-frame.md:85) and E23.
- Analysis of the library is on the phone only. No server sees the library, a thumbnail or a derived signal.
- No face recognition or person matching (biometric laws such as Illinois BIPA and Texas CUBI are not read; UNVERIFIED; recommended: not built).
- Safety tiers stay on the phone. Real family data never in code, tests or fixtures (Asha only).
- Nothing counts or scolds: no "you have 40 unwritten days", no streaks, no gap counts, no fear, guilt or loss language.

## 2. Product shape proposed for the two new cards

Card NS-51, Photo moments (level 3): the parent opts in, once, to let the app look at the Photos library on the phone (limited or full read access, parent's choice; the app works with limited access). The phone finds "moments": a day or a few hours with several pictures, or a day around a birthday, month age, or a day the parent marked (NS-46). The app shows the parent their own pictures as a gentle invitation to write or say the letter that goes with them, in the capture area. Signals used: date, count and clustering only (place name off by default; no content classification, no faces). The lock-screen nudge never describes pictures: neutral wording only ("Some pictures from the weekend are here"), and it is one of the existing budgeted classes (NS-32), not a new class. Parent can pick which albums count, pause, or turn it off and the on-phone index is removed.

Card NS-52, Pictures and videos with a letter: attach one or more pictures and videos from the library or the picker to a letter; see them while reading; keep them in the book, Save a copy, export and delete; clear limits (defaults to propose: up to 6 pictures and 2 videos per letter, video up to 60 seconds and a size cap; founder confirms), compression and storage cost, sync (what leaves the phone, encryption, who can see it, family sharing rules), print (video not printed; a picture from a video frame is the parent's choice; QR to a video page is a question for print, counsel and finance), accessibility (alt text is the parent's words or none, never generated), and what happens to the audio in a video (it is not transcribed by default; transcription of a video's sound is a founder question).

## 3. Each function must update its requirements

Every function file gets a section "Addendum 20 Nov 2026: photo moments and pictures and videos" with new or changed FRs (same id style, new numbers), links to NS-51 and NS-52, changes to existing FRs it supersedes, questions with defaults, and an honest "cannot assess yet" where needed. Functions: support, marketing, operations, finance, data-and-measurement, privacy, legal, compliance, risk-security, back-office, messaging-and-entry-points, languages-and-localisation, reliability, ai-and-speech, research-validation, quality, lifecycle-and-platforms, print-and-fulfilment, photos-and-suggestions, notification-catalogue, days-library, cultural-background-data, feature-opportunities.

Known pressure points to assess (not decided):
- Privacy: App Privacy label (Photos or Videos collected if pictures leave the phone; "not collected" if they never do); Photos permission strings; limited-library handling; children's images; deletion and export of media; backup; shared devices.
- Legal and compliance: counsel read for a child's picture and video leaving the phone (X2); Apple 5.1.1 and Photos access rules; video of a child; biometric law (face matching not built); marketing claims.
- Security: signed URLs, encryption at rest, access rules per book and member, video file handling, malicious media, EXIF and GPS stripping on share, the second-account defect (FR-SEC-01 to 03).
- Data and finance: storage and egress cost per family per year; plan limits and what Plus contains (pricing is the founder's); retention; analytics allowlist (no content, no counts of library items).
- Reliability and operations: upload queues, resume, low storage, iCloud-optimised originals (download on demand), HEIC and Live Photo handling, video transcoding, background limits.
- AI and speech: whether anything on the phone may analyse images (default: no classification, metadata only); video audio transcription (default: off).
- Quality and research: test fixtures without real family media, device matrix, usability tests that cannot use real photos, the "no writing from pictures" rule tests.
- Print: pictures in the printed book (resolution, count), video not printable, QR option; lifecycle: deceased parent, divorce, deletion with media; support: lost media, "my pictures are missing" macros; marketing: no claims of "we find your best moments"; languages: strings in all packs.

## 4. Founder questions this raises (defaults proposed by the cards, not applied as decisions)

Q-PM-1 Level 3 access: limited library by default or full read access? Q-PM-2 Video limits and Plus. Q-PM-3 Do pictures and videos sync to our servers or stay on the phone only? (largest cost and counsel decision). Q-PM-4 Transcribe a video's sound? Q-PM-5 Place names in moment suggestions: default off. Q-PM-6 Any on-device image analysis beyond metadata: default no. Q-PM-7 Release drop: default after 1.0 is approved (drop C), spike first.
