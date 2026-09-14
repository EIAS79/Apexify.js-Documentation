import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const out = path.join(root, 'generated', 'docs-doc10');
const read = <T>(name: string): T => JSON.parse(fs.readFileSync(path.join(out, name), 'utf8')) as T;

const matrix = read<{ required_unresolved_gaps: number; rows: Array<{ domain: string; cells: Record<string, string> }> }>('future-readiness-matrix.json');
const gaps = read<{ required_unresolved_gaps: number }>('architecture-gap-report.json');
const leak = read<{ status: string; unintendedLeaks: number }>('fixture-leak-check.json');
const search = read<{ status: string; productionIndexChangedByFixtures: boolean }>('search-readiness.json');
const policy = read<{ fixture: boolean; publish: boolean; status: string }>('fixture-policy.json');
const deps = read<{ status: string; futureRuntimeDependenciesAdded: string[] }>('dependency-audit.json');
const requiredDomains = ['@apexify/core', '@apexify/node', '@apexify/web', 'React', 'Next', 'animation', 'layout', 'capabilities', 'diagnostics'];

if (matrix.required_unresolved_gaps !== 0 || gaps.required_unresolved_gaps !== 0) throw new Error('[DOC-10] unresolved required architecture gaps remain');
if (matrix.rows.some((row) => Object.values(row.cells).includes('GAP'))) throw new Error('[DOC-10] readiness matrix contains GAP');
for (const domain of requiredDomains) if (!matrix.rows.some((row) => row.domain === domain)) throw new Error(`[DOC-10] readiness matrix missing ${domain}`);
if (leak.status !== 'PASS' || leak.unintendedLeaks !== 0) throw new Error('[DOC-10] fixture leak gate failed');
if (search.status !== 'PASS' || search.productionIndexChangedByFixtures) throw new Error('[DOC-10] search isolation gate failed');
if (!policy.fixture || policy.publish || !['TEST-ONLY', 'ROADMAP'].includes(policy.status)) throw new Error('[DOC-10] fixture policy is not safely isolated');
if (deps.status !== 'PASS' || deps.futureRuntimeDependenciesAdded.length !== 0) throw new Error('[DOC-10] future runtime dependency audit failed');
console.log(`[DOC-10 verify] PASS domains=${requiredDomains.length} unresolved-gaps=0 fixture-leaks=0 future-runtime-dependencies=0`);
