import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRightIcon,
  BookOpenIcon,
  CheckCircleIcon,
  CodeBracketIcon,
  CommandLineIcon,
  CubeIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import type { ProductExperienceModel } from '@/lib/product/catalog';
import type { ProductStatus } from '@/lib/product/catalog-data';
import CopyInstallButton from './CopyInstallButton';

function StatusLabel({ status }: { status: ProductStatus }) {
  const current = status === 'CURRENT';
  return (
    <span
      data-product-status={status}
      className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[10px] font-semibold tracking-[0.08em]"
      style={{
        color: current ? 'var(--success)' : 'var(--text-secondary)',
        borderColor: current
          ? 'color-mix(in srgb,var(--success) 34%,var(--border))'
          : 'var(--border)',
        background: current
          ? 'color-mix(in srgb,var(--success) 7%,var(--surface-1))'
          : 'var(--surface-1)',
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: current ? 'var(--success)' : 'var(--text-muted)' }} />
      {status}
    </span>
  );
}

function SectionHeading({
  id,
  eyebrow,
  title,
  description,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-10 grid gap-5 border-t pt-6 lg:grid-cols-12 lg:gap-8" style={{ borderColor: 'var(--border)' }}>
      <div className="lg:col-span-7">
        <p className="apx-home-eyebrow">{eyebrow}</p>
        <h2 id={id} className="apx-home-heading">{title}</h2>
      </div>
      <p className="apx-home-copy self-end text-sm lg:col-span-5">{description}</p>
    </div>
  );
}

