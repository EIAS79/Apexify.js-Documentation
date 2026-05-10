'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  CodeBracketIcon,
  CommandLineIcon,
  PhotoIcon,
  PlayIcon,
  QuestionMarkCircleIcon,
  ShareIcon,
  SparklesIcon,
  ViewColumnsIcon,
} from '@heroicons/react/24/outline';
import ThemeToggle from '@/components/ThemeToggle';
import {
  STUDIO_TEMPLATES,
  StudioLang,
  StudioTemplate,
  LayoutMode,
} from '@/lib/studio/studioConfig';

type TopBarProps = {
  layout: LayoutMode;
  onLayoutChange: (m: LayoutMode) => void;
  lang: StudioLang;
  onLangChange: (l: StudioLang) => void;
  running: boolean;
  runnerEnabled: boolean;
  autoRun: boolean;
  onAutoRunChange: (next: boolean) => void;
  onRun: () => void;
  onReset: () => void;
  onLoadTemplate: (t: StudioTemplate) => void;
  onCopyShareLink: () => void;
  shareCopied: boolean;
  onDownloadOutput: () => void;
  hasOutput: boolean;
  onOpenPalette: () => void;
  onOpenShortcuts: () => void;
};

function LayoutPills({
  mode,
  onChange,
}: {
  mode: LayoutMode;
  onChange: (m: LayoutMode) => void;
}) {
  const item = (m: LayoutMode, Icon: typeof CodeBracketIcon, label: string) => {
    const active = mode === m;
    return (
      <button
        type="button"
        aria-pressed={active}
        onClick={() => onChange(m)}
        className="touch-manipulation inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-colors active:scale-[0.98] sm:text-xs"
        style={{
          color: active ? 'white' : 'var(--text-secondary)',
          background: active ? 'var(--gradient-sunset)' : 'transparent',
          boxShadow: active ? 'var(--glow-magenta)' : 'none',
        }}
        title={label}
      >
        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="hidden min-[480px]:inline">{label}</span>
      </button>
    );
  };

  return (
    <div
      className="flex items-center gap-0.5 rounded-lg p-0.5"
      style={{ border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-raised)' }}
      role="group"
      aria-label="Layout"
    >
      {item('code', CodeBracketIcon, 'Code')}
      {item('split', ViewColumnsIcon, 'Split')}
      {item('media', PhotoIcon, 'Preview')}
    </div>
  );
}

function LangPills({
  lang,
  onChange,
}: {
  lang: StudioLang;
  onChange: (l: StudioLang) => void;
}) {
  const pill = (id: StudioLang, label: string) => {
    const active = lang === id;
    return (
      <button
        type="button"
        aria-pressed={active}
        onClick={() => onChange(id)}
        className="rounded-md px-2.5 py-1.5 text-[11px] font-bold tracking-wide transition-colors active:scale-[0.98] sm:text-xs"
        style={{
          color: active ? 'white' : 'var(--text-secondary)',
          background: active ? 'var(--accent-iris)' : 'transparent',
        }}
      >
        {label}
      </button>
    );
  };
  return (
    <div
      className="flex items-center gap-0.5 rounded-lg p-0.5"
      style={{ border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-raised)' }}
      role="group"
      aria-label="Language"
    >
      {pill('ts', 'TS')}
      {pill('js', 'JS')}
    </div>
  );
}

function TemplatesMenu({ onLoad }: { onLoad: (t: StudioTemplate) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', onDoc);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onDoc);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const groups = STUDIO_TEMPLATES.reduce<Record<string, StudioTemplate[]>>((acc, t) => {
    acc[t.group] ??= [];
    acc[t.group].push(t);
    return acc;
  }, {});

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-semibold transition-colors active:scale-[0.98] sm:text-xs"
        style={{
          border: '1px solid var(--border-default)',
          color: 'var(--text-primary)',
          background: 'var(--bg-raised)',
        }}
        title="Load template"
      >
        <SparklesIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="hidden min-[420px]:inline">Templates</span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-xl"
          style={{
            backgroundColor: 'var(--bg-raised)',
            border: '1px solid var(--border-default)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div
            className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.22em]"
            style={{ color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border-subtle)' }}
          >
            Drop into a new tab
          </div>
          <ul className="max-h-[60vh] overflow-y-auto py-1.5">
            {Object.entries(groups).map(([group, items]) => (
              <li key={group} className="px-1.5">
                <p
                  className="px-2 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--accent-magenta)' }}
                >
                  {group}
                </p>
                <ul>
                  {items.map((t) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          onLoad(t);
                          setOpen(false);
                        }}
                        className="flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-[var(--bg-sunken)]"
                      >
                        <span
                          className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md text-[10px] font-bold uppercase tracking-wider"
                          style={{ background: 'var(--gradient-iris)', color: 'white' }}
                          aria-hidden
                        >
                          TPL
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {t.name}
                          </span>
                          <span className="block truncate text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                            {t.blurb}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function StudioTopBar(props: TopBarProps) {
  const {
    layout,
    onLayoutChange,
    lang,
    onLangChange,
    running,
    runnerEnabled,
    autoRun,
    onAutoRunChange,
    onRun,
    onReset,
    onLoadTemplate,
    onCopyShareLink,
    shareCopied,
    onDownloadOutput,
    hasOutput,
    onOpenPalette,
    onOpenShortcuts,
  } = props;

  return (
    <header
      className="relative z-40 flex shrink-0 flex-col gap-2 px-3 py-2.5 sm:px-4 md:flex-row md:items-center md:gap-3"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--bg-raised) 92%, transparent)',
        backdropFilter: 'blur(16px) saturate(140%)',
        WebkitBackdropFilter: 'blur(16px) saturate(140%)',
        borderBottom: '1px solid var(--border-default)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <Link
        href="/"
        className="group inline-flex shrink-0 items-center gap-2 rounded-lg px-1.5 py-1 transition-colors"
        title="Back to home"
      >
        <span
          aria-hidden
          className="grid h-7 w-7 place-items-center rounded-lg font-black"
          style={{
            background: 'var(--gradient-sunset)',
            color: 'white',
            boxShadow: 'var(--glow-magenta)',
            fontSize: '0.85rem',
          }}
        >
          A
        </span>
        <span className="hidden flex-col leading-tight sm:flex">
          <span className="text-[10px] font-semibold uppercase tracking-[0.28em]" style={{ color: 'var(--text-tertiary)' }}>
            Apexify
          </span>
          <span className="text-sm font-bold text-grad-aurora">Studio</span>
        </span>
      </Link>

      <span
        aria-hidden
        className="hidden h-7 w-px shrink-0 md:block"
        style={{ backgroundColor: 'var(--border-default)' }}
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onRun}
          disabled={running || !runnerEnabled}
          className="btn btn-primary text-[12px] sm:text-sm disabled:cursor-not-allowed disabled:opacity-60"
          style={{ padding: '0.5rem 0.875rem', borderRadius: '0.625rem' }}
          title="Run snippet"
        >
          <PlayIcon className="h-4 w-4 shrink-0" aria-hidden />
          <span>{running ? 'Running…' : 'Run'}</span>
          <span className="hidden items-center gap-1 sm:inline-flex">
            <kbd className="kbd" style={{ background: 'rgba(255,255,255,0.18)', borderColor: 'rgba(255,255,255,0.32)', color: 'white' }}>
              ⌘
            </kbd>
            <kbd className="kbd" style={{ background: 'rgba(255,255,255,0.18)', borderColor: 'rgba(255,255,255,0.32)', color: 'white' }}>
              ↵
            </kbd>
          </span>
        </button>

        <label
          className="inline-flex cursor-pointer select-none items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-medium sm:text-xs"
          style={{
            border: '1px solid var(--border-default)',
            color: autoRun ? 'var(--text-primary)' : 'var(--text-tertiary)',
            backgroundColor: autoRun ? 'color-mix(in srgb, var(--accent-iris) 14%, transparent)' : 'transparent',
          }}
          title="Re-run automatically while you type (debounced)"
        >
          <span
            className="relative inline-block h-3.5 w-7 rounded-full transition-colors"
            style={{ backgroundColor: autoRun ? 'var(--accent-iris)' : 'var(--border-strong)' }}
          >
            <span
              className="absolute top-0.5 h-2.5 w-2.5 rounded-full bg-white transition-transform"
              style={{ transform: autoRun ? 'translateX(14px)' : 'translateX(2px)' }}
            />
          </span>
          <span>Auto-run</span>
          <input
            type="checkbox"
            className="sr-only"
            checked={autoRun}
            onChange={(e) => onAutoRunChange(e.target.checked)}
          />
        </label>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[11px] font-semibold transition-colors active:scale-[0.98] sm:text-xs"
          style={{ border: '1px solid var(--border-default)', color: 'var(--text-primary)', background: 'var(--bg-raised)' }}
          title="Reset active tab to starter snippet"
        >
          <ArrowPathIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="hidden min-[420px]:inline">Reset</span>
        </button>
      </div>

      <span aria-hidden className="hidden flex-1 md:block" />

      <div className="flex flex-wrap items-center gap-2">
        <LangPills lang={lang} onChange={onLangChange} />
        <LayoutPills mode={layout} onChange={onLayoutChange} />
        <TemplatesMenu onLoad={onLoadTemplate} />

        <div
          className="flex items-center gap-0.5 rounded-lg p-0.5"
          style={{ border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-raised)' }}
        >
          <button
            type="button"
            onClick={onOpenPalette}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-colors active:scale-[0.98]"
            style={{ color: 'var(--text-secondary)' }}
            title="Open command palette"
          >
            <CommandLineIcon className="h-3.5 w-3.5" aria-hidden />
            <span className="hidden min-[480px]:inline">Cmd</span>
            <span className="hidden items-center gap-0.5 min-[480px]:inline-flex">
              <kbd className="kbd">⌘</kbd>
              <kbd className="kbd">K</kbd>
            </span>
          </button>

          <button
            type="button"
            onClick={onCopyShareLink}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-colors active:scale-[0.98]"
            style={{ color: shareCopied ? 'var(--success)' : 'var(--text-secondary)' }}
            title="Copy share link"
          >
            <ShareIcon className="h-3.5 w-3.5" aria-hidden />
            <span className="hidden min-[420px]:inline">{shareCopied ? 'Copied!' : 'Share'}</span>
          </button>

          <button
            type="button"
            onClick={onDownloadOutput}
            disabled={!hasOutput}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-colors active:scale-[0.98] disabled:opacity-40"
            style={{ color: 'var(--text-secondary)' }}
            title="Download last preview"
          >
            <ArrowDownTrayIcon className="h-3.5 w-3.5" aria-hidden />
            <span className="hidden min-[420px]:inline">Save</span>
          </button>

          <button
            type="button"
            onClick={onOpenShortcuts}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-colors active:scale-[0.98]"
            style={{ color: 'var(--text-secondary)' }}
            title="Show keyboard shortcuts (?)"
          >
            <QuestionMarkCircleIcon className="h-3.5 w-3.5" aria-hidden />
            <span className="hidden min-[480px]:inline">Help</span>
          </button>
        </div>

        <ThemeToggle />
      </div>
    </header>
  );
}
