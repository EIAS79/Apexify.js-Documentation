'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  ArrowRightIcon,
  PlayIcon,
  BookOpenIcon,
  SparklesIcon,
  ClipboardIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

type Showcase = {
  src: string;
  label: string;
  category: string;
  snippet: string;
  tint: string;
};

const SHOWCASES: Showcase[] = [
  {
    src: '/gallery-outputs/backgrounds/bg-aurora-grid.png',
    label: 'bg-aurora-grid',
    category: 'Background',
    tint: '#7B6CFF',
    snippet: `await painter.createCanvas({
  width: 960, height: 540,
  gradientBg: { type: 'linear', colors: aurora },
  bgLayers: [{ type: 'presetPattern',
    pattern: { type: 'grid', size: 6 } }],
  noiseBg: { intensity: 0.04 },
});`,
  },
  {
    src: '/gallery-outputs/images/gallery-chartshowcase-line-rich.png',
    label: 'line-rich',
    category: 'Chart',
    tint: '#FF3DAA',
    snippet: `await painter.createChart({
  kind: 'line',
  series: [revenue, target],
  area: true, smooth: true,
  palette: 'sunset',
  legend: { position: 'top' },
});`,
  },
  {
    src: '/gallery-outputs/images/presentation-slide.png',
    label: 'presentation-slide',
    category: 'Composition',
    tint: '#FFB347',
    snippet: `await painter.createCanvas({ ... });
await painter.createText({
  text: 'Q3 Performance',
  font: { size: 64, weight: 800 },
  gradient: emberGradient,
});
await painter.createChart({ ... });`,
  },
  {
    src: '/gallery-outputs/backgrounds/bg-molten-core.png',
    label: 'bg-molten-core',
    category: 'Background',
    tint: '#FF7257',
    snippet: `await painter.createCanvas({
  colorBg: '#1a0408',
  bgLayers: [
    { type: 'gradient', value: molten },
    { type: 'presetPattern',
      blendMode: 'screen', pattern: rays },
  ],
});`,
  },
  {
    src: '/gallery-outputs/images/shape-collage-prism.png',
    label: 'shape-collage-prism',
    category: 'Shapes',
    tint: '#5DEAB8',
    snippet: `await painter.createImage({
  shapes: prismGeometry,
  filters: [{ type: 'glow',
    color: '#FF3DAA', radius: 24 }],
  paintOrder: 'shape-then-glow',
});`,
  },
];

const STATS = [
  { value: '22+', label: 'Image filters' },
  { value: '35+', label: 'Video features' },
  { value: '8+', label: 'Chart kinds' },
  { value: '100%', label: 'TypeScript' },
];

