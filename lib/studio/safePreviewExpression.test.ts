import assert from 'node:assert/strict';
import test from 'node:test';
import { createSafePreviewResolver, isUnresolvedPreviewValue } from './safePreviewExpression';
import { PRESENTATION_SLIDE_TS } from './fixtures/presentationSlideSource';

function asRecord(value: unknown): Record<string, unknown> {
  assert.ok(value && typeof value === 'object' && !Array.isArray(value));
  return value as Record<string, unknown>;
}

test('Live Canvas resolves helper-returned createCanvas options used by the presentation example', () => {
  const resolver = createSafePreviewResolver(PRESENTATION_SLIDE_TS);
  const canvas = asRecord(resolver.resolve('slideCanvas()'));

  assert.equal(canvas.width, 1920);
  assert.equal(canvas.height, 1080);
  const gradient = asRecord(canvas.gradientBg);
  assert.equal(gradient.type, 'linear');
  const colors = gradient.colors;
  assert.ok(Array.isArray(colors));
  assert.equal(asRecord(colors[0]).color, '#030712');
  assert.equal(asRecord(colors[3]).color, '#172554');
});

test('Live Canvas resolves helper-returned shape arrays and shorthand objects', () => {
  const resolver = createSafePreviewResolver(PRESENTATION_SLIDE_TS);
  const shapes = resolver.resolve('panelShapes()');
  assert.ok(Array.isArray(shapes));
  assert.equal(shapes.length, 4);
  const titlePanel = asRecord(shapes[1]);
  assert.equal(titlePanel.source, 'rectangle');
  assert.equal(titlePanel.x, 56);
  assert.equal(titlePanel.width, 760);
  const stroke = asRecord(titlePanel.stroke);
  assert.equal(stroke.borderRadius, 16);
});

test('Live Canvas resolves composed text helpers with transforms, loops and Math', () => {
  const resolver = createSafePreviewResolver(PRESENTATION_SLIDE_TS);
  const texts = resolver.resolve('slideTexts()');
  assert.ok(Array.isArray(texts));
  assert.ok(texts.length >= 10);
  const headline = asRecord(texts[1]);
  assert.equal(headline.text, 'Quarterly momentum');
  assert.equal(asRecord(headline.font).size, 40);
  const body = asRecord(texts[5]);
  assert.match(String(body.text), /Engagement index rises month-on-month/);
  assert.equal(typeof body.y, 'number');
});

test('runtime-only buffer references stay unresolved instead of throwing', () => {
  const resolver = createSafePreviewResolver(PRESENTATION_SLIDE_TS);
  const layer = asRecord(resolver.resolve('({ source: chartBuf, x: CHART_X, y: CHART_Y, width: CHART_W, height: CHART_H })'));
  assert.equal(isUnresolvedPreviewValue(layer.source), true);
  assert.equal(layer.x, 844);
  assert.equal(layer.y, 88);
  assert.equal(layer.width, 1028);
  assert.equal(layer.height, 880);
});


test('Live Canvas resolves local constants and arrays at each painter call site', () => {
  const source = `
async function main() {
  const W = 960;
  const H = 540;
  const shapes = [
    { source: 'rectangle', x: 72, y: 96, width: W / 2, height: H - 240 },
    { source: 'star', x: W - 260, y: H - 240, width: 200, height: 200 },
  ];

  let buf = await painter.createImage(shapes, buffer);
  buf = await painter.createText(
    [{ text: 'Scoped', x: W / 2, y: H - 36, textAlign: 'center' }],
    buf
  );
  return buf;
}
`;

  const resolver = createSafePreviewResolver(source);
  const imageCall = source.indexOf('.createImage');
  const textCall = source.indexOf('.createText');

  const shapes = resolver.resolveAt('shapes', imageCall);
  assert.ok(Array.isArray(shapes));
  assert.equal(shapes.length, 2);
  assert.equal(asRecord(shapes[0]).width, 480);
  assert.equal(asRecord(shapes[0]).height, 300);
  assert.equal(asRecord(shapes[1]).x, 700);
  assert.equal(asRecord(shapes[1]).y, 300);

  const text = resolver.resolveAt(
    "[{ text: 'Scoped', x: W / 2, y: H - 36, textAlign: 'center' }]",
    textCall,
  );
  assert.ok(Array.isArray(text));
  assert.equal(asRecord(text[0]).x, 480);
  assert.equal(asRecord(text[0]).y, 504);
  assert.equal(asRecord(text[0]).textAlign, 'center');
  assert.deepEqual(resolver.unresolved(), []);
});
