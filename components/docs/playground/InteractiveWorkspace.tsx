'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

const MIN_RATIO = 0.22;
const MAX_RATIO = 0.78;

export function InteractiveWorkspace({
  ratio,
  onRatioChange,
  enabled = true,
  editor,
  preview,
  diagnostics,
  options,
}: {
  ratio?: number;
  onRatioChange?: (next: number) => void;
  enabled?: boolean;
  editor: ReactNode;
  preview: ReactNode;
  diagnostics?: ReactNode;
  options?: ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [internalRatio, setInternalRatio] = useState(0.5);
  const effectiveRatio = ratio ?? internalRatio;

  const commitRatio = useCallback(
    (next: number) => {
      const clamped = Math.min(MAX_RATIO, Math.max(MIN_RATIO, next));
      if (ratio === undefined) setInternalRatio(clamped);
      onRatioChange?.(clamped);
    },
    [onRatioChange, ratio],
  );

  const setFromClientX = useCallback(
    (clientX: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect || rect.width <= 0) return;
      commitRatio((clientX - rect.left) / rect.width);
    },
    [commitRatio],
  );

  useEffect(() => {
    if (!dragging) return;
    const onMove = (event: PointerEvent) => {
      event.preventDefault();
      setFromClientX(event.clientX);
    };
    const onUp = () => setDragging(false);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [dragging, setFromClientX]);

  const onSeparatorKeyDown = (event: React.KeyboardEvent) => {
    const step = event.shiftKey ? 0.08 : 0.02;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      commitRatio(effectiveRatio - step);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      commitRatio(effectiveRatio + step);
    } else if (event.key === 'Home') {
      event.preventDefault();
      commitRatio(MIN_RATIO);
    } else if (event.key === 'End') {
      event.preventDefault();
      commitRatio(MAX_RATIO);
    } else if (event.key === '0') {
      event.preventDefault();
      commitRatio(0.5);
    }
  };

  return (
    <div
      data-doc8-primitive="workspace"
      className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden"
    >
      <div
        ref={containerRef}
        className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row"
      >
        <div
          className="flex min-h-[220px] min-w-0 flex-col overflow-hidden md:min-h-0"
          style={{
            flexBasis: enabled ? `${effectiveRatio * 100}%` : '50%',
            flexGrow: enabled ? 0 : 1,
            flexShrink: 1,
          }}
        >
          {editor}
        </div>

        {enabled ? (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-valuemin={MIN_RATIO * 100}
            aria-valuemax={MAX_RATIO * 100}
            aria-valuenow={Math.round(effectiveRatio * 100)}
            aria-label="Resize editor and preview"
            tabIndex={0}
            onPointerDown={(event) => {
              event.preventDefault();
              setDragging(true);
              setFromClientX(event.clientX);
            }}
            onKeyDown={onSeparatorKeyDown}
            className="hidden shrink-0 touch-none md:flex md:w-2 md:cursor-col-resize md:items-center md:justify-center"
            style={{ background: 'var(--border-subtle)' }}
          >
            <span
              aria-hidden
              className="h-10 w-[3px] rounded-full"
              style={{ background: 'var(--border-strong)' }}
            />
          </div>
        ) : null}

        <div
          className="flex min-h-[220px] min-w-0 flex-col overflow-hidden md:min-h-0"
          style={{
            flexBasis: enabled ? `${(1 - effectiveRatio) * 100}%` : '50%',
            flexGrow: enabled ? 0 : 1,
            flexShrink: 1,
          }}
        >
          {preview}
        </div>
      </div>

      {diagnostics || options ? (
        <div className="grid shrink-0 gap-3 md:grid-cols-2">
          {diagnostics}
          {options}
        </div>
      ) : null}
    </div>
  );
}
