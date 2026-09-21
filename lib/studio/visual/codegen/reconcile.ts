import type {
  VisualCanvasConfig,
  VisualCreateImageOptions,
  VisualImageNodeProps,
  VisualImageSource,
  VisualProject,
  VisualTextNodeProps,
  VisualValue,
} from '../model';
import {
  IMAGE_SHAPE_TYPES,
  imagePropsRecord,
  visualImageProps,
} from '../image-contract';
import { createVisualId } from '../ids';
import { textPropsRecord } from '../text-contract';
import {
  operationRecord,
  pathPropsRecord,
  visualPathProps,
  type StudioDetectionOperation,
  type StudioPathCommand,
  type StudioPathDrawOptions,
  type StudioPixelOperation,
  type VisualPathNodeProps,
} from '../path-pixel-contract';
import { validateVisualProject } from '../compiler/validate';

export type VisualCodeSyncResult =
  | { ok: true; project: VisualProject; changed: boolean }
  | { ok: false; error: string };

type Jsonish =
  | null
  | boolean
  | number
  | string
  | Jsonish[]
  | { [key: string]: Jsonish };
type RecordValue = { [key: string]: Jsonish };
type IdentifierLiteral = {
  __identifier: string;
  member?: string;
};

const CANVAS_KEYS = new Set([
  'width','height','x','y','customBg','videoBg','colorBg','gradientBg','patternBg',
  'noiseBg','transparentBase','bgLayers','blendMode','opacity','blur','rotation',
  'borderRadius','borderPosition','zoom','stroke','shadow',
]);

class LiteralParser {
  private index = 0;

  constructor(
    private readonly source: string,
    private readonly allowIdentifiers = false,
  ) {}

  parse(): Jsonish {
    const value = this.parseValue();
    this.skipSpace();
    if (this.index < this.source.length) {
      throw new Error(
        'Unexpected token near “' +
          this.source.slice(this.index, this.index + 24) +
          '”.',
      );
    }
    return value;
  }

  private parseValue(): Jsonish {
    this.skipSpace();
    const ch = this.source[this.index];
    if (ch === '{') return this.parseObject();
    if (ch === '[') return this.parseArray();
    if (ch === '"' || ch === "'" || ch === '`') return this.parseString();
    if (ch === '-' || ch === '+' || /[0-9.]/.test(ch ?? '')) {
      return this.parseNumber();
    }

    const id = this.parseIdentifierName();
    if (id === 'true') return true;
    if (id === 'false') return false;
    if (id === 'null' || id === 'undefined') return null;

    if (id && this.allowIdentifiers) {
      this.skipSpace();
      let member: string | undefined;
      if (this.source[this.index] === '.') {
        this.index += 1;
        member = this.parseIdentifierName();
        if (!member) throw new Error('Expected member name after identifier.');
      }
      return {
        __identifier: id,
        ...(member ? { member } : {}),
      };
    }

    throw new Error(
      id
        ? 'Dynamic expression “' + id + '” cannot be reconciled into Visual mode.'
        : 'Expected a literal value.',
    );
  }

  private parseObject(): RecordValue {
    const out: RecordValue = {};
    this.expect('{');
    this.skipSpace();
    while (this.source[this.index] !== '}') {
      const ch = this.source[this.index];
      const key =
        ch === '"' || ch === "'" || ch === '`'
          ? this.parseString()
          : this.parseIdentifierName();
      if (!key) throw new Error('Expected an object property name.');
      this.skipSpace();
      this.expect(':');
      out[key] = this.parseValue();
      this.skipSpace();
      if (this.source[this.index] === ',') {
        this.index += 1;
        this.skipSpace();
        if (this.source[this.index] === '}') break;
        continue;
      }
      break;
    }
    this.expect('}');
    return out;
  }

  private parseArray(): Jsonish[] {
    const out: Jsonish[] = [];
    this.expect('[');
    this.skipSpace();
    while (this.source[this.index] !== ']') {
      out.push(this.parseValue());
      this.skipSpace();
      if (this.source[this.index] === ',') {
        this.index += 1;
        this.skipSpace();
        if (this.source[this.index] === ']') break;
        continue;
      }
      break;
    }
    this.expect(']');
    return out;
  }

  private parseString(): string {
    const quote = this.source[this.index++];
    let out = '';
    while (this.index < this.source.length) {
      const ch = this.source[this.index++];
      if (ch === quote) return out;
      if (
        quote === '`' &&
        ch === '$' &&
        this.source[this.index] === '{'
      ) {
        throw new Error(
          'Template expressions cannot be reconciled into Visual mode.',
        );
      }
      if (ch !== '\\') {
        out += ch;
        continue;
      }
      const next = this.source[this.index++];
      const escapes: Record<string, string> = {
        n: '\n',
        r: '\r',
        t: '\t',
        b: '\b',
        f: '\f',
        v: '\v',
        '0': '\0',
        '\\': '\\',
        '"': '"',
        "'": "'",
        '`': '`',
      };
      out += escapes[next] ?? next;
    }
    throw new Error('Unterminated string literal.');
  }

