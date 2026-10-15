import type { ReactNode } from 'react';
import { space } from '../tokens';
import { Button, LinkFallback } from './actions';
import { Block } from './primitives';
import { Divider, Note, Signature } from './text';

export type LetterAction = { href: string; label: string };

export type LetterProps = {
  /** The letter's paragraphs, usually `<Paragraph variant="letter">`. */
  children: ReactNode;
  /** Sign-off text; `\n` becomes a line break. Defaults to the chrome signature. */
  signoff?: string;
  /** The one action, if the letter has one. */
  action?: LetterAction;
  /** "Button not working?" label; shown with the full URL under a hairline. */
  fallback?: string;
  /** A quiet aside at the very end (for example "Did not expect this? You can ignore it."). */
  note?: ReactNode;
  /**
   * Where the action sits.
   * - `before-signoff` (default): body, button, sign-off. The action stays above the fold on a 375px phone and the
   *   sign-off still closes the letter.
   * - `after-signoff`: body, sign-off, then the button as a postscript (no hairline, 24px above it). Use only when
   *   the action is clearly secondary to the letter.
   */
  actionPlacement?: 'before-signoff' | 'after-signoff';
};

/**
 * The letter body for mail written like a letter (welcome, family): words, the one action, the sign-off, then the
 * quiet part. Put it inside `EmailLayout` after `EmailHeader` and `Heading`. Copy comes from @scribe/content.
 */
export function Letter({ children, signoff, action, fallback, note, actionPlacement = 'before-signoff' }: LetterProps) {
  const button = action ? <Button href={action.href} label={action.label} top={actionPlacement === 'after-signoff' ? space[6] : space[2]} /> : null;
  return (
    <>
      {children}
      {actionPlacement === 'before-signoff' ? button : null}
      <Signature text={signoff} />
      {actionPlacement === 'after-signoff' ? button : null}
      {action && fallback ? (
        <>
          <Divider />
          <LinkFallback href={action.href} label={fallback} />
        </>
      ) : null}
      {note ? (
        <Block top={action && fallback ? 0 : space[6]} bottom={0}>
          <Note tone="quiet">{note}</Note>
        </Block>
      ) : null}
    </>
  );
}
