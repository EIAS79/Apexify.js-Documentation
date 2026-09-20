/**
 * iOS home-screen icon — rendered from the same Apexify brand geometry as
 * /public/brand/icon.svg so browser, docs and installed-app identity stay aligned.
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
          background: 'linear-gradient(145deg, #071326 0%, #0A1740 100%)',
        }}
      >
        <svg width="152" height="152" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="apex" x1="110" y1="410" x2="398" y2="112" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#055CFF" />
              <stop offset="38%" stopColor="#1B9DFF" />
              <stop offset="66%" stopColor="#28DDE9" />
              <stop offset="100%" stopColor="#8A27FF" />
            </linearGradient>
            <linearGradient id="inner" x1="250" y1="294" x2="340" y2="430" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#DCE5FF" />
            </linearGradient>
            <linearGradient id="cyan" x1="48" y1="146" x2="124" y2="226" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#20F0DE" />
              <stop offset="100%" stopColor="#00A9F5" />
            </linearGradient>
            <linearGradient id="violet" x1="391" y1="247" x2="478" y2="335" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FF22E6" />
              <stop offset="100%" stopColor="#7E21FF" />
            </linearGradient>
          </defs>
          <rect x="38" y="142" width="88" height="88" rx="23" fill="url(#cyan)" />
          <rect x="388" y="247" width="88" height="88" rx="23" fill="url(#violet)" />
          <path d="M84 426 256 84 428 426" fill="none" stroke="url(#apex)" strokeWidth="82" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M257 294 332 426" fill="none" stroke="url(#inner)" strokeWidth="64" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