  private parseNumber(): number {
    const match = this.source
      .slice(this.index)
      .match(/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/i);
    if (!match) throw new Error('Invalid numeric literal.');
    this.index += match[0].length;
    const value = Number(match[0]);
    if (!Number.isFinite(value)) {
      throw new Error('Numeric literal must be finite.');
    }
    return value;
  }

  private parseIdentifierName(): string {
    this.skipSpace();
    const match = this.source
      .slice(this.index)
      .match(/^[A-Za-z_$][\w$-]*/);
    if (!match) return '';
    this.index += match[0].length;
    return match[0];
  }

  private skipSpace() {
    while (this.index < this.source.length) {
      const ch = this.source[this.index];
      const next = this.source[this.index + 1];
      if (/\s/.test(ch)) {
        this.index += 1;
        continue;
      }
      if (ch === '/' && next === '/') {
        this.index += 2;
        while (
          this.index < this.source.length &&
          this.source[this.index] !== '\n'
        ) {
          this.index += 1;
        }
        continue;
      }
      if (ch === '/' && next === '*') {
        this.index += 2;
        while (
          this.index < this.source.length - 1 &&
          !(
            this.source[this.index] === '*' &&
            this.source[this.index + 1] === '/'
          )
        ) {
          this.index += 1;
        }
        this.index += 2;
        continue;
      }
      break;
    }
  }

  private expect(ch: string) {
    this.skipSpace();
    if (this.source[this.index] !== ch) {
      throw new Error(
        'Expected “' +
          ch +
          '” near “' +
          this.source.slice(this.index, this.index + 20) +
          '”.',
      );
    }
    this.index += 1;
  }
}

function isRecord(value: Jsonish): value is RecordValue {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function isIdentifierLiteral(value: Jsonish): value is IdentifierLiteral {
  return Boolean(
    isRecord(value) &&
      typeof value.__identifier === 'string' &&
      Object.keys(value).every(
        (key) => key === '__identifier' || key === 'member',
      ),
  );
}

type MethodCall = {
  index: number;
  assignedIdentifier: string | null;
  args: string[];
};

function assignedIdentifierBefore(
  source: string,
  callIndex: number,
): string | null {
  const prefix = source.slice(Math.max(0, callIndex - 280), callIndex);
  const match = prefix.match(
    /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:await\s+)?[A-Za-z_$][\w$]*(?:\s*\.\s*[A-Za-z_$][\w$]*)*\s*$/,
  );
  return match?.[1] ?? null;
}

function extractMethodCalls(
  source: string,
  method: string,
): MethodCall[] {
  const calls: MethodCall[] = [];
  const methodPattern = method.split('.').join('\\s*\\.\\s*');
  const re = new RegExp('\\.\\s*' + methodPattern + '\\s*\\(', 'g');
  let match: RegExpExecArray | null;

  while ((match = re.exec(source))) {
    const open = source.indexOf('(', match.index);
    if (open < 0) continue;

    const args: string[] = [];
    let argStart = open + 1;
    let paren = 1;
    let brace = 0;
    let bracket = 0;
    let quote: string | null = null;
    let escaped = false;
    let lineComment = false;
    let blockComment = false;
    let close = -1;

    for (let index = open + 1; index < source.length; index += 1) {
      const char = source[index]!;
      const next = source[index + 1] ?? '';

      if (lineComment) {
        if (char === '\n') lineComment = false;
        continue;
      }
      if (blockComment) {
        if (char === '*' && next === '/') {
          blockComment = false;
          index += 1;
        }
        continue;
      }
      if (quote) {
        if (escaped) escaped = false;
        else if (char === '\\') escaped = true;
        else if (char === quote) quote = null;
        continue;
      }
      if (char === '/' && next === '/') {
        lineComment = true;
        index += 1;
        continue;
      }
      if (char === '/' && next === '*') {
        blockComment = true;
        index += 1;
        continue;
      }
      if (char === '"' || char === "'" || char === '`') {
        quote = char;
        continue;
      }

      if (char === '(') paren += 1;
      else if (char === ')') {
        paren -= 1;
        if (paren === 0) {
          const finalArg = source.slice(argStart, index).trim();
          if (finalArg) args.push(finalArg);
          close = index;
          break;
        }
      } else if (char === '{') brace += 1;
      else if (char === '}') brace -= 1;
      else if (char === '[') bracket += 1;
      else if (char === ']') bracket -= 1;
      else if (
        char === ',' &&
        paren === 1 &&
        brace === 0 &&
        bracket === 0
      ) {
        args.push(source.slice(argStart, index).trim());
        argStart = index + 1;
      }
    }

    if (close < 0) {
      throw new Error('Unterminated ' + method + '() call.');
    }

    calls.push({
      index: match.index,
      assignedIdentifier: assignedIdentifierBefore(source, match.index),
      args,
    });
    re.lastIndex = close + 1;
  }

  return calls;
}

