'use client';

import { useState, type ReactNode } from 'react';
import {
  AdjustmentsHorizontalIcon,
  ArrowsPointingOutIcon,
  Bars3Icon,
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentDuplicateIcon,
  EyeDropperIcon,
  PhotoIcon,
  PlusIcon,
  RectangleStackIcon,
  SparklesIcon,
  Squares2X2Icon,
  SwatchIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import type {
  VisualBlendMode,
  VisualImageFilter,
  VisualImageNodeProps,
  VisualImageUtilityAnalysis,
  VisualImageUtilityOperation,
} from '@/lib/studio/visual/model';
import {
  IMAGE_UTILITY_ANALYSIS_TYPES,
  IMAGE_UTILITY_API_COVERAGE,
  IMAGE_UTILITY_STACK_TYPES,
  defaultImageUtilityAnalysis,
  defaultImageUtilityOperation,
  normalizeImageUtilityAnalysisDraft,
  normalizeImageUtilityOperationDraft,
  type ImageUtilityStackType,
} from '@/lib/studio/visual/image-utility-contract';
import {
  IMAGE_FILTER_PARAMETERLESS_TYPES,
  IMAGE_FILTER_TYPES,
  defaultVisualImageFilter,
  imageFilterFieldSpecs,
  updateVisualImageFilterValue,
} from '@/lib/studio/visual/image-contract';
import { createVisualId } from '@/lib/studio/visual/ids';

type Props = {
  value: VisualImageNodeProps;
  mode: 'effects' | 'advanced';
  width?: number;
  height?: number;
  onChange: (next: VisualImageNodeProps, label: string) => void;
};

const EFFECT_TYPES = new Set<ImageUtilityStackType>([
  'resize','cropImage','effects','colorsFilter','colorsRemover',
  'blend','masking','gradientBlend','stitchImages','createCollage',
]);
const ADVANCED_TYPES = new Set<ImageUtilityStackType>(['imgConverter','compress']);

type EffectCategory = 'all' | 'adjust' | 'color' | 'composite' | 'tools';

const EFFECT_CATEGORIES: Array<{ id: EffectCategory; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'adjust', label: 'Adjust' },
  { id: 'color', label: 'Color' },
  { id: 'composite', label: 'Composite' },
  { id: 'tools', label: 'Tools' },
];

const EFFECT_CATEGORY_TYPES: Record<Exclude<EffectCategory, 'all'>, readonly ImageUtilityStackType[]> = {
  adjust: ['resize', 'cropImage', 'effects'],
  color: ['colorsFilter', 'colorsRemover', 'gradientBlend'],
  composite: ['blend', 'masking'],
  tools: ['stitchImages', 'createCollage'],
};

const COMMON_BLEND_MODES: readonly VisualBlendMode[] = [
  'source-over',
  'multiply',
  'screen',
  'overlay',
  'darken',
  'lighten',
  'difference',
  'soft-light',
  'hard-light',
];

const GRADIENT_BLEND_MODES = [
  'multiply',
  'screen',
  'overlay',
  'darken',
  'lighten',
  'difference',
] as const;

function pretty(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function stackLabel(type: ImageUtilityStackType) {
  return ({
    resize: 'Resize',
    cropImage: 'Crop',
    effects: 'Filters / effects',
    colorsFilter: 'Color overlay',
    colorsRemover: 'Remove color',
    blend: 'Blend layers',
    masking: 'Mask',
    gradientBlend: 'Gradient blend',
    stitchImages: 'Stitch images',
    createCollage: 'Collage',
    imgConverter: 'Convert format',
    compress: 'Compress',
  } satisfies Record<ImageUtilityStackType, string>)[type];
}

function operationAccent(type: ImageUtilityStackType) {
  return ({
    resize: 'blue',
    cropImage: 'cyan',
    effects: 'violet',
    colorsFilter: 'orange',
    colorsRemover: 'rose',
    blend: 'sky',
    masking: 'green',
    gradientBlend: 'purple',
    stitchImages: 'teal',
    createCollage: 'indigo',
    imgConverter: 'blue',
    compress: 'cyan',
  } satisfies Record<ImageUtilityStackType, string>)[type];
}

function operationIcon(type: ImageUtilityStackType): ReactNode {
  const className = 'apx-effects-icon-svg';
  switch (type) {
    case 'resize': return <ArrowsPointingOutIcon className={className} aria-hidden />;
    case 'cropImage': return <Squares2X2Icon className={className} aria-hidden />;
    case 'effects': return <AdjustmentsHorizontalIcon className={className} aria-hidden />;
    case 'colorsFilter': return <SwatchIcon className={className} aria-hidden />;
    case 'colorsRemover': return <EyeDropperIcon className={className} aria-hidden />;
    case 'blend': return <RectangleStackIcon className={className} aria-hidden />;
    case 'masking': return <PhotoIcon className={className} aria-hidden />;
    case 'gradientBlend': return <SparklesIcon className={className} aria-hidden />;
    case 'stitchImages':
    case 'createCollage': return <Squares2X2Icon className={className} aria-hidden />;
    case 'imgConverter': return <SwatchIcon className={className} aria-hidden />;
    case 'compress': return <RectangleStackIcon className={className} aria-hidden />;
    default: return <AdjustmentsHorizontalIcon className={className} aria-hidden />;
  }
}

function analysisLabel(type: VisualImageUtilityAnalysis['type']) {
  return type === 'extractPalette' ? 'Extract palette' : 'Color analysis';
}

function operationDetail(operation: VisualImageUtilityOperation) {
  switch (operation.type) {
    case 'resize':
      return (operation.size?.width ?? 'auto') + ' × ' + (operation.size?.height ?? 'auto');
    case 'cropImage':
      return operation.crop + ' · ' + operation.coordinates.length + ' points';
    case 'effects':
      return operation.filters.length + ' filter' + (operation.filters.length === 1 ? '' : 's');
    case 'colorsFilter':
      return (typeof operation.filterColor === 'string' ? operation.filterColor : 'gradient') +
        ' · ' + Math.round((operation.opacity ?? 0.2) * 100) + '%';
    case 'colorsRemover':
      return 'rgb(' + operation.colorToRemove.red + ', ' + operation.colorToRemove.green + ', ' + operation.colorToRemove.blue + ')';
    case 'blend':
      return operation.layers.length + ' layer' + (operation.layers.length === 1 ? '' : 's');
    case 'masking':
      return (operation.options?.type ?? 'alpha') + (operation.options?.invert ? ' · inverted' : '');
    case 'gradientBlend':
      return (operation.options.type ?? 'linear') + ' · ' + operation.options.colors.length + ' colors';
    case 'stitchImages':
      return (operation.options?.direction ?? 'horizontal') + ' · ' + operation.images.length + ' images';
    case 'createCollage':
      return operation.layout.type + ' · ' + operation.images.length + ' images';
    case 'imgConverter':
      return operation.newExtension.toUpperCase();
    case 'compress':
      return (operation.options?.format ?? 'jpeg').toUpperCase() + ' · ' + (operation.options?.quality ?? 80) + '%';
  }
}

function JsonConfig({
  value,
  onApply,
}: {
  value: unknown;
  onApply: (value: unknown) => void;
}) {
  return (
    <textarea
      className="apx-canvas-json"
      spellCheck={false}
      defaultValue={pretty(value)}
      key={pretty(value)}
      onBlur={(event) => {
        try {
          onApply(JSON.parse(event.currentTarget.value));
          event.currentTarget.setCustomValidity('');
        } catch (error) {
          event.currentTarget.setCustomValidity(
            error instanceof Error ? error.message : 'Invalid JSON',
          );
          event.currentTarget.reportValidity();
        }
      }}
      aria-label="Image utility operation JSON"
    />
  );
}

function StackToggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="apx-effects-toggle" title={label}>
      <input
        type="checkbox"
        checked={checked}
        aria-label={label}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span />
    </label>
  );
}

