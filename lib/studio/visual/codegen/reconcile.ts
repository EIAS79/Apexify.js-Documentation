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
import { textPropsRecord, visualTextProps } from '../text-contract';
import {
  STANDALONE_CHART_FAMILIES,
  chartPropsRecord,
  type VisualChartFamily,
  type VisualStandaloneChartFamily,
} from '../chart-contract';
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
import {
  generatePhase9NativeSource,
  phase9ProjectFromSourceMarker,
} from '../phase9-codegen';
import {
  generatePhase10DisplayPreviewSource,
  generatePhase10NativeSource,
  phase10ProjectFromSourceMarker,
} from '../phase10-codegen';
import {
  generatePhase11NativeSource,
  phase11ProjectFromSourceMarker,
} from '../phase11-codegen';
import {
  phase11Timeline,
  setPhase11Timeline,
  type Phase11Frame,
  type Phase11Timeline,
} from '../gif-animation-contract';
import {
  generatePhase12NativeSource,
  phase12ProjectFromSourceMarker,
} from '../phase12-codegen';
import {
  generatePhase13NativeSource,
  phase13ProjectFromSourceMarker,
} from '../phase13-codegen';
import {
  generatePhase14NativeSource,
  phase14ProjectFromSourceMarker,
} from '../phase14-codegen';

export type VisualCodeSyncResult =
  | { ok: true; project: VisualProject; changed: boolean }
  | { ok: false; error: string };