function parseCanvasOptions(source: string): {
  options: RecordValue;
  identifier: string | null;
} {
  const call = extractMethodCalls(source, 'createCanvas')[0];
  if (!call?.args[0]) {
    throw new Error(
      'Visual sync needs a painter.createCanvas({ ... }) call.',
    );
  }
  const parsed = new LiteralParser(call.args[0]).parse();
  if (!isRecord(parsed)) {
    throw new Error('createCanvas options must be an object literal.');
  }
  for (const key of Object.keys(parsed)) {
    if (!CANVAS_KEYS.has(key)) {
      throw new Error(
        'createCanvas option “' +
          key +
          '” is not owned by the current Visual canvas contract.',
      );
    }
  }
  return { options: parsed, identifier: call.assignedIdentifier };
}

function serializeCanvasConfig(value: RecordValue): VisualCanvasConfig {
  const {
    width: _width,
    height: _height,
    ...canvas
  } = value;
  return canvas as unknown as VisualCanvasConfig;
}

function orderedRenderableNodes(project: VisualProject) {
  const out = [] as Array<VisualProject['document']['nodes'][string]>;
  const visit = (id: string) => {
    const node = project.document.nodes[id];
    if (!node) return;
    if (node.kind === 'group' || node.kind === 'surface') {
      for (const childId of node.childIds ?? []) visit(childId);
      return;
    }
    if (
      node.kind === 'image' ||
      node.kind === 'shape' ||
      node.kind === 'text' ||
      node.kind === 'path' ||
      node.kind === 'freehand'
    ) {
      out.push(node);
    }
  };
  for (const rootId of project.document.rootNodeIds) visit(rootId);
  return out;
}

function removeVisualNode(project: VisualProject, id: string) {
  const node = project.document.nodes[id];
  if (!node) return;
  if (node.parentId) {
    const parent = project.document.nodes[node.parentId];
    if (parent) {
      parent.childIds = (parent.childIds ?? []).filter(
        (childId) => childId !== id,
      );
    }
  } else {
    project.document.rootNodeIds =
      project.document.rootNodeIds.filter((rootId) => rootId !== id);
  }
  delete project.document.nodes[id];
}

function imageSourceFromParsed(
  value: Jsonish,
  identifiers: ReadonlyMap<string, string>,
  canvasIdentifier: string | null,
): VisualImageSource {
  if (typeof value === 'string') return value;
  if (!isIdentifierLiteral(value)) {
    throw new Error(
      'createImage source must be a string/shape or an earlier generated buffer identifier.',
    );
  }

  if (
    canvasIdentifier &&
    value.__identifier === canvasIdentifier &&
    value.member === 'buffer'
  ) {
    return { $generated: 'document_canvas' };
  }

  const nodeId = identifiers.get(value.__identifier);
  if (!nodeId || value.member) {
    throw new Error(
      'Generated image source “' +
        value.__identifier +
        (value.member ? '.' + value.member : '') +
        '” is not an earlier canonical output.',
    );
  }
  return { $generated: nodeId };
}

function asOptionalNumber(value: Jsonish | undefined): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

function assertCanonicalBase(
  raw: string | undefined,
  identifiers: ReadonlyMap<string, string>,
  canvasIdentifier: string | null,
) {
  if (!raw) throw new Error('Composition call requires a base canvas/output argument.');
  const parsed = new LiteralParser(raw, true).parse();
  if (!isIdentifierLiteral(parsed)) {
    throw new Error('Composition base must be an earlier canonical output identifier.');
  }
  if (
    canvasIdentifier &&
    parsed.__identifier === canvasIdentifier &&
    parsed.member === 'buffer'
  ) {
    return;
  }
  if (parsed.member) {
    throw new Error('Generated composition outputs must be referenced directly.');
  }
  if (!identifiers.has(parsed.__identifier)) {
    throw new Error(
      'Composition base “' + parsed.__identifier + '” is not an earlier canonical output.',
    );
  }
}

