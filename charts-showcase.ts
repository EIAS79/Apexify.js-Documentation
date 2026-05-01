/**
 * Renders every chart kind with representative options and legend placement variants.
 *
 * Pie / donut: {@link PieChartOptions} → `legends.standard` or `legends.connected` (not `legend`).
 * Bar / horizontalBar / line: `legend.show` must be true (defaults to false) + `legend.entries` where required.
 *
 * Run: `npx tsx charts-showcase.ts`
 * Output: `output/charts-showcase/*.png`
 */
import fs from "fs";
import path from "path";
import { ApexPainter } from "./lib/index";
import type { BarChartData } from "./lib/Canvas/utils/Charts/barchart";
import type { HorizontalBarChartData } from "./lib/Canvas/utils/Charts/horizontalbarchart";
import type { LegendEntry as AxisLegendEntry } from "./lib/Canvas/utils/Charts/linechart";
import type { PieSlice } from "./lib/Canvas/utils/Charts/piechart";

const painter = new ApexPainter();

const OUT = path.join(process.cwd(), "output", "charts-showcase");

const POSITIONS = ["top", "bottom", "left", "right"] as const;

type LegendPos = (typeof POSITIONS)[number];

/** Shared dark chart chrome — readable ticks + legends on slate backgrounds */
const appearance = {
  backgroundGradient: {
    type: "linear" as const,
    startX: 0,
    startY: 0,
    endX: 900,
    endY: 700,
    colors: [
      { stop: 0, color: "#0f172a" },
      { stop: 0.55, color: "#1e293b" },
      { stop: 1, color: "#020617" },
    ],
  },
  axisColor: "#94a3b8",
  axisWidth: 2,
  arrowSize: 10,
  noiseBg: { intensity: 0.03 },
};

const axisLight = {
  labelColor: "#cbd5e1",
  color: "#94a3b8",
  tickFontSize: 11,
};

function mkdirOut() {
  fs.mkdirSync(OUT, { recursive: true });
}

async function save(name: string, buf: Buffer) {
  const p = path.join(OUT, `${name}.png`);
  fs.writeFileSync(p, buf);
  console.log(`  ${name}.png (${buf.length} bytes)`);
}

function pieLegendsStandard(position: LegendPos) {
  return {
    standard: {
      show: true as const,
      position,
      fontSize: 13,
      textColor: "#e2e8f0",
      backgroundColor: "rgba(15, 23, 42, 0.92)",
      borderColor: "rgba(148, 163, 184, 0.35)",
    },
  };
}

function axisLegend(
  position: LegendPos,
  entries: AxisLegendEntry[],
  extras?: Partial<
    import("./lib/Canvas/utils/Charts/barchart").BarChartOptions["legend"]
  >
) {
  return {
    show: true as const,
    position,
    entries,
    fontSize: 13,
    textColor: "#e2e8f0",
    backgroundColor: "rgba(15, 23, 42, 0.92)",
    borderColor: "rgba(148, 163, 184, 0.35)",
    ...extras,
  };
}

const PIE_SLICES: PieSlice[] = [
  { label: "Edge", value: 34, color: "#38bdf8", stroke: { color: "#0f172a", width: 2 } },
  { label: "Origin", value: 28, color: "#a78bfa", stroke: { color: "#0f172a", width: 2 } },
  { label: "Warm path", value: 22, color: "#fb7185", stroke: { color: "#0f172a", width: 2 } },
  { label: "Cold tail", value: 16, color: "#34d399", stroke: { color: "#0f172a", width: 2 } },
];

const BAR_STANDARD: BarChartData[] = [
  { label: "Jan", value: 42, xStart: 1, xEnd: 2, color: "#38bdf8" },
  { label: "Feb", value: 58, xStart: 2.5, xEnd: 3.5, color: "#a78bfa" },
  { label: "Mar", value: 35, xStart: 4, xEnd: 5, color: "#fb7185" },
  { label: "Apr", value: 71, xStart: 5.5, xEnd: 6.5, color: "#34d399" },
];

const BAR_LEGEND_ENTRIES: AxisLegendEntry[] = BAR_STANDARD.map((b) => ({
  label: b.label,
  color: b.color,
}));

