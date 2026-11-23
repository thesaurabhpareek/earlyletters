/**
 * The Book backup line switch (NS-10-R13, BL-1865). `EXPO_PUBLIC_BACKUP_LINE=on` in the build, off by default; anything
 * else, or nothing, is off. Not set in any eas.json profile and listed in scripts/release/store-flags.mjs, so a store
 * profile cannot turn it on before gate G6. The two strings behind it are PROPOSED and not cleared by counsel
 * (docs/content/words-packet-20nov.md, row for the recording sentence), so with the switch off nothing is drawn and
 * nothing is stored.
 */
export const parseBackupLineFlag = (raw: string | undefined | null): boolean => (raw ?? '').trim().toLowerCase() === 'on';

const BUILD_VALUE: boolean = parseBackupLineFlag(process.env.EXPO_PUBLIC_BACKUP_LINE);
let testOverride: boolean | null = null;

/** Tests only. */
export function setBackupLineForTest(value: boolean | null): void {
  testOverride = value;
}

export const backupLineEnabled = (): boolean => testOverride ?? BUILD_VALUE;
