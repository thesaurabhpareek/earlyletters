/**
 * Every email: an HTML part and a plain-text part from the same copy; no images, pixels, remote
 * fonts, scripts or tracked links; light and dark mode; no unfilled placeholders.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { brand } from '@scribe/brand';
import { describe, expect, it } from 'vitest';
import { renderEmail, SUPABASE_CONFIRMATION_URL, type EmailName } from '../src/index';

const samples: Record<EmailName, unknown> = {
  magicLink: { url: 'https://earlyletters.com/auth/confirm?token_hash=t&type=magiclink' },
  coParentInvite: { inviter: 'Mama', url: 'https://earlyletters.com/i/ABC' },
  welcome: undefined,
  deletionRequested: { date: 'November 2, 2026', reference: 'DR-1' },
  deletionCancelled: { reference: 'DR-1' },
  deletionCompleted: { date: 'November 2, 2026', reference: 'DR-1' },
  exportReady: { url: 'https://earlyletters.com/export/ABC', days: 7 },
};

const names = Object.keys(samples) as EmailName[];

describe.each(names)('%s', (name) => {
  const mail = () => renderEmail(name, samples[name] as never);

  it('has a subject, an HTML part and a plain-text part', async () => {
    const m = await mail();
    expect(m.subject.length).toBeGreaterThan(0);
    expect(m.html).toMatch(/^<!DOCTYPE html/);
    expect(m.text.length).toBeGreaterThan(100);
    expect(m.html).toContain(brand.name);
    expect(m.text).toContain(brand.name);
  });

  it('loads nothing from a server and tracks nothing', async () => {
    const { html } = await mail();
    expect(html).not.toMatch(/<img|<script|<iframe|<link\s|@import|url\(|background-image|utm_|pixel|beacon/i);
    for (const [, href] of html.matchAll(/href="([^"]*)"/g)) {
      expect(href === SUPABASE_CONFIRMATION_URL || /^(https:\/\/|mailto:)/.test(href), href).toBe(true);
    }
  });

  it('supports light and dark mode', async () => {
    const { html } = await mail();
    expect(html).toContain('name="color-scheme" content="light dark"');
    expect(html).toContain('prefers-color-scheme: dark');
  });

  it('leaves no placeholder unfilled and carries the action link in both parts', async () => {
    const m = await mail();
    expect(m.html.replaceAll(SUPABASE_CONFIRMATION_URL, '')).not.toMatch(/\{\w+\}/);
    expect(m.text).not.toMatch(/\{\w+\}/);
    const url = (samples[name] as { url?: string } | undefined)?.url;
    if (url) {
      expect(m.html).toContain(url.replaceAll('&', '&amp;'));
      expect(m.text).toContain(url);
    }
  });
});

describe('Supabase Auth magic link template', () => {
  it('uses Supabase\'s confirmation variable and matches the committed file', async () => {
    const m = await renderEmail('magicLink', { url: SUPABASE_CONFIRMATION_URL });
    expect(m.html).toContain(`href="${SUPABASE_CONFIRMATION_URL}"`);
    const committed = readFileSync(join(__dirname, '..', 'supabase', 'magic-link.html'), 'utf8');
    expect(committed, 'run: npm run build -w @scribe/emails').toBe(m.html);
  });
});