export type VisualInheritedCanvasDimensionResolver = (
  source: string,
) => { width: number; height: number } | null;

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
      node.kind === 'chart' ||
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
    rotation: _oldRotation,
    opacity: _oldOpacity,
    ...retainedTransform
  } = oldNode?.transform ?? {};

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
      ...retainedTransform,
      x: asOptionalNumber(x) ?? 0,
      y: asOptionalNumber(y) ?? 0,
      ...(typeof width === 'number' ? { width } : {}),
      ...(typeof height === 'number' ? { height } : {}),
      ...(typeof rotation === 'number' ? { rotation } : {}),
      ...(typeof opacity === 'number' ? { opacity } : {}),
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

  const id =
    matched?.kind === 'text'
      ? matched.id
      : createVisualId('text');
  const oldNode = project.document.nodes[id];
  const oldProps = oldNode?.kind === 'text' ? visualTextProps(oldNode) : undefined;
  const owns = (value: object | undefined, key: string) =>
    Boolean(value && Object.prototype.hasOwnProperty.call(value, key));

  // Canonical text code folds transform dimensions/rotation/opacity into
  // nested createText() options. During reverse sync, preserve where each
  // value originally lived so a generated-code round trip is byte-stable.
  const layoutForProps = { ...layoutRecord };
  const placementForProps = { ...placementRecord };
  const fillForProps = { ...fillRecord };

  if (
    oldNode?.transform?.width !== undefined &&
    !owns(oldProps?.layout, 'maxWidth')
  ) {
    delete layoutForProps.maxWidth;
  }
  if (
    oldNode?.transform?.height !== undefined &&
    !owns(oldProps?.layout, 'maxHeight')
  ) {
    delete layoutForProps.maxHeight;
  }
  if (
    oldNode?.transform?.rotation !== undefined &&
    !owns(oldProps?.placement, 'rotation')
  ) {
    delete placementForProps.rotation;
  }
  if (
    oldNode?.transform?.opacity !== undefined &&
    !owns(oldProps?.fill, 'opacity')
  ) {
    delete fillForProps.opacity;
  }

  const props: VisualTextNodeProps = {
    ...(rest as unknown as VisualTextNodeProps),
    ...(Object.keys(layoutForProps).length
      ? { layout: layoutForProps as unknown as VisualTextNodeProps['layout'] }
      : {}),
    ...(Object.keys(placementForProps).length
      ? { placement: placementForProps as unknown as VisualTextNodeProps['placement'] }
      : {}),
    ...(Object.keys(fillForProps).length
      ? { fill: fillForProps as unknown as VisualTextNodeProps['fill'] }
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

  const {
    rotation: _oldRotation,
    opacity: _oldOpacity,
    ...retainedTextTransform
  } = oldNode?.transform ?? {};

  return {
    id,
    kind: 'text',
    name: oldNode?.name ?? 'Text ' + String(index + 1),
    parentId: oldNode?.parentId ?? null,
    childIds: oldNode?.childIds,
    transform: {
      ...retainedTextTransform,
      x,
      y,
      ...(width !== undefined ? { width } : {}),
      ...(height !== undefined ? { height } : {}),
      ...(
        typeof placementRecord.rotation === 'number' || typeof rotation === 'number'
          ? { rotation: resolvedRotation }
          : {}
      ),
      ...(
        typeof fillRecord.opacity === 'number' || typeof opacity === 'number'
          ? { opacity: resolvedOpacity }
          : {}
      ),
      visible: oldNode?.transform?.visible ?? true,
      locked: oldNode?.transform?.locked ?? false,
      zIndex: oldNode?.transform?.zIndex ?? index,
    },
    props: textPropsRecord(props),
  } satisfies VisualProject['document']['nodes'][string];
}



function parsedImageSourceIdentifier(call: MethodCall): string | null {
  if (!call.args[0]) return null;
  const parsed = new LiteralParser(call.args[0], true).parse();
  if (!isRecord(parsed) || parsed.source === undefined) return null;
  const source = parsed.source;
  return isIdentifierLiteral(source) && !source.member
    ? source.__identifier
    : null;
}

type ChartMethod =
  | 'createChart'
  | 'createComparisonChart'
  | 'createComboChart';

function reconcileChartCall(
  project: VisualProject,
  chartCall: MethodCall,
  chartMethod: ChartMethod,
  composeCall: MethodCall,
  index: number,
  matched: VisualProject['document']['nodes'][string] | undefined,
  identifiers: ReadonlyMap<string, string>,
  canvasIdentifier: string | null,
) {
  if (!chartCall.assignedIdentifier) {
    throw new Error(chartMethod + '() must assign its Buffer for Visual chart sync.');
  }
  if (!composeCall.args[0]) {
    throw new Error('Chart composition requires createImage() properties.');
  }
  assertCanonicalBase(composeCall.args[1], identifiers, canvasIdentifier);

  const placement = new LiteralParser(composeCall.args[0], true).parse();
  if (!isRecord(placement)) {
    throw new Error('Chart createImage() composition properties must be an object literal.');
  }
  const source = placement.source;
  if (
    !isIdentifierLiteral(source) ||
    source.member ||
    source.__identifier !== chartCall.assignedIdentifier
  ) {
    throw new Error('Chart composition must use the Buffer returned by its chart call.');
  }

  let family: VisualChartFamily;
  let data: VisualValue[] | undefined;
  let options: Record<string, VisualValue>;

  if (chartMethod === 'createChart') {
    if (!chartCall.args[0] || !chartCall.args[1]) {
      throw new Error('createChart() requires chart family and data.');
    }
    const familyValue = new LiteralParser(chartCall.args[0]).parse();
    const dataValue = new LiteralParser(chartCall.args[1]).parse();
    const optionsValue = chartCall.args[2]
      ? new LiteralParser(chartCall.args[2]).parse()
      : {};
    if (typeof familyValue !== 'string') {
      throw new Error('createChart() family must be a string literal.');
    }
    if (!Array.isArray(dataValue)) {
      throw new Error('createChart() data must be a literal array.');
    }
    if (!isRecord(optionsValue)) {
      throw new Error('createChart() options must be a literal object.');
    }
    if (!STANDALONE_CHART_FAMILIES.includes(familyValue as VisualStandaloneChartFamily)) {
      throw new Error('Unsupported Visual createChart() family “' + familyValue + '”.');
    }
    family =
      familyValue === 'pie' && optionsValue.type === 'donut'
        ? 'donut'
        : familyValue as VisualStandaloneChartFamily;
    data = dataValue as unknown as VisualValue[];
    options = optionsValue as unknown as Record<string, VisualValue>;
  } else {
    if (!chartCall.args[0]) {
      throw new Error(chartMethod + '() requires an options object.');
    }
    const optionsValue = new LiteralParser(chartCall.args[0]).parse();
    if (!isRecord(optionsValue)) {
      throw new Error(chartMethod + '() options must be a literal object.');
    }
    family = chartMethod === 'createComparisonChart' ? 'comparison' : 'combo';
    options = optionsValue as unknown as Record<string, VisualValue>;
  }

  const existing = matched?.kind === 'chart' ? matched : undefined;
  const {
    rotation: _oldRotation,
    opacity: _oldOpacity,
    ...retainedChartTransform
  } = existing?.transform ?? {};
  const id = existing?.id ?? createVisualId('chart');
  const dimensions =
    options.dimensions &&
    typeof options.dimensions === 'object' &&
    !Array.isArray(options.dimensions)
      ? options.dimensions as Record<string, VisualValue>
      : {};
  const x = asOptionalNumber(placement.x) ?? existing?.transform?.x ?? 0;
  const y = asOptionalNumber(placement.y) ?? existing?.transform?.y ?? 0;
  const width =
    asOptionalNumber(placement.width) ??
    (typeof dimensions.width === 'number' ? dimensions.width : 640);
  const height =
    asOptionalNumber(placement.height) ??
    (typeof dimensions.height === 'number' ? dimensions.height : 400);

  return {
    id,
    kind: 'chart',
    name: existing?.name ?? (
      family === 'comparison'
        ? 'Comparison chart'
        : family === 'combo'
          ? 'Combo chart'
          : family.charAt(0).toUpperCase() + family.slice(1) + ' chart'
    ),
    parentId: existing?.parentId ?? null,
    childIds: existing?.childIds,
    transform: {
      ...retainedChartTransform,
      x,
      y,
      width,
      height,
      ...(typeof placement.rotation === 'number'
        ? { rotation: placement.rotation }
        : {}),
      ...(typeof placement.opacity === 'number'
        ? { opacity: placement.opacity }
        : {}),
      visible: existing?.transform?.visible ?? true,
      locked: existing?.transform?.locked ?? false,
      zIndex: existing?.transform?.zIndex ?? index,
    },
    props: chartPropsRecord({
      family,
      ...(data ? { data } : {}),
      options,
    }),
  } satisfies VisualProject['document']['nodes'][string];
}

function pathCommandBounds(commands: StudioPathCommand[]) {
  const xs: number[] = [];
  const ys: number[] = [];
  const point = (x: number, y: number) => {
    if (Number.isFinite(x)) xs.push(x);
    if (Number.isFinite(y)) ys.push(y);
  };
  const box = (x: number, y: number, width: number, height: number) => {
    point(x, y);
    point(x + width, y + height);
  };

  for (const command of commands) {
    switch (command.type) {
      case 'moveTo':
      case 'lineTo':
        point(command.x, command.y);
        break;
      case 'arc':
      case 'circle':
        point(command.x - command.radius, command.y - command.radius);
        point(command.x + command.radius, command.y + command.radius);
        break;
      case 'arcTo':
        point(command.x1, command.y1);
        point(command.x2, command.y2);
        break;
      case 'quadraticCurveTo':
        point(command.cpx, command.cpy);
        point(command.x, command.y);
        break;
      case 'bezierCurveTo':
        point(command.cp1x, command.cp1y);
        point(command.cp2x, command.cp2y);
        point(command.x, command.y);
        break;
      case 'rect':
      case 'roundedRect':
        box(command.x, command.y, command.width, command.height);
        break;
      case 'ellipse': {
        const rotation = command.rotation ?? 0;
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        const extentX = Math.sqrt(
          Math.pow(command.radiusX * cos, 2) +
          Math.pow(command.radiusY * sin, 2),
        );
        const extentY = Math.sqrt(
          Math.pow(command.radiusX * sin, 2) +
          Math.pow(command.radiusY * cos, 2),
        );
        point(command.x - extentX, command.y - extentY);
        point(command.x + extentX, command.y + extentY);
        break;
      }
      case 'polygon':
        command.points.forEach((entry) => point(entry.x, entry.y));
        break;
      case 'star':
        point(command.x - command.outerRadius, command.y - command.outerRadius);
        point(command.x + command.outerRadius, command.y + command.outerRadius);
        break;
      case 'arrow': {
        const endX = command.x + Math.cos((command.angle * Math.PI) / 180) * command.length;
        const endY = command.y + Math.sin((command.angle * Math.PI) / 180) * command.length;
        point(command.x, command.y);
        point(endX, endY);
        break;
      }
      case 'closePath':
        break;
    }
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
  const { transform: _transform, opacity, ...drawBase } = optionsValue;
  const retainedTransform = {
    ...(typeof transform.originX === 'number'
      ? { originX: transform.originX }
      : {}),
    ...(typeof transform.originY === 'number'
      ? { originY: transform.originY }
      : {}),
  };
  const draw = {
    ...drawBase,
    ...(Object.keys(retainedTransform).length
      ? { transform: retainedTransform }
      : {}),
  };
  const existing =
    matched && (matched.kind === 'path' || matched.kind === 'freehand')
      ? matched
      : undefined;
  const {
    rotation: _oldRotation,
    opacity: _oldOpacity,
    ...retainedPathTransform
  } = existing?.transform ?? {};
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
      ...retainedPathTransform,
      x: typeof transform.translateX === 'number' ? transform.translateX : 0,
      y: typeof transform.translateY === 'number' ? transform.translateY : 0,
      width: viewport.width * scaleX,
      height: viewport.height * scaleY,
      ...(typeof transform.rotate === 'number'
        ? { rotation: transform.rotate }
        : {}),
      ...(typeof opacity === 'number' ? { opacity } : {}),
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

  const items = (Array.isArray(parsed) ? parsed : [parsed]).filter(isRecord);
  if (
    !items.length ||
    items.some(
      (item) =>
        !isRecord(item.startCoordinates) ||
        !isRecord(item.endCoordinates) ||
        typeof item.startCoordinates.x !== 'number' ||
        typeof item.startCoordinates.y !== 'number' ||
        typeof item.endCoordinates.x !== 'number' ||
        typeof item.endCoordinates.y !== 'number',
    )
  ) {
    throw new Error('path2d.custom() requires finite startCoordinates and endCoordinates.');
  }

  const points = items.flatMap((item) => [
    item.startCoordinates as RecordValue,
    item.endCoordinates as RecordValue,
  ]);
  const xs = points.map((point) => Number(point.x));
  const ys = points.map((point) => Number(point.y));
  if (![...xs, ...ys].every(Number.isFinite)) {
    throw new Error('path2d.custom() connector coordinates must be finite.');
  }

  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);
  const rebased = items.map((item) => ({
    ...item,
    startCoordinates: {
      ...(item.startCoordinates as RecordValue),
      x: Number((item.startCoordinates as RecordValue).x) - minX,
      y: Number((item.startCoordinates as RecordValue).y) - minY,
    },
    endCoordinates: {
      ...(item.endCoordinates as RecordValue),
      x: Number((item.endCoordinates as RecordValue).x) - minX,
      y: Number((item.endCoordinates as RecordValue).y) - minY,
    },
  }));

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
      x: minX,
      y: minY,
      width,
      height,
      rotation: 0,
      opacity: 1,
      visible: existing?.transform?.visible ?? true,
      locked: existing?.transform?.locked ?? false,
      zIndex: existing?.transform?.zIndex ?? index,
    },
    props: pathPropsRecord({
      tool: 'connector',
      viewport: { width, height },
      connector: (Array.isArray(parsed) ? rebased : rebased[0]) as unknown as VisualPathNodeProps['connector'],
      draw: existing ? visualPathProps(existing).draw : undefined,
    }),
  } satisfies VisualProject['document']['nodes'][string];
}

