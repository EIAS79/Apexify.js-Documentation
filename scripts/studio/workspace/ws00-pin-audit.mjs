#!/usr/bin/env node
/**
 * Workspace Studio WS-00: verify that declared installed Apexify.js pins
 * agree across npm, lockfile and isolated Studio executor.
 *
 * Historical parity inventory and @apexify/web are separately pinned and
 * are reported as evidence drift, NOT quietly promoted to current coverage.
 *
 * Read-only, no runtime install and no network access.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const readJson = file => JSON.parse(readFileSync(resolve(root, file), 'utf8'));
const readText = file => readFileSync(resolve(root, file), 'utf8');

const SHA_PATTERN = /^[a-f0-9]{40}$/;
const PIN_PATTERN = /^github:EIAS79\/Apexify\.js#([a-f0-9]{40})$/;

function committedPin(input) {
  if (typeof input !== 'string') return null;
  const match = PIN_PATTERN.exec(input);
  return match?.[1] ?? null;
}

function betweenQuotes(source, expression) {
  return expression.exec(source)?.[1] ?? null;
}

/**
 * Pure check for testability; never modifies any source or generated report.
 */
export function auditStudioPins({ pkg, lock, executor, webInstaller, parityPin, historicReport }) {
  const installedDeclaration = pkg.dependencies?.['apexify.js'];
  const lockDeclaration = lock.packages?.['']?.dependencies?.['apexify.js'];
  const executorDeclaration = betweenQuotes(executor, /const APEXIFY_PIN\s*=\s*['"]([^'"]+)['"]/);
  const webSnapshot = betweenQuotes(webInstaller, /const sourceCommit\s*=\s*['"]([a-f0-9]{40})['"]/);
  const runtimeSha = committedPin(installedDeclaration);
  const checks = [
    { id: 'package-pin-is-immutable-commit', ok: Boolean(runtimeSha) },
    { id: 'lockfile-matches-package', ok: lockDeclaration === installedDeclaration },
    { id: 'isolated-executor-matches-package', ok: executorDeclaration === installedDeclaration },
    { id: 'web-source-snapshot-is-immutable', ok: Boolean(webSnapshot && SHA_PATTERN.test(webSnapshot)) },
    { id: 'historical-parity-pin-is-defined', ok: Boolean(parityPin?.commit && SHA_PATTERN.test(parityPin.commit)) },
    { id: 'historical-report-sources-are-explicit', ok: Boolean(historicReport?.runtime?.commit && SHA_PATTERN.test(historicReport.runtime.commit)) },
  ];
  const parityAuditCommit = parityPin?.commit ?? null;
  const reportRuntimeCommit = historicReport?.runtime?.commit ?? null;
  const matchesCurrent = Boolean(runtimeSha && parityAuditCommit === runtimeSha && reportRuntimeCommit === runtimeSha);
  return {
    schemaVersion: 1,
    phase: 'WS-00',
    generatedFrom: 'tracked source files (read-only)',
    checks,
    status: checks.every(x => x.ok) ? 'PACKAGE_PIN_CONSISTENT' : 'PACKAGE_PIN_DRIFT',
    currentFullRuntimeCommit: runtimeSha,
    declaredPackagePin: installedDeclaration ?? null,
    webSnapshotCommit: webSnapshot,
    historicalParityScannerCommit: parityAuditCommit,
    historicalParityReportCommit: reportRuntimeCommit,
    parityEvidenceStatus: matchesCurrent ? 'CURRENT_PIN' : 'STALE_REQUIRES_REBASE_AND_REEXECUTION',
    warnings: [
      ...(!matchesCurrent ? ['Previous STUDIO-PARITY-0 scanner/report targets a different runtime commit. Do not reuse its coverage totals as current.'] : []),
      'A static pin check does not prove that a locally installed package matches a build artifact; confirm npm clean install and real runtime fixtures.',
      'The browser @apexify/web snapshot is intentionally a separate commit and requires its own supported-subset evidence.',
    ],
  };
}

export function runCurrentRepositoryAudit() {
  return auditStudioPins({
    pkg: readJson('package.json'),
    lock: readJson('package-lock.json'),
    executor: readText('lib/studio/runtime/isolatedNodeExecutor.ts'),
    webInstaller: readText('scripts/studio/install-apexify-web.mjs'),
    parityPin: readJson('scripts/studio/parity/runtime-source.json'),
    historicReport: readJson('generated/studio/runtime-parity/gap-summary.json'),
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const report = runCurrentRepositoryAudit();
    console.log(JSON.stringify(report, null, 2));
    if (report.status !== 'PACKAGE_PIN_CONSISTENT') process.exitCode = 1;
    if (process.argv.includes('--require-current-parity') && report.parityEvidenceStatus !== 'CURRENT_PIN') {
      console.error('WS-00 blocked: parity inventory must be re-generated from the installed exact package SHA.');
      process.exitCode = 2;
    }
  } catch (error) {
    console.error('[ws00-pin-audit]', error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
