import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRightIcon,
  CheckIcon,
  CodeBracketIcon,
  CommandLineIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import type { ProductExperienceModel } from '@/lib/product/catalog';
import type { ProductStatus } from '@/lib/product/catalog-data';
import CopyInstallButton from './CopyInstallButton';

function StatusBadge({ status }: { status: ProductStatus }) {
  return (
    <span className="apx-status-badge" data-status={status} data-product-status={status}>
      <span className="apx-status-badge__dot" />
      {status}
    </span>
  );
}

function SectionIntro({
  index,
  eyebrow,
  title,
  body,
}: {
  index: string;
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <header className="apx-editorial-intro">
      <div className="apx-editorial-intro__index">{index}</div>
      <div className="apx-editorial-intro__main">
        <p className="apx-kicker">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      <p className="apx-editorial-intro__body">{body}</p>
    </header>
  );
}

function OutputCard({
  example,
  className = '',
  priority = false,
  label,
}: {
  example: ProductExperienceModel['galleryExamples'][number];
  className?: string;
  priority?: boolean;
  label?: string;
}) {
  return (
    <Link
      href={example.href}
      prefetch={false}
      className={`apx-output-card ${className}`}
      aria-label={`Open verified example: ${example.title}`}
    >
      <div className="apx-output-card__media">
        <Image
          src={example.preview}
          alt={example.title}
          fill
          priority={priority}
          sizes="(min-width: 1200px) 38vw, (min-width: 768px) 52vw, 92vw"
          className="object-contain"
        />
      </div>
      <div className="apx-output-card__meta">
        <span>{label ?? example.runtime}</span>
        <strong>{example.title}</strong>
        <span aria-hidden>↗</span>
      </div>
    </Link>
  );
}

