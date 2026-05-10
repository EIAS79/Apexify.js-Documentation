'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';

const GROUPS: Array<{ title: string; rows: Array<{ keys: string[]; label: string }> }> = [
  {
    title: 'Run & edit',
    rows: [
      { keys: ['⌘', '↵'], label: 'Run snippet' },
      { keys: ['⌘', 'L'], label: 'Toggle TS / JS' },
      { keys: ['⌘', 'C'], label: 'Copy active snippet' },
      { keys: ['⌘', 'S'], label: 'Copy share link' },
      { keys: ['⌘', 'D'], label: 'Download last preview' },
    ],
  },
  {
    title: 'Layout',
    rows: [
      { keys: ['⌘', '1'], label: 'Code only' },
      { keys: ['⌘', '2'], label: 'Split (code + preview)' },
      { keys: ['⌘', '3'], label: 'Preview only' },
      { keys: ['Drag'], label: 'Resize the divider in split mode' },
      { keys: ['Shift', '←/→'], label: 'Resize panes (when divider focused)' },
    ],
  },
  {
    title: 'Tabs & palette',
    rows: [
      { keys: ['⌘', 'T'], label: 'New tab (blank snippet)' },
      { keys: ['⌘', 'W'], label: 'Close active tab' },
      { keys: ['⌘', 'K'], label: 'Open command palette' },
      { keys: ['?'], label: 'Show this help' },
      { keys: ['Esc'], label: 'Dismiss any overlay' },
    ],
  },
  {
    title: 'Preview',
    rows: [
      { keys: ['⌘', 'scroll'], label: 'Zoom preview' },
      { keys: ['Drag'], label: 'Pan zoomed preview' },
      { keys: ['Pinch'], label: 'Zoom on touch devices' },
      { keys: ['Double-click'], label: 'Toggle 100% / 200%' },
    ],
  },
];

export function StudioShortcutOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="bg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          className="fixed inset-0 z-[80] flex items-center justify-center px-4"
          style={{ backgroundColor: 'color-mix(in srgb, var(--bg-base) 70%, black)', backdropFilter: 'blur(10px)' }}
        >
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Keyboard shortcuts"
            className="relative w-full max-w-3xl overflow-hidden rounded-2xl"
            style={{
              backgroundColor: 'var(--bg-raised)',
              border: '1px solid var(--border-default)',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <div
              className="flex items-center justify-between gap-3 px-5 py-4"
              style={{ borderBottom: '1px solid var(--border-subtle)' }}
            >
              <div className="min-w-0">
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.32em]"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Studio
                </p>
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  Keyboard shortcuts
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid h-9 w-9 place-items-center rounded-full transition-colors"
                style={{
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-secondary)',
                }}
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="grid max-h-[70vh] gap-x-8 gap-y-6 overflow-y-auto px-5 py-5 sm:grid-cols-2">
              {GROUPS.map((group) => (
                <section key={group.title}>
                  <h3
                    className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em]"
                    style={{ color: 'var(--accent-magenta)' }}
                  >
                    {group.title}
                  </h3>
                  <ul className="space-y-2">
                    {group.rows.map((row, i) => (
                      <li key={i} className="flex items-center justify-between gap-3 text-sm">
                        <span style={{ color: 'var(--text-secondary)' }}>{row.label}</span>
                        <span className="inline-flex shrink-0 items-center gap-1">
                          {row.keys.map((k, ki) => (
                            <kbd key={ki} className="kbd">
                              {k}
                            </kbd>
                          ))}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>

            <div
              className="px-5 py-3 text-[11px]"
              style={{
                borderTop: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-sunken)',
                color: 'var(--text-tertiary)',
              }}
            >
              Press <kbd className="kbd">?</kbd> any time to bring this back · use{' '}
              <kbd className="kbd">⌘</kbd><kbd className="kbd">K</kbd> for the command palette.
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
