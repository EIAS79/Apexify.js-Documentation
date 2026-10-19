import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  createHeroDocument,
  newLayer,
} from "../../features/apex-workspace/model";
import { generateSource } from "../../features/apex-workspace/codegen";
const exec = promisify(execFile);
const require = createRequire(import.meta.url);

test("the server renderer and downloaded public-v6 program produce identical pixels", async () => {
  const temp = await mkdtemp(
    join(process.cwd(), "tests/workspace/runtime-proof-"),
  );
  try {
    const fixture = join(temp, "server.cjs");
    await build({
      entryPoints: ["features/apex-workspace/server/render.ts"],
      outfile: fixture,
      platform: "node",
      format: "cjs",
      bundle: true,
      packages: "external",
      plugins: [
        {
          name: "next-server-marker-test-environment",
          setup(b) {
            b.onResolve({ filter: /^server-only$/ }, () => ({
              path: "marker",
              namespace: "server-marker",
            }));
            b.onLoad({ filter: /.*/, namespace: "server-marker" }, () => ({
              contents: "",
            }));
          },
        },
      ],
    });
    const { renderWorkspaceDocument } = require(fixture);
    const doc = createHeroDocument();
    doc.layers[0].opacity = 0.7;
    doc.layers[1].rotation = 8;
    doc.layers[2].visible = false;
    for (const kind of ["bar", "pie"] as const) {
      const chart = newLayer("chart", `chart-${kind}`);
      if (chart.kind === "chart") chart.chartType = kind;
      doc.layers.push(chart);
    }
    const direct = await renderWorkspaceDocument(doc);
    const outputPath = join(temp, "output.png");
    const program = join(temp, "generated.mjs");
    await writeFile(
      program,
      generateSource(doc).replace(
        "writeFile('output.png', output)",
        `writeFile(${JSON.stringify(outputPath)}, output)`,
      ),
    );
    await exec(process.execPath, [program], {
      cwd: process.cwd(),
      timeout: 30000,
    });
    const generated = await readFile(outputPath);
    assert.deepEqual(
      generated,
      direct,
      "Generated source must execute the same supported semantics as the API renderer",
    );
    assert.equal(direct.readUInt32BE(16), doc.width);
    assert.equal(direct.readUInt32BE(20), doc.height);
    const changed = createHeroDocument();
    changed.background.mode = "gradient";
    assert.notDeepEqual(await renderWorkspaceDocument(changed), direct);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});
