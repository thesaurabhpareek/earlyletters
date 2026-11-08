/**
 * Owner: AT. The atmosphere gallery: each layer on night, paper and dusk, plus three composed frames
 * (S01 night, S04 paper, S07 dusk) that show how the layers stack in a scene. Dev only.
 * Phone: the three tones stack as rows. Desktop: columns.
 */
import type { ReactNode } from 'react';
import { Grain, LampLight, Motes, NightSky, PaperTexture, Vignette, type AtmosphereTone, type Warmth } from '@/components/atmosphere';
import { sampleLetter, site } from '@/content/site';
import s from './gallery.module.css';

export const PLATES = ['lamp', 'recording', 'dusk', 'grain', 'paper', 'vignette', 'motes', 'sky', 's01', 's04', 's07'] as const;
export type PlateId = (typeof PLATES)[number];

const TONES: AtmosphereTone[] = ['night', 'paper', 'dusk'];

function Panel({ tone, label, children }: { tone: AtmosphereTone; label: string; children?: ReactNode }) {
  return (
    <div className={s.panel} data-tone={tone}>
      {children}
      <p className={s.label}>{label}</p>
    </div>
  );
}

/** Left half bare, right half with the layer: the honest way to judge something meant to be nearly invisible. */
function Split({ children, tone }: { children: ReactNode; tone: AtmosphereTone }) {
  void tone;
  return (
    <>
      <div className={s.split}>{children}</div>
      <span className={s.splitLine} aria-hidden />
      <p className={s.splitTag} style={{ left: 14 }}>without</p>
      <p className={s.splitTag} style={{ right: 14 }}>with</p>
    </>
  );
}

function PoolPlate({ warmth }: { warmth: Warmth }) {
  return (
    <>
      {TONES.map((tone) => (
        <Panel key={tone} tone={tone} label={`${warmth} light on ${tone}`}>
          <LampLight warmth={warmth} surface={tone} x="50%" y="58%" size="92cqmax" />
          {tone !== 'paper' ? <Motes ignoreDeviceLimits warmth={warmth} x={0.5} y={0.58} radius={0.46} count={18} /> : null}
          <Grain tone={tone} />
        </Panel>
      ))}
    </>
  );
}

function Gallery_({ plate }: { plate: PlateId }) {
  switch (plate) {
    case 'lamp':
    case 'recording':
    case 'dusk':
      return <PoolPlate warmth={plate} />;
    case 'grain':
      return (
        <>
          {TONES.map((tone) => (
            <Panel key={tone} tone={tone} label={`grain on ${tone}${tone === 'night' ? ', dark ramp' : ''}`}>
              {tone === 'night' ? <div className={s.ramp} /> : null}
              {tone !== 'night' ? <LampLight warmth={tone === 'dusk' ? 'dusk' : 'lamp'} surface={tone} y="60%" size="110cqmax" /> : null}
              <Split tone={tone}>
                <Grain tone={tone} />
              </Split>
            </Panel>
          ))}
        </>
      );
    case 'paper':
      return (
        <>
          <Panel tone="night" label="paper card in lamp light, night">
            <LampLight warmth="lamp" y="62%" size="100cqmax" />
            <div className={s.card}>
              <PaperTexture />
              <p className={s.cardText}>{sampleLetter.text}</p>
            </div>
            <Grain />
          </Panel>
          <Panel tone="paper" label="paper texture, left bare">
            <Split tone="paper">
              <PaperTexture />
            </Split>
            <div className={s.copy}>
              <p className={s.letter}>{sampleLetter.text}</p>
            </div>
          </Panel>
          <Panel tone="dusk" label="paper card, dusk">
            <LampLight warmth="dusk" y="58%" size="100cqmax" />
            <div className={s.card}>
              <PaperTexture />
              <p className={s.cardText}>{sampleLetter.text}</p>
            </div>
            <Grain tone="dusk" />
          </Panel>
        </>
      );
    case 'vignette':
      return (
        <>
          {TONES.map((tone) => (
            <Panel key={tone} tone={tone} label={`vignette on ${tone}`}>
              <div className={s.copy}>
                <h2 className={s.headline}>{site.scenes.s01.headline}</h2>
              </div>
              <Vignette tone={tone} />
              <Grain tone={tone} />
            </Panel>
          ))}
        </>
      );
    case 'motes':
      return (
        <>
          {TONES.map((tone) => {
            const warmth: Warmth = tone === 'dusk' ? 'dusk' : 'lamp';
            return (
              <Panel key={tone} tone={tone} label={`motes on ${tone}`}>
                <LampLight warmth={warmth} surface={tone} x="38%" y="62%" size="80cqmax" intensity={tone === 'paper' ? 1 : 0.85} />
                <Motes ignoreDeviceLimits warmth={warmth} x={0.38} y={0.62} radius={0.4} count={28} />
              </Panel>
            );
          })}
        </>
      );
    case 'sky':
      return (
        <>
          <Panel tone="night" label="night sky">
            <NightSky />
            <Grain />
          </Panel>
          <Panel tone="night" label="night sky, moonlight">
            <NightSky moon={{ x: '74%', y: '20%', size: '90cqmax' }} />
            <Grain />
          </Panel>
          <Panel tone="night" label="night sky, split">
            <div className={s.ramp} style={{ background: 'var(--night)' }} />
            <Split tone="night">
              <NightSky moon={{ x: '50%', y: '20%', size: '120cqmax' }} />
              <Grain />
            </Split>
          </Panel>
        </>
      );
    case 's01':
      return (
        <Panel tone="night" label="S01 composed">
          <NightSky moon={{ x: '76%', y: '16%', size: '80vmax', intensity: 0.8 }} />
          <LampLight warmth="lamp" x="50%" y="80%" size="120vmax" aspect={0.72} breathe flicker />
          <Motes ignoreDeviceLimits warmth="lamp" x={0.5} y={0.8} radius={0.5} />
          <div className={s.copy}>
            <div>
              <p className={s.dateline}>{site.scenes.s01.dateline}</p>
              <h2 className={s.headline}>{site.scenes.s01.headline}</h2>
            </div>
          </div>
          <Vignette />
          <Grain animate />
        </Panel>
      );
    case 's04':
      return (
        <Panel tone="paper" label="S04 composed">
          <PaperTexture />
          <LampLight warmth="lamp" surface="paper" x="42%" y="38%" size="130vmax" />
          <div className={s.copy}>
            <div>
              <p className={s.letterHead}>{sampleLetter.dateline}</p>
              <p className={s.letter}>{sampleLetter.text}</p>
            </div>
          </div>
          <Vignette tone="paper" />
          <Grain tone="paper" />
        </Panel>
      );
    case 's07':
      return (
        <Panel tone="dusk" label="S07 composed">
          <LampLight warmth="dusk" x="30%" y="34%" size="120vmax" breathe />
          <Motes ignoreDeviceLimits warmth="dusk" x={0.3} y={0.34} radius={0.48} />
          <div className={s.copy}>
            <div>
              <p className={s.dateline}>{site.scenes.s07.dateline}</p>
              <h2 className={s.headline}>{site.scenes.s07.headline}</h2>
            </div>
          </div>
          <Vignette tone="dusk" />
          <Grain tone="dusk" />
        </Panel>
      );
  }
}

export function Gallery({ plate }: { plate?: PlateId }) {
  const list = plate ? [plate] : PLATES;
  return (
    <main>
      {list.map((id) => (
        <section key={id} id={id} aria-label={id} className={[s.plate, id.startsWith('s0') ? s.single : ''].join(' ')}>
          <Gallery_ plate={id} />
        </section>
      ))}
    </main>
  );
}
