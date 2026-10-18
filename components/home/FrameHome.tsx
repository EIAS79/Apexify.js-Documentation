'use client';

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { ArrowRightIcon, ArrowUpRightIcon, Bars3Icon, XMarkIcon, PlayIcon, PauseIcon, Square3Stack3DIcon, PhotoIcon, ChartBarIcon, CheckIcon, ClipboardIcon } from '@heroicons/react/24/outline';
import type { ProductExperienceModel } from '@/lib/product/catalog';
import './frame-home.css';

type FrameModel = Pick<ProductExperienceModel, 'package' | 'capabilities' | 'roadmap' | 'heroExample'>;
const CHAPTERS = ['Compose', 'Refine', 'Render', 'Explore'] as const;
const HERO = '/home/frame/hero.webp';
const DURATION = 8000;
const STARTER = `import { ApexPainter } from 'apexify.js';
import { writeFile } from 'node:fs/promises';

const painter = new ApexPainter({ type: 'buffer' });
const canvas = await painter.createCanvas({
  width: 1200, height: 630,
  colorBg: '#111111',
});
const png = await painter.createText({
  text: 'Every frame. Yours to create.',
  x: 60, y: 100,
  font: { family: 'Arial', size: 52 },
  fill: { color: '#D5FF5F' },
}, canvas);
await writeFile('first-frame.png', png);`;

function timeLabel(ms: number) {
  return `00:${Math.floor(ms / 1000).toString().padStart(2, '0')}`;
}

function MotionStudy({ motion }: { motion: boolean }) {
  const image = useRef<HTMLImageElement>(null);
  const section = useRef<HTMLDivElement>(null);
  const animation = useRef<Animation | null>(null);
  const [playing, setPlaying] = useState(true);
  const [visible, setVisible] = useState(true);
  const [position, setPosition] = useState(0);
  const [documentVisible, setDocumentVisible] = useState(true);
  const running = motion && playing && visible && documentVisible;

  useEffect(() => {
    const node = image.current;
    if (!node || !node.animate) return;
    const track = node.animate([
      { transform: 'scale(1) translate3d(0, 0, 0)' },
      { transform: 'scale(1.045) translate3d(-.8%, -.6%, 0)', offset: .5 },
      { transform: 'scale(1) translate3d(0, 0, 0)' },
    ], { duration: DURATION, iterations: Infinity, easing: 'ease-in-out' });
    track.pause();
    animation.current = track;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: .05 });
    if (section.current) observer.observe(section.current);
    const onVisibility = () => setDocumentVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    onVisibility();
    return () => { track.cancel(); animation.current = null; observer.disconnect(); document.removeEventListener('visibilitychange', onVisibility); };
  }, []);

  useEffect(() => {
    const track = animation.current;
    if (!track) return;
    if (running) track.play(); else track.pause();
    if (!running) return;
    const timer = window.setInterval(() => setPosition(Number(track.currentTime ?? 0) % DURATION), 100);
    return () => window.clearInterval(timer);
  }, [running]);

  function seek(value: number) {
    setPlaying(false);
    setPosition(value);
    if (animation.current) animation.current.currentTime = value;
  }

  return <div ref={section} className="frame-study">
    <div className="frame-art-window" aria-hidden="true">
      <img ref={image} src={HERO} alt="" width={1672} height={941} fetchPriority="high" decoding="async" />
    </div>
    <div className="frame-transport">
      <button className="frame-circle" type="button" onClick={() => setPlaying(p => !p)} disabled={!motion} aria-label={playing && motion ? 'Pause motion study' : 'Play motion study'}>{playing && motion ? <PauseIcon /> : <PlayIcon />}</button>
      <span className="frame-transport-title">Motion study <span> / APX</span></span>
      <input type="range" min={0} max={DURATION} step={10} value={position} onChange={e => seek(Number(e.target.value))} aria-label="Scrub motion study" aria-valuetext={`${timeLabel(position)} of 8 seconds`} style={{ '--position': `${position / DURATION * 100}%` } as CSSProperties} />
      <span className="frame-time">{timeLabel(position)} <span>/ 00:08</span></span>
      <a href="#refine" className="frame-next" aria-label="Explore the next chapter"><ArrowRightIcon /></a>
    </div>
    <div className="frame-filmstrip" aria-label="Motion study frames">
      {Array.from({ length: 7 }, (_, i) => <button type="button" key={i} aria-label={`Seek to frame ${i + 1}`} aria-pressed={Math.min(6, Math.floor(position / DURATION * 7)) === i} onClick={() => seek(i * DURATION / 7)}><img src={HERO} alt="" width={200} height={110} style={{ objectPosition: `${i * 100 / 6}% ${i % 2 ? 35 : 65}%`, transform: `scale(${1.15 + i * .16})` }} /><span>{String(i + 1).padStart(2, '0')}</span></button>)}
    </div>
  </div>;
}

