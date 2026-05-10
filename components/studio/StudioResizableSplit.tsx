'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

const MIN_RATIO = 0.22;
const MAX_RATIO = 0.78;

/**
 * Two-pane split with a draggable, keyboard-accessible divider.
 * Stacks vertically below `md` and reverts to flex layout (no resize).
 */
export function StudioResizableSplit({
  ratio,
  onRatioChange,
  enabled,
  left,
  right,
}: {
  ratio: number;
  onRatioChange: (next: number) => void;
  enabled: boolean;
  left: ReactNode;
  right: ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [hover, setHover] = useState(false);

  const setFromClientX = useCallback(
    (clientX: number) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0) return;
      const r = (clientX - rect.left) / rect.width;
      const clamped = Math.min(MAX_RATIO, Math.max(MIN_RATIO, r));
      onRatioChange(clamped);
    },
    [onRatioChange]
  );

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: PointerEvent) => {
      e.preventDefault();
      setFromClientX(e.clientX);
    };
    const onUp = () => setDragging(false);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [dragging, setFromClientX]);

  const onKey = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 0.08 : 0.02;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      onRatioChange(Math.max(MIN_RATIO, ratio - step));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      onRatioChange(Math.min(MAX_RATIO, ratio + step));
    } else if (e.key === 'Home') {
      onRatioChange(MIN_RATIO);
    } else if (e.key === 'End') {
      onRatioChange(MAX_RATIO);
    } else if (e.key === '0') {
      onRatioChange(0.5);
    }
  };

  if (!enabled) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{left}</div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{right}</div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row"
    >
      <div
        className="flex min-h-[200px] min-w-0 flex-col overflow-hidden md:min-h-0"
        style={{ flexBasis: `${ratio * 100}%`, flexGrow: 0, flexShrink: 1 }}
      >
        {left}
      </div>

      <div
        role="separator"
        aria-orientation="vertical"
        aria-valuemin={MIN_RATIO * 100}
        aria-valuemax={MAX_RATIO * 100}
        aria-valuenow={Math.round(ratio * 100)}
        aria-label="Resize editor and preview"
        tabIndex={0}
        onPointerDown={(e) => {
          e.preventDefault();
          setDragging(true);
          setFromClientX(e.clientX);
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onKeyDown={onKey}
        className="hidden shrink-0 md:relative md:flex md:w-1.5 md:cursor-col-resize md:items-stretch md:justify-center"
        style={{
          backgroundColor: dragging || hover ? 'var(--accent-iris)' : 'var(--border-subtle)',
          transition: 'background-color 0.18s ease',
        }}
      >
        <span
          aria-hidden
          className="absolute left-1/2 top-1/2 h-10 w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              dragging || hover ? 'var(--gradient-sunset)' : 'var(--border-strong)',
            opacity: dragging ? 1 : hover ? 0.9 : 0.55,
            transition: 'opacity 0.15s ease, background 0.18s ease',
          }}
        />
      </div>

      <div
        className="flex min-h-[200px] min-w-0 flex-col overflow-hidden md:min-h-0"
        style={{ flexBasis: `${(1 - ratio) * 100}%`, flexGrow: 0, flexShrink: 1 }}
      >
        {right}
      </div>
    </div>
  );
}
