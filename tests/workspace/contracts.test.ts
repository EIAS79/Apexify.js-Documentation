import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createHeroDocument,
  newLayer,
  validateDocument,
} from "../../features/apex-workspace/model";
import {
  generateSource,
  parseSource,
} from "../../features/apex-workspace/codegen";
import {
  DEFAULT_DOCK,
  hasVisiblePanel,
} from "../../features/apex-workspace/components/DockLayout";

test("every workspace panel can be removed without retaining an empty split", () => {
  assert.equal(hasVisiblePanel(DEFAULT_DOCK, {}), false);
  for (const panel of [
    "visual",
    "tools",
    "inspector",
    "code",
    "graph",
    "queue",
    "preview",
    "output",
    "terminal",
  ] as const)
    assert.equal(hasVisiblePanel(DEFAULT_DOCK, { [panel]: true }), true);
});
test("generated v6 code round trips without losing layer state", () => {
  const doc = createHeroDocument();
  doc.layers[0].opacity = 0.45;
  doc.layers[0].rotation = 12;
  assert.deepEqual(parseSource(generateSource(doc)), doc);
  const edited = generateSource(doc).replace(
    "Programmatic media for the web",
    "Real code and real output",
  );
  const parsed = parseSource(edited);
  assert.equal(
    parsed.layers[2].kind === "text" && parsed.layers[2].text,
    "Real code and real output",
  );
});
test("arbitrary code is rejected and never executed through synchronization", () => {
  const source = generateSource(createHeroDocument());
  assert.throws(
    () => parseSource(source + "\nprocess.exit();"),
    /outside composition/,
  );
  assert.throws(() =>
    parseSource(
      source.replace("const composition = {", "const composition = (() => {"),
    ),
  );
});
test("remote, filesystem, svg and oversized sources cannot reach rendering", () => {
  for (const image of [
    "https://example.com/image.png",
    "file:///etc/passwd",
    "/etc/passwd",
    "data:image/svg+xml;base64,PHN2Zz4=",
  ]) {
    const doc = createHeroDocument();
    doc.background.image = image;
    assert.throws(() => validateDocument(doc), /Images must/);
  }
  const doc = createHeroDocument();
  doc.width = 100000;
  assert.throws(() => validateDocument(doc), /Canvas width/);
  doc.width = 1280;
  doc.layers = Array.from({ length: 65 }, (_, i) =>
    newLayer("text", String(i)),
  );
  assert.throws(() => validateDocument(doc), /64 layers/);
});
test("duplicate identifiers and invalid rendering values fail before execution", () => {
  const doc = createHeroDocument();
  doc.layers[1].id = doc.layers[0].id;
  assert.throws(() => validateDocument(doc), /unique/);
  const second = createHeroDocument();
  second.layers[0].opacity = Number.NaN;
  assert.throws(() => validateDocument(second), /Opacity/);
  const third = createHeroDocument();
  third.layers[0] = {
    ...third.layers[0],
    kind: "text",
    text: "x",
    fontSize: 40,
    weight: 400,
    color: "url(javascript:)",
  };
  assert.throws(() => validateDocument(third), /Color|color/);
});
test("unknown input properties do not enter the normalized model", () => {
  const doc = {
    ...createHeroDocument(),
    run: "malicious-code",
    secret: "unused",
  };
  assert.equal("run" in validateDocument(doc), false);
  assert.equal("secret" in validateDocument(doc), false);
});
