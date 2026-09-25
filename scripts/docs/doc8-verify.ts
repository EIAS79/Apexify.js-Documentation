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
const canvasLoader = read('components/docs/playground/CanvasPlaygroundLoader.tsx');
const contracts = read('lib/docs/playground/contracts.ts');
const session = read('lib/docs/playground/session.ts');
const executionAdapter = read('lib/docs/playground/serverClientAdapter.ts');
const galleryEditor = read('app/gallery/components/GallerySnippetEditor.tsx');
const galleryModal = read('app/gallery/components/GalleryModal.tsx');
const studioLayout = read('app/studio/layout.tsx');
const studio = read('components/studio/CodeStudio.tsx');
const studioStatus = read('components/studio/StudioStatusBar.tsx');
const studioSplit = read('components/studio/StudioResizableSplit.tsx');
const studioOutput = read('components/studio/StudioOutputPanel.tsx');
const studioStorage = read('lib/studio/studioStorage.ts');
const studioTerminal = read('lib/studio/studioRunnerTerminal.ts');
const studioBrowserPreview = read('lib/studio/browserPreview.ts');
const apexifyWebPreview = read('vendor/apexify-web/src/studio-preview.ts');
const apexifyWebIndex = read('vendor/apexify-web/src/index.ts');
const apexifyWebSource = JSON.parse(read('vendor/apexify-web/SOURCE.json')) as { commit?: string };
const apexifyWebInstaller = read('scripts/studio/install-apexify-web.mjs');
const studioPreviewZoom = read('components/studio/StudioPreviewZoom.tsx');
const runnerWrapper = read('lib/gallery/core/wrapSnippetForRunner.ts');
const codePreview = read('components/examples/CodePreview.tsx');
const docsRoute = read('app/docs/[...slug]/page.tsx');
const canvasRoute = read('app/docs/node/canvas/page.tsx');
const docsSidebar = read('components/docs/navigation/DocsSidebarV2.tsx');
const docsNavigationChrome = read('components/docs/navigation/DocsNavigationChrome.tsx');
const runner = read('app/api/gallery/run/route.ts');
const isolatedRunner = read('lib/studio/runtime/isolatedNodeExecutor.ts');
const studioWorkspaceRuntime = read('lib/studio/runtime/workspace.ts');
const denoInstaller = read('scripts/studio/install-deno.mjs');
const ffmpegInstaller = read('scripts/studio/install-ffmpeg.mjs');
const mediaProxy = read('scripts/studio/media-process-proxy.mjs');
const packageJson = JSON.parse(read('package.json')) as { dependencies?: Record<string, string> };

requireCheck(editor.includes("dynamic(() => import('./CodeMirrorEditor')"), 'InteractiveCodeEditor must lazy-load CodeMirrorEditor.');
requireCheck(editor.includes('<InteractiveErrorBoundary'), 'Shared editor must isolate lazy/editor failures.');
requireCheck(codeMirror.includes("from '@uiw/react-codemirror'"), 'CodeMirrorEditor must own the existing CodeMirror integration.');
requireCheck(codeMirror.includes("from '@codemirror/lang-javascript'"), 'CodeMirrorEditor must own syntax-language loading.');
requireCheck(diagnostics.includes('data-doc8-primitive="diagnostics"'), 'DiagnosticsPanel marker missing.');
requireCheck(preview.includes('data-doc8-primitive="preview"'), 'InteractivePreview marker missing.');
requireCheck(preview.includes('<InteractiveErrorBoundary'), 'Shared preview must isolate preview failures.');
requireCheck(workspace.includes('data-doc8-primitive="workspace"'), 'InteractiveWorkspace marker missing.');
requireCheck(workspace.includes('role="separator"'), 'Shared workspace must expose an accessible separator.');
requireCheck(workspace.includes('internalRatio'), 'Shared workspace must support standalone docs keyboard resizing.');
requireCheck(options.includes('data-doc8-primitive="options"'), 'Shared option primitive marker missing.');

