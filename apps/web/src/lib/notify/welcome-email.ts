/**
 * Owner: E2 (back-end). The one short hello sent after someone leaves their address.
 *
 * Plain HTML in tables with inline styles (the only thing mail apps agree on), a text version for
 * everything else, colours from the brand registry, a dark-mode variant for apps that honour it. All copy
 * is `site.welcomeEmail`, so the website's copy rules cover it. No tracking pixels, no tracked links.
 */
import { brand } from '@scribe/brand';
import { site } from '../../content/site';

const c = brand.colors;
const w = site.welcomeEmail;

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export type WelcomeEmail = { subject: string; html: string; text: string };

export function renderWelcomeEmail(siteUrl: string): WelcomeEmail {
  const serif = "Georgia, 'Times New Roman', serif";
  const sans = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
  const home = escapeHtml(siteUrl);

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${escapeHtml(w.subject)}</title>
<style>
  @media (prefers-color-scheme: dark) {
    .bg { background: ${c.paperDark} !important; }
    .card { background: ${c.paperRaisedDark} !important; border-color: ${c.lineDark} !important; }
    .ink { color: ${c.inkDark} !important; }
    .muted { color: ${c.inkMutedDark} !important; }
    .accent { color: ${c.accentDark} !important; }
    .rule { border-color: ${c.lineDark} !important; }
  }
</style>
</head>
<body class="bg" style="margin:0;padding:0;background:${c.paper};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(w.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="bg" style="background:${c.paper};">
  <tr><td align="center" style="padding:40px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="card" style="max-width:520px;background:${c.paperRaised};border:1px solid ${c.line};border-radius:20px;">
      <tr><td style="padding:40px 36px 8px 36px;">
        <img src="${home}/apple-icon" width="48" height="48" alt="${escapeHtml(brand.name)}" style="display:block;border:0;border-radius:11px;">
      </td></tr>
      <tr><td style="padding:20px 36px 0 36px;">
        <h1 class="ink" style="margin:0;font-family:${serif};font-weight:500;font-size:32px;line-height:1.2;color:${c.ink};">${escapeHtml(w.headline)}</h1>
      </td></tr>
      <tr><td style="padding:16px 36px 0 36px;">
        <p class="ink" style="margin:0;font-family:${serif};font-size:18px;line-height:1.6;color:${c.ink};">${escapeHtml(w.intro)}</p>
      </td></tr>
      <tr><td style="padding:28px 36px 0 36px;">
        <p class="accent" style="margin:0 0 10px 0;font-family:${sans};font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:${c.accent};">${escapeHtml(w.promisesTitle)}</p>
        ${w.promises
          .map(
            (line) =>
              `<p class="ink rule" style="margin:0;padding:10px 0;border-top:1px solid ${c.line};font-family:${serif};font-size:17px;line-height:1.5;color:${c.ink};">${escapeHtml(line)}</p>`,
          )
          .join('\n        ')}
      </td></tr>
      <tr><td style="padding:24px 36px 0 36px;">
        <p class="ink" style="margin:0;font-family:${serif};font-size:18px;line-height:1.6;color:${c.ink};">${escapeHtml(w.closing)}</p>
        <p class="muted" style="margin:16px 0 0 0;font-family:${serif};font-size:17px;color:${c.inkMuted};">${escapeHtml(w.signoff)}</p>
      </td></tr>
      <tr><td style="padding:32px 36px 36px 36px;">
        <p class="muted" style="margin:0;font-family:${sans};font-size:13px;line-height:1.55;color:${c.inkMuted};">${escapeHtml(w.why)}</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  const text = [
    w.headline,
    '',
    w.intro,
    '',
    w.promisesTitle,
    ...w.promises.map((line) => `- ${line}`),
    '',
    w.closing,
    w.signoff,
    '',
    w.why,
    siteUrl,
  ].join('\n');

  return { subject: w.subject, html, text };
}
