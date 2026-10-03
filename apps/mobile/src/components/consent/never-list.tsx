import { Row, Section } from '@/components/settings/settings-ui';
import { consentCopy } from './copy';

/**
 * "What we never do" (founder decision 11): stated once, plainly, where
 * people look for it. Read-only rows; the real controls sit above it.
 */
export function NeverList() {
  return (
    <Section title={consentCopy.neverTitle}>
      {consentCopy.never.map((line, i) => (
        <Row key={line} first={i === 0} title={line} />
      ))}
    </Section>
  );
}
