/** The welcome email: structure, escaping and the repo's voice rules (the copy itself is site.welcomeEmail, also covered by copy-rules). */
import { describe, expect, it } from 'vitest';
import { sampleLetter, site } from '../src/content/site';
import { renderWelcomeEmail } from '../src/lib/notify/welcome-email';

const BANNED = /[—–‘’“”…]|\p{Extended_Pictographic}/u;

describe('renderWelcomeEmail', () => {
  const mail = renderWelcomeEmail('https://earlyletters.com', 'https://earlyletters.com/unsubscribe?t=abc.def');

  it('has a subject, a preheader, an h1, a logo with alt text and a text version', () => {
    expect(mail.subject).toBe(site.welcomeEmail.subject);
    expect(mail.html).toContain(site.welcomeEmail.preheader);
    expect(mail.html).toContain('<h1');
    expect(mail.html).toContain('src="https://earlyletters.com/apple-icon"');
    expect(mail.text).toContain(site.welcomeEmail.headline);
    for (const line of site.welcomeEmail.promises) expect(mail.text).toContain(line);
  });

  it('supports dark mode and carries no tracking, scripts or remote styles', () => {
    expect(mail.html).toContain('prefers-color-scheme: dark');
    expect(mail.html).not.toMatch(/<script|<link|<iframe|width="1" height="1"|utm_/i);
  });

  it('follows the content rules and says how to be removed', () => {
    for (const part of [mail.subject, mail.html.replace(/<[^>]+>/g, ' '), mail.text]) expect(part).not.toMatch(BANNED);
    expect(mail.text.toLowerCase()).not.toMatch(/\bai\b|artificial|cherish|journey/);
    expect(mail.text).toContain('reply to this email and we will remove it');
    expect(mail.html).toContain('>Unsubscribe</a>');
    expect(mail.html).toContain('href="https://earlyletters.com/unsubscribe?t=abc.def"');
  });
});

describe('the letter in the email', () => {
  it('shows only words the sample letter holds', () => {
    expect(sampleLetter.text.startsWith(site.welcomeEmail.letterExcerpt)).toBe(true);
    expect(sampleLetter.to).toBe('Meera');
    expect(site.welcomeEmail.letterTo).toBe(`To ${sampleLetter.to}`);
    expect(site.welcomeEmail.letterFrom).toBe(`From ${sampleLetter.from}`);
  });
});