const BAR_GROUPED: BarChartData[] = [
  {
    label: "Q1",
    xStart: 1,
    xEnd: 2,
    values: [
      { value: 22, color: "#38bdf8", label: "Alpha" },
      { value: 18, color: "#a78bfa", label: "Beta" },
    ],
  },
  {
    label: "Q2",
    xStart: 3,
    xEnd: 4,
    values: [
      { value: 30, color: "#38bdf8", label: "Alpha" },
      { value: 25, color: "#a78bfa", label: "Beta" },
    ],
  },
];

const GROUP_LEGEND: AxisLegendEntry[] = [
  { label: "Alpha", color: "#38bdf8" },
  { label: "Beta", color: "#a78bfa" },
];

const BAR_WATERFALL: BarChartData[] = [
  { label: "Opening", value: 120, xStart: 1, xEnd: 2, color: "#64748b" },
  { label: "Growth", value: 35, xStart: 2.5, xEnd: 3.5, color: "#34d399" },
  { label: "Costs", value: -28, xStart: 4, xEnd: 5, color: "#fb7185" },
  { label: "Tax", value: -12, xStart: 5.5, xEnd: 6.5, color: "#f97316" },
];

const WATERFALL_LEGEND: AxisLegendEntry[] = BAR_WATERFALL.map((b) => ({
  label: b.label,
  color: b.color ?? "#94a3b8",
}));

const HB_STANDARD: HorizontalBarChartData[] = [
  { label: "North", value: 82 },
  { label: "South", value: 64 },
  { label: "East", value: 91 },
  { label: "West", value: 73 },
];

const HB_COLORS = ["#38bdf8", "#a78bfa", "#fb7185", "#34d399"] as const;
const HB_LEGEND: AxisLegendEntry[] = HB_STANDARD.map((b, i) => ({
  label: b.label,
  color: HB_COLORS[i],
}));

const HB_GROUPED: HorizontalBarChartData[] = [
  {
    label: "Team A",
    values: [
      { value: 55, color: "#38bdf8", label: "X" },
      { value: 40, color: "#a78bfa", label: "Y" },
    ],
  },
  {
    label: "Team B",
    values: [
      { value: 48, color: "#38bdf8", label: "X" },
      { value: 52, color: "#a78bfa", label: "Y" },
    ],
  },
];

async function pieStandardAllPositions() {
  for (const pos of POSITIONS) {
    const buf = await painter.createChart("pie", PIE_SLICES, {
      type: "pie",
      dimensions: { width: 720, height: 720, padding: { top: 48, right: 48, bottom: 48, left: 48 } },
      appearance,
      labels: {
        title: { text: `Pie · standard legend · ${pos}`, fontSize: 22, color: "#f8fafc" },
        showValues: true,
        showLabels: false,
      },
      legends: pieLegendsStandard(pos),
    });
    await save(`01-pie-standard-legend-${pos}`, buf);
  }
}

async function donutStandardAllPositions() {
  for (const pos of POSITIONS) {
    const buf = await painter.createChart("pie", PIE_SLICES, {
      type: "donut",
      donutInnerRadius: 0.58,
      dimensions: { width: 720, height: 720, padding: { top: 48, right: 48, bottom: 48, left: 48 } },
      appearance,
      labels: {
        title: { text: `Donut · standard legend · ${pos}`, fontSize: 22, color: "#f8fafc" },
        showValues: true,
      },
      legends: pieLegendsStandard(pos),
    });
    await save(`02-donut-standard-legend-${pos}`, buf);
  }
}

async function pieConnected() {
  const buf = await painter.createChart("pie", PIE_SLICES, {
    type: "pie",
    dimensions: { width: 800, height: 800, padding: { top: 52, right: 52, bottom: 52, left: 52 } },
    appearance,
    labels: {
      title: { text: "Pie · connected legend (lines to slices)", fontSize: 22, color: "#f8fafc" },
      showValues: false,
      showLabels: false,
    },
    legends: {
      connected: {
        show: true,
        fontSize: 12,
        textColor: "#e2e8f0",
        backgroundColor: "rgba(15, 23, 42, 0.88)",
        borderColor: "rgba(148, 163, 184, 0.35)",
        lineColor: "#64748b",
        lineWidth: 1.5,
      },
    },
  });
  await save(`03-pie-connected-legend`, buf);
}

