CREATE TABLE IF NOT EXISTS page_views (
  event_id text PRIMARY KEY,
  received_at timestamptz NOT NULL DEFAULT now(),
  path text NOT NULL CHECK (char_length(path) BETWEEN 1 AND 512),
  document_path text NOT NULL CHECK (char_length(document_path) BETWEEN 1 AND 512),
  visitor_id text NOT NULL CHECK (char_length(visitor_id) BETWEEN 16 AND 80),
  session_id text NOT NULL CHECK (char_length(session_id) BETWEEN 16 AND 80),
  document_id text NOT NULL CHECK (char_length(document_id) BETWEEN 16 AND 80),
  device_class text NOT NULL CHECK (device_class IN ('mobile', 'tablet', 'desktop')),
  viewport_width integer NOT NULL CHECK (viewport_width BETWEEN 1 AND 10000)
);

CREATE INDEX IF NOT EXISTS page_views_received_at_idx
  ON page_views (received_at DESC);
CREATE INDEX IF NOT EXISTS page_views_path_received_at_idx
  ON page_views (path, received_at DESC);
CREATE INDEX IF NOT EXISTS page_views_session_received_at_idx
  ON page_views (session_id, received_at DESC);
CREATE INDEX IF NOT EXISTS page_views_visitor_received_at_idx
  ON page_views (visitor_id, received_at DESC);

CREATE TABLE IF NOT EXISTS web_vitals (
  metric_name text NOT NULL CHECK (metric_name IN ('TTFB', 'FCP', 'LCP', 'FID', 'CLS', 'INP')),
  metric_id text NOT NULL CHECK (char_length(metric_id) BETWEEN 1 AND 160),
  value double precision NOT NULL CHECK (value >= 0 AND value <= 3600000),
  delta double precision NOT NULL CHECK (delta >= 0 AND delta <= 3600000),
  rating text CHECK (rating IN ('good', 'needs-improvement', 'poor')),
  navigation_type text CHECK (char_length(navigation_type) <= 80),
  document_path text NOT NULL CHECK (char_length(document_path) BETWEEN 1 AND 512),
  current_path text NOT NULL CHECK (char_length(current_path) BETWEEN 1 AND 512),
  visitor_id text NOT NULL CHECK (char_length(visitor_id) BETWEEN 16 AND 80),
  session_id text NOT NULL CHECK (char_length(session_id) BETWEEN 16 AND 80),
  document_id text NOT NULL CHECK (char_length(document_id) BETWEEN 16 AND 80),
  device_class text NOT NULL CHECK (device_class IN ('mobile', 'tablet', 'desktop')),
  viewport_width integer NOT NULL CHECK (viewport_width BETWEEN 1 AND 10000),
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (metric_name, metric_id)
);

CREATE INDEX IF NOT EXISTS web_vitals_updated_at_idx
  ON web_vitals (updated_at DESC);
CREATE INDEX IF NOT EXISTS web_vitals_metric_updated_at_idx
  ON web_vitals (metric_name, updated_at DESC);
CREATE INDEX IF NOT EXISTS web_vitals_document_path_metric_idx
  ON web_vitals (document_path, metric_name, updated_at DESC);

CREATE OR REPLACE VIEW page_popularity_daily AS
SELECT
  date_trunc('day', received_at) AS day,
  path,
  count(*)::bigint AS pageviews,
  count(DISTINCT session_id)::bigint AS sessions,
  count(DISTINCT visitor_id)::bigint AS visitors
FROM page_views
GROUP BY 1, 2;

CREATE OR REPLACE VIEW web_vitals_daily AS
SELECT
  date_trunc('day', updated_at) AS day,
  document_path,
  device_class,
  metric_name,
  count(*)::bigint AS samples,
  percentile_cont(0.50) WITHIN GROUP (ORDER BY value) AS p50,
  percentile_cont(0.75) WITHIN GROUP (ORDER BY value) AS p75,
  percentile_cont(0.95) WITHIN GROUP (ORDER BY value) AS p95
FROM web_vitals
GROUP BY 1, 2, 3, 4;
