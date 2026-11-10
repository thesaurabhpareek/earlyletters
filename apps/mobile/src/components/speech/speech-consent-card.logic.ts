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
import { downloadingLine, type DownloadStage } from '@/lib/models/speech-download.logic';
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
  /** A failure a tap can help with: "The download stopped." said before the reason, unless the reason already says it. */
  lead?: string;
}

/** Failures a tap cannot help with: nothing published yet, paused, or the app needs an update. */
const NO_RETRY = new Set(['no_manifest', 'not_in_manifest', 'downloads_paused', 'needs_app_update']);

export function consentLine(d: ConsentDownload, mb: number): ConsentLine {
  if (d.failure === 'cancelled') return { text: packsCopy.phases.cancelled, bar: null, retry: true }; // stopped: nothing restarts it
  if (d.failure) {
    const text = speechSettingsCopy.downloadFailures[d.failure] ?? packsCopy.failures.generic;
    const retry = !NO_RETRY.has(d.failure);
    const stopped = speechConsentCopy.stopped;
    // Only where something started and stopped; "The download stopped. The download stopped." is never said.
    return retry && !text.startsWith(stopped) ? { text, bar: null, retry, lead: stopped } : { text, bar: null, retry };
  }
  if (d.hold === 'waiting_for_wifi') return { text: fill(speechSettingsCopy.waitingForWifi, { n: mb }), bar: null, retry: false };
  if (d.hold === 'no_space') return { text: fill(speechSettingsCopy.noSpace, { n: mb }), bar: null, retry: false };
  if (d.hold === 'offline') return { text: speechSettingsCopy.downloadFailures.offline, bar: null, retry: false };
  if (d.progress !== null) {
    return { text: downloadingLine(d.progress, (n) => fill(speechSettingsCopy.downloading, { n })), bar: d.progress, retry: false };
  }
  // `verifying` is the SHA-256 check of the whole file (packs/engine.ts); `queued` and `installing` keep their words.
  if (d.stage === 'verifying') return { text: speechConsentCopy.checking, bar: null, retry: false };
  if (d.stage) return { text: packsCopy.phases[d.stage], bar: null, retry: false };
  return { text: speechConsentCopy.chosenYes, bar: null, retry: false };
}

/** Every file the language needs is on this phone. */
export function doneLine(mb: number): ConsentLine {
  return { text: fill(speechSettingsCopy.ready, { n: mb }), bar: null, retry: false };
}

/**
 * "You can start now. Your voice is kept, and the words follow." under the progress. True while the download is on
 * its way: a recording made now is kept and waits for its words (`waiting_for_pack`), and they come when the
 * download lands. Not once the words are here (nothing to wait for), not after a failure (they follow only after a
 * tap), and not when the phone needs space (they follow only after the person frees some).
 */
export function showsStartNow(d: ConsentDownload, done: boolean): boolean {
  return !done && d.failure === null && d.hold !== 'no_space';
}

/**
 * What VoiceOver hears when the card changes state (iOS has no live regions; lib/a11y announce). Bytes moving is
 * one state, so a new percent is never announced: the percent is the progress bar's accessibilityValue.
 */
export function spokenLine(line: ConsentLine): string {
  if (line.bar !== null) return packsCopy.phases.downloading;
  return line.lead ? `${line.lead} ${line.text}` : line.text;
}

/** The announcement for a move from `prev` to `next`, or null when the state is the same (or there was none before). */
export function stateAnnouncement(prev: ConsentLine | null, next: ConsentLine): string | null {
  if (prev === null) return next.retry ? spokenLine(next) : null; // on mount: only a failure that asks for a tap
  const said = spokenLine(next);
  return said === spokenLine(prev) ? null : said;
}

/** The bar's fill as a scale (0..1) from the true fraction, so bytes under 1% still draw; the number waits for 1%. */
export function barScale(bar: number): number {
  if (!Number.isFinite(bar)) return 0;
  return Math.max(0, Math.min(1, bar));
}
