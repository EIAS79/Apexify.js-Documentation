'use client';

import type { StudioVirtualAsset } from '@/lib/studio/runtime/assets';
import { studioAssetDataUrl, studioAssetReference } from '@/lib/studio/runtime/assets';
import type { VisualProject } from '@/lib/studio/visual/model';
import {
  createPhase11Frame,
  defaultPhase11Timeline,
  phase11Timeline,
  setPhase11Timeline,
  type Phase11Frame,
  type Phase11Mode,
  type Phase11Timeline,
} from '@/lib/studio/visual/gif-animation-contract';
import { createVisualId } from '@/lib/studio/visual/ids';

type Mutate = (
  label: string,
  mutation: (project: VisualProject) => VisualProject,
) => void;

type SharedProps = {
  project: VisualProject;
  assets: StudioVirtualAsset[];
  onMutate: Mutate;
};

function activeTimeline(project: VisualProject) {
  return phase11Timeline(project) ?? defaultPhase11Timeline(project);
}

function updateTimeline(
  project: VisualProject,
  updater: (timeline: Phase11Timeline) => Phase11Timeline,
) {
  return setPhase11Timeline(project, updater(activeTimeline(project)));
}

function numeric(value: string, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function imageAssets(assets: StudioVirtualAsset[]) {
  return assets.filter((asset) => asset.mime.startsWith('image/'));
}

export function VisualGifContext({
  project,
  assets,
  onMutate,
  onOpenTimeline,
  onPreview,
}: SharedProps & {
  onOpenTimeline: () => void;
  onPreview: () => void;
}) {
  const timeline = phase11Timeline(project);
  const current = timeline ?? defaultPhase11Timeline(project);
  const images = imageAssets(assets);

  const patch = (
    label: string,
    change: (value: Phase11Timeline) => Phase11Timeline,
  ) => onMutate(label, (value) => updateTimeline(value, change));

  const setMode = (mode: Phase11Mode) =>
    patch('GIF mode', (value) => ({ ...value, mode }));

  return (
    <div className="apx-media-context apx-gif-context" data-phase11-gif-context>
      <div className="apx-media-context-copy">
        <strong>GIF & animation</strong>
        <span>Author deterministic frames, render with real Apexify createGIF/animate/scene-to-GIF APIs, and keep timing linked to code.</span>
      </div>

      {!timeline ? (
        <button
          type="button"
          className="apx-media-open-assets"
          data-phase11-create-timeline
          onClick={() =>
            onMutate('Create GIF timeline', (value) =>
              setPhase11Timeline(value, defaultPhase11Timeline(value)),
            )
          }
        >
          Create animation timeline
        </button>
      ) : null}

      <div className="apx-media-context-heading">
        <strong>Runtime mode</strong>
        <span>{current.frames.length} frames</span>
      </div>
      <div className="apx-gif-mode-grid" data-phase11-modes>
        {([
          ['create-gif', 'GIF frames'],
          ['animate', 'Animate'],
          ['scene-gif', 'Scene → GIF'],
        ] as const).map(([mode, label]) => (
          <button
            type="button"
            key={mode}
            data-phase11-mode={mode}
            data-active={current.mode === mode ? 'true' : undefined}
            onClick={() => setMode(mode)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="apx-pre4-property-grid apx-gif-settings" data-phase11-settings>
        <label>
          <span>Width</span>
          <input
            type="number"
            min={1}
            value={current.width}
            onChange={(event) =>
              patch('GIF width', (value) => ({
                ...value,
                width: Math.max(1, Math.round(numeric(event.target.value, value.width))),
              }))
            }
          />
        </label>
        <label>
          <span>Height</span>
          <input
            type="number"
            min={1}
            value={current.height}
            onChange={(event) =>
              patch('GIF height', (value) => ({
                ...value,
                height: Math.max(1, Math.round(numeric(event.target.value, value.height))),
              }))
            }
          />
        </label>
        <label>
          <span>Delay ms</span>
          <input
            type="number"
            min={1}
            value={current.delay}
            onChange={(event) =>
              patch('GIF delay', (value) => ({
                ...value,
                delay: Math.max(1, Math.round(numeric(event.target.value, value.delay))),
              }))
            }
          />
        </label>
        <label>
          <span>Repeat</span>
          <input
            type="number"
            min={-1}
            value={current.repeat}
            onChange={(event) =>
              patch('GIF repeat', (value) => ({
                ...value,
                repeat: Math.max(-1, Math.round(numeric(event.target.value, value.repeat))),
              }))
            }
          />
        </label>
        <label>
          <span>Quality</span>
          <input
            type="number"
            min={1}
            max={30}
            value={current.quality}
            onChange={(event) =>
              patch('GIF quality', (value) => ({
                ...value,
                quality: Math.max(1, Math.min(30, Math.round(numeric(event.target.value, value.quality)))),
              }))
            }
          />
        </label>
      </div>

      {current.mode === 'scene-gif' ? (
        <div className="apx-gif-scene-options" data-phase11-scene-options>
          <label>
            <input
              type="checkbox"
              checked={current.scene?.prependComposedRaster !== false}
              onChange={(event) =>
                patch('Scene GIF composition', (value) => ({
                  ...value,
                  scene: {
                    ...(value.scene ?? {}),
                    prependComposedRaster: event.target.checked,
                  },
                }))
              }
            />
            Include current composed scene
          </label>
          <label>
            Scene duration
            <input
              type="number"
              min={1}
              value={current.scene?.composedFrameDuration ?? current.delay}
              onChange={(event) =>
                patch('Scene frame duration', (value) => ({
                  ...value,
                  scene: {
                    ...(value.scene ?? {}),
                    composedFrameDuration: Math.max(
                      1,
                      Math.round(numeric(event.target.value, value.delay)),
                    ),
                  },
                }))
              }
            />
          </label>
          <label>
            Scene repeat
            <input
              type="number"
              min={1}
              value={current.scene?.composedFrameRepeat ?? 1}
              onChange={(event) =>
                patch('Scene frame repeat', (value) => ({
                  ...value,
                  scene: {
                    ...(value.scene ?? {}),
                    composedFrameRepeat: Math.max(
                      1,
                      Math.round(numeric(event.target.value, 1)),
                    ),
                  },
                }))
              }
            />
          </label>
        </div>
      ) : null}

      <div className="apx-media-context-heading">
        <strong>Frame assets</strong>
        <button type="button" onClick={onOpenTimeline}>Timeline</button>
      </div>

      <div className="apx-media-asset-list apx-gif-asset-list">
        {images.slice(0, 8).map((asset) => (
          <button
            type="button"
            key={asset.id}
            data-phase11-add-asset={asset.id}
            onClick={() =>
              patch('Add GIF frame', (value) => ({
                ...value,
                frames: [...value.frames, createPhase11Frame(studioAssetReference(asset))],
              }))
            }
          >
            <img src={studioAssetDataUrl(asset)} alt="" />
            <span>
              <strong>{asset.name}</strong>
              <small>Add frame</small>
            </span>
          </button>
        ))}
        {!images.length ? (
          <div className="apx-media-context-empty">
            <strong>No image assets yet</strong>
            <span>Upload images in Assets or add remote frame URLs in the Timeline.</span>
          </div>
        ) : null}
      </div>

      <div className="apx-gif-context-actions">
        <button type="button" data-phase11-open-timeline onClick={onOpenTimeline}>
          Open Timeline
        </button>
        <button
          type="button"
          data-phase11-preview
          onClick={onPreview}
          disabled={!timeline}
        >
          Preview GIF
        </button>
      </div>
    </div>
  );
}

function FrameEditor({
  frame,
  index,
  count,
  assets,
  timeline,
  onChange,
  onMove,
  onDuplicate,
  onDelete,
}: {
  frame: Phase11Frame;
  index: number;
  count: number;
  assets: StudioVirtualAsset[];
  timeline: Phase11Timeline;
  onChange: (frame: Phase11Frame) => void;
  onMove: (delta: -1 | 1) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const matchedAsset = assets.find((asset) => studioAssetReference(asset) === frame.source);
  return (
    <div className="apx-gif-frame" data-phase11-frame={frame.id}>
      <div className="apx-gif-frame-preview">
        {matchedAsset ? (
          <img src={studioAssetDataUrl(matchedAsset)} alt="" />
        ) : frame.source ? (
          <span>IMG</span>
        ) : (
          <span style={{ background: frame.backgroundColor ?? '#111827' }}>BG</span>
        )}
        <small>{index + 1}</small>
      </div>
      <div className="apx-gif-frame-fields">
        <input
          value={frame.source ?? ''}
          placeholder={timeline.mode === 'animate' ? 'Image source (optional)' : 'Image source'}
          onChange={(event) => onChange({ ...frame, source: event.target.value })}
          data-phase11-frame-source
        />
        {timeline.mode === 'animate' ? (
          <input
            type="color"
            value={frame.backgroundColor ?? '#111827'}
            onChange={(event) => onChange({ ...frame, backgroundColor: event.target.value })}
            aria-label="Animation frame background"
          />
        ) : null}
        <label>
          <span>ms</span>
          <input
            type="number"
            min={1}
            value={frame.duration ?? timeline.delay}
            onChange={(event) =>
              onChange({
                ...frame,
                duration: Math.max(1, Math.round(numeric(event.target.value, timeline.delay))),
              })
            }
          />
        </label>
        <label>
          <span>×</span>
          <input
            type="number"
            min={1}
            value={frame.repeat ?? 1}
            onChange={(event) =>
              onChange({
                ...frame,
                repeat: Math.max(1, Math.round(numeric(event.target.value, 1))),
              })
            }
          />
        </label>
      </div>
      <div className="apx-gif-frame-actions">
        <button type="button" disabled={index === 0} onClick={() => onMove(-1)}>←</button>
        <button type="button" disabled={index === count - 1} onClick={() => onMove(1)}>→</button>
        <button type="button" onClick={onDuplicate}>Duplicate</button>
        <button type="button" onClick={onDelete}>Delete</button>
      </div>
    </div>
  );
}

export function VisualGifTimeline({
  project,
  assets,
  onMutate,
}: SharedProps) {
  const timeline = phase11Timeline(project);

  if (!timeline) {
    return (
      <div className="apx-pre4-dock-empty" data-phase11-timeline-empty>
        <strong>No GIF timeline</strong>
        <span>Open GIF from the feature rail and create a timeline.</span>
      </div>
    );
  }

  const patch = (
    label: string,
    change: (value: Phase11Timeline) => Phase11Timeline,
  ) => onMutate(label, (value) => updateTimeline(value, change));

  const updateFrame = (id: string, nextFrame: Phase11Frame) =>
    patch('Edit GIF frame', (value) => ({
      ...value,
      frames: value.frames.map((frame) => frame.id === id ? nextFrame : frame),
    }));

  const move = (index: number, delta: -1 | 1) =>
    patch('Reorder GIF frames', (value) => {
      const target = index + delta;
      if (target < 0 || target >= value.frames.length) return value;
      const frames = [...value.frames];
      [frames[index], frames[target]] = [frames[target]!, frames[index]!];
      return { ...value, frames };
    });

  return (
    <div className="apx-gif-timeline" data-phase11-timeline>
      <div className="apx-gif-timeline-head">
        <div>
          <strong>{timeline.name}</strong>
          <span>
            {timeline.mode} · {timeline.frames.length} authored · {timeline.frames.reduce((sum, frame) => sum + (frame.repeat ?? 1), 0)} rendered
          </span>
        </div>
        <button
          type="button"
          data-phase11-add-empty-frame
          onClick={() =>
            patch('Add GIF frame', (value) => ({
              ...value,
              frames: [
                ...value.frames,
                {
                  ...createPhase11Frame(),
                  id: createVisualId('gif-frame'),
                  ...(value.mode === 'animate' ? { backgroundColor: '#111827' } : {}),
                },
              ],
            }))
          }
        >
          ＋ Frame
        </button>
      </div>

      <div className="apx-gif-frame-rail" data-phase11-frame-rail>
        {timeline.frames.map((frame, index) => (
          <FrameEditor
            key={frame.id}
            frame={frame}
            index={index}
            count={timeline.frames.length}
            assets={assets}
            timeline={timeline}
            onChange={(next) => updateFrame(frame.id, next)}
            onMove={(delta) => move(index, delta)}
            onDuplicate={() =>
              patch('Duplicate GIF frame', (value) => {
                const at = value.frames.findIndex((item) => item.id === frame.id);
                const duplicate = {
                  ...structuredClone(frame),
                  id: createVisualId('gif-frame'),
                };
                const frames = [...value.frames];
                frames.splice(at + 1, 0, duplicate);
                return { ...value, frames };
              })
            }
            onDelete={() =>
              patch('Delete GIF frame', (value) => ({
                ...value,
                frames: value.frames.filter((item) => item.id !== frame.id),
              }))
            }
          />
        ))}
        {!timeline.frames.length ? (
          <div className="apx-gif-empty-rail">
            <strong>No frames yet</strong>
            <span>Add image assets from the GIF panel or create a frame here.</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
