// web: same | android: same
/**
 * UIProvider: everything the design system needs above the app, in one place.
 *   - GestureHandlerRootView (react-native-gesture-handler 2: required at the root for
 *     any gesture, including Sheet pan-to-close and Toast swipe)
 *   - BottomSheetModalProvider (@gorhom/bottom-sheet: Sheet presents into it)
 *   - Increase Contrast: overrides the CSS colour variables for the whole subtree
 *     (Uniwind ScopedVariables), so every class-based colour follows the setting
 *   - ToastHost (useToast)
 *   - starts loading the bundled fonts
 *
 * Wire once at the root, around the Stack in src/app/_layout.tsx:
 *   <UIProvider><Stack .../></UIProvider>
 * It is idempotent: a nested UIProvider renders only its children, so screens that
 * wrap themselves today keep working after the root wiring lands.
 */
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ScopedVariables } from 'uniwind';
import { tokens } from '@scribe/design-tokens';
import { ToastHost } from '@/components/ui/toast';
import { useTheme } from '@/lib/a11y';
import { loadFonts } from './fonts';

const Mounted = React.createContext(false);
const NONE: Record<string, string> = {};

/** CSS variables that change under Increase Contrast (mirrors build-css.ts SHADCN/EXTRA names). */
function contrastVariables(scheme: 'light' | 'dark'): Record<string, string> {
  const hc = tokens.highContrast[scheme];
  return {
    '--color-muted-foreground': hc.textMuted,
    '--color-primary': hc.accent,
    '--color-border': hc.line,
    '--color-input': hc.controlBorder,
    '--color-control-border': hc.controlBorder,
    '--color-edit-mark': hc.editMark,
  };
}

export function UIProvider({ children, toastBottomOffset = 0 }: { children: React.ReactNode; toastBottomOffset?: number }) {
  const outer = React.useContext(Mounted);
  if (outer) return <>{children}</>;
  return <Root toastBottomOffset={toastBottomOffset}>{children}</Root>;
}

function Root({ children, toastBottomOffset }: { children: React.ReactNode; toastBottomOffset: number }) {
  const { scheme, highContrast } = useTheme();
  React.useEffect(() => {
    void loadFonts();
  }, []);
  // Always mounted (empty when off), so toggling the setting never remounts the app.
  const vars = React.useMemo(() => (highContrast ? contrastVariables(scheme) : NONE), [highContrast, scheme]);
  return (
    <Mounted.Provider value>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ScopedVariables variables={vars}>
          <BottomSheetModalProvider>
            <ToastHost bottomOffset={toastBottomOffset}>{children}</ToastHost>
          </BottomSheetModalProvider>
        </ScopedVariables>
      </GestureHandlerRootView>
    </Mounted.Provider>
  );
}

/** The call the coordinator can make at startup instead of (or as well as) mounting UIProvider. */
export function startDesignSystem(): Promise<void> {
  return loadFonts();
}
