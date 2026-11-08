'use client';
/**
 * The pinned-scene frame for every section after the hero, so the whole page is told the same way as the first
 * scenes (Evening, ProofScene): the section holds the screen while your scroll plays it, blocks fade up in turn,
 * and it hands off to the next with a fade. It is built on usePin, FillText and the same easing and thresholds
 * in scrub.tsx; there is no second mechanism.
 *
 * Fit rule (from usePin): a scene is pinned only when its content fits the screen. When it does not (a phone, a
 * short laptop), nothing is pinned and each block rises into place as it scrolls in (Rise), exactly as before.
 * Server, no JavaScript and reduced motion render the finished section: the markup and spacing never change.
 */
import { createContext, useContext, useState, type CSSProperties, type ReactNode } from 'react';
import { motion, type MotionValue } from 'motion/react';
import { FillText, Rise, usePin } from './scrub';
import styles from './Landing.module.css';

type SceneState = { progress: MotionValue<number>; enabled: boolean; pinned: boolean };
/** The lift of a block in a pinned scene, the same as the headline in ProofScene. */
const PINNED_LIFT = 18;
const SceneContext = createContext<SceneState | null>(null);

function useSceneState(): SceneState {
  const state = useContext(SceneContext);
  if (!state) throw new Error('Beat and SceneText must be used inside <PinScene>');
  return state;
}

export function PinScene({
  vh,
  id,
  labelledBy,
  className,
  innerClassName,
  wrapClassName,
  exit = true,
  showOnFocus = false,
  children,
}: {
  /** Screens of scroll the scene holds for while pinned. */
  vh: number;
  id?: string;
  labelledBy: string;
  /** Extra class for the stage's inner box (the section's own look, e.g. the centred closing). */
  className?: string;
  innerClassName?: string;
  /** Class for the box that hands off (use it for a grid, so its children stay grid items). */
  wrapClassName?: string;
  /** False for the last scene on the page: it fades in and stays. */
  exit?: boolean;
  /** Shows everything once something inside is focused from the keyboard, so a field reached by Tab is never dim. (A mouse press must not move what it is pressing, so it does not count.) */
  showOnFocus?: boolean;
  children: ReactNode;
}) {
  const { outer, content, enabled, pinned, progress, handoff } = usePin(vh, exit);
  const [focused, setFocused] = useState(false);
  const live = enabled && !focused;
  // A link to the section lands once its first lines have arrived, not on the empty first frame of the hand-off.
  const style: CSSProperties | undefined = pinned ? { height: `${vh * 100}svh`, scrollMarginTop: `${-0.12 * vh * 100}svh` } : undefined;
  return (
    <section
      ref={outer}
      id={id}
      className={`${styles.scene} ${styles.anchor} ${pinned ? styles.pinOn : ''} ${className ?? ''}`}
      style={style}
      aria-labelledby={labelledBy}
      onFocusCapture={showOnFocus ? (e) => e.target.matches(':focus-visible') && setFocused(true) : undefined}
    >
      <SceneContext.Provider value={{ progress, enabled: live, pinned }}>
        <div className={styles.stage}>
          <div ref={content} className={`${styles.stageInner} ${innerClassName ?? ''}`}>
            <motion.div style={pinned && live ? handoff : undefined} className={wrapClassName}>
              {children}
            </motion.div>
          </div>
        </div>
      </SceneContext.Provider>
    </section>
  );
}

/**
 * One block of a scene. Pinned: it lifts and fades in between `from` and `to` of the scene's progress. Not pinned:
 * it rises as it scrolls in. Not animated: the finished block. It is always a Rise, so it is never remounted
 * (a sign-up field inside it keeps what was typed).
 */
export function Beat({ from, to, className, children }: { from: number; to: number; className?: string; children: ReactNode }) {
  const { progress, enabled, pinned } = useSceneState();
  return (
    <Rise className={className} y={pinned ? PINNED_LIFT : undefined} scene={{ progress, from, to, active: pinned }} still={!enabled}>
      {children}
    </Rise>
  );
}

/** A paragraph read by scrolling: words fill from dim to bright between `from` and `to` of the scene (pinned), or as it crosses the screen. */
export function SceneText({ text, className, from, to }: { text: string; className?: string; from: number; to: number }) {
  const { progress, pinned } = useSceneState();
  return <FillText text={text} className={className} scene={{ progress, from, to, active: pinned }} />;
}
