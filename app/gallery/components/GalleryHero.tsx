import {
  ChartBarIcon,
  CheckBadgeIcon,
  FilmIcon,
  PaintBrushIcon,
  ServerStackIcon,
} from '@heroicons/react/24/outline';

type Counts = {
  total: number;
  featured: number;
  videos: number;
  gifs: number;
  verified: number;
};

const HIGHLIGHTS = [
  { label: 'Verified examples', Icon: CheckBadgeIcon },
  { label: 'Node runtime', Icon: ServerStackIcon },
  { label: 'Backgrounds', Icon: PaintBrushIcon },
  { label: 'Charts', Icon: ChartBarIcon },
  { label: 'GIF & video', Icon: FilmIcon },
];

export default function GalleryHero({ counts, version }: { counts: Counts; version: string | null }) {
  return (
    <section className="px-4 pb-10 pt-28 sm:px-6 sm:pb-12 sm:pt-32 lg:px-8">
      <div className="mx-auto grid max-w-[88rem] gap-8 border-b pb-10 lg:grid-cols-12 lg:items-end" style={{ borderColor: 'var(--border)' }}>
        <div className="lg:col-span-8">
          <p className="apx-home-eyebrow">OUTPUT LIBRARY / {version ? `APEXIFY.JS ${version}` : 'CURRENT PACKAGE'}</p>
          <h1 className="mt-3 max-w-[12ch] text-balance text-[clamp(3rem,7vw,6.2rem)] font-semibold leading-[0.9] tracking-[-0.06em]" style={{ color: 'var(--text)' }}>
            See what the renderer produces.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 sm:text-lg" style={{ color: 'var(--text-secondary)' }}>
            Browse current rendering output, distinguish repository-verified examples from retained legacy demonstrations, and open an item to inspect its source and provenance.
          </p>
          <div className="mt-7 flex flex-wrap gap-2">
            {HIGHLIGHTS.map(({ label, Icon }) => (
              <span key={label} className="chip">
                <Icon className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 lg:justify-self-end">
          <dl className="grid min-w-[18rem] grid-cols-2 border" style={{ borderColor: 'var(--border)' }}>
            <Stat value={counts.verified} label="verified" />
            <Stat value={counts.total} label="total" />
            <Stat value={counts.videos} label="video" />
            <Stat value={counts.gifs} label="GIF" />
          </dl>
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="border-b border-r p-3 even:border-r-0 [&:nth-last-child(-n+2)]:border-b-0" style={{ borderColor: 'var(--border-subtle)' }}>
      <dt className="font-mono text-[10px] font-semibold uppercase tracking-[0.09em]" style={{ color: 'var(--text-muted)' }}>{label}</dt>
      <dd className="mt-1 font-mono text-xl font-semibold tabular-nums" style={{ color: 'var(--text)' }}>{value}</dd>
    </div>
  );
}
