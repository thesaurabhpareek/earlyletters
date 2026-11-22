/**
 * Native sibling of `e2e-web-seam.web.ts`: empty on purpose, so Metro never bundles the web reader for iOS
 * or Android (council ruling E6, constraint 1). A test keeps it empty of the query keys.
 */
export function fontScaleOverride(): number | null {
  return null;
}

export function languageOverride(): string | null {
  return null;
}
