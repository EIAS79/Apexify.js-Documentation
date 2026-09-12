import fs from 'node:fs';
import path from 'node:path';
import { DOC8_RESOURCE_LIMITS } from '../../lib/docs/playground/contracts';

const root = process.cwd();
const outDir = path.join(root, 'generated', 'docs-doc8');
const check = process.argv.includes('--check');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')) as {
  dependencies?: Record<string, string>;
};

const artifacts: Record<string, unknown> = {
  'architecture.json': {
    schemaVersion: 1,
    phase: 'DOC-8',
    baseDocumentationSha: '8424834aa0334044b5603bf88406f0a1fa10a396',
    packagePin: packageJson.dependencies?.['apexify.js'],
    representativeInteractiveSurface: {
      exampleId: 'node.canvas.basic',
      documentationRoute: '/docs/node/canvas',
      previewMode: 'verified-static',
    },
    sharedPrimitives: [
      { name: 'editor', path: 'components/docs/playground/InteractiveCodeEditor.tsx' },
      { name: 'preview', path: 'components/docs/playground/InteractivePreview.tsx' },
      { name: 'diagnostics', path: 'components/docs/playground/DiagnosticsPanel.tsx' },
      { name: 'options', path: 'components/docs/playground/OptionFields.tsx' },
      { name: 'workspace', path: 'components/docs/playground/InteractiveWorkspace.tsx' },
      { name: 'session', path: 'lib/docs/playground/session.ts' },
      { name: 'execution', path: 'lib/docs/playground/serverClientAdapter.ts' },
    ],
    consumers: {
      studio: [
        'components/studio/CodeStudio.tsx',
        'components/studio/StudioOutputPanel.tsx',
        'components/studio/StudioResizableSplit.tsx',
        'lib/studio/studioStorage.ts',
      ],
      documentation: [
        'components/docs/playground/VerifiedExamplePlayground.tsx',
        'components/examples/CodePreview.tsx',
      ],
    },
  },
  'security-boundary.json': {
    schemaVersion: 1,
    phase: 'DOC-8',
    endpoint: '/api/gallery/run',
    publicArbitraryExecution: false,
    productionMode: 'unavailable',
    developmentMode: 'trusted-local-opt-in',
    developmentOptIn: 'ENABLE_LOCAL_APEXIFY_CODE_RUN=true',
    sandboxClaim: false,
    environmentPolicy: 'allowlist',
    cwdPolicy: 'per-run-temporary-directory',
    cleanup: 'recursive-finally',
    networkIsolation: false,
    packageInstallation: false,
    remoteScriptExecution: false,
    resourceLimits: DOC8_RESOURCE_LIMITS,
  },
  'client-boundaries.json': {
    schemaVersion: 1,
    phase: 'DOC-8',
    heavyEditorModule: 'components/docs/playground/CodeMirrorEditor.tsx',
    lazyBoundary: 'components/docs/playground/InteractiveCodeEditor.tsx',
    lazy: true,
    ordinaryDocsMustNotMountEditor: true,
    homepageMustNotMountEditor: true,
    galleryClosedStateMustNotMountEditor: true,
    interactiveRoutes: ['/studio', '/docs/node/canvas'],
  },
};

fs.mkdirSync(outDir, { recursive: true });
const failures: string[] = [];
for (const [name, value] of Object.entries(artifacts)) {
  const target = path.join(outDir, name);
  const expected = `${JSON.stringify(value, null, 2)}\n`;
  if (check) {
    if (!fs.existsSync(target)) failures.push(`missing ${name}`);
    else if (fs.readFileSync(target, 'utf8') !== expected) failures.push(`stale ${name}`);
  } else {
    fs.writeFileSync(target, expected);
  }
}

if (failures.length) {
  console.error('[doc8-generate] FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`[doc8-generate] ${check ? 'CHECK PASS' : 'WROTE'} ${Object.keys(artifacts).length} artifacts`);
