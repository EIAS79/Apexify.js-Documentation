import { NextResponse } from "next/server";
import { renderWorkspaceDocument } from "@/features/apex-workspace/server/render";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;
const MAX_REQUEST_BYTES = 6_000_000;
let active = 0;
async function readBoundedJSON(request: Request): Promise<unknown> {
  if (!request.body) throw new Error("A composition is required.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_REQUEST_BYTES) {
        await reader.cancel();
        throw new Error("Composition exceeds the 6 MB request limit.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
export async function POST(request: Request) {
  // Sec-Fetch-Site survives a same-origin reverse proxy even when its internal URL/port differs.
  const origin = request.headers.get("origin");
  const site = request.headers.get("sec-fetch-site");
  let sameHost = !origin;
  try {
    sameHost =
      !origin ||
      new URL(origin).host === request.headers.get("host") ||
      origin === new URL(request.url).origin;
  } catch {
    sameHost = false;
  }
  if (site === "cross-site" || !sameHost)
    return NextResponse.json(
      { error: "Cross-origin render requests are not allowed." },
      { status: 403 },
    );
  if (request.headers.get("content-type")?.split(";")[0] !== "application/json")
    return NextResponse.json(
      { error: "Send an application/json composition." },
      { status: 415 },
    );
  if (Number(request.headers.get("content-length")) > MAX_REQUEST_BYTES)
    return NextResponse.json(
      { error: "Composition exceeds the 6 MB request limit." },
      { status: 413 },
    );
  if (active >= 2)
    return NextResponse.json(
      { error: "The renderer is busy. Please retry shortly." },
      { status: 429, headers: { "Retry-After": "2" } },
    );
  active++;
  const start = performance.now();
  try {
    const data = await readBoundedJSON(request);
    if (request.signal.aborted) return new NextResponse(null, { status: 499 });
    const output = await renderWorkspaceDocument(
      data,
      AbortSignal.any([request.signal, AbortSignal.timeout(25_000)]),
    );
    return new NextResponse(new Uint8Array(output), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "X-Apexify-Render-Ms": String(Math.round(performance.now() - start)),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message.slice(0, 500)
            : "Rendering failed.",
      },
      { status: 400 },
    );
  } finally {
    active--;
  }
}