function StudioPreview({ model }: { model: FrameModel }) {
  const [selected, setSelected] = useState('composition');
  const [tab, setTab] = useState<'preview' | 'source'>('preview');
  const items = [
    { id: 'composition', name: 'Composition', icon: Square3Stack3DIcon, image: HERO, caption: 'APX / Concept artwork' },
    { id: 'type', name: 'Typography', icon: PhotoIcon, image: '/gallery/peak-lab/03-text.png', caption: 'Typography / Apexify output' },
    { id: 'charts', name: 'Charts', icon: ChartBarIcon, image: model.heroExample.output, caption: 'Charts / Verified Apexify output' },
  ];
  const current = items.find(item => item.id === selected)!;
  return <div className="frame-workbench" data-reveal>
    <div className="frame-workbench-top"><span><span className="frame-status-dot" />APEXIFY / CREATIVE WORKSPACE</span><span>CODE + COMPOSITION</span></div>
    <div className="frame-workbench-body">
      <div className="frame-layers"><span className="frame-label">EXPLORE</span>{items.map(({ id, name, icon: Icon }) => <button type="button" key={id} aria-pressed={selected === id} onClick={() => { setSelected(id); setTab('preview'); }}><Icon /><span>{name}</span></button>)}<a href="/gallery">Explore Gallery <ArrowUpRightIcon /></a></div>
      <div className="frame-workspace">
        <div className="frame-workspace-tabs"><div role="group" aria-label="Workspace view"><button type="button" aria-pressed={tab === 'preview'} onClick={() => setTab('preview')}>Preview</button><button type="button" aria-pressed={tab === 'source'} onClick={() => setTab('source')}>Source</button></div><span>{tab === 'source' ? (selected === 'charts' ? 'VERIFIED EXAMPLE' : 'STARTER EXAMPLE') : 'OUTPUT'}</span></div>
        <div className="frame-preview-pane">{tab === 'preview' ? <img key={selected} src={current.image} alt={current.caption} width={1000} height={562} loading="lazy" /> : <pre tabIndex={0} aria-label={selected === 'charts' ? 'Verified chart source code' : 'Starter canvas source code'}><code>{selected === 'charts' ? model.heroExample.source : STARTER}</code></pre>}</div>
        <div className="frame-workspace-caption"><span>{tab === 'source' && selected !== 'charts' ? 'Starter code — creates a text image' : current.caption}</span><a href={selected === 'charts' ? model.heroExample.href : '/gallery'}>{selected === 'charts' ? 'View verified example' : 'Explore examples'}<ArrowUpRightIcon /></a></div>
      </div>
      <div className="frame-inspector"><span className="frame-label">YOUR NEXT FRAME</span><h3>A few lines.<br />A world of possibility.</h3><p>Create a surface. Compose your layers. Make something that is yours.</p><div className="frame-code-mini"><span>const</span> painter = <span>new</span><br /><b>ApexPainter</b>({'{'}<br />&nbsp; type: <em>&apos;buffer&apos;</em><br />{'}'});</div><a className="frame-button frame-button-primary" href="/gallery">Explore Gallery <ArrowUpRightIcon /></a></div>
    </div>
    <div className="frame-workbench-bottom"><span>01 / CANVAS</span><span>02 / COMPOSE</span><span>03 / OUTPUT</span><a href="/docs/getting-started">Make your first image <ArrowRightIcon /></a></div>
  </div>;
}

