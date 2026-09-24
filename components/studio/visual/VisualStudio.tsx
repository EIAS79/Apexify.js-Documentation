'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import VisualStudioPre4 from './VisualStudioPre4';
import { PHASE17_AUTOSAVE_STORAGE_KEY } from '@/lib/studio/visual/hardening';

type BoundaryState = {
  error: Error | null;
  recoveryNonce: number;
};

class VisualStudioCrashBoundary extends Component<
  { children: ReactNode },
  BoundaryState
> {
  state: BoundaryState = { error: null, recoveryNonce: 0 };

  static getDerivedStateFromError(error: Error): Partial<BoundaryState> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    try {
      window.sessionStorage.setItem(
        'apexify-visual-last-crash-v1',
        JSON.stringify({
          message: error.message,
          componentStack: info.componentStack,
          at: Date.now(),
        }),
      );
    } catch {}
  }

  private retry = () => {
    this.setState((current) => ({
      error: null,
      recoveryNonce: current.recoveryNonce + 1,
    }));
  };

  private resetRecovery = () => {
    try {
      window.localStorage.removeItem(PHASE17_AUTOSAVE_STORAGE_KEY);
    } catch {}
    this.retry();
  };

  render() {
    if (!this.state.error) {
      return <div key={this.state.recoveryNonce} className="contents">{this.props.children}</div>;
    }

    return (
      <div className="apx-visual-crash-boundary" role="alert" data-visual-crash-boundary>
        <div>
          <strong>Visual Studio recovered from a panel crash.</strong>
          <span>
            The failure was isolated before it could take down Code Studio. Retry with the
            saved Visual session, or reset only the Visual recovery snapshot.
          </span>
          <code>{this.state.error.message}</code>
          <div>
            <button type="button" onClick={this.retry}>Retry Visual Studio</button>
            <button type="button" onClick={this.resetRecovery}>Reset recovery snapshot</button>
          </div>
        </div>
      </div>
    );
  }
}

export default function VisualStudio(
  props: Parameters<typeof VisualStudioPre4>[0],
) {
  return (
    <VisualStudioCrashBoundary>
      <VisualStudioPre4 {...props} />
    </VisualStudioCrashBoundary>
  );
}
