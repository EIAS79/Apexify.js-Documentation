export type StudioWorkspaceLanguage = 'ts' | 'js';

export type StudioWorkspaceFile = {
  name: string;
  source: string;
  language: StudioWorkspaceLanguage;
};

export const STUDIO_WORKSPACE_LIMITS = Object.freeze({
  maxFiles: 24,
  maxFileChars: 120_000,
  maxTotalChars: 280_000,
});

export function studioWorkspaceFileName(name: string, language: StudioWorkspaceLanguage): string {
  const trimmed = String(name || '').trim();
  const base = trimmed
    .replace(/\\/g, '/')
    .split('/')
    .pop()!
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'untitled';
  return /\.(?:[cm]?[jt]sx?)$/i.test(base) ? base : `${base}.${language}`;
}

export function validateStudioWorkspaceFiles(value: unknown): StudioWorkspaceFile[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new Error('Studio workspace files must be an array.');
  if (value.length > STUDIO_WORKSPACE_LIMITS.maxFiles) {
    throw new Error(`Studio accepts at most ${STUDIO_WORKSPACE_LIMITS.maxFiles} workspace files.`);
  }

  const result: StudioWorkspaceFile[] = [];
  const names = new Set<string>();
  let total = 0;

  for (const raw of value) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      throw new Error('Studio workspace file entries must be objects.');
    }
    const entry = raw as Partial<StudioWorkspaceFile>;
    const language: StudioWorkspaceLanguage = entry.language === 'js' ? 'js' : 'ts';
    if (typeof entry.source !== 'string') throw new Error('Studio workspace file source must be text.');
    if (entry.source.length > STUDIO_WORKSPACE_LIMITS.maxFileChars) {
      throw new Error('A Studio workspace file exceeds the per-file source limit.');
    }
    total += entry.source.length;
    if (total > STUDIO_WORKSPACE_LIMITS.maxTotalChars) {
      throw new Error('Combined Studio workspace source exceeds the configured limit.');
    }
    const name = studioWorkspaceFileName(typeof entry.name === 'string' ? entry.name : '', language);
    if (names.has(name)) throw new Error(`Duplicate Studio workspace filename: ${name}`);
    names.add(name);
    result.push({ name, source: entry.source, language });
  }

  return result;
}
