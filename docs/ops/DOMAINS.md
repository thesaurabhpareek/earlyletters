# Domains: earlyletters.com and earlyletters.app

Owner: server and privacy-operations engineer. Written 3 Oct 2026 for the founder. Nothing here has been changed at Porkbun, Vercel or Resend; this is the target state and how to check it.
Founder decision 13: **earlyletters.com** is primary (website, legal pages, universal links, email); **earlyletters.app** only redirects to it. Both are registered at Porkbun. The website is built in a separate thread on Vercel. Sign-in specifics (Supabase redirect URLs, SMTP, Hide My Email relay) are in [AUTH_SETUP.md](AUTH_SETUP.md); this page does not repeat them.

Labels: **Verified** (checked on an opened vendor page on 3 Oct 2026), **Assumption**, **Founder** (a choice only the founder can make).

## 1. Summary

| Domain | Serves | Mail |
|---|---|---|
| `earlyletters.com` | Website on Vercel (`/`, `/terms`, `/privacy`, `/health-privacy`, `/subprocessors`, later `/delete-account`), `/.well-known/` files, universal-link fallback pages `/auth/callback` and `/i/*` | Sends through Resend (`hello@`), receives at `hello@` (and the suggested `privacy@`, `security@`, `dmarc@`) |
| `www.earlyletters.com` | Redirect to the apex | none |
| `send.earlyletters.com` | Nothing on the web; Resend's return-path (bounce) domain | Resend bounces only |
| `packs.earlyletters.com` | Language and model packs CDN (decision 15) | none |
| `earlyletters.app` and `www.earlyletters.app` | Permanent redirect to `https://earlyletters.com` | none, and locked against spoofing (section 4) |

## 2. Porkbun account and domain safety

Do these once, for both domains.

| Item | Setting | Why |
|---|---|---|
| Account two-factor | Porkbun > Account > Security: authenticator app or security key; store recovery codes offline | Whoever controls the registrar controls sign-in links, email and universal links |
| Account email | An address that is **not** on these domains (for example your personal mailbox) | If the domain ever lapses or DNS breaks, renewal and recovery mail must still arrive |
| API access | Off (Domain Management > API Access) unless you automate DNS; if on, use a dedicated key and revoke when done | Fewer keys |
| Registrar lock (transfer lock) | On for both | Stops an unauthorised transfer |
| Auto-renew | On for both, with a valid card and some account credit. Consider renewing for 5 or more years now | A lapsed domain breaks every sign-in link, invite and receipt |
| WHOIS privacy | On (Porkbun includes it at no cost) | Keeps the founder's home address and phone out of public WHOIS |
| ICANN contact verification | Complete the verification email after any contact change | Unverified contacts can lead to suspension |
| DNSSEC | On, if DNS stays at Porkbun (Domain Management > DNSSEC; Porkbun signs its own DNS). If DNS moves to Cloudflare (section 6), enable DNSSEC there and paste the DS record into Porkbun | Protects against DNS spoofing of sign-in and invite links |
| URL forwarding | Not used: Vercel does the `.app` redirect with a real certificate | `.app` is HSTS-preloaded (HTTPS only), so the redirect host needs valid TLS |

## 3. Every DNS record for earlyletters.com, by purpose

Values in angle brackets come from the vendor dashboard. Porkbun's form wants the host without the domain (`send`, not `send.earlyletters.com`; Verified, Resend's Porkbun guide). TTL 600 unless a vendor says otherwise.

