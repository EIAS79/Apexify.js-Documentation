import assert from 'node:assert/strict';
import test from 'node:test';
import {
  balancedDeclarationBody,
  namedDeclarationBody,
  topLevelDeclarationLines,
} from './declaration-parser';

test('balancedDeclarationBody ignores braces and quotes inside comments', () => {
  const source = `
export declare class Demo {
    /** Don't let { braces } or \`templates\` poison scanning. */
    run(): {
        nested: string;
    };
    readonly value: string;
}
`;
  const body = namedDeclarationBody(source, 'Demo', 'class');
  assert.match(body, /run/);
  assert.match(body, /readonly value/);
  assert.doesNotThrow(() => balancedDeclarationBody(source, source.indexOf('{')));
});

test('topLevelDeclarationLines is indentation agnostic and excludes nested return fields', () => {
  for (const indent of ['  ', '    ', '\t']) {
    const nested = indent + indent;
    const body = [
      '',
      indent + 'run(): {',
      nested + 'readonly nested: string;',
      indent + '};',
      indent + 'readonly value: string;',
      indent + 'get output(): string;',
      ''
    ].join('\n');
    const lines = topLevelDeclarationLines(body);
    assert.equal(lines.some((line) => line.includes('readonly nested')), false);
    assert.equal(lines.some((line) => line.startsWith('run()')), true);
    assert.equal(lines.some((line) => line.startsWith('readonly value')), true);
    assert.equal(lines.some((line) => line.startsWith('get output')), true);
  }
});
