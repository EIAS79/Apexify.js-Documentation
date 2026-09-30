'use client';

import { useMemo, useState, type ReactNode } from 'react';
import {
  ArrowDownTrayIcon,
  CircleStackIcon,
  PhotoIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { VisualImageUtilityAuthoring } from '@/components/studio/visual/VisualImageUtilityAuthoring';
import {
  IMAGE_ALIGNS,
  IMAGE_BLEND_MODES,
  IMAGE_FILTER_PARAMETERLESS_TYPES,
  IMAGE_FILTER_TYPES,
  IMAGE_FITS,
  IMAGE_SHAPE_TYPES,
  defaultVisualImageFilter,
  imageFilterFieldSpecs,
  updateVisualImageFilterValue,
  visualImageProps,
} from '@/lib/studio/visual/image-contract';
import {
  studioAssetIdFromReference,
  studioAssetReference,
  type StudioVirtualAsset,
} from '@/lib/studio/runtime/assets';
import type {
  VisualBlendMode,
  VisualBoxBackground,
  VisualGradient,
  VisualImageDistortion,
  VisualImageEffects,
  VisualImageFilter,
  VisualImageGroupTransform,
  VisualImageMask,
  VisualImageMeshWarp,
  VisualImageNodeProps,
  VisualNode,
  VisualProject,
  VisualShadowOptions,
  VisualStrokeOptions,
} from '@/lib/studio/visual/model';

export type VisualImageInspectorTab =
  | 'style'
  | 'transform'
  | 'effects'
  | 'data'
  | 'advanced';

type Props = {
  project: VisualProject;
  node?: VisualNode;
  tab: VisualImageInspectorTab;
  assets: StudioVirtualAsset[];
  renderTransform: () => ReactNode;
  onMutate: (
    label: string,
    updater: (props: VisualImageNodeProps) => VisualImageNodeProps,
  ) => void;
  onRename: (name: string) => void;
  onInsertUrl: (url: string) => void;
  onInsertAsset: (asset: StudioVirtualAsset) => void;
  onUploadFiles: (files: FileList) => void;
  onOpenAssets: () => void;
};

const BORDER_POSITIONS = [
  'all','top','left','right','bottom','top-left','top-right','bottom-left','bottom-right',
] as const;
const INTERPOLATION = ['nearest','bilinear','bicubic'] as const;
const EDGE_MODES = ['transparent','clamp','wrap','mirror'] as const;
const FALLOFF = ['linear','smooth','gaussian'] as const;
const DISTORTIONS = ['perspective','warp','bulge','pinch','twirl','wave'] as const;
const STROKE_STYLES = ['solid','dashed','dotted','groove','ridge','double'] as const;

function titleCase(value: string) {
  return value.replace(/([A-Z])/g, ' $1').replace(/[-_]/g, ' ').replace(/^./, (letter) => letter.toUpperCase());
}

function safeColor(value: string | undefined, fallback: string) {
  return /^#[0-9a-f]{6}$/i.test(value ?? '') ? value! : fallback;
}

function Field({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
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
          onChange={(event) => onChange(Number(event.target.value))}
        />
        {suffix ? <small>{suffix}</small> : null}
      </div>
    </label>
  );
}

function Select({
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
    <label className="apx-canvas-v2-field">
      <span>{label}</span>
      <select className="apx-canvas-v2-input" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option} value={option}>{titleCase(option)}</option>)}
      </select>
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="apx-canvas-v2-inline-toggle">
      <div><strong>{label}</strong></div>
      <span className="apx-canvas-v2-toggle">
        <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} aria-label={label}/>
        <span />
      </span>
    </label>
  );
}

function Color({
  label,
  value,
  fallback,
  onChange,
}: {
  label: string;
  value?: string;
  fallback: string;
  onChange: (value: string) => void;
}) {
  const current = safeColor(value, fallback);
  return (
    <label className="apx-canvas-v2-field">
      <span>{label}</span>
      <div className="apx-canvas-v2-color">
        <input type="color" value={current} onChange={(event) => onChange(event.target.value)} />
        <input className="apx-canvas-v2-input" value={value ?? fallback} onChange={(event) => onChange(event.target.value)} />
      </div>
    </label>
  );
}

function Section({
  title,
  description,
  children,
  defaultOpen = false,
  badge,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  badge?: string;
}) {
  return (
    <details className="apx-canvas-v2-section apx-image-v2-section" open={defaultOpen}>
      <summary>
        <span className="apx-canvas-v2-section-copy">
          <strong>{title}</strong>
          {description ? <small>{description}</small> : null}
        </span>
        {badge ? <span className="apx-canvas-v2-badge">{badge}</span> : null}
        <span className="apx-canvas-v2-chevron">⌄</span>
      </summary>
      <div className="apx-canvas-v2-section-body">{children}</div>
    </details>
  );
}

function defaultGradient(): VisualGradient {
  return {
    type: 'linear',
    startX: 0,
    startY: 0,
    endX: 400,
    endY: 0,
    colors: [
      { stop: 0, color: '#5ee7ff' },
      { stop: 1, color: '#6d5dfc' },
    ],
  };
}

function GradientEditor({
  value,
  onChange,
}: {
  value: VisualGradient;
  onChange: (next: VisualGradient) => void;
}) {
  const first = value.colors[0] ?? { stop: 0, color: '#5ee7ff' };
  const last = value.colors[value.colors.length - 1] ?? { stop: 1, color: '#6d5dfc' };
  const patch = (partial: Record<string, unknown>) => onChange({ ...value, ...partial } as VisualGradient);
  return (
    <div className="apx-image-v2-gradient">
      <Select
        label="Gradient type"
        value={value.type}
        options={['linear','radial','conic']}
        onChange={(type) => {
          const colors = value.colors;
          if (type === 'radial') onChange({ type:'radial', startX:0, startY:0, startRadius:0, endX:200, endY:150, endRadius:250, colors });
          else if (type === 'conic') onChange({ type:'conic', centerX:200, centerY:150, startAngle:0, colors });
          else onChange({ type:'linear', startX:0, startY:0, endX:400, endY:0, colors });
        }}
      />
      <div className="apx-canvas-v2-grid apx-canvas-v2-grid--2">
        <Color label="Start color" value={first.color} fallback="#5ee7ff" onChange={(color) => onChange({ ...value, colors: value.colors.map((stop, index) => index === 0 ? { ...stop, color } : stop) } as VisualGradient)} />
        <Color label="End color" value={last.color} fallback="#6d5dfc" onChange={(color) => onChange({ ...value, colors: value.colors.map((stop, index) => index === value.colors.length - 1 ? { ...stop, color } : stop) } as VisualGradient)} />
      </div>
      {value.type === 'linear' ? (
        <div className="apx-canvas-v2-grid apx-canvas-v2-grid--2">
          <Field label="Start X" value={value.startX ?? 0} onChange={(startX) => patch({ startX })}/>
          <Field label="Start Y" value={value.startY ?? 0} onChange={(startY) => patch({ startY })}/>
          <Field label="End X" value={value.endX ?? 400} onChange={(endX) => patch({ endX })}/>
          <Field label="End Y" value={value.endY ?? 0} onChange={(endY) => patch({ endY })}/>
        </div>
      ) : null}
      {value.type === 'radial' ? (
        <div className="apx-canvas-v2-grid apx-canvas-v2-grid--2">
          <Field label="Start X" value={value.startX ?? 0} onChange={(startX) => patch({ startX })}/>
          <Field label="Start Y" value={value.startY ?? 0} onChange={(startY) => patch({ startY })}/>
          <Field label="Start radius" value={value.startRadius ?? 0} min={0} onChange={(startRadius) => patch({ startRadius })}/>
          <Field label="End X" value={value.endX ?? 200} onChange={(endX) => patch({ endX })}/>
          <Field label="End Y" value={value.endY ?? 150} onChange={(endY) => patch({ endY })}/>
          <Field label="End radius" value={value.endRadius ?? 250} min={0} onChange={(endRadius) => patch({ endRadius })}/>
        </div>
      ) : null}
      {value.type === 'conic' ? (
        <div className="apx-canvas-v2-grid apx-canvas-v2-grid--2">
          <Field label="Center X" value={value.centerX ?? 200} onChange={(centerX) => patch({ centerX })}/>
          <Field label="Center Y" value={value.centerY ?? 150} onChange={(centerY) => patch({ centerY })}/>
          <Field label="Start angle" value={value.startAngle ?? 0} onChange={(startAngle) => patch({ startAngle })} suffix="°"/>
        </div>
      ) : null}
    </div>
  );
}