function reconcileImageCall(
  project: VisualProject,
  call: MethodCall,
  index: number,
  matched: VisualProject['document']['nodes'][string] | undefined,
  identifierToNodeId: Map<string, string>,
  canvasIdentifier: string | null,
) {
  if (!call.args[0]) throw new Error('createImage() requires image properties.');
  assertCanonicalBase(call.args[1], identifierToNodeId, canvasIdentifier);

  const parsed = new LiteralParser(call.args[0], true).parse();
  if (!isRecord(parsed)) {
    throw new Error('createImage() properties must be an object literal.');
  }
  if (parsed.source === undefined) {
    throw new Error('createImage() properties require source.');
  }

  const sourceValue = imageSourceFromParsed(
    parsed.source,
    identifierToNodeId,
    canvasIdentifier,
  );
  const shape =
    typeof sourceValue === 'string' &&
    IMAGE_SHAPE_TYPES.includes(sourceValue as never);
  const kind = shape ? 'shape' : 'image';

  const id =
    matched && matched.kind === kind
      ? matched.id
      : createVisualId(kind);
  const oldNode = project.document.nodes[id];

  const {
    source: _source,
    x,
    y,
    width,
    height,
    rotation,
    opacity,
    ...rest
  } = parsed;

  const props: VisualImageNodeProps = {
    ...(rest as unknown as Omit<
      VisualImageNodeProps,
      'source' | 'createOptions'
    >),
    source: sourceValue,
  };

  if (call.args[2]) {
    const options = new LiteralParser(call.args[2]).parse();
    if (!isRecord(options)) {
      throw new Error('createImage() options must be an object literal.');
    }
    props.createOptions =
      options as unknown as VisualCreateImageOptions;
  }

  const node = {
    id,
    kind,
    name:
      oldNode?.name ??
      (shape
        ? 'Shape ' + String(index + 1)
        : 'Image ' + String(index + 1)),
    parentId: oldNode?.parentId ?? null,
    childIds: oldNode?.childIds,
    transform: {
      ...(oldNode?.transform ?? {}),
      x: asOptionalNumber(x) ?? 0,
      y: asOptionalNumber(y) ?? 0,
      ...(typeof width === 'number' ? { width } : {}),
      ...(typeof height === 'number' ? { height } : {}),
      rotation: asOptionalNumber(rotation) ?? 0,
      opacity: asOptionalNumber(opacity) ?? 1,
      visible: oldNode?.transform?.visible ?? true,
      locked: oldNode?.transform?.locked ?? false,
      zIndex: oldNode?.transform?.zIndex ?? index,
    },
    props: imagePropsRecord(props),
  } satisfies VisualProject['document']['nodes'][string];

  return node;
}

function reconcileTextCall(
  project: VisualProject,
  call: MethodCall,
  index: number,
  matched: VisualProject['document']['nodes'][string] | undefined,
  identifiers: ReadonlyMap<string, string>,
  canvasIdentifier: string | null,
) {
  if (!call.args[0]) throw new Error('createText() requires text properties.');
  assertCanonicalBase(call.args[1], identifiers, canvasIdentifier);
  const parsed = new LiteralParser(call.args[0]).parse();
  if (!isRecord(parsed)) {
    throw new Error('createText() properties must be an object literal.');
  }
  if (typeof parsed.text !== 'string' || !parsed.text.length) {
    throw new Error('createText() properties require non-empty text.');
  }
  if (typeof parsed.x !== 'number' || typeof parsed.y !== 'number') {
    throw new Error('createText() x and y must be numeric literals.');
  }

  const {
    x,
    y,
    layout,
    placement,
    fill,
    maxWidth,
    maxHeight,
    rotation,
    opacity,
    ...rest
  } = parsed;

  const layoutRecord = isRecord(layout) ? layout : {};
  const placementRecord = isRecord(placement) ? placement : {};
  const fillRecord = isRecord(fill) ? fill : {};

  const props: VisualTextNodeProps = {
    ...(rest as unknown as VisualTextNodeProps),
    ...(Object.keys(layoutRecord).length
      ? { layout: layoutRecord as unknown as VisualTextNodeProps['layout'] }
      : {}),
    ...(Object.keys(placementRecord).length
      ? { placement: placementRecord as unknown as VisualTextNodeProps['placement'] }
      : {}),
    ...(Object.keys(fillRecord).length
      ? { fill: fillRecord as unknown as VisualTextNodeProps['fill'] }
      : {}),
    ...(typeof maxWidth === 'number' ? { maxWidth } : {}),
    ...(typeof maxHeight === 'number' ? { maxHeight } : {}),
    ...(typeof rotation === 'number' ? { rotation } : {}),
    ...(typeof opacity === 'number' ? { opacity } : {}),
  };

  const width =
    typeof layoutRecord.maxWidth === 'number'
      ? layoutRecord.maxWidth
      : typeof maxWidth === 'number'
        ? maxWidth
        : undefined;
  const height =
    typeof layoutRecord.maxHeight === 'number'
      ? layoutRecord.maxHeight
      : typeof maxHeight === 'number'
        ? maxHeight
        : undefined;
  const resolvedRotation =
    typeof placementRecord.rotation === 'number'
      ? placementRecord.rotation
      : typeof rotation === 'number'
        ? rotation
        : 0;
  const resolvedOpacity =
    typeof fillRecord.opacity === 'number'
      ? fillRecord.opacity
      : typeof opacity === 'number'
        ? opacity
        : 1;

  const id =
    matched?.kind === 'text'
      ? matched.id
      : createVisualId('text');
  const oldNode = project.document.nodes[id];

  return {
    id,
    kind: 'text',
    name: oldNode?.name ?? 'Text ' + String(index + 1),
    parentId: oldNode?.parentId ?? null,
    childIds: oldNode?.childIds,
    transform: {
      ...(oldNode?.transform ?? {}),
      x,
      y,
      ...(width !== undefined ? { width } : {}),
      ...(height !== undefined ? { height } : {}),
      rotation: resolvedRotation,
      opacity: resolvedOpacity,
      visible: oldNode?.transform?.visible ?? true,
      locked: oldNode?.transform?.locked ?? false,
      zIndex: oldNode?.transform?.zIndex ?? index,
    },
    props: textPropsRecord(props),
  } satisfies VisualProject['document']['nodes'][string];
}


