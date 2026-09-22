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

export type Phase7ReverseSyncClassification =
  | 'fully-reversible'
  | 'safely-normalized'
  | 'code-only';

export const PHASE7_LINKED_CODE_CLASSIFICATION = {
  'path2d.create': 'safely-normalized',
  'path2d.draw': 'safely-normalized',
  'path2d.custom': 'safely-normalized',
  'pixels.manipulate': 'fully-reversible',
  'pixels.setColor': 'fully-reversible',
  'pixels.getColor': 'fully-reversible',
  'pixels.getData': 'fully-reversible',
  'detect.path': 'fully-reversible',
  'detect.region': 'fully-reversible',
  'detect.anyRegion': 'fully-reversible',
  'detect.distance': 'fully-reversible',
} as const satisfies Record<string, Phase7ReverseSyncClassification>;

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
    const connectorItems = Array.isArray(props.connector)
      ? props.connector
      : props.connector
        ? [props.connector]
        : [];
    const validConnectorItem = (item: unknown) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
      const value = item as Record<string, unknown>;
      return validPoint(value.startCoordinates) && validPoint(value.endCoordinates);
    };
    if (!connectorItems.length || !connectorItems.every(validConnectorItem)) {
      fail(
        'document.nodes.'+node.id+'.props.connector',
        'Connector options require finite startCoordinates and endCoordinates.',
      );
    }
  } else if (!Array.isArray(props.commands) || props.commands.length < 1) {
    fail('document.nodes.'+node.id+'.props.commands','Path commands must contain at least one command.');
  } else if (!props.commands.every(validPathCommand)) {
    fail('document.nodes.'+node.id+'.props.commands','Path commands contain an unsupported or malformed command.');
  }
  if (props.draw?.stroke?.width !== undefined && (!finite(props.draw.stroke.width) || props.draw.stroke.width < 0)) fail('document.nodes.'+node.id+'.props.draw.stroke.width','Stroke width must be non-negative.');
  if (props.draw?.fill?.rule && !['nonzero','evenodd'].includes(props.draw.fill.rule)) fail('document.nodes.'+node.id+'.props.draw.fill.rule','Fill rule must be nonzero or evenodd.');
}

function phase7Issue(
  issues: VisualProjectIssue[],
  record: VisualProjectRecord,
  suffix: string,
  message: string,
) {
  issues.push({
    severity: 'error',
    code: 'phase7-operation',
    path: 'operations.' + record.id + (suffix ? '.' + suffix : ''),
    message,
  });
}

function validPixelRegion(value: unknown): value is { x?: number; y?: number; width?: number; height?: number } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const region = value as Record<string, unknown>;
  return (
    (region.x === undefined || (finite(region.x) && Number.isInteger(region.x) && region.x >= 0)) &&
    (region.y === undefined || (finite(region.y) && Number.isInteger(region.y) && region.y >= 0)) &&
    (region.width === undefined || (finite(region.width) && Number.isInteger(region.width) && region.width >= 1)) &&
    (region.height === undefined || (finite(region.height) && Number.isInteger(region.height) && region.height >= 1))
  );
}

function validCompletePixelRegion(value: unknown): boolean {
  return Boolean(
    validPixelRegion(value) &&
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    finite((value as { x?: unknown }).x) &&
    finite((value as { y?: unknown }).y) &&
    finite((value as { width?: unknown }).width) &&
    finite((value as { height?: unknown }).height),
  );
}

function validColor(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const color = value as Record<string, unknown>;
  return ['r', 'g', 'b'].every((key) =>
    finite(color[key]) && Number.isInteger(color[key]) && (color[key] as number) >= 0 && (color[key] as number) <= 255,
  ) && (
    color.a === undefined ||
    (finite(color.a) && Number.isInteger(color.a) && color.a >= 0 && color.a <= 255)
  );
}

