'use client';

import { useTheme, type ThemeMode } from './ThemeProvider';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';

const OPTIONS: { id: ThemeMode; label: string; Icon: typeof SunIcon }[] = [
  { id: 'light', label: 'Light', Icon: SunIcon },
  { id: 'system', label: 'System', Icon: ComputerDesktopIcon },
  { id: 'dark', label: 'Dark', Icon: MoonIcon },
];

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { mode, setMode } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Color theme"
      className={`inline-flex items-center gap-0.5 rounded-lg border p-0.5 ${className}`}
      style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)' }}
    >
      {OPTIONS.map((opt) => {
        const active = mode === opt.id;
        const Icon = opt.Icon;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`${opt.label} theme`}
            title={`${opt.label} theme`}
            onClick={() => setMode(opt.id)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors"
            style={{
              backgroundColor: active ? 'var(--accent)' : 'transparent',
              color: active ? 'var(--on-accent)' : 'var(--text-secondary)',
            }}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}