function pathCommandBounds(commands: StudioPathCommand[]) {
  const xs: number[] = [];
  const ys: number[] = [];
  const push = (key: string, value: unknown) => {
    if (typeof value !== 'number' || !Number.isFinite(value)) return;
    if (/^(?:x|x1|x2|cpx|cp1x|cp2x)$/.test(key)) xs.push(value);
    if (/^(?:y|y1|y2|cpy|cp1y|cp2y)$/.test(key)) ys.push(value);
  };
  for (const command of commands) {
    Object.entries(command).forEach(([key, value]) => {
      if (key === 'points' && Array.isArray(value)) {
        value.forEach((point) => {
          if (typeof point?.x === 'number') xs.push(point.x);
          if (typeof point?.y === 'number') ys.push(point.y);
        });
      } else push(key, value);
    });
  }
  const minX = xs.length ? Math.min(...xs) : 0;
  const minY = ys.length ? Math.min(...ys) : 0;
  const maxX = xs.length ? Math.max(...xs) : minX + 1;
  const maxY = ys.length ? Math.max(...ys) : minY + 1;
  return {
    minX,
    minY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY),
  };
}

function pathResourceDefinitions(source: string) {
  const resources = new Map<string, StudioPathCommand[]>();
  for (const call of extractMethodCalls(source, 'path2d.create')) {
    if (!call.assignedIdentifier || !call.args[0]) continue;
    const parsed = new LiteralParser(call.args[0]).parse();
    if (!Array.isArray(parsed)) {
      throw new Error('path2d.create() commands must be a literal array.');
    }
    resources.set(
      call.assignedIdentifier,
      parsed as unknown as StudioPathCommand[],
    );
  }
  return resources;
}

function reconcilePathDrawCall(
  project: VisualProject,
  call: MethodCall,
  index: number,
  matched: VisualProject['document']['nodes'][string] | undefined,
  identifiers: ReadonlyMap<string, string>,
  canvasIdentifier: string | null,
  resources: ReadonlyMap<string, StudioPathCommand[]>,
) {
  assertCanonicalBase(call.args[0], identifiers, canvasIdentifier);
  if (!call.args[1]) throw new Error('path2d.draw() requires a path resource.');
  const resource = new LiteralParser(call.args[1], true).parse();
  if (!isIdentifierLiteral(resource) || resource.member) {
    throw new Error('path2d.draw() path must reference path2d.create().');
  }
  const commands = resources.get(resource.__identifier);
  if (!commands) {
    throw new Error('path2d.draw() references an unknown path resource.');
  }
  const optionsValue = call.args[2]
    ? new LiteralParser(call.args[2]).parse()
    : {};
  if (!isRecord(optionsValue)) {
    throw new Error('path2d.draw() options must be a literal object.');
  }
  const transform = isRecord(optionsValue.transform)
    ? optionsValue.transform
    : {};
  const { transform: _transform, opacity, ...draw } = optionsValue;
  const existing =
    matched && (matched.kind === 'path' || matched.kind === 'freehand')
      ? matched
      : undefined;
  const existingProps = existing ? visualPathProps(existing) : undefined;
  const bounds = pathCommandBounds(commands);
  const viewport = existingProps?.viewport ?? {
    width: Math.max(1, bounds.width),
    height: Math.max(1, bounds.height),
  };
  const scaleX =
    typeof transform.scaleX === 'number' ? transform.scaleX : 1;
  const scaleY =
    typeof transform.scaleY === 'number' ? transform.scaleY : 1;
  const id = existing?.id ?? createVisualId('path');
  return {
    id,
    kind: existing?.kind ?? 'path',
    name: existing?.name ?? 'Path ' + String(index + 1),
    parentId: existing?.parentId ?? null,
    childIds: existing?.childIds,
    transform: {
      ...(existing?.transform ?? {}),
      x: typeof transform.translateX === 'number' ? transform.translateX : 0,
      y: typeof transform.translateY === 'number' ? transform.translateY : 0,
      width: viewport.width * scaleX,
      height: viewport.height * scaleY,
      rotation: typeof transform.rotate === 'number' ? transform.rotate : 0,
      opacity: typeof opacity === 'number' ? opacity : 1,
      visible: existing?.transform?.visible ?? true,
      locked: existing?.transform?.locked ?? false,
      zIndex: existing?.transform?.zIndex ?? index,
    },
    props: pathPropsRecord({
      tool: existingProps?.tool === 'freehand' ? 'freehand' : existingProps?.tool ?? 'path',
      viewport,
      commands,
      draw: draw as unknown as StudioPathDrawOptions,
    }),
  } satisfies VisualProject['document']['nodes'][string];
}

