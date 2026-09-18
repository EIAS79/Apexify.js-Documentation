import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0D1016' }}>
        <div style={{ width: 132, height: 132, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '7px solid #29313D', borderRadius: 20, position: 'relative' }}>
          <svg width="104" height="104" viewBox="0 0 104 104" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 85 49 17h8l29 68H72l-7-18H41L33 85H18Zm29-31h12l-6-16-6 16Z" fill="#F4F7FB" />
            <path d="M82 18H61v7h14v16h7V18ZM18 86h21v-7H25V63h-7v23Z" fill="#4C8DFF" />
            <path d="M70 49h18v18h-7V56H70v-7Z" fill="#43D9FF" />
          </svg>
        </div>
      </div>
    ),
    { ...size },
  );
}
