/**
 * startCapture({ source }): the one function that begins a new letter or take (design spec 06 step 0 and N3; PRD 01
 * section 3; NS-01-R1's prerequisite). Home's cluster calls it for Speak, Type and Not much today; a doorway handler
 * (widget, Control Center control, Action button, Siri) will call it with its own source when one is built. Nothing
 * else starts a capture: test/navigation-one-entry.test.ts fails on any other push of /listen or /write.
 *
 * It does exactly what Home did before the consolidation, in the same order: the opt-in analytics event (its catalog
 * `source` is the screen, `tonight`, never the control), Speak's arming tap for Listen, then the push with the prompt
 * as route params. Not much today keeps one mark with no words for the day (D-084); the Undo line stays on Home. The
 * rules themselves are pure in ./start-capture.logic.ts.
 */
import { router } from 'expo-router';
import { markOn, newQuietMark } from '@/components/book/quiet-day.logic';
import { childIndexOf, promptKindOf, trackCaptureStarted } from '@/lib/analytics/track';
import { armListenStart } from '@/lib/resilience/start-intent';
import { getActiveChildId, listEntries, saveEntry, todayISO, uuidv7 } from '@/lib/store';
import { planCapture, type CaptureRequest, type CaptureRoute, type CaptureSource } from './start-capture.logic';

export type CaptureStarted =
  | { kind: 'route'; pathname: CaptureRoute }
  | { kind: 'quietDay'; markId: string }
  | { kind: 'reserved'; source: CaptureSource };

export function startCapture(req: CaptureRequest): CaptureStarted {
  const plan = planCapture(req);
  switch (plan.kind) {
    case 'route': {
      trackCaptureStarted({
        mode: plan.mode,
        source: 'tonight',
        promptKind: promptKindOf(req.prompt?.key),
        childIndex: childIndexOf(getActiveChildId()),
        role: 'parent',
      });
      if (plan.armListen) armListenStart(); // the tap that lets Listen start the microphone
      router.push({ pathname: plan.pathname, params: plan.params });
      return { kind: 'route', pathname: plan.pathname };
    }
    case 'quietDay': {
      // One mark a day: a second tap adds nothing. The words are never written by the app (D-084).
      // Today by the clock at the tap, not the room's last read.
      const day = todayISO();
      const existing = markOn(listEntries(), day);
      const mark = existing ?? newQuietMark({ id: uuidv7(), occurredOn: day, capturedAt: new Date().toISOString() });
      if (!existing) saveEntry(mark);
      return { kind: 'quietDay', markId: mark.id };
    }
    case 'reserved':
      return plan;
  }
}