export function ProductHero({ model }: { model: ProductExperienceModel }) {
  const gallery = model.galleryExamples;
  const lead = gallery.find((item) => item.id === 'node.integration.report') ?? gallery[0];
  const secondary = gallery.find((item) => item.id === 'node.canvas.basic') ?? gallery[1] ?? lead;
  const tertiary = gallery.find((item) => item.id === 'node.gif.basic') ?? gallery[2] ?? secondary;

  return (
    <section className="apx-hero">
      <div className="apx-hero__shell">
        <div className="apx-hero__copy">
          <div className="apx-hero__meta">
            <span className="apx-kicker">CREATIVE RENDERING ENGINE / NODE</span>
            <StatusBadge status="CURRENT" />
            <span className="apx-hero__version">{model.package.name} {model.package.version}</span>
          </div>

          <h1>
            <span>Code the visual.</span>
            <span className="apx-hero__serif">Control the output.</span>
          </h1>

          <p className="apx-hero__lede">
            Apexify.js turns JavaScript into designed output: images, type, charts, scenes,
            templates, GIF/video workflows, and procedural media — composed on the server with
            explicit APIs and inspectable results.
          </p>

          <div className="apx-hero__actions">
            <Link href="/gallery" prefetch={false} className="apx-cta apx-cta--primary">
              Explore the output
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
            <Link href="/docs/getting-started" prefetch={false} className="apx-cta apx-cta--ghost">
              Read the docs
            </Link>
          </div>

          <div className="apx-hero__install">
            <CopyInstallButton command={model.package.installCommand} />
          </div>

          <div className="apx-hero__proof">
            <div>
              <strong>{model.capabilities.length}</strong>
              <span>current domains</span>
            </div>
            <div>
              <strong>{model.galleryExamples.length}</strong>
              <span>verified outputs</span>
            </div>
            <div>
              <strong>TS</strong>
              <span>first authoring</span>
            </div>
            <div>
              <strong>Node</strong>
              <span>current runtime</span>
            </div>
          </div>
        </div>

        <div className="apx-hero-stage" aria-label="Verified Apexify.js output composition">
          <div className="apx-hero-stage__poster">
            <span>APX / OUTPUT</span>
            <span>06.00</span>
          </div>
          <OutputCard example={lead} className="apx-output-card--hero" priority label="composition" />
          <OutputCard example={secondary} className="apx-output-card--float-a" label="canvas" />
          <OutputCard example={tertiary} className="apx-output-card--float-b" label="media" />
          <div className="apx-hero-stage__stamp">
            <span>PROGRAMMABLE</span>
            <strong>VISUAL</strong>
            <span>SYSTEMS</span>
          </div>
        </div>
      </div>

      <div className="apx-capability-marquee" aria-label="Current capabilities">
        <div className="apx-capability-marquee__track">
          {[...model.capabilities, ...model.capabilities].map((capability, index) => (
            <span key={`${capability.id}-${index}`}>
              {capability.title}
              <i aria-hidden>✦</i>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CapabilitySection({ model }: { model: ProductExperienceModel }) {
  const canvas = model.galleryExamples.find((item) => item.id === 'node.canvas.basic') ?? model.galleryExamples[0];
  const chart = model.galleryExamples.find((item) => item.id === 'node.chart.bar') ?? model.galleryExamples[1] ?? canvas;
  const report = model.galleryExamples.find((item) => item.id === 'node.integration.report') ?? model.galleryExamples[2] ?? chart;

  return (
    <section className="apx-editorial-section apx-editorial-section--systems" aria-labelledby="visual-systems">
      <div className="apx-home-shell">
        <SectionIntro
          index="01"
          eyebrow="VISUAL SYSTEMS"
          title="Not a canvas demo. A programmable design surface."
          body="Apexify’s current Node runtime spans primitive drawing, typography, structured charts, reusable composition, templates, and media workflows. The interface stays explicit while the output can be highly visual."
        />

        <div className="apx-feature-story">
          <article className="apx-feature-story__hero">
            <div className="apx-feature-story__copy">
              <span className="apx-feature-story__number">A</span>
              <p className="apx-kicker">COMPOSE</p>
              <h3>Build from pixels to reusable scenes.</h3>
              <p>
                Start with a canvas, layer imagery and text, then move into ordered scenes and
                reusable templates without changing the mental model.
              </p>
              <div className="apx-feature-story__links">
                {model.capabilities.slice(0, 3).map((capability) => (
                  <Link key={capability.id} href={capability.apiHref} prefetch={false}>
                    {capability.apiMember}()
                  </Link>
                ))}
              </div>
            </div>
            <div className="apx-feature-story__visual apx-feature-story__visual--ink">
              <Image src={report.preview} alt={report.title} fill sizes="(min-width: 1024px) 50vw, 90vw" className="object-contain" />
            </div>
          </article>

          <article className="apx-feature-story__split">
            <div className="apx-feature-story__visual apx-feature-story__visual--acid">
              <Image src={canvas.preview} alt={canvas.title} fill sizes="(min-width: 1024px) 35vw, 90vw" className="object-contain" />
            </div>
            <div className="apx-feature-story__copy">
              <span className="apx-feature-story__number">B</span>
              <p className="apx-kicker">DRAW + TYPE</p>
              <h3>Make layout part of the program.</h3>
              <p>
                Images, shapes, text, measurements, and explicit canvas state give you the pieces
                for repeatable server-side graphics instead of screenshot automation.
              </p>
            </div>
          </article>

          <article className="apx-feature-story__split apx-feature-story__split--reverse">
            <div className="apx-feature-story__copy">
              <span className="apx-feature-story__number">C</span>
              <p className="apx-kicker">DATA → IMAGE</p>
              <h3>Turn structured data into visual artifacts.</h3>
              <p>
                Render charts and report-like compositions as deterministic image output, then move
                the same workflow into templates, GIFs, video, or generated media.
              </p>
            </div>
            <div className="apx-feature-story__visual apx-feature-story__visual--coral">
              <Image src={chart.preview} alt={chart.title} fill sizes="(min-width: 1024px) 35vw, 90vw" className="object-contain" />
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

export function FeatureTracks({ model }: { model: ProductExperienceModel }) {
  return (
    <section className="apx-editorial-section apx-editorial-section--workflow" aria-labelledby="render-workflow">
      <div className="apx-home-shell">
        <SectionIntro
          index="02"
          eyebrow="ENGINE GRAMMAR"
          title="A rendering workflow you can reason about."
          body="The homepage should show how the engine thinks. Each step maps to current APIs and current runtime capability instead of hiding the system behind decorative UI."
        />

        <div className="apx-workflow-map" role="list">
          {model.featureTracks.map((track, index) => (
            <article key={track.id} className="apx-workflow-node" role="listitem">
              <div className="apx-workflow-node__top">
                <span>{String(index + 1).padStart(2, '0')}</span>
                <span>{track.eyebrow}</span>
              </div>
              <h3>{track.title}</h3>
              <p>{track.summary}</p>
              <div className="apx-workflow-node__apis">
                {track.api.map((api) => (
                  <Link key={api.name} href={api.href} prefetch={false}>
                    {api.name}()
                  </Link>
                ))}
              </div>
              <div className="apx-workflow-node__connector" aria-hidden />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function VerifiedExamples({ model }: { model: ProductExperienceModel }) {
  const hero = model.heroExample;
  const wall = model.galleryExamples.slice(0, 6);

  return (
    <>
      <section className="apx-code-proof" aria-labelledby="source-to-output">
        <div className="apx-code-proof__shell">
          <div className="apx-code-proof__intro">
            <span className="apx-code-proof__index">03</span>
            <p className="apx-kicker">SOURCE / OUTPUT</p>
            <h2 id="source-to-output">The code is the system. The image is the proof.</h2>
            <p>
              Every featured output here is tied back to repository-controlled source. No fake
              mockup, no decorative placeholder presented as engine capability.
            </p>
            <Link href={hero.href} prefetch={false} className="apx-text-link">
              Open verified example <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>

          <div className="apx-code-proof__workbench" data-doc7-verified-hero={hero.id}>
            <div className="apx-code-proof__code">
              <div className="apx-code-proof__bar">
                <span>{hero.id}</span>
                <span>{model.package.name}</span>
              </div>
              <pre tabIndex={0} aria-label={`${hero.title} verified source code`}>
                <code>{hero.source}</code>
              </pre>
            </div>
            <div className="apx-code-proof__output">
              <div className="apx-code-proof__label">
                <span>VERIFIED OUTPUT</span>
                <span>{hero.runtime}</span>
              </div>
              <div className="apx-code-proof__media">
                <Image src={hero.output} alt={`Verified output from ${hero.title}`} fill sizes="(min-width: 1024px) 50vw, 95vw" className="object-contain" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="apx-editorial-section apx-editorial-section--gallery" aria-labelledby="output-gallery">
        <div className="apx-home-shell">
          <SectionIntro
            index="04"
            eyebrow="OUTPUT WALL"
            title="Let the renders do the selling."
            body={`A selection of repository-verified output from ${model.package.name} ${model.package.version}. Different jobs, one programmatic surface.`}
          />

          <div className="apx-output-wall">
            {wall.map((example, index) => (
              <OutputCard
                key={example.id}
                example={example}
                className={`apx-output-wall__item apx-output-wall__item--${index + 1}`}
              />
            ))}
          </div>

          <Link href="/gallery" prefetch={false} className="apx-gallery-cta">
            <span>See the full output library</span>
            <ArrowRightIcon className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </>
  );
}

export function RoadmapSection({ model }: { model: ProductExperienceModel }) {
  return (
    <section className="apx-editorial-section apx-editorial-section--index" aria-labelledby="engine-index">
      <div className="apx-home-shell">
        <SectionIntro
          index="05"
          eyebrow="ENGINE INDEX"
          title="What ships now. What stays clearly future."
          body="Current package capability and future direction are intentionally separated. That keeps the page ambitious without pretending roadmap work already exists."
        />

        <div className="apx-engine-index">
          <div className="apx-engine-index__current">
            <div className="apx-engine-index__heading">
              <span>NOW</span>
              <strong>{model.capabilities.length} current domains</strong>
            </div>
            <div className="apx-engine-index__list">
              {model.capabilities.map((capability, index) => (
                <Link key={capability.id} href={capability.apiHref} prefetch={false}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong>{capability.title}</strong>
                  <code>{capability.apiMember}()</code>
                  <CheckIcon className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </div>

          <div className="apx-engine-index__future">
            <div className="apx-engine-index__heading">
              <span>NEXT</span>
              <strong>explicit roadmap</strong>
            </div>
            <div className="apx-engine-index__roadmap">
              {model.roadmap.map((item, index) => (
                <article key={item.id}>
                  <div>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <StatusBadge status={item.status} />
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.summary}</p>
                  <code>{item.target}</code>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function EcosystemFooter({ model }: { model: ProductExperienceModel }) {
  return (
    <footer className="apx-home-footer">
      <div className="apx-home-footer__statement">
        <span className="apx-kicker">APEXIFY.JS / {model.package.version}</span>
        <h2>
          Build visual systems
          <span className="apx-home-footer__serif">with code.</span>
        </h2>
        <div className="apx-home-footer__actions">
          <Link href="/docs/getting-started" className="apx-cta apx-cta--light">
            Start with the docs <ArrowRightIcon className="h-4 w-4" />
          </Link>
          <Link href="/studio" className="apx-cta apx-cta--line">
            Open Studio
          </Link>
        </div>
      </div>

      <div className="apx-home-footer__bottom">
        <div>
          <strong>Apexify.js</strong>
          <span>Programmatic rendering + media tooling for JavaScript.</span>
        </div>
        <nav aria-label="Footer">
          <Link href="/docs/getting-started">Docs</Link>
          <Link href="/api-reference">API</Link>
          <Link href="/gallery">Gallery</Link>
          <Link href="/studio">Studio</Link>
        </nav>
        <span className="apx-home-footer__commit">{model.package.commit.slice(0, 8)}</span>
      </div>
    </footer>
  );
}
