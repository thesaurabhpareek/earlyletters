/**
 * The picture that appears when the link is shared (Messages, WhatsApp, Slack, social): the app icon, the name and
 * the one-line promise on the lamp-lit night background. Drawn at build time; no tracking, nothing per visitor.
 * The icon is src/app/icon.svg (the brand mark); the words come from site.ts; the type is Mukta, the brand sans
 * (SIL Open Font License, copied from @fontsource/mukta into _fonts/ because the image renderer cannot read woff2).
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { site } from '@/content/site';

export const alt = site.meta.title;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Read from disk at build time (the page is drawn once, not per visitor); the build runs in apps/web.
const fromApp = (path: string) => join(process.cwd(), 'src/app', path);

export default async function OpenGraphImage() {
  const [semi, medium, svg] = await Promise.all([
    readFile(fromApp('_fonts/Mukta-SemiBold.woff')),
    readFile(fromApp('_fonts/Mukta-Medium.woff')),
    readFile(fromApp('icon.svg'), 'utf8'),
  ]);
  const icon = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          padding: '0 96px',
          color: '#f2ece4',
          background:
            'radial-gradient(ellipse 70% 90% at 78% 62%, rgba(243,201,139,0.42), rgba(217,164,126,0.2) 38%, rgba(22,20,18,0) 70%), radial-gradient(ellipse 60% 80% at 20% 110%, rgba(240,140,124,0.22), rgba(22,20,18,0) 65%), #161412',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 640 }}>
          <div style={{ fontFamily: 'Mukta', fontWeight: 600, fontSize: 112, lineHeight: 1, letterSpacing: -3 }}>{site.brand.name}</div>
          <div style={{ fontFamily: 'Mukta', fontWeight: 500, fontSize: 40, lineHeight: 1.3, marginTop: 28, color: '#d9cfc3' }}>
            {site.brand.line}
          </div>
          <div style={{ fontFamily: 'Mukta', fontWeight: 500, fontSize: 28, marginTop: 36, color: '#d9a47e' }}>{site.cta.prelaunch.eyebrow}</div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={icon} width={300} height={300} alt="" style={{ marginLeft: 'auto', borderRadius: 68, boxShadow: '0 30px 80px rgba(0,0,0,0.55)' }} />
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Mukta', data: semi, weight: 600, style: 'normal' },
        { name: 'Mukta', data: medium, weight: 500, style: 'normal' },
      ],
    },
  );
}