async function barStandardPositions() {
  for (const pos of POSITIONS) {
    const buf = await painter.createChart("bar", BAR_STANDARD, {
      type: "standard",
      dimensions: { width: 880, height: 640, padding: { top: 56, right: 56, bottom: 56, left: 72 } },
      appearance,
      axes: {
        x: { ...axisLight, label: "Period", range: { min: 0, max: 8 } },
        y: { ...axisLight, label: "Units", range: { min: 0, max: 85 } },
      },
      labels: {
        title: { text: `Bar standard · legend · ${pos}`, fontSize: 20, color: "#f8fafc" },
      },
      legend: axisLegend(pos, BAR_LEGEND_ENTRIES),
      grid: { show: true, color: "rgba(148, 163, 184, 0.12)", width: 1 },
    });
    await save(`04-bar-standard-legend-${pos}`, buf);
  }
}

async function barVariantsBottomLegend() {
  const dims = {
    width: 880,
    height: 640,
    padding: { top: 56, right: 56, bottom: 56, left: 72 },
  };

  const grouped = await painter.createChart("bar", BAR_GROUPED, {
    type: "grouped",
    dimensions: dims,
    appearance,
    axes: {
      x: { ...axisLight, label: "Quarter", range: { min: 0, max: 8 } },
      y: { ...axisLight, label: "Amount", range: { min: 0, max: 65 } },
    },
    labels: { title: { text: "Bar grouped · legend bottom", fontSize: 20, color: "#f8fafc" } },
    legend: axisLegend("bottom", GROUP_LEGEND),
    bars: { groupSpacing: 6, segmentSpacing: 4 },
  });
  await save(`05-bar-grouped-legend-bottom`, grouped);

  const stacked = await painter.createChart("bar", BAR_GROUPED, {
    type: "stacked",
    dimensions: dims,
    appearance,
    axes: {
      x: { ...axisLight, label: "Quarter", range: { min: 0, max: 8 } },
      y: { ...axisLight, label: "Total", range: { min: 0, max: 70 } },
    },
    labels: { title: { text: "Bar stacked · legend bottom", fontSize: 20, color: "#f8fafc" } },
    legend: axisLegend("bottom", GROUP_LEGEND),
  });
  await save(`06-bar-stacked-legend-bottom`, stacked);

  const waterfall = await painter.createChart("bar", BAR_WATERFALL, {
    type: "waterfall",
    waterfall: { initialValue: 0 },
    dimensions: dims,
    appearance,
    axes: {
      x: { ...axisLight, label: "Step", range: { min: 0, max: 8 } },
      y: { ...axisLight, label: "Balance", range: { min: -20, max: 140 } },
    },
    labels: { title: { text: "Bar waterfall · legend bottom", fontSize: 20, color: "#f8fafc" } },
    legend: axisLegend("bottom", WATERFALL_LEGEND),
  });
  await save(`07-bar-waterfall-legend-bottom`, waterfall);

  const lollipop = await painter.createChart("bar", BAR_STANDARD, {
    type: "lollipop",
    dimensions: dims,
    appearance,
    axes: {
      x: { ...axisLight, label: "Period", range: { min: 0, max: 8 } },
      y: { ...axisLight, label: "Units", range: { min: 0, max: 85 } },
    },
    labels: { title: { text: "Bar lollipop · legend bottom", fontSize: 20, color: "#f8fafc" } },
    legend: axisLegend("bottom", BAR_LEGEND_ENTRIES),
    bars: { lineWidth: 2.5, dotSize: 11 },
  });
  await save(`08-bar-lollipop-legend-bottom`, lollipop);
}

async function horizontalStandardPositions() {
  for (const pos of POSITIONS) {
    const buf = await painter.createChart("horizontalBar", HB_STANDARD, {
      type: "standard",
      dimensions: { width: 880, height: 560, padding: { top: 56, right: 56, bottom: 56, left: 88 } },
      appearance,
      axes: {
        x: { ...axisLight, label: "Score", range: { min: 0, max: 100 } },
        y: { ...axisLight, label: "Region" },
      },
      labels: {
        title: { text: `Horizontal bar · legend · ${pos}`, fontSize: 20, color: "#f8fafc" },
      },
      legend: axisLegend(pos, HB_LEGEND),
      grid: { show: true, color: "rgba(148, 163, 184, 0.1)", width: 1 },
    });
    await save(`09-hbar-standard-legend-${pos}`, buf);
  }
}

