import { DOC8_RESOURCE_LIMITS, type InteractiveSession } from './contracts';

const SCHEMA_VERSION = 1 as const;

export function createInteractiveSession(input: Omit<InteractiveSession, 'schemaVersion'>): InteractiveSession {
  return { schemaVersion: SCHEMA_VERSION, ...input };
}

export function resetInteractiveSession(initial: InteractiveSession): InteractiveSession {
  return {
    ...initial,
    schemaVersion: SCHEMA_VERSION,
    options: { ...initial.options },
    layout: initial.layout ? { ...initial.layout } : undefined,
  };
}

export function serializeInteractiveSession(session: InteractiveSession): string {
  const json = JSON.stringify(session);
  const bytes = new TextEncoder().encode(json).byteLength;
  if (bytes > DOC8_RESOURCE_LIMITS.shareStateBytes) {
    throw new Error(`Interactive share state exceeds ${DOC8_RESOURCE_LIMITS.shareStateBytes} bytes.`);
  }
  return json;
}

export function parseInteractiveSession(serialized: string): InteractiveSession {
  if (new TextEncoder().encode(serialized).byteLength > DOC8_RESOURCE_LIMITS.shareStateBytes) {
    throw new Error('Interactive share state is too large.');
  }
  const value: unknown = JSON.parse(serialized);
  if (!value || typeof value !== 'object') throw new Error('Interactive share state is invalid.');
  const record = value as Record<string, unknown>;
  if (record.schemaVersion !== SCHEMA_VERSION) throw new Error('Interactive share state version is unsupported.');
  if (typeof record.source !== 'string' || (record.language !== 'ts' && record.language !== 'js')) {
    throw new Error('Interactive share state source or language is invalid.');
  }
  if (record.runtime !== 'node' && record.runtime !== 'web') throw new Error('Interactive runtime is invalid.');
  if (!record.options || typeof record.options !== 'object' || Array.isArray(record.options)) {
    throw new Error('Interactive options are invalid.');
  }
  return value as InteractiveSession;
}
