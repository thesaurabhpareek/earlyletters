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

export function RootErrorBoundary({ retry }: ErrorBoundaryProps) {
  const e = copy.errors.crash;
  return (
    <PlainScreen
      title={e.title}
      body={e.body}
      actions={[
        { label: e.tryAgainButton, onPress: () => retry() },
        { label: e.tonightButton, kind: 'quiet', onPress: () => goToTonightAfterRetry(retry, (href) => router.replace(href as never)) },
      ]}
    />
  );
}
