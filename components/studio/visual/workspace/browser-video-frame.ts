import { studioAssetDataUrl, type StudioVirtualAsset } from '@/lib/studio/runtime/assets';
import type { CanvasVideoFrameExtractionRequest } from '../VisualCanvasInspector';

type BrowserVideoFrame = {
  base64: string;
  mime: 'image/jpeg' | 'image/png';
  width: number;
  height: number;
  duration: number;
  fps: number;
  time: number;
};

type FrameCallbackMetadataLike = { mediaTime: number };
type FrameCapableVideo = HTMLVideoElement & {
  requestVideoFrameCallback?: (
    callback: (now: number, metadata: FrameCallbackMetadataLike) => void,
  ) => number;
};

function waitForMediaEvent(
  media: HTMLMediaElement,
  eventName: 'loadedmetadata' | 'seeked' | 'loadeddata',
  timeoutMs = 8000,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error('Video decoding timed out while waiting for ' + eventName + '.'));
    }, timeoutMs);
    const cleanup = () => {
      window.clearTimeout(timer);
      media.removeEventListener(eventName, onReady);
      media.removeEventListener('error', onError);
    };
    const onReady = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error('The browser could not decode this video asset.'));
    };
    media.addEventListener(eventName, onReady, { once: true });
    media.addEventListener('error', onError, { once: true });
  });
}

async function estimateBrowserVideoFps(video: HTMLVideoElement): Promise<number> {
  const frameVideo = video as FrameCapableVideo;
  if (!frameVideo.requestVideoFrameCallback) return 30;

  const mediaTimes: number[] = [];
  video.muted = true;
  video.playsInline = true;
  video.currentTime = 0;
  try {
    await waitForMediaEvent(video, 'seeked', 3500);
  } catch {
    // Some browsers do not emit seeked when currentTime is already zero.
  }

  return new Promise<number>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      video.pause();
      const deltas = mediaTimes
        .slice(1)
        .map((value, index) => value - mediaTimes[index]!)
        .filter((value) => Number.isFinite(value) && value > 0.001 && value < 0.2)
        .sort((a, b) => a - b);
      const median = deltas.length ? deltas[Math.floor(deltas.length / 2)]! : 0;
      const fps = median > 0 ? 1 / median : 30;
      resolve(Math.max(1, Math.min(240, Math.round(fps * 1000) / 1000)));
    };
    const timer = window.setTimeout(finish, 1100);
    const sample = (_now: number, metadata: FrameCallbackMetadataLike) => {
      mediaTimes.push(metadata.mediaTime);
      if (mediaTimes.length >= 10) {
        window.clearTimeout(timer);
        finish();
        return;
      }
      frameVideo.requestVideoFrameCallback?.(sample);
    };
    void video.play().then(
      () => frameVideo.requestVideoFrameCallback?.(sample),
      () => {
        window.clearTimeout(timer);
        finish();
      },
    );
  });
}

function browserCanvasBlob(
  canvas: HTMLCanvasElement,
  format: 'jpg' | 'png',
  quality: number,
): Promise<Blob> {
  const mime = format === 'png' ? 'image/png' : 'image/jpeg';
  const jpegQuality =
    format === 'jpg'
      ? Math.max(0.12, Math.min(1, 1 - ((quality - 1) / 30) * 0.88))
      : undefined;
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('Could not encode the extracted video frame.')),
      mime,
      jpegQuality,
    );
  });
}

function bytesAsBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.subarray(offset, Math.min(bytes.length, offset + chunkSize));
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

export async function extractStudioVideoFrameInBrowser(
  asset: StudioVirtualAsset,
  request: CanvasVideoFrameExtractionRequest,
  fpsHint?: number,
): Promise<BrowserVideoFrame> {
  if (!asset.mime.startsWith('video/')) {
    throw new Error(asset.name + ' is not a video asset.');
  }

  const video = document.createElement('video');
  video.preload = 'auto';
  video.muted = true;
  video.playsInline = true;
  video.src = studioAssetDataUrl(asset);

  try {
    await waitForMediaEvent(video, 'loadedmetadata', 9000);
    const duration = Number.isFinite(video.duration) ? video.duration : asset.metadata?.duration ?? 0;
    if (!Number.isFinite(duration) || duration <= 0) {
      throw new Error('Could not determine the uploaded video duration.');
    }

    let fps =
      typeof fpsHint === 'number' && Number.isFinite(fpsHint) && fpsHint > 0
        ? fpsHint
        : typeof asset.metadata?.fps === 'number' &&
            Number.isFinite(asset.metadata.fps) &&
            asset.metadata.fps > 0
          ? asset.metadata.fps
          : 0;

    if (request.mode === 'frame' && fps <= 0) {
      fps = await estimateBrowserVideoFps(video);
    }
    if (fps <= 0) fps = 30;

    const targetTime =
      request.mode === 'time'
        ? request.time
        : (Math.max(1, Math.round(request.frame)) - 1) / fps;

    if (targetTime < 0 || targetTime >= duration) {
      throw new Error(
        request.mode === 'frame'
          ? 'Requested frame ' + request.frame + ' is outside this video.'
          : 'Requested time ' + request.time + 's is outside this video.',
      );
    }

    video.pause();
    const safeTime = Math.min(targetTime, Math.max(0, duration - 0.001));
    const seekPromise = waitForMediaEvent(video, 'seeked', 9000);
    video.currentTime = safeTime;
    await seekPromise;

    const width = video.videoWidth || asset.metadata?.width || 0;
    const height = video.videoHeight || asset.metadata?.height || 0;
    if (width < 1 || height < 1) {
      throw new Error('The browser decoded the video but did not expose frame dimensions.');
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width);
    canvas.height = Math.round(height);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D is unavailable for local frame extraction.');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await browserCanvasBlob(canvas, request.format, request.quality);
    const base64 = bytesAsBase64(new Uint8Array(await blob.arrayBuffer()));
    return {
      base64,
      mime: request.format === 'png' ? 'image/png' : 'image/jpeg',
      width: canvas.width,
      height: canvas.height,
      duration,
      fps,
      time: safeTime,
    };
  } finally {
    video.pause();
    video.removeAttribute('src');
    video.load();
  }
}
