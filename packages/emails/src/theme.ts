/**
 * Email theme. Colours mirror packages/brand and the design tokens (DESIGN_LANGUAGE section 2), so
 * an email looks like the app's paper and ink. Dark mode: clients that honour
 * `prefers-color-scheme` (Apple Mail, iOS Mail, Outlook for Mac) get the token dark palette from the
 * <style> block; clients that invert colours on their own (Gmail apps, Outlook.com) invert a
 * text-only layout cleanly, because there are no images or colour-dependent graphics.
 *
 * Fonts: system stacks only. A web font would mean a request to a font server when the email is
 * opened, which is exactly what "no tracking" rules out.
 */
export const light = {
  bg: '#FBF8F3',
  card: '#FFFFFF',
  text: '#2B2722',
  muted: '#6B645B',
  accent: '#8A5A3B',
  onAccent: '#FFFFFF',
  line: '#E6DED3',
} as const;

export const dark = {
  bg: '#161412',
  card: '#201D1A',
  text: '#F2ECE4',
  muted: '#B3AA9E',
  accent: '#D9A47E',
  onAccent: '#1E1612',
  line: '#33302C',
} as const;

export const serif = "Georgia, 'Times New Roman', Times, serif";
export const sans = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

/** Class names the dark-mode stylesheet targets. Inline styles carry the light palette. */
export const cls = {
  body: 'el-body',
  card: 'el-card',
  text: 'el-text',
  muted: 'el-muted',
  button: 'el-button',
  link: 'el-link',
  line: 'el-line',
} as const;

export const darkCss = `
:root { color-scheme: light dark; supported-color-schemes: light dark; }
body { background-color: ${light.bg}; margin: 0; padding: 0; }
@media (prefers-color-scheme: dark) {
  .${cls.body} { background-color: ${dark.bg} !important; }
  .${cls.card} { background-color: ${dark.card} !important; border-color: ${dark.line} !important; }
  .${cls.text} { color: ${dark.text} !important; }
  .${cls.muted} { color: ${dark.muted} !important; }
  .${cls.button} { background-color: ${dark.accent} !important; color: ${dark.onAccent} !important; }
  .${cls.link} { color: ${dark.accent} !important; }
  .${cls.line} { border-color: ${dark.line} !important; }
}
[data-ogsc] .${cls.text} { color: ${dark.text} !important; }
[data-ogsc] .${cls.muted} { color: ${dark.muted} !important; }
[data-ogsc] .${cls.link} { color: ${dark.accent} !important; }
`;
