/**
 * Exercises `createCanvas` background composition: base fill, `bgLayers` (including `presetPattern`),
 * top-level `patternBg`, `noiseBg`, and `transparentBase`.
 *
 * Run: `npx tsx canvas-background-showcase.ts`
 * Output: `output/canvas-background-showcase/*.png` + `results.json`
 */
import fs from "fs";
import path from "path";
import { ApexPainter, type CanvasConfig } from "apexify.js";

const OUT = path.join(process.cwd(), "output", "canvas-background-showcase");

const LINEAR_SLATE = {
  type: "linear" as const,
  startX: 0,
  startY: 0,
  endX: 640,
  endY: 400,
  rotate: 36,
  colors: [
    { stop: 0, color: "#020617" },
    { stop: 0.5, color: "#0f172a" },
    { stop: 1, color: "#1e1b4b" },
  ],
};

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const painter = new ApexPainter();

  console.log(
    "createCanvas background pipeline (inside rounded clip, before shadow/stroke):\n" +
      "  base → bgLayers[] (bottom→top) → patternBg → noiseBg\n" +
      "  • Base = videoBg | customBg | gradientBg | colorBg | transparentBase | default #000\n" +
      "  • bgLayers.pattern = tiled IMAGE; bgLayers.presetPattern = built‑in PatternOptions (dots, crosses, …)\n"
  );

  const results: { file: string; bytes: number; note: string }[] = [];

  const write = async (name: string, note: string, cfg: CanvasConfig) => {
    const { buffer } = await painter.createCanvas(cfg);
    const fp = path.join(OUT, name);
    fs.writeFileSync(fp, buffer);
    results.push({ file: name, bytes: buffer.length, note });
    console.log(`  ${name} (${buffer.length} bytes) — ${note}`);
  };

  await write(
    "01-transparent-base-layer-gradient.png",
    "transparentBase + gradient as first bgLayer (no black flash underneath)",
    {
      width: 640,
      height: 400,
      transparentBase: true,
      bgLayers: [{ type: "gradient", value: LINEAR_SLATE, opacity: 1 }],
    }
  );

  await write(
    "02-layer-preset-dots-multiply.png",
    "gradient layer + presetPattern dots with layer blendMode multiply",
    {
      width: 640,
      height: 400,
      transparentBase: true,
      bgLayers: [
        { type: "gradient", value: LINEAR_SLATE, opacity: 1 },
        {
          type: "presetPattern",
          opacity: 1,
          blendMode: "multiply",
          pattern: {
            type: "dots",
            color: "rgba(148, 163, 184, 0.55)",
            size: 10,
            spacing: 22,
            opacity: 1,
          },
        },
      ],
      noiseBg: { intensity: 0.035 },
    }
  );

  await write(
    "03-gradient-base-layer-grid-plus-top-crosses.png",
    "gradientBg base + bgLayers preset grid (soft-light) + patternBg crosses",
    {
      width: 640,
      height: 400,
      gradientBg: LINEAR_SLATE,
      bgLayers: [
        {
          type: "presetPattern",
          opacity: 0.85,
          blendMode: "soft-light",
          pattern: {
            type: "grid",
            color: "rgba(148, 163, 184, 0.35)",
            secondaryColor: "rgba(71, 85, 105, 0.25)",
            size: 6,
            spacing: 18,
            opacity: 0.9,
          },
        },
      ],
      patternBg: {
        type: "crosses",
        color: "rgba(226, 232, 240, 0.25)",
        secondaryColor: "rgba(148, 163, 184, 0.18)",
        size: 7,
        spacing: 24,
        rotation: 6,
        blendMode: "overlay",
        opacity: 0.65,
      },
      noiseBg: { intensity: 0.02 },
    }
  );

  await write(
    "04-color-base-stripes-preset.png",
    "colorBg + presetPattern stripes (alternating secondaryColor) + light noise",
    {
      width: 640,
      height: 400,
      colorBg: "#0c1222",
      bgLayers: [
        {
          type: "presetPattern",
          opacity: 0.7,
          blendMode: "screen",
          pattern: {
            type: "stripes",
            color: "rgba(99, 102, 241, 0.25)",
            secondaryColor: "rgba(139, 92, 246, 0.2)",
            size: 14,
            spacing: 20,
            opacity: 1,
          },
        },
      ],
      noiseBg: { intensity: 0.04 },
    }
  );

  await write(
    "05-full-chrome-like-index.png",
    "Same idea as repo index demo: gradient + crosses patternBg + noise + stroke + shadow",
    {
      width: 640,
      height: 360,
      gradientBg: {
        type: "linear",
        startX: 0,
        startY: 0,
        endX: 640,
        endY: 360,
        rotate: 48,
        colors: [
          { stop: 0, color: "#020617" },
          { stop: 0.55, color: "#0f172a" },
          { stop: 1, color: "#1e1b4b" },
        ],
      },
      patternBg: {
        type: "crosses",
        color: "rgba(148, 163, 184, 0.42)",
        secondaryColor: "rgba(100, 116, 139, 0.28)",
        size: 8,
        spacing: 26,
        rotation: 8,
        blendMode: "soft-light",
        opacity: 0.72,
      },
      noiseBg: { intensity: 0.038 },
      borderRadius: 14,
      stroke: {
        width: 1,
        color: "rgba(99, 102, 241, 0.35)",
        borderRadius: 14,
      },
      shadow: {
        color: "rgba(0, 0, 0, 0.45)",
        offsetY: 18,
        blur: 40,
        opacity: 0.82,
        borderRadius: 14,
      },
    }
  );

  fs.writeFileSync(
    path.join(OUT, "results.json"),
    JSON.stringify({ generatedAt: new Date().toISOString(), outputs: results }, null, 2),
    "utf8"
  );

  console.log(`\nWrote ${results.length} PNGs + results.json → ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
