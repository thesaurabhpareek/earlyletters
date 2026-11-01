/**
 * Not found (S49): any path the app has no screen for (an old or mistyped link). Replaces Expo Router's
 * developer "Unmatched Route" page, which shows the URL and a sitemap. The shared StateScreen, like every
 * other state: the window drawing, still; "Nothing at this link" in title2; one sentence in body, muted;
 * Back to Tonight full width at the bottom, inside 20 pt gutters. The address is never read, shown or logged.
 */
import { router } from 'expo-router';
import { StateScreen } from '@/components/ui/state-screen';
import { copy } from '@/lib/copy';
import { TONIGHT_HREF } from '@/lib/resilience/not-found.logic';

export default function NotFound() {
  const e = copy.errors.notFoundPage;
  return <StateScreen kind="notFound" art="window" title={e.title} body={e.body} primary={{ label: e.button, onPress: () => router.replace(TONIGHT_HREF) }} />;
}
