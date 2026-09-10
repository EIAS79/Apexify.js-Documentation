export interface BrowserExampleCapabilities {
  available: boolean;
  runtime: 'browser';
  packageName: '@apexify/web';
  supportsMount: boolean;
  supportsInteraction: boolean;
  supportsReset: boolean;
  resourcePolicy: 'declared-by-adapter';
}

export interface BrowserExampleRunRequest {
  exampleId: string;
  mountTarget: HTMLElement;
  signal: AbortSignal;
}

export interface BrowserExampleRunResult {
  exampleId: string;
  ok: boolean;
  consoleErrors: string[];
  semanticChecks: string[];
  cleanupComplete: boolean;
}

export interface BrowserExampleRunner {
  capabilities(): BrowserExampleCapabilities;
  mount(request: BrowserExampleRunRequest): Promise<void>;
  run(request: BrowserExampleRunRequest): Promise<BrowserExampleRunResult>;
  reset(): Promise<void>;
  dispose(): Promise<void>;
}

export const BROWSER_EXAMPLE_RUNTIME_STATUS = {
  available: false,
  reason: 'DOC-5 defines the contract only. @apexify/web is not a shipped current runtime and no browser execution adapter is activated.',
} as const;
