"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";

const ENDPOINT = "/api/analytics/collect";
const VISITOR_KEY = "apx:telemetry:visitor:v1";
const SESSION_KEY = "apx:telemetry:session:v1";

let memoryVisitorId: string | null = null;
let memorySessionId: string | null = null;
let documentId: string | null = null;
let documentPath: string | null = null;

function randomId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function normalizePath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/")) return "/";
  const withoutQueryOrHash = value.split(/[?#]/, 1)[0] || "/";
  if (withoutQueryOrHash === "/") return "/";
  return withoutQueryOrHash.replace(/\/{2,}/g, "/").replace(/\/$/, "") || "/";
}

function getStoredId(storage: Storage, key: string, fallback: () => string): string {
  try {
    const existing = storage.getItem(key);
    if (existing && existing.length >= 16 && existing.length <= 80) return existing;
    const created = fallback();
    storage.setItem(key, created);
    return created;
  } catch {
    return fallback();
  }
}

function getIdentity() {
  memoryVisitorId ??= getStoredId(window.localStorage, VISITOR_KEY, randomId);
  memorySessionId ??= getStoredId(window.sessionStorage, SESSION_KEY, randomId);
  documentId ??= randomId();
  documentPath ??= normalizePath(window.location.pathname);

  return {
    visitorId: memoryVisitorId,
    sessionId: memorySessionId,
    documentId,
    documentPath,
  };
}

function deviceContext() {
  const width = Math.max(1, Math.round(window.innerWidth || document.documentElement.clientWidth || 1));
  const deviceClass = width < 768 ? "mobile" : width < 1024 ? "tablet" : "desktop";
  return { viewportWidth: width, deviceClass } as const;
}

function telemetryAllowed(): boolean {
  if (process.env.NODE_ENV !== "production") return false;
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  if (navigator.doNotTrack === "1") return false;
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  if (nav.globalPrivacyControl === true) return false;
  return true;
}

function send(payload: Record<string, unknown>): void {
  if (!telemetryAllowed()) return;
  const serialized = JSON.stringify(payload);

  try {
    if (typeof navigator.sendBeacon === "function") {
      const accepted = navigator.sendBeacon(
        ENDPOINT,
        new Blob([serialized], { type: "application/json" }),
      );
      if (accepted) return;
    }
  } catch {
    // Fall through to keepalive fetch.
  }

  void fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: serialized,
    credentials: "same-origin",
    keepalive: true,
    cache: "no-store",
  }).catch(() => undefined);
}

function reportWebVital(metric: {
  id: string;
  name: string;
  value: number;
  delta: number;
  rating?: string;
  navigationType?: string;
}): void {
  if (!telemetryAllowed()) return;
  const identity = getIdentity();
  const device = deviceContext();

  send({
    schema: 1,
    type: "web_vital",
    metric: {
      id: metric.id,
      name: metric.name,
      value: metric.value,
      delta: metric.delta,
      rating: metric.rating ?? null,
      navigationType: metric.navigationType ?? null,
    },
    path: normalizePath(window.location.pathname),
    documentPath: identity.documentPath,
    visitorId: identity.visitorId,
    sessionId: identity.sessionId,
    documentId: identity.documentId,
    ...device,
  });
}

export function SiteTelemetry() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);

  useReportWebVitals(reportWebVital);

  useEffect(() => {
    if (!telemetryAllowed()) return;
    const path = normalizePath(pathname);
    if (lastTrackedPath.current === path) return;
    lastTrackedPath.current = path;

    const identity = getIdentity();
    const device = deviceContext();
    send({
      schema: 1,
      type: "pageview",
      eventId: randomId(),
      path,
      documentPath: identity.documentPath,
      visitorId: identity.visitorId,
      sessionId: identity.sessionId,
      documentId: identity.documentId,
      ...device,
    });
  }, [pathname]);

  return null;
}
