/**
 * Help links (F20-REQ-005, F20-REQ-007; RT-SET-02, SR-C-09): the crisis lines on "If you are struggling" and the
 * Write to us rows in Settings open `tel:` or `mailto:`. Where the device reports it cannot, or the open is refused,
 * the caller gets back the number or address to show as selectable text with a Copy button, in the same tap, so a
 * tap never does nothing. Expected cases are an iPad (no calling), a phone with no SIM, and no Mail account; what iOS
 * actually reports in each is to be confirmed by the S1-23 V-10 device check.
 *
 * Pure: the linker is passed in (react-native `Linking` in the app, a fake in tests), so this runs in Node.
 * Words come from packages/content `helpLinks` (shared by every help row); `struggling.*` (FT-36) is read, never
 * changed. Nothing is counted, logged or sent (D-034).
 */
import { brand, supportMailto } from '@scribe/brand';
import { en } from '@scribe/content';

/** The two calls this needs from react-native `Linking`. */
export type Linker = {
  canOpenURL(url: string): Promise<boolean>;
  openURL(url: string): Promise<unknown>;
};

/** What a row opens, and what to show if it cannot: a phone number to call, or our email address. */
export type HelpTarget = { kind: 'call' | 'mail'; url: string; value: string };

export type HelpOpenResult = { kind: 'opened' } | { kind: 'fallback'; target: HelpTarget };

/** One crisis line as packages/content `struggling.resources` holds it. */
export type CrisisLine = { name: string; how: string; tel: string };

/**
 * The digits as people read them: an 11-digit US number starting with 1 reads 1-833-852-6262, anything shorter
 * (988) as it is. Formatting only; the words around it stay `struggling.*`.
 */
export function readableNumber(tel: string): string {
  const m = /^1(\d{3})(\d{3})(\d{4})$/.exec(tel);
  return m ? `1-${m[1]}-${m[2]}-${m[3]}` : tel;
}

export const callTarget = (line: CrisisLine): HelpTarget => ({ kind: 'call', url: `tel:${line.tel}`, value: readableNumber(line.tel) });

/** Write to us: the support mailbox with a fixed subject and nothing else (LEGAL-REQ-014). */
export const mailTarget = (subject?: string): HelpTarget => ({ kind: 'mail', url: supportMailto(subject), value: brand.support.email });

/**
 * Opens the target, or says what to show instead. Asks `canOpenURL` first (expected to answer false for `tel:` on an
 * iPad), and treats a rejected `openURL` or `canOpenURL` the same way. Never throws.
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

/** Whether this device reports it can call (`canOpenURL('tel:')`). null until it has answered. */
export type PhoneAbility = { call: boolean | null };

/** Asks once whether `tel:` can open. A rejected question counts as no. Never throws. */
export async function probePhone(linker: Pick<Linker, 'canOpenURL'>): Promise<PhoneAbility> {
  const call = await linker.canOpenURL('tel:988').then(Boolean, () => false);
  return { call };
}

/**
 * The VoiceOver hint for a crisis row. It promises a call only when the device said it can make one; otherwise (it
 * said no, or has not answered yet) it says what the tap does there: shows the number to call from a phone or copy.
 */
export function rowHint(can: PhoneAbility): string {
  return can.call === true ? en.helpLinks.callHint : en.helpLinks.callHintNoPhone;
}

/** The fallback sheet's words for a target: title, the line under it, the Copy button and what it says once copied. */
export function fallbackWords(kind: HelpTarget['kind']): { title: string; body: string; copy: string; copied: string } {
  const h = en.helpLinks;
  if (kind === 'mail') return { title: h.noMailTitle, body: h.noMailBody, copy: h.copyAddress, copied: h.addressCopied };
  return { title: h.noCallTitle, body: h.noPhoneBody, copy: h.copyNumber, copied: h.numberCopied };
}
