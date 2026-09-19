import type { ReactNode } from 'react';
import { CodeBlockActions } from './CodeBlockActions';
import { composeStudioSnippetFromDocs, STUDIO_INCOMING_SNIPPET_KEY } from '@/lib/studio/studioConfig';

type SyntaxKind =
  | 'comment'
  | 'keyword'
  | 'string'
  | 'number'
  | 'function'
  | 'type'
  | 'property'
  | 'operator'
  | 'punctuation'
  | 'plain';

type SyntaxToken = { kind: SyntaxKind; text: string };

const JS_KEYWORDS = new Set([
  'as', 'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue',
  'debugger', 'default', 'delete', 'do', 'else', 'export', 'extends', 'false',
  'finally', 'for', 'from', 'function', 'get', 'if', 'implements', 'import', 'in',
  'instanceof', 'interface', 'let', 'new', 'null', 'of', 'private', 'protected',
  'public', 'readonly', 'return', 'set', 'static', 'super', 'switch', 'this',
  'throw', 'true', 'try', 'type', 'typeof', 'undefined', 'var', 'void', 'while',
  'with', 'yield',
]);

const SHELL_KEYWORDS = new Set([
  'cd', 'echo', 'export', 'if', 'then', 'else', 'fi', 'for', 'in', 'do', 'done',
  'case', 'esac', 'function', 'npm', 'npx', 'pnpm', 'yarn', 'bun', 'node', 'git',
]);

function normalizeLanguage(lang: string) {
  const langMap: Record<string, string> = {
    ts: 'typescript',
    js: 'javascript',
    sh: 'bash',
    shell: 'bash',
    zsh: 'bash',
    md: 'markdown',
    html: 'markup',
    xml: 'markup',
  };
  return langMap[lang.toLowerCase()] || lang.toLowerCase();
}

function isTerminalLanguage(language: string) {
  return ['bash', 'powershell', 'ps1', 'cmd'].includes(language);
}

function nextNonSpace(line: string, index: number) {
  let i = index;
  while (i < line.length && /\s/.test(line[i])) i += 1;
  return line[i] || '';
}

function classifyWord(word: string, line: string, end: number, language: string): SyntaxKind {
  const lower = word.toLowerCase();

  if (language === 'bash' || language === 'powershell' || language === 'ps1' || language === 'cmd') {
    if (SHELL_KEYWORDS.has(lower)) return 'keyword';
    if (word.startsWith('--') || word.startsWith('-')) return 'property';
  }

  if (JS_KEYWORDS.has(word) || ['true', 'false', 'null'].includes(lower)) return 'keyword';

  const next = nextNonSpace(line, end);
  if (next === '(') return 'function';
  if (next === ':' || next === '=') return 'property';
  if (/^[A-Z][A-Za-z0-9_$]*$/.test(word)) return 'type';

  return 'plain';
}

