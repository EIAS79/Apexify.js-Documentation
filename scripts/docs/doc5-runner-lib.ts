import { spawnSync } from 'node:child_process';
import path from 'node:path';
import type { ExampleOutputExpectation } from '../../lib/examples/schema';

export const MAX_STDIO_BYTES = 256 * 1024;
export const MAX_OUTPUT_FILES = 8;
export const MAX_TOTAL_OUTPUT_BYTES = 20 * 1024 * 1024;

export function sanitizedExecutionEnv(outputDir: string): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { APEXIFY_EXAMPLE_OUTPUT_DIR: outputDir };
  for (const key of ['PATH','Path','SystemRoot','TMPDIR','TMP','TEMP']) if (process.env[key]) env[key] = process.env[key];
  return env;
}

export function runControlled(command: string, args: string[], options: { cwd: string; timeoutMs: number; env?: NodeJS.ProcessEnv }) {
  const result = spawnSync(command, args, { cwd: options.cwd, env: options.env ?? sanitizedExecutionEnv(options.cwd), encoding: 'utf8', timeout: options.timeoutMs, maxBuffer: MAX_STDIO_BYTES, killSignal: 'SIGKILL' });
  const timedOut = Boolean(result.error && (result.error as NodeJS.ErrnoException).code === 'ETIMEDOUT');
  return { status: result.status, signal: result.signal, stdout: result.stdout ?? '', stderr: result.stderr ?? '', timedOut, error: result.error };
}

export function safeOutputPath(outputDir: string, relative: string): string {
  const resolved = path.resolve(outputDir, relative);
  const base = `${path.resolve(outputDir)}${path.sep}`;
  if (!resolved.startsWith(base)) throw new Error(`Output path escapes controlled directory: ${relative}`);
  return resolved;
}

export function verifyOutputBuffer(buffer: Buffer, expected: ExampleOutputExpectation): void {
  if (expected.minBytes !== undefined && buffer.length < expected.minBytes) throw new Error(`${expected.path}: ${buffer.length} bytes is below ${expected.minBytes}`);
  if (expected.maxBytes !== undefined && buffer.length > expected.maxBytes) throw new Error(`${expected.path}: ${buffer.length} bytes exceeds ${expected.maxBytes}`);
  if (expected.kind === 'png') {
    if (buffer.length < 24 || buffer.subarray(1,4).toString('ascii') !== 'PNG') throw new Error(`${expected.path}: invalid PNG signature`);
    const width = buffer.readUInt32BE(16), height = buffer.readUInt32BE(20);
    if (expected.width !== undefined && width !== expected.width) throw new Error(`${expected.path}: PNG width ${width} != ${expected.width}`);
    if (expected.height !== undefined && height !== expected.height) throw new Error(`${expected.path}: PNG height ${height} != ${expected.height}`);
  } else if (expected.kind === 'gif') {
    const signature = buffer.subarray(0,6).toString('ascii');
    if (signature !== 'GIF87a' && signature !== 'GIF89a') throw new Error(`${expected.path}: invalid GIF signature`);
    const width = buffer.readUInt16LE(6), height = buffer.readUInt16LE(8);
    if (expected.width !== undefined && width !== expected.width) throw new Error(`${expected.path}: GIF width ${width} != ${expected.width}`);
    if (expected.height !== undefined && height !== expected.height) throw new Error(`${expected.path}: GIF height ${height} != ${expected.height}`);
  } else if (expected.kind === 'json') {
    const actual = JSON.parse(buffer.toString('utf8'));
    if (expected.jsonEquals !== undefined && JSON.stringify(actual) !== JSON.stringify(expected.jsonEquals)) throw new Error(`${expected.path}: JSON semantic result mismatch`);
  } else if (expected.kind === 'text' && expected.exactText !== undefined && buffer.toString('utf8') !== expected.exactText) {
    throw new Error(`${expected.path}: exact text mismatch`);
  }
}
