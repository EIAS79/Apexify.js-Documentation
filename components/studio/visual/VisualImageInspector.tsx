'use client';

import type { ReactNode } from 'react';

import { VisualImageUtilityAuthoring } from '@/components/studio/visual/VisualImageUtilityAuthoring';
import {
  studioAssetIdFromReference,
  studioAssetReference,
  type StudioVirtualAsset,
} from '@/lib/studio/runtime/assets';
import {
  IMAGE_ALIGNS,
  IMAGE_BLEND_MODES,
  IMAGE_FILTER_PARAMETERLESS_TYPES,
  IMAGE_FILTER_TYPES,
  IMAGE_FITS,
  IMAGE_SHAPE_TYPES,
  defaultShapeNodeProps,
  defaultVisualImageFilter,
  visualImageBatchGroupProps,
  imageFilterFieldSpecs,
  updateVisualImageFilterValue,
  visualImageProps,
} from '@/lib/studio/visual/image-contract';
import type {
  VisualBlendMode,
  VisualGradient,
  VisualImageBatchGroupProps,
  VisualImageDistortion,
  VisualImageFilter,
  VisualImageGroupTransform,
  VisualImageMeshWarp,
  VisualImageNodeProps,
  VisualNode,
  VisualProject,
  VisualShapeType,
  VisualShadowOptions,
  VisualStrokeOptions,
} from '@/lib/studio/visual/model';

type InspectorTab = 'transform' | 'style' | 'effects' | 'data' | 'advanced';

type Props = {
  project: VisualProject;
  node: VisualNode;
  tab: InspectorTab;
  imageAssets: readonly StudioVirtualAsset[];
  generatedNodes: readonly VisualNode[];
  onChange: (
    label: string,
    updater: (current: VisualImageNodeProps) => VisualImageNodeProps,
  ) => void;
  onRename: (name: string) => void;
  renderTransform: () => ReactNode;
};

const DISTORTION_TYPES: readonly NonNullable<
  VisualImageNodeProps['distortion']
>['type'][] = ['perspective', 'warp', 'bulge', 'pinch', 'twirl', 'wave'];

const INTERPOLATIONS = ['nearest', 'bilinear', 'bicubic'] as const;
const EDGE_MODES = ['transparent', 'clamp', 'wrap', 'mirror'] as const;
const FALLOFFS = ['linear', 'smooth', 'gaussian'] as const;
const MASK_MODES = ['alpha', 'luminance', 'inverse'] as const;
const STROKE_STYLES = ['solid', 'dashed', 'dotted', 'groove', 'ridge', 'double'] as const;

