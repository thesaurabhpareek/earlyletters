# Early Letters: Email identity

v0.1, 2026-10-03. Owner: B3 (brief: `docs/emails/BRIEF.md`). Copy: `packages/content/src/emails/chrome.en.ts`. Assets: `packages/brand/assets/email/`, `packages/brand/assets/favicon/`.
**(opinion)** marks judgement. **UNVERIFIED** marks a claim not confirmed against a primary source on this date.

An email from us should read like a short letter from a kind friend who happens to run a careful company: one idea, one action, a sign-off, and a quiet footer that tells you why it came. The design language rule applies unchanged: **quiet UI, loud letters**.

---

## 1. Principles

1. **One action per email.** The logo is not a link. The footer has at most three small text links. Nothing competes with the button in the body.
2. **Same face every time.** One From name, one address, one header, one footer. Recognition is our best phishing defence: people learn what a real Early Letters email looks like.
3. **Readable with images off, in dark mode, and on a lock screen.** Every element degrades to text that still makes sense.
4. **Nothing watches the reader.** No tracking pixels, no click tracking, no remote fonts or images from other hosts, no "view in browser" (personal mail is never hosted).

---

## 2. From name and address

| Field | Value | Rule |
|---|---|---|
| From name | `Early Letters` | Exactly the brand name from `packages/brand/index.ts`. No "Team", no "from", no person's name, no emoji, no tagline. |
| From address | `hello@earlyletters.com` | A real, read inbox. Never `no-reply@`. |
| Reply-To | same as From | A reply reaches the founder. Footer says so ("A person reads every one"), so it must be true. |
| Envelope / Return-Path | `send.earlyletters.com` (Resend's default return-path subdomain) | Must be registered with Apple, see section 7. |
| Commercial mail (later) | `Early Letters <hello@news.earlyletters.com>` | Separate subdomain so newsletter reputation never touches sign-in delivery. Same From name. |

**Family emails (invites, "Nani wrote a letter").** Keep the From name `Early Letters`. Do not use `Nani via Early Letters` or a person's name as the From name **(opinion)**: a changing From name looks like spoofing, breaks the "same face" rule, and the person's name reads better in the subject anyway ("Nani wrote a letter to {child}").

**Never** put a child's name in the From name, subject or preheader of an email that could show on a shared or lock screen without the parent choosing it (D-025 spirit). Subjects use `{child}` only where the copy lane decides it is wanted, and never in security mail.

---

## 3. Subject and preheader

**Subject**
- Sentence case. 45 characters or fewer preferred (fits most phone inbox rows).
- Says what happened or what to do, plainly: "Your sign-in link", "Confirm your email to start your book".
- No brand prefix such as `[Early Letters]`: the From name already says it.
- No ALL CAPS, no emoji, no exclamation marks in transactional mail, no urgency words ("Action required", "Final notice"), no fake reply prefixes (`Re:`).
- **Never put a sign-in code or link in the subject or preheader.** Both show on lock screens and in notification previews.

**Preheader**
- 40 to 90 characters. Adds the next useful fact, never repeats the subject. Example: subject "Your sign-in link", preheader "It works once, for 1 hour. You can also use the code inside."
- Rendered as hidden text at the top of the body, followed by a spacer run (`&#847;&zwnj;&nbsp;` repeated) so body text does not leak into the preview (D1 owns the markup).

---

## 4. Header

### 4.1 What goes in it, and why
Only the logo, left-aligned, like a letterhead. **No nav bar, no "view in browser", no date, no tagline, no account name.**

Why: the header's only job is recognition in the first glance. Every extra element is a link a phisher can copy, a thing to translate into dark mode, and a line of preview text lost. Left alignment matches how the eye starts reading a letter and keeps the logo near the heading **(opinion)**.

### 4.2 Sizes and spacing (CSS px)

| Item | Value |
|---|---|
| Container | 600 max, fluid below; side padding 24 on mobile, 40 at 600 |
| Space above logo | 32 |
| Logo | **160 x 28** display (interim lockup); PNG at 2x = 320 x 56 |
| Space below logo to heading | 24 |
| Divider under header | none (space does the work) |
| Logo `img` attributes | `width="160" height="28"`, `style="display:block;border:0;outline:none;height:auto;max-width:160px"` |

When direction A or B replaces the interim lockup, keep the display height between 24 and 40 and the width at or under 200 so the header stays quiet. Each direction's `manifest.json` gives its exact size.

### 4.3 Alt text
`alt="Early Letters"` (from `emailChrome.header.alt`). Style the `img` so the alt text itself looks like a wordmark when images are blocked: `font-family: Literata, Georgia, 'Times New Roman', serif; font-size: 20px; line-height: 28px; font-weight: 500; color: #2B2722`. Outlook desktop and some corporate clients block images by default; the reader then sees the name set in Georgia, which is a fine wordmark on its own (see mock, frame 4).

### 4.4 Dark mode
Three client behaviours, three answers:

| Client behaviour | Examples | What we do |
|---|---|---|
| Honours `prefers-color-scheme` | Apple Mail (iOS, macOS), Outlook for Mac, some others | Ship two `img` tags. `logo-light.png` shown by default; `logo-dark.png` hidden (`display:none; mso-hide:all; max-height:0; overflow:hidden`) and swapped in by `@media (prefers-color-scheme: dark)`. |
| Rewrites colours with attribute hooks | Outlook.com and Outlook apps (`[data-ogsc]`, `[data-ogsb]`) | Same swap, duplicated under `[data-ogsc] .logo-light {display:none}` / `[data-ogsc] .logo-dark {display:block}`. **UNVERIFIED** in current Outlook builds; D1 tests. |
| Forces dark colours, ignores our CSS, does not swap images | Gmail apps on iOS and Android | `logo-light.png` stays. It carries a **halo**, so it still reads on a dark page. |

**The halo.** Each transparent PNG has the glyph outline stroked underneath in the opposite surface colour: `logo-light` has a 0.7 px paper (`#FBF8F3`) edge at 92 percent opacity; `logo-dark` has a 0.7 px near-black (`#161412`) edge. On the background it was made for, the edge matches the page and disappears. When a client puts it on the wrong background, the edge outlines every letter so the name stays readable. Rendered and checked on `#FBF8F3`, `#FFFFFF`, `#161412`, `#1F1F1F`, `#2B2B2B` and `#121212` (see `packages/brand/assets/email/source/mock-375.png`). It looks like outline lettering in the forced case: legible, slightly less elegant, and only in clients that refuse to let us choose **(opinion: the right trade)**.

Why not a solid background plate behind the logo? A cream rectangle on a dark Gmail page is louder than an outlined wordmark and breaks "quiet". Why not an accent-colour logo that works on both? `#8A5A3B` on Gmail's dark surfaces is about 3:1, below what a small serif needs.

Whether Gmail's apps ever invert images is reported from community testing, not from Google documentation: **UNVERIFIED**. The halo covers both outcomes.

### 4.5 Hosting
Images load only from `https://earlyletters.com/email/` (brief). Paths: `/email/logo-light.png`, `/email/logo-dark.png` (2x files; the `@1x` files are for previews and any client that mis-scales). No query strings, no per-recipient URLs (they would be a tracking pixel by another name).

---

## 5. Footer and signature

### 5.1 Signature
Every email ends with a letter-like sign-off before the footer:

```
Warmly,
Early Letters
```
Literata 400, 18/27, `ink`; the second line Literata 500. 24 px above. Security notices keep the same sign-off: the warmth is in two words and does not undercut the message **(opinion)**. An email's copy can override it with `signoff`. Never a person's name (the founder's name stays out of code, D-004).

### 5.2 Footer contents and order
A 1 px `line` rule, 32 px below the signature, then 24 px, then the lines in this order. Mukta 400, **13/19 px** (the product's floor; nothing smaller), `inkMuted` (`#6B645B` light, `#B3AA9E` dark; 5.5:1 and 8.0:1). Links underlined, same colour. 8 px between lines, 16 px before the name line.

| # | Transactional (auth, account, receipts, family notices) | Commercial (newsletter, offers; later, `news.` subdomain) |
|---|---|---|
| 1 | Why you got this: one line, specific (`{whyYouGotThis}`, from the email's `whyText` or `emailLegal.whyYouGotThis.transactional`) | Same, commercial wording (`emailLegal.whyYouGotThis.commercial`) |
| 2 | "Questions? Reply to this email. A person reads every one." | Same |
| 3 | (none) | `{unsubscribe}` (L2 wording, one-click; plus `List-Unsubscribe` and `List-Unsubscribe-Post` headers) |
| 4 | (none) | `{postalAddress}` (required by CAN-SPAM for commercial mail; L2 confirms; never a home address, D-004) |
| 5 | Links: Help, Privacy | Links: Help, Privacy, Email preferences |
| 6 | "Early Letters. Exactly as you said it." | Same |

**Not in the footer, on purpose:** social icons (we have no social channel worth sending a tired parent to, and each icon is a remote image or a link to a tracker-heavy site; revisit only if a channel exists and someone asks for it), app store badges, "view in browser", copyright line (adds nothing legally in the US and costs a line, **(opinion)**), the postal address on transactional mail (not required, L2 confirms), and an unsubscribe link on transactional mail (people cannot opt out of sign-in links; a fake unsubscribe would be a broken promise). If a transactional email ever carries promotional content it becomes commercial and gets the full commercial footer: the copy lanes must not mix them.

---

## 6. Inbox presence: the sender avatar

The small round picture next to the sender in the inbox list. Today, with no setup, most clients will show a letter tile with **E**. Our interim monogram (`avatar-1024.png`, a serif E on accent) is drawn to match that, so moving to a real avatar later is an upgrade, not a change of face.

All logo programmes below need **DMARC at enforcement** (`p=quarantine` or `p=reject`, `pct=100`) on `earlyletters.com`. That is worth doing anyway, after a few weeks at `p=none` reading reports (L3 owns DNS and DMARC rollout).

| Programme | Shows in | Needs | Cost | Fit for us now |
|---|---|---|---|---|
| **BIMI + VMC** (Verified Mark Certificate) | Gmail (with blue check), Apple Mail (iOS 16+, macOS 13+), Yahoo, others | DMARC enforcement; registered trademark of the exact logo; SVG Tiny PS logo; BIMI DNS record; identity validation by the CA (notarised documents or a live video check) | DigiCert lists **$1,416 per year** per certificate (12-month auto-renew), checked 2026-10-03. Plus trademark: USPTO filing fee per class (**UNVERIFIED** current amount) and 6 to 12 months to register (Google's estimate) | **Not yet.** Name is "not yet trademark-cleared" (brand file) and the logo is not chosen. |
| **BIMI + CMC** (Common Mark Certificate) | Gmail (no blue check). Apple Mail support for CMC: **UNVERIFIED** (Apple documented VMC) | DMARC enforcement; logo used publicly on a domain you control for **at least 12 months**, checked through the Internet Archive; CA identity and organisation validation | DigiCert lists **$125 per month** per domain (12-month subscription), checked 2026-10-03 | **Not before ~12 months after the final logo is live on earlyletters.com.** Also, CAs validate *organisations*; Sectigo says only "some sole proprietors" registered with a government agency qualify. With an individual publisher (D-004) this is likely blocked until an entity exists. |
| **BIMI self-asserted** (no certificate) | Yahoo, AOL | DMARC enforcement; BIMI record pointing to an SVG; Yahoo also requires bulk volume plus "sufficient reputation and engagement" (Yahoo Sender Hub FAQ) | Free | Cheap to add once DMARC is enforced, but at launch volume Yahoo will likely not show it. Low priority. |
| **Apple Branded Mail** (Apple Business, formerly Apple Business Connect) | Apple Mail on recent iOS, iPadOS, macOS only | DMARC enforcement; company details; logo at least 1024 x 1024 PNG/HEIF/JPEG; register domains; verify company with a **US Federal Taxpayer ID**; DNS verification; Apple review up to 7 business days (per Resend's guide) | No fee found (**UNVERIFIED**) | **Best first logo for us**: no trademark, no certificate, and our users are iPhone-first. Open question: whether an individual publisher can use an EIN as a sole proprietor here (**UNVERIFIED**). `avatar-1024.png` is ready to upload as the interim. |
| **Gmail profile photo of the sending account** | Gmail, when the sender is a Google account with a public photo | Sending mailbox hosted at Google Workspace | Workspace seat | Our mail is sent by Resend, not from a Google mailbox, so this likely does not apply: **UNVERIFIED**. |
| Outlook.com / Microsoft | | Microsoft does not support BIMI as of the last public information found: **UNVERIFIED** | | Nothing to do. |

**Recommended order:** (1) DMARC to `p=quarantine`, `pct=100` once reports are clean; (2) Apple Branded Mail with the chosen logo when a Taxpayer ID is available; (3) self-asserted BIMI record (Yahoo) at the same time, free; (4) VMC after a trademark registration, or CMC after 12 months of public use, once an entity exists. Budget about $1,400 to $1,500 a year for (4).

**BIMI SVG.** `avatar-interim.tiny-ps.svg` follows the SVG Tiny PS shape (`version="1.2"`, `baseProfile="tiny-ps"`, `<title>`, square, solid background, no scripts or external references). It is a template, not a certified mark: do not publish a BIMI record pointing at an interim mark, because the CMC "12 months of use" clock should run on the final logo. Run the final file through a BIMI validator before use (Google asks for SVG Tiny PS, at least 96 px, under 32 KB).

Sources: Google Workspace Admin Help, "Set up BIMI" (knowledge.workspace.google.com/admin/security/set-up-bimi); DigiCert, Verified Mark Certificates page and CertCentral docs "Common Mark Certificate (CMC)"; Sectigo KB "Eligibility Requirements for VMC and CMC Certificates"; Yahoo Sender Hub FAQs (senders.yahooinc.com/faqs); Resend KB "How do I set up Apple Branded Mail"; BIMI Group, "Verified Mark Certificates and BIMI". All read 2026-10-03.

---

## 7. Apple private relay (Hide My Email)

People who use Sign in with Apple and choose "Hide My Email" get an address like `x7k2@privaterelay.appleid.com`.

**Delivery (must do before launch).** Apple only relays mail from registered senders; unregistered mail **bounces** (Apple Developer docs, "Configure private email relay service"). In Certificates, Identifiers & Profiles, under Sign in with Apple for Email Communication, register **both** `earlyletters.com` (From domain, DKIM `d=` must match exactly) and `send.earlyletters.com` (Resend's return-path domain, SPF must pass), and later `news.earlyletters.com`. Individual accounts get up to 32 email sources. Apple also caps each relay address at 100 emails a day to and from it (Resend KB). L3 owns this step; it is flagged here because it decides whether these users see our brand at all.

**Branding effects**
- **The "why you got this" line shows the relay address**, which the person may not recognise as theirs. Copy should say so when the address ends in `@privaterelay.appleid.com`: e.g. "You are getting this at the private address Apple made for you when you signed in with Apple." Ask C1 and L2 for this variant (see section 10).
- **The From name and our header are what tell them it is real**, since the To address looks strange. Another reason to keep the From name and header fixed.
- Whether Apple's relay preserves our original From address as displayed, and whether BIMI or Branded Mail logos still show on relayed mail (the relay re-sends the message): **UNVERIFIED**. Do not promise a logo to relay users.
- The `sign-in-trouble` email should mention Hide My Email (the brief already lists it).

---

## 8. Mocks (375 px)

Rendered reference: `packages/brand/assets/email/source/mock-375.png` (source `mock.html`). Six frames: transactional light, dark with logo swap, Gmail forced dark (halo), images blocked, commercial light and dark.

**Light, transactional**
```
+-------------------------------------+  375px, paper #FBF8F3
|                                     |  32
|  Early Letters        <- logo 160x28, ink, left
|                                     |  24
|  Here is your sign-in link          |  Literata 500 24/31
|  Tap below to open your book. The   |  Mukta 17/26
|  link works once, for 1 hour.       |
|  ( Sign in to my book )             |  accent pill, white text
|                                     |  24
|  Warmly,                            |  Literata 18/27
|  Early Letters                      |
|                                     |  32
|  -----------------------------------|  1px line #E6DED3
|  You are getting this because       |  Mukta 13/19 inkMuted
|  someone asked to sign in to Early  |
|  Letters with asha.parent@...       |
|  Questions? Reply to this email. A  |
|  person reads every one.            |
|  Help . Privacy                     |  underlined
|                                     |  16
|  Early Letters. Exactly as you said it.
+-------------------------------------+
```

**Dark, transactional** (Apple Mail, swap works)
```
+-------------------------------------+  paper #161412
|  Early Letters        <- logo-dark, #F2ECE4
|  Here is your sign-in link          |  #F2ECE4
|  ( Sign in to my book )             |  #D9A47E pill, #1E1612 text
|  Warmly, / Early Letters            |
|  -----------------------------------|  #33302C
|  why line, reply line, links        |  #B3AA9E
|  Early Letters. Exactly as you said it.
+-------------------------------------+
```

**Commercial footer adds**, between the reply line and the links:
```
|  Unsubscribe {L2 wording}           |
|  {postalAddress}                    |
|  Help . Privacy . Email preferences |
```

**Images blocked:** the logo line becomes the alt text "Early Letters" in Georgia 20 px, ink. Everything else is unchanged.

---

## 9. Asset inventory

`packages/brand/assets/email/`
| File | What |
|---|---|
| `logo-light.png` | 320 x 56, transparent, ink wordmark with paper halo. Display at 160 x 28. Default. |
| `logo-dark.png` | 320 x 56, transparent, `#F2ECE4` wordmark with near-black halo. Dark-mode swap. |
| `logo-light@1x.png`, `logo-dark@1x.png` | 160 x 28 versions. |
| `logo-light.svg`, `logo-dark.svg` | Outlined SVG sources (not for email: Gmail does not render SVG). |
| `avatar-1024.png` | Interim square monogram for Apple Branded Mail. |
| `avatar-interim.tiny-ps.svg` | Interim SVG Tiny PS template for BIMI. Do not publish. |
| `manifest.json` | Sizes, alt text, hosting path. |
| `source/build.mjs` | Rebuilds everything above plus the favicon set: `node packages/brand/assets/email/source/build.mjs`. Reads the name from `packages/brand/index.ts`. |
| `source/wordmark-interim.svg` | Clean interim wordmark, no halo. |
| `source/mock.html`, `source/mock-375.png` | Header and footer mock. |
| `a/`, `b/` | Email versions of logo directions A and B, built by `source/build-directions.mjs` (rerun after B1 or B2 change their files). A: two-tone horizontal lockup (accent e, ink wordmark), 203 x 32 display. B: ink horizontal lockup, 173 x 32 display. Each has light/dark at 2x and 1x with the halo (feMorphology dilate 0.5 px), `avatar-1024.png` from the direction's app icon, and `manifest.json`. To ship one, copy its files to the root of `/email/` and update the `img` width and height from its manifest. Note: B's avatar is a thin script mark on paper and reads faintly at 40 px; a filled tile or `symbol-small` would carry better in an inbox list **(opinion)**. |

`packages/brand/assets/favicon/`: `favicon.svg` (follows `prefers-color-scheme`: accent tile with paper E in light, `#D9A47E` tile with dark E in dark), `favicon-32.png`, `apple-touch-icon.png` (180, full-bleed square, iOS rounds it), `icon-192.png`, `icon-512.png`, `site.webmanifest`. All interim, monogram E in Literata 600.

The interim lockup is the name set in Literata 500 (SIL OFL 1.1), outlined with opentype.js, tracked +0.01 em, kerned from the font.

---

## 10. Open questions and requests

**For the founder**
1. Apple Branded Mail needs a US Federal Taxpayer ID. Are you willing to get an EIN as a sole proprietor (free from the IRS) and does Apple accept it for an individual? (**UNVERIFIED**)
2. Trademark filing for the name and final logo: needed for VMC (Gmail check mark) and helps everywhere. Not urgent for launch.
3. Sign-off: "Warmly, Early Letters" proposed. Alternatives: "With care,", "Yours,".

**For other lanes**
- **D3 (website):** copy `packages/brand/assets/email/logo-*.png` to `apps/web/public/email/`, and the favicon folder to `apps/web/public/favicon/` (manifest icon paths assume `/favicon/`). Link tags: `<link rel="icon" href="/favicon/favicon.svg" type="image/svg+xml">`, `<link rel="icon" href="/favicon/favicon-32.png" sizes="32x32">`, `<link rel="apple-touch-icon" href="/favicon/apple-touch-icon.png">`, `<link rel="manifest" href="/favicon/site.webmanifest">`.
- **D1:** build `EmailHeader` and `EmailFooter` from `emailChrome` (fill `{whyYouGotThis}` from the `whyText` prop or `emailLegal`, render `footer.links[kind]` joined by `footer.linkSeparator`, `signature` split on `\n`); dark swap and `[data-ogsc]` rules per 4.4; alt-text styling per 4.3.
- **C1 / L2:** a relay-address variant of the "why you got this" line (section 7).
- **L3:** register `earlyletters.com` and `send.earlyletters.com` with Apple's private relay; DMARC path to `p=quarantine; pct=100`.
- **Content tests:** `packages/content/src/index.ts` does not export the email copy, so `rules.test.ts` does not check it yet. When it is added, extend the placeholder allowlist with `whyYouGotThis`, `helpUrl`, `privacyUrl`, `preferencesUrl`, `unsubscribe`, `postalAddress` (and C1's own).
