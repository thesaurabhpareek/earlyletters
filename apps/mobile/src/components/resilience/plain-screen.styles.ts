/**
 * PlainScreen's look as data (EXPERIENCE_PASS S50, S51): the crash and launch-recovery screens wear the
 * brand faces and the same block as every other state (StateScreen, S49), drawn without a provider.
 * Pure, so tests read it directly (test/plain-screen.test.ts); plain-screen.tsx draws it.
 *
 *   type     the ramp tokens StateScreen uses: the title in title2 (Literata Medium), the body in body
 *            (Mukta), the hint and note in subhead, the buttons in label (Mukta Medium, as every Button).
 *            Faces by name with the weight reset, so nothing is synthesised and nothing falls back to
 *            Times, Georgia or Helvetica. The faces are embedded at build time by the expo-font config
 *            plugin (app.config.ts), so nothing waits on a provider.
 *   layout   StateScreen's gutter and drawing width; the primary is 56 pt and full width at the bottom,
 *            the quiet option 44 pt beneath it; pill radii.
 *   art      the page drawing from LINE_ART, complete and still: no lamp, no draw-on, no breath.
 */
import { tokens, type ColorToken } from '@scribe/design-tokens';
import { artHeight, LINE_ART, penWidth } from '@/components/ui/line-art.data';
import { STATE_LAYOUT } from '@/components/ui/state-screen.logic';

type Ramp = (typeof tokens.type)[keyof typeof tokens.type];

/** A ramp token as a plain style: the bundled face by name, with weight and slant reset. */
function face(t: Ramp) {
  return {
    fontFamily: t.fontFamily,
    fontSize: t.fontSize,
    lineHeight: t.lineHeight,
    letterSpacing: t.letterSpacing,
    fontWeight: 'normal' as const,
    fontStyle: 'normal' as const,
  };
}

/** One text role: its style and its Dynamic Type cap (0 is uncapped, so body text reaches AX5). */
const role = (t: Ramp) => ({ style: face(t), maxScale: t.maxScale ?? 0 });

export const PLAIN_TYPE = {
  title: role(tokens.type[STATE_LAYOUT.title]),
  body: role(tokens.type[STATE_LAYOUT.body]),
  hint: role(tokens.type.subhead),
  button: role(tokens.type.label),
} as const;

export const PLAIN_LAYOUT = {
  gutter: STATE_LAYOUT.gutter,
  artWidth: STATE_LAYOUT.artWidth,
  /** Picture to words, and between the lines of words (StateScreen's gaps). */
  gap: tokens.space[4],
  textGap: tokens.space[2],
  /** Room above and below the scrolling block when the safe area is unknown (no provider here). */
  edge: tokens.space[10],
  primaryHeight: tokens.target.primary,
  quietHeight: tokens.target.min,
  radius: tokens.radius.pill,
} as const;

export const PLAIN_ART = 'page' as const;

/** The page drawing as plain SVG data: viewBox, size, the wash circle, the paths, a 1.75 pt pen. */
export function plainArt(width: number = PLAIN_LAYOUT.artWidth) {
  const a = LINE_ART[PLAIN_ART];
  return {
    viewBox: a.viewBox.join(' '),
    width,
    height: artHeight(PLAIN_ART, width),
    wash: a.wash,
    paths: a.strokes.map((s) => s.d),
    strokeWidth: penWidth(PLAIN_ART, width),
  };
}

type Palette = Record<ColorToken, string>;

/**
 * A button as data. Primary: accent fill, onAccent label. Quiet: no fill, accent label. While busy the
 * label says what is happening (no spinner: nothing moves here) in textMuted, and a busy primary keeps a
 * 1 pt controlBorder outline instead of its fill, as Button does when it is not ready.
 */
export function plainButton(kind: 'primary' | 'quiet', c: Palette, busy = false) {
  const primary = kind === 'primary';
  return {
    container: {
      minHeight: primary ? PLAIN_LAYOUT.primaryHeight : PLAIN_LAYOUT.quietHeight,
      borderRadius: PLAIN_LAYOUT.radius,
      paddingHorizontal: tokens.space[5],
      paddingVertical: tokens.space[2],
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      alignSelf: 'stretch' as const,
      backgroundColor: primary && !busy ? c.accent : 'transparent',
      borderWidth: primary && busy ? tokens.stroke.control : 0,
      borderColor: c.controlBorder,
    },
    label: { ...PLAIN_TYPE.button.style, color: busy ? c.textMuted : primary ? c.onAccent : c.accent, textAlign: 'center' as const },
  };
}
