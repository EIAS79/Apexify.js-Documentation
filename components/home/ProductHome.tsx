import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  ArrowRightIcon,
  CheckIcon,
  MinusIcon,
} from '@heroicons/react/24/outline';
import type { ProductExperienceModel, ResolvedCapability } from '@/lib/product/catalog';
import type { ProductStatus } from '@/lib/product/catalog-data';
import CopyInstallButton from './CopyInstallButton';
import GenerativeAtelier from './GenerativeAtelier';

function getCapability(model: ProductExperienceModel, id: string): ResolvedCapability {
  return model.capabilities.find((item) => item.id === id) ?? model.capabilities[0];
}

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
    <header className="apx-section-intro">
      <div className="apx-section-intro__index">{index}</div>
      <div className="apx-section-intro__main">
        <p className="apx-kicker">{eyebrow}</p>
        <h2 id={eyebrow.toLowerCase().replace(/[^a-z0-9]+/g, "-")}>{title}</h2>
      </div>
      <p className="apx-section-intro__body">{body}</p>
    </header>
  );
}

function TemplateArtwork() {
  return (
    <div className="apx-art apx-art--template" aria-hidden>
      <div className="apx-art-template__rail">
        <span>01</span><span>02</span><span>03</span><span>04</span>
      </div>
      <div className="apx-art-template__page">
        <div className="apx-art-template__head">
          <span>QUARTERLY / SIGNAL</span>
          <b>24</b>
        </div>
        <div className="apx-art-template__headline">A reusable layout system.</div>
        <div className="apx-art-template__rule" />
        <div className="apx-art-template__stats">
          <div><strong>42</strong><span>assets</span></div>
          <div><strong>08</strong><span>variants</span></div>
          <div><strong>1</strong><span>template</span></div>
        </div>
        <div className="apx-art-template__blocks">
          <i /><i /><i /><i />
        </div>
      </div>
    </div>
  );
}

function SceneArtwork() {
  return (
    <div className="apx-art apx-art--scene" aria-hidden>
      <div className="apx-scene__frame apx-scene__frame--one" />
      <div className="apx-scene__frame apx-scene__frame--two" />
      <div className="apx-scene__frame apx-scene__frame--three" />
      <div className="apx-scene__label">
        <span>SCENE 04</span>
        <strong>layers</strong>
        <em>ordered.</em>
      </div>
      <div className="apx-scene__cursor">+</div>
    </div>
  );
}

function MotionArtwork() {
  return (
    <div className="apx-art apx-art--motion" aria-hidden>
      <div className="apx-motion__header"><span>FRAME SEQUENCE</span><span>00:02.40</span></div>
      <div className="apx-motion__frames">
        <i data-frame="1" /><i data-frame="2" /><i data-frame="3" /><i data-frame="4" />
      </div>
      <div className="apx-motion__timeline">
        <span />
        <b />
      </div>
      <div className="apx-motion__caption">motion / media / output</div>
    </div>
  );
}

function ImageArtwork() {
  return (
    <div className="apx-art apx-art--image" aria-hidden>
      <div className="apx-image__crop" />
      <div className="apx-image__disc" />
      <div className="apx-image__mesh" />
      <div className="apx-image__type">
        <span>IMAGE / SHAPE</span>
        <strong>Compose.</strong>
      </div>
    </div>
  );
}

