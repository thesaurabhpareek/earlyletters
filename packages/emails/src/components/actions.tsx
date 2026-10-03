import { Button as ReButton } from '@react-email/components';
import { Children, Fragment, isValidElement, type ReactNode } from 'react';
import { fonts, light, layout, space, type } from '../tokens';
import { Mso, NotMso } from './mso';
import { Block, bgcolor, tableProps } from './primitives';
import { cls } from './theme';

export type ButtonProps = {
  href: string;
  /**
   * The button text. Pass it as `label` or as plain-text children (`<Button href>Sign in</Button>`); classic
   * Outlook gets a VML copy of the button, so the text must be a string.
   */
  label?: string;
  children?: ReactNode;
  /** Space above the button. Default 8px; the letter layout uses more when the action follows the sign-off. */
  top?: number;
};

/** Plain text of a children tree (strings and numbers only). */
export function textOf(node: ReactNode): string {
  return Children.toArray(node)
    .map((c) => (typeof c === 'string' || typeof c === 'number' ? String(c) : isValidElement<{ children?: ReactNode }>(c) ? textOf(c.props.children) : ''))
    .join('');
}

const escAttr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escText = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Button height (14 + 20 + 14) and the VML pill width for a label (about 9.5px a character at 17px semibold). */
export const BUTTON_HEIGHT = 48;
export const vmlButtonWidth = (label: string) => Math.max(200, Math.round(label.length * 10 + 56));

/**
 * The Outlook for Windows button: a VML rounded rectangle (Word ignores border-radius, so the HTML pill would be a
 * square slab there). `arcsize="50%"` makes the ends fully round at 48px tall.
 */
export function vmlButton(href: string, label: string): string {
  const w = vmlButtonWidth(label);
  return (
    `<!--[if mso]>` +
    `<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${escAttr(href)}" ` +
    `style="height:${BUTTON_HEIGHT}px;v-text-anchor:middle;width:${w}px;" arcsize="50%" stroke="f" fillcolor="${light.accent}">` +
    `<w:anchorlock/>` +
    `<center style="color:${light.onAccent};font-family:'Segoe UI',Arial,sans-serif;font-size:17px;font-weight:600;">${escText(label)}</center>` +
    `</v:roundrect>` +
    `<![endif]-->`
  );
}

/**
 * Bulletproof pill button.
 * - Every client but classic Outlook: a filled table cell holding a padded link (React Email's Button), 48px tall,
 *   full width on phones (480px and below) so it sits under the thumb.
 * - Classic Outlook (Word): a VML `v:roundrect` pill with the same colours, and the HTML button hidden from it.
 */
export function Button({ href, label, children, top = space[2] }: ButtonProps) {
  const text = label ?? textOf(children);
  if (!text) throw new Error('Button: pass the label as `label` or as plain-text children');
  const radius = 999;
  return (
    <Block top={top} bottom={space[6]}>
      <Mso html={vmlButton(href, text)} />
      <NotMso>
        <table
          role="presentation"
          cellPadding={0}
          cellSpacing={0}
          border={0}
          className={cls.btnWrap}
          style={{ borderCollapse: 'separate' }}
        >
          <tbody>
            <tr>
              <td
                className={`${cls.btn} ${cls.btnCell}`}
                {...bgcolor(light.accent)}
                align="center"
                style={{ backgroundColor: light.accent, borderRadius: radius }}
              >
                <ReButton
                  href={href}
                  target="_blank"
                  className={`${cls.btn} ${cls.btnText}`}
                  style={{
                    backgroundColor: light.accent,
                    color: light.onAccent,
                    borderRadius: radius,
                    padding: '14px 28px',
                    fontFamily: type.ui.family,
                    fontSize: 17,
                    lineHeight: '20px',
                    fontWeight: type.ui.weight,
                    textDecoration: 'none',
                    minWidth: layout.tapTarget,
                  }}
                >
                  {text}
                </ReButton>
              </td>
            </tr>
          </tbody>
        </table>
      </NotMso>
    </Block>
  );
}

export type CodeBoxProps = { code: string; label: string };

/** Spoken digit by digit by screen readers when the code is numeric. */
function spokenCode(code: string): string | undefined {
  return /^\d{4,10}$/.test(code) ? code.split('').join(' ') : undefined;
}

/**
 * The one-time code for "opened on another device". Big, tabular, selectable
 * in one tap where supported. iOS data detectors are neutralised in the head
 * CSS so the code is never turned into a phone link. The accent wash is
 * reserved for this box (the safety note is a quiet rule instead).
 */
