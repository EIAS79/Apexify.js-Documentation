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
import { BrandIcon } from '@/components/Brand';
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
      className="relative z-40 flex shrink-0 flex-col gap-2 px-3 py-2 sm:px-4 md:flex-row md:items-center md:gap-3"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--bg-raised) 92%, transparent)',
        backdropFilter: 'blur(16px) saturate(140%)',
        WebkitBackdropFilter: 'blur(16px) saturate(140%)',
        borderBottom: '1px solid var(--border-default)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Left — Logo + view controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          href="/"
          className="group/logo flex shrink-0 items-center gap-2.5 rounded-lg px-1.5 py-1 transition-colors"
          aria-label="Apexify.js — home"
          title="Back to home"
        >
          <span
            aria-hidden
            className="relative inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl transition-transform duration-300 group-hover/logo:scale-105 sm:h-9 sm:w-9"
            style={{ boxShadow: 'var(--glow-magenta)' }}
          >
            <BrandIcon />
          </span>
          <span className="hidden flex-col leading-tight sm:flex">
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.28em]"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Apexify
            </span>
            <span className="text-sm font-bold text-grad-aurora">Studio</span>
          </span>
        </Link>

        <span
          aria-hidden
          className="hidden h-6 w-px shrink-0 md:block"
          style={{ backgroundColor: 'var(--border-default)' }}
        />

        <LangPills lang={lang} onChange={onLangChange} />
        <LayoutPills mode={layout} onChange={onLayoutChange} />
      </div>

      <span aria-hidden className="hidden flex-1 md:block" />

      {/* Center — Execution controls */}
      <div
        className="flex items-center gap-1 rounded-xl p-1"
        style={{
          border: '1px solid var(--border-default)',
          backgroundColor: 'color-mix(in srgb, var(--bg-base) 60%, transparent)',
        }}
      >
        <button
          type="button"
          onClick={onRun}
          disabled={running || !runnerEnabled}
          className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[12px] sm:text-[13px] font-bold transition-all active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: 'var(--gradient-sunset)',
            color: 'white',
            boxShadow: running ? 'none' : '0 2px 12px -3px rgba(236, 72, 153, 0.5)',
          }}
          title="Run snippet (⌘↵)"
        >
          <PlayIcon className="h-4 w-4 shrink-0" aria-hidden />
          <span>{running ? 'Running…' : 'Run'}</span>
        </button>

        <button
          type="button"
          onClick={() => onAutoRunChange(!autoRun)}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] sm:text-[12px] font-semibold transition-all active:scale-[0.97]"
          style={{
            background: autoRun
              ? 'linear-gradient(135deg, var(--accent-iris), var(--accent-magenta))'
              : 'transparent',
            color: autoRun ? 'white' : 'var(--text-secondary)',
            boxShadow: autoRun ? '0 2px 10px -3px var(--accent-iris)' : 'none',
          }}
          title={autoRun ? 'Auto-run active — click to disable' : 'Enable auto-run on typing'}
        >
          <SparklesIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>Auto</span>
          {autoRun && (
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: 'rgba(255,255,255,0.85)' }}
            />
          )}
        </button>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] sm:text-[12px] font-semibold transition-all active:scale-[0.97]"
          style={{
            color: 'var(--text-secondary)',
          }}
          title="Reset to starter snippet"
        >
          <ArrowPathIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="hidden min-[420px]:inline">Reset</span>
        </button>
      </div>

      <span aria-hidden className="hidden flex-1 md:block" />

      {/* Right — Templates + utils */}
      <div className="flex flex-wrap items-center gap-2">
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
            title="Open command palette (⌘K)"
          >
            <CommandLineIcon className="h-3.5 w-3.5" aria-hidden />
            <span className="hidden min-[480px]:inline">Cmd</span>
          </button>

          <button
            type="button"
            onClick={onCopyShareLink}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-colors active:scale-[0.98]"
            style={{ color: shareCopied ? 'var(--success)' : 'var(--text-secondary)' }}
            title="Copy share link"
          >
            <ShareIcon className="h-3.5 w-3.5" aria-hidden />
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
          </button>

          <button
            type="button"
            onClick={onOpenShortcuts}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-colors active:scale-[0.98]"
            style={{ color: 'var(--text-secondary)' }}
            title="Show keyboard shortcuts (?)"
          >
            <QuestionMarkCircleIcon className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>

        <ThemeToggle />
      </div>
    </header>
  );
}
