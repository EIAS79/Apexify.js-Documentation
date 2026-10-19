import { validateDocument, type WorkspaceDocument } from "./model";

/** This program uses only public v6 APIs. The composition literal is the reversible authoring boundary. */
export function generateSource(document: WorkspaceDocument): string {
  return `import { ApexPainter } from 'apexify.js';\nimport { writeFile } from 'node:fs/promises';\nimport { resolve } from 'node:path';\n\n// Edit the composition data, then Apply code to synchronize all views.\nconst composition = ${JSON.stringify(document, null, 2)};\n\nconst painter = new ApexPainter({ type: 'buffer' });\nconst localSource = (source) => source.startsWith('/workspace/assets/')\n  ? resolve('public', source.slice(1)) : source;\nconst imageSource = (source) => source.startsWith('data:')\n  ? Buffer.from(source.slice(source.indexOf(',') + 1), 'base64') : localSource(source);\nconst bg = composition.background;\nconst canvas = await painter.createCanvas({\n  width: composition.width, height: composition.height,\n  ...(bg.mode === 'image' ? { transparentBase: true }\n    : bg.mode === 'gradient' ? { gradientBg: { type: 'linear', endX: composition.width,\n        colors: [{ stop: 0, color: bg.startColor }, { stop: 1, color: bg.endColor }] } }\n    : bg.transparent ? { transparentBase: true } : { colorBg: bg.color }),\n});\nlet output = canvas.buffer;\nif (bg.mode === 'image') output = await painter.createImage({\n  source: imageSource(bg.image), x: 0, y: 0,\n  width: composition.width, height: composition.height, fit: 'cover',\n}, output);\nfor (const layer of composition.layers.filter(layer => layer.visible)) {\n  if (layer.kind === 'text') {\n    output = await painter.createText({\n      text: layer.text, x: layer.x, y: layer.y,\n      font: { family: 'DejaVu Sans', size: layer.fontSize, weight: layer.weight },\n      fill: { color: layer.color, opacity: layer.opacity },\n      placement: { textBaseline: 'top', rotation: layer.rotation },\n    }, output);\n  } else if (layer.kind === 'chart') {\n    const chart = await painter.createChart(layer.chartType,\n      layer.values.map((value, i) => ({ value, label: layer.labels[i], color: layer.colors[i], ...(layer.chartType === 'bar' ? { xStart: i, xEnd: i + 1 } : {}) })),\n      { dimensions: { width: layer.width, height: layer.height } });\n    output = await painter.createImage({ source: chart, x: layer.x, y: layer.y,\n      width: layer.width, height: layer.height, opacity: layer.opacity, rotation: layer.rotation }, output);\n  } else {\n    output = await painter.createImage({\n      source: layer.kind === 'image' ? imageSource(layer.source) : layer.shape,\n      x: layer.x, y: layer.y, width: layer.width, height: layer.height,\n      opacity: layer.opacity, rotation: layer.rotation,\n      ...(layer.kind === 'image' ? { fit: 'cover' } : {\n        shape: { fill: true, color: layer.color }, borderRadius: layer.radius,\n        stroke: { color: layer.strokeColor, width: layer.strokeWidth, borderRadius: layer.radius } }),\n    }, output);\n  }\n}\nawait writeFile('output.png', output);\n`;
}
export function parseSource(source: string): WorkspaceDocument {
  if (source.length > 6_000_000) throw new Error("Source is too large.");
  const startToken = "const composition = ";
  const endToken = ";\n\nconst painter = ";
  const start = source.indexOf(startToken);
  const end = source.indexOf(endToken, start);
  if (start < 0 || end < 0)
    throw new Error(
      "Keep the composition declaration to synchronize with Visual and Graph.",
    );
  const document = validateDocument(
    JSON.parse(source.slice(start + startToken.length, end)),
  );
  if (generateSource(document) !== source)
    throw new Error(
      "Changes outside composition data are preserved in Code. Visual synchronization supports the generated program only. Download custom code to run it in your own Node environment.",
    );
  return document;
}
