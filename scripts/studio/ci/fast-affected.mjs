import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const base = process.env.STUDIO_CI_BASE_SHA?.trim();
const head = process.env.STUDIO_CI_HEAD_SHA?.trim() || 'HEAD';

function git(args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
}

function changedFiles() {
  if (base) {
    try {
      execFileSync('git', ['cat-file', '-e', base + '^{commit}'], { cwd: root, stdio: 'ignore' });
    } catch {
      try {
        execFileSync('git', ['fetch', '--no-tags', '--depth=1', 'origin', base], {
          cwd: root,
          stdio: 'ignore',
        });
      } catch {
        // Fall back to the current commit when GitHub does not expose the base object.
      }
    }
    try {
      return git(['diff', '--name-only', base, head]).split(/\r?\n/).filter(Boolean);
    } catch {
      // Continue to the single-commit fallback below.
    }
  }

  try {
    return git(['diff-tree', '--no-commit-id', '--name-only', '-r', head])
      .split(/\r?\n/)
      .filter(Boolean);
  } catch {
    return [];
  }
}

function run(command, args) {
  console.log('[studio-fast] $ ' + [command, ...args].join(' '));
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
    shell: process.platform === 'win32',
  });
  if ((result.status ?? 1) !== 0) process.exit(result.status ?? 1);
}

const files = changedFiles();
console.log('[studio-fast] changed files:', files.length ? '\n' + files.map((f) => '  - ' + f).join('\n') : ' none');

const codeFiles = files.filter((file) =>
  /^(?:app\/studio\/|app\/api\/gallery\/run\/|components\/studio\/|lib\/studio\/|scripts\/studio\/|package(?:-lock)?\.json$|tsconfig\.json$|vercel\.json$|\.github\/workflows\/studio-)/.test(file),
);

if (!codeFiles.length) {
  console.log('[studio-fast] no Studio/runtime-affecting code changed; nothing expensive to run.');
  process.exit(0);
}

// Do not run the repository-wide TypeScript build here. The root typecheck depends
// on generated Apexify packages installed by the intentionally heavyweight
// postinstall chain (web snapshot, Deno, FFmpeg, docs generation). That belongs
// to Vercel checkpoint builds and phase certification, not per-commit feedback.
const tests = new Set();
const add = (...names) => names.forEach((name) => tests.add(name));

const sharedVisual = codeFiles.some((file) =>
  /^lib\/studio\/visual\/(?:model|compiler\/|codegen\/|project|history|persistence|ids|node-tree)/.test(file),
);

if (sharedVisual) {
  console.log('[studio-fast] shared Visual compiler/model changed; using the complete fast Visual unit suite.');
  run('npm', ['run', 'studio:visual:test']);
} else {
  for (const file of codeFiles) {
    if (/VisualCanvasInspector|canvas-contract|phase4-canvas/.test(file)) {
      add('scripts/studio/visual/phase4-canvas.test.ts');
    }
    if (/image-contract|phase5-images-shapes|phase10-image-effects|VisualImage/.test(file)) {
      add(
        'scripts/studio/visual/phase5-images-shapes.test.ts',
        'scripts/studio/visual/phase10-image-effects.test.ts',
        'scripts/studio/parity/phase2-image-rebuild.test.ts',
      );
    }
    if (/text-contract|phase6-text-fonts|VisualText/.test(file)) {
      add('scripts/studio/visual/phase6-text-fonts.test.ts');
    }
    if (/path-pixel|phase7-path-pixels/.test(file)) {
      add('scripts/studio/visual/phase7-path-pixels.test.ts');
    }
    if (/chart|phase8-charts/.test(file)) {
      add('scripts/studio/visual/phase8-charts.test.ts');
    }
    if (/scene-component|phase9-scenes-components|template|component/.test(file)) {
      add('scripts/studio/visual/phase9-scenes-components.test.ts');
    }
    if (/gif|animation|phase11-gif-animation/.test(file)) {
      add('scripts/studio/visual/phase11-gif-animation.test.ts');
    }
    if (/audio|phase12-audio/.test(file)) {
      add('scripts/studio/visual/phase12-audio.test.ts');
    }
    if (/video|media-proxy|phase13-video/.test(file)) {
      add(
        'scripts/studio/visual/phase13-video.test.ts',
        'scripts/studio/media-proxy-contract.test.ts',
      );
    }
    if (/phase14|advanced-authoring|batch|chain|plugin/.test(file)) {
      add('scripts/studio/visual/phase14-advanced.test.ts');
    }
    if (/export|roundtrip|persistence|phase15/.test(file)) {
      add('scripts/studio/visual/phase15-export-roundtrip.test.ts');
    }
    if (/VisualStudio|StudioModeSwitch|phase1-shell|phase3-editor|pre4-shell/.test(file)) {
      add(
        'scripts/studio/visual/phase1-shell.test.ts',
        'scripts/studio/visual/pre4-shell.test.ts',
        'scripts/studio/visual/phase3-editor.test.ts',
      );
    }
    if (/scripts\/studio\/parity\//.test(file)) {
      add('scripts/studio/parity/parity-baseline.test.ts');
    }
    if (/vercel\.json/.test(file)) {
      add(
        'scripts/studio/visual/phase1-shell.test.ts',
        'scripts/studio/visual/visual-contract.test.ts',
      );
    }
  }

  if (!tests.size) {
    add(
      'scripts/studio/visual/phase2-model-codegen.test.ts',
      'scripts/studio/visual/live-sync.test.ts',
    );
  }

  const tsx = path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'tsx.cmd' : 'tsx');
  if (!fs.existsSync(tsx)) {
    throw new Error('[studio-fast] local tsx binary is missing after npm ci.');
  }
  run(tsx, ['--test', ...tests]);
}

if (codeFiles.some((file) => /^scripts\/studio\/parity\//.test(file))) {
  run('npm', ['run', 'studio:parity:typecheck']);
}

console.log('[studio-fast] PASS — fast affected validation complete.');
