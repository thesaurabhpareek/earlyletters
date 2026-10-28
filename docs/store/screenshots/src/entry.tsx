import { createRoot } from 'react-dom/client';
import { motionValue } from 'motion/react';
import { useEffect, useMemo } from 'react';
import { PhoneFrame } from '@/components/app-ui/PhoneFrame';
import { TonightScreen } from '@/components/app-ui/screens/Tonight';
import { ListeningScreen } from '@/components/app-ui/screens/Listening';
import { ReviewScreen } from '@/components/app-ui/screens/Review';
import { BookScreen } from '@/components/app-ui/screens/Book';
import { LetterScreen } from '@/components/app-ui/screens/Letter';
import { WORD_COUNT } from '@/film/letter';
import captions from '../captions.json';

const FIX = 1;
const q = new URLSearchParams(location.search);
const W = Number(q.get('w'));
const H = Number(q.get('h'));
const shot = captions.find((c) => c.id === q.get('id'))!;

const BG: Record<string, string> = {
  dusk: 'radial-gradient(120% 70% at 50% 100%, color-mix(in srgb, var(--lamp) 22%, var(--dusk)) 0%, var(--dusk) 55%, var(--night) 100%)',
  night: 'radial-gradient(90% 60% at 50% 105%, color-mix(in srgb, var(--night-recording) 26%, var(--night)) 0%, var(--night) 62%)',
  paper: 'linear-gradient(180deg, var(--paper) 0%, var(--accent-soft) 100%)',
  paperwarm: 'linear-gradient(180deg, var(--accent-soft) 0%, var(--surface) 100%)',
  dawn: 'linear-gradient(180deg, var(--paper) 0%, color-mix(in srgb, var(--lamp) 38%, var(--paper)) 100%)',
};
const DARK = shot.bg === 'dusk' || shot.bg === 'night';

function Screen() {
  const words = useMemo(() => motionValue(0), []);
  const level = useMemo(() => motionValue(0.7), []);
  useEffect(() => {
    if (shot.screen !== 'listening') return;
    const t = setTimeout(() => words.set(WORD_COUNT * 0.62), 300);
    return () => clearTimeout(t);
  }, [words]);
  switch (shot.screen) {
    case 'tonight': return <TonightScreen />;
    case 'listening': return <ListeningScreen words={words} level={level} />;
    case 'review': return <ReviewScreen fix={motionValue(FIX)} />;
    case 'book': return <BookScreen arrive={motionValue(1)} />;
    default: return <LetterScreen />;
  }
}

function App() {
  const tall = H / W > 1.9;
  const capTop = Math.round(W * (tall ? 0.09 : 0.07));
  const headSize = Math.round(W * (tall ? 0.082 : 0.074));
  const subSize = Math.round(W * 0.035);
  const capH = Math.round(headSize * 2.16 + subSize * 2.7 + W * 0.03);
  const phoneTop = capTop + capH + Math.round(W * 0.03);
  const phoneW = Math.round(Math.min(W * 0.84, ((H - phoneTop) * 1.05) / 2.18));
  const ink = DARK ? 'var(--night-ink)' : 'var(--ink)';
  const muted = DARK ? 'var(--night-ink-muted)' : 'var(--ink-muted)';
  const lightScreen = shot.screen === 'review' || shot.screen === 'book' || shot.screen === 'letter';
  const letterVars = shot.screen === 'letter'
    ? ({ ['--letter-accent' as string]: 'var(--accent)', ['--letter-on-accent' as string]: 'var(--on-accent)', ['--letter-pill' as string]: 'color-mix(in srgb, var(--ink) 7%, var(--surface-raised))' })
    : {};
  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', background: BG[shot.bg], fontFamily: 'var(--font-sans)' }}>
      <div style={{ position: 'absolute', top: capTop, height: capH, display: 'flex', flexDirection: 'column', justifyContent: 'center', left: 0, right: 0, textAlign: 'center', padding: `0 ${Math.round(W * 0.08)}px`, color: ink }}>
        <h1 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: headSize, lineHeight: 1.08, letterSpacing: '-0.02em', textWrap: 'balance' }}>{shot.headline}</h1>
        <p style={{ margin: `${Math.round(W * 0.025)}px auto 0`, maxWidth: '88%', fontSize: subSize, lineHeight: 1.3, color: muted, textWrap: 'balance' }}>{shot.sub}</p>
      </div>
      <div style={{ position: 'absolute', top: phoneTop, left: '50%', transform: 'translateX(-50%)', ...letterVars }}>
        <PhoneFrame width={phoneW} scheme={lightScreen ? 'light' : 'dark'}>
          <Screen />
        </PhoneFrame>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
setTimeout(() => ((window as unknown as { __ready: boolean }).__ready = true), 1200);
