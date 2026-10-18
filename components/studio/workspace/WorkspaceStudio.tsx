'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import CodeStudio from '@/components/studio/CodeStudio';
import type { StudioMode } from '@/components/studio/StudioModeSwitch';
import { StudioSharedSessionProvider, useStudioSharedSession } from '@/components/studio/StudioSharedSession';
import { STUDIO_TEMPLATES, type StudioBuffer } from '@/lib/studio/studioConfig';
import { loadPersistedStudio } from '@/lib/studio/studioStorage';

const VisualStudio = dynamic(() => import('@/components/studio/visual/VisualStudio'), {
  ssr: false,
  loading: () => <div className="ws01-loading" role="status">Loading the existing Visual authoring engine…</div>,
});

type Drawer = 'files' | 'templates' | 'assets' | 'projects' | null;
type DockTab = 'results' | 'diagnostics' | 'history';
type ResizeTarget = 'drawer' | 'inspector' | 'dock';
const LAYOUT_KEY = 'apexify-workspace-layout-ws01-v1';
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const NAV: Array<{ id: Exclude<Drawer, null>; text: string; icon: string }> = [
  { id: 'projects', text: 'Projects', icon: '▣' },
  { id: 'files', text: 'Code files', icon: '▤' },
  { id: 'templates', text: 'Templates', icon: '▦' },
  { id: 'assets', text: 'Assets', icon: '◇' },
];

