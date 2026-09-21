/**
 * Extract a declaration body while ignoring braces and quote-like characters
 * that appear inside comments or string/template literals.
 *
 * TypeScript declaration output preserves JSDoc, so a naive brace scanner can
 * become poisoned by apostrophes/backticks/braces in comments.
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
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === quote) {
        quote = null;
      }
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

    if (ch === '{') {
      depth += 1;
      continue;
    }

    if (ch === '}') {
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
