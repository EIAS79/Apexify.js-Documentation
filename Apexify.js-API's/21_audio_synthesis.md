# Procedural audio: presets, synthesis, sequencing and composition — Apexify.js 6.0.0

**Status:** Source-confirmed public Node API unless explicitly qualified.  **Audit baseline:** `cbeea053c2a973d4e867f8ca96e79546060dd62d`.
**API:** `painter.createAudio.*`

Pure procedural mono/stereo PCM16 WAV audio generation using oscillator/noise DSP, ADSR, filtering, modulation, pan, timeline events and mixing.

## Verified feature coverage

- 39 named audio presets
- Custom multi-layer oscillators and noise
- ADSR, vibrato, tremolo and biquad filters
- Procedural sequencing
- Clip timeline with gain/fade/pan/pitch controls
- WAV resampling, mixing and PCM16 encoding
- Deterministic seed control

## Public types, nested properties and options

### `PainterCreateAudio methods`

| Property / member | Type, accepted values or signature |
|---|---|
| `presetNames` | `readonly SynthPresetName[]` |
| `listPresets()` | `SynthPresetInfo[]` |
| `synth(options)` | `Buffer` |
| `custom(options)` | `Buffer` |
| `preset(name,overrides?)` | `Buffer` |
| `sequence(options)` | `Buffer` |
| `compose(options)` | `Buffer` |
| `mix(inputs,options?)` | `Buffer` |
| `save(wav,filePath)` | `Promise<void>` |

### `AudioSeed / Waveform / FilterType`

| Property / member | Type, accepted values or signature |
|---|---|
| `AudioSeed` | `number \| string` |
| `Waveform` | `"sine" \| "square" \| "sawtooth" \| "triangle" \| "noise" \| "pink"` |
| `FilterType` | `"lowpass" \| "highpass"` |

### `AdsrEnvelope`

| Property / member | Type, accepted values or signature |
|---|---|
| `attack?` | `number` |
| `decay?` | `number` |
| `sustain?` | `number` |
| `release?` | `number` |

### `VibratoOptions`

| Property / member | Type, accepted values or signature |
|---|---|
| `depth` | `number (Hz)` |
| `rate` | `number (Hz)` |

### `TremoloOptions`

| Property / member | Type, accepted values or signature |
|---|---|
| `depth` | `number (0..1)` |
| `rate` | `number (Hz)` |

### `FilterOptions`

| Property / member | Type, accepted values or signature |
|---|---|
| `type` | `"lowpass" \| "highpass"` |
| `cutoff` | `number (Hz, below Nyquist)` |
| `q?` | `number (0.1..20; default sqrt(1/2))` |

### `SynthLayer`

| Property / member | Type, accepted values or signature |
|---|---|
| `waveform?` | `Waveform` |
| `frequency?` | `number` |
| `frequencyEnd?` | `number` |
| `duration` | `number` |
| `delay?` | `number` |
| `gain?` | `number (0..4)` |
| `detune?` | `number (cents)` |
| `adsr?` | `AdsrEnvelope` |
| `vibrato?` | `VibratoOptions` |
| `tremolo?` | `TremoloOptions` |
| `filter?` | `FilterOptions` |
| `noiseMix?` | `number (0..1)` |
| `partials?` | `Array<[frequencyRatio:number,gain:number]>` |
| `pan?` | `number (-1..1 stereo)` |

### `SynthSoundOptions`

| Property / member | Type, accepted values or signature |
|---|---|
| `layers` | `SynthLayer[]` |
| `sampleRate?` | `number` |
| `channels?` | `1 \| 2` |
| `masterGain?` | `number (0..4)` |
| `duration?` | `number` |
| `limiter?` | `boolean (default true)` |
| `seed?` | `AudioSeed` |

### `SynthLayerOverride`

| Property / member | Type, accepted values or signature |
|---|---|
| `inherits` | `Partial<SynthLayer> except nested ADSR/modulation/filter fields` |
| `adsr?` | `Partial<AdsrEnvelope>` |
| `vibrato?` | `Partial<VibratoOptions>` |
| `tremolo?` | `Partial<TremoloOptions>` |
| `filter?` | `Partial<FilterOptions>` |

### `SynthClipQuality`

| Property / member | Type, accepted values or signature |
|---|---|
| `variants` | `"bright" \| "warm" \| "muffled" \| "lofi" \| "crisp"` |

### `SynthPresetOverrides`

| Property / member | Type, accepted values or signature |
|---|---|
| `inherits` | `Partial<SynthSoundOptions> except layers` |
| `layers?` | `SynthLayerOverride[] (deep by index)` |
| `volume?` | `number` |
| `transpose?` | `number (semitones)` |

### `SynthSequenceEvent`