async function horizontalVariantsBottom() {
  const dims = {
    width: 880,
    height: 560,
    padding: { top: 56, right: 56, bottom: 56, left: 88 },
  };

  const grouped = await painter.createChart("horizontalBar", HB_GROUPED, {
    type: "grouped",
    dimensions: dims,
    appearance,
    axes: {
      x: { ...axisLight, label: "Value", range: { min: 0, max: 100 } },
      y: { ...axisLight, label: "Team" },
    },
    labels: { title: { text: "H-bar grouped · legend bottom", fontSize: 20, color: "#f8fafc" } },
    legend: axisLegend("bottom", GROUP_LEGEND),
    bars: { groupSpacing: 5 },
  });
  await save(`10-hbar-grouped-legend-bottom`, grouped);

  const stacked = await painter.createChart("horizontalBar", HB_GROUPED, {
    type: "stacked",
    dimensions: dims,
    appearance,
    axes: {
      x: { ...axisLight, label: "Total", range: { min: 0, max: 110 } },
      y: { ...axisLight, label: "Team" },
    },
    labels: { title: { text: "H-bar stacked · legend bottom", fontSize: 20, color: "#f8fafc" } },
    legend: axisLegend("bottom", GROUP_LEGEND),
  });
  await save(`11-hbar-stacked-legend-bottom`, stacked);

  const lollipop = await painter.createChart("horizontalBar", HB_STANDARD, {
    type: "lollipop",
    dimensions: dims,
    appearance,
    axes: {
      x: { ...axisLight, label: "Score", range: { min: 0, max: 100 } },
      y: { ...axisLight, label: "Region" },
    },
    labels: { title: { text: "H-bar lollipop · legend bottom", fontSize: 20, color: "#f8fafc" } },
    legend: axisLegend("bottom", HB_LEGEND),
    bars: { lineWidth: 2.5, dotSize: 10 },
  });
  await save(`12-hbar-lollipop-legend-bottom`, lollipop);
}

async function lineAllPositions() {
  const series = [
    {
      label: "Revenue",
      color: "#38bdf8",
      lineWidth: 3,
      lineStyle: "solid" as const,
      smoothness: "bezier" as const,
      marker: { type: "circle" as const, size: 8, show: true, filled: true },
      area: { type: "below" as const, color: "#38bdf8", opacity: 0.14, show: true },
      data: [
        { x: 1, y: 14 },
        { x: 2, y: 22 },
        { x: 3, y: 19 },
        { x: 4, y: 28 },
        { x: 5, y: 31 },
      ],
    },
    {
      label: "Costs",
      color: "#fb7185",
      lineWidth: 2.5,
      lineStyle: "dashed" as const,
      smoothness: "bezier" as const,
      marker: { type: "square" as const, size: 7, show: true, filled: true },
      data: [
        { x: 1, y: 10 },
        { x: 2, y: 12 },
        { x: 3, y: 15 },
        { x: 4, y: 14 },
        { x: 5, y: 18 },
      ],
    },
    {
      label: "Guide",
      color: "#a78bfa",
      lineWidth: 2,
      lineStyle: "dotted" as const,
      smoothness: "none" as const,
      marker: { type: "diamond" as const, size: 6, show: true },
      correlation: { type: "linear" as const, show: true, color: "#c4b5fd", lineWidth: 1.5, lineStyle: "dashdot" as const },
      data: [
        { x: 1, y: 11 },
        { x: 2, y: 13 },
        { x: 3, y: 16 },
        { x: 4, y: 17 },
        { x: 5, y: 20 },
      ],
    },
  ];

  for (const pos of POSITIONS) {
    const buf = await painter.createChart("line", series, {
      dimensions: { width: 920, height: 640, padding: { top: 56, right: 56, bottom: 64, left: 72 } },
      appearance: {
        ...appearance,
        borderRadius: pos === "bottom" ? 14 : undefined,
        borderWidth: pos === "bottom" ? 2 : undefined,
        borderColor: pos === "bottom" ? "rgba(148, 163, 184, 0.45)" : undefined,
      },
      axes: {
        x: { ...axisLight, label: "Week", range: { min: 0.5, max: 5.5 } },
        y: { ...axisLight, label: "kUSD", range: { min: 0, max: 38 } },
      },
      labels: {
        title: {
          text:
            pos === "bottom"
              ? "Line · areas + markers + regression · framed · legend bottom"
              : `Line · rich series · legend · ${pos}`,
          fontSize: 19,
          color: "#f8fafc",
        },
      },
      legend: {
        show: true,
        position: pos,
        fontSize: 13,
        textColor: "#e2e8f0",
        backgroundColor: "rgba(15, 23, 42, 0.92)",
        borderColor: "rgba(148, 163, 184, 0.35)",
      },
      grid: { show: true, color: "rgba(148, 163, 184, 0.12)", width: 1 },
    });
    await save(`13-line-rich-legend-${pos}`, buf);
  }
}

