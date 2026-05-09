import { delimiter, join } from 'path';

/**
 * Snippets execute from a temp directory (`os.tmpdir()/…`). Node resolves packages by walking
 * **up from that file**, so it never reaches the app’s `node_modules` unless we extend the search path.
 * Setting `NODE_PATH` fixes `Cannot find module '@napi-rs/canvas'` / sharp / etc. on every OS.
 */
export function galleryRunnerNodePath(projectRoot: string): string {
  const roots = [
    join(projectRoot, 'node_modules'),
    join(projectRoot, 'node_modules', 'apexify.js', 'node_modules'),
  ];
  const merged = [process.env.NODE_PATH, ...roots].filter(Boolean).join(delimiter);
  return merged;
}