function FilterStack({
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
  const patch = (index: number, next: VisualImageFilter) =>
    onChange(filters.map((filter, filterIndex) => filterIndex === index ? next : filter));
  return (
    <div className="apx-canvas-v2-filter-stack" data-image-filter-contract="strict">
      <div className="apx-canvas-v2-subhead">
        <div><strong>Filter stack</strong><small>Exact current Apexify ImageFilter fields.</small></div>
        <button type="button" onClick={() => onChange([...filters, defaultVisualImageFilter('brightness', width, height)])}>
          <PlusIcon aria-hidden/> Filter
        </button>
      </div>
      {filters.map((filter, index) => {
        const fields = imageFilterFieldSpecs(filter.type, width, height, filter);
        const parameterless = IMAGE_FILTER_PARAMETERLESS_TYPES.includes(filter.type as (typeof IMAGE_FILTER_PARAMETERLESS_TYPES)[number]);
        return (
          <div className="apx-canvas-v2-filter-card" key={index}>
            <div className="apx-canvas-v2-card-head">
              <select
                className="apx-canvas-v2-input"
                value={filter.type}
                onChange={(event) => patch(index, defaultVisualImageFilter(event.target.value as VisualImageFilter['type'], width, height))}
              >
                {IMAGE_FILTER_TYPES.map((type) => <option key={type} value={type}>{titleCase(type)}</option>)}
              </select>
              <button className="apx-canvas-v2-icon-button" type="button" onClick={() => onChange(filters.filter((_, itemIndex) => itemIndex !== index))} aria-label="Remove filter">
                <TrashIcon aria-hidden/>
              </button>
            </div>
            {parameterless ? (
              <div className="apx-canvas-v2-callout"><strong>{titleCase(filter.type)} enabled</strong><span>This filter is controlled by its presence in the stack.</span></div>
            ) : (
              <div className="apx-canvas-v2-grid apx-canvas-v2-grid--2">
                {fields.map((field) => {
                  const current = filter[field.key];
                  return (
                    <label className="apx-canvas-v2-field" key={field.key}>
                      <span>{field.label}</span>
                      <div className="apx-canvas-v2-number">
                        <input
                          className="apx-canvas-v2-input"
                          type="number"
                          min={field.min}
                          max={field.max}
                          step={field.step}
                          value={typeof current === 'number' && Number.isFinite(current) ? current : field.defaultValue}
                          onChange={(event) => patch(index, updateVisualImageFilterValue(filter, field.key, Number(event.target.value), width, height))}
                        />
                        {field.suffix ? <small>{field.suffix}</small> : null}
                      </div>
                      <small className="apx-canvas-v2-field-hint">Allowed: {field.help}</small>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
      {!filters.length ? <div className="apx-canvas-v2-empty-mini">No filters on this raster.</div> : null}
    </div>
  );
}

function MaskEditor({
  value,
  assets,
  onChange,
}: {
  value?: VisualImageMask;
  assets: StudioVirtualAsset[];
  onChange: (next?: VisualImageMask) => void;
}) {
  const imageAssets = assets.filter((asset) => asset.mime.startsWith('image/'));
  const sourceAssetId = value && typeof value.source === 'string' ? studioAssetIdFromReference(value.source) : null;
  return (
    <div className="apx-image-v2-editor">
      <Toggle
        label="Enable mask"
        checked={Boolean(value)}
        onChange={(checked) => onChange(checked ? { source: imageAssets[0] ? studioAssetReference(imageAssets[0]) : '', mode:'alpha' } : undefined)}
      />
      {value ? (
        <>
          <Select label="Mask mode" value={value.mode ?? 'alpha'} options={['alpha','luminance','inverse']} onChange={(mode) => onChange({ ...value, mode: mode as VisualImageMask['mode'] })}/>
          <label className="apx-canvas-v2-field">
            <span>Mask asset</span>
            <select
              className="apx-canvas-v2-input"
              value={sourceAssetId ?? ''}
              onChange={(event) => {
                const asset = imageAssets.find((item) => item.id === event.target.value);
                if (asset) onChange({ ...value, source: studioAssetReference(asset) });
              }}
            >
              <option value="">Choose image asset…</option>
              {imageAssets.map((asset) => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
            </select>
          </label>
          <label className="apx-canvas-v2-field">
            <span>Mask source</span>
            <input
              className="apx-canvas-v2-input"
              value={typeof value.source === 'string' ? value.source : ''}
              placeholder="studio://asset/… or URL"
              onChange={(event) => onChange({ ...value, source: event.target.value })}
            />
          </label>
        </>
      ) : null}
    </div>
  );
}

function ClipPathEditor({
  points,
  width,
  height,
  onChange,
}: {
  points?: Array<{x:number;y:number}>;
  width: number;
  height: number;
  onChange: (points?: Array<{x:number;y:number}>) => void;
}) {
  const current = points ?? [];
  return (
    <div className="apx-image-v2-editor">
      <Toggle
        label="Enable polygon clip"
        checked={Boolean(points)}
        onChange={(checked) => onChange(checked ? [{x:0,y:0},{x:width,y:0},{x:width,y:height},{x:0,y:height}] : undefined)}
      />
      {points ? (
        <>
          {current.map((point, index) => (
            <div className="apx-image-v2-point-row" key={index}>
              <strong>P{index + 1}</strong>
              <Field label="X" value={point.x} onChange={(x) => onChange(current.map((item, itemIndex) => itemIndex === index ? { ...item, x } : item))}/>
              <Field label="Y" value={point.y} onChange={(y) => onChange(current.map((item, itemIndex) => itemIndex === index ? { ...item, y } : item))}/>
              <button type="button" disabled={current.length <= 3} onClick={() => onChange(current.filter((_, itemIndex) => itemIndex !== index))}>×</button>
            </div>
          ))}
          <button className="apx-canvas-mini-button" type="button" onClick={() => onChange([...current, {x:width / 2,y:height / 2}])}>+ Clip point</button>
          <small className="apx-canvas-v2-field-hint">Apexify requires at least three clip points.</small>
        </>
      ) : null}
    </div>
  );
}

function defaultDistortion(type: VisualImageDistortion['type'], width: number, height: number): VisualImageDistortion {
  const shared = { interpolation:'bilinear' as const, edgeMode:'transparent' as const };
  if (type === 'perspective') {
    return { type, points:[{x:0,y:0},{x:width,y:0},{x:width,y:height},{x:0,y:height}], ...shared };
  }
  if (type === 'warp') {
    return {
      type,
      controlPoints:[{
        from:{x:width / 2,y:height / 2},
        to:{x:width * .58,y:height * .44},
        radius:Math.max(width,height) * .25,
        strength:.8,
        falloff:'smooth',
      }],
      ...shared,
    };
  }
  if (type === 'twirl') return { type, angle:30, centerX:width/2, centerY:height/2, radius:Math.min(width,height)/2, intensity:1, ...shared };
  if (type === 'wave') return { type, amplitudeX:20, amplitudeY:10, wavelengthX:160, wavelengthY:120, phaseX:0, phaseY:0, intensity:1, ...shared };
  return { type, intensity:.5, centerX:width/2, centerY:height/2, radius:Math.min(width,height)/2, ...shared };
}

function DistortionEditor({
  value,
  width,
  height,
  onChange,
}: {
  value?: VisualImageDistortion;
  width: number;
  height: number;
  onChange: (value?: VisualImageDistortion) => void;
}) {
  const current = value;
  const patch = (partial: Partial<VisualImageDistortion>) => current && onChange({ ...current, ...partial });
  return (
    <div className="apx-image-v2-editor" data-image-distortion-editor>
      <Toggle label="Enable distortion" checked={Boolean(current)} onChange={(checked) => onChange(checked ? defaultDistortion('perspective', width, height) : undefined)}/>
      {current ? (
        <>
          <div className="apx-canvas-v2-grid apx-canvas-v2-grid--2">
            <Select label="Type" value={current.type} options={DISTORTIONS} onChange={(type) => onChange(defaultDistortion(type as VisualImageDistortion['type'], width, height))}/>
            <Select label="Interpolation" value={current.interpolation ?? 'bilinear'} options={INTERPOLATION} onChange={(interpolation) => patch({ interpolation: interpolation as VisualImageDistortion['interpolation'] })}/>
            <Select label="Edge mode" value={current.edgeMode ?? 'transparent'} options={EDGE_MODES} onChange={(edgeMode) => patch({ edgeMode: edgeMode as VisualImageDistortion['edgeMode'] })}/>
            <Field label="Intensity" value={current.intensity ?? 1} step={0.05} onChange={(intensity) => patch({ intensity })}/>
          </div>

          {current.type === 'perspective' || (current.type === 'warp' && current.points) ? (
            <div className="apx-image-v2-subgrid">
              <strong>{current.type === 'perspective' ? 'Perspective corners' : 'Free quad corners'}</strong>
              {(current.points ?? []).map((point, index) => (
                <div className="apx-image-v2-point-row" key={index}>
                  <strong>{['TL','TR','BR','BL'][index] ?? 'P' + (index + 1)}</strong>
                  <Field label="X" value={point.x} onChange={(x) => patch({ points:(current.points ?? []).map((item, itemIndex) => itemIndex === index ? { ...item, x } : item) })}/>
                  <Field label="Y" value={point.y} onChange={(y) => patch({ points:(current.points ?? []).map((item, itemIndex) => itemIndex === index ? { ...item, y } : item) })}/>
                </div>
              ))}
            </div>
          ) : null}

          {current.type === 'warp' ? (
            <div className="apx-image-v2-subgrid" data-image-warp-handles>
              <div className="apx-canvas-v2-subhead">
                <div><strong>Liquify handles</strong><small>Drag source pixels from → to with a radial falloff.</small></div>
                <button
                  type="button"
                  onClick={() => onChange({
                    ...current,
                    points: undefined,
                    controlPoints:[...(current.controlPoints ?? []),{
                      from:{x:width/2,y:height/2},to:{x:width/2+20,y:height/2-20},radius:Math.max(width,height)*.2,strength:1,falloff:'smooth'
                    }],
                  })}
                ><PlusIcon aria-hidden/> Handle</button>
              </div>
              <div className="apx-image-v2-segmented">
                <button type="button" data-active={current.points ? 'true' : undefined} onClick={() => onChange({ ...defaultDistortion('perspective', width, height), type:'warp' })}>Quad warp</button>
                <button type="button" data-active={current.controlPoints ? 'true' : undefined} onClick={() => onChange(defaultDistortion('warp', width, height))}>Liquify handles</button>
              </div>
              {(current.controlPoints ?? []).map((handle, index) => (
                <div className="apx-image-v2-handle-card" key={index}>
                  <div className="apx-canvas-v2-subhead"><strong>Handle {index + 1}</strong><button type="button" onClick={() => patch({ controlPoints:(current.controlPoints ?? []).filter((_, itemIndex) => itemIndex !== index) })}>Remove</button></div>
                  <div className="apx-canvas-v2-grid apx-canvas-v2-grid--2">
                    <Field label="From X" value={handle.from.x} onChange={(x) => patch({ controlPoints:(current.controlPoints ?? []).map((item,itemIndex)=>itemIndex===index?{...item,from:{...item.from,x}}:item) })}/>
                    <Field label="From Y" value={handle.from.y} onChange={(y) => patch({ controlPoints:(current.controlPoints ?? []).map((item,itemIndex)=>itemIndex===index?{...item,from:{...item.from,y}}:item) })}/>
                    <Field label="To X" value={handle.to.x} onChange={(x) => patch({ controlPoints:(current.controlPoints ?? []).map((item,itemIndex)=>itemIndex===index?{...item,to:{...item.to,x}}:item) })}/>
                    <Field label="To Y" value={handle.to.y} onChange={(y) => patch({ controlPoints:(current.controlPoints ?? []).map((item,itemIndex)=>itemIndex===index?{...item,to:{...item.to,y}}:item) })}/>
                    <Field label="Radius" value={handle.radius ?? Math.max(width,height)*.25} min={.01} onChange={(radius) => patch({ controlPoints:(current.controlPoints ?? []).map((item,itemIndex)=>itemIndex===index?{...item,radius}:item) })}/>
                    <Field label="Strength" value={handle.strength ?? 1} step={.05} onChange={(strength) => patch({ controlPoints:(current.controlPoints ?? []).map((item,itemIndex)=>itemIndex===index?{...item,strength}:item) })}/>
                    <Select label="Falloff" value={handle.falloff ?? 'smooth'} options={FALLOFF} onChange={(falloff) => patch({ controlPoints:(current.controlPoints ?? []).map((item,itemIndex)=>itemIndex===index?{...item,falloff:falloff as typeof handle.falloff}:item) })}/>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {['bulge','pinch','twirl'].includes(current.type) ? (
            <div className="apx-canvas-v2-grid apx-canvas-v2-grid--2">
              <Field label="Center X" value={current.centerX ?? width/2} onChange={(centerX) => patch({ centerX })}/>
              <Field label="Center Y" value={current.centerY ?? height/2} onChange={(centerY) => patch({ centerY })}/>
              <Field label="Radius" value={current.radius ?? Math.min(width,height)/2} min={.01} onChange={(radius) => patch({ radius })}/>
              {current.type === 'twirl' ? <Field label="Angle" value={current.angle ?? 30} onChange={(angle) => patch({ angle })} suffix="°"/> : null}
            </div>
          ) : null}

          {current.type === 'wave' ? (
            <div className="apx-canvas-v2-grid apx-canvas-v2-grid--2">
              <Field label="Amplitude X" value={current.amplitudeX ?? 20} onChange={(amplitudeX) => patch({ amplitudeX })}/>
              <Field label="Amplitude Y" value={current.amplitudeY ?? 10} onChange={(amplitudeY) => patch({ amplitudeY })}/>
              <Field label="Wavelength X" value={current.wavelengthX ?? 160} min={.01} onChange={(wavelengthX) => patch({ wavelengthX })}/>
              <Field label="Wavelength Y" value={current.wavelengthY ?? 120} min={.01} onChange={(wavelengthY) => patch({ wavelengthY })}/>
              <Field label="Phase X" value={current.phaseX ?? 0} onChange={(phaseX) => patch({ phaseX })} suffix="°"/>
              <Field label="Phase Y" value={current.phaseY ?? 0} onChange={(phaseY) => patch({ phaseY })} suffix="°"/>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function meshDefault(width: number, height: number, gridX = 2, gridY = 2): VisualImageMeshWarp {
  return {
    gridX,
    gridY,
    interpolation:'bilinear',
    edgeMode:'transparent',
    controlPoints:Array.from({length:gridY + 1},(_, y) =>
      Array.from({length:gridX + 1},(_, x) => ({
        x:(width * x) / gridX,
        y:(height * y) / gridY,
      })),
    ),
  };
}

function MeshEditor({
  value,
  width,
  height,
  onChange,
}: {
  value?: VisualImageMeshWarp;
  width: number;
  height: number;
  onChange: (value?: VisualImageMeshWarp) => void;
}) {
  const current=value;
  const patch=(partial:Partial<VisualImageMeshWarp>)=>current&&onChange({...current,...partial});
  return (
    <div className="apx-image-v2-editor" data-image-mesh-editor>
      <Toggle label="Enable mesh warp" checked={Boolean(current)} onChange={(checked)=>onChange(checked?meshDefault(width,height):undefined)}/>
      {current ? (
        <>
          <div className="apx-canvas-v2-grid apx-canvas-v2-grid--2">
            <Field label="Grid X" value={current.gridX ?? 2} min={1} step={1} onChange={(gridX)=>onChange(meshDefault(width,height,Math.max(1,Math.round(gridX)),current.gridY ?? 2))}/>
            <Field label="Grid Y" value={current.gridY ?? 2} min={1} step={1} onChange={(gridY)=>onChange(meshDefault(width,height,current.gridX ?? 2,Math.max(1,Math.round(gridY))))}/>
            <Select label="Interpolation" value={current.interpolation ?? 'bilinear'} options={INTERPOLATION} onChange={(interpolation)=>patch({interpolation:interpolation as VisualImageMeshWarp['interpolation']})}/>
            <Select label="Edge mode" value={current.edgeMode ?? 'transparent'} options={EDGE_MODES} onChange={(edgeMode)=>patch({edgeMode:edgeMode as VisualImageMeshWarp['edgeMode']})}/>
          </div>
          <div className="apx-image-v2-mesh-points">
            {(current.controlPoints ?? []).map((row,y)=>row.map((point,x)=>(
              <div className="apx-image-v2-mesh-point" key={y+'-'+x}>
                <strong>{x},{y}</strong>
                <input type="number" value={point.x} onChange={(event)=>{
                  const controlPoints=(current.controlPoints ?? []).map((sourceRow,rowIndex)=>sourceRow.map((sourcePoint,colIndex)=>rowIndex===y&&colIndex===x?{...sourcePoint,x:Number(event.target.value)}:sourcePoint));
                  patch({controlPoints});
                }}/>
                <input type="number" value={point.y} onChange={(event)=>{
                  const controlPoints=(current.controlPoints ?? []).map((sourceRow,rowIndex)=>sourceRow.map((sourcePoint,colIndex)=>rowIndex===y&&colIndex===x?{...sourcePoint,y:Number(event.target.value)}:sourcePoint));
                  patch({controlPoints});
                }}/>
              </div>
            )))}
          </div>
        </>
      ) : null}
    </div>
  );
}

function EffectsEditor({
  value,
  width,
  height,
  onChange,
}: {
  value?: VisualImageEffects;
  width: number;
  height: number;
  onChange: (value?: VisualImageEffects) => void;
}) {
  const effects=value ?? {};
  const patch=<K extends keyof VisualImageEffects>(key:K,next:VisualImageEffects[K] | undefined)=>{
    const merged={...effects,[key]:next};
    if (next === undefined) delete merged[key];
    onChange(Object.keys(merged).length ? merged : undefined);
  };
  return (
    <div className="apx-image-v2-effects-grid">
      <div className="apx-image-v2-effect-card">
        <Toggle label="Vignette" checked={Boolean(effects.vignette)} onChange={(checked)=>patch('vignette',checked?{intensity:.35,size:.75}:undefined)}/>
        {effects.vignette ? <div className="apx-canvas-v2-grid apx-canvas-v2-grid--2"><Field label="Intensity" value={effects.vignette.intensity} step={.05} onChange={(intensity)=>patch('vignette',{...effects.vignette!,intensity})}/><Field label="Size" value={effects.vignette.size} step={.05} onChange={(size)=>patch('vignette',{...effects.vignette!,size})}/></div> : null}
      </div>
      <div className="apx-image-v2-effect-card">
        <Toggle label="Lens flare" checked={Boolean(effects.lensFlare)} onChange={(checked)=>patch('lensFlare',checked?{x:width*.75,y:height*.25,intensity:.6}:undefined)}/>
        {effects.lensFlare ? <div className="apx-canvas-v2-grid apx-canvas-v2-grid--2"><Field label="X" value={effects.lensFlare.x} onChange={(x)=>patch('lensFlare',{...effects.lensFlare!,x})}/><Field label="Y" value={effects.lensFlare.y} onChange={(y)=>patch('lensFlare',{...effects.lensFlare!,y})}/><Field label="Intensity" value={effects.lensFlare.intensity} step={.05} onChange={(intensity)=>patch('lensFlare',{...effects.lensFlare!,intensity})}/></div> : null}
      </div>
      <div className="apx-image-v2-effect-card">
        <Toggle label="Chromatic aberration" checked={Boolean(effects.chromaticAberration)} onChange={(checked)=>patch('chromaticAberration',checked?{intensity:.25}:undefined)}/>
        {effects.chromaticAberration ? <Field label="Intensity" value={effects.chromaticAberration.intensity} step={.05} onChange={(intensity)=>patch('chromaticAberration',{intensity})}/> : null}
      </div>
      <div className="apx-image-v2-effect-card">
        <Toggle label="Film grain" checked={Boolean(effects.filmGrain)} onChange={(checked)=>patch('filmGrain',checked?{intensity:.08}:undefined)}/>
        {effects.filmGrain ? <Field label="Intensity" value={effects.filmGrain.intensity} step={.01} onChange={(intensity)=>patch('filmGrain',{intensity})}/> : null}
      </div>
    </div>
  );
}

function StrokeEditor({
  value,
  onChange,
}: {
  value?: VisualStrokeOptions;
  onChange: (value?: VisualStrokeOptions) => void;
}) {
  const current=value;
  const patch=(partial:Partial<VisualStrokeOptions>)=>current&&onChange({...current,...partial});
  return (
    <div className="apx-image-v2-editor">
      <Toggle label="Stroke" checked={Boolean(current)} onChange={(checked)=>onChange(checked?{color:'#ffffff',width:2,position:0,blur:0,opacity:1,style:'solid',roundedCorners:'all'}:undefined)}/>
      {current ? (
        <>
          <div className="apx-canvas-v2-grid apx-canvas-v2-grid--2">
            <Color label="Color" value={current.color} fallback="#ffffff" onChange={(color)=>patch({color,gradient:undefined})}/>
            <Select label="Style" value={current.style ?? 'solid'} options={STROKE_STYLES} onChange={(style)=>patch({style:style as VisualStrokeOptions['style']})}/>
            <Field label="Width" value={current.width ?? 2} min={0} onChange={(width)=>patch({width})}/>
            <Field label="Position" value={current.position ?? 0} onChange={(position)=>patch({position})}/>
            <Field label="Blur" value={current.blur ?? 0} min={0} onChange={(blur)=>patch({blur})}/>
            <Field label="Opacity" value={current.opacity ?? 1} min={0} max={1} step={.05} onChange={(opacity)=>patch({opacity})}/>
            <Select label="Border position" value={current.borderPosition ?? 'all'} options={BORDER_POSITIONS} onChange={(borderPosition)=>patch({borderPosition})}/>
            <Select label="Rounded corners" value={current.roundedCorners ?? 'all'} options={BORDER_POSITIONS} onChange={(roundedCorners)=>patch({roundedCorners})}/>
          </div>
          <Toggle label="Gradient stroke" checked={Boolean(current.gradient)} onChange={(checked)=>patch({gradient:checked?defaultGradient():undefined})}/>
          {current.gradient ? <GradientEditor value={current.gradient} onChange={(gradient)=>patch({gradient})}/> : null}
        </>
      ) : null}
    </div>
  );
}

function ShadowEditor({
  value,
  onChange,
}: {
  value?: VisualShadowOptions;
  onChange: (value?: VisualShadowOptions) => void;
}) {
  const current=value;
  const patch=(partial:Partial<VisualShadowOptions>)=>current&&onChange({...current,...partial});
  return (
    <div className="apx-image-v2-editor">
      <Toggle label="Shadow" checked={Boolean(current)} onChange={(checked)=>onChange(checked?{color:'#000000',offsetX:0,offsetY:12,blur:24,opacity:.35,roundedCorners:'all'}:undefined)}/>
      {current ? (
        <>
          <div className="apx-canvas-v2-grid apx-canvas-v2-grid--2">
            <Color label="Color" value={current.color} fallback="#000000" onChange={(color)=>patch({color,gradient:undefined})}/>
            <Field label="Offset X" value={current.offsetX ?? 0} onChange={(offsetX)=>patch({offsetX})}/>
            <Field label="Offset Y" value={current.offsetY ?? 12} onChange={(offsetY)=>patch({offsetY})}/>
            <Field label="Blur" value={current.blur ?? 24} min={0} onChange={(blur)=>patch({blur})}/>
            <Field label="Opacity" value={current.opacity ?? .35} min={0} max={1} step={.05} onChange={(opacity)=>patch({opacity})}/>
            <Select label="Rounded corners" value={current.roundedCorners ?? current.borderPosition ?? 'all'} options={BORDER_POSITIONS} onChange={(roundedCorners)=>patch({roundedCorners})}/>
          </div>
          <Toggle label="Gradient shadow" checked={Boolean(current.gradient)} onChange={(checked)=>patch({gradient:checked?defaultGradient():undefined})}/>
          {current.gradient ? <GradientEditor value={current.gradient} onChange={(gradient)=>patch({gradient})}/> : null}
        </>
      ) : null}
    </div>
  );
}

function BoxBackgroundEditor({
  value,
  onChange,
}: {
  value?: VisualBoxBackground;
  onChange: (value?: VisualBoxBackground) => void;
}) {
  const current=value;
  const patch=(partial:Partial<VisualBoxBackground>)=>current&&onChange({...current,...partial});
  return (
    <div className="apx-image-v2-editor">
      <Toggle label="Layer box background" checked={Boolean(current)} onChange={(checked)=>onChange(checked?{color:'#101827'}:undefined)}/>
      {current ? (
        <>
          <Color label="Color" value={current.color} fallback="#101827" onChange={(color)=>patch({color})}/>
          <Toggle label="Gradient background" checked={Boolean(current.gradient)} onChange={(checked)=>patch({gradient:checked?defaultGradient():undefined})}/>
          {current.gradient ? <GradientEditor value={current.gradient} onChange={(gradient)=>patch({gradient})}/> : null}
        </>
      ) : null}
    </div>
  );
}

function SourceWorkspace({
  node,
  props,
  project,
  assets,
  onMutate,
  onInsertUrl,
  onInsertAsset,
  onUploadFiles,
  onOpenAssets,
}: {
  node?: VisualNode;
  props?: VisualImageNodeProps;
  project: VisualProject;
  assets: StudioVirtualAsset[];
  onMutate: Props['onMutate'];
  onInsertUrl: Props['onInsertUrl'];
  onInsertAsset: Props['onInsertAsset'];
  onUploadFiles: Props['onUploadFiles'];
  onOpenAssets: Props['onOpenAssets'];
}) {
  const [url,setUrl]=useState('');
  const imageAssets=assets.filter((asset)=>asset.mime.startsWith('image/'));
  const generated=project.document.rootNodeIds.map((id)=>project.document.nodes[id]).filter(Boolean).filter((item)=>item.id!==node?.id);
  const currentAssetId=props && typeof props.source==='string' ? studioAssetIdFromReference(props.source) : null;
  return (
    <div className="apx-image-v2-source-workspace" data-image-source-workspace>
      <div className="apx-image-v2-upload-hero">
        <PhotoIcon aria-hidden/>
        <div><strong>{node ? 'Replace image source' : 'Add an image'}</strong><span>Upload, pick a Studio asset, use a URL, or bind an earlier generated buffer.</span></div>
        <label className="apx-canvas-mini-button">
          <ArrowDownTrayIcon aria-hidden/> Upload
          <input hidden type="file" accept="image/*" multiple={!node} onChange={(event)=>{ if(event.target.files?.length) onUploadFiles(event.target.files); event.currentTarget.value=''; }}/>
        </label>
      </div>
      <div className="apx-image-v2-url-row">
        <input className="apx-canvas-v2-input" value={url} placeholder="https://example.com/image.png" onChange={(event)=>setUrl(event.target.value)} onKeyDown={(event)=>{if(event.key==='Enter'&&url.trim()){node?onMutate('Replace image URL',(current)=>({...current,source:url.trim()})):onInsertUrl(url.trim());setUrl('');}}}/>
        <button type="button" disabled={!url.trim()} onClick={()=>{node?onMutate('Replace image URL',(current)=>({...current,source:url.trim()})):onInsertUrl(url.trim());setUrl('');}}>Use URL</button>
      </div>
      <div className="apx-canvas-v2-subhead"><div><strong>Studio assets</strong><small>{imageAssets.length} image asset{imageAssets.length===1?'':'s'}</small></div><button type="button" onClick={onOpenAssets}><CircleStackIcon aria-hidden/> Assets</button></div>
      <div className="apx-image-v2-asset-grid">
        {imageAssets.map((asset)=>(
          <button
            type="button"
            key={asset.id}
            data-active={currentAssetId===asset.id?'true':undefined}
            onClick={()=>node?onMutate('Replace image asset',(current)=>({...current,source:studioAssetReference(asset)})):onInsertAsset(asset)}
          >
            <span className="apx-image-v2-asset-thumb">IMG</span>
            <span><strong>{asset.name}</strong><small>{asset.metadata?.width&&asset.metadata?.height?asset.metadata.width+'×'+asset.metadata.height:asset.mime}</small></span>
          </button>
        ))}
        {!imageAssets.length?<div className="apx-canvas-v2-empty-mini">No uploaded images yet.</div>:null}
      </div>
      {node&&props ? (
        <label className="apx-canvas-v2-field">
          <span>Generated buffer source</span>
          <select
            className="apx-canvas-v2-input"
            value={typeof props.source==='object'&&'$generated'in props.source?props.source.$generated:''}
            onChange={(event)=>event.target.value&&onMutate('Generated image source',(current)=>({...current,source:{$generated:event.target.value}}))}
          >
            <option value="">Not generated</option>
            <option value="document_canvas">Canvas buffer</option>
            {generated.map((item)=><option key={item.id} value={item.id}>{item.name??item.kind}</option>)}
          </select>
        </label>
      ):null}
    </div>
  );
}

function GroupEditor({
  value,
  width,
  height,
  assets,
  onChange,
}: {
  value?: VisualImageGroupTransform;
  width: number;
  height: number;
  assets: StudioVirtualAsset[];
  onChange: (value?: VisualImageGroupTransform) => void;
}) {
  const current=value ?? {};
  const patch=(partial:Partial<VisualImageGroupTransform>)=>onChange({...current,...partial});
  return (
    <div className="apx-image-v2-group" data-image-group-transform>
      <div className="apx-canvas-v2-grid apx-canvas-v2-grid--2">
        <Field label="Rotation" value={current.rotation ?? 0} onChange={(rotation)=>patch({rotation})} suffix="°"/>
        <Field label="Translate X" value={current.translateX ?? 0} onChange={(translateX)=>patch({translateX})}/>
        <Field label="Translate Y" value={current.translateY ?? 0} onChange={(translateY)=>patch({translateY})}/>
        <Field label="Scale X" value={current.scaleX ?? 1} min={.01} step={.05} onChange={(scaleX)=>patch({scaleX})}/>
        <Field label="Scale Y" value={current.scaleY ?? 1} min={.01} step={.05} onChange={(scaleY)=>patch({scaleY})}/>
        <Field label="Pivot X" value={current.pivotX ?? width/2} onChange={(pivotX)=>patch({pivotX})}/>
        <Field label="Pivot Y" value={current.pivotY ?? height/2} onChange={(pivotY)=>patch({pivotY})}/>
        <Field label="Opacity" value={current.opacity ?? 1} min={0} max={1} step={.05} onChange={(opacity)=>patch({opacity})}/>
        <Field label="Blur" value={current.blur ?? 0} min={0} onChange={(blur)=>patch({blur})}/>
        <Select label="Blend mode" value={current.blendMode ?? 'source-over'} options={IMAGE_BLEND_MODES} onChange={(blendMode)=>patch({blendMode:blendMode as VisualBlendMode})}/>
        <Field label="Border radius" value={typeof current.borderRadius==='number'?current.borderRadius:0} min={0} onChange={(borderRadius)=>patch({borderRadius})}/>
        <Select label="Border position" value={current.borderPosition ?? 'all'} options={BORDER_POSITIONS} onChange={(borderPosition)=>patch({borderPosition})}/>
      </div>
      <Toggle label="Circular group clip" checked={current.borderRadius==='circular'} onChange={(checked)=>patch({borderRadius:checked?'circular':0})}/>
      <Section title="Group filters" description="Pre/post filters applied to the isolated group raster.">
        <div className="apx-canvas-v2-grid apx-canvas-v2-grid--2">
          <Field label="Filter intensity" value={current.filterIntensity ?? 1} min={0} step={.05} onChange={(filterIntensity)=>patch({filterIntensity})}/>
          <Select label="Filter order" value={current.filterOrder ?? 'post'} options={['pre','post']} onChange={(filterOrder)=>patch({filterOrder:filterOrder as 'pre'|'post'})}/>
        </div>
        <FilterStack filters={current.filters ?? []} width={width} height={height} onChange={(filters)=>patch({filters})}/>
      </Section>
      <Section title="Group mask & clip">
        <MaskEditor value={current.mask} assets={assets} onChange={(mask)=>patch({mask})}/>
        <ClipPathEditor points={current.clipPath} width={width} height={height} onChange={(clipPath)=>patch({clipPath})}/>
      </Section>
      <Section title="Group nonlinear transforms">
        <DistortionEditor value={current.distortion} width={width} height={height} onChange={(distortion)=>patch({distortion})}/>
        <MeshEditor value={current.meshWarp} width={width} height={height} onChange={(meshWarp)=>patch({meshWarp})}/>
      </Section>
      <Section title="Group visual effects">
        <EffectsEditor value={current.effects} width={width} height={height} onChange={(effects)=>patch({effects})}/>
      </Section>
      <Section title="Group appearance">
        <StrokeEditor value={current.stroke} onChange={(stroke)=>patch({stroke})}/>
        <ShadowEditor value={current.shadow} onChange={(shadow)=>patch({shadow})}/>
        <BoxBackgroundEditor value={current.boxBackground} onChange={(boxBackground)=>patch({boxBackground})}/>
      </Section>
    </div>
  );
}

export function VisualImageInspector({
  project,
  node,
  tab,
  assets,
  renderTransform,
  onMutate,
  onRename,
  onInsertUrl,
  onInsertAsset,
  onUploadFiles,
  onOpenAssets,
}: Props) {
  const validNode = node && (node.kind === 'image' || node.kind === 'shape') ? node : undefined;
  const props = validNode ? visualImageProps(validNode) : undefined;
  const width = Math.max(1, validNode?.transform?.width ?? project.document.width);
  const height = Math.max(1, validNode?.transform?.height ?? project.document.height);
  const isShape = validNode?.kind === 'shape';
  const imageAssets = useMemo(() => assets.filter((asset)=>asset.mime.startsWith('image/')), [assets]);

  const header = validNode ? (
    <div className="apx-image-v2-header">
      <div>
        <strong>{validNode.name ?? (isShape ? 'Shape' : 'Image')}</strong>
        <small>{isShape ? 'Procedural createImage() shape' : 'createImage() raster layer'} · {width}×{height}</small>
      </div>
      <span className="apx-pre4-type-pill">{validNode.kind}</span>
    </div>
  ) : (
    <div className="apx-image-v2-header">
      <div><strong>Image workspace</strong><small>Add an image, then all ImageProperties controls remain on this right inspector.</small></div>
      <span className="apx-pre4-type-pill">image</span>
    </div>
  );

  if (!validNode) {
    return (
      <div className="apx-image-v2" data-image-inspector-v2 data-image-tab={tab}>
        {header}
        <Section title="Source & upload" description="Image creation belongs on the inspector, not the layer/navigation rail." defaultOpen>
          <SourceWorkspace
            project={project}
            assets={assets}
            onMutate={onMutate}
            onInsertUrl={onInsertUrl}
            onInsertAsset={onInsertAsset}
            onUploadFiles={onUploadFiles}
            onOpenAssets={onOpenAssets}
          />
        </Section>
      </div>
    );
  }

  if (tab === 'transform') {
    return (
      <div className="apx-image-v2" data-image-inspector-v2 data-image-tab="transform">
        {header}
        {renderTransform()}
      </div>
    );
  }

  if (tab === 'data') {
    return (
      <div className="apx-image-v2" data-image-inspector-v2 data-image-tab="data">
        {header}
        {!isShape ? (
          <Section title="Source & upload" description="Replace source by upload, URL, Studio asset or generated buffer." defaultOpen>
            <SourceWorkspace
              node={validNode}
              props={props}
              project={project}
              assets={assets}
              onMutate={onMutate}
              onInsertUrl={onInsertUrl}
              onInsertAsset={onInsertAsset}
              onUploadFiles={onUploadFiles}
              onOpenAssets={onOpenAssets}
            />
          </Section>
        ) : null}
        {!isShape ? (
          <VisualImageUtilityAuthoring
            value={props!}
            mode="data"
            onChange={(next,label)=>onMutate(label,()=>next)}
          />
        ) : null}
      </div>
    );
  }

  if (tab === 'style') {
    const shape=props!.shape ?? {};
    return (
      <div className="apx-image-v2" data-image-inspector-v2 data-image-tab="style">
        {header}
        <Section title="Identity" description="Layer name and source identity." defaultOpen>
          <label className="apx-canvas-v2-field"><span>Name</span><input className="apx-canvas-v2-input" value={validNode.name ?? validNode.kind} onChange={(event)=>onRename(event.target.value)}/></label>
        </Section>

        {isShape ? (
          <Section title="Procedural shape" description="Built-in shape geometry routed through createImage()." defaultOpen>
            <Select label="Shape source" value={typeof props!.source==='string'?props!.source:'rectangle'} options={IMAGE_SHAPE_TYPES} onChange={(source)=>onMutate('Shape source',(current)=>({...current,source,shape:{...current.shape}}))}/>
            <Toggle label="Fill shape" checked={shape.fill ?? true} onChange={(fill)=>onMutate('Shape fill',(current)=>({...current,shape:{...(current.shape??{}),fill}}))}/>
            <Color label="Shape color" value={shape.color} fallback="#6f86ff" onChange={(color)=>onMutate('Shape color',(current)=>({...current,shape:{...(current.shape??{}),color}}))}/>
            <div className="apx-canvas-v2-grid apx-canvas-v2-grid--2">
              <Field label="Radius" value={shape.radius ?? 72} min={.01} onChange={(radius)=>onMutate('Shape radius',(current)=>({...current,shape:{...(current.shape??{}),radius}}))}/>
              <Field label="Sides" value={shape.sides ?? 6} min={3} step={1} onChange={(sides)=>onMutate('Shape sides',(current)=>({...current,shape:{...(current.shape??{}),sides:Math.max(3,Math.round(sides))}}))}/>
              <Field label="Inner radius" value={shape.innerRadius ?? 36} min={0} onChange={(innerRadius)=>onMutate('Shape inner radius',(current)=>({...current,shape:{...(current.shape??{}),innerRadius}}))}/>
              <Field label="Outer radius" value={shape.outerRadius ?? 72} min={.01} onChange={(outerRadius)=>onMutate('Shape outer radius',(current)=>({...current,shape:{...(current.shape??{}),outerRadius}}))}/>
              <Field label="Start angle" value={shape.startAngle ?? 0} onChange={(startAngle)=>onMutate('Shape start angle',(current)=>({...current,shape:{...(current.shape??{}),startAngle}}))}/>
              <Field label="End angle" value={shape.endAngle ?? Math.PI*2} onChange={(endAngle)=>onMutate('Shape end angle',(current)=>({...current,shape:{...(current.shape??{}),endAngle}}))}/>
              <Field label="Center X" value={shape.centerX ?? width/2} onChange={(centerX)=>onMutate('Shape center X',(current)=>({...current,shape:{...(current.shape??{}),centerX}}))}/>
              <Field label="Center Y" value={shape.centerY ?? height/2} onChange={(centerY)=>onMutate('Shape center Y',(current)=>({...current,shape:{...(current.shape??{}),centerY}}))}/>
            </div>
            <Toggle label="Gradient fill" checked={Boolean(shape.gradient)} onChange={(checked)=>onMutate('Shape gradient',(current)=>({...current,shape:{...(current.shape??{}),gradient:checked?defaultGradient():undefined}}))}/>
            {shape.gradient ? <GradientEditor value={shape.gradient} onChange={(gradient)=>onMutate('Shape gradient',(current)=>({...current,shape:{...(current.shape??{}),gradient}}))}/> : null}
          </Section>
        ) : (
          <Section title="Layout & fitting" description="Native dimensions, fit and 9-way alignment." defaultOpen>
            <div className="apx-canvas-v2-grid apx-canvas-v2-grid--2">
              <Select label="Fit" value={props!.fit ?? 'fill'} options={IMAGE_FITS} onChange={(fit)=>onMutate('Image fit',(current)=>({...current,fit:fit as VisualImageNodeProps['fit']}))}/>
              <Select label="Alignment" value={props!.align ?? 'center'} options={IMAGE_ALIGNS} onChange={(align)=>onMutate('Image align',(current)=>({...current,align:align as VisualImageNodeProps['align']}))}/>
            </div>
            <Toggle label="Inherit native source dimensions" checked={props!.inherit ?? false} onChange={(inherit)=>onMutate('Image inherit',(current)=>({...current,inherit}))}/>
          </Section>
        )}

        <Section title="Compositing & geometry" description="Blend mode, rounded clipping and selective border positions." defaultOpen>
          <div className="apx-canvas-v2-grid apx-canvas-v2-grid--2">
            <Select label="Blend mode" value={props!.blendMode ?? 'source-over'} options={IMAGE_BLEND_MODES} onChange={(blendMode)=>onMutate('Image blend',(current)=>({...current,blendMode:blendMode as VisualBlendMode}))}/>
            <Field label="Border radius" value={typeof props!.borderRadius==='number'?props!.borderRadius:0} min={0} onChange={(borderRadius)=>onMutate('Image radius',(current)=>({...current,borderRadius}))}/>
            <Select label="Border position" value={props!.borderPosition ?? 'all'} options={BORDER_POSITIONS} onChange={(borderPosition)=>onMutate('Image border position',(current)=>({...current,borderPosition}))}/>
          </div>
          <Toggle label="Circular / oval clip" checked={props!.borderRadius==='circular'} onChange={(checked)=>onMutate('Circular image',(current)=>({...current,borderRadius:checked?'circular':0}))}/>
        </Section>

        <Section title="Stroke" description="Solid or gradient outline with six stroke styles.">
          <StrokeEditor value={props!.stroke} onChange={(stroke)=>onMutate('Image stroke',(current)=>({...current,stroke}))}/>
        </Section>
        <Section title="Shadow" description="Solid or gradient shadow with offsets, blur and selective rounding.">
          <ShadowEditor value={props!.shadow} onChange={(shadow)=>onMutate('Image shadow',(current)=>({...current,shadow}))}/>
        </Section>
        <Section title="Box background" description="Color or gradient backdrop beneath the layer.">
          <BoxBackgroundEditor value={props!.boxBackground} onChange={(boxBackground)=>onMutate('Image box background',(current)=>({...current,boxBackground}))}/>
        </Section>
      </div>
    );
  }

  if (tab === 'effects') {
    return (
      <div className="apx-image-v2" data-image-inspector-v2 data-image-tab="effects">
        {header}
        <Section title="Raster filters" description="All 17 ImageFilter types, regional pixelation and pre/post ordering." defaultOpen badge={String(props!.filters?.length ?? 0)}>
          <div className="apx-canvas-v2-grid apx-canvas-v2-grid--2">
            <Field label="Global filter intensity" value={props!.filterIntensity ?? 1} min={0} step={.05} onChange={(filterIntensity)=>onMutate('Filter intensity',(current)=>({...current,filterIntensity}))}/>
            <Select label="Filter order" value={props!.filterOrder ?? 'post'} options={['pre','post']} onChange={(filterOrder)=>onMutate('Filter order',(current)=>({...current,filterOrder:filterOrder as 'pre'|'post'}))}/>
          </div>
          <FilterStack filters={props!.filters ?? []} width={width} height={height} onChange={(filters)=>onMutate('Image filters',(current)=>({...current,filters}))}/>
        </Section>

        <Section title="Mask" description="Alpha, luminance or inverse mask applied after nonlinear deformation.">
          <MaskEditor value={props!.mask} assets={imageAssets} onChange={(mask)=>onMutate('Image mask',(current)=>({...current,mask}))}/>
        </Section>

        <Section title="Polygon clipping" description="Arbitrary clip path with three or more points.">
          <ClipPathEditor points={props!.clipPath} width={width} height={height} onChange={(clipPath)=>onMutate('Image clip path',(current)=>({...current,clipPath}))}/>
        </Section>

        <Section title="Distortion" description="Perspective, quad/liquify warp, bulge, pinch, twirl and wave." defaultOpen={Boolean(props!.distortion)}>
          <DistortionEditor value={props!.distortion} width={width} height={height} onChange={(distortion)=>onMutate('Image distortion',(current)=>({...current,distortion}))}/>
        </Section>

        <Section title="Mesh warp" description="Editable lattice with interpolation and edge sampling." defaultOpen={Boolean(props!.meshWarp)}>
          <MeshEditor value={props!.meshWarp} width={width} height={height} onChange={(meshWarp)=>onMutate('Image mesh warp',(current)=>({...current,meshWarp}))}/>
        </Section>

        <Section title="Optical effects" description="Vignette, lens flare, chromatic aberration and film grain." defaultOpen={Boolean(props!.effects)}>
          <EffectsEditor value={props!.effects} width={width} height={height} onChange={(effects)=>onMutate('Image effects',(current)=>({...current,effects}))}/>
        </Section>

        {!isShape ? (
          <Section title="Standalone image operations" description="Resize, crop, filters, color operations, masks, blends, stitch and collage.">
            <VisualImageUtilityAuthoring value={props!} mode="effects" onChange={(next,label)=>onMutate(label,()=>next)}/>
          </Section>
        ) : null}
      </div>
    );
  }

  const createOptions=props!.createOptions ?? {};
  return (
    <div className="apx-image-v2" data-image-inspector-v2 data-image-tab="advanced">
      {header}
      <Section title="Grouped createImage mode" description="Treat multiple createImage layers as one isolated transform/effect surface." defaultOpen={Boolean(createOptions.isGrouped)}>
        <Toggle label="Enable grouped mode" checked={createOptions.isGrouped ?? false} onChange={(isGrouped)=>onMutate('Grouped image mode',(current)=>({...current,createOptions:{...(current.createOptions??{}),isGrouped,groupTransform:current.createOptions?.groupTransform ?? {}}}))}/>
        {createOptions.isGrouped ? (
          <GroupEditor
            value={createOptions.groupTransform}
            width={width}
            height={height}
            assets={assets}
            onChange={(groupTransform)=>onMutate('Group transform',(current)=>({...current,createOptions:{...(current.createOptions??{}),isGrouped:true,groupTransform}}))}
          />
        ) : null}
      </Section>

      {!isShape ? (
        <Section title="Output & analysis utilities" description="Format conversion, compression, palette extraction and color analysis." defaultOpen>
          <VisualImageUtilityAuthoring value={props!} mode="advanced" onChange={(next,label)=>onMutate(label,()=>next)}/>
        </Section>
      ) : null}

      <Section title="Pipeline contract" description="The visual controls map directly to the current Apexify createImage pipeline.">
        <div className="apx-image-v2-pipeline">
          <span>Source / shape</span><b>↓</b><span>Pre filters</span><b>↓</b><span>Mesh warp</span><b>↓</b><span>Distortion</span><b>↓</b><span>Mask</span><b>↓</b><span>Post filters</span><b>↓</b><span>Effects</span><b>↓</b><span>Opacity · blur · rotation · blend</span><b>↓</b><span>Stroke / shadow / group composition</span>
        </div>
      </Section>
    </div>
  );
}