export function ProductHero({ model }: { model: ProductExperienceModel }) {
  const example = model.heroExample;

  return (
    <section className="px-4 pb-20 pt-28 sm:px-6 sm:pb-24 sm:pt-32 lg:px-8 lg:pb-28 lg:pt-36">
      <div className="mx-auto grid max-w-[88rem] gap-12 lg:grid-cols-12 lg:items-center lg:gap-16">
        <div className="lg:col-span-6">
          <div className="mb-7 flex flex-wrap items-center gap-2">
            <span className="apx-home-eyebrow">PROGRAMMABLE GRAPHICS / NODE RUNTIME</span>
            <StatusLabel status="CURRENT" />
            <span className="apx-home-version">{model.package.name} {model.package.version}</span>
          </div>

          <h1 className="max-w-[11ch] text-balance text-[clamp(3.6rem,8vw,7.4rem)] font-semibold leading-[0.88] tracking-[-0.065em]" style={{ color: 'var(--text)' }}>
            Render visuals with JavaScript.
          </h1>

          <p className="mt-7 max-w-2xl text-pretty text-base leading-8 sm:text-lg" style={{ color: 'var(--text-secondary)' }}>
            Apexify.js is a TypeScript-first rendering and media toolkit for images, text, charts, scenes,
            templates, GIF/video workflows, audio, and programmatic output on Node/server runtimes.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/docs/getting-started" prefetch={false} className="btn btn-primary">
              <BookOpenIcon className="h-4 w-4" />
              Start with the docs
            </Link>
            <Link href="/gallery" prefetch={false} className="btn btn-secondary">
              <PhotoIcon className="h-4 w-4" />
              Inspect outputs
            </Link>
          </div>

          <div className="mt-5 max-w-lg">
            <CopyInstallButton command={model.package.installCommand} />
          </div>

          <div className="mt-10 max-w-2xl border-y" style={{ borderColor: 'var(--border)' }}>
            <div className="grid grid-cols-2 sm:grid-cols-4">
              {[
                [String(model.capabilities.length), 'documented domains'],
                [String(model.galleryExamples.length), 'output examples'],
                ['TypeScript', 'first authoring'],
                ['Node', 'current runtime'],
              ].map(([value, label], index) => (
                <div
                  key={label}
                  className="px-3 py-4 first:pl-0 sm:border-l sm:first:border-l-0"
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  <strong className="block font-mono text-sm font-semibold" style={{ color: index < 2 ? 'var(--accent)' : 'var(--text)' }}>
                    {value}
                  </strong>
                  <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--text-muted)' }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-6" data-doc7-verified-hero={example.id}>
          <div className="apx-engine-panel overflow-hidden">
            <div className="flex items-center justify-between gap-4 border-b px-4 py-3" style={{ borderColor: 'var(--border)' }}>
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--text-muted)' }}>
                  Repository-verified output
                </p>
                <p className="mt-0.5 text-sm font-semibold" style={{ color: 'var(--text)' }}>{example.title}</p>
              </div>
              <Link href={example.href} prefetch={false} className="font-mono text-[11px] font-semibold" style={{ color: 'var(--accent)' }}>
                proof ↗
              </Link>
            </div>

            <div className="relative aspect-[16/10]" style={{ background: 'var(--surface-2)' }}>
              <div className="absolute inset-0 opacity-40" aria-hidden style={{
                backgroundImage: 'linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px)',
                backgroundSize: '32px 32px',
              }} />
              <Image
                src={example.output}
                alt={`Verified output from ${example.title}`}
                fill
                priority
                sizes="(min-width: 1024px) 48vw, 100vw"
                className="relative object-contain p-6 sm:p-8"
              />
            </div>

            <div className="apx-engine-panel--dark">
              <div className="apx-code-header">
                <span>source / {example.id}</span>
                <span>{model.package.name}</span>
              </div>
              <pre
                tabIndex={0}
                aria-label={`${example.title} verified source code`}
                className="!m-0 max-h-72 overflow-auto !rounded-none !border-0 !bg-transparent px-4 py-4 text-[11px] leading-5 outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] sm:text-xs"
              >
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
    <section className="apx-home-section" aria-labelledby="current-capabilities">
      <div className="apx-home-shell">
        <SectionHeading
          id="current-capabilities"
          eyebrow="ENGINE SURFACE"
          title="Graphics primitives, composition, and media output."
          description="The current package stays centered on concrete rendering work: build a canvas, draw and transform visual data, compose reusable structures, then emit an artifact."
        />

        <div className="grid border-y md:grid-cols-2 xl:grid-cols-3" style={{ borderColor: 'var(--border)' }}>
          {model.capabilities.map((capability) => (
            <article
              key={capability.id}
              className="border-b px-0 py-6 md:px-6 md:first:pl-0 xl:border-r xl:last:border-r-0"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <span className="grid h-8 w-8 place-items-center rounded-md border" style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }}>
                  <CubeIcon className="h-4 w-4" style={{ color: 'var(--accent)' }} />
                </span>
                <StatusLabel status={capability.status} />
              </div>
              <h3 className="text-xl font-semibold tracking-[-0.025em]" style={{ color: 'var(--text)' }}>{capability.title}</h3>
              <p className="mt-2 text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>{capability.summary}</p>
              {capability.note ? <p className="mt-3 text-xs leading-5" style={{ color: 'var(--text-muted)' }}>{capability.note}</p> : null}
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href={capability.apiHref} prefetch={false} className="chip">
                  <CodeBracketIcon className="h-3.5 w-3.5" />
                  {capability.apiMember}()
                </Link>
                {capability.example ? (
                  <Link href={capability.example.href} prefetch={false} className="chip">
                    output →
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
    <section className="apx-home-section" aria-labelledby="feature-tracks">
      <div className="apx-home-shell">
        <SectionHeading
          id="feature-tracks"
          eyebrow="RENDER PIPELINE"
          title="Move from input to output without losing the model."
          description="Apexify keeps ordinary work approachable while still providing scenes, templates, batch/media workflows, and deeper composition tools where the job requires them."
        />

        <div className="apx-pipeline">
          {model.featureTracks.slice(0, 4).map((track, index) => (
            <article key={track.id}>
              <div className="apx-pipeline__index">{String(index + 1).padStart(2, '0')}</div>
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--text-muted)' }}>{track.eyebrow}</p>
                <h3 className="mt-1">{track.title}</h3>
                <p>{track.summary}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {track.api.slice(0, 2).map((api) => (
                    <Link key={api.name} href={api.href} prefetch={false} className="font-mono text-[11px] font-semibold" style={{ color: 'var(--accent)' }}>
                      {api.name}()
                    </Link>
                  ))}
                </div>
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
    <section className="apx-home-section" aria-labelledby="verified-examples">
      <div className="apx-home-shell">
        <SectionHeading
          id="verified-examples"
          eyebrow="OUTPUT / EVIDENCE"
          title="Inspect what the engine actually renders."
          description={`These examples are repository-controlled outputs associated with ${model.package.name} ${model.package.version}. The output stays primary; source and evidence remain one click away.`}
        />

        <div className="grid gap-px overflow-hidden rounded-[var(--radius-lg)] border sm:grid-cols-2 lg:grid-cols-4" style={{ borderColor: 'var(--border)', background: 'var(--border)' }}>
          {model.galleryExamples.slice(0, 8).map((example) => (
            <Link
              key={example.id}
              href={example.href}
              prefetch={false}
              className="group block min-w-0"
              style={{ background: 'var(--surface-1)' }}
            >
              <div className="relative aspect-[4/3] overflow-hidden" style={{ background: 'var(--surface-2)' }}>
                <Image
                  src={example.preview}
                  alt={example.title}
                  fill
                  sizes="(min-width: 1024px) 24vw, (min-width: 640px) 50vw, 100vw"
                  className="object-contain p-4 transition-transform duration-200 group-hover:scale-[1.015]"
                />
              </div>
              <div className="border-t px-4 py-3" style={{ borderColor: 'var(--border-subtle)' }}>
                <p className="font-mono text-[10px] uppercase tracking-[0.08em]" style={{ color: 'var(--text-muted)' }}>{example.runtime} / verified</p>
                <h3 className="mt-1 truncate text-sm font-semibold" style={{ color: 'var(--text)' }}>{example.title}</h3>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-4">
          <Link href="/gallery" prefetch={false} className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--accent)' }}>
            Browse the complete gallery <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export function RoadmapSection({ model }: { model: ProductExperienceModel }) {
  return (
    <section className="apx-home-section" aria-labelledby="roadmap-direction">
      <div className="apx-home-shell">
        <SectionHeading
          id="roadmap-direction"
          eyebrow="ENGINE DIRECTION"
          title="One rendering model, more runtimes over time."
          description="Future runtime and tooling work stays visibly separate from current package capability. Roadmap items are labelled as roadmap until the implementation, tests, packaging, and documentation actually ship."
        />

        <div className="apx-roadmap-map">
          {model.roadmap.map((item) => (
            <article key={item.id}>
              <div className="mb-4 flex items-start justify-between gap-3">
                <CommandLineIcon className="h-4 w-4" style={{ color: 'var(--accent)' }} />
                <StatusLabel status={item.status} />
              </div>
              <h3>{item.title}</h3>
              <p>{item.summary}</p>
              <p className="font-mono !text-[10px] uppercase tracking-[0.08em]" style={{ color: 'var(--text-muted)' }}>{item.target}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function EcosystemFooter({ model }: { model: ProductExperienceModel }) {
  return (
    <footer className="border-t px-4 py-12 sm:px-6 lg:px-8" style={{ borderColor: 'var(--border)' }}>
      <div className="mx-auto grid max-w-[88rem] gap-10 md:grid-cols-12">
        <div className="md:col-span-6">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="h-4 w-4" style={{ color: 'var(--success)' }} />
            <strong className="text-sm" style={{ color: 'var(--text)' }}>Apexify.js {model.package.version}</strong>
          </div>
          <p className="mt-3 max-w-xl text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
            Programmatic rendering and media tooling with generated API evidence, executable examples, and explicitly labelled future work.
          </p>
        </div>
        <div className="md:col-span-3">
          <p className="apx-home-eyebrow">BUILD</p>
          <div className="mt-3 grid gap-2 text-sm">
            <Link href="/docs/getting-started">Documentation</Link>
            <Link href="/api-reference">API Reference</Link>
            <Link href="/studio">Studio</Link>
          </div>
        </div>
        <div className="md:col-span-3">
          <p className="apx-home-eyebrow">EXPLORE</p>
          <div className="mt-3 grid gap-2 text-sm">
            <Link href="/gallery">Gallery</Link>
            <Link href={model.heroExample.href}>Verified output</Link>
            <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{model.package.name}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
