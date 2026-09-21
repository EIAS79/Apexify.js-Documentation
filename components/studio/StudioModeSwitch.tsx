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
        aria-label="Code mode"
        title="Code"
        data-tooltip="Code"
      >
        <CodeBracketIcon className="h-4 w-4" aria-hidden />
        <span className="sr-only">Code</span>
      </button>
      <button
        type="button"
        data-studio-mode-tab="visual"
        aria-pressed={mode === 'visual'}
        data-active={mode === 'visual' ? 'true' : undefined}
        onClick={() => onChange('visual')}
        aria-label="Visual mode"
        title="Visual"
        data-tooltip="Visual"
      >
        <PaintBrushIcon className="h-4 w-4" aria-hidden />
        <span className="sr-only">Visual</span>
      </button>
    </div>
  );
}
