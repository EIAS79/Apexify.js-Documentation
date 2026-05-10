'use client';

/**
 * Brand assets — single source of truth for the Apexify.js logo + wordmark.
 *
 * Two pieces:
 *   - <BrandIcon />   the square mark; used in the navbar and the footer.
 *   - <BrandBanner /> the horizontal logo + wordmark lockup; theme-aware,
 *                     swaps between /public/brand/banner-light.svg and
 *                     /public/brand/banner-dark.svg.
 *
 * The actual artwork lives at:
 *   - /public/brand/icon.svg
 *   - /public/brand/banner-light.svg
 *   - /public/brand/banner-dark.svg
 *   - /app/icon.svg            (Next.js auto-favicon, mirror of brand/icon.svg)
 *   - /app/apple-icon.svg      (iOS home-screen icon, mirror)
 *
 * Swap the SVGs in /public/brand to update the brand site-wide.
 */

import Image from 'next/image';
import { useTheme } from './ThemeProvider';

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
        src="/brand/icon.svg"
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
      src="/brand/icon.svg"
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
 * Theme-aware logo + wordmark lockup. On first paint we render BOTH variants
 * stacked and toggle visibility with CSS (.dark / .light on <html>) so the
 * correct one is visible even before the theme context has hydrated. After
 * hydration we render only the resolved variant so unused bytes don't ship
 * to interactive paint.
 */
export function BrandBanner({ variant, className = '', maxWidth = 480 }: BrandBannerProps) {
  const { theme } = useTheme();
  const resolved = variant ?? theme;

  return (
    <div
      className={`brand-banner relative ${className}`}
      style={{ maxWidth, aspectRatio: '960 / 220' }}
      aria-label="Apexify.js — Programmatic visual library for Node.js"
      role="img"
    >
      <Image
        src="/brand/banner-light.svg"
        alt=""
        aria-hidden
        fill
        sizes={`${maxWidth}px`}
        className="brand-banner-light object-contain"
        style={{ display: resolved === 'light' ? 'block' : 'none' }}
        priority
      />
      <Image
        src="/brand/banner-dark.svg"
        alt=""
        aria-hidden
        fill
        sizes={`${maxWidth}px`}
        className="brand-banner-dark object-contain"
        style={{ display: resolved === 'dark' ? 'block' : 'none' }}
        priority
      />
    </div>
  );
}
