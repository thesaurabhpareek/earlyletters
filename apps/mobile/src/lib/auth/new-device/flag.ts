/**
 * The new-device sign-in email call (NDR-1, NS-08-R21). `EXPO_PUBLIC_NEW_DEVICE_EMAIL=on` in the build, off by default;
 * anything else, or nothing, is off. Not set in any eas.json profile and listed in scripts/release/store-flags.mjs, so a
 * store profile cannot turn it on before gate G6. The server is dark too (NEW_DEVICE_EMAIL on the function).
 */
export const parseNewDeviceEmailFlag = (raw: string | undefined | null): boolean => (raw ?? '').trim().toLowerCase() === 'on';

const BUILD_VALUE: boolean = parseNewDeviceEmailFlag(process.env.EXPO_PUBLIC_NEW_DEVICE_EMAIL);
let testOverride: boolean | null = null;

/** Tests only. */
export function setNewDeviceEmailForTest(value: boolean | null): void {
  testOverride = value;
}

export const newDeviceEmailEnabled = (): boolean => testOverride ?? BUILD_VALUE;