function reconcileCustomPathCall(
  project: VisualProject,
  call: MethodCall,
  index: number,
  matched: VisualProject['document']['nodes'][string] | undefined,
  identifiers: ReadonlyMap<string, string>,
  canvasIdentifier: string | null,
) {
  if (!call.args[0]) throw new Error('path2d.custom() requires connector options.');
  assertCanonicalBase(call.args[1], identifiers, canvasIdentifier);
  const parsed = new LiteralParser(call.args[0]).parse();
  if (!isRecord(parsed) && !Array.isArray(parsed)) {
    throw new Error('path2d.custom() options must be a literal object or array.');
  }
  const first = Array.isArray(parsed) ? parsed[0] : parsed;
  if (!isRecord(first) || !isRecord(first.startCoordinates) || !isRecord(first.endCoordinates)) {
    throw new Error('path2d.custom() requires startCoordinates and endCoordinates.');
  }
  const sx = Number(first.startCoordinates.x ?? 0);
  const sy = Number(first.startCoordinates.y ?? 0);
  const ex = Number(first.endCoordinates.x ?? sx + 1);
  const ey = Number(first.endCoordinates.y ?? sy + 1);
  const existing =
    matched && matched.kind === 'path' ? matched : undefined;
  const id = existing?.id ?? createVisualId('path');
  return {
    id,
    kind: 'path',
    name: existing?.name ?? 'Connector ' + String(index + 1),
    parentId: existing?.parentId ?? null,
    childIds: existing?.childIds,
    transform: {
      ...(existing?.transform ?? {}),
      x: 0,
      y: 0,
      width: Math.max(1, Math.max(sx, ex)),
      height: Math.max(1, Math.max(sy, ey)),
      rotation: 0,
      opacity: 1,
      visible: existing?.transform?.visible ?? true,
      locked: existing?.transform?.locked ?? false,
      zIndex: existing?.transform?.zIndex ?? index,
    },
    props: pathPropsRecord({
      tool: 'connector',
      viewport: {
        width: Math.max(1, Math.max(sx, ex)),
        height: Math.max(1, Math.max(sy, ey)),
      },
      connector: parsed as unknown as VisualPathNodeProps['connector'],
      draw: existing ? visualPathProps(existing).draw : undefined,
    }),
  } satisfies VisualProject['document']['nodes'][string];
}

function parseNumberArgument(raw: string | undefined, label: string) {
  if (!raw) throw new Error(label + ' is required.');
  const value = new LiteralParser(raw).parse();
  if (typeof value !== 'number') throw new Error(label + ' must be numeric.');
  return value;
}

