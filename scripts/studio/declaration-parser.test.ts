import assert from 'node:assert/strict';
import test from 'node:test';
import { balancedDeclarationBody, namedDeclarationBody } from './declaration-parser';

test('declaration scanner ignores comment punctuation and braces', () => {
  const declaration = `
export declare class ApexPainter {
  /** Convert a painter instance's buffer. A literal { brace } and \`code\` must be ignored. */
  toOutput(value: { nested: string }): Promise<string>;

  // a comment with ' an apostrophe and { unmatched-looking syntax
  render(value: string): void;
}
export declare const after: string;
`;

  const body = namedDeclarationBody(declaration, 'ApexPainter', 'class');
  assert.match(body, /toOutput/);
  assert.match(body, /render/);
  assert.doesNotMatch(body, /export declare const after/);
});

test('declaration scanner ignores block comments containing unmatched quote-like text', () => {
  const source = `interface Demo {
    /* user's text: ' \` " { {{ */
    value: { x: number };
  }
  interface Next { ok: true }`;

  const open = source.indexOf('{');
  const body = balancedDeclarationBody(source, open);
  assert.match(body, /value:/);
  assert.doesNotMatch(body, /interface Next/);
});

test('real declaration-style JSDoc with links and placeholders is safe', () => {
  const source = `
declare class ApexPainter {
  /**
   * Reusable scene design: native-value \`{{placeholders}}\`, \`$namedAssets\`,
   * and this painter instance's configured output representation.
   * See {@link ApexPainter}.
   */
  createTemplate(input: { width: number; height: number }): unknown;
}`;

  const body = namedDeclarationBody(source, 'ApexPainter', 'class');
  assert.match(body, /createTemplate/);
});
