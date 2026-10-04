/**
 * Not found: any path the app has no screen for (an old or mistyped link). Replaces Expo Router's developer
 * "Unmatched Route" page, which shows the URL and a sitemap. Here: calm words, one way back to Tonight, and
 * the address is never shown or logged.
 */
import { router } from 'expo-router';
import { EmptyState } from '@/components/ui/empty-state';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { copy } from '@/lib/copy';
import { TONIGHT_HREF } from '@/lib/resilience/not-found.logic';

export default function NotFound() {
  const e = copy.errors.notFoundPage;
  return (
    <SafeAreaView className="flex-1 justify-center bg-background px-5">
      <EmptyState art="envelope" title={e.title} body={e.body} action={{ label: e.button, onPress: () => router.replace(TONIGHT_HREF) }} />
    </SafeAreaView>
  );
}
