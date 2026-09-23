import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { createVisualProject } from '../../../lib/studio/visual/project';
import {
  PHASE12_AUDIO_PRESETS,
  createPhase12ComposeClip,
  createPhase12SequenceEvent,
  defaultPhase12Timeline,
  phase12Timeline,
  setPhase12Timeline,
  validatePhase12Project,
} from '../../../lib/studio/visual/audio-authoring-contract';
import {
  generateVisualProjectCode,
  generateVisualProjectPreviewCode,
} from '../../../lib/studio/visual/codegen/generator';
import { reconcileVisualProjectFromCode } from '../../../lib/studio/visual/codegen/reconcile';
import { validateVisualProject } from '../../../lib/studio/visual/compiler/validate';
import { planStudioExecution } from '../../../lib/studio/runtime/capabilities';

function projectFor(mode: 'preset' | 'synth' | 'sequence' | 'compose' | 'mix' = 'preset') {
  const project = createVisualProject({
    id: 'project_phase12',
    name: 'Phase 12 Audio',
    width: 960,
    height: 540,
    now: '2026-09-23T00:00:00.000Z',
  });
  const timeline = defaultPhase12Timeline();
  timeline.mode = mode;
  timeline.seed = 'phase12-test';
  return setPhase12Timeline(project, timeline);
}

test('Phase 12 exposes the complete 39-preset Apexify catalog', () => {
  assert.equal(PHASE12_AUDIO_PRESETS.length, 39);
  for (const name of ['laser','explosion','coin','whoosh','engine','gameOver','sparkle','thunder']) {
    assert.ok(PHASE12_AUDIO_PRESETS.includes(name as never));
  }
});