function reconcilePhase7Operations(
  project: VisualProject,
  source: string,
  resources: ReadonlyMap<string, StudioPathCommand[]>,
) {
  const operations: VisualProject['operations'] = [];
  const calls = [
    ...extractMethodCalls(source, 'pixels.manipulate').map((call) => ({ ...call, method: 'pixels.manipulate' as const })),
    ...extractMethodCalls(source, 'pixels.setColor').map((call) => ({ ...call, method: 'pixels.setColor' as const })),
    ...extractMethodCalls(source, 'pixels.getColor').map((call) => ({ ...call, method: 'pixels.getColor' as const })),
    ...extractMethodCalls(source, 'pixels.getData').map((call) => ({ ...call, method: 'pixels.getData' as const })),
    ...extractMethodCalls(source, 'detect.path').map((call) => ({ ...call, method: 'detect.path' as const })),
    ...extractMethodCalls(source, 'detect.region').map((call) => ({ ...call, method: 'detect.region' as const })),
    ...extractMethodCalls(source, 'detect.anyRegion').map((call) => ({ ...call, method: 'detect.anyRegion' as const })),
    ...extractMethodCalls(source, 'detect.distance').map((call) => ({ ...call, method: 'detect.distance' as const })),
  ].sort((a, b) => a.index - b.index);

  for (const call of calls) {
    const id = createVisualId('operation');
    const name = call.assignedIdentifier ?? call.method;
    let value: StudioPixelOperation | StudioDetectionOperation;
    if (call.method === 'pixels.manipulate') {
      const parsed = call.args[1] ? new LiteralParser(call.args[1]).parse() : null;
      if (!isRecord(parsed) || typeof parsed.filter !== 'string') {
        throw new Error('Visual pixels.manipulate() requires a literal built-in filter.');
      }
      value = {
        type: 'manipulate',
        filter: parsed.filter as Extract<StudioPixelOperation, { type: 'manipulate' }>['filter'],
        ...(typeof parsed.intensity === 'number' ? { intensity: parsed.intensity } : {}),
        ...(isRecord(parsed.region)
          ? { region: parsed.region as unknown as { x: number; y: number; width: number; height: number } }
          : {}),
      };
      operations.push(operationRecord('pixel-operation', value, { id, name }));
    } else if (call.method === 'pixels.setColor') {
      const color = call.args[3] ? new LiteralParser(call.args[3]).parse() : null;
      if (!isRecord(color)) throw new Error('pixels.setColor() color must be a literal object.');
      value = {
        type: 'setColor',
        x: parseNumberArgument(call.args[1], 'pixels.setColor x'),
        y: parseNumberArgument(call.args[2], 'pixels.setColor y'),
        color: color as unknown as Extract<StudioPixelOperation, { type: 'setColor' }>['color'],
      };
      operations.push(operationRecord('pixel-operation', value, { id, name }));
    } else if (call.method === 'pixels.getColor') {
      value = {
        type: 'pixelColor',
        x: parseNumberArgument(call.args[1], 'pixels.getColor x'),
        y: parseNumberArgument(call.args[2], 'pixels.getColor y'),
        resultName: call.assignedIdentifier ?? 'pixelColor',
      };
      operations.push(operationRecord('detection-operation', value, { id, name }));
    } else if (call.method === 'pixels.getData') {
      const parsed = call.args[1] ? new LiteralParser(call.args[1]).parse() : null;
      value = {
        type: 'pixelData',
        ...(isRecord(parsed)
          ? { region: parsed as unknown as { x: number; y: number; width: number; height: number } }
          : {}),
        resultName: call.assignedIdentifier ?? 'pixelData',
      };
      operations.push(operationRecord('detection-operation', value, { id, name }));
    } else if (call.method === 'detect.path') {
      const resource = call.args[0] ? new LiteralParser(call.args[0], true).parse() : null;
      if (!isIdentifierLiteral(resource) || resource.member) {
        throw new Error('detect.path() must reference path2d.create().');
      }
      const commands = resources.get(resource.__identifier);
      if (!commands) throw new Error('detect.path() references an unknown path resource.');
      const pathNode = Object.values(project.document.nodes).find((node) => {
        if (node.kind !== 'path' && node.kind !== 'freehand') return false;
        return JSON.stringify(visualPathProps(node).commands ?? []) === JSON.stringify(commands);
      });
      if (!pathNode) throw new Error('detect.path() must reference a rendered Visual path.');
      const options = call.args[3] ? new LiteralParser(call.args[3]).parse() : {};
      value = {
        type: 'detectPath',
        pathNodeId: pathNode.id,
        x: parseNumberArgument(call.args[1], 'detect.path x'),
        y: parseNumberArgument(call.args[2], 'detect.path y'),
        ...(isRecord(options)
          ? {
              includeStroke: typeof options.includeStroke === 'boolean' ? options.includeStroke : undefined,
              strokeWidth: typeof options.strokeWidth === 'number' ? options.strokeWidth : undefined,
              tolerance: typeof options.tolerance === 'number' ? options.tolerance : undefined,
              fillRule: options.fillRule === 'evenodd' ? 'evenodd' : options.fillRule === 'nonzero' ? 'nonzero' : undefined,
            }
          : {}),
        resultName: call.assignedIdentifier ?? 'pathHit',
      };
      operations.push(operationRecord('detection-operation', value, { id, name }));
    } else {
      const first = call.args[0] ? new LiteralParser(call.args[0]).parse() : null;
      if (!isRecord(first) && !Array.isArray(first)) {
        throw new Error(call.method + ' region input must be a literal object/array.');
      }
      const x = parseNumberArgument(call.args[1], call.method + ' x');
      const y = parseNumberArgument(call.args[2], call.method + ' y');
      if (call.method === 'detect.distance') {
        value = {
          type: 'detectDistance',
          region: first as unknown as Extract<StudioDetectionOperation, { type: 'detectDistance' }>['region'],
          x,
          y,
          resultName: call.assignedIdentifier ?? 'distance',
        };
      } else {
        const options = call.args[3] ? new LiteralParser(call.args[3]).parse() : {};
        const shared = isRecord(options)
          ? {
              includeStroke: typeof options.includeStroke === 'boolean' ? options.includeStroke : undefined,
              strokeWidth: typeof options.strokeWidth === 'number' ? options.strokeWidth : undefined,
              tolerance: typeof options.tolerance === 'number' ? options.tolerance : undefined,
              fillRule: options.fillRule === 'evenodd' ? 'evenodd' as const : options.fillRule === 'nonzero' ? 'nonzero' as const : undefined,
            }
          : {};
        value = call.method === 'detect.anyRegion'
          ? {
              type: 'detectAnyRegion',
              regions: first as unknown as Extract<StudioDetectionOperation, { type: 'detectAnyRegion' }>['regions'],
              x,
              y,
              ...shared,
              resultName: call.assignedIdentifier ?? 'anyRegionHit',
            }
          : {
              type: 'detectRegion',
              region: first as unknown as Extract<StudioDetectionOperation, { type: 'detectRegion' }>['region'],
              x,
              y,
              ...shared,
              resultName: call.assignedIdentifier ?? 'regionHit',
            };
      }
      operations.push(operationRecord('detection-operation', value, { id, name }));
    }
  }
  project.operations = operations;
}