function validPoint(value: unknown): value is { x: number; y: number } {
  return Boolean(
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    finite((value as { x?: unknown }).x) &&
    finite((value as { y?: unknown }).y),
  );
}

function validPathCommand(command: unknown): boolean {
  if (!command || typeof command !== 'object' || Array.isArray(command)) return false;
  const item = command as Record<string, unknown>;
  if (typeof item.type !== 'string') return false;
  const numeric = (...keys: string[]) => keys.every((key) => finite(item[key]));
  switch (item.type) {
    case 'moveTo':
    case 'lineTo':
      return numeric('x', 'y');
    case 'arc':
      return numeric('x', 'y', 'radius', 'startAngle', 'endAngle') && (item.counterclockwise === undefined || typeof item.counterclockwise === 'boolean');
    case 'arcTo':
      return numeric('x1', 'y1', 'x2', 'y2', 'radius');
    case 'quadraticCurveTo':
      return numeric('cpx', 'cpy', 'x', 'y');
    case 'bezierCurveTo':
      return numeric('cp1x', 'cp1y', 'cp2x', 'cp2y', 'x', 'y');
    case 'rect':
      return numeric('x', 'y', 'width', 'height');
    case 'ellipse':
      return numeric('x', 'y', 'radiusX', 'radiusY') &&
        (item.rotation === undefined || finite(item.rotation)) &&
        (item.startAngle === undefined || finite(item.startAngle)) &&
        (item.endAngle === undefined || finite(item.endAngle)) &&
        (item.counterclockwise === undefined || typeof item.counterclockwise === 'boolean');
    case 'closePath':
      return true;
    case 'circle':
      return numeric('x', 'y', 'radius');
    case 'roundedRect':
      return numeric('x', 'y', 'width', 'height') && (
        finite(item.radius) ||
        Boolean(
          item.radius &&
          typeof item.radius === 'object' &&
          !Array.isArray(item.radius) &&
          Object.values(item.radius as Record<string, unknown>).every((value) => value === undefined || finite(value)),
        )
      );
    case 'polygon':
      return Array.isArray(item.points) && item.points.length >= 3 && item.points.every(validPoint);
    case 'star':
      return numeric('x', 'y', 'outerRadius', 'innerRadius', 'points');
    case 'arrow':
      return numeric('x', 'y', 'length', 'angle') &&
        (item.headLength === undefined || finite(item.headLength)) &&
        (item.headAngle === undefined || finite(item.headAngle));
    default:
      return false;
  }
}

function validHitRegion(value: unknown, allowPath = true): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const region = value as Record<string, unknown>;
  switch (region.type) {
    case 'rect':
      return finite(region.x) && finite(region.y) && finite(region.width) && region.width > 0 && finite(region.height) && region.height > 0;
    case 'circle':
      return finite(region.x) && finite(region.y) && finite(region.radius) && region.radius > 0;
    case 'ellipse':
      return finite(region.x) && finite(region.y) && finite(region.radiusX) && region.radiusX > 0 &&
        finite(region.radiusY) && region.radiusY > 0 && (region.rotation === undefined || finite(region.rotation));
    case 'polygon':
      return Array.isArray(region.points) && region.points.length >= 3 && region.points.every(validPoint);
    case 'path':
      return allowPath && Array.isArray(region.path) && region.path.length > 0 &&
        region.path.every(validPathCommand) &&
        (region.fillRule === undefined || region.fillRule === 'nonzero' || region.fillRule === 'evenodd');
    default:
      return false;
  }
}

function validDetectionOptions(value: Record<string, unknown>): boolean {
  return (
    (value.includeStroke === undefined || typeof value.includeStroke === 'boolean') &&
    (value.strokeWidth === undefined || (finite(value.strokeWidth) && value.strokeWidth > 0)) &&
    (value.tolerance === undefined || (finite(value.tolerance) && value.tolerance >= 0)) &&
    (value.fillRule === undefined || value.fillRule === 'nonzero' || value.fillRule === 'evenodd') &&
    (value.resultName === undefined || (typeof value.resultName === 'string' && value.resultName.length > 0))
  );
}

