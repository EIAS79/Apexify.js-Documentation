export type ProductStatus =
  | 'CURRENT'
  | 'PREVIEW'
  | 'EXPERIMENTAL'
  | 'ROADMAP'
  | 'DEPRECATED'
  | 'REMOVED';

export type CurrentCapabilityDefinition = {
  id: string;
  title: string;
  summary: string;
  apiMember: string;
  exampleId?: string;
  note?: string;
};

export type RoadmapCapabilityDefinition = {
  id: string;
  title: string;
  summary: string;
  target: string;
  status: Extract<ProductStatus, 'PREVIEW' | 'EXPERIMENTAL' | 'ROADMAP'>;
};

export type FeatureTrackDefinition = {
  id: string;
  eyebrow: string;
  title: string;
  summary: string;
  apiMembers: string[];
  exampleId?: string;
};

export type PublicClaimDefinition = {
  id: string;
  claim: string;
  status: ProductStatus;
  evidence: string[];
};

export const HERO_EXAMPLE_ID = 'node.chart.bar';

export const CURRENT_CAPABILITIES: CurrentCapabilityDefinition[] = [
  {
    id: 'canvas',
    title: 'Canvas',
    summary: 'Create validated server-side raster canvases with explicit dimensions and backgrounds.',
    apiMember: 'createCanvas',
    exampleId: 'node.canvas.basic',
  },
  {
    id: 'images',
    title: 'Images & shapes',
    summary: 'Compose local or approved remote image sources and shape primitives onto raster surfaces.',
    apiMember: 'createImage',
  },
  {
    id: 'text',
    title: 'Text',
    summary: 'Render styled text and measure text through the current Node rendering backend.',
    apiMember: 'createText',
  },
  {
    id: 'charts',
    title: 'Charts',
    summary: 'Render chart images from structured data through the current server-side chart API.',
    apiMember: 'createChart',
    exampleId: 'node.chart.bar',
  },
  {
    id: 'scenes',
    title: 'Scenes',
    summary: 'Build ordered, validated compositions for reusable multi-layer rendering.',
    apiMember: 'createScene',
  },
  {
    id: 'templates',
    title: 'Templates',
    summary: 'Create immutable reusable scene definitions with data binding and layout support.',
    apiMember: 'createTemplate',
  },
  {
    id: 'gif',
    title: 'GIF',
    summary: 'Encode bounded GIF workflows from validated frames or generated animation work.',
    apiMember: 'createGIF',
    exampleId: 'node.gif.basic',
  },
  {
    id: 'video',
    title: 'Video',
    summary: 'Run validated FFmpeg-backed video operations from the Node/server runtime.',
    apiMember: 'createVideo',
    note: 'Requires a compatible FFmpeg/ffprobe environment for video operations.',
  },
  {
    id: 'audio',
    title: 'Procedural audio',
    summary: 'Generate procedural audio presets, synthesis, sequences and compositions.',
    apiMember: 'createAudio',
  },
];

export const ROADMAP_CAPABILITIES: RoadmapCapabilityDefinition[] = [
  {
    id: 'web',
    title: 'Browser runtime',
    summary: 'Direct browser rendering with a framework-neutral runtime is planned for the Advanced Engine Program.',
    target: '@apexify/web',
    status: 'ROADMAP',
  },
  {
    id: 'react',
    title: 'React adapter',
    summary: 'JSX/TSX authoring is planned on top of the future browser retained runtime.',
    target: '@apexify/react',
    status: 'ROADMAP',
  },
  {
    id: 'next',
    title: 'Next.js integration',
    summary: 'Dedicated server/client integration is planned after the framework-neutral web runtime is complete.',
    target: '@apexify/next',
    status: 'ROADMAP',
  },
  {
    id: 'animation',
    title: 'Engine-native animation',
    summary: 'A unified first-party animation and transition system is planned across compatible visual domains.',
    target: 'Advanced Engine Phase 23',
    status: 'ROADMAP',
  },
  {
    id: 'realtime',
    title: 'Retained realtime rendering',
    summary: 'Incremental browser updates, dirty tracking and retained resources are future engine work.',
    target: 'Advanced Engine Phase 21',
    status: 'ROADMAP',
  },
  {
    id: 'vector',
    title: 'Vector & SVG engine',
    summary: 'First-class vector representation and a safe SVG subset are planned for a later engine phase.',
    target: 'Advanced Engine Phase 28',
    status: 'ROADMAP',
  },
  {
    id: 'intelligence',
    title: 'Diagnostics & intelligence',
    summary: 'Deterministic diagnostics, profiling and optional AI assistance are planned after the engine becomes inspectable.',
    target: 'Advanced Engine Phases 37–40',
    status: 'ROADMAP',
  },
];

export const FEATURE_TRACKS: FeatureTrackDefinition[] = [
  {
    id: 'start',
    eyebrow: 'Start',
    title: 'Render a deterministic image',
    summary: 'Begin with an explicit canvas and a verified output before adding more rendering domains.',
    apiMembers: ['createCanvas'],
    exampleId: 'node.canvas.basic',
  },
  {
    id: 'charts',
    eyebrow: 'Data graphics',
    title: 'Turn structured data into charts',
    summary: 'Use the current chart API and compare the source against a verified generated PNG.',
    apiMembers: ['createChart'],
    exampleId: 'node.chart.bar',
  },
  {
    id: 'composition',
    eyebrow: 'Composition',
    title: 'Build reusable scenes and templates',
    summary: 'Move from one-off drawing calls to ordered scenes and reusable template definitions.',
    apiMembers: ['createScene', 'createTemplate'],
    exampleId: 'node.integration.report',
  },
  {
    id: 'motion-media',
    eyebrow: 'Media',
    title: 'Generate GIF, video and audio',
    summary: 'Use the current Node media APIs with their runtime, resource and FFmpeg requirements made explicit.',
    apiMembers: ['createGIF', 'createVideo', 'createAudio'],
    exampleId: 'node.gif.basic',
  },
];

export const PUBLIC_CLAIMS: PublicClaimDefinition[] = [
  {
    id: 'node-runtime',
    claim: 'Apexify.js 6 is a TypeScript-first Node/server rendering and media toolkit.',
    status: 'CURRENT',
    evidence: ['package.json:name/version/description', 'DOC-4 package manifest'],
  },
  ...CURRENT_CAPABILITIES.map((capability) => ({
    id: `current-${capability.id}`,
    claim: `${capability.title} is available in the current ApexPainter public surface.`,
    status: 'CURRENT' as const,
    evidence: [`DOC-4 ApexPainter#${capability.apiMember}`],
  })),
  {
    id: 'verified-hero',
    claim: 'The homepage code/output showcase is sourced from a DOC-5 verified executable example.',
    status: 'CURRENT',
    evidence: [`DOC-5 ${HERO_EXAMPLE_ID}`],
  },
  ...ROADMAP_CAPABILITIES.map((capability) => ({
    id: `roadmap-${capability.id}`,
    claim: `${capability.title} is future product direction and is not presented as shipped functionality.`,
    status: capability.status,
    evidence: [capability.target],
  })),
];

export const CURRENT_STATUS: ProductStatus = 'CURRENT';
