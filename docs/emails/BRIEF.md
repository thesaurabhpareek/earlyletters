# Email, brand and hosted-pages brief (shared by all 12 agents)

Branch: `feat/email-brand-library` (off `develop` at 3bf45a0). Repo root: `/home/claude/earlyletters`.
Date: 2026-10-03. Owner: the founder (individual publisher, see D-004).

## Read first (everyone)
- `CLAUDE.md` (constitution, content rules, privacy rules)
- `packages/brand/index.ts` (name, colours, publisher block). The public name lives ONLY here: code must import it, never hardcode it. Copy files in `packages/content` may contain the name (existing convention, see `site.en.ts`).
- `packages/content/VOICE.md`, `packages/content/BRAND.md`
- `docs/design/DESIGN_LANGUAGE.md` ("Quiet UI, loud letters"), `docs/design/CREATIVE.md`
- `docs/DECISIONS.md`: D-004 (individual publisher, no LLC), D-005 (domain + support email), D-022 (auto-renewal notice schedule), D-029 (destructive token), D-042 (/delete-account page + email route), D-044 (auth methods)
- `docs/legal/*` for anything legal or privacy

## Hard rules
- Voice: no em dashes, en dashes, curly quotes, ellipsis characters or emoji. No fear, guilt or loss language. Never imply AI writes anything (avoid "AI", "smart", "magic", "generate", "polish", "perfect", "enhance"). Never gender the child, use `{child}`. No streaks, counts of gaps, badges. US-only, 18+ only.
- Note "magic link" is banned vocabulary. Users see "sign-in link" or "email link".
- Real family details never in code. Fixtures use the fictional family "Asha".
- Privacy: no tracking pixels, no click tracking (Resend tracking is OFF and stays off), no third-party fonts or images loaded from other hosts in emails. Merge of 3 Oct 2026: nothing loads from a server at all. The logo is an inline attachment (`cid:`) and there are no web fonts (EMAIL_IDENTITY 4.5, 4.6).
- Do NOT run `npm install`, `git commit`, `git push`, deploy anything, send any email, or change DNS. Dependencies are already installed (React Email 1.0.12 components, render 2.1.0, React 19.2.3, Astro 7.3.5, opentype.js, wawoff2, @fontsource Literata/Mukta/Tiro Devanagari Hindi). If you need another dependency, say so in your final report instead.
- Write ONLY inside the paths your lane owns (below). If you need a change elsewhere, put it in your final report.
- Verify technical claims (client support, regulations, Supabase/Resend behaviour) against primary sources with WebSearch/WebFetch; mark anything unverified as UNVERIFIED. No invented citations.

## Decisions already taken (defaults; founder may override)
- Domains: `earlyletters.com` primary. `earlyletters.app` 308-redirects to .com (at Vercel). Both verified for Resend sending (.app pending DNS).
- Email provider: Resend (us-east-1). Supabase Auth sends through Resend (custom SMTP or Send Email Hook; L3 recommends which).
- Sender: `Early Letters <hello@earlyletters.com>` for all transactional mail; replies go to the same human inbox. No `no-reply@`. Future marketing/newsletter mail on a separate subdomain (proposal: `news.earlyletters.com`), not built now.
- Auth at v1.0 (D-044): Sign in with Apple + email sign-in link with a 6-digit code fallback (for when the link opens on another device). Google sign-in arrives in v1.1; the catalog includes its emails as "v1.1".
- Apple private relay (`@privaterelay.appleid.com`): emails to Apple-relay users only deliver if the sending domain is registered in Apple's "Sign in with Apple for Email Communication". Flag this wherever relevant.
- Postal address: the founder has not chosen one. Use the placeholder `{postalAddress}`. Never use a home address (D-004 advises a PO box or virtual mailbox). Transactional mail does not require it; commercial mail does (L2 confirms).
- Legal pages are drafts: they render with a visible "Draft, pending legal review" banner and must not be deployed until the founder approves.

## Colour tokens (from packages/brand/index.ts)
| token | light | dark |
|---|---|---|
| ink | #2B2722 | #F2ECE4 |
| inkMuted | #6B645B | #B3AA9E |
| paper | #FBF8F3 | #161412 |
| paperRaised | #FFFFFF | #201D1A |
| accent | #8A5A3B | #D9A47E |
| accentSoft | #F1E6DC | (derive, verify AA) |
| line | #E6DED3 | #33302C |
Fonts (SIL OFL): Literata (reading serif), Mukta (UI sans), Tiro Devanagari Hindi. In email, web fonts are progressive enhancement only (Apple Mail); fallback stacks must look intentional: serif `Literata, Georgia, 'Times New Roman', serif`, sans `Mukta, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`.

## Lanes and file ownership

