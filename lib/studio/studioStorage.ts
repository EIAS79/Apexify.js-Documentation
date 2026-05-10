/**
 * Persistence helpers for the studio: multi-tab buffers, run history,
 * legacy-v1 migration, share-link encode/decode (URL-safe base64).
 */

import {
  PersistedStudio,
  RunHistoryEntry,
  STUDIO_HISTORY_KEY,
  STUDIO_INCOMING_SNIPPET_KEY,
  STUDIO_LEGACY_STORAGE_KEY,
  STUDIO_STORAGE_KEY,
  STUDIO_STARTER_JS,
  STUDIO_STARTER_TS,
  StudioBuffer,
  StudioLang,
  createDefaultBuffer,
  makeId,
} from './studioConfig';

const HISTORY_LIMIT = 8;

/* ----------------------------------------------------------------- *
 *  Persisted studio state — buffers + ui prefs
 * ----------------------------------------------------------------- */

export function loadPersistedStudio(): PersistedStudio | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STUDIO_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedStudio;
      if (Array.isArray(parsed.buffers) && parsed.buffers.length > 0) {
        return parsed;
      }
    }

    /** Migrate legacy v1 shape: { ts, js, lang, layout, autoRun } → single buffer. */
    const legacyRaw = window.localStorage.getItem(STUDIO_LEGACY_STORAGE_KEY);
    if (legacyRaw) {
      try {
        const legacy = JSON.parse(legacyRaw) as {
          ts?: string;
          js?: string;
          lang?: StudioLang;
          layout?: PersistedStudio['layout'];
          autoRun?: boolean;
        };
        const buffer: StudioBuffer = {
          id: makeId(),
          name: 'Sketch',
          ts: typeof legacy.ts === 'string' && legacy.ts.trim() ? legacy.ts : STUDIO_STARTER_TS,
          js: typeof legacy.js === 'string' && legacy.js.trim() ? legacy.js : STUDIO_STARTER_JS,
        };
        return {
          buffers: [buffer],
          activeBufferId: buffer.id,
          lang: legacy.lang === 'js' ? 'js' : 'ts',
          layout: legacy.layout ?? 'split',
          autoRun: Boolean(legacy.autoRun),
        };
      } catch {
        /* fall through */
      }
    }
  } catch {
    /* storage might be blocked */
  }
  return null;
}

export function savePersistedStudio(payload: PersistedStudio): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STUDIO_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* quota / blocked */
  }
}

/* ----------------------------------------------------------------- *
 *  Run history
 * ----------------------------------------------------------------- */

export function loadRunHistory(): RunHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STUDIO_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RunHistoryEntry[];
    return Array.isArray(parsed) ? parsed.slice(0, HISTORY_LIMIT) : [];
  } catch {
    return [];
  }
}

export function saveRunHistory(entries: RunHistoryEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STUDIO_HISTORY_KEY, JSON.stringify(entries.slice(0, HISTORY_LIMIT)));
  } catch {
    /* quota — drop the oldest thumb and retry once */
    try {
      const slim = entries.slice(0, HISTORY_LIMIT).map((e) => ({ ...e, thumbDataUrl: null }));
      window.localStorage.setItem(STUDIO_HISTORY_KEY, JSON.stringify(slim));
    } catch {
      /* give up */
    }
  }
}

export function pushRunHistory(entry: RunHistoryEntry, current: RunHistoryEntry[]): RunHistoryEntry[] {
  const next = [entry, ...current].slice(0, HISTORY_LIMIT);
  saveRunHistory(next);
  return next;
}

/* ----------------------------------------------------------------- *
 *  Incoming snippet (gallery → studio handoff)
 * ----------------------------------------------------------------- */

export type IncomingSnippet = {
  name?: string;
  ts?: string;
  js?: string;
  lang?: StudioLang;
};

export function consumeIncomingSnippet(): IncomingSnippet | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STUDIO_INCOMING_SNIPPET_KEY);
    if (!raw) return null;
    window.localStorage.removeItem(STUDIO_INCOMING_SNIPPET_KEY);
    return JSON.parse(raw) as IncomingSnippet;
  } catch {
    return null;
  }
}