| Purpose | Type | Host | Value | Source |
|---|---|---|---|---|
| Website, apex | A | `@` | The IP Vercel's domain card shows (often `76.76.21.21`; newer projects get others) | Verified: Vercel "A record and CAA" guide |
| Website, www | CNAME | `www` | The CNAME target Vercel's domain card shows | Vercel |
| Resend sending: bounce domain | MX | `send` | `feedback-smtp.us-east-1.amazonses.com`, priority 10 | Verified: Resend Porkbun guide |
| Resend sending: SPF | TXT | `send` | `v=spf1 include:amazonses.com ~all` | Verified: same |
| Resend sending: DKIM | TXT | `resend._domainkey` | `p=<public key from Resend > Domains>` | Verified: same |
| Receiving `hello@` | MX | `@` | Whichever is live today; check with `dig MX earlyletters.com +short`. Porkbun forwarding: `fwd1.porkbun.com` (10) and `fwd2.porkbun.com` (20) (Verified, Porkbun KB). Resend Receiving: the MX Resend shows (its Porkbun guide uses host `inbound`, value `inbound-smtp.us-east-1.amazonaws.com`, 10) | Founder confirms |
| Root SPF | TXT | `@` | With Porkbun forwarding: `v=spf1 include:_spf.porkbun.com ~all` (Verified, Porkbun KB). Otherwise `v=spf1 -all` (nothing sends with the bare domain as envelope sender; Resend uses `send.`) | |
| DMARC | TXT | `_dmarc` | Start: `v=DMARC1; p=none; rua=mailto:dmarc@earlyletters.com; adkim=r; aspf=r; fo=1` (plan below) | |
| Certificate authorities | CAA | `@` | `0 issue "letsencrypt.org"` | Verified: Vercel issues with Let's Encrypt and a CAA record that does not allow it blocks issuance |
| No wildcard certificates | CAA | `@` | `0 issuewild ";"` | |
| Where CAs report problems | CAA | `@` | `0 iodef "mailto:security@earlyletters.com"` | |
| Packs CDN | CNAME | `packs` | The CDN's hostname (section 6) | |
| Google domain verification | TXT | `@` | `google-site-verification=<value>`, only if Google Auth Platform asks to verify the authorized domain | AUTH_SETUP 3.1 |

Not needed: any record for Apple (association is the AASA file, section 7), for Supabase (it stays on `*.supabase.co`; a custom auth domain is a paid add-on, not planned), BIMI, or an MTA-STS policy at launch (optional later: `_mta-sts` TXT plus `mta-sts.earlyletters.com/.well-known/mta-sts.txt`, and `_smtp._tls` TXT for TLS reports).

