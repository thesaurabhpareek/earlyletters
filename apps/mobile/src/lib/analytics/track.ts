/**
 * What screens call. Typed from the catalogue: a wrong event name or value is
 * a compile error, and the helpers turn raw numbers into buckets.
 *
 *   import { trackLetterSaved } from '@/lib/analytics/track';
 *   trackLetterSaved({ mode: 'spoken', inBook: false, childIndex: 0, ... });
 *
 * Events whose properties are plain enums use `track` directly:
 *   track('error_shown', { code: 'save_failed' });
 *
 * Every helper is a no-op until the person says yes. Where each one is called
 * from is listed in docs/analytics/TRACKING_PLAN.md section 9 ("To wire").
 */
import { analytics, trackers } from './index';

export const track = analytics.track;

export const {
  trackLetterSaved,
  trackCaptureStarted,
  trackCaptureDiscarded,
  trackTranscriptionCompleted,
  trackBookOpened,
  trackReadTogetherStarted,
  trackReadTogetherEnded,
  trackInviteCreated,
  trackInviteAccepted,
  trackExportStarted,
  trackExportCompleted,
  trackExportFailed,
  trackReminderSchedule,
  trackMachineEditsRejected,
  trackColdStart,
  trackLanguageSet,
  trackPackDownload,
} = trackers;
