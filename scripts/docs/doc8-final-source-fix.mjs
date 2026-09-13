import fs from 'node:fs';

function replaceExactlyOnce(path, from, to) {
  const input = fs.readFileSync(path, 'utf8');
  const first = input.indexOf(from);
  if (first < 0) throw new Error(`[doc8-final-source-fix] expected text missing in ${path}`);
  if (input.indexOf(from, first + from.length) >= 0) throw new Error(`[doc8-final-source-fix] expected text is not unique in ${path}`);
  fs.writeFileSync(path, input.replace(from, to));
}

replaceExactlyOnce(
  'components/studio/StudioTopBar.tsx',
  "color: active ? 'white' : 'var(--text-secondary)',\n          background: active ? 'var(--accent-iris)' : 'transparent',",
  "color: active ? 'var(--text-inverse)' : 'var(--text-secondary)',\n          background: active ? 'var(--accent-iris)' : 'transparent',"
);

replaceExactlyOnce(
  'components/studio/StudioStatusBar.tsx',
  "style={{ backgroundColor: 'var(--accent-iris)', color: 'white' }}",
  "style={{ backgroundColor: 'var(--accent-iris)', color: 'var(--text-inverse)' }}"
);

fs.writeFileSync(
  'app/studio/layout.tsx',
  `import type { Metadata } from 'next';\nimport type { ReactNode } from 'react';\n\nexport const metadata: Metadata = {\n  title: 'Code studio | Apexify.js',\n  description:\n    'Edit Apexify.js snippets in the browser, inspect verified outputs, and use explicitly enabled trusted-local execution during development.',\n};\n\nexport default function StudioLayout({ children }: { children: ReactNode }) {\n  return children;\n}\n`
);

console.log('[doc8-final-source-fix] PASS');
