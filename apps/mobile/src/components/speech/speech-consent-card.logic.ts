/**
 * The first-run speech card's one line after a yes (speech-consent-card.tsx). Pure, tested in Node
 * (test/speech-download-status.test.ts). Every word comes from packages/content.
 *
 * Order: a failure (calm, with Try again where a tap can help), then a wait (Wi-Fi, space, offline), then bytes
 * moving (a percent once there is a whole one, with the bar), then a stage that is not moving (waiting to start,
 * checking, finishing), else the line said at the tap. A percent and a bar appear only while bytes move, so the
 * card never shows "0%" for a download that is waiting.
 */
import { speechConsentCopy, speechSettingsCopy } from '@scribe/content';
import { fill } from '@/lib/copy';
import { shownPercent, type DownloadStage } from '@/lib/models/speech-download.logic';
import { packsCopy } from '@/lib/packs/copy';

export interface ConsentDownload {
  progress: number | null;
  stage: DownloadStage | null;
  hold: 'waiting_for_wifi' | 'no_space' | 'offline' | null;
  failure: string | null;
}

export interface ConsentLine {
  text: string;
  /** The determinate bar's value (0..1), only while bytes move; null draws no bar. */
  bar: number | null;
  /** Offer "Try again" (a tap that restarts the download). */
  retry: boolean;
}

/** Failures a tap cannot help with: nothing published yet, paused, or the app needs an update. */
const NO_RETRY = new Set(['no_manifest', 'not_in_manifest', 'downloads_paused', 'needs_app_update']);

export function consentLine(d: ConsentDownload, mb: number): ConsentLine {
  if (d.failure) {
    const text = speechSettingsCopy.downloadFailures[d.failure] ?? packsCopy.failures.generic;
    return { text, bar: null, retry: !NO_RETRY.has(d.failure) };
  }
  if (d.hold === 'waiting_for_wifi') return { text: fill(speechSettingsCopy.waitingForWifi, { n: mb }), bar: null, retry: false };
  if (d.hold === 'no_space') return { text: fill(speechSettingsCopy.noSpace, { n: mb }), bar: null, retry: false };
  if (d.hold === 'offline') return { text: speechSettingsCopy.downloadFailures.offline, bar: null, retry: false };
  if (d.progress !== null) {
    const n = shownPercent(d.progress);
    return { text: n === null ? packsCopy.phases.downloading : fill(speechSettingsCopy.downloading, { n }), bar: d.progress, retry: false };
  }
  if (d.stage) return { text: packsCopy.phases[d.stage], bar: null, retry: false };
  return { text: speechConsentCopy.chosenYes, bar: null, retry: false };
}

/** Every file the language needs is on this phone. */
export function doneLine(mb: number): ConsentLine {
  return { text: fill(speechSettingsCopy.ready, { n: mb }), bar: null, retry: false };
}