test('Phase 12 preset codegen is deterministic and routes to full runtime audio', () => {
  const project = projectFor('preset');
  const first = generateVisualProjectCode(project).source;
  const second = generateVisualProjectCode(project).source;
  assert.equal(first, second);
  assert.match(first, /apexify-studio-v12:/);
  assert.match(first, /painter\.createAudio\.preset\(/);
  assert.match(first, /sampleRate: 44100/);
  assert.match(first, /channels: 2/);
  const execution = planStudioExecution(first);
  assert.equal(execution.backend, 'full-runtime');
  assert.ok(execution.families.includes('audio'));
});

test('Phase 12 synth codegen covers oscillator, ADSR, filter, pan, modulation and noise', () => {
  const project = projectFor('synth');
  const timeline = phase12Timeline(project)!;
  timeline.synth.layers[0] = {
    ...timeline.synth.layers[0],
    waveform: 'sawtooth',
    frequency: 220,
    frequencyEnd: 880,
    pan: -0.35,
    noiseMix: 0.15,
    adsr: { attack: .01, decay: .08, sustain: .6, release: .12 },
    filter: { type: 'lowpass', cutoff: 3200, q: .8 },
    vibrato: { depth: 2, rate: 5 },
    tremolo: { depth: .2, rate: 4 },
  };
  const source = generateVisualProjectCode(setPhase12Timeline(project, timeline)).source;
  for (const token of ['painter.createAudio.synth(', 'sawtooth', 'frequencyEnd: 880', 'adsr:', 'filter:', 'vibrato:', 'tremolo:', 'noiseMix: 0.15', 'pan: -0.35']) {
    assert.ok(source.includes(token), token + ' missing');
  }
});

test('Phase 12 sequence codegen preserves event order, timing and gain', () => {
  const project = projectFor('sequence');
  const timeline = phase12Timeline(project)!;
  timeline.sequence.events = [
    { ...createPhase12SequenceEvent(0), id: 'event-a', preset: 'beep', gain: .5 },
    { ...createPhase12SequenceEvent(.4), id: 'event-b', preset: 'coin', gain: .9 },
  ];
  const source = generateVisualProjectCode(setPhase12Timeline(project, timeline)).source;
  assert.match(source, /painter\.createAudio\.sequence\(/);
  assert.ok(source.indexOf('preset: "beep"') < source.indexOf('preset: "coin"'));
  assert.ok(source.includes('at: 0.4'));
  assert.ok(source.includes('gain: 0.9'));
});

test('Phase 12 compose supports timeline shaping and uploaded Studio WAV assets', () => {
  const project = projectFor('compose');
  const timeline = phase12Timeline(project)!;
  timeline.compose.clips = [
    {
      ...createPhase12ComposeClip(0),
      id: 'clip-a',
      source: { kind: 'preset', preset: 'whoosh' },
      gain: .7,
      pan: -.2,
      fadeOut: .1,
      quality: 'warm',
    },
    {
      ...createPhase12ComposeClip(.5),
      id: 'clip-b',
      source: { kind: 'asset', assetId: 'wav_asset_1' },
      gain: .8,
      speed: 1.1,
    },
  ];
  const source = generateVisualProjectCode(setPhase12Timeline(project, timeline)).source;
  assert.match(source, /painter\.createAudio\.compose\(/);
  assert.match(source, /readFileSync\("studio:\/\/asset\/wav_asset_1"\)/);
  assert.match(source, /wav: audioAsset1/);
  assert.match(source, /quality: "warm"/);
  assert.match(source, /speed: 1.1/);
});

test('Phase 12 mix emits presets, custom synthesis and asset inputs', () => {
  const project = projectFor('mix');
  const timeline = phase12Timeline(project)!;
  timeline.mix.inputs = [
    { id: 'mix-a', kind: 'preset', preset: 'click', gain: .5 },
    { id: 'mix-b', kind: 'sound', sound: timeline.synth },
    { id: 'mix-c', kind: 'asset', assetId: 'wav_asset_2', gain: .75 },
  ];
  const source = generateVisualProjectCode(setPhase12Timeline(project, timeline)).source;
  assert.match(source, /painter\.createAudio\.mix\(/);
  assert.match(source, /preset: "click"/);
  assert.match(source, /wav: audioAsset1/);
  assert.match(source, /layers:/);
});

test('Phase 12 canonical generated source round-trips exact audio semantics', () => {
  const project = projectFor('compose');
  const source = generateVisualProjectCode(project).source;
  const empty = createVisualProject({
    id: project.id,
    name: project.name,
    width: 1,
    height: 1,
    now: project.createdAt,
  });
  const result = reconcileVisualProjectFromCode(empty, source);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(phase12Timeline(result.project), phase12Timeline(project));
  assert.equal(result.changed, true);
});

test('Phase 12 preview uses the same native audio runtime path', () => {
  const source = generateVisualProjectPreviewCode(projectFor('sequence')).source;
  assert.match(source, /apexify-studio-v12:/);
  assert.match(source, /painter\.createAudio\.sequence\(/);
  assert.equal(planStudioExecution(source).backend, 'full-runtime');
});

test('Phase 12 validation rejects unsafe or malformed audio state', () => {
  const project = projectFor('synth');
  const timeline = phase12Timeline(project)!;
  timeline.sampleRate = 1000;
  timeline.masterGain = 8;
  timeline.synth.layers[0].duration = 0;
  timeline.synth.layers[0].pan = 2;
  timeline.synth.layers[0].filter = { type: 'lowpass', cutoff: 999999 };
  const broken = setPhase12Timeline(project, timeline);
  const issues = validatePhase12Project(broken);
  assert.ok(issues.some((item) => item.code === 'phase12-sample-rate'));
  assert.ok(issues.some((item) => item.code === 'phase12-range'));
  assert.ok(issues.some((item) => item.code === 'phase12-duration'));
  assert.ok(issues.some((item) => item.code === 'phase12-filter-cutoff'));
  assert.equal(validateVisualProject(broken).ok, false);
});

test('Phase 12 permanent Audio rail, inspector, real waveform/player and Timeline dock are present', () => {
  const ui = fs.readFileSync('components/studio/visual/VisualAudioAuthoring.tsx', 'utf8');
  const shell = fs.readFileSync('components/studio/visual/VisualStudioPre4.tsx', 'utf8');
  const modal = fs.readFileSync('components/studio/visual/VisualStudioModals.tsx', 'utf8');

  for (const marker of [
    'data-visual-audio-context',
    'data-audio-preset-browser',
    'data-audio-waveform',
    'data-audio-context-player',
    'data-audio-timeline',
    'data-audio-inspector',
  ]) {
    assert.ok(ui.includes(marker), marker + ' missing');
  }
  assert.ok(shell.includes("['audio', MusicalNoteIcon, 'Audio']"));
  assert.ok(shell.includes('<VisualAudioContext'));
  assert.ok(shell.includes('<VisualAudioTimeline'));
  assert.ok(shell.includes('<VisualAudioInspector'));
  assert.ok(shell.includes("id === 'gif' || id === 'audio'"));
  assert.ok(shell.includes('phase12Active || phase11Active || phase10Active'));
  assert.ok(modal.includes('data-visual-audio-player'));
});
