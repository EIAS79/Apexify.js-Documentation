'use client';

import { motion } from 'framer-motion';
import {
  PaintBrushIcon,
  ChartBarIcon,
  PlayIcon,
  FilmIcon,
  Squares2X2Icon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

type Counts = {
  total: number;
  featured: number;
  videos: number;
  gifs: number;
};

const HIGHLIGHT_CHIPS = [
  { label: 'Backgrounds', Icon: PaintBrushIcon },
  { label: 'Charts', Icon: ChartBarIcon },
  { label: 'Animations', Icon: PlayIcon },
  { label: 'Video', Icon: FilmIcon },
  { label: 'Compositions', Icon: Squares2X2Icon },
];

export default function GalleryHero({ counts }: { counts: Counts }) {
  return (
    <section className="relative pt-28 sm:pt-32 lg:pt-36 pb-10 sm:pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end"
        >
          {/* Left — title + subtitle */}
          <div className="lg:col-span-7">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-semibold mb-6"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--accent-magenta) 12%, transparent)',
                color: 'var(--accent-magenta)',
                border: '1px solid color-mix(in srgb, var(--accent-magenta) 35%, transparent)',
              }}
            >
              <SparklesIcon className="h-3.5 w-3.5" />
              <span className="tracking-wide">Apexify gallery · {counts.total} pieces</span>
            </div>

            <h1
              className="text-[clamp(2.5rem,6vw,4.5rem)] font-black leading-[0.98] tracking-tight mb-5 text-balance"
              style={{ color: 'var(--text-primary)' }}
            >
              Recipes you can{' '}
              <span className="text-grad-sunset">lift</span>.
              <br />
              Code you can <span className="italic text-grad-iris">run</span>.
            </h1>

            <p
              className="text-base sm:text-lg max-w-2xl leading-relaxed mb-6 text-pretty"
              style={{ color: 'var(--text-secondary)' }}
            >
              A live, hand-curated set of finished outputs — each one ships with the exact{' '}
              <strong style={{ color: 'var(--text-primary)' }}>TypeScript snippet</strong> that produced it.
              Tap any tile to inspect the source, edit it, run it, and lift it into your own project.
            </p>

            <div className="flex flex-wrap gap-2">
              {HIGHLIGHT_CHIPS.map((c, i) => {
                const Icon = c.Icon;
                return (
                  <motion.span
                    key={c.label}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + i * 0.04, duration: 0.4 }}
                    className="chip"
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color: 'var(--accent-iris)' }} />
                    {c.label}
                  </motion.span>
                );
              })}
            </div>
          </div>

          {/* Right — stat tiles */}
          <div className="lg:col-span-5">
            <div
              className="surface-elevated rounded-2xl p-5 sm:p-6"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.22em]"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  At a glance
                </span>
                <span
                  className="font-mono text-[10px] uppercase tracking-wider"
                  style={{ color: 'var(--text-muted)' }}
                >
                  v5.4.5
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Stat value={counts.total} label="Total items" gradient="sunset" />
                <Stat value={counts.featured} label="Featured" gradient="ember" />
                <Stat value={counts.videos} label="Videos" gradient="iris" />
                <Stat value={counts.gifs} label="GIFs" gradient="aurora" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Stat({
  value,
  label,
  gradient,
}: {
  value: number;
  label: string;
  gradient: 'sunset' | 'ember' | 'iris' | 'aurora';
}) {
  const gradMap = {
    sunset: 'text-grad-sunset',
    ember: 'text-grad-ember',
    iris: 'text-grad-iris',
    aurora: 'text-grad-aurora',
  } as const;
  return (
    <div
      className="rounded-xl px-3.5 py-3"
      style={{
        backgroundColor: 'var(--bg-sunken)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div className={`text-2xl sm:text-3xl font-black ${gradMap[gradient]} tabular-nums`}>{value}</div>
      <div
        className="text-[10px] uppercase tracking-wider font-semibold mt-0.5"
        style={{ color: 'var(--text-tertiary)' }}
      >
        {label}
      </div>
    </div>
  );
}
