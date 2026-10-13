/**
 * Shared contract for every email copy file in this folder (docs/emails/BRIEF.md).
 * Each copy file exports `export const <group>Emails = { [id]: EmailCopy }`.
 * Placeholders in {braces} are left literal for the sender to fill.
 */
export type EmailCopy = {
  id: string;                 // kebab-case, matches template file name
  subject: string;            // <= 45 chars preferred, no clickbait, no ALL CAPS
  preheader: string;          // 40 to 90 chars, adds to the subject, never repeats it
  heading: string;            // Literata, the one line that matters
  body: string[];             // paragraphs, plain text, placeholders in {braces}
  /** Optional key facts (price, dates) shown as label and value rows after the body. They repeat the body,
   *  never replace it. Two to five rows. Rendered by KeyFacts in CopyEmail. */
  facts?: { label: string; value: string }[];
  cta?: { label: string; urlVar: string }; // urlVar e.g. "{signInUrl}"
  code?: { label: string; codeVar: string }; // e.g. "{code}"
  fallback?: string;          // "Button not working? Paste this link" style line
  safety?: string;            // "Did not ask for this? You can ignore it" style line
  signoff?: string;           // optional, defaults to chrome signature
  /** Optional footer line saying why this person got the email, when it is not their own account
   *  (for example an invite). Defaults to emailLegal.whyYouGotThis[kind]. */
  whyText?: string;
  category: "auth" | "account" | "lifecycle" | "family" | "billing" | "legal";
  kind: "transactional" | "commercial";
};