function NumberControl({
  label,
  value,
  min,
  max,
  step = 1,
  suffix,
  onChange,
}: {
  label: string;
  value: number | undefined;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="apx-effects-field">
      <span>{label}</span>
      <div className="apx-effects-number">
        <input
          type="number"
          value={value ?? ''}
          min={min}
          max={max}
          step={step}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        {suffix ? <em>{suffix}</em> : null}
      </div>
    </label>
  );
}

function SliderControl({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="apx-effects-slider-field">
      <span>{label}</span>
      <div className="apx-effects-slider-row">
        <input
          type="range"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <div className="apx-effects-slider-value">
          <input
            type="number"
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={(event) => onChange(Number(event.target.value))}
          />
          {suffix ? <em>{suffix}</em> : null}
        </div>
      </div>
    </div>
  );
}

function SelectControl({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="apx-effects-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function rgbHex(red: number, green: number, blue: number) {
  return '#' + [red, green, blue]
    .map((value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0'))
    .join('');
}

function hexRgb(value: string) {
  const match = value.match(/^#([0-9a-f]{6})$/i);
  if (!match) return null;
  const packed = Number.parseInt(match[1]!, 16);
  return {
    red: (packed >> 16) & 255,
    green: (packed >> 8) & 255,
    blue: packed & 255,
  };
}

function OperationEditor({
  operation,
  width,
  height,
  onChange,
}: {
  operation: VisualImageUtilityOperation;
  width: number;
  height: number;
  onChange: (operation: VisualImageUtilityOperation, label?: string) => void;
}) {
  if (operation.type === 'resize') {
    return (
      <div className="apx-effects-editor-grid">
        <NumberControl
          label="Width"
          value={operation.size?.width}
          min={1}
          suffix="px"
          onChange={(nextWidth) => onChange({ ...operation, size: { ...operation.size, width: nextWidth } })}
        />
        <NumberControl
          label="Height"
          value={operation.size?.height}
          min={1}
          suffix="px"
          onChange={(nextHeight) => onChange({ ...operation, size: { ...operation.size, height: nextHeight } })}
        />
        <SelectControl
          label="Output"
          value={operation.outputFormat ?? 'png'}
          options={['png', 'jpeg']}
          onChange={(outputFormat) => onChange({ ...operation, outputFormat: outputFormat as 'png' | 'jpeg' })}
        />
        <SliderControl
          label="Quality"
          value={operation.quality ?? 90}
          min={1}
          max={100}
          step={1}
          suffix="%"
          onChange={(quality) => onChange({ ...operation, quality })}
        />
        <div className="apx-effects-inline-toggle">
          <span>
            <strong>Preserve aspect ratio</strong>
            <small>Resize proportionally when one dimension changes.</small>
          </span>
          <StackToggle
            label="Preserve aspect ratio"
            checked={operation.maintainAspectRatio !== false}
            onChange={(maintainAspectRatio) => onChange({ ...operation, maintainAspectRatio })}
          />
        </div>
      </div>
    );
  }

  if (operation.type === 'cropImage') {
    return (
      <div className="apx-effects-editor-grid">
        <SelectControl
          label="Crop mode"
          value={operation.crop}
          options={['inner', 'outer']}
          onChange={(crop) => onChange({ ...operation, crop: crop as 'inner' | 'outer' })}
        />
        <NumberControl
          label="Corner radius"
          value={typeof operation.radius === 'number' ? operation.radius : 0}
          min={0}
          suffix="px"
          onChange={(radius) => onChange({ ...operation, radius })}
        />
        <div className="apx-effects-editor-note">
          <strong>{operation.coordinates.length} path segments</strong>
          <span>Use Advanced contract for precise polygon point coordinates.</span>
        </div>
      </div>
    );
  }

  if (operation.type === 'effects') {
    return (
      <div className="apx-effects-filter-editor">
        {operation.filters.map((filter, index) => {
          const parameterless = IMAGE_FILTER_PARAMETERLESS_TYPES.includes(
            filter.type as (typeof IMAGE_FILTER_PARAMETERLESS_TYPES)[number],
          );
          const fields = imageFilterFieldSpecs(filter.type, width, height, filter);
          return (
            <div className="apx-effects-filter-block" key={index}>
              <div className="apx-effects-filter-head">
                <strong>{index + 1}</strong>
                <select
                  value={filter.type}
                  onChange={(event) => {
                    const filters = operation.filters.map((item, itemIndex) =>
                      itemIndex === index
                        ? defaultVisualImageFilter(
                            event.target.value as VisualImageFilter['type'],
                            width,
                            height,
                          )
                        : item,
                    );
                    onChange({ ...operation, filters }, 'Change image filter');
                  }}
                >
                  {IMAGE_FILTER_TYPES.map((type) => <option key={type}>{type}</option>)}
                </select>
                <button
                  type="button"
                  aria-label="Remove filter"
                  disabled={operation.filters.length <= 1}
                  onClick={() =>
                    onChange(
                      { ...operation, filters: operation.filters.filter((_, itemIndex) => itemIndex !== index) },
                      'Remove image filter',
                    )
                  }
                >
                  <TrashIcon aria-hidden />
                </button>
              </div>
              {!parameterless ? (
                <div className="apx-effects-filter-fields">
                  {fields.map((field) => {
                    const current =
                      typeof filter[field.key] === 'number'
                        ? (filter[field.key] as number)
                        : field.defaultValue;
                    return (
                      <SliderControl
                        key={field.key}
                        label={field.label}
                        value={current}
                        min={field.min}
                        max={field.max}
                        step={field.step}
                        suffix={field.suffix}
                        onChange={(nextValue) => {
                          const filters = operation.filters.map((item, itemIndex) =>
                            itemIndex === index
                              ? updateVisualImageFilterValue(
                                  item,
                                  field.key,
                                  nextValue,
                                  width,
                                  height,
                                )
                              : item,
                          );
                          onChange({ ...operation, filters }, 'Adjust image filter');
                        }}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="apx-effects-editor-note">
                  <span>This filter has no numeric parameters.</span>
                </div>
              )}
            </div>
          );
        })}
        <button
          type="button"
          className="apx-effects-add-filter"
          onClick={() =>
            onChange({
              ...operation,
              filters: [
                ...operation.filters,
                defaultVisualImageFilter('brightness', width, height),
              ],
            }, 'Add image filter')
          }
        >
          <PlusIcon aria-hidden />
          Add filter
        </button>
      </div>
    );
  }

  if (operation.type === 'colorsFilter') {
    const color = typeof operation.filterColor === 'string' ? operation.filterColor : '#5b7cff';
    return (
      <div className="apx-effects-editor-grid">
        <label className="apx-effects-color-field">
          <span>Overlay color</span>
          <div>
            <input
              type="color"
              value={/^#[0-9a-f]{6}$/i.test(color) ? color : '#5b7cff'}
              onChange={(event) => onChange({ ...operation, filterColor: event.target.value })}
            />
            <input
              type="text"
              value={color}
              onChange={(event) => onChange({ ...operation, filterColor: event.target.value })}
            />
          </div>
        </label>
        <SliderControl
          label="Opacity"
          value={operation.opacity ?? 0.2}
          min={0}
          max={1}
          step={0.01}
          onChange={(opacity) => onChange({ ...operation, opacity })}
        />
      </div>
    );
  }

  if (operation.type === 'colorsRemover') {
    const color = rgbHex(
      operation.colorToRemove.red,
      operation.colorToRemove.green,
      operation.colorToRemove.blue,
    );
    return (
      <div className="apx-effects-editor-grid">
        <label className="apx-effects-color-field">
          <span>Color to remove</span>
          <div>
            <input
              type="color"
              value={color}
              onChange={(event) => {
                const next = hexRgb(event.target.value);
                if (next) onChange({ ...operation, colorToRemove: next });
              }}
            />
            <input type="text" value={color} readOnly />
          </div>
        </label>
        <NumberControl label="Red" value={operation.colorToRemove.red} min={0} max={255} onChange={(red) => onChange({ ...operation, colorToRemove: { ...operation.colorToRemove, red } })} />
        <NumberControl label="Green" value={operation.colorToRemove.green} min={0} max={255} onChange={(green) => onChange({ ...operation, colorToRemove: { ...operation.colorToRemove, green } })} />
        <NumberControl label="Blue" value={operation.colorToRemove.blue} min={0} max={255} onChange={(blue) => onChange({ ...operation, colorToRemove: { ...operation.colorToRemove, blue } })} />
      </div>
    );
  }

  if (operation.type === 'blend') {
    const layer = operation.layers[0];
    return (
      <div className="apx-effects-editor-grid">
        <SelectControl
          label="Default blend"
          value={operation.defaultBlendMode ?? 'source-over'}
          options={COMMON_BLEND_MODES}
          onChange={(defaultBlendMode) => onChange({ ...operation, defaultBlendMode: defaultBlendMode as VisualBlendMode })}
        />
        {layer ? (
          <>
            <SelectControl
              label="First layer mode"
              value={layer.blendMode}
              options={COMMON_BLEND_MODES}
              onChange={(blendMode) =>
                onChange({
                  ...operation,
                  layers: operation.layers.map((item, index) =>
                    index === 0 ? { ...item, blendMode: blendMode as VisualBlendMode } : item,
                  ),
                })
              }
            />
            <SliderControl
              label="First layer opacity"
              value={layer.opacity ?? 1}
              min={0}
              max={1}
              step={0.01}
              onChange={(opacity) =>
                onChange({
                  ...operation,
                  layers: operation.layers.map((item, index) =>
                    index === 0 ? { ...item, opacity } : item,
                  ),
                })
              }
            />
          </>
        ) : null}
        <div className="apx-effects-editor-note">
          <strong>{operation.layers.length} blend layer{operation.layers.length === 1 ? '' : 's'}</strong>
          <span>Layer sources and offsets remain available in Advanced contract.</span>
        </div>
      </div>
    );
  }

  if (operation.type === 'masking') {
    const options = operation.options ?? {};
    return (
      <div className="apx-effects-editor-grid">
        <SelectControl
          label="Mask type"
          value={options.type ?? 'alpha'}
          options={['alpha', 'grayscale', 'color']}
          onChange={(type) => onChange({ ...operation, options: { ...options, type: type as 'alpha' | 'grayscale' | 'color' } })}
        />
        <SliderControl
          label="Threshold"
          value={options.threshold ?? 128}
          min={0}
          max={255}
          step={1}
          onChange={(threshold) => onChange({ ...operation, options: { ...options, threshold } })}
        />
        {options.type === 'color' ? (
          <label className="apx-effects-color-field">
            <span>Color key</span>
            <div>
              <input
                type="color"
                value={options.colorKey && /^#[0-9a-f]{6}$/i.test(options.colorKey) ? options.colorKey : '#ffffff'}
                onChange={(event) => onChange({ ...operation, options: { ...options, colorKey: event.target.value } })}
              />
              <input
                type="text"
                value={options.colorKey ?? '#ffffff'}
                onChange={(event) => onChange({ ...operation, options: { ...options, colorKey: event.target.value } })}
              />
            </div>
          </label>
        ) : null}
        <div className="apx-effects-inline-toggle">
          <span>
            <strong>Invert mask</strong>
            <small>Swap visible and hidden mask regions.</small>
          </span>
          <StackToggle
            label="Invert mask"
            checked={options.invert ?? false}
            onChange={(invert) => onChange({ ...operation, options: { ...options, invert } })}
          />
        </div>
      </div>
    );
  }

  if (operation.type === 'gradientBlend') {
    const options = operation.options;
    return (
      <div className="apx-effects-editor-grid">
        <SelectControl
          label="Gradient"
          value={options.type ?? 'linear'}
          options={['linear', 'radial', 'conic']}
          onChange={(type) => onChange({ ...operation, options: { ...options, type: type as 'linear' | 'radial' | 'conic' } })}
        />
        <NumberControl
          label="Angle"
          value={options.angle ?? 90}
          step={1}
          suffix="°"
          onChange={(angle) => onChange({ ...operation, options: { ...options, angle } })}
        />
        <SelectControl
          label="Blend mode"
          value={options.blendMode ?? 'multiply'}
          options={GRADIENT_BLEND_MODES}
          onChange={(blendMode) => onChange({ ...operation, options: { ...options, blendMode: blendMode as (typeof GRADIENT_BLEND_MODES)[number] } })}
        />
        <div className="apx-effects-gradient-stops">
          {options.colors.map((stop, index) => (
            <label key={index}>
              <input
                type="color"
                value={/^#[0-9a-f]{6}$/i.test(stop.color) ? stop.color : '#000000'}
                onChange={(event) =>
                  onChange({
                    ...operation,
                    options: {
                      ...options,
                      colors: options.colors.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, color: event.target.value } : item,
                      ),
                    },
                  })
                }
              />
              <span>{Math.round(stop.stop * 100)}%</span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  if (operation.type === 'stitchImages') {
    const options = operation.options ?? {};
    return (
      <div className="apx-effects-editor-grid">
        <SelectControl
          label="Direction"
          value={options.direction ?? 'horizontal'}
          options={['horizontal', 'vertical', 'grid']}
          onChange={(direction) => onChange({ ...operation, options: { ...options, direction: direction as 'horizontal' | 'vertical' | 'grid' } })}
        />
        <NumberControl label="Overlap" value={options.overlap ?? 0} onChange={(overlap) => onChange({ ...operation, options: { ...options, overlap } })} />
        <NumberControl label="Spacing" value={options.spacing ?? 0} onChange={(spacing) => onChange({ ...operation, options: { ...options, spacing } })} />
        <div className="apx-effects-inline-toggle">
          <span>
            <strong>Blend seams</strong>
            <small>Smooth overlaps between stitched images.</small>
          </span>
          <StackToggle
            label="Blend stitched seams"
            checked={options.blend ?? false}
            onChange={(blend) => onChange({ ...operation, options: { ...options, blend } })}
          />
        </div>
      </div>
    );
  }

  if (operation.type === 'createCollage') {
    return (
      <div className="apx-effects-editor-grid">
        <SelectControl
          label="Layout"
          value={operation.layout.type}
          options={['grid', 'masonry', 'carousel']}
          onChange={(type) => onChange({ ...operation, layout: { ...operation.layout, type: type as 'grid' | 'masonry' | 'carousel' } })}
        />
        <NumberControl label="Columns" value={operation.layout.columns ?? 1} min={1} onChange={(columns) => onChange({ ...operation, layout: { ...operation.layout, columns } })} />
        <NumberControl label="Rows" value={operation.layout.rows} min={1} onChange={(rows) => onChange({ ...operation, layout: { ...operation.layout, rows } })} />
        <NumberControl label="Spacing" value={operation.layout.spacing ?? 8} min={0} onChange={(spacing) => onChange({ ...operation, layout: { ...operation.layout, spacing } })} />
        <NumberControl label="Corner radius" value={operation.layout.borderRadius ?? 0} min={0} onChange={(borderRadius) => onChange({ ...operation, layout: { ...operation.layout, borderRadius } })} />
        <label className="apx-effects-color-field">
          <span>Background</span>
          <div>
            <input
              type="color"
              value={operation.layout.background && /^#[0-9a-f]{6}$/i.test(operation.layout.background) ? operation.layout.background : '#000000'}
              onChange={(event) => onChange({ ...operation, layout: { ...operation.layout, background: event.target.value } })}
            />
            <input
              type="text"
              value={operation.layout.background ?? '#00000000'}
              onChange={(event) => onChange({ ...operation, layout: { ...operation.layout, background: event.target.value } })}
            />
          </div>
        </label>
      </div>
    );
  }

  if (operation.type === 'imgConverter') {
    return (
      <div className="apx-effects-editor-grid">
        <SelectControl
          label="Output format"
          value={operation.newExtension}
          options={['jpeg', 'jpg', 'png', 'webp', 'tiff', 'gif', 'avif', 'heif', 'raw', 'jp2', 'jxl']}
          onChange={(newExtension) =>
            onChange({
              ...operation,
              newExtension: newExtension as typeof operation.newExtension,
            })
          }
        />
      </div>
    );
  }

  if (operation.type === 'compress') {
    const options = operation.options ?? {};
    return (
      <div className="apx-effects-editor-grid">
        <SelectControl
          label="Format"
          value={options.format ?? 'jpeg'}
          options={['jpeg', 'webp', 'avif']}
          onChange={(format) =>
            onChange({
              ...operation,
              options: {
                ...options,
                format: format as 'jpeg' | 'webp' | 'avif',
              },
            })
          }
        />
        <SliderControl
          label="Quality"
          value={options.quality ?? 80}
          min={1}
          max={100}
          step={1}
          suffix="%"
          onChange={(quality) =>
            onChange({ ...operation, options: { ...options, quality } })
          }
        />
        <NumberControl
          label="Max width"
          value={options.maxWidth}
          min={1}
          suffix="px"
          onChange={(maxWidth) =>
            onChange({ ...operation, options: { ...options, maxWidth } })
          }
        />
        <NumberControl
          label="Max height"
          value={options.maxHeight}
          min={1}
          suffix="px"
          onChange={(maxHeight) =>
            onChange({ ...operation, options: { ...options, maxHeight } })
          }
        />
        <div className="apx-effects-inline-toggle">
          <span>
            <strong>Progressive</strong>
            <small>Use progressive encoding when the selected format supports it.</small>
          </span>
          <StackToggle
            label="Progressive compression"
            checked={options.progressive ?? false}
            onChange={(progressive) =>
              onChange({ ...operation, options: { ...options, progressive } })
            }
          />
        </div>
      </div>
    );
  }

  return null;
}

export function VisualImageUtilityAuthoring({
  value,
  mode,
  width = 1000,
  height = 1000,
  onChange,
}: Props) {
  const stack = value.utilityStack ?? [];
  const analyses = value.utilityAnalyses ?? [];
  const visibleTypes = mode === 'effects' ? EFFECT_TYPES : ADVANCED_TYPES;
  const [category, setCategory] = useState<EffectCategory>('all');
  const [addOpen, setAddOpen] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(
    stack.find((operation) => EFFECT_TYPES.has(operation.type))?.id ?? null,
  );
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [analysisExpandedId, setAnalysisExpandedId] = useState<string | null>(
    analyses[0]?.id ?? null,
  );

  const updateStack = (next: VisualImageUtilityOperation[], label: string) =>
    onChange({ ...value, utilityStack: next }, label);

  const updateAnalyses = (next: VisualImageUtilityAnalysis[], label: string) =>
    onChange({ ...value, utilityAnalyses: next }, label);

  const addOperation = (type: ImageUtilityStackType) => {
    const operation = defaultImageUtilityOperation(type, createVisualId('image-op'));
    if (ADVANCED_TYPES.has(type)) {
      updateStack([...stack, operation], 'Add ' + stackLabel(type));
      setExpandedId(operation.id);
      return;
    }
    const firstOutputStage = stack.findIndex((item) => ADVANCED_TYPES.has(item.type));
    const insertAt = firstOutputStage < 0 ? stack.length : firstOutputStage;
    updateStack(
      [...stack.slice(0, insertAt), operation, ...stack.slice(insertAt)],
      'Add ' + stackLabel(type),
    );
    setExpandedId(operation.id);
  };

  const patchOperation = (
    id: string,
    replacement: VisualImageUtilityOperation,
    label = 'Edit image utility',
  ) => {
    updateStack(
      stack.map((operation) =>
        operation.id === id
          ? { ...replacement, id: operation.id, type: operation.type } as VisualImageUtilityOperation
          : operation,
      ),
      label,
    );
  };

  const moveOperation = (index: number, delta: -1 | 1) => {
    const operation = stack[index];
    if (!operation) return;
    const group = ADVANCED_TYPES.has(operation.type) ? ADVANCED_TYPES : EFFECT_TYPES;
    const visibleIndices = stack
      .map((item, itemIndex) => group.has(item.type) ? itemIndex : -1)
      .filter((itemIndex) => itemIndex >= 0);
    const currentVisibleIndex = visibleIndices.indexOf(index);
    const targetVisibleIndex = currentVisibleIndex + delta;
    if (currentVisibleIndex < 0 || targetVisibleIndex < 0 || targetVisibleIndex >= visibleIndices.length) return;
    const nextIndex = visibleIndices[targetVisibleIndex]!;
    const next = [...stack];
    [next[index], next[nextIndex]] = [next[nextIndex]!, next[index]!];
    updateStack(next, 'Reorder image utilities');
  };

  const reorderOperation = (dragId: string, targetId: string) => {
    if (dragId === targetId) return;
    const effectOperations = stack.filter((item) => EFFECT_TYPES.has(item.type));
    const from = effectOperations.findIndex((item) => item.id === dragId);
    const to = effectOperations.findIndex((item) => item.id === targetId);
    if (from < 0 || to < 0) return;
    const reordered = [...effectOperations];
    const [moved] = reordered.splice(from, 1);
    if (!moved) return;
    reordered.splice(to, 0, moved);
    let effectIndex = 0;
    const next = stack.map((item) =>
      EFFECT_TYPES.has(item.type) ? reordered[effectIndex++]! : item,
    );
    updateStack(next, 'Reorder image utilities');
  };

  const duplicateOperation = (index: number) => {
    const operation = stack[index];
    if (!operation) return;
    const copy = {
      ...structuredClone(operation),
      id: createVisualId('image-op'),
    } as VisualImageUtilityOperation;
    const next = [...stack];
    next.splice(index + 1, 0, copy);
    updateStack(next, 'Duplicate image utility');
    setExpandedId(copy.id);
  };

  if (mode === 'advanced') {
    const advancedStack = stack
      .map((operation, index) => ({ operation, index }))
      .filter(({ operation }) => ADVANCED_TYPES.has(operation.type));
    const enabledOutputCount = advancedStack.filter(
      ({ operation }) => operation.enabled !== false,
    ).length;
    const enabledAnalysisCount = analyses.filter(
      (analysis) => analysis.enabled !== false,
    ).length;

    const addAnalysis = (type: VisualImageUtilityAnalysis['type']) => {
      const analysis = defaultImageUtilityAnalysis(
        type,
        createVisualId('image-analysis'),
      );
      updateAnalyses([...analyses, analysis], 'Add image analysis');
      setAnalysisExpandedId(analysis.id);
    };

    return (
      <div
        className="apx-advanced-image-tools apx-advanced-image-tools--workspace"
        data-phase10-advanced
      >
        <div className="apx-advanced-workspace-head">
          <div>
            <strong>Advanced image tools</strong>
            <span>
              Output processing and structured analysis from the real painter.image API.
            </span>
          </div>
          <div className="apx-advanced-workspace-stats" aria-label="Advanced image tool status">
            <span><b>{enabledOutputCount}</b> output</span>
            <span><b>{enabledAnalysisCount}</b> analysis</span>
          </div>
        </div>

        <section className="apx-advanced-tool-library" aria-label="Advanced image capabilities">
          <div className="apx-advanced-library-head">
            <div>
              <strong>Toolbox</strong>
              <small>Add another step at any time. Repeated steps remain independent.</small>
            </div>
          </div>

          <div className="apx-advanced-capability-grid">
            <button
              type="button"
              className="apx-advanced-capability"
              data-accent="blue"
              onClick={() => addOperation('imgConverter')}
            >
              <span className="apx-advanced-capability-icon">
                {operationIcon('imgConverter')}
              </span>
              <span className="apx-advanced-capability-copy">
                <strong>Convert format</strong>
                <small>Re-encode the current raster into a selected output format.</small>
              </span>
              <span className="apx-advanced-capability-action">+ Add</span>
              <span className="apx-advanced-capability-chips">
                <i>PNG</i><i>JPEG</i><i>WebP</i><i>AVIF</i><i>+7</i>
              </span>
            </button>

            <button
              type="button"
              className="apx-advanced-capability"
              data-accent="cyan"
              onClick={() => addOperation('compress')}
            >
              <span className="apx-advanced-capability-icon">
                {operationIcon('compress')}
              </span>
              <span className="apx-advanced-capability-copy">
                <strong>Compress</strong>
                <small>Control output format, quality, maximum size and progressive encoding.</small>
              </span>
              <span className="apx-advanced-capability-action">+ Add</span>
              <span className="apx-advanced-capability-chips">
                <i>Quality</i><i>Max W/H</i><i>Progressive</i>
              </span>
            </button>

            <button
              type="button"
              className="apx-advanced-capability"
              data-accent="violet"
              onClick={() => addAnalysis('extractPalette')}
            >
              <span className="apx-advanced-capability-icon">
                <SwatchIcon className="apx-effects-icon-svg" aria-hidden />
              </span>
              <span className="apx-advanced-capability-copy">
                <strong>Extract palette</strong>
                <small>Return dominant colors with their percentage contribution.</small>
              </span>
              <span className="apx-advanced-capability-action">+ Add</span>
              <span className="apx-advanced-capability-chips">
                <i>1–64 colors</i><i>K-means</i><i>Median cut</i><i>Octree</i>
              </span>
            </button>

            <button
              type="button"
              className="apx-advanced-capability"
              data-accent="orange"
              onClick={() => addAnalysis('colorAnalysis')}
            >
              <span className="apx-advanced-capability-icon">
                <AdjustmentsHorizontalIcon className="apx-effects-icon-svg" aria-hidden />
              </span>
              <span className="apx-advanced-capability-copy">
                <strong>Color analysis</strong>
                <small>Return structured color and frequency pairs without replacing the raster.</small>
              </span>
              <span className="apx-advanced-capability-action">+ Add</span>
              <span className="apx-advanced-capability-chips">
                <i>Color</i><i>Frequency</i><i>Structured result</i>
              </span>
            </button>
          </div>

          <details className="apx-advanced-external-capability">
            <summary>
              <span>
                <strong>External / helper API</strong>
                <small>Capabilities that are not normal hosted authoring steps.</small>
              </span>
              <ChevronDownIcon aria-hidden />
            </summary>
            <div>
              <span>
                <b>removeBackground()</b>
                <small>Available in Apexify.js, but it requires a caller-supplied external API key.</small>
              </span>
              <span>
                <b>validHex()</b>
                <small>Runtime helper only; it validates a color string and does not create image output.</small>
              </span>
            </div>
          </details>
        </section>

        <section className="apx-advanced-active-section" data-phase10-output>
          <div className="apx-advanced-active-head">
            <div>
              <strong>Output pipeline</strong>
              <small>Executed in authored order after the image editing stack.</small>
            </div>
            <span>{advancedStack.length}</span>
          </div>

          <div className="apx-advanced-card-list">
            {advancedStack.length === 0 ? (
              <div className="apx-advanced-empty">
                No output steps yet. Choose Convert format or Compress from the toolbox.
              </div>
            ) : null}
            {advancedStack.map(({ operation, index }, visibleIndex) => {
              const expanded = expandedId === operation.id;
              return (
                <article
                  className="apx-advanced-card"
                  key={operation.id}
                  data-image-utility={operation.type}
                  data-expanded={expanded ? 'true' : undefined}
                >
                  <div className="apx-advanced-card-head">
                    <span className="apx-advanced-order">{visibleIndex + 1}</span>
                    <span
                      className="apx-advanced-card-icon"
                      data-accent={operationAccent(operation.type)}
                    >
                      {operationIcon(operation.type)}
                    </span>
                    <button
                      type="button"
                      className="apx-advanced-card-title"
                      onClick={() => setExpandedId(expanded ? null : operation.id)}
                    >
                      <strong>{stackLabel(operation.type)}</strong>
                      <small>{operationDetail(operation)}</small>
                    </button>
                    <StackToggle
                      label={'Enable ' + stackLabel(operation.type)}
                      checked={operation.enabled !== false}
                      onChange={(enabled) =>
                        patchOperation(
                          operation.id,
                          { ...operation, enabled },
                          'Toggle image utility',
                        )
                      }
                    />
                    <button
                      type="button"
                      className="apx-effects-icon-button"
                      title="Duplicate"
                      onClick={() => duplicateOperation(index)}
                    >
                      <DocumentDuplicateIcon aria-hidden />
                    </button>
                    <button
                      type="button"
                      className="apx-effects-icon-button apx-effects-icon-button--danger"
                      title="Delete"
                      onClick={() =>
                        updateStack(
                          stack.filter((item) => item.id !== operation.id),
                          'Remove image utility',
                        )
                      }
                    >
                      <TrashIcon aria-hidden />
                    </button>
                    <button
                      type="button"
                      className="apx-effects-icon-button"
                      title={expanded ? 'Collapse' : 'Expand'}
                      onClick={() => setExpandedId(expanded ? null : operation.id)}
                    >
                      {expanded ? <ChevronUpIcon aria-hidden /> : <ChevronDownIcon aria-hidden />}
                    </button>
                  </div>

                  {expanded ? (
                    <div className="apx-advanced-card-body">
                      <OperationEditor
                        operation={operation}
                        width={width}
                        height={height}
                        onChange={(replacement, label) =>
                          patchOperation(operation.id, replacement, label)
                        }
                      />
                      <div className="apx-advanced-order-controls">
                        <button
                          type="button"
                          onClick={() => moveOperation(index, -1)}
                          disabled={visibleIndex === 0}
                        >
                          ↑ Earlier
                        </button>
                        <button
                          type="button"
                          onClick={() => moveOperation(index, 1)}
                          disabled={visibleIndex === advancedStack.length - 1}
                        >
                          ↓ Later
                        </button>
                      </div>
                      <details className="apx-effects-contract-details apx-effects-contract-details--developer">
                        <summary>Developer JSON</summary>
                        <div>
                          <JsonConfig
                            value={operation}
                            onApply={(next) =>
                              patchOperation(
                                operation.id,
                                normalizeImageUtilityOperationDraft(
                                  operation.type,
                                  operation.id,
                                  next,
                                ),
                              )
                            }
                          />
                        </div>
                      </details>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>

        <section className="apx-advanced-active-section" data-phase10-analysis>
          <div className="apx-advanced-active-head">
            <div>
              <strong>Analysis jobs</strong>
              <small>Return structured data while preserving the current image output.</small>
            </div>
            <span>{analyses.length}</span>
          </div>

          <div className="apx-advanced-card-list">
            {analyses.length === 0 ? (
              <div className="apx-advanced-empty">
                No analysis jobs yet. Add Palette or Color analysis from the toolbox.
              </div>
            ) : null}
            {analyses.map((analysis, index) => {
              const expanded = analysisExpandedId === analysis.id;
              const palette = analysis.type === 'extractPalette';
              return (
                <article
                  className="apx-advanced-card"
                  data-image-analysis={analysis.type}
                  data-expanded={expanded ? 'true' : undefined}
                  key={analysis.id}
                >
                  <div className="apx-advanced-card-head apx-advanced-card-head--analysis">
                    <span className="apx-advanced-order">{index + 1}</span>
                    <span
                      className="apx-advanced-card-icon"
                      data-accent={palette ? 'violet' : 'orange'}
                    >
                      {palette
                        ? <SwatchIcon className="apx-effects-icon-svg" aria-hidden />
                        : <AdjustmentsHorizontalIcon className="apx-effects-icon-svg" aria-hidden />}
                    </span>
                    <button
                      type="button"
                      className="apx-advanced-card-title"
                      onClick={() =>
                        setAnalysisExpandedId(expanded ? null : analysis.id)
                      }
                    >
                      <strong>{analysisLabel(analysis.type)}</strong>
                      <small>
                        {analysis.enabled === false
                          ? 'Bypassed'
                          : palette
                            ? (analysis.options?.count ?? 8) + ' colors · ' +
                              (analysis.options?.method ?? 'kmeans') + ' · ' +
                              (analysis.options?.format ?? 'hex')
                            : 'color + frequency[]'}
                      </small>
                    </button>
                    <StackToggle
                      label={'Enable ' + analysisLabel(analysis.type)}
                      checked={analysis.enabled !== false}
                      onChange={(enabled) =>
                        updateAnalyses(
                          analyses.map((item) =>
                            item.id === analysis.id ? { ...item, enabled } : item,
                          ),
                          'Toggle image analysis',
                        )
                      }
                    />
                    <button
                      type="button"
                      className="apx-effects-icon-button apx-effects-icon-button--danger"
                      title="Delete"
                      onClick={() =>
                        updateAnalyses(
                          analyses.filter((item) => item.id !== analysis.id),
                          'Remove image analysis',
                        )
                      }
                    >
                      <TrashIcon aria-hidden />
                    </button>
                    <button
                      type="button"
                      className="apx-effects-icon-button"
                      title={expanded ? 'Collapse' : 'Expand'}
                      onClick={() =>
                        setAnalysisExpandedId(expanded ? null : analysis.id)
                      }
                    >
                      {expanded ? <ChevronUpIcon aria-hidden /> : <ChevronDownIcon aria-hidden />}
                    </button>
                  </div>

                  {expanded ? (
                    <div className="apx-advanced-card-body">
                      {analysis.type === 'extractPalette' ? (
                        <div className="apx-effects-editor-grid">
                          <NumberControl
                            label="Colors"
                            value={analysis.options?.count ?? 8}
                            min={1}
                            max={64}
                            onChange={(count) =>
                              updateAnalyses(
                                analyses.map((item) =>
                                  item.id === analysis.id &&
                                  item.type === 'extractPalette'
                                    ? { ...item, options: { ...item.options, count } }
                                    : item,
                                ),
                                'Edit palette analysis',
                              )
                            }
                          />
                          <SelectControl
                            label="Method"
                            value={analysis.options?.method ?? 'kmeans'}
                            options={['kmeans', 'median-cut', 'octree']}
                            onChange={(method) =>
                              updateAnalyses(
                                analyses.map((item) =>
                                  item.id === analysis.id &&
                                  item.type === 'extractPalette'
                                    ? {
                                        ...item,
                                        options: {
                                          ...item.options,
                                          method: method as
                                            | 'kmeans'
                                            | 'median-cut'
                                            | 'octree',
                                        },
                                      }
                                    : item,
                                ),
                                'Edit palette analysis',
                              )
                            }
                          />
                          <SelectControl
                            label="Format"
                            value={analysis.options?.format ?? 'hex'}
                            options={['hex', 'rgb', 'hsl']}
                            onChange={(format) =>
                              updateAnalyses(
                                analyses.map((item) =>
                                  item.id === analysis.id &&
                                  item.type === 'extractPalette'
                                    ? {
                                        ...item,
                                        options: {
                                          ...item.options,
                                          format: format as 'hex' | 'rgb' | 'hsl',
                                        },
                                      }
                                    : item,
                                ),
                                'Edit palette analysis',
                              )
                            }
                          />
                        </div>
                      ) : (
                        <div className="apx-advanced-result-contract">
                          <strong>Result</strong>
                          <span>
                            Apexify.js returns an array of {'{ color, frequency }'} records.
                            There are no authoring parameters for this operation.
                          </span>
                        </div>
                      )}
                      <details className="apx-effects-contract-details apx-effects-contract-details--developer">
                        <summary>Developer JSON</summary>
                        <div>
                          <JsonConfig
                            value={analysis}
                            onApply={(next) => {
                              const parsed = normalizeImageUtilityAnalysisDraft(
                                analysis.type,
                                analysis.id,
                                next,
                              );
                              updateAnalyses(
                                analyses.map((item) =>
                                  item.id === analysis.id ? parsed : item,
                                ),
                                'Edit image analysis',
                              );
                            }}
                          />
                        </div>
                      </details>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
      </div>
    );
  }

  const allowedTypes = IMAGE_UTILITY_STACK_TYPES.filter(
    (type) =>
      visibleTypes.has(type) &&
      (category === 'all' ||
        EFFECT_CATEGORY_TYPES[category as Exclude<EffectCategory, 'all'>].includes(type)),
  );
  const visibleStack = stack
    .map((operation, index) => ({ operation, index }))
    .filter(({ operation }) => EFFECT_TYPES.has(operation.type));

  return (
    <div className="apx-effects-stack" data-phase10-image-stack>
      <div className="apx-effects-stack-head">
        <div>
          <div className="apx-effects-title-row">
            <strong>Effects Stack</strong>
            <span title="Executed in order without destructively replacing the selected image.">?</span>
          </div>
          <small>Non-destructive image pipeline · Image utility pipeline</small>
        </div>
        <div className="apx-effects-head-actions">
          <details className="apx-effects-presets" data-phase10-presets>
            <summary>Presets</summary>
            <div>
              <button
                type="button"
                onClick={() =>
                  updateStack([
                    defaultImageUtilityOperation('resize', createVisualId('image-op')),
                    {
                      ...defaultImageUtilityOperation('effects', createVisualId('image-op')),
                      filters: [
                        { type: 'contrast', value: 1.08 },
                        { type: 'saturation', value: 1.08 },
                        { type: 'sharpen', intensity: 0.25 },
                      ],
                    } as VisualImageUtilityOperation,
                    defaultImageUtilityOperation('compress', createVisualId('image-op')),
                  ], 'Apply web image preset')
                }
              >
                Web ready
              </button>
              <button
                type="button"
                onClick={() =>
                  updateStack([
                    {
                      ...defaultImageUtilityOperation('effects', createVisualId('image-op')),
                      filters: [
                        { type: 'brightness', value: 0.04 },
                        { type: 'contrast', value: 1.06 },
                        { type: 'saturation', value: 1.1 },
                      ],
                    } as VisualImageUtilityOperation,
                    defaultImageUtilityOperation('gradientBlend', createVisualId('image-op')),
                  ], 'Apply image polish preset')
                }
              >
                Polish
              </button>
              <button type="button" onClick={() => updateStack([], 'Clear image utilities')}>
                Clear stack
              </button>
            </div>
          </details>
          <button
            type="button"
            className="apx-effects-add-step"
            data-open={addOpen ? 'true' : undefined}
            onClick={() => setAddOpen((open) => !open)}
          >
            <PlusIcon aria-hidden />
            Add step
            <ChevronDownIcon aria-hidden />
          </button>
        </div>
      </div>

      {addOpen ? (
        <div className="apx-effects-add-tray">
          <div className="apx-effects-categories">
            {EFFECT_CATEGORIES.map((item) => (
              <button
                key={item.id}
                type="button"
                data-active={category === item.id ? 'true' : undefined}
                onClick={() => setCategory(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="apx-effects-quick-grid">
            {allowedTypes.map((type) => (
              <button
                key={type}
                type="button"
                data-accent={operationAccent(type)}
                onClick={() => addOperation(type)}
              >
                <span className="apx-effects-quick-icon">{operationIcon(type)}</span>
                <strong>{stackLabel(type)}</strong>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="apx-effects-stack-list">
        {visibleStack.length === 0 ? (
          <div className="apx-effects-empty">
            <SparklesIcon aria-hidden />
            <strong>No effects yet</strong>
            <span>Add a step above. Every edit remains reorderable and non-destructive.</span>
          </div>
        ) : null}

        {visibleStack.map(({ operation, index }, visibleIndex) => {
          const expanded = expandedId === operation.id;
          return (
            <article
              key={operation.id}
              className="apx-effects-card"
              data-image-utility={operation.type}
              data-accent={operationAccent(operation.type)}
              data-expanded={expanded ? 'true' : undefined}
              draggable
              onDragStart={() => setDraggingId(operation.id)}
              onDragEnd={() => setDraggingId(null)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (draggingId) reorderOperation(draggingId, operation.id);
                setDraggingId(null);
              }}
            >
              <div className="apx-effects-card-head">
                <span className="apx-effects-drag" title="Drag to reorder">
                  <Bars3Icon aria-hidden />
                </span>
                <span className="apx-effects-card-icon">
                  {operationIcon(operation.type)}
                </span>
                <span className="apx-effects-order">{visibleIndex + 1}</span>
                <button
                  type="button"
                  className="apx-effects-card-title"
                  onClick={() => setExpandedId(expanded ? null : operation.id)}
                >
                  <strong>{stackLabel(operation.type)}</strong>
                  <small>{operationDetail(operation)} · {operation.enabled === false ? 'Bypassed' : 'Active'}</small>
                </button>
                <StackToggle
                  label={'Enable ' + stackLabel(operation.type)}
                  checked={operation.enabled !== false}
                  onChange={(enabled) =>
                    patchOperation(operation.id, { ...operation, enabled }, 'Toggle image utility')
                  }
                />
                <button
                  type="button"
                  className="apx-effects-icon-button"
                  title="Duplicate"
                  onClick={() => duplicateOperation(index)}
                >
                  <DocumentDuplicateIcon aria-hidden />
                </button>
                <button
                  type="button"
                  className="apx-effects-icon-button apx-effects-icon-button--danger"
                  title="Delete"
                  onClick={() =>
                    updateStack(
                      stack.filter((item) => item.id !== operation.id),
                      'Remove image utility',
                    )
                  }
                >
                  <TrashIcon aria-hidden />
                </button>
                <button
                  type="button"
                  className="apx-effects-icon-button"
                  title={expanded ? 'Collapse' : 'Expand'}
                  onClick={() => setExpandedId(expanded ? null : operation.id)}
                >
                  {expanded ? <ChevronUpIcon aria-hidden /> : <ChevronDownIcon aria-hidden />}
                </button>
              </div>

              {expanded ? (
                <div className="apx-effects-card-body">
                  <OperationEditor
                    operation={operation}
                    width={width}
                    height={height}
                    onChange={(replacement, label) =>
                      patchOperation(operation.id, replacement, label)
                    }
                  />
                  <details className="apx-effects-contract-details">
                    <summary>Advanced contract</summary>
                    <div>
                      <div className="apx-effects-reorder-fallback">
                        <button type="button" onClick={() => moveOperation(index, -1)} disabled={visibleIndex === 0}>Move up</button>
                        <button type="button" onClick={() => moveOperation(index, 1)} disabled={visibleIndex === visibleStack.length - 1}>Move down</button>
                      </div>
                      <JsonConfig
                        value={operation}
                        onApply={(next) =>
                          patchOperation(
                            operation.id,
                            normalizeImageUtilityOperationDraft(operation.type, operation.id, next),
                          )
                        }
                      />
                    </div>
                  </details>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}