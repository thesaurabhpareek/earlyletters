/**
 * Test-only ambient declarations for the component harness (BL-278). Neither package ships types and no @types
 * package is installed (adding one would change the lockfile), so the two modules the harness uses are declared
 * here, as narrowly as the harness needs. Picked up by tsconfig's `**\/*.ts`; never imported by app code.
 */
declare module 'react-native-web' {
  import type { ComponentType } from 'react';
  export const View: ComponentType<Record<string, unknown>>;
  export const Text: ComponentType<Record<string, unknown>>;
  export const Pressable: ComponentType<Record<string, unknown>>;
}

declare module 'react-dom/server' {
  import type { ReactElement } from 'react';
  export function renderToStaticMarkup(element: ReactElement): string;
}
