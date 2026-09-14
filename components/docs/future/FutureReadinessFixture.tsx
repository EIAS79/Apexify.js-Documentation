'use client';

import { useState } from 'react';
import { OptionTable } from '@/components/api-reference/OptionTable';
import { DiagnosticsPanel } from '@/components/docs/playground/DiagnosticsPanel';
import { InteractiveWorkspace } from '@/components/docs/playground/InteractiveWorkspace';
import { AvailabilityMatrix } from '@/components/docs/status/AvailabilityMatrix';
import { CapabilityBadge, PackageBadge, StabilityBadge } from '@/components/docs/status/DocsBadges';
import { PackageNavigator, RuntimeNavigator, VersionSelector } from '@/components/docs/status/DocumentationNavigators';
import {
  FUTURE_CAPABILITIES,
  FUTURE_DIAGNOSTICS,
  FUTURE_NESTED_OPTIONS,
  FUTURE_PACKAGE_FIXTURES,
  FUTURE_SUPPORT_MATRIX,
  FUTURE_TOPIC_ROUTES,
  FUTURE_VERSION_FIXTURES,
} from '@/fixtures/docs-future';

const diagnostic = FUTURE_DIAGNOSTICS[0];

function PlaceholderEditor({ label }: { label: string }) {
  return <section tabIndex={0} aria-label={`${label} editor slot`} className="h-full min-w-0 overflow-auto rounded-lg p-4" style={{ background: 'var(--bg-sunken)', border: '1px solid var(--border-default)' }}><h3>{label} editor slot</h3><pre><code>{'// TEST-ONLY fixture\n// No future Apexify package is imported or executed.'}</code></pre></section>;
}

function PlaceholderPreview({ kind, reducedMotion }: { kind: string; reducedMotion?: boolean }) {
  return <section aria-label={`${kind} preview slot`} className="h-full min-w-0 overflow-auto rounded-lg p-4" style={{ background: 'var(--bg-sunken)', border: '1px solid var(--border-default)' }}><h3>{kind} preview slot</h3><p><strong>FIXTURE / ROADMAP.</strong> No renderer is active. This validates the adapter boundary and workspace slots only.</p>{reducedMotion !== undefined ? <p>Reduced-motion simulation: {reducedMotion ? 'on' : 'off'}</p> : null}</section>;
}

export function FutureReadinessFixture() {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [position, setPosition] = useState(0);
  const runtimeEntries = ['node', 'web', 'react', 'next-server', 'next-client'].map((runtime) => {
    const route = FUTURE_TOPIC_ROUTES.find((item) => item.topic === 'images' && item.runtime === runtime);
    return { id: runtime, label: runtime, href: route?.href ?? null, status: 'ROADMAP' };
  });
  const packageEntries = FUTURE_PACKAGE_FIXTURES.map((item) => {
    const route = FUTURE_TOPIC_ROUTES.find((candidate) => candidate.package === item.name && candidate.topic === 'images');
    return { id: item.name, label: item.name, href: route?.href ?? null, status: item.status };
  });
  const diagnostics = [{ id: diagnostic.code, code: diagnostic.code, severity: 'warning' as const, message: diagnostic.meaning, source: 'DOC-10 fixture', help: diagnostic.recommendedFix }];

  return <main className="mx-auto w-full min-w-0 max-w-7xl space-y-10 overflow-x-hidden p-4 md:p-8" data-doc10-fixture-root>
    <header className="min-w-0 space-y-3"><p className="apx-badge" data-status="ROADMAP">TEST-ONLY · FIXTURE · ROADMAP</p><h1>DOC-10 Future Engine Documentation Readiness</h1><p>This internal route exercises documentation architecture only. It does not expose a shipped Web, React, Next, animation, layout, diagnostic, or capability runtime.</p><div className="flex min-w-0 flex-wrap gap-2"><PackageBadge value="@apexify/web" /><StabilityBadge value="ROADMAP" />{FUTURE_CAPABILITIES.slice(0, 3).map((item) => <CapabilityBadge key={item.id} value={item.name} state={item.status} />)}</div></header>

    <section className="min-w-0 space-y-4" aria-labelledby="switchers-heading"><h2 id="switchers-heading">Runtime/package/version switching</h2><RuntimeNavigator entries={runtimeEntries} current="web" /><PackageNavigator entries={packageEntries} current="@apexify/web" /><VersionSelector entries={FUTURE_VERSION_FIXTURES.map((entry) => ({ id: entry.id, label: entry.label, href: null, status: entry.status }))} current="stable-fixture" /></section>

    <section className="min-w-0 space-y-4" aria-labelledby="support-heading"><h2 id="support-heading">Fixture support matrix</h2><AvailabilityMatrix columns={FUTURE_SUPPORT_MATRIX.columns} rows={FUTURE_SUPPORT_MATRIX.rows} label="DOC-10 fixture runtime support matrix" /></section>

    <section className="min-w-0 space-y-4" aria-labelledby="options-heading"><h2 id="options-heading">Future-shaped option table</h2><h3 id="api-options-heading" className="sr-only">DOC-10 fixture options</h3><OptionTable options={FUTURE_NESTED_OPTIONS} ownerLabel="DOC-10 fixture" /></section>

    <section className="min-w-0 space-y-4" aria-labelledby="browser-shell-heading"><h2 id="browser-shell-heading">Browser playground shell</h2><InteractiveWorkspace editor={<PlaceholderEditor label="Browser fixture" />} preview={<PlaceholderPreview kind="Browser fixture" />} diagnostics={<DiagnosticsPanel diagnostics={diagnostics} />} options={<section aria-label="Browser fixture options" className="min-w-0 rounded-lg p-3" style={{ border: '1px solid var(--border-default)' }}><p>Runtime adapter: unavailable</p><p>Capabilities: fixture metadata only</p><button type="button" onClick={() => setPosition(0)}>Reset fixture state</button></section>} /></section>

    <section className="min-w-0 space-y-4" aria-labelledby="animation-shell-heading"><h2 id="animation-shell-heading">Animation playground shell</h2><InteractiveWorkspace editor={<PlaceholderEditor label="Animation fixture" />} preview={<PlaceholderPreview kind="Animation fixture" reducedMotion={reducedMotion} />} diagnostics={<DiagnosticsPanel diagnostics={diagnostics} />} options={<fieldset className="min-w-0 space-y-2 rounded-lg p-3" style={{ border: '1px solid var(--border-default)' }}><legend>Animation fixture controls</legend><label className="block">Timeline position <input aria-label="Fixture timeline position" type="range" min="0" max="1000" value={position} onChange={(event) => setPosition(Number(event.target.value))} /></label><label className="block"><input type="checkbox" checked={reducedMotion} onChange={(event) => setReducedMotion(event.target.checked)} /> Reduced-motion simulation</label><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setPosition(0)}>Replay/reset</button><button type="button" onClick={() => setPosition((value) => Math.min(1000, value + 100))}>Seek +100</button></div></fieldset>} /></section>
  </main>;
}
