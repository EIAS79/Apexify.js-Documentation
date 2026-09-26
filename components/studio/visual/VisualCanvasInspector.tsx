'use client';

import { useState, type ReactNode } from 'react';
import {
  AdjustmentsHorizontalIcon,
  ArrowsPointingOutIcon,
  CircleStackIcon,
  CodeBracketIcon,
  FilmIcon,
  PaintBrushIcon,
  PlusIcon,
  SparklesIcon,
  Squares2X2Icon,
  SwatchIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import {
  CANVAS_ALIGNMENTS,
  CANVAS_BLEND_MODES,
  CANVAS_FITS,
  CANVAS_PATTERN_TYPES,
  defaultBackgroundLayer,
  defaultCanvasGradient,
  defaultCanvasPattern,
} from '@/lib/studio/visual/canvas-contract';
import { IMAGE_FILTER_TYPES } from '@/lib/studio/visual/image-contract';
import { studioAssetReference, type StudioVirtualAsset } from '@/lib/studio/runtime/assets';
import type {
  VisualBackgroundLayer,
  VisualCanvasConfig,
  VisualGradient,
  VisualImageFilter,
  VisualPatternGradient,
  VisualPatternOptions,
  VisualProject,
  VisualShadowOptions,
  VisualStrokeOptions,
} from '@/lib/studio/visual/model';

export type VisualCanvasInspectorTab =
  | 'style'
  | 'transform'
  | 'effects'
  | 'data'
  | 'advanced';

type Props = {
  project: VisualProject;
  tab: VisualCanvasInspectorTab;
  assets: StudioVirtualAsset[];
  onRename: (name: string) => void;
  onBeginEdit: () => void;
  onEndEdit: (label: string) => void;
  onDraft: (updater: (canvas: VisualCanvasConfig) => VisualCanvasConfig) => void;
  onMutate: (
    label: string,
    updater: (canvas: VisualCanvasConfig) => VisualCanvasConfig,
  ) => void;
  onResizeDraft: (key: 'width' | 'height', value: number) => void;
  onMessage: (message: string) => void;
  onOpenVideoEditor?: (assetId?: string) => void;
};

type SectionProps = {
  title: string;
  description?: string;
  icon?: typeof SwatchIcon;
  action?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  badge?: string;
};

type NumericKey =
  | 'intensity'
  | 'radius'
  | 'angle'
  | 'centerX'
  | 'centerY'
  | 'value'
  | 'levels'
  | 'size';

const BORDER_POSITIONS = [
  'all',
  'top',
  'left',
  'right',
  'bottom',
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
] as const;

const REPEAT_MODES = ['repeat', 'repeat-x', 'repeat-y', 'no-repeat'] as const;
const GRADIENT_REPEATS = ['no-repeat', 'repeat', 'reflect'] as const;
const STROKE_STYLES = ['solid', 'dashed', 'dotted', 'groove', 'ridge', 'double'] as const;

const FILTER_FIELDS: Record<VisualImageFilter['type'], NumericKey[]> = {
  gaussianBlur: ['radius', 'intensity'],
  motionBlur: ['radius', 'angle', 'intensity'],
  radialBlur: ['radius', 'centerX', 'centerY', 'intensity'],
  sharpen: ['intensity'],
  noise: ['intensity'],
  grain: ['intensity', 'size'],
  edgeDetection: ['intensity'],
  emboss: ['intensity', 'angle'],
  invert: ['intensity'],
  grayscale: ['intensity'],
  sepia: ['intensity'],
  pixelate: ['size'],
  brightness: ['value'],
  contrast: ['value'],
  saturation: ['value'],
  hueShift: ['value'],
  posterize: ['levels'],
};

function safeColor(value: string | undefined, fallback: string) {
  return /^#[0-9a-f]{6}$/i.test(value ?? '') ? value! : fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function titleCase(value: string) {
  return value
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]/g, ' ')
    .replace(/^./, (letter) => letter.toUpperCase());
}

