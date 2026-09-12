import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DOC8_RESOURCE_LIMITS,
  type InteractiveSession,
} from '../../lib/docs/playground/contracts';
import {
  createInteractiveSession,
  parseInteractiveSession,
  resetInteractiveSession,
  serializeInteractiveSession,
} from '../../lib/docs/playground/session';

function sampleSession(): InteractiveSession {
  return createInteractiveSession({
    source: "import { ApexPainter } from 'apexify.js';",
    language: 'ts',
    runtime: 'node',
    options: { width: 640, transparent: false },
    selectedFile: 'example.ts',
    layout: { activePanel: 'editor' },
  });
}

test('shared session serializer round-trips versioned state', () => {
  const session = sampleSession();
  const serialized = serializeInteractiveSession(session);
  assert.deepEqual(parseInteractiveSession(serialized), session);
});

test('shared session parser rejects unsupported versions and runtimes', () => {
  const base = sampleSession();
  assert.throws(
    () => parseInteractiveSession(JSON.stringify({ ...base, schemaVersion: 2 })),
    /version is unsupported/,
  );
  assert.throws(
    () => parseInteractiveSession(JSON.stringify({ ...base, runtime: 'browser-fake' })),
    /runtime is invalid/,
  );
});

test('share state is bounded', () => {
  const oversized = createInteractiveSession({
    source: 'x'.repeat(DOC8_RESOURCE_LIMITS.shareStateBytes + 1024),
    language: 'ts',
    runtime: 'node',
    options: {},
  });
  assert.throws(() => serializeInteractiveSession(oversized), /exceeds/);
});

test('reset returns a fresh deterministic copy of initial structured state', () => {
  const initial = sampleSession();
  const reset = resetInteractiveSession(initial);
  assert.deepEqual(reset, initial);
  assert.notEqual(reset.options, initial.options);
  assert.notEqual(reset.layout, initial.layout);
});

test('resource limits preserve bounded current runner ceilings', () => {
  assert.equal(DOC8_RESOURCE_LIMITS.executionMs, 55_000);
  assert.equal(DOC8_RESOURCE_LIMITS.sourceChars, 280_000);
  assert.equal(DOC8_RESOURCE_LIMITS.outputBytes, 25 * 1024 * 1024);
  assert.equal(DOC8_RESOURCE_LIMITS.processBufferBytes, 20 * 1024 * 1024);
  assert.equal(DOC8_RESOURCE_LIMITS.maxOutputs, 1);
  assert.ok(DOC8_RESOURCE_LIMITS.shareStateBytes < DOC8_RESOURCE_LIMITS.sourceChars);
});
