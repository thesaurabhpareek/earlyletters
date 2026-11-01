/**
 * Help links (F20-REQ-002, F20-REQ-005, F20-REQ-007; RT-SET-02, SR-C-09): the crisis lines on "If you are struggling"
 * and the Write to us rows in Settings. Each opens `tel:`, `sms:` or `mailto:`. When the device cannot (an iPad, a
 * phone with no SIM, no Mail account), nothing may silently happen: the caller gets back the number or address to show
 * as selectable text with a Copy button, in the same tap.
 *
 * Pure: the linker is passed in (react-native `Linking` in the app, a fake in tests), so this runs in Node.
 * Nothing is counted, logged or sent (D-034).
 */
import { brand, supportMailto } from '@scribe/brand';
import { en } from '@scribe/content';

/** The two calls this needs from react-native `Linking`. */
export type Linker = {
  canOpenURL(url: string): Promise<boolean>;
  openURL(url: string): Promise<unknown>;
};

/** What a row opens, and what to show if it cannot: a phone number to call or text, or our email address. */
export type HelpTarget = { kind: 'call' | 'text' | 'mail'; url: string; value: string };

export type HelpOpenResult = { kind: 'opened' } | { kind: 'fallback'; target: HelpTarget };

/** One crisis line as packages/content `struggling.resources` holds it. `sms` only on lines that take texts. */
export type CrisisLine = { name: string; how: string; tel: string; number: string; sms?: string };

/** The rows for one line: the line's own row starts a call; a line that takes texts gets a Text row after it. */
export type CrisisRows = { line: CrisisLine; call: HelpTarget; text: HelpTarget | null };

export const callTarget = (line: CrisisLine): HelpTarget => ({ kind: 'call', url: `tel:${line.tel}`, value: line.number });

export const textTarget = (line: CrisisLine): HelpTarget | null =>
  line.sms ? { kind: 'text', url: `sms:${line.sms}`, value: line.number } : null;

/** Write to us: the support mailbox with a fixed subject and nothing else (LEGAL-REQ-014). */
export const mailTarget = (subject?: string): HelpTarget => ({ kind: 'mail', url: supportMailto(subject), value: brand.support.email });

export function crisisRows(lines: readonly CrisisLine[]): CrisisRows[] {
  return lines.map((line) => ({ line, call: callTarget(line), text: textTarget(line) }));
}

/**
 * Opens the target, or says what to show instead. Asks `canOpenURL` first (false on an iPad for `tel:`), and treats
 * a rejected `openURL` (no SIM, no Mail account, the system said no) the same way. Never throws.
 */
export async function openHelpTarget(target: HelpTarget, linker: Linker): Promise<HelpOpenResult> {
  try {
    if (!(await linker.canOpenURL(target.url))) return { kind: 'fallback', target };
    await linker.openURL(target.url);
    return { kind: 'opened' };
  } catch {
    return { kind: 'fallback', target };
  }
}

/** The fallback sheet's words for a target: title, the line under it, the Copy button and what it says once copied. */
export function fallbackWords(kind: HelpTarget['kind']): { title: string; body: string; copy: string; copied: string } {
  const s = en.struggling;
  const h = en.settingsHome;
  if (kind === 'mail') return { title: h.noMailTitle, body: h.noMailBody, copy: h.copyAddress, copied: h.addressCopied };
  return { title: kind === 'text' ? s.noTextTitle : s.noCallTitle, body: s.noPhoneBody, copy: s.copyNumber, copied: s.numberCopied };
}