async function comparisons() {
  const side = await painter.createComparisonChart({
    layout: "sideBySide",
    spacing: 36,
    dimensions: { width: 1680, height: 820, padding: { top: 72, right: 48, bottom: 48, left: 48 } },
    appearance,
    generalTitle: {
      text: "Comparison · side-by-side · pie (standard legend) + bar (legend)",
      fontSize: 22,
      color: "#f8fafc",
    },
    chart1: {
      type: "pie",
      data: PIE_SLICES,
      title: { text: "Share", fontSize: 16, color: "#e2e8f0" },
      options: {
        appearance,
        labels: { title: { text: "", fontSize: 14, color: "#f8fafc" }, showValues: true },
        legends: pieLegendsStandard("bottom"),
      },
    },
    chart2: {
      type: "bar",
      barType: "standard",
      data: BAR_STANDARD,
      title: { text: "Throughput", fontSize: 16, color: "#e2e8f0" },
      options: {
        appearance,
        axes: {
          x: { ...axisLight, label: "Period", range: { min: 0, max: 8 } },
          y: { ...axisLight, label: "Units", range: { min: 0, max: 85 } },
        },
        labels: { title: { text: "", fontSize: 14, color: "#f8fafc" } },
        legend: axisLegend("bottom", BAR_LEGEND_ENTRIES),
      },
    },
  });
  await save(`14-comparison-side-pie-bar`, side);

  const tb = await painter.createComparisonChart({
    layout: "topBottom",
    spacing: 28,
    dimensions: { width: 960, height: 1240, padding: { top: 64, right: 44, bottom: 44, left: 44 } },
    appearance,
    generalTitle: {
      text: "Comparison · top/bottom · line + horizontal bar",
      fontSize: 22,
      color: "#f8fafc",
    },
    chart1: {
      type: "line",
      data: [
        {
          label: "Signal",
          color: "#38bdf8",
          lineWidth: 2.5,
          marker: { type: "circle", size: 7, show: true },
          data: [
            { x: 0, y: 5 },
            { x: 1, y: 12 },
            { x: 2, y: 9 },
            { x: 3, y: 16 },
          ],
        },
        {
          label: "Noise",
          color: "#fb7185",
          lineStyle: "dashed",
          marker: { type: "triangle", size: 7, show: true },
          data: [
            { x: 0, y: 8 },
            { x: 1, y: 7 },
            { x: 2, y: 11 },
            { x: 3, y: 10 },
          ],
        },
      ],
      title: { text: "Series", fontSize: 16, color: "#e2e8f0" },
      options: {
        appearance,
        axes: {
          x: { ...axisLight, label: "t", range: { min: -0.2, max: 3.2 } },
          y: { ...axisLight, label: "Level", range: { min: 0, max: 20 } },
        },
        labels: { title: { text: "", fontSize: 14, color: "#f8fafc" } },
        legend: { show: true, position: "top", fontSize: 12, textColor: "#e2e8f0", backgroundColor: "rgba(15,23,42,0.88)" },
        grid: { show: true, color: "rgba(148,163,184,0.12)", width: 1 },
      },
    },
    chart2: {
      type: "horizontalBar",
      data: HB_STANDARD,
      title: { text: "Regions", fontSize: 16, color: "#e2e8f0" },
      options: {
        type: "standard",
        appearance,
        axes: {
          x: { ...axisLight, label: "Score", range: { min: 0, max: 100 } },
          y: { ...axisLight, label: "Area" },
        },
        labels: { title: { text: "", fontSize: 14, color: "#f8fafc" } },
        legend: axisLegend("right", HB_LEGEND, { fontSize: 12 }),
      },
    },
  });
  await save(`15-comparison-topbottom-line-hbar`, tb);
}

async function main() {
  mkdirOut();
  console.log(`Charts showcase → ${OUT}\n`);

  await pieStandardAllPositions();
  await donutStandardAllPositions();
  await pieConnected();
  await barStandardPositions();
  await barVariantsBottomLegend();
  await horizontalStandardPositions();
  await horizontalVariantsBottom();
  await lineAllPositions();
  await comparisons();

  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
