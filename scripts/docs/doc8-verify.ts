import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures: string[] = [];
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');
const requireCheck = (condition: unknown, message: string) => {
  if (!condition) failures.push(message);
};

const editor = read('components/docs/playground/InteractiveCodeEditor.tsx');
const codeMirror = read('components/docs/playground/CodeMirrorEditor.tsx');
const diagnostics = read('components/docs/playground/DiagnosticsPanel.tsx');
const preview = read('components/docs/playground/InteractivePreview.tsx');
const workspace = read('components/docs/playground/InteractiveWorkspace.tsx');
const options = read('components/docs/playground/OptionFields.tsx');
const playground = read('components/docs/playground/VerifiedExamplePlayground.tsx');
const contracts = read('lib/docs/playground/contracts.ts');
const session = read('lib/docs/playground/session.ts');
const executionAdapter = read('lib/docs/playground/serverClientAdapter.ts');
const galleryEditor = read('app/gallery/components/GallerySnippetEditor.tsx');
const studio = read('components/studio/CodeStudio.tsx');
const studioSplit = read('components/studio/StudioResizableSplit.tsx');
const studioOutput = read('components/studio/StudioOutputPanel.tsx');
const studioStorage = read('lib/studio/studioStorage.ts');
const codePreview = read('components/examples/CodePreview.tsx');
const runner = read('app/api/gallery/run/route.ts');
const packageJson = JSON.parse(read('package.json')) as { dependencies?: Record<string, string> };

requireCheck(editor.includes("dynamic(() => import('./CodeMirrorEditor')"), 'InteractiveCodeEditor must lazy-load CodeMirrorEditor.');
requireCheck(codeMirror.includes("from '@uiw/react-codemirror'"), 'CodeMirrorEditor must own the existing CodeMirror integration.');
requireCheck(codeMirror.includes("from '@codemirror/lang-javascript'"), 'CodeMirrorEditor must own syntax-language loading.');
requireCheck(diagnostics.includes('data-doc8-primitive="diagnostics"'), 'DiagnosticsPanel marker missing.');
requireCheck(preview.includes('data-doc8-primitive="preview"'), 'InteractivePreview marker missing.');
requireCheck(workspace.includes('data-doc8-primitive="workspace"'), 'InteractiveWorkspace marker missing.');
requireCheck(workspace.includes('role="separator"'), 'Shared workspace must expose an accessible separator.');
requireCheck(options.includes('data-doc8-primitive="options"'), 'Shared option primitive marker missing.');

for (const dependency of [
  "./InteractiveCodeEditor",
  "./InteractivePreview",
  "./DiagnosticsPanel",
  "./InteractiveWorkspace",
  "@/lib/docs/playground/session",
]) {
  requireCheck(playground.includes(dependency), `Representative docs playground must use ${dependency}.`);
}

requireCheck(galleryEditor.includes("@/components/docs/playground/InteractiveCodeEditor"), 'Gallery/Studio editor compatibility wrapper must delegate to InteractiveCodeEditor.');
requireCheck(studioSplit.includes("@/components/docs/playground/InteractiveWorkspace"), 'Studio split compatibility wrapper must delegate to InteractiveWorkspace.');
requireCheck(studioOutput.includes("@/components/docs/playground/InteractivePreview"), 'Studio output must use InteractivePreview.');
requireCheck(studioOutput.includes("@/components/docs/playground/DiagnosticsPanel"), 'Studio output must use DiagnosticsPanel.');
requireCheck(studioStorage.includes("@/lib/docs/playground/session"), 'Studio share state must use shared DOC-8 session utilities.');
requireCheck(studio.includes("@/lib/docs/playground/serverClientAdapter"), 'Studio execution must use the shared server-backed ExecutionAdapter.');
requireCheck(studio.includes('currentNodeServerExecutionAdapter.run'), 'Studio must dispatch execution through ExecutionAdapter.run().');
requireCheck(!studio.includes("fetch('/api/gallery/run'"), 'Studio UI must not know the concrete gallery runner endpoint.');
requireCheck(studio.includes('useState(false)'), 'Studio runner must start disabled until availability is proven.');
requireCheck(codePreview.includes("example.id === 'node.canvas.basic'"), 'DOC-8 representative interactive example must be explicitly bounded to node.canvas.basic.');
requireCheck(codePreview.includes('<CodeGroup'), 'DOC-5 CodeGroup compatibility must remain intact.');

requireCheck(contracts.includes("mode: 'verified-static' | 'server-backed' | 'future-browser'"), 'Execution modes must remain explicit.');
requireCheck(contracts.includes('interface WebRuntimeAdapter'), 'Future WebRuntimeAdapter contract missing.');
requireCheck(!contracts.includes("from '@apexify/web'"), 'DOC-8 must not import nonexistent @apexify/web runtime.');
requireCheck(session.includes('shareStateBytes'), 'Share serializer must enforce the shared size limit.');
requireCheck(executionAdapter.includes("const ENDPOINT = '/api/gallery/run'"), 'Server-backed endpoint ownership must remain inside the execution adapter.');
requireCheck(executionAdapter.includes("mode: 'server-backed'"), 'Server-backed adapter mode missing.');

requireCheck(runner.includes("process.env.NODE_ENV !== 'production'"), 'Public/deployed arbitrary execution must be disabled.');
requireCheck(runner.includes("ENABLE_LOCAL_APEXIFY_CODE_RUN === 'true'"), 'Trusted-local execution must require explicit opt-in.');
requireCheck(!runner.includes('...process.env'), 'Runner must not blindly inherit the deployment environment.');
requireCheck(runner.includes('DOC8_RESOURCE_LIMITS.executionMs'), 'Runner timeout must use centralized DOC-8 limits.');
requireCheck(runner.includes('DOC8_RESOURCE_LIMITS.outputBytes'), 'Runner output limit must use centralized DOC-8 limits.');
requireCheck(runner.includes('cwd: dir'), 'Trusted-local execution must run from the controlled temporary directory.');
requireCheck(runner.includes('rmSync(dir, { recursive: true, force: true })'), 'Runner must clean its temporary directory.');

const sourceRoots = ['app', 'components', 'contexts', 'lib'];
const heavyImports: string[] = [];
function walk(dir: string) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(?:ts|tsx|js|mjs)$/.test(entry.name)) {
      const text = fs.readFileSync(full, 'utf8');
      if (text.includes("from '@uiw/react-codemirror'") || text.includes("from '@codemirror/lang-javascript'")) {
        heavyImports.push(path.relative(root, full).replaceAll(path.sep, '/'));
      }
    }
  }
}
for (const sourceRoot of sourceRoots) walk(path.join(root, sourceRoot));
requireCheck(
  heavyImports.length === 1 && heavyImports[0] === 'components/docs/playground/CodeMirrorEditor.tsx',
  `Heavy editor imports must be isolated to CodeMirrorEditor; found ${heavyImports.join(', ')}`,
);

requireCheck(
  packageJson.dependencies?.['apexify.js'] === 'github:EIAS79/Apexify.js#dbed9743353593eafae9a7b1c25312d7170a233b',
  'Apexify.js package pin changed during DOC-8.',
);

if (failures.length) {
  console.error('[doc8-verify] FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[doc8-verify] PASS', JSON.stringify({
  sharedPrimitives: ['editor', 'preview', 'diagnostics', 'workspace', 'options', 'session', 'execution'],
  representativeExample: 'node.canvas.basic',
  heavyEditorImportOwner: heavyImports[0],
  publicArbitraryExecution: false,
  localExecutionMode: 'trusted-local-opt-in',
  packagePin: packageJson.dependencies?.['apexify.js'],
}));
