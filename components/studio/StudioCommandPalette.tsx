'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import {
  STUDIO_ACTIONS,
  STUDIO_TEMPLATES,
  StudioAction,
  StudioActionId,
  StudioTemplate,
} from '@/lib/studio/studioConfig';

export type PaletteItem =
  | { kind: 'action'; id: StudioActionId; action: StudioAction }
  | { kind: 'template'; id: string; template: StudioTemplate };

const ACTION_ITEMS: PaletteItem[] = STUDIO_ACTIONS.map((a) => ({
  kind: 'action',
  id: a.id,
  action: a,
}));

const TEMPLATE_ITEMS: PaletteItem[] = STUDIO_TEMPLATES.map((t) => ({
  kind: 'template',
  id: `template:${t.id}`,
  template: t,
}));

const ALL_ITEMS: PaletteItem[] = [...ACTION_ITEMS, ...TEMPLATE_ITEMS];

function score(query: string, item: PaletteItem): number {
  if (!query) return 1;
  const q = query.toLowerCase();
  const haystack =
    item.kind === 'action'
      ? `${item.action.label} ${item.action.group} ${item.action.keywords ?? ''}`.toLowerCase()
      : `template ${item.template.name} ${item.template.group} ${item.template.blurb}`.toLowerCase();
  if (haystack.includes(q)) {
    return haystack.indexOf(q) === 0 ? 3 : 2;
  }
  let i = 0;
  for (const ch of q) {
    const idx = haystack.indexOf(ch, i);
    if (idx === -1) return 0;
    i = idx + 1;
  }
  return 1;
}

export function StudioCommandPalette({
  open,
  onClose,
  onAction,
  onLoadTemplate,
}: {
  open: boolean;
  onClose: () => void;
  onAction: (id: StudioActionId) => void;
  onLoadTemplate: (template: StudioTemplate) => void;
}) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const filtered = useMemo(() => {
    return ALL_ITEMS.map((item) => ({ item, s: score(query, item) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .map((x) => x.item);
  }, [query]);

  useEffect(() => {
    if (active >= filtered.length) setActive(0);
  }, [filtered, active]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive((i) => Math.min(filtered.length - 1, i + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((i) => Math.max(0, i - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = filtered[active];
        if (!item) return;
        if (item.kind === 'action') onAction(item.action.id);
        else onLoadTemplate(item.template);
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, filtered, active, onAction, onLoadTemplate, onClose]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          className="fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[12vh]"
          style={{ backgroundColor: 'color-mix(in srgb, var(--bg-base) 70%, black)', backdropFilter: 'blur(10px)' }}
        >
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Studio command palette"
            className="w-full max-w-xl overflow-hidden rounded-2xl"
            style={{
              backgroundColor: 'var(--bg-raised)',
              border: '1px solid var(--border-default)',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{ borderBottom: '1px solid var(--border-subtle)' }}
            >
              <MagnifyingGlassIcon className="h-4 w-4 shrink-0" style={{ color: 'var(--text-tertiary)' }} aria-hidden />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Run a command, jump to a template…"
                className="w-full bg-transparent text-sm outline-none"
                style={{ color: 'var(--text-primary)' }}
                autoComplete="off"
                spellCheck={false}
              />
              <kbd className="kbd hidden sm:inline-flex">esc</kbd>
            </div>

            <ul
              ref={listRef}
              className="max-h-[52vh] overflow-y-auto py-1.5"
              role="listbox"
              aria-activedescendant={filtered[active] ? `palette-${active}` : undefined}
            >
              {filtered.length === 0 && (
                <li className="px-4 py-6 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  No matches.
                </li>
              )}
              {filtered.map((item, i) => {
                const isActive = i === active;
                const meta =
                  item.kind === 'action'
                    ? { primary: item.action.label, group: item.action.group, shortcut: item.action.shortcut, badge: 'CMD' }
                    : { primary: item.template.name, group: item.template.group, shortcut: undefined, badge: 'TPL' };
                const blurb =
                  item.kind === 'template' ? item.template.blurb : undefined;
                return (
                  <li
                    key={item.id}
                    id={`palette-${i}`}
                    data-idx={i}
                    role="option"
                    aria-selected={isActive}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => {
                      if (item.kind === 'action') onAction(item.action.id);
                      else onLoadTemplate(item.template);
                      onClose();
                    }}
                    className="mx-1.5 flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors"
                    style={{
                      backgroundColor: isActive
                        ? 'color-mix(in srgb, var(--accent-iris) 14%, transparent)'
                        : 'transparent',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <span
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-[10px] font-bold uppercase tracking-wider"
                      style={{
                        background: meta.badge === 'TPL' ? 'var(--gradient-iris)' : 'var(--gradient-sunset)',
                        color: 'white',
                      }}
                      aria-hidden
                    >
                      {meta.badge}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {meta.primary}
                      </span>
                      <span className="truncate text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                        {meta.group}
                        {blurb ? ` · ${blurb}` : ''}
                      </span>
                    </span>
                    {meta.shortcut && (
                      <span className="hidden gap-1 sm:inline-flex">
                        {meta.shortcut.split(' ').map((k, ki) => (
                          <kbd key={ki} className="kbd">
                            {k}
                          </kbd>
                        ))}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>

            <div
              className="flex items-center justify-between gap-3 px-4 py-2 text-[11px]"
              style={{
                borderTop: '1px solid var(--border-subtle)',
                color: 'var(--text-tertiary)',
                backgroundColor: 'var(--bg-sunken)',
              }}
            >
              <span className="inline-flex items-center gap-2">
                <kbd className="kbd">↑</kbd><kbd className="kbd">↓</kbd>
                navigate
              </span>
              <span className="inline-flex items-center gap-2">
                <kbd className="kbd">↵</kbd>
                select
              </span>
              <span className="inline-flex items-center gap-2">
                <kbd className="kbd">⌘</kbd><kbd className="kbd">K</kbd>
                toggle
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
