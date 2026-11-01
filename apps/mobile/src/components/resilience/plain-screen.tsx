/**
 * The calm full-screen state used when the normal app cannot be shown: the root error boundary (S50) and
 * the launch recovery screen (S51). The same block as every other state (StateScreen, S49): the page
 * drawing, the title, one sentence, the primary full width at the bottom and a quiet option beneath it.
 *
 * Deliberately plain React Native (View, Text, Pressable), react-native-svg and design tokens only: no
 * providers, no theme context, no stores to subscribe to, no router, no motion and nothing to wait for, so
 * it still draws when everything above it is what failed. The brand faces are embedded at build time
 * (expo-font config plugin), so the title is Literata and the body Mukta from the first frame
 * (plain-screen.styles.ts); `loadFonts` then resolves at once. In the web preview, where the faces arrive
 * as @font-face rules, it registers them, because launch recovery draws before UIProvider would. It never
 * throws and nothing waits for it. Reads the saved appearance when it can and falls back to the system scheme.
 * It never shows an error message, code or stack. Dynamic Type works (no fixed heights on text).
 */
import { Component, useEffect, useRef, type ReactNode } from 'react';
import { AccessibilityInfo, Pressable, ScrollView, Text, View, useColorScheme } from 'react-native';
import { initialWindowMetrics } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { tokens } from '@scribe/design-tokens';
import { loadFonts } from '@/components/ui/fonts';
import { getSetting } from '@/lib/store';
import { PLAIN_LAYOUT, PLAIN_TYPE, plainArt, plainButton } from './plain-screen.styles';

export type PlainAction = { label: string; onPress: () => void; kind?: 'primary' | 'quiet'; busy?: boolean };

export function useSchemeSafely(): 'light' | 'dark' {
  const system = useColorScheme() === 'dark' ? 'dark' : 'light';
  try {
    const v = getSetting('appearance'); // the store may be the very thing that failed
    if (v === 'light' || v === 'dark') return v;
  } catch {
    // fall back to the system scheme
  }
  return system;
}

const ART = plainArt();

/**
 * The last resort on the one screen that must always draw: if the drawing itself throws (react-native-svg missing or
 * failing), the screen goes on without it. The words and the buttons never depend on it.
 */
class DrawingBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** The page drawing, complete and still, in the scheme's own colours. Decorative. */
function PageDrawing({ wash, line }: { wash: string; line: string }) {
  return (
    <View accessible={false} importantForAccessibility="no-hide-descendants" aria-hidden>
      <Svg width={ART.width} height={ART.height} viewBox={ART.viewBox}>
        <Circle cx={ART.wash.cx} cy={ART.wash.cy} r={ART.wash.r} fill={wash} />
        {ART.paths.map((d) => (
          <Path key={d} d={d} fill="none" stroke={line} strokeWidth={ART.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        ))}
      </Svg>
    </View>
  );
}

/**
 * `noteKey` tells a new note from the last one when the words are the same (a second failed Try again says what the first
 * did): a different key is a new line, announced again. Never shown.
 */
export function PlainScreen({ title, body, hint, note, noteKey, actions }: { title: string; body: string; hint?: string; note?: string; noteKey?: number; actions: PlainAction[] }) {
  const scheme = useSchemeSafely();
  const c = tokens[scheme];
  // The safe area as the app launched (a constant: no provider to read it from).
  const insets = initialWindowMetrics?.insets;
  const heading = useRef<Text>(null);
  const scroll = useRef<ScrollView>(null);

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(c.bg).catch(() => {});
  }, [c.bg]);

  useEffect(() => {
    // Whatever brought this screen up, the splash must not stay over it: the launch recovery screen renders
    // before the app's own hideAsync runs, and the router only hides the splash for a render error.
    try {
      void SplashScreen.hideAsync().catch(() => {});
      void loadFonts();
    } catch {
      // a native module that throws at once must not stop the focus below
    }
    // VoiceOver starts on the title, not on whatever the failed screen had focused.
    const id = setTimeout(() => {
      try {
        if (heading.current) AccessibilityInfo.sendAccessibilityEvent(heading.current as never, 'focus');
      } catch {
        // focus is a courtesy; the screen reads in order without it
      }
    }, 350);
    return () => clearTimeout(id);
  }, []);

  // A note (the export's result) is the last thing in the scroll while the buttons stay put, so at large text sizes it
  // can sit below the fold: once it has been laid out, scroll to it, and have VoiceOver read it (iOS ignores
  // accessibilityLiveRegion). The note is a copy string from packages/content, never anything the person wrote.
  useEffect(() => {
    if (!note) return;
    const id = setTimeout(() => {
      try {
        scroll.current?.scrollToEnd({ animated: false });
        AccessibilityInfo.announceForAccessibility(note);
      } catch {
        // the note is still on the page, in reading order
      }
    }, 100);
    return () => clearTimeout(id);
  }, [note, noteKey]);

  const L = PLAIN_LAYOUT;
  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets?.top ?? 0, paddingBottom: Math.max(insets?.bottom ?? 0, tokens.space[3]) }}>
      <ScrollView
        ref={scroll}
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: L.gutter, paddingVertical: L.edge }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignItems: 'center', gap: L.gap }}>
          <DrawingBoundary>
            <PageDrawing wash={c.accentSoft} line={c.textMuted} />
          </DrawingBoundary>
          <View accessible={false} style={{ alignItems: 'center', gap: L.textGap }}>
            <Text ref={heading} accessibilityRole="header" maxFontSizeMultiplier={PLAIN_TYPE.title.maxScale} style={{ ...PLAIN_TYPE.title.style, color: c.text, textAlign: 'center' }}>
              {title}
            </Text>
            <Text maxFontSizeMultiplier={PLAIN_TYPE.body.maxScale} style={{ ...PLAIN_TYPE.body.style, color: c.textMuted, textAlign: 'center' }}>
              {body}
            </Text>
            {hint ? (
              <Text maxFontSizeMultiplier={PLAIN_TYPE.hint.maxScale} style={{ ...PLAIN_TYPE.hint.style, color: c.textMuted, textAlign: 'center' }}>
                {hint}
              </Text>
            ) : null}
            {note ? (
              <Text key={noteKey} accessibilityLiveRegion="polite" maxFontSizeMultiplier={PLAIN_TYPE.hint.maxScale} style={{ ...PLAIN_TYPE.hint.style, color: c.text, textAlign: 'center' }}>
                {note}
              </Text>
            ) : null}
          </View>
        </View>
      </ScrollView>
      <View style={{ paddingHorizontal: L.gutter, paddingTop: tokens.space[2], gap: tokens.space[1] }}>
        {actions.map((a, i) => {
          const s = plainButton(a.kind ?? 'primary', c, !!a.busy);
          return (
            <Pressable
              // By place, not by label: the export button's words change while it works, and a new key would
              // remount it and drop VoiceOver focus.
              key={i}
              accessibilityRole="button"
              accessibilityLabel={a.label}
              accessibilityState={{ busy: !!a.busy, disabled: !!a.busy }}
              disabled={a.busy}
              onPress={a.onPress}
              style={({ pressed }) => ({ ...s.container, opacity: pressed ? 0.85 : 1 })}
            >
              <Text maxFontSizeMultiplier={PLAIN_TYPE.button.maxScale} style={s.label}>
                {a.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
