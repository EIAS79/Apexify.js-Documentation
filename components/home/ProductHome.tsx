import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRightIcon,
  BeakerIcon,
  BookOpenIcon,
  CheckBadgeIcon,
  CodeBracketIcon,
  CubeTransparentIcon,
  PlayIcon,
  ServerStackIcon,
  SparklesIcon,
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
        borderColor: status === 'CURRENT'
          ? 'color-mix(in srgb, var(--success) 35%, var(--border-default))'
          : 'color-mix(in srgb, var(--accent-iris) 35%, var(--border-default))',
        backgroundColor: status === 'CURRENT'
          ? 'color-mix(in srgb, var(--success) 8%, transparent)'
          : 'color-mix(in srgb, var(--accent-iris) 8%, transparent)',
      }}
    >
      {status}
    </span>
  );
}

function SectionHeading({ id, eyebrow, title, description }: { id: string; eyebrow: string; title: string; description: string }) {
  return (
    <div className="mb-8 grid gap-3 sm:mb-10 lg:grid-cols-12 lg:items-end lg:gap-8">
      <div className="lg:col-span-7">
        <p className="mb-2 text-[11px] font-black uppercase tracking-[0.22em]" style={{ color: 'var(--accent-magenta)' }}>{eyebrow}</p>
        <h2 id={id} className="text-balance text-3xl font-black tracking-[-0.035em] sm:text-4xl lg:text-5xl" style={{ color: 'var(--text-primary)' }}>{title}</h2>
      </div>
      <p className="max-w-2xl text-sm leading-7 lg:col-span-5 lg:justify-self-end" style={{ color: 'var(--text-secondary)' }}>{description}</p>
    </div>
  );
}

