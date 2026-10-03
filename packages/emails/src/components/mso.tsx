/**
 * Raw markup for Outlook on Windows (Word rendering engine), which ignores
 * `max-width` and needs a fixed-width "ghost table" around fluid content.
 *
 * React cannot emit HTML comments, so each fragment is rendered inside a
 * marker <span data-mso>. `renderEmail()` unwraps the markers so the shipped
 * HTML contains only the bare conditional comments. Every other client sees a
 * comment and ignores it.
 */
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

/** Outlook DPI fix, so 2x images and px sizes are not rescaled at 120 dpi. */
export function MsoHead() {
  return (
    <Mso html='<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->' />
  );
}

/** Strip the marker spans, leaving the conditional comments in place. */
export function unwrapMso(html: string): string {
  return html.replace(/<span data-mso="">([\s\S]*?)<\/span>/g, '$1');
}
