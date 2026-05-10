'use client';

import { useEffect, useRef, useState } from 'react';
import { PlusIcon, XMarkIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { StudioBuffer } from '@/lib/studio/studioConfig';

export function StudioFileTabs({
  buffers,
  activeId,
  onSelect,
  onClose,
  onRename,
  onNew,
}: {
  buffers: StudioBuffer[];
  activeId: string;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onRename: (id: string, next: string) => void;
  onNew: () => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId) {
      requestAnimationFrame(() => inputRef.current?.select());
    }
  }, [editingId]);

  const startRename = (b: StudioBuffer) => {
    setEditingId(b.id);
    setDraftName(b.name);
  };

  const commitRename = () => {
    if (!editingId) return;
    const trimmed = draftName.trim() || 'Untitled';
    onRename(editingId, trimmed);
    setEditingId(null);
  };

  return (
    <div
      className="flex shrink-0 items-end gap-1 overflow-x-auto px-2 pt-1.5 sm:px-3"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--bg-sunken) 65%, transparent)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
      role="tablist"
      aria-label="Open snippets"
    >
      {buffers.map((b) => {
        const isActive = b.id === activeId;
        const isEditing = editingId === b.id;
        return (
          <div
            key={b.id}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onSelect(b.id)}
            onDoubleClick={() => startRename(b)}
            className="group relative flex min-w-[8.5rem] max-w-[14rem] shrink-0 cursor-pointer items-center gap-1.5 rounded-t-lg pl-3 pr-1.5 py-2 text-[12px] font-medium transition-colors"
            style={{
              color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
              backgroundColor: isActive ? 'var(--bg-raised)' : 'transparent',
              borderTop: '1px solid',
              borderLeft: '1px solid',
              borderRight: '1px solid',
              borderColor: isActive ? 'var(--border-default)' : 'transparent',
              borderBottom: isActive ? '1px solid var(--bg-raised)' : '1px solid var(--border-subtle)',
              marginBottom: isActive ? '-1px' : '0',
            }}
            title={b.name + (isEditing ? '' : ' — double-click to rename')}
          >
            {isActive && (
              <span
                aria-hidden
                className="absolute left-2 right-2 top-0 h-[2px] rounded-full"
                style={{ background: 'var(--gradient-sunset)' }}
              />
            )}

            <span
              className="grid h-2 w-2 place-items-center rounded-full shrink-0"
              style={{ backgroundColor: isActive ? 'var(--accent-magenta)' : 'var(--border-strong)' }}
              aria-hidden
            />

            {isEditing ? (
              <input
                ref={inputRef}
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    commitRename();
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    setEditingId(null);
                  }
                }}
                className="min-w-0 flex-1 bg-transparent text-[12px] outline-none"
                style={{ color: 'var(--text-primary)' }}
                autoComplete="off"
              />
            ) : (
              <span className="min-w-0 flex-1 truncate">{b.name}</span>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                startRename(b);
              }}
              aria-label={`Rename ${b.name}`}
              className="hidden h-6 w-6 shrink-0 place-items-center rounded-md opacity-0 transition group-hover:opacity-100 sm:grid"
              style={{ color: 'var(--text-tertiary)' }}
              title="Rename"
            >
              <PencilSquareIcon className="h-3.5 w-3.5" />
            </button>

            {buffers.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose(b.id);
                }}
                aria-label={`Close ${b.name}`}
                className="grid h-6 w-6 shrink-0 place-items-center rounded-md transition hover:bg-[var(--bg-sunken)]"
                style={{ color: 'var(--text-tertiary)' }}
                title="Close tab"
              >
                <XMarkIcon className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={onNew}
        aria-label="New tab"
        className="ml-1 inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-semibold transition-colors"
        style={{
          color: 'var(--text-tertiary)',
          border: '1px dashed var(--border-default)',
          backgroundColor: 'transparent',
        }}
        title="New blank tab"
      >
        <PlusIcon className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">New</span>
      </button>

      <span aria-hidden className="flex-1" />
    </div>
  );
}
