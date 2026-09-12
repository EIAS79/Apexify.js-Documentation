import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRightIcon,
  BeakerIcon,
  BoltIcon,
  BookOpenIcon,
  CheckBadgeIcon,
  CodeBracketIcon,
  CubeTransparentIcon,
  ServerStackIcon,
} from '@heroicons/react/24/outline';
import type { ProductExperienceModel } from '@/lib/product/catalog';
import type { ProductStatus } from '@/lib/product/catalog-data';
import CopyInstallButton from './CopyInstallButton';

function StatusPill({ status }: { status: ProductStatus }) {
  return (
    <span
      className="inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em]"
      data-product-status={status}
      style={{
        color: status === 'CURRENT' ? 'var(--success)' : 'var(--accent-iris)',
        borderColor:
          status === 'CURRENT'
            ? 'color-mix(in srgb, var(--success) 35%, var(--border-default))'
            : 'color-mix(in srgb, var(--accent-iris) 35%, var(--border-default))',
        backgroundColor:
          status === 'CURRENT'
            ? 'color-mix(in srgb, var(--success) 8%, transparent)'
            : 'color-mix(in srgb, var(--accent-iris) 8%, transparent)',
      }}
    >
      {status}
    </span>
  );
}

export function ProductHero({ model }: { model: ProductExperienceModel }) {
  const example = model.heroExample;
  return (
    <section className="relative px-4 pb-16 pt-28 sm:px-6 sm:pb-20 sm:pt-36 lg:px-8 lg:pb-24 lg:pt-40">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-6">
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <StatusPill status="CURRENT" />
            <span className="font-mono text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {model.package.name} {model.package.version} · Node/server
            </span>
          </div>
          <h1
            className="mb-6 text-balance text-[clamp(2.9rem,7vw,5.8rem)] font-black leading-[0.94] tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            Programmatic visuals.
            <br />
            <span className="text-grad-sunset">Verified output.</span>
          </h1>
          <p className="mb-7 max-w-2xl text-pretty text-base leading-relaxed sm:text-lg lg:text-xl" style={{ color: 'var(--text-secondary)' }}>
            Apexify.js is a TypeScript-first Node/server toolkit for raster rendering, charts, scenes, templates,
            GIF/video workflows and procedural audio. This page separates what ships now from the future engine roadmap.
          </p>
          <div className="mb-6 flex flex-wrap gap-3">
            <Link href="/docs/getting-started" className="btn btn-primary !px-5 !py-3">
              <BookOpenIcon className="h-5 w-5" />
              Start with the docs
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
            <Link href={example.href} className="btn btn-secondary !px-5 !py-3">
              <CheckBadgeIcon className="h-5 w-5" />
              Open verified example
            </Link>
          </div>
          <CopyInstallButton command={model.package.installCommand} />
          <p className="mt-3 text-xs leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
            The install command is derived from the same package commit used by the generated API and executable-example evidence.
          </p>
        </div>

        <div className="lg:col-span-6" data-doc7-verified-hero={example.id}>
          <div className="overflow-hidden rounded-3xl border surface-elevated" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-xl)' }}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: 'var(--border-subtle)' }}>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: 'var(--text-tertiary)' }}>
                  DOC-5 verified example
                </p>
                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{example.title}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="apx-badge" data-kind="runtime">Runtime: {example.runtime}</span>
                <StatusPill status="CURRENT" />
              </div>
            </div>
            <div className="relative aspect-[3/2] min-h-[260px]" style={{ backgroundColor: 'var(--bg-sunken)' }}>
              <Image
                src={example.output}
                alt={`Verified output from ${example.title}`}
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-contain p-5"
              />
            </div>
            <div className="border-t" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-canvas)' }}>
              <div className="flex items-center justify-between gap-3 border-b px-4 py-2" style={{ borderColor: 'var(--border-subtle)' }}>
                <span className="font-mono text-[11px]" style={{ color: 'var(--text-tertiary)' }}>authoritative source</span>
                <Link href={example.href} className="text-xs font-bold" style={{ color: 'var(--accent-iris)' }}>
                  source + verification →
                </Link>
              </div>
              <pre className="max-h-64 overflow-auto px-4 py-4 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                <code>{example.source}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function CapabilitySection({ model }: { model: ProductExperienceModel }) {
  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8" aria-labelledby="current-capabilities">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Current package"
          title="What Apexify.js 6 actually ships"
          description="Every card below is resolved against the generated DOC-4 API manifest at build time. Missing or non-current APIs fail the DOC-7 gate."
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {model.capabilities.map((capability) => (
            <article key={capability.id} className="surface-elevated rounded-2xl border p-5 sm:p-6" style={{ borderColor: 'var(--border-default)' }}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl" style={{ backgroundColor: 'color-mix(in srgb, var(--accent-iris) 12%, transparent)' }}>
                  <CubeTransparentIcon className="h-5 w-5" style={{ color: 'var(--accent-iris)' }} />
                </div>
                <StatusPill status={capability.status} />
              </div>
              <h3 className="mb-2 text-xl font-black" style={{ color: 'var(--text-primary)' }}>{capability.title}</h3>
              <p className="mb-4 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{capability.summary}</p>
              {capability.note ? <p className="mb-4 text-xs leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>{capability.note}</p> : null}
              <div className="flex flex-wrap gap-2">
                <Link href={capability.apiHref} className="chip">
                  <CodeBracketIcon className="h-3.5 w-3.5" />
                  {capability.apiMember}()
                </Link>
                {capability.example ? (
                  <Link href={capability.example.href} className="chip">
                    <CheckBadgeIcon className="h-3.5 w-3.5" />
                    verified example
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FeatureTracks({ model }: { model: ProductExperienceModel }) {
  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8" aria-labelledby="feature-tracks">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Build paths"
          title="Follow a capability, not a marketing claim"
          description="Each track connects the current API surface to verified examples where DOC-5 evidence exists."
        />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {model.featureTracks.map((track, index) => (
            <article key={track.id} className="surface-glass rounded-2xl border p-6 sm:p-7" style={{ borderColor: 'var(--border-default)' }}>
              <div className="mb-5 flex items-start gap-4">
                <span className="font-mono text-4xl font-black tabular-nums text-grad-iris">{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--accent-magenta)' }}>{track.eyebrow}</p>
                  <h3 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{track.title}</h3>
                </div>
              </div>
              <p className="mb-5 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{track.summary}</p>
              <div className="flex flex-wrap gap-2">
                {track.api.map((api) => <Link key={api.name} href={api.href} className="chip">{api.name}()</Link>)}
                {track.example ? <Link href={track.example.href} className="chip">verified example →</Link> : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function VerifiedExamples({ model }: { model: ProductExperienceModel }) {
  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8" aria-labelledby="verified-examples">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Executable proof"
          title="Generated from repository-controlled examples"
          description={`These previews come from DOC-5 examples verified against ${model.package.name} ${model.package.version}; they are not hand-written marketing mockups.`}
        />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {model.galleryExamples.map((example) => (
            <Link key={example.id} href={example.href} className="group overflow-hidden rounded-2xl border surface-elevated lift" style={{ borderColor: 'var(--border-default)' }}>
              <div className="relative aspect-[4/3]" style={{ backgroundColor: 'var(--bg-sunken)' }}>
                <Image
                  src={example.preview}
                  alt={example.title}
                  fill
                  loading="lazy"
                  sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
                  className="object-contain p-4 transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </div>
              <div className="p-4">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <StatusPill status="CURRENT" />
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{example.runtime}</span>
                </div>
                <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>{example.title}</h3>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>{example.summary}</p>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-7">
          <Link href="/gallery" className="btn btn-secondary">
            Explore the full Gallery <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export function RoadmapSection({ model }: { model: ProductExperienceModel }) {
  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8" aria-labelledby="roadmap-direction">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-3xl border p-6 sm:p-8 lg:p-10" style={{ borderColor: 'var(--border-default)', backgroundColor: 'color-mix(in srgb, var(--bg-elevated) 86%, transparent)' }}>
          <div className="mb-8 grid gap-5 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="mb-3 inline-flex items-center gap-2">
                <BeakerIcon className="h-5 w-5" style={{ color: 'var(--accent-iris)' }} />
                <StatusPill status="ROADMAP" />
              </div>
              <h2 id="roadmap-direction" className="text-balance text-3xl font-black tracking-tight sm:text-4xl" style={{ color: 'var(--text-primary)' }}>
                The future engine direction is visible — and explicitly not current.
              </h2>
            </div>
            <p className="lg:col-span-5 lg:self-end text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Browser rendering, React/Next adapters, retained realtime updates, engine-native animation, vector work and intelligence belong to the Advanced Engine Program after DOC-12. They are not installed or demonstrated here as shipped APIs.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {model.roadmap.map((item) => (
              <article key={item.id} className="rounded-2xl border p-5" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-sunken)' }}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>{item.title}</h3>
                  <StatusPill status={item.status} />
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{item.summary}</p>
                <p className="mt-3 font-mono text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{item.target}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function EcosystemFooter({ model }: { model: ProductExperienceModel }) {
  return (
    <footer className="border-t px-4 py-12 sm:px-6 lg:px-8" style={{ borderColor: 'var(--border-subtle)' }}>
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="mb-3 inline-flex items-center gap-2">
            <ServerStackIcon className="h-5 w-5" style={{ color: 'var(--accent-magenta)' }} />
            <strong style={{ color: 'var(--text-primary)' }}>Apexify.js {model.package.version}</strong>
          </div>
          <p className="max-w-xl text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Current public product: Node/server rendering and media. Future multi-runtime engine work remains roadmap-labelled until implemented and verified.
          </p>
        </div>
        <FooterGroup title="Build" links={[["Getting started", "/docs/getting-started"], ["API reference", "/api-reference"], ["Examples", "/examples/node.canvas.basic"], ["Gallery", "/gallery"]]} />
        <FooterGroup title="Project" links={[["GitHub", "https://github.com/EIAS79/Apexify.js"], ["Documentation source", "https://github.com/EIAS79/Apexify.js-Documentation"], ["Studio", "/studio"]]} />
      </div>
    </footer>
  );
}

function FooterGroup({ title, links }: { title: string; links: Array<[string, string]> }) {
  return (
    <nav aria-label={title}>
      <h2 className="mb-3 text-xs font-black uppercase tracking-[0.18em]" style={{ color: 'var(--text-tertiary)' }}>{title}</h2>
      <ul className="space-y-2">
        {links.map(([label, href]) => (
          <li key={href}><Link href={href} className="text-sm hover:underline" style={{ color: 'var(--text-secondary)' }}>{label}</Link></li>
        ))}
      </ul>
    </nav>
  );
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="mb-8 max-w-3xl sm:mb-10">
      <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em]" style={{ color: 'var(--accent-magenta)' }}>
        <BoltIcon className="h-4 w-4" />
        {eyebrow}
      </div>
      <h2 className="mb-3 text-balance text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl" style={{ color: 'var(--text-primary)' }}>{title}</h2>
      <p className="text-pretty text-sm leading-relaxed sm:text-base" style={{ color: 'var(--text-secondary)' }}>{description}</p>
    </div>
  );
}