for (const dependency of [
  './InteractiveCodeEditor',
  './InteractivePreview',
  './DiagnosticsPanel',
  './InteractiveWorkspace',
  '@/lib/docs/playground/session',
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
requireCheck(codePreview.includes('<CodeGroup'), 'DOC-5 CodeGroup compatibility must remain intact.');
requireCheck(!codePreview.includes('VerifiedExamplePlayground'), 'Generic DOC-5 CodePreview must not eagerly pull the DOC-8 client playground into ordinary docs.');

requireCheck(docsRoute.includes("page.canonicalPath !== '/docs/node/canvas'"), 'Catch-all docs route must exclude the interactive Canvas route from static params.');
requireCheck(!docsRoute.includes('CanvasPlaygroundLoader'), 'Ordinary catch-all docs route must not reference the DOC-8 playground loader.');
requireCheck(!docsRoute.includes('VerifiedExamplePlayground'), 'Ordinary catch-all docs route must not reference the heavy DOC-8 playground module.');
requireCheck(canvasRoute.includes("getExampleById('node.canvas.basic')"), 'DOC-8 Canvas route must use the authoritative node.canvas.basic example.');
requireCheck(canvasRoute.includes('CanvasPlaygroundLoader'), 'DOC-8 Canvas route must mount the route-local activation loader.');
requireCheck(canvasRoute.includes("const CANVAS_SLUG = 'node/canvas'"), 'DOC-8 Canvas route must remain bound to node/canvas.');
requireCheck(canvasLoader.includes("import('./VerifiedExamplePlayground')"), 'Canvas activation loader must own the native playground import.');
requireCheck(canvasLoader.includes('useEffect'), 'Canvas activation loader must defer the heavy import until the Canvas client island mounts.');
requireCheck(!canvasLoader.includes('next/dynamic'), 'Canvas activation loader must not register catch-all route preload metadata with next/dynamic.');
requireCheck(docsSidebar.includes("const INTERACTIVE_CANVAS_PATH = '/docs/node/canvas'"), 'Docs sidebar must identify the interactive Canvas route for prefetch isolation.');
requireCheck(docsSidebar.includes('prefetch={item.href === INTERACTIVE_CANVAS_PATH ? false : undefined}'), 'Ordinary docs sidebar must not prefetch the interactive Canvas route.');
requireCheck(docsNavigationChrome.includes("const INTERACTIVE_CANVAS_PATH = '/docs/node/canvas'"), 'Docs pager/breadcrumb chrome must identify the interactive Canvas route for prefetch isolation.');
requireCheck(docsNavigationChrome.includes('prefetch={docsPrefetch(item.href)}'), 'Docs pager must not prefetch the interactive Canvas route.');

requireCheck(contracts.includes("mode: 'verified-static' | 'server-backed' | 'future-browser'"), 'Execution modes must remain explicit.');
requireCheck(contracts.includes('interface WebRuntimeAdapter'), 'Future WebRuntimeAdapter contract missing.');
requireCheck(
  !contracts.includes("from '@apexify/web'"),
  'Shared contracts must stay package-neutral even though Studio now consumes @apexify/web.',
);
requireCheck(session.includes('shareStateBytes'), 'Share serializer must enforce the shared size limit.');
requireCheck(executionAdapter.includes("const ENDPOINT = '/api/gallery/run'"), 'Server-backed endpoint ownership must remain inside the execution adapter.');
requireCheck(executionAdapter.includes("mode: 'server-backed'"), 'Server-backed adapter mode missing.');
requireCheck(executionAdapter.includes('studioFiles'), 'Server-backed adapter must send Studio sibling project files.');
requireCheck(studio.includes('studioFiles'), 'Studio must package open sibling tabs for full-runtime execution.');
requireCheck(studioOutput.includes('ArtifactStrip'), 'Studio output must preserve multi-artifact preview selection.');
requireCheck(studioWorkspaceRuntime.includes('maxFiles: 24'), 'Studio workspace file count must remain bounded.');
requireCheck(studioWorkspaceRuntime.includes('validateStudioWorkspaceFiles'), 'Studio workspace files must pass centralized validation.');

requireCheck(runner.includes("process.env.NODE_ENV !== 'production'"), 'Unsandboxed local execution must remain disabled in production.');
requireCheck(runner.includes("ENABLE_LOCAL_APEXIFY_CODE_RUN === 'true'"), 'Trusted-local execution must require explicit opt-in.');
requireCheck(!runner.includes('STUDIO_EXECUTOR_URL'), 'Studio must not require an external executor URL.');
requireCheck(!runner.includes('STUDIO_EXECUTOR_TOKEN'), 'Studio must not require an external executor token.');
requireCheck(runner.includes("mode: 'same-origin-isolated'"), 'Production Studio must identify the same-origin isolated mode truthfully.');
requireCheck(runner.includes('runSameOriginIsolatedStudio'), 'Production Studio must dispatch full-runtime work to the same-origin isolation layer.');
requireCheck(!runner.includes('...process.env'), 'Runner must not blindly inherit the deployment environment.');
requireCheck(isolatedRunner.includes('DOC8_RESOURCE_LIMITS.executionMs'), 'Isolated runner timeout must use centralized DOC-8 limits.');
requireCheck(isolatedRunner.includes('DOC8_RESOURCE_LIMITS.outputBytes'), 'Isolated runner output limit must use centralized DOC-8 limits.');
requireCheck(isolatedRunner.includes("'--no-prompt'"), 'Isolated runner must deny interactive permission escalation.');
requireCheck(!isolatedRunner.includes("'--allow-net'"), 'Same-origin isolated execution must not grant arbitrary network access.');
requireCheck(
  isolatedRunner.includes('--allow-run=') &&
    isolatedRunner.includes('media.ffmpegProxy') &&
    isolatedRunner.includes('media.ffprobeProxy'),
  'Same-origin video execution must grant subprocess access only through fixed media proxies.',
);
requireCheck(!isolatedRunner.includes('--allow-run-all'), 'Same-origin execution must not grant unrestricted subprocess access.');
requireCheck(isolatedRunner.includes("'--allow-ffi="), 'Isolated runner must scope native FFI for the canvas backend.');
requireCheck(
  isolatedRunner.includes("'--allow-sys'") && !isolatedRunner.includes("'--allow-all'"),
  'Isolated runner must grant only Deno system-introspection permission, never unrestricted permissions.',
);
requireCheck(isolatedRunner.includes('materializeWorkspaceFiles'), 'Isolated runner must materialize bounded sibling project files.');
requireCheck(isolatedRunner.includes('rewriteWorkspacePackageImports'), 'Isolated project files must resolve Apexify through the pinned runtime path.');
requireCheck(isolatedRunner.includes("rmSync(runDir, { recursive: true, force: true })"), 'Isolated runner must clean its disposable workspace.');
requireCheck(denoInstaller.includes('vendor') && denoInstaller.includes('studio-deno'), 'Build must install the same-origin Deno isolation runtime.');
requireCheck(ffmpegInstaller.includes('studio-ffmpeg') && ffmpegInstaller.includes('ffprobe'), 'Build must install the pinned Studio media runtime.');
requireCheck(mediaProxy.includes("'file,pipe'"), 'Studio media proxy must force local-only FFmpeg input protocols.');
requireCheck(mediaProxy.includes('validateConcatList'), 'Studio media proxy must validate concat-demuxer references.');
requireCheck(runner.includes('cwd: dir'), 'Trusted-local execution must run from the controlled temporary directory.');
requireCheck(runner.includes('rmSync(dir, { recursive: true, force: true })'), 'Trusted-local runner must clean its temporary directory.');

// A blocklist + child process is not a security sandbox. Keep all current product copy truthful.
requireCheck(!studioLayout.toLowerCase().includes('sandbox'), 'Studio metadata must not describe current execution as a sandbox.');
requireCheck(!studioStatus.includes('Sandbox ·'), 'Studio status UI must not describe current execution as a sandbox.');
requireCheck(!galleryModal.includes('Sandbox runner'), 'Gallery must not expose the legacy Sandbox runner label.');
requireCheck(!galleryModal.includes('sandbox run'), 'Gallery preview copy must not call trusted-local execution a sandbox run.');
requireCheck(!galleryModal.includes('sandbox output'), 'Gallery alt text must not call trusted-local output sandbox output.');
requireCheck(galleryModal.includes('useState(false)'), 'Gallery execution availability must fail closed.');
requireCheck(galleryModal.includes('setRunnerEnabled(false)'), 'Gallery availability probe failures must keep execution disabled.');
requireCheck(!studioTerminal.includes('(sandbox)'), 'Studio diagnostics must not label temporary paths as a sandbox.');
requireCheck(studio.includes("from '@apexify/web'"), 'Studio browser execution must import the real @apexify/web runtime.');
requireCheck(studioBrowserPreview.includes("from '@apexify/web'"), 'Legacy browserPreview must be a thin @apexify/web compatibility bridge.');
requireCheck(studioBrowserPreview.length < 1000, 'Legacy browserPreview must not retain a duplicate browser renderer implementation.');
requireCheck(apexifyWebPreview.includes("'createChart'"), '@apexify/web must expose createChart() in the Studio browser renderer.');
requireCheck(apexifyWebPreview.includes("type === 'hexagons'"), '@apexify/web must keep the procedural hexagon pattern renderer.');
requireCheck(apexifyWebPreview.includes('config.patternBg'), '@apexify/web must render top-level canvas patternBg.');
requireCheck(apexifyWebPreview.includes("chartType === 'radar'") && apexifyWebPreview.includes("chartType === 'polarArea'"), '@apexify/web must cover all stable createChart() families.');
requireCheck(apexifyWebIndex.includes('class ApexifyWebRuntime'), '@apexify/web runtime lifecycle class missing.');
requireCheck(apexifyWebIndex.includes('registerApexifyWebFonts'), '@apexify/web font manager missing.');
requireCheck(apexifyWebSource.commit === '6b0cdf0b78cc7d4545c95d274ea0fb518583a20e', '@apexify/web source snapshot is not pinned to the approved engine commit.');
requireCheck(apexifyWebInstaller.includes('Integrity mismatch for @apexify/web'), '@apexify/web installer must verify source integrity.');
requireCheck(
  apexifyWebPreview.includes("boolOf(inheritedBackground.inherit, false)") &&
    apexifyWebPreview.includes('width = bitmap.width') &&
    apexifyWebPreview.includes('height = bitmap.height'),
  '@apexify/web must honor customBg.inherit source dimensions instead of falling back to 640x360.',
);
requireCheck(studioPreviewZoom.includes('requestFullscreen()'), 'Studio preview must expose real fullscreen mode.');
requireCheck(studioPreviewZoom.includes('cursor-grab') && studioPreviewZoom.includes('scrollLeft'), 'Studio preview must preserve drag-to-pan behavior.');
requireCheck(studioPreviewZoom.includes('applyFitToView') && studioPreviewZoom.includes('resetView'), 'Studio preview must preserve fit and reset controls.');
requireCheck(!runnerWrapper.includes('server sandbox'), 'Runner diagnostics must not claim server sandboxing.');
requireCheck(runnerWrapper.includes('not a security sandbox'), 'Trusted-local video diagnostic must explicitly reject sandbox overclaiming.');

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
  packageJson.dependencies?.['apexify.js'] === 'github:EIAS79/Apexify.js#69d40cf40ba992ad2bdec457c6c7217f5df55cd1',
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
  interactiveRoute: 'app/docs/node/canvas/page.tsx',
  routeActivationBoundary: 'components/docs/playground/CanvasPlaygroundLoader.tsx',
  navigationPrefetchIsolation: true,
  heavyEditorImportOwner: heavyImports[0],
  unsandboxedProductionExecution: false,
  localExecutionMode: 'trusted-local-opt-in',
  sameOriginIsolation: true,
  externalExecutorApi: false,
  sandboxClaim: false,
  packagePin: packageJson.dependencies?.['apexify.js'],
}));
