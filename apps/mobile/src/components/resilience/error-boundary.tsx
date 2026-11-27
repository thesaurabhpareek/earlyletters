/**
 * Root error boundary screen (exported from src/app/_layout.tsx as `ErrorBoundary`, which Expo Router
 * renders in place of the layout when anything under it throws while rendering).
 *
 * Calm and in the product voice: the letters are safe, one way to try again, one way to Tonight.
 * It never shows the error, its message or a stack, and it logs nothing: an error object can quote
 * content, and nothing here may keep or send it (CLAUDE.md privacy rules).
 */
import { router, type ErrorBoundaryProps } from 'expo-router';
import { copy } from '@/lib/copy';
import { goToTonightAfterRetry } from '@/lib/resilience/recover-to-tonight';
import { PlainScreen } from './plain-screen';

export function RootErrorBoundary({ retry, error }: ErrorBoundaryProps) {
  // DIAGNOSTIC ONLY (never merged).
  // eslint-disable-next-line no-console
  console.error('[DIAG boundary]', error instanceof Error ? `${error.name}: ${error.message}\n${error.stack ?? ''}` : String(error));
  const e = copy.errors.crash;
  return (
    <PlainScreen
      title={e.title}
      body={e.body}
      // "phone." sat alone on the second line at 402 and 375 pt: a line-break setting, not a no-break space (CDesO-47).
      balanceBody
      actions={[
        { label: e.tryAgainButton, onPress: () => retry() },
        { label: e.tonightButton, kind: 'quiet', onPress: () => goToTonightAfterRetry(retry, (href) => router.replace(href as never)) },
      ]}
    />
  );
}