function pathDocumentPoint(
  node: VisualProject['document']['nodes'][string],
  point: { x: number; y: number },
): { x: number; y: number } {
  if (node.kind !== 'path' && node.kind !== 'freehand') return point;
  const props = visualPathProps(node);
  const transform = node.transform ?? {};
  const authored = props.draw?.transform ?? {};
  const width = Math.max(1, props.viewport.width);
  const height = Math.max(1, props.viewport.height);
  const nodeScaleX =
    ((transform.width ?? width) * (transform.scaleX ?? 1)) / width;
  const nodeScaleY =
    ((transform.height ?? height) * (transform.scaleY ?? 1)) / height;
  const scaleX = (authored.scaleX ?? 1) * nodeScaleX;
  const scaleY = (authored.scaleY ?? 1) * nodeScaleY;
  const rotation =
    (((authored.rotate ?? 0) + (transform.rotation ?? 0)) * Math.PI) / 180;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);

  if (authored.originX !== undefined && authored.originY !== undefined) {
    const dx = (point.x - authored.originX) * scaleX;
    const dy = (point.y - authored.originY) * scaleY;
    return {
      x:
        (authored.translateX ?? 0) +
        (transform.x ?? 0) +
        authored.originX +
        dx * cos -
        dy * sin,
      y:
        (authored.translateY ?? 0) +
        (transform.y ?? 0) +
        authored.originY +
        dx * sin +
        dy * cos,
    };
  }

  const scaledX = point.x * scaleX;
  const scaledY = point.y * scaleY;
  return {
    x:
      (authored.translateX ?? 0) +
      (transform.x ?? 0) +
      scaledX * cos -
      scaledY * sin,
    y:
      (authored.translateY ?? 0) +
      (transform.y ?? 0) +
      scaledX * sin +
      scaledY * cos,
  };
}

