'use client';

import { useCallback, useRef, useState } from 'react';
import type { VisualProject } from '@/lib/studio/visual/model';
import { createVisualProject } from '@/lib/studio/visual/project';
import {
  commitVisualHistory,
  createVisualHistory,
  redoVisualHistory,
  undoVisualHistory,
  type VisualHistoryState,
} from '@/lib/studio/visual/editor/history';
import { setVisualSelection } from '@/lib/studio/visual/editor/mutations';

export type VisualProjectUpdater = (project: VisualProject) => VisualProject;

export function useVisualEditor(initialProject?: VisualProject) {
  const [project, setProjectState] = useState<VisualProject>(() => initialProject ?? createVisualProject());
  const [history, setHistory] = useState<VisualHistoryState>(() => createVisualHistory());
  const projectRef = useRef(project);
  const interactionRef = useRef<{ before: VisualProject; label: string } | null>(null);

  const replaceProject = useCallback((next: VisualProject, resetHistory = false) => {
    projectRef.current = next;
    setProjectState(next);
    if (resetHistory) {
      setHistory(createVisualHistory());
      interactionRef.current = null;
    }
  }, []);

  const commit = useCallback((label: string, updater: VisualProjectUpdater) => {
    const before = projectRef.current;
    const after = updater(before);
    if (before === after) return;
    setHistory((current) => commitVisualHistory(current, before, after, label));
    replaceProject(after);
  }, [replaceProject]);

  const select = useCallback((ids: string[]) => {
    replaceProject(setVisualSelection(projectRef.current, ids));
  }, [replaceProject]);

  const beginInteraction = useCallback((label: string) => {
    if (!interactionRef.current) {
      interactionRef.current = { before: projectRef.current, label };
    }
    return interactionRef.current.before;
  }, []);

  const updateInteraction = useCallback((next: VisualProject) => {
    replaceProject(next);
  }, [replaceProject]);

  const finishInteraction = useCallback(() => {
    const interaction = interactionRef.current;
    if (!interaction) return;
    const after = projectRef.current;
    setHistory((current) =>
      commitVisualHistory(current, interaction.before, after, interaction.label),
    );
    interactionRef.current = null;
  }, []);

  const cancelInteraction = useCallback(() => {
    const interaction = interactionRef.current;
    if (!interaction) return;
    replaceProject(interaction.before);
    interactionRef.current = null;
  }, [replaceProject]);

  const undo = useCallback(() => {
    const result = undoVisualHistory(history, projectRef.current);
    if (!result) return null;
    replaceProject(result.project);
    setHistory(result.history);
    interactionRef.current = null;
    return result.label;
  }, [history, replaceProject]);

  const redo = useCallback(() => {
    const result = redoVisualHistory(history, projectRef.current);
    if (!result) return null;
    replaceProject(result.project);
    setHistory(result.history);
    interactionRef.current = null;
    return result.label;
  }, [history, replaceProject]);

  return {
    project,
    projectRef,
    history,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    replaceProject,
    commit,
    select,
    beginInteraction,
    updateInteraction,
    finishInteraction,
    cancelInteraction,
    undo,
    redo,
  };
}
