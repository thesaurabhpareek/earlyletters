import { emailChrome } from '@scribe/content/src/emails/chrome.en';
import type { CSSProperties, ReactNode } from 'react';
import { fonts, light, space, type } from '../tokens';
import { Block, tableProps } from './primitives';
import { cls } from './theme';

/** The one line that matters. Literata (Georgia fallback), medium weight. */
export function Heading({ children }: { children: ReactNode }) {
  return (
    <h1
      className={`${cls.ink} ${cls.heading}`}
      style={{
        margin: `0 0 ${space[5]}px`,
        fontFamily: type.heading.family,
        fontSize: type.heading.size,
        lineHeight: type.heading.line,
        fontWeight: type.heading.weight,
        color: light.ink,
        letterSpacing: '-0.2px',
        // No one-word orphan on phones (Apple Mail and iOS Mail honour it; others ignore it).
        textWrap: 'balance',
      } as CSSProperties}
    >
      {children}
    </h1>
  );
}

export type ParagraphProps = {
  /**
   * `ui` (default): the sans, 17px / 1.6, for account and security mail.
   * `letter`: the reading serif, 18px / 1.65, for mail written like a letter.
   */
  variant?: 'ui' | 'letter';
  children: ReactNode;
};

/** Body text. Quiet UI by default; serif when the email reads as a letter. */
export function Paragraph({ variant = 'ui', children }: ParagraphProps) {
  const t = variant === 'letter' ? type.letter : type.body;
  return (
    <p
      className={cls.ink}
      style={{
        margin: `0 0 ${space[4]}px`,
        fontFamily: t.family,
        fontSize: t.size,
        lineHeight: t.line,
        fontWeight: t.weight,
        color: light.ink,
      }}
    >
      {children}
    </p>
  );
}

export type NoteProps = {
  /** `quiet`: small muted aside. `safety`: the "did not ask for this?" line, set off by a quiet rule on the left. */
  tone?: 'quiet' | 'safety';
  children: ReactNode;
};

/**
 * Secondary text in the UI sans. Calm, never alarming: no red, no icons. The safety note has no fill, so the
 * accent wash stays exclusive to the code box and never competes with it.
 */
export function Note({ tone = 'quiet', children }: NoteProps) {
  const text = (
    <p
      className={tone === 'safety' ? cls.ink : cls.muted}
      style={{
        margin: 0,
        fontFamily: fonts.sans,
        fontSize: tone === 'safety' ? 15 : type.small.size,
        lineHeight: type.small.line,
        color: tone === 'safety' ? light.ink : light.inkMuted,
      }}
    >
      {children}
    </p>
  );
  if (tone === 'quiet') return <Block bottom={space[4]}>{text}</Block>;
  return (
    <Block bottom={space[6]}>
      <table {...tableProps} style={{ borderCollapse: 'separate' }}>
        <tbody>
          <tr>
            <td
              className={cls.rule}
              style={{
                borderLeft: `3px solid ${light.line}`,
                padding: `${space[1]}px 0 ${space[1]}px ${space[4]}px`,
              }}
            >
              {text}
            </td>
          </tr>
        </tbody>
      </table>
    </Block>
  );
}

/** Letter sign-off. Newlines become line breaks. Defaults to the chrome signature. */
export function Signature({ text }: { text?: string }) {
  const lines = (text ?? emailChrome.signature).split('\n');
  return (
    <Block top={space[2]} bottom={0}>
      <p
        className={cls.ink}
        style={{
          margin: 0,
          fontFamily: type.letter.family,
          fontSize: type.body.size,
          lineHeight: type.letter.line,
          fontStyle: 'italic',
          color: light.ink,
        }}
      >
        {lines.map((l, i) => (
          <span key={i}>
            {i > 0 ? <br /> : null}
            {l}
          </span>
        ))}
      </p>
    </Block>
  );
}

/** A hairline. Decorative only: never the sole boundary of anything. */
export function Divider() {
  return (
    <table {...tableProps}>
      <tbody>
        <tr>
          <td style={{ padding: `${space[3]}px 0 ${space[8]}px` }}>
            <table {...tableProps}>
              <tbody>
                <tr>
                  <td
                    className={`${cls.rule} ${cls.divider}`}
                    style={{ borderTop: `1px solid ${light.line}`, fontSize: 0, lineHeight: 0, height: 1 }}
                  >
                    &nbsp;
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  );
}
