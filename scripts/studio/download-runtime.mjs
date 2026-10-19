import { createHash } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { rm } from 'node:fs/promises';
import { get as httpsGet } from 'node:https';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { setTimeout as delay } from 'node:timers/promises';

async function openResponse(source, signal, get, redirects = 0) {
  if (new URL(source).protocol !== 'https:') throw new Error('Runtime downloads require HTTPS.');
  const response = await new Promise((resolve, reject) => {
    const request = get(source, { signal, headers: { 'User-Agent': 'Apexify-Studio-Build' } }, resolve);
    request.once('error', reject);
  });
  if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
    response.resume();
    if (!response.headers.location || redirects >= 5) throw new Error('Runtime download redirect limit exceeded.');
    return openResponse(new URL(response.headers.location, source).href, signal, get, redirects + 1);
  }
  if (response.statusCode !== 200) {
    response.resume();
    const error = new Error(`Runtime download failed with HTTP ${response.statusCode}`);
    error.retryable = response.statusCode === 429 || response.statusCode >= 500;
    throw error;
  }
  return response;
}

/** Stream one pinned artifact to disk; never accept partial or changed contents. */
export async function downloadVerified(artifact, destination, {
  get = httpsGet, attempts = 3, timeoutMs = 45_000, retryDelayMs = 1_000,
  onRetry = (message) => console.warn(message),
} = {}) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new Error('Runtime download timed out.')), timeoutMs);
    try {
      const response = await openResponse(artifact.url, controller.signal, get);
      let bytes = 0;
      const hash = createHash('sha256');
      await pipeline(response, new Transform({
        transform(chunk, encoding, callback) {
          bytes += chunk.length;
          if (bytes > artifact.bytes) {
            const error = new Error('Runtime archive exceeds its pinned size.');
            error.retryable = false;
            callback(error);
            return;
          }
          hash.update(chunk);
          callback(null, chunk);
        },
      }), createWriteStream(destination, { mode: 0o600 }));
      if (bytes !== artifact.bytes || hash.digest('hex') !== artifact.sha256) {
        const error = new Error('Runtime archive size or SHA-256 does not match its pin.');
        error.retryable = false;
        throw error;
      }
      return;
    } catch (error) {
      await rm(destination, { force: true });
      if (error.retryable === false || attempt === attempts) throw error;
      onRetry(`[studio] runtime download attempt ${attempt}/${attempts} failed: ${error.message}; retrying`);
    } finally {
      clearTimeout(timer);
      controller.abort();
    }
    await delay(retryDelayMs * attempt);
  }
}
