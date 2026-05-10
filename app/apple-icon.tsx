/**
 * iOS home-screen icon — rendered as a PNG via Next.js' Image Response API.
 *
 * Next.js 14 only accepts raster formats for `apple-icon` (no SVG), so we
 * synthesize one from the same brand mark used by the rest of the site.
 * iOS clips the corners itself, so this asset ships as a square fill with
 * no rounded radius.
 */
import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #FF3D7F 0%, #FF7A5A 55%, #FFB84F 100%)',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(225deg, rgba(124, 92, 255, 0.55) 0%, rgba(124, 92, 255, 0) 55%)',
          }}
        />
        <svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
          <path d="M 60 16 L 104 60 L 60 104 L 16 60 Z" fill="rgba(255,255,255,0.94)" />
          <path
            d="M 60 32 L 88 60 L 60 88 L 32 60 Z"
            fill="url(#sun-fill)"
          />
          <circle cx="60" cy="60" r="11" fill="white" />
          <defs>
            <linearGradient id="sun-fill" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF3D7F" />
              <stop offset="55%" stopColor="#FF7A5A" />
              <stop offset="100%" stopColor="#FFB84F" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    ),
    { ...size },
  );
}
