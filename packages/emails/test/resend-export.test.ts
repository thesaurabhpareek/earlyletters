// TPL-02: the module Edge Functions import to send through Resend (packages/emails/generated/resend.ts) is exactly
// what this package renders, carries the inline logo, and fills values safely.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildResendModule, NO_SENDER, otherSenders, resendIds, resendModuleFile } from '../scripts/export-resend';
import * as mod from '../generated/resend';
import { DEFAULT_LINKS } from '../src/links';
import { logoAttachments, toResendApi } from '../src/send';
import { previewValues, templatesById } from '../src/templates';

const valuesFor = (id: mod.ResendTemplateId) =>
  Object.fromEntries(mod.templates[id].placeholders.map((k) => [k, previewValues[k] ?? `preview-${k}`]));

describe('generated/resend.ts', () => {
  it('matches the committed file (run: npm run export:resend -w @scribe/emails)', async () => {
    expect(readFileSync(resendModuleFile, 'utf8')).toBe(await buildResendModule());
  }, 60_000);

  it('imports nothing, so Deno and Node can both load it', () => {
    expect(readFileSync(resendModuleFile, 'utf8')).not.toMatch(/^\s*import\s/m);
  });

  it('carries every email our own functions send, and none another sender owns or nobody sends', () => {
    const ids = Object.keys(mod.templates);
    expect(ids).toEqual(resendIds());
    for (const id of otherSenders()) expect(ids, id).not.toContain(id);
    for (const id of NO_SENDER) expect(ids, id).not.toContain(id);
    for (const id of ['account-deletion-scheduled', 'account-deletion-cancelled', 'account-deleted', 'coparent-invite', 'welcome', 'trial-started', 'annual-renewal-long', 'family-book-closing']) expect(ids, id).toContain(id);
  });

  it('shares the default links and sender with the Node library', () => {
    expect(mod.meta.links).toEqual(DEFAULT_LINKS);
    expect(mod.logos).toEqual(logoAttachments().map(toResendApi));
  });

  it('fills every email from preview values with no placeholder left, the cid logos attached, subject and text intact', () => {
    for (const id of Object.keys(mod.templates) as mod.ResendTemplateId[]) {
      const mail = mod.renderForResend(id, valuesFor(id));
      expect(mail.html, id).not.toMatch(/\{[a-zA-Z][a-zA-Z0-9]*\}/);
      expect(mail.text, id).not.toMatch(/\{[a-zA-Z][a-zA-Z0-9]*\}/);
      expect(mail.subject, id).not.toMatch(/\{/);
      const cids = new Set([...mail.html.matchAll(/src="cid:([^"]+)"/g)].map((m) => m[1]));
      expect(cids, id).toEqual(new Set(mail.attachments.map((a) => a.content_id)));
      expect(mail.subject, id).toBe(templatesById[id]!.copy.subject.replace(/\{(\w+)\}/g, (_m, k: string) => valuesFor(id)[k]!));
    }
  });

  it('throws on a missing value instead of sending a raw placeholder', () => {
    expect(() => mod.renderForResend('account-deletion-scheduled', { requestId: 'REQ-1' })).toThrow(/no value for .*deletionDate/);
  });

  it('escapes values in the HTML but not in the text, and gives URLs shown as text break points', () => {
    const v = { ...valuesFor('coparent-invite'), inviter: '<b>Mumma</b> & "Papa"' };
    const mail = mod.renderForResend('coparent-invite', v);
    expect(mail.html).toContain('&lt;b&gt;Mumma&lt;/b&gt; &amp; &quot;Papa&quot;');
    expect(mail.html).not.toContain('<b>Mumma</b>');
    expect(mail.text).toContain('<b>Mumma</b> & "Papa"');
    const url = 'https://earlyletters.com/j#t=preview-not-a-real-invite';
    const inv = mod.renderForResend('coparent-invite', { ...valuesFor('coparent-invite'), inviteUrl: url });
    expect(inv.html).toContain(`href="${url}"`); // attributes keep the URL whole
    expect(inv.html).toContain('https:/<wbr>/<wbr>earlyletters.com/<wbr>j#t=<wbr>preview'); // the visible fallback can wrap
    expect(inv.text).toContain(url);
  });

  it('builds the Resend POST body: one recipient, our sender, reply-to, html, text and inline attachments', () => {
    const mail = mod.renderForResend('welcome', valuesFor('welcome'));
    const body = mod.toResendPayload(mail, 'asha@example.com');
    expect(body).toMatchObject({ from: mod.meta.from, to: ['asha@example.com'], reply_to: mod.meta.replyTo, subject: mail.subject });
    expect(body.attachments.map((a) => a.content_id).sort()).toEqual(['el-logo-dark', 'el-logo-light']);
  });

  it('formats dates with the weekday, as the fixtures and D-028 do (TPL-08)', () => {
    expect(mod.longDate('2026-11-02T12:00:00Z')).toBe('Monday, November 2, 2026');
    expect(mod.longDate(new Date('2026-11-02T03:00:00Z'), 'America/Los_Angeles')).toBe('Sunday, November 1, 2026');
  });
});