function Section({
  title,
  description,
  icon: Icon,
  action,
  children,
  defaultOpen = true,
  badge,
}: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <details
      className="apx-canvas-v2-section"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>
        <span className="apx-canvas-v2-section-icon">
          {Icon ? <Icon aria-hidden /> : <span />}
        </span>
        <span className="apx-canvas-v2-section-copy">
          <strong>{title}</strong>
          {description ? <small>{description}</small> : null}
        </span>
        {badge ? <span className="apx-canvas-v2-badge">{badge}</span> : null}
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
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
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

function ColorField({
  label,
  value,
  fallback,
  onChange,
  onFocus,
  onBlur,
}: {
  label: string;
  value: string;
  fallback: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  return (
    <label className="apx-canvas-v2-field">
      <span>{label}</span>
      <div className="apx-canvas-v2-color">
        <input
          type="color"
          aria-label={label + ' picker'}
          value={safeColor(value, fallback)}
          onChange={(event) => onChange(event.target.value)}
        />
        <input
          className="apx-canvas-v2-input"
          aria-label={label}
          value={value}
          onFocus={onFocus}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
        />
      </div>
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  disabled,
  suffix,
  onFocus,
  onBlur,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  suffix?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  return (
    <label className="apx-canvas-v2-field">
      <span>{label}</span>
      <div className="apx-canvas-v2-number">
        <input
          className="apx-canvas-v2-input"
          type="number"
          value={Number.isFinite(value) ? value : 0}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          onFocus={onFocus}
          onChange={(event) => onChange(Number(event.target.value))}
          onBlur={onBlur}
        />
        {suffix ? <small>{suffix}</small> : null}
      </div>
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="apx-canvas-v2-field">
      <span>{label}</span>
      <select
        className="apx-canvas-v2-input"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {titleCase(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

function MultiPositionField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const selected = new Set(
    (value || 'all')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  );
  const toggle = (option: string) => {
    if (option === 'all') {
      onChange('all');
      return;
    }
    const next = new Set(selected.has('all') ? [] : selected);
    if (next.has(option)) next.delete(option);
    else next.add(option);
    onChange(next.size ? [...next].join(',') : 'all');
  };

  return (
    <div className="apx-canvas-v2-field">
      <span>{label}</span>
      <div
        className="apx-canvas-v2-multi"
        role="group"
        aria-label={label}
      >
        {BORDER_POSITIONS.map((option) => (
          <button
            key={option}
            type="button"
            data-active={
              selected.has('all')
                ? option === 'all'
                  ? 'true'
                  : undefined
                : selected.has(option)
                  ? 'true'
                  : undefined
            }
            onClick={() => toggle(option)}
          >
            {titleCase(option)}
          </button>
        ))}
      </div>
      <small className="apx-canvas-v2-field-hint">
        Select multiple positions. “All” resets the selection.
      </small>
    </div>
  );
}

function RangeField({
  label,
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
  format = (current) => Math.round(current * 100) + '%',
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  format?: (value: number) => string;
}) {
  return (
    <label className="apx-canvas-v2-field">
      <span className="apx-canvas-v2-range-label">
        <span>{label}</span>
        <strong>{format(value)}</strong>
      </span>
      <input
        className="apx-canvas-v2-range"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function GradientEditor({
  gradient,
  onChange,
  compact = false,
}: {
  gradient: VisualGradient;
  onChange: (gradient: VisualGradient) => void;
  compact?: boolean;
}) {
  const setType = (type: VisualGradient['type']) => {
    const colors = gradient.colors;
    if (type === 'linear') {
      onChange({
        type,
        colors,
        startX: 0,
        startY: 0,
        endX: 1000,
        endY: 0,
        rotate: 0,
        repeat: 'no-repeat',
      });
      return;
    }
    if (type === 'radial') {
      onChange({
        type,
        colors,
        startX: 500,
        startY: 300,
        startRadius: 0,
        endX: 500,
        endY: 300,
        endRadius: 500,
        repeat: 'no-repeat',
      });
      return;
    }
    onChange({
      type,
      colors,
      centerX: 500,
      centerY: 300,
      startAngle: 0,
      rotate: 0,
    });
  };

  const patch = (value: Partial<VisualGradient>) =>
    onChange({ ...gradient, ...value } as VisualGradient);

  const patchStop = (
    index: number,
    value: Partial<VisualGradient['colors'][number]>,
  ) => {
    const colors = gradient.colors.map((stop, stopIndex) =>
      stopIndex === index ? { ...stop, ...value } : stop,
    );
    patch({ colors } as Partial<VisualGradient>);
  };

  return (
    <div className="apx-canvas-v2-editor" data-compact={compact ? 'true' : undefined}>
      <div className="apx-canvas-v2-grid apx-canvas-v2-grid--2">
        <SelectField
          label="Gradient type"
          value={gradient.type}
          options={['linear', 'radial', 'conic']}
          onChange={(value) => setType(value as VisualGradient['type'])}
        />
        {gradient.type !== 'conic' ? (
          <SelectField
            label="Repeat"
            value={gradient.repeat ?? 'no-repeat'}
            options={GRADIENT_REPEATS}
            onChange={(value) =>
              patch({ repeat: value as 'repeat' | 'reflect' | 'no-repeat' } as Partial<VisualGradient>)
            }
          />
        ) : (
          <NumberField
            label="Start angle"
            value={gradient.startAngle ?? 0}
            onChange={(value) => patch({ startAngle: value } as Partial<VisualGradient>)}
            suffix="°"
          />
        )}
      </div>

      {gradient.type === 'linear' ? (
        <div className="apx-canvas-v2-grid apx-canvas-v2-grid--2">
          <NumberField label="Start X" value={gradient.startX ?? 0} onChange={(value) => patch({ startX: value })} />
          <NumberField label="Start Y" value={gradient.startY ?? 0} onChange={(value) => patch({ startY: value })} />
          <NumberField label="End X" value={gradient.endX ?? 1000} onChange={(value) => patch({ endX: value })} />
          <NumberField label="End Y" value={gradient.endY ?? 0} onChange={(value) => patch({ endY: value })} />
        </div>
      ) : null}

      {gradient.type === 'radial' ? (
        <div className="apx-canvas-v2-grid apx-canvas-v2-grid--2">
          <NumberField label="Start X" value={gradient.startX ?? 0} onChange={(value) => patch({ startX: value })} />
          <NumberField label="Start Y" value={gradient.startY ?? 0} onChange={(value) => patch({ startY: value })} />
          <NumberField label="Start radius" value={gradient.startRadius ?? 0} min={0} onChange={(value) => patch({ startRadius: value })} />
          <NumberField label="End X" value={gradient.endX ?? 0} onChange={(value) => patch({ endX: value })} />
          <NumberField label="End Y" value={gradient.endY ?? 0} onChange={(value) => patch({ endY: value })} />
          <NumberField label="End radius" value={gradient.endRadius ?? 500} min={0} onChange={(value) => patch({ endRadius: value })} />
        </div>
      ) : null}

      {gradient.type === 'conic' ? (
        <div className="apx-canvas-v2-grid apx-canvas-v2-grid--2">
          <NumberField label="Center X" value={gradient.centerX ?? 0} onChange={(value) => patch({ centerX: value })} />
          <NumberField label="Center Y" value={gradient.centerY ?? 0} onChange={(value) => patch({ centerY: value })} />
        </div>
      ) : null}

      <div className="apx-canvas-v2-grid apx-canvas-v2-grid--3">
        <NumberField label="Rotate" value={gradient.rotate ?? 0} onChange={(value) => patch({ rotate: value } as Partial<VisualGradient>)} suffix="°" />
        <NumberField label="Pivot X" value={gradient.pivotX ?? 0} onChange={(value) => patch({ pivotX: value } as Partial<VisualGradient>)} />
        <NumberField label="Pivot Y" value={gradient.pivotY ?? 0} onChange={(value) => patch({ pivotY: value } as Partial<VisualGradient>)} />
      </div>

      <div className="apx-canvas-v2-stops">
        <div className="apx-canvas-v2-subhead">
          <strong>Color stops</strong>
          <button
            type="button"
            onClick={() =>
              patch({
                colors: [...gradient.colors, { stop: 1, color: '#ffffff' }].sort(
                  (a, b) => a.stop - b.stop,
                ),
              } as Partial<VisualGradient>)
            }
          >
            <PlusIcon aria-hidden /> Add
          </button>
        </div>
        {gradient.colors.map((stop, index) => (
          <div className="apx-canvas-v2-stop" key={index}>
            <input
              type="color"
              aria-label={'Gradient stop ' + String(index + 1)}
              value={safeColor(stop.color, '#ffffff')}
              onChange={(event) => patchStop(index, { color: event.target.value })}
            />
            <input
              className="apx-canvas-v2-input"
              value={stop.color}
              onChange={(event) => patchStop(index, { color: event.target.value })}
            />
            <div className="apx-canvas-v2-number apx-canvas-v2-stop-value">
              <input
                className="apx-canvas-v2-input"
                type="number"
                min={0}
                max={100}
                value={Math.round(stop.stop * 100)}
                onChange={(event) =>
                  patchStop(index, {
                    stop: clamp(Number(event.target.value) / 100, 0, 1),
                  })
                }
              />
              <small>%</small>
            </div>
            <button
              className="apx-canvas-v2-icon-button"
              type="button"
              disabled={gradient.colors.length <= 2}
              onClick={() =>
                patch({
                  colors: gradient.colors.filter((_, stopIndex) => stopIndex !== index),
                } as Partial<VisualGradient>)
              }
              aria-label="Remove gradient stop"
            >
              <TrashIcon aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function PatternGradientEditor({
  gradient,
  onChange,
}: {
  gradient: VisualPatternGradient;
  onChange: (gradient: VisualPatternGradient) => void;
}) {
  const patch = (value: Partial<VisualPatternGradient>) =>
    onChange({ ...gradient, ...value });

  const patchStop = (
    index: number,
    value: Partial<VisualPatternGradient['colors'][number]>,
  ) => {
    patch({
      colors: gradient.colors.map((stop, stopIndex) =>
        stopIndex === index ? { ...stop, ...value } : stop,
      ),
    });
  };

  return (
    <div className="apx-canvas-v2-editor apx-canvas-v2-editor--nested">
      <div className="apx-canvas-v2-grid apx-canvas-v2-grid--2">
        <SelectField
          label="Pattern gradient type"
          value={gradient.type}
          options={['linear', 'radial', 'conic']}
          onChange={(value) =>
            patch({
              type: value as VisualPatternGradient['type'],
            })
          }
        />
        <SelectField
          label="Repeat"
          value={gradient.repeat ?? 'no-repeat'}
          options={GRADIENT_REPEATS}
          onChange={(value) =>
            patch({
              repeat: value as VisualPatternGradient['repeat'],
            })
          }
        />
      </div>

      {gradient.type === 'linear' ? (
        <div className="apx-canvas-v2-grid apx-canvas-v2-grid--2">
          <NumberField label="Start X" value={gradient.startX ?? 0} onChange={(startX) => patch({ startX })} />
          <NumberField label="Start Y" value={gradient.startY ?? 0} onChange={(startY) => patch({ startY })} />
          <NumberField label="End X" value={gradient.endX ?? 1000} onChange={(endX) => patch({ endX })} />
          <NumberField label="End Y" value={gradient.endY ?? 0} onChange={(endY) => patch({ endY })} />
          <NumberField label="Angle" value={gradient.angle ?? 0} onChange={(angle) => patch({ angle })} suffix="°" />
        </div>
      ) : null}

      {gradient.type === 'radial' ? (
        <div className="apx-canvas-v2-grid apx-canvas-v2-grid--2">
          <NumberField label="Start X" value={gradient.startX ?? 0} onChange={(startX) => patch({ startX })} />
          <NumberField label="Start Y" value={gradient.startY ?? 0} onChange={(startY) => patch({ startY })} />
          <NumberField label="End X" value={gradient.endX ?? 0} onChange={(endX) => patch({ endX })} />
          <NumberField label="End Y" value={gradient.endY ?? 0} onChange={(endY) => patch({ endY })} />
          <NumberField label="Start radius" value={gradient.startRadius ?? 0} min={0} onChange={(startRadius) => patch({ startRadius })} />
          <NumberField label="End radius" value={gradient.endRadius ?? 500} min={0} onChange={(endRadius) => patch({ endRadius })} />
        </div>
      ) : null}

      {gradient.type === 'conic' ? (
        <div className="apx-canvas-v2-grid apx-canvas-v2-grid--2">
          <NumberField label="Center X" value={gradient.centerX ?? 0} onChange={(centerX) => patch({ centerX })} />
          <NumberField label="Center Y" value={gradient.centerY ?? 0} onChange={(centerY) => patch({ centerY })} />
          <NumberField label="Start angle" value={gradient.startAngle ?? 0} onChange={(startAngle) => patch({ startAngle })} suffix="°" />
        </div>
      ) : null}

      <div className="apx-canvas-v2-stops">
        <div className="apx-canvas-v2-subhead">
          <strong>Pattern gradient stops</strong>
          <button
            type="button"
            onClick={() =>
              patch({
                colors: [...gradient.colors, { stop: 1, color: '#ffffff' }].sort(
                  (a, b) => a.stop - b.stop,
                ),
              })
            }
          >
            <PlusIcon aria-hidden /> Add
          </button>
        </div>
        {gradient.colors.map((stop, index) => (
          <div className="apx-canvas-v2-stop" key={index}>
            <input
              type="color"
              value={safeColor(stop.color, '#ffffff')}
              onChange={(event) => patchStop(index, { color: event.target.value })}
            />
            <input
              className="apx-canvas-v2-input"
              value={stop.color}
              onChange={(event) => patchStop(index, { color: event.target.value })}
            />
            <div className="apx-canvas-v2-number apx-canvas-v2-stop-value">
              <input
                className="apx-canvas-v2-input"
                type="number"
                min={0}
                max={100}
                value={Math.round(stop.stop * 100)}
                onChange={(event) =>
                  patchStop(index, {
                    stop: clamp(Number(event.target.value) / 100, 0, 1),
                  })
                }
              />
              <small>%</small>
            </div>
            <button
              className="apx-canvas-v2-icon-button"
              type="button"
              disabled={gradient.colors.length <= 2}
              onClick={() =>
                patch({
                  colors: gradient.colors.filter(
                    (_, stopIndex) => stopIndex !== index,
                  ),
                })
              }
              aria-label="Remove pattern gradient stop"
            >
              <TrashIcon aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function PatternEditor({
  pattern,
  onChange,
}: {
  pattern: VisualPatternOptions;
  onChange: (pattern: VisualPatternOptions) => void;
}) {
  const patch = (value: Partial<VisualPatternOptions>) =>
    onChange({ ...pattern, ...value });

  const paintMode = pattern.gradient ? 'gradient' : 'color';

  const setPaintMode = (mode: 'color' | 'gradient') => {
    if (mode === 'gradient') {
      const first = pattern.color ?? '#315078';
      const second = pattern.secondaryColor ?? '#7c3aed';
      const next: VisualPatternOptions = {
        ...pattern,
        gradient: {
          type: 'linear',
          startX: 0,
          startY: 0,
          endX: 1000,
          endY: 0,
          angle: 0,
          repeat: 'no-repeat',
          colors: [
            { stop: 0, color: first },
            { stop: 1, color: second },
          ],
        },
      };
      delete next.color;
      delete next.secondaryColor;
      onChange(next);
      return;
    }

    const first = pattern.gradient?.colors?.[0]?.color ?? '#315078';
    const last =
      pattern.gradient?.colors?.[pattern.gradient.colors.length - 1]?.color ??
      '#152943';
    const next: VisualPatternOptions = {
      ...pattern,
      color: first,
      secondaryColor: last,
    };
    delete next.gradient;
    onChange(next);
  };

  return (
    <div className="apx-canvas-v2-editor">
      <div className="apx-canvas-v2-grid apx-canvas-v2-grid--2">
        <SelectField
          label="Pattern"
          value={pattern.type}
          options={CANVAS_PATTERN_TYPES}
          onChange={(value) =>
            patch({ type: value as VisualPatternOptions['type'] })
          }
        />
        <SelectField
          label="Repeat"
          value={pattern.repeat ?? 'repeat'}
          options={REPEAT_MODES}
          onChange={(value) =>
            patch({ repeat: value as VisualPatternOptions['repeat'] })
          }
        />
      </div>

      <div className="apx-canvas-v2-field">
        <span>Pattern paint</span>
        <div className="apx-canvas-v2-segmented apx-canvas-v2-segmented--2">
          <button
            type="button"
            data-active={paintMode === 'color' ? 'true' : undefined}
            onClick={() => setPaintMode('color')}
          >
            Primary / secondary
          </button>
          <button
            type="button"
            data-active={paintMode === 'gradient' ? 'true' : undefined}
            onClick={() => setPaintMode('gradient')}
          >
            Gradient
          </button>
        </div>
      </div>

      {paintMode === 'color' ? (
        <div className="apx-canvas-v2-grid apx-canvas-v2-grid--2">
          <ColorField
            label="Primary"
            value={pattern.color ?? '#315078'}
            fallback="#315078"
            onChange={(value) => patch({ color: value })}
          />
          <ColorField
            label="Secondary"
            value={pattern.secondaryColor ?? '#152943'}
            fallback="#152943"
            onChange={(value) => patch({ secondaryColor: value })}
          />
        </div>
      ) : pattern.gradient ? (
        <PatternGradientEditor
          gradient={pattern.gradient}
          onChange={(gradient) => {
            const next: VisualPatternOptions = { ...pattern, gradient };
            delete next.color;
            delete next.secondaryColor;
            onChange(next);
          }}
        />
      ) : null}

      <div className="apx-canvas-v2-grid apx-canvas-v2-grid--3">
        <NumberField label="Size" value={pattern.size ?? 1} min={0.01} step={1} onChange={(value) => patch({ size: value })} />
        <NumberField label="Spacing" value={pattern.spacing ?? 32} min={0} onChange={(value) => patch({ spacing: value })} />
        <NumberField label="Rotation" value={pattern.rotation ?? 0} onChange={(value) => patch({ rotation: value })} suffix="°" />
        <NumberField label="Scale" value={pattern.scale ?? 1} min={0.01} step={0.1} onChange={(value) => patch({ scale: value })} />
        <NumberField label="Offset X" value={pattern.offsetX ?? 0} onChange={(value) => patch({ offsetX: value })} />
        <NumberField label="Offset Y" value={pattern.offsetY ?? 0} onChange={(value) => patch({ offsetY: value })} />
      </div>

      <RangeField
        label="Pattern opacity"
        value={pattern.opacity ?? 1}
        onChange={(value) => patch({ opacity: value })}
      />

      <SelectField
        label="Pattern blend"
        value={pattern.blendMode ?? 'source-over'}
        options={CANVAS_BLEND_MODES}
        onChange={(value) =>
          patch({ blendMode: value as VisualPatternOptions['blendMode'] })
        }
      />

      <div className="apx-canvas-v2-callout apx-canvas-v2-callout--info">
        <strong>Paint and blend are independent</strong>
        <span>
          Pattern paint is either primary/secondary colors or one gradient.
          Blend mode is applied afterward when the finished pattern layer is
          composited onto the canvas. Source over preserves authored colors.
        </span>
      </div>

      {pattern.type === 'custom' ? (
        <label className="apx-canvas-v2-field">
          <span>Custom pattern image</span>
          <input
            className="apx-canvas-v2-input"
            placeholder="studio://asset/... or URL"
            value={pattern.customPatternImage ?? ''}
            onChange={(event) => patch({ customPatternImage: event.target.value })}
          />
        </label>
      ) : null}
    </div>
  );
}

function defaultFilter(type: VisualImageFilter['type']): VisualImageFilter {
  if (type === 'pixelate') return { type, size: 8 };
  if (type === 'posterize') return { type, levels: 6 };
  if (['brightness', 'contrast', 'saturation'].includes(type)) {
    return { type, value: 1 };
  }
  if (type === 'hueShift') return { type, value: 0 };
  if (type === 'gaussianBlur') return { type, radius: 4 };
  if (type === 'motionBlur') return { type, radius: 8, angle: 0 };
  if (type === 'radialBlur') {
    return { type, radius: 8, centerX: 0.5, centerY: 0.5 };
  }
  return { type, intensity: 1 };
}

function FilterEditor({
  filters,
  onChange,
}: {
  filters: VisualImageFilter[];
  onChange: (filters: VisualImageFilter[]) => void;
}) {
  const update = (index: number, next: VisualImageFilter) =>
    onChange(filters.map((filter, filterIndex) => (filterIndex === index ? next : filter)));

  return (
    <div className="apx-canvas-v2-filter-stack">
      <div className="apx-canvas-v2-subhead">
        <div>
          <strong>Image filters</strong>
          <small>Applied to customBg before it reaches the canvas.</small>
        </div>
        <button
          type="button"
          onClick={() => onChange([...filters, defaultFilter('brightness')])}
        >
          <PlusIcon aria-hidden /> Filter
        </button>
      </div>

      {filters.length ? (
        filters.map((filter, index) => (
          <div className="apx-canvas-v2-filter-card" key={index}>
            <div className="apx-canvas-v2-card-head">
              <select
                className="apx-canvas-v2-input"
                value={filter.type}
                onChange={(event) =>
                  update(
                    index,
                    defaultFilter(event.target.value as VisualImageFilter['type']),
                  )
                }
              >
                {IMAGE_FILTER_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {titleCase(type)}
                  </option>
                ))}
              </select>
              <button
                className="apx-canvas-v2-icon-button"
                type="button"
                onClick={() =>
                  onChange(filters.filter((_, filterIndex) => filterIndex !== index))
                }
                aria-label="Remove filter"
              >
                <TrashIcon aria-hidden />
              </button>
            </div>
            <div className="apx-canvas-v2-grid apx-canvas-v2-grid--2">
              {FILTER_FIELDS[filter.type].map((key) => (
                <NumberField
                  key={key}
                  label={titleCase(key)}
                  value={filter[key] ?? 0}
                  step={key === 'centerX' || key === 'centerY' ? 0.1 : 1}
                  onChange={(value) =>
                    update(index, { ...filter, [key]: value })
                  }
                />
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="apx-canvas-v2-empty-mini">
          No filters. The image is rendered without filter processing.
        </div>
      )}
    </div>
  );
}

function StrokeEditor({
  stroke,
  onChange,
}: {
  stroke: VisualStrokeOptions;
  onChange: (stroke: VisualStrokeOptions) => void;
}) {
  const patch = (value: Partial<VisualStrokeOptions>) =>
    onChange({ ...stroke, ...value });
  const paintMode = stroke.gradient ? 'gradient' : 'color';

  return (
    <div className="apx-canvas-v2-editor">
      <div className="apx-canvas-v2-segmented apx-canvas-v2-segmented--2">
        {(['color', 'gradient'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            data-active={paintMode === mode ? 'true' : undefined}
            onClick={() => {
              if (mode === 'gradient') {
                const next = { ...stroke, gradient: defaultCanvasGradient() };
                delete next.color;
                onChange(next);
              } else {
                const next = { ...stroke, color: '#ffffff' };
                delete next.gradient;
                onChange(next);
              }
            }}
          >
            {titleCase(mode)}
          </button>
        ))}
      </div>

      {paintMode === 'gradient' && stroke.gradient ? (
        <GradientEditor
          gradient={stroke.gradient}
          onChange={(gradient) => patch({ gradient })}
          compact
        />
      ) : (
        <ColorField
          label="Stroke color"
          value={stroke.color ?? '#ffffff'}
          fallback="#ffffff"
          onChange={(color) => patch({ color })}
        />
      )}

      <div className="apx-canvas-v2-grid apx-canvas-v2-grid--3">
        <NumberField label="Width" value={stroke.width ?? 1} min={0} onChange={(width) => patch({ width })} />
        <NumberField label="Position" value={stroke.position ?? 0} onChange={(position) => patch({ position })} />
        <NumberField label="Blur" value={stroke.blur ?? 0} min={0} onChange={(blur) => patch({ blur })} />
      </div>
      <RangeField label="Stroke opacity" value={stroke.opacity ?? 1} onChange={(opacity) => patch({ opacity })} />
      <div className="apx-canvas-v2-grid apx-canvas-v2-grid--2">
        <SelectField
          label="Style"
          value={stroke.style ?? 'solid'}
          options={STROKE_STYLES}
          onChange={(value) =>
            patch({ style: value as VisualStrokeOptions['style'] })
          }
        />
        <MultiPositionField
          label="Stroke sides"
          value={stroke.borderPosition ?? 'all'}
          onChange={(borderPosition) => patch({ borderPosition })}
        />
      </div>
      <div className="apx-canvas-v2-grid apx-canvas-v2-grid--2">
        <label className="apx-canvas-v2-field">
          <span>Stroke radius</span>
          <input
            className="apx-canvas-v2-input"
            type="number"
            min={0}
            disabled={stroke.borderRadius === 'circular'}
            value={typeof stroke.borderRadius === 'number' ? stroke.borderRadius : 0}
            onChange={(event) => patch({ borderRadius: Number(event.target.value) })}
          />
        </label>
        <label className="apx-canvas-v2-check-card">
          <input
            type="checkbox"
            checked={stroke.borderRadius === 'circular'}
            onChange={(event) =>
              patch({ borderRadius: event.target.checked ? 'circular' : 0 })
            }
          />
          <span>
            <strong>Circular stroke</strong>
            <small>Use circular radius semantics.</small>
          </span>
        </label>
      </div>
      <MultiPositionField
        label="Rounded corners"
        value={stroke.roundedCorners ?? 'all'}
        onChange={(roundedCorners) => patch({ roundedCorners })}
      />
    </div>
  );
}

function ShadowEditor({
  shadow,
  onChange,
}: {
  shadow: VisualShadowOptions;
  onChange: (shadow: VisualShadowOptions) => void;
}) {
  const patch = (value: Partial<VisualShadowOptions>) =>
    onChange({ ...shadow, ...value });
  const paintMode = shadow.gradient ? 'gradient' : 'color';

  return (
    <div className="apx-canvas-v2-editor">
      <div className="apx-canvas-v2-segmented apx-canvas-v2-segmented--2">
        {(['color', 'gradient'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            data-active={paintMode === mode ? 'true' : undefined}
            onClick={() => {
              if (mode === 'gradient') {
                const next = { ...shadow, gradient: defaultCanvasGradient() };
                delete next.color;
                onChange(next);
              } else {
                const next = { ...shadow, color: '#000000' };
                delete next.gradient;
                onChange(next);
              }
            }}
          >
            {titleCase(mode)}
          </button>
        ))}
      </div>

      {paintMode === 'gradient' && shadow.gradient ? (
        <GradientEditor
          gradient={shadow.gradient}
          onChange={(gradient) => patch({ gradient })}
          compact
        />
      ) : (
        <ColorField
          label="Shadow color"
          value={shadow.color ?? '#000000'}
          fallback="#000000"
          onChange={(color) => patch({ color })}
        />
      )}

      <div className="apx-canvas-v2-grid apx-canvas-v2-grid--3">
        <NumberField label="Offset X" value={shadow.offsetX ?? 0} onChange={(offsetX) => patch({ offsetX })} />
        <NumberField label="Offset Y" value={shadow.offsetY ?? 12} onChange={(offsetY) => patch({ offsetY })} />
        <NumberField label="Blur" value={shadow.blur ?? 28} min={0} onChange={(blur) => patch({ blur })} />
      </div>
      <RangeField label="Shadow opacity" value={shadow.opacity ?? 0.35} onChange={(opacity) => patch({ opacity })} />
      <div className="apx-canvas-v2-grid apx-canvas-v2-grid--2">
        <label className="apx-canvas-v2-field">
          <span>Shadow radius</span>
          <input
            className="apx-canvas-v2-input"
            type="number"
            min={0}
            disabled={shadow.borderRadius === 'circular'}
            value={typeof shadow.borderRadius === 'number' ? shadow.borderRadius : 0}
            onChange={(event) => patch({ borderRadius: Number(event.target.value) })}
          />
        </label>
        <label className="apx-canvas-v2-check-card">
          <input
            type="checkbox"
            checked={shadow.borderRadius === 'circular'}
            onChange={(event) =>
              patch({ borderRadius: event.target.checked ? 'circular' : 0 })
            }
          />
          <span>
            <strong>Circular shadow</strong>
            <small>Match circular canvas geometry.</small>
          </span>
        </label>
      </div>
      <MultiPositionField
        label="Rounded corners"
        value={shadow.roundedCorners ?? shadow.borderPosition ?? 'all'}
        onChange={(roundedCorners) => {
          const next = { ...shadow, roundedCorners };
          delete next.borderPosition;
          onChange(next);
        }}
      />
      {shadow.borderPosition && !shadow.roundedCorners ? (
        <div className="apx-canvas-v2-callout apx-canvas-v2-callout--info">
          <strong>Legacy shadow corner mask</strong>
          <span>
            shadow.borderPosition is a deprecated alias for roundedCorners, not
            a side-selection control. Editing the corner mask migrates it to
            roundedCorners.
          </span>
        </div>
      ) : null}
    </div>
  );
}

function BackgroundLayersEditor({
  layers,
  onChange,
}: {
  layers: VisualBackgroundLayer[];
  onChange: (layers: VisualBackgroundLayer[]) => void;
}) {
  const update = (
    index: number,
    updater: (layer: VisualBackgroundLayer) => VisualBackgroundLayer,
  ) =>
    onChange(
      layers.map((layer, layerIndex) =>
        layerIndex === index ? updater(layer) : layer,
      ),
    );

  return (
    <div className="apx-canvas-v2-layer-stack">
      <div className="apx-canvas-v2-subhead">
        <div>
          <strong>Background stack</strong>
          <small>Rendered bottom → top before patternBg and noiseBg.</small>
        </div>
        <select
          className="apx-canvas-v2-add-select"
          value=""
          aria-label="Add background layer"
          onChange={(event) => {
            if (!event.target.value) return;
            onChange([
              ...layers,
              defaultBackgroundLayer(
                event.target.value as VisualBackgroundLayer['type'],
              ),
            ]);
          }}
        >
          <option value="">＋ Layer</option>
          <option value="color">Color</option>
          <option value="gradient">Gradient</option>
          <option value="image">Image</option>
          <option value="pattern">Image pattern</option>
          <option value="presetPattern">Preset pattern</option>
          <option value="noise">Noise</option>
        </select>
      </div>

      {layers.length ? (
        layers.map((layer, index) => (
          <details className="apx-canvas-v2-layer" key={index}>
            <summary>
              <span className="apx-canvas-v2-layer-index">{index + 1}</span>
              <strong>{titleCase(layer.type)}</strong>
              <small>
                {'opacity' in layer
                  ? Math.round((layer.opacity ?? 1) * 100) + '%'
                  : layer.type === 'noise'
                    ? Math.round((layer.intensity ?? 0.04) * 100) + '% noise'
                    : ''}
              </small>
              <button
                className="apx-canvas-v2-icon-button"
                type="button"
                aria-label="Remove background layer"
                onClick={(event) => {
                  event.preventDefault();
                  onChange(layers.filter((_, layerIndex) => layerIndex !== index));
                }}
              >
                <TrashIcon aria-hidden />
              </button>
            </summary>
            <div className="apx-canvas-v2-layer-body">
              <SelectField
                label="Layer type"
                value={layer.type}
                options={['color', 'gradient', 'image', 'pattern', 'presetPattern', 'noise']}
                onChange={(value) =>
                  update(
                    index,
                    () =>
                      defaultBackgroundLayer(
                        value as VisualBackgroundLayer['type'],
                      ),
                  )
                }
              />

              {layer.type === 'color' ? (
                <ColorField
                  label="Color"
                  value={layer.value}
                  fallback="#172554"
                  onChange={(value) =>
                    update(index, (current) =>
                      current.type === 'color' ? { ...current, value } : current,
                    )
                  }
                />
              ) : null}

              {layer.type === 'gradient' ? (
                <GradientEditor
                  gradient={layer.value}
                  onChange={(value) =>
                    update(index, (current) =>
                      current.type === 'gradient'
                        ? { ...current, value }
                        : current,
                    )
                  }
                  compact
                />
              ) : null}

              {layer.type === 'image' ? (
                <>
                  <label className="apx-canvas-v2-field">
                    <span>Image source</span>
                    <input
                      className="apx-canvas-v2-input"
                      value={layer.source}
                      placeholder="studio://asset/... or URL"
                      onChange={(event) =>
                        update(index, (current) =>
                          current.type === 'image'
                            ? { ...current, source: event.target.value }
                            : current,
                        )
                      }
                    />
                  </label>
                  <div className="apx-canvas-v2-grid apx-canvas-v2-grid--2">
                    <SelectField
                      label="Fit"
                      value={layer.fit ?? 'fill'}
                      options={CANVAS_FITS}
                      onChange={(value) =>
                        update(index, (current) =>
                          current.type === 'image'
                            ? {
                                ...current,
                                fit: value as NonNullable<typeof current.fit>,
                              }
                            : current,
                        )
                      }
                    />
                    <SelectField
                      label="Align"
                      value={layer.align ?? 'center'}
                      options={CANVAS_ALIGNMENTS}
                      onChange={(value) =>
                        update(index, (current) =>
                          current.type === 'image'
                            ? {
                                ...current,
                                align: value as NonNullable<typeof current.align>,
                              }
                            : current,
                        )
                      }
                    />
                  </div>
                </>
              ) : null}

              {layer.type === 'pattern' ? (
                <>
                  <label className="apx-canvas-v2-field">
                    <span>Pattern image source</span>
                    <input
                      className="apx-canvas-v2-input"
                      value={layer.source}
                      placeholder="studio://asset/... or URL"
                      onChange={(event) =>
                        update(index, (current) =>
                          current.type === 'pattern'
                            ? { ...current, source: event.target.value }
                            : current,
                        )
                      }
                    />
                  </label>
                  <SelectField
                    label="Repeat"
                    value={layer.repeat ?? 'repeat'}
                    options={REPEAT_MODES}
                    onChange={(value) =>
                      update(index, (current) =>
                        current.type === 'pattern'
                          ? {
                              ...current,
                              repeat: value as NonNullable<typeof current.repeat>,
                            }
                          : current,
                      )
                    }
                  />
                </>
              ) : null}

              {layer.type === 'presetPattern' ? (
                <PatternEditor
                  pattern={layer.pattern}
                  onChange={(pattern) =>
                    update(index, (current) =>
                      current.type === 'presetPattern'
                        ? { ...current, pattern }
                        : current,
                    )
                  }
                />
              ) : null}

              {layer.type === 'noise' ? (
                <RangeField
                  label="Noise intensity"
                  value={layer.intensity ?? 0.04}
                  onChange={(intensity) =>
                    update(index, (current) =>
                      current.type === 'noise'
                        ? { ...current, intensity }
                        : current,
                    )
                  }
                />
              ) : null}

              {'opacity' in layer ? (
                <RangeField
                  label="Layer opacity"
                  value={layer.opacity ?? 1}
                  onChange={(opacity) =>
                    update(index, (current) => ({ ...current, opacity }))
                  }
                />
              ) : null}

              <SelectField
                label="Blend mode"
                value={layer.blendMode ?? 'source-over'}
                options={CANVAS_BLEND_MODES}
                onChange={(value) =>
                  update(index, (current) => ({
                    ...current,
                    blendMode: value as typeof current.blendMode,
                  }))
                }
              />
            </div>
          </details>
        ))
      ) : (
        <div className="apx-canvas-v2-empty-mini">
          No stacked backgrounds. Add color, gradient, image, pattern or noise layers.
        </div>
      )}
    </div>
  );
}

function canvasMode(
  canvas: VisualCanvasConfig,
): 'default' | 'color' | 'gradient' | 'image' | 'transparent' {
  if (canvas.customBg) return 'image';
  if (canvas.gradientBg) return 'gradient';
  if (canvas.colorBg !== undefined) return 'color';
  if (canvas.transparentBase) return 'transparent';
  return 'default';
}

function baseModeLabel(mode: ReturnType<typeof canvasMode>) {
  if (mode === 'default') return 'Default black';
  if (mode === 'color') return 'Solid color';
  if (mode === 'gradient') return 'Gradient';
  if (mode === 'image') return 'Image';
  return 'Transparent';
}

export function VisualCanvasInspector({
  project,
  tab,
  assets,
  onRename,
  onBeginEdit,
  onEndEdit,
  onDraft,
  onMutate,
  onResizeDraft,
  onMessage,
  onOpenVideoEditor,
}: Props) {
  const canvas = project.document.canvas ?? {};
  const mode = canvasMode(canvas);
  const imageAssets = assets.filter((asset) => asset.mime.startsWith('image/'));
  const videoAssets = assets.filter((asset) => asset.mime.startsWith('video/'));
  const customBg = canvas.customBg;
  const inheritedAsset = customBg
    ? imageAssets.find(
        (asset) => studioAssetReference(asset) === customBg.source,
      )
    : undefined;

  const setBaseMode = (nextMode: ReturnType<typeof canvasMode>) =>
    onMutate('Canvas background', (current) => {
      const next = { ...current };
      delete next.colorBg;
      delete next.gradientBg;
      delete next.customBg;
      delete next.transparentBase;
      if (nextMode === 'color') next.colorBg = '#0b1730';
      if (nextMode === 'gradient') next.gradientBg = defaultCanvasGradient();
      if (nextMode === 'image') {
        next.customBg = {
          source: imageAssets[0] ? studioAssetReference(imageAssets[0]) : '',
          fit: 'fill',
          align: 'center',
          opacity: 1,
          filters: [],
        };
      }
      if (nextMode === 'transparent') next.transparentBase = true;
      return next;
    });

  const header = (
    <div className="apx-canvas-v2-header">
      <div className="apx-canvas-v2-api-icon">
        <CodeBracketIcon aria-hidden />
      </div>
      <div>
        <strong>createCanvas()</strong>
        <span>ApexPainter · CanvasConfig</span>
      </div>
      <div className="apx-canvas-v2-api-status">
        <strong>
          {project.document.width} × {project.document.height}
        </strong>
        <span>{baseModeLabel(mode)}</span>
      </div>
    </div>
  );

  if (tab === 'data') {
    return (
      <div className="apx-canvas-v2" data-canvas-inspector-v2>
        {header}
        <div className="apx-canvas-v2-info">
          <CircleStackIcon aria-hidden />
          <div>
            <strong>No data-binding fields in CanvasConfig</strong>
            <span>
              createCanvas() is fully represented across Style, Transform, Effects and
              Advanced. Data remains reserved for APIs that own external datasets.
            </span>
          </div>
        </div>
        <div className="apx-canvas-v2-coverage">
          <span>21 top-level createCanvas options</span>
          <span>Image filters</span>
          <span>6 background-layer types</span>
          <span>3 gradient systems</span>
        </div>
      </div>
    );
  }

  if (tab === 'style') {
    const gradient = canvas.gradientBg ?? defaultCanvasGradient();
    return (
      <div className="apx-canvas-v2" data-canvas-inspector-v2 data-canvas-tab="style">
        {header}

        <Section
          title="Document"
          description="Identity and primary surface"
          icon={PaintBrushIcon}
        >
          <label className="apx-canvas-v2-field">
            <span>Canvas name</span>
            <input
              className="apx-canvas-v2-input"
              value={project.name}
              onFocus={onBeginEdit}
              onChange={(event) => onRename(event.target.value)}
              onBlur={() => onEndEdit('Rename canvas')}
            />
          </label>
        </Section>

        <Section
          title="Base surface"
          description="Choose the primary createCanvas background"
          icon={SwatchIcon}
          badge={baseModeLabel(mode)}
        >
          <div className="apx-canvas-v2-segmented apx-canvas-v2-segmented--5">
            {([
              ['default', 'Default'],
              ['color', 'Color'],
              ['gradient', 'Gradient'],
              ['image', 'Image'],
              ['transparent', 'Clear'],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                data-active={mode === id ? 'true' : undefined}
                onClick={() => setBaseMode(id)}
              >
                {label}
              </button>
            ))}
          </div>

          {mode === 'default' ? (
            <div className="apx-canvas-v2-callout">
              <strong>Default black</strong>
              <span>
                No base field is emitted. Apexify paints #000 unless transparentBase
                is enabled.
              </span>
            </div>
          ) : null}

          {mode === 'color' ? (
            <ColorField
              label="colorBg"
              value={canvas.colorBg ?? '#000000'}
              fallback="#000000"
              onFocus={onBeginEdit}
              onChange={(colorBg) =>
                onDraft((current) => ({ ...current, colorBg }))
              }
              onBlur={() => onEndEdit('Canvas color')}
            />
          ) : null}

          {mode === 'gradient' ? (
            <GradientEditor
              gradient={gradient}
              onChange={(gradientBg) =>
                onDraft((current) => ({ ...current, gradientBg }))
              }
            />
          ) : null}

          {mode === 'image' && customBg ? (
            <div className="apx-canvas-v2-editor">
              <label className="apx-canvas-v2-field">
                <span>customBg.source</span>
                <input
                  className="apx-canvas-v2-input"
                  value={customBg.source}
                  placeholder="studio://asset/... or URL"
                  onFocus={onBeginEdit}
                  onChange={(event) =>
                    onDraft((current) => ({
                      ...current,
                      customBg: {
                        ...(current.customBg ?? customBg),
                        source: event.target.value,
                      },
                    }))
                  }
                  onBlur={() => onEndEdit('Canvas image source')}
                />
              </label>

              <label className="apx-canvas-v2-field">
                <span>Choose image asset</span>
                <select
                  className="apx-canvas-v2-input"
                  value={inheritedAsset?.id ?? ''}
                  onChange={(event) => {
                    const asset = imageAssets.find(
                      (item) => item.id === event.target.value,
                    );
                    if (!asset) return;
                    onMutate('Canvas background asset', (current) => ({
                      ...current,
                      customBg: {
                        ...(current.customBg ?? customBg),
                        source: studioAssetReference(asset),
                      },
                    }));
                    onMessage('Canvas background · ' + asset.name);
                  }}
                >
                  <option value="">Custom source</option>
                  {imageAssets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.name}
                      {asset.metadata?.width && asset.metadata?.height
                        ? ' · ' +
                          String(asset.metadata.width) +
                          '×' +
                          String(asset.metadata.height)
                        : ''}
                    </option>
                  ))}
                </select>
              </label>

              <div className="apx-canvas-v2-grid apx-canvas-v2-grid--2">
                <SelectField
                  label="Fit"
                  value={customBg.fit ?? 'fill'}
                  options={CANVAS_FITS}
                  disabled={Boolean(customBg.inherit)}
                  onChange={(value) =>
                    onMutate('Background fit', (current) => ({
                      ...current,
                      customBg: {
                        ...(current.customBg ?? customBg),
                        fit: value as NonNullable<
                          NonNullable<VisualCanvasConfig['customBg']>['fit']
                        >,
                      },
                    }))
                  }
                />
                <SelectField
                  label="Align"
                  value={customBg.align ?? 'center'}
                  options={CANVAS_ALIGNMENTS}
                  disabled={Boolean(customBg.inherit)}
                  onChange={(value) =>
                    onMutate('Background alignment', (current) => ({
                      ...current,
                      customBg: {
                        ...(current.customBg ?? customBg),
                        align: value as NonNullable<
                          NonNullable<VisualCanvasConfig['customBg']>['align']
                        >,
                      },
                    }))
                  }
                />
              </div>

              <label className="apx-canvas-v2-check-card">
                <input
                  type="checkbox"
                  checked={customBg.inherit ?? false}
                  onChange={(event) =>
                    onMutate('Background inherit dimensions', (current) => ({
                      ...current,
                      customBg: {
                        ...(current.customBg ?? customBg),
                        inherit: event.target.checked,
                      },
                    }))
                  }
                />
                <span>
                  <strong>Inherit source dimensions</strong>
                  <small>
                    Use the image's native resolution. Fit and alignment are bypassed.
                  </small>
                </span>
                {inheritedAsset?.metadata?.width &&
                inheritedAsset.metadata.height ? (
                  <em>
                    {inheritedAsset.metadata.width} ×{' '}
                    {inheritedAsset.metadata.height}
                  </em>
                ) : null}
              </label>

              <RangeField
                label="Image opacity"
                value={customBg.opacity ?? 1}
                onChange={(opacity) =>
                  onDraft((current) => ({
                    ...current,
                    customBg: {
                      ...(current.customBg ?? customBg),
                      opacity,
                    },
                  }))
                }
              />
            </div>
          ) : null}
        </Section>

        <Section
          title="Appearance"
          description="Canvas-wide compositing and clipping"
          icon={AdjustmentsHorizontalIcon}
        >
          <RangeField
            label="Canvas opacity"
            value={canvas.opacity ?? 1}
            onChange={(opacity) =>
              onDraft((current) => ({ ...current, opacity }))
            }
          />
          <SelectField
            label="Blend mode"
            value={canvas.blendMode ?? 'source-over'}
            options={CANVAS_BLEND_MODES}
            onChange={(value) =>
              onMutate('Canvas blend mode', (current) => ({
                ...current,
                blendMode: value as VisualCanvasConfig['blendMode'],
              }))
            }
          />
          <div className="apx-canvas-v2-grid apx-canvas-v2-grid--2">
            <NumberField
              label="Border radius"
              value={
                typeof canvas.borderRadius === 'number' ? canvas.borderRadius : 0
              }
              min={0}
              disabled={canvas.borderRadius === 'circular'}
              onChange={(borderRadius) =>
                onDraft((current) => ({ ...current, borderRadius }))
              }
            />
            <MultiPositionField
              label="Rounded positions"
              value={canvas.borderPosition ?? 'all'}
              onChange={(borderPosition) =>
                onMutate('Canvas border position', (current) => ({
                  ...current,
                  borderPosition,
                }))
              }
            />
          </div>
          <label className="apx-canvas-v2-check-card">
            <input
              type="checkbox"
              checked={canvas.borderRadius === 'circular'}
              onChange={(event) =>
                onMutate('Circular canvas', (current) => ({
                  ...current,
                  borderRadius: event.target.checked ? 'circular' : 0,
                }))
              }
            />
            <span>
              <strong>Circular canvas</strong>
              <small>Use min(width, height) / 2 as the clipping radius.</small>
            </span>
          </label>
        </Section>

        <Section
          title="Stroke"
          description="Outline paint, style and corner geometry"
          icon={PaintBrushIcon}
          defaultOpen={Boolean(canvas.stroke)}
          action={
            <Toggle
              label="Enable canvas stroke"
              checked={Boolean(canvas.stroke)}
              onChange={(checked) =>
                onMutate('Canvas stroke', (current) => {
                  if (!checked) {
                    const next = { ...current };
                    delete next.stroke;
                    return next;
                  }
                  return {
                    ...current,
                    stroke: {
                      color: '#ffffff',
                      width: 1,
                      position: 0,
                      blur: 0,
                      opacity: 1,
                      borderRadius: 0,
                      borderPosition: 'all',
                      roundedCorners: 'all',
                      style: 'solid',
                    },
                  };
                })
              }
            />
          }
        >
          {canvas.stroke ? (
            <StrokeEditor
              stroke={canvas.stroke}
              onChange={(stroke) =>
                onDraft((current) => ({ ...current, stroke }))
              }
            />
          ) : (
            <div className="apx-canvas-v2-empty-mini">
              Enable stroke to expose every StrokeOptions field.
            </div>
          )}
        </Section>

        <Section
          title="Shadow"
          description="Canvas shadow paint and geometry"
          icon={SparklesIcon}
          defaultOpen={Boolean(canvas.shadow)}
          action={
            <Toggle
              label="Enable canvas shadow"
              checked={Boolean(canvas.shadow)}
              onChange={(checked) =>
                onMutate('Canvas shadow', (current) => {
                  if (!checked) {
                    const next = { ...current };
                    delete next.shadow;
                    return next;
                  }
                  return {
                    ...current,
                    shadow: {
                      color: '#000000',
                      offsetX: 0,
                      offsetY: 12,
                      blur: 28,
                      opacity: 0.35,
                      borderRadius: 0,
                      roundedCorners: 'all',
                    },
                  };
                })
              }
            />
          }
        >
          {canvas.shadow ? (
            <ShadowEditor
              shadow={canvas.shadow}
              onChange={(shadow) =>
                onDraft((current) => ({ ...current, shadow }))
              }
            />
          ) : (
            <div className="apx-canvas-v2-empty-mini">
              Enable shadow to expose every ShadowOptions field.
            </div>
          )}
        </Section>
      </div>
    );
  }

  if (tab === 'transform') {
    const inherited = Boolean(canvas.customBg?.inherit);
    return (
      <div className="apx-canvas-v2" data-canvas-inspector-v2 data-canvas-tab="transform">
        {header}

        <Section
          title="Dimensions"
          description={
            inherited
              ? 'Width and height are inherited from customBg.source'
              : 'Output bitmap dimensions'
          }
          icon={ArrowsPointingOutIcon}
          badge={inherited ? 'Inherited' : 'Explicit'}
        >
          <div className="apx-canvas-v2-grid apx-canvas-v2-grid--2">
            <NumberField
              label="Width"
              value={project.document.width}
              min={1}
              max={16384}
              disabled={inherited}
              onFocus={onBeginEdit}
              onChange={(value) =>
                onResizeDraft('width', clamp(Math.round(value || 1), 1, 16384))
              }
              onBlur={() => onEndEdit('Resize canvas')}
              suffix="px"
            />
            <NumberField
              label="Height"
              value={project.document.height}
              min={1}
              max={16384}
              disabled={inherited}
              onFocus={onBeginEdit}
              onChange={(value) =>
                onResizeDraft('height', clamp(Math.round(value || 1), 1, 16384))
              }
              onBlur={() => onEndEdit('Resize canvas')}
              suffix="px"
            />
          </div>
          {inherited ? (
            <div className="apx-canvas-v2-callout apx-canvas-v2-callout--info">
              <strong>Native image sizing</strong>
              <span>
                customBg.inherit overrides explicit dimensions in Apexify.js.
              </span>
            </div>
          ) : null}
        </Section>

        <Section
          title="Placement"
          description="createCanvas x, y and rotation"
          icon={AdjustmentsHorizontalIcon}
        >
          <div className="apx-canvas-v2-grid apx-canvas-v2-grid--3">
            <NumberField
              label="X"
              value={canvas.x ?? 0}
              onFocus={onBeginEdit}
              onChange={(x) => onDraft((current) => ({ ...current, x }))}
              onBlur={() => onEndEdit('Canvas X')}
              suffix="px"
            />
            <NumberField
              label="Y"
              value={canvas.y ?? 0}
              onFocus={onBeginEdit}
              onChange={(y) => onDraft((current) => ({ ...current, y }))}
              onBlur={() => onEndEdit('Canvas Y')}
              suffix="px"
            />
            <NumberField
              label="Rotation"
              value={canvas.rotation ?? 0}
              onFocus={onBeginEdit}
              onChange={(rotation) =>
                onDraft((current) => ({ ...current, rotation }))
              }
              onBlur={() => onEndEdit('Canvas rotation')}
              suffix="°"
            />
          </div>
        </Section>

        <Section
          title="Internal zoom"
          description="Real Apexify rendering transform, not editor zoom"
          icon={ArrowsPointingOutIcon}
          defaultOpen={Boolean(canvas.zoom)}
          action={
            <Toggle
              label="Enable canvas internal zoom"
              checked={Boolean(canvas.zoom)}
              onChange={(checked) =>
                onMutate('Canvas internal zoom', (current) => {
                  if (!checked) {
                    const next = { ...current };
                    delete next.zoom;
                    return next;
                  }
                  return {
                    ...current,
                    zoom: {
                      scale: 1,
                      centerX: project.document.width / 2,
                      centerY: project.document.height / 2,
                    },
                  };
                })
              }
            />
          }
        >
          {canvas.zoom ? (
            <>
              <RangeField
                label="Scale"
                value={canvas.zoom.scale ?? 1}
                min={0.05}
                max={5}
                step={0.05}
                format={(value) => value.toFixed(2) + '×'}
                onChange={(scale) =>
                  onDraft((current) => ({
                    ...current,
                    zoom: { ...current.zoom, scale },
                  }))
                }
              />
              <div className="apx-canvas-v2-grid apx-canvas-v2-grid--2">
                <NumberField
                  label="Center X"
                  value={canvas.zoom.centerX ?? project.document.width / 2}
                  onChange={(centerX) =>
                    onDraft((current) => ({
                      ...current,
                      zoom: { ...current.zoom, centerX },
                    }))
                  }
                />
                <NumberField
                  label="Center Y"
                  value={canvas.zoom.centerY ?? project.document.height / 2}
                  onChange={(centerY) =>
                    onDraft((current) => ({
                      ...current,
                      zoom: { ...current.zoom, centerY },
                    }))
                  }
                />
              </div>
            </>
          ) : (
            <div className="apx-canvas-v2-empty-mini">
              Internal zoom is disabled. The canvas renders at scale 1.
            </div>
          )}
        </Section>
      </div>
    );
  }

  if (tab === 'effects') {
    const pattern = canvas.patternBg ?? defaultCanvasPattern();
    return (
      <div className="apx-canvas-v2" data-canvas-inspector-v2 data-canvas-tab="effects">
        {header}

        <Section
          title="Surface effects"
          description="Canvas blur and global compositing"
          icon={SparklesIcon}
        >
          <NumberField
            label="Blur"
            value={canvas.blur ?? 0}
            min={0}
            onFocus={onBeginEdit}
            onChange={(blur) =>
              onDraft((current) => ({ ...current, blur: Math.max(0, blur) }))
            }
            onBlur={() => onEndEdit('Canvas blur')}
            suffix="px"
          />
        </Section>

        <Section
          title="Pattern overlay"
          description="Procedural PatternOptions rendered above background layers"
          icon={Squares2X2Icon}
          defaultOpen={Boolean(canvas.patternBg)}
          action={
            <Toggle
              label="Enable canvas pattern"
              checked={Boolean(canvas.patternBg)}
              onChange={(checked) =>
                onMutate('Canvas pattern', (current) => {
                  if (!checked) {
                    const next = { ...current };
                    delete next.patternBg;
                    return next;
                  }
                  return { ...current, patternBg: defaultCanvasPattern() };
                })
              }
            />
          }
        >
          {canvas.patternBg ? (
            <PatternEditor
              pattern={pattern}
              onChange={(patternBg) =>
                onDraft((current) => ({ ...current, patternBg }))
              }
            />
          ) : (
            <div className="apx-canvas-v2-empty-mini">
              Pattern overlay is disabled.
            </div>
          )}
        </Section>

        <Section
          title="Noise overlay"
          description="Deterministic raster noise rendered after patternBg"
          icon={SparklesIcon}
          defaultOpen={Boolean(canvas.noiseBg)}
          action={
            <Toggle
              label="Enable canvas noise"
              checked={Boolean(canvas.noiseBg)}
              onChange={(checked) =>
                onMutate('Canvas noise', (current) => {
                  if (!checked) {
                    const next = { ...current };
                    delete next.noiseBg;
                    return next;
                  }
                  return { ...current, noiseBg: { intensity: 0.05 } };
                })
              }
            />
          }
        >
          {canvas.noiseBg ? (
            <RangeField
              label="Intensity"
              value={canvas.noiseBg.intensity ?? 0.05}
              onChange={(intensity) =>
                onDraft((current) => ({
                  ...current,
                  noiseBg: { intensity },
                }))
              }
            />
          ) : (
            <div className="apx-canvas-v2-empty-mini">Noise is disabled.</div>
          )}
        </Section>

        <Section
          title="Background image filters"
          description="Complete ImageFilter[] controls for customBg"
          icon={AdjustmentsHorizontalIcon}
          defaultOpen={Boolean(customBg?.filters?.length)}
          badge={customBg ? String(customBg.filters?.length ?? 0) : 'Image only'}
        >
          {customBg ? (
            <FilterEditor
              filters={customBg.filters ?? []}
              onChange={(filters) =>
                onDraft((current) => ({
                  ...current,
                  customBg: {
                    ...(current.customBg ?? customBg),
                    filters,
                  },
                }))
              }
            />
          ) : (
            <div className="apx-canvas-v2-callout">
              <strong>Choose Image as the base surface first</strong>
              <span>customBg.filters belongs to the image background API.</span>
            </div>
          )}
        </Section>

        <Section
          title="Background layers"
          description="color · gradient · image · pattern · presetPattern · noise"
          icon={CircleStackIcon}
          defaultOpen={Boolean(canvas.bgLayers?.length)}
          badge={String(canvas.bgLayers?.length ?? 0)}
        >
          <BackgroundLayersEditor
            layers={canvas.bgLayers ?? []}
            onChange={(bgLayers) =>
              onMutate('Canvas background layers', (current) => ({
                ...current,
                bgLayers,
              }))
            }
          />
        </Section>
      </div>
    );
  }

  const video = canvas.videoBg;
  const selectedVideoAsset = video
    ? videoAssets.find((asset) => studioAssetReference(asset) === video.source)
    : undefined;

  return (
    <div className="apx-canvas-v2" data-canvas-inspector-v2 data-canvas-tab="advanced">
      {header}

      <Section
        title="Video frame background"
        description="Extract one frame from video into createCanvas(); full editing lives in Video Editor"
        icon={FilmIcon}
        defaultOpen={Boolean(video)}
        badge="Node"
        action={
          <Toggle
            label="Enable video background"
            checked={Boolean(video)}
            onChange={(checked) =>
              onMutate('Video background', (current) => {
                if (!checked) {
                  const next = { ...current };
                  delete next.videoBg;
                  return next;
                }
                return {
                  ...current,
                  videoBg: {
                    source: videoAssets[0]
                      ? studioAssetReference(videoAssets[0])
                      : '',
                    frame: 0,
                    loop: false,
                    autoplay: false,
                    opacity: 1,
                    format: 'jpg',
                    quality: 2,
                  },
                };
              })
            }
          />
        }
      >
        <div className="apx-canvas-v2-video-modes">
          <div className="apx-canvas-v2-video-mode" data-active="true">
            <FilmIcon aria-hidden />
            <span>
              <strong>Frame background</strong>
              <small>Use CanvasConfig.videoBg to extract one frame/time as the canvas surface.</small>
            </span>
          </div>
          <button
            type="button"
            className="apx-canvas-v2-video-mode apx-canvas-v2-video-mode--button"
            onClick={() => onOpenVideoEditor?.(selectedVideoAsset?.id)}
          >
            <ArrowsPointingOutIcon aria-hidden />
            <span>
              <strong>Edit full video</strong>
              <small>Open the timeline editor for trim, effects, crop, speed, audio, transitions and export.</small>
            </span>
          </button>
        </div>
        {video ? (
          <div className="apx-canvas-v2-editor">
            <label className="apx-canvas-v2-field">
              <span>videoBg.source</span>
              <input
                className="apx-canvas-v2-input"
                value={video.source}
                placeholder="studio://asset/... or file/URL"
                onChange={(event) =>
                  onDraft((current) => ({
                    ...current,
                    videoBg: {
                      ...current.videoBg!,
                      source: event.target.value,
                    },
                  }))
                }
              />
            </label>
            <label className="apx-canvas-v2-field">
              <span>Choose video asset</span>
              <select
                className="apx-canvas-v2-input"
                value={selectedVideoAsset?.id ?? ''}
                onChange={(event) => {
                  const asset = videoAssets.find(
                    (item) => item.id === event.target.value,
                  );
                  if (!asset) return;
                  onMutate('Video background asset', (current) => ({
                    ...current,
                    videoBg: {
                      ...current.videoBg!,
                      source: studioAssetReference(asset),
                    },
                  }));
                }}
              >
                <option value="">Custom source</option>
                {videoAssets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="apx-canvas-v2-grid apx-canvas-v2-grid--2">
              <NumberField
                label="Frame"
                value={video.frame ?? 0}
                min={0}
                step={1}
                onChange={(frame) =>
                  onDraft((current) => ({
                    ...current,
                    videoBg: {
                      ...current.videoBg!,
                      frame: Math.max(0, Math.round(frame)),
                    },
                  }))
                }
              />
              <NumberField
                label="Time"
                value={video.time ?? 0}
                min={0}
                step={0.1}
                onChange={(time) =>
                  onDraft((current) => ({
                    ...current,
                    videoBg: {
                      ...current.videoBg!,
                      time: Math.max(0, time),
                    },
                  }))
                }
                suffix="s"
              />
              <SelectField
                label="Format"
                value={video.format ?? 'jpg'}
                options={['jpg', 'png']}
                onChange={(value) =>
                  onMutate('Video frame format', (current) => ({
                    ...current,
                    videoBg: {
                      ...current.videoBg!,
                      format: value as 'jpg' | 'png',
                    },
                  }))
                }
              />
              <NumberField
                label="Quality"
                value={video.quality ?? 2}
                min={1}
                max={100}
                step={1}
                onChange={(quality) =>
                  onDraft((current) => ({
                    ...current,
                    videoBg: {
                      ...current.videoBg!,
                      quality: clamp(Math.round(quality), 1, 100),
                    },
                  }))
                }
              />
            </div>
            <div className="apx-canvas-v2-grid apx-canvas-v2-grid--2">
              <label className="apx-canvas-v2-check-card">
                <input
                  type="checkbox"
                  checked={video.loop ?? false}
                  onChange={(event) =>
                    onMutate('Video loop', (current) => ({
                      ...current,
                      videoBg: {
                        ...current.videoBg!,
                        loop: event.target.checked,
                      },
                    }))
                  }
                />
                <span>
                  <strong>Loop metadata</strong>
                  <small>Stored on videoBg; temporal looping belongs in Video Editor.</small>
                </span>
              </label>
              <label className="apx-canvas-v2-check-card">
                <input
                  type="checkbox"
                  checked={video.autoplay ?? false}
                  onChange={(event) =>
                    onMutate('Video autoplay', (current) => ({
                      ...current,
                      videoBg: {
                        ...current.videoBg!,
                        autoplay: event.target.checked,
                      },
                    }))
                  }
                />
                <span>
                  <strong>Autoplay metadata</strong>
                  <small>Stored on videoBg; playback behavior belongs in Video Editor.</small>
                </span>
              </label>
            </div>
            <RangeField
              label="Video opacity"
              value={video.opacity ?? 1}
              onChange={(opacity) =>
                onDraft((current) => ({
                  ...current,
                  videoBg: {
                    ...current.videoBg!,
                    opacity,
                  },
                }))
              }
            />
            <div className="apx-canvas-v2-callout apx-canvas-v2-callout--warning">
              <strong>Authoritative frame rendering</strong>
              <span>
                videoBg is rendered through the Node/FFmpeg runtime so frame and time extraction match Apexify.js. Use Video Editor when the output is a video rather than a single canvas frame.
              </span>
            </div>
          </div>
        ) : (
          <div className="apx-canvas-v2-empty-mini">
            Enable video background to expose all videoBg options.
          </div>
        )}
      </Section>

      <Section
        title="API coverage"
        description="The Visual inspector maps the complete current createCanvas contract"
        icon={CodeBracketIcon}
      >
        <div className="apx-canvas-v2-coverage-grid">
          {[
            'width / height',
            'x / y',
            'customBg',
            'videoBg',
            'colorBg',
            'gradientBg',
            'patternBg',
            'noiseBg',
            'transparentBase',
            'bgLayers',
            'blendMode',
            'opacity',
            'blur',
            'rotation',
            'borderRadius',
            'borderPosition',
            'zoom',
            'stroke',
            'shadow',
          ].map((item) => (
            <span key={item}>✓ {item}</span>
          ))}
        </div>
        <div className="apx-canvas-v2-callout apx-canvas-v2-callout--info">
          <strong>Where everything lives</strong>
          <span>
            Style owns base paint, opacity, clipping, stroke and shadow. Transform
            owns size, position, rotation and internal zoom. Effects owns filters,
            patterns, noise and stacked backgrounds. Advanced owns videoBg and API
            capability notes.
          </span>
        </div>
      </Section>
    </div>
  );
}
