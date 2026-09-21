/**
 * Declaration helpers used by the Studio capability inventory.
 *
 * They deliberately ignore comments/string literals while matching braces and
 * isolate only the shallowest declaration-member indentation. TypeScript .d.ts
 * indentation can change between compiler builds, so no fixed two-space
 * assumption is allowed.
 */
export function balancedDeclarationBody(source: string, open: number): string {
  let depth = 0;
  let quote: "'" | '"' | '`' | null = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let index = open; index < source.length; index += 1) {
    const ch = source[index]!;
    const next = source[index + 1];

    if (lineComment) {
      if (ch === '\n' || ch === '\r') lineComment = false;
      continue;
    }
    if (blockComment) {
      if (ch === '*' && next === '/') {
        blockComment = false;
        index += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '/' && next === '/') {
      lineComment = true;
      index += 1;
      continue;
    }
    if (ch === '/' && next === '*') {
      blockComment = true;
      index += 1;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      quote = ch;
      continue;
    }
    if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(open + 1, index);
    }
  }
  throw new Error('Declaration body is unbalanced.');
}

export function namedDeclarationBody(
  source: string,
  name: string,
  kind: 'interface' | 'class',
): string {
  const pattern = new RegExp('\\b' + kind + '\\s+' + name + '\\b[^\\{]*\\{');
  const match = pattern.exec(source);
  if (!match) throw new Error(kind + ' ' + name + ' declaration was not found.');
  const open = match.index + match[0].lastIndexOf('{');
  return balancedDeclarationBody(source, open);
}

function candidateIndent(line: string): number | null {
  const match = /^([ \t]+)(.*)$/.exec(line);
  if (!match) return null;
  const rest = match[2]!;
  if (!/^(?:(?:public|readonly|get)\s+)*[A-Za-z_$][\w$]*(?:\s*[:(<]|\s*<)/.test(rest)) {
    return null;
  }
  return match[1]!.length;
}

/**
 * Return only declaration lines at the shallowest member indentation.
 * This excludes nested object-return fields while remaining independent of
 * whether TypeScript emits two spaces, four spaces, or tabs.
 */
export function topLevelDeclarationLines(body: string): string[] {
  const lines = body.split(/\r?\n/);
  const indents = lines
    .map(candidateIndent)
    .filter((value): value is number => value !== null);
  if (indents.length === 0) return [];
  const shallowest = Math.min(...indents);

  return lines.flatMap((line) => {
    const match = /^([ \t]+)(.*)$/.exec(line);
    if (!match || match[1]!.length !== shallowest) return [];
    return [match[2]!];
  });
}
