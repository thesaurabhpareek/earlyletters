/**
 * Owner: E2 (back-end). The one layout every Early Letters email uses: the welcome note today, the launch
 * message and anything after it tomorrow. Give it copy, get HTML and text.
 *
 * Built for mail apps, not browsers: nested tables, inline styles, system serif (web fonts do not load in
 * most inboxes), a solid colour behind every gradient so nothing depends on gradient support, a dark
 * variant for apps that honour prefers-color-scheme, no scripts, no tracking pixels, no tracked links.
 * Colours come from the brand registry. All text is escaped here, so callers pass plain strings.
 */
import { brand } from '@scribe/brand';

const c = brand.colors;
const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

export type EmailBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'signoff'; text: string }
  | { type: 'list'; title: string; items: readonly string[] }
  | { type: 'letter'; label: string; to: string; meta: string; from: string; excerpt: string; note: string };

export type EmailFooter = {
  /** Plain lines under the card: what this is, why the person got it. */
  lines: readonly string[];
  /** The unsubscribe link, always shown when given. `href` is https or mailto. */
  unsubscribe?: { prefix: string; label: string; href: string };
};

export type EmailInput = {
  /** The page title and, in the text version, the first line. */
  title: string;
  /** The grey preview line some inboxes show beside the subject. */
  preheader: string;
  hero: { kicker: string; headline: string; intro: string };
  blocks: readonly EmailBlock[];
  footer: EmailFooter;
  /** Origin of the website, for the logo and the home link. No trailing slash. */
  siteUrl: string;
};

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Only http(s) and mailto links go into an email. */
const safeHref = (href: string) => (/^(https:\/\/|http:\/\/localhost|mailto:)/.test(href) ? escapeHtml(href) : '#');

function blockHtml(block: EmailBlock): string {
  switch (block.type) {
    case 'paragraph':
      return `<tr><td style="padding:20px 36px 0 36px;"><p class="ink" style="margin:0;font-family:${SERIF};font-size:18px;line-height:1.65;color:${c.ink};">${escapeHtml(block.text)}</p></td></tr>`;
    case 'signoff':
      return `<tr><td style="padding:12px 36px 0 36px;"><p class="muted" style="margin:0;font-family:${SERIF};font-size:17px;line-height:1.5;color:${c.inkMuted};">${escapeHtml(block.text)}</p></td></tr>`;
    case 'list':
      return `<tr><td style="padding:32px 36px 0 36px;">
<p class="accent" style="margin:0 0 6px 0;font-family:${SANS};font-size:12px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:${c.accent};">${escapeHtml(block.title)}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${block.items
  .map(
    (item) =>
      `<tr><td class="rule" style="padding:12px 0;border-top:1px solid ${c.line};font-family:${SERIF};font-size:17px;line-height:1.5;color:${c.ink};"><span class="ink" style="color:${c.ink};">${escapeHtml(item)}</span></td></tr>`,
  )
  .join('\n')}
</table></td></tr>`;
    case 'letter':
      return `<tr><td style="padding:28px 36px 0 36px;">
<p class="accent" style="margin:0 0 10px 0;font-family:${SANS};font-size:12px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:${c.accent};">${escapeHtml(block.label)}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="letter" style="background:${c.accentSoft};border-radius:14px;">
<tr><td style="padding:22px 24px;">
<p class="muted" style="margin:0 0 12px 0;font-family:${SANS};font-size:12px;line-height:1.5;letter-spacing:0.04em;color:${c.inkMuted};">${escapeHtml(block.to)} &nbsp;&middot;&nbsp; ${escapeHtml(block.meta)} &nbsp;&middot;&nbsp; ${escapeHtml(block.from)}</p>
<p class="ink" style="margin:0;font-family:${SERIF};font-size:20px;line-height:1.6;color:${c.ink};">${escapeHtml(block.excerpt)}</p>
</td></tr></table>
<p class="muted" style="margin:10px 0 0 0;font-family:${SANS};font-size:13px;line-height:1.5;color:${c.inkMuted};">${escapeHtml(block.note)}</p>
</td></tr>`;
  }
}

