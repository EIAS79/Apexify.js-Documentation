'use client';

import { useEffect, useMemo, useState } from 'react';
import type { StudioVirtualAsset } from '@/lib/studio/runtime/assets';
import { studioAssetDataUrl } from '@/lib/studio/runtime/assets';
import type { VisualProject } from '@/lib/studio/visual/model';
import {
  PHASE12_AUDIO_PRESETS,
  createPhase12ComposeClip,
  createPhase12MixInput,
  createPhase12SequenceEvent,
  defaultPhase12Layer,
  defaultPhase12Timeline,
  phase12Timeline,
  setPhase12Timeline,
  validatePhase12Project,
  type Phase12AudioMode,
  type Phase12ComposeClip,
  type Phase12MixInput,
  type Phase12PresetName,
  type Phase12Timeline,
  type Phase12Waveform,
} from '@/lib/studio/visual/audio-authoring-contract';

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
  return phase12Timeline(project) ?? defaultPhase12Timeline();
}

function updateTimeline(
  project: VisualProject,
  updater: (timeline: Phase12Timeline) => Phase12Timeline,
) {
  return setPhase12Timeline(project, updater(activeTimeline(project)));
}

function numeric(value: string, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function audioAssets(assets: StudioVirtualAsset[]) {
  return assets.filter((asset) => asset.mime.startsWith('audio/'));
}

function stripLayerId<T extends { id: string }>(value: T): Omit<T, 'id'> {
  const { id: _id, ...rest } = value;
  return rest;
}

function Waveform({ url }: { url: string | null }) {
  const [bins, setBins] = useState<number[]>([]);

  useEffect(() => {
    let cancelled = false;
    if (!url || !url.startsWith('data:audio/wav')) {
      setBins([]);
      return;
    }
    void (async () => {
      try {
        const bytes = new Uint8Array(await (await fetch(url)).arrayBuffer());
        if (
          bytes.length < 44 ||
          String.fromCharCode(...bytes.slice(0, 4)) !== 'RIFF' ||
          String.fromCharCode(...bytes.slice(8, 12)) !== 'WAVE'
        ) return;
        let channels = 1;
        let bits = 16;
        let dataStart = 0;
        let dataLength = 0;
        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        for (let at = 12; at + 8 <= bytes.length;) {
          const id = String.fromCharCode(...bytes.slice(at, at + 4));
          const length = view.getUint32(at + 4, true);
          const start = at + 8;
          if (id === 'fmt ' && start + 16 <= bytes.length) {
            channels = view.getUint16(start + 2, true);
            bits = view.getUint16(start + 14, true);
          }
          if (id === 'data') {
            dataStart = start;
            dataLength = Math.min(length, bytes.length - start);
            break;
          }
          at = start + length + (length % 2);
        }
        if (!dataStart || bits !== 16 || !channels) return;
        const frameBytes = channels * 2;
        const frames = Math.floor(dataLength / frameBytes);
        const count = 72;
        const next = Array.from({ length: count }, (_, bin) => {
          const from = Math.floor((bin * frames) / count);
          const to = Math.max(from + 1, Math.floor(((bin + 1) * frames) / count));
          let peak = 0;
          for (let frame = from; frame < to; frame++) {
            for (let channel = 0; channel < channels; channel++) {
              const offset = dataStart + frame * frameBytes + channel * 2;
              if (offset + 2 > bytes.length) break;
              peak = Math.max(peak, Math.abs(view.getInt16(offset, true)) / 32768);
            }
          }
          return peak;
        });
        if (!cancelled) setBins(next);
      } catch {
        if (!cancelled) setBins([]);
      }
    })();
    return () => { cancelled = true; };
  }, [url]);

  return (
    <div className="apx-audio-waveform" data-audio-waveform data-ready={bins.length ? 'true' : 'false'}>
      {bins.length ? bins.map((peak, index) => (
        <i key={index} style={{ height: Math.max(3, peak * 100) + '%' }} />
      )) : (
        <span>Run Preview to derive a waveform from the real PCM16 WAV output.</span>
      )}
    </div>
  );
}

export function VisualAudioContext({
  project,
  assets,
  onMutate,
  onOpenTimeline,
  onPreview,
  previewUrl,
  previewMime,
}: SharedProps & {
  onOpenTimeline: () => void;
  onPreview: () => void;
  previewUrl: string | null;
  previewMime: string;
}) {
  const stored = phase12Timeline(project);
  const timeline = stored ?? defaultPhase12Timeline();
  const wavAssets = audioAssets(assets);

  const activate = (mode: Phase12AudioMode) => {
    onMutate('Audio mode', (current) =>
      updateTimeline(current, (value) => ({ ...value, mode })),
    );
  };

  const choosePreset = (name: Phase12PresetName) => {
    onMutate('Audio preset', (current) =>
      updateTimeline(current, (value) => ({
        ...value,
        mode: 'preset',
        preset: { ...value.preset, name },
      })),
    );
  };

  const addAssetClip = (asset: StudioVirtualAsset) => {
    onMutate('Add audio asset clip', (current) =>
      updateTimeline(current, (value) => ({
        ...value,
        mode: 'compose',
        compose: {
          ...value.compose,
          clips: [
            ...value.compose.clips,
            {
              ...createPhase12ComposeClip(
                value.compose.clips.reduce((max, clip) => Math.max(max, clip.at ?? 0), 0) + 0.25,
              ),
              source: { kind: 'asset', assetId: asset.id },
            },
          ],
        },
      })),
    );
    onOpenTimeline();
  };

  return (
    <div className="apx-media-context apx-audio-context" data-visual-audio-context>
      <div className="apx-media-context-copy">
        <strong>Procedural Audio</strong>
        <span>Author real Apexify PCM16 WAV output with presets, synthesis, sequencing, composition and mixing.</span>
      </div>

      {!stored ? (
        <button
          type="button"
          className="apx-media-open-assets"
          data-audio-enable
          onClick={() => onMutate('Enable audio authoring', (current) => setPhase12Timeline(current, timeline))}
        >
          Create audio composition
        </button>
      ) : null}

      <div className="apx-audio-mode-grid" role="group" aria-label="Audio authoring mode">
        {(['preset','synth','sequence','compose','mix'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            data-audio-mode={mode}
            data-active={timeline.mode === mode ? 'true' : undefined}
            onClick={() => activate(mode)}
          >
            {mode}
          </button>
        ))}
      </div>

      <div className="apx-media-context-heading">
        <strong>Preset browser</strong>
        <span>{PHASE12_AUDIO_PRESETS.length} sounds</span>
      </div>
      <div className="apx-audio-preset-grid" data-audio-preset-browser>
        {PHASE12_AUDIO_PRESETS.map((name) => (
          <button
            key={name}
            type="button"
            data-active={timeline.preset.name === name ? 'true' : undefined}
            onClick={() => choosePreset(name)}
          >
            {name}
          </button>
        ))}
      </div>

      <div className="apx-audio-preview-card">
        <div>
          <strong>WAV Preview</strong>
          <span>{timeline.sampleRate.toLocaleString()} Hz · {timeline.channels === 2 ? 'stereo' : 'mono'} · {timeline.mode}</span>
        </div>
        <Waveform url={previewMime.startsWith('audio/') ? previewUrl : null} />
        {previewUrl && previewMime.startsWith('audio/') ? (
          <audio controls preload="metadata" src={previewUrl} data-audio-context-player />
        ) : (
          <small>Preview is generated by the full Apexify runtime, not an editor-side synthesizer.</small>
        )}
        <div className="apx-audio-preview-actions">
          <button type="button" onClick={onPreview}>Render / Play</button>
          <button type="button" onClick={onOpenTimeline}>Open timeline</button>
        </div>
      </div>

      <div className="apx-media-context-heading">
        <strong>Audio assets</strong>
        <span>{wavAssets.length}</span>
      </div>
      {wavAssets.length ? (
        <div className="apx-audio-asset-list">
          {wavAssets.map((asset) => (
            <button type="button" key={asset.id} onClick={() => addAssetClip(asset)} data-audio-asset={asset.id}>
              <span>♪</span>
              <span><strong>{asset.name}</strong><small>{asset.mime}</small></span>
              <span>＋</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="apx-media-context-empty">
          <strong>No uploaded audio yet</strong>
          <span>Use Assets to upload WAV/MP3/OGG. WAV assets can be placed into the procedural composition timeline.</span>
        </div>
      )}
    </div>
  );
}

function sourceLabel(clip: Phase12ComposeClip) {
  if (clip.source.kind === 'preset') return clip.source.preset;
  if (clip.source.kind === 'asset') return 'asset:' + clip.source.assetId;
  return 'custom synth';
}

export function VisualAudioTimeline({ project, assets, onMutate }: SharedProps) {
  const timeline = activeTimeline(project);
  const wavAssets = audioAssets(assets);

  if (timeline.mode === 'preset' || timeline.mode === 'synth') {
    return (
      <div className="apx-audio-timeline" data-audio-timeline>
        <div className="apx-audio-timeline-head">
          <strong>{timeline.mode === 'preset' ? 'Preset generator' : 'Custom synthesis'}</strong>
          <span>No clip timeline is required for this mode. Use the Inspector to shape the sound.</span>
        </div>
      </div>
    );
  }

  if (timeline.mode === 'sequence') {
    return (
      <div className="apx-audio-timeline" data-audio-timeline data-audio-timeline-mode="sequence">
        <div className="apx-audio-timeline-head">
          <strong>Sequence events</strong>
          <button type="button" onClick={() => onMutate('Add sequence event', (current) =>
            updateTimeline(current, (value) => ({
              ...value,
              sequence: {
                ...value.sequence,
                events: [...value.sequence.events, createPhase12SequenceEvent(
                  value.sequence.events.reduce((max, event) => Math.max(max, event.at), 0) + 0.2,
                )],
              },
            }))
          )}>＋ Event</button>
        </div>
        <div className="apx-audio-track-list">
          {timeline.sequence.events.map((event, index) => (
            <div className="apx-audio-track-row" key={event.id}>
              <span className="apx-audio-track-index">{index + 1}</span>
              <label><span>At</span><input type="number" min={0} step={0.01} value={event.at} onChange={(e) =>
                onMutate('Sequence time', (current) => updateTimeline(current, (value) => {
                  const events = [...value.sequence.events];
                  events[index] = { ...events[index], at: Math.max(0, numeric(e.target.value, 0)) };
                  return { ...value, sequence: { ...value.sequence, events } };
                }))
              } /></label>
              <label><span>Preset</span><select value={event.preset ?? 'beep'} onChange={(e) =>
                onMutate('Sequence preset', (current) => updateTimeline(current, (value) => {
                  const events = [...value.sequence.events];
                  events[index] = { ...events[index], preset: e.target.value as Phase12PresetName, sound: undefined };
                  return { ...value, sequence: { ...value.sequence, events } };
                }))
              }>{PHASE12_AUDIO_PRESETS.map((name) => <option key={name}>{name}</option>)}</select></label>
              <label><span>Gain</span><input type="number" min={0} max={4} step={0.05} value={event.gain ?? 1} onChange={(e) =>
                onMutate('Sequence gain', (current) => updateTimeline(current, (value) => {
                  const events = [...value.sequence.events];
                  events[index] = { ...events[index], gain: numeric(e.target.value, 1) };
                  return { ...value, sequence: { ...value.sequence, events } };
                }))
              } /></label>
              <button type="button" aria-label="Delete sequence event" onClick={() =>
                onMutate('Delete sequence event', (current) => updateTimeline(current, (value) => ({
                  ...value,
                  sequence: { ...value.sequence, events: value.sequence.events.filter((_, eventIndex) => eventIndex !== index) },
                })))
              }>×</button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (timeline.mode === 'compose') {
    return (
      <div className="apx-audio-timeline" data-audio-timeline data-audio-timeline-mode="compose">
        <div className="apx-audio-timeline-head">
          <strong>Composition clips</strong>
          <button type="button" onClick={() => onMutate('Add composition clip', (current) =>
            updateTimeline(current, (value) => ({
              ...value,
              compose: { ...value.compose, clips: [...value.compose.clips, createPhase12ComposeClip(
                value.compose.clips.reduce((max, clip) => Math.max(max, clip.at ?? 0), 0) + 0.25,
              )] },
            }))
          )}>＋ Clip</button>
        </div>
        <div className="apx-audio-track-list">
          {timeline.compose.clips.map((clip, index) => (
            <div className="apx-audio-track-row apx-audio-track-row--compose" key={clip.id}>
              <span className="apx-audio-track-index">{index + 1}</span>
              <label><span>At</span><input type="number" min={0} step={0.01} value={clip.at ?? 0} onChange={(e) =>
                onMutate('Clip time', (current) => updateTimeline(current, (value) => {
                  const clips = [...value.compose.clips];
                  clips[index] = { ...clips[index], at: Math.max(0, numeric(e.target.value, 0)) };
                  return { ...value, compose: { ...value.compose, clips } };
                }))
              } /></label>
              <label><span>Source</span><select
                value={clip.source.kind === 'asset' ? 'asset:' + clip.source.assetId : clip.source.kind === 'sound' ? 'sound' : 'preset:' + clip.source.preset}
                onChange={(e) => onMutate('Clip source', (current) => updateTimeline(current, (value) => {
                  const clips = [...value.compose.clips];
                  const selected = e.target.value;
                  const source = selected === 'sound'
                    ? { kind: 'sound' as const, sound: { ...value.synth, layers: value.synth.layers.map((layer) => ({ ...layer })) } }
                    : selected.startsWith('asset:')
                      ? { kind: 'asset' as const, assetId: selected.slice(6) }
                      : { kind: 'preset' as const, preset: selected.slice(7) as Phase12PresetName };
                  clips[index] = { ...clips[index], source };
                  return { ...value, compose: { ...value.compose, clips } };
                }))}
              >
                {PHASE12_AUDIO_PRESETS.map((name) => <option key={name} value={'preset:' + name}>{name}</option>)}
                <option value="sound">Custom synth</option>
                {wavAssets.map((asset) => <option key={asset.id} value={'asset:' + asset.id}>Asset · {asset.name}</option>)}
              </select></label>
              <label><span>Gain</span><input type="number" min={0} max={4} step={0.05} value={clip.gain ?? 1} onChange={(e) =>
                onMutate('Clip gain', (current) => updateTimeline(current, (value) => {
                  const clips = [...value.compose.clips];
                  clips[index] = { ...clips[index], gain: numeric(e.target.value, 1) };
                  return { ...value, compose: { ...value.compose, clips } };
                }))
              } /></label>
              <label><span>Pan</span><input type="number" min={-1} max={1} step={0.05} value={clip.pan ?? 0} onChange={(e) =>
                onMutate('Clip pan', (current) => updateTimeline(current, (value) => {
                  const clips = [...value.compose.clips];
                  clips[index] = { ...clips[index], pan: numeric(e.target.value, 0) };
                  return { ...value, compose: { ...value.compose, clips } };
                }))
              } /></label>
              <span className="apx-audio-track-source" title={sourceLabel(clip)}>{sourceLabel(clip)}</span>
              <button type="button" aria-label="Delete composition clip" onClick={() =>
                onMutate('Delete composition clip', (current) => updateTimeline(current, (value) => ({
                  ...value,
                  compose: { ...value.compose, clips: value.compose.clips.filter((_, clipIndex) => clipIndex !== index) },
                })))
              }>×</button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="apx-audio-timeline" data-audio-timeline data-audio-timeline-mode="mix">
      <div className="apx-audio-timeline-head">
        <strong>Mix inputs</strong>
        <button type="button" onClick={() => onMutate('Add mix input', (current) =>
          updateTimeline(current, (value) => ({
            ...value,
            mix: { ...value.mix, inputs: [...value.mix.inputs, createPhase12MixInput()] },
          }))
        )}>＋ Input</button>
      </div>
      <div className="apx-audio-track-list">
        {timeline.mix.inputs.map((input, index) => (
          <div className="apx-audio-track-row" key={input.id}>
            <span className="apx-audio-track-index">{index + 1}</span>
            <label><span>Source</span><select
              value={input.kind === 'asset' ? 'asset:' + input.assetId : input.kind === 'sound' ? 'sound' : 'preset:' + input.preset}
              onChange={(e) => onMutate('Mix source', (current) => updateTimeline(current, (value) => {
                const inputs = [...value.mix.inputs];
                const selected = e.target.value;
                const next: Phase12MixInput = selected === 'sound'
                  ? { id: input.id, kind: 'sound', sound: { ...value.synth, layers: value.synth.layers.map((layer) => ({ ...layer })) } }
                  : selected.startsWith('asset:')
                    ? { id: input.id, kind: 'asset', assetId: selected.slice(6), gain: 1 }
                    : { id: input.id, kind: 'preset', preset: selected.slice(7) as Phase12PresetName, gain: 1 };
                inputs[index] = next;
                return { ...value, mix: { ...value.mix, inputs } };
              }))}
            >
              {PHASE12_AUDIO_PRESETS.map((name) => <option key={name} value={'preset:' + name}>{name}</option>)}
              <option value="sound">Custom synth</option>
              {wavAssets.map((asset) => <option key={asset.id} value={'asset:' + asset.id}>Asset · {asset.name}</option>)}
            </select></label>
            <span className="apx-audio-track-source">{input.kind}</span>
            <button type="button" aria-label="Delete mix input" onClick={() =>
              onMutate('Delete mix input', (current) => updateTimeline(current, (value) => ({
                ...value,
                mix: { ...value.mix, inputs: value.mix.inputs.filter((_, inputIndex) => inputIndex !== index) },
              })))
            }>×</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function VisualAudioInspector({
  project,
  assets,
  onMutate,
  inspectorTab,
  onMessage,
}: SharedProps & {
  inspectorTab: 'style' | 'transform' | 'effects' | 'data' | 'advanced';
  onMessage: (message: string) => void;
}) {
  const timeline = activeTimeline(project);
  const [jsonDraft, setJsonDraft] = useState(() => JSON.stringify(timeline, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const wavAssets = audioAssets(assets);

  useEffect(() => {
    setJsonDraft(JSON.stringify(timeline, null, 2));
    setJsonError(null);
  }, [project.updatedAt, timeline.mode]);

  const patch = (label: string, updater: (value: Phase12Timeline) => Phase12Timeline) =>
    onMutate(label, (current) => updateTimeline(current, updater));

  if (inspectorTab === 'transform') {
    return (
      <div className="apx-pre4-empty" data-audio-inspector="transform">
        <strong>Audio has no canvas transform</strong>
        <span>Use the Timeline for temporal placement and Style/Data/Effects for sound parameters.</span>
      </div>
    );
  }

  if (inspectorTab === 'style') {
    return (
      <div data-audio-inspector="style">
        <div className="apx-pre4-inspector-title"><div><strong>Audio output</strong><small>PCM16 WAV · Phase 12</small></div><span className="apx-pre4-type-pill">audio</span></div>
        <div className="apx-pre4-section">
          <div className="apx-pre4-section-title">Master</div>
          <div className="apx-pre4-property-grid">
            <label><span>Rate</span><input className="apx-pre4-input" type="number" min={8000} max={192000} step={1000} value={timeline.sampleRate} onChange={(e) => patch('Audio sample rate', (value) => ({ ...value, sampleRate: numeric(e.target.value, 44100) }))} /></label>
            <label><span>Channels</span><select className="apx-pre4-input" value={timeline.channels} onChange={(e) => patch('Audio channels', (value) => ({ ...value, channels: Number(e.target.value) as 1 | 2 }))}><option value={1}>Mono</option><option value={2}>Stereo</option></select></label>
            <label><span>Gain</span><input className="apx-pre4-input" type="number" min={0} max={4} step={0.05} value={timeline.masterGain} onChange={(e) => patch('Audio master gain', (value) => ({ ...value, masterGain: numeric(e.target.value, 1) }))} /></label>
            <label className="apx-canvas-check"><input type="checkbox" checked={timeline.limiter} onChange={(e) => patch('Audio limiter', (value) => ({ ...value, limiter: e.target.checked }))} /><span>Limiter</span></label>
          </div>
          <label className="apx-canvas-field"><span>Seed</span><input className="apx-pre4-input" value={String(timeline.seed ?? '')} onChange={(e) => patch('Audio seed', (value) => ({ ...value, seed: e.target.value || undefined }))} /></label>
        </div>
        {timeline.mode === 'preset' ? (
          <div className="apx-pre4-section">
            <div className="apx-pre4-section-title">Preset shaping</div>
            <label className="apx-canvas-field"><span>Preset</span><select className="apx-pre4-input" value={timeline.preset.name} onChange={(e) => patch('Audio preset', (value) => ({ ...value, preset: { ...value.preset, name: e.target.value as Phase12PresetName } }))}>{PHASE12_AUDIO_PRESETS.map((name) => <option key={name}>{name}</option>)}</select></label>
            <div className="apx-pre4-property-grid">
              <label><span>Volume</span><input className="apx-pre4-input" type="number" min={0} max={4} step={0.05} value={timeline.preset.volume} onChange={(e) => patch('Preset volume', (value) => ({ ...value, preset: { ...value.preset, volume: numeric(e.target.value, 1) } }))} /></label>
              <label><span>Transpose</span><input className="apx-pre4-input" type="number" min={-96} max={96} step={1} value={timeline.preset.transpose} onChange={(e) => patch('Preset transpose', (value) => ({ ...value, preset: { ...value.preset, transpose: numeric(e.target.value, 0) } }))} /></label>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  if (inspectorTab === 'effects') {
    const layer = timeline.synth.layers[0] ?? defaultPhase12Layer();
    const patchLayer = (label: string, updater: (current: typeof layer) => typeof layer) =>
      patch(label, (value) => {
        const layers = value.synth.layers.length ? [...value.synth.layers] : [defaultPhase12Layer()];
        layers[0] = updater(layers[0]);
        return { ...value, synth: { ...value.synth, layers } };
      });
    return (
      <div data-audio-inspector="effects">
        <div className="apx-pre4-inspector-title"><div><strong>Synthesis & DSP</strong><small>Layer 1 · applies to custom synth sources</small></div><span className="apx-pre4-type-pill">DSP</span></div>
        <div className="apx-pre4-section">
          <div className="apx-pre4-section-title">Oscillator</div>
          <label className="apx-canvas-field"><span>Waveform</span><select className="apx-pre4-input" value={layer.waveform ?? 'sine'} onChange={(e) => patchLayer('Audio waveform', (current) => ({ ...current, waveform: e.target.value as Phase12Waveform }))}>{['sine','square','sawtooth','triangle','noise','pink'].map((wave) => <option key={wave}>{wave}</option>)}</select></label>
          <div className="apx-pre4-property-grid">
            <label><span>Hz</span><input className="apx-pre4-input" type="number" min={1} value={layer.frequency ?? 440} onChange={(e) => patchLayer('Audio frequency', (current) => ({ ...current, frequency: numeric(e.target.value, 440) }))} /></label>
            <label><span>End Hz</span><input className="apx-pre4-input" type="number" min={1} value={layer.frequencyEnd ?? layer.frequency ?? 440} onChange={(e) => patchLayer('Audio sweep', (current) => ({ ...current, frequencyEnd: numeric(e.target.value, 440) }))} /></label>
            <label><span>Seconds</span><input className="apx-pre4-input" type="number" min={0.001} step={0.01} value={layer.duration} onChange={(e) => patchLayer('Audio duration', (current) => ({ ...current, duration: numeric(e.target.value, .35) }))} /></label>
            <label><span>Pan</span><input className="apx-pre4-input" type="number" min={-1} max={1} step={0.05} value={layer.pan ?? 0} onChange={(e) => patchLayer('Audio pan', (current) => ({ ...current, pan: numeric(e.target.value, 0) }))} /></label>
          </div>
        </div>
        <div className="apx-pre4-section">
          <div className="apx-pre4-section-title">ADSR</div>
          <div className="apx-pre4-property-grid">
            {(['attack','decay','sustain','release'] as const).map((key) => (
              <label key={key}><span>{key}</span><input className="apx-pre4-input" type="number" min={0} step={0.01} value={layer.adsr?.[key] ?? (key === 'sustain' ? .65 : .02)} onChange={(e) => patchLayer('Audio ADSR', (current) => ({ ...current, adsr: { ...(current.adsr ?? {}), [key]: numeric(e.target.value, 0) } }))} /></label>
            ))}
          </div>
        </div>
        <div className="apx-pre4-section">
          <div className="apx-pre4-section-title">Filter / modulation / noise</div>
          <div className="apx-pre4-property-grid">
            <label><span>Filter</span><select className="apx-pre4-input" value={layer.filter?.type ?? 'lowpass'} onChange={(e) => patchLayer('Audio filter', (current) => ({ ...current, filter: { type: e.target.value as 'lowpass' | 'highpass', cutoff: current.filter?.cutoff ?? 3200, q: current.filter?.q ?? .707 } }))}><option>lowpass</option><option>highpass</option></select></label>
            <label><span>Cutoff</span><input className="apx-pre4-input" type="number" min={1} value={layer.filter?.cutoff ?? 3200} onChange={(e) => patchLayer('Audio filter cutoff', (current) => ({ ...current, filter: { type: current.filter?.type ?? 'lowpass', cutoff: numeric(e.target.value, 3200), q: current.filter?.q } }))} /></label>
            <label><span>Noise</span><input className="apx-pre4-input" type="number" min={0} max={1} step={0.05} value={layer.noiseMix ?? 0} onChange={(e) => patchLayer('Audio noise', (current) => ({ ...current, noiseMix: numeric(e.target.value, 0) }))} /></label>
            <label><span>Detune</span><input className="apx-pre4-input" type="number" step={1} value={layer.detune ?? 0} onChange={(e) => patchLayer('Audio detune', (current) => ({ ...current, detune: numeric(e.target.value, 0) }))} /></label>
          </div>
          <div className="apx-pre4-property-grid">
            <label><span>Vibrato depth</span><input className="apx-pre4-input" type="number" min={0} step={0.1} value={layer.vibrato?.depth ?? 0} onChange={(e) => patchLayer('Audio vibrato', (current) => ({ ...current, vibrato: { depth: numeric(e.target.value, 0), rate: current.vibrato?.rate ?? 5 } }))} /></label>
            <label><span>Vibrato Hz</span><input className="apx-pre4-input" type="number" min={0.01} step={0.1} value={layer.vibrato?.rate ?? 5} onChange={(e) => patchLayer('Audio vibrato rate', (current) => ({ ...current, vibrato: { depth: current.vibrato?.depth ?? 0, rate: numeric(e.target.value, 5) } }))} /></label>
            <label><span>Tremolo depth</span><input className="apx-pre4-input" type="number" min={0} max={1} step={0.05} value={layer.tremolo?.depth ?? 0} onChange={(e) => patchLayer('Audio tremolo', (current) => ({ ...current, tremolo: { depth: numeric(e.target.value, 0), rate: current.tremolo?.rate ?? 5 } }))} /></label>
            <label><span>Tremolo Hz</span><input className="apx-pre4-input" type="number" min={0.01} step={0.1} value={layer.tremolo?.rate ?? 5} onChange={(e) => patchLayer('Audio tremolo rate', (current) => ({ ...current, tremolo: { depth: current.tremolo?.depth ?? 0, rate: numeric(e.target.value, 5) } }))} /></label>
          </div>
        </div>
      </div>
    );
  }

  if (inspectorTab === 'data') {
    return (
      <div data-audio-inspector="data">
        <div className="apx-pre4-inspector-title"><div><strong>Timeline data</strong><small>{timeline.mode}</small></div><span className="apx-pre4-type-pill">audio</span></div>
        <div className="apx-pre4-section">
          <div className="apx-pre4-section-title">Current composition</div>
          <div className="apx-audio-data-stats">
            <div><span>Synth layers</span><strong>{timeline.synth.layers.length}</strong></div>
            <div><span>Sequence events</span><strong>{timeline.sequence.events.length}</strong></div>
            <div><span>Compose clips</span><strong>{timeline.compose.clips.length}</strong></div>
            <div><span>Mix inputs</span><strong>{timeline.mix.inputs.length}</strong></div>
            <div><span>Audio assets</span><strong>{wavAssets.length}</strong></div>
          </div>
        </div>
        {timeline.mode === 'compose' ? (
          <div className="apx-pre4-section">
            <div className="apx-pre4-section-title">Compose master</div>
            <div className="apx-pre4-property-grid">
              <label><span>Tail</span><input className="apx-pre4-input" type="number" min={0} step={0.05} value={timeline.compose.tail} onChange={(e) => patch('Compose tail', (value) => ({ ...value, compose: { ...value.compose, tail: numeric(e.target.value, 0) } }))} /></label>
              <label><span>High-pass</span><input className="apx-pre4-input" type="number" min={0} value={timeline.compose.postHighpassHz ?? 0} onChange={(e) => patch('Compose highpass', (value) => ({ ...value, compose: { ...value.compose, postHighpassHz: numeric(e.target.value, 0) || undefined } }))} /></label>
              <label><span>Noise gate</span><input className="apx-pre4-input" type="number" min={0} max={1} step={0.01} value={timeline.compose.noiseGateThreshold ?? 0} onChange={(e) => patch('Compose noise gate', (value) => ({ ...value, compose: { ...value.compose, noiseGateThreshold: numeric(e.target.value, 0) || undefined } }))} /></label>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  const applyJson = () => {
    try {
      const parsed = JSON.parse(jsonDraft) as Phase12Timeline;
      const next = setPhase12Timeline(project, parsed);
      const validation = validatePhase12Project(next);
      if (validation.length) throw new Error(validation[0]?.message ?? 'Invalid audio timeline.');
      onMutate('Advanced audio configuration', () => next);
      setJsonError(null);
      onMessage('Complete audio timeline applied');
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : 'Invalid audio timeline JSON.');
    }
  };

  return (
    <div data-audio-inspector="advanced">
      <div className="apx-pre4-inspector-title"><div><strong>Complete audio contract</strong><small>Exact Phase 12 escape hatch</small></div><span className="apx-pre4-type-pill">JSON</span></div>
      <div className="apx-pre4-section">
        <textarea className="apx-canvas-json apx-canvas-json--config" spellCheck={false} value={jsonDraft} onChange={(e) => { setJsonDraft(e.target.value); setJsonError(null); }} />
        {jsonError ? <div className="apx-live-code-error">{jsonError}</div> : null}
        <button type="button" className="apx-canvas-apply" onClick={applyJson}>Apply complete audio config</button>
        <small className="apx-canvas-hint">Covers every Phase-12 procedural audio field, including layers, partials, nested filters, sequence events, clip shaping and mix inputs.</small>
      </div>
    </div>
  );
}