function SyntaxCode() {
  return (
    <pre className="apx-syntax" tabIndex={0} aria-label="TypeScript Apexify.js example">
      <code>
        <span className="apx-syntax__line"><span className="apx-syntax__kw">import</span> {'{ '}<span className="apx-syntax__fn">writeFile</span>{' } '}<span className="apx-syntax__kw">from</span> <span className="apx-syntax__str">&apos;node:fs/promises&apos;</span>;</span>
        <span className="apx-syntax__line"><span className="apx-syntax__kw">import</span> {'{ '}<span className="apx-syntax__type">ApexPainter</span>{' } '}<span className="apx-syntax__kw">from</span> <span className="apx-syntax__str">&apos;apexify.js&apos;</span>;</span>
        <span className="apx-syntax__line">&nbsp;</span>
        <span className="apx-syntax__line"><span className="apx-syntax__kw">const</span> painter = <span className="apx-syntax__kw">new</span> <span className="apx-syntax__type">ApexPainter</span>({'{'} type: <span className="apx-syntax__str">&apos;buffer&apos;</span> {'}'});</span>
        <span className="apx-syntax__line"><span className="apx-syntax__kw">const</span> canvas = <span className="apx-syntax__kw">await</span> painter.<span className="apx-syntax__fn">createCanvas</span>({'{'}</span>
        <span className="apx-syntax__line apx-syntax__indent">width: <span className="apx-syntax__num">1200</span>, height: <span className="apx-syntax__num">630</span>,</span>
        <span className="apx-syntax__line apx-syntax__indent">colorBg: <span className="apx-syntax__str">&apos;#101622&apos;</span>,</span>
        <span className="apx-syntax__line">{'}'});</span>
        <span className="apx-syntax__line">&nbsp;</span>
        <span className="apx-syntax__line"><span className="apx-syntax__kw">const</span> png = <span className="apx-syntax__kw">await</span> painter.<span className="apx-syntax__fn">createText</span>({'{'}</span>
        <span className="apx-syntax__line apx-syntax__indent">text: <span className="apx-syntax__str">&apos;Visual systems, from code.&apos;</span>,</span>
        <span className="apx-syntax__line apx-syntax__indent">x: <span className="apx-syntax__num">92</span>, y: <span className="apx-syntax__num">120</span>,</span>
        <span className="apx-syntax__line apx-syntax__indent">font: {'{'} size: <span className="apx-syntax__num">72</span>, family: <span className="apx-syntax__str">&apos;Arial&apos;</span> {'}'},</span>
        <span className="apx-syntax__line apx-syntax__indent">fill: {'{'} color: <span className="apx-syntax__str">&apos;#F6F7F9&apos;</span> {'}'},</span>
        <span className="apx-syntax__line">{'}'}, canvas);</span>
        <span className="apx-syntax__line">&nbsp;</span>
        <span className="apx-syntax__line"><span className="apx-syntax__kw">await</span> <span className="apx-syntax__fn">writeFile</span>(<span className="apx-syntax__str">&apos;launch-card.png&apos;</span>, png);</span>
      </code>
    </pre>
  );
}

function CompositionPreview() {
  return (
    <div className="apx-composition-preview" aria-label="Illustrative composition preview">
      <div className="apx-composition-preview__meta"><span>1200 × 630</span><span>PNG</span></div>
      <div className="apx-composition-preview__orb" />
      <div className="apx-composition-preview__copy">
        <span>APEXIFY.JS</span>
        <strong>Visual systems,<br />from code.</strong>
        <em>Type · image · scene · media</em>
      </div>
      <div className="apx-composition-preview__grid" />
    </div>
  );
}

function ApproachCell({ tone, children }: { tone: 'strong' | 'mid' | 'soft'; children: ReactNode }) {
  return (
    <div className="apx-compare-cell" data-tone={tone}>
      {tone === 'strong' ? <CheckIcon className="h-3.5 w-3.5" /> : <MinusIcon className="h-3.5 w-3.5" />}
      <span>{children}</span>
    </div>
  );
}

