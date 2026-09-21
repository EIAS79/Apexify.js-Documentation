import type { VisualProject } from '../model';

export interface VisualHistoryEntry {
  label: string;
  project: VisualProject;
}

export interface VisualHistoryState {
  past: VisualHistoryEntry[];
  future: VisualHistoryEntry[];
}

export interface VisualHistoryResult {
  project: VisualProject;
  history: VisualHistoryState;
  label: string;
}

export function createVisualHistory(): VisualHistoryState {
  return { past: [], future: [] };
}

export function commitVisualHistory(
  history: VisualHistoryState,
  before: VisualProject,
  after: VisualProject,
  label: string,
  limit = 100,
): VisualHistoryState {
  if (before === after || JSON.stringify(before) === JSON.stringify(after)) return history;
  return {
    past: [...history.past, { label, project: before }].slice(-limit),
    future: [],
  };
}

export function undoVisualHistory(
  history: VisualHistoryState,
  current: VisualProject,
): VisualHistoryResult | null {
  const entry = history.past.at(-1);
  if (!entry) return null;
  return {
    project: entry.project,
    label: entry.label,
    history: {
      past: history.past.slice(0, -1),
      future: [{ label: entry.label, project: current }, ...history.future],
    },
  };
}

export function redoVisualHistory(
  history: VisualHistoryState,
  current: VisualProject,
): VisualHistoryResult | null {
  const entry = history.future[0];
  if (!entry) return null;
  return {
    project: entry.project,
    label: entry.label,
    history: {
      past: [...history.past, { label: entry.label, project: current }],
      future: history.future.slice(1),
    },
  };
}