function parseNumberArgument(raw: string | undefined, label: string) {
  if (!raw) throw new Error(label + ' is required.');
  const value = new LiteralParser(raw).parse();
  if (typeof value !== 'number') throw new Error(label + ' must be numeric.');
  return value;
}

function expectedPhase7PixelBase(
  source: string,
  beforeIndex: number,
  canvasIdentifier: string | null,
): IdentifierLiteral {
  if (!canvasIdentifier) {
    throw new Error(
      'Visual pixel reverse sync requires createCanvas() to assign its result to an identifier.',
    );
  }
  let expected: IdentifierLiteral = {
    __identifier: canvasIdentifier,
    member: 'buffer',
  };
  const mutatingCalls = [
    ...extractMethodCalls(source, 'createImage'),
    ...extractMethodCalls(source, 'createText'),
    ...extractMethodCalls(source, 'path2d.draw'),
    ...extractMethodCalls(source, 'path2d.custom'),
    ...extractMethodCalls(source, 'pixels.manipulate'),
    ...extractMethodCalls(source, 'pixels.setColor'),
  ].sort((a, b) => a.index - b.index);

  for (const call of mutatingCalls) {
    if (call.index >= beforeIndex) break;
    if (!call.assignedIdentifier) {
      throw new Error(
        'Visual pixel reverse sync requires every earlier composition mutation to assign its output.',
      );
    }
    expected = { __identifier: call.assignedIdentifier };
  }
  return expected;
}

function assertPhase7PixelBase(
  raw: string | undefined,
  source: string,
  callIndex: number,
  canvasIdentifier: string | null,
) {
  if (!raw) {
    throw new Error('Pixel operation requires a base buffer/output argument.');
  }
  const actual = new LiteralParser(raw, true).parse();
  if (!isIdentifierLiteral(actual)) {
    throw new Error(
      'Visual pixel reverse sync requires the canonical linear buffer/output identifier.',
    );
  }
  const expected = expectedPhase7PixelBase(source, callIndex, canvasIdentifier);
  if (
    actual.__identifier !== expected.__identifier ||
    actual.member !== expected.member
  ) {
    const expectedLabel =
      expected.__identifier + (expected.member ? '.' + expected.member : '');
    throw new Error(
      'Visual pixel reverse sync only supports the canonical linear buffer base. Expected “' +
        expectedLabel +
        '”.',
    );
  }
}

