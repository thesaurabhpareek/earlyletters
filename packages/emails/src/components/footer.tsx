import { emailChrome } from '@scribe/content/src/emails/chrome.en';
import { emailLegal } from '@scribe/content/src/emails/legal.en';
import { Fragment } from 'react';
import { ASSET_ORIGIN, fonts, light, space, type } from '../tokens';
import { cls } from './theme';

export type EmailFooterProps = {
  kind: 'transactional' | 'commercial';
  /** Replaces the default "why you got this" line for this email. */
  whyText?: string;
  /**
   * Values for footer placeholders. `helpUrl` and `privacyUrl` default to the
   * site's /contact and /privacy pages; anything else (for example
   * `preferencesUrl`) stays a literal `{token}` for the sender to fill.
   */
  values?: Partial<Record<string, string>>;
};

const DEFAULT_VALUES: Record<string, string> = {
  helpUrl: `${ASSET_ORIGIN}/contact`,
  privacyUrl: `${ASSET_ORIGIN}/privacy`,
};

const fill = (s: string, v: Partial<Record<string, string>>) =>
  s.replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g, (whole, k: string) => v[k] ?? whole);

/**
 * Quiet footer set on the desk under the sheet (EmailLayout lifts it out).
 * Words come from chrome.en.ts (B3) and legal.en.ts (L2); none live here.
 */
export function EmailFooter({ kind, whyText, values = {} }: EmailFooterProps) {
  const v: Partial<Record<string, string>> = {
    ...DEFAULT_VALUES,
    whyYouGotThis: whyText ?? emailLegal.whyYouGotThis[kind],
    unsubscribe: emailLegal.unsubscribe,
    postalAddress: emailLegal.postalLine,
    ...values,
  };
  // Fill twice: legal lines may themselves carry placeholders such as {postalAddress}.
  const lines = emailChrome.footer[kind].map((l) => fill(fill(l, v), v)).filter((l) => l.trim() !== '');
  const links = emailChrome.footer.links[kind];
  const text = {
    margin: `0 0 ${space[2]}px`,
    fontFamily: fonts.sans,
    fontSize: type.footer.size,
    lineHeight: type.footer.line,
    color: light.inkMuted,
  } as const;

  const link = (href: string, label: string) => (
    <a href={href} target="_blank" className={cls.muted} style={{ color: light.inkMuted, textDecoration: 'underline' }}>
      {label}
    </a>
  );
  // L2's optional `unsubscribeLink` lets the unsubscribe line be a real link instead of a bare URL.
  const unsub = (emailLegal as { unsubscribeLink?: { lead: string; label: string; urlVar: string } }).unsubscribeLink;
  const unsubText = fill(fill(emailLegal.unsubscribe, v), v);

  return (
    <div>
      {lines.map((l, i) => (
        <p key={i} className={cls.muted} style={text}>
          {unsub && l === unsubText ? (
            <>
              {unsub.lead} {link(fill(unsub.urlVar, v), unsub.label)}
            </>
          ) : (
            l
          )}
        </p>
      ))}
      {links.length ? (
        <p className={cls.muted} style={{ ...text, marginTop: space[3] }}>
          {links.map((l, i) => (
            <Fragment key={l.label}>
              {i > 0 ? emailChrome.footer.linkSeparator : null}
              {link(fill(l.urlVar, v), l.label)}
            </Fragment>
          ))}
        </p>
      ) : null}
      <p className={cls.muted} style={{ ...text, marginTop: space[3], marginBottom: 0 }}>
        {emailChrome.footer.nameLine}
      </p>
    </div>
  );
}
