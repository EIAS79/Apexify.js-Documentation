'use client';

import type { ReactNode } from 'react';
import { InteractiveWorkspace } from '@/components/docs/playground/InteractiveWorkspace';

/**
 * Studio compatibility adapter. Shared responsive/split behavior is owned by DOC-8's
 * InteractiveWorkspace; this name remains temporarily to avoid coupling CodeStudio to
 * migration details. Delete after the Studio surface imports the shared primitive directly.
 */
export function StudioResizableSplit({
  ratio,
  onRatioChange,
  enabled,
  left,
  right,
}: {
  ratio: number;
  onRatioChange: (next: number) => void;
  enabled: boolean;
  left: ReactNode;
  right: ReactNode;
}) {
  return (
    <InteractiveWorkspace
      ratio={ratio}
      onRatioChange={onRatioChange}
      enabled={enabled}
      editor={left}
      preview={right}
    />
  );
}
