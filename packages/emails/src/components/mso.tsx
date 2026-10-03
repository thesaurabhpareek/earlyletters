/**
 * Raw markup for Outlook on Windows (Word rendering engine), which ignores
 * `max-width` and needs a fixed-width "ghost table" around fluid content.
 *
 * React cannot emit HTML comments, so each fragment is rendered inside a
 * marker <span data-mso>. `renderEmail()` unwraps the markers so the shipped
 * HTML contains only the bare conditional comments. Every other client sees a
 * comment and ignores it.
 */
import type { ReactNode } from 'react';
import { layout } from '../tokens';
import { cls } from './theme';

export const MSO_MARKER_ATTR = 'data-mso';

export function Mso({ html }: { html: string }) {
  return <span {...{ [MSO_MARKER_ATTR]: '' }} dangerouslySetInnerHTML={{ __html: html }} />;
}

/** Opens a fixed-width centred table for Outlook only. Pair with GhostClose. */
export function GhostOpen({ width }: { width: number }) {
  return (
    <Mso
      html={`<!--[if mso]><table role="presentation" align="center" width="${width}" cellpadding="0" cellspacing="0" border="0" style="width:${width}px;"><tr><td><![endif]-->`}
    />
  );
}

export function GhostClose() {
  return <Mso html="<!--[if mso]></td></tr></table><![endif]-->" />;
}

/**
 * Outlook DPI fix, so 2x images and px sizes are not rescaled at 120 dpi. Also gives classic Outlook (no media
 * queries) the desktop sheet padding, since the inline padding is the phone layout (mobile first). The @font-face
 * block is hidden from Word (layout.tsx), so it never falls back to Times New Roman.
 */
export function MsoHead() {
  return (
    <Mso
      html={`<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><style>.${cls.pad}{padding-left:${layout.pad}px !important;padding-right:${layout.pad}px !important;}</style><![endif]-->`}
    />
  );
}

/** Wraps children so classic Outlook (Word) never sees them; every other client does. */
export function NotMso({ children }: { children: ReactNode }) {
  return (
    <>
      <Mso html="<!--[if !mso]><!-->" />
      {children}
      <Mso html="<!--<![endif]-->" />
    </>
  );
}

/** Strip the marker spans, leaving the conditional comments in place. */
export function unwrapMso(html: string): string {
  return html.replace(/<span data-mso="">([\s\S]*?)<\/span>/g, '$1');
}