function FilmDialog({ film, onClose }: { film: 'spectrum' | 'orbit' | null; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (!element || !film) return;
    const previousOverflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = 'hidden';
    return () => { element.close(); document.body.style.overflow = previousOverflow; };
  }, [film]);
  return <dialog ref={dialog} className="frame-film-dialog" onCancel={onClose} onClick={e => { if (e.target === dialog.current) onClose(); }} aria-label={film === 'spectrum' ? 'Apexify Spectrum film' : 'Orbit Breaker film'}>
    {film && <><div className="frame-dialog-heading"><h2>{film === 'spectrum' ? 'Apexify Spectrum' : 'Orbit Breaker'}</h2><button type="button" className="frame-circle" onClick={onClose} aria-label="Close showcase film" autoFocus><XMarkIcon /></button></div><video key={film} controls autoPlay muted playsInline preload="metadata" aria-label="Showcase film with abstract visuals and music; no spoken dialogue"><source src={film === 'spectrum' ? '/brand/Apexify-Spectrum.mp4' : '/brand/Orbit-Breaker.mp4'} type="video/mp4" />Your browser does not support this video.</video><p>Programmatic typography, imagery and motion. Sound is muted by default.</p></>}
  </dialog>;
}

export default function FrameHome({ model }: { model: FrameModel }) {
  const root = useRef<HTMLDivElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const [menu, setMenu] = useState(false);
  const [motion, setMotion] = useState(false);
  const [chapter, setChapter] = useState(0);
  const [film, setFilm] = useState<'spectrum' | 'orbit' | null>(null);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setMotion(!media.matches);
    update(); media.addEventListener('change', update);
    return () => { media.removeEventListener('change', update); if (copyTimer.current) clearTimeout(copyTimer.current); };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape' && menu) { setMenu(false); menuButton.current?.focus(); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menu]);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const height = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      element.style.setProperty('--page-progress', String(y / height));
      element.style.setProperty('--hero-shift', `${motion ? Math.min(y * .10, 90) : 0}px`);
      element.style.setProperty('--hero-scale', String(motion ? 1 - Math.min(y / window.innerHeight, 1) * .055 : 1));
      let active = 0;
      CHAPTERS.forEach((name, index) => { const node = document.getElementById(name.toLowerCase()); if (node && node.getBoundingClientRect().top < window.innerHeight * .5) active = index; });
      setChapter(previous => previous === active ? previous : active);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    window.addEventListener('scroll', onScroll, { passive: true }); window.addEventListener('resize', onScroll); update();
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(frame); };
  }, [motion]);

  useEffect(() => {
    if (!motion || !root.current) return;
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.animate?.([{ transform: 'translateY(24px)', opacity: .7 }, { transform: 'translateY(0)', opacity: 1 }], { duration: 600, easing: 'cubic-bezier(.2,.65,.25,1)' });
        observer.unobserve(entry.target);
      }
    }), { threshold: .12 });
    root.current.querySelectorAll('[data-reveal]').forEach(node => observer.observe(node));
    return () => observer.disconnect();
  }, [motion]);

  async function copyInstall() {
    try { await navigator.clipboard.writeText(model.package.installCommand); setCopyState('copied'); }
    catch { setCopyState('error'); }
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopyState('idle'), 3500);
  }

  return <div ref={root} className="frame-home" data-motion={motion}>
    <a href="#main-content" className="frame-skip">Skip to content</a>
    <header className="frame-nav">
      <a className="frame-brand" href="/" aria-label="Apexify.js home"><img src="/brand/apexify-lockup-v2.avif" width={160} height={53} alt="Apexify.js" /></a>
      <nav className="frame-desktop-nav" aria-label="Primary"><a href="/docs/getting-started">Docs</a><a href="/api-reference">API</a><a href="/gallery">Gallery</a><a href="https://github.com/EIAS79/Apexify.js" target="_blank" rel="noopener noreferrer">GitHub <ArrowUpRightIcon /></a></nav>
      <div className="frame-nav-actions"><a href="/docs/getting-started" className="frame-button frame-button-primary frame-nav-cta">Start building <ArrowRightIcon /></a><button type="button" className="frame-circle frame-motion-toggle" onClick={() => setMotion(m => !m)} aria-label={motion ? 'Disable page motion' : 'Enable page motion'} aria-pressed={motion}>{motion ? <PauseIcon /> : <PlayIcon />}</button><button type="button" className="frame-circle frame-menu-toggle" ref={menuButton} aria-label={menu ? 'Close menu' : 'Open menu'} aria-expanded={menu} aria-controls="frame-mobile-nav" onClick={() => setMenu(m => !m)}>{menu ? <XMarkIcon /> : <Bars3Icon />}</button></div>
      {menu && <nav id="frame-mobile-nav" className="frame-mobile-nav" aria-label="Mobile primary">{[['Docs', '/docs/getting-started'], ['API', '/api-reference'], ['Gallery', '/gallery'], ['GitHub', 'https://github.com/EIAS79/Apexify.js']].map(([label, href]) => <a key={label} href={href} onClick={() => setMenu(false)}>{label}<ArrowUpRightIcon /></a>)}</nav>}
    </header>
    <nav className="frame-chapter-rail" aria-label="Homepage chapters">{CHAPTERS.map((name, i) => <a key={name} href={`#${name.toLowerCase()}`} aria-current={chapter === i ? 'step' : undefined}><span className="frame-rail-dot" /><span>{String(i + 1).padStart(2, '0')}<small>{name}</small></span></a>)}</nav>
    <main id="main-content" tabIndex={-1}>
      <section className="frame-hero" id="compose" aria-labelledby="frame-title">
        <div className="frame-hero-copy"><p className="frame-label frame-hero-kicker">THE PROGRAMMABLE VISUAL LIBRARY</p><h1 id="frame-title">Every frame.<br /><span>Yours to create.</span></h1><p className="frame-lead">Turn code into images, typography, charts and media.<br className="frame-desktop-break" /> A TypeScript-first toolkit for everything you see.</p><div className="frame-hero-actions"><a href="/docs/getting-started" className="frame-button frame-button-primary">Start building <ArrowRightIcon /></a><a href="/gallery" className="frame-button frame-button-secondary">Explore Gallery <ArrowUpRightIcon /></a></div></div>
        <div className="frame-hero-index" aria-hidden="true">CODE<br />DATA<br />MEDIA<br />MOTION<br />OUTPUT</div>
        <MotionStudy motion={motion} />
      </section>
      <section id="refine" className="frame-section frame-refine" aria-labelledby="refine-title">
        <div className="frame-section-heading" data-reveal><div><p className="frame-label">02 / REFINE</p><h2 id="refine-title">From the first layer.<br /><span>To the final frame.</span></h2><p className="frame-section-body">Compose images, text, charts and scenes. Build reusable templates. Bring your next idea into view.</p><a className="frame-text-link" href="/gallery">Explore Gallery <ArrowUpRightIcon /></a></div><p className="frame-side-note">SAME IDEAS.<br />NEW POSSIBILITIES.</p></div>
        <StudioPreview model={model} />
        <div className="frame-path" aria-label="Composition workflow">{['Compose', 'Refine', 'Render', 'Explore'].map((item, i) => <a key={item} href={`#${CHAPTERS[i].toLowerCase()}`} aria-current={chapter === i ? 'step' : undefined}><span>{String(i + 1).padStart(2, '0')}</span>{item}</a>)}</div>
      </section>
      <section id="render" className="frame-section frame-render" aria-labelledby="render-title">
        <div className="frame-section-heading" data-reveal><div><p className="frame-label">03 / RENDER</p><h2 id="render-title">Made with logic.<br /><span>Remembered for its form.</span></h2></div><p className="frame-section-body">A look at what code can become.<br />Explore films and real generated outputs.</p></div>
        <div className="frame-gallery">
          <article data-reveal><button type="button" className="frame-gallery-art" onClick={() => setFilm('spectrum')} aria-label="Play Apexify Spectrum"><img src="/home/frame/spectrum.webp" alt="A frame from the Apexify Spectrum showcase" width={960} height={540} loading="lazy" /><span className="frame-art-play"><PlayIcon />WATCH FILM</span></button><div className="frame-gallery-caption"><span className="frame-gallery-number">01</span><div><p className="frame-label">TYPOGRAPHY / COMPOSITION / MEDIA</p><h3>Apexify Spectrum.</h3><p>A whole visual world, composed in code.</p></div><button type="button" className="frame-circle" onClick={() => setFilm('spectrum')} aria-label="Open Apexify Spectrum"><ArrowUpRightIcon /></button></div></article>
          <article data-reveal><button type="button" className="frame-gallery-art" onClick={() => setFilm('orbit')} aria-label="Play Orbit Breaker"><img src="/home/frame/orbit.webp" alt="A frame from the Orbit Breaker motion study" width={960} height={540} loading="lazy" /><span className="frame-art-play"><PlayIcon />WATCH FILM</span></button><div className="frame-gallery-caption"><span className="frame-gallery-number">02</span><div><p className="frame-label">SCENES / EFFECTS / ANIMATION</p><h3>Orbit Breaker.</h3><p>Layered systems. Cinematic output.</p></div><button type="button" className="frame-circle" onClick={() => setFilm('orbit')} aria-label="Open Orbit Breaker"><ArrowUpRightIcon /></button></div></article>
        </div><a className="frame-text-link frame-gallery-link" href="/gallery">Go deeper in the Gallery <ArrowRightIcon /></a>
      </section>
      <section id="explore" className="frame-section frame-explore" aria-labelledby="explore-title"><div className="frame-section-heading" data-reveal><div><p className="frame-label">04 / EXPLORE</p><h2 id="explore-title">Your tools.<br /><span>Your visual language.</span></h2></div><p className="frame-section-body">Start with one idea. Find the API to make it happen.<br /><span className="frame-runtime">Node / server runtime · v{model.package.version}</span></p></div><div className="frame-capabilities">{model.capabilities.map((cap, i) => <a href={cap.apiHref} key={cap.id}><span className="frame-label">{String(i + 1).padStart(2, '0')}</span><div><h3>{cap.title}</h3><code>{cap.apiMember}()</code></div><ArrowUpRightIcon /></a>)}</div><p className="frame-runtime-note">Video workflows require FFmpeg / ffprobe.</p><details className="frame-roadmap"><summary>On the horizon <span>PLANNED</span></summary><p>The browser renderer, React / Next.js adapters and unified engine animation are roadmap work, separate from the current Node library.</p><ul>{model.roadmap.map(item => <li key={item.id}><strong>{item.title}</strong><span>{item.target}</span></li>)}</ul></details></section>
      <footer className="frame-footer"><div data-reveal><p className="frame-label">THE NEXT FRAME IS YOURS</p><h2>Make something<br /><span>worth seeing.</span></h2><div className="frame-footer-actions"><a href="/docs/getting-started" className="frame-button frame-button-primary">Start building <ArrowRightIcon /></a><a href="/gallery" className="frame-button frame-button-secondary">Explore Gallery <ArrowUpRightIcon /></a></div><div className="frame-install"><code>{model.package.installCommand}</code><button type="button" aria-label="Copy pinned install command" onClick={copyInstall}>{copyState === 'copied' ? <CheckIcon /> : <ClipboardIcon />}</button></div><p className="frame-copy-status" role="status">{copyState === 'copied' ? 'Install command copied.' : copyState === 'error' ? 'Copy unavailable. Select the command above to copy it.' : `Version-pinned source install · ${model.package.commit.slice(0, 8)}`}</p></div><div className="frame-footer-bottom"><a href="/" aria-label="Apexify.js home"><img src="/brand/apexify-lockup-v2.avif" alt="Apexify.js" width={130} height={43} loading="lazy" /></a><span>CODE. COMPOSE. CREATE.</span><nav aria-label="Footer"><a href="/docs/getting-started">Documentation</a><a href="https://github.com/EIAS79/Apexify.js">GitHub</a><a href="#compose">Back to top <ArrowRightIcon /></a></nav></div></footer>
    </main><FilmDialog film={film} onClose={() => setFilm(null)} />
  </div>;
}
