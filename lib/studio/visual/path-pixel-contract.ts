import type {
  VisualNode,
  VisualProjectIssue,
  VisualProjectRecord,
  VisualValue,
} from './model';

export type StudioPathCommand =
  | { type: 'moveTo'; x: number; y: number }
  | { type: 'lineTo'; x: number; y: number }
  | { type: 'arc'; x: number; y: number; radius: number; startAngle: number; endAngle: number; counterclockwise?: boolean }
  | { type: 'arcTo'; x1: number; y1: number; x2: number; y2: number; radius: number }
  | { type: 'quadraticCurveTo'; cpx: number; cpy: number; x: number; y: number }
  | { type: 'bezierCurveTo'; cp1x: number; cp1y: number; cp2x: number; cp2y: number; x: number; y: number }
  | { type: 'rect'; x: number; y: number; width: number; height: number }
  | { type: 'ellipse'; x: number; y: number; radiusX: number; radiusY: number; rotation?: number; startAngle?: number; endAngle?: number; counterclockwise?: boolean }
  | { type: 'closePath' }
  | { type: 'circle'; x: number; y: number; radius: number }
  | { type: 'roundedRect'; x: number; y: number; width: number; height: number; radius: number | { tl?: number; tr?: number; br?: number; bl?: number } }
  | { type: 'polygon'; points: Array<{ x: number; y: number }> }
  | { type: 'star'; x: number; y: number; outerRadius: number; innerRadius: number; points: number }
  | { type: 'arrow'; x: number; y: number; length: number; angle: number; headLength?: number; headAngle?: number };

export type StudioPathDrawOptions = {
  opacity?: number;
  globalCompositeOperation?: string;
  transform?: {
    translateX?: number;
    translateY?: number;
    rotate?: number;
    scaleX?: number;
    scaleY?: number;
    originX?: number;
    originY?: number;
  };
  stroke?: {
    color?: string;
    width?: number;
    lineCap?: 'butt' | 'round' | 'square';
    lineJoin?: 'round' | 'bevel' | 'miter';
    miterLimit?: number;
    dashArray?: number[];
    dashOffset?: number;
    style?: 'solid' | 'dashed' | 'dotted';
    opacity?: number;
  };
  fill?: {
    color?: string;
    opacity?: number;
    rule?: 'nonzero' | 'evenodd';
  };
  shadow?: {
    color?: string;
    blur?: number;
    offsetX?: number;
    offsetY?: number;
  };
};

export type StudioConnectorOptions = {
  startCoordinates: { x: number; y: number };
  endCoordinates: { x: number; y: number };
  path?: { type: 'smooth' | 'bezier' | 'catmull-rom'; tension?: number; closed?: boolean };
  arrow?: { start?: boolean; end?: boolean; size?: number; style?: 'filled' | 'outline'; color?: string };
  markers?: Array<{ position: number; shape: 'circle' | 'square' | 'diamond' | 'arrow'; size: number; color: string }>;
  lineStyle?: {
    width?: number;
    color?: string;
    lineJoin?: 'round' | 'bevel' | 'miter';
    lineCap?: 'butt' | 'round' | 'square';
    singleLine?: boolean;
    lineDash?: { dashArray?: number[]; offset?: number };
    pattern?: { type: 'dots' | 'dashes' | 'custom'; segments?: number[]; offset?: number };
  };
};

export type VisualPathNodeProps = {
  tool: 'line' | 'polyline' | 'bezier' | 'path' | 'freehand' | 'connector';
  viewport: { width: number; height: number };
  commands?: StudioPathCommand[];
  connector?: StudioConnectorOptions | StudioConnectorOptions[];
  draw?: StudioPathDrawOptions;
};

export type StudioPixelOperation =
  | {
      type: 'manipulate';
      filter: 'grayscale' | 'invert' | 'sepia' | 'brightness' | 'contrast' | 'saturate';
      intensity?: number;
      region?: { x: number; y: number; width: number; height: number };
    }
  | {
      type: 'setColor';
      x: number;
      y: number;
      color: { r: number; g: number; b: number; a?: number };
    };

