import { Button as ReButton } from '@react-email/components';
import type { ReactNode } from 'react';
import { fonts, light, layout, space, type } from '../tokens';
import { Block, bgcolor } from './primitives';
import { cls } from './theme';

export type ButtonProps = { href: string; children: ReactNode };

/**
 * Bulletproof button: a filled table cell (bgcolor works in every client,
 * including Outlook on Windows) holding a padded link. React Email's Button
 * adds Outlook's `mso-padding-alt` / `mso-font-width` spacing, so the whole
 * 48px tall pill is tappable everywhere and the padding survives in Word.
 * Full width on phones (480px and below) so it sits under the thumb.
 */
export function Button({ href, children }: ButtonProps) {
  const radius = 999;
  return (
    <Block top={space[2]} bottom={space[6]}>
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
                {children}
              </ReButton>
            </td>
          </tr>
        </tbody>
      </table>
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
 * CSS so the code is never turned into a phone link.
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
                padding: `${space[3]}px ${space[5]}px`,
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

/** "Button not working?" line plus the full URL as visible, wrapping text. */
export function LinkFallback({ href, label }: LinkFallbackProps) {
  return (
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
          wordBreak: 'break-all',
          overflowWrap: 'anywhere',
        }}
      >
        <a
          href={href}
          target="_blank"
          className={cls.accent}
          style={{ color: light.accent, textDecoration: 'underline', wordBreak: 'break-all' }}
        >
          {href}
        </a>
      </p>
    </Block>
  );
}
