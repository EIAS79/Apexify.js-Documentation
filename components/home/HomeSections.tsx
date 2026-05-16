'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ChartBarIcon,
  PhotoIcon,
  SparklesIcon,
  FilmIcon,
  VideoCameraIcon,
  PaintBrushIcon,
  CubeIcon,
  Squares2X2Icon,
  PencilSquareIcon,
  EyeDropperIcon,
  Square3Stack3DIcon,
  AdjustmentsHorizontalIcon,
  CommandLineIcon,
  BoltIcon,
  CodeBracketIcon,
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  XMarkIcon,
  MinusIcon,
  RocketLaunchIcon,
  CpuChipIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import { BrandIcon } from '@/components/Brand';

/* =====================================================================
   Section header — reused across home sections
   ===================================================================== */

function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = 'left',
}: {
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: string;
  align?: 'left' | 'center';
}) {
  const alignClass = align === 'center' ? 'text-center mx-auto' : 'text-left';
  return (
    <div className={`mb-10 sm:mb-14 max-w-3xl ${alignClass}`}>
      <p
        className="text-[11px] font-bold uppercase tracking-[0.22em] mb-3"
        style={{ color: 'var(--accent-magenta)' }}
      >
        {eyebrow}
      </p>
      <h2
        className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.05] mb-4 text-balance"
        style={{ color: 'var(--text-primary)' }}
      >
        {title}
      </h2>
      {subtitle && (
        <p className="text-base sm:text-lg leading-relaxed text-pretty" style={{ color: 'var(--text-secondary)' }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

/* =====================================================================
   1. Capabilities marquee — infinite horizontal scroll
   ===================================================================== */

const CAPABILITIES = [
  { label: 'Charts', Icon: ChartBarIcon },
  { label: 'Backgrounds', Icon: PaintBrushIcon },
  { label: 'Text effects', Icon: PencilSquareIcon },
  { label: 'GIFs', Icon: FilmIcon },
  { label: 'Video', Icon: VideoCameraIcon },
  { label: '22+ filters', Icon: SparklesIcon },
  { label: 'Pattern fills', Icon: Squares2X2Icon },
  { label: 'Pixel ops', Icon: CubeIcon },
  { label: 'Path2D', Icon: CommandLineIcon },
  { label: 'Image masks', Icon: AdjustmentsHorizontalIcon },
  { label: 'Color analysis', Icon: EyeDropperIcon },
  { label: 'Batch / chain', Icon: Square3Stack3DIcon },
];

export function CapabilitiesMarquee() {
  const reduce = useReducedMotion();
  const items = [...CAPABILITIES, ...CAPABILITIES];

  return (
    <section className="relative py-10 sm:py-14 overflow-hidden">
      <div
        className="absolute inset-y-0 left-0 w-24 z-10 pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, var(--bg-base), transparent)',
        }}
      />
      <div
        className="absolute inset-y-0 right-0 w-24 z-10 pointer-events-none"
        style={{
          background: 'linear-gradient(270deg, var(--bg-base), transparent)',
        }}
      />
      <div className={`flex gap-3 w-max ${reduce ? '' : 'animate-marquee'}`}>
        {items.map((cap, i) => {
          const Icon = cap.Icon;
          return (
            <div
              key={i}
              className="surface-glass inline-flex items-center gap-2.5 px-5 py-3 rounded-full whitespace-nowrap"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <Icon className="h-4 w-4" style={{ color: 'var(--accent-iris)' }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {cap.label}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* =====================================================================
   2. Bento grid — "Build with Apexify" using real PNGs
   ===================================================================== */

const BENTO = [
  {
    title: 'Charts that look designed',
    blurb: 'Bar, line, pie, donut, radar, polar, combo, comparison — all share one styling vocabulary.',
    span: 'lg:col-span-2 lg:row-span-2',
    src: '/gallery-outputs/images/gallery-chartshowcase-line-rich.png',
    href: '/docs#00-charts-overview',
    accent: '#FF3DAA',
    Icon: ChartBarIcon,
  },
  {
    title: 'Cinematic backgrounds',
    blurb: 'Layered gradients, presets, noise, blend modes.',
    span: '',
    src: '/gallery-outputs/backgrounds/bg-aurora-grid.png',
    href: '/docs#00-create-canvas-overview',
    accent: '#7B6CFF',
    Icon: PaintBrushIcon,
  },
  {
    title: 'GIFs from frames',
    blurb: 'Animate any sequence, control disposal, watermark, encode.',
    span: '',
    src: '/gallery-outputs/backgrounds/bg-molten-core.png',
    href: '/docs#00-create-gif-overview',
    accent: '#FF7257',
    Icon: FilmIcon,
  },
  {
    title: 'Type with attitude',
    blurb: 'Gradients, glows, strokes, curved text, measured layouts.',
    span: 'lg:col-span-2',
    src: '/gallery-outputs/images/advance-text-glow-plaque.png',
    href: '/docs#00-create-text-overview',
    accent: '#FFB347',
    Icon: PencilSquareIcon,
  },
  {
    title: 'Programmatic slides',
    blurb: 'Compose chart + image + text on a canvas, export to PNG.',
    span: 'lg:col-span-2',
    src: '/gallery-outputs/images/presentation-slide.png',
    href: '/docs#02-recipes',
    accent: '#5DEAB8',
    Icon: Squares2X2Icon,
  },
  {
    title: 'Shapes & masks',
    blurb: 'Eight primitives, clipping, paint order, filter pipelines.',
    span: '',
    src: '/gallery-outputs/images/shape-collage-prism.png',
    href: '/docs#00-create-image-overview',
    accent: '#A99CFF',
    Icon: CubeIcon,
  },
];

export function BentoGrid() {
  return (
    <section className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          eyebrow="What you can build"
          title={
            <>
              One library,{' '}
              <span className="text-grad-sunset">a whole studio</span>{' '}
              of outputs.
            </>
          }
          subtitle="Every tile below is a real, generated PNG from this codebase. Click through to the matching guide."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:auto-rows-[220px]">
          {BENTO.map((tile, i) => {
            const Icon = tile.Icon;
            return (
              <motion.div
                key={tile.title}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.55, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                className={`group relative overflow-hidden rounded-2xl ${tile.span} surface-elevated lift`}
                style={{ borderColor: 'var(--border-default)', minHeight: '220px' }}
              >
                <Link href={tile.href} className="absolute inset-0 z-30" aria-label={tile.title} />
                {/* Image */}
                <div className="absolute inset-0">
                  <Image
                    src={tile.src}
                    alt={tile.title}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover opacity-90 group-hover:scale-105 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  />
                </div>
                {/* Tint + readability scrim */}
                <div
                  className="absolute inset-0 transition-opacity duration-500"
                  style={{
                    background: `linear-gradient(180deg, transparent 30%, ${tile.accent}33 70%, rgba(0,0,0,0.7) 100%)`,
                  }}
                />
                {/* Foreground content */}
                <div className="relative z-20 h-full flex flex-col justify-between p-5">
                  <div
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl backdrop-blur-md self-start"
                    style={{
                      backgroundColor: `${tile.accent}33`,
                      border: `1px solid ${tile.accent}66`,
                    }}
                  >
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1 leading-tight">{tile.title}</h3>
                    <p className="text-xs text-white/75 leading-snug">{tile.blurb}</p>
                  </div>
                </div>
                {/* Hover arrow */}
                <div
                  className="absolute top-4 right-4 z-20 h-8 w-8 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ border: '1px solid rgba(255,255,255,0.25)' }}
                >
                  <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 text-white" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* =====================================================================
   3. Live snippet section — code → output
   ===================================================================== */

const SAMPLE_CODE = `import { ApexPainter } from 'apexify.js';

const painter = new ApexPainter();

const { buffer } = await painter.createChart({
  kind: 'line',
  width: 960,
  height: 540,
  series: [
    { name: 'Revenue', data: revenue, fill: 'gradient' },
    { name: 'Target',  data: target,  dashed: true   },
  ],
  smooth: true,
  palette: 'sunset',
  legend: { position: 'top' },
  background: { gradient: aurora },
});

await fs.promises.writeFile('chart.png', buffer);`;

/**
 * Lightweight TS token highlighter for the demo (no extra deps).
 *
 * Implementation note: a previous version chained `.replace()` calls in
 * sequence, which mangled output because later passes re-tokenized the
 * inline `style="color:..."` strings injected by earlier passes (e.g. the
 * `var` keyword inside `var(--accent-magenta)`). This version walks the
 * source once, collects non-overlapping match ranges in priority order,
 * then emits a single escaped HTML string.
 */
function highlightTs(code: string) {
  const escapeHtml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  type Match = { start: number; end: number; color: string };

  const patterns: Array<{ regex: RegExp; color: string }> = [
    { regex: /\/\/[^\n]*/g, color: 'var(--text-muted)' },
    { regex: /(['"`])(?:\\.|(?!\1).)*\1/g, color: 'var(--accent-amber)' },
    { regex: /\b(ApexPainter)\b/g, color: 'var(--accent-iris-soft)' },
    {
      regex:
        /\b(import|from|const|let|var|await|async|function|return|if|else|new|export)\b/g,
      color: 'var(--accent-magenta)',
    },
    { regex: /\b\d+(?:\.\d+)?\b/g, color: 'var(--accent-amber-soft)' },
    { regex: /\b([A-Za-z_$][\w$]*)(?=\s*:)/g, color: 'var(--text-primary)' },
  ];

  const matches: Match[] = [];
  for (const { regex, color } of patterns) {
    regex.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(code)) !== null) {
      matches.push({ start: m.index, end: m.index + m[0].length, color });
    }
  }

  /** Earlier-priority patterns claim disputed ranges first (stable sort). */
  matches.sort((a, b) => a.start - b.start);
  const accepted: Match[] = [];
  let cursor = 0;
  for (const m of matches) {
    if (m.start < cursor) continue;
    accepted.push(m);
    cursor = m.end;
  }

  let out = '';
  let i = 0;
  for (const m of accepted) {
    if (m.start > i) out += escapeHtml(code.slice(i, m.start));
    out += `<span style="color:${m.color}">${escapeHtml(code.slice(m.start, m.end))}</span>`;
    i = m.end;
  }
  if (i < code.length) out += escapeHtml(code.slice(i));
  return out;
}

export function LiveSnippetSection() {
  return (
    <section className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          eyebrow="Code → output"
          title={
            <>
              A handful of lines.{' '}
              <span className="text-grad-iris">A finished PNG.</span>
            </>
          }
          subtitle="Same TypeScript surface, whether you're rendering a chart, a slide, a banner, or a 60-frame GIF."
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Code panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="surface-elevated overflow-hidden rounded-2xl"
            style={{ borderColor: 'var(--border-default)' }}
          >
            <div
              className="flex items-center justify-between px-4 py-2.5 border-b"
              style={{
                backgroundColor: 'var(--bg-sunken)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex items-center gap-2">
                <CodeBracketIcon className="h-4 w-4" style={{ color: 'var(--accent-iris)' }} />
                <span className="font-mono text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                  src/render-chart.ts
                </span>
              </div>
              <Link
                href="/studio"
                className="text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1"
                style={{ color: 'var(--accent-magenta)' }}
              >
                Edit live
                <ArrowRightIcon className="h-3 w-3" />
              </Link>
            </div>
            <pre
              className="overflow-x-auto px-5 py-4 text-[13px] leading-[1.7] font-mono"
              style={{ backgroundColor: 'var(--bg-canvas)', color: 'var(--text-secondary)' }}
            >
              <code dangerouslySetInnerHTML={{ __html: highlightTs(SAMPLE_CODE) }} />
            </pre>
          </motion.div>

          {/* Output panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="relative rounded-2xl overflow-hidden surface-elevated group"
            style={{ borderColor: 'var(--border-default)' }}
          >
            <div
              className="flex items-center justify-between px-4 py-2.5 border-b"
              style={{
                backgroundColor: 'var(--bg-sunken)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex items-center gap-2">
                <PhotoIcon className="h-4 w-4" style={{ color: 'var(--accent-amber)' }} />
                <span className="font-mono text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                  out/chart.png · 960 × 540
                </span>
              </div>
              <span
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: 'var(--success)' }}
              >
                ● rendered
              </span>
            </div>
            <div className="relative aspect-[16/9]" style={{ backgroundColor: 'var(--bg-sunken)' }}>
              <Image
                src="/gallery-outputs/images/gallery-chartshowcase-line-rich.png"
                alt="Generated line chart"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          </motion.div>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/studio"
            className="btn btn-primary !py-3 !px-6 inline-flex"
          >
            <RocketLaunchIcon className="h-4 w-4" />
            Try it in the Studio
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* =====================================================================
   4. Performance section — animated bars + Rust callout
   ===================================================================== */

const BENCH = [
  { label: 'Apexify · @napi-rs/canvas', value: 100, color: 'var(--gradient-sunset)', winner: true },
  { label: 'sharp', value: 78, color: 'var(--accent-iris)' },
  { label: 'node-canvas', value: 64, color: 'var(--accent-iris-soft)' },
  { label: 'jimp (pure JS)', value: 22, color: 'var(--text-muted)' },
];

export function PerformanceSection() {
  return (
    <section className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left — copy */}
          <div className="lg:col-span-5">
            <SectionHeader
              eyebrow="Performance"
              title={
                <>
                  TypeScript on the surface.{' '}
                  <span className="text-grad-ember">Rust underneath.</span>
                </>
              }
              subtitle="Built on @napi-rs/canvas — a Rust-native binding that ships memory-efficient pipelines, smart caching, and parallel-safe batch & chain operations for big workloads."
            />
            <div className="flex flex-wrap gap-3">
              <span className="chip">
                <CpuChipIcon className="h-3.5 w-3.5" />
                @napi-rs/canvas
              </span>
              <span className="chip">
                <BoltIcon className="h-3.5 w-3.5" />
                Rust SIMD
              </span>
              <span className="chip">
                <Square3Stack3DIcon className="h-3.5 w-3.5" />
                Batch / chain
              </span>
            </div>
          </div>

          {/* Right — animated bars */}
          <div className="lg:col-span-7">
            <div
              className="surface-elevated rounded-2xl p-6 sm:p-8"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <div className="flex items-baseline justify-between mb-6">
                <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                  Relative throughput
                </h3>
                <span
                  className="text-[11px] font-mono uppercase tracking-wider"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  higher is better
                </span>
              </div>
              <div className="space-y-4">
                {BENCH.map((b, i) => (
                  <div key={b.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className="text-sm font-semibold inline-flex items-center gap-2"
                        style={{ color: b.winner ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                      >
                        {b.label}
                        {b.winner && (
                          <span
                            className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded"
                            style={{
                              backgroundImage: 'var(--gradient-sunset)',
                              color: 'white',
                            }}
                          >
                            Lead
                          </span>
                        )}
                      </span>
                      <span
                        className="text-xs font-mono font-bold"
                        style={{ color: b.winner ? 'var(--accent-magenta)' : 'var(--text-tertiary)' }}
                      >
                        {b.value}
                      </span>
                    </div>
                    <div
                      className="h-2.5 rounded-full overflow-hidden"
                      style={{ backgroundColor: 'var(--bg-sunken)' }}
                    >
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          background: b.color.startsWith('var(--gradient')
                            ? b.color
                            : `linear-gradient(90deg, ${b.color}, color-mix(in srgb, ${b.color} 60%, transparent))`,
                          boxShadow: b.winner ? 'var(--glow-magenta)' : 'none',
                        }}
                        initial={{ width: '0%' }}
                        whileInView={{ width: `${b.value}%` }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 1.05, delay: 0.15 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p
                className="mt-6 text-[11px] leading-relaxed"
                style={{ color: 'var(--text-muted)' }}
              >
                Numbers are illustrative — measure on your own workload. Apexify gets the lead by composing
                Rust-backed canvas + image filters + chart layout on a single buffer instead of round-tripping
                through multiple libraries.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =====================================================================
   5. Recipes deck — horizontal snap scroll
   ===================================================================== */

const RECIPES = [
  {
    title: 'Animated GIF',
    blurb: 'Build a frame-perfect loop with createGIF.',
    href: '/docs#animated-gif',
    accent: '#FF3DAA',
    Icon: FilmIcon,
  },
  {
    title: 'Quote image',
    blurb: 'Hero-friendly typography on a tinted backdrop.',
    href: '/docs#quote-image',
    accent: '#FFB347',
    Icon: PencilSquareIcon,
  },
  {
    title: 'Product card',
    blurb: 'Compose photo + price + brand in one shot.',
    href: '/docs#product-card',
    accent: '#7B6CFF',
    Icon: PhotoIcon,
  },
  {
    title: 'Social banner',
    blurb: '1200×630 OG-ready, generated per post.',
    href: '/docs#social-media-banner',
    accent: '#5DEAB8',
    Icon: Squares2X2Icon,
  },
  {
    title: 'Chart image',
    blurb: 'Drop-in dashboards as PNG attachments.',
    href: '/docs#chart-image',
    accent: '#FF7257',
    Icon: ChartBarIcon,
  },
  {
    title: 'Video from frames',
    blurb: 'Stitch frames into MP4 with createVideo.',
    href: '/docs#video-from-frames',
    accent: '#A99CFF',
    Icon: VideoCameraIcon,
  },
];

export function RecipesDeck() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState<{ left: boolean; right: boolean }>({ left: false, right: true });
  const dragRef = useRef<{
    phase: 'idle' | 'pending' | 'dragging';
    startX: number;
    startScroll: number;
    pointerId: number;
  }>({ phase: 'idle', startX: 0, startScroll: 0, pointerId: -1 });
  const [isDragging, setIsDragging] = useState(false);

  /** Recompute the edge fades + arrow disabled state on scroll / resize. */
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const measure = () => {
      const max = el.scrollWidth - el.clientWidth;
      setEdges({
        left: el.scrollLeft > 4,
        right: el.scrollLeft < max - 4,
      });
    };
    measure();
    el.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    return () => {
      el.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
    };
  }, []);

  /** Step roughly one card width per arrow click. */
  const step = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-recipe-card]');
    const delta = (card?.offsetWidth ?? 300) + 16;
    el.scrollBy({ left: dir * delta, behavior: 'smooth' });
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    const el = trackRef.current;
    if (!el) return;
    dragRef.current = {
      phase: 'pending',
      startX: e.clientX,
      startScroll: el.scrollLeft,
      pointerId: e.pointerId,
    };
    el.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const ds = dragRef.current;
    if (ds.phase === 'idle') return;
    const el = trackRef.current;
    if (!el) return;
    const dx = e.clientX - ds.startX;
    if (ds.phase === 'pending' && Math.abs(dx) > 5) {
      ds.phase = 'dragging';
      setIsDragging(true);
    }
    if (ds.phase === 'dragging') {
      el.scrollLeft = ds.startScroll - dx;
    }
  };
  const endPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const ds = dragRef.current;
    const el = trackRef.current;
    const wasDragging = ds.phase === 'dragging';
    if (el && ds.pointerId !== -1) {
      try {
        el.releasePointerCapture(ds.pointerId);
      } catch {
        /* already released */
      }
    }
    dragRef.current = { phase: 'idle', startX: 0, startScroll: 0, pointerId: -1 };
    setIsDragging(false);
    /** Swallow the click that would otherwise fire after a drag. */
    if (wasDragging) {
      const swallow = (ev: MouseEvent) => {
        ev.stopPropagation();
        ev.preventDefault();
      };
      window.addEventListener('click', swallow, { capture: true, once: true });
    }
    void e;
  };

  return (
    <section className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 sm:mb-12">
          <SectionHeader
            eyebrow="Recipes"
            title={
              <>
                Copy-paste{' '}
                <span className="text-grad-aurora">starting points</span>.
              </>
            }
          />
          <div className="flex items-center gap-2 self-start sm:self-end mb-1">
            <button
              type="button"
              onClick={() => step(-1)}
              disabled={!edges.left}
              aria-label="Previous recipes"
              className="hidden sm:grid h-10 w-10 place-items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                border: '1px solid var(--border-default)',
                background: 'var(--bg-raised)',
                color: 'var(--text-secondary)',
              }}
            >
              <ChevronLeftIcon className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              disabled={!edges.right}
              aria-label="Next recipes"
              className="hidden sm:grid h-10 w-10 place-items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                border: '1px solid var(--border-default)',
                background: 'var(--bg-raised)',
                color: 'var(--text-secondary)',
              }}
            >
              <ChevronRightIcon className="h-4 w-4" aria-hidden />
            </button>
            <Link
              href="/docs#00-recipes-overview"
              className="btn btn-ghost !text-sm ml-1"
            >
              All recipes
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="relative">
          {/*
            Edge fades sit in the section's bleed gutter — width matches the
            page padding (16/24/32 px) and they're pushed outside the content
            edge with a matching negative offset, so they end EXACTLY at the
            card edge and never sit on top of a card in its resting position.
            When the deck is scrolled, cards slide into the gutter and fade
            naturally under the gradient — proper scroll affordance, no
            "black shadow on the card" effect.
          */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 -left-4 sm:-left-6 lg:-left-8 z-10 w-4 sm:w-6 lg:w-8 transition-opacity"
            style={{
              background:
                'linear-gradient(to right, var(--bg-base), transparent)',
              opacity: edges.left ? 1 : 0,
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 -right-4 sm:-right-6 lg:-right-8 z-10 w-4 sm:w-6 lg:w-8 transition-opacity"
            style={{
              background:
                'linear-gradient(to left, var(--bg-base), transparent)',
              opacity: edges.right ? 1 : 0,
            }}
          />

          <div
            ref={trackRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endPointer}
            onPointerCancel={endPointer}
            className="recipes-track flex gap-4 overflow-x-auto overflow-y-hidden -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-2 snap-x snap-mandatory"
            style={{
              cursor: isDragging ? 'grabbing' : 'grab',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              userSelect: isDragging ? 'none' : 'auto',
            }}
          >
            {RECIPES.map((r, i) => {
              const Icon = r.Icon;
              return (
                <motion.div
                  key={r.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: i * 0.04 }}
                  data-recipe-card
                  className="snap-start shrink-0 w-[280px] sm:w-[300px]"
                  /** Stop click navigation while a drag was in progress. */
                  onClickCapture={(e) => {
                    if (isDragging) {
                      e.preventDefault();
                      e.stopPropagation();
                    }
                  }}
                >
                  <Link
                    href={r.href}
                    draggable={false}
                    className="group block surface-elevated rounded-2xl p-6 h-full lift select-none"
                    style={{ borderColor: 'var(--border-default)' }}
                  >
                    <div
                      className="inline-flex h-11 w-11 items-center justify-center rounded-xl mb-4 transition-transform group-hover:rotate-6"
                      style={{
                        backgroundColor: `${r.accent}1f`,
                        border: `1px solid ${r.accent}55`,
                        color: r.accent,
                      }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-bold mb-1.5" style={{ color: 'var(--text-primary)' }}>
                      {r.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {r.blurb}
                    </p>
                    <div
                      className="mt-5 pt-4 border-t inline-flex items-center gap-1 text-[12px] font-bold uppercase tracking-wider transition-colors w-full"
                      style={{
                        borderColor: 'var(--border-subtle)',
                        color: r.accent,
                      }}
                    >
                      Open recipe
                      <ArrowRightIcon className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* =====================================================================
   6. Comparison grid — feature matrix redesigned
   ===================================================================== */

type Cell = 'yes' | 'no' | 'partial';
const COLS = ['Apexify', 'sharp', 'node-canvas', 'jimp', 'fabric.js'] as const;

const FEATURES: { feature: string; cells: Cell[] }[] = [
  { feature: 'Rust-backed perf',         cells: ['yes', 'yes', 'yes', 'no', 'no'] },
  { feature: 'TypeScript-first',         cells: ['yes', 'yes', 'yes', 'no', 'partial'] },
  { feature: '22+ image filters',        cells: ['yes', 'partial', 'no', 'partial', 'no'] },
  { feature: 'Chart generation',         cells: ['yes', 'no', 'no', 'no', 'no'] },
  { feature: 'GIF creation',             cells: ['yes', 'no', 'no', 'no', 'no'] },
  { feature: 'Video pipeline (FFmpeg)',  cells: ['yes', 'no', 'no', 'no', 'no'] },
  { feature: 'Pattern + noise + blends', cells: ['yes', 'partial', 'partial', 'no', 'partial'] },
  { feature: 'Owner-supported',          cells: ['yes', 'yes', 'yes', 'no', 'yes'] },
];

function CellMark({ value }: { value: Cell }) {
  if (value === 'yes')
    return (
      <span
        className="inline-flex h-7 w-7 items-center justify-center rounded-full"
        style={{
          backgroundImage: 'var(--gradient-sunset)',
          color: 'white',
          boxShadow: 'var(--glow-magenta)',
        }}
      >
        <CheckIcon className="h-3.5 w-3.5 stroke-[3]" />
      </span>
    );
  if (value === 'partial')
    return (
      <span
        className="inline-flex h-7 w-7 items-center justify-center rounded-full"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--accent-amber) 20%, transparent)',
          color: 'var(--accent-amber)',
          border: '1px solid color-mix(in srgb, var(--accent-amber) 50%, transparent)',
        }}
      >
        <MinusIcon className="h-4 w-4 stroke-[3]" />
      </span>
    );
  return (
    <span
      className="inline-flex h-7 w-7 items-center justify-center rounded-full"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--text-muted) 14%, transparent)',
        color: 'var(--text-muted)',
        border: '1px solid var(--border-default)',
      }}
    >
      <XMarkIcon className="h-3.5 w-3.5 stroke-[3]" />
    </span>
  );
}

export function ComparisonGrid() {
  return (
    <section className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          eyebrow="The full picture"
          title={
            <>
              What other libraries{' '}
              <span className="text-grad-iris">don't ship</span>{' '}
              in the box.
            </>
          }
          subtitle="Pixel processing, charts, GIFs, video, and composition behind a single TypeScript surface — instead of stitching together four packages."
        />

        <div
          className="surface-elevated rounded-2xl overflow-hidden"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px]">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                  <th
                    className="text-left px-5 sm:px-6 py-4 text-[11px] font-bold uppercase tracking-wider"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    Feature
                  </th>
                  {COLS.map((c, i) => (
                    <th
                      key={c}
                      className="px-3 sm:px-4 py-4 text-center text-xs font-bold"
                      style={{
                        color: i === 0 ? 'var(--text-primary)' : 'var(--text-tertiary)',
                      }}
                    >
                      {i === 0 ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundImage: 'var(--gradient-sunset)' }} />
                          {c}
                        </span>
                      ) : (
                        c
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((row) => (
                  <tr
                    key={row.feature}
                    className="group transition-colors"
                    style={{ borderTop: '1px solid var(--border-subtle)' }}
                  >
                    <td
                      className="px-5 sm:px-6 py-3.5 text-sm font-semibold"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <span className="group-hover:text-[var(--text-primary)] transition-colors">
                        {row.feature}
                      </span>
                    </td>
                    {row.cells.map((cell, i) => (
                      <td key={i} className="px-3 sm:px-4 py-3.5 text-center">
                        <CellMark value={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div
            className="px-5 sm:px-6 py-3.5 text-[12px] flex flex-wrap items-center justify-between gap-2 border-t"
            style={{
              borderColor: 'var(--border-subtle)',
              backgroundColor: 'var(--bg-sunken)',
              color: 'var(--text-tertiary)',
            }}
          >
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5">
                <CellMark value="yes" />
                <span>Built-in</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CellMark value="partial" />
                <span>Partial</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CellMark value="no" />
                <span>Not included</span>
              </span>
            </div>
            <span className="font-mono">last reviewed · v5.4.3</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =====================================================================
   7. CTA banner
   ===================================================================== */

export function CTABanner() {
  return (
    <section className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-3xl p-8 sm:p-12 lg:p-16"
          style={{
            background: 'var(--gradient-aurora)',
            backgroundSize: '200% 200%',
            animation: 'gradient-pan 8s ease infinite',
            boxShadow: 'var(--shadow-xl)',
          }}
        >
          {/* Decorative shapes */}
          <div className="absolute -top-12 -right-12 h-56 w-56 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 h-72 w-72 rounded-full bg-white/15 blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-2 text-white">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-[1.05] tracking-tight mb-4 text-balance">
                Stop hand-designing every asset.
                <br />
                <span className="italic font-medium">Render them.</span>
              </h2>
              <p className="text-base sm:text-lg text-white/95 max-w-2xl leading-relaxed">
                One install, one TypeScript API. From a quick chart PNG to a 60-frame GIF or a stitched MP4 —
                everything you'd need a design tool, a charting lib, and an image lib for, in a single import.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Link
                href="/studio"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white font-bold text-base shadow-[var(--shadow-md)] transition-transform hover:-translate-y-0.5 group"
                style={{ color: '#1a0f3d' }}
              >
                <RocketLaunchIcon className="h-5 w-5" />
                Open the Studio
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/docs#00-start-here"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-white font-bold text-base border-2 border-white/40 hover:bg-white/10 transition-colors"
              >
                Read the docs
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* =====================================================================
   8. Footer
   ===================================================================== */

export function SiteFooter() {
  return (
    <footer
      className="relative pt-16 pb-10 px-4 sm:px-6 lg:px-8 border-t"
      style={{ borderColor: 'var(--border-default)' }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2">
            <Link href="/" className="inline-flex items-center gap-2 mb-4 group/footlogo" aria-label="Apexify.js — home">
              <span
                className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden transition-transform duration-300 group-hover/footlogo:scale-105"
                style={{ boxShadow: 'var(--glow-magenta)' }}
                aria-hidden
              >
                <BrandIcon />
              </span>
              <span className="text-2xl font-black text-grad-aurora">Apexify.js</span>
            </Link>
            <p className="text-sm leading-relaxed max-w-md mb-6" style={{ color: 'var(--text-secondary)' }}>
              Programmatic visual library for Node.js — charts, images, GIFs, and video, all in one TypeScript
              surface. Powered by Rust under the hood.
            </p>
            <div className="flex gap-2">
              <a
                href="https://github.com/EIAS79/apexify.js"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="surface-glass h-10 w-10 inline-flex items-center justify-center rounded-xl lift"
                style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
              </a>
              <a
                href="https://www.npmjs.com/package/apexify.js"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="npm"
                className="surface-glass h-10 w-10 inline-flex items-center justify-center rounded-xl lift"
                style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M0 7.334v8h6.666v1.332H12v-1.332h12v-8H0zm6.666 6.666H5.334v-4H3.999v4H1.335V8.667h5.331v5.333zm4 0v1.336H8.001V8.667h5.334v5.332h-2.669v-.001zm12.001 0h-1.33v-4h-1.337v4h-1.335v-4h-1.33v4h-2.671V8.667h8.003v5.333z" />
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-tertiary)' }}>
              Product
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/gallery" className="hover:text-[var(--accent-magenta)] transition-colors" style={{ color: 'var(--text-secondary)' }}>Gallery</Link></li>
              <li><Link href="/studio" className="hover:text-[var(--accent-magenta)] transition-colors" style={{ color: 'var(--text-secondary)' }}>Studio</Link></li>
              <li><Link href="/docs#00-start-here" className="hover:text-[var(--accent-magenta)] transition-colors" style={{ color: 'var(--text-secondary)' }}>Docs</Link></li>
              <li><Link href="/docs#00-recipes-overview" className="hover:text-[var(--accent-magenta)] transition-colors" style={{ color: 'var(--text-secondary)' }}>Recipes</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-tertiary)' }}>
              Resources
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li><a href="https://github.com/EIAS79/apexify.js" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--accent-magenta)] transition-colors" style={{ color: 'var(--text-secondary)' }}>GitHub</a></li>
              <li><a href="https://www.npmjs.com/package/apexify.js" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--accent-magenta)] transition-colors" style={{ color: 'var(--text-secondary)' }}>npm</a></li>
              <li><a href="https://github.com/EIAS79/apexify.js/issues" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--accent-magenta)] transition-colors" style={{ color: 'var(--text-secondary)' }}>Report issue</a></li>
              <li><Link href="/docs#changelog" className="hover:text-[var(--accent-magenta)] transition-colors" style={{ color: 'var(--text-secondary)' }}>Changelog</Link></li>
            </ul>
          </div>
        </div>

        <div
          className="pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
          style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-tertiary)' }}
        >
          <p>© {new Date().getFullYear()} Apexify.js · Built for the JavaScript community</p>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono" style={{ backgroundColor: 'var(--bg-sunken)', color: 'var(--text-secondary)' }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'var(--success)' }} />
              v5.4.3
            </span>
            <span className="font-mono">MIT licensed</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
