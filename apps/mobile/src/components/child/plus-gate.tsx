// web: same (an in-screen sheet) | android: same, the system back returns to Review
/**
 * The Keep sheet (EXPERIENCE_PASS_2026-10 S22, 5.8 row 5c; D-082, D-083): a full-height sheet on paper that rises over
 * Review when keeping this letter needs Plus. It shows the held letter itself at the top, says plainly that it is safe
 * and where it waits, then hands over to Apple's own subscription store view (ADR 0013), which shows the plans,
 * prices, any free trial the person is eligible for, Restore and the legal links. This sheet never types a price, a
 * trial, a countdown or a count of what is left.
 *
 * Who decides is unchanged (#296): Review's one Keep step asks the gate and draws this sheet only on an offer. The sheet
 * only shows and hands back: "Keep it here for now" (`onHold`: Review marks the draft held and closes), Plus on
 * (`onPlus`: the same Review again, the person taps Keep themselves), or back to Review with nothing changed
 * (`onDismiss`: VoiceOver's escape, Android's back).
 *
 * Drawn inside Review's own screen, not as a second native presentation, so Apple's store view and the purchase
 * confirmation (/plus/confirmed) present over it exactly as they do over Review. No lamp and no lockup: the stacked
 * lockup belongs above Apple's view (registry `app.paywall`), and light is for the person's moments, not for selling.
 *
 * Motion: the sheet rises on `standard` (useSheetMotion) over a scrim that fades in; the held card enters with
 * `motion.enter`; the buttons are there from the first frame (MOTION principle 2). Reduce Motion: everything fades.
 * Accessibility: modal for VoiceOver (the Review behind cannot be reached), focus on the title, the held card read as
 * one element, 44 pt targets. At accessibility text sizes the footer holds only "See Plus" and "Keep it here for now",
 * on the first screen; every line of text is in the scroll, the held note right after the title; the held card and
 * "Redeem a code" follow (keepSheetLayout).
 */
