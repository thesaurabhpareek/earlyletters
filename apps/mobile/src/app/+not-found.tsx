/**
 * Any route the app does not have (a stale or mistyped link). The one state pattern, with the
 * one way forward: back to the book. Replaces expo-router's default "This screen doesn't exist".
 */
import { router } from 'expo-router';
import { StateScreen } from '@/components/ui/state-screen';
import { copy } from '@/lib/copy';

export default function NotFound() {
  return (
    <StateScreen
      kind="notFound"
      title={copy.errors.generic.title}
      body={copy.errors.generic.body}
      primary={{ label: copy.reader.notFoundCta, onPress: () => router.replace('/book') }}
    />
  );
}