### Design
- **D1 Email system** owns `packages/emails/src/tokens.ts`, `packages/emails/src/components/**`, `packages/emails/src/index.ts`, `packages/emails/scripts/**`, `packages/emails/test/**`, `packages/emails/README.md`. Builds the component library and the light/dark strategy, plus a render script that writes every template to `packages/emails/out/<name>.html` and a gallery `packages/emails/out/index.html` (light + dark side by side, 375px mobile frames).
- **D2 Auth templates** owns `packages/emails/src/templates/**` and `supabase/templates/**`. Builds every email in the catalog as a React Email template using D1's components and copy from `@scribe/content` (C1/C2 files). Also exports Supabase Auth templates (Go template variables such as `{{ .ConfirmationURL }}`, `{{ .Token }}`, `{{ .SiteURL }}`; verify against Supabase docs).
- **D3 Website** owns `apps/web/**` except `apps/web/vercel.json` and `apps/web/src/content/legal/**`. Astro static site: `/` (landing, copy from `site.en.ts`), `/about`, `/why`, `/contact`, `/terms`, `/privacy`, `/delete-account` (D-042), `/404`. Light/dark, mobile first, self-hosted fonts via @fontsource, no third-party scripts, no analytics cookies.

### Content
- **C1 Auth copy** owns `packages/content/src/emails/auth.en.ts` and `packages/content/src/emails/types.ts`.
- **C2 Catalog + all other email copy** owns `docs/emails/CATALOG.md` and `packages/content/src/emails/{lifecycle,family,billing,account}.en.ts`.
- **C3 Page copy** owns `packages/content/src/pages.en.ts` (about, why story, contact, delete-account, 404).

### Branding
- **B1 Logo direction A** owns `packages/brand/assets/logo/a/**`.
- **B2 Logo direction B** owns `packages/brand/assets/logo/b/**`.
- **B3 Email identity, header and footer** owns `docs/brand/EMAIL_IDENTITY.md`, `packages/brand/assets/email/**`, `packages/brand/assets/favicon/**`, `packages/content/src/emails/chrome.en.ts` (header/footer/signature copy).

### Legal / privacy / infosec
- **L1 Hosted legal pages** owns `apps/web/src/content/legal/**` (web-ready Markdown of Terms, Privacy, Subscription terms, Consumer health data notice if applicable).
- **L2 Email compliance** owns `docs/emails/COMPLIANCE.md` and `packages/content/src/emails/legal.en.ts` (footer legal lines, unsubscribe wording).
- **L3 Infosec** owns `docs/emails/SECURITY.md`, `apps/web/vercel.json`, `supabase/auth-email.md` (Supabase Auth + Resend configuration runbook).

## Interface contract (fixed; build against it even if the other file does not exist yet)

`packages/content/src/emails/types.ts` (C1 writes it exactly like this, may add optional fields only):
```ts
export type EmailCopy = {
  id: string;                 // kebab-case, matches template file name
  subject: string;            // <= 45 chars preferred, no clickbait, no ALL CAPS
  preheader: string;          // 40 to 90 chars, adds to the subject, never repeats it
  heading: string;            // Literata, the one line that matters
  body: string[];             // paragraphs, plain text, placeholders in {braces}
  cta?: { label: string; urlVar: string }; // urlVar e.g. "{signInUrl}"
  code?: { label: string; codeVar: string }; // e.g. "{code}"
  fallback?: string;          // "Button not working? Paste this link" style line
  safety?: string;            // "Did not ask for this? You can ignore it" style line
  signoff?: string;           // optional, defaults to chrome signature
  category: "auth" | "account" | "lifecycle" | "family" | "billing" | "legal";
  kind: "transactional" | "commercial";
};
```
Each copy file exports `export const <group>Emails = { [id]: EmailCopy }` (e.g. `authEmails`).

`packages/content/src/emails/chrome.en.ts` (B3): `export const emailChrome = { header: {...}, footer: { transactional: string[], commercial: string[] }, signature: string }`.
`packages/content/src/emails/legal.en.ts` (L2): `export const emailLegal = { postalLine: "{postalAddress}", unsubscribe: string, whyYouGotThis: { transactional: string, commercial: string } }`.

D1 components (exact names, props may grow):
```tsx
<EmailLayout preheader theme?="auto"> children </EmailLayout>   // html/head/body, color-scheme meta, dark-mode CSS, container 600px max, fluid on mobile
<EmailHeader />                     // logo + wordmark from packages/brand/assets/email
<EmailFooter kind="transactional"|"commercial" whyText?: string />
<Heading>  <Paragraph>  <Button href>  <CodeBox code label>  <LinkFallback href label>  <Divider />  <Signature text />  <Note tone="quiet"|"safety">
```
Placeholder convention in rendered HTML: `{signInUrl}` style tokens are left literal for the sender to fill; Supabase exports swap them for Go template vars.

## Required emails at minimum (C1 + D2)
1. `account-create-attempt`: someone tried to create an account with an email that already exists (enumeration-safe; the screen never reveals it, the email does).
2. `verify-email`: confirm email (link + 6-digit code).
3. `sign-in-link`: email sign-in link + code.
4. `welcome`: after first successful sign-in.
5. `sign-in-trouble`: login issue help (link expired, opened on another device, Apple ID uses Hide My Email, wrong address), with a fresh link.
6. `apple-account-linked` / `email-changed` / `new-device-sign-in` security notices (C2 may own the non-auth ones).

## Final report (everyone)
Under 250 words: files written, decisions you made, anything UNVERIFIED, open questions for the founder, changes you need in files outside your lane.
