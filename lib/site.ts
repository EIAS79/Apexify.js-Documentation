export const SITE_NAME = 'Apexify.js';
export const SITE_ORIGIN = 'https://apexifyjs.vercel.app';
export const SITE_DESCRIPTION =
  'Apexify.js is a TypeScript-first Node/server rendering and media toolkit with verified documentation, examples, API reference, Gallery, and Studio.';

export function absoluteSiteUrl(pathname = '/'): string {
  return new URL(pathname, `${SITE_ORIGIN}/`).toString();
}