export function ProductHero({ model }: { model: ProductExperienceModel }) {
  return (
    <section className="apx-hero">
      <div className="apx-hero__shell">
        <div className="apx-hero__copy">
          <div className="apx-hero__meta">
            <span className="apx-kicker">A TOOLKIT FOR VISUAL THINKERS</span>
            <StatusBadge status="CURRENT" />
            <span className="apx-hero__version">{model.package.name} {model.package.version}</span>
          </div>

          <h1>
            <span>A little code.</span>
            <span className="apx-hero__serif">A whole new</span>
            <span>canvas.</span>
          </h1>

          <p className="apx-hero__lede">
            Turn your data into something worth looking at. Compose images, shape typography, and build entire visual worlds with a TypeScript-first toolkit for Node.js.
          </p>

          <div className="apx-hero__actions">
            <Link href="/docs/getting-started" prefetch={false} className="apx-cta apx-cta--primary">
              Make your first render <ArrowRightIcon className="h-4 w-4" />
            </Link>
            <Link href="/gallery" prefetch={false} className="apx-cta apx-cta--ghost">
              Find your inspiration ↗
            </Link>
          </div>

          <div className="apx-hero__install">
            <CopyInstallButton command={model.package.installCommand} />
          </div>

          <div className="apx-hero__proof">
            <div><strong>{model.capabilities.length}</strong><span>current domains</span></div>
            <div><strong>TS</strong><span>first authoring</span></div>
            <div><strong>Node</strong><span>current runtime</span></div>
          </div>
        </div>

        <GenerativeAtelier />
      </div>

      <div className="apx-capability-queue" aria-label="Current capabilities">
        <div className="apx-capability-queue__track">
          {model.capabilities.map((capability, index) => (
            <span key={`${capability.id}-${index}`}>
              {capability.title}
              <i aria-hidden>·</i>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CapabilitySection({ model }: { model: ProductExperienceModel }) {
  const cards = [
    { id: 'images', label: 'IMAGE COMPOSITION', title: 'Image, shape, crop, blend.', body: 'Build raster compositions from imagery and primitives instead of treating screenshots as your rendering layer.', Art: ImageArtwork },
    { id: 'templates', label: 'TEMPLATES', title: 'Reusable layouts, not one-offs.', body: 'Move repeated visual work into reusable definitions with data binding and layout support.', Art: TemplateArtwork },
    { id: 'scenes', label: 'SCENES', title: 'Ordered composition with structure.', body: 'Layer content through validated scene composition when a single drawing call is not enough.', Art: SceneArtwork },
    { id: 'video', label: 'MEDIA', title: 'Frames, GIF, video and audio.', body: 'Extend the same programmatic workflow into bounded animation and FFmpeg-backed media operations.', Art: MotionArtwork },
  ];

  return (
    <section className="apx-section apx-section--build" aria-labelledby="what-you-can-build">
      <div className="apx-home-shell">
        <SectionIntro
          index="01"
          eyebrow="WHAT YOU CAN BUILD"
          title="Your imagination. A larger vocabulary."
          body="A launch card. A living dataset. A thousand variations on one good idea. Start with a primitive and see where it takes you."
        />

        <div className="apx-build-grid">
          {cards.map(({ id, label, title, body, Art }, index) => {
            const capability = getCapability(model, id);
            return (
              <article key={id} className="apx-build-card" data-card={index + 1}>
                <div className="apx-build-card__visual"><Art /></div>
                <div className="apx-build-card__copy">
                  <div><span>{String(index + 1).padStart(2, '0')}</span><span>{label}</span></div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                  <Link href={capability.apiHref} prefetch={false}>{capability.apiMember}() <ArrowRightIcon className="h-3.5 w-3.5" /></Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function FeatureTracks({ model }: { model: ProductExperienceModel }) {
  return (
    <section className="apx-section apx-section--workflow" aria-labelledby="the-workflow">
      <div className="apx-home-shell">
        <SectionIntro
          index="02"
          eyebrow="THE WORKFLOW"
          title="From what if. To there it is."
          body="Keep the creative decisions. Automate the repetition. A clear path from your first canvas to a repeatable rendering workflow."
        />

        <div className="apx-workflow">
          {model.featureTracks.map((track, index) => (
            <article key={track.id} className="apx-workflow__item">
              <div className="apx-workflow__number">{String(index + 1).padStart(2, '0')}</div>
              <div className="apx-workflow__line" aria-hidden />
              <p>{track.eyebrow}</p>
              <h3>{track.title}</h3>
              <span>{track.summary}</span>
              <div className="apx-workflow__apis">
                {track.api.map((api) => <Link key={api.name} href={api.href}>{api.name}()</Link>)}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function VerifiedExamples({ model }: { model: ProductExperienceModel }) {
  const verified = model.heroExample;
  return (
    <>
      <section className="apx-code-section" aria-labelledby="code-to-output" data-doc7-verified-hero={verified.id}>
        <div className="apx-code-section__shell">
          <div className="apx-code-section__intro">
            <p className="apx-kicker">TYPE-SAFE AUTHORING</p>
            <h2 id="code-to-output">Readable code. Designed output.</h2>
            <p>
              A blank canvas is an invitation. Add a few lines of TypeScript, choose your words, and write your first image to disk with <code>createCanvas()</code> and <code>createText()</code>.
            </p>
            <Link href={getCapability(model, 'text').apiHref} className="apx-inline-link">
              Explore the text API <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>

          <div className="apx-code-section__workbench">
            <div className="apx-code-panel">
              <div className="apx-code-panel__bar"><span>launch-card.ts</span><span>TypeScript</span></div>
              <SyntaxCode />
            </div>
            <div className="apx-preview-panel">
              <div className="apx-preview-panel__bar"><span>Art direction study</span><span>1200 × 630</span></div>
              <CompositionPreview />
            </div>
          </div>

          <div className="apx-code-section__proof-note">
            <span>The adjacent art study is illustrative; the code creates a text-only PNG.</span>
            <Link href={verified.href}>Open a verified executable example <ArrowRightIcon className="h-3.5 w-3.5" /></Link>
          </div>
        </div>
      </section>

      <section className="apx-section apx-section--showcase apx-section--peak" aria-labelledby="peak-showcase">
        <div className="apx-home-shell">
          <SectionIntro
            index="03"
            eyebrow="PEAK SHOWCASE"
            title="Made of code. Full of character."
            body="Take a moment. Watch typography, imagery, data, and motion come together in two finished films made with Apexify."
          />

          <div className="apx-peak-films">
            <article className="apx-peak-film apx-peak-film--spectrum">
              <div className="apx-peak-film__media">
                <video
                  src="/brand/Apexify-Spectrum.mp4"
                  controls
                  playsInline
                  preload="metadata"
                  aria-label="Apexify Spectrum showcase film"
                />
                <span>FEATURED FILM / 01</span>
              </div>
              <div className="apx-peak-film__copy">
                <div><span>48 SEC</span><span>1920 × 1080</span><span>H.264</span></div>
                <h3>Apexify Spectrum</h3>
                <p>Composition, typography, imagery, charts, templates, audio, animation and video gathered into one cinematic Apexify showcase.</p>
              </div>
            </article>

            <article className="apx-peak-film apx-peak-film--orbit">
              <div className="apx-peak-film__media">
                <video
                  src="/brand/Orbit-Breaker.mp4"
                  controls
                  playsInline
                  preload="metadata"
                  aria-label="Orbit Breaker showcase film"
                />
                <span>FEATURED FILM / 02</span>
              </div>
              <div className="apx-peak-film__copy">
                <div><span>36 SEC</span><span>1280 × 720</span><span>H.264</span></div>
                <h3>Orbit Breaker</h3>
                <p>A procedural cinematic motion study built from layered visual systems, effects, animation and FFmpeg-backed media output.</p>
              </div>
            </article>
          </div>

          <div className="apx-showcase__footer">
            <p>Curious how it works? Explore the Peak Lab recipes, with real output and the source behind each piece.</p>
            <Link href="/gallery">Open Peak Lab Gallery <ArrowRightIcon className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>
    </>
  );
}

export function RoadmapSection({ model }: { model: ProductExperienceModel }) {
  const current = ['Server-side raster output','Text + image composition','Charts','Scenes + templates','GIF / video / audio'];
  return (
    <>
      <section className="apx-section apx-section--compare" aria-labelledby="compare-approaches">
        <div className="apx-home-shell">
          <SectionIntro
            index="04"
            eyebrow="COMPARE APPROACHES"
            title="Apexify.js vs common rendering setups."
            body="This compares typical workflow focus, not every library implementation. The point is where each approach usually puts the composition burden."
          />

          <div className="apx-compare" tabIndex={0} role="region" aria-label="Apexify.js comparison table">
            <div className="apx-compare__head">
              <span>Capability</span>
              <strong>Apexify.js</strong>
              <span>Screenshot automation</span>
              <span>Chart-focused library</span>
              <span>Raw canvas scripting</span>
            </div>
            {current.map((row, index) => (
              <div className="apx-compare__row" key={row}>
                <strong>{row}</strong>
                <ApproachCell tone="strong">{['Built in','Built in','Built in','Built in','Built in'][index]}</ApproachCell>
                <ApproachCell tone={index < 2 ? 'mid' : 'soft'}>{['Indirect via DOM','Indirect via DOM','External','External','External'][index]}</ApproachCell>
                <ApproachCell tone={index === 2 ? 'strong' : 'soft'}>{['Not primary','Not primary','Primary focus','Not primary','Not primary'][index]}</ApproachCell>
                <ApproachCell tone={index < 2 ? 'mid' : 'soft'}>{['Manual','Manual','Manual / external','Manual architecture','External tooling'][index]}</ApproachCell>
              </div>
            ))}
          </div>
          <p className="apx-compare__note">“Typical” describes common usage patterns; individual tools can differ substantially.</p>
        </div>
      </section>

      <section className="apx-section apx-section--roadmap" aria-labelledby="current-next">
        <div className="apx-home-shell">
          <SectionIntro
            index="05"
            eyebrow="CURRENT + NEXT"
            title="Build today. Look further."
            body="Explore the current package, then see what is planned. Roadmap items are a direction of travel, not a promise of availability."
          />

          <div className="apx-roadmap-grid">
            <div className="apx-roadmap-grid__current">
              <div className="apx-roadmap-grid__title"><span>NOW</span><strong>{model.capabilities.length} current domains</strong></div>
              {model.capabilities.map((capability) => (
                <Link key={capability.id} href={capability.apiHref}>
                  <strong>{capability.title}</strong>
                  <code>{capability.apiMember}()</code>
                  <CheckIcon className="h-4 w-4" />
                </Link>
              ))}
            </div>
            <div className="apx-roadmap-grid__future">
              <div className="apx-roadmap-grid__title"><span>NEXT</span><strong>explicit roadmap</strong></div>
              {model.roadmap.slice(0, 5).map((item) => (
                <article key={item.id}>
                  <div><h3>{item.title}</h3><StatusBadge status={item.status} /></div>
                  <p>{item.summary}</p>
                  <code>{item.target}</code>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export function EcosystemFooter({ model }: { model: ProductExperienceModel }) {
  return (
    <footer className="apx-footer">
      <div className="apx-footer__top">
        <div className="apx-footer__statement">
          <p className="apx-kicker">APEXIFY.JS / {model.package.version}</p>
          <h2>Your next idea<br />deserves a <em>canvas.</em></h2>
          <p>Start with a canvas. Grow into scenes, templates, media, and repeatable visual systems.</p>
          <div>
            <Link href="/docs/getting-started" className="apx-cta apx-cta--footer">Read the docs <ArrowRightIcon className="h-4 w-4" /></Link>
            <Link href="/studio" className="apx-footer__studio">Open Studio</Link>
          </div>
        </div>

        <div className="apx-footer__nav">
          <div><span>BUILD</span><Link href="/docs/getting-started">Getting started</Link><Link href="/api-reference">API reference</Link><Link href="/studio">Studio</Link></div>
          <div><span>EXPLORE</span><Link href="/gallery">Gallery</Link><Link href={model.heroExample.href}>Verified example</Link><a href="https://github.com/EIAS79/Apexify.js" target="_blank" rel="noreferrer">GitHub</a></div>
          <div><span>PACKAGE</span><a href="https://www.npmjs.com/package/apexify.js" target="_blank" rel="noreferrer">npm</a><span className="apx-footer__meta">v{model.package.version}</span><span className="apx-footer__meta">{model.package.commit.slice(0, 8)}</span></div>
        </div>
      </div>

      <div className="apx-footer__bottom">
        <span>TypeScript-first rendering and media tooling for Node/server runtimes.</span>
      </div>
    </footer>
  );
}