function StudioWorkspaceContent() {
  const [mode, setMode] = useState<StudioMode>('visual');
  const [visualVisited, setVisualVisited] = useState(true);
  const [codeVisited, setCodeVisited] = useState(false);
  const [drawer, setDrawer] = useState<Drawer>(null);
  const [buffers, setBuffers] = useState<StudioBuffer[]>([]);
  const [activeId, setActiveId] = useState<string | undefined>();
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [dockOpen, setDockOpen] = useState(false);
  const [dockTab, setDockTab] = useState<DockTab>('results');
  const [drawerWidth, setDrawerWidth] = useState(260);
  const [inspectorWidth, setInspectorWidth] = useState(300);
  const [dockHeight, setDockHeight] = useState(210);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [layoutHydrated, setLayoutHydrated] = useState(false);
  const [mobile, setMobile] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const drawerRef = useRef<HTMLElement | null>(null);
  const inspectorRef = useRef<HTMLElement | null>(null);
  const { assets, assetStorageReady, setCodeHandoff, previewArtifacts, activeArtifactId,
    error, previewWarnings, history, elapsedMs, previewProvenance } = useStudioSharedSession();

  const refreshFiles = useCallback(() => {
    const state = loadPersistedStudio();
    setBuffers(state?.buffers ?? []);
    setActiveId(state?.activeBufferId);
  }, []);

  useEffect(() => { refreshFiles(); }, [refreshFiles]);

  useEffect(() => {
    const measure = () => setMobile(window.innerWidth < 1200);
    measure();
    window.addEventListener('resize', measure);
    try {
      const value = JSON.parse(window.localStorage.getItem(LAYOUT_KEY) || '{}');
      if (Number.isFinite(value.drawerWidth)) setDrawerWidth(clamp(value.drawerWidth, 230, 340));
      if (Number.isFinite(value.inspectorWidth)) setInspectorWidth(clamp(value.inspectorWidth, 260, 390));
      if (Number.isFinite(value.dockHeight)) setDockHeight(clamp(value.dockHeight, 150, 350));
      if (value.theme === 'light' || value.theme === 'dark') setTheme(value.theme);
    } catch { /* Preferences may be corrupt/blocked; the editor still works. */ }
    setLayoutHydrated(true);
    return () => window.removeEventListener('resize', measure);
  }, []);

  useEffect(() => {
    if (!layoutHydrated) return;
    try {
      window.localStorage.setItem(LAYOUT_KEY, JSON.stringify({
        drawerWidth, inspectorWidth, dockHeight, theme,
      }));
    } catch { /* Storage is optional for layout preferences only. */ }
  }, [layoutHydrated, drawerWidth, inspectorWidth, dockHeight, theme]);

  useEffect(() => {
    if (!mobile) return;
    const panel = inspectorOpen ? inspectorRef.current : drawer ? drawerRef.current : null;
    const firstClose = panel?.querySelector<HTMLButtonElement>('.ws01-dismiss');
    firstClose?.focus();
  }, [mobile, drawer, inspectorOpen]);

  const closePanels = () => {
    setDrawer(null); setInspectorOpen(false); setDockOpen(false);
    triggerRef.current?.focus();
  };
  const beginResize = (target: ResizeTarget, event: ReactPointerEvent<HTMLDivElement>) => {
    if (mobile && target !== 'dock') return;
    event.preventDefault();
    const startX = event.clientX, startY = event.clientY;
    const startSize = target === 'drawer' ? drawerWidth : target === 'inspector' ? inspectorWidth : dockHeight;
    const move = (next: PointerEvent) => {
      if (target === 'drawer') setDrawerWidth(clamp(startSize + next.clientX - startX, 230, 340));
      else if (target === 'inspector') setInspectorWidth(clamp(startSize + startX - next.clientX, 260, 390));
      else setDockHeight(clamp(startSize + startY - next.clientY, 150, 350));
    };
    const stop = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop, { once: true });
    window.addEventListener('pointercancel', stop, { once: true });
  };
  const resizeByKeys = (target: ResizeTarget, event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key)) return;
    event.preventDefault();
    const delta = event.shiftKey ? 24 : 8;
    if (target === 'drawer') setDrawerWidth(size => event.key === 'Home' ? 230 : event.key === 'End' ? 340 : clamp(size + (event.key === 'ArrowRight' ? delta : -delta), 230, 340));
    if (target === 'inspector') setInspectorWidth(size => event.key === 'Home' ? 260 : event.key === 'End' ? 390 : clamp(size + (event.key === 'ArrowLeft' ? delta : -delta), 260, 390));
    if (target === 'dock') setDockHeight(size => event.key === 'Home' ? 150 : event.key === 'End' ? 350 : clamp(size + (event.key === 'ArrowDown' ? delta : -delta), 150, 350));
  };

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && (drawer !== null || inspectorOpen || dockOpen)) closePanels();
      if (event.key === 'Tab' && mobile) {
        const panel = inspectorOpen ? inspectorRef.current : drawer ? drawerRef.current : null;
        if (!panel) return;
        const all = [...panel.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),[tabindex="0"]')]
          .filter(element => element.getBoundingClientRect().width > 0);
        if (!all.length) return;
        if (event.shiftKey && document.activeElement === all[0]) {
          event.preventDefault(); all[all.length - 1].focus();
        } else if (!event.shiftKey && document.activeElement === all[all.length - 1]) {
          event.preventDefault(); all[0].focus();
        }
      }
    };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [drawer, inspectorOpen, dockOpen, mobile]);

  const chooseMode = (next: StudioMode) => {
    setMode(next);
    if (next === 'visual') setVisualVisited(true);
    if (next === 'code') { setCodeVisited(true); refreshFiles(); }
  };

  const toggleDrawer = (next: Exclude<Drawer, null>) => {
    if (drawer === next) { setDrawer(null); triggerRef.current?.focus(); return; }
    if (next === 'files') refreshFiles();
    setDrawer(next);
  };

  const useTemplate = (id: string) => {
    const template = STUDIO_TEMPLATES.find(item => item.id === id);
    if (!template) return;
    setCodeHandoff({
      id: 'workspace-template-' + Date.now() + '-' + id,
      name: template.name,
      source: template.ts,
    });
    chooseMode('code');
    setDrawer(null);
  };

  const drawerTitle = drawer === 'files' ? 'Code files' :
    drawer === 'templates' ? 'Verified Studio examples' :
    drawer === 'assets' ? 'Session assets' : 'Existing projects';

  return (
    <div className="ws01" data-workspace-studio data-workspace-stage="ws01-adaptive" data-ws01-theme={theme}>
      <header className="ws01-header">
        <div className="ws01-brand" aria-label="Apexify.js Workspace Studio">
          <span className="ws01-prism" aria-hidden="true">A</span>
          <span>Apexify<span className="ws01-brand-lime">.js</span></span>
          <span className="ws01-brand-divide" aria-hidden="true">/</span>
          <strong>Studio</strong>
        </div>
        <span className="ws01-preview-label">Workspace preview</span>
        <button type="button" className="ws01-theme-toggle" aria-label={theme === 'dark' ? 'Use light theme' : 'Use dark theme'} onClick={() => setTheme(next => next === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? '☼' : '☾'}</button>
        <nav className="ws01-site-nav" aria-label="Website">
          <Link href="/">Home</Link>
          <Link href="/docs/getting-started">Docs</Link>
          <Link href="/gallery">Gallery</Link>
        </nav>
        <Link className="ws01-back" href="/studio">Current Studio ↗</Link>
      </header>

      <div className="ws01-frame">
        <nav className="ws01-rail" aria-label="Workspace navigation">
          {NAV.map(item => (
            <button
              type="button" key={item.id}
              aria-label={item.text} title={item.text}
              aria-pressed={drawer === item.id}
              className={drawer === item.id ? 'ws01-rail-item is-active' : 'ws01-rail-item'}
              onClick={(event) => { triggerRef.current = event.currentTarget; toggleDrawer(item.id); }}
            >
              <span className="ws01-rail-icon" aria-hidden="true">{item.icon}</span>
              <span className="ws01-rail-label">{item.text}</span>
            </button>
          ))}
          <button
            type="button" title="Visual authoring" aria-label="Visual authoring"
            className="ws01-rail-item ws01-visual-tool"
            onClick={() => { chooseMode('visual'); setDrawer(null); }}
          >
            <span className="ws01-rail-icon" aria-hidden="true">✧</span>
            <span className="ws01-rail-label">Visual</span>
          </button>
        </nav>

        {drawer !== null ? (
          <>
            <button
              className="ws01-mobile-shade" type="button" aria-label="Close navigation"
              onClick={() => { setDrawer(null); triggerRef.current?.focus(); }}
            />
            <aside ref={drawerRef} className="ws01-drawer" role={mobile ? 'dialog' : undefined} aria-modal={mobile ? 'true' : undefined} aria-label={drawerTitle} style={{ "--ws01-drawer-width": drawerWidth + "px" } as CSSProperties}>
              <div className="ws01-drawer-title">
                <h2>{drawerTitle}</h2>
                <button type="button" aria-label="Close panel" className="ws01-dismiss" onClick={() => { setDrawer(null); triggerRef.current?.focus(); }}>×</button>
              </div>
              {drawer === 'files' && (
                <div className="ws01-drawer-body">
                  <p>Code Studio buffers saved in this browser. Opening a file is managed by the existing Code editor until WS-05.</p>
                  {buffers.length ? buffers.map(buffer => (
                    <div key={buffer.id} className="ws01-entry">
                      <span aria-hidden="true">⌘</span>
                      <span>{buffer.name}</span>
                      {buffer.id === activeId && <small>Active</small>}
                    </div>
                  )) : <p className="ws01-empty">No Code Studio buffers found. Use Code mode to create one.</p>}
                  <button type="button" className="ws01-entry" onClick={() => { chooseMode('code'); setDrawer(null); }}>Open Code editor ↗</button>
                </div>
              )}
              {drawer === 'templates' && (
                <div className="ws01-drawer-body">
                  <p>Actual existing Apexify.js Studio examples. Choosing one opens its source in Code Studio.</p>
                  {STUDIO_TEMPLATES.map(item => (
                    <button key={item.id} className="ws01-entry ws01-template" type="button" onClick={() => useTemplate(item.id)}>
                      <span className="ws01-template-name">{item.name}<small>{item.group}</small></span>
                      <span aria-hidden="true">↗</span>
                    </button>
                  ))}
                </div>
              )}
              {drawer === 'assets' && (
                <div className="ws01-drawer-body">
                  <p>Shared session files from the existing asset library. Upload and editing remain in the legacy editor for now.</p>
                  {!assetStorageReady && <p role="status">Loading assets…</p>}
                  {assetStorageReady && !assets.length && <p className="ws01-empty">No saved assets in this browser.</p>}
                  {assets.map(asset => (
                    <div className="ws01-entry" key={asset.id}>
                      <span aria-hidden="true">◇</span>
                      <span>{asset.name}<small>{asset.mime} · {(asset.size / 1024).toFixed(1)} KiB</small></span>
                    </div>
                  ))}
                </div>
              )}
              {drawer === 'projects' && (
                <div className="ws01-drawer-body">
                  <p>WorkspaceProject storage and migrations are scheduled for WS-02. The current project data remains in the existing Studios.</p>
                  <Link className="ws01-entry" href="/studio/legacy/code">Open legacy Code projects ↗</Link>
                  <Link className="ws01-entry" href="/studio/legacy/visual">Open legacy Visual project ↗</Link>
                </div>
              )}
              {!mobile && <div className="ws01-resizer ws01-resizer--drawer" role="separator" aria-label="Resize navigation drawer"
                aria-orientation="vertical" aria-valuemin={230} aria-valuemax={340} aria-valuenow={drawerWidth} tabIndex={0}
                onPointerDown={event => beginResize('drawer', event)} onKeyDown={event => resizeByKeys('drawer', event)} />}
            </aside>
          </>
        ) : null}

        <main className="ws01-main" aria-label="Studio main workspace">
          <div className="ws01-toolbar">
            <div className="ws01-modes" role="group" aria-label="Authoring workspace">
              <button type="button" className={mode === 'visual' ? 'is-active' : ''} aria-pressed={mode === 'visual'} onClick={() => chooseMode('visual')}>Visual</button>
              <button type="button" className={mode === 'code' ? 'is-active' : ''} aria-pressed={mode === 'code'} onClick={() => chooseMode('code')}>Code</button>
              <button type="button" disabled title="Graph authoring is planned for WS-06 and is not implemented" aria-label="Graph not yet available">Graph · Later</button>
            </div>
            <div className="ws01-panel-actions">
              <button type="button" aria-expanded={inspectorOpen} aria-controls="ws01-inspector"
                className={inspectorOpen ? 'is-open' : ''} onClick={event => { triggerRef.current = event.currentTarget; setInspectorOpen(open => !open); }}>Properties</button>
              <button type="button" aria-expanded={dockOpen} aria-controls="ws01-dock"
                className={dockOpen ? 'is-open' : ''} onClick={event => { triggerRef.current = event.currentTarget; setDockOpen(open => !open); }}>Outputs {previewArtifacts.length ? '(' + previewArtifacts.length + ')' : ''}</button>
            </div>
            <button className="ws01-mobile-panel" type="button" aria-label="Open Files panel" onClick={event => { triggerRef.current = event.currentTarget; toggleDrawer('files'); }}>☰</button>
          </div>

          <div className="ws01-authoring" data-ws01-current-mode={mode}>
            <section className="ws01-pane" hidden={mode !== 'code'} aria-label="Code editor workspace">
              {codeVisited && <CodeStudio embedded mode={mode} onModeChange={chooseMode} workspaceCompact={mobile && typeof window !== 'undefined' && window.innerWidth < 760} />}
            </section>
            {visualVisited && (
              <section className="ws01-pane" hidden={mode !== 'visual'} aria-label="Visual editor workspace">
                <VisualStudio active={mode === 'visual'} mode={mode} onModeChange={chooseMode} workspaceShell />
              </section>
            )}
          </div>

          {dockOpen && <section id="ws01-dock" className="ws01-dock" aria-label="Actual session outputs" style={{ "--ws01-dock-height": dockHeight + "px" } as CSSProperties}>
            <div className="ws01-resizer ws01-resizer--dock" role="separator" aria-label="Resize output dock" aria-orientation="horizontal"
              aria-valuemin={150} aria-valuemax={350} aria-valuenow={dockHeight} tabIndex={0}
              onPointerDown={event => beginResize('dock', event)} onKeyDown={event => resizeByKeys('dock', event)} />
            <div className="ws01-dock-tabs" role="group" aria-label="Output and diagnostics tabs">
              {(['results','diagnostics','history'] as const).map(tab => <button type="button" key={tab} aria-pressed={dockTab === tab} onClick={() => setDockTab(tab)}>{tab === 'results' ? 'Results' : tab === 'diagnostics' ? 'Diagnostics' : 'Run history'}</button>)}
              <button className="ws01-dismiss" type="button" aria-label="Close output dock" onClick={() => { setDockOpen(false); triggerRef.current?.focus(); }}>×</button>
            </div>
            <div className="ws01-dock-body">
              {dockTab === 'results' && (previewArtifacts.length ? <ul>{previewArtifacts.map((artifact,index) => <li key={artifact.id} className={activeArtifactId === artifact.id ? 'is-current' : ''}>Artifact {index + 1}: {artifact.id}</li>)}</ul> : <p>No artifacts in this session. Run code or render a Visual composition first.</p>)}
              {dockTab === 'diagnostics' && (error || previewWarnings.length ? <div role="status">{error && <p className="ws01-error">{error}</p>}{previewWarnings.map((warning,index) => <p key={index}>{warning}</p>)}</div> : <p>No current diagnostics.</p>)}
              {dockTab === 'history' && (history.length ? <ul>{history.slice(0,20).map(entry => <li key={entry.id}>{entry.bufferName} — {entry.ok ? 'Succeeded' : 'Failed'} — {new Date(entry.ts).toLocaleString()}</li>)}</ul> : <p>No execution history in this session.</p>)}
            </div>
          </section>}
          <div className="ws01-status">
            <span><i aria-hidden="true"/> Workspace UI foundation</span>
            <span>Real editor engines · {previewArtifacts.length} outputs · {elapsedMs == null ? 'No run timing' : elapsedMs + ' ms'} · {previewProvenance || 'Not executed'} · Graph / queue remain planned.</span>
          </div>
        </main>
        {inspectorOpen && <>
          {mobile && <button type="button" className="ws01-mobile-shade ws01-inspector-shade" aria-label="Close properties panel"
            onClick={() => { setInspectorOpen(false); triggerRef.current?.focus(); }} />}
          <aside ref={inspectorRef} className="ws01-inspector" id="ws01-inspector" role={mobile ? 'dialog' : undefined} aria-modal={mobile ? 'true' : undefined} aria-label="Session properties"
            style={{ "--ws01-inspector-width": inspectorWidth + "px" } as CSSProperties}>
            {!mobile && <div className="ws01-resizer ws01-resizer--inspector" role="separator" aria-label="Resize properties panel"
              aria-orientation="vertical" aria-valuemin={260} aria-valuemax={390} aria-valuenow={inspectorWidth} tabIndex={0}
              onPointerDown={event => beginResize('inspector', event)} onKeyDown={event => resizeByKeys('inspector', event)} />}
            <div className="ws01-drawer-title"><h2>Session properties</h2>
              <button type="button" className="ws01-dismiss" aria-label="Close properties panel"
                onClick={() => { setInspectorOpen(false); triggerRef.current?.focus(); }}>×</button></div>
            <div className="ws01-drawer-body">
              <p>Live session information. Selected object properties are available in the existing Visual inspector.</p>
              <dl className="ws01-facts">
                <div><dt>Editor</dt><dd>{mode === 'code' ? 'Code' : 'Visual'}</dd></div>
                <div><dt>Assets</dt><dd>{assets.length}</dd></div>
                <div><dt>Outputs</dt><dd>{previewArtifacts.length}</dd></div>
                <div><dt>Runtime</dt><dd>{previewProvenance || 'Not run'}</dd></div>
                <div><dt>Elapsed</dt><dd>{elapsedMs == null ? '—' : elapsedMs + ' ms'}</dd></div>
              </dl>
              {error && <p className="ws01-error" role="status">{error}</p>}
            </div>
          </aside>
        </>}
      </div>
    </div>
  );
}

export default function WorkspaceStudio() {
  return (
    <StudioSharedSessionProvider>
      <StudioWorkspaceContent />
    </StudioSharedSessionProvider>
  );
}