function numberValue(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function Section({
  title,
  description,
  children,
  attr,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  attr: string;
}) {
  return (
    <section className="apx-pre4-section" data-image-v2-section={attr}>
      <div className="apx-canvas-section-heading">
        <div>
          <div className="apx-pre4-section-title">{title}</div>
          {description ? (
            <small className="apx-canvas-v2-field-hint">{description}</small>
          ) : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function NumericField({
  label,
  value,
  onChange,
  step = 1,
  min,
  max,
}: {
  label: string;
  value: number | undefined;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
}) {
  return (
    <label>
      <span>{label}</span>
      <input
        className="apx-pre4-input"
        type="number"
        value={value ?? ''}
        step={step}
        min={min}
        max={max}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function GradientEditor({
  value,
  onChange,
}: {
  value: VisualGradient;
  onChange: (gradient: VisualGradient) => void;
}) {
  const set = (patch: Record<string, unknown>) =>
    onChange({ ...value, ...patch } as VisualGradient);
  return (
    <div className="apx-image-v2-nested" data-image-gradient-editor>
      <div className="apx-pre4-property-grid">
        <label>
          <span>Gradient</span>
          <select
            className="apx-pre4-input"
            value={value.type}
            onChange={(event) => {
              const type = event.target.value as VisualGradient['type'];
              if (type === 'linear') {
                onChange({
                  type,
                  startX: 0,
                  startY: 0,
                  endX: 100,
                  endY: 0,
                  colors: value.colors,
                });
              } else if (type === 'radial') {
                onChange({
                  type,
                  startX: 50,
                  startY: 50,
                  startRadius: 0,
                  endX: 50,
                  endY: 50,
                  endRadius: 50,
                  colors: value.colors,
                });
              } else {
                onChange({
                  type,
                  centerX: 50,
                  centerY: 50,
                  startAngle: 0,
                  colors: value.colors,
                });
              }
            }}
          >
            <option value="linear">linear</option>
            <option value="radial">radial</option>
            <option value="conic">conic</option>
          </select>
        </label>
        {'repeat' in value ? (
          <label>
            <span>Repeat</span>
            <select
              className="apx-pre4-input"
              value={value.repeat ?? 'no-repeat'}
              onChange={(event) => set({ repeat: event.target.value })}
            >
              <option value="no-repeat">no-repeat</option>
              <option value="repeat">repeat</option>
              <option value="reflect">reflect</option>
            </select>
          </label>
        ) : null}
      </div>
      <div className="apx-image-filter-stack">
        {value.colors.map((stop, index) => (
          <div className="apx-image-filter-row" key={index}>
            <input
              type="color"
              value={stop.color.startsWith('#') ? stop.color : '#ffffff'}
              onChange={(event) => {
                const colors = value.colors.map((item, itemIndex) =>
                  itemIndex === index ? { ...item, color: event.target.value } : item,
                );
                set({ colors });
              }}
            />
            <input
              className="apx-pre4-input"
              value={stop.color}
              onChange={(event) => {
                const colors = value.colors.map((item, itemIndex) =>
                  itemIndex === index ? { ...item, color: event.target.value } : item,
                );
                set({ colors });
              }}
            />
            <input
              className="apx-pre4-input"
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={stop.stop}
              onChange={(event) => {
                const colors = value.colors.map((item, itemIndex) =>
                  itemIndex === index ? { ...item, stop: Number(event.target.value) } : item,
                );
                set({ colors });
              }}
            />
            <button
              type="button"
              className="apx-canvas-mini-button"
              disabled={value.colors.length <= 2}
              onClick={() =>
                set({ colors: value.colors.filter((_, itemIndex) => itemIndex !== index) })
              }
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="apx-canvas-mini-button"
        onClick={() =>
          set({
            colors: [
              ...value.colors,
              {
                stop: value.colors.length
                  ? Math.min(1, value.colors[value.colors.length - 1]!.stop + 0.1)
                  : 1,
                color: '#ffffff',
              },
            ],
          })
        }
      >
        ＋ Stop
      </button>
      <div className="apx-pre4-property-grid">
        {value.type === 'linear' ? (
          <>
            <NumericField label="Start X" value={value.startX} onChange={(startX) => set({ startX })} />
            <NumericField label="Start Y" value={value.startY} onChange={(startY) => set({ startY })} />
            <NumericField label="End X" value={value.endX} onChange={(endX) => set({ endX })} />
            <NumericField label="End Y" value={value.endY} onChange={(endY) => set({ endY })} />
          </>
        ) : null}
        {value.type === 'radial' ? (
          <>
            <NumericField label="Start X" value={value.startX} onChange={(startX) => set({ startX })} />
            <NumericField label="Start Y" value={value.startY} onChange={(startY) => set({ startY })} />
            <NumericField label="Start radius" value={value.startRadius} min={0} onChange={(startRadius) => set({ startRadius })} />
            <NumericField label="End X" value={value.endX} onChange={(endX) => set({ endX })} />
            <NumericField label="End Y" value={value.endY} onChange={(endY) => set({ endY })} />
            <NumericField label="End radius" value={value.endRadius} min={0} onChange={(endRadius) => set({ endRadius })} />
          </>
        ) : null}
        {value.type === 'conic' ? (
          <>
            <NumericField label="Center X" value={value.centerX} onChange={(centerX) => set({ centerX })} />
            <NumericField label="Center Y" value={value.centerY} onChange={(centerY) => set({ centerY })} />
            <NumericField label="Start angle" value={value.startAngle} onChange={(startAngle) => set({ startAngle })} />
          </>
        ) : null}
      </div>
    </div>
  );
}

function PointListEditor({
  title,
  points,
  onChange,
  minPoints = 0,
}: {
  title: string;
  points: Array<{ x: number; y: number }>;
  onChange: (points: Array<{ x: number; y: number }>) => void;
  minPoints?: number;
}) {
  return (
    <div className="apx-image-v2-nested" data-image-point-list>
      <div className="apx-canvas-section-heading">
        <strong>{title}</strong>
        <button
          className="apx-canvas-mini-button"
          type="button"
          onClick={() => onChange([...points, { x: 0, y: 0 }])}
        >
          ＋ Point
        </button>
      </div>
      {points.map((point, index) => (
        <div className="apx-pre4-property-grid" key={index}>
          <NumericField
            label={'X ' + (index + 1)}
            value={point.x}
            onChange={(x) =>
              onChange(points.map((item, itemIndex) => itemIndex === index ? { ...item, x } : item))
            }
          />
          <NumericField
            label={'Y ' + (index + 1)}
            value={point.y}
            onChange={(y) =>
              onChange(points.map((item, itemIndex) => itemIndex === index ? { ...item, y } : item))
            }
          />
          <button
            className="apx-canvas-mini-button"
            type="button"
            disabled={points.length <= minPoints}
            onClick={() => onChange(points.filter((_, itemIndex) => itemIndex !== index))}
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}

function StrokeEditor({
  value,
  onChange,
}: {
  value: VisualStrokeOptions;
  onChange: (stroke: VisualStrokeOptions) => void;
}) {
  return (
    <div className="apx-image-v2-nested">
      <div className="apx-canvas-color-row">
        <input
          type="color"
          value={value.color?.startsWith('#') ? value.color : '#ffffff'}
          onChange={(event) => onChange({ ...value, color: event.target.value })}
        />
        <input
          className="apx-pre4-input"
          value={value.color ?? '#ffffff'}
          onChange={(event) => onChange({ ...value, color: event.target.value })}
        />
      </div>
      <div className="apx-pre4-property-grid">
        <NumericField label="Width" value={value.width} onChange={(width) => onChange({ ...value, width })} />
        <NumericField label="Position" value={value.position} onChange={(position) => onChange({ ...value, position })} />
        <NumericField label="Blur" value={value.blur} onChange={(blur) => onChange({ ...value, blur })} />
        <NumericField label="Opacity" value={value.opacity} step={0.01} onChange={(opacity) => onChange({ ...value, opacity })} />
        <label>
          <span>Style</span>
          <select
            className="apx-pre4-input"
            value={value.style ?? 'solid'}
            onChange={(event) => onChange({ ...value, style: event.target.value as VisualStrokeOptions['style'] })}
          >
            {STROKE_STYLES.map((style) => <option key={style}>{style}</option>)}
          </select>
        </label>
        <label>
          <span>Rounded corners</span>
          <input
            className="apx-pre4-input"
            value={value.roundedCorners ?? ''}
            placeholder="all / top / left…"
            onChange={(event) => onChange({ ...value, roundedCorners: event.target.value })}
          />
        </label>
      </div>
    </div>
  );
}

function ShadowEditor({
  value,
  onChange,
}: {
  value: VisualShadowOptions;
  onChange: (shadow: VisualShadowOptions) => void;
}) {
  return (
    <div className="apx-image-v2-nested">
      <div className="apx-canvas-color-row">
        <input
          type="color"
          value={value.color?.startsWith('#') ? value.color : '#000000'}
          onChange={(event) => onChange({ ...value, color: event.target.value })}
        />
        <input
          className="apx-pre4-input"
          value={value.color ?? '#000000'}
          onChange={(event) => onChange({ ...value, color: event.target.value })}
        />
      </div>
      <div className="apx-pre4-property-grid">
        <NumericField label="Offset X" value={value.offsetX} onChange={(offsetX) => onChange({ ...value, offsetX })} />
        <NumericField label="Offset Y" value={value.offsetY} onChange={(offsetY) => onChange({ ...value, offsetY })} />
        <NumericField label="Blur" value={value.blur} onChange={(blur) => onChange({ ...value, blur })} />
        <NumericField label="Opacity" value={value.opacity} step={0.01} onChange={(opacity) => onChange({ ...value, opacity })} />
        <label>
          <span>Rounded corners</span>
          <input
            className="apx-pre4-input"
            value={value.roundedCorners ?? ''}
            placeholder="all / top / left…"
            onChange={(event) => onChange({ ...value, roundedCorners: event.target.value })}
          />
        </label>
      </div>
    </div>
  );
}

function FilterEditor({
  filters,
  width,
  height,
  onChange,
}: {
  filters: VisualImageFilter[];
  width: number;
  height: number;
  onChange: (filters: VisualImageFilter[]) => void;
}) {
  return (
    <div data-image-v2-filter-stack>
      <div className="apx-canvas-section-heading">
        <span />
        <button
          className="apx-canvas-mini-button"
          type="button"
          onClick={() =>
            onChange([...filters, defaultVisualImageFilter('brightness', width, height)])
          }
        >
          ＋ Filter
        </button>
      </div>
      <div className="apx-image-filter-stack">
        {filters.map((filter, index) => {
          const fields = imageFilterFieldSpecs(filter.type, width, height, filter);
          const parameterless = IMAGE_FILTER_PARAMETERLESS_TYPES.includes(
            filter.type as (typeof IMAGE_FILTER_PARAMETERLESS_TYPES)[number],
          );
          return (
            <div className="apx-image-filter-row" key={index} data-filter-type={filter.type}>
              <select
                className="apx-pre4-input"
                value={filter.type}
                onChange={(event) =>
                  onChange(
                    filters.map((item, itemIndex) =>
                      itemIndex === index
                        ? defaultVisualImageFilter(
                            event.target.value as VisualImageFilter['type'],
                            width,
                            height,
                          )
                        : item,
                    ),
                  )
                }
              >
                {IMAGE_FILTER_TYPES.map((type) => <option key={type}>{type}</option>)}
              </select>
              {!parameterless ? (
                <div className="apx-pre4-property-grid">
                  {fields.map((field) => (
                    <NumericField
                      key={field.key}
                      label={field.label}
                      value={filter[field.key] as number | undefined}
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      onChange={(value) =>
                        onChange(
                          filters.map((item, itemIndex) =>
                            itemIndex === index
                              ? updateVisualImageFilterValue(item, field.key, value, width, height)
                              : item,
                          ),
                        )
                      }
                    />
                  ))}
                </div>
              ) : (
                <small className="apx-canvas-v2-field-hint">Presence means enabled.</small>
              )}
              <button
                className="apx-canvas-mini-button"
                type="button"
                onClick={() => onChange(filters.filter((_, itemIndex) => itemIndex !== index))}
              >
                Remove
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DistortionEditor({
  value,
  onChange,
}: {
  value: VisualImageDistortion;
  onChange: (value: VisualImageDistortion) => void;
}) {
  const set = (patch: Partial<VisualImageDistortion>) => onChange({ ...value, ...patch });
  return (
    <div className="apx-image-v2-nested" data-image-v2-distortion>
      <div className="apx-pre4-property-grid">
        <label>
          <span>Type</span>
          <select
            className="apx-pre4-input"
            value={value.type}
            onChange={(event) => {
              const type = event.target.value as VisualImageDistortion['type'];
              const next: VisualImageDistortion = { type };
              if (type === 'perspective') next.points = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }];
              if (type === 'warp') next.controlPoints = [{ from: { x: 50, y: 50 }, to: { x: 60, y: 50 }, radius: 40, strength: 1, falloff: 'smooth' }];
              onChange(next);
            }}
          >
            {DISTORTION_TYPES.map((type) => <option key={type}>{type}</option>)}
          </select>
        </label>
        <label>
          <span>Interpolation</span>
          <select className="apx-pre4-input" value={value.interpolation ?? 'bilinear'} onChange={(event) => set({ interpolation: event.target.value as VisualImageDistortion['interpolation'] })}>
            {INTERPOLATIONS.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label>
          <span>Edge mode</span>
          <select className="apx-pre4-input" value={value.edgeMode ?? 'transparent'} onChange={(event) => set({ edgeMode: event.target.value as VisualImageDistortion['edgeMode'] })}>
            {EDGE_MODES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <NumericField label="Intensity" value={value.intensity} step={0.1} onChange={(intensity) => set({ intensity })} />
        <NumericField label="Center X" value={value.centerX} onChange={(centerX) => set({ centerX })} />
        <NumericField label="Center Y" value={value.centerY} onChange={(centerY) => set({ centerY })} />
        <NumericField label="Radius" value={value.radius} min={0.0001} onChange={(radius) => set({ radius })} />
      </div>

      {(value.type === 'perspective' || (value.type === 'warp' && value.points)) ? (
        <PointListEditor
          title={value.type === 'perspective' ? 'Destination quad' : 'Warp quad'}
          points={value.points ?? []}
          minPoints={4}
          onChange={(points) => set({ points, controlPoints: undefined })}
        />
      ) : null}

      {value.type === 'warp' && value.controlPoints ? (
        <div className="apx-image-v2-nested" data-image-v2-warp-handles>
          <div className="apx-canvas-section-heading">
            <strong>Liquify handles</strong>
            <button
              className="apx-canvas-mini-button"
              type="button"
              onClick={() =>
                set({
                  points: undefined,
                  controlPoints: [
                    ...(value.controlPoints ?? []),
                    {
                      from: { x: 0, y: 0 },
                      to: { x: 10, y: 0 },
                      radius: 25,
                      strength: 1,
                      falloff: 'smooth',
                    },
                  ],
                })
              }
            >
              ＋ Handle
            </button>
          </div>
          {(value.controlPoints ?? []).map((handle, index) => (
            <div className="apx-image-filter-row" key={index}>
              <div className="apx-pre4-property-grid">
                <NumericField label="From X" value={handle.from.x} onChange={(x) => set({ controlPoints: (value.controlPoints ?? []).map((item, itemIndex) => itemIndex === index ? { ...item, from: { ...item.from, x } } : item) })} />
                <NumericField label="From Y" value={handle.from.y} onChange={(y) => set({ controlPoints: (value.controlPoints ?? []).map((item, itemIndex) => itemIndex === index ? { ...item, from: { ...item.from, y } } : item) })} />
                <NumericField label="To X" value={handle.to.x} onChange={(x) => set({ controlPoints: (value.controlPoints ?? []).map((item, itemIndex) => itemIndex === index ? { ...item, to: { ...item.to, x } } : item) })} />
                <NumericField label="To Y" value={handle.to.y} onChange={(y) => set({ controlPoints: (value.controlPoints ?? []).map((item, itemIndex) => itemIndex === index ? { ...item, to: { ...item.to, y } } : item) })} />
                <NumericField label="Radius" value={handle.radius} min={0.0001} onChange={(radius) => set({ controlPoints: (value.controlPoints ?? []).map((item, itemIndex) => itemIndex === index ? { ...item, radius } : item) })} />
                <NumericField label="Strength" value={handle.strength} step={0.1} onChange={(strength) => set({ controlPoints: (value.controlPoints ?? []).map((item, itemIndex) => itemIndex === index ? { ...item, strength } : item) })} />
                <label>
                  <span>Falloff</span>
                  <select
                    className="apx-pre4-input"
                    value={handle.falloff ?? 'smooth'}
                    onChange={(event) =>
                      set({
                        controlPoints: (value.controlPoints ?? []).map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, falloff: event.target.value as typeof handle.falloff }
                            : item,
                        ),
                      })
                    }
                  >
                    {FALLOFFS.map((falloff) => <option key={falloff}>{falloff}</option>)}
                  </select>
                </label>
              </div>
              <button
                className="apx-canvas-mini-button"
                type="button"
                disabled={(value.controlPoints?.length ?? 0) <= 1}
                onClick={() => set({ controlPoints: (value.controlPoints ?? []).filter((_, itemIndex) => itemIndex !== index) })}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            className="apx-canvas-mini-button"
            type="button"
            onClick={() => set({ controlPoints: undefined, points: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }] })}
          >
            Switch to 4-point quad warp
          </button>
        </div>
      ) : null}

      {value.type === 'warp' && !value.points && !value.controlPoints ? (
        <div className="apx-pre4-property-grid">
          <button className="apx-canvas-mini-button" type="button" onClick={() => set({ points: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }] })}>4-point quad</button>
          <button className="apx-canvas-mini-button" type="button" onClick={() => set({ controlPoints: [{ from: { x: 50, y: 50 }, to: { x: 60, y: 50 }, radius: 25, strength: 1, falloff: 'smooth' }] })}>Liquify handles</button>
        </div>
      ) : null}

      {value.type === 'twirl' ? (
        <div className="apx-pre4-property-grid">
          <NumericField label="Angle °" value={value.angle} onChange={(angle) => set({ angle })} />
        </div>
      ) : null}
      {value.type === 'wave' ? (
        <div className="apx-pre4-property-grid">
          <NumericField label="Amplitude X" value={value.amplitudeX} onChange={(amplitudeX) => set({ amplitudeX })} />
          <NumericField label="Amplitude Y" value={value.amplitudeY} onChange={(amplitudeY) => set({ amplitudeY })} />
          <NumericField label="Wavelength X" value={value.wavelengthX} min={0.0001} onChange={(wavelengthX) => set({ wavelengthX })} />
          <NumericField label="Wavelength Y" value={value.wavelengthY} min={0.0001} onChange={(wavelengthY) => set({ wavelengthY })} />
          <NumericField label="Phase X °" value={value.phaseX} onChange={(phaseX) => set({ phaseX })} />
          <NumericField label="Phase Y °" value={value.phaseY} onChange={(phaseY) => set({ phaseY })} />
        </div>
      ) : null}
    </div>
  );
}

function defaultMesh(width: number, height: number): VisualImageMeshWarp {
  return {
    gridX: 2,
    gridY: 2,
    interpolation: 'bilinear',
    edgeMode: 'transparent',
    controlPoints: Array.from({ length: 3 }, (_, y) =>
      Array.from({ length: 3 }, (_, x) => ({
        x: (width / 2) * x,
        y: (height / 2) * y,
      })),
    ),
  };
}

function MeshWarpEditor({
  value,
  width,
  height,
  onChange,
}: {
  value: VisualImageMeshWarp;
  width: number;
  height: number;
  onChange: (value: VisualImageMeshWarp) => void;
}) {
  const set = (patch: Partial<VisualImageMeshWarp>) => onChange({ ...value, ...patch });
  return (
    <div className="apx-image-v2-nested" data-image-v2-mesh-warp>
      <div className="apx-pre4-property-grid">
        <NumericField label="Grid X" value={value.gridX} min={1} step={1} onChange={(gridX) => set({ gridX: Math.max(1, Math.round(gridX)) })} />
        <NumericField label="Grid Y" value={value.gridY} min={1} step={1} onChange={(gridY) => set({ gridY: Math.max(1, Math.round(gridY)) })} />
        <label>
          <span>Interpolation</span>
          <select className="apx-pre4-input" value={value.interpolation ?? 'bilinear'} onChange={(event) => set({ interpolation: event.target.value as VisualImageMeshWarp['interpolation'] })}>
            {INTERPOLATIONS.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label>
          <span>Edge mode</span>
          <select className="apx-pre4-input" value={value.edgeMode ?? 'transparent'} onChange={(event) => set({ edgeMode: event.target.value as VisualImageMeshWarp['edgeMode'] })}>
            {EDGE_MODES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
      </div>
      <button className="apx-canvas-mini-button" type="button" onClick={() => onChange(defaultMesh(width, height))}>
        Reset regular 2×2 mesh
      </button>
      <div className="apx-image-filter-stack">
        {(value.controlPoints ?? []).map((row, y) => (
          <div className="apx-image-filter-row" key={y}>
            <strong>Row {y + 1}</strong>
            {row.map((point, x) => (
              <div className="apx-pre4-property-grid" key={x}>
                <NumericField
                  label={'X ' + (x + 1)}
                  value={point.x}
                  onChange={(nextX) =>
                    set({
                      controlPoints: (value.controlPoints ?? []).map((currentRow, rowIndex) =>
                        rowIndex === y
                          ? currentRow.map((item, colIndex) => colIndex === x ? { ...item, x: nextX } : item)
                          : currentRow,
                      ),
                    })
                  }
                />
                <NumericField
                  label={'Y ' + (x + 1)}
                  value={point.y}
                  onChange={(nextY) =>
                    set({
                      controlPoints: (value.controlPoints ?? []).map((currentRow, rowIndex) =>
                        rowIndex === y
                          ? currentRow.map((item, colIndex) => colIndex === x ? { ...item, y: nextY } : item)
                          : currentRow,
                      ),
                    })
                  }
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function GroupTransformEditor({
  value,
  width,
  height,
  onChange,
}: {
  value: VisualImageGroupTransform;
  width: number;
  height: number;
  onChange: (value: VisualImageGroupTransform) => void;
}) {
  const set = (patch: Partial<VisualImageGroupTransform>) =>
    onChange({ ...value, ...patch });

  return (
    <div className="apx-image-v2-nested" data-image-v2-group-transform>
      <Section
        title="Group transform"
        description="Applied once to the temporary grouped ImageProperties[] surface."
        attr="group-transform-geometry"
      >
        <div className="apx-pre4-property-grid">
          {([
            ['Rotation', 'rotation'],
            ['Translate X', 'translateX'],
            ['Translate Y', 'translateY'],
            ['Scale X', 'scaleX'],
            ['Scale Y', 'scaleY'],
            ['Pivot X', 'pivotX'],
            ['Pivot Y', 'pivotY'],
            ['Opacity', 'opacity'],
            ['Blur', 'blur'],
            ['Filter intensity', 'filterIntensity'],
          ] as const).map(([label, key]) => (
            <NumericField
              key={key}
              label={label}
              value={value[key] as number | undefined}
              step={key.includes('scale') || key === 'opacity' ? 0.01 : 1}
              onChange={(nextValue) => set({ [key]: nextValue })}
            />
          ))}
          <label>
            <span>Blend</span>
            <select
              className="apx-pre4-input"
              value={value.blendMode ?? 'source-over'}
              onChange={(event) =>
                set({ blendMode: event.target.value as VisualBlendMode })
              }
            >
              {IMAGE_BLEND_MODES.map((mode) => (
                <option key={mode}>{mode}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Border radius</span>
            <input
              className="apx-pre4-input"
              value={value.borderRadius ?? ''}
              placeholder="number or circular"
              onChange={(event) => {
                const raw = event.target.value.trim();
                set({
                  borderRadius:
                    raw === 'circular'
                      ? 'circular'
                      : raw
                        ? Number(raw)
                        : undefined,
                });
              }}
            />
          </label>
          <label>
            <span>Border position</span>
            <input
              className="apx-pre4-input"
              value={value.borderPosition ?? ''}
              placeholder="all / top / left…"
              onChange={(event) => set({ borderPosition: event.target.value })}
            />
          </label>
          <label>
            <span>Filter order</span>
            <select
              className="apx-pre4-input"
              value={value.filterOrder ?? 'post'}
              onChange={(event) =>
                set({ filterOrder: event.target.value as 'pre' | 'post' })
              }
            >
              <option value="pre">pre</option>
              <option value="post">post</option>
            </select>
          </label>
        </div>
      </Section>

      <Section title="Group filters" attr="group-filters">
        <FilterEditor
          filters={value.filters ?? []}
          width={width}
          height={height}
          onChange={(filters) => set({ filters })}
        />
      </Section>

      <Section title="Group mask & clip" attr="group-mask-clip">
        <label className="apx-canvas-check">
          <input
            type="checkbox"
            checked={Boolean(value.mask)}
            onChange={(event) =>
              set({
                mask: event.target.checked
                  ? { source: '', mode: 'alpha' }
                  : undefined,
              })
            }
          />
          <span>Mask grouped result</span>
        </label>
        {value.mask ? (
          <div className="apx-pre4-property-grid">
            <label>
              <span>Mask source</span>
              <input
                className="apx-pre4-input"
                value={typeof value.mask.source === 'string' ? value.mask.source : ''}
                onChange={(event) =>
                  set({ mask: { ...value.mask!, source: event.target.value } })
                }
              />
            </label>
            <label>
              <span>Mask mode</span>
              <select
                className="apx-pre4-input"
                value={value.mask.mode ?? 'alpha'}
                onChange={(event) =>
                  set({
                    mask: {
                      ...value.mask!,
                      mode: event.target.value as NonNullable<
                        VisualImageGroupTransform['mask']
                      >['mode'],
                    },
                  })
                }
              >
                {MASK_MODES.map((mode) => (
                  <option key={mode}>{mode}</option>
                ))}
              </select>
            </label>
          </div>
        ) : null}
        <label className="apx-canvas-check">
          <input
            type="checkbox"
            checked={Boolean(value.clipPath)}
            onChange={(event) =>
              set({
                clipPath: event.target.checked
                  ? [
                      { x: 0, y: 0 },
                      { x: width, y: 0 },
                      { x: width, y: height },
                      { x: 0, y: height },
                    ]
                  : undefined,
              })
            }
          />
          <span>Clip grouped result</span>
        </label>
        {value.clipPath ? (
          <PointListEditor
            title="Group clip vertices"
            points={value.clipPath}
            minPoints={3}
            onChange={(clipPath) => set({ clipPath })}
          />
        ) : null}
      </Section>

      <Section title="Group distortion" attr="group-distortion">
        <label className="apx-canvas-check">
          <input
            type="checkbox"
            checked={Boolean(value.distortion)}
            onChange={(event) =>
              set({
                distortion: event.target.checked
                  ? {
                      type: 'bulge',
                      intensity: 0.2,
                      interpolation: 'bilinear',
                      edgeMode: 'transparent',
                    }
                  : undefined,
              })
            }
          />
          <span>Distort grouped result</span>
        </label>
        {value.distortion ? (
          <DistortionEditor
            value={value.distortion}
            onChange={(distortion) => set({ distortion })}
          />
        ) : null}
      </Section>

      <Section title="Group mesh warp" attr="group-mesh-warp">
        <label className="apx-canvas-check">
          <input
            type="checkbox"
            checked={Boolean(value.meshWarp)}
            onChange={(event) =>
              set({
                meshWarp: event.target.checked
                  ? defaultMesh(width, height)
                  : undefined,
              })
            }
          />
          <span>Warp grouped result</span>
        </label>
        {value.meshWarp ? (
          <MeshWarpEditor
            value={value.meshWarp}
            width={width}
            height={height}
            onChange={(meshWarp) => set({ meshWarp })}
          />
        ) : null}
      </Section>

      <Section title="Group raster effects" attr="group-raster-effects">
        {([
          ['vignette', { intensity: 0.5, size: 0.6 }],
          ['lensFlare', { x: width / 2, y: height / 2, intensity: 0.5 }],
          ['chromaticAberration', { intensity: 0.2 }],
          ['filmGrain', { intensity: 0.15 }],
        ] as const).map(([key, defaults]) => {
          const current = value.effects?.[key];
          return (
            <div className="apx-image-v2-nested" key={key}>
              <label className="apx-canvas-check">
                <input
                  type="checkbox"
                  checked={Boolean(current)}
                  onChange={(event) =>
                    set({
                      effects: {
                        ...(value.effects ?? {}),
                        [key]: event.target.checked ? defaults : undefined,
                      },
                    })
                  }
                />
                <span>{key}</span>
              </label>
              {current ? (
                <div className="apx-pre4-property-grid">
                  {Object.entries(current).map(([field, fieldValue]) => (
                    <NumericField
                      key={field}
                      label={field}
                      value={numberValue(fieldValue)}
                      step={0.01}
                      onChange={(nextValue) =>
                        set({
                          effects: {
                            ...(value.effects ?? {}),
                            [key]: { ...current, [field]: nextValue },
                          },
                        })
                      }
                    />
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </Section>

      <Section title="Group stroke" attr="group-stroke">
        <label className="apx-canvas-check">
          <input
            type="checkbox"
            checked={Boolean(value.stroke)}
            onChange={(event) =>
              set({
                stroke: event.target.checked
                  ? { color: '#ffffff', width: 2, style: 'solid' }
                  : undefined,
              })
            }
          />
          <span>Stroke grouped result</span>
        </label>
        {value.stroke ? (
          <StrokeEditor
            value={value.stroke}
            onChange={(stroke) => set({ stroke })}
          />
        ) : null}
      </Section>

      <Section title="Group shadow" attr="group-shadow">
        <label className="apx-canvas-check">
          <input
            type="checkbox"
            checked={Boolean(value.shadow)}
            onChange={(event) =>
              set({
                shadow: event.target.checked
                  ? {
                      color: '#000000',
                      offsetX: 0,
                      offsetY: 8,
                      blur: 16,
                      opacity: 0.35,
                    }
                  : undefined,
              })
            }
          />
          <span>Shadow grouped result</span>
        </label>
        {value.shadow ? (
          <ShadowEditor
            value={value.shadow}
            onChange={(shadow) => set({ shadow })}
          />
        ) : null}
      </Section>

      <Section title="Group box background" attr="group-box-background">
        <label className="apx-canvas-check">
          <input
            type="checkbox"
            checked={Boolean(value.boxBackground)}
            onChange={(event) =>
              set({
                boxBackground: event.target.checked
                  ? { color: '#0b1730' }
                  : undefined,
              })
            }
          />
          <span>Paint group background</span>
        </label>
        {value.boxBackground ? (
          <>
            <div className="apx-canvas-color-row">
              <input
                type="color"
                value={
                  value.boxBackground.color?.startsWith('#')
                    ? value.boxBackground.color
                    : '#0b1730'
                }
                onChange={(event) =>
                  set({
                    boxBackground: {
                      ...value.boxBackground!,
                      color: event.target.value,
                    },
                  })
                }
              />
              <input
                className="apx-pre4-input"
                value={value.boxBackground.color ?? ''}
                onChange={(event) =>
                  set({
                    boxBackground: {
                      ...value.boxBackground!,
                      color: event.target.value,
                    },
                  })
                }
              />
            </div>
            <label className="apx-canvas-check">
              <input
                type="checkbox"
                checked={Boolean(value.boxBackground.gradient)}
                onChange={(event) =>
                  set({
                    boxBackground: {
                      ...value.boxBackground!,
                      gradient: event.target.checked
                        ? {
                            type: 'linear',
                            startX: 0,
                            startY: 0,
                            endX: width,
                            endY: 0,
                            colors: [
                              { stop: 0, color: '#0b1730' },
                              { stop: 1, color: '#334155' },
                            ],
                          }
                        : undefined,
                    },
                  })
                }
              />
              <span>Gradient background</span>
            </label>
            {value.boxBackground.gradient ? (
              <GradientEditor
                value={value.boxBackground.gradient}
                onChange={(gradient) =>
                  set({
                    boxBackground: {
                      ...value.boxBackground!,
                      gradient,
                    },
                  })
                }
              />
            ) : null}
          </>
        ) : null}
      </Section>
    </div>
  );
}

export function VisualImageBatchInspector({
  project,
  node,
  tab,
  onChange,
  onRename,
}: {
  project: VisualProject;
  node: VisualNode;
  tab: InspectorTab;
  onChange: (
    label: string,
    updater: (current: VisualImageBatchGroupProps) => VisualImageBatchGroupProps,
  ) => void;
  onRename: (name: string) => void;
}) {
  const batch = visualImageBatchGroupProps(node);
  if (!batch) return null;
  const groupTransform = batch.createOptions.groupTransform ?? {
    scaleX: 1,
    scaleY: 1,
    opacity: 1,
  };
  const width = Math.max(1, node.transform?.width ?? project.document.width);
  const height = Math.max(1, node.transform?.height ?? project.document.height);

  const setBatch = (
    label: string,
    updater: (current: VisualImageBatchGroupProps) => VisualImageBatchGroupProps,
  ) => onChange(label, updater);

  const header = (
    <div className="apx-pre4-inspector-title" data-image-v2-batch-inspector>
      <div>
        <strong>{node.name ?? 'Image group'}</strong>
        <small>
          createImage(ImageProperties[]) · {node.childIds?.length ?? 0} layers
        </small>
      </div>
      <span className="apx-pre4-type-pill">image batch</span>
    </div>
  );

  if (tab === 'data') {
    return (
      <>
        {header}
        <Section title="Batch identity" attr="batch-identity">
          <label className="apx-canvas-field">
            <span>Name</span>
            <input
              className="apx-pre4-input"
              value={node.name ?? ''}
              onChange={(event) => onRename(event.target.value)}
            />
          </label>
          <div className="apx-live-sync-note">
            <strong>One runtime call</strong>
            <span>
              Children remain editable image/shape layers, but codegen emits one
              createImage([...]) call in child order.
            </span>
          </div>
        </Section>
        <Section title="Runtime asset references" attr="batch-painter-options">
          <label className="apx-canvas-check">
            <input
              type="checkbox"
              checked={batch.painterOpts?.resolveAssetRefs ?? false}
              onChange={(event) =>
                setBatch('Image group asset resolution', (current) => ({
                  ...current,
                  painterOpts: event.target.checked
                    ? { resolveAssetRefs: true }
                    : undefined,
                }))
              }
            />
            <span>Resolve $name / $value.path for every batch child and option</span>
          </label>
        </Section>
      </>
    );
  }

  if (tab === 'advanced') {
    return (
      <>
        {header}
        <Section
          title="CreateImage batch options"
          description="This group is the actual ImageProperties[] call boundary."
          attr="batch-call-options"
        >
          <label className="apx-canvas-check">
            <input
              type="checkbox"
              checked={batch.createOptions.isGrouped ?? false}
              onChange={(event) =>
                setBatch('Image batch grouped surface', (current) => ({
                  ...current,
                  createOptions: {
                    ...current.createOptions,
                    isGrouped: event.target.checked,
                  },
                }))
              }
            />
            <span>isGrouped temporary surface</span>
          </label>
        </Section>
        <div className="apx-live-sync-note" data-image-v2-no-json-primary>
          <strong>Typed batch authoring</strong>
          <span>
            No raw JSON escape hatch is required for CreateImageOptions or
            GroupTransformOptions.
          </span>
        </div>
      </>
    );
  }

  return (
    <>
      {header}
      <GroupTransformEditor
        value={groupTransform}
        width={width}
        height={height}
        onChange={(next) =>
          setBatch('Image group transform', (current) => ({
            ...current,
            createOptions: {
              ...current.createOptions,
              isGrouped: true,
              groupTransform: next,
            },
          }))
        }
      />
    </>
  );
}

export function VisualImageInspector({
  project,
  node,
  tab,
  imageAssets,
  generatedNodes,
  onChange,
  onRename,
  renderTransform,
}: Props) {
  const props = visualImageProps(node);
  const isShape = node.kind === 'shape';
  const width = Math.max(1, node.transform?.width ?? project.document.width);
  const height = Math.max(1, node.transform?.height ?? project.document.height);
  const sourceString = typeof props.source === 'string' ? props.source : '';
  const sourceAssetId = typeof props.source === 'string'
    ? studioAssetIdFromReference(props.source)
    : null;
  const generatedId =
    typeof props.source === 'object' &&
    props.source &&
    '$generated' in props.source
      ? props.source.$generated
      : '';

  const patch = (label: string, next: Partial<VisualImageNodeProps>) =>
    onChange(label, (current) => ({ ...current, ...next }));

  const setOptional = <K extends keyof VisualImageNodeProps>(
    label: string,
    key: K,
    enabled: boolean,
    value: VisualImageNodeProps[K],
  ) =>
    onChange(label, (current) => {
      const next = { ...current };
      if (enabled) next[key] = value;
      else delete next[key];
      return next;
    });

  const header = (
    <div className="apx-pre4-inspector-title" data-image-v2-inspector>
      <div>
        <strong>{node.name ?? (isShape ? 'Shape' : 'Image')}</strong>
        <small>
          createImage · {isShape ? 'built-in shape source' : 'image source'} · runtime parity rebuild
        </small>
      </div>
      <span className="apx-pre4-type-pill">{node.kind}</span>
    </div>
  );

  if (tab === 'transform') {
    return (
      <>
        {header}
        {renderTransform()}
        {!isShape ? (
          <Section
            title="Image layout"
            description="Fit and alignment are ImageProperties fields; transform dimensions remain the layer box."
            attr="layout"
          >
            <div className="apx-pre4-property-grid">
              <label>
                <span>Fit</span>
                <select className="apx-pre4-input" value={props.fit ?? 'fill'} onChange={(event) => patch('Image fit', { fit: event.target.value as VisualImageNodeProps['fit'] })}>
                  {IMAGE_FITS.map((value) => <option key={value}>{value}</option>)}
                </select>
              </label>
              <label>
                <span>Align</span>
                <select className="apx-pre4-input" value={props.align ?? 'center'} onChange={(event) => patch('Image align', { align: event.target.value as VisualImageNodeProps['align'] })}>
                  {IMAGE_ALIGNS.map((value) => <option key={value}>{value}</option>)}
                </select>
              </label>
            </div>
            <label className="apx-canvas-check">
              <input type="checkbox" checked={props.inherit ?? false} onChange={(event) => patch('Image inherit', { inherit: event.target.checked })} />
              <span>Use source dimensions when width/height are omitted</span>
            </label>
          </Section>
        ) : null}
      </>
    );
  }

  if (tab === 'data') {
    return (
      <>
        {header}
        <Section title="Source" description="One stable source identity; no duplicate source controls elsewhere." attr="source">
          <label className="apx-canvas-field">
            <span>{isShape ? 'Built-in shape' : 'URL / path / asset reference'}</span>
            {isShape ? (
              <select
                className="apx-pre4-input"
                value={typeof props.source === 'string' ? props.source : 'rectangle'}
                onChange={(event) => {
                  const source = event.target.value as VisualShapeType;
                  onChange('Shape source', (current) => ({
                    ...current,
                    source,
                    shape: defaultShapeNodeProps(source).shape,
                  }));
                }}
              >
                {IMAGE_SHAPE_TYPES.map((shape) => <option key={shape}>{shape}</option>)}
              </select>
            ) : (
              <input
                className="apx-pre4-input"
                value={sourceString}
                placeholder="https://… / ./asset.png / studio://asset/…"
                onChange={(event) => patch('Image source', { source: event.target.value })}
              />
            )}
          </label>
          {!isShape ? (
            <>
              <label className="apx-canvas-field">
                <span>Studio asset</span>
                <select
                  className="apx-pre4-input"
                  value={sourceAssetId ?? ''}
                  onChange={(event) => {
                    const asset = imageAssets.find((item) => item.id === event.target.value);
                    if (asset) patch('Image asset', { source: studioAssetReference(asset) });
                  }}
                >
                  <option value="">Choose asset…</option>
                  {imageAssets.map((asset) => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
                </select>
              </label>
              <label className="apx-canvas-field">
                <span>Generated buffer</span>
                <select
                  className="apx-pre4-input"
                  value={generatedId}
                  onChange={(event) => {
                    if (event.target.value) patch('Generated image source', { source: { $generated: event.target.value } });
                  }}
                >
                  <option value="">None</option>
                  <option value="document_canvas">Canvas buffer</option>
                  {generatedNodes.map((item) => <option key={item.id} value={item.id}>{item.name ?? item.kind}</option>)}
                </select>
              </label>
            </>
          ) : null}
        </Section>

        <Section title="Runtime asset references" description="Fourth createImage() argument. Default is off." attr="painter-opts">
          <label className="apx-canvas-check" data-image-v2-resolve-asset-refs>
            <input
              type="checkbox"
              checked={props.painterOpts?.resolveAssetRefs ?? false}
              onChange={(event) =>
                patch('Image asset reference resolution', {
                  painterOpts: event.target.checked ? { resolveAssetRefs: true } : undefined,
                })
              }
            />
            <span>Resolve $name / $value.path through painter.assets</span>
          </label>
        </Section>

        <Section title="Layer identity" attr="identity">
          <label className="apx-canvas-field">
            <span>Name</span>
            <input className="apx-pre4-input" value={node.name ?? ''} onChange={(event) => onRename(event.target.value)} />
          </label>
        </Section>
      </>
    );
  }

  if (tab === 'style') {
    const shape = props.shape ?? {};
    return (
      <>
        {header}
        {isShape ? (
          <Section title="Shape geometry" description="Native createImage ShapeProperties; no editor-only shape model." attr="shape">
            <label className="apx-canvas-check">
              <input
                type="checkbox"
                checked={shape.fill ?? true}
                onChange={(event) => patch('Shape fill', { shape: { ...shape, fill: event.target.checked } })}
              />
              <span>Fill shape</span>
            </label>
            <div className="apx-canvas-color-row">
              <input type="color" value={shape.color?.startsWith('#') ? shape.color : '#6f86ff'} onChange={(event) => patch('Shape color', { shape: { ...shape, color: event.target.value } })} />
              <input className="apx-pre4-input" value={shape.color ?? '#6f86ff'} onChange={(event) => patch('Shape color', { shape: { ...shape, color: event.target.value } })} />
            </div>
            <div className="apx-pre4-property-grid">
              <NumericField label="Radius" value={shape.radius} min={0.0001} onChange={(radius) => patch('Shape radius', { shape: { ...shape, radius } })} />
              <NumericField label="Sides" value={shape.sides} min={3} step={1} onChange={(sides) => patch('Shape sides', { shape: { ...shape, sides: Math.round(sides) } })} />
              <NumericField label="Inner radius" value={shape.innerRadius} min={0} onChange={(innerRadius) => patch('Shape inner radius', { shape: { ...shape, innerRadius } })} />
              <NumericField label="Outer radius" value={shape.outerRadius} min={0.0001} onChange={(outerRadius) => patch('Shape outer radius', { shape: { ...shape, outerRadius } })} />
              <NumericField label="Start angle" value={shape.startAngle} step={0.1} onChange={(startAngle) => patch('Shape start angle', { shape: { ...shape, startAngle } })} />
              <NumericField label="End angle" value={shape.endAngle} step={0.1} onChange={(endAngle) => patch('Shape end angle', { shape: { ...shape, endAngle } })} />
              <NumericField label="Center X" value={shape.centerX} onChange={(centerX) => patch('Shape center X', { shape: { ...shape, centerX } })} />
              <NumericField label="Center Y" value={shape.centerY} onChange={(centerY) => patch('Shape center Y', { shape: { ...shape, centerY } })} />
            </div>
            <PointListEditor title="Custom points" points={shape.points ?? []} onChange={(points) => patch('Shape points', { shape: { ...shape, points } })} />
            <label className="apx-canvas-check">
              <input
                type="checkbox"
                checked={Boolean(shape.gradient)}
                onChange={(event) =>
                  patch('Shape gradient', {
                    shape: {
                      ...shape,
                      gradient: event.target.checked
                        ? {
                            type: 'linear',
                            startX: 0,
                            startY: 0,
                            endX: width,
                            endY: 0,
                            colors: [{ stop: 0, color: '#6f86ff' }, { stop: 1, color: '#a855f7' }],
                          }
                        : undefined,
                    },
                  })
                }
              />
              <span>Gradient fill</span>
            </label>
            {shape.gradient ? <GradientEditor value={shape.gradient} onChange={(gradient) => patch('Shape gradient', { shape: { ...shape, gradient } })} /> : null}
          </Section>
        ) : null}

        <Section title="Appearance" attr="appearance">
          <div className="apx-pre4-property-grid">
            <NumericField label="Blur" value={props.blur} min={0} onChange={(blur) => patch('Image blur', { blur })} />
            <NumericField label="Border radius" value={typeof props.borderRadius === 'number' ? props.borderRadius : undefined} min={0} onChange={(borderRadius) => patch('Image radius', { borderRadius })} />
            <label>
              <span>Blend mode</span>
              <select className="apx-pre4-input" value={props.blendMode ?? 'source-over'} onChange={(event) => patch('Image blend', { blendMode: event.target.value as VisualBlendMode })}>
                {IMAGE_BLEND_MODES.map((mode) => <option key={mode}>{mode}</option>)}
              </select>
            </label>
            <label>
              <span>Border position</span>
              <input className="apx-pre4-input" value={props.borderPosition ?? ''} placeholder="all / top / left…" onChange={(event) => patch('Image border position', { borderPosition: event.target.value })} />
            </label>
          </div>
          <label className="apx-canvas-check">
            <input type="checkbox" checked={props.borderRadius === 'circular'} onChange={(event) => patch('Circular image', { borderRadius: event.target.checked ? 'circular' : 0 })} />
            <span>Circular border radius</span>
          </label>
        </Section>

        <Section title="Stroke" attr="stroke">
          <label className="apx-canvas-check">
            <input
              type="checkbox"
              checked={Boolean(props.stroke)}
              onChange={(event) => setOptional('Image stroke', 'stroke', event.target.checked, { color: '#ffffff', width: 2, style: 'solid' })}
            />
            <span>Enable stroke</span>
          </label>
          {props.stroke ? <StrokeEditor value={props.stroke} onChange={(stroke) => patch('Image stroke', { stroke })} /> : null}
        </Section>

        <Section title="Shadow" attr="shadow">
          <label className="apx-canvas-check">
            <input
              type="checkbox"
              checked={Boolean(props.shadow)}
              onChange={(event) => setOptional('Image shadow', 'shadow', event.target.checked, { color: '#000000', offsetX: 0, offsetY: 8, blur: 16, opacity: 0.35 })}
            />
            <span>Enable shadow</span>
          </label>
          {props.shadow ? <ShadowEditor value={props.shadow} onChange={(shadow) => patch('Image shadow', { shadow })} /> : null}
        </Section>

        <Section title="Box background" attr="box-background">
          <label className="apx-canvas-check">
            <input
              type="checkbox"
              checked={Boolean(props.boxBackground)}
              onChange={(event) => setOptional('Image box background', 'boxBackground', event.target.checked, { color: '#0b1730' })}
            />
            <span>Paint box background before image/shape</span>
          </label>
          {props.boxBackground ? (
            <>
              <div className="apx-canvas-color-row">
                <input type="color" value={props.boxBackground.color?.startsWith('#') ? props.boxBackground.color : '#0b1730'} onChange={(event) => patch('Box background color', { boxBackground: { ...props.boxBackground, color: event.target.value } })} />
                <input className="apx-pre4-input" value={props.boxBackground.color ?? ''} onChange={(event) => patch('Box background color', { boxBackground: { ...props.boxBackground, color: event.target.value } })} />
              </div>
              <label className="apx-canvas-check">
                <input
                  type="checkbox"
                  checked={Boolean(props.boxBackground.gradient)}
                  onChange={(event) =>
                    patch('Box background gradient', {
                      boxBackground: {
                        ...props.boxBackground,
                        gradient: event.target.checked
                          ? {
                              type: 'linear',
                              startX: 0,
                              startY: 0,
                              endX: width,
                              endY: 0,
                              colors: [{ stop: 0, color: '#0b1730' }, { stop: 1, color: '#334155' }],
                            }
                          : undefined,
                      },
                    })
                  }
                />
                <span>Gradient background</span>
              </label>
              {props.boxBackground.gradient ? (
                <GradientEditor value={props.boxBackground.gradient} onChange={(gradient) => patch('Box background gradient', { boxBackground: { ...props.boxBackground, gradient } })} />
              ) : null}
            </>
          ) : null}
        </Section>
      </>
    );
  }

  if (tab === 'effects') {
    return (
      <>
        {header}
        <Section title="Filters" description="Typed createImage filters, in authored order." attr="filters">
          <div className="apx-pre4-property-grid">
            <NumericField label="Filter intensity" value={props.filterIntensity} min={0} step={0.1} onChange={(filterIntensity) => patch('Filter intensity', { filterIntensity })} />
            <label>
              <span>Filter order</span>
              <select className="apx-pre4-input" value={props.filterOrder ?? 'post'} onChange={(event) => patch('Filter order', { filterOrder: event.target.value as 'pre' | 'post' })}>
                <option value="pre">pre</option>
                <option value="post">post</option>
              </select>
            </label>
          </div>
          <FilterEditor filters={props.filters ?? []} width={width} height={height} onChange={(filters) => patch('Image filters', { filters })} />
        </Section>

        <Section title="Mask" attr="mask">
          <label className="apx-canvas-check">
            <input type="checkbox" checked={Boolean(props.mask)} onChange={(event) => setOptional('Image mask', 'mask', event.target.checked, { source: '', mode: 'alpha' })} />
            <span>Enable mask</span>
          </label>
          {props.mask ? (
            <div className="apx-pre4-property-grid">
              <label>
                <span>Mask source</span>
                <input className="apx-pre4-input" value={typeof props.mask.source === 'string' ? props.mask.source : ''} onChange={(event) => patch('Mask source', { mask: { ...props.mask!, source: event.target.value } })} />
              </label>
              <label>
                <span>Mode</span>
                <select className="apx-pre4-input" value={props.mask.mode ?? 'alpha'} onChange={(event) => patch('Mask mode', { mask: { ...props.mask!, mode: event.target.value as NonNullable<VisualImageNodeProps['mask']>['mode'] } })}>
                  {MASK_MODES.map((mode) => <option key={mode}>{mode}</option>)}
                </select>
              </label>
            </div>
          ) : null}
        </Section>

        <Section title="Clip path" description="Polygon coordinates are runtime canvas coordinates; minimum 3 points." attr="clip-path">
          <label className="apx-canvas-check">
            <input type="checkbox" checked={Boolean(props.clipPath)} onChange={(event) => setOptional('Image clip path', 'clipPath', event.target.checked, [{ x: 0, y: 0 }, { x: width, y: 0 }, { x: width, y: height }, { x: 0, y: height }])} />
            <span>Enable polygon clip</span>
          </label>
          {props.clipPath ? <PointListEditor title="Clip vertices" points={props.clipPath} minPoints={3} onChange={(clipPath) => patch('Image clip path', { clipPath })} /> : null}
        </Section>

        <Section title="Distortion" description="Perspective, free warp, bulge/pinch, twirl and wave use the real runtime model." attr="distortion">
          <label className="apx-canvas-check">
            <input type="checkbox" checked={Boolean(props.distortion)} onChange={(event) => setOptional('Image distortion', 'distortion', event.target.checked, { type: 'bulge', intensity: 0.25, interpolation: 'bilinear', edgeMode: 'transparent' })} />
            <span>Enable distortion</span>
          </label>
          {props.distortion ? <DistortionEditor value={props.distortion} onChange={(distortion) => patch('Image distortion', { distortion })} /> : null}
        </Section>

        <Section title="Mesh warp" description="Modern (grid+1) vertices and legacy grid anchors are both runtime-valid." attr="mesh-warp">
          <label className="apx-canvas-check">
            <input type="checkbox" checked={Boolean(props.meshWarp)} onChange={(event) => setOptional('Image mesh warp', 'meshWarp', event.target.checked, defaultMesh(width, height))} />
            <span>Enable mesh warp</span>
          </label>
          {props.meshWarp ? <MeshWarpEditor value={props.meshWarp} width={width} height={height} onChange={(meshWarp) => patch('Image mesh warp', { meshWarp })} /> : null}
        </Section>

        <Section title="Raster effects" attr="raster-effects">
          {([
            ['vignette', { intensity: 0.5, size: 0.6 }],
            ['lensFlare', { x: width / 2, y: height / 2, intensity: 0.5 }],
            ['chromaticAberration', { intensity: 0.2 }],
            ['filmGrain', { intensity: 0.15 }],
          ] as const).map(([key, defaults]) => {
            const current = props.effects?.[key];
            return (
              <div className="apx-image-v2-nested" key={key}>
                <label className="apx-canvas-check">
                  <input
                    type="checkbox"
                    checked={Boolean(current)}
                    onChange={(event) =>
                      patch('Image effect ' + key, {
                        effects: {
                          ...(props.effects ?? {}),
                          [key]: event.target.checked ? defaults : undefined,
                        },
                      })
                    }
                  />
                  <span>{key}</span>
                </label>
                {current ? (
                  <div className="apx-pre4-property-grid">
                    {Object.entries(current).map(([field, fieldValue]) => (
                      <NumericField
                        key={field}
                        label={field}
                        value={numberValue(fieldValue)}
                        step={0.01}
                        onChange={(nextValue) =>
                          patch('Image effect ' + key, {
                            effects: {
                              ...(props.effects ?? {}),
                              [key]: { ...current, [field]: nextValue },
                            },
                          })
                        }
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </Section>

        <Section title="Image utility pipeline" description="Separate painter.image.* APIs, shown here after createImage effects to avoid mixing the two contracts." attr="utility-stack">
          <VisualImageUtilityAuthoring
            value={props}
            mode="effects"
            onChange={(next, label) => onChange(label, () => next)}
          />
        </Section>
      </>
    );
  }

  const options = props.createOptions ?? {};
  const group = options.groupTransform ?? {};
  return (
    <>
      {header}
      <Section title="CreateImage options" description="Third argument to createImage(). Group transforms become meaningful for true ImageProperties[] batches." attr="create-options">
        <label className="apx-canvas-check">
          <input
            type="checkbox"
            checked={options.isGrouped ?? false}
            onChange={(event) =>
              patch('Image grouped rendering', {
                createOptions: { ...options, isGrouped: event.target.checked },
              })
            }
          />
          <span>isGrouped</span>
        </label>
        <label className="apx-canvas-check">
          <input
            type="checkbox"
            checked={Boolean(options.groupTransform)}
            onChange={(event) =>
              patch('Image group transform', {
                createOptions: {
                  ...options,
                  groupTransform: event.target.checked
                    ? { scaleX: 1, scaleY: 1, opacity: 1 }
                    : undefined,
                },
              })
            }
          />
          <span>Group transform</span>
        </label>
        {options.groupTransform ? (
          <GroupTransformEditor
            value={group}
            onChange={(groupTransform) =>
              patch('Image group transform', {
                createOptions: { ...options, groupTransform },
              })
            }
          />
        ) : null}
      </Section>

      <Section title="Advanced image utility APIs" description="Nondestructive painter.image.* stack; not part of ImageProperties." attr="advanced-utilities">
        <VisualImageUtilityAuthoring
          value={props}
          mode="advanced"
          onChange={(next, label) => onChange(label, () => next)}
        />
      </Section>

      <div className="apx-live-sync-note" data-image-v2-no-json-primary>
        <strong>No raw JSON escape hatch required</strong>
        <span>
          Public createImage options are authored through typed controls. JSON is no longer the primary route to missing runtime fields.
        </span>
      </div>
    </>
  );
}
