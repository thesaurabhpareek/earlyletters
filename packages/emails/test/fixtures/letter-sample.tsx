/**
 * Letter fixture: the Letter component with the action before the sign-off (the default), for the test suite and
 * the gallery. Not a product email. Fictional family only (CLAUDE.md): Asha.
 */
import { EmailFooter, EmailHeader, EmailLayout, Heading, Letter, Paragraph } from '../../src';

export const subject = 'Letter sample';

export const PreviewProps = { url: 'https://earlyletters.com/open' };

export default function LetterSample({ url }: { url: string }) {
  return (
    <EmailLayout preheader="A fixture for the letter layout, with the action placed before the sign-off.">
      <EmailHeader />
      <Heading>A page for Asha</Heading>
      <Letter action={{ href: url, label: 'Open the book' }} fallback="Button not working? Copy and paste this link:" note="A quiet aside, set small.">
        <Paragraph variant="letter">This fixture shows the letter layout. The words come first, then the one action, then the sign-off.</Paragraph>
        <Paragraph variant="letter">It exists so the tests can check the order of the parts.</Paragraph>
      </Letter>
      <EmailFooter kind="transactional" />
    </EmailLayout>
  );
}
