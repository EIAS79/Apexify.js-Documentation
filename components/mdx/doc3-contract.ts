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

export const DOC3_COMPATIBILITY_COMPONENTS = ['Alert', 'Dropdown', 'CodeSwitcher', 'CodeBlock'] as const;

export const DOC3_REGISTERED_COMPONENTS = [
  ...DOC3_REQUIRED_COMPONENTS,
  ...DOC3_COMPATIBILITY_COMPONENTS,
] as const;

export type Doc3RequiredComponentName = (typeof DOC3_REQUIRED_COMPONENTS)[number];
export type Doc3RegisteredComponentName = (typeof DOC3_REGISTERED_COMPONENTS)[number];
