# Proposed token change (not applied)

`packages/brand/index.ts` is NOT edited. This is the proposed diff for whoever owns that file.
All ratios are WCAG 2.x, computed by `source/colors.mjs` (output in `colors.json`).

## Diff

```diff
   colors: {
     // Warm, literary palette; independent of Lumira's sage/terra on purpose.
     // All text pairs pass WCAG AA (4.5:1), computed Sept 30 2026:
     // ink/paper 14.0, inkMuted/paper 5.5, accent/paper 5.5, accent/accentSoft 4.7,
     // white on accent 5.8; dark: ink 15.7, inkMuted 8.0, accent 8.4.
+    // accentDeep (Oct 3 2026, logo r3 color-type): paper/accentDeep 6.47, white/accentDeep 6.85,
+    // accentDeep/accentSoft 5.58, accentDeep/paperRaised 6.85.
     ink: '#2B2722',
     inkMuted: '#6B645B',
     paper: '#FBF8F3',
     paperRaised: '#FFFFFF',
     accent: '#8A5A3B',
+    /** One step deeper than accent. App icon tile base, single-colour icon fallback, pressed state. */
+    accentDeep: '#7F4F30',
     accentSoft: '#F1E6DC',
     line: '#E6DED3',
     ...
   },
+  /**
+   * App icon only (Icon Composer background fill), not UI colours. Default: vertical gradient,
+   * paper mark. Dark: warm near-black, accentDark mark. Tinted and clear: mark shape only.
+   * Mark/tile contrast: 4.78 top, 5.53 middle, 6.47 bottom (paper mark). Dark: 6.58 top, 7.79 bottom.
+   */
+  icon: {
+    tileTop: '#9A613C',
+    tileBottom: '#7F4F30', // = colors.accentDeep
+    mark: '#FBF8F3',       // = colors.paper, never pure white
+    darkTileTop: '#2C2926',
+    darkTileBottom: '#1F1B18',
+    darkMark: '#D9A47E',   // = colors.accentDark
+  },
 } as const;
```

## What does NOT change
- `accent` #8A5A3B stays the UI accent. Every existing ratio stays as it is. `accentDeep` is added, nothing is replaced.
- `accentDark` #D9A47E stays. The dark icon was the best-looking state in the r2 review, and it still is.

## Contrast table

| Pair | Ratio | Use |
|---|---|---|
| paper #FBF8F3 on tile top #9A613C | 4.78:1 | weakest point of the default icon; the mark sits mostly below it |
| paper on tile middle (#8D5836) | 5.53:1 | about the same as today's flat tile (5.50) |
| paper on tile bottom = accentDeep #7F4F30 | 6.47:1 | |
| accentDeep on paper (as text) | 6.47:1 | AA body text |
| white on accentDeep | 6.85:1 | button label |
| accentDeep on accentSoft | 5.58:1 | AA |
| accentDark #D9A47E on dark tile #1F1B18 / #2C2926 | 7.79 / 6.58:1 | dark icon |
| tinted-light (simulated, amber tint) | 3.73 to 4.15:1 | passes 3:1 for graphics (1.4.11); the system sets it, we only control the shape |
| tinted-dark (simulated) | 5.3 to 6.8:1 | |
| Never: accentDark on paper | 2.07:1 | fails |
| Never: accent on ink | 2.55:1 | fails |

The icon is a graphic, so WCAG 1.4.11 (3:1) is the bar. Every recommended state is above 4.5:1 except simulated tinted-light, which the system controls.