function reconcileRenderableCalls(
  project: VisualProject,
  source: string,
  canvasIdentifier: string | null,
) {
  const resources = pathResourceDefinitions(source);
  const calls = [
    ...extractMethodCalls(source, 'createImage').map((call) => ({
      ...call,
      method: 'createImage' as const,
    })),
    ...extractMethodCalls(source, 'createText').map((call) => ({
      ...call,
      method: 'createText' as const,
    })),
    ...extractMethodCalls(source, 'path2d.draw').map((call) => ({
      ...call,
      method: 'path2d.draw' as const,
    })),
    ...extractMethodCalls(source, 'path2d.custom').map((call) => ({
      ...call,
      method: 'path2d.custom' as const,
    })),
  ].sort((a, b) => a.index - b.index);

  const existing = orderedRenderableNodes(project);
  const identifierToNodeId = new Map<string, string>();
  const touched = new Set<string>();

  calls.forEach((call, index) => {
    const matched = existing[index];
    const node =
      call.method === 'createImage'
        ? reconcileImageCall(
            project,
            call,
            index,
            matched,
            identifierToNodeId,
            canvasIdentifier,
          )
        : call.method === 'createText'
          ? reconcileTextCall(
              project,
              call,
              index,
              matched,
              identifierToNodeId,
              canvasIdentifier,
            )
          : call.method === 'path2d.draw'
            ? reconcilePathDrawCall(
                project,
                call,
                index,
                matched,
                identifierToNodeId,
                canvasIdentifier,
                resources,
              )
            : reconcileCustomPathCall(
                project,
                call,
                index,
                matched,
                identifierToNodeId,
                canvasIdentifier,
              );

    const oldNode = project.document.nodes[node.id];
    if (!oldNode) project.document.rootNodeIds.push(node.id);
    project.document.nodes[node.id] = node;
    touched.add(node.id);
    if (call.assignedIdentifier) {
      identifierToNodeId.set(call.assignedIdentifier, node.id);
    }
  });

  for (const node of existing) {
    if (!touched.has(node.id)) removeVisualNode(project, node.id);
  }

  project.editor = {
    ...project.editor,
    selectedNodeIds: (project.editor?.selectedNodeIds ?? []).filter(
      (id) => Boolean(project.document.nodes[id]),
    ),
  };
}

export function reconcileVisualProjectFromCode(
  project: VisualProject,
  source: string,
): VisualCodeSyncResult {
  if (!/\bApexPainter\b/.test(source)) {
    return {
      ok: false,
      error:
        'Code must use ApexPainter so Visual Studio can reconcile it.',
    };
  }

  try {
    const canvasCall = parseCanvasOptions(source);
    const width = canvasCall.options.width;
    const height = canvasCall.options.height;
    if (typeof width !== 'number' || typeof height !== 'number') {
      return {
        ok: false,
        error:
          'createCanvas width and height must be numeric literals for live Visual sync.',
      };
    }
    if (
      width < 1 ||
      height < 1 ||
      width > 16384 ||
      height > 16384
    ) {
      return {
        ok: false,
        error:
          'Canvas width and height must be between 1 and 16384.',
      };
    }

    const next = structuredClone(project);
    next.document.width = Math.round(width);
    next.document.height = Math.round(height);
    const canvas = serializeCanvasConfig(canvasCall.options);
    next.document.canvas =
      Object.keys(canvas).length ? canvas : undefined;

    reconcileRenderableCalls(next, source, canvasCall.identifier);
    reconcilePhase7Operations(next, source, pathResourceDefinitions(source));
    next.updatedAt = new Date().toISOString();

    const validation = validateVisualProject(next);
    if (!validation.ok) {
      const problem = validation.issues.find(
        (item) => item.severity === 'error',
      );
      return {
        ok: false,
        error:
          problem?.message ??
          'The code produced an invalid Visual Project.',
      };
    }

    const semantic = (value: VisualProject) =>
      JSON.stringify({
        width: value.document.width,
        height: value.document.height,
        canvas: value.document.canvas ?? {},
        roots: value.document.rootNodeIds,
        nodes: value.document.nodes,
        operations: value.operations,
      });

    return {
      ok: true,
      project: next,
      changed: semantic(next) !== semantic(project),
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : 'Visual code could not be reconciled.',
    };
  }
}

export function safeVisualDownloadStem(value: string): string {
  return (
    value
      .trim()
      .replace(/\.[a-z0-9]+$/i, '')
      .replace(/[^a-z0-9-_]+/gi, '-')
      .replace(/^-+|-+$/g, '') || 'apexify-visual'
  );
}
