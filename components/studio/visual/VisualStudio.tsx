'use client';

import {
  ClockIcon,
  CubeTransparentIcon,
  ExclamationTriangleIcon,
  FolderOpenIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { type ReactNode } from 'react';
import { useStudioSharedSession } from '@/components/studio/StudioSharedSession';

type Props = { active: boolean };

function Panel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof PhotoIcon;
  children: ReactNode;
}) {
  return (
    <section
      className="min-h-0 overflow-hidden rounded-xl"
      style={{ border: '1px solid var(--border-default)', background: 'var(--bg-raised)' }}
    >
      <div
        className="flex min-h-11 items-center gap-2 px-3 text-xs font-bold"
        style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
      >
        <Icon className="h-4 w-4" aria-hidden />
        {title}
      </div>
      {children}
    </section>
  );
}

export default function VisualStudio({ active }: Props) {
  const {
    assets,
    previewArtifacts,
    activeArtifactId,
    error,
    previewWarnings,
    elapsedMs,
    history,
  } = useStudioSharedSession();

  const activeArtifact =
    previewArtifacts.find((artifact) => artifact.id === activeArtifactId) ??
    previewArtifacts[0] ??
    null;

  return (
    <div
      className="h-full min-h-0 overflow-auto p-2 sm:p-3 lg:p-4"
      data-studio-visual-workspace
      data-active={active ? 'true' : 'false'}
      style={{ background: 'var(--bg-base)' }}
    >
      <div className="mx-auto grid min-h-full w-full max-w-[1800px] grid-cols-1 gap-3 xl:grid-cols-[minmax(220px,280px)_minmax(0,1fr)_minmax(260px,360px)]">
        <Panel title="Assets" icon={FolderOpenIcon}>
          <div className="p-3">
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Shared Studio assets
            </p>
            <p className="mt-1 text-2xl font-bold">{assets.length}</p>
            {assets.length ? (
              <ul className="mt-3 space-y-2">
                {assets.slice(0, 8).map((asset) => (
                  <li
                    key={asset.id}
                    className="truncate rounded-lg px-2 py-2 text-xs"
                    style={{ border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
                    title={asset.name}
                  >
                    {asset.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs leading-5" style={{ color: 'var(--text-tertiary)' }}>
                Assets uploaded in Code mode are shared with Visual mode. Visual insertion and editing begin in later authoring phases.
              </p>
            )}
          </div>
        </Panel>

        <section
          className="relative grid min-h-[360px] place-items-center overflow-hidden rounded-xl sm:min-h-[460px] xl:min-h-0"
          style={{
            border: '1px solid var(--border-default)',
            background:
              'linear-gradient(var(--border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px), var(--bg-canvas)',
            backgroundSize: '32px 32px',
          }}
          aria-label="Visual workspace"
        >
          <div className="max-w-md px-6 text-center">
            <span
              className="mx-auto grid h-14 w-14 place-items-center rounded-2xl"
              style={{
                background: 'var(--bg-raised)',
                border: '1px solid var(--border-default)',
                color: 'var(--studio-blue-2)',
              }}
            >
              <CubeTransparentIcon className="h-7 w-7" aria-hidden />
            </span>
            <h2 className="mt-4 text-lg font-bold">Visual workspace ready</h2>
            <p className="mt-2 text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
              Phase 1 establishes the dual-mode shell only. Drawing, selection and editing are intentionally not implemented here.
            </p>
          </div>
        </section>

        <div className="grid min-h-0 grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-1">
          <Panel title="Output" icon={PhotoIcon}>
            <div className="p-3">
              <p className="text-2xl font-bold">{previewArtifacts.length}</p>
              <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Shared session artifacts
              </p>
              {activeArtifact ? (
                <p className="mt-3 truncate text-xs font-semibold" title={activeArtifact.name}>
                  Active · {activeArtifact.name}
                </p>
              ) : (
                <p className="mt-3 text-xs leading-5" style={{ color: 'var(--text-tertiary)' }}>
                  Visual Project preview begins in Phase 2.
                </p>
              )}
            </div>
          </Panel>

          <Panel title="Diagnostics" icon={ExclamationTriangleIcon}>
            <div className="p-3 text-xs leading-5" style={{ color: 'var(--text-tertiary)' }}>
              {error ? (
                <p style={{ color: 'var(--danger)' }}>{error}</p>
              ) : previewWarnings.length ? (
                <p>
                  {previewWarnings.length} shared execution notice
                  {previewWarnings.length === 1 ? '' : 's'}.
                </p>
              ) : (
                <p>
                  No shared execution diagnostics
                  {elapsedMs != null ? ' · last run ' + elapsedMs + ' ms' : ''}.
                </p>
              )}
            </div>
          </Panel>

          <Panel title="History" icon={ClockIcon}>
            <div className="p-3">
              <p className="text-2xl font-bold">{history.length}</p>
              <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Shared persisted Code Studio runs
              </p>
              {history[0] ? (
                <p className="mt-3 truncate text-xs font-semibold" title={history[0].bufferName}>
                  Latest · {history[0].bufferName}
                </p>
              ) : null}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
