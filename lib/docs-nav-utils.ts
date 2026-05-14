/**
 * Pure helpers for the doc shell: flatten the API tree into a single ordered
 * list (for prev/next), resolve the active doc's breadcrumb trail, and pick
 * a section accent color from the design tokens.
 */

export type DocFile = {
  name: string;
  path: string;
  folder: string;
  filename: string;
};

export type DocSubfolder = {
  name: string;
  displayName: string;
  files: DocFile[];
  subfolders?: DocSubfolder[];
};

export type DocFolder = {
  name: string;
  displayName?: string;
  path: string;
  files: DocFile[];
  subfolders?: DocSubfolder[];
};

export type FlatDocEntry = {
  filename: string;
  name: string;
  folder: string;
  /** Top-level section key (e.g. `00-start-here`) for breadcrumb / accent lookups. */
  sectionName: string;
  sectionDisplayName: string;
  /** Optional sub-section display name (e.g. `Canvas`, `Charts`). */
  subDisplayName?: string;
};

/* ----------------------------------------------------------------- *
 *  Flatten in display order
 * ----------------------------------------------------------------- */

function pushSubfolder(
  acc: FlatDocEntry[],
  sectionName: string,
  sectionDisplayName: string,
  sub: DocSubfolder,
  parentDisplayName?: string
): void {
  const subDisplayName = parentDisplayName
    ? `${parentDisplayName} · ${sub.displayName}`
    : sub.displayName;

  for (const f of sub.files) {
    acc.push({
      filename: f.filename,
      name: f.name,
      folder: f.folder,
      sectionName,
      sectionDisplayName,
      subDisplayName,
    });
  }
  sub.subfolders?.forEach((nested) =>
    pushSubfolder(acc, sectionName, sectionDisplayName, nested, subDisplayName)
  );
}

export function flattenDocs(folders: DocFolder[], rootFiles: DocFile[]): FlatDocEntry[] {
  const out: FlatDocEntry[] = [];
  for (const f of rootFiles) {
    out.push({
      filename: f.filename,
      name: f.name,
      folder: f.folder,
      sectionName: 'root',
      sectionDisplayName: 'Overview',
    });
  }
  for (const folder of folders) {
    const sectionDisplayName = folder.displayName ?? folder.name;
    for (const f of folder.files) {
      out.push({
        filename: f.filename,
        name: f.name,
        folder: f.folder,
        sectionName: folder.name,
        sectionDisplayName,
      });
    }
    folder.subfolders?.forEach((sub) =>
      pushSubfolder(out, folder.name, sectionDisplayName, sub)
    );
  }
  return out;
}

export function findDocEntry(flat: FlatDocEntry[], filename: string): FlatDocEntry | null {
  return flat.find((e) => e.filename === filename) ?? null;
}

export type DocPagerNeighbors = {
  prev: FlatDocEntry | null;
  next: FlatDocEntry | null;
};

export function neighborsFor(flat: FlatDocEntry[], filename: string): DocPagerNeighbors {
  const idx = flat.findIndex((e) => e.filename === filename);
  if (idx < 0) return { prev: null, next: null };
  return {
    prev: idx > 0 ? flat[idx - 1] : null,
    next: idx < flat.length - 1 ? flat[idx + 1] : null,
  };
}

/* ----------------------------------------------------------------- *
 *  Section accents (CSS variables — flip with theme automatically)
 * ----------------------------------------------------------------- */

export type SectionAccent = {
  /** CSS variable referenced in styles (e.g. `var(--accent-magenta)`). */
  color: string;
};

const ACCENT_BY_SECTION: Record<string, SectionAccent> = {
  '00-start-here': { color: 'var(--accent-magenta)' },
  '01-beginner-guide': { color: 'var(--accent-iris)' },
  '02-recipes': { color: 'var(--accent-amber)' },
  '03-feature-guides': { color: 'var(--accent-coral)' },
  '04-api-reference': { color: 'var(--accent-iris-soft)' },
  '05-advanced': { color: 'var(--accent-rose)' },
  '06-internals': { color: 'var(--accent-magenta-soft)' },
  '07-contributor-notes': { color: 'var(--accent-amber-soft)' },
  root: { color: 'var(--accent-iris)' },
};

export function sectionAccent(sectionName: string): SectionAccent {
  return ACCENT_BY_SECTION[sectionName] ?? { color: 'var(--accent-iris)' };
}

/* ----------------------------------------------------------------- *
 *  Section file count (recursive)
 * ----------------------------------------------------------------- */

export function countSectionFiles(folder: DocFolder): number {
  let total = folder.files.length;
  const walk = (sub: DocSubfolder) => {
    total += sub.files.length;
    sub.subfolders?.forEach(walk);
  };
  folder.subfolders?.forEach(walk);
  return total;
}
