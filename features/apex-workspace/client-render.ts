import type { WorkspaceDocument } from "./model";
import {selectRenderAssets} from './render-assets';
function waitForCapacity(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new Error("Render cancelled."));
      return;
    }
    const abort = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", abort);
      reject(new Error("Render cancelled."));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve();
    }, ms);
    signal.addEventListener("abort", abort, { once: true });
  });
}
export async function requestWorkspaceRender(
  document: WorkspaceDocument,
  signal: AbortSignal,
): Promise<Blob> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch("/api/workspace/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(selectRenderAssets(document)),
      signal,
    });
    if (response.status === 429 && attempt < 2) {
      await response.body?.cancel();
      await waitForCapacity(1500, signal);
      continue;
    }
    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error ?? "Rendering failed.");
    }
    return response.blob();
  }
  throw new Error("The renderer is busy. Try again shortly.");
}
