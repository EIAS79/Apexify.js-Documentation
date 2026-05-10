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
      className={`relative inline-flex items-center gap-0.5 rounded-full border p-0.5 ${className}`}
      style={{
        backgroundColor: 'var(--bg-sunken)',
        borderColor: 'var(--border-default)',
      }}
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
            className="relative h-7 w-7 inline-flex items-center justify-center rounded-full transition-all"
            style={
              active
                ? {
                    backgroundImage: 'var(--gradient-sunset)',
                    color: 'white',
                    boxShadow: 'var(--glow-magenta)',
                  }
                : { color: 'var(--text-tertiary)' }
            }
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}