| Property / member | Type, accepted values or signature |
|---|---|
| `at` | `number` |
| `preset?` | `SynthPresetName` |
| `options?` | `SynthSoundOptions` |
| `gain?` | `number` |

### `SynthSequenceOptions`

| Property / member | Type, accepted values or signature |
|---|---|
| `events` | `SynthSequenceEvent[]` |
| `sampleRate?` | `number` |
| `channels?` | `1 \| 2` |
| `masterGain?` | `number` |
| `tail?` | `number` |
| `seed?` | `AudioSeed` |

### `SynthComposeClip`

| Property / member | Type, accepted values or signature |
|---|---|
| `at?` | `number` |
| `duration?` | `number` |
| `sourceStart?` | `number` |
| `preset?` | `SynthPresetName` |
| `sound?` | `SynthSoundOptions` |
| `wav?` | `Buffer` |
| `buffer?` | `Buffer (alias for wav)` |
| `gain?` | `number` |
| `volume?` | `number (alias for gain)` |
| `transpose?` | `number` |
| `detune?` | `number` |
| `pitch?` | `number` |
| `speed?` | `number` |
| `pan?` | `number` |
| `fadeIn?` | `number` |
| `fadeOut?` | `number` |
| `overrides?` | `SynthPresetOverrides` |
| `noise?` | `number` |
| `filter?` | `FilterOptions` |
| `quality?` | `"bright" \| "warm" \| "muffled" \| "lofi" \| "crisp"` |
| `seed?` | `AudioSeed` |

### `SynthComposeOptions`

| Property / member | Type, accepted values or signature |
|---|---|
| `clips` | `SynthComposeClip[]` |
| `duration?` | `number` |
| `sampleRate?` | `number` |
| `channels?` | `1 \| 2` |
| `masterGain?` | `number` |
| `tail?` | `number` |
| `limiter?` | `boolean` |
| `postHighpassHz?` | `number` |
| `noiseGateThreshold?` | `number` |
| `seed?` | `AudioSeed` |

### `SynthMixInput`

| Property / member | Type, accepted values or signature |
|---|---|
| `variants` | `Buffer \| SynthSoundOptions \| SynthComposeClip \| {preset:SynthPresetName;gain?:number;overrides?:SynthPresetOverrides}` |

### `SynthMixOptions`

| Property / member | Type, accepted values or signature |
|---|---|
| `sampleRate?` | `number` |
| `channels?` | `1 \| 2` |
| `masterGain?` | `number` |
| `seed?` | `AudioSeed` |

### `SynthPresetInfo`

| Property / member | Type, accepted values or signature |
|---|---|
| `name` | `SynthPresetName` |
| `description` | `string` |
| `defaultDuration` | `number` |

### `SynthPresetName`

| Property / member | Type, accepted values or signature |
|---|---|
| `variants` | `laser, laserHeavy, laserCharge, explosion, explosionSmall, explosionDeep, hit, hitSoft, hitMetal, coin, powerup, powerupLong, shield, jump, jumpHigh, alarm, alarmUrgent, beep, beepHigh, click, clickSoft, whoosh, whooshIn, engine, engineIdle, siren, gameOver, gameOverSoft, blip, charge, failure, success, menuSelect, menuBack, footstep, slash, rumble, sparkle, thunder` |

## Execution behavior, defaults and constraints

`SynthComposeClip.speed` changes playback rate and pitch; it is not pitch-preserving time stretching. Procedural clip pitch options affect synthetic sources; raw WAV handling differs. `maxAudioBytes`, duration/sample rate/event/layer bounds protect against oversized synthesis. This system is Node processing, not browser WebAudio playback.

## Example (API-oriented)

```ts
const wav = painter.createAudio.preset('laser');
const layered = painter.createAudio.synth({layers:[{waveform:'sine',frequency:440,duration:0.4,adsr:{attack:0.01,release:0.1}}]});
```

## Source-of-truth files

- [`lib-next/types/audio-synth.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/types/audio-synth.ts)
- [`lib-next/types/painter-facets.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/types/painter-facets.ts)
- [`lib-next/audio-synth/engine.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/audio-synth/engine.ts)
- [`lib-next/audio-synth/synthesizer.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/audio-synth/synthesizer.ts)
- [`lib-next/audio-synth/presets.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/audio-synth/presets.ts)
- [`lib-next/audio-synth/audio-validation.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/audio-synth/audio-validation.ts)
- [`lib-next/audio-synth/compose.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/audio-synth/compose.ts)
- [`lib-next/audio-synth/wav-encode.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/audio-synth/wav-encode.ts)

> Scope: Types reflect the checked repository declarations. Optional properties are marked `?`; an optional property does not imply that every combination is valid. Runtime validation may impose additional constraints. This reference is not a successful-execution certificate for every enumerated option. Planned Phase 15–43 interfaces are not represented as implemented APIs.
