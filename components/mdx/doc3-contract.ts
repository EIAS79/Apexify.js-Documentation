export const DOC3_REQUIRED_COMPONENTS = [
  'Callout',
  'Steps',
  'Tabs',
  'Details',
  'CodeBlockV2',
  'CodeGroup',
  'InstallCommand',
  'CodeDiff',
  'ComparisonTable',
  'FeatureMatrix',
  'AvailabilityMatrix',
  'DecisionGuide',
  'ArchitectureDiagram',
  'BeforeAfter',
  'OutputPreview',
  'ExampleCard',
  'ExampleSteps',
  'NextSteps',
  'Prerequisites',
  'CapabilityBadge',
  'ImageResult',
  'VideoResult',
  'AudioResult',
  'SvgResult',
] as const;

export const DOC5_REGISTERED_COMPONENTS = ['ExecutableExample', 'CodePreview'] as const;

export const DOC3_COMPATIBILITY_COMPONENTS = ['Alert', 'Dropdown', 'CodeSwitcher', 'CodeBlock'] as const;

/**
 * The safe MDX-subset parser registry. DOC-3 owns the reusable component contract;
 * later phases extend this registry without changing DOC-3's required component set.
 */
export const DOC3_REGISTERED_COMPONENTS = [
  ...DOC3_REQUIRED_COMPONENTS,
  ...DOC5_REGISTERED_COMPONENTS,
  ...DOC3_COMPATIBILITY_COMPONENTS,
] as const;

export type Doc3RequiredComponentName = (typeof DOC3_REQUIRED_COMPONENTS)[number];
export type Doc3RegisteredComponentName = (typeof DOC3_REGISTERED_COMPONENTS)[number];
export type Doc5RegisteredComponentName = (typeof DOC5_REGISTERED_COMPONENTS)[number];
