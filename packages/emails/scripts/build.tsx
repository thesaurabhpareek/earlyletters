// Renders every email with sample data, and exports the Supabase Auth magic link template.
//
//   npm run build -w @scribe/emails                 # previews in packages/emails/dist (git-ignored)
//   npm run preview -w @scribe/emails -- <dir>      # previews somewhere else
//
// Committed output: packages/emails/supabase/magic-link.html and templates.json, for
// supabase/config.toml ([auth.email.template.magic_link] subject and content_path) or the dashboard.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderEmail, SUPABASE_CONFIRMATION_URL, type EmailName } from '../src/index';

const PKG = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outArg = process.argv.indexOf('--out');
const OUT = resolve(outArg >= 0 && process.argv[outArg + 1] ? process.argv[outArg + 1] : join(PKG, 'dist'));
mkdirSync(OUT, { recursive: true });

const samples: { [N in EmailName]: Parameters<typeof renderEmail<N>>[1] } = {
  magicLink: { url: 'https://earlyletters.com/auth/confirm?token_hash=preview&type=magiclink' },
  coParentInvite: { inviter: 'Mama', url: 'https://earlyletters.com/i/7Q4K2M9X' },
  welcome: undefined as never,
  deletionRequested: { date: 'November 2, 2026', reference: 'DR-7Q4K-2M9X' },
  deletionCancelled: { reference: 'DR-7Q4K-2M9X' },
  deletionCompleted: { date: 'November 2, 2026', reference: 'DR-7Q4K-2M9X' },
  exportReady: { url: 'https://earlyletters.com/export/7Q4K2M9X', days: 7 },
};

const index: string[] = [];
for (const name of Object.keys(samples) as EmailName[]) {
  const mail = await renderEmail(name, samples[name] as never);
  writeFileSync(join(OUT, `${name}.html`), mail.html);
  writeFileSync(join(OUT, `${name}.txt`), `Subject: ${mail.subject}\n\n${mail.text}`);
  index.push(`<li><a href="${name}.html">${name}</a> (<a href="${name}.txt">text</a>): ${mail.subject}</li>`);
  console.log(`${name}: ${mail.subject} (${(mail.html.length / 1024).toFixed(1)} KB html, ${mail.text.length} chars text)`);
}
writeFileSync(join(OUT, 'index.html'), `<!doctype html><meta charset="utf-8"><title>Emails</title><ul>${index.join('')}</ul>`);

// Supabase Auth: the magic link template, with Supabase's own Go template variable.
const supa = await renderEmail('magicLink', { url: SUPABASE_CONFIRMATION_URL });
const SUPA = join(PKG, 'supabase');
mkdirSync(SUPA, { recursive: true });
writeFileSync(join(SUPA, 'magic-link.html'), supa.html);
writeFileSync(join(SUPA, 'magic-link.txt'), supa.text);
writeFileSync(
  join(SUPA, 'templates.json'),
  `${JSON.stringify({ magic_link: { subject: supa.subject, content_path: 'packages/emails/supabase/magic-link.html' } }, null, 2)}\n`,
);
writeFileSync(join(OUT, 'supabase-magic-link.html'), supa.html);
console.log(`supabase magic link template: ${join(SUPA, 'magic-link.html')}`);
console.log(`previews in ${OUT}`);
