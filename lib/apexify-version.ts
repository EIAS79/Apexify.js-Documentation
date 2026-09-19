import packageJson from '@/package.json';

const DOCUMENTED_APEXIFY_VERSION = '6.0.0';

/** Display label for the documented `apexify.js` release. */
export function apexifyVersionLabel(): string {
  const spec = packageJson.dependencies?.['apexify.js'] ?? '';
  const match = /(\d+\.\d+\.\d+)/.exec(spec);
  return match ? `v${match[1]}` : `v${DOCUMENTED_APEXIFY_VERSION}`;
}