/* ----------------------------------------------------------------- *
 *  Share-link encoding (URL-safe base64 of the active buffer)
 * ----------------------------------------------------------------- */

function utf8ToBase64Url(input: string): string {
  if (typeof window === 'undefined') return '';
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToUtf8(input: string): string {
  if (typeof window === 'undefined') return '';
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const fill = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  const binary = window.atob(padded + fill);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export type ShareLinkPayload = {
  name?: string;
  ts: string;
  js: string;
  lang: StudioLang;
};

export function encodeShareLink(payload: ShareLinkPayload): string {
  return utf8ToBase64Url(JSON.stringify(payload));
}

export function decodeShareLink(encoded: string): ShareLinkPayload | null {
  try {
    const parsed = JSON.parse(base64UrlToUtf8(encoded)) as ShareLinkPayload;
    if (typeof parsed.ts !== 'string' && typeof parsed.js !== 'string') return null;
    return {
      name: typeof parsed.name === 'string' ? parsed.name : undefined,
      ts: typeof parsed.ts === 'string' ? parsed.ts : '',
      js: typeof parsed.js === 'string' ? parsed.js : '',
      lang: parsed.lang === 'js' ? 'js' : 'ts',
    };
  } catch {
    return null;
  }
}

/* ----------------------------------------------------------------- *
 *  First-mount bootstrap — assemble the initial state, applying any
 *  share-link or gallery handoff before falling back to persisted /
 *  default buffers.
 * ----------------------------------------------------------------- */

export type StudioBootstrap = {
  buffers: StudioBuffer[];
  activeBufferId: string;
  lang: StudioLang;
  layout: PersistedStudio['layout'];
  autoRun: boolean;
  splitRatio: number;
  /** Origin so the orchestrator can show a soft toast after share-link load. */
  source: 'fresh' | 'persisted' | 'incoming' | 'share';
};

export function bootstrapStudio(): StudioBootstrap {
  const persisted = loadPersistedStudio();

  const baseBuffers: StudioBuffer[] = persisted?.buffers?.length
    ? persisted.buffers
    : [createDefaultBuffer()];
  const baseActive = persisted?.activeBufferId && baseBuffers.some((b) => b.id === persisted.activeBufferId)
    ? persisted.activeBufferId
    : baseBuffers[0].id;

  const baseState: StudioBootstrap = {
    buffers: baseBuffers,
    activeBufferId: baseActive,
    lang: persisted?.lang ?? 'ts',
    layout: persisted?.layout ?? 'split',
    autoRun: Boolean(persisted?.autoRun),
    splitRatio: typeof persisted?.splitRatio === 'number' ? persisted.splitRatio : 0.5,
    source: persisted ? 'persisted' : 'fresh',
  };

  /** Share-link wins over incoming gallery snippet wins over persisted. */
  if (typeof window !== 'undefined') {
    const hash = window.location.hash || '';
    const marker = '#snippet=';
    if (hash.startsWith(marker)) {
      const raw = hash.slice(marker.length);
      const decoded = decodeShareLink(decodeURIComponent(raw));
      if (decoded) {
        const buf: StudioBuffer = {
          id: makeId(),
          name: decoded.name || 'Shared snippet',
          ts: decoded.ts || STUDIO_STARTER_TS,
          js: decoded.js || STUDIO_STARTER_JS,
        };
        try {
          history.replaceState(null, '', window.location.pathname + window.location.search);
        } catch {
          /* ignore */
        }
        return {
          ...baseState,
          buffers: [buf, ...baseState.buffers],
          activeBufferId: buf.id,
          lang: decoded.lang ?? baseState.lang,
          source: 'share',
        };
      }
    }
  }

  const incoming = consumeIncomingSnippet();
  if (incoming && (incoming.ts || incoming.js)) {
    const buf: StudioBuffer = {
      id: makeId(),
      name: incoming.name || 'Gallery snippet',
      ts: incoming.ts || STUDIO_STARTER_TS,
      js: incoming.js || STUDIO_STARTER_JS,
    };
    return {
      ...baseState,
      buffers: [buf, ...baseState.buffers],
      activeBufferId: buf.id,
      lang: incoming.lang ?? baseState.lang,
      source: 'incoming',
    };
  }

  return baseState;
}
