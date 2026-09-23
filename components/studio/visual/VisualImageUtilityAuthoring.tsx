'use client';

import type {
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
  type ImageUtilityStackType,
} from '@/lib/studio/visual/image-utility-contract';
import { createVisualId } from '@/lib/studio/visual/ids';

type Props = {
  value: VisualImageNodeProps;
  mode: 'effects' | 'advanced';
  onChange: (next: VisualImageNodeProps, label: string) => void;
};

const EFFECT_TYPES = new Set<ImageUtilityStackType>([
  'resize','cropImage','effects','colorsFilter','colorsRemover',
  'blend','masking','gradientBlend','stitchImages','createCollage',
]);
const ADVANCED_TYPES = new Set<ImageUtilityStackType>(['imgConverter','compress']);

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

function analysisLabel(type: VisualImageUtilityAnalysis['type']) {
  return type === 'extractPalette' ? 'Extract palette' : 'Color analysis';
}

function operationDetail(operation: VisualImageUtilityOperation) {
  switch (operation.type) {
    case 'resize':
      return (operation.size?.width ?? 'auto') + '×' + (operation.size?.height ?? 'auto');
    case 'cropImage':
      return operation.crop + ' · ' + operation.coordinates.length + ' points';
    case 'effects':
      return operation.filters.length + ' filter' + (operation.filters.length === 1 ? '' : 's');
    case 'colorsFilter':
      return typeof operation.filterColor === 'string' ? operation.filterColor : 'gradient';
    case 'colorsRemover':
      return 'rgb(' + operation.colorToRemove.red + ', ' + operation.colorToRemove.green + ', ' + operation.colorToRemove.blue + ')';
    case 'blend':
      return operation.layers.length + ' layer' + (operation.layers.length === 1 ? '' : 's');
    case 'masking':
      return operation.options?.type ?? 'alpha';
    case 'gradientBlend':
      return (operation.options.type ?? 'linear') + ' · ' + operation.options.colors.length + ' stops';
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
        } catch {
          event.currentTarget.setCustomValidity('Invalid JSON');
          event.currentTarget.reportValidity();
        }
      }}
      aria-label="Image utility operation JSON"
    />
  );
}

