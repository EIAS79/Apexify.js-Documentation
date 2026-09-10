import type { ComponentType } from 'react';
import {
  CodeBlock, CodeSwitcher, Alert, Dropdown, CodeWithImage,
  Table, TableHead, TableBody, TableRow, TableHeader, TableCell,
  Callout, Steps, Tabs, Details, CodeBlockV2, CodeGroup, InstallCommand, CodeDiff,
  ComparisonTable, FeatureMatrix, AvailabilityMatrix, DecisionGuide, ArchitectureDiagram,
  BeforeAfter, OutputPreview, ExampleCard, ExampleSteps, NextSteps, Prerequisites,
  CapabilityBadge, ImageResult, VideoResult, AudioResult, SvgResult,
} from './components/mdx';

type MDXComponents = Record<string, ComponentType<any> | undefined>;

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    CodeBlock, CodeSwitcher, Alert, Dropdown, CodeWithImage,
    Table, TableHead, TableBody, TableRow, TableHeader, TableCell,
    Callout, Steps, Tabs, Details, CodeBlockV2, CodeGroup, InstallCommand, CodeDiff,
    ComparisonTable, FeatureMatrix, AvailabilityMatrix, DecisionGuide, ArchitectureDiagram,
    BeforeAfter, OutputPreview, ExampleCard, ExampleSteps, NextSteps, Prerequisites,
    CapabilityBadge, ImageResult, VideoResult, AudioResult, SvgResult,
    Warning: (props: any) => <Alert type="warning" {...props} />,
    Info: (props: any) => <Alert type="info" {...props} />,
    Error: (props: any) => <Alert type="error" {...props} />,
    Note: (props: any) => <Alert type="info" {...props} />,
    Success: (props: any) => <Alert type="success" {...props} />,
    ...components,
  };
}