import * as React from 'react';
import { AccessibilityInfo, BackHandler, Platform, ScrollView, StyleSheet, View, type Text as RNText } from 'react-native';
import Animated, { FadeIn, FadeOut, ReduceMotion, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@scribe/design-tokens';
import { ExcerptFade } from '@/components/motion/excerpt-fade';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { track } from '@/lib/analytics/track';
import { useAuth } from '@/lib/auth/session-provider';
import { billingCopy, presentPlusStore, redeemOfferCode, usePlan } from '@/lib/billing';
import { devShortcutsAllowed } from '@/lib/build-env';
import { copy, fill } from '@/lib/copy';
import { haptic } from '@/lib/haptics';
import { expoNetwork } from '@/lib/packs/expo-adapter';
import { useFocusOnMount, useIsAccessibilitySize, useTheme } from '@/lib/a11y';
import { STANDARD_EASING, useMotion, useSheetMotion } from '@/lib/motion';
import { heldCardLabel, heldCardTilt, heldWords, keepSheetLayout, keepSheetView, sheetTap, type HeldLetter, type HeldOn, type KeepSheetBlock, type KeepSheetLine, type SheetTapNote } from './plus-gate.logic';

export type { HeldLetter } from './plus-gate.logic';

interface Props {
  /**
   * `keep_letter` (D-082, D-083): shown at the Keep step when the free letters are used up. The only
   * variant today; starting a book and Read together are no longer gated.
   */
  variant?: 'keep_letter';
  /** The book's name, for the title only. Never sent anywhere. */
  childName: string;
  /** Plus was bought once and has ended: the sheet says so instead of selling. */
  lapsed?: boolean;
  /** Letters ever kept, a number for analytics. */
  lettersKept: number;
  /**
   * Where the held letter waits, so the sheet says what is true: 'tonight' for a draft (Tonight shows it), 'letter'
   * for a letter whose words arrived later (only its words wait, on the letter; task #53). Default 'tonight'.
   */
  heldOn?: HeldOn;
  /** The held letter, drawn at the top: its dateline, its own first words, the signature. Read from this phone only. */
  held?: HeldLetter;
  /**
   * Leave the letter held: it stays on the phone, untouched, waiting in Tonight. The caller marks the draft held and
   * leaves Review. Nothing is kept and nothing is lost.
   */
  onHold: () => void;
  /**
   * Plus is on now (bought in Apple's store view, restored, an Ask to Buy approval arrived, or an offer
   * code). The caller shows the letter again for the person to tap Keep themselves (D-083).
   */
  onPlus: () => void;
  /** Back to the letter with nothing changed (VoiceOver's escape gesture, Android's back). */
  onDismiss?: () => void;
  /**
   * Development profile only: lets the founder pass the gate without a StoreKit build (Expo Go).
   * Ignored unless `devShortcutsAllowed` (build profile AND __DEV__).
   */
  onContinueDev?: () => void;
}

const M = tokens.motion;

export function PlusGate({ childName, lapsed = false, lettersKept, heldOn = 'tonight', held, onHold, onPlus, onDismiss, onContinueDev }: Props) {
  const { c, scheme } = useTheme();
  const k = billingCopy.keepGate;
  const plan = usePlan();
  const auth = useAuth();
  const motion = useMotion();
  const sheet = useSheetMotion();
  const insets = useSafeAreaInsets();
  const ax = useIsAccessibilitySize();
  const layout = keepSheetLayout(ax);
  const title = React.useRef<RNText>(null);
  const [opening, setOpening] = React.useState(false);
  const [tapNote, setTapNote] = React.useState<SheetTapNote>(null);
  const continued = React.useRef(false);
  const awaitingCode = React.useRef(false);

  useFocusOnMount(title);

  // Signed in with sync on, a held draft also goes up as an author-only row (store.holdDraft). The line that says so is
  // held for counsel (C10, plus-gate.logic.ts SYNCED_HELD_NOTE_CLEARED): until then the sheet shows heldNote.
  const synced = auth.configured && auth.state.status === 'ready' && auth.state.sync === 'on';
  const offline = tapNote === 'offline';
  const codeFailed = tapNote === 'codeFailed';
  const view = keepSheetView({ lapsed, heldOn, synced, offline, codeFailed, storeSupport: plan.storeSupport });

  const carryOn = () => {
    if (continued.current) return;
    continued.current = true;
    haptic('success'); // an outcome: Plus is on
    track('plus_started_from_gate', { letters_kept: Math.min(1000, Math.max(0, lettersKept)) });
    if (awaitingCode.current) track('offer_code_redeemed', {});
    onPlus();
  };

  React.useEffect(() => {
    if (plan.plusOn) carryOn();
  }, [plan.plusOn]); // eslint-disable-line react-hooks/exhaustive-deps

  // A note that arrives after a tap (See Plus offline) is seen and heard: at accessibility sizes it is a line in the
  // scroll, so scroll to it once it is laid out, and tell VoiceOver (iOS does not read accessibilityLiveRegion). The
  // note is a copy string from packages/content. A note already there when the sheet opens is read in order instead.
  const scroll = React.useRef<ScrollView>(null);
  const wordsY = React.useRef(0);
  const noteY = React.useRef(0);
  const openingNote = React.useRef(view.note);
  React.useEffect(() => {
    const note = view.note;
    if (!note || note === openingNote.current) return;
    const id = setTimeout(() => {
      try {
        if (layout.words.includes('note')) scroll.current?.scrollTo({ y: Math.max(0, wordsY.current + noteY.current - tokens.space[4]), animated: false });
        AccessibilityInfo.announceForAccessibility(note);
      } catch {
        // the note is still on the sheet, in reading order
      }
    }, 100);
    return () => clearTimeout(id);
  }, [view.note]); // eslint-disable-line react-hooks/exhaustive-deps

  // Android's back returns to the letter, as VoiceOver's escape does; it never holds or keeps anything.
  React.useEffect(() => {
    if (Platform.OS !== 'android' || !onDismiss) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onDismiss();
      return true;
    });
    return () => sub.remove();
  }, [onDismiss]);

  // Opening Apple's sheet is navigation, not an outcome: no haptic (MOTION 6; P4 critics' pass L6).
  // Offline (the app's own network check, lib/packs expoNetwork), Apple's sheet is not opened: our offline line shows
  // instead of Apple's error (RT-PAY-09, RT-OFC-06). The rule lives in plus-gate.logic sheetTap, tested there.
  const offlineNow = async () => (await expoNetwork.connection()) === 'none';

  const open = async () => {
    setOpening(true);
    setTapNote(null);
    try {
      track('plus_offer_viewed', { trigger: 'keep_letter' });
      const tap = await sheetTap('seePlus', { offline: offlineNow, open: presentPlusStore });
      // Offline is reported as before, as `unavailable`: Apple's sheet could not be used.
      const outcome = tap.outcome === 'offline' ? 'unavailable' : tap.outcome;
      if (outcome !== 'busy') track('plus_offer_closed', { trigger: 'keep_letter', outcome });
      setTapNote(tap.note);
      if (outcome === 'purchased') carryOn();
    } finally {
      setOpening(false);
    }
  };

  const redeem = async () => {
    setTapNote(null);
    awaitingCode.current = true;
    // A failed code sheet says so calmly (RT-PLS-10); offline it is not opened at all.
    const { outcome, note } = await sheetTap('redeem', { offline: offlineNow, open: redeemOfferCode });
    if (outcome !== 'presented') awaitingCode.current = false;
    setTapNote(note);
  };

  const enterSheet =
    sheet.kind === 'fade'
      ? FadeIn.duration(M.fadeMs).reduceMotion(ReduceMotion.Never)
      : SlideInDown.springify().stiffness(sheet.stiffness).damping(sheet.damping).mass(sheet.mass).reduceMotion(ReduceMotion.Never);
  const leaveSheet =
    sheet.kind === 'fade' ? FadeOut.duration(M.fadeMs).reduceMotion(ReduceMotion.Never) : SlideOutDown.duration(M.exitMs).easing(STANDARD_EASING).reduceMotion(ReduceMotion.Never);

  const line: Record<KeepSheetLine, React.ReactNode> = {
    title: (
      <Text key="title" ref={title} variant="title1" asHeading>
        {fill(k.title, { child: childName })}
      </Text>
    ),
    body: (
      <Text key="body" variant="body">{view.body}</Text>
    ),
    // Where the letter waits: trust copy, so never below subhead (P1's floor, lib/review-layout.logic.ts).
    heldNote: (
      <Text key="heldNote" variant="subhead" tone="muted" testID="plusGate.heldNote">
        {view.heldNote}
      </Text>
    ),
    note: view.note ? (
      <Text key="note" variant="footnote" accessibilityLiveRegion="polite" className="px-2 pb-1 text-center" onLayout={(e) => (noteY.current = e.nativeEvent.layout.y)} testID="plusGate.note">
        {view.note}
      </Text>
    ) : null,
  };
  // One primary. Without Apple's store on this device, "Keep it here for now" is the only way on, so it is the primary.
  const part: Record<KeepSheetBlock, React.ReactNode> = {
    card: held ? <HeldCard key="card" held={held} entering={motion.enter(0)} tilt={heldCardTilt(ax)} surface={c.surfaceRaised} /> : null,
    words: (
      <View key="words" onLayout={(e) => (wordsY.current = e.nativeEvent.layout.y)} style={{ gap: tokens.space[3] }}>
        {layout.words.map((w) => line[w])}
      </View>
    ),
    seePlus: view.canOpenStore ? (
      <Button key="seePlus" size="lg" fullWidth label={k.seePlus} onPress={() => void open()} disabled={opening} accessibilityHint={opening ? billingCopy.gate.opening : undefined} testID="plusGate.seePlus" />
    ) : null,
    // At the default size the note sits under See Plus in the footer; at accessibility sizes it is a line of the words.
    note: layout.pinned.includes('note') ? line.note : null,
    hold: <Button key="hold" size={view.canOpenStore ? 'md' : 'lg'} variant={view.canOpenStore ? 'quiet' : 'primary'} fullWidth label={k.holdButton} onPress={onHold} testID="plusGate.hold" />,
    redeem: (
      <React.Fragment key="redeem">
        {view.canOpenStore ? <Button variant="quiet" size="sm" label={k.redeemLink} onPress={() => void redeem()} disabled={opening} className="self-center" testID="plusGate.redeem" /> : null}
        {devShortcutsAllowed && onContinueDev ? <Button variant="outline" fullWidth label={copy.common.continueButton} onPress={onContinueDev} /> : null}
      </React.Fragment>
    ),
  };

  return (
    // Modal for VoiceOver: everything of Review's behind this layer is out of reach while it is up.
    <View style={StyleSheet.absoluteFill} accessibilityViewIsModal aria-modal onAccessibilityEscape={onDismiss} testID="plusGate">
      <Animated.View
        entering={FadeIn.duration(M.fadeMs).reduceMotion(ReduceMotion.Never)}
        exiting={FadeOut.duration(M.exitMs).reduceMotion(ReduceMotion.Never)}
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        style={[StyleSheet.absoluteFill, { backgroundColor: c.scrim }]}
      />
      <Animated.View
        entering={enterSheet}
        exiting={leaveSheet}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          top: insets.top + tokens.space[3],
          backgroundColor: c.bg,
          borderTopLeftRadius: tokens.radius.xl,
          borderTopRightRadius: tokens.radius.xl,
          overflow: 'hidden',
          ...(scheme === 'dark' ? { borderWidth: StyleSheet.hairlineWidth, borderColor: c.line } : null),
        }}>
        <ScrollView ref={scroll} contentContainerStyle={{ flexGrow: 1, paddingHorizontal: tokens.space[5], paddingTop: tokens.space[6], paddingBottom: tokens.space[5], gap: tokens.space[4] }}>
          {layout.scroll.map((b) => part[b])}
        </ScrollView>
        {/* The way on, always on screen: at every text size "Keep it here for now" is in this footer (keepSheetLayout). */}
        <View className="gap-1" testID="plusGate.actions" style={{ paddingHorizontal: tokens.space[5], paddingTop: tokens.space[2], paddingBottom: Math.max(insets.bottom, tokens.space[3]) }}>
          {layout.pinned.map((b) => part[b])}
        </View>
      </Animated.View>
    </View>
  );
}

