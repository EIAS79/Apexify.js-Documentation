export interface ParsedDocumentationSource {
  data: Record<string, unknown> | null;
  body: string;
}

const FRONTMATTER_BOUNDARY = '---';

function parseValue(rawValue: string, sourcePath: string, key: string): unknown {
  const value = rawValue.trim();
  if (value.length === 0) {
    throw new Error(`[docs-frontmatter] ${sourcePath}: "${key}" must have a value`);
  }

  if (
    value.startsWith('"') ||
    value.startsWith("'") ||
    value.startsWith('[') ||
    value.startsWith('{') ||
    value === 'true' ||
    value === 'false' ||
    value === 'null' ||
    /^-?\d+(?:\.\d+)?$/.test(value)
  ) {
    if (value.startsWith("'") && value.endsWith("'")) {
      return value.slice(1, -1);
    }
    try {
      return JSON.parse(value);
    } catch (error) {
      throw new Error(
        `[docs-frontmatter] ${sourcePath}: invalid value for "${key}": ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  return value;
}

/**
 * DOC-1 deliberately supports a small deterministic YAML-compatible subset:
 * one `key: value` pair per line and JSON-compatible scalar/array values.
 * Nested mappings and block arrays are intentionally rejected until the
 * content system has a concrete need for them.
 */
export function parseDocumentationSource(
  source: string,
  sourcePath: string,
): ParsedDocumentationSource {
  const normalized = source.replace(/^\uFEFF/, '');
  if (!normalized.startsWith(`${FRONTMATTER_BOUNDARY}\n`) && !normalized.startsWith(`${FRONTMATTER_BOUNDARY}\r\n`)) {
    return { data: null, body: normalized };
  }

  const lines = normalized.split(/\r?\n/);
  let endIndex = -1;
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i].trim() === FRONTMATTER_BOUNDARY) {
      endIndex = i;
      break;
    }
  }

  if (endIndex < 0) {
    throw new Error(`[docs-frontmatter] ${sourcePath}: missing closing frontmatter boundary`);
  }

  const data: Record<string, unknown> = {};
  for (let i = 1; i < endIndex; i += 1) {
    const rawLine = lines[i];
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const colonIndex = line.indexOf(':');
    if (colonIndex <= 0) {
      throw new Error(
        `[docs-frontmatter] ${sourcePath}:${i + 1}: expected "key: value"`,
      );
    }
    const key = line.slice(0, colonIndex).trim();
    if (!/^[A-Za-z][A-Za-z0-9]*$/.test(key)) {
      throw new Error(`[docs-frontmatter] ${sourcePath}:${i + 1}: invalid key "${key}"`);
    }
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      throw new Error(`[docs-frontmatter] ${sourcePath}:${i + 1}: duplicate key "${key}"`);
    }
    data[key] = parseValue(line.slice(colonIndex + 1), sourcePath, key);
  }

  return {
    data,
    body: lines.slice(endIndex + 1).join('\n').replace(/^\n+/, ''),
  };
}

export function stripDocumentationFrontmatter(source: string, sourcePath = '<inline>'): string {
  return parseDocumentationSource(source, sourcePath).body;
}
