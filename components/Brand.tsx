'use client';

import Image from 'next/image';

interface BrandIconProps {
  size?: number;
  className?: string;
  decorative?: boolean;
}

export function BrandIcon({ size, className, decorative = true }: BrandIconProps) {
  const dimension = size ?? 64;
  return (
    <Image
      src="/brand/icon.svg"
      alt={decorative ? '' : 'Apexify.js'}
      aria-hidden={decorative || undefined}
      width={dimension}
      height={dimension}
      className={className}
      style={size ? { width: size, height: size } : { width: '100%', height: '100%' }}
      priority
    />
  );
}

interface BrandBannerProps {
  variant?: 'light' | 'dark';
  className?: string;
  maxWidth?: number;
}

export function BrandBanner({ className = '', maxWidth = 480 }: BrandBannerProps) {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`} style={{ maxWidth }} role="img" aria-label="Apexify.js">
      <span className="inline-flex h-12 w-12 shrink-0"><BrandIcon /></span>
      <span className="text-2xl font-semibold tracking-[-0.035em]" style={{ color: 'var(--text)' }}>
        Apexify<span className="font-mono text-[0.72em]" style={{ color: 'var(--accent)' }}>.js</span>
      </span>
    </div>
  );
}
