import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import { createVisualProject, createVisualNode } from '../../../lib/studio/visual/project';
import { defaultTextNodeProps, textPropsRecord, visualTextProps } from '../../../lib/studio/visual/text-contract';
import { resizeNode, patchNodeTransform, moveNodes } from '../../../lib/studio/visual/editor';
import { lowerVisualProject } from '../../../lib/studio/visual/compiler/plan';
import { fitVisualTextToBox } from '../../../lib/studio/visual/text-box-fit';
import { generateVisualProjectCode } from '../../../lib/studio/visual/codegen/generator';
import { reconcileVisualProjectFromCode } from '../../../lib/studio/visual/codegen/reconcile';
import { validateVisualProject } from '../../../lib/studio/visual/compiler/validate';

function textBoxProject(width = 160, height = 160) {
  const project = createVisualProject({
    id: 'text-resize-demo', name: 'Text responsive box',
    width: 820, height: 520, now: '2026-10-11T06:30:00.000Z',
  });
  const props = defaultTextNodeProps(
    'Preview could not render Invalid Apexify Studio Visual Project: text must fit into its visible blue frame. '
    + 'When the frame becomes wider, words should flow back to previous lines.'
  );
  props.studioFrameFit = true;
  props.font = { size: 48, family: 'Arial' };
  props.layout = {
    maxWidth: 100, maxHeight: 134.39999999999998, lineHeight: 1.21,
    letterSpacing: 20.5, wordSpacing: 14,
  };
  const node = createVisualNode('text', textPropsRecord(props), {id: 'text_box', name: 'Text box'});
  node.transform = {
    x: 55, y: 41, width, height, rotation: 0, opacity: 1,
    visible: true, locked: false, zIndex: 0
  };
  project.document.nodes[node.id] = node;
  project.document.rootNodeIds = [node.id];
  return project;
}

function lowered(project: ReturnType<typeof textBoxProject>) {
  const op = lowerVisualProject(project).operations.find(operation => operation.kind === 'create-text');
  assert.ok(op && op.kind === 'create-text');
  assert.ok(!Array.isArray(op.properties));
  return op.properties;
}

test('Blue selection frame overrides stale maxWidth and maxHeight in emitted createText', () => {
  const p = textBoxProject(320, 170);
  assert.equal(validateVisualProject(p).ok, true);
  const props = lowered(p);
  assert.equal(props.layout?.maxWidth, 320);
  assert.equal(props.layout?.maxHeight, 170);
  assert.equal(props.font?.size, 48, 'Wrap width must not change user-selected font size');
  assert.ok((props.y ?? 0) >= 41, 'First baseline must remain inside box top');
  assert.ok((props.x ?? 0) >= 55 && (props.x ?? 0) <= 375, 'Text anchor must remain inside box horizontally');
  assert.equal('studioFrameFit' in props, false, 'Editor-only field leaked into createText API');
  const fit = fitVisualTextToBox(visualTextProps(p.document.nodes.text_box), 320, 170);
  assert.equal(fit.scale, 1);
  assert.equal(fit.fontSize, 48);
  assert.equal(fit.letterSpacing, 20.5);
  assert.ok(!fit.fullyFits, 'Overflow should be reported rather than shrinking text');
  assert.ok(fit.contentHeight > 170);
});

