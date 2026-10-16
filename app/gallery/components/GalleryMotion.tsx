'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { ArrowUpRightIcon, Bars3Icon, XMarkIcon, SunIcon, MoonIcon, MagnifyingGlassIcon, Squares2X2Icon, CodeBracketIcon, Square3Stack3DIcon, GlobeAltIcon, ChevronLeftIcon, ChevronRightIcon, PauseIcon, PlayIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { fieldUseCases, filterFieldEntries, type FieldEntry, type GallerySection } from '@/lib/gallery/motion-field/catalog';
import { FieldPlayer, FieldThumbnail } from './FieldMedia';
const FieldInspector = dynamic(() => import('./FieldInspector'), { ssr: false });
const SECTIONS = [
  { id: 'use-cases', label: 'Use Cases', detail: 'See where to use Apexify.js', Icon: Squares2X2Icon },
  { id: 'explore', label: 'Explore', detail: 'Discover rendered work', Icon: GlobeAltIcon },
  { id: 'templates', label: 'Templates', detail: 'Reusable starting points', Icon: Square3Stack3DIcon },
  { id: 'examples', label: 'Examples', detail: 'Source-backed recipes', Icon: CodeBracketIcon },
] as const;
const FILTERS = [['all', 'All'], ['image', 'Images'], ['typography', 'Typography'], ['data', 'Data'], ['motion', 'Motion'], ['composition', 'Composition'], ['surface', 'Surfaces'], ['advanced', 'Advanced']] as const;
const NAV = [['/', 'Home'], ['/docs/getting-started', 'Docs'], ['/api-reference', 'API'], ['/gallery', 'Gallery'], ['/studio', 'Studio']];

