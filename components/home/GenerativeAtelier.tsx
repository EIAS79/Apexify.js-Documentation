'use client';

import { useId, useState, type CSSProperties } from 'react';

const palettes = [
  { name: 'Citron', colors: ['#d8ff62', '#77d5ba', '#727aff'] },
  { name: 'Ember', colors: ['#ffcb83', '#ff785d', '#dd73bf'] },
  { name: 'Glacier', colors: ['#c7f1ff', '#6aa6ff', '#ad8aff'] },
];

/** Decorative SVG study, deliberately independent of the Apexify runtime. */
export default function GenerativeAtelier() {
  const id = useId().replace(/:/g, '');
  const [palette, setPalette] = useState(0);
  const [form, setForm] = useState(0);
  const [density, setDensity] = useState(36);
  const [playing, setPlaying] = useState(false);
  const colors = palettes[palette].colors;

  return (
    <div className="atelier" data-playing={playing} style={{ '--art-accent': colors[0] } as CSSProperties}>
      <div className="atelier__bar"><span><i /> THE POSSIBILITY ENGINE</span><span>STUDY {String(form + 1).padStart(2, '0')}</span></div>
      <div className="atelier__stage">
        <span className="atelier__coordinate atelier__coordinate--top">FIG. 001 / GENERATIVE FORM</span>
        <svg className="atelier__sculpture" viewBox="0 0 600 540" role="img" aria-label={`${palettes[palette].name} ${['orbital', 'ribbon', 'wave'][form]} line sculpture with ${density} contours`}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
              {colors.map((color, i) => <stop key={color} offset={`${i * 50}%`} stopColor={color} />)}
            </linearGradient>
          </defs>
          <g className="atelier__form" fill="none" stroke={`url(#${id})`} strokeWidth="1.15">
            {Array.from({ length: density }, (_, i) => {
              const t = i / (density - 1);
              if (form === 1) return <path key={i} d={`M ${85 + t * 125} ${110 + t * 295} C ${510 - t * 200} ${-80 + t * 310}, ${50 + t * 440} ${590 - t * 200}, ${490 - t * 95} ${120 + t * 300}`} />;
              if (form === 2) return <path key={i} d={`M 55 ${150 + t * 250} C 200 ${450 - t * 340}, 320 ${-110 + t * 600}, 545 ${160 + t * 220}`} />;
              return <ellipse key={i} cx="300" cy="270" rx={85 + t * 130} ry={208 - t * 90} transform={`rotate(${t * 165 - 65} 300 270)`} />;
            })}
          </g>
        </svg>
        <div className="atelier__signature" aria-hidden><span>Ideas take</span><em>shape.</em></div>
        <span className="atelier__coordinate atelier__coordinate--bottom">CODE IS A CREATIVE MEDIUM.</span>
        <button className="atelier__play" type="button" aria-pressed={playing} onClick={() => setPlaying(value => !value)}>{playing ? 'Ⅱ Pause motion' : '▷ Play motion'}</button>
      </div>
      <div className="atelier__controls">
        <fieldset><legend>01 / PALETTE</legend><div className="atelier__swatches">{palettes.map((p, i) => <button key={p.name} type="button" aria-label={`${p.name} palette`} aria-pressed={palette === i} onClick={() => setPalette(i)} style={{ '--swatch': p.colors[0] } as CSSProperties}><span />{p.name}</button>)}</div></fieldset>
        <label className="atelier__density"><span>02 / DENSITY <output>{density}</output></span><input aria-label="Contour density" type="range" min="12" max="60" value={density} onChange={e => setDensity(Number(e.target.value))} /></label>
        <button className="atelier__remix" type="button" onClick={() => setForm(value => (value + 1) % 3)}>Remix <span aria-hidden>↗</span></button>
      </div>
      <p className="atelier__note">Interactive SVG art study · explore real engine output in the Gallery.</p>
    </div>
  );
}