test('Resizing the blue box changes wrap width and height without resizing glyphs', () => {
  const before = textBoxProject(160, 160);
  const first = lowered(before);
  const enlarged = resizeNode(before, 'text_box', 'e', 320, 0);
  assert.equal(enlarged.document.nodes.text_box.transform?.width, 480);
  const text = visualTextProps(enlarged.document.nodes.text_box);
  assert.equal(text.layout?.maxWidth, 480);
  assert.equal(text.layout?.maxHeight, 160);
  const second = lowered(enlarged);
  assert.equal(second.layout?.maxWidth, 480);
  assert.equal(second.layout?.maxHeight, 160);
  assert.equal(first.font?.size, 48);
  assert.equal(second.font?.size, 48);
  assert.equal(second.layout?.letterSpacing, 20.5);
  const originalMetrics = fitVisualTextToBox(visualTextProps(before.document.nodes.text_box),160,160);
  const widerMetrics = fitVisualTextToBox(text,480,160);
  assert.ok(widerMetrics.lineCount <= originalMetrics.lineCount, 'Wider box should reduce wrapping');
  const thin = resizeNode(enlarged, 'text_box', 's', 0, -85);
  assert.equal(thin.document.nodes.text_box.transform?.height, 75);
  assert.equal(visualTextProps(thin.document.nodes.text_box).layout?.maxHeight, 75);
  const third = lowered(thin);
  assert.equal(third.layout?.maxHeight, 75);
  assert.equal(third.font?.size, 48, 'Reducing height must not override the user font size');
  assert.equal(third.layout?.lineHeight, 1.21);
  const fitted = fitVisualTextToBox(visualTextProps(thin.document.nodes.text_box),480,75);
  assert.equal(fitted.fontSize, 48);
  assert.equal(fitted.scale, 1);
  assert.ok(!fitted.fullyFits, 'Height overflow should remain explicit');
  assert.ok(fitted.contentHeight > 75);
});

test('Numeric text-box properties update the same transform used by pointer handles', () => {
  const project=textBoxProject(160,160);
  const updated=patchNodeTransform(project,'text_box',{width:377.55,height:134.39999999999998});
  const t=visualTextProps(updated.document.nodes.text_box);
  assert.equal(t.studioFrameFit, true);
  assert.equal(t.layout?.maxWidth,377.55);
  assert.equal(t.layout?.maxHeight,134.39999999999998);
  assert.equal(lowered(updated).layout?.maxWidth,377.55);
  assert.equal(lowered(updated).layout?.maxHeight,134.39999999999998);
});

test('Imported raw createText layers are not rewritten by WYSIWYG frame fitting', () => {
  const p=textBoxProject(160,65);
  p.document.nodes.text_box.props=textPropsRecord({
    ...visualTextProps(p.document.nodes.text_box),studioFrameFit:undefined
  });
  const generated=lowered(p);
  assert.equal(generated.font?.size,48);
  assert.equal(generated.layout?.maxWidth,160);
  assert.equal(generated.layout?.maxHeight,134.39999999999998);
  assert.equal(generated.y,41);
});

