/**
 * `screen_view` from the router (TDD 01 3.11.1). Mount once in the root
 * layout. Uses the file-route segments (templates such as `letter/[id]`),
 * never the concrete path, so ids and params cannot reach analytics; a route
 * missing from ROUTE_MAP sends nothing. Never SDK screen capture.
 */
import { useSegments } from 'expo-router';
import { useEffect } from 'react';
import { routeForSegments } from '@scribe/analytics';
import { analytics } from './index';

export function useScreenViews(): void {
  const segments = useSegments() as string[];
  const key = segments.join('/');
  useEffect(() => {
    const route = routeForSegments(key ? key.split('/') : []);
    if (route) analytics.track('screen_view', { route });
  }, [key]);
}
