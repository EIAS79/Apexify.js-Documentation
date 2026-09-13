export interface DocHeading {
  id: string;
  text: string;
  level: number;
}

const EXPLICIT_HEADING_ID = /\s*\{#([^}]+)\}\s*$/;

export function slugifyHeading(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeExplicitId(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '')
    .replace(/^-|-$/g, '');
}

/** Parses markdown heading text after `#` marks: strips `{#custom-id}` from label and resolves DOM id. */
export function parseHeadingTitleAndId(rest: string): { label: string; id: string } {
  const trimmed = rest.trim();
  const match = EXPLICIT_HEADING_ID.exec(trimmed);
  if (match) {
    const label = trimmed.slice(0, match.index).trim();
    const explicit = normalizeExplicitId(match[1]);
    const id = explicit || slugifyHeading(label);
    return { label, id };
  }
  return { label: trimmed, id: slugifyHeading(trimmed) };
}

/**
 * Makes duplicate heading IDs deterministic without changing visible heading text.
 * The first occurrence keeps its historical ID; later collisions receive `-2`,
 * `-3`, and so on. Fenced code is untouched. Existing unique explicit IDs are
 * preserved exactly after normalization.
 */
export function ensureUniqueHeadingIdsInMarkdown(content: string): string {
  const lines = content.split(/\r?\n/);
  const counts = new Map<string, number>();
  let inFence = false;
  const headingLine = /^(\s*)(#{1,6})\s+(.+)$/;

  return lines
    .map((line) => {
      const fenceTrim = line.trimStart();
      if (fenceTrim.startsWith('```') || fenceTrim.startsWith('~~~')) {
        inFence = !inFence;
        return line;
      }
      if (inFence) return line;

      const match = headingLine.exec(line);
      if (!match) return line;

      const parsed = parseHeadingTitleAndId(match[3]);
      if (!parsed.id) return line;

      const seen = counts.get(parsed.id) ?? 0;
      counts.set(parsed.id, seen + 1);
      if (seen === 0) return line;

      const uniqueId = `${parsed.id}-${seen + 1}`;
      return `${match[1]}${match[2]} ${parsed.label} {#${uniqueId}}`;
    })
    .join('\n');
}

/** TOC / scroll-spy headings from raw MDX/Markdown (h1–h3 only). Skips ATX-looking lines inside fenced code (```` ``` ````). */
export function extractHeadingsFromMdxRaw(content: string): DocHeading[] {
  const lines = content.split(/\r?\n/);
  let inFence = false;
  const out: DocHeading[] = [];
  const headingLine = /^(\#{1,3})\s+(.+)$/;

  for (const line of lines) {
    const fenceTrim = line.trimStart();
    if (fenceTrim.startsWith('```') || fenceTrim.startsWith('~~~')) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const m = headingLine.exec(line);
    if (!m) continue;
    const level = m[1].length;
    const { label, id } = parseHeadingTitleAndId(m[2]);
    out.push({ level, id, text: label });
  }

  return out;
}

/** Removes `{#id}` suffixes from heading lines so they are not visible in the rendered title. Leaves fenced code untouched. */
export function stripExplicitHeadingIdsFromMarkdown(md: string): string {
  const lines = md.split(/\r?\n/);
  let inFence = false;
  const headingLine = /^(\s*)(#{1,6})\s+(.+)$/;

  return lines
    .map((line) => {
      const fenceTrim = line.trimStart();
      if (fenceTrim.startsWith('```') || fenceTrim.startsWith('~~~')) {
        inFence = !inFence;
        return line;
      }
      if (inFence) return line;

      const m = headingLine.exec(line);
      if (!m) return line;
      const { label } = parseHeadingTitleAndId(m[3]);
      return `${m[1]}${m[2]} ${label}`;
    })
    .join('\n');
}