export function ProductHero({ model }: { model: ProductExperienceModel }) {
  const example = model.heroExample;
  return (
    <section className="relative px-4 pb-20 pt-28 sm:px-6 sm:pb-24 sm:pt-36 lg:px-8 lg:pb-28 lg:pt-40">
      <div className="pointer-events-none absolute inset-x-0 top-20 -z-10 mx-auto h-[34rem] max-w-6xl rounded-[999px] opacity-60 blur-3xl" aria-hidden style={{ background: 'radial-gradient(circle at 28% 40%, color-mix(in srgb, var(--accent-iris) 26%, transparent), transparent 44%), radial-gradient(circle at 72% 45%, color-mix(in srgb, var(--accent-magenta) 24%, transparent), transparent 42%)' }} />
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-7">
          <div className="mb-7 inline-flex flex-wrap items-center gap-2 rounded-full border px-3 py-1.5" style={{ borderColor: 'var(--border-default)', backgroundColor: 'color-mix(in srgb, var(--bg-raised) 76%, transparent)' }}>
            <SparklesIcon className="h-4 w-4" style={{ color: 'var(--accent-magenta)' }} />
            <StatusPill status="CURRENT" />
            <span className="font-mono text-[11px] sm:text-xs" style={{ color: 'var(--text-tertiary)' }}>{model.package.name} {model.package.version} · Node/server</span>
          </div>
          <h1 className="mb-6 text-balance text-[clamp(3.2rem,8vw,6.8rem)] font-black leading-[0.9] tracking-[-0.055em]" style={{ color: 'var(--text-primary)' }}>
            Draw <span className="text-grad-aurora">anything</span>.<br />From a <span className="italic text-grad-ember">script</span>.
          </h1>
          <p className="mb-8 max-w-2xl text-pretty text-base leading-8 sm:text-lg lg:text-xl" style={{ color: 'var(--text-secondary)' }}>
            A TypeScript-first Node rendering and media toolkit for images, charts, scenes, templates, GIF/video workflows and procedural audio — presented with repository-verified package output.
          </p>
          <div className="mb-5 flex flex-wrap gap-3">
            <Link href="/studio" prefetch={false} className="btn btn-primary !px-5 !py-3.5"><PlayIcon className="h-5 w-5" />Open Studio<ArrowRightIcon className="h-4 w-4" /></Link>
            <Link href="/docs/getting-started" prefetch={false} className="btn btn-secondary !px-5 !py-3.5"><BookOpenIcon className="h-5 w-5" />Read the docs</Link>
          </div>
          <CopyInstallButton command={model.package.installCommand} />
          <div className="mt-8 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[[''+model.capabilities.length,'verified domains'],[''+model.galleryExamples.length,'gallery proofs'],['DOC-4','API truth'],['DOC-5','output proof']].map(([value,label]) => (
              <div key={label} className="surface-glass rounded-xl border px-4 py-3" style={{ borderColor: 'var(--border-subtle)' }}><strong className="block text-2xl font-black text-grad-sunset">{value}</strong><span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{label}</span></div>
            ))}
          </div>
        </div>

        <div className="relative lg:col-span-5" data-doc7-verified-hero={example.id}>
          <div className="pointer-events-none absolute -inset-10 -z-10 rounded-[3rem] opacity-60 blur-3xl" style={{ background: 'radial-gradient(closest-side, color-mix(in srgb, var(--accent-magenta) 38%, transparent), transparent 72%)' }} aria-hidden />
          <div className="overflow-hidden rounded-2xl border surface-elevated" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-xl)' }}>
            <div className="flex items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-sunken)' }}>
              <div className="flex items-center gap-1.5" aria-hidden><span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" /><span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" /><span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" /></div>
              <span className="truncate font-mono text-[11px]" style={{ color: 'var(--text-tertiary)' }}>verified / {example.id}</span>
              <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: 'var(--success)' }}>DOC-5</span>
            </div>
            <div className="relative aspect-[16/10]" style={{ backgroundColor: 'var(--bg-sunken)' }}>
              <Image src={example.output} alt={`Verified output from ${example.title}`} fill priority sizes="(min-width: 1024px) 40vw, 100vw" className="object-contain p-5" />
              <div className="absolute bottom-3 right-3 rounded-md border border-white/10 bg-black/55 px-2 py-1 text-[10px] font-bold text-white backdrop-blur">rendered with apexify.js</div>
            </div>
            <div className="border-t" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-canvas)' }}>
              <div className="flex items-center justify-between border-b px-4 py-2" style={{ borderColor: 'var(--border-subtle)' }}><span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>authoritative source</span><Link href={example.href} prefetch={false} className="text-xs font-bold" style={{ color: 'var(--accent-iris)' }}>proof →</Link></div>
              <pre className="max-h-64 overflow-auto px-4 py-4 text-[11px] leading-5 sm:text-xs" style={{ color: 'var(--text-secondary)' }}><code>{example.source}</code></pre>
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
        <SectionHeading id="current-capabilities" eyebrow="Current package" title="One toolkit, multiple visual systems" description="Every capability resolves against the DOC-4 API manifest. The presentation is varied again without sacrificing current package truth." />
        <div className="grid auto-rows-[minmax(14rem,auto)] grid-cols-1 gap-4 md:grid-cols-6">
          {model.capabilities.map((capability, index) => (
            <article key={capability.id} className={`relative overflow-hidden rounded-2xl border p-5 sm:p-6 ${index === 0 ? 'md:col-span-4 md:row-span-2' : index % 3 === 0 ? 'md:col-span-3' : 'md:col-span-2'}`} style={{ borderColor: 'var(--border-default)', background: index === 0 ? 'linear-gradient(145deg, color-mix(in srgb, var(--accent-iris) 11%, var(--bg-elevated)), color-mix(in srgb, var(--accent-magenta) 7%, var(--bg-raised)))' : 'var(--bg-elevated)', boxShadow: 'var(--shadow-md)' }}>
              <div className="mb-5 flex items-center justify-between gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl" style={{ backgroundColor: 'color-mix(in srgb, var(--accent-iris) 12%, transparent)' }}><CubeTransparentIcon className="h-5 w-5" style={{ color: 'var(--accent-iris)' }} /></div>{index === 0 ? <StatusPill status={capability.status} /> : null}</div>
              <h3 className={`${index === 0 ? 'text-3xl sm:text-4xl' : 'text-xl'} mb-2 font-black tracking-tight`} style={{ color: 'var(--text-primary)' }}>{capability.title}</h3>
              <p className="mb-5 max-w-xl text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>{capability.summary}</p>
              {capability.note ? <p className="mb-4 text-xs leading-6" style={{ color: 'var(--text-tertiary)' }}>{capability.note}</p> : null}
              <div className="flex flex-wrap gap-2"><Link href={capability.apiHref} prefetch={false} className="chip"><CodeBracketIcon className="h-3.5 w-3.5" />{capability.apiMember}()</Link>{capability.example ? <Link href={capability.example.href} prefetch={false} className="chip"><CheckBadgeIcon className="h-3.5 w-3.5" />example</Link> : null}</div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FeatureTracks({ model }: { model: ProductExperienceModel }) {
  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8" aria-labelledby="feature-tracks"><div className="mx-auto max-w-7xl">
      <SectionHeading id="feature-tracks" eyebrow="Build paths" title="Follow the work, not a wall of cards" description="Task-oriented tracks connect directly to actual ApexPainter APIs and verified examples." />
      <div className="overflow-hidden rounded-3xl border" style={{ borderColor: 'var(--border-default)', backgroundColor: 'color-mix(in srgb, var(--bg-elevated) 80%, transparent)' }}>
        {model.featureTracks.map((track,index) => <article key={track.id} className="grid gap-4 border-b p-5 last:border-b-0 sm:p-7 lg:grid-cols-[5rem_minmax(0,1fr)_auto] lg:items-center" style={{ borderColor: 'var(--border-subtle)' }}><span className="font-mono text-3xl font-black text-grad-iris">{String(index+1).padStart(2,'0')}</span><div><p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--accent-magenta)' }}>{track.eyebrow}</p><h3 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{track.title}</h3><p className="mt-2 max-w-3xl text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>{track.summary}</p></div><div className="flex flex-wrap gap-2 lg:max-w-xs lg:justify-end">{track.api.map(api => <Link key={api.name} href={api.href} prefetch={false} className="chip">{api.name}()</Link>)}{track.example ? <Link href={track.example.href} prefetch={false} className="chip">proof →</Link> : null}</div></article>)}
      </div>
    </div></section>
  );
}

export function VerifiedExamples({ model }: { model: ProductExperienceModel }) {
  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8" aria-labelledby="verified-examples"><div className="mx-auto max-w-7xl">
      <SectionHeading id="verified-examples" eyebrow="Executable proof" title="A wall of actual output" description={`Repository-controlled examples verified against ${model.package.name} ${model.package.version}; no copied marketing screenshots.`} />
      <div className="grid grid-cols-1 gap-4 md:auto-rows-[15rem] md:grid-cols-4">{model.galleryExamples.slice(0,8).map((example,index) => <Link key={example.id} href={example.href} prefetch={false} className={`group relative overflow-hidden rounded-2xl border ${index===0?'md:col-span-2 md:row-span-2':index===3?'md:col-span-2':'md:col-span-1'}`} style={{ borderColor:'var(--border-default)', backgroundColor:'var(--bg-sunken)', boxShadow:'var(--shadow-md)' }}><Image src={example.preview} alt={example.title} fill loading={index<2?'eager':'lazy'} sizes="(min-width: 768px) 50vw, 100vw" className="object-contain p-4 transition-transform duration-300 group-hover:scale-[1.025]"/><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/55 to-transparent p-4 pt-12 text-white"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/70">{example.runtime} · verified</p><h3 className="mt-1 font-bold">{example.title}</h3></div></Link>)}</div>
      <div className="mt-7"><Link href="/gallery" prefetch={false} className="btn btn-secondary">Explore Gallery <ArrowRightIcon className="h-4 w-4" /></Link></div>
    </div></section>
  );
}

export function RoadmapSection({ model }: { model: ProductExperienceModel }) {
  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8" aria-labelledby="roadmap-direction"><div className="mx-auto max-w-7xl rounded-3xl border p-6 sm:p-8 lg:p-10" style={{ borderColor:'var(--border-default)', background:'linear-gradient(145deg, color-mix(in srgb,var(--bg-elevated) 92%,transparent), color-mix(in srgb,var(--accent-iris) 5%,var(--bg-raised)))' }}><div className="mb-8 grid gap-5 lg:grid-cols-12"><div className="lg:col-span-7"><div className="mb-3 inline-flex items-center gap-2"><BeakerIcon className="h-5 w-5" style={{ color:'var(--accent-iris)' }}/><StatusPill status="ROADMAP"/></div><h2 id="roadmap-direction" className="text-balance text-3xl font-black tracking-tight sm:text-4xl" style={{ color:'var(--text-primary)' }}>Future engine work stays visible without pretending it ships today.</h2></div><p className="text-sm leading-7 lg:col-span-5 lg:self-end" style={{ color:'var(--text-secondary)' }}>Browser rendering, React/Next adapters, retained realtime updates, animation, vector work and intelligence remain roadmap work until their owning phases actually ship.</p></div><div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">{model.roadmap.map(item => <article key={item.id} className="rounded-2xl border p-5" style={{ borderColor:'var(--border-subtle)', backgroundColor:'var(--bg-sunken)' }}><div className="mb-3 flex items-center justify-between gap-3"><h3 className="font-bold" style={{ color:'var(--text-primary)' }}>{item.title}</h3><StatusPill status={item.status}/></div><p className="text-sm leading-6" style={{ color:'var(--text-secondary)' }}>{item.summary}</p><p className="mt-3 font-mono text-[11px]" style={{ color:'var(--text-tertiary)' }}>{item.target}</p></article>)}</div></div></section>
  );
}

export function EcosystemFooter({ model }: { model: ProductExperienceModel }) {
  return (
    <footer className="border-t px-4 py-12 sm:px-6 lg:px-8" style={{ borderColor:'var(--border-subtle)' }}><div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-4"><div className="md:col-span-2"><div className="mb-3 inline-flex items-center gap-2"><ServerStackIcon className="h-5 w-5" style={{ color:'var(--accent-magenta)' }}/><strong style={{ color:'var(--text-primary)' }}>Apexify.js</strong></div><p className="max-w-xl text-sm leading-7" style={{ color:'var(--text-secondary)' }}>Current package truth: {model.package.name} {model.package.version}. Public examples and API links are resolved from generated documentation evidence.</p></div><div><p className="mb-3 text-xs font-black uppercase tracking-wider" style={{ color:'var(--text-tertiary)' }}>Build</p><div className="grid gap-2 text-sm"><Link href="/docs/getting-started">Documentation</Link><Link href="/api-reference">API Reference</Link><Link href="/studio">Studio</Link></div></div><div><p className="mb-3 text-xs font-black uppercase tracking-wider" style={{ color:'var(--text-tertiary)' }}>Explore</p><div className="grid gap-2 text-sm"><Link href="/gallery">Gallery</Link><Link href={model.heroExample.href}>Verified example</Link><span className="font-mono text-xs" style={{ color:'var(--text-tertiary)' }}>{model.package.version}</span></div></div></div></footer>
  );
}
