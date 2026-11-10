/**
 * The phone's region setting, for "If you are struggling" (struggling-page.md section 2). On iOS, `AppleLocale`
 * from React Native's Settings (the region the person chose in iOS Settings, General, Language and Region); then
 * the `Intl` locale. No permission, no network, no new native module; read when the page opens, never stored or
 * sent. The parsing is struggling.logic.ts `phoneRegion`, tested in Node.
 */
import * as React from 'react';
import { Platform, Settings } from 'react-native';
import { phoneRegion } from './struggling.logic';

function candidates(): unknown[] {
  const out: unknown[] = [];
  if (Platform.OS === 'ios') {
    try {
      out.push(Settings.get('AppleLocale'));
    } catch {
      // Settings unavailable: the Intl locale below still answers.
    }
  }
  try {
    out.push(Intl.DateTimeFormat().resolvedOptions().locale);
  } catch {
    // No Intl: the page shows the directory and general emergency words.
  }
  return out;
}

export function usePhoneRegion(): string | null {
  return React.useMemo(() => phoneRegion(candidates()), []);
}
