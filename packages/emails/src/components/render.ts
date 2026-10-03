import { render } from '@react-email/render';
import { createElement, type ReactElement } from 'react';
import { unwrapMso } from './mso';
import { EmailThemeProvider, type Theme } from './theme';

export type RenderOptions = {
  /** Force a theme for every component (gallery only). Shipped mail uses `auto`. */
  theme?: Theme;
};

/**
 * Render an email to final HTML. Always use this rather than calling
 * `@react-email/render` directly: it unwraps the Outlook conditional comments
 * (see mso.tsx).
 */
export async function renderEmail(element: ReactElement, opts: RenderOptions = {}): Promise<string> {
  const node = opts.theme ? createElement(EmailThemeProvider, { value: opts.theme }, element) : element;
  return unwrapMso(await render(node));
}

/** Plain-text alternative (multipart/alternative). Preheader is skipped. */
export async function renderEmailText(element: ReactElement): Promise<string> {
  const text = await render(element, {
    plainText: true,
    htmlToTextOptions: {
      selectors: [
        // Headings keep their case: shouting is not our voice.
        { selector: 'h1', options: { uppercase: false } },
        // The hairline divider is decoration.
        { selector: 'td.el-rule', format: 'skip' },
        // Show the dark logo's alt text once at most (the light one is already skipped).
        { selector: 'div.el-logo-dark', format: 'skip' },
      ],
    },
  });
  return text.replace(/\n[ \u00A0]+\n/g, '\n\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}