If a future CDN or proxy issues its own certificates under these names (Cloudflare proxy, R2 custom domain, Bunny), add its CA before switching, for example Cloudflare also uses Google Trust Services: `0 issue "pki.goog"` (Assumption; check the CDN's CAA page that day).

### DMARC plan (p=none to quarantine, then reject)

AUTH_SETUP 4.1 suggests starting straight at `p=quarantine` if no DMARC exists. If a record already exists at `p=none`, follow this plan instead; either way the end state is the same.

| Stage | Record | Move on when |
|---|---|---|
| 1. Observe (now) | `v=DMARC1; p=none; rua=mailto:dmarc@earlyletters.com; adkim=r; aspf=r; fo=1` | 14 days of aggregate reports show every legitimate source (Resend, any forwarding) passing DKIM with `d=earlyletters.com` |
| 2. Quarantine, partly | `...; p=quarantine; pct=25; ...` | 7 days with no legitimate mail failing |
| 3. Quarantine | `...; p=quarantine; ...` (pct 100) | 14 days clean, including magic links to iCloud, Gmail and Outlook test inboxes and to an Apple private relay address |
| 4. Reject | `...; p=reject; ...` | Steady state (A-REQ-026) |

Checks at each stage: send a magic link and a deletion receipt from staging to Gmail, Outlook and iCloud; "Show original" must say `DKIM: PASS (earlyletters.com)` and `DMARC: PASS`. Aggregate reports are XML; reading them by hand is fine at our volume, or route `dmarc@` to a free report viewer later (that viewer becomes a processor: data map first).

## 4. earlyletters.app (redirect only)

| Purpose | Type | Host | Value |
|---|---|---|---|
| Redirect host, apex | A | `@` | Vercel's domain card value |
| Redirect host, www | CNAME | `www` | Vercel's CNAME target |
| No mail accepted | MX | `@` | `0 .` (null MX, RFC 7505) |
| Nobody may send as .app | TXT | `@` | `v=spf1 -all` |
| Spoofed mail is rejected | TXT | `_dmarc` | `v=DMARC1; p=reject; adkim=s; aspf=s` |
| No DKIM keys | TXT | `*._domainkey` | `v=DKIM1; p=` (empty key, optional) |
| Certificates | CAA | `@` | `0 issue "letsencrypt.org"`, `0 issuewild ";"` |

In Vercel, add `earlyletters.app` and `www.earlyletters.app` to the website project as **redirects** to `https://earlyletters.com` (permanent, 308). `.app` is on the HSTS preload list, so browsers only ever use HTTPS for it (it is a property of the TLD). It must never serve the AASA file or any sign-in page: one link domain only (AUTH_SETUP 5.2).

## 5. Vercel (website thread)

- Domains on the project: `earlyletters.com` (primary), `www.earlyletters.com` (redirect to apex), `earlyletters.app` and `www.earlyletters.app` (redirect to `https://earlyletters.com`).
- Serve the files in [well-known/](well-known/) exactly as section 7 and 8 say. Header rule (also in AUTH_SETUP 5.2):
  ```json
  { "headers": [
      { "source": "/.well-known/apple-app-site-association", "headers": [ { "key": "Content-Type", "value": "application/json" } ] },
      { "source": "/.well-known/security.txt", "headers": [ { "key": "Content-Type", "value": "text/plain; charset=utf-8" } ] }
  ] }
  ```
- HSTS on every response: `Strict-Transport-Security: max-age=63072000; includeSubDomains`. Add `preload` and submit to hstspreload.org only after every subdomain you will ever use is HTTPS (it is hard to undo).
- No analytics or log forwarding for paths under `/i/` and `/auth/` (tokens: AUTH_SETUP 5.3), and the website's own analytics follow decision 12 (opt-in, no cross-site tracking).
- Vercel collects telemetry about deployments, not visitors; turn off any "Web Analytics" or "Speed Insights" unless the data map lists them.

## 6. packs.earlyletters.com (language and model packs CDN)

The platform owner picks the CDN (decision 15: Apple-hosted assets first, else cheap egress such as Cloudflare R2 or Hugging Face). DNS consequences, so the choice is made knowingly:

| Option | DNS change | Notes |
|---|---|---|
| A. Cloudflare R2 with a custom domain | **Move DNS hosting** of `earlyletters.com` to Cloudflare (registrar stays Porkbun) | Verified: an R2 custom domain must be a zone in the same Cloudflare account, and `r2.dev` URLs are rate-limited and "should only be used for development". Steps: add the zone to Cloudflare Free, copy every record in section 3 exactly (keep Vercel records DNS-only, not proxied), compare with `dig @<cloudflare-ns>`, switch nameservers at Porkbun, enable DNSSEC in Cloudflare and paste the DS record at Porkbun, then R2 > bucket > Custom domain `packs.earlyletters.com`, then add Cloudflare's CAs to CAA |
| B. DNS stays at Porkbun, a CDN that takes a CNAME | `packs` CNAME to the CDN (for example a Bunny pull zone in front of R2 or of Hugging Face) | One more processor (data map, subprocessors page). Add the CDN's CA to CAA |
| C. No custom domain | none | Pack manifests point at the vendor's own URLs (Hugging Face public files). Simplest; the URL is not ours, so a vendor change means an app-side manifest change only (manifests are server-driven, decision 16) |

Founder: A gives one control panel and DNSSEC with low effort; B keeps everything at Porkbun; C is fine for public model files. Packs hold no personal data, so any option is privacy-neutral; the manifest is signed (packages/api), so the CDN cannot alter what the app accepts.

## 7. Universal links and the AASA file

- File: [well-known/apple-app-site-association](well-known/apple-app-site-association), identical to AUTH_SETUP 5.2. Replace `<TEAMID>` with the 10-character Team ID (Apple Developer > Membership) in all six places before publishing.
- Served at `https://earlyletters.com/.well-known/apple-app-site-association`, no extension, `application/json`, HTTPS, **no redirects** (Verified in AUTH_SETUP: Apple "Supporting associated domains").
- Paths: `/auth/callback` (email sign-in; the token hash is in the fragment, never sent to the server) and `/i/*` (co-parent invites). Nothing else opens the app.
- The app's entitlement is `applinks:earlyletters.com` (and `webcredentials:earlyletters.com` for passkeys, AUTH_SETUP 7). `earlyletters.app` is deliberately not associated.
- Check what Apple's CDN sees: `curl -s https://app-site-association.cdn-apple.com/a/v1/earlyletters.com` (Apple refreshes within about a day).
- Android (later): `/.well-known/assetlinks.json` with the release signing certificate's SHA-256. Not at v1.0.

## 8. security.txt

- File: [well-known/security.txt](well-known/security.txt) (RFC 9116), served at `https://earlyletters.com/.well-known/security.txt` as `text/plain; charset=utf-8`.
- Contact goes to `security@earlyletters.com` (section 9). `Expires` is 2027-09-30: renew it before then (calendar in SECURITY.md 2.6), or scanners treat the file as stale.
- `Policy` points at `https://earlyletters.com/security`: a short page the website thread adds ("how to report, what we promise: acknowledge within 3 working days, no legal action for good-faith research that avoids other people's data"). Until that page exists, remove the `Policy` line rather than link to a 404.
- Optional later: sign the file with an OpenPGP key and add `Encryption:`.

## 9. Email addresses

All are receive-only aliases that forward to the founder's inbox. None is used for marketing. Keep the list short: every address is a place mail can go unanswered.

| Address | For | Status |
|---|---|---|
| `hello@earlyletters.com` | Support, the sender of every app email, Reply-To | **Live** (decision 13) |
| `privacy@earlyletters.com` | Rights requests (access, deletion, correction), the Privacy Policy contact (`{PRIVACY_EMAIL}` in TDD 05 5.6), counsel and regulators | Suggested. Until it exists, the policies must say `hello@` |
| `security@earlyletters.com` | Vulnerability reports (security.txt), CAA `iodef`, vendor security notices | Suggested |
| `dmarc@earlyletters.com` | DMARC aggregate reports only (keeps them out of `hello@`) | Suggested |
| `abuse@`, `postmaster@` | RFC 2142 role addresses some providers expect | Optional, forward to `security@` |

Never use any of these as the Porkbun, Apple or Supabase account login (section 2): a broken domain must not lock you out of the place that fixes it.

## 10. Auth redirects (summary; details in AUTH_SETUP 5.1)

- Supabase Site URL `https://earlyletters.com`; Redirect URLs exactly `https://earlyletters.com/auth/callback` and `scribe://auth/callback`.
- Email templates build the link themselves; the custom scheme never carries a token (TDD 04 3.1.6).

## 11. Checks (run after any DNS change)

```bash
dig +short A earlyletters.com; dig +short CNAME www.earlyletters.com
dig +short MX earlyletters.com; dig +short MX send.earlyletters.com
dig +short TXT send.earlyletters.com; dig +short TXT resend._domainkey.earlyletters.com
dig +short TXT _dmarc.earlyletters.com; dig +short CAA earlyletters.com
dig +short MX earlyletters.app; dig +short TXT _dmarc.earlyletters.app
curl -sI https://earlyletters.app | grep -i '^location'                       # 308 to https://earlyletters.com
curl -sI https://earlyletters.com/.well-known/apple-app-site-association     # 200, application/json, no redirect
curl -s  https://earlyletters.com/.well-known/security.txt                   # Contact and Expires present
```
Resend > Domains must show `earlyletters.com` **Verified**, with click and open tracking off (AUTH_SETUP 4.1).
