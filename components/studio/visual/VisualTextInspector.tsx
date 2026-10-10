import { useMemo, useState, type ReactNode } from 'react';
import {
  AdjustmentsHorizontalIcon,
  ChartBarIcon,
  DocumentTextIcon,
  PaintBrushIcon,
  SparklesIcon,
  Squares2X2Icon,
  SwatchIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';

import {
  studioAssetFontFamily,
  studioAssetIdFromReference,
  studioAssetReference,
  type StudioVirtualAsset,
} from '@/lib/studio/runtime/assets';
import {
  TEXT_ALIGNMENTS,
  TEXT_BASELINES,
  TEXT_CURVE_MODES,
  TEXT_STROKE_STYLES,
  measureVisualTextInBrowser,
  visualTextBatchGroupProps,
  visualTextProps,
} from '@/lib/studio/visual/text-contract';
import type {
  VisualGradient,
  VisualNode,
  VisualTextBatchGroupProps,
  VisualTextLineDecoration,
  VisualTextNodeProps,
  VisualTransform,
} from '@/lib/studio/visual/model';

export type TextInspectorTab =
  | 'transform'
  | 'style'
  | 'effects'
  | 'data'
  | 'advanced';

type TextInspectorProps = {
  node: VisualNode;
  tab: TextInspectorTab;
  fontAssets: readonly StudioVirtualAsset[];
  systemFontFamilies: readonly string[];
  onChange: (
    label: string,
    updater: (current: VisualTextNodeProps) => VisualTextNodeProps,
  ) => void;
  onTransform: (
    label: string,
    updater: (current: VisualTransform) => VisualTransform,
  ) => void;
  onRename: (name: string) => void;
};

type BatchInspectorProps = {
  node: VisualNode;
  tab: TextInspectorTab;
  onChange: (
    label: string,
    updater: (current: VisualTextBatchGroupProps) => VisualTextBatchGroupProps,
  ) => void;
  onRename: (name: string) => void;
};

const DEFAULT_FILL = '#f4f7fb';

function sectionIcon(attr: string) {
  if (attr.includes('font') || attr.includes('content')) return DocumentTextIcon;
  if (attr.includes('effect') || attr.includes('curve')) return SparklesIcon;
  if (attr.includes('fill')) return SwatchIcon;
  if (attr.includes('stroke') || attr.includes('decoration')) return PaintBrushIcon;
  if (attr.includes('metric') || attr.includes('measure')) return ChartBarIcon;
  if (attr.includes('batch')) return Squares2X2Icon;
  if (attr.includes('advanced') || attr.includes('legacy')) return WrenchScrewdriverIcon;
  return AdjustmentsHorizontalIcon;
}

function Section({
  title,
  description,
  attr,
  action,
  defaultOpen = true,
  children,
}: {
  title: string;
  description?: string;
  attr: string;
  action?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const Icon = sectionIcon(attr);
  return (
    <details
      className="apx-canvas-v2-section apx-text-v3-section"
      data-text-v3-section={attr}
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>
        <span className="apx-canvas-v2-section-icon">
          <Icon aria-hidden />
        </span>
        <span className="apx-canvas-v2-section-copy">
          <strong>{title}</strong>
          {description ? <small>{description}</small> : null}
        </span>
        {action ? (
          <span
            className="apx-canvas-v2-section-action"
            onClick={(event) => event.stopPropagation()}
          >
            {action}
          </span>
        ) : null}
        <span className="apx-canvas-v2-chevron">⌄</span>
      </summary>
      <div className="apx-canvas-v2-section-body">{children}</div>
    </details>
  );
}

function Toggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="apx-canvas-v2-toggle" title={label}>
      <input
        type="checkbox"
        aria-label={label}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span />
    </label>
  );
}

