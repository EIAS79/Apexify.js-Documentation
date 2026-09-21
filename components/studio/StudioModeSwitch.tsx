'use client';

import {
  CodeBracketIcon,
  PaintBrushIcon,
} from '@heroicons/react/24/outline';

export type StudioMode = 'code' | 'visual';

export function StudioModeSwitch({
  mode,
  onChange,
  className = '',
}: {
  mode: StudioMode;
  onChange: (mode: StudioMode) => void;
  className?: string;
}) {
  return (
    <div
      className={`studio-mode-switch ${className}`}
      role="group"
      aria-label="Studio authoring mode"
    >
      <button
        type="button"
        data-studio-mode-tab="code"
        aria-pressed={mode === 'code'}
        data-active={mode === 'code' ? 'true' : undefined}
        onClick={() => onChange('code')}
      >
        <CodeBracketIcon className="h-4 w-4" aria-hidden />
        <span>Code</span>
      </button>
      <button
        type="button"
        data-studio-mode-tab="visual"
        aria-pressed={mode === 'visual'}
        data-active={mode === 'visual' ? 'true' : undefined}
        onClick={() => onChange('visual')}
      >
        <PaintBrushIcon className="h-4 w-4" aria-hidden />
        <span>Visual</span>
      </button>
    </div>
  );
}
