import assert from 'node:assert/strict';
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';

const repoRoot = process.cwd();
const capabilityDir = join(tmpdir(), 'apexify-studio-media-caps');

for (const mode of ['ffmpeg', 'ffprobe'] as const) {
  test(`${mode} proxy honors STUDIO_MEDIA_NODE_PATH`, () => {
    const root = mkdtempSync(join(tmpdir(), 'apexify-media-proxy-test-'));
    const fakeBinary = join(root, 'fake-media');
    const id = '11111111-2222-4333-8444-555555555555';
    const capability = join(capabilityDir, id + '.json');

    mkdirSync(capabilityDir, { recursive: true });
    writeFileSync(fakeBinary, '#!/bin/sh\nprintf "fake-media-ok\\n"\n', { mode: 0o755 });
    chmodSync(fakeBinary, 0o755);
    writeFileSync(capability, JSON.stringify({
      version: 1,
      runRoot: root,
      ffmpeg: fakeBinary,
      ffprobe: fakeBinary,
    }), { mode: 0o600 });

    try {
      const proxy = join(repoRoot, 'scripts', 'studio', mode + '-proxy');
      const result = spawnSync(proxy, ['-version'], {
        cwd: root,
        encoding: 'utf8',
        env: {
          ...process.env,
          STUDIO_MEDIA_CAP_ID: id,
          STUDIO_MEDIA_NODE_PATH: process.execPath,
        } as NodeJS.ProcessEnv,
      });

      assert.equal(result.status, 0, result.stderr || result.stdout);
      assert.match(result.stdout, /fake-media-ok/);
    } finally {
      rmSync(capability, { force: true });
      rmSync(root, { recursive: true, force: true });
    }
  });
}