/**
 * The held letter as a small paper card (S22 Visual): surfaceRaised, radius md, elevation 1 (a 1 pt line edge in
 * dark), tilted -2 degrees; its dateline, its first two lines in letterBody that end in a fade, "From Mama" and the
 * "Waiting" chip. One element for VoiceOver, every word in it. It never moves after it arrives.
 */
function HeldCard({ held, entering, tilt, surface }: { held: HeldLetter; entering: ReturnType<ReturnType<typeof useMotion>['enter']>; tilt: string; surface: string }) {
  const { c, scheme } = useTheme();
  const e = tokens.elevation[1];
  const edge =
    scheme === 'dark'
      ? { borderWidth: StyleSheet.hairlineWidth, borderColor: c.line }
      : Platform.OS === 'web'
        ? { boxShadow: e.web }
        : { shadowColor: e.shadowColor, shadowOpacity: e.shadowOpacity, shadowRadius: e.shadowRadius, shadowOffset: e.shadowOffset, elevation: e.elevation };
  return (
    <Animated.View
      entering={entering}
      accessible
      accessibilityLabel={heldCardLabel(held)}
      testID="plusGate.held"
      style={{ alignSelf: 'center', width: '100%', maxWidth: 360, transform: [{ rotate: tilt }], backgroundColor: surface, borderRadius: tokens.radius.md, padding: tokens.space[4], gap: tokens.space[2], ...edge }}>
      <Text variant="letterDateline" caps>
        {held.to}
      </Text>
      <ExcerptFade text={heldWords(held.words)} lines={2} variant="letterBody" surface={surface} />
      <View className="flex-row flex-wrap items-center justify-between gap-2">
        <Text variant="letterDateline" caps>
          {held.from}
        </Text>
        <View className="rounded-full bg-secondary px-3 py-1">
          <Text variant="labelSmall">{billingCopy.keepGate.heldChip}</Text>
        </View>
      </View>
    </Animated.View>
  );
}
