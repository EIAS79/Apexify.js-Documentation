import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { defaultTextNodeProps, measureVisualTextInBrowser } from '../../../lib/studio/visual/text-contract';

test('Studio bold/italic/oblique controls bind to authoritative nested font settings', () => {
  const visual = fs.readFileSync('components/studio/visual/VisualTextInspector.tsx', 'utf8');
  const web = fs.readFileSync('vendor/apexify-web/src/studio-preview.ts', 'utf8');
  assert.match(visual, /font: \{\.\.\.current\.font, weight: selected \? 'normal' : 'bold'\}/);
  assert.match(visual, /font: \{\.\.\.current\.font, style: selected \? 'normal' : kind\}/);
  assert.match(web, /typeof font\.weight === 'number' \|\| typeof font\.weight === 'string'/);
  assert.match(web, /font\.style === 'oblique' \|\| font\.style === 'italic' \|\| font\.style === 'normal'/);
  assert.match(web, /ctx\.font = `\$\{style\} \$\{weight\} \$\{size\}px/);
});

test('Turning off a line decoration masks legacy aliases rather than reviving them', () => {
  const visual = fs.readFileSync('components/studio/visual/VisualTextInspector.tsx', 'utf8');
  assert.match(visual, /onChange\(checked \? \{ color: DEFAULT_FILL, width: 1 \} : false\)/);
  assert.match(visual, /\[decorationKey\]: selected \? false : \{color:/);
  assert.match(visual, /\['underline', 'U', 'Underline'/);
  assert.match(visual, /\['overline', 'O', 'Overline'/);
  assert.match(visual, /\['strike', 'S', 'Strike'/);
});

test('Curve preview bounds rotate by 90 degrees and react to baseline offsets', () => {
  const previous = globalThis.document;
  const ctx = {
    font: '',
    measureText(text: string) {
      return {
        width: Array.from(text).length * 12,
        actualBoundingBoxAscent: 16,
        actualBoundingBoxDescent: 4,
        actualBoundingBoxLeft: 0,
        actualBoundingBoxRight: Array.from(text).length * 12,
      };
    },
  };
  globalThis.document = {
    createElement: () => ({ width: 1, height: 1, getContext: () => ctx }),
  } as unknown as Document;
  try {
    const props = defaultTextNodeProps('CURVE TEST');
    props.font = { size: 25, family: 'Arial', weight: 700, style: 'oblique' };
    props.textOnCurve = { sweepAngle: 110, radius: 100, up: true, layoutMode: 'clamp' };
    const a = measureVisualTextInBrowser(props);
    assert.ok(a);
    const b = measureVisualTextInBrowser({
      ...props, textOnCurve: { ...props.textOnCurve, startAngleDeg: 90 },
    });
    assert.ok(b);
    assert.ok(Math.abs(a.width - b.height) < 1e-6, 'Quarter turn should exchange width and height');
    assert.ok(Math.abs(a.height - b.width) < 1e-6);
    const c = measureVisualTextInBrowser({
      ...props, textOnCurve: { ...props.textOnCurve, baselineOffset: 30 },
    });
    assert.ok(c);
    assert.ok(Math.abs(c.width - a.width) > 1, 'Baseline offset must change the arc envelope');
  } finally {
    globalThis.document = previous;
  }
});