export type StudioHitRegion =
  | { type: 'rect'; x: number; y: number; width: number; height: number }
  | { type: 'circle'; x: number; y: number; radius: number }
  | { type: 'ellipse'; x: number; y: number; radiusX: number; radiusY: number; rotation?: number }
  | { type: 'polygon'; points: Array<{ x: number; y: number }> }
  | { type: 'path'; path: StudioPathCommand[]; fillRule?: 'nonzero' | 'evenodd' };

export type StudioDistanceRegion = Exclude<StudioHitRegion, { type: 'path' }>;

export type StudioDetectionOperation =
  | { type: 'pixelColor'; x: number; y: number; resultName?: string }
  | { type: 'pixelData'; region?: { x: number; y: number; width: number; height: number }; resultName?: string }
  | {
      type: 'detectPath';
      pathNodeId: string;
      x: number;
      y: number;
      includeStroke?: boolean;
      strokeWidth?: number;
      tolerance?: number;
      fillRule?: 'nonzero' | 'evenodd';
      resultName?: string;
    }
  | {
      type: 'detectRegion';
      region: StudioHitRegion;
      x: number;
      y: number;
      includeStroke?: boolean;
      strokeWidth?: number;
      tolerance?: number;
      fillRule?: 'nonzero' | 'evenodd';
      resultName?: string;
    }
  | {
      type: 'detectAnyRegion';
      regions: StudioHitRegion[];
      x: number;
      y: number;
      includeStroke?: boolean;
      strokeWidth?: number;
      tolerance?: number;
      fillRule?: 'nonzero' | 'evenodd';
      resultName?: string;
    }
  | {
      type: 'detectDistance';
      region: StudioDistanceRegion;
      x: number;
      y: number;
      resultName?: string;
    };

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function pathBounds(commands: StudioPathCommand[]): { width: number; height: number } {
  const xs: number[] = [];
  const ys: number[] = [];
  const visit = (value: unknown, key: string) => {
    if (!finite(value)) return;
    if (/^(?:x|x1|x2|cpx|cp1x|cp2x)$/.test(key)) xs.push(value);
    if (/^(?:y|y1|y2|cpy|cp1y|cp2y)$/.test(key)) ys.push(value);
  };
  for (const command of commands) {
    for (const [key, value] of Object.entries(command)) {
      if (key === 'points' && Array.isArray(value)) {
        value.forEach((point) => {
          xs.push(point.x);
          ys.push(point.y);
        });
      } else visit(value, key);
    }
  }
  return {
    width: Math.max(1, (xs.length ? Math.max(...xs) - Math.min(...xs) : 1)),
    height: Math.max(1, (ys.length ? Math.max(...ys) - Math.min(...ys) : 1)),
  };
}

export function defaultPathNodeProps(tool: VisualPathNodeProps['tool']): VisualPathNodeProps {
  const draw: StudioPathDrawOptions = {
    stroke: { color: '#7dd3fc', width: 4, lineCap: 'round', lineJoin: 'round', style: 'solid', opacity: 1 },
    fill: tool === 'path' ? { color: '#2563eb', opacity: 0.18, rule: 'nonzero' } : undefined,
  };
  if (tool === 'connector') {
    return {
      tool,
      viewport: { width: 220, height: 100 },
      connector: {
        startCoordinates: { x: 0, y: 20 },
        endCoordinates: { x: 220, y: 80 },
        arrow: { end: true, size: 14, style: 'filled', color: '#7dd3fc' },
        markers: [{ position: 0.5, shape: 'diamond', size: 8, color: '#f8fafc' }],
        lineStyle: { width: 4, color: '#7dd3fc', lineCap: 'round', lineJoin: 'round', lineDash: { dashArray: [], offset: 0 } },
      },
      draw,
    };
  }

  const commands: StudioPathCommand[] =
    tool === 'line'
      ? [{ type: 'moveTo', x: 0, y: 20 }, { type: 'lineTo', x: 220, y: 80 }]
      : tool === 'polyline'
        ? [{ type: 'moveTo', x: 0, y: 90 }, { type: 'lineTo', x: 65, y: 20 }, { type: 'lineTo', x: 145, y: 85 }, { type: 'lineTo', x: 220, y: 25 }]
        : tool === 'bezier'
          ? [{ type: 'moveTo', x: 0, y: 80 }, { type: 'bezierCurveTo', cp1x: 55, cp1y: -5, cp2x: 165, cp2y: 125, x: 220, y: 35 }]
          : tool === 'path'
            ? [{ type: 'moveTo', x: 10, y: 105 }, { type: 'lineTo', x: 60, y: 10 }, { type: 'quadraticCurveTo', cpx: 125, cpy: 65, x: 190, y: 10 }, { type: 'lineTo', x: 235, y: 105 }, { type: 'closePath' }]
            : [{ type: 'moveTo', x: 0, y: 50 }, { type: 'lineTo', x: 50, y: 34 }, { type: 'lineTo', x: 110, y: 65 }, { type: 'lineTo', x: 175, y: 20 }, { type: 'lineTo', x: 220, y: 50 }];

  const bounds = pathBounds(commands);
  return {
    tool,
    commands,
    viewport: { width: Math.max(220, bounds.width), height: Math.max(110, bounds.height) },
    draw,
  };
}