export function validatePhase7Operation(record: VisualProjectRecord, issues: VisualProjectIssue[]): void {
  if (record.kind !== 'pixel-operation' && record.kind !== 'detection-operation') return;
  const value = record.value as Record<string, unknown> | undefined;
  if (!value || typeof value.type !== 'string') {
    phase7Issue(issues, record, '', 'Phase 7 operation requires a supported type.');
    return;
  }

  if (record.kind === 'pixel-operation') {
    if (value.type === 'manipulate') {
      if (!['grayscale','invert','sepia','brightness','contrast','saturate'].includes(String(value.filter))) {
        phase7Issue(issues, record, 'filter', 'Pixel manipulation filter is unsupported.');
      }
      if (value.intensity !== undefined && (!finite(value.intensity) || value.intensity < 0 || value.intensity > 1)) {
        phase7Issue(issues, record, 'intensity', 'Pixel manipulation intensity must be between 0 and 1.');
      }
      if (value.region !== undefined && !validCompletePixelRegion(value.region)) {
        phase7Issue(issues, record, 'region', 'Pixel manipulation region must include valid x, y, width and height.');
      }
      return;
    }
    if (value.type === 'setColor') {
      if (!finite(value.x) || !Number.isInteger(value.x) || value.x < 0 ||
          !finite(value.y) || !Number.isInteger(value.y) || value.y < 0) {
        phase7Issue(issues, record, '', 'Pixel color coordinates must be non-negative integers.');
      }
      if (!validColor(value.color)) {
        phase7Issue(issues, record, 'color', 'Pixel color channels must be integer values from 0 to 255.');
      }
      return;
    }
    phase7Issue(issues, record, 'type', 'Unsupported pixel operation type.');
    return;
  }

  if (!validDetectionOptions(value)) {
    phase7Issue(issues, record, '', 'Detection options are invalid.');
  }

  const finiteXY = () => {
    if (!finite(value.x) || !finite(value.y)) {
      phase7Issue(issues, record, '', 'Detection coordinates must be finite numbers.');
      return false;
    }
    return true;
  };

  switch (value.type) {
    case 'pixelColor':
      if (!finiteXY() || !Number.isInteger(value.x as number) || !Number.isInteger(value.y as number) ||
          (value.x as number) < 0 || (value.y as number) < 0) {
        phase7Issue(issues, record, '', 'Pixel probe coordinates must be non-negative integers.');
      }
      return;
    case 'pixelData':
      if (value.region !== undefined && !validPixelRegion(value.region)) {
        phase7Issue(issues, record, 'region', 'Pixel data region is invalid.');
      }
      return;
    case 'detectPath':
      finiteXY();
      if (typeof value.pathNodeId !== 'string' || !value.pathNodeId.length) {
        phase7Issue(issues, record, 'pathNodeId', 'Path detection requires a path node id.');
      }
      return;
    case 'detectRegion':
      finiteXY();
      if (!validHitRegion(value.region)) {
        phase7Issue(issues, record, 'region', 'Detection region is invalid.');
      }
      return;
    case 'detectAnyRegion':
      finiteXY();
      if (!Array.isArray(value.regions) || value.regions.length === 0 || !value.regions.every((region) => validHitRegion(region))) {
        phase7Issue(issues, record, 'regions', 'Any-region detection requires one or more valid regions.');
      }
      return;
    case 'detectDistance':
      finiteXY();
      if (!validHitRegion(value.region, false)) {
        phase7Issue(issues, record, 'region', 'Distance detection requires rect, circle, ellipse or polygon geometry.');
      }
      return;
    default:
      phase7Issue(issues, record, 'type', 'Unsupported detection operation type.');
  }
}
