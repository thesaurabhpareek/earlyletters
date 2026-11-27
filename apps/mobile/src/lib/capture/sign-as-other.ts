/**
 * Someone else speaks (NS-16, BL-980): the build flag, this phone's names-used-before list and the Review hook. The
 * rules are in sign-as-other.logic.ts. Nothing here touches the network or Contacts (NS-16-R4): the list is this
 * phone's own typed names, in `settings`. Nothing here logs or tracks a name (PRIV-R10).
 */
import { useState } from 'react';
import { deleteSetting, getEntry, getSetting, setSetting } from '@/lib/store';
import {
  parseDraftName,
  parseRecent,
  parseSignAsOtherFlag,
  rememberName,
  serializeDraftName,
  signatureForKeep,
  SIGN_AS_DRAFT_SETTING,
  SIGN_AS_RECENT_SETTING,
  type KeepSignature,
} from './sign-as-other.logic';

// Literal `process.env.EXPO_PUBLIC_SIGN_AS_OTHER` so Metro inlines it at bundle time. No eas.json profile sets it.
const BUILD_VALUE: boolean = parseSignAsOtherFlag(process.env.EXPO_PUBLIC_SIGN_AS_OTHER);
let testOverride: boolean | null = null;

/** Tests only. */
export function setSignAsOtherForTest(value: boolean | null): void {
  testOverride = value;
}

export const signAsOtherEnabled = (): boolean => testOverride ?? BUILD_VALUE;

/** Names used before on this phone, most recent first. Never throws: a store that cannot be read has none. */
export function recentFromNames(): string[] {
  try {
    return parseRecent(getSetting(SIGN_AS_RECENT_SETTING));
  } catch {
    return [];
  }
}

/**
 * Sign-out forgets the list and any typed name (NS-16-R15; "a second account on the same phone never sees A's names
 * list"). Erase everything removes every setting, so it needs no call. Never throws.
 */
export function forgetFromNames(): void {
  for (const key of [SIGN_AS_RECENT_SETTING, SIGN_AS_DRAFT_SETTING]) {
    try {
      if (getSetting(key) !== null) deleteSetting(key);
    } catch {
      // Nothing to clear.
    }
  }
}

export type FromName = {
  /** The From control is drawn: the flag is on and this is a draft not yet kept. */
  offered: boolean;
  typed: string;
  recent: readonly string[];
  /** How many times Keep was refused for a name over 30 characters (NS-16-R6); each one opens the sheet again. */
  refusals: number;
  setTyped: (value: string) => void;
  /** The name Review shows in "From {signsAs}". */
  shown: (parentSignsAs: string) => string;
  /** The signature Keep writes, or the refusal; checked before anything is written or uploaded. */
  signatureFor: (parentSignsAs: string) => KeepSignature;
  /** After a Keep that wrote the row: the typed name joins this phone's list, and the draft's copy goes. */
  kept: (signature: KeepSignature) => void;
};

/**
 * Review's From name. `draftId` is the draft before Keep; `keptEntryId` a letter already kept (words that arrived
 * later), whose stored signature is shown and never changed (NS-16-R17).
 */
export function useFromName(input: { draftId: string | null; keptEntryId: string | null }): FromName {
  const { draftId, keptEntryId } = input;
  const offered = signAsOtherEnabled() && draftId !== null && keptEntryId === null;
  const [kept] = useState<string | null>(() => (keptEntryId ? (getEntry(keptEntryId)?.authorSignsAs ?? null) : null));
  const [typed, setTypedState] = useState<string>(() => (offered && draftId ? parseDraftName(getSetting(SIGN_AS_DRAFT_SETTING), draftId) : ''));
  const [recent, setRecent] = useState<string[]>(() => (offered ? recentFromNames() : []));
  const [refusals, setRefusals] = useState(0);
  return {
    offered,
    typed,
    recent,
    refusals,
    setTyped: (value) => {
      setTypedState(value);
      if (offered && draftId) setSetting(SIGN_AS_DRAFT_SETTING, serializeDraftName(draftId, value));
    },
    shown: (parent) => {
      if (kept) return kept;
      const s = signatureForKeep({ typed, parentSignsAs: parent, offered });
      return s.ok ? s.authorSignsAs : parent;
    },
    signatureFor: (parent) => {
      const s = signatureForKeep({ typed, parentSignsAs: parent, offered });
      if (!s.ok) setRefusals((n) => n + 1);
      return s;
    },
    kept: (s) => {
      if (!offered || !s.ok) return;
      try {
        if (s.other) {
          const next = rememberName(recentFromNames(), s.other);
          setSetting(SIGN_AS_RECENT_SETTING, JSON.stringify(next));
          setRecent(next);
        }
        deleteSetting(SIGN_AS_DRAFT_SETTING);
      } catch {
        // The letter is kept; a list that cannot be written only means the name is not offered next time.
      }
    },
  };
}
