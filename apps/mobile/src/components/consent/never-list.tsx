import { ListRow, ListSection } from '@/components/ui/list-row';
import { consentCopy } from './copy';

/**
 * "What we never do" (founder decision 11): stated once, plainly, where
 * people look for it. Read-only rows; the real controls sit above it.
 */
export function NeverList() {
  return (
    <ListSection title={consentCopy.neverTitle}>
      {consentCopy.never.map((line) => (
        <ListRow key={line} title={line} />
      ))}
    </ListSection>
  );
}