function NumberField({
  label,
  value,
  step = 1,
  min,
  max,
  suffix,
  onChange,
}: {
  label: string;
  value: number | undefined;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="apx-text-v3-field">
      <span>{label}</span>
      <span className="apx-text-v3-number">
        <input
          type="number"
          value={value ?? ''}
          step={step}
          min={min}
          max={max}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        {suffix ? <em>{suffix}</em> : null}
      </span>
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | number;
  options: readonly (string | number)[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="apx-text-v3-field">
      <span>{label}</span>
      <select
        className="apx-text-v3-select"
        value={String(value)}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={String(option)} value={String(option)}>
            {String(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

function ColorField({
  label,
  value,
  fallback,
  onChange,
}: {
  label: string;
  value: string | undefined;
  fallback: string;
  onChange: (value: string) => void;
}) {
  const safe = /^#[0-9a-f]{6}$/i.test(value ?? '') ? value! : fallback;
  return (
    <label className="apx-text-v3-field">
      <span>{label}</span>
      <span className="apx-text-v3-color">
        <input type="color" value={safe} onChange={(event) => onChange(event.target.value)} />
        <input value={value ?? ''} placeholder={fallback} onChange={(event) => onChange(event.target.value)} />
      </span>
    </label>
  );
}

function defaultGradient(): VisualGradient {
  return {
    type: 'linear',
    startX: 0,
    startY: 0,
    endX: 320,
    endY: 0,
    repeat: 'no-repeat',
    colors: [
      { stop: 0, color: '#22d3ee' },
      { stop: 1, color: '#8b5cf6' },
    ],
  };
}

function GradientEditor({
  value,
  onChange,
}: {
  value: VisualGradient;
  onChange: (value: VisualGradient) => void;
}) {
  const patch = (next: Partial<VisualGradient>) =>
    onChange({ ...value, ...next } as VisualGradient);

  return (
    <div className="apx-text-v3-gradient" data-text-gradient-editor>
      <div className="apx-text-v3-grid apx-text-v3-grid--2">
        <SelectField
          label="Type"
          value={value.type}
          options={['linear', 'radial', 'conic']}
          onChange={(type) => {
            if (type === 'radial') {
              onChange({
                type: 'radial',
                startX: 160,
                startY: 0,
                startRadius: 0,
                endX: 160,
                endY: 80,
                endRadius: 180,
                repeat: 'no-repeat',
                colors: value.colors,
              });
            } else if (type === 'conic') {
              onChange({
                type: 'conic',
                centerX: 160,
                centerY: 80,
                startAngle: 0,
                colors: value.colors,
              });
            } else {
              onChange({
                type: 'linear',
                startX: 0,
                startY: 0,
                endX: 320,
                endY: 0,
                repeat: 'no-repeat',
                colors: value.colors,
              });
            }
          }}
        />
        {value.type !== 'conic' ? (
          <SelectField
            label="Repeat"
            value={value.repeat ?? 'no-repeat'}
            options={['no-repeat', 'repeat', 'reflect']}
            onChange={(repeat) =>
              patch({ repeat: repeat as 'no-repeat' | 'repeat' | 'reflect' })
            }
          />
        ) : (
          <NumberField
            label="Start angle"
            value={value.startAngle ?? 0}
            suffix="°"
            onChange={(startAngle) => patch({ startAngle })}
          />
        )}
      </div>

      <div className="apx-text-v3-stops">
        {value.colors.map((stop, index) => (
          <div className="apx-text-v3-stop" key={index}>
            <input
              type="color"
              value={/^#[0-9a-f]{6}$/i.test(stop.color) ? stop.color : '#ffffff'}
              onChange={(event) =>
                patch({
                  colors: value.colors.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, color: event.target.value } : item,
                  ),
                })
              }
            />
            <input
              value={stop.color}
              onChange={(event) =>
                patch({
                  colors: value.colors.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, color: event.target.value } : item,
                  ),
                })
              }
            />
            <input
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={stop.stop}
              onChange={(event) =>
                patch({
                  colors: value.colors.map((item, itemIndex) =>
                    itemIndex === index
                      ? { ...item, stop: Number(event.target.value) }
                      : item,
                  ),
                })
              }
            />
            <button
              type="button"
              title="Remove gradient stop"
              disabled={value.colors.length <= 2}
              onClick={() =>
                patch({
                  colors: value.colors.filter((_, itemIndex) => itemIndex !== index),
                })
              }
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="apx-text-v3-add"
        onClick={() =>
          patch({
            colors: [
              ...value.colors,
              {
                stop: Math.min(1, (value.colors.at(-1)?.stop ?? 0.8) + 0.1),
                color: '#ffffff',
              },
            ],
          })
        }
      >
        + Add stop
      </button>

      <div className="apx-text-v3-grid apx-text-v3-grid--2">
        <NumberField label="Rotate" value={value.rotate ?? 0} suffix="°" onChange={(rotate) => patch({ rotate })} />
        <NumberField label="Pivot X" value={value.pivotX} onChange={(pivotX) => patch({ pivotX })} />
        <NumberField label="Pivot Y" value={value.pivotY} onChange={(pivotY) => patch({ pivotY })} />
        {value.type === 'linear' ? (
          <>
            <NumberField label="Start X" value={value.startX} onChange={(startX) => patch({ startX })} />
            <NumberField label="Start Y" value={value.startY} onChange={(startY) => patch({ startY })} />
            <NumberField label="End X" value={value.endX} onChange={(endX) => patch({ endX })} />
            <NumberField label="End Y" value={value.endY} onChange={(endY) => patch({ endY })} />
          </>
        ) : null}
        {value.type === 'radial' ? (
          <>
            <NumberField label="Start X" value={value.startX} onChange={(startX) => patch({ startX })} />
            <NumberField label="Start Y" value={value.startY} onChange={(startY) => patch({ startY })} />
            <NumberField label="Start radius" value={value.startRadius} min={0} onChange={(startRadius) => patch({ startRadius })} />
            <NumberField label="End X" value={value.endX} onChange={(endX) => patch({ endX })} />
            <NumberField label="End Y" value={value.endY} onChange={(endY) => patch({ endY })} />
            <NumberField label="End radius" value={value.endRadius} min={0} onChange={(endRadius) => patch({ endRadius })} />
          </>
        ) : null}
        {value.type === 'conic' ? (
          <>
            <NumberField label="Center X" value={value.centerX} onChange={(centerX) => patch({ centerX })} />
            <NumberField label="Center Y" value={value.centerY} onChange={(centerY) => patch({ centerY })} />
          </>
        ) : null}
      </div>
    </div>
  );
}

function PaintEditor({
  name,
  color,
  opacity,
  gradient,
  fallback,
  onColor,
  onOpacity,
  onGradient,
}: {
  name: string;
  color: string | undefined;
  opacity: number | undefined;
  gradient: VisualGradient | undefined;
  fallback: string;
  onColor: (color: string) => void;
  onOpacity: (opacity: number) => void;
  onGradient: (gradient: VisualGradient | undefined) => void;
}) {
  return (
    <div className="apx-text-v3-paint">
      <div className="apx-text-v3-grid apx-text-v3-grid--2">
        <ColorField label="Color" value={color} fallback={fallback} onChange={onColor} />
        <NumberField label="Opacity" value={opacity ?? 1} min={0} max={1} step={0.01} onChange={onOpacity} />
      </div>
      <div className="apx-text-v3-toggle-row apx-text-v3-toggle-row--compact">
        <span>
          <strong>{name} gradient</strong>
          <small>Use the shared Apexify gradient contract.</small>
        </span>
        <Toggle
          label={name + ' gradient'}
          checked={Boolean(gradient)}
          onChange={(checked) => onGradient(checked ? defaultGradient() : undefined)}
        />
      </div>
      {gradient ? <GradientEditor value={gradient} onChange={onGradient} /> : null}
    </div>
  );
}

function DecorationEditor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: VisualTextLineDecoration | undefined;
  onChange: (value: VisualTextLineDecoration | undefined) => void;
}) {
  const active = value !== undefined && value !== false;
  const styled =
    typeof value === 'object' && value !== null
      ? value
      : { color: DEFAULT_FILL, width: 1 };

  return (
    <div className="apx-text-v3-decoration">
      <div className="apx-text-v3-toggle-row apx-text-v3-toggle-row--compact">
        <span>
          <strong>{label}</strong>
          <small>{active ? 'Styled line decoration' : 'Off'}</small>
        </span>
        <Toggle
          label={label}
          checked={active}
          onChange={(checked) =>
            onChange(checked ? { color: DEFAULT_FILL, width: 1 } : undefined)
          }
        />
      </div>
      {active ? (
        <>
          <div className="apx-text-v3-grid apx-text-v3-grid--2">
            <ColorField
              label="Color"
              value={styled.color}
              fallback={DEFAULT_FILL}
              onChange={(color) => onChange({ ...styled, color })}
            />
            <NumberField
              label="Width"
              value={styled.width ?? 1}
              min={0}
              step={0.5}
              suffix="px"
              onChange={(width) => onChange({ ...styled, width })}
            />
          </div>
          <div className="apx-text-v3-toggle-row apx-text-v3-toggle-row--compact">
            <span><strong>Gradient</strong><small>Gradient line paint.</small></span>
            <Toggle
              label={label + ' gradient'}
              checked={Boolean(styled.gradient)}
              onChange={(checked) =>
                onChange({
                  ...styled,
                  gradient: checked ? defaultGradient() : undefined,
                })
              }
            />
          </div>
          {styled.gradient ? (
            <GradientEditor
              value={styled.gradient}
              onChange={(gradient) => onChange({ ...styled, gradient })}
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function Header({
  name,
  detail,
  badge,
}: {
  name: string;
  detail: string;
  badge: string;
}) {
  return (
    <div className="apx-canvas-v2-header apx-text-v3-header" data-text-v3-inspector>
      <div className="apx-canvas-v2-api-icon"><DocumentTextIcon aria-hidden /></div>
      <div>
        <strong>{name}</strong>
        <span>{detail}</span>
      </div>
      <div className="apx-canvas-v2-api-status">
        <strong>createText()</strong>
        <span>{badge}</span>
      </div>
    </div>
  );
}

function MetricsPanel({ props }: { props: VisualTextNodeProps }) {
  const metrics = useMemo(() => measureVisualTextInBrowser(props), [props]);
  if (!metrics) {
    return <div className="apx-text-v3-empty">Browser measurement is unavailable.</div>;
  }
  const values = [
    ['Width', metrics.width],
    ['Height', metrics.height],
    ['Line height', metrics.lineHeight],
    ['Lines', metrics.lineCount ?? metrics.lines?.length ?? 1],
    ['Ascent', metrics.actualBoundingBoxAscent],
    ['Descent', metrics.actualBoundingBoxDescent],
    ['Left', metrics.actualBoundingBoxLeft],
    ['Right', metrics.actualBoundingBoxRight],
    ['Baseline', metrics.baseline],
    ['Center X', metrics.centerX],
    ['Center Y', metrics.centerY],
  ] as const;
  return (
    <>
      <div className="apx-text-v3-metric-grid">
        {values.map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>
              {typeof value === 'number'
                ? Number.isInteger(value)
                  ? value
                  : value.toFixed(2)
                : '—'}
            </strong>
          </div>
        ))}
      </div>
      {metrics.lines?.length ? (
        <div className="apx-text-v3-lines">
          <strong>Measured lines</strong>
          {metrics.lines.map((line, index) => (
            <div key={index}>
              <span>{index + 1}</span>
              <code>{line.text || '∅'}</code>
              <em>{line.width.toFixed(1)}px</em>
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}

export function VisualTextInspector({
  node,
  tab,
  fontAssets,
  systemFontFamilies,
  onChange,
  onTransform,
  onRename,
}: TextInspectorProps) {
  if (node.kind !== 'text') return null;
  const props = visualTextProps(node);
  const transform = node.transform ?? {};
  const font = props.font ?? {};
  const layout = props.layout ?? {};
  const placement = props.placement ?? {};
  const fill = props.fill ?? {};
  const decorations = props.decorations ?? {};
  const effects = props.effects ?? {};
  const fontAssetId = font.path ? studioAssetIdFromReference(font.path) : null;
  const width = Math.max(1, transform.width ?? layout.maxWidth ?? 360);
  const height = Math.max(1, transform.height ?? layout.maxHeight ?? 100);

  const patch = (
    label: string,
    updater: (current: VisualTextNodeProps) => VisualTextNodeProps,
  ) => onChange(label, updater);

  const header = (
    <Header
      name={node.name ?? 'Text'}
      detail={(props.text || 'Text').replace(/\s+/g, ' ').slice(0, 48)}
      badge={(font.size ?? props.fontSize ?? 16) + 'px · ' + (font.family ?? props.fontFamily ?? 'Arial')}
    />
  );

  if (tab === 'transform') {
    return (
      <>
        {header}
        <Section
          title="Position"
          description="Runtime x/y anchor and rotation."
          attr="transform"
        >
          <div className="apx-text-v3-grid apx-text-v3-grid--2">
            <NumberField
              label="X"
              value={transform.x ?? 0}
              onChange={(x) => onTransform('Text X', (current) => ({ ...current, x }))}
            />
            <NumberField
              label="Y"
              value={transform.y ?? 0}
              onChange={(y) => onTransform('Text Y', (current) => ({ ...current, y }))}
            />
            <NumberField
              label="Rotation"
              value={transform.rotation ?? placement.rotation ?? props.rotation ?? 0}
              suffix="°"
              onChange={(rotation) =>
                onTransform('Text rotation', (current) => ({ ...current, rotation }))
              }
            />
          </div>
        </Section>

        <Section
          title="Wrapping box"
          description="Studio width/height lower to layout.maxWidth/maxHeight."
          attr="layout-transform"
        >
          <div className="apx-text-v3-grid apx-text-v3-grid--2">
            <NumberField
              label="Max width"
              value={width}
              min={1}
              suffix="px"
              onChange={(nextWidth) =>
                onTransform('Text max width', (current) => ({
                  ...current,
                  width: nextWidth,
                  scaleX: 1,
                }))
              }
            />
            <NumberField
              label="Max height"
              value={height}
              min={1}
              suffix="px"
              onChange={(nextHeight) =>
                onTransform('Text max height', (current) => ({
                  ...current,
                  height: nextHeight,
                  scaleY: 1,
                }))
              }
            />
          </div>
          <div className="apx-text-v3-note">
            <strong>Runtime semantics</strong>
            <span>These are wrapping bounds, not geometric glyph scaling.</span>
          </div>
        </Section>

        <Section
          title="Alignment"
          description="Canvas textAlign and textBaseline."
          attr="placement"
        >
          <div className="apx-text-v3-grid apx-text-v3-grid--2">
            <SelectField
              label="Text align"
              value={placement.textAlign ?? props.textAlign ?? 'left'}
              options={TEXT_ALIGNMENTS}
              onChange={(textAlign) =>
                patch('Text alignment', (current) => ({
                  ...current,
                  placement: {
                    ...(current.placement ?? {}),
                    textAlign: textAlign as NonNullable<VisualTextNodeProps['placement']>['textAlign'],
                  },
                }))
              }
            />
            <SelectField
              label="Baseline"
              value={placement.textBaseline ?? props.textBaseline ?? 'alphabetic'}
              options={TEXT_BASELINES}
              onChange={(textBaseline) =>
                patch('Text baseline', (current) => ({
                  ...current,
                  placement: {
                    ...(current.placement ?? {}),
                    textBaseline: textBaseline as NonNullable<VisualTextNodeProps['placement']>['textBaseline'],
                  },
                }))
              }
            />
          </div>
        </Section>
      </>
    );
  }

  if (tab === 'style') {
    return (
      <>
        {header}
        <Section
          title="Typography"
          description="Font registry, size and canvas bold/italic flags."
          attr="font"
        >
          <div className="apx-text-v3-grid apx-text-v3-grid--2">
            <SelectField
              label="Font family"
              value={font.family ?? props.fontFamily ?? 'Arial'}
              options={systemFontFamilies}
              onChange={(family) =>
                patch('Text font family', (current) => ({
                  ...current,
                  font: {
                    ...(current.font ?? {}),
                    family,
                    name: family,
                    path: undefined,
                  },
                }))
              }
            />
            <NumberField
              label="Size"
              value={font.size ?? props.fontSize ?? 16}
              min={0.1}
              suffix="px"
              onChange={(size) =>
                patch('Text font size', (current) => ({
                  ...current,
                  font: { ...(current.font ?? {}), size },
                }))
              }
            />
          </div>
          <div className="apx-text-v3-inline-toggles">
            <button
              type="button"
              data-active={(decorations.bold ?? props.bold) ? 'true' : undefined}
              onClick={() =>
                patch('Text bold', (current) => ({
                  ...current,
                  decorations: {
                    ...(current.decorations ?? {}),
                    bold: !(current.decorations?.bold ?? current.bold ?? false),
                  },
                }))
              }
            >
              <strong>B</strong> Bold
            </button>
            <button
              type="button"
              data-active={(decorations.italic ?? props.italic) ? 'true' : undefined}
              onClick={() =>
                patch('Text italic', (current) => ({
                  ...current,
                  decorations: {
                    ...(current.decorations ?? {}),
                    italic: !(current.decorations?.italic ?? current.italic ?? false),
                  },
                }))
              }
            >
              <em>I</em> Italic
            </button>
          </div>
        </Section>

        <Section title="Fill" description="Solid or gradient glyph fill." attr="fill">
          <PaintEditor
            name="Fill"
            color={fill.color ?? props.color}
            opacity={fill.opacity ?? props.opacity ?? 1}
            gradient={fill.gradient ?? props.gradient}
            fallback="#000000"
            onColor={(color) =>
              patch('Text fill color', (current) => ({
                ...current,
                fill: { ...(current.fill ?? {}), color },
              }))
            }
            onOpacity={(opacity) =>
              patch('Text fill opacity', (current) => ({
                ...current,
                fill: { ...(current.fill ?? {}), opacity },
              }))
            }
            onGradient={(gradient) =>
              patch('Text fill gradient', (current) => ({
                ...current,
                fill: { ...(current.fill ?? {}), gradient },
              }))
            }
          />
        </Section>

        <Section
          title="Layout"
          description="Line rhythm, spacing and wrap limits."
          attr="layout"
        >
          <div className="apx-text-v3-grid apx-text-v3-grid--2">
            <NumberField
              label="Line height"
              value={layout.lineHeight ?? props.lineHeight ?? 1.4}
              min={0.01}
              step={0.05}
              onChange={(lineHeight) =>
                patch('Text line height', (current) => ({
                  ...current,
                  layout: { ...(current.layout ?? {}), lineHeight },
                }))
              }
            />
            <NumberField
              label="Letter spacing"
              value={layout.letterSpacing ?? props.letterSpacing ?? 0}
              step={0.25}
              suffix="px"
              onChange={(letterSpacing) =>
                patch('Text letter spacing', (current) => ({
                  ...current,
                  layout: { ...(current.layout ?? {}), letterSpacing },
                }))
              }
            />
            <NumberField
              label="Word spacing"
              value={layout.wordSpacing ?? props.wordSpacing ?? 0}
              step={0.5}
              suffix="px"
              onChange={(wordSpacing) =>
                patch('Text word spacing', (current) => ({
                  ...current,
                  layout: { ...(current.layout ?? {}), wordSpacing },
                }))
              }
            />
            <NumberField
              label="Max width"
              value={layout.maxWidth ?? props.maxWidth ?? transform.width}
              min={1}
              suffix="px"
              onChange={(maxWidth) =>
                patch('Text max width', (current) => ({
                  ...current,
                  layout: { ...(current.layout ?? {}), maxWidth },
                }))
              }
            />
            <NumberField
              label="Max height"
              value={layout.maxHeight ?? props.maxHeight ?? transform.height}
              min={1}
              suffix="px"
              onChange={(maxHeight) =>
                patch('Text max height', (current) => ({
                  ...current,
                  layout: { ...(current.layout ?? {}), maxHeight },
                }))
              }
            />
          </div>
        </Section>

        <Section
          title="Stroke"
          description="Glyph outline paint and runtime stroke style."
          attr="stroke"
          defaultOpen={Boolean(props.stroke)}
          action={
            <Toggle
              label="Text stroke"
              checked={Boolean(props.stroke)}
              onChange={(checked) =>
                patch('Text stroke', (current) => ({
                  ...current,
                  stroke: checked
                    ? { color: '#000000', width: 1, opacity: 1, style: 'solid' }
                    : undefined,
                }))
              }
            />
          }
        >
          {props.stroke ? (
            <>
              <div className="apx-text-v3-grid apx-text-v3-grid--2">
                <ColorField
                  label="Color"
                  value={props.stroke.color}
                  fallback="#000000"
                  onChange={(color) =>
                    patch('Text stroke color', (current) => ({
                      ...current,
                      stroke: { ...current.stroke!, color },
                    }))
                  }
                />
                <NumberField
                  label="Width"
                  value={props.stroke.width ?? 1}
                  min={0}
                  step={0.5}
                  suffix="px"
                  onChange={(strokeWidth) =>
                    patch('Text stroke width', (current) => ({
                      ...current,
                      stroke: { ...current.stroke!, width: strokeWidth },
                    }))
                  }
                />
                <NumberField
                  label="Opacity"
                  value={props.stroke.opacity ?? 1}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(opacity) =>
                    patch('Text stroke opacity', (current) => ({
                      ...current,
                      stroke: { ...current.stroke!, opacity },
                    }))
                  }
                />
                <SelectField
                  label="Style"
                  value={props.stroke.style ?? 'solid'}
                  options={TEXT_STROKE_STYLES}
                  onChange={(style) =>
                    patch('Text stroke style', (current) => ({
                      ...current,
                      stroke: {
                        ...current.stroke!,
                        style: style as NonNullable<VisualTextNodeProps['stroke']>['style'],
                      },
                    }))
                  }
                />
              </div>
              <div className="apx-text-v3-toggle-row apx-text-v3-toggle-row--compact">
                <span><strong>Stroke gradient</strong><small>Gradient outline paint.</small></span>
                <Toggle
                  label="Stroke gradient"
                  checked={Boolean(props.stroke.gradient)}
                  onChange={(checked) =>
                    patch('Text stroke gradient', (current) => ({
                      ...current,
                      stroke: {
                        ...current.stroke!,
                        gradient: checked ? defaultGradient() : undefined,
                      },
                    }))
                  }
                />
              </div>
              {props.stroke.gradient ? (
                <GradientEditor
                  value={props.stroke.gradient}
                  onChange={(gradient) =>
                    patch('Text stroke gradient', (current) => ({
                      ...current,
                      stroke: { ...current.stroke!, gradient },
                    }))
                  }
                />
              ) : null}
            </>
          ) : (
            <div className="apx-text-v3-empty">Enable Stroke to edit the outline.</div>
          )}
        </Section>

        <Section
          title="Decorations"
          description="Independent underline, overline and strikethrough."
          attr="decorations"
        >
          <DecorationEditor
            label="Underline"
            value={decorations.underline ?? props.underline}
            onChange={(underline) =>
              patch('Text underline', (current) => ({
                ...current,
                decorations: { ...(current.decorations ?? {}), underline },
              }))
            }
          />
          <DecorationEditor
            label="Overline"
            value={decorations.overline ?? props.overline}
            onChange={(overline) =>
              patch('Text overline', (current) => ({
                ...current,
                decorations: { ...(current.decorations ?? {}), overline },
              }))
            }
          />
          <DecorationEditor
            label="Strikethrough"
            value={decorations.strikethrough ?? props.strikethrough}
            onChange={(strikethrough) =>
              patch('Text strikethrough', (current) => ({
                ...current,
                decorations: { ...(current.decorations ?? {}), strikethrough },
              }))
            }
          />
        </Section>
      </>
    );
  }

  if (tab === 'effects') {
    const highlight = effects.highlight ?? props.highlight;
    const glow = effects.glow ?? props.glow;
    const shadow = effects.shadow ?? props.shadow;
    return (
      <>
        {header}
        <div className="apx-text-v3-note">
          <strong>Runtime paint order</strong>
          <span>Highlight → Glow → Shadow → Stroke → Fill → Decorations</span>
        </div>

        <Section
          title="Highlight"
          description="Flat or gradient paint behind text."
          attr="effects-highlight"
          defaultOpen={Boolean(highlight)}
          action={
            <Toggle
              label="Text highlight"
              checked={Boolean(highlight)}
              onChange={(checked) =>
                patch('Text highlight', (current) => ({
                  ...current,
                  effects: {
                    ...(current.effects ?? {}),
                    highlight: checked
                      ? { color: '#ffff00', opacity: 0.3 }
                      : undefined,
                  },
                }))
              }
            />
          }
        >
          {highlight ? (
            <PaintEditor
              name="Highlight"
              color={highlight.color}
              opacity={highlight.opacity ?? 0.3}
              gradient={highlight.gradient}
              fallback="#ffff00"
              onColor={(color) =>
                patch('Text highlight color', (current) => ({
                  ...current,
                  effects: {
                    ...(current.effects ?? {}),
                    highlight: { ...(current.effects?.highlight ?? highlight), color },
                  },
                }))
              }
              onOpacity={(opacity) =>
                patch('Text highlight opacity', (current) => ({
                  ...current,
                  effects: {
                    ...(current.effects ?? {}),
                    highlight: { ...(current.effects?.highlight ?? highlight), opacity },
                  },
                }))
              }
              onGradient={(gradient) =>
                patch('Text highlight gradient', (current) => ({
                  ...current,
                  effects: {
                    ...(current.effects ?? {}),
                    highlight: { ...(current.effects?.highlight ?? highlight), gradient },
                  },
                }))
              }
            />
          ) : (
            <div className="apx-text-v3-empty">Enable Highlight to edit it.</div>
          )}
        </Section>

        <Section
          title="Glow"
          description="Outer glow with color/gradient and intensity."
          attr="effects-glow"
          defaultOpen={Boolean(glow)}
          action={
            <Toggle
              label="Text glow"
              checked={Boolean(glow)}
              onChange={(checked) =>
                patch('Text glow', (current) => ({
                  ...current,
                  effects: {
                    ...(current.effects ?? {}),
                    glow: checked
                      ? { color: '#ffffff', intensity: 10, opacity: 0.8 }
                      : undefined,
                  },
                }))
              }
            />
          }
        >
          {glow ? (
            <>
              <PaintEditor
                name="Glow"
                color={glow.color}
                opacity={glow.opacity ?? 0.8}
                gradient={glow.gradient}
                fallback="#ffffff"
                onColor={(color) =>
                  patch('Text glow color', (current) => ({
                    ...current,
                    effects: {
                      ...(current.effects ?? {}),
                      glow: { ...(current.effects?.glow ?? glow), color },
                    },
                  }))
                }
                onOpacity={(opacity) =>
                  patch('Text glow opacity', (current) => ({
                    ...current,
                    effects: {
                      ...(current.effects ?? {}),
                      glow: { ...(current.effects?.glow ?? glow), opacity },
                    },
                  }))
                }
                onGradient={(gradient) =>
                  patch('Text glow gradient', (current) => ({
                    ...current,
                    effects: {
                      ...(current.effects ?? {}),
                      glow: { ...(current.effects?.glow ?? glow), gradient },
                    },
                  }))
                }
              />
              <NumberField
                label="Intensity"
                value={glow.intensity ?? 10}
                min={0}
                suffix="px"
                onChange={(intensity) =>
                  patch('Text glow intensity', (current) => ({
                    ...current,
                    effects: {
                      ...(current.effects ?? {}),
                      glow: { ...(current.effects?.glow ?? glow), intensity },
                    },
                  }))
                }
              />
            </>
          ) : (
            <div className="apx-text-v3-empty">Enable Glow to edit it.</div>
          )}
        </Section>

        <Section
          title="Shadow"
          description="Drop shadow with offsets, blur and opacity."
          attr="effects-shadow"
          defaultOpen={Boolean(shadow)}
          action={
            <Toggle
              label="Text shadow"
              checked={Boolean(shadow)}
              onChange={(checked) =>
                patch('Text shadow', (current) => ({
                  ...current,
                  effects: {
                    ...(current.effects ?? {}),
                    shadow: checked
                      ? {
                          color: '#000000',
                          offsetX: 2,
                          offsetY: 2,
                          blur: 4,
                          opacity: 1,
                        }
                      : undefined,
                  },
                }))
              }
            />
          }
        >
          {shadow ? (
            <>
              <PaintEditor
                name="Shadow"
                color={shadow.color}
                opacity={shadow.opacity ?? 1}
                gradient={shadow.gradient}
                fallback="#000000"
                onColor={(color) =>
                  patch('Text shadow color', (current) => ({
                    ...current,
                    effects: {
                      ...(current.effects ?? {}),
                      shadow: { ...(current.effects?.shadow ?? shadow), color },
                    },
                  }))
                }
                onOpacity={(opacity) =>
                  patch('Text shadow opacity', (current) => ({
                    ...current,
                    effects: {
                      ...(current.effects ?? {}),
                      shadow: { ...(current.effects?.shadow ?? shadow), opacity },
                    },
                  }))
                }
                onGradient={(gradient) =>
                  patch('Text shadow gradient', (current) => ({
                    ...current,
                    effects: {
                      ...(current.effects ?? {}),
                      shadow: { ...(current.effects?.shadow ?? shadow), gradient },
                    },
                  }))
                }
              />
              <div className="apx-text-v3-grid apx-text-v3-grid--3">
                <NumberField
                  label="Offset X"
                  value={shadow.offsetX ?? 2}
                  onChange={(offsetX) =>
                    patch('Text shadow X', (current) => ({
                      ...current,
                      effects: {
                        ...(current.effects ?? {}),
                        shadow: { ...(current.effects?.shadow ?? shadow), offsetX },
                      },
                    }))
                  }
                />
                <NumberField
                  label="Offset Y"
                  value={shadow.offsetY ?? 2}
                  onChange={(offsetY) =>
                    patch('Text shadow Y', (current) => ({
                      ...current,
                      effects: {
                        ...(current.effects ?? {}),
                        shadow: { ...(current.effects?.shadow ?? shadow), offsetY },
                      },
                    }))
                  }
                />
                <NumberField
                  label="Blur"
                  value={shadow.blur ?? 4}
                  min={0}
                  onChange={(blur) =>
                    patch('Text shadow blur', (current) => ({
                      ...current,
                      effects: {
                        ...(current.effects ?? {}),
                        shadow: { ...(current.effects?.shadow ?? shadow), blur },
                      },
                    }))
                  }
                />
              </div>
            </>
          ) : (
            <div className="apx-text-v3-empty">Enable Shadow to edit it.</div>
          )}
        </Section>

        <Section
          title="Text on curve"
          description="Circular arc typography using the public runtime contract."
          attr="curve"
          defaultOpen={Boolean(props.textOnCurve)}
          action={
            <Toggle
              label="Text on curve"
              checked={Boolean(props.textOnCurve)}
              onChange={(checked) =>
                patch('Text on curve', (current) => ({
                  ...current,
                  textOnCurve: checked
                    ? {
                        sweepAngle: 180,
                        radius: Math.max(1, width / 2),
                        up: true,
                        layoutMode: 'clamp',
                        baselineOffset: 0,
                        startAngleDeg: 0,
                      }
                    : undefined,
                }))
              }
            />
          }
        >
          {props.textOnCurve ? (
            <>
              <div className="apx-text-v3-grid apx-text-v3-grid--2">
                <NumberField
                  label="Sweep angle"
                  value={props.textOnCurve.sweepAngle}
                  min={0.01}
                  max={359.99}
                  suffix="°"
                  onChange={(sweepAngle) =>
                    patch('Text curve sweep', (current) => ({
                      ...current,
                      textOnCurve: { ...current.textOnCurve!, sweepAngle },
                    }))
                  }
                />
                <NumberField
                  label="Radius"
                  value={props.textOnCurve.radius}
                  min={0.01}
                  suffix="px"
                  onChange={(radius) =>
                    patch('Text curve radius', (current) => ({
                      ...current,
                      textOnCurve: { ...current.textOnCurve!, radius },
                    }))
                  }
                />
                <SelectField
                  label="Layout mode"
                  value={props.textOnCurve.layoutMode ?? 'clamp'}
                  options={TEXT_CURVE_MODES}
                  onChange={(layoutMode) =>
                    patch('Text curve layout mode', (current) => ({
                      ...current,
                      textOnCurve: {
                        ...current.textOnCurve!,
                        layoutMode: layoutMode as NonNullable<VisualTextNodeProps['textOnCurve']>['layoutMode'],
                      },
                    }))
                  }
                />
                <NumberField
                  label="Baseline offset"
                  value={props.textOnCurve.baselineOffset ?? 0}
                  suffix="px"
                  onChange={(baselineOffset) =>
                    patch('Text curve baseline', (current) => ({
                      ...current,
                      textOnCurve: { ...current.textOnCurve!, baselineOffset },
                    }))
                  }
                />
                <NumberField
                  label="Start angle"
                  value={props.textOnCurve.startAngleDeg ?? 0}
                  suffix="°"
                  onChange={(startAngleDeg) =>
                    patch('Text curve start angle', (current) => ({
                      ...current,
                      textOnCurve: { ...current.textOnCurve!, startAngleDeg },
                    }))
                  }
                />
              </div>
              <div className="apx-text-v3-toggle-row">
                <span><strong>Upward arc</strong><small>Switch upper/lower arc orientation.</small></span>
                <Toggle
                  label="Curve upward"
                  checked={props.textOnCurve.up !== false}
                  onChange={(up) =>
                    patch('Text curve direction', (current) => ({
                      ...current,
                      textOnCurve: { ...current.textOnCurve!, up },
                    }))
                  }
                />
              </div>
            </>
          ) : (
            <div className="apx-text-v3-empty">Enable Text on curve to configure the arc.</div>
          )}
        </Section>
      </>
    );
  }

  if (tab === 'data') {
    return (
      <>
        {header}
        <Section title="Content" description="Layer identity and text payload." attr="content">
          <label className="apx-text-v3-field">
            <span>Layer name</span>
            <input
              className="apx-text-v3-input"
              value={node.name ?? ''}
              onChange={(event) => onRename(event.target.value)}
            />
          </label>
          <label className="apx-text-v3-field">
            <span>Text</span>
            <textarea
              className="apx-text-v3-textarea"
              rows={5}
              value={props.text}
              data-text-content-editor
              onChange={(event) =>
                patch('Text content', (current) => ({
                  ...current,
                  text: event.target.value,
                }))
              }
            />
          </label>
        </Section>

        <Section
          title="Font registry"
          description="System family or uploaded Studio font asset."
          attr="font-data"
        >
          <label className="apx-text-v3-field">
            <span>Uploaded font asset</span>
            <select
              className="apx-text-v3-select"
              value={fontAssetId ?? ''}
              data-text-font-asset-select
              onChange={(event) => {
                const asset = fontAssets.find((item) => item.id === event.target.value);
                if (!asset) {
                  patch('Detach text font asset', (current) => ({
                    ...current,
                    font: { ...(current.font ?? {}), path: undefined },
                  }));
                  return;
                }
                const family = studioAssetFontFamily(asset);
                patch('Apply text font asset', (current) => ({
                  ...current,
                  font: {
                    ...(current.font ?? {}),
                    family,
                    name: family,
                    path: studioAssetReference(asset),
                  },
                }));
              }}
            >
              <option value="">None / system font</option>
              {fontAssets.map((asset) => (
                <option key={asset.id} value={asset.id}>{asset.name}</option>
              ))}
            </select>
          </label>
          <div className="apx-text-v3-grid apx-text-v3-grid--2">
            <label className="apx-text-v3-field">
              <span>Registered name</span>
              <input
                className="apx-text-v3-input"
                value={font.name ?? font.family ?? ''}
                onChange={(event) =>
                  patch('Text font name', (current) => ({
                    ...current,
                    font: { ...(current.font ?? {}), name: event.target.value || undefined },
                  }))
                }
              />
            </label>
            <label className="apx-text-v3-field">
              <span>Font path</span>
              <input
                className="apx-text-v3-input"
                value={font.path ?? ''}
                onChange={(event) =>
                  patch('Text font path', (current) => ({
                    ...current,
                    font: { ...(current.font ?? {}), path: event.target.value || undefined },
                  }))
                }
              />
            </label>
          </div>
        </Section>

        <Section
          title="measureText()"
          description="Browser approximation using the same font, spacing and wrapping model."
          attr="metrics"
        >
          <MetricsPanel props={props} />
          <div className="apx-text-v3-toggle-row">
            <span>
              <strong>Character metrics</strong>
              <small>Request grapheme-aware charWidths and charPositions.</small>
            </span>
            <Toggle
              label="Include character metrics"
              checked={props.includeCharMetrics ?? false}
              onChange={(includeCharMetrics) =>
                patch('Text character metrics', (current) => ({
                  ...current,
                  includeCharMetrics,
                }))
              }
            />
          </div>
          <div className="apx-text-v3-grid apx-text-v3-grid--2">
            <NumberField
              label="Measurement width"
              value={props.measurementCanvas?.width}
              min={1}
              step={1}
              suffix="px"
              onChange={(measurementWidth) =>
                patch('Measurement width', (current) => ({
                  ...current,
                  measurementCanvas: {
                    ...(current.measurementCanvas ?? {}),
                    width: Math.round(measurementWidth),
                  },
                }))
              }
            />
            <NumberField
              label="Measurement height"
              value={props.measurementCanvas?.height}
              min={1}
              step={1}
              suffix="px"
              onChange={(measurementHeight) =>
                patch('Measurement height', (current) => ({
                  ...current,
                  measurementCanvas: {
                    ...(current.measurementCanvas ?? {}),
                    height: Math.round(measurementHeight),
                  },
                }))
              }
            />
          </div>
        </Section>

        <Section
          title="Runtime asset references"
          description="ApexPainter resolves $asset and $palette references only when explicitly enabled."
          attr="asset-refs"
        >
          <div className="apx-text-v3-toggle-row">
            <span>
              <strong>Resolve asset references</strong>
              <small>Emit the public third createText() painterOpts argument.</small>
            </span>
            <Toggle
              label="Resolve text asset references"
              checked={props.painterOpts?.resolveAssetRefs ?? false}
              onChange={(resolveAssetRefs) =>
                patch('Text asset refs', (current) => ({
                  ...current,
                  painterOpts: resolveAssetRefs
                    ? { resolveAssetRefs: true }
                    : undefined,
                }))
              }
            />
          </div>
        </Section>
      </>
    );
  }

  const legacyCount = [
    props.fontSize,
    props.fontFamily,
    props.fontName,
    props.fontPath,
    props.bold,
    props.italic,
    props.underline,
    props.overline,
    props.strikethrough,
    props.highlight,
    props.glow,
    props.shadow,
    props.lineHeight,
    props.letterSpacing,
    props.wordSpacing,
    props.maxWidth,
    props.maxHeight,
    props.textAlign,
    props.textBaseline,
    props.rotation,
    props.color,
    props.gradient,
    props.opacity,
  ].filter((item) => item !== undefined).length;

  return (
    <>
      {header}
      <Section
        title="Runtime contract"
        description="Pinned Apexify.js createText() accepts TextProperties, canvasBuffer and optional painterOpts."
        attr="advanced-contract"
      >
        <div className="apx-text-v3-note">
          <strong>Exact call shape</strong>
          <span>await painter.createText(textPropertiesOrArray, canvasBuffer, painterOpts?)</span>
        </div>
        <div className="apx-text-v3-note">
          <strong>No hidden group transform options</strong>
          <span>There is no createText isGrouped, groupTransform, scale, skew or perspective option. painterOpts only owns resolveAssetRefs.</span>
        </div>
      </Section>
      <Section
        title="Legacy TextProperties aliases"
        description="Deprecated flat aliases remain readable; nested groups take precedence."
        attr="legacy"
        defaultOpen={legacyCount > 0}
      >
        <div className="apx-text-v3-batch-summary">
          <strong>{legacyCount} legacy fields present</strong>
          <span>
            fontSize/fontFamily/fontName/fontPath, bold/italic, decoration/effect aliases,
            layout aliases, alignment/baseline/rotation and fill aliases are supported for round-trip compatibility.
          </span>
        </div>
      </Section>
    </>
  );
}

export function VisualTextBatchInspector({
  node,
  tab,
  onChange,
  onRename,
}: BatchInspectorProps) {
  const batch = visualTextBatchGroupProps(node);
  if (!batch) return null;
  const childCount = node.childIds?.length ?? 0;
  const header = (
    <Header
      name={node.name ?? 'Text batch'}
      detail={childCount + ' text layers · one ordered array call'}
      badge="createText([...])"
    />
  );

  if (tab === 'data') {
    return (
      <>
        {header}
        <Section title="Batch identity" description="Layer order is runtime array order." attr="batch-data">
          <label className="apx-text-v3-field">
            <span>Name</span>
            <input
              className="apx-text-v3-input"
              value={node.name ?? ''}
              onChange={(event) => onRename(event.target.value)}
            />
          </label>
          <div className="apx-text-v3-batch-summary">
            <strong>{childCount} TextProperties objects</strong>
            <span>Later child layers paint over earlier child layers on the same canvas.</span>
          </div>
        </Section>
        <Section
          title="Runtime asset references"
          description="The optional third createText() argument applies to the whole array call."
          attr="batch-asset-refs"
        >
          <div className="apx-text-v3-toggle-row">
            <span>
              <strong>Resolve asset references</strong>
              <small>Resolve $asset / $palette references for every TextProperties item.</small>
            </span>
            <Toggle
              label="Resolve text batch asset references"
              checked={batch.painterOpts?.resolveAssetRefs ?? false}
              onChange={(resolveAssetRefs) =>
                onChange('Text batch asset refs', (current) => ({
                  ...current,
                  painterOpts: resolveAssetRefs
                    ? { resolveAssetRefs: true }
                    : undefined,
                }))
              }
            />
          </div>
        </Section>
      </>
    );
  }

  if (tab === 'advanced') {
    return (
      <>
        {header}
        <Section
          title="Batch runtime contract"
          description="Exact public createText(TextProperties[], canvasBuffer, painterOpts?) behavior."
          attr="batch-advanced"
        >
          <div className="apx-text-v3-note">
            <strong>One array call</strong>
            <span>Grouping text layers changes code generation to one createText([...]) call.</span>
          </div>
          <div className="apx-text-v3-note">
            <strong>No group transform API</strong>
            <span>The pinned Apexify.js runtime renders array items sequentially. Shared batch opacity, blend, scale, skew, perspective and isGrouped controls are intentionally not exposed.</span>
          </div>
        </Section>
      </>
    );
  }

  return (
    <>
      {header}
      <div className="apx-text-v3-empty apx-text-v3-empty--standalone">
        <strong>Batch selection</strong>
        <span>
          {tab === 'transform'
            ? 'Transform each text child independently; the public createText array API has no shared batch transform.'
            : tab === 'style'
              ? 'Style is owned by each TextProperties child. Select a child layer to edit typography, fill, stroke and decorations.'
              : 'Effects are owned by each TextProperties child. Select a child layer to edit highlight, glow, shadow or text-on-curve.'}
        </span>
      </div>
    </>
  );
}
