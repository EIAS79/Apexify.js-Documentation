import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 8 * 1024;
const ID_RE = /^[A-Za-z0-9_-]{16,80}$/;
const METRICS = new Set(["TTFB", "FCP", "LCP", "FID", "CLS", "INP"]);
const RATINGS = new Set(["good", "needs-improvement", "poor"]);
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function noStore(status = 204): Response {
  return new Response(null, {
    status,
    headers: { "cache-control": "no-store, max-age=0" },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validId(value: unknown): value is string {
  return typeof value === "string" && ID_RE.test(value);
}

function normalizePath(value: unknown): string | null {
  if (typeof value !== "string" || !value.startsWith("/") || value.length > 512) return null;
  const path = (value.split(/[?#]/, 1)[0] || "/")
    .replace(/\/{2,}/g, "/")
    .replace(/\/$/, "") || "/";
  const lower = path.toLowerCase();
  if (
    lower === "/robots.txt" ||
    lower === "/sitemap.xml" ||
    lower.startsWith("/api/") ||
    lower === "/api" ||
    lower.startsWith("/_next/") ||
    lower.startsWith("/_docs-fixtures/") ||
    lower.startsWith("/%5f_docs-fixtures/")
  ) {
    return null;
  }
  return path;
}

function device(value: unknown, width: unknown): { deviceClass: "mobile" | "tablet" | "desktop"; viewportWidth: number } | null {
  if (value !== "mobile" && value !== "tablet" && value !== "desktop") return null;
  if (typeof width !== "number" || !Number.isInteger(width) || width < 1 || width > 10000) return null;
  return { deviceClass: value, viewportWidth: width };
}

function finiteMetric(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 3_600_000;
}

function rateAllowed(sessionId: string): boolean {
  const now = Date.now();
  const current = rateBuckets.get(sessionId);
  if (!current || current.resetAt <= now) {
    rateBuckets.set(sessionId, { count: 1, resetAt: now + 60_000 });
    if (rateBuckets.size > 10_000) {
      for (const [key, bucket] of rateBuckets) {
        if (bucket.resetAt <= now) rateBuckets.delete(key);
      }
    }
    return true;
  }
  if (current.count >= 300) return false;
  current.count += 1;
  return true;
}

function productionCollectionEnabled(): boolean {
  if (process.env.NODE_ENV !== "production") return false;
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") return false;
  return Boolean(process.env.APEXIFY_ANALYTICS_DATABASE_URL);
}

export async function POST(request: Request): Promise<Response> {
  if (!productionCollectionEnabled()) return noStore();

  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");
  if (origin && origin !== requestUrl.origin) return noStore(403);
  if (request.headers.get("sec-fetch-site") === "cross-site") return noStore(403);

  const announcedLength = Number(request.headers.get("content-length") || "0");
  if (announcedLength > MAX_BODY_BYTES) return noStore(413);

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return noStore(400);
  }
  if (!raw || new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) return noStore(413);

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return noStore(400);
  }
  if (!isRecord(payload) || payload.schema !== 1) return noStore(400);

  const path = normalizePath(payload.path);
  const documentPath = normalizePath(payload.documentPath);
  const context = device(payload.deviceClass, payload.viewportWidth);
  if (
    !path ||
    !documentPath ||
    !context ||
    !validId(payload.visitorId) ||
    !validId(payload.sessionId) ||
    !validId(payload.documentId)
  ) {
    return noStore(400);
  }
  if (!rateAllowed(payload.sessionId)) return noStore(429);

  const databaseUrl = process.env.APEXIFY_ANALYTICS_DATABASE_URL;
  if (!databaseUrl) return noStore();
  const sql = neon(databaseUrl);

  try {
    if (payload.type === "pageview") {
      if (!validId(payload.eventId)) return noStore(400);
      await sql`
        INSERT INTO page_views (
          event_id, path, document_path, visitor_id, session_id, document_id,
          device_class, viewport_width
        ) VALUES (
          ${payload.eventId}, ${path}, ${documentPath}, ${payload.visitorId},
          ${payload.sessionId}, ${payload.documentId}, ${context.deviceClass},
          ${context.viewportWidth}
        )
        ON CONFLICT (event_id) DO NOTHING
      `;
      return noStore();
    }

    if (payload.type === "web_vital") {
      if (!isRecord(payload.metric)) return noStore(400);
      const metric = payload.metric;
      if (
        typeof metric.name !== "string" ||
        !METRICS.has(metric.name) ||
        typeof metric.id !== "string" ||
        metric.id.length < 1 ||
        metric.id.length > 160 ||
        !finiteMetric(metric.value) ||
        !finiteMetric(metric.delta)
      ) {
        return noStore(400);
      }

      const rating = typeof metric.rating === "string" && RATINGS.has(metric.rating) ? metric.rating : null;
      const navigationType =
        typeof metric.navigationType === "string" && metric.navigationType.length <= 80
          ? metric.navigationType
          : null;

      await sql`
        INSERT INTO web_vitals (
          metric_name, metric_id, value, delta, rating, navigation_type,
          document_path, current_path, visitor_id, session_id, document_id,
          device_class, viewport_width
        ) VALUES (
          ${metric.name}, ${metric.id}, ${metric.value}, ${metric.delta}, ${rating},
          ${navigationType}, ${documentPath}, ${path}, ${payload.visitorId},
          ${payload.sessionId}, ${payload.documentId}, ${context.deviceClass},
          ${context.viewportWidth}
        )
        ON CONFLICT (metric_name, metric_id) DO UPDATE SET
          value = EXCLUDED.value,
          delta = EXCLUDED.delta,
          rating = EXCLUDED.rating,
          navigation_type = EXCLUDED.navigation_type,
          current_path = EXCLUDED.current_path,
          device_class = EXCLUDED.device_class,
          viewport_width = EXCLUDED.viewport_width,
          updated_at = now()
      `;
      return noStore();
    }

    return noStore(400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown analytics storage error";
    console.error("[analytics] telemetry write failed:", message);
    return noStore(503);
  }
}
