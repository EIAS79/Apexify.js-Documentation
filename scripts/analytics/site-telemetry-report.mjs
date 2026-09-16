import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.APEXIFY_ANALYTICS_DATABASE_URL;
if (!databaseUrl) {
  console.error("APEXIFY_ANALYTICS_DATABASE_URL is required");
  process.exit(1);
}

const requestedDays = Number(process.argv[2] ?? 7);
const days = Number.isFinite(requestedDays)
  ? Math.max(1, Math.min(90, Math.trunc(requestedDays)))
  : 7;
const sql = neon(databaseUrl);

const [traffic, inpAll, inpDocs, coverage] = await Promise.all([
  sql`
    WITH ranked AS (
      SELECT
        path,
        count(*)::bigint AS pageviews,
        count(DISTINCT session_id)::bigint AS sessions,
        count(DISTINCT visitor_id)::bigint AS visitors
      FROM page_views
      WHERE received_at >= now() - make_interval(days => ${days})
      GROUP BY path
    ), totals AS (
      SELECT sum(pageviews)::numeric AS total_pageviews FROM ranked
    )
    SELECT
      path,
      pageviews,
      sessions,
      visitors,
      round((pageviews::numeric / NULLIF(total_pageviews, 0)) * 100, 2) AS pageview_share_pct
    FROM ranked CROSS JOIN totals
    ORDER BY pageviews DESC, sessions DESC, path ASC
    LIMIT 100
  `,
  sql`
    SELECT
      device_class,
      count(*)::bigint AS samples,
      percentile_cont(0.50) WITHIN GROUP (ORDER BY value) AS p50_ms,
      percentile_cont(0.75) WITHIN GROUP (ORDER BY value) AS p75_ms,
      percentile_cont(0.95) WITHIN GROUP (ORDER BY value) AS p95_ms
    FROM web_vitals
    WHERE metric_name = 'INP'
      AND updated_at >= now() - make_interval(days => ${days})
    GROUP BY device_class
    ORDER BY device_class
  `,
  sql`
    SELECT
      device_class,
      count(*)::bigint AS samples,
      percentile_cont(0.50) WITHIN GROUP (ORDER BY value) AS p50_ms,
      percentile_cont(0.75) WITHIN GROUP (ORDER BY value) AS p75_ms,
      percentile_cont(0.95) WITHIN GROUP (ORDER BY value) AS p95_ms
    FROM web_vitals
    WHERE metric_name = 'INP'
      AND document_path LIKE '/docs%'
      AND updated_at >= now() - make_interval(days => ${days})
    GROUP BY device_class
    ORDER BY device_class
  `,
  sql`
    SELECT
      count(*)::bigint AS pageviews,
      count(DISTINCT session_id)::bigint AS sessions,
      count(DISTINCT visitor_id)::bigint AS visitors,
      count(DISTINCT path)::bigint AS distinct_paths,
      min(received_at) AS first_pageview_at,
      max(received_at) AS last_pageview_at
    FROM page_views
    WHERE received_at >= now() - make_interval(days => ${days})
  `,
]);

console.log(
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      windowDays: days,
      coverage: coverage[0] ?? null,
      topPages: traffic,
      fieldInp: {
        allPagesByDevice: inpAll,
        docsLandingDocumentsByDevice: inpDocs,
        targetMs: 200,
        percentile: "p75",
      },
      notes: {
        pageviews: "Counts initial loads and Next.js client-side pathname navigations across the entire public site.",
        visitors: "Anonymous first-party browser IDs; no IP address, user-agent string, query string, hash, or form content is stored.",
        inpAttribution: "Web Vitals are document-lifecycle metrics. document_path is the initial document path; current SPA path is stored separately.",
      },
    },
    null,
    2,
  ),
);