function tokenizeLine(line: string, language: string): SyntaxToken[] {
  const tokens: SyntaxToken[] = [];
  let index = 0;

  const push = (kind: SyntaxKind, text: string) => {
    if (!text) return;
    const previous = tokens[tokens.length - 1];
    if (previous && previous.kind === kind) previous.text += text;
    else tokens.push({ kind, text });
  };

  while (index < line.length) {
    const ch = line[index];
    const next = line[index + 1];

    if ((ch === '/' && next === '/') || (language === 'bash' && ch === '#')) {
      push('comment', line.slice(index));
      break;
    }

    if (ch === '/' && next === '*') {
      const close = line.indexOf('*/', index + 2);
      const end = close >= 0 ? close + 2 : line.length;
      push('comment', line.slice(index, end));
      index = end;
      continue;
    }

    if (ch === '<' && line.slice(index, index + 4) === '<!--') {
      const close = line.indexOf('-->', index + 4);
      const end = close >= 0 ? close + 3 : line.length;
      push('comment', line.slice(index, end));
      index = end;
      continue;
    }

    if (ch === '"' || ch === "'" || ch === String.fromCharCode(96)) {
      const quote = ch;
      let end = index + 1;
      let escaped = false;
      while (end < line.length) {
        const current = line[end];
        if (escaped) {
          escaped = false;
          end += 1;
          continue;
        }
        if (current === '\\') {
          escaped = true;
          end += 1;
          continue;
        }
        end += 1;
        if (current === quote) break;
      }
      push('string', line.slice(index, end));
      index = end;
      continue;
    }

    if (((ch === '-' || ch === '+') && /\d/.test(next || '')) || /\d/.test(ch)) {
      const match = line.slice(index).match(/^[+-]?(?:0x[\da-f]+|\d+(?:\.\d+)?(?:e[+-]?\d+)?)/i);
      if (match) {
        push('number', match[0]);
        index += match[0].length;
        continue;
      }
    }

    if (/[A-Za-z_$-]/.test(ch)) {
      const match = line.slice(index).match(/^[A-Za-z_$-][\w$-]*/);
      if (match) {
        const word = match[0];
        push(classifyWord(word, line, index + word.length, language), word);
        index += word.length;
        continue;
      }
    }

    if ('=+-*/%!<>?&|~^'.includes(ch)) {
      const operators = [
        '===', '!==', '=>', '==', '!=', '<=', '>=', '&&', '||', '??',
        '++', '--', '+=', '-=', '*=', '/=', '?.', '::',
      ];
      const value = operators.find((operator) => line.startsWith(operator, index)) || ch;
      push('operator', value);
      index += value.length;
      continue;
    }

    if ('{}[](),.;:'.includes(ch)) {
      push('punctuation', ch);
      index += 1;
      continue;
    }

    push('plain', ch);
    index += 1;
  }

  return tokens;
}

function renderHighlightedLine(line: string, language: string): ReactNode {
  return tokenizeLine(line, language).map((token, index) => (
    <span
      key={String(index) + '-' + token.kind}
      className={token.kind === 'plain' ? undefined : 'tok-' + token.kind}
    >
      {token.text}
    </span>
  ));
}

export function StaticCodeBlock({
  children,
  className,
  lang,
  filename,
  docsStudio = false,
}: {
  children?: ReactNode;
  className?: string;
  lang?: string;
  filename?: string;
  docsStudio?: boolean;
}) {
  let code = typeof children === 'string'
    ? children
    : Array.isArray(children)
      ? children.join('')
      : children?.toString() || '';

  const fence = String.fromCharCode(96).repeat(3);
  if (code.startsWith(fence)) {
    const firstBreak = code.indexOf('\n');
    if (firstBreak >= 0) code = code.slice(firstBreak + 1);
    if (code.trimEnd().endsWith(fence)) {
      const trimmed = code.trimEnd();
      code = trimmed.slice(0, -fence.length);
    }
  }
  code = code.trim();

  const language = lang || className?.replace('language-', '') || 'text';
  const normalizedLanguage = normalizeLanguage(language);
  const terminal = isTerminalLanguage(normalizedLanguage);
  const studioPayload = docsStudio ? composeStudioSnippetFromDocs(code, language) : null;
  const codeRegionLabel = filename ? filename + ' code example' : normalizedLanguage + ' code example';
  const lines = code.split('\n');

  return (
    <div className="apx-codeblock" data-doc11-static-code data-language={normalizedLanguage} data-terminal={terminal || undefined}>
      <div className="apx-codeblock__header">
        <div className="apx-codeblock__identity">
          <span className="apx-codeblock__kind">{terminal ? 'TERMINAL' : 'SOURCE'}</span>
          <strong>{filename || normalizedLanguage}</strong>
        </div>

        <div className="apx-codeblock__actions">
          <span className="apx-codeblock__language">{normalizedLanguage}</span>
          <CodeBlockActions code={code} studioPayload={studioPayload} storageKey={STUDIO_INCOMING_SNIPPET_KEY} />
        </div>
      </div>

      <div className="apx-codeblock__viewport" tabIndex={0} role="group" aria-label={codeRegionLabel}>
        <pre>
          <code>
            {lines.map((line, index) => (
              <span key={index} className="apx-code-line">
                <span aria-hidden="true" className="apx-code-line__number">{index + 1}</span>
                <span className="apx-code-line__source">
                  {terminal && index === 0 ? <span className="apx-code-line__prompt">$ </span> : null}
                  {line ? renderHighlightedLine(line, normalizedLanguage) : ' '}
                </span>
              </span>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}
