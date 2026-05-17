import packageJson from '@/package.json';

/** Display label for the installed `apexify.js` dependency (e.g. `v5.4.5`). */
export function apexifyVersionLabel(): string {
  const spec = packageJson.dependencies?.['apexify.js'] ?? '';
  const match = /(\d+\.\d+\.\d+)/.exec(spec);
  return match ? `v${match[1]}` : 'v5.4.5';
}
