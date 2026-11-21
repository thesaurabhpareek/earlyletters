# Draft: "A sign-in method was removed" (HELD, not wired)

Status: HELD for CLO review and the E83 security review. Text only. Nothing imports this file; no template, export, test or Supabase setting changed. Source: `/home/claude/copywork/COVERAGE.md` section 4, item 11 (copy coverage R3, 21 Nov 2026).

Why it exists: `src/templates/supabase.ts` (the `identity_unlinked` entry in `supabaseUnused`) says there is no copy for the notification Supabase sends when a sign-in method is unlinked. L3 wants it on with Supabase's default text until this one is approved. That default text is a security email in a stranger's voice, unbranded.

## Words

Id (proposed): `sign-in-method-removed`. Group: auth. Kind: transactional.

Subject: A sign-in method was removed

Preheader: Your account is still here. If this was you, there is nothing to do.

Heading: A sign-in method was removed

Body, paragraph 1: You removed {provider} as a way to sign in to Early Letters. (In code this is `${brand.name}`, never typed.)

Body, paragraph 2: Your letters, recordings and books are still here. You can still sign in the other ways you set up.

Body, paragraph 3: If this was you, there's nothing to do.

Safety line: Didn't do this? Reply to this email right away, from this address, with Not me in the subject, and we'll help. We'll never ask for a code or a password.

Sign-off: Warmly, then the brand name (`emailChrome.signature`).

## Checks to make before anyone writes it into code

- The variable. Supabase's `identity_unlinked` notification exposes the provider name; whether it arrives as `{{ .Provider }}` and how it reads for Apple, Google and email ("apple" versus "Apple") is UNVERIFIED. It may need a display-name map.
- "You can still sign in the other ways you set up." True only while at least one other method is left. UNVERIFIED whether Supabase lets the last identity be unlinked. If it can, paragraph 2 must change.
- "Reply ... we'll help" follows the wording of `email-changed-old-address` in `emails/auth.en.ts`. CLO to confirm the support promise and the reply address still match.
- "Early Letters" for the product name and the sign-off are not to be typed in code; use `brand.name` and `emailChrome.signature`.
- Rules: no em or en dash, curly quote, ellipsis character or emoji; contractions; no child name. Both a plain-text and an HTML version are needed (VOICE.md, How to write an email).
- The Supabase export (`npm run export:supabase`) regenerates `supabase/templates/*`: a new template there needs its own D-041 review (writing guide section 10).

## Open for the CLO

1. Is a security notice allowed to say "we'll help" and invite a reply?
2. Approve, edit or reject the five lines above.
