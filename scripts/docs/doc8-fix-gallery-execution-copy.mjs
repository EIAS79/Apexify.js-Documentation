import fs from 'node:fs';

const file = 'app/gallery/components/GalleryModal.tsx';
let source = fs.readFileSync(file, 'utf8');

const replacements = [
  ["const [runnerEnabled, setRunnerEnabled] = useState(true);", "const [runnerEnabled, setRunnerEnabled] = useState(false);"],
  ["if (!cancelled) setRunnerEnabled(true);", "if (!cancelled) setRunnerEnabled(false);"],
  ['sandboxEligible', 'executionEligible'],
  ['sandboxDataUrl', 'executionDataUrl'],
  ['sandboxError', 'executionError'],
  ['sandboxRunning', 'executionRunning'],
  ['sandboxProgressRafRef', 'executionProgressRafRef'],
  ['resetSandbox', 'resetExecution'],
  ['runSandbox', 'runExecution'],
  ['onRunSandbox', 'onRunExecution'],
  ['onResetSandbox', 'onResetExecution'],
  ['showSandboxBar', 'showExecutionBar'],
  ['Sandbox toolbar', 'Execution toolbar'],
  ['Sandbox runner disabled.', 'Execution unavailable on this deployment.'],
  ['Preview shows your last sandbox run (PNG/GIF buffer). Reset code clears this overlay.', 'Preview shows your last trusted-local execution result (PNG/GIF buffer). Reset code clears this overlay.'],
  ['— sandbox output', '— trusted-local execution output'],
];

for (const [from, to] of replacements) {
  source = source.split(from).join(to);
}

if (/\bsandbox\b/i.test(source)) {
  const lines = source.split('\n').filter((line) => /\bsandbox\b/i.test(line));
  throw new Error(`GalleryModal still contains sandbox terminology:\n${lines.join('\n')}`);
}
if (!source.includes('const [runnerEnabled, setRunnerEnabled] = useState(false);')) {
  throw new Error('runnerEnabled must default to false');
}
if (!source.includes('if (!cancelled) setRunnerEnabled(false);')) {
  throw new Error('availability probe failures must keep execution disabled');
}

fs.writeFileSync(file, source);
console.log('[doc8-fix-gallery-execution-copy] PASS');