export default function HeroShowcase() {
  const reduce = useReducedMotion();
  const [idx, setIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % SHOWCASES.length), 4200);
    return () => clearInterval(t);
  }, [reduce]);

  const current = SHOWCASES[idx];

  const copySnippet = async () => {
    try {
      await navigator.clipboard.writeText(current.snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  };

  return (
    <section className="relative pt-28 sm:pt-36 lg:pt-40 pb-16 sm:pb-20 lg:pb-28 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        {/* LEFT — copy / CTAs / stats */}
        <motion.div
          className="lg:col-span-7"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Eyebrow */}
          <motion.div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-semibold mb-7"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--accent-magenta) 12%, transparent)',
              color: 'var(--accent-magenta)',
              border: '1px solid color-mix(in srgb, var(--accent-magenta) 35%, transparent)',
            }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.6 }}
          >
            <SparklesIcon className="h-3.5 w-3.5" />
            <span className="tracking-wide">v5.3.20 · charts · GIFs · video · 22+ filters</span>
          </motion.div>

          {/* Title */}
          <h1
            className="text-[clamp(2.75rem,7.5vw,5.75rem)] font-black leading-[0.96] tracking-tight mb-5 text-balance"
            style={{ color: 'var(--text-primary)' }}
          >
            Draw{' '}
            <span className="text-grad-aurora animate-gradient inline-block">anything</span>.
            <br />
            From a <span className="italic text-grad-ember">script</span>.
          </h1>

          {/* Subtitle */}
          <p
            className="text-base sm:text-lg lg:text-xl max-w-2xl leading-relaxed mb-8 text-pretty"
            style={{ color: 'var(--text-secondary)' }}
          >
            <strong style={{ color: 'var(--text-primary)' }}>Apexify.js</strong> is a programmatic visual library
            for Node.js — render charts, images, GIFs, slides and video on the server with one TypeScript
            API, powered by Rust under the hood.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 mb-10">
            <Link href="/studio" className="btn btn-primary !py-3.5 !px-6 !text-base group">
              <PlayIcon className="h-5 w-5" />
              Open the Studio
              <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link href="/docs#start-here" className="btn btn-secondary !py-3.5 !px-6 !text-base">
              <BookOpenIcon className="h-5 w-5" />
              Read the docs
            </Link>
            <button
              type="button"
              className="btn btn-ghost !py-3.5 !px-4 !text-sm font-mono"
              onClick={() => {
                navigator.clipboard.writeText('npm install apexify.js');
              }}
              title="Copy install command"
            >
              <span className="opacity-70">$</span> npm i apexify.js
              <ClipboardIcon className="h-4 w-4 opacity-60" />
            </button>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl">
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.06, duration: 0.5 }}
                className="surface-glass px-3.5 py-3"
              >
                <div className="text-2xl font-black text-grad-sunset">{s.value}</div>
                <div
                  className="text-[11px] uppercase tracking-wider font-semibold mt-0.5"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {s.label}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* RIGHT — live image showcase */}
        <motion.div
          className="lg:col-span-5 relative"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        >
          {/* Glow halo behind frame */}
          <div
            className="absolute -inset-10 -z-10 rounded-[3rem] blur-3xl pointer-events-none"
            style={{
              background: `radial-gradient(closest-side, ${current.tint}55, transparent 70%)`,
              transition: 'background 0.8s ease',
              opacity: 0.7,
            }}
            aria-hidden
          />

          {/* Window frame */}
          <div
            className="relative rounded-2xl overflow-hidden surface-elevated"
            style={{
              boxShadow: 'var(--shadow-xl)',
              borderColor: 'var(--border-default)',
            }}
          >
            {/* Title bar */}
            <div
              className="flex items-center justify-between px-3.5 py-2.5 border-b"
              style={{
                backgroundColor: 'var(--bg-sunken)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#ff5f57' }} />
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#febc2e' }} />
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#28c840' }} />
              </div>
              <div
                className="font-mono text-[11px] font-medium"
                style={{ color: 'var(--text-tertiary)' }}
              >
                output / {current.label}.png
              </div>
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${current.tint}22`,
                  color: current.tint,
                  border: `1px solid ${current.tint}55`,
                  transition: 'all 0.5s ease',
                }}
              >
                {current.category}
              </span>
            </div>

            {/* Image area */}
            <div className="relative aspect-[16/9] overflow-hidden" style={{ backgroundColor: 'var(--bg-sunken)' }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.src}
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0"
                >
                  <Image
                    src={current.src}
                    alt={`${current.category}: ${current.label}`}
                    fill
                    sizes="(min-width: 1024px) 40vw, 100vw"
                    priority
                    className="object-cover"
                  />
                </motion.div>
              </AnimatePresence>

              {/* Watermark */}
              <div className="absolute bottom-2.5 right-2.5 px-2 py-1 rounded-md backdrop-blur-md text-[10px] font-bold tracking-wide bg-black/40 text-white border border-white/10">
                rendered with apexify.js
              </div>
            </div>

            {/* Snippet panel */}
            <div
              className="border-t font-mono text-[12.5px] leading-[1.6]"
              style={{
                backgroundColor: 'var(--bg-canvas)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex items-center justify-between px-3.5 py-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: 'var(--text-tertiary)' }}>
                  src/render.ts
                </span>
                <button
                  type="button"
                  onClick={copySnippet}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded transition-colors"
                  style={{ color: copied ? 'var(--success)' : 'var(--text-tertiary)' }}
                >
                  {copied ? <CheckIcon className="h-3 w-3" /> : <ClipboardIcon className="h-3 w-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <AnimatePresence mode="wait">
                <motion.pre
                  key={current.snippet}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.45 }}
                  className="px-4 py-3.5 overflow-x-auto whitespace-pre"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <code>{current.snippet}</code>
                </motion.pre>
              </AnimatePresence>
            </div>
          </div>

          {/* Pagination dots */}
          <div className="flex items-center justify-center gap-2 mt-5">
            {SHOWCASES.map((s, i) => (
              <button
                key={s.label}
                type="button"
                onClick={() => setIdx(i)}
                className="group h-1.5 rounded-full transition-all"
                style={{
                  width: i === idx ? '32px' : '8px',
                  backgroundColor: i === idx ? 'var(--accent-magenta)' : 'var(--border-strong)',
                }}
                aria-label={`Show ${s.label}`}
                aria-current={i === idx}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
