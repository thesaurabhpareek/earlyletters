// Usage: node docs/store/listing/render.mjs
// Renders apple.md, google-play.md and localisation.md from listing.json, with live character counts.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const d = JSON.parse(readFileSync(join(here, 'listing.json'), 'utf8'));
const n = (s) => [...s].length;
const field = (label, text, max) => `### ${label} (${n(text)}/${max})\n\n${text}\n`;
const block = (label, text, max) => `### ${label} (${n(text)}/${max})\n\n\`\`\`text\n${text}\n\`\`\`\n`;
const a = d.apple, p = d.googlePlay;

writeFileSync(join(here, 'apple.md'), `# Apple App Store listing, US English (v1.0.0)

Generated from listing.json by render.mjs. Edit the JSON, run check.mjs, then render.mjs. Prices and trials come from apps/web/src/content/pricing.ts only.

Storefront: United States only. Not in the Kids Category. No "beta" wording (D-030).

${field('App name', a.name, 30)}
${field('Subtitle', a.subtitle, 30)}
${field('Promotional text', a.promotionalText, 170)}
${block('Keywords', a.keywords, 100)}
## Categories

- Primary: ${a.categoryPrimary} (matches the release checklist, docs/ROADMAP.md and K-37 review notes).
- Secondary: ${a.categorySecondary} (suggestion only; not stated in the repo. Alternative: leave unset).
- Avoid Education and Kids: the brand never positions the product as learning, and the app is for adults.

${block('Description', a.description, 4000)}
${block("What's new in 1.0.0", a.whatsNew, 4000)}
## URL and legal fields

| Field | Value | Status |
| --- | --- | --- |
| Support URL | ${a.supportUrl} | Page does not exist yet (no /support route in apps/web). Build it or point to another live page. |
| Marketing URL | ${a.marketingUrl} | Live. |
| Privacy Policy URL | ${a.privacyPolicyUrl} | Route exists. |
| Copyright | ${a.copyright} | Legal name lives only in the legal documents and App Store Connect (D-004). |
`);

writeFileSync(join(here, 'google-play.md'), `# Google Play listing, US English (draft, not for v1.0)

${p.availability}

Generated from listing.json by render.mjs.

${field('Title', p.title, 30)}
${field('Short description', p.shortDescription, 80)}
${block('Full description', p.fullDescription, 4000)}
## Category and tags

- Category: ${p.category}
- Tag candidates (Play offers a fixed list; confirm exact names in Play Console): ${p.tags.join(', ')}

Differences from the Apple copy: no Apple wording, Play-specific cancel line, and no Apple payment text. Billing wording must be rechecked when the billing route is chosen (ADR 0013 covers Apple only).
`);

const rows = Object.entries(d.localisation.locales).map(([k, v]) => `| ${k} | ${v.confidence} | ${n(v.subtitle)}/30 | ${v.subtitle} | ${n(v.promotionalText)}/170 | ${v.promotionalText} | ${v.review} |`).join('\n');
writeFileSync(join(here, 'localisation.md'), `# Localisation plan

${d.localisation.status}

${d.localisation.storefrontNote}

## Languages

Build 1 is English only (D-115, D-121). No store text names another language until its native reviewer has signed it with name and date (D-125 item 2).

## Phases

1. v1.0: en-US only. Ship the approved English listing.
2. After launch: add es-MX, fr-FR and pt-BR subtitle and promotional text first, each reviewed by a native speaker who is also a parent. Description translations come after that.
3. Hindi, Simplified Chinese and Arabic: after a native review and the Hindi script decision (D-031). Arabic needs a right-to-left screenshot check.
4. Never machine-translate the description without review. Never promise a language the build does not do.

## Draft translations, all need native review

| Locale | Confidence | Subtitle count | Subtitle | Promo count | Promotional text | Review note |
| --- | --- | --- | --- | --- | --- | --- |
${rows}

Child gender: Spanish, French and Portuguese use "bebé", which names no gender. Hindi, Arabic and Chinese drafts use a generic word for child; Hindi and Arabic grammar can still lean masculine, so reviewers must try neutral phrasing.

Full descriptions are not translated.
`);
console.log('rendered');