function reconcilePhase7Operations(
  project: VisualProject,
  source: string,
  resources: ReadonlyMap<string, StudioPathCommand[]>,
  resourceNodeIds: ReadonlyMap<string, string>,
  canvasIdentifier: string | null,
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
    if (
      call.method === 'pixels.manipulate' ||
      call.method === 'pixels.setColor' ||
      call.method === 'pixels.getColor' ||
      call.method === 'pixels.getData'
    ) {
      assertPhase7PixelBase(
        call.args[0],
        source,
        call.index,
        canvasIdentifier,
      );
    }
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
      const pathNodeId = resourceNodeIds.get(resource.__identifier);
      const pathNode = pathNodeId
        ? project.document.nodes[pathNodeId]
        : undefined;
      if (!pathNode || (pathNode.kind !== 'path' && pathNode.kind !== 'freehand')) {
        throw new Error('detect.path() must reference a rendered Visual path resource.');
      }
      const localPoint = {
        x: parseNumberArgument(call.args[1], 'detect.path x'),
        y: parseNumberArgument(call.args[2], 'detect.path y'),
      };
      const documentPoint = pathDocumentPoint(pathNode, localPoint);
      const options = call.args[3] ? new LiteralParser(call.args[3]).parse() : {};
      value = {
        type: 'detectPath',
        pathNodeId: pathNode.id,
        x: documentPoint.x,
        y: documentPoint.y,
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
  const chartCalls = [
    ...extractMethodCalls(source, 'createChart').map((call) => ({
      ...call,
      chartMethod: 'createChart' as const,
    })),
    ...extractMethodCalls(source, 'createComparisonChart').map((call) => ({
      ...call,
      chartMethod: 'createComparisonChart' as const,
    })),
    ...extractMethodCalls(source, 'createComboChart').map((call) => ({
      ...call,
      chartMethod: 'createComboChart' as const,
    })),
  ].sort((a, b) => a.index - b.index);

  const chartByIdentifier = new Map(
    chartCalls
      .filter((call) => Boolean(call.assignedIdentifier))
      .map((call) => [call.assignedIdentifier!, call] as const),
  );
  const composedChartIdentifiers = new Set<string>();

  const calls = [
    ...extractMethodCalls(source, 'createImage').map((call) => {
      const sourceIdentifier = parsedImageSourceIdentifier(call);
      const chartCall =
        sourceIdentifier && !composedChartIdentifiers.has(sourceIdentifier)
          ? chartByIdentifier.get(sourceIdentifier)
          : undefined;
      if (chartCall && sourceIdentifier) {
        composedChartIdentifiers.add(sourceIdentifier);
        return {
          ...call,
          method: 'chart-compose' as const,
          chartCall,
        };
      }
      return { ...call, method: 'createImage' as const };
    }),
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

  for (const chartCall of chartCalls) {
    if (!chartCall.assignedIdentifier) {
      throw new Error(chartCall.chartMethod + '() must assign its Buffer for Visual chart sync.');
    }
    if (!composedChartIdentifiers.has(chartCall.assignedIdentifier)) {
      throw new Error(
        'Visual chart sync requires chart Buffer “' +
          chartCall.assignedIdentifier +
          '” to be composed with createImage().',
      );
    }
  }

  const existing = orderedRenderableNodes(project);
  const identifierToNodeId = new Map<string, string>();
  const pathResourceToNodeId = new Map<string, string>();
  const touched = new Set<string>();

  calls.forEach((call, index) => {
    const matched = existing[index];
    const node =
      call.method === 'chart-compose'
        ? reconcileChartCall(
            project,
            call.chartCall,
            call.chartCall.chartMethod,
            call,
            index,
            matched,
            identifierToNodeId,
            canvasIdentifier,
          )
        : call.method === 'createImage'
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

    if (call.method === 'chart-compose') {
      if (call.chartCall.assignedIdentifier) {
        identifierToNodeId.set(call.chartCall.assignedIdentifier, node.id);
      }
      if (call.assignedIdentifier) {
        identifierToNodeId.set(call.assignedIdentifier, node.id);
      }
    } else if (call.assignedIdentifier) {
      identifierToNodeId.set(call.assignedIdentifier, node.id);
    }

    if (call.method === 'path2d.draw' && call.args[1]) {
      const resource = new LiteralParser(call.args[1], true).parse();
      if (isIdentifierLiteral(resource) && !resource.member) {
        pathResourceToNodeId.set(resource.__identifier, node.id);
      }
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

  return pathResourceToNodeId;
}

function assignedLiteral(source: string, name: string): Jsonish | null {
  const match = new RegExp('\\bconst\\s+' + name + '\\s*=\\s*').exec(source);
  if (!match) return null;

  let start = match.index + match[0].length;
  while (/\s/.test(source[start] ?? '')) start += 1;
  const opening = source[start];
  if (opening !== '{' && opening !== '[') return null;

  const expectedClose = opening === '{' ? '}' : ']';
  let depth = 0;
  let quote: string | null = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let index = start; index < source.length; index += 1) {
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
    if (char === '"' || char === "'" || char.charCodeAt(0) === 96) {
      quote = char;
      continue;
    }

    if (char === opening) depth += 1;
    else if (char === expectedClose) {
      depth -= 1;
      if (depth === 0) {
        return new LiteralParser(source.slice(start, index + 1)).parse();
      }
    }
  }

  throw new Error('Unterminated literal assigned to ' + name + '.');
}

function recordNumber(
  record: RecordValue,
  key: string,
  fallback: number,
): number {
  const value = record[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function phase11FrameFromRecord(
  value: Jsonish,
  previous: Phase11Frame | undefined,
  index: number,
  allowRepeat: boolean,
): Phase11Frame {
  if (!isRecord(value)) {
    throw new Error('GIF frame ' + String(index + 1) + ' must be an object literal.');
  }

  const buffer =
    typeof value.buffer === 'string'
      ? value.buffer
      : typeof value.source === 'string'
        ? value.source
        : undefined;
  const transformations =
    isRecord(value.transformations)
      ? value.transformations as unknown as Phase11Frame['transformations']
      : undefined;

  return {
    id: previous?.id ?? createVisualId('gif-frame'),
    ...(buffer ? { source: buffer } : {}),
    ...(typeof value.backgroundColor === 'string'
      ? { backgroundColor: value.backgroundColor }
      : {}),
    ...(typeof value.duration === 'number' ? { duration: value.duration } : {}),
    ...(allowRepeat && typeof value.repeat === 'number'
      ? { repeat: value.repeat }
      : { repeat: 1 }),
    ...(value.dispose === 0 || value.dispose === 1 || value.dispose === 2 || value.dispose === 3
      ? { dispose: value.dispose }
      : {}),
    ...(
      value.transparentColor === null ||
      typeof value.transparentColor === 'number' ||
      typeof value.transparentColor === 'string'
        ? { transparentColor: value.transparentColor as number | string | null }
        : {}
    ),
    ...(typeof value.blendMode === 'string' ? { blendMode: value.blendMode } : {}),
    ...(transformations ? { transformations } : {}),
  };
}

function phase11FramesFromValue(
  value: Jsonish | undefined,
  previous: readonly Phase11Frame[],
  allowRepeat: boolean,
): Phase11Frame[] {
  if (!Array.isArray(value)) {
    throw new Error('GIF frames must be a literal array for live Visual sync.');
  }
  return value.map((item, index) =>
    phase11FrameFromRecord(item, previous[index], index, allowRepeat),
  );
}

function phase11OptionsFromRecord(
  timeline: Phase11Timeline,
  value: Jsonish | undefined,
): Phase11Timeline {
  if (value === undefined || !isRecord(value)) {
    throw new Error('GIF options must be an object literal for live Visual sync.');
  }
  return {
    ...timeline,
    width: Math.round(recordNumber(value, 'width', timeline.width)),
    height: Math.round(recordNumber(value, 'height', timeline.height)),
    repeat: Math.round(recordNumber(value, 'repeat', timeline.repeat)),
    quality: Math.round(recordNumber(value, 'quality', timeline.quality)),
    delay: recordNumber(value, 'delay', timeline.delay),
  };
}

function reconcileEditedPhase11Source(
  currentProject: VisualProject,
  markerProject: VisualProject,
  source: string,
): VisualCodeSyncResult | null {
  const currentTimeline = phase11Timeline(markerProject);
  if (!currentTimeline) return null;

  try {
    let next = structuredClone(markerProject);
    let timeline: Phase11Timeline = structuredClone(currentTimeline);

    if (timeline.mode === 'scene-gif') {
      const sceneValue = assignedLiteral(source, 'scene');
      if (!isRecord(sceneValue)) {
        throw new Error('Scene GIF live sync requires the generated scene object.');
      }

      const renderCall = extractMethodCalls(source, 'renderSceneToGIF')[0];
      if (!renderCall?.args[1]) {
        throw new Error('Scene GIF live sync requires renderSceneToGIF() options.');
      }
      const renderOptions = new LiteralParser(renderCall.args[1]).parse();
      if (!isRecord(renderOptions)) {
        throw new Error('renderSceneToGIF() options must stay as a literal object.');
      }

      timeline = phase11OptionsFromRecord(timeline, renderOptions.options);
      timeline.frames = phase11FramesFromValue(
        renderOptions.gifFrames,
        currentTimeline.frames,
        true,
      );
      timeline.scene = {
        ...(timeline.scene ?? {}),
        ...(typeof renderOptions.prependComposedRaster === 'boolean'
          ? { prependComposedRaster: renderOptions.prependComposedRaster }
          : {}),
        ...(typeof renderOptions.composedFrameDuration === 'number'
          ? { composedFrameDuration: renderOptions.composedFrameDuration }
          : {}),
        ...(typeof renderOptions.composedFrameRepeat === 'number'
          ? { composedFrameRepeat: renderOptions.composedFrameRepeat }
          : {}),
      };

      const sceneWidth = recordNumber(sceneValue, 'width', next.document.width);
      const sceneHeight = recordNumber(sceneValue, 'height', next.document.height);
      next.document.width = Math.round(sceneWidth);
      next.document.height = Math.round(sceneHeight);
    } else if (timeline.mode === 'animate') {
      const frameValue = assignedLiteral(source, 'animationFrames');
      timeline.frames = phase11FramesFromValue(
        frameValue ?? undefined,
        currentTimeline.frames,
        false,
      );

      const animateCall = extractMethodCalls(source, 'animate')[0];
      if (!animateCall?.args[1] || !animateCall.args[2] || !animateCall.args[3]) {
        throw new Error('animate() timing and dimensions must remain literal for live Visual sync.');
      }
      const delay = new LiteralParser(animateCall.args[1]).parse();
      const width = new LiteralParser(animateCall.args[2]).parse();
      const height = new LiteralParser(animateCall.args[3]).parse();
      if (
        typeof delay !== 'number' ||
        typeof width !== 'number' ||
        typeof height !== 'number'
      ) {
        throw new Error('animate() delay, width and height must be numeric literals.');
      }
      timeline.delay = delay;
      timeline.width = Math.round(width);
      timeline.height = Math.round(height);

      const gifCall = extractMethodCalls(source, 'createGIF')[0];
      if (gifCall?.args[1]) {
        timeline = phase11OptionsFromRecord(
          timeline,
          new LiteralParser(gifCall.args[1]).parse(),
        );
      }
      next.document.width = timeline.width;
      next.document.height = timeline.height;
    } else {
      const frameValue = assignedLiteral(source, 'gifFrames');
      timeline.frames = phase11FramesFromValue(
        frameValue ?? undefined,
        currentTimeline.frames,
        false,
      );

      const gifCall = extractMethodCalls(source, 'createGIF')[0];
      if (!gifCall?.args[1]) {
        throw new Error('createGIF() options must remain literal for live Visual sync.');
      }
      timeline = phase11OptionsFromRecord(
        timeline,
        new LiteralParser(gifCall.args[1]).parse(),
      );
      next.document.width = timeline.width;
      next.document.height = timeline.height;
    }

    next = setPhase11Timeline(next, timeline);
    const validation = validateVisualProject(next);
    if (!validation.ok) {
      const problem = validation.issues.find((item) => item.severity === 'error');
      return {
        ok: false,
        error: problem?.message ?? 'Edited GIF code produced an invalid Visual timeline.',
      };
    }

    const regenerated = generatePhase11NativeSource(next);
    if (stripStudioSourceMarker(regenerated) !== stripStudioSourceMarker(source)) {
      return null;
    }

    return {
      ok: true,
      project: next,
      changed: projectSemantic(next) !== projectSemantic(currentProject),
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : 'Edited GIF code could not be reconciled into Visual state.',
    };
  }
}

function markerBackedEditConflict(
  phase: number,
): VisualCodeSyncResult {
  return {
    ok: false,
    error:
      'This Phase ' +
      phase +
      ' generated-code edit changes code that Visual Studio cannot reverse safely. ' +
      'Canvas and core visual edits can sync live; advanced runtime edits should be made in their Visual controls or forked to Code Studio.',
  };
}

function projectSemantic(value: VisualProject): string {
  return JSON.stringify({
    width: value.document.width,
    height: value.document.height,
    canvas: value.document.canvas ?? {},
    roots: value.document.rootNodeIds,
    nodes: value.document.nodes,
    assets: value.assets,
    variables: value.variables,
    palettes: value.palettes,
    timelines: value.timelines,
    operations: value.operations,
    outputs: value.outputs,
  });
}

function coreProjectSemantic(value: VisualProject): string {
  return JSON.stringify({
    width: value.document.width,
    height: value.document.height,
    canvas: value.document.canvas ?? {},
    roots: value.document.rootNodeIds,
    nodes: value.document.nodes,
    operations: value.operations,
  });
}

function stripStudioSourceMarker(source: string): string {
  return source
    .replace(
      /\/\*\s*apexify-studio-v(?:9|10|11|12|13|14):[^*]+\*\/\s*/,
      '',
    )
    .trim();
}

function reconcileCoreVisualProjectFromCode(
  project: VisualProject,
  source: string,
  resolveInheritedCanvasDimensions?: VisualInheritedCanvasDimensionResolver,
): VisualCodeSyncResult {
  if (!/\bApexPainter\b/.test(source)) {
    return {
      ok: false,
      error: 'Code must use ApexPainter so Visual Studio can reconcile it.',
    };
  }

  try {
    const canvasCall = parseCanvasOptions(source);
    let width = canvasCall.options.width;
    let height = canvasCall.options.height;

    const customBg = isRecord(canvasCall.options.customBg)
      ? canvasCall.options.customBg
      : null;
    if (
      customBg?.inherit === true &&
      typeof customBg.source === 'string' &&
      resolveInheritedCanvasDimensions
    ) {
      const inherited = resolveInheritedCanvasDimensions(customBg.source);
      if (inherited) {
        width = inherited.width;
        height = inherited.height;
      }
    }

    if (typeof width !== 'number' || typeof height !== 'number') {
      return {
        ok: false,
        error:
          'createCanvas needs numeric width/height, or customBg.inherit with a resolvable image asset, for live Visual sync.',
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
        error: 'Canvas width and height must be between 1 and 16384.',
      };
    }

    const next = structuredClone(project);
    next.document.width = Math.round(width);
    next.document.height = Math.round(height);
    const canvas = serializeCanvasConfig(canvasCall.options);
    next.document.canvas =
      Object.keys(canvas).length ? canvas : undefined;

    const pathResourceToNodeId = reconcileRenderableCalls(
      next,
      source,
      canvasCall.identifier,
    );
    reconcilePhase7Operations(
      next,
      source,
      pathResourceDefinitions(source),
      pathResourceToNodeId,
      canvasCall.identifier,
    );
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

    return {
      ok: true,
      project: next,
      changed: coreProjectSemantic(next) !== coreProjectSemantic(project),
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

function markerBackedDocumentDimensions(
  source: string,
): { width: number; height: number } | null {
  const numeric = '([+-]?(?:\\d+\\.?\\d*|\\.\\d+)(?:e[+-]?\\d+)?)';

  const createScene = source.match(
    new RegExp(
      '\\.\\s*createScene\\s*\\(\\s*' +
        numeric +
        '\\s*,\\s*' +
        numeric +
        '\\s*\\)',
      'i',
    ),
  );

  const literalScene = source.match(
    new RegExp(
      '\\bconst\\s+scene\\s*=\\s*\\{\\s*width\\s*:\\s*' +
        numeric +
        '\\s*,\\s*height\\s*:\\s*' +
        numeric,
      'i',
    ),
  );

  const match = createScene ?? literalScene;
  if (!match) return null;

  const width = Number(match[1]);
  const height = Number(match[2]);
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width < 1 ||
    height < 1 ||
    width > 16384 ||
    height > 16384
  ) {
    return null;
  }
  return { width: Math.round(width), height: Math.round(height) };
}

function markerDimensionCandidate(
  project: VisualProject,
  source: string,
): VisualProject | null {
  const dimensions = markerBackedDocumentDimensions(source);
  if (!dimensions) return null;
  const next = structuredClone(project);
  next.document.width = dimensions.width;
  next.document.height = dimensions.height;
  next.updatedAt = new Date().toISOString();
  const validation = validateVisualProject(next);
  return validation.ok ? next : null;
}

function reconcileMarkerBackedProject(
  phase: number,
  currentProject: VisualProject,
  markerProject: VisualProject,
  source: string,
  canonicalSources: readonly string[],
  regenerateSources: (project: VisualProject) => readonly string[],
): VisualCodeSyncResult {
  const validation = validateVisualProject(markerProject);
  if (!validation.ok) {
    const problem = validation.issues.find((item) => item.severity === 'error');
    return {
      ok: false,
      error:
        problem?.message ??
        'The Phase ' + phase + ' source marker contains an invalid Visual Project.',
    };
  }

  if (canonicalSources.includes(source)) {
    return {
      ok: true,
      project: structuredClone(markerProject),
      changed: projectSemantic(markerProject) !== projectSemantic(currentProject),
    };
  }

  // Phase 9-14 source contains a project marker for advanced semantics.
  // Accept only edits that can be reproduced exactly from a VisualProject.
  // The ordinary reverse compiler covers createCanvas-based projects, while
  // scene-backed generators (including the Phase-11 scene shown in Studio)
  // expose document dimensions through createScene(width,height) or a
  // literal `const scene = { width, height, ... }`.
  const candidates: VisualProject[] = [];
  const coreResult = reconcileCoreVisualProjectFromCode(markerProject, source);
  if (coreResult.ok) candidates.push(coreResult.project);

  const dimensionCandidate = markerDimensionCandidate(markerProject, source);
  if (
    dimensionCandidate &&
    !candidates.some(
      (candidate) => projectSemantic(candidate) === projectSemantic(dimensionCandidate),
    )
  ) {
    candidates.push(dimensionCandidate);
  }

  const editedBody = stripStudioSourceMarker(source);
  for (const candidate of candidates) {
    const regeneratedBodies = regenerateSources(candidate).map(stripStudioSourceMarker);
    if (!regeneratedBodies.includes(editedBody)) continue;
    return {
      ok: true,
      project: candidate,
      changed: projectSemantic(candidate) !== projectSemantic(currentProject),
    };
  }

  if (!candidates.length && !coreResult.ok) return coreResult;
  return markerBackedEditConflict(phase);
}

export function reconcileVisualProjectFromCode(
  project: VisualProject,
  source: string,
  resolveInheritedCanvasDimensions?: VisualInheritedCanvasDimensionResolver,
): VisualCodeSyncResult {
  const phase14Project = phase14ProjectFromSourceMarker(source);
  if (phase14Project) {
    return reconcileMarkerBackedProject(
      14,
      project,
      phase14Project,
      source,
      [generatePhase14NativeSource(phase14Project)],
      (next) => [generatePhase14NativeSource(next)],
    );
  }

  const phase13Project = phase13ProjectFromSourceMarker(source);
  if (phase13Project) {
    return reconcileMarkerBackedProject(
      13,
      project,
      phase13Project,
      source,
      [generatePhase13NativeSource(phase13Project)],
      (next) => [generatePhase13NativeSource(next)],
    );
  }

  const phase12Project = phase12ProjectFromSourceMarker(source);
  if (phase12Project) {
    return reconcileMarkerBackedProject(
      12,
      project,
      phase12Project,
      source,
      [generatePhase12NativeSource(phase12Project)],
      (next) => [generatePhase12NativeSource(next)],
    );
  }

  const phase11Project = phase11ProjectFromSourceMarker(source);
  if (phase11Project) {
    const canonical = generatePhase11NativeSource(phase11Project);
    if (source !== canonical) {
      const edited = reconcileEditedPhase11Source(project, phase11Project, source);
      if (edited) return edited;
    }
    return reconcileMarkerBackedProject(
      11,
      project,
      phase11Project,
      source,
      [canonical],
      (next) => [generatePhase11NativeSource(next)],
    );
  }

  const phase10Project = phase10ProjectFromSourceMarker(source);
  if (phase10Project) {
    return reconcileMarkerBackedProject(
      10,
      project,
      phase10Project,
      source,
      [
        generatePhase10NativeSource(phase10Project),
        generatePhase10DisplayPreviewSource(phase10Project),
      ],
      (next) => [
        generatePhase10NativeSource(next),
        generatePhase10DisplayPreviewSource(next),
      ],
    );
  }

  const phase9Project = phase9ProjectFromSourceMarker(source);
  if (phase9Project) {
    return reconcileMarkerBackedProject(
      9,
      project,
      phase9Project,
      source,
      [generatePhase9NativeSource(phase9Project)],
      (next) => [generatePhase9NativeSource(next)],
    );
  }

  return reconcileCoreVisualProjectFromCode(
    project,
    source,
    resolveInheritedCanvasDimensions,
  );
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