export function pathPropsRecord(props: VisualPathNodeProps): Record<string, VisualValue> {
  return structuredClone(props) as unknown as Record<string, VisualValue>;
}

export function visualPathProps(node: VisualNode): VisualPathNodeProps {
  return structuredClone(node.props) as unknown as VisualPathNodeProps;
}

export function operationRecord(
  kind: 'pixel-operation' | 'detection-operation',
  value: StudioPixelOperation | StudioDetectionOperation,
  options: { id: string; name?: string },
): VisualProjectRecord {
  return {
    id: options.id,
    kind,
    ...(options.name ? { name: options.name } : {}),
    value: structuredClone(value) as unknown as Record<string, VisualValue>,
  };
}

export function pixelOperation(record: VisualProjectRecord): StudioPixelOperation | null {
  return record.kind === 'pixel-operation'
    ? (structuredClone(record.value ?? {}) as unknown as StudioPixelOperation)
    : null;
}

export function detectionOperation(record: VisualProjectRecord): StudioDetectionOperation | null {
  return record.kind === 'detection-operation'
    ? (structuredClone(record.value ?? {}) as unknown as StudioDetectionOperation)
    : null;
}

export function validatePhase7Node(node: VisualNode, issues: VisualProjectIssue[]): void {
  if (node.kind !== 'path' && node.kind !== 'freehand') return;
  const props = visualPathProps(node);
  const fail = (path: string, message: string) => issues.push({ severity: 'error', code: 'phase7-path', path, message });
  if (!['line','polyline','bezier','path','freehand','connector'].includes(props.tool)) fail('document.nodes.'+node.id+'.props.tool','Unsupported path tool.');
  if (!finite(props.viewport?.width) || props.viewport.width <= 0 || !finite(props.viewport?.height) || props.viewport.height <= 0) fail('document.nodes.'+node.id+'.props.viewport','Path viewport must be positive.');
  if (props.tool === 'connector') {
    if (!props.connector) fail('document.nodes.'+node.id+'.props.connector','Connector options are required.');
  } else if (!Array.isArray(props.commands) || props.commands.length < 2) {
    fail('document.nodes.'+node.id+'.props.commands','Path commands must contain at least two commands.');
  }
  if (props.draw?.stroke?.width !== undefined && (!finite(props.draw.stroke.width) || props.draw.stroke.width < 0)) fail('document.nodes.'+node.id+'.props.draw.stroke.width','Stroke width must be non-negative.');
  if (props.draw?.fill?.rule && !['nonzero','evenodd'].includes(props.draw.fill.rule)) fail('document.nodes.'+node.id+'.props.draw.fill.rule','Fill rule must be nonzero or evenodd.');
}

export function validatePhase7Operation(record: VisualProjectRecord, issues: VisualProjectIssue[]): void {
  if (record.kind !== 'pixel-operation' && record.kind !== 'detection-operation') return;
  if (!record.value || typeof record.value.type !== 'string') {
    issues.push({ severity: 'error', code: 'phase7-operation', path: 'operations.'+record.id, message: 'Phase 7 operation requires a type.' });
  }
}