function blockText(block: EmailBlock): string[] {
  switch (block.type) {
    case 'paragraph':
    case 'signoff':
      return [block.text, ''];
    case 'list':
      return [block.title, ...block.items.map((item) => `- ${item}`), ''];
    case 'letter':
      return [block.label, `${block.to} | ${block.meta} | ${block.from}`, block.excerpt, block.note, ''];
  }
}

export function renderEmail(input: EmailInput): { html: string; text: string } {
  const home = escapeHtml(input.siteUrl);
  const { hero, footer } = input;

  const html = `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${escapeHtml(input.title)}</title>
<style>
  a { color: inherit; }
  @media (max-width: 600px) {
    .pad { padding-left: 24px !important; padding-right: 24px !important; }
    .headline { font-size: 32px !important; }
  }
  @media (prefers-color-scheme: dark) {
    .bg { background: ${c.paperDark} !important; }
    .body { background: ${c.paperRaisedDark} !important; }
    .letter { background: ${c.paperDark} !important; }
    .ink { color: ${c.inkDark} !important; }
    .muted { color: ${c.inkMutedDark} !important; }
    .accent { color: ${c.accentDark} !important; }
    .rule { border-color: ${c.lineDark} !important; }
  }
</style>
</head>
<body class="bg" style="margin:0;padding:0;background:${c.paper};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(input.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="bg" style="background:${c.paper};">
<tr><td align="center" style="padding:32px 16px 40px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
  <tr><td style="padding:0 4px 18px 4px;">
    <a href="${home}" style="text-decoration:none;color:${c.ink};">
      <img src="${home}/apple-icon" width="36" height="36" alt="" style="display:inline-block;vertical-align:middle;border:0;border-radius:9px;">
      <span class="ink" style="display:inline-block;vertical-align:middle;margin-left:10px;font-family:${SERIF};font-size:19px;color:${c.ink};">${escapeHtml(brand.name)}</span>
    </a>
  </td></tr>
  <tr><td bgcolor="${c.paperDark}" style="background-color:${c.paperDark};background-image:linear-gradient(160deg,#3B302A 0%,${c.paperDark} 70%);border-radius:20px 20px 0 0;padding:44px 36px 40px 36px;" class="pad">
    <p style="margin:0 0 14px 0;font-family:${SANS};font-size:12px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:${c.accentDark};">${escapeHtml(hero.kicker)}</p>
    <h1 class="headline" style="margin:0;font-family:${SERIF};font-weight:500;font-size:38px;line-height:1.15;letter-spacing:-0.01em;color:${c.inkDark};">${escapeHtml(hero.headline)}</h1>
    <p style="margin:16px 0 0 0;font-family:${SERIF};font-size:18px;line-height:1.6;color:${c.inkMutedDark};">${escapeHtml(hero.intro)}</p>
  </td></tr>
  <tr><td class="body" bgcolor="${c.paperRaised}" style="background:${c.paperRaised};border-radius:0 0 20px 20px;border:1px solid ${c.line};border-top:0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${input.blocks.map(blockHtml).join('\n')}
      <tr><td style="height:36px;line-height:36px;font-size:0;">&nbsp;</td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:24px 8px 0 8px;">
${footer.lines
  .map(
    (line) =>
      `    <p class="muted" style="margin:0 0 8px 0;font-family:${SANS};font-size:13px;line-height:1.6;color:${c.inkMuted};">${escapeHtml(line)}</p>`,
  )
  .join('\n')}
${
  footer.unsubscribe
    ? `    <p class="muted" style="margin:0;font-family:${SANS};font-size:13px;line-height:1.6;color:${c.inkMuted};">${escapeHtml(footer.unsubscribe.prefix)} <a href="${safeHref(footer.unsubscribe.href)}" class="muted" style="color:${c.inkMuted};text-decoration:underline;">${escapeHtml(footer.unsubscribe.label)}</a></p>`
    : ''
}
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const text = [
    hero.kicker.toUpperCase(),
    hero.headline,
    '',
    hero.intro,
    '',
    ...input.blocks.flatMap(blockText),
    ...footer.lines,
    ...(footer.unsubscribe ? [`${footer.unsubscribe.prefix} ${footer.unsubscribe.label}: ${footer.unsubscribe.href}`] : []),
    input.siteUrl,
  ].join('\n');

  return { html, text };
}
