'use client';

import { motion, useReducedMotion } from 'framer-motion';
import {
  ChartBarIcon,
  CheckBadgeIcon,
  FilmIcon,
  PaintBrushIcon,
  ServerStackIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

type Counts = {
  total: number;
  featured: number;
  videos: number;
  gifs: number;
  verified: number;
};

const HIGHLIGHT_CHIPS = [
  { label: 'Verified examples', Icon: CheckBadgeIcon },
  { label: 'Node runtime', Icon: ServerStackIcon },
  { label: 'Backgrounds', Icon: PaintBrushIcon },
  { label: 'Charts', Icon: ChartBarIcon },
  { label: 'GIF & video', Icon: FilmIcon },
];

export default function GalleryHero({ counts, version }: { counts: Counts; version: string | null }) {
  const reduce = useReducedMotion();
  return (
    <section className="relative px-4 pb-10 pt-28 sm:px-6 sm:pb-12 sm:pt-32 lg:px-8 lg:pt-36">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduce ? { duration: 0 } : { duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 items-end gap-8 lg:grid-cols-12"
        >
          <div className="lg:col-span-7">
            <div
              className="mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-semibold"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--accent-magenta) 12%, transparent)',
                color: 'var(--accent-magenta)',
                borderColor: 'color-mix(in srgb, var(--accent-magenta) 35%, transparent)',
              }}
            >
              <SparklesIcon className="h-3.5 w-3.5" />
              <span className="tracking-wide">Apexify Gallery · {counts.total} pieces · {counts.verified} verified</span>
            </div>

            <h1 className="mb-5 text-balance text-[clamp(2.5rem,6vw,4.5rem)] font-black leading-[0.98] tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Explore outputs.
              <br />
              <span className="text-grad-sunset">Check the evidence.</span>
            </h1>

            <p className="mb-6 max-w-2xl text-pretty text-base leading-relaxed sm:text-lg" style={{ color: 'var(--text-secondary)' }}>
              The Gallery now distinguishes DOC-5 <strong style={{ color: 'var(--text-primary)' }}>verified executable examples</strong> from
              legacy curated demos. Filter by evidence before treating a card as execution proof, then open verified cards for canonical source and output.
            </p>

            <div className="flex flex-wrap gap-2">
              {HIGHLIGHT_CHIPS.map(({ label, Icon }) => (
                <span key={label} className="chip">
                  <Icon className="h-3.5 w-3.5" style={{ color: 'var(--accent-iris)' }} />
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="surface-elevated rounded-2xl p-5 sm:p-6" style={{ borderColor: 'var(--border-default)' }}>
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: 'var(--text-tertiary)' }}>At a glance</span>
                <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  {version ? `apexify.js ${version}` : 'current package'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Stat value={counts.verified} label="Verified" gradient="aurora" />
                <Stat value={counts.total - counts.verified} label="Legacy curated" gradient="iris" />
                <Stat value={counts.videos} label="Videos" gradient="ember" />
                <Stat value={counts.gifs} label="GIFs" gradient="sunset" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Stat({ value, label, gradient }: { value: number; label: string; gradient: 'sunset' | 'ember' | 'iris' | 'aurora' }) {
  const gradMap = { sunset: 'text-grad-sunset', ember: 'text-grad-ember', iris: 'text-grad-iris', aurora: 'text-grad-aurora' } as const;
  return (
    <div className="rounded-xl border px-3.5 py-3" style={{ backgroundColor: 'var(--bg-sunken)', borderColor: 'var(--border-subtle)' }}>
      <div className={`text-2xl font-black tabular-nums sm:text-3xl ${gradMap[gradient]}`}>{value}</div>
      <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{label}</div>
    </div>
  );
}