test('Visual text box uses one set of authoritative dimension inputs in inspector',()=>{
 const source=fs.readFileSync('components/studio/visual/VisualTextInspector.tsx','utf8');
 const frame=source.slice(source.indexOf('if (tab === \'transform\')'),source.indexOf('if (tab === \'style\')'));
 const layout=source.slice(source.indexOf('title="Layout"'),source.indexOf('title="Stroke"'));
 assert.doesNotMatch(frame, /title="Wrapping box"/);
 assert.match(layout,/value=\{width\}/);
 assert.match(layout,/value=\{height\}/);
 assert.match(layout,/onTransform\('Text box width'/);
 assert.match(layout,/onTransform\('Text box height'/);
 assert.match(layout,/data-text-box-fit-status/);
 assert.match(layout,/data-text-overflow/);
 assert.match(layout,/data-text-expand-height/);
 assert.doesNotMatch(layout,/Auto-fit/);
 assert.match(source,/Math.round\(num \* 100\) \/ 100/);
});

test('Fitted blue-box text remains stable after Visual -> Code -> Visual sync',()=>{
 const project=textBoxProject(320,170);
 const source=generateVisualProjectCode(project).source;
 const reconciled=reconcileVisualProjectFromCode(project,source);
 assert.equal(reconciled.ok,true,reconciled.ok?'':reconciled.error);
 if(!reconciled.ok)return;
 assert.equal(generateVisualProjectCode(reconciled.project).source,source);
 const before=visualTextProps(project.document.nodes.text_box);
 const restored=visualTextProps(reconciled.project.document.nodes.text_box);
 assert.equal(restored.studioFrameFit,true,'Visual frame fit metadata lost during Code sync');
 assert.equal(restored.font?.size,before.font?.size,'Preferred font size lost during Code sync');
 assert.equal(restored.layout?.letterSpacing,before.layout?.letterSpacing,'Preferred letter spacing lost during Code sync');
 assert.equal(restored.layout?.wordSpacing,before.layout?.wordSpacing,'Preferred word spacing lost during Code sync');
 assert.deepEqual(reconciled.project.document.nodes.text_box.transform,project.document.nodes.text_box.transform);
 const wider=resizeNode(reconciled.project,'text_box','e',280,0);
 assert.equal(lowered(wider).font?.size, 48, 'Code sync must preserve the user font size');
});

test('Explicit font size remains authoritative at every wrap width and after height resize',()=>{
  const p=textBoxProject(200,130);
  for(const width of [80,200,400,740]){
    const q=patchNodeTransform(p,'text_box',{width});
    const properties=lowered(q);
    assert.equal(properties.font?.size,48);
    assert.equal(properties.layout?.letterSpacing,20.5);
    assert.equal(properties.layout?.wordSpacing,14);
    assert.equal(properties.layout?.maxWidth,width);
    const props=visualTextProps(q.document.nodes.text_box);
    assert.equal(fitVisualTextToBox(props,width,130).fontSize,48);
  }
  const text=visualTextProps(p.document.nodes.text_box);
  p.document.nodes.text_box.props=textPropsRecord({...text,font:{...text.font,size:102.1}});
  assert.equal(lowered(p).font?.size,102.1,'Changing Font Size must change emitted createText font size');
  assert.equal(lowered(p).layout?.maxWidth,200,'Changing Font Size must not affect wrap width');
  assert.equal(fitVisualTextToBox(visualTextProps(p.document.nodes.text_box),200,130).fontSize,102.1);
});

test('Text rectangles can intentionally extend beyond the canvas',()=>{
  const p=textBoxProject(160,160);
  const nearEdge=patchNodeTransform(p,'text_box',{x:9999,y:-900,width:1200,height:800});
  const rect=nearEdge.document.nodes.text_box.transform!;
  assert.equal(rect.width,1200);
  assert.equal(rect.height,800);
  assert.equal(rect.x,9999);
  assert.equal(rect.y,-900);
  assert.equal(visualTextProps(nearEdge.document.nodes.text_box).layout?.maxWidth,1200);
  const moved=moveNodes(p,['text_box'],1200,-600);
  const movedRect=moved.document.nodes.text_box.transform!;
  assert.equal(movedRect.x,55+1200);
  assert.equal(movedRect.y,41-600);
  const expanded=resizeNode(p,'text_box','e',2000,0);
  assert.equal(expanded.document.nodes.text_box.transform?.width,2160);
  assert.equal(expanded.document.nodes.text_box.transform?.x,55);
  const outside=patchNodeTransform(p,'text_box',{y:-30,x:-55});
  assert.equal(outside.document.nodes.text_box.transform?.x,-55);
  assert.equal(outside.document.nodes.text_box.transform?.y,-30);
});

test('Font size, floating text selection outline and overflow remain independent',()=>{
  const shell=fs.readFileSync('components/studio/visual/VisualStudioPre4.tsx','utf8');
  const compiler=fs.readFileSync('lib/studio/visual/compiler/plan.ts','utf8');
  const editor=fs.readFileSync('lib/studio/visual/editor/index.ts','utf8');
  assert.doesNotMatch(shell,/const outOfCanvas =/);
  assert.doesNotMatch(shell,/Math\.min\(Math\.max\(0, point\?\.x/);
  assert.doesNotMatch(editor,/canvasWidth - transform\.width/);
  assert.match(shell,/isSelected && node\.kind === 'text'/);
  assert.match(shell,/100_000/);
  assert.match(shell,/: node\.transform\?\.zIndex \?\? 0/);
  assert.doesNotMatch(compiler,/fit\.scale\s*<\s*1/);
  assert.doesNotMatch(compiler,/font:\s*\{\s*\.\.\.props\.font,\s*size:\s*fit\.fontSize/);
});
