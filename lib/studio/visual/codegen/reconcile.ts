import type {
  VisualCanvasConfig,
  VisualCreateImageOptions,
  VisualImageNodeProps,
  VisualImageSource,
  VisualProject,
  VisualValue,
} from '../model';
import {
  IMAGE_SHAPE_TYPES,
  imagePropsRecord,
  visualImageProps,
} from '../image-contract';
import { createVisualId } from '../ids';
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
    /const\s+([A-Za-z_$][\w$]*)\s*=\s*await\s+[A-Za-z_$][\w$]*\s*$/,
  );
  return match?.[1] ?? null;
}

function extractMethodCalls(
  source: string,
  method: 'createCanvas' | 'createImage',
): MethodCall[] {
  const calls: MethodCall[] = [];
  const re = new RegExp('\\.' + method + '\\s*\\(', 'g');
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

function orderedImageNodes(project: VisualProject) {
  const out = [] as Array<VisualProject['document']['nodes'][string]>;
  const visit = (id: string) => {
    const node = project.document.nodes[id];
    if (!node) return;
    if (node.kind === 'group' || node.kind === 'surface') {
      for (const childId of node.childIds ?? []) visit(childId);
      return;
    }
    if (node.kind === 'image' || node.kind === 'shape') out.push(node);
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
        '” is not an earlier canonical image buffer.',
    );
  }
  return { $generated: nodeId };
}

function asOptionalNumber(value: Jsonish | undefined): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

function reconcileImageCalls(
  project: VisualProject,
  source: string,
  canvasIdentifier: string | null,
) {
  const calls = extractMethodCalls(source, 'createImage');
  const existing = orderedImageNodes(project);
  const identifierToNodeId = new Map<string, string>();
  const touched = new Set<string>();

  calls.forEach((call, index) => {
    if (!call.args[0]) {
      throw new Error('createImage() requires image properties.');
    }
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

    const matched = existing[index];
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

    if (!oldNode) {
      project.document.rootNodeIds.push(id);
    }
    project.document.nodes[id] = node;
    touched.add(id);
    if (call.assignedIdentifier) {
      identifierToNodeId.set(call.assignedIdentifier, id);
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

    reconcileImageCalls(next, source, canvasCall.identifier);
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
