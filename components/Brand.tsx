'use client';

/**
 * Brand assets — single source of truth for the Apexify.js logo + wordmark.
 *
 * Two pieces:
 *   - <BrandIcon />   the exact uploaded square Apexify mark.
 *   - <BrandBanner /> the exact uploaded horizontal Apexify.js lockup.
 *
 * Canonical source artwork:
 *   - /public/brand/apexify-mark.avif
 *   - /public/brand/apexify-lockup.avif
 *   - /public/brand/apexify-banner.avif
 *   - /app/apple-icon.png
 *
 * These PNG files are the original uploaded assets; do not rebuild the
 * wordmark from browser text or SVG primitives.
 */

import Image from 'next/image';

interface BrandIconProps {
  /**
   * Pixel size for both width and height. If omitted, the icon fills its
   * container — useful when the parent uses responsive Tailwind sizing
   * (e.g. `h-7 w-7 sm:h-8 sm:w-8`).
   */
  size?: number;
  className?: string;
  /** Decorative — set to false if used standalone with no nearby label. */
  decorative?: boolean;
}

export function BrandIcon({ size, className, decorative = true }: BrandIconProps) {
  if (size != null) {
    return (
      <Image
        src="/brand/apexify-mark.avif"
        alt={decorative ? '' : 'Apexify.js'}
        aria-hidden={decorative || undefined}
        width={size}
        height={size}
        className={className}
        style={{ width: size, height: size }}
        priority
      />
    );
  }
  return (
    <Image
      src="/brand/apexify-mark.avif"
      alt={decorative ? '' : 'Apexify.js'}
      aria-hidden={decorative || undefined}
      width={64}
      height={64}
      className={className}
      style={{ width: '100%', height: '100%' }}
      priority
    />
  );
}

interface BrandBannerProps {
  /** Force a specific variant; otherwise picks based on the active theme. */
  variant?: 'light' | 'dark';
  className?: string;
  /** Max banner width in CSS pixels. Default 480. */
  maxWidth?: number;
}

/**
 * Exact logo + wordmark lockup from the uploaded source artwork.
 *
 * `variant` remains accepted for call-site compatibility, but the same
 * canonical artwork is used in both themes so the logo geometry and .js
 * spacing cannot drift between variants.
 */
export function BrandBanner({ className = '', maxWidth = 480 }: BrandBannerProps) {
  return (
    <div
      className={`brand-banner relative ${className}`}
      style={{ maxWidth, width: '100%' }}
      aria-label="Apexify.js — Programmatic visual library for Node.js"
      role="img"
    >
      <Image
        src="/brand/apexify-lockup.avif"
        alt=""
        aria-hidden
        width={2048}
        height={682}
        sizes={`${maxWidth}px`}
        className="block h-auto w-full object-contain"
        priority
      />
    </div>
  );
}