export function CodeBox({ code, label }: CodeBoxProps) {
  return (
    <Block bottom={space[6]}>
      <p
        className={cls.muted}
        style={{
          margin: `0 0 ${space[2]}px`,
          fontFamily: fonts.sans,
          fontSize: type.small.size,
          lineHeight: type.small.line,
          color: light.inkMuted,
        }}
      >
        {label}
      </p>
      <table role="presentation" cellPadding={0} cellSpacing={0} border={0} style={{ borderCollapse: 'separate' }}>
        <tbody>
          <tr>
            <td
              className={cls.soft}
              {...bgcolor(light.accentSoft)}
              style={{
                backgroundColor: light.accentSoft,
                borderRadius: layout.radiusSmall,
                // Letter spacing also follows the last digit; take it off the right inset so the code sits centred.
                padding: `${space[3]}px ${space[5] - type.code.tracking}px ${space[3]}px ${space[5]}px`,
              }}
            >
              <span
                className={cls.ink}
                aria-label={spokenCode(code)}
                style={{
                  fontFamily: type.code.family,
                  fontSize: type.code.size,
                  lineHeight: type.code.line,
                  fontWeight: type.code.weight,
                  letterSpacing: type.code.tracking,
                  color: light.ink,
                  fontVariantNumeric: 'tabular-nums',
                  WebkitUserSelect: 'all',
                  userSelect: 'all',
                  whiteSpace: 'nowrap',
                }}
              >
                {code}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </Block>
  );
}

export type LinkFallbackProps = { href: string; label: string };

/** A URL as text with break opportunities after `/ ? & =`, so it wraps at a path boundary, not mid-word. */
function breakableUrl(href: string): ReactNode {
  const parts = href.split(/(?<=[/?&=])/);
  return parts.map((p, i) => (
    <Fragment key={i}>
      {p}
      {i < parts.length - 1 ? <wbr /> : null}
    </Fragment>
  ));
}

/**
 * "Button not working?" line plus the full URL as visible, wrapping text. Skipped in the plain-text part, where the
 * button line already carries the URL.
 */
export function LinkFallback({ href, label }: LinkFallbackProps) {
  return (
    <div className={cls.fallback}>
      <Block bottom={space[5]}>
        <p
          className={cls.muted}
          style={{
            margin: `0 0 ${space[1]}px`,
            fontFamily: fonts.sans,
            fontSize: type.small.size,
            lineHeight: type.small.line,
            color: light.inkMuted,
          }}
        >
          {label}
        </p>
        <p
          style={{
            margin: 0,
            fontFamily: fonts.sans,
            fontSize: type.small.size,
            lineHeight: type.small.line,
            overflowWrap: 'anywhere',
          }}
        >
          <a href={href} target="_blank" className={cls.accent} style={{ color: light.accent, textDecoration: 'underline' }}>
            {breakableUrl(href)}
          </a>
        </p>
      </Block>
    </div>
  );
}

export type KeyFact = { label: string; value: string };
export type KeyFactsProps = {
  /** Two to five rows, in reading order. Words come from @scribe/content; they repeat the body, never replace it. */
  facts: readonly KeyFact[];
};

/**
 * The facts a notice turns on (price, dates), lifted out of the paragraphs so the eye has somewhere to land:
 * label in muted 14px, value in ink 17px semibold, hairlines between rows. Repeats what the body already says.
 * Plain text renders each row as `Label: value`.
 */
export function KeyFacts({ facts }: KeyFactsProps) {
  if (facts.length === 0) return null;
  const rule = `1px solid ${light.line}`;
  return (
    <Block bottom={space[6]}>
      <table {...tableProps} className={cls.facts} style={{ borderCollapse: 'collapse' }}>
        <tbody>
          {facts.map((f, i) => {
            const edge = { borderTop: rule, ...(i === facts.length - 1 ? { borderBottom: rule } : {}) };
            return (
              <tr key={i} className={cls.factRow}>
                <td
                  className={`${cls.muted} ${cls.rule} ${cls.factLabel}`}
                  valign="top"
                  style={{
                    ...edge,
                    padding: `${space[3]}px ${space[4]}px ${space[3]}px 0`,
                    fontFamily: fonts.sans,
                    fontSize: type.small.size,
                    lineHeight: '24px',
                    color: light.inkMuted,
                    width: '42%',
                  }}
                >
                  {f.label}
                </td>
                <td
                  className={`${cls.ink} ${cls.rule} ${cls.factValue}`}
                  valign="top"
                  style={{
                    ...edge,
                    padding: `${space[3]}px 0`,
                    fontFamily: fonts.sans,
                    fontSize: type.body.size,
                    lineHeight: '24px',
                    fontWeight: type.ui.weight,
                    color: light.ink,
                  }}
                >
                  {f.value}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Block>
  );
}
