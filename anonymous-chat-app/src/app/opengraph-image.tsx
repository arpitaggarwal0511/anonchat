import { ImageResponse } from 'next/og';
import { siteConfig } from './seo';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 32,
          padding: 72,
          color: 'white',
          background:
            'radial-gradient(circle at top left, #2563eb 0, transparent 36%), linear-gradient(135deg, #020617 0%, #0f172a 52%, #111827 100%)',
          fontFamily: 'Arial',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            color: '#93c5fd',
            fontSize: 34,
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: 'uppercase',
          }}
        >
          Privacy Theater Not Included
        </div>
        <div style={{ fontSize: 104, fontWeight: 900, lineHeight: 0.92 }}>
          {siteConfig.name}
        </div>
        <div style={{ maxWidth: 890, fontSize: 42, lineHeight: 1.18, color: '#dbeafe' }}>
          Anonymous rooms, voice, files, images, and fewer creepy questions.
        </div>
      </div>
    ),
    size,
  );
}