export default function GalleryMotion({ entries }: { entries: FieldEntry[] }) {
  const [section, setSection] = useState<GallerySection>('explore');
  const [lens, setLens] = useState('all');
  const [query, setQuery] = useState('');
  const [layout, setLayout] = useState<'stage' | 'grid'>('stage');
  const [selected, setSelected] = useState(entries[0]?.id);
  const [inspecting, setInspecting] = useState<string | null>(null);
  const [motion, setMotion] = useState(false);
  const [light, setLight] = useState(false);
  const [menu, setMenu] = useState(false);
  const [limit, setLimit] = useState(16);
  const search = useRef<HTMLInputElement>(null);
  const swipe = useRef<number | null>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const filmstrip = useRef<HTMLDivElement>(null);
  const visible = useMemo(() => filterFieldEntries(entries, section, lens, query), [entries, section, lens, query]);
  const index = Math.max(0, visible.findIndex(item => item.id === selected));
  const active = visible[index];
  const inspected = entries.find(item => item.id === inspecting);
  const cases = fieldUseCases.filter(item => `${item.label} ${item.title} ${item.description}`.toLowerCase().includes(query.toLowerCase().trim()));
  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    let preference: string | null = null;
    try { preference = localStorage.getItem('apexify.gallery.motion'); setLight(localStorage.getItem('apexify.gallery.theme') === 'light'); } catch { /* Optional preference. */ }
    setMotion(!reduce.matches && preference !== 'off');
    const change = () => { if (reduce.matches) setMotion(false); };
    reduce.addEventListener('change', change);
    return () => reduce.removeEventListener('change', change);
  }, []);
  // Deep-link the four first-class Gallery sections without confusing item hash links.
  useEffect(() => {
    const readSection = () => {
      const view = new URLSearchParams(window.location.search).get('view');
      if (view === 'use-cases' || view === 'explore' || view === 'templates' || view === 'examples') {
        setSection(view);
      }
    };
    readSection();
    window.addEventListener('popstate', readSection);
    return () => window.removeEventListener('popstate', readSection);
  }, []);
  useEffect(() => { setLimit(16); }, [section, lens, query]);
  useEffect(() => {
    const read = () => {
      let id = '';
      try { id = decodeURIComponent(window.location.hash.slice(1)).split('+')[0]; } catch { return; }
      if (!id) { setInspecting(null); return; }
      if (entries.some(item => item.id === id)) { setSelected(id); setInspecting(id); }
    };
    read(); window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, [entries]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && menu) { setMenu(false); menuButton.current?.focus(); }
      if (inspecting) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); search.current?.focus(); }
      if (event.key === '/' && !(event.target instanceof HTMLInputElement)) { event.preventDefault(); search.current?.focus(); }
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, [inspecting, menu]);
  useEffect(() => {
    const button = filmstrip.current?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (button && filmstrip.current) {
      const strip = filmstrip.current;
      if (button.offsetLeft < strip.scrollLeft || button.offsetLeft + button.offsetWidth > strip.scrollLeft + strip.clientWidth)
        strip.scrollTo({ left: button.offsetLeft - strip.offsetLeft, behavior: motion ? 'smooth' : 'auto' });
    }
  }, [active?.id, motion]);
  function move(delta: number) { if (visible.length) setSelected(visible[(index + delta + visible.length) % visible.length].id); }
  function open(item: FieldEntry) {
    setInspecting(item.id);
    window.history.replaceState(null, '', `${location.pathname}${location.search}#${encodeURIComponent(`${item.id}+${item.primary}`)}`);
  }
  function close() { setInspecting(null); window.history.replaceState(null, '', `${location.pathname}${location.search}`); }
  function switchSection(next: GallerySection) {
    setSection(next); setLens('all'); setQuery(''); setSelected(entries[0]?.id);
    const url = new URL(window.location.href);
    url.searchParams.set('view', next);
    window.history.pushState(null, '', `${url.pathname}${url.search}${url.hash}`);
  }
  function toggleMotion() { setMotion(current => { try { localStorage.setItem('apexify.gallery.motion', current ? 'off' : 'on'); } catch {} return !current; }); }
  function toggleTheme() { setLight(current => { try { localStorage.setItem('apexify.gallery.theme', current ? 'dark' : 'light'); } catch {} return !current; }); }
  return <div className="motion-field" data-theme={light ? 'light' : 'dark'} data-motion={motion ? 'on' : 'off'}>
    <a className="field-skip" href="#field-main">Skip to gallery</a>
    <header className="field-header"><a className="field-brand" href="/" aria-label="Apexify.js home"><img src="/brand/apexify-lockup-v2.avif" alt="Apexify.js" width={160} height={53} /></a><nav aria-label="Primary">{NAV.map(([href, title]) => <a key={href} href={href} aria-current={title === 'Gallery' ? 'page' : undefined}>{title}</a>)}</nav><div className="field-header-actions"><button className="field-icon" aria-label={light ? 'Use dark gallery theme' : 'Use light gallery theme'} onClick={toggleTheme}>{light ? <MoonIcon /> : <SunIcon />}</button><button className="field-icon field-menu-toggle" ref={menuButton} onClick={() => setMenu(!menu)} aria-label={menu ? 'Close site menu' : 'Open site menu'} aria-expanded={menu} aria-controls="field-mobile-nav">{menu ? <XMarkIcon /> : <Bars3Icon />}</button></div></header>
    {menu && <nav className="field-mobile-nav" id="field-mobile-nav" aria-label="Mobile primary">{NAV.map(([href, title]) => <a key={href} href={href} aria-current={title === 'Gallery' ? 'page' : undefined}>{title}</a>)}</nav>}
    <main id="field-main" tabIndex={-1}>
      <section className="field-intro"><div><p className="field-eyebrow">THE APEXIFY GALLERY</p><h1>{section === 'templates' ? <>Start with <em>possibility.</em></> : section === 'examples' ? <>See how it’s <em>made.</em></> : section === 'use-cases' ? <>Ideas into <em>output.</em></> : <>Explore the <em>possible.</em></>}</h1><p>Real ideas. Rendered with code. Find a use case, start from a template,<br className="field-desktop-break" /> or take an example apart and make it yours.</p></div><label className="field-search"><MagnifyingGlassIcon /><input ref={search} value={query} onChange={event => setQuery(event.target.value)} placeholder={section === 'use-cases' ? 'Find a use case…' : 'Find an idea…'} aria-label="Search gallery" />{query ? <button aria-label="Clear search" onClick={() => { setQuery(''); search.current?.focus(); }}><XMarkIcon /></button> : <kbd>⌘ K</kbd>}</label></section>
      <div className="field-navigation"><nav className="field-sections" aria-label="Gallery sections">{SECTIONS.map(({ id, label, detail, Icon }) => <button key={id} aria-pressed={section === id} onClick={() => switchSection(id)}><Icon /><span><strong>{label}</strong><small>{detail}</small></span></button>)}</nav>{section !== 'use-cases' && <div className="field-segment field-view" aria-label="Gallery layout"><button aria-pressed={layout === 'stage'} onClick={() => setLayout('stage')}>Stage</button><button aria-pressed={layout === 'grid'} onClick={() => setLayout('grid')}>Grid</button></div>}</div>
      {section === 'use-cases' ? <div className="field-use-cases">{cases.map((useCase, i) => {
        const item = entries.find(entry => entry.id === useCase.template)!;
        return <article className="field-case" key={useCase.id}><button className="field-case-art" aria-label={`View ${item.title} template`} onClick={() => open(item)}><FieldThumbnail item={item} /></button><div><p className="field-eyebrow">0{i + 1} / {useCase.label}</p><h2>{useCase.title}</h2><p>{useCase.description}</p><button className="field-text-link" onClick={() => { setSection('explore'); setLens(useCase.lens); setQuery(''); setSelected(useCase.template); }}>{useCase.action} <ArrowRightIcon /></button></div></article>;
      })}{!cases.length && <div className="field-empty"><h2>No use cases found.</h2><button onClick={() => setQuery('')}>Clear search</button></div>}</div> : <>
        <div className="field-filter-row"><div className="field-filters" aria-label="Filter gallery">{FILTERS.map(([id, label]) => <button key={id} aria-pressed={lens === id} onClick={() => setLens(id)}>{id === lens && id !== 'all' && <span className="field-dot" />}{label}</button>)}</div><span className="field-result-count" role="status">{visible.length} {visible.length === 1 ? 'result' : 'results'}</span></div>
        {!active ? <div className="field-empty"><h2>No matches. Try another angle.</h2><p>Search a title, technique or use case, or clear the current filters.</p><button className="field-primary" onClick={() => { setQuery(''); setLens('all'); }}>Clear filters <ArrowRightIcon /></button></div>
          : layout === 'stage' ? <>
            <section className="field-stage" tabIndex={0} aria-label="Gallery stage. Use left and right arrow keys to browse." onKeyDown={event => {
              if (event.target instanceof HTMLInputElement || event.target instanceof HTMLVideoElement) return;
              if (event.key === 'ArrowRight') { event.preventDefault(); move(1); } if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
            }} onPointerDown={event => { if (!(event.target as HTMLElement).closest('button,input,video')) swipe.current = event.clientX; }} onPointerUp={event => { if (swipe.current !== null && Math.abs(event.clientX - swipe.current) > 60) move(event.clientX < swipe.current ? 1 : -1); swipe.current = null; }} onPointerCancel={() => { swipe.current = null; }}>
              {visible.length > 1 && <button className="field-neighbor field-neighbor-left" aria-label={`Previous: ${visible[(index - 1 + visible.length) % visible.length].title}`} onClick={() => move(-1)}><FieldThumbnail item={visible[(index - 1 + visible.length) % visible.length]} /><span>{visible[(index - 1 + visible.length) % visible.length].title}</span></button>}
              <div className="field-stage-center" key={active.id}><FieldPlayer item={active} motion={motion && !inspecting} onInspect={() => open(active)} /></div>
              {visible.length > 1 && <button className="field-neighbor field-neighbor-right" aria-label={`Next: ${visible[(index + 1) % visible.length].title}`} onClick={() => move(1)}><FieldThumbnail item={visible[(index + 1) % visible.length]} /><span>{visible[(index + 1) % visible.length].title}</span></button>}
              <button className="field-stage-arrow field-stage-prev" aria-label="Previous gallery item" disabled={visible.length < 2} onClick={() => move(-1)}><ChevronLeftIcon /></button><button className="field-stage-arrow field-stage-next" aria-label="Next gallery item" disabled={visible.length < 2} onClick={() => move(1)}><ChevronRightIcon /></button>
              <div className="field-stage-footer"><span className="field-mono">{String(index + 1).padStart(2, '0')} / {String(visible.length).padStart(2, '0')} <span className="field-swipe-hint">· Swipe or use arrow keys</span></span><button className="field-motion" onClick={toggleMotion} aria-pressed={motion}><span className="field-dot" />Motion {motion ? 'on' : 'off'}{motion ? <PauseIcon /> : <PlayIcon />}</button></div>
            </section>
            <div className="field-detail" aria-live="polite"><div><p className="field-eyebrow">{active.primary} / {active.kind}</p><h2>{active.title}</h2><p>{active.description}</p></div><div className="field-detail-proof"><span className="field-runtime">Node · apexify.js</span><span className="field-mono">{active.sourceLabel}</span></div><div className="field-detail-action"><button className="field-primary" onClick={() => open(active)}>{active.kind === 'showcase' ? 'View showcase' : 'View example'} <ArrowUpRightIcon /></button><button className="field-text-link" onClick={() => { setSection('templates'); setQuery(''); setLens(active.primary); }}>Related templates <ArrowRightIcon /></button></div></div>
            <div ref={filmstrip} className="field-filmstrip" aria-label="Gallery filmstrip">{visible.map((item, i) => <button key={item.id} aria-pressed={active.id === item.id} onClick={() => setSelected(item.id)}><div className="field-filmstrip-image"><FieldThumbnail item={item} eager={i < 5} /><span>{String(i + 1).padStart(2, '0')}</span></div><strong>{item.title}</strong><small>{item.primary}</small></button>)}</div>
          </> : <><div className="field-grid">{visible.slice(0, limit).map(item => <button className="field-grid-card" key={item.id} onClick={() => open(item)}><div><FieldThumbnail item={item} /><span className="field-grid-type">{item.kind}</span></div><h2>{item.title}<ArrowUpRightIcon /></h2><p>{item.description}</p><small>{item.difficulty ?? item.sourceLabel}</small></button>)}</div>{visible.length > limit && <button className="field-load-more" onClick={() => setLimit(value => value + 16)}>Load more examples ({visible.length - limit} remaining)</button>}</>}
      </>}
      <section className="field-next"><div><p className="field-eyebrow">LESS GUESSWORK. MORE MAKING.</p><h2>The output is only<br /><em>the beginning.</em></h2></div><p>Every canvas template includes complete source, a walkthrough and its rendered PNG. Open one, change a few settings, and build from there.<a className="field-text-link" href="/docs/node/canvas">Learn the canvas workflow <ArrowUpRightIcon /></a></p></section>
    </main>
    <footer className="field-footer"><span>APEXIFY.JS / CODE. COMPOSE. CREATE.</span><a href="/docs/getting-started">Documentation <ArrowUpRightIcon /></a><a href="https://github.com/EIAS79/Apexify.js">GitHub <ArrowUpRightIcon /></a></footer>
    {inspected && <FieldInspector key={inspected.id} item={inspected} motion={motion} onClose={close} />}
  </div>;
}