export function VisualImageUtilityAuthoring({ value, mode, onChange }: Props) {
  const stack = value.utilityStack ?? [];
  const analyses = value.utilityAnalyses ?? [];
  const visibleTypes = mode === 'effects' ? EFFECT_TYPES : ADVANCED_TYPES;

  const updateStack = (next: VisualImageUtilityOperation[], label: string) =>
    onChange({ ...value, utilityStack: next }, label);

  const updateAnalyses = (next: VisualImageUtilityAnalysis[], label: string) =>
    onChange({ ...value, utilityAnalyses: next }, label);

  const addOperation = (type: ImageUtilityStackType) => {
    updateStack(
      [...stack, defaultImageUtilityOperation(type, createVisualId('image-op'))],
      'Add ' + stackLabel(type),
    );
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
    const nextIndex = index + delta;
    if (nextIndex < 0 || nextIndex >= stack.length) return;
    const next = [...stack];
    [next[index], next[nextIndex]] = [next[nextIndex]!, next[index]!];
    updateStack(next, 'Reorder image utilities');
  };

  if (mode === 'advanced') {
    return (
      <>
        <div className="apx-pre4-section" data-phase10-advanced>
          <div className="apx-pre4-section-title">Output-stage image utilities</div>
          <div className="apx-image-utility-add-row">
            {[...ADVANCED_TYPES].map((type) => (
              <button key={type} type="button" className="apx-canvas-mini-button" onClick={() => addOperation(type)}>
                + {stackLabel(type)}
              </button>
            ))}
          </div>
          {stack.map((operation, index) =>
            ADVANCED_TYPES.has(operation.type) ? (
              <div className="apx-pre4-section" data-image-utility={operation.type} key={operation.id}>
                <div className="apx-canvas-section-heading">
                  <div>
                    <strong>{index + 1}. {stackLabel(operation.type)}</strong>
                    <small>{operationDetail(operation)}</small>
                  </div>
                  <div className="apx-image-utility-actions">
                    <button type="button" onClick={() => moveOperation(index, -1)} disabled={index === 0}>↑</button>
                    <button type="button" onClick={() => moveOperation(index, 1)} disabled={index === stack.length - 1}>↓</button>
                    <button type="button" onClick={() => updateStack(stack.filter((item) => item.id !== operation.id), 'Remove image utility')}>×</button>
                  </div>
                </div>
                <label className="apx-canvas-check">
                  <input
                    type="checkbox"
                    checked={operation.enabled !== false}
                    onChange={(event) => patchOperation(operation.id, { ...operation, enabled: event.target.checked }, 'Toggle image utility')}
                  />
                  <span>Enabled</span>
                </label>
                <JsonConfig
                  value={operation}
                  onApply={(next) => patchOperation(operation.id, next as VisualImageUtilityOperation)}
                />
              </div>
            ) : null,
          )}
        </div>

        <div className="apx-pre4-section" data-phase10-analysis>
          <div className="apx-canvas-section-heading">
            <div>
              <div className="apx-pre4-section-title">Image analysis</div>
              <small>Structured results; does not replace the raster output.</small>
            </div>
          </div>
          <div className="apx-image-utility-add-row">
            {IMAGE_UTILITY_ANALYSIS_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                className="apx-canvas-mini-button"
                onClick={() =>
                  updateAnalyses(
                    [...analyses, defaultImageUtilityAnalysis(type, createVisualId('image-analysis'))],
                    'Add image analysis',
                  )
                }
              >
                + {analysisLabel(type)}
              </button>
            ))}
          </div>
          {analyses.map((analysis) => (
            <div className="apx-image-utility-row" data-image-analysis={analysis.type} key={analysis.id}>
              <div>
                <strong>{analysisLabel(analysis.type)}</strong>
                <small>{analysis.enabled === false ? 'disabled' : 'full-runtime'}</small>
              </div>
              <button type="button" onClick={() => updateAnalyses(analyses.filter((item) => item.id !== analysis.id), 'Remove image analysis')}>×</button>
              <JsonConfig
                value={analysis}
                onApply={(next) => {
                  const parsed = next as VisualImageUtilityAnalysis;
                  updateAnalyses(
                    analyses.map((item) =>
                      item.id === analysis.id
                        ? { ...parsed, id: item.id, type: item.type } as VisualImageUtilityAnalysis
                        : item,
                    ),
                    'Edit image analysis',
                  );
                }}
              />
            </div>
          ))}
        </div>

        <div className="apx-live-sync-note" data-phase10-api-coverage>
          <strong>Phase 10 API coverage</strong>
          <span>
            All {Object.keys(IMAGE_UTILITY_API_COVERAGE).length} public image utility members are classified.
            removeBackground is intentionally excluded from hosted authoring because it requires external credentials;
            validHex is a non-authoring helper.
          </span>
        </div>
      </>
    );
  }

  return (
    <div className="apx-pre4-section" data-phase10-image-stack>
      <div className="apx-canvas-section-heading">
        <div>
          <div className="apx-pre4-section-title">Nondestructive image stack</div>
          <small>Executed top-to-bottom with the real Apexify full runtime.</small>
        </div>
      </div>

      <div className="apx-image-utility-presets" data-phase10-presets>
        <button
          type="button"
          className="apx-canvas-mini-button"
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
          className="apx-canvas-mini-button"
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
        <button type="button" className="apx-canvas-mini-button" onClick={() => updateStack([], 'Clear image utilities')}>
          Clear
        </button>
      </div>

      <div className="apx-image-utility-add-row">
        {IMAGE_UTILITY_STACK_TYPES.filter((type) => visibleTypes.has(type)).map((type) => (
          <button key={type} type="button" className="apx-canvas-mini-button" onClick={() => addOperation(type)}>
            + {stackLabel(type)}
          </button>
        ))}
      </div>

      <div className="apx-image-utility-stack">
        {stack.map((operation, index) =>
          EFFECT_TYPES.has(operation.type) ? (
            <div className="apx-image-utility-card" data-image-utility={operation.type} key={operation.id}>
              <div className="apx-canvas-section-heading">
                <div>
                  <strong>{index + 1}. {stackLabel(operation.type)}</strong>
                  <small>{operationDetail(operation)}</small>
                </div>
                <div className="apx-image-utility-actions">
                  <button type="button" onClick={() => moveOperation(index, -1)} disabled={index === 0}>↑</button>
                  <button type="button" onClick={() => moveOperation(index, 1)} disabled={index === stack.length - 1}>↓</button>
                  <button type="button" onClick={() => updateStack(stack.filter((item) => item.id !== operation.id), 'Remove image utility')}>×</button>
                </div>
              </div>
              <label className="apx-canvas-check">
                <input
                  type="checkbox"
                  checked={operation.enabled !== false}
                  onChange={(event) => patchOperation(operation.id, { ...operation, enabled: event.target.checked }, 'Toggle image utility')}
                />
                <span>Enabled</span>
              </label>
              <JsonConfig
                value={operation}
                onApply={(next) => patchOperation(operation.id, next as VisualImageUtilityOperation)}
              />
            </div>
          ) : null,
        )}
      </div>
    </div>
  );
}
