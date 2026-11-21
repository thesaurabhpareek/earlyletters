/**
 * Settings, Export (EXPERIENCE_PASS_2026-10 S43, package P6): what each failure says and the one action that can work,
 * pure so test/settings-p6b.test.ts runs it in Node. app/settings/export.tsx draws it.
 *
 *   too big     "This book is too big for one file", and "Write to us" (mail, `settingsHome.helpSubject`) as the
 *               primary: exporting again would fail the same way
 *   low space   "The export did not finish" / "This phone needs more free space first." and "Export again"
 *   other       "The export did not finish" / `failedBody` and "Export again"
 * Export stays free in every plan state and is made on this phone (lib/export reads no network); an empty book shows
 * the outline button with `emptyNote` above it.
 */
import { exportCopy } from '@scribe/content';
import { copy } from '@/lib/copy';

export type ExportFailure = 'tooBig' | 'lowSpace' | 'other';

export function exportFailure(reason: ExportFailure): { title: string; body: string | null; action: 'writeToUs' | 'again'; label: string } {
  const s = exportCopy.screen;
  switch (reason) {
    case 'tooBig':
      return { title: s.tooBigTitle, body: null, action: 'writeToUs', label: copy.settingsHome.helpValue };
    case 'lowSpace':
      return { title: s.failedTitle, body: s.lowSpaceBody, action: 'again', label: s.againButton };
    default:
      return { title: s.failedTitle, body: s.failedBody, action: 'again', label: s.againButton };
  }
}

/** The four "What is inside" rows, each with its 20 pt Phosphor glyph (S43 Visual). */
export const INSIDE = [
  { key: 'includesLetters', icon: 'FileText' },
  { key: 'includesRecordings', icon: 'Microphone' },
  { key: 'includesBook', icon: 'BookOpen' },
  { key: 'includesData', icon: 'Database' },
] as const;

/** Nothing to export yet: the button waits (outline, P1's disabled style) under the line that says when it can. */
export function exportEmpty(summary: { letters: number } | null): boolean {
  return summary !== null && summary.letters === 0;
}
