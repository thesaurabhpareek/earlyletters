// android: same | web preview: same (no key, so a yes sends nothing)
/**
 * Shows the analytics consent sheet when the ask sequencer says it is due
 * (TRACKING_PLAN section 9 "Consent sheet", BL-023, G-24). Mounted in the tabs
 * layout (`app/(tabs)/_layout.tsx`), so it exists only inside the 18+ gate and
 * only under the tab roots it may appear on. If it is mounted twice, only the
 * first mounted copy is live, so the sheet can never stack.
 *
 * - Checked when the route changes, when the store changes and when the app
 *   comes back to the foreground; it appears only after the person has
 *   rested on a tab root for a moment (CALM_DELAY_MS), never mid-task.
 * - `recordAnalyticsOffer()` runs once, when the sheet appears; it also marks
 *   this session's one ask as used.
 */
import { useSegments } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { analyticsAskDueNow, recordAnalyticsOffer } from '@/lib/analytics/ask';
import { subscribe } from '@/lib/store';
import { AnalyticsConsentSheet } from './analytics-consent-sheet';

/** Time on a calm screen before the ask appears: long enough to land, short enough to be seen. */
const CALM_DELAY_MS = 1200;

/** The one live copy (a second mount stays inert). */
let liveCopy: symbol | null = null;

export function AnalyticsConsentAsk() {
  const segments = useSegments() as string[];
  const key = segments.join('/');
  const [open, setOpen] = useState(false);
  const [tick, setTick] = useState(0);
  const [live, setLive] = useState(false);
  const openRef = useRef(false);
  openRef.current = open;

  useEffect(() => {
    const me = Symbol('consent-ask');
    if (liveCopy === null) {
      liveCopy = me;
      setLive(true);
    }
    return () => {
      if (liveCopy === me) liveCopy = null;
    };
  }, []);

  // Store writes (a letter saved, a book added) and returning to the app can make it due.
  useEffect(() => subscribe(() => setTick((t) => t + 1)), []);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => s === 'active' && setTick((t) => t + 1));
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!live || openRef.current) return;
    const id = setTimeout(() => {
      let due = false;
      try {
        due = analyticsAskDueNow(key ? key.split('/') : []).due;
      } catch {
        due = false; // the ask is never worth an error
      }
      if (!due || openRef.current) return;
      recordAnalyticsOffer();
      setOpen(true);
    }, CALM_DELAY_MS);
    return () => clearTimeout(id);
  }, [key, tick, live]);

  const close = useCallback(() => setOpen(false), []);
  if (!live) return null;
  return <AnalyticsConsentSheet visible={open} onClose={close} />;
}
